import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Construct } from 'constructs';
import * as crypto from 'crypto';

export interface SecretsStackProps {
  environmentSuffix: string;
  kmsKey: KmsKey;
}

export class SecretsStack extends Construct {
  public readonly dbSecret: SecretsmanagerSecret;
  public readonly dbUsername: string;
  public readonly dbPassword: string;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id);

    const { environmentSuffix, kmsKey } = props;

    // Generate random credentials
    this.dbUsername = 'assessmentadmin';
    this.dbPassword = this.generatePassword();

    // Create Secrets Manager secret for database credentials
    this.dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `assessment-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for assessment system',
      kmsKeyId: kmsKey.id,
      tags: {
        Name: `assessment-db-secret-${environmentSuffix}`,
      },
    });

    // Store initial secret value
    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: this.dbSecret.id,
      secretString: JSON.stringify({
        username: this.dbUsername,
        password: this.dbPassword,
      }),
    });

    // Note: Automatic rotation requires a Lambda function
    // For production, implement SecretsmanagerSecretRotation with a rotation Lambda
    // This is omitted here to keep the example focused on core infrastructure
  }

  private generatePassword(): string {
    return crypto.randomBytes(32).toString('base64').slice(0, 32);
  }
}
