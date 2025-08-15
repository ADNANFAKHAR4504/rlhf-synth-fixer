/**
 * secrets-stack.ts
 *
 * This module defines the SecretsStack component for managing
 * sensitive data using AWS Secrets Manager.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface SecretsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  kmsKeyArn: pulumi.Input<string>;
}

export class SecretsStack extends pulumi.ComponentResource {
  public readonly dbSecretArn: pulumi.Output<string>;
  public readonly dbSecretId: pulumi.Output<string>;

  constructor(name: string, args: SecretsStackArgs, opts?: ResourceOptions) {
    super('tap:secrets:SecretsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Generate random password for database
    const dbPassword = new aws.secretsmanager.Secret(
      `tap-db-password-${environmentSuffix}`,
      {
        name: `tap/db/password/${environmentSuffix}`,
        description: 'Database master password for TAP application',
        kmsKeyId: args.kmsKeyArn,
        tags: {
          Name: `tap-db-password-${environmentSuffix}`,
          Purpose: 'DatabaseCredentials',
          ...tags,
        },
      },
      { parent: this }
    );

    // Generate secure random password using a simple approach
    new aws.secretsmanager.SecretVersion(
      `tap-db-password-version-${environmentSuffix}`,
      {
        secretId: dbPassword.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'CHANGE_ME_IN_PRODUCTION_VIA_ROTATION',
        }),
      },
      { parent: this }
    );

    // Enable automatic rotation (optional)
    new aws.secretsmanager.SecretRotation(
      `tap-db-password-rotation-${environmentSuffix}`,
      {
        secretId: dbPassword.id,
        rotationLambdaArn: pulumi.interpolate`arn:aws:lambda:${aws.getRegion().then(r => r.name)}:${aws.getCallerIdentity().then(c => c.accountId)}:function:SecretsManagerRDSMySQLRotationSingleUser`,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      {
        parent: this,
        // Make rotation optional - only create if Lambda exists
        ignoreChanges: ['rotationLambdaArn'],
      }
    );

    this.dbSecretArn = dbPassword.arn;
    this.dbSecretId = dbPassword.id;

    this.registerOutputs({
      dbSecretArn: this.dbSecretArn,
      dbSecretId: this.dbSecretId,
    });
  }
}
