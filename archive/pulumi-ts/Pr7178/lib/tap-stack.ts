/**
 * tap-stack.ts
 *
 * Cryptocurrency Price Alert System - Pulumi TypeScript Implementation
 *
 * This module defines the TapStack class, which creates a serverless
 * cryptocurrency price alert system with Lambda, DynamoDB, SNS, and EventBridge.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the cryptocurrency price alert system infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly webhookLambdaArn: pulumi.Output<string>;
  public readonly priceCheckLambdaArn: pulumi.Output<string>;
  public readonly alertsTableName: pulumi.Output<string>;
  public readonly alertTopicArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Environment: 'production',
      Service: 'price-alerts',
    };

    // Create SNS topic for price alerts with encryption
    const alertTopic = new aws.sns.Topic(
      `price-alert-topic-${environmentSuffix}`,
      {
        displayName: 'Cryptocurrency Price Alerts',
        kmsMasterKeyId: 'alias/aws/sns',
        tags: tags,
      },
      { parent: this }
    );

    // Create DynamoDB table for storing user alerts
    const alertsTable = new aws.dynamodb.Table(
      `alerts-table-${environmentSuffix}`,
      {
        name: `crypto-alerts-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'userId',
        rangeKey: 'alertId',
        attributes: [
          { name: 'userId', type: 'S' },
          { name: 'alertId', type: 'S' },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // Create IAM role for webhook processor Lambda
    const webhookLambdaRole = new aws.iam.Role(
      `webhook-lambda-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `webhook-lambda-basic-${environmentSuffix}`,
      {
        role: webhookLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy for tracing
    new aws.iam.RolePolicyAttachment(
      `webhook-lambda-xray-${environmentSuffix}`,
      {
        role: webhookLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Create inline policy for DynamoDB access
    new aws.iam.RolePolicy(
      `webhook-lambda-policy-${environmentSuffix}`,
      {
        role: webhookLambdaRole.id,
        policy: pulumi.all([alertsTable.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:UpdateItem',
                ],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create KMS key for Lambda environment variables encryption
    const lambdaKmsKey = new aws.kms.Key(
      `lambda-kms-key-${environmentSuffix}`,
      {
        description: 'KMS key for Lambda environment variables encryption',
        tags: tags,
      },
      { parent: this }
    );

    // Create webhook processor Lambda function
    const webhookLambda = new aws.lambda.Function(
      `webhook-processor-${environmentSuffix}`,
      {
        name: `webhook-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'webhook-handler.handler',
        role: webhookLambdaRole.arn,
        timeout: 30,
        memorySize: 1024,
        architectures: ['arm64'],
        code: new pulumi.asset.AssetArchive({
          'webhook-handler.js': new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda', 'webhook-handler.js')
          ),
        }),
        environment: {
          variables: {
            ALERTS_TABLE_NAME: alertsTable.name,
          },
        },
        kmsKeyArn: lambdaKmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this }
    );

    // Create IAM role for price check Lambda
    const priceCheckLambdaRole = new aws.iam.Role(
      `price-check-lambda-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach policies for price check Lambda
    new aws.iam.RolePolicyAttachment(
      `price-check-lambda-basic-${environmentSuffix}`,
      {
        role: priceCheckLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `price-check-lambda-xray-${environmentSuffix}`,
      {
        role: priceCheckLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Create inline policy for DynamoDB and SNS access
    new aws.iam.RolePolicy(
      `price-check-lambda-policy-${environmentSuffix}`,
      {
        role: priceCheckLambdaRole.id,
        policy: pulumi
          .all([alertsTable.arn, alertTopic.arn])
          .apply(([tableArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:Scan',
                    'dynamodb:Query',
                    'dynamodb:GetItem',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create price check Lambda function
    const priceCheckLambda = new aws.lambda.Function(
      `price-checker-${environmentSuffix}`,
      {
        name: `price-checker-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'price-checker.handler',
        role: priceCheckLambdaRole.arn,
        timeout: 60,
        memorySize: 512,
        architectures: ['arm64'],
        code: new pulumi.asset.AssetArchive({
          'price-checker.js': new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda', 'price-checker.js')
          ),
        }),
        environment: {
          variables: {
            ALERTS_TABLE_NAME: alertsTable.name,
            ALERT_TOPIC_ARN: alertTopic.arn,
          },
        },
        kmsKeyArn: lambdaKmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this }
    );

    // Create EventBridge rule to trigger price check every 5 minutes
    const priceCheckRule = new aws.cloudwatch.EventRule(
      `price-check-rule-${environmentSuffix}`,
      {
        name: `price-check-schedule-${environmentSuffix}`,
        description: 'Trigger price check Lambda every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: tags,
      },
      { parent: this }
    );

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(
      `price-check-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: priceCheckLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: priceCheckRule.arn,
      },
      { parent: this }
    );

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(
      `price-check-target-${environmentSuffix}`,
      {
        rule: priceCheckRule.name,
        arn: priceCheckLambda.arn,
      },
      { parent: this }
    );

    // Set outputs
    this.webhookLambdaArn = webhookLambda.arn;
    this.priceCheckLambdaArn = priceCheckLambda.arn;
    this.alertsTableName = alertsTable.name;
    this.alertTopicArn = alertTopic.arn;

    // Register the outputs of this component
    this.registerOutputs({
      webhookLambdaArn: this.webhookLambdaArn,
      priceCheckLambdaArn: this.priceCheckLambdaArn,
      alertsTableName: this.alertsTableName,
      alertTopicArn: this.alertTopicArn,
    });
  }
}
