/**
 * Secrets Stack - Manages database credentials with automatic rotation.
 *
 * Features:
 * - KMS customer-managed key for encryption
 * - Secrets Manager secret for database credentials
 * - 30-day automatic rotation schedule
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface SecretsStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecretsStack extends pulumi.ComponentResource {
  public readonly secretArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  private secret: aws.secretsmanager.Secret;

  constructor(
    name: string,
    args: SecretsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:SecretsStack', name, args, opts);

    const tags = args.tags || {};

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `db-encryption-key-${args.environmentSuffix}`,
      {
        description: `KMS key for database encryption - ${args.environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
        tags: {
          ...tags,
          Name: `db-encryption-key-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS key alias
    new aws.kms.Alias(
      `db-key-alias-${args.environmentSuffix}`,
      {
        name: `alias/db-migration-${args.environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Generate secure random password using Pulumi random provider
    const dbPassword = new random.RandomPassword(
      `db-password-${args.environmentSuffix}`,
      {
        length: 32,
        special: true,
        overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      },
      { parent: this }
    );

    // Create Secrets Manager secret for database credentials
    this.secret = new aws.secretsmanager.Secret(
      `db-credentials-${args.environmentSuffix}`,
      {
        name: `db-credentials-${args.environmentSuffix}`,
        description: 'Database credentials for PostgreSQL migration',
        kmsKeyId: kmsKey.id,
        tags: {
          ...tags,
          Name: `db-credentials-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create initial secret version with generated password
    new aws.secretsmanager.SecretVersion(
      `db-credentials-version-${args.environmentSuffix}`,
      {
        secretId: this.secret.id,
        secretString: pulumi.interpolate`{
          "username": "dbadmin",
          "password": "${dbPassword.result}",
          "engine": "postgres",
          "host": "placeholder",
          "port": 5432,
          "dbname": "migrationdb"
        }`,
      },
      { parent: this }
    );

    // Export outputs
    this.secretArn = this.secret.arn;
    // Use ARN for RDS kmsKeyId which requires an ARN format
    this.kmsKeyId = kmsKey.arn;

    this.registerOutputs({
      secretArn: this.secretArn,
      kmsKeyId: this.kmsKeyId,
    });
  }

  // Method to configure rotation after Lambda function is created
  public configureRotation(lambdaArn: pulumi.Output<string>): void {
    new aws.secretsmanager.SecretRotation(
      `db-rotation-${this.secret.name}`,
      {
        secretId: this.secret.id,
        rotationLambdaArn: lambdaArn,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      { parent: this }
    );
  }
}
