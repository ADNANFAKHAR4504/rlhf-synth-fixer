/**
 * tap-stack.ts
 *
 * Cryptocurrency Price Alert System using Pulumi with TypeScript.
 * This stack creates a serverless event-driven architecture for processing
 * cryptocurrency price events and generating alerts when thresholds are exceeded.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

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
 * Represents the main Pulumi component resource for the cryptocurrency price alert system.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly eventBusArn: pulumi.Output<string>;
  public readonly eventBusName: pulumi.Output<string>;
  public readonly priceProcessorFunctionName: pulumi.Output<string>;
  public readonly alertGeneratorFunctionName: pulumi.Output<string>;
  public readonly dynamodbTableName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const region = aws.getRegionOutput().name;

    // Common tags for all resources
    const commonTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      CostCenter: 'fintech-alerts',
    }));

    // Create EventBridge custom event bus
    const cryptoEventBus = new aws.cloudwatch.EventBus(
      `crypto-events-${environmentSuffix}`,
      {
        name: `crypto-events-${environmentSuffix}`,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create DynamoDB table for price history
    const priceHistoryTable = new aws.dynamodb.Table(
      `price-history-${environmentSuffix}`,
      {
        name: `price-history-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'symbol',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'symbol', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    // Create SNS topic for price alerts
    const priceAlertsTopic = new aws.sns.Topic(
      `price-alerts-${environmentSuffix}`,
      {
        name: `price-alerts-${environmentSuffix}`,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create SQS dead letter queue for price-processor
    const priceProcessorDlq = new aws.sqs.Queue(
      `price-processor-dlq-${environmentSuffix}`,
      {
        name: `price-processor-dlq-${environmentSuffix}`,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create SQS dead letter queue for alert-generator
    const alertGeneratorDlq = new aws.sqs.Queue(
      `alert-generator-dlq-${environmentSuffix}`,
      {
        name: `alert-generator-dlq-${environmentSuffix}`,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create IAM role for price-processor Lambda
    const priceProcessorRole = new aws.iam.Role(
      `price-processor-role-${environmentSuffix}`,
      {
        name: `price-processor-role-${environmentSuffix}`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `price-processor-basic-${environmentSuffix}`,
      {
        role: priceProcessorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for price-processor
    new aws.iam.RolePolicy(
      `price-processor-policy-${environmentSuffix}`,
      {
        role: priceProcessorRole.id,
        policy: pulumi
          .all([
            priceHistoryTable.arn,
            cryptoEventBus.arn,
            priceProcessorDlq.arn,
          ])
          .apply(([tableArn, busArn, dlqArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: 'events:PutEvents',
                  Resource: busArn,
                },
                {
                  Effect: 'Allow',
                  Action: 'sqs:SendMessage',
                  Resource: dlqArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for price-processor
    const priceProcessorLogGroup = new aws.cloudwatch.LogGroup(
      `price-processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/price-processor-${environmentSuffix}`,
        retentionInDays: 14,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create price-processor Lambda function
    const priceProcessorFunction = new aws.lambda.Function(
      `price-processor-${environmentSuffix}`,
      {
        name: `price-processor-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: priceProcessorRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");

const dynamodb = new DynamoDBClient({});
const eventbridge = new EventBridgeClient({});

exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        // Extract price data from event
        const detail = event.detail || {};
        const symbol = detail.symbol;
        const price = detail.price;
        const timestamp = Date.now();

        if (!symbol || !price) {
            throw new Error("Missing required fields: symbol or price");
        }

        // Validate price is a number
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) {
            throw new Error("Invalid price value");
        }

        // Store in DynamoDB
        const putCommand = new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                symbol: { S: symbol },
                timestamp: { N: timestamp.toString() },
                price: { N: numericPrice.toString() },
                rawEvent: { S: JSON.stringify(detail) }
            }
        });

        await dynamodb.send(putCommand);
        console.log(\`Stored price for \${symbol}: \${numericPrice}\`);

        // Calculate percentage change (simplified - would query history in real implementation)
        const percentChange = 0; // Placeholder

        // Publish processed event back to EventBridge
        const putEventsCommand = new PutEventsCommand({
            Entries: [{
                Source: "crypto.price.processor",
                DetailType: "PriceProcessed",
                Detail: JSON.stringify({
                    symbol,
                    price: numericPrice,
                    timestamp,
                    percentChange
                }),
                EventBusName: process.env.EVENT_BUS_NAME
            }]
        });

        await eventbridge.send(putEventsCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Price processed successfully" })
        };
    } catch (error) {
        console.error("Error processing price:", error);
        throw error;
    }
};
        `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'price-processor',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.450.0',
                '@aws-sdk/client-eventbridge': '^3.450.0',
              },
            })
          ),
        }),
        memorySize: 512,
        timeout: 30,
        architectures: ['arm64'],
        reservedConcurrentExecutions: 100,
        deadLetterConfig: {
          targetArn: priceProcessorDlq.arn,
        },
        environment: {
          variables: {
            TABLE_NAME: priceHistoryTable.name,
            EVENT_BUS_NAME: cryptoEventBus.name,
            REGION: region,
          },
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [priceProcessorLogGroup] }
    );

    // Grant EventBridge permission to invoke price-processor
    new aws.lambda.Permission(
      `price-processor-eventbridge-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: priceProcessorFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: pulumi.interpolate`arn:aws:events:${region}:${aws.getCallerIdentityOutput().accountId}:rule/${
          cryptoEventBus.name
        }/*`,
      },
      { parent: this }
    );

    // Create EventBridge rule to route price events to price-processor
    const priceEventRule = new aws.cloudwatch.EventRule(
      `price-event-rule-${environmentSuffix}`,
      {
        name: `price-event-rule-${environmentSuffix}`,
        eventBusName: cryptoEventBus.name,
        eventPattern: JSON.stringify({
          source: ['crypto.exchange'],
          'detail-type': ['PriceUpdate'],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // Create target for price event rule
    new aws.cloudwatch.EventTarget(
      `price-event-target-${environmentSuffix}`,
      {
        rule: priceEventRule.name,
        eventBusName: cryptoEventBus.name,
        arn: priceProcessorFunction.arn,
        deadLetterConfig: {
          arn: priceProcessorDlq.arn,
        },
      },
      { parent: this }
    );

    // Create IAM role for alert-generator Lambda
    const alertGeneratorRole = new aws.iam.Role(
      `alert-generator-role-${environmentSuffix}`,
      {
        name: `alert-generator-role-${environmentSuffix}`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `alert-generator-basic-${environmentSuffix}`,
      {
        role: alertGeneratorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for alert-generator
    new aws.iam.RolePolicy(
      `alert-generator-policy-${environmentSuffix}`,
      {
        role: alertGeneratorRole.id,
        policy: pulumi
          .all([
            priceHistoryTable.arn,
            priceAlertsTopic.arn,
            alertGeneratorDlq.arn,
          ])
          .apply(([tableArn, topicArn, dlqArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:Query',
                    'dynamodb:Scan',
                    'dynamodb:GetItem',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: 'sns:Publish',
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: 'sqs:SendMessage',
                  Resource: dlqArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for alert-generator
    const alertGeneratorLogGroup = new aws.cloudwatch.LogGroup(
      `alert-generator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/alert-generator-${environmentSuffix}`,
        retentionInDays: 14,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create alert-generator Lambda function
    const alertGeneratorFunction = new aws.lambda.Function(
      `alert-generator-${environmentSuffix}`,
      {
        name: `alert-generator-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: alertGeneratorRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamodb = new DynamoDBClient({});
const sns = new SNSClient({});

const ALERT_THRESHOLD = 5; // 5% change threshold

exports.handler = async (event) => {
    console.log("Alert generator triggered:", JSON.stringify(event, null, 2));

    try {
        // Scan DynamoDB for recent price data (last 15 minutes)
        const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);

        const scanCommand = new ScanCommand({
            TableName: process.env.TABLE_NAME,
            FilterExpression: "#ts > :timestamp",
            ExpressionAttributeNames: {
                "#ts": "timestamp"
            },
            ExpressionAttributeValues: {
                ":timestamp": { N: fifteenMinutesAgo.toString() }
            }
        });

        const result = await dynamodb.send(scanCommand);
        console.log(\`Found \${result.Items?.length || 0} recent price records\`);

        // Group by symbol and calculate changes
        const symbolData = {};
        (result.Items || []).forEach(item => {
            const symbol = item.symbol.S;
            const price = parseFloat(item.price.N);
            const timestamp = parseInt(item.timestamp.N);

            if (!symbolData[symbol]) {
                symbolData[symbol] = { prices: [] };
            }
            symbolData[symbol].prices.push({ price, timestamp });
        });

        // Check for threshold violations
        const alerts = [];
        for (const [symbol, data] of Object.entries(symbolData)) {
            if (data.prices.length < 2) continue;

            // Sort by timestamp
            data.prices.sort((a, b) => a.timestamp - b.timestamp);

            const oldestPrice = data.prices[0].price;
            const newestPrice = data.prices[data.prices.length - 1].price;
            const percentChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;

            if (Math.abs(percentChange) >= ALERT_THRESHOLD) {
                alerts.push({
                    symbol,
                    oldPrice: oldestPrice,
                    newPrice: newestPrice,
                    percentChange: percentChange.toFixed(2),
                    direction: percentChange > 0 ? "UP" : "DOWN"
                });
            }
        }

        // Publish alerts to SNS
        if (alerts.length > 0) {
            console.log(\`Publishing \${alerts.length} alerts\`);

            for (const alert of alerts) {
                const message = \`CRYPTO ALERT: \${alert.symbol} moved \${alert.direction} by \${Math.abs(alert.percentChange)}% (from \${alert.oldPrice} to \${alert.newPrice})\`;

                const publishCommand = new PublishCommand({
                    TopicArn: process.env.SNS_TOPIC_ARN,
                    Subject: \`Price Alert: \${alert.symbol}\`,
                    Message: message
                });

                await sns.send(publishCommand);
                console.log(\`Alert sent for \${alert.symbol}\`);
            }
        } else {
            console.log("No alerts to send - all prices within threshold");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Alert generation completed",
                alertCount: alerts.length
            })
        };
    } catch (error) {
        console.error("Error generating alerts:", error);
        throw error;
    }
};
        `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'alert-generator',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.450.0',
                '@aws-sdk/client-sns': '^3.450.0',
              },
            })
          ),
        }),
        memorySize: 512,
        timeout: 30,
        architectures: ['arm64'],
        reservedConcurrentExecutions: 100,
        deadLetterConfig: {
          targetArn: alertGeneratorDlq.arn,
        },
        environment: {
          variables: {
            TABLE_NAME: priceHistoryTable.name,
            SNS_TOPIC_ARN: priceAlertsTopic.arn,
            REGION: region,
          },
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [alertGeneratorLogGroup] }
    );

    // Grant EventBridge permission to invoke alert-generator
    new aws.lambda.Permission(
      `alert-generator-eventbridge-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: alertGeneratorFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: pulumi.interpolate`arn:aws:events:${region}:${aws.getCallerIdentityOutput().accountId}:rule/alert-schedule-rule-${environmentSuffix}`,
      },
      { parent: this }
    );

    // Create EventBridge rule to schedule alert-generator (every 5 minutes)
    // Note: ScheduleExpression is only supported on the default event bus
    const alertScheduleRule = new aws.cloudwatch.EventRule(
      `alert-schedule-rule-${environmentSuffix}`,
      {
        name: `alert-schedule-rule-${environmentSuffix}`,
        scheduleExpression: 'rate(5 minutes)',
        tags: commonTags,
      },
      { parent: this }
    );

    // Create target for alert schedule rule
    new aws.cloudwatch.EventTarget(
      `alert-schedule-target-${environmentSuffix}`,
      {
        rule: alertScheduleRule.name,
        arn: alertGeneratorFunction.arn,
        deadLetterConfig: {
          arn: alertGeneratorDlq.arn,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.eventBusArn = cryptoEventBus.arn;
    this.eventBusName = cryptoEventBus.name;
    this.priceProcessorFunctionName = priceProcessorFunction.name;
    this.alertGeneratorFunctionName = alertGeneratorFunction.name;
    this.dynamodbTableName = priceHistoryTable.name;
    this.snsTopicArn = priceAlertsTopic.arn;

    // Register the outputs of this component
    this.registerOutputs({
      eventBusArn: this.eventBusArn,
      eventBusName: this.eventBusName,
      priceProcessorFunctionName: this.priceProcessorFunctionName,
      alertGeneratorFunctionName: this.alertGeneratorFunctionName,
      dynamodbTableName: this.dynamodbTableName,
      snsTopicArn: this.snsTopicArn,
      priceProcessorDlqUrl: priceProcessorDlq.url,
      alertGeneratorDlqUrl: alertGeneratorDlq.url,
    });
  }
}
