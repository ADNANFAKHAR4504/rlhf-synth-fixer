import { Construct } from 'constructs';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

interface SecurityModuleProps {
  environmentSuffix: string;
}

export class SecurityModule extends Construct {
  public readonly dbSecretArn: string;
  public readonly apiSecretArn: string;
  public readonly kmsKeyId: string;
  public readonly kmsKeyArn: string;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create KMS key for encryption
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `KMS key for manufacturing data pipeline ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: {
        Name: `manufacturing-kms-key-${environmentSuffix}`,
      },
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/manufacturing-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    });

    // Create secret for database credentials
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `manufacturing-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for Aurora PostgreSQL',
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `manufacturing-db-secret-${environmentSuffix}`,
      },
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'dbadmin',
        password: 'ChangeMe123!',
        engine: 'postgres',
        host: 'placeholder',
        port: 5432,
        dbname: 'manufacturing',
      }),
    });

    // Create secret for API keys
    const apiSecret = new SecretsmanagerSecret(this, 'api-secret', {
      name: `manufacturing-api-keys-${environmentSuffix}`,
      description: 'API keys for external integrations',
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `manufacturing-api-secret-${environmentSuffix}`,
      },
    });

    new SecretsmanagerSecretVersion(this, 'api-secret-version', {
      secretId: apiSecret.id,
      secretString: JSON.stringify({
        apiKey: 'placeholder-api-key',
        apiSecret: 'placeholder-api-secret',
      }),
    });

    this.dbSecretArn = dbSecret.arn;
    this.apiSecretArn = apiSecret.arn;
    this.kmsKeyId = kmsKey.id;
    this.kmsKeyArn = kmsKey.arn;
  }
}
