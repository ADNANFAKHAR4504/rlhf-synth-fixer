import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly logsKmsKeyArn: pulumi.Output<string>;
  public readonly secretsKmsKeyArn: pulumi.Output<string>;
  public readonly s3KmsKeyArn: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly abacRoleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    const { environmentSuffix, vpcId, privateSubnetIds, tags } = args;

    // Get current AWS account and caller identity
    const current = aws.getCallerIdentity({});
    const region = aws.getRegion({});

    // KMS Key for CloudWatch Logs encryption
    const logsKmsKey = new aws.kms.Key(
      `logs-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: pulumi.all([current, region]).apply(([account, reg]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${account.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: `logs.${reg.name}.amazonaws.com`,
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${reg.name}:${account.accountId}:*`,
                  },
                },
              },
            ],
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `logs-kms-key-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `logs-kms-alias-${environmentSuffix}`,
      {
        name: `alias/logs-${environmentSuffix}`,
        targetKeyId: logsKmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for Secrets Manager encryption
    const secretsKmsKey = new aws.kms.Key(
      `secrets-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for Secrets Manager encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: current.then(account =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${account.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow Secrets Manager',
                Effect: 'Allow',
                Principal: {
                  Service: 'secretsmanager.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey',
                  'kms:CreateGrant',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `secrets-kms-key-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `secrets-kms-alias-${environmentSuffix}`,
      {
        name: `alias/secrets-${environmentSuffix}`,
        targetKeyId: secretsKmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for S3 encryption
    const s3KmsKey = new aws.kms.Key(
      `s3-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for S3 encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: pulumi.all([current, region]).apply(([account, _reg]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${account.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow VPC Flow Logs',
                Effect: 'Allow',
                Principal: {
                  Service: 'delivery.logs.amazonaws.com',
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `s3-kms-key-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `s3-kms-alias-${environmentSuffix}`,
      {
        name: `alias/s3-${environmentSuffix}`,
        targetKeyId: s3KmsKey.keyId,
      },
      { parent: this }
    );

    // IAM Role for Lambda rotation function
    const rotationLambdaRole = new aws.iam.Role(
      `rotation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `rotation-lambda-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `rotation-lambda-policy-${environmentSuffix}`,
      {
        role: rotationLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Inline policy for Secrets Manager and KMS access
    new aws.iam.RolePolicy(
      `rotation-lambda-secrets-policy-${environmentSuffix}`,
      {
        role: rotationLambdaRole.id,
        policy: pulumi.all([secretsKmsKey.arn]).apply(([kmsArn]) =>
          JSON.stringify({
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
                Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                Resource: kmsArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Security Group for Lambda rotation function
    const rotationLambdaSg = new aws.ec2.SecurityGroup(
      `rotation-lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Secrets Manager rotation Lambda',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `rotation-lambda-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Lambda function for Secrets Manager rotation
    const rotationLambda = new aws.lambda.Function(
      `rotation-lambda-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: rotationLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
// Secrets Manager rotation handler for Node.js 18+
// Uses AWS SDK v3
const { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand, UpdateSecretVersionStageCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const token = event.ClientRequestToken;
  const arn = event.SecretId;
  const step = event.Step;

  console.log(\`Rotation step: \${step} for secret: \${arn}\`);

  switch (step) {
    case 'createSecret':
      await createSecret(arn, token);
      break;
    case 'setSecret':
      await setSecret(arn, token);
      break;
    case 'testSecret':
      await testSecret(arn, token);
      break;
    case 'finishSecret':
      await finishSecret(arn, token);
      break;
    default:
      throw new Error(\`Invalid step: \${step}\`);
  }
};

async function createSecret(arn, token) {
  // Generate new credentials
  const newPassword = Math.random().toString(36).slice(-16);

  const command = new PutSecretValueCommand({
    SecretId: arn,
    ClientRequestToken: token,
    SecretString: JSON.stringify({
      username: 'dbadmin',
      password: newPassword,
    }),
    VersionStages: ['AWSPENDING'],
  });

  await client.send(command);
}

async function setSecret(arn, token) {
  // In production, update the actual database credentials here
  console.log('Setting new secret in target system');
}

async function testSecret(arn, token) {
  // In production, test the new credentials here
  console.log('Testing new secret');
}

async function finishSecret(arn, token) {
  const command = new UpdateSecretVersionStageCommand({
    SecretId: arn,
    VersionStage: 'AWSCURRENT',
    MoveToVersionId: token,
    RemoveFromVersionId: await getCurrentVersion(arn),
  });

  await client.send(command);
}

async function getCurrentVersion(arn) {
  const command = new GetSecretValueCommand({ SecretId: arn });
  const response = await client.send(command);
  return response.VersionId;
}
        `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'secrets-rotation',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-secrets-manager': '^3.0.0',
              },
            })
          ),
        }),
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [rotationLambdaSg.id],
        },
        timeout: 30,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `rotation-lambda-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Grant Secrets Manager permission to invoke Lambda
    new aws.lambda.Permission(
      `rotation-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: rotationLambda.name,
        principal: 'secretsmanager.amazonaws.com',
      },
      { parent: this }
    );

    // Create database secret with rotation
    const dbSecret = new aws.secretsmanager.Secret(
      `db-secret-${environmentSuffix}`,
      {
        description: 'Database credentials for payment processing',
        kmsKeyId: secretsKmsKey.keyId,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `db-secret-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Store initial secret value
    new aws.secretsmanager.SecretVersion(
      `db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: 'initial-password-change-me',
        }),
      },
      { parent: this }
    );

    // Configure automatic rotation every 30 days
    new aws.secretsmanager.SecretRotation(
      `db-secret-rotation-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        rotationLambdaArn: rotationLambda.arn,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      { parent: this, dependsOn: [rotationLambda] }
    );

    // IAM Role with ABAC using session tags
    const abacRole = new aws.iam.Role(
      `abac-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: {
                  'aws:RequestedRegion': 'us-east-1',
                },
              },
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `abac-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ABAC policy using session tags
    new aws.iam.RolePolicy(
      `abac-policy-${environmentSuffix}`,
      {
        role: abacRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'S3AccessBasedOnTags',
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject'],
              Resource: 'arn:aws:s3:::*/*',
              Condition: {
                StringEquals: {
                  'aws:PrincipalTag/Environment':
                    '${aws:RequestTag/Environment}',
                  'aws:PrincipalTag/DataClassification':
                    '${s3:ExistingObjectTag/DataClassification}',
                },
              },
            },
            {
              Sid: 'DynamoDBAccessBasedOnTags',
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
              ],
              Resource: 'arn:aws:dynamodb:*:*:table/*',
              Condition: {
                StringEquals: {
                  'aws:PrincipalTag/Environment':
                    '${dynamodb:LeadingKeys/Environment}',
                },
              },
            },
            {
              Sid: 'SecretsManagerAccessBasedOnTags',
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue'],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'aws:PrincipalTag/CostCenter':
                    '${secretsmanager:ResourceTag/CostCenter}',
                },
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Security Group for RDS PostgreSQL (if needed)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rdsSg = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for RDS PostgreSQL - port 5432 only',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow PostgreSQL from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `rds-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Export outputs
    this.logsKmsKeyArn = logsKmsKey.arn;
    this.secretsKmsKeyArn = secretsKmsKey.arn;
    this.s3KmsKeyArn = s3KmsKey.arn;
    this.secretArn = dbSecret.arn;
    this.abacRoleArn = abacRole.arn;

    this.registerOutputs({
      logsKmsKeyArn: this.logsKmsKeyArn,
      secretsKmsKeyArn: this.secretsKmsKeyArn,
      s3KmsKeyArn: this.s3KmsKeyArn,
      secretArn: this.secretArn,
      abacRoleArn: this.abacRoleArn,
    });
  }
}
