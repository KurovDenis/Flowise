import { INodeParams, INodeCredential } from '../src/Interface'

class EventlyApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Evently API'
        this.name = 'eventlyApi'
        this.version = 1.0
        this.description = 'Evently API authentication using JWT token'
        this.inputs = [
            {
                label: 'API URL',
                name: 'apiUrl',
                type: 'string',
                // Prefer env var if provided by Docker compose; fallback to sensible default
                default: process.env.EVENTLY_API_URL || 'http://localhost:5000',
                placeholder: 'http://evently.api:8080',
                description: 'Base URL of Evently API'
            },
            {
                label: 'JWT Token',
                name: 'token',
                type: 'password',
                // Allows non-interactive setup via EVENTLY_API_TOKEN in docker-compose
                default: process.env.EVENTLY_API_TOKEN?.trim() || '',
                description: 'JWT token from Keycloak (можно прокинуть через EVENTLY_API_TOKEN)',
                placeholder: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
        ]
    }
}

module.exports = { credClass: EventlyApi }
