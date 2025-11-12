/**
 * lambda-stack.ts
 *
 * This module defines Lambda functions for payment processing with proper
 * IAM roles, security groups, and CloudWatch logging.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  dynamoTableName: pulumi.Input<string>;
  dynamoTableArn: pulumi.Input<string>;
  auditBucketName: pulumi.Input<string>;
  auditBucketArn: pulumi.Input<string>;
  snsTopicArn: pulumi.Input<string>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly validatorFunction: aws.lambda.Function;
  public readonly processorFunction: aws.lambda.Function;
  public readonly notifierFunction: aws.lambda.Function;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      vpcId,
      privateSubnetIds,
      dynamoTableName,
      dynamoTableArn,
      auditBucketName,
      auditBucketArn,
      snsTopicArn,
    } = args;

    // Create security group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for payment processing Lambda functions',
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-lambda-sg-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create IAM role for payment-validator Lambda
    const validatorRole = new aws.iam.Role(
      `payment-validator-role-${environmentSuffix}`,
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
        maxSessionDuration: 3600, // 1 hour
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-validator-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `payment-validator-vpc-policy-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for validator
    new aws.iam.RolePolicy(
      `payment-validator-inline-policy-${environmentSuffix}`,
      {
        role: validatorRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "dynamodb:GetItem",
              "dynamodb:Query"
            ],
            "Resource": "${dynamoTableArn}"
          },
          {
            "Effect": "Allow",
            "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for validator
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/payment-validator-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `/aws/lambda/payment-validator-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create payment-validator Lambda function
    this.validatorFunction = new aws.lambda.Function(
      `payment-validator-${environmentSuffix}`,
      {
        name: `payment-validator-${environmentSuffix}`,
        role: validatorRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.FileAsset(
            '../lambda-packages/payment-validator/index.js'
          ),
        }),
        environment: {
          variables: {
            DYNAMO_TABLE_NAME: dynamoTableName,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-validator-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this, dependsOn: [validatorLogGroup] }
    );

    // Create IAM role for payment-processor Lambda
    const processorRole = new aws.iam.Role(
      `payment-processor-role-${environmentSuffix}`,
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
        maxSessionDuration: 3600, // 1 hour
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-processor-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `payment-processor-vpc-policy-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for processor
    new aws.iam.RolePolicy(
      `payment-processor-inline-policy-${environmentSuffix}`,
      {
        role: processorRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "dynamodb:PutItem",
              "dynamodb:UpdateItem"
            ],
            "Resource": "${dynamoTableArn}"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject"
            ],
            "Resource": "${auditBucketArn}/*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for processor
    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/payment-processor-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `/aws/lambda/payment-processor-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create payment-processor Lambda function
    this.processorFunction = new aws.lambda.Function(
      `payment-processor-${environmentSuffix}`,
      {
        name: `payment-processor-${environmentSuffix}`,
        role: processorRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.FileAsset(
            '../lambda-packages/payment-processor/index.js'
          ),
        }),
        environment: {
          variables: {
            DYNAMO_TABLE_NAME: dynamoTableName,
            AUDIT_BUCKET_NAME: auditBucketName,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-processor-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this, dependsOn: [processorLogGroup] }
    );

    // Create IAM role for payment-notifier Lambda
    const notifierRole = new aws.iam.Role(
      `payment-notifier-role-${environmentSuffix}`,
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
        maxSessionDuration: 3600, // 1 hour
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-notifier-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `payment-notifier-vpc-policy-${environmentSuffix}`,
      {
        role: notifierRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for notifier
    new aws.iam.RolePolicy(
      `payment-notifier-inline-policy-${environmentSuffix}`,
      {
        role: notifierRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "sns:Publish"
            ],
            "Resource": "${snsTopicArn}"
          },
          {
            "Effect": "Allow",
            "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for notifier
    const notifierLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/payment-notifier-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `/aws/lambda/payment-notifier-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create payment-notifier Lambda function
    this.notifierFunction = new aws.lambda.Function(
      `payment-notifier-${environmentSuffix}`,
      {
        name: `payment-notifier-${environmentSuffix}`,
        role: notifierRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.FileAsset(
            '../lambda-packages/payment-notifier/index.js'
          ),
        }),
        environment: {
          variables: {
            SNS_TOPIC_ARN: snsTopicArn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-notifier-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this, dependsOn: [notifierLogGroup] }
    );

    // Create CloudWatch alarms for Lambda errors
    [
      this.validatorFunction,
      this.processorFunction,
      this.notifierFunction,
    ].forEach((fn, idx) => {
      const functionNames = ['validator', 'processor', 'notifier'];
      const functionName = functionNames[idx];

      new aws.cloudwatch.MetricAlarm(
        `payment-${functionName}-error-alarm-${environmentSuffix}`,
        {
          name: `payment-${functionName}-errors-${environmentSuffix}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'Errors',
          namespace: 'AWS/Lambda',
          period: 60,
          statistic: 'Sum',
          threshold: 1,
          actionsEnabled: true,
          alarmActions: [snsTopicArn],
          dimensions: {
            FunctionName: fn.name,
          },
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-${functionName}-error-alarm-${environmentSuffix}`,
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      validatorFunctionArn: this.validatorFunction.arn,
      processorFunctionArn: this.processorFunction.arn,
      notifierFunctionArn: this.notifierFunction.arn,
    });
  }
}
