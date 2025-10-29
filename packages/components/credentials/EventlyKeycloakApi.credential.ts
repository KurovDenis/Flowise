import { INodeParams, INodeCredential } from '../src/Interface'

class EventlyKeycloakApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Evently API (Keycloak)'
        this.name = 'eventlyKeycloakApi'
        this.version = 2.0
        this.description = 'Evently API authentication using Keycloak Service Account with automatic token refresh'
        this.inputs = [
            {
                label: 'API URL',
                name: 'apiUrl',
                type: 'string',
                default: process.env.EVENTLY_API_URL || 'http://localhost:5000',
                placeholder: 'http://evently.api:8080',
                description: 'Base URL of Evently API (without /api suffix)'
            },
            {
                label: 'Keycloak Token URL',
                name: 'keycloakTokenUrl',
                type: 'string',
                default: process.env.KEYCLOAK_TOKEN_URL || 'http://evently.identity:8080/realms/evently/protocol/openid-connect/token',
                placeholder: 'http://evently.identity:8080/realms/evently/protocol/openid-connect/token',
                description: 'Keycloak token endpoint URL for OAuth2 Client Credentials flow'
            },
            {
                label: 'Client ID',
                name: 'keycloakClientId',
                type: 'string',
                default: process.env.KEYCLOAK_CLIENT_ID || 'evently-confidential-client',
                placeholder: 'evently-confidential-client',
                description: 'Keycloak Service Account client ID'
            },
            {
                label: 'Client Secret',
                name: 'keycloakClientSecret',
                type: 'password',
                default: process.env.KEYCLOAK_CLIENT_SECRET || '',
                description: 'Keycloak Service Account client secret (from Keycloak Admin Console → Clients → Credentials)'
            }
        ]
    }
}

module.exports = { credClass: EventlyKeycloakApi }
