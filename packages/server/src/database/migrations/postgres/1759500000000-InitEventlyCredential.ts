import { MigrationInterface, QueryRunner } from 'typeorm'
import { AES } from 'crypto-js'
import fs from 'fs'
import path from 'path'
import os from 'os'

export class InitEventlyCredential1759500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Environment variables
        const EVENTLY_API_URL = process.env.EVENTLY_API_URL || 'http://localhost:5000'
        const EVENTLY_JWT_TOKEN = process.env.EVENTLY_JWT_TOKEN || ''

        const CREDENTIAL_NAME = 'Evently API - Default'
        const CREDENTIAL_TYPE = 'eventlyApi'

        try {
            // Check if credential already exists
            const existingCredential = await queryRunner.query(
                `SELECT id FROM credential WHERE name = 'Evently API - Default' AND "credentialName" = 'eventlyApi'`
            )

            if (existingCredential && existingCredential.length > 0) {
                // eslint-disable-next-line no-console
                console.log('🔑 Evently API credential already exists')
                return
            }

            if (!EVENTLY_JWT_TOKEN) {
                // eslint-disable-next-line no-console
                console.log('⚠️  EVENTLY_JWT_TOKEN not set, skipping credential creation')
                return
            }

            // eslint-disable-next-line no-console
            console.log('📝 Creating Evently API credential...')

            // Get encryption key
            const getEncryptionKey = (): string => {
                const flowisePath = path.join(os.homedir(), '.flowise')
                let encryptionKeyPath = process.env.FLOWISE_SECRETKEY_PATH
                if (!encryptionKeyPath) {
                    encryptionKeyPath = path.join(flowisePath, 'encryption.key')
                }

                try {
                    return fs.readFileSync(encryptionKeyPath, 'utf8').trim()
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn('Warning: encryption key not found, using default')
                    return 'your-secret-key-here'
                }
            }

            const encryptKey = getEncryptionKey()
            const plainDataObj = {
                apiUrl: EVENTLY_API_URL,
                token: EVENTLY_JWT_TOKEN
            }

            const encryptedData = AES.encrypt(JSON.stringify(plainDataObj), encryptKey).toString()

            // Insert credential into database
            const escapedEncryptedData = encryptedData.replace(/'/g, "''")
            await queryRunner.query(
                `INSERT INTO credential (id, name, "credentialName", "encryptedData", "createdDate", "updatedDate") VALUES (uuid_generate_v4(), '${CREDENTIAL_NAME}', '${CREDENTIAL_TYPE}', '${escapedEncryptedData}', now(), now())`
            )

            // eslint-disable-next-line no-console
            console.log('✅ Evently API credential created successfully')
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error creating Evently API credential:', error)
            // Don't throw - allow migration to continue
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove Evently API credential if it exists
        await queryRunner.query(`DELETE FROM credential WHERE name = 'Evently API - Default' AND "credentialName" = 'eventlyApi'`)
    }
}
