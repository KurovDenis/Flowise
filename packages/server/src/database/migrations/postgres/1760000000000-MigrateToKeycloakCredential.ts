import { MigrationInterface, QueryRunner } from 'typeorm'
import { AES } from 'crypto-js'
import fs from 'fs'
import path from 'path'
import os from 'os'

export class MigrateToKeycloakCredential1760000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Environment variables - trim to remove whitespace
        const EVENTLY_API_URL = (process.env.EVENTLY_API_URL || 'http://localhost:5000').trim()
        const KEYCLOAK_TOKEN_URL = (process.env.KEYCLOAK_TOKEN_URL || 'http://evently.identity:8080/realms/evently/protocol/openid-connect/token').trim()
        const KEYCLOAK_CLIENT_ID = (process.env.KEYCLOAK_CLIENT_ID || '').trim()
        const KEYCLOAK_CLIENT_SECRET = (process.env.KEYCLOAK_CLIENT_SECRET || '').trim()

        const CREDENTIAL_NAME = 'Evently API - Default'
        const CREDENTIAL_TYPE = 'eventlyKeycloakApi'

        try {
            // Delete existing credential if it exists (always recreate)
            const existingCredential = await queryRunner.query(
                `SELECT id FROM credential WHERE name = '${CREDENTIAL_NAME}' AND "credentialName" = '${CREDENTIAL_TYPE}'`
            )

            if (existingCredential && existingCredential.length > 0) {
                // eslint-disable-next-line no-console
                console.log('🔄 Removing existing Evently Keycloak API credential...')
                await queryRunner.query(
                    `DELETE FROM credential WHERE name = '${CREDENTIAL_NAME}' AND "credentialName" = '${CREDENTIAL_TYPE}'`
                )
            }

            if (!KEYCLOAK_CLIENT_ID || !KEYCLOAK_CLIENT_SECRET) {
                // eslint-disable-next-line no-console
                console.log('⚠️  KEYCLOAK_CLIENT_ID or KEYCLOAK_CLIENT_SECRET not set, skipping credential creation')
                // eslint-disable-next-line no-console
                console.log('   KEYCLOAK_CLIENT_ID:', !!KEYCLOAK_CLIENT_ID)
                // eslint-disable-next-line no-console
                console.log('   KEYCLOAK_CLIENT_SECRET:', !!KEYCLOAK_CLIENT_SECRET)
                return
            }

            // eslint-disable-next-line no-console
            console.log('📝 Creating Evently Keycloak API credential...')
            // eslint-disable-next-line no-console
            console.log('   API URL:', EVENTLY_API_URL)
            // eslint-disable-next-line no-console
            console.log('   Keycloak Token URL:', KEYCLOAK_TOKEN_URL)
            // eslint-disable-next-line no-console
            console.log('   Client ID:', KEYCLOAK_CLIENT_ID)
            // eslint-disable-next-line no-console
            console.log('   Client Secret:', KEYCLOAK_CLIENT_SECRET ? '***' : 'not set')

            // Get encryption key
            const getEncryptionKey = (): string => {
                // Check for FLOWISE_SECRETKEY_OVERWRITE first (highest priority)
                if (process.env.FLOWISE_SECRETKEY_OVERWRITE) {
                    return process.env.FLOWISE_SECRETKEY_OVERWRITE.trim()
                }

                // Check SECRETKEY_PATH env var
                const secretKeyPath = process.env.SECRETKEY_PATH
                if (secretKeyPath) {
                    const keyPath = path.join(secretKeyPath, 'encryption.key')
                    try {
                        return fs.readFileSync(keyPath, 'utf8').trim()
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.warn(`⚠️  Encryption key not found at ${keyPath}`)
                    }
                }

                // Default location
                const flowisePath = path.join(os.homedir(), '.flowise')
                const defaultKeyPath = path.join(flowisePath, 'encryption.key')

                try {
                    return fs.readFileSync(defaultKeyPath, 'utf8').trim()
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('❌ Encryption key not found at any location')
                    throw new Error('Encryption key not found. Cannot create credential.')
                }
            }

            const encryptKey = getEncryptionKey()
            const plainDataObj = {
                apiUrl: EVENTLY_API_URL,
                keycloakTokenUrl: KEYCLOAK_TOKEN_URL,
                keycloakClientId: KEYCLOAK_CLIENT_ID,
                keycloakClientSecret: KEYCLOAK_CLIENT_SECRET
            }

            const encryptedData = AES.encrypt(JSON.stringify(plainDataObj), encryptKey).toString()

            // Insert credential into database
            const escapedEncryptedData = encryptedData.replace(/'/g, "''")
            await queryRunner.query(
                `INSERT INTO credential (id, name, "credentialName", "encryptedData", "createdDate", "updatedDate") VALUES (uuid_generate_v4(), '${CREDENTIAL_NAME}', '${CREDENTIAL_TYPE}', '${escapedEncryptedData}', now(), now())`
            )

            // eslint-disable-next-line no-console
            console.log('✅ Evently Keycloak API credential created successfully')
            // eslint-disable-next-line no-console
            console.log('   This credential supports automatic token refresh')
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error creating Evently Keycloak API credential:', error)
            // Don't throw - allow migration to continue
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove Evently Keycloak API credential if it exists
        await queryRunner.query(`DELETE FROM credential WHERE name = 'Evently API - Default' AND "credentialName" = 'eventlyKeycloakApi'`)
    }
}
