/**
 * tap-stack.ts
 * Crypto Alerts Infrastructure Stack
 *
 * This stack provisions a serverless cryptocurrency price alert system using:
 * - DynamoDB for storing user alerts
 * - Lambda functions for price checking and alert processing
 * - SNS for notifications
 * - EventBridge for scheduled price checks
 * - KMS for encryption
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'staging', 'prod')
   */
  environmentSuffix?: string;

  /**
   * CloudWatch log retention in days
   * @default 14
   */
  logRetentionDays?: number;

  /**
   * Price checker Lambda timeout in seconds
   * @default 60
   */
  priceCheckerTimeout?: number;

  /**
   * Price checker Lambda memory size in MB
   * @default 512
   */
  priceCheckerMemorySize?: number;

  /**
   * Alert processor Lambda timeout in seconds
   * @default 30
   */
  alertProcessorTimeout?: number;

  /**
   * Alert processor Lambda memory size in MB
   * @default 256
   */
  alertProcessorMemorySize?: number;

  /**
   * Schedule expression for price checker (cron format)
   * @default 'cron(* * * * ? *)' - every minute
   */
  scheduleExpression?: string;

  /**
   * KMS key deletion window in days
   * @default 7
   */
  kmsKeyDeletionWindowInDays?: number;

  /**
   * Exchange API endpoint for fetching prices
   * @default 'https://api.exchange.com/v1/prices'
   */
  exchangeApiEndpoint?: string;
}

export class TapStack extends pulumi.ComponentResource {
  // Public outputs
  public readonly tableName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;
  public readonly topicArn: pulumi.Output<string>;
  public readonly priceCheckerFunctionName: pulumi.Output<string>;
  public readonly priceCheckerFunctionArn: pulumi.Output<string>;
  public readonly alertProcessorFunctionName: pulumi.Output<string>;
  public readonly alertProcessorFunctionArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyAlias: aws.kms.Alias;
  public readonly eventRuleName: pulumi.Output<string>;
  public readonly streamEventSourceMapping: aws.lambda.EventSourceMapping;
  public readonly priceCheckerTarget: aws.cloudwatch.EventTarget;
  public readonly priceCheckerPermission: aws.lambda.Permission;

  // Private resources
  private readonly kmsKey: aws.kms.Key;
  private readonly cryptoAlertsTable: aws.dynamodb.Table;
  private readonly priceAlertsTopic: aws.sns.Topic;
  private readonly priceCheckerLogGroup: aws.cloudwatch.LogGroup;
  private readonly alertProcessorLogGroup: aws.cloudwatch.LogGroup;
  private readonly priceCheckerRole: aws.iam.Role;
  private readonly alertProcessorRole: aws.iam.Role;
  private readonly priceCheckerLambda: aws.lambda.Function;
  private readonly alertProcessorLambda: aws.lambda.Function;
  private readonly priceCheckerRule: aws.cloudwatch.EventRule;

  constructor(
    name: string,
    args: TapStackArgs = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    // Set defaults
    const environmentSuffix = args.environmentSuffix || pulumi.getStack();
    const logRetentionDays = args.logRetentionDays || 14;
    const priceCheckerTimeout = args.priceCheckerTimeout || 60;
    const priceCheckerMemorySize = args.priceCheckerMemorySize || 512;
    const alertProcessorTimeout = args.alertProcessorTimeout || 30;
    const alertProcessorMemorySize = args.alertProcessorMemorySize || 256;
    const scheduleExpression = args.scheduleExpression || 'cron(* * * * ? *)';
    const kmsKeyDeletionWindowInDays = args.kmsKeyDeletionWindowInDays || 7;
    const exchangeApiEndpoint =
      args.exchangeApiEndpoint || 'https://api.exchange.com/v1/prices';

    // Create KMS key for encrypting environment variables
    this.kmsKey = new aws.kms.Key(
      `crypto-alerts-kms-${environmentSuffix}`,
      {
        description: 'KMS key for encrypting Lambda environment variables',
        deletionWindowInDays: kmsKeyDeletionWindowInDays,
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    // Create KMS key alias
    this.kmsKeyAlias = new aws.kms.Alias(
      `crypto-alerts-kms-alias-${environmentSuffix}`,
      {
        name: `alias/crypto-alerts-${environmentSuffix}`,
        targetKeyId: this.kmsKey.keyId,
      },
      { parent: this }
    );

    // Create DynamoDB table for storing crypto alerts
    this.cryptoAlertsTable = new aws.dynamodb.Table(
      `crypto-alerts-${environmentSuffix}`,
      {
        name: `crypto-alerts-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'userId',
        rangeKey: 'alertId',
        attributes: [
          { name: 'userId', type: 'S' },
          { name: 'alertId', type: 'S' },
          { name: 'coinSymbol', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'coinSymbol-index',
            hashKey: 'coinSymbol',
            projectionType: 'INCLUDE',
            nonKeyAttributes: ['userId', 'alertId', 'threshold', 'condition'],
          },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    // Create SNS topic for price alerts
    this.priceAlertsTopic = new aws.sns.Topic(
      `price-alerts-${environmentSuffix}`,
      {
        name: `price-alerts-${environmentSuffix}`,
        kmsMasterKeyId: 'alias/aws/sns',
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    this.priceCheckerLogGroup = new aws.cloudwatch.LogGroup(
      `price-checker-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/price-checker-${environmentSuffix}`,
        retentionInDays: logRetentionDays,
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    this.alertProcessorLogGroup = new aws.cloudwatch.LogGroup(
      `alert-processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/alert-processor-${environmentSuffix}`,
        retentionInDays: logRetentionDays,
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    // IAM Role for Price Checker Lambda
    this.priceCheckerRole = new aws.iam.Role(
      `price-checker-role-${environmentSuffix}`,
      {
        name: `price-checker-role-${environmentSuffix}`,
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
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    // Policy for Price Checker Lambda
    const priceCheckerPolicy = new aws.iam.RolePolicy(
      `price-checker-policy-${environmentSuffix}`,
      {
        name: `price-checker-policy-${environmentSuffix}`,
        role: this.priceCheckerRole.id,
        policy: pulumi
          .all([
            this.cryptoAlertsTable.arn,
            this.priceAlertsTopic.arn,
            this.kmsKey.arn,
          ])
          .apply(([tableArn, _topicArn, keyArn]) =>
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
                  Resource: [tableArn, `${tableArn}/index/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `arn:aws:logs:*:*:log-group:/aws/lambda/price-checker-${environmentSuffix}:*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for Alert Processor Lambda
    this.alertProcessorRole = new aws.iam.Role(
      `alert-processor-role-${environmentSuffix}`,
      {
        name: `alert-processor-role-${environmentSuffix}`,
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
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    // Policy for Alert Processor Lambda
    const alertProcessorPolicy = new aws.iam.RolePolicy(
      `alert-processor-policy-${environmentSuffix}`,
      {
        name: `alert-processor-policy-${environmentSuffix}`,
        role: this.alertProcessorRole.id,
        policy: pulumi
          .all([
            this.cryptoAlertsTable.streamArn,
            this.priceAlertsTopic.arn,
            this.kmsKey.arn,
          ])
          .apply(([streamArn, topicArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:DescribeStream',
                    'dynamodb:GetRecords',
                    'dynamodb:GetShardIterator',
                    'dynamodb:ListStreams',
                  ],
                  Resource: streamArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `arn:aws:logs:*:*:log-group:/aws/lambda/alert-processor-${environmentSuffix}:*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Price Checker Lambda Function
    this.priceCheckerLambda = new aws.lambda.Function(
      `price-checker-${environmentSuffix}`,
      {
        name: `price-checker-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        architectures: ['arm64'],
        handler: 'index.handler',
        role: this.priceCheckerRole.arn,
        timeout: priceCheckerTimeout,
        memorySize: priceCheckerMemorySize,
        code: new pulumi.asset.AssetArchive({
          'index.mjs': new pulumi.asset.StringAsset(`
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;
const EXCHANGE_API_ENDPOINT = process.env.EXCHANGE_API_ENDPOINT;

export const handler = async (event) => {
    console.log('Price checker triggered at:', new Date().toISOString());

    try {
        // Scan all active alerts from DynamoDB
        const scanCommand = new ScanCommand({
            TableName: TABLE_NAME,
        });

        const response = await dynamoClient.send(scanCommand);
        const alerts = response.Items?.map(item => unmarshall(item)) || [];

        console.log(\`Found \${alerts.length} alerts to check\`);

        // Fetch current prices from exchange API
        const prices = await fetchPrices();

        // Check each alert against current prices
        const triggeredAlerts = [];
        for (const alert of alerts) {
            const currentPrice = prices[alert.coinSymbol];
            if (currentPrice && checkThreshold(alert, currentPrice)) {
                triggeredAlerts.push({
                    ...alert,
                    currentPrice,
                });
            }
        }

        console.log(\`Found \${triggeredAlerts.length} triggered alerts\`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                checked: alerts.length,
                triggered: triggeredAlerts.length,
                alerts: triggeredAlerts,
            }),
        };
    } catch (error) {
        console.error('Error checking prices:', error);
        throw error;
    }
};

async function fetchPrices() {
    // Simulate fetching prices from exchange API with exponential backoff
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            // In production, this would call actual exchange API
            // For demo, return mock prices
            return {
                'BTC': 45000.00,
                'ETH': 3000.00,
                'ADA': 1.50,
                'SOL': 100.00,
            };
        } catch (error) {
            retries++;
            if (retries >= maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        }
    }
}

function checkThreshold(alert, currentPrice) {
    const threshold = parseFloat(alert.threshold);
    const condition = alert.condition;

    if (condition === 'above' && currentPrice > threshold) return true;
    if (condition === 'below' && currentPrice < threshold) return true;

    return false;
}
`),
        }),
        environment: {
          variables: {
            TABLE_NAME: this.cryptoAlertsTable.name,
            EXCHANGE_API_ENDPOINT: exchangeApiEndpoint,
          },
        },
        kmsKeyArn: this.kmsKey.arn,
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      {
        parent: this,
        dependsOn: [this.priceCheckerLogGroup, priceCheckerPolicy],
      }
    );

    // Alert Processor Lambda Function
    this.alertProcessorLambda = new aws.lambda.Function(
      `alert-processor-${environmentSuffix}`,
      {
        name: `alert-processor-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        architectures: ['arm64'],
        handler: 'index.handler',
        role: this.alertProcessorRole.arn,
        timeout: alertProcessorTimeout,
        memorySize: alertProcessorMemorySize,
        code: new pulumi.asset.AssetArchive({
          'index.mjs': new pulumi.asset.StringAsset(`
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const snsClient = new SNSClient({});
const TOPIC_ARN = process.env.TOPIC_ARN;

export const handler = async (event) => {
    console.log('Alert processor triggered:', JSON.stringify(event, null, 2));

    try {
        const records = event.Records || [];

        for (const record of records) {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = unmarshall(record.dynamodb.NewImage);

                // Send SNS notification
                await sendNotification(newImage);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                processed: records.length,
            }),
        };
    } catch (error) {
        console.error('Error processing alerts:', error);
        throw error;
    }
};

async function sendNotification(alert) {
    const message = \`
Cryptocurrency Price Alert Triggered!

Coin: \${alert.coinSymbol}
User: \${alert.userId}
Alert ID: \${alert.alertId}
Condition: \${alert.condition}
Threshold: \${alert.threshold}
Current Price: \${alert.currentPrice || 'N/A'}

This is an automated notification from the Crypto Alert System.
    \`.trim();

    const command = new PublishCommand({
        TopicArn: TOPIC_ARN,
        Subject: \`Price Alert: \${alert.coinSymbol}\`,
        Message: message,
    });

    await snsClient.send(command);
    console.log(\`Notification sent for alert \${alert.alertId}\`);
}
`),
        }),
        environment: {
          variables: {
            TOPIC_ARN: this.priceAlertsTopic.arn,
          },
        },
        kmsKeyArn: this.kmsKey.arn,
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      {
        parent: this,
        dependsOn: [this.alertProcessorLogGroup, alertProcessorPolicy],
      }
    );

    // DynamoDB Stream Event Source Mapping
    this.streamEventSourceMapping = new aws.lambda.EventSourceMapping(
      `alert-stream-mapping-${environmentSuffix}`,
      {
        eventSourceArn: this.cryptoAlertsTable.streamArn,
        functionName: this.alertProcessorLambda.arn,
        startingPosition: 'LATEST',
        batchSize: 10,
        maximumBatchingWindowInSeconds: 5,
      },
      { parent: this }
    );

    // EventBridge Rule to trigger price checker
    this.priceCheckerRule = new aws.cloudwatch.EventRule(
      `price-checker-rule-${environmentSuffix}`,
      {
        name: `price-checker-rule-${environmentSuffix}`,
        description: 'Trigger price checker Lambda every minute',
        scheduleExpression: scheduleExpression,
        tags: {
          Environment: environmentSuffix,
          Service: 'crypto-alerts',
        },
      },
      { parent: this }
    );

    this.priceCheckerTarget = new aws.cloudwatch.EventTarget(
      `price-checker-target-${environmentSuffix}`,
      {
        rule: this.priceCheckerRule.name,
        arn: this.priceCheckerLambda.arn,
      },
      { parent: this }
    );

    // Lambda permission for EventBridge to invoke price checker
    this.priceCheckerPermission = new aws.lambda.Permission(
      `price-checker-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.priceCheckerLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: this.priceCheckerRule.arn,
      },
      { parent: this }
    );

    // Set public outputs
    this.tableName = this.cryptoAlertsTable.name;
    this.tableArn = this.cryptoAlertsTable.arn;
    this.topicArn = this.priceAlertsTopic.arn;
    this.priceCheckerFunctionName = this.priceCheckerLambda.name;
    this.priceCheckerFunctionArn = this.priceCheckerLambda.arn;
    this.alertProcessorFunctionName = this.alertProcessorLambda.name;
    this.alertProcessorFunctionArn = this.alertProcessorLambda.arn;
    this.kmsKeyId = this.kmsKey.keyId;
    this.eventRuleName = this.priceCheckerRule.name;

    // Register outputs
    this.registerOutputs({
      tableName: this.tableName,
      tableArn: this.tableArn,
      topicArn: this.topicArn,
      priceCheckerFunctionName: this.priceCheckerFunctionName,
      priceCheckerFunctionArn: this.priceCheckerFunctionArn,
      alertProcessorFunctionName: this.alertProcessorFunctionName,
      alertProcessorFunctionArn: this.alertProcessorFunctionArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyAlias: this.kmsKeyAlias.name,
      eventRuleName: this.eventRuleName,
    });
  }
}
