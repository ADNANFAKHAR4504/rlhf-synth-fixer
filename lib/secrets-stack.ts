/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */


/**
 * secrets-stack.ts
 *
 * Creates AWS Secrets Manager secrets for database credentials and API keys.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecretsStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecretsStack extends pulumi.ComponentResource {
  public readonly dbSecretArn: pulumi.Output<string>;
  public readonly apiKeySecretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecretsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:secrets:SecretsStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create secret for database credentials
    const dbSecret = new aws.secretsmanager.Secret(
      `db-credentials-${environmentSuffix}`,
      {
        name: `db-credentials-${environmentSuffix}`,
        description: 'Database credentials for RDS PostgreSQL',
        tags: {
          Name: `db-credentials-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create initial secret version with placeholder values
    new aws.secretsmanager.SecretVersion(
      `db-credentials-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: pulumi.secret('changeme123!'),
          engine: 'postgres',
          host: 'placeholder.rds.amazonaws.com',
          port: 5432,
          dbname: 'appdb',
        }),
      },
      { parent: this }
    );

    // Create secret for API keys
    const apiKeySecret = new aws.secretsmanager.Secret(
      `api-keys-${environmentSuffix}`,
      {
        name: `api-keys-${environmentSuffix}`,
        description: 'API keys for external services',
        tags: {
          Name: `api-keys-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create initial secret version with placeholder values
    new aws.secretsmanager.SecretVersion(
      `api-keys-version-${environmentSuffix}`,
      {
        secretId: apiKeySecret.id,
        secretString: JSON.stringify({
          externalApiKey: pulumi.secret('placeholder-api-key'),
          jwtSecret: pulumi.secret('placeholder-jwt-secret'),
        }),
      },
      { parent: this }
    );

    // Expose outputs
    this.dbSecretArn = dbSecret.arn;
    this.apiKeySecretArn = apiKeySecret.arn;

    this.registerOutputs({
      dbSecretArn: this.dbSecretArn,
      apiKeySecretArn: this.apiKeySecretArn,
    });
  }
}
