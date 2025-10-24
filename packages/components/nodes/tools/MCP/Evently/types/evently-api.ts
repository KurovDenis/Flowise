/**
 * Generated types for Evently API
 * Based on OpenAPI specification
 */

export interface AttributeTypeResponse {
    id: string
    name: string
    description?: string
    dataType: string
}

export interface CreateAttributeTypeRequest {
    name: string
    description?: string
    dataType: string
}

export interface UpdateAttributeTypeRequest {
    name?: string
    description?: string
    dataType?: string
}

export interface AttributeResponse {
    id: string
    name: string
    description?: string
    attributeTypeId: string
}

export interface CreateAttributeRequest {
    name: string
    description?: string
    attributeTypeId: string
}

export interface UpdateAttributeRequest {
    name?: string
    description?: string
    attributeTypeId?: string
}

export interface AttributeGroupResponse {
    id: string
    name: string
    description?: string
}

export interface CreateAttributeGroupRequest {
    name: string
    description?: string
}

export interface UpdateAttributeGroupRequest {
    name?: string
    description?: string
}

// API Error Response
export interface ApiErrorResponse {
    type?: string
    title?: string
    status?: number
    detail?: string
    instance?: string
    errors?: Record<string, string[]>
}

// Common API response types
export type ApiResponse<T> = T
export type ApiError = ApiErrorResponse
