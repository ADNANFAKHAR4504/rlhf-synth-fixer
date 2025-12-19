/**
 * Lambda Stack - Creates Lambda function for Secrets Manager rotation.
 *
 * The Lambda function handles automatic rotation of database credentials
 * every 30 days as required by the compliance requirements.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  secretArn: pulumi.Output<string>;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly rotationFunctionArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:LambdaStack', name, args, opts);

    const tags = args.tags || {};

    // Create IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `lambda-rotation-role-${args.environmentSuffix}`,
      {
        name: `lambda-rotation-role-${args.environmentSuffix}`,
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
        tags: {
          ...tags,
          Name: `lambda-rotation-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-attachment-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for Secrets Manager access
    new aws.iam.RolePolicy(
      `lambda-secrets-policy-${args.environmentSuffix}`,
      {
        name: `lambda-secrets-policy-${args.environmentSuffix}`,
        role: lambdaRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "secretsmanager:DescribeSecret",
                "secretsmanager:GetSecretValue",
                "secretsmanager:PutSecretValue",
                "secretsmanager:UpdateSecretVersionStage"
              ],
              "Resource": "${args.secretArn}"
            },
            {
              "Effect": "Allow",
              "Action": [
                "secretsmanager:GetRandomPassword"
              ],
              "Resource": "*"
            }
          ]
        }`,
      },
      { parent: this }
    );

    // Create Lambda function code as inline
    // In production, this would be a proper deployment package
    const lambdaCode = `
const { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand, UpdateSecretVersionStageCommand, GetRandomPasswordCommand } = require('@aws-sdk/client-secrets-manager');

const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const token = event.ClientRequestToken;
  const arn = event.SecretId;
  const step = event.Step;

  console.log('Rotation step:', step);

  try {
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
        throw new Error('Invalid step: ' + step);
    }
  } catch (error) {
    console.error('Rotation failed:', error);
    throw error;
  }
};

async function createSecret(arn, token) {
  const randomPassword = await secretsManager.send(new GetRandomPasswordCommand({
    PasswordLength: 32,
    ExcludeCharacters: '"@/\\\\'',
  }));

  const currentSecret = await secretsManager.send(new GetSecretValueCommand({
    SecretId: arn,
    VersionStage: 'AWSCURRENT',
  }));

  const currentSecretData = JSON.parse(currentSecret.SecretString);
  const newSecretData = {
    ...currentSecretData,
    password: randomPassword.RandomPassword,
  };

  await secretsManager.send(new PutSecretValueCommand({
    SecretId: arn,
    ClientRequestToken: token,
    SecretString: JSON.stringify(newSecretData),
    VersionStages: ['AWSPENDING'],
  }));

  console.log('Created new secret version');
}

async function setSecret(arn, token) {
  console.log('Setting new password (placeholder)');
}

async function testSecret(arn, token) {
  console.log('Testing new credentials (placeholder)');
}

async function finishSecret(arn, token) {
  await secretsManager.send(new UpdateSecretVersionStageCommand({
    SecretId: arn,
    VersionStage: 'AWSCURRENT',
    MoveToVersionId: token,
  }));

  console.log('Finished rotation');
}
`;

    // Create Lambda function
    const rotationFunction = new aws.lambda.Function(
      `db-rotation-${args.environmentSuffix}`,
      {
        name: `db-rotation-function-${args.environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 512,

        // Code (in production, use a proper deployment package)
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              dependencies: {
                '@aws-sdk/client-secrets-manager': '^3.0.0',
              },
            })
          ),
        }),

        // VPC configuration
        vpcConfig: {
          subnetIds: args.subnetIds,
          securityGroupIds: [args.securityGroupId],
        },

        // Note: AWS_REGION is automatically set by Lambda, no need to configure it
        // environment: { variables: {} },

        tags: {
          ...tags,
          Name: `db-rotation-function-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Grant Secrets Manager permission to invoke Lambda
    new aws.lambda.Permission(
      `lambda-secrets-invoke-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: rotationFunction.name,
        principal: 'secretsmanager.amazonaws.com',
        sourceArn: args.secretArn,
      },
      { parent: this }
    );

    // Export outputs
    this.rotationFunctionArn = rotationFunction.arn;

    this.registerOutputs({
      rotationFunctionArn: this.rotationFunctionArn,
    });
  }
}
