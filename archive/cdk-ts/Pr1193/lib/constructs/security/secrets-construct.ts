import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SecurityConfig } from '../../config/security-config';

/**
 * Secrets Manager Construct for secure storage and retrieval of sensitive data
 * All secrets are encrypted using customer-managed KMS keys
 */
export class SecretsConstruct extends Construct {
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly apiKeySecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, encryptionKey: kms.Key) {
    super(scope, id);

    // Database credentials secret
    this.databaseSecret = new secretsmanager.Secret(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Database-Secret`,
      {
        secretName: `${SecurityConfig.RESOURCE_PREFIX}-database-credentials`,
        description: 'Database credentials for the application',
        encryptionKey: encryptionKey,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: 'admin',
          }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
          passwordLength: 32,
        },
      }
    );

    // API Key secret
    this.apiKeySecret = new secretsmanager.Secret(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-API-Key-Secret`,
      {
        secretName: `${SecurityConfig.RESOURCE_PREFIX}-api-key`,
        description: 'API key for external service integration',
        encryptionKey: encryptionKey,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            service: 'external-api',
          }),
          generateStringKey: 'apiKey',
          excludeCharacters: '"@/\\',
          passwordLength: 64,
        },
      }
    );
  }
}
