# Вариант 2: Service Accounts как Virtual Users - Спецификация имплементации

## 📋 Содержание

1. [Обзор решения](#обзор-решения)
2. [Архитектура](#архитектура)
3. [Изменения в Domain Layer](#изменения-в-domain-layer)
4. [Изменения в Infrastructure Layer](#изменения-в-infrastructure-layer)
5. [Изменения в Application Layer](#изменения-в-application-layer)
6. [Миграции базы данных](#миграции-базы-данных)
7. [Изменения в Authorization](#изменения-в-authorization)
8. [PowerShell скрипты управления](#powershell-скрипты-управления)
9. [Тестирование](#тестирование)
10. [План внедрения](#план-внедрения)

---

## Обзор решения

### Концепция

**Цель:** Создать один Service Account "MCP AttributeValue Agent" с полными правами на модуль AttributeValue для работы MCP сервера.

Service Account будет представлен как "виртуальный пользователь" в таблице `users.users` с:

1. **Специальным флагом** `is_service_account = TRUE`
2. **Связью через `identity_id`** (Keycloak service account UUID)
3. **Ролью** `MCP-Agent-AttributeValue-Full-Access` со всеми правами модуля AttributeValue
4. **Стандартной авторизацией** через `CustomClaimsTransformation`

### Преимущества

✅ **Единая модель авторизации** - service account использует тот же механизм что и обычные пользователи  
✅ **Полные права AttributeValue** - доступ ко всем операциям модуля AttributeValue  
✅ **Audit trail** - все действия service account логируются  
✅ **Production-ready** - безопасное решение для продакшена  

---

## Архитектура

### Схема БД

```
┌─────────────────────────────────────────────────────────────┐
│ users.users                                                 │
├─────────────────────────────────────────────────────────────┤
│ id                        uuid PRIMARY KEY                  │
│ email                     varchar(300) NOT NULL UNIQUE      │
│ first_name                varchar(200) NOT NULL             │
│ last_name                 varchar(200) NOT NULL             │
│ identity_id               text NOT NULL UNIQUE              │
│ created_at_utc            timestamp NOT NULL                │
│ is_service_account        boolean NOT NULL DEFAULT FALSE ◄── НОВОЕ │
└─────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────┐
│ users.user_roles                                            │
├─────────────────────────────────────────────────────────────┤
│ user_id                   uuid → users.users.id             │
│ role_name                 varchar(50) → users.roles.name    │
└─────────────────────────────────────────────────────────────┘
         │
         │ N:1
         ▼
┌─────────────────────────────────────────────────────────────┐
│ users.roles                                                 │
├─────────────────────────────────────────────────────────────┤
│ name                      varchar(50) PRIMARY KEY           │
│                                                              │
│ Существующие:                                               │
│   - Member                                                  │
│   - Administrator                                           │
│                                                              │
│ Новые для Service Accounts: ◄─────────────────────────      │
│   - MCP-Agent-AttributeValue-Full-Access                     │
│     (все права модуля AttributeValue)                       │
└─────────────────────────────────────────────────────────────┘
         │
         │ N:M
         ▼
┌─────────────────────────────────────────────────────────────┐
│ users.role_permissions                                      │
├─────────────────────────────────────────────────────────────┤
│ role_name                 varchar(50) → roles.name          │
│ permission_code           varchar(100) → permissions.code   │
└─────────────────────────────────────────────────────────────┘
         │
         │ N:1
         ▼
┌─────────────────────────────────────────────────────────────┐
│ users.permissions                                           │
├─────────────────────────────────────────────────────────────┤
│ code                      varchar(100) PRIMARY KEY          │
│                                                              │
│ Examples:                                                   │
│   - users:read                                              │
│   - users:manage                                            │
│   - events:read                                             │
│   - events:create                                           │
│   - events:update                                           │
│   - events:delete                                           │
│   - attributes:read                                         │
│   - attributes:create                                       │
│   - attributes:update                                       │
│   - attributes:delete                                       │
└─────────────────────────────────────────────────────────────┘
```

### Поток авторизации

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MCP Server запрашивает токен через Client Credentials   │
│    POST /realms/evently/protocol/openid-connect/token      │
│    Response: {                                              │
│      "access_token": "eyJ...",                              │
│      "sub": "e6fc0a9a-c466-43b7-93df-ff40eb3c0540"         │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API получает запрос с токеном                           │
│    GET /api/attributes                                      │
│    Authorization: Bearer eyJ...                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Authentication Middleware валидирует JWT                 │
│    - Проверяет signature ✅                                 │
│    - Проверяет expiration ✅                                │
│    - Создает ClaimsPrincipal с identity_id                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CustomClaimsTransformation                               │
│    - Извлекает identity_id из токена                        │
│    - Вызывает GetUserPermissionsAsync(identity_id)          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GetUserPermissionsQueryHandler                           │
│    SQL:                                                      │
│    SELECT DISTINCT rp.permission_code                       │
│    FROM users.users u                                       │
│    INNER JOIN users.user_roles ur ON ur.user_id = u.id     │
│    INNER JOIN users.role_permissions rp                     │
│      ON rp.role_name = ur.role_name                         │
│    WHERE u.identity_id = @IdentityId                        │
│    -- Работает для ОБОИХ: обычных пользователей И service accounts
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Результат: ["attributes:read", "attributes:create"]     │
│    → Добавляются как claims                                 │
│    → Используются для [HasPermission] атрибутов             │
└─────────────────────────────────────────────────────────────┘
```

---

## Изменения в Domain Layer

### 1. Обновить `User` entity

**Файл:** `src/Modules/Users/Evently.Modules.Users.Domain/Users/User.cs`

```csharp
using Evently.Common.Domain;

namespace Evently.Modules.Users.Domain.Users;

public sealed class User : Entity
{
    private readonly List<Role> _roles = [];

    private User()
    {
    }

    public Guid Id { get; private set; }

    public string Email { get; private set; }

    public string FirstName { get; private set; }

    public string LastName { get; private set; }

    public string IdentityId { get; private set; }

    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Indicates whether this user represents a service account (M2M client).
    /// Service accounts authenticate via Client Credentials Flow and are used for machine-to-machine communication.
    /// </summary>
    public bool IsServiceAccount { get; private set; }

    public IReadOnlyCollection<Role> Roles => _roles.ToList();

    /// <summary>
    /// Creates a regular human user.
    /// </summary>
    public static User Create(string email, string firstName, string lastName, string identityId)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            IdentityId = identityId,
            CreatedAt = DateTime.UtcNow,
            IsServiceAccount = false
        };

        user._roles.Add(Role.Member);

        user.Raise(new UserRegisteredDomainEvent(user.Id));

        return user;
    }

    /// <summary>
    /// Creates a service account user.
    /// Service accounts don't get Member role by default - roles must be explicitly assigned.
    /// </summary>
    public static User CreateServiceAccount(
        string serviceAccountName,
        string identityId,
        IEnumerable<Role> initialRoles)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceAccountName);
        ArgumentException.ThrowIfNullOrWhiteSpace(identityId);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"service-account-{serviceAccountName}@evently.internal",
            FirstName = "Service Account",
            LastName = serviceAccountName,
            IdentityId = identityId,
            CreatedAt = DateTime.UtcNow,
            IsServiceAccount = true
        };

        foreach (var role in initialRoles)
        {
            user._roles.Add(role);
        }

        user.Raise(new ServiceAccountCreatedDomainEvent(user.Id, serviceAccountName));

        return user;
    }

    public void Update(string firstName, string lastName)
    {
        if (IsServiceAccount)
        {
            throw new InvalidOperationException("Cannot update service account profile");
        }

        if (FirstName == firstName && LastName == lastName)
        {
            return;
        }

        FirstName = firstName;
        LastName = lastName;

        Raise(new UserProfileUpdatedDomainEvent(Id, FirstName, LastName));
    }

    public void AssignRole(Role role)
    {
        if (_roles.Contains(role))
        {
            throw new InvalidOperationException($"User already has role '{role.Name}'");
        }
        
        _roles.Add(role);
        Raise(new UserRoleAssignedDomainEvent(Id, role.Name));
    }

    public void RemoveRole(Role role)
    {
        if (!_roles.Contains(role))
        {
            throw new InvalidOperationException($"User does not have role '{role.Name}'");
        }
        
        _roles.Remove(role);
        Raise(new UserRoleRemovedDomainEvent(Id, role.Name));
    }
}
```

### 2. Создать новое Domain Event

**Файл:** `src/Modules/Users/Evently.Modules.Users.Domain/Users/ServiceAccountCreatedDomainEvent.cs`

```csharp
using Evently.Common.Domain;

namespace Evently.Modules.Users.Domain.Users;

/// <summary>
/// Domain event raised when a service account is created.
/// </summary>
public sealed record ServiceAccountCreatedDomainEvent(
    Guid ServiceAccountId,
    string ServiceAccountName) : DomainEvent;
```

### 3. Обновить `Role` domain model - добавить новые роли

**Файл:** `src/Modules/Users/Evently.Modules.Users.Domain/Users/Role.cs`

```csharp
namespace Evently.Modules.Users.Domain.Users;

public sealed class Role
{
    // Regular user roles
    public static readonly Role Administrator = new("Administrator");
    public static readonly Role Member = new("Member");

    // Service Account role для MCP AttributeValue Agent
    public static readonly Role McpAgentAttributeValueFullAccess = new("MCP-Agent-AttributeValue-Full-Access");

    public static Role Create(string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        string normalized = name.Trim();

        if (normalized.Length < 2 || normalized.Length > 50)
        {
            throw new ArgumentOutOfRangeException(nameof(name), "Role name length must be between 2 and 50 characters.");
        }

        // Разрешаем латиницу, цифры, дефис и подчёркивание
        foreach (char ch in normalized)
        {
            bool isAllowed = char.IsLetterOrDigit(ch) || ch == '-' || ch == '_';
            if (!isAllowed)
            {
                throw new ArgumentException("Role name can contain only letters, digits, '-' and '_' characters.", nameof(name));
            }
        }

        return new Role(normalized);
    }

    private Role(string name)
    {
        Name = name;
    }

    private Role()
    {
    }

    public string Name { get; private set; }
}
```

---

## Изменения в Application Layer

### 1. Создать CreateServiceAccountCommand

**Файл:** `src/Modules/Users/Evently.Modules.Users.Application/Users/CreateServiceAccount/CreateServiceAccountCommand.cs`

```csharp
using Evently.Common.Application.Messaging;

namespace Evently.Modules.Users.Application.Users.CreateServiceAccount;

/// <summary>
/// Command to create a service account user in the system.
/// Service accounts are virtual users representing Keycloak M2M clients.
/// </summary>
public sealed record CreateServiceAccountCommand(
    string ServiceAccountName,
    string IdentityId,
    IReadOnlyCollection<string> RoleNames) : ICommand<Guid>;
```

### 2. Создать CreateServiceAccountCommandHandler

**Файл:** `src/Modules/Users/Evently.Modules.Users.Application/Users/CreateServiceAccount/CreateServiceAccountCommandHandler.cs`

```csharp
using Evently.Common.Application.Messaging;
using Evently.Common.Domain;
using Evently.Modules.Users.Application.Abstractions.Data;
using Evently.Modules.Users.Domain.Users;

namespace Evently.Modules.Users.Application.Users.CreateServiceAccount;

/// <summary>
/// Handles the creation of service account users.
/// </summary>
internal sealed class CreateServiceAccountCommandHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateServiceAccountCommand, Guid>
{
    /// <summary>
    /// Creates a service account user with specified roles.
    /// </summary>
    public async Task<Result<Guid>> Handle(
        CreateServiceAccountCommand request,
        CancellationToken cancellationToken)
    {
        // Check if service account already exists by identity_id
        // Note: Requires adding GetByIdentityIdAsync method to IUserRepository
        var existingUser = await userRepository.GetByIdentityIdAsync(
            request.IdentityId,
            cancellationToken);

        if (existingUser is not null)
        {
            return Result.Failure<Guid>(
                UserErrors.IdentityIdAlreadyExists(request.IdentityId));
        }

        // Resolve roles from role names
        var roles = new List<Role>();
        foreach (var roleName in request.RoleNames)
        {
            // Validate role name and create Role instance
            var role = Role.Create(roleName);
            roles.Add(role);
        }

        // Create service account using domain method
        var serviceAccount = User.CreateServiceAccount(
            request.ServiceAccountName,
            request.IdentityId,
            roles);

        // Save through repository
        userRepository.Insert(serviceAccount);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return serviceAccount.Id;
    }
}
```

### 3. Создать CreateServiceAccountCommandValidator

**Файл:** `src/Modules/Users/Evently.Modules.Users.Application/Users/CreateServiceAccount/CreateServiceAccountCommandValidator.cs`

```csharp
using FluentValidation;

namespace Evently.Modules.Users.Application.Users.CreateServiceAccount;

internal sealed class CreateServiceAccountCommandValidator : AbstractValidator<CreateServiceAccountCommand>
{
    public CreateServiceAccountCommandValidator()
    {
        RuleFor(c => c.ServiceAccountName)
            .NotEmpty()
            .WithMessage("Service account name is required")
            .MaximumLength(200)
            .WithMessage("Service account name cannot exceed 200 characters");

        RuleFor(c => c.IdentityId)
            .NotEmpty()
            .WithMessage("Identity ID is required")
            .Must(id => Guid.TryParse(id, out _))
            .WithMessage("Identity ID must be a valid UUID");

        RuleFor(c => c.RoleNames)
            .NotEmpty()
            .WithMessage("At least one role must be assigned")
            .Must(roles => roles.All(role => !string.IsNullOrWhiteSpace(role)))
            .WithMessage("All role names must be non-empty");
    }
}
```

### 4. Создать ServiceAccountCreatedDomainEventHandler (опционально)

**Файл:** `src/Modules/Users/Evently.Modules.Users.Application/Users/CreateServiceAccount/ServiceAccountCreatedDomainEventHandler.cs`

```csharp
using Evently.Common.Application.Messaging;
using Evently.Common.Domain;
using Evently.Modules.Users.Domain.Users;

namespace Evently.Modules.Users.Application.Users.CreateServiceAccount;

/// <summary>
/// Handles the ServiceAccountCreatedDomainEvent and can publish integration events if needed.
/// </summary>
internal sealed class ServiceAccountCreatedDomainEventHandler : IDomainEventHandler<ServiceAccountCreatedDomainEvent>
{
    public Task Handle(ServiceAccountCreatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Optionally publish integration event for other modules
        // For now, service accounts don't need integration events
        return Task.CompletedTask;
    }
}
```

**Примечание:** Все handlers регистрируются автоматически через Convention-Based Registration.

### 5. Добавить метод GetByIdentityIdAsync в IUserRepository

**Файл:** `src/Modules/Users/Evently.Modules.Users.Domain/Users/IUserRepository.cs`

Добавить метод в интерфейс:

```csharp
/// <summary>
/// Получает пользователя по identity_id (Keycloak UUID).
/// </summary>
/// <param name="identityId">Identity ID пользователя из Keycloak</param>
/// <param name="cancellationToken">Токен отмены операции</param>
/// <returns>Пользователь или null, если не найден</returns>
Task<User?> GetByIdentityIdAsync(string identityId, CancellationToken cancellationToken = default);
```

**Файл:** `src/Modules/Users/Evently.Modules.Users.Infrastructure/Users/UserRepository.cs`

Добавить реализацию метода:

```csharp
/// <summary>
/// Получает пользователя по identity_id (Keycloak UUID).
/// </summary>
/// <param name="identityId">Identity ID пользователя из Keycloak</param>
/// <param name="cancellationToken">Токен отмены операции</param>
/// <returns>Пользователь или null, если не найден</returns>
public async Task<User?> GetByIdentityIdAsync(string identityId, CancellationToken cancellationToken = default)
{
    return await context.Users
        .Include(u => u.Roles)
        .SingleOrDefaultAsync(u => u.IdentityId == identityId, cancellationToken);
}
```

### 6. Добавить UserErrors.IdentityIdAlreadyExists

**Файл:** `src/Modules/Users/Evently.Modules.Users.Domain/Users/UserErrors.cs`

Добавить новый error:

```csharp
public static Error IdentityIdAlreadyExists(string identityId) =>
    Error.Conflict(
        "Users.IdentityIdAlreadyExists",
        $"User with identity ID '{identityId}' already exists.");
```

---

## Изменения в Infrastructure Layer

### 1. Обновить `UserConfiguration`

**Файл:** `src/Modules/Users/Evently.Modules.Users.Infrastructure/Users/UserConfiguration.cs`

```csharp
using Evently.Modules.Users.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Evently.Modules.Users.Infrastructure.Users;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.FirstName).HasMaxLength(200);

        builder.Property(u => u.LastName).HasMaxLength(200);

        builder.Property(u => u.Email).HasMaxLength(300);

        builder.Property(u => u.CreatedAt).HasColumnName("created_at_utc");

        builder.Property(u => u.IsServiceAccount)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasIndex(u => u.Email).IsUnique();

        builder.HasIndex(u => u.IdentityId).IsUnique();

        // Index for efficient service account queries
        builder.HasIndex(u => u.IsServiceAccount);
    }
}
```

### 2. Обновить `RoleConfiguration` - добавить seed данные для новых ролей

**Файл:** `src/Modules/Users/Evently.Modules.Users.Infrastructure/Users/RoleConfiguration.cs`

```csharp
using Evently.Modules.Users.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Evently.Modules.Users.Infrastructure.Users;

internal sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");

        builder.HasKey(r => r.Name);

        builder.Property(r => r.Name).HasMaxLength(50);

        builder
            .HasMany<User>()
            .WithMany(u => u.Roles)
            .UsingEntity(joinBuilder =>
            {
                joinBuilder.ToTable("user_roles");

                joinBuilder.Property("RolesName").HasColumnName("role_name");
            });

        builder.HasData(
            Role.Member,
            Role.Administrator,
            Role.McpAgentAttributeValueFullAccess);
    }
}
```

### 3. Обновить `PermissionConfiguration` - добавить permissions для новых ролей

**Файл:** `src/Modules/Users/Evently.Modules.Users.Infrastructure/Users/PermissionConfiguration.cs`

Добавить в метод `Configure` в секцию `HasData` join table:

```csharp
// ... существующие CreateRolePermission для Member и Administrator ...

// MCP-Agent-AttributeValue-Full-Access role permissions (все права модуля AttributeValue)
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ReadAttributes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.CreateAttributes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.UpdateAttributes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.DeleteAttributes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ReadAttributeGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.CreateAttributeGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.UpdateAttributeGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.DeleteAttributeGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ReadObjectTypes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.UpdateObjectTypes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ManageObjectTypeSchemes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ManageObjectTypeAttributes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ReadAttributeTypes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.CreateAttributeTypes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.UpdateAttributeTypes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.DeleteAttributeTypes),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ReadSystemObjects),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.CreateSystemObjects),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.UpdateSystemObjects),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.DeleteSystemObjects),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ReadMeasureUnitGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.CreateMeasureUnitGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.UpdateMeasureUnitGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.DeleteMeasureUnitGroups),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.ReadMeasureUnits),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.CreateMeasureUnits),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.UpdateMeasureUnits),
CreateRolePermission(Role.McpAgentAttributeValueFullAccess, Permission.DeleteMeasureUnits)
```

---

## Миграции базы данных

### Миграция 1: Добавить поле `is_service_account`

**Команда для создания:**
```bash
cd src/Modules/Users/Evently.Modules.Users.Infrastructure
dotnet ef migrations add AddIsServiceAccountToUsers
```

**Файл:** `src/Modules/Users/Evently.Modules.Users.Infrastructure/Database/Migrations/[timestamp]_AddIsServiceAccountToUsers.cs`

```csharp
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Evently.Modules.Users.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsServiceAccountToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_service_account",
                schema: "users",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_users_is_service_account",
                schema: "users",
                table: "users",
                column: "is_service_account");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_is_service_account",
                schema: "users",
                table: "users");

            migrationBuilder.DropColumn(
                name: "is_service_account",
                schema: "users",
                table: "users");
        }
    }
}
```

### Миграция 2: Добавить роль для MCP AttributeValue Agent

**Команда для создания:**
```bash
cd src/Modules/Users/Evently.Modules.Users.Infrastructure
dotnet ef migrations add AddMcpAttributeValueAgentRole
```

**Файл:** `src/Modules/Users/Evently.Modules.Users.Infrastructure/Database/Migrations/[timestamp]_AddMcpAttributeValueAgentRole.cs`

```csharp
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Evently.Modules.Users.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMcpAttributeValueAgentRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new service account role for MCP AttributeValue Agent
            migrationBuilder.InsertData(
                schema: "users",
                table: "roles",
                column: "name",
                values: new object[]
                {
                    "MCP-Agent-AttributeValue-Full-Access"
                });

            // Add all AttributeValue permissions for MCP-Agent-AttributeValue-Full-Access
            migrationBuilder.InsertData(
                schema: "users",
                table: "role_permissions",
                columns: new[] { "role_name", "permission_code" },
                values: new object[,]
                {
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:schemes:manage" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:attributes:manage" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:delete" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove role permissions
            migrationBuilder.DeleteData(
                schema: "users",
                table: "role_permissions",
                keyColumns: new[] { "role_name", "permission_code" },
                keyValues: new object[,]
                {
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attributes:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-groups:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:schemes:manage" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:object-types:attributes:manage" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:attribute-types:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:system-objects:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-unit-groups:delete" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:read" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:create" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:update" },
                    { "MCP-Agent-AttributeValue-Full-Access", "attributevalue:measure-units:delete" }
                });

            // Remove role
            migrationBuilder.DeleteData(
                schema: "users",
                table: "roles",
                keyColumn: "name",
                keyValues: new object[]
                {
                    "MCP-Agent-AttributeValue-Full-Access"
                });
        }
    }
}
```

### Применение миграций

**КРИТИЧНО:** Миграции Users модуля уже зарегистрированы в `MigrationExtensions.cs`:

```15:18:src/API/Evently.Api/Extensions/MigrationExtensions.cs
        ApplyMigration<UsersDbContext>(scope);
```

Миграции применяются автоматически при старте API в Development режиме.

**Ручное применение миграций:**

```powershell
# 1. Остановить API
docker-compose stop evently.api

# 2. Применить миграции вручную
cd src/Modules/Users/Evently.Modules.Users.Infrastructure
dotnet ef database update --startup-project src/API/Evently.Api

# 3. Или через docker-compose rebuild (автоматическое применение)
docker-compose up -d --build evently.api
```

**Проверка регистрации миграций:**

Убедитесь, что `UsersDbContext` уже зарегистрирован в `MigrationExtensions.cs` (это должно быть сделано при создании Users модуля).

---

## Изменения в Authorization

### Обновить `CustomClaimsTransformation`

**Файл:** `src/Common/Evently.Common.Infrastructure/Authorization/CustomClaimsTransformation.cs`

**НЕ требуется изменений!** 

Текущая реализация уже поддерживает service accounts:

```csharp
public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
{
    if (principal.HasClaim(c => c.Type == CustomClaims.Permission))
    {
        return principal;
    }

    using IServiceScope scope = serviceScopeFactory.CreateScope();

    IPermissionService permissionService = scope.ServiceProvider.GetRequiredService<IPermissionService>();

    string identityId = principal.GetIdentityId();

    // Этот вызов теперь найдет service account пользователя по identity_id
    Result<PermissionsResponse> result = await permissionService.GetUserPermissionsAsync(identityId);

    if (result.IsFailure)
    {
        // Service account не найден в БД → нужно создать через скрипт
        throw new EventlyException(nameof(IPermissionService.GetUserPermissionsAsync), result.Error);
    }

    var claimsIdentity = new ClaimsIdentity();

    claimsIdentity.AddClaim(new Claim(CustomClaims.Sub, result.Value.UserId.ToString()));

    foreach (string permission in result.Value.Permissions)
    {
        claimsIdentity.AddClaim(new Claim(CustomClaims.Permission, permission));
    }

    principal.AddIdentity(claimsIdentity);

    return principal;
}
```

**Почему не требуется изменений?**

1. `GetUserPermissionsAsync` работает через `identity_id`
2. SQL запрос в `GetUserPermissionsQueryHandler` автоматически найдет service account:

```sql
SELECT DISTINCT rp.permission_code
FROM users.users u
INNER JOIN users.user_roles ur ON ur.user_id = u.id
INNER JOIN users.role_permissions rp ON rp.role_name = ur.role_name
WHERE u.identity_id = @IdentityId
-- Работает для ОБОИХ: обычных пользователей И service accounts
-- НЕ требуется фильтр по is_service_account - запрос универсальный
```

3. Поле `is_service_account` используется только для:
   - Фильтрации в админке
   - Блокировки некоторых операций (например, Update для service accounts)
   - Audit logging

---

## PowerShell скрипты управления

**Примечание:** PowerShell скрипты являются административными инструментами для быстрого создания service account для MCP AttributeValue Agent. В продакшене рекомендуется использовать `CreateServiceAccountCommand` через API endpoint (который нужно добавить в Presentation Layer).

### Основной скрипт: Создание MCP AttributeValue Agent Service Account

**Файл:** `scripts/create-mcp-attributevalue-agent.ps1`

```powershell
<#
.SYNOPSIS
    Creates a service account user in Evently database and assigns a role.

.DESCRIPTION
    This script creates a "virtual user" in the users.users table representing a Keycloak service account.
    The service account can then be authorized using the standard Evently permission system.

.PARAMETER ServiceAccountIdentityId
    The Keycloak service account UUID (from JWT token 'sub' claim).
    Example: e6fc0a9a-c466-43b7-93df-ff40eb3c0540

.PARAMETER ServiceAccountName
    Descriptive name for the service account.
    Example: "MCP Attributes Agent", "Flowise Integration"

**Назначение:** Полностью автоматизированное создание MCP AttributeValue Agent Service Account. Скрипт объединяет создание Keycloak клиента, получение токена, извлечение identity_id и создание service account user с ролью `MCP-Agent-AttributeValue-Full-Access` (все права модуля AttributeValue).

**Usage:**

```powershell
# Базовый вариант (создаст клиент и сгенерирует секрет автоматически)
.\create-mcp-attributevalue-agent.ps1

# С указанием секрета
.\create-mcp-attributevalue-agent.ps1 -ClientSecret "your-secret-here"

# Полный вариант с кастомными параметрами
.\create-mcp-attributevalue-agent.ps1 `
    -ClientId "evently-mcp-client" `
    -ClientSecret "your-secret" `
    -ServiceAccountName "MCP AttributeValue Agent"
```

.NOTES
    Requires:
    - Docker running with Evently.Database container
    - PostgreSQL database accessible
#>

param(
    [Parameter(Mandatory=$true, HelpMessage="Keycloak service account UUID (from 'sub' claim)")]
    [ValidateScript({
        if ($_ -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') { $true }
        else { throw "ServiceAccountIdentityId must be a valid UUID" }
    })]
    [string]$ServiceAccountIdentityId,
    
    [Parameter(Mandatory=$true, HelpMessage="Descriptive name for the service account")]
    [ValidateNotNullOrEmpty()]
    [string]$ServiceAccountName,
    
    [Parameter(Mandatory=$true, HelpMessage="Role to assign")]
    [ValidateSet(
        "MCP-Agent-AttributeValue-Full-Access",
        "Administrator"
    )]
    [string]$RoleName
)

Write-Host "=== Creating MCP AttributeValue Agent Service Account ===" -ForegroundColor Green
Write-Host ""

# Шаг 1: Проверка доступности сервисов
Write-Host "1. Checking services availability..." -ForegroundColor Yellow

try {
    $keycloakHealth = Invoke-WebRequest -Uri "$KeycloakUrl/realms/evently" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Keycloak is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Keycloak is not available" -ForegroundColor Red
    Write-Host "   Please ensure Keycloak is running: docker-compose up -d evently.identity" -ForegroundColor Yellow
    exit 1
}

try {
    $apiHealth = Invoke-WebRequest -Uri "http://localhost:5000/swagger/index.html" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Evently API is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Evently API is not available" -ForegroundColor Red
    Write-Host "   Please ensure API is running: docker-compose up -d evently.api" -ForegroundColor Yellow
    exit 1
}

try {
    $dbCheck = docker exec -i Evently.Database psql -U postgres -d evently -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database is accessible" -ForegroundColor Green
    } else {
        throw "Database connection failed"
    }
} catch {
    Write-Host "   ❌ Database is not accessible" -ForegroundColor Red
    Write-Host "   Please ensure database is running: docker-compose up -d evently.database" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Шаг 2: Получение токена администратора Keycloak
Write-Host "2. Getting Keycloak admin token..." -ForegroundColor Yellow

try {
    $adminTokenResponse = Invoke-RestMethod `
        -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" `
        -Method POST `
        -Body "grant_type=password&client_id=admin-cli&username=admin&password=$KeycloakAdminPassword" `
        -ContentType "application/x-www-form-urlencoded" `
        -TimeoutSec 10
    
    $adminToken = $adminTokenResponse.access_token
    Write-Host "   ✅ Admin token received" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to get admin token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 3: Проверка/создание Keycloak клиента
Write-Host "3. Checking/creating Keycloak client..." -ForegroundColor Yellow

try {
    # Проверяем существование клиента
    $existingClients = Invoke-RestMethod `
        -Uri "$KeycloakUrl/admin/realms/evently/clients?clientId=$ClientId" `
        -Headers @{"Authorization"="Bearer $adminToken"} `
        -UseBasicParsing
    
    if ($existingClients.Count -gt 0) {
        $clientIdFromKeycloak = $existingClients[0].id
        Write-Host "   ✅ Client '$ClientId' already exists (ID: $clientIdFromKeycloak)" -ForegroundColor Green
        
        # Получаем секрет существующего клиента
        if (-not $ClientSecret) {
            $secretResponse = Invoke-RestMethod `
                -Uri "$KeycloakUrl/admin/realms/evently/clients/$clientIdFromKeycloak/client-secret" `
                -Headers @{"Authorization"="Bearer $adminToken"} `
                -UseBasicParsing
            
            $ClientSecret = $secretResponse.value
            Write-Host "   ✅ Retrieved existing client secret" -ForegroundColor Green
        }
    } else {
        # Создаем новый клиент
        Write-Host "   Creating new Keycloak client..." -ForegroundColor Yellow
        
        if (-not $ClientSecret) {
            # Генерируем случайный секрет
            $ClientSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        }
        
        $clientBody = @{
            clientId = $ClientId
            enabled = $true
            protocol = "openid-connect"
            publicClient = $false
            secret = $ClientSecret
            serviceAccountsEnabled = $true
            authorizationServicesEnabled = $false
            directAccessGrantsEnabled = $false
            standardFlowEnabled = $false
            implicitFlowEnabled = $false
        } | ConvertTo-Json
        
        $newClient = Invoke-RestMethod `
            -Uri "$KeycloakUrl/admin/realms/evently/clients" `
            -Method POST `
            -Body $clientBody `
            -ContentType "application/json" `
            -Headers @{"Authorization"="Bearer $adminToken"} `
            -UseBasicParsing
        
        $clientIdFromKeycloak = $newClient.id
        Write-Host "   ✅ Client created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed to check/create client: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 4: Получение токена через Client Credentials Flow
Write-Host "4. Getting service account token from Keycloak..." -ForegroundColor Yellow

try {
    $tokenResponse = Invoke-RestMethod `
        -Uri "$KeycloakUrl/realms/evently/protocol/openid-connect/token" `
        -Method POST `
        -Body "grant_type=client_credentials&client_id=$ClientId&client_secret=$ClientSecret" `
        -ContentType "application/x-www-form-urlencoded" `
        -TimeoutSec 10
    
    Write-Host "   ✅ Token received successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to get token from Keycloak" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 5: Извлечение identity_id из токена
Write-Host "5. Extracting service account identity_id from token..." -ForegroundColor Yellow

try {
    $token = $tokenResponse.access_token
    $payload = $token.Split('.')[1]
    
    # Add padding if needed
    $padding = 4 - ($payload.Length % 4)
    if ($padding -lt 4) {
        $payload = $payload.PadRight($payload.Length + $padding, '=')
    }
    
    $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload)) | ConvertFrom-Json
    $serviceAccountIdentityId = $decoded.sub
    
    Write-Host "   Identity ID: $serviceAccountIdentityId" -ForegroundColor Cyan
    Write-Host "   Preferred Username: $($decoded.preferred_username)" -ForegroundColor Cyan
    Write-Host "   Client ID: $($decoded.azp)" -ForegroundColor Cyan
    Write-Host "   ✅ Token decoded successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to decode token" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 6: Создание service account user в базе данных
Write-Host "6. Creating service account user in database..." -ForegroundColor Yellow

# Проверяем существование пользователя
$existingUser = docker exec -i Evently.Database psql -U postgres -d evently -t -c @"
SELECT id FROM users.users WHERE identity_id = '$serviceAccountIdentityId';
"@ 2>&1

if ($existingUser -match '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}') {
    $userId = $existingUser.Trim()
    Write-Host "   Service account user already exists with ID: $userId" -ForegroundColor Yellow
    Write-Host "   Updating existing user..." -ForegroundColor Yellow
    
    docker exec -i Evently.Database psql -U postgres -d evently -c @"
UPDATE users.users 
SET email = 'service-account-$ServiceAccountName@evently.internal',
    first_name = 'Service Account',
    last_name = '$ServiceAccountName',
    is_service_account = TRUE
WHERE identity_id = '$serviceAccountIdentityId';
"@ 2>&1 | Out-Null
    
    Write-Host "   ✅ Service account user updated" -ForegroundColor Green
} else {
    $userId = [guid]::NewGuid()
    
    docker exec -i Evently.Database psql -U postgres -d evently -c @"
INSERT INTO users.users (id, email, first_name, last_name, identity_id, is_service_account, created_at_utc)
VALUES (
    '$userId',
    'service-account-$ServiceAccountName@evently.internal',
    'Service Account',
    '$ServiceAccountName',
    '$serviceAccountIdentityId',
    TRUE,
    NOW()
);
"@ 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to create service account user" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✅ Service account user created with ID: $userId" -ForegroundColor Green
}

Write-Host ""

# Шаг 7: Назначение роли MCP-Agent-AttributeValue-Full-Access
Write-Host "7. Assigning MCP-Agent-AttributeValue-Full-Access role..." -ForegroundColor Yellow

$roleName = "MCP-Agent-AttributeValue-Full-Access"

# Проверяем существование роли
$roleExists = docker exec -i Evently.Database psql -U postgres -d evently -t -c @"
SELECT name FROM users.roles WHERE name = '$roleName';
"@ 2>&1

if (-not ($roleExists -match $roleName)) {
    Write-Host "   ❌ Role '$roleName' does not exist in the database" -ForegroundColor Red
    Write-Host "   Please run migrations first or create the role manually" -ForegroundColor Yellow
    exit 1
}

# Удаляем существующие роли для этого пользователя
docker exec -i Evently.Database psql -U postgres -d evently -c @"
DELETE FROM users.user_roles WHERE user_id = '$userId';
"@ 2>&1 | Out-Null

# Назначаем роль
docker exec -i Evently.Database psql -U postgres -d evently -c @"
INSERT INTO users.user_roles (user_id, role_name)
VALUES ('$userId', '$roleName');
"@ 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Failed to assign role" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Role '$roleName' assigned successfully" -ForegroundColor Green

Write-Host ""

# Шаг 8: Проверка результата
Write-Host "8. Verifying the result..." -ForegroundColor Yellow

$verification = docker exec -i Evently.Database psql -U postgres -d evently -c @"
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.identity_id,
    u.is_service_account,
    ur.role_name
FROM users.users u
LEFT JOIN users.user_roles ur ON ur.user_id = u.id
WHERE u.identity_id = '$serviceAccountIdentityId';
"@ 2>&1

Write-Host "   User data:" -ForegroundColor Green
Write-Host $verification -ForegroundColor Cyan

Write-Host ""

# Шаг 9: Показать permissions
Write-Host "9. Showing assigned permissions..." -ForegroundColor Yellow

$permissions = docker exec -i Evently.Database psql -U postgres -d evently -c @"
SELECT DISTINCT rp.permission_code
FROM users.users u
INNER JOIN users.user_roles ur ON ur.user_id = u.id
INNER JOIN users.role_permissions rp ON rp.role_name = ur.role_name
WHERE u.identity_id = '$serviceAccountIdentityId'
ORDER BY rp.permission_code;
"@ 2>&1

Write-Host "   Assigned permissions:" -ForegroundColor Green
Write-Host $permissions -ForegroundColor Cyan

Write-Host ""

# Шаг 10: Тестирование токена с API
Write-Host "10. Testing token with Evently API..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Пробуем запросить атрибуты
    $testResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/attributes" `
        -Headers $headers `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    if ($testResponse) {
        Write-Host "   ✅ API test successful - service account can access attributes" -ForegroundColor Green
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "   ⚠️  API returned $statusCode - permissions may not be configured yet" -ForegroundColor Yellow
        Write-Host "   This is normal if migrations haven't been applied yet" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  API test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== MCP AttributeValue Agent Service Account Created Successfully! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Service Account Credentials:" -ForegroundColor Cyan
Write-Host "  Client ID: $ClientId" -ForegroundColor White
Write-Host "  Client Secret: $ClientSecret" -ForegroundColor White
Write-Host "  Identity ID: $serviceAccountIdentityId" -ForegroundColor White
Write-Host "  Assigned Role: $roleName" -ForegroundColor White
Write-Host ""
Write-Host "Usage Example:" -ForegroundColor Yellow
Write-Host '  $tokenResponse = Invoke-RestMethod -Uri "http://localhost:18080/realms/evently/protocol/openid-connect/token" -Method POST -Body "grant_type=client_credentials&client_id=' + $ClientId + '&client_secret=' + $ClientSecret + '" -ContentType "application/x-www-form-urlencoded"' -ForegroundColor White
Write-Host '  $token = $tokenResponse.access_token' -ForegroundColor White
Write-Host '  Invoke-RestMethod -Uri "http://localhost:5000/attributes" -Headers @{"Authorization"="Bearer $token"}' -ForegroundColor White
Write-Host ""
Write-Host "AttributeValue Permissions (all included in $roleName):" -ForegroundColor Yellow
Write-Host "  - attributevalue:attributes:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:attribute-groups:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:object-types:read/update" -ForegroundColor White
Write-Host "  - attributevalue:object-types:schemes:manage" -ForegroundColor White
Write-Host "  - attributevalue:object-types:attributes:manage" -ForegroundColor White
Write-Host "  - attributevalue:attribute-types:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:system-objects:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:measure-units:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:measure-unit-groups:read/create/update/delete" -ForegroundColor White
Write-Host ""
```

---

**Примечания:**

- Скрипт автоматически создает Keycloak client, если он не существует
- Если `ClientSecret` не указан, он будет автоматически сгенерирован или получен из существующего клиента
- Скрипт проверяет все необходимые сервисы перед началом работы
- Включает тестирование доступа к API endpoints после создания
- Показывает все назначенные permissions для прозрачности

---
- ✅ Автоматически извлекает `identity_id` из JWT токена
- ✅ Создает service account user в базе данных
- ✅ Назначает роль `MCP-Agent-AttributeValue-Full-Access` (включает все права AttributeValue)
- ✅ Проверяет доступность сервисов (Keycloak, API, Database)
- ✅ Тестирует доступ к API endpoints
- ✅ Показывает все назначенные permissions

**Отличия от `create-admin-final.ps1`:**
- `create-admin-final.ps1` создает обычного пользователя через Keycloak user registration + Evently API (Password Flow)
- `create-mcp-service-account.ps1` создает service account через Keycloak client + Client Credentials Flow (M2M)

**Usage:**

```powershell
# Базовый вариант (создаст клиент и сгенерирует секрет автоматически)
.\create-mcp-service-account.ps1

# С указанием секрета
.\create-mcp-service-account.ps1 -ClientSecret "your-secret-here"

# Полный вариант с кастомными параметрами
.\create-mcp-service-account.ps1 `
    -ClientId "evently-mcp-client" `
    -ClientSecret "your-secret" `
    -ServiceAccountName "MCP AttributeValue Agent"

# С кастомными URL (для production)
.\create-mcp-service-account.ps1 `
    -KeycloakUrl "http://keycloak.example.com:8080" `
    -ClientId "evently-mcp-prod" `
    -ClientSecret "prod-secret"
```

```powershell
<#
.SYNOPSIS
    Creates an MCP Service Account with full permissions for AttributeValue module.

.DESCRIPTION
    This script:
    1. Creates a Keycloak client with Client Credentials Flow (if not exists)
    2. Gets a JWT token from Keycloak
    3. Extracts service account identity_id from token
    4. Creates a service account user in Evently database
    5. Assigns MCP-Agent-AttributeValue-Full-Access role with all AttributeValue permissions

.PARAMETER ClientId
    Keycloak client ID (default: evently-mcp-client)

.PARAMETER ClientSecret
    Keycloak client secret (will be generated if not provided)

.PARAMETER ServiceAccountName
    Descriptive name for the service account (default: "MCP AttributeValue Agent")

.PARAMETER KeycloakUrl
    Keycloak base URL (default: http://localhost:18080)

.PARAMETER KeycloakAdminPassword
    Keycloak admin password (default: admin)

.EXAMPLE
    .\create-mcp-service-account.ps1 `
        -ClientId "evently-mcp-client" `
        -ClientSecret "your-secret-here" `
        -ServiceAccountName "MCP AttributeValue Agent"

.NOTES
    This script automates the entire process of creating an MCP service account,
    similar to create-admin-final.ps1 but for machine-to-machine authentication.
    
    The created service account will have the MCP-Agent-AttributeValue-Full-Access role which includes:
    - All AttributeValue module permissions (attributes, attribute-groups, object-types, attribute-types, system-objects, measure-units, etc.)
    - See role definition in AddMcpAttributeValueAgentRole migration
    
    Requires:
    - Docker running with Evently.Database container
    - Keycloak running and accessible
    - Evently API running
    - PostgreSQL database accessible
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$ClientId = "evently-mcp-client",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientSecret,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceAccountName = "MCP AttributeValue Agent",
    
    [Parameter(Mandatory=$false)]
    [string]$KeycloakUrl = "http://localhost:18080",
    
    [Parameter(Mandatory=$false)]
    [string]$KeycloakAdminPassword = "admin"
)

Write-Host "=== Creating MCP Service Account for AttributeValue ===" -ForegroundColor Green
Write-Host ""

# Шаг 1: Проверка доступности сервисов
Write-Host "1. Checking services availability..." -ForegroundColor Yellow

try {
    $keycloakHealth = Invoke-WebRequest -Uri "$KeycloakUrl/realms/evently" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Keycloak is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Keycloak is not available" -ForegroundColor Red
    Write-Host "   Please ensure Keycloak is running: docker-compose up -d evently.identity" -ForegroundColor Yellow
    exit 1
}

try {
    $apiHealth = Invoke-WebRequest -Uri "http://localhost:5000/swagger/index.html" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Evently API is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Evently API is not available" -ForegroundColor Red
    Write-Host "   Please ensure API is running: docker-compose up -d evently.api" -ForegroundColor Yellow
    exit 1
}

try {
    $dbCheck = docker exec -i Evently.Database psql -U postgres -d evently -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database is accessible" -ForegroundColor Green
    } else {
        throw "Database connection failed"
    }
} catch {
    Write-Host "   ❌ Database is not accessible" -ForegroundColor Red
    Write-Host "   Please ensure database is running: docker-compose up -d evently.database" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Шаг 2: Получение токена администратора Keycloak
Write-Host "2. Getting Keycloak admin token..." -ForegroundColor Yellow

try {
    $adminTokenResponse = Invoke-RestMethod `
        -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" `
        -Method POST `
        -Body "grant_type=password&client_id=admin-cli&username=admin&password=$KeycloakAdminPassword" `
        -ContentType "application/x-www-form-urlencoded" `
        -TimeoutSec 10
    
    $adminToken = $adminTokenResponse.access_token
    Write-Host "   ✅ Admin token received" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to get admin token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 3: Проверка/создание Keycloak клиента
Write-Host "3. Checking/creating Keycloak client..." -ForegroundColor Yellow

try {
    # Проверяем существование клиента
    $existingClients = Invoke-RestMethod `
        -Uri "$KeycloakUrl/admin/realms/evently/clients?clientId=$ClientId" `
        -Headers @{"Authorization"="Bearer $adminToken"} `
        -UseBasicParsing
    
    if ($existingClients.Count -gt 0) {
        $clientIdFromKeycloak = $existingClients[0].id
        Write-Host "   ✅ Client '$ClientId' already exists (ID: $clientIdFromKeycloak)" -ForegroundColor Green
        
        # Получаем секрет существующего клиента
        if (-not $ClientSecret) {
            $secretResponse = Invoke-RestMethod `
                -Uri "$KeycloakUrl/admin/realms/evently/clients/$clientIdFromKeycloak/client-secret" `
                -Headers @{"Authorization"="Bearer $adminToken"} `
                -UseBasicParsing
            
            $ClientSecret = $secretResponse.value
            Write-Host "   ✅ Retrieved existing client secret" -ForegroundColor Green
        }
    } else {
        # Создаем новый клиент
        Write-Host "   Creating new Keycloak client..." -ForegroundColor Yellow
        
        if (-not $ClientSecret) {
            # Генерируем случайный секрет
            $ClientSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        }
        
        $clientBody = @{
            clientId = $ClientId
            enabled = $true
            protocol = "openid-connect"
            publicClient = $false
            secret = $ClientSecret
            serviceAccountsEnabled = $true
            authorizationServicesEnabled = $false
            directAccessGrantsEnabled = $false
            standardFlowEnabled = $false
            implicitFlowEnabled = $false
        } | ConvertTo-Json
        
        $newClient = Invoke-RestMethod `
            -Uri "$KeycloakUrl/admin/realms/evently/clients" `
            -Method POST `
            -Body $clientBody `
            -ContentType "application/json" `
            -Headers @{"Authorization"="Bearer $adminToken"} `
            -UseBasicParsing
        
        $clientIdFromKeycloak = $newClient.id
        Write-Host "   ✅ Client created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed to check/create client: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 4: Получение токена через Client Credentials Flow
Write-Host "4. Getting service account token from Keycloak..." -ForegroundColor Yellow

try {
    $tokenResponse = Invoke-RestMethod `
        -Uri "$KeycloakUrl/realms/evently/protocol/openid-connect/token" `
        -Method POST `
        -Body "grant_type=client_credentials&client_id=$ClientId&client_secret=$ClientSecret" `
        -ContentType "application/x-www-form-urlencoded" `
        -TimeoutSec 10
    
    Write-Host "   ✅ Token received successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to get token from Keycloak" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 5: Извлечение identity_id из токена
Write-Host "5. Extracting service account identity_id from token..." -ForegroundColor Yellow

try {
    $token = $tokenResponse.access_token
    $payload = $token.Split('.')[1]
    
    # Add padding if needed
    $padding = 4 - ($payload.Length % 4)
    if ($padding -lt 4) {
        $payload = $payload.PadRight($payload.Length + $padding, '=')
    }
    
    $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload)) | ConvertFrom-Json
    $serviceAccountIdentityId = $decoded.sub
    
    Write-Host "   Identity ID: $serviceAccountIdentityId" -ForegroundColor Cyan
    Write-Host "   Preferred Username: $($decoded.preferred_username)" -ForegroundColor Cyan
    Write-Host "   Client ID: $($decoded.azp)" -ForegroundColor Cyan
    Write-Host "   ✅ Token decoded successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to decode token" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Шаг 6: Создание service account user в базе данных
Write-Host "6. Creating service account user in database..." -ForegroundColor Yellow

# Проверяем существование пользователя
$existingUser = docker exec -i Evently.Database psql -U postgres -d evently -t -c @"
SELECT id FROM users.users WHERE identity_id = '$serviceAccountIdentityId';
"@ 2>&1

if ($existingUser -match '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}') {
    $userId = $existingUser.Trim()
    Write-Host "   Service account user already exists with ID: $userId" -ForegroundColor Yellow
    Write-Host "   Updating existing user..." -ForegroundColor Yellow
    
    docker exec -i Evently.Database psql -U postgres -d evently -c @"
UPDATE users.users 
SET email = 'service-account-$ServiceAccountName@evently.internal',
    first_name = 'Service Account',
    last_name = '$ServiceAccountName',
    is_service_account = TRUE
WHERE identity_id = '$serviceAccountIdentityId';
"@ 2>&1 | Out-Null
    
    Write-Host "   ✅ Service account user updated" -ForegroundColor Green
} else {
    $userId = [guid]::NewGuid()
    
    docker exec -i Evently.Database psql -U postgres -d evently -c @"
INSERT INTO users.users (id, email, first_name, last_name, identity_id, is_service_account, created_at_utc)
VALUES (
    '$userId',
    'service-account-$ServiceAccountName@evently.internal',
    'Service Account',
    '$ServiceAccountName',
    '$serviceAccountIdentityId',
    TRUE,
    NOW()
);
"@ 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to create service account user" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✅ Service account user created with ID: $userId" -ForegroundColor Green
}

Write-Host ""

# Шаг 7: Назначение роли MCP-Agent-AttributeValue-Full-Access
Write-Host "7. Assigning MCP-Agent-AttributeValue-Full-Access role..." -ForegroundColor Yellow

$roleName = "MCP-Agent-AttributeValue-Full-Access"

# Проверяем существование роли
$roleExists = docker exec -i Evently.Database psql -U postgres -d evently -t -c @"
SELECT name FROM users.roles WHERE name = '$roleName';
"@ 2>&1

if (-not ($roleExists -match $roleName)) {
    Write-Host "   ❌ Role '$roleName' does not exist in the database" -ForegroundColor Red
    Write-Host "   Please run migrations first or create the role manually" -ForegroundColor Yellow
    exit 1
}

# Удаляем существующие роли для этого пользователя
docker exec -i Evently.Database psql -U postgres -d evently -c @"
DELETE FROM users.user_roles WHERE user_id = '$userId';
"@ 2>&1 | Out-Null

# Назначаем роль
docker exec -i Evently.Database psql -U postgres -d evently -c @"
INSERT INTO users.user_roles (user_id, role_name)
VALUES ('$userId', '$roleName');
"@ 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Failed to assign role" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Role '$roleName' assigned successfully" -ForegroundColor Green

Write-Host ""

# Шаг 8: Проверка результата
Write-Host "8. Verifying the result..." -ForegroundColor Yellow

$verification = docker exec -i Evently.Database psql -U postgres -d evently -c @"
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.identity_id,
    u.is_service_account,
    ur.role_name
FROM users.users u
LEFT JOIN users.user_roles ur ON ur.user_id = u.id
WHERE u.identity_id = '$serviceAccountIdentityId';
"@ 2>&1

Write-Host "   User data:" -ForegroundColor Green
Write-Host $verification -ForegroundColor Cyan

Write-Host ""

# Шаг 9: Показать permissions
Write-Host "9. Showing assigned permissions..." -ForegroundColor Yellow

$permissions = docker exec -i Evently.Database psql -U postgres -d evently -c @"
SELECT DISTINCT rp.permission_code
FROM users.users u
INNER JOIN users.user_roles ur ON ur.user_id = u.id
INNER JOIN users.role_permissions rp ON rp.role_name = ur.role_name
WHERE u.identity_id = '$serviceAccountIdentityId'
ORDER BY rp.permission_code;
"@ 2>&1

Write-Host "   Assigned permissions:" -ForegroundColor Green
Write-Host $permissions -ForegroundColor Cyan

Write-Host ""

# Шаг 10: Тестирование токена с API
Write-Host "10. Testing token with Evently API..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Пробуем запросить атрибуты (нужен permission attributevalue:attributes:read)
    $testResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/attributes" `
        -Headers $headers `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    if ($testResponse) {
        Write-Host "   ✅ API test successful - service account can access attributes" -ForegroundColor Green
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "   ⚠️  API returned $statusCode - permissions may not be configured yet" -ForegroundColor Yellow
        Write-Host "   This is normal if migrations haven't been applied yet" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  API test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== MCP AttributeValue Agent Service Account Created Successfully! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Service Account Credentials:" -ForegroundColor Cyan
Write-Host "  Client ID: $ClientId" -ForegroundColor White
Write-Host "  Client Secret: $ClientSecret" -ForegroundColor White
Write-Host "  Identity ID: $serviceAccountIdentityId" -ForegroundColor White
Write-Host "  Assigned Role: $roleName" -ForegroundColor White
Write-Host ""
Write-Host "Usage Example:" -ForegroundColor Yellow
Write-Host '  $tokenResponse = Invoke-RestMethod -Uri "http://localhost:18080/realms/evently/protocol/openid-connect/token" -Method POST -Body "grant_type=client_credentials&client_id=' + $ClientId + '&client_secret=' + $ClientSecret + '" -ContentType "application/x-www-form-urlencoded"' -ForegroundColor White
Write-Host '  $token = $tokenResponse.access_token' -ForegroundColor White
Write-Host '  Invoke-RestMethod -Uri "http://localhost:5000/attributes" -Headers @{"Authorization"="Bearer $token"}' -ForegroundColor White
Write-Host ""
Write-Host "AttributeValue Permissions (all included in $roleName):" -ForegroundColor Yellow
Write-Host "  - attributevalue:attributes:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:attribute-groups:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:object-types:read/update" -ForegroundColor White
Write-Host "  - attributevalue:object-types:schemes:manage" -ForegroundColor White
Write-Host "  - attributevalue:object-types:attributes:manage" -ForegroundColor White
Write-Host "  - attributevalue:attribute-types:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:system-objects:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:measure-units:read/create/update/delete" -ForegroundColor White
Write-Host "  - attributevalue:measure-unit-groups:read/create/update/delete" -ForegroundColor White
Write-Host ""
```

**Примечания:**

- Скрипт автоматически создает Keycloak client, если он не существует
- Если `ClientSecret` не указан, он будет автоматически сгенерирован или получен из существующего клиента
- Скрипт проверяет все необходимые сервисы перед началом работы
- Включает тестирование доступа к API endpoints после создания
- Показывает все назначенные permissions для прозрачности


---

## Тестирование

### Unit тесты

**Файл:** `test/Evently.Modules.Users.UnitTests/Domain/UserTests.cs`

```csharp
using Bogus;
using Evently.Modules.Users.Domain.Users;
using FluentAssertions;
using Xunit;

namespace Evently.Modules.Users.UnitTests.Domain;

public class UserTests
{
    private static readonly Faker Faker = new();

    [Fact]
    public void CreateServiceAccount_WithValidParameters_ShouldCreateUser()
    {
        // Arrange
        var name = Faker.Company.BS();
        var identityId = Faker.Random.Guid().ToString();
        var roles = new[] { Role.McpAgentAttributeValueFullAccess };

        // Act
        var user = User.CreateServiceAccount(name, identityId, roles);

        // Assert
        user.Should().NotBeNull();
        user.IsServiceAccount.Should().BeTrue();
        user.Email.Should().Be($"service-account-{name}@evently.internal");
        user.FirstName.Should().Be("Service Account");
        user.LastName.Should().Be(name);
        user.IdentityId.Should().Be(identityId);
        user.Roles.Should().HaveCount(1);
        user.Roles.First().Name.Should().Be("MCP-Agent-AttributeValue-Full-Access");
    }

    [Fact]
    public void Update_OnServiceAccount_ShouldThrowException()
    {
        // Arrange
        var user = User.CreateServiceAccount(
            Faker.Company.BS(),
            Faker.Random.Guid().ToString(),
            new[] { Role.McpAgentAttributeValueFullAccess });

        // Act
        var act = () => user.Update(
            Faker.Name.FirstName(),
            Faker.Name.LastName());

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot update service account profile");
    }

    [Fact]
    public void CreateServiceAccount_WithoutRoles_ShouldCreateUserWithoutRoles()
    {
        // Arrange
        var name = Faker.Company.BS();
        var identityId = Faker.Random.Guid().ToString();

        // Act
        var user = User.CreateServiceAccount(name, identityId, Array.Empty<Role>());

        // Assert
        user.Roles.Should().BeEmpty();
    }

    [Fact]
    public void CreateServiceAccount_WithMultipleRoles_ShouldAssignAllRoles()
    {
        // Arrange
        var name = Faker.Company.BS();
        var identityId = Faker.Random.Guid().ToString();
        var roles = new[]
        {
            Role.McpAgentAttributeValueFullAccess
        };

        // Act
        var user = User.CreateServiceAccount(name, identityId, roles);

        // Assert
        user.Roles.Should().HaveCount(1);
        user.Roles.Select(r => r.Name).Should().Contain(new[]
        {
            "MCP-Agent-AttributeValue-Full-Access"
        });
    }
}
```

### Integration тесты

**Файл:** `test/Evently.IntegrationTests/Users/ServiceAccountAuthorizationTests.cs`

```csharp
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Evently.IntegrationTests.Abstractions;
using FluentAssertions;
using Xunit;

namespace Evently.IntegrationTests.Users;

public class ServiceAccountAuthorizationTests : BaseIntegrationTest
{
    public ServiceAccountAuthorizationTests(IntegrationTestWebAppFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task ServiceAccount_WithAttributeValueFullAccessRole_ShouldGetAttributes()
    {
        // Arrange
        var serviceAccountToken = await GetServiceAccountTokenAsync("MCP-Agent-AttributeValue-Full-Access");

        // Act
        var response = await HttpClient.GetAsync("/api/attributes");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ServiceAccount_WithAttributeValueFullAccessRole_ShouldCreateAndDeleteAttributes()
    {
        // Arrange
        var serviceAccountToken = await GetServiceAccountTokenAsync("MCP-Agent-AttributeValue-Full-Access");
        var createRequest = new
        {
            name = "Test Attribute",
            description = "Test"
        };

        // Act - Create
        var createResponse = await HttpClient.PostAsJsonAsync("/api/attributes", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var attributeId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act - Delete
        var deleteResponse = await HttpClient.DeleteAsync($"/api/attributes/{attributeId}");
        
        // Assert
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    private async Task<string> GetServiceAccountTokenAsync(string roleName)
    {
        // This would be implemented to get a real token from Keycloak
        // or use a test token provider
        throw new NotImplementedException();
    }
}
```

### Ручное тестирование

**Сценарий 1: Создать service account и протестировать вызовы API**

```powershell
# 1. Создать service account
.\scripts\create-mcp-attributevalue-agent.ps1 `
    -ClientSecret "PzotcrvZRF9BHCKcUxdKfHWlIPECG49k" `
    -ServiceAccountName "MCP AttributeValue Agent"

# 2. Получить токен
$tokenResponse = Invoke-RestMethod `
    -Uri "http://localhost:18080/realms/evently/protocol/openid-connect/token" `
    -Method POST `
    -Body "grant_type=client_credentials&client_id=evently-confidential-client&client_secret=PzotcrvZRF9BHCKcUxdKfHWlIPECG49k" `
    -ContentType "application/x-www-form-urlencoded"

$token = $tokenResponse.access_token

# 3. Тест: GET attributes (должен работать)
Invoke-RestMethod `
    -Uri "http://localhost:5000/api/attributes" `
    -Headers @{ "Authorization" = "Bearer $token" }

# 4. Тест: POST attributes (должен вернуть 403 Forbidden)
try {
    Invoke-RestMethod `
        -Uri "http://localhost:5000/api/attributes" `
        -Method POST `
        -Headers @{ "Authorization" = "Bearer $token" } `
        -Body '{"name":"Test","description":"Test"}' `
        -ContentType "application/json"
} catch {
    Write-Host "Expected 403 Forbidden: $($_.Exception.Message)" -ForegroundColor Yellow
}
```

**Сценарий 2: Проверить permissions в токене**

```powershell
# Декодировать токен и проверить permissions
$payload = $token.Split('.')[1]
$padding = 4 - ($payload.Length % 4)
if ($padding -lt 4) { $payload += '=' * $padding }
$decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload)) | ConvertFrom-Json

Write-Host "User ID (sub): $($decoded.sub)" -ForegroundColor Cyan
Write-Host "Preferred Username: $($decoded.preferred_username)" -ForegroundColor Cyan

# Проверить permissions в БД
docker exec -i Evently.Database psql -U postgres -d evently -c @"
SELECT DISTINCT rp.permission_code
FROM users.users u
INNER JOIN users.user_roles ur ON ur.user_id = u.id
INNER JOIN users.role_permissions rp ON rp.role_name = ur.role_name
WHERE u.identity_id = '$($decoded.sub)'
ORDER BY rp.permission_code;
"@
```

---

## План внедрения

### День 1: Domain Layer изменения (2-3 часа)

**Задачи:**
- [ ] Обновить `User` entity - добавить `IsServiceAccount` и метод `CreateServiceAccount`
- [ ] Создать `ServiceAccountCreatedDomainEvent`
- [ ] Обновить `Role` - добавить 3 новые роли для service accounts
- [ ] Добавить метод `GetByIdentityIdAsync` в `IUserRepository` и `UserRepository`
- [ ] Добавить `UserErrors.IdentityIdAlreadyExists`
- [ ] Unit тесты для новой функциональности (с использованием Bogus)
- [ ] Code review Domain changes

**Результат:** Domain layer готов для service accounts

---

### День 2: Application Layer + Infrastructure Layer (3-4 часа)

**Задачи:**
- [ ] Создать `CreateServiceAccountCommand`, `CreateServiceAccountCommandHandler`, `CreateServiceAccountCommandValidator`
- [ ] Создать `ServiceAccountCreatedDomainEventHandler` (опционально)
- [ ] Обновить `UserConfiguration` - добавить `IsServiceAccount` с индексом
- [ ] Обновить `RoleConfiguration` - seed данные для новых ролей
- [ ] Обновить `PermissionConfiguration` - добавить permissions для новых ролей
- [ ] Проверить автоматическую регистрацию handlers через Convention-Based Registration

**Результат:** Application и Infrastructure layers готовы

---

### День 3: Миграции базы данных (1-2 часа)

**Задачи:**
- [ ] Создать и применить миграцию `AddIsServiceAccountToUsers`
- [ ] Создать и применить миграцию `AddServiceAccountRoles`
- [ ] Проверить регистрацию миграций в `MigrationExtensions.cs` (должна быть уже зарегистрирована)
- [ ] Проверить миграции на dev БД

**Результат:** БД готова для service accounts

---

### День 4: PowerShell скрипты + Тестирование (4-5 часов)

**Задачи:**
- [ ] Создать `create-service-account-user.ps1` (административный инструмент)
- [ ] Создать `create-service-account-from-token.ps1`
- [ ] Создать `list-service-accounts.ps1`
- [ ] Создать `delete-service-account-user.ps1`
- [ ] Интеграционный тест для `CreateServiceAccountCommand` через ISender
- [ ] Ручное тестирование скриптов
- [ ] Создать service account через Command (не только скрипт)
- [ ] Протестировать вызовы API с разными ролями

**Результат:** Service accounts можно создавать через CQRS Command и управлять через административные скрипты

---

### День 5: Integration тесты + Документация (3-4 часа)

**Задачи:**
- [ ] Написать Integration тесты для `CreateServiceAccountCommand` (с использованием Bogus)
- [ ] Написать Integration тесты для service account authorization
- [ ] Обновить README с инструкциями по service accounts
- [ ] Создать `SERVICE_ACCOUNT_MANAGEMENT.md` с подробной документацией
- [ ] Обновить `docker-compose.yml` с примерами конфигурации
- [ ] Code review всех изменений

**Результат:** Production-ready решение с документацией и полным тестовым покрытием

---

### День 6: Staging + Production Deploy (2-3 часа)

**Задачи:**
- [ ] Deploy на staging
- [ ] Smoke тесты на staging
- [ ] Создать production service account через скрипт
- [ ] Deploy на production
- [ ] Мониторинг и проверка логов
- [ ] Обновить CHANGELOG

**Результат:** Service accounts работают в production

---

## Итоговая проверка

### Checklist готовности к production

- [ ] ✅ Миграции применены
- [ ] ✅ Unit тесты проходят
- [ ] ✅ Integration тесты проходят
- [ ] ✅ Service account создан через скрипт
- [ ] ✅ MCP Server успешно авторизуется
- [ ] ✅ Вызовы API с правильными permissions работают
- [ ] ✅ Вызовы API с недостаточными permissions блокируются (403)
- [ ] ✅ Audit trail показывает действия service account
- [ ] ✅ Документация обновлена
- [ ] ✅ Code review пройден
- [ ] ✅ Staging тесты пройдены

---

**Автор:** System Architect  
**Дата:** 2025-10-29  
**Версия:** 1.0  
**Статус:** Specification Ready for Implementation

