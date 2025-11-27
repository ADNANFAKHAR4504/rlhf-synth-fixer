/**
 * lambda-stack.ts
 *
 * Defines Lambda function for blue-green deployment orchestration.
 *
 * Features:
 * - Lambda function with X-Ray active tracing
 * - IAM role with ECS, Secrets Manager, X-Ray permissions
 * - Environment variables for ECS cluster/service references
 * - CloudWatch Logs integration
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  clusterName: pulumi.Input<string>;
  serviceName?: pulumi.Input<string>;
  deploymentSecretArn: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly deployFunction: aws.lambda.Function;
  public readonly deployFunctionRole: aws.iam.Role;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const {
      environmentSuffix,
      clusterName,
      serviceName,
      deploymentSecretArn,
      kmsKeyArn,
      tags,
    } = args;

    // Lambda execution role
    this.deployFunctionRole = new aws.iam.Role(
      `deploy-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: {
          ...tags,
          Name: `deploy-lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `deploy-lambda-policy-${environmentSuffix}`,
      {
        role: this.deployFunctionRole.id,
        policy: pulumi
          .all([deploymentSecretArn, kmsKeyArn])
          .apply(([secretArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'ecs:UpdateService',
                    'ecs:DescribeServices',
                    'ecs:DescribeTasks',
                    'ecs:ListTasks',
                    'ecs:RegisterTaskDefinition',
                    'ecs:DescribeTaskDefinition',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: secretArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'codepipeline:PutJobSuccessResult',
                    'codepipeline:PutJobFailureResult',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lambda function code
    const lambdaCode = `const { ECSClient, UpdateServiceCommand, DescribeServicesCommand } = require('@aws-sdk/client-ecs');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { CodePipelineClient, PutJobSuccessResultCommand, PutJobFailureResult Command } = require('@aws-sdk/client-codepipeline');

const ecs = new ECSClient({ region: process.env.AWS_REGION });
const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION });
const codepipeline = new CodePipelineClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  const jobId = event['CodePipeline.job']?.id;

  try {
    // Fetch deployment config from Secrets Manager
    const secretResponse = await secrets.send(new GetSecretValueCommand({
      SecretId: process.env.SECRET_ARN,
    }));
    const config = JSON.parse(secretResponse.SecretString);

    // Update ECS service (blue-green deployment)
    const updateCommand = new UpdateServiceCommand({
      cluster: config.ecsCluster,
      service: config.ecsService,
      forceNewDeployment: true,
    });

    const result = await ecs.send(updateCommand);
    console.log('ECS Update Result:', result);

    // Notify CodePipeline of success
    if (jobId) {
      await codepipeline.send(new PutJobSuccessResultCommand({ jobId }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Deployment successful' }),
    };
  } catch (error) {
    console.error('Error:', error);

    // Notify CodePipeline of failure
    if (jobId) {
      await codepipeline.send(new PutJobFailureResultCommand({
        jobId,
        failureDetails: {
          message: error.message,
          type: 'JobFailed',
        },
      }));
    }

    throw error;
  }
};`;

    // Create Lambda function
    this.deployFunction = new aws.lambda.Function(
      `deploy-orchestrator-${environmentSuffix}`,
      {
        name: `deploy-orchestrator-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: this.deployFunctionRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              dependencies: {
                '@aws-sdk/client-ecs': '^3.0.0',
                '@aws-sdk/client-secretsmanager': '^3.0.0',
                '@aws-sdk/client-codepipeline': '^3.0.0',
              },
            })
          ),
        }),
        timeout: 300,
        memorySize: 256,
        tracingConfig: {
          mode: 'Active', // Enable X-Ray tracing
        },
        environment: {
          variables: {
            CLUSTER_NAME: clusterName,
            SERVICE_NAME: serviceName || 'cicd-service',
            SECRET_ARN: deploymentSecretArn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
            AWS_XRAY_TRACING_NAME: `deploy-orchestrator-${environmentSuffix}`,
          },
        },
        tags: {
          ...tags,
          Name: `deploy-orchestrator-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      deployFunctionName: this.deployFunction.name,
      deployFunctionArn: this.deployFunction.arn,
    });
  }
}
