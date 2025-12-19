/**
 * secrets.ts
 *
 * Secrets Manager component with automatic rotation
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecretsComponentArgs {
  environmentSuffix: string;
  environment: string;
  rotationDays: number;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecretsComponent extends pulumi.ComponentResource {
  public readonly databaseSecretArn: pulumi.Output<string>;
  public readonly masterSecretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecretsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:Secrets', name, args, opts);

    const { environmentSuffix, environment, rotationDays, tags } = args;

    // Create IAM role for rotation Lambda
    const rotationRole = new aws.iam.Role(
      `secret-rotation-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        inlinePolicies: [
          {
            name: 'secret-rotation-policy',
            policy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:DescribeSecret',
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:PutSecretValue',
                    'secretsmanager:UpdateSecretVersionStage',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: 'secretsmanager:GetRandomPassword',
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: 'arn:aws:logs:*:*:*',
                },
              ],
            }),
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Create master secret for initial password
    const masterSecret = new aws.secretsmanager.Secret(
      `db-master-secret-${environmentSuffix}`,
      {
        name: `${environment}-db-master-${environmentSuffix}`,
        description: `Master database credentials for ${environment}`,
        recoveryWindowInDays: 0,
        tags: tags,
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `db-master-secret-version-${environmentSuffix}`,
      {
        secretId: masterSecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: 'TemporaryPassword123!',
          engine: 'postgres',
          port: 5432,
        }),
      },
      { parent: this }
    );

    // Create database secret with rotation
    const databaseSecret = new aws.secretsmanager.Secret(
      `db-secret-${environmentSuffix}`,
      {
        name: `${environment}-db-credentials-${environmentSuffix}`,
        description: `Database credentials for ${environment} with automatic rotation`,
        recoveryWindowInDays: 0,
        tags: tags,
      },
      { parent: this }
    );

    const databaseSecretVersion = new aws.secretsmanager.SecretVersion(
      `db-secret-version-${environmentSuffix}`,
      {
        secretId: databaseSecret.id,
        secretString: JSON.stringify({
          username: 'appuser',
          password: 'InitialPassword123!',
          engine: 'postgres',
          port: 5432,
        }),
      },
      { parent: this }
    );

    // Create rotation Lambda
    const rotationLambda = new aws.lambda.Function(
      `secret-rotation-lambda-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: rotationRole.arn,
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Rotation event:', JSON.stringify(event));
  const step = event.Step;
  const token = event.Token;
  const secretId = event.SecretId;

  // Implement rotation logic here
  // For demo purposes, this is a placeholder

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Rotation completed' }),
  };
};
        `),
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Grant Lambda permission to be invoked by Secrets Manager
    const lambdaPermission = new aws.lambda.Permission(
      `secret-rotation-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: rotationLambda.name,
        principal: 'secretsmanager.amazonaws.com',
      },
      { parent: this }
    );

    // Configure rotation
    new aws.secretsmanager.SecretRotation(
      `db-secret-rotation-${environmentSuffix}`,
      {
        secretId: databaseSecret.id,
        rotationLambdaArn: rotationLambda.arn,
        rotationRules: {
          automaticallyAfterDays: rotationDays,
        },
      },
      {
        parent: this,
        dependsOn: [lambdaPermission, databaseSecretVersion],
      }
    );

    this.databaseSecretArn = databaseSecret.arn;
    this.masterSecretArn = masterSecret.arn;

    this.registerOutputs({
      databaseSecretArn: this.databaseSecretArn,
      masterSecretArn: this.masterSecretArn,
    });
  }
}
