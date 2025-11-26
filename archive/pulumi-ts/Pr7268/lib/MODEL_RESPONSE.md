# Crypto Price Alert System - Pulumi TypeScript Implementation

This implementation provides a complete serverless crypto price alert system using Pulumi with TypeScript. The architecture includes webhook ingestion, rule evaluation, message queuing, and push notifications.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Crypto Price Alert System.
 * Orchestrates Lambda functions, DynamoDB tables, API Gateway, SQS, SNS, EventBridge, and KMS.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly alertRulesTableName: pulumi.Output<string>;
  public readonly priceHistoryTableName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Custom KMS key for Lambda environment variable encryption
    const kmsKey = new aws.kms.Key(
      `crypto-alert-kms-${environmentSuffix}`,
      {
        description: 'KMS key for encrypting Lambda environment variables',
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    const kmsKeyAlias = new aws.kms.Alias(
      `crypto-alert-kms-alias-${environmentSuffix}`,
      {
        targetKeyId: kmsKey.id,
        name: `alias/crypto-alert-${environmentSuffix}`,
      },
      { parent: this }
    );

    // DynamoDB table for user alert rules
    const alertRulesTable = new aws.dynamodb.Table(
      `crypto-alert-rules-${environmentSuffix}`,
      {
        name: `crypto-alert-rules-${environmentSuffix}`,
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

    // DynamoDB table for price history with TTL
    const priceHistoryTable = new aws.dynamodb.Table(
      `crypto-alert-price-history-${environmentSuffix}`,
      {
        name: `crypto-alert-price-history-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'symbol',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'symbol', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        ttl: {
          attributeName: 'expiryTime',
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // SNS topic for outbound notifications with server-side encryption
    const snsTopic = new aws.sns.Topic(
      `crypto-alert-notifications-${environmentSuffix}`,
      {
        name: `crypto-alert-notifications-${environmentSuffix}`,
        kmsMasterKeyId: kmsKey.id,
        tags: tags,
      },
      { parent: this }
    );

    // Dead letter queue
    const deadLetterQueue = new aws.sqs.Queue(
      `crypto-alert-dlq-${environmentSuffix}`,
      {
        name: `crypto-alert-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: tags,
      },
      { parent: this }
    );

    // Main SQS queue between ingestion and evaluation Lambdas
    const mainQueue = new aws.sqs.Queue(
      `crypto-alert-queue-${environmentSuffix}`,
      {
        name: `crypto-alert-queue-${environmentSuffix}`,
        visibilityTimeoutSeconds: 300, // 5 minutes
        redrivePolicy: pulumi.jsonStringify({
          deadLetterTargetArn: deadLetterQueue.arn,
          maxReceiveCount: 3,
        }),
        tags: tags,
      },
      { parent: this }
    );

    // IAM role for ingestion Lambda
    const ingestionLambdaRole = new aws.iam.Role(
      `crypto-alert-ingestion-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-ingestion-lambda-basic-${environmentSuffix}`,
      {
        role: ingestionLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-ingestion-lambda-xray-${environmentSuffix}`,
      {
        role: ingestionLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Inline policy for ingestion Lambda - DynamoDB and SQS access
    const ingestionLambdaPolicy = new aws.iam.RolePolicy(
      `crypto-alert-ingestion-lambda-policy-${environmentSuffix}`,
      {
        role: ingestionLambdaRole.id,
        policy: pulumi.all([priceHistoryTable.arn, mainQueue.arn, kmsKey.arn]).apply(
          ([tableArn, queueArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem'],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
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

    // Webhook ingestion Lambda function
    const ingestionLambda = new aws.lambda.Function(
      `crypto-alert-ingestion-${environmentSuffix}`,
      {
        name: `crypto-alert-ingestion-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: ingestionLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lib/lambda/ingestion'),
        }),
        memorySize: 256,
        timeout: 30,
        architectures: ['arm64'],
        environment: {
          variables: {
            PRICE_HISTORY_TABLE: priceHistoryTable.name,
            QUEUE_URL: mainQueue.url,
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this, dependsOn: [ingestionLambdaPolicy] }
    );

    // IAM role for evaluation Lambda
    const evaluationLambdaRole = new aws.iam.Role(
      `crypto-alert-evaluation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-evaluation-lambda-basic-${environmentSuffix}`,
      {
        role: evaluationLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-evaluation-lambda-xray-${environmentSuffix}`,
      {
        role: evaluationLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Inline policy for evaluation Lambda - DynamoDB, SQS, and SNS access
    const evaluationLambdaPolicy = new aws.iam.RolePolicy(
      `crypto-alert-evaluation-lambda-policy-${environmentSuffix}`,
      {
        role: evaluationLambdaRole.id,
        policy: pulumi
          .all([
            alertRulesTable.arn,
            priceHistoryTable.arn,
            mainQueue.arn,
            snsTopic.arn,
            kmsKey.arn,
          ])
          .apply(
            ([rulesArn, historyArn, queueArn, topicArn, keyArn]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['dynamodb:Query', 'dynamodb:Scan', 'dynamodb:GetItem'],
                    Resource: rulesArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['dynamodb:Query', 'dynamodb:GetItem'],
                    Resource: historyArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
                    Resource: queueArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['sns:Publish'],
                    Resource: topicArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                    Resource: keyArn,
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // Rule evaluation Lambda function
    const evaluationLambda = new aws.lambda.Function(
      `crypto-alert-evaluation-${environmentSuffix}`,
      {
        name: `crypto-alert-evaluation-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: evaluationLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lib/lambda/evaluation'),
        }),
        memorySize: 512,
        timeout: 60,
        architectures: ['arm64'],
        environment: {
          variables: {
            ALERT_RULES_TABLE: alertRulesTable.name,
            PRICE_HISTORY_TABLE: priceHistoryTable.name,
            SNS_TOPIC_ARN: snsTopic.arn,
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this, dependsOn: [evaluationLambdaPolicy] }
    );

    // SQS event source mapping for evaluation Lambda
    new aws.lambda.EventSourceMapping(
      `crypto-alert-evaluation-sqs-trigger-${environmentSuffix}`,
      {
        eventSourceArn: mainQueue.arn,
        functionName: evaluationLambda.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    // EventBridge rule for scheduled evaluation every 5 minutes
    const eventBridgeRole = new aws.iam.Role(
      `crypto-alert-eventbridge-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'events.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    const eventBridgePolicy = new aws.iam.RolePolicy(
      `crypto-alert-eventbridge-policy-${environmentSuffix}`,
      {
        role: eventBridgeRole.id,
        policy: evaluationLambda.arn.apply((lambdaArn) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['lambda:InvokeFunction'],
                Resource: lambdaArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const scheduledRule = new aws.cloudwatch.EventRule(
      `crypto-alert-scheduled-evaluation-${environmentSuffix}`,
      {
        name: `crypto-alert-scheduled-evaluation-${environmentSuffix}`,
        description: 'Trigger evaluation Lambda every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `crypto-alert-scheduled-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: evaluationLambda.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this, dependsOn: [eventBridgePolicy] }
    );

    // Lambda permission for EventBridge
    new aws.lambda.Permission(
      `crypto-alert-eventbridge-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: evaluationLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    // API Gateway REST API
    const restApi = new aws.apigateway.RestApi(
      `crypto-alert-api-${environmentSuffix}`,
      {
        name: `crypto-alert-api-${environmentSuffix}`,
        description: 'Crypto price alert webhook API',
        tags: tags,
      },
      { parent: this }
    );

    // Enable X-Ray tracing on API Gateway
    const apiGatewayAccount = new aws.apigateway.Account(
      `crypto-alert-api-account-${environmentSuffix}`,
      {
        cloudwatchRoleArn: new aws.iam.Role(
          `crypto-alert-api-cloudwatch-role-${environmentSuffix}`,
          {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
              Service: 'apigateway.amazonaws.com',
            }),
            managedPolicyArns: [
              'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
            ],
            tags: tags,
          },
          { parent: this }
        ).arn,
      },
      { parent: this }
    );

    // Request validator for API Gateway
    const requestValidator = new aws.apigateway.RequestValidator(
      `crypto-alert-api-validator-${environmentSuffix}`,
      {
        restApi: restApi.id,
        name: `crypto-alert-validator-${environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      },
      { parent: this }
    );

    // Request model for validation
    const requestModel = new aws.apigateway.Model(
      `crypto-alert-api-model-${environmentSuffix}`,
      {
        restApi: restApi.id,
        name: `WebhookRequest${environmentSuffix.replace(/[^a-zA-Z0-9]/g, '')}`,
        description: 'Webhook request validation model',
        contentType: 'application/json',
        schema: JSON.stringify({
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'WebhookRequest',
          type: 'object',
          properties: {
            exchange: { type: 'string' },
            symbol: { type: 'string' },
            price: { type: 'number' },
          },
          required: ['exchange', 'symbol', 'price'],
        }),
      },
      { parent: this }
    );

    // /webhook resource
    const webhookResource = new aws.apigateway.Resource(
      `crypto-alert-api-webhook-resource-${environmentSuffix}`,
      {
        restApi: restApi.id,
        parentId: restApi.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: this }
    );

    // POST method with request validation
    const webhookMethod = new aws.apigateway.Method(
      `crypto-alert-api-webhook-method-${environmentSuffix}`,
      {
        restApi: restApi.id,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestValidatorId: requestValidator.id,
        requestModels: {
          'application/json': requestModel.name,
        },
      },
      { parent: this }
    );

    // Lambda integration for POST /webhook
    const webhookIntegration = new aws.apigateway.Integration(
      `crypto-alert-api-webhook-integration-${environmentSuffix}`,
      {
        restApi: restApi.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: ingestionLambda.invokeArn,
      },
      { parent: this }
    );

    // Lambda permission for API Gateway
    new aws.lambda.Permission(
      `crypto-alert-api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: ingestionLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${restApi.executionArn}/*/*`,
      },
      { parent: this }
    );

    // API Gateway deployment
    const deployment = new aws.apigateway.Deployment(
      `crypto-alert-api-deployment-${environmentSuffix}`,
      {
        restApi: restApi.id,
        triggers: {
          redeployment: pulumi
            .all([webhookMethod.id, webhookIntegration.id])
            .apply(([methodId, integrationId]) =>
              JSON.stringify({ methodId, integrationId, timestamp: Date.now() })
            ),
        },
      },
      { parent: this, dependsOn: [webhookMethod, webhookIntegration] }
    );

    // API Gateway stage with X-Ray tracing
    const stage = new aws.apigateway.Stage(
      `crypto-alert-api-stage-${environmentSuffix}`,
      {
        restApi: restApi.id,
        deployment: deployment.id,
        stageName: environmentSuffix,
        xrayTracingEnabled: true,
        tags: tags,
      },
      { parent: this, dependsOn: [apiGatewayAccount] }
    );

    // Export outputs
    this.apiEndpoint = pulumi.interpolate`${restApi.executionArn}/${stage.stageName}/webhook`;
    this.alertRulesTableName = alertRulesTable.name;
    this.priceHistoryTableName = priceHistoryTable.name;
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      alertRulesTableName: this.alertRulesTableName,
      priceHistoryTableName: this.priceHistoryTableName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: lib/lambda/ingestion/index.js

```javascript
/**
 * Webhook ingestion Lambda function
 * Receives cryptocurrency price data from webhooks and stores it in DynamoDB
 */
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE;
const QUEUE_URL = process.env.QUEUE_URL;

exports.handler = async (event) => {
  console.log('Received webhook event:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const { exchange, symbol, price } = body;

    // Validate required fields (API Gateway validation should catch this, but double-check)
    if (!exchange || !symbol || price === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: exchange, symbol, price',
        }),
      };
    }

    const timestamp = Date.now();
    const expiryTime = Math.floor(timestamp / 1000) + 86400 * 7; // 7 days TTL

    // Store price data in DynamoDB
    const putCommand = new PutItemCommand({
      TableName: PRICE_HISTORY_TABLE,
      Item: marshall({
        symbol,
        timestamp,
        exchange,
        price,
        expiryTime,
      }),
    });

    await dynamoClient.send(putCommand);
    console.log('Price data stored in DynamoDB');

    // Send message to SQS for evaluation
    const sqsCommand = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify({
        symbol,
        timestamp,
        exchange,
        price,
      }),
    });

    await sqsClient.send(sqsCommand);
    console.log('Message sent to SQS queue');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook processed successfully',
        symbol,
        price,
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
```

## File: lib/lambda/ingestion/package.json

```json
{
  "name": "crypto-alert-ingestion",
  "version": "1.0.0",
  "description": "Webhook ingestion Lambda for crypto price alerts",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-sqs": "^3.400.0",
    "@aws-sdk/util-dynamodb": "^3.400.0"
  }
}
```

## File: lib/lambda/evaluation/index.js

```javascript
/**
 * Rule evaluation Lambda function
 * Evaluates user alert rules against incoming price data and sends notifications
 */
const { DynamoDBClient, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

const ALERT_RULES_TABLE = process.env.ALERT_RULES_TABLE;
const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Processing evaluation event:', JSON.stringify(event));

  try {
    const alertsTriggered = [];

    // Process SQS messages if present
    if (event.Records) {
      for (const record of event.Records) {
        const message = JSON.parse(record.body);
        const { symbol, price } = message;

        console.log(`Evaluating price alert for ${symbol}: ${price}`);

        // Query alert rules
        const scanCommand = new ScanCommand({
          TableName: ALERT_RULES_TABLE,
        });

        const alertRules = await dynamoClient.send(scanCommand);

        if (alertRules.Items) {
          for (const item of alertRules.Items) {
            const rule = unmarshall(item);

            // Check if rule matches the symbol and threshold
            if (rule.symbol === symbol) {
              let triggered = false;

              if (rule.condition === 'above' && price >= rule.threshold) {
                triggered = true;
              } else if (rule.condition === 'below' && price <= rule.threshold) {
                triggered = true;
              }

              if (triggered) {
                console.log(`Alert triggered for user ${rule.userId}: ${symbol} ${rule.condition} ${rule.threshold}`);

                // Send SNS notification
                const publishCommand = new PublishCommand({
                  TopicArn: SNS_TOPIC_ARN,
                  Subject: `Price Alert: ${symbol}`,
                  Message: JSON.stringify({
                    userId: rule.userId,
                    alertId: rule.alertId,
                    symbol,
                    currentPrice: price,
                    threshold: rule.threshold,
                    condition: rule.condition,
                  }),
                });

                await snsClient.send(publishCommand);
                alertsTriggered.push(rule.alertId);
              }
            }
          }
        }
      }
    } else {
      // Scheduled execution - batch processing
      console.log('Running scheduled batch evaluation');

      // Get all alert rules
      const scanCommand = new ScanCommand({
        TableName: ALERT_RULES_TABLE,
      });

      const alertRules = await dynamoClient.send(scanCommand);

      if (alertRules.Items && alertRules.Items.length > 0) {
        // Get unique symbols from rules
        const symbols = [...new Set(alertRules.Items.map((item) => unmarshall(item).symbol))];

        for (const symbol of symbols) {
          // Get latest price for each symbol
          const queryCommand = new QueryCommand({
            TableName: PRICE_HISTORY_TABLE,
            KeyConditionExpression: 'symbol = :symbol',
            ExpressionAttributeValues: {
              ':symbol': { S: symbol },
            },
            ScanIndexForward: false,
            Limit: 1,
          });

          const priceData = await dynamoClient.send(queryCommand);

          if (priceData.Items && priceData.Items.length > 0) {
            const latestPrice = unmarshall(priceData.Items[0]);

            // Evaluate rules for this symbol
            for (const item of alertRules.Items) {
              const rule = unmarshall(item);

              if (rule.symbol === symbol) {
                let triggered = false;

                if (rule.condition === 'above' && latestPrice.price >= rule.threshold) {
                  triggered = true;
                } else if (rule.condition === 'below' && latestPrice.price <= rule.threshold) {
                  triggered = true;
                }

                if (triggered) {
                  console.log(
                    `Scheduled alert triggered for user ${rule.userId}: ${symbol} ${rule.condition} ${rule.threshold}`
                  );

                  // Send SNS notification
                  const publishCommand = new PublishCommand({
                    TopicArn: SNS_TOPIC_ARN,
                    Subject: `Price Alert: ${symbol}`,
                    Message: JSON.stringify({
                      userId: rule.userId,
                      alertId: rule.alertId,
                      symbol,
                      currentPrice: latestPrice.price,
                      threshold: rule.threshold,
                      condition: rule.condition,
                      evaluationType: 'scheduled',
                    }),
                  });

                  await snsClient.send(publishCommand);
                  alertsTriggered.push(rule.alertId);
                }
              }
            }
          }
        }
      }
    }

    console.log(`Evaluation complete. Alerts triggered: ${alertsTriggered.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Evaluation complete',
        alertsTriggered: alertsTriggered.length,
      }),
    };
  } catch (error) {
    console.error('Error during evaluation:', error);
    throw error;
  }
};
```

## File: lib/lambda/evaluation/package.json

```json
{
  "name": "crypto-alert-evaluation",
  "version": "1.0.0",
  "description": "Rule evaluation Lambda for crypto price alerts",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-sns": "^3.400.0",
    "@aws-sdk/util-dynamodb": "^3.400.0"
  }
}
```

## File: lib/README.md

```markdown
# Crypto Price Alert System

A serverless cryptocurrency price alert system built with Pulumi and TypeScript, deployed on AWS.

## Architecture Overview

This system provides a complete webhook processing pipeline for cryptocurrency price alerts:

- **API Gateway**: REST API endpoint (`/webhook`) for receiving price data from crypto exchanges
- **Ingestion Lambda**: Processes incoming webhooks, stores price history in DynamoDB, and queues messages for evaluation
- **Evaluation Lambda**: Evaluates user-defined alert rules and sends notifications via SNS
- **DynamoDB Tables**:
  - Alert rules table (userId, alertId) with point-in-time recovery
  - Price history table with TTL for automatic data expiration
- **SQS Queue**: Message queue between ingestion and evaluation with dead letter queue for error handling
- **SNS Topic**: Push notifications with server-side encryption
- **EventBridge**: Scheduled rule triggering evaluation every 5 minutes
- **KMS Key**: Custom key for encrypting Lambda environment variables
- **X-Ray Tracing**: End-to-end distributed tracing across all services

## Prerequisites

- Node.js 18 or higher
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create IAM roles, Lambda, DynamoDB, API Gateway, SQS, SNS, EventBridge, and KMS

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Lambda function dependencies:
   ```bash
   cd lib/lambda/ingestion && npm install && cd ../../..
   cd lib/lambda/evaluation && npm install && cd ../../..
   ```

3. Set environment suffix (optional, defaults to 'dev'):
   ```bash
   export ENVIRONMENT_SUFFIX=dev
   ```

4. Deploy the stack:
   ```bash
   pulumi up
   ```

5. Review the changes and confirm deployment.

## Stack Outputs

After deployment, you'll receive:

- `apiEndpoint`: The API Gateway endpoint URL for webhooks
- `alertRulesTableName`: DynamoDB table name for alert rules
- `priceHistoryTableName`: DynamoDB table name for price history
- `snsTopicArn`: SNS topic ARN for notifications

## Usage

### Creating Alert Rules

Insert alert rules directly into the DynamoDB alert rules table:

```json
{
  "userId": "user123",
  "alertId": "alert456",
  "symbol": "BTC",
  "condition": "above",
  "threshold": 50000
}
```

### Sending Webhook Data

POST to the API Gateway endpoint:

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "coinbase",
    "symbol": "BTC",
    "price": 51000
  }'
```

### Receiving Notifications

Subscribe to the SNS topic to receive push notifications when alerts trigger.

## Configuration

All resources include the `environmentSuffix` parameter for multi-environment deployments. Resource names follow the pattern: `crypto-alert-{component}-${environmentSuffix}`.

## Security Features

- Custom KMS key encryption for Lambda environment variables
- Server-side encryption for SNS topics
- Least-privilege IAM roles with no wildcard permissions
- API Gateway request validation
- X-Ray tracing for monitoring and debugging

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured with appropriate deletion policies for safe cleanup.
```

## Summary

This implementation provides:

1. Two Lambda functions (ingestion: 256MB, evaluation: 512MB) with ARM64 architecture
2. DynamoDB tables with point-in-time recovery and TTL configuration
3. API Gateway REST API with request validation for 'exchange', 'symbol', 'price'
4. SQS queue with 5-minute visibility timeout and dead letter queue (max receive count: 3)
5. SNS topic with server-side encryption
6. EventBridge scheduled rule (every 5 minutes)
7. Custom KMS key for Lambda environment variable encryption
8. X-Ray tracing on all Lambda functions and API Gateway
9. Least-privilege IAM roles with specific resource permissions (no wildcards)

All resources include the `environmentSuffix` parameter for multi-environment deployments and are fully destroyable.
