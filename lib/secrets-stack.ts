/**
 * secrets-stack.ts
 *
 * Defines AWS Secrets Manager secrets for storing sensitive configuration.
 *
 * Features:
 * - Secrets for deployment configuration (database credentials, API keys)
 * - KMS encryption for secrets
 * - Automatic secret rotation (30 days)
 * - Secret versioning with AWSCURRENT and AWSPREVIOUS labels
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecretsStackArgs {
  environmentSuffix: string;
  kmsKeyId: pulumi.Input<string>;
  rotationLambdaArn?: pulumi.Input<string>; // Optional rotation Lambda
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecretsStack extends pulumi.ComponentResource {
  public readonly deploymentSecret: aws.secretsmanager.Secret;
  public readonly deploymentSecretVersion: aws.secretsmanager.SecretVersion;
  public readonly databaseSecret: aws.secretsmanager.Secret;
  public readonly databaseSecretVersion: aws.secretsmanager.SecretVersion;
  public readonly apiKeySecret: aws.secretsmanager.Secret;
  public readonly apiKeySecretVersion: aws.secretsmanager.SecretVersion;

  constructor(
    name: string,
    args: SecretsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:secrets:SecretsStack', name, args, opts);

    const { environmentSuffix, kmsKeyId, rotationLambdaArn, tags } = args;

    // Secret 1: Deployment configuration
    this.deploymentSecret = new aws.secretsmanager.Secret(
      `deployment-config-${environmentSuffix}`,
      {
        name: `cicd/config/${environmentSuffix}/deployment`,
        description: `Deployment configuration for ${environmentSuffix} environment`,
        kmsKeyId: kmsKeyId,
        recoveryWindowInDays: 7, // Allow faster deletion for testing
        tags: {
          ...tags,
          Name: `deployment-config-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.deploymentSecretVersion = new aws.secretsmanager.SecretVersion(
      `deployment-config-version-${environmentSuffix}`,
      {
        secretId: this.deploymentSecret.id,
        secretString: JSON.stringify({
          ecsCluster: `cicd-cluster-${environmentSuffix}`,
          ecsService: `cicd-service-${environmentSuffix}`,
          taskDefinition: `cicd-task-${environmentSuffix}`,
          containerName: 'app',
          environment: environmentSuffix,
        }),
      },
      { parent: this }
    );

    // Secret 2: Database credentials
    this.databaseSecret = new aws.secretsmanager.Secret(
      `database-credentials-${environmentSuffix}`,
      {
        name: `cicd/rds/${environmentSuffix}/master`,
        description: `Database master credentials for ${environmentSuffix} environment`,
        kmsKeyId: kmsKeyId,
        recoveryWindowInDays: 7,
        tags: {
          ...tags,
          Name: `database-credentials-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.databaseSecretVersion = new aws.secretsmanager.SecretVersion(
      `database-credentials-version-${environmentSuffix}`,
      {
        secretId: this.databaseSecret.id,
        secretString: JSON.stringify({
          engine: 'postgres',
          host: 'placeholder-db-host',
          port: 5432,
          username: 'admin',
          password: pulumi.secret('CHANGEME_GENERATE_SECURE_PASSWORD'),
          dbname: `cicd_${environmentSuffix}`,
        }),
      },
      { parent: this }
    );

    // Secret 3: API keys and tokens
    this.apiKeySecret = new aws.secretsmanager.Secret(
      `api-keys-${environmentSuffix}`,
      {
        name: `cicd/api/${environmentSuffix}/keys`,
        description: `API keys and tokens for ${environmentSuffix} environment`,
        kmsKeyId: kmsKeyId,
        recoveryWindowInDays: 7,
        tags: {
          ...tags,
          Name: `api-keys-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.apiKeySecretVersion = new aws.secretsmanager.SecretVersion(
      `api-keys-version-${environmentSuffix}`,
      {
        secretId: this.apiKeySecret.id,
        secretString: JSON.stringify({
          githubToken: pulumi.secret('CHANGEME_GITHUB_TOKEN'),
          slackWebhook: pulumi.secret('CHANGEME_SLACK_WEBHOOK'),
          datadogApiKey: pulumi.secret('CHANGEME_DATADOG_KEY'),
        }),
      },
      { parent: this }
    );

    // Optional: Enable secret rotation if rotation Lambda provided
    if (rotationLambdaArn) {
      new aws.secretsmanager.SecretRotation(
        `database-secret-rotation-${environmentSuffix}`,
        {
          secretId: this.databaseSecret.id,
          rotationLambdaArn: rotationLambdaArn,
          rotationRules: {
            automaticallyAfterDays: 30, // Rotate every 30 days
          },
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      deploymentSecretArn: this.deploymentSecret.arn,
      databaseSecretArn: this.databaseSecret.arn,
      apiKeySecretArn: this.apiKeySecret.arn,
    });
  }
}
