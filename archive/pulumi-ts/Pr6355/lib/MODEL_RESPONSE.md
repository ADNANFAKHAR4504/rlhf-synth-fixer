# Serverless Financial Data Processing Pipeline - Implementation

This implementation provides a complete serverless data processing pipeline for financial analytics using Pulumi with TypeScript.

## Architecture Overview

The solution implements an event-driven serverless architecture with:
- S3 bucket for raw market data ingestion
- Three Lambda functions for data processing stages
- DynamoDB table for state management
- SQS queue with dead letter queue for reliable message processing
- EventBridge for event orchestration and scheduling
- API Gateway for external data ingestion
- Comprehensive IAM roles, CloudWatch logging, and monitoring

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const baseTags = {
      Environment: 'Production',
      Project: 'MarketAnalytics',
      ...(args.tags as any || {}),
    };

    // Dead Letter Queue for failed messages
    const deadLetterQueue = new aws.sqs.Queue(`processing-dlq-${environmentSuffix}`, {
      messageRetentionSeconds: 345600, // 4 days
      tags: baseTags,
    }, { parent: this });

    // Main SQS Queue for processing
    const processingQueue = new aws.sqs.Queue(`processing-queue-${environmentSuffix}`, {
      name: `ProcessingQueue-${environmentSuffix}`,
      messageRetentionSeconds: 345600, // 4 days
      visibilityTimeoutSeconds: 300, // 5 minutes
      redrivePolicy: pulumi.jsonStringify({
        deadLetterTargetArn: deadLetterQueue.arn,
        maxReceiveCount: 3,
      }),
      tags: baseTags,
    }, { parent: this });

    // S3 Bucket for raw market data
    const dataBucket = new aws.s3.Bucket(`market-data-bucket-${environmentSuffix}`, {
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 30,
        },
      }],
      tags: baseTags,
    }, { parent: this });

    // DynamoDB Table for market data state
    const marketDataTable = new aws.dynamodb.Table(`market-data-state-${environmentSuffix}`, {
      name: `MarketDataState-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'symbol',
      rangeKey: 'timestamp',
      attributes: [
        { name: 'symbol', type: 'S' },
        { name: 'timestamp', type: 'N' },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: baseTags,
    }, { parent: this });

    // IAM Role for DataIngestion Lambda
    const dataIngestionRole = new aws.iam.Role(`data-ingestion-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags: baseTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`data-ingestion-basic-${environmentSuffix}`, {
      role: dataIngestionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`data-ingestion-xray-${environmentSuffix}`, {
      role: dataIngestionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
    }, { parent: this });

    const dataIngestionPolicy = new aws.iam.RolePolicy(`data-ingestion-policy-${environmentSuffix}`, {
      role: dataIngestionRole.id,
      policy: pulumi.all([processingQueue.arn, marketDataTable.arn]).apply(([queueArn, tableArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'sqs:SendMessage',
                'sqs:GetQueueUrl',
              ],
              Resource: queueArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Deny',
              Action: 'dynamodb:DeleteTable',
              Resource: '*',
            },
          ],
        })
      ),
    }, { parent: this });

    // CloudWatch Log Group for DataIngestion Lambda
    const dataIngestionLogGroup = new aws.cloudwatch.LogGroup(`data-ingestion-logs-${environmentSuffix}`, {
      name: `/aws/lambda/DataIngestion-${environmentSuffix}`,
      retentionInDays: 7,
      tags: baseTags,
    }, { parent: this });

    const dataIngestionMetricFilter = new aws.cloudwatch.LogMetricFilter(`data-ingestion-errors-${environmentSuffix}`, {
      logGroupName: dataIngestionLogGroup.name,
      name: `DataIngestionErrors-${environmentSuffix}`,
      pattern: '[ERROR]',
      metricTransformation: {
        name: 'DataIngestionErrorCount',
        namespace: 'MarketAnalytics',
        value: '1',
      },
    }, { parent: this });

    // DataIngestion Lambda Function
    const dataIngestionFunction = new aws.lambda.Function(`data-ingestion-${environmentSuffix}`, {
      name: `DataIngestion-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: dataIngestionRole.arn,
      memorySize: 3072,
      timeout: 300,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive('./lib/lambda/data-ingestion'),
      }),
      environment: {
        variables: {
          QUEUE_URL: processingQueue.url,
          TABLE_NAME: marketDataTable.name,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
      },
      tracingConfig: {
        mode: 'Active',
      },
      tags: baseTags,
    }, { parent: this, dependsOn: [dataIngestionLogGroup, dataIngestionPolicy] });

    // IAM Role for DataProcessor Lambda
    const dataProcessorRole = new aws.iam.Role(`data-processor-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags: baseTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`data-processor-basic-${environmentSuffix}`, {
      role: dataProcessorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`data-processor-xray-${environmentSuffix}`, {
      role: dataProcessorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`data-processor-sqs-${environmentSuffix}`, {
      role: dataProcessorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole',
    }, { parent: this });

    const dataProcessorPolicy = new aws.iam.RolePolicy(`data-processor-policy-${environmentSuffix}`, {
      role: dataProcessorRole.id,
      policy: pulumi.all([marketDataTable.arn]).apply(([tableArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:UpdateItem',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: 'events:PutEvents',
              Resource: '*',
            },
            {
              Effect: 'Deny',
              Action: 'dynamodb:DeleteTable',
              Resource: '*',
            },
          ],
        })
      ),
    }, { parent: this });

    // CloudWatch Log Group for DataProcessor Lambda
    const dataProcessorLogGroup = new aws.cloudwatch.LogGroup(`data-processor-logs-${environmentSuffix}`, {
      name: `/aws/lambda/DataProcessor-${environmentSuffix}`,
      retentionInDays: 7,
      tags: baseTags,
    }, { parent: this });

    const dataProcessorMetricFilter = new aws.cloudwatch.LogMetricFilter(`data-processor-errors-${environmentSuffix}`, {
      logGroupName: dataProcessorLogGroup.name,
      name: `DataProcessorErrors-${environmentSuffix}`,
      pattern: '[ERROR]',
      metricTransformation: {
        name: 'DataProcessorErrorCount',
        namespace: 'MarketAnalytics',
        value: '1',
      },
    }, { parent: this });

    // DataProcessor Lambda Function
    const dataProcessorFunction = new aws.lambda.Function(`data-processor-${environmentSuffix}`, {
      name: `DataProcessor-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: dataProcessorRole.arn,
      memorySize: 3072,
      timeout: 300,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive('./lib/lambda/data-processor'),
      }),
      environment: {
        variables: {
          TABLE_NAME: marketDataTable.name,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
      },
      tracingConfig: {
        mode: 'Active',
      },
      deadLetterConfig: {
        targetArn: deadLetterQueue.arn,
      },
      tags: baseTags,
    }, { parent: this, dependsOn: [dataProcessorLogGroup, dataProcessorPolicy] });

    // SQS Event Source Mapping for DataProcessor
    const sqsEventSource = new aws.lambda.EventSourceMapping(`data-processor-sqs-trigger-${environmentSuffix}`, {
      eventSourceArn: processingQueue.arn,
      functionName: dataProcessorFunction.name,
      batchSize: 10,
    }, { parent: this });

    // IAM Role for DataAggregator Lambda
    const dataAggregatorRole = new aws.iam.Role(`data-aggregator-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags: baseTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`data-aggregator-basic-${environmentSuffix}`, {
      role: dataAggregatorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`data-aggregator-xray-${environmentSuffix}`, {
      role: dataAggregatorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
    }, { parent: this });

    const dataAggregatorPolicy = new aws.iam.RolePolicy(`data-aggregator-policy-${environmentSuffix}`, {
      role: dataAggregatorRole.id,
      policy: pulumi.all([marketDataTable.arn]).apply(([tableArn]) =>
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
              Effect: 'Deny',
              Action: 'dynamodb:DeleteTable',
              Resource: '*',
            },
          ],
        })
      ),
    }, { parent: this });

    // CloudWatch Log Group for DataAggregator Lambda
    const dataAggregatorLogGroup = new aws.cloudwatch.LogGroup(`data-aggregator-logs-${environmentSuffix}`, {
      name: `/aws/lambda/DataAggregator-${environmentSuffix}`,
      retentionInDays: 7,
      tags: baseTags,
    }, { parent: this });

    const dataAggregatorMetricFilter = new aws.cloudwatch.LogMetricFilter(`data-aggregator-errors-${environmentSuffix}`, {
      logGroupName: dataAggregatorLogGroup.name,
      name: `DataAggregatorErrors-${environmentSuffix}`,
      pattern: '[ERROR]',
      metricTransformation: {
        name: 'DataAggregatorErrorCount',
        namespace: 'MarketAnalytics',
        value: '1',
      },
    }, { parent: this });

    // DataAggregator Lambda Function
    const dataAggregatorFunction = new aws.lambda.Function(`data-aggregator-${environmentSuffix}`, {
      name: `DataAggregator-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: dataAggregatorRole.arn,
      memorySize: 3072,
      timeout: 300,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive('./lib/lambda/data-aggregator'),
      }),
      environment: {
        variables: {
          TABLE_NAME: marketDataTable.name,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
      },
      tracingConfig: {
        mode: 'Active',
      },
      deadLetterConfig: {
        targetArn: deadLetterQueue.arn,
      },
      tags: baseTags,
    }, { parent: this, dependsOn: [dataAggregatorLogGroup, dataAggregatorPolicy] });

    // EventBridge scheduled rule for DataAggregator (every 5 minutes)
    const scheduledRule = new aws.cloudwatch.EventRule(`data-aggregator-schedule-${environmentSuffix}`, {
      scheduleExpression: 'rate(5 minutes)',
      description: 'Trigger DataAggregator Lambda every 5 minutes',
      tags: baseTags,
    }, { parent: this });

    const scheduledRulePermission = new aws.lambda.Permission(`data-aggregator-schedule-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: dataAggregatorFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: scheduledRule.arn,
    }, { parent: this });

    const scheduledRuleTarget = new aws.cloudwatch.EventTarget(`data-aggregator-schedule-target-${environmentSuffix}`, {
      rule: scheduledRule.name,
      arn: dataAggregatorFunction.arn,
    }, { parent: this, dependsOn: [scheduledRulePermission] });

    // EventBridge rule for custom events from DataProcessor
    const customEventRule = new aws.cloudwatch.EventRule(`data-processor-events-${environmentSuffix}`, {
      eventPattern: JSON.stringify({
        source: ['market.analytics.processor'],
        'detail-type': ['MarketDataProcessed'],
      }),
      description: 'Capture custom events from DataProcessor',
      tags: baseTags,
    }, { parent: this });

    const customEventPermission = new aws.lambda.Permission(`data-aggregator-event-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: dataAggregatorFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: customEventRule.arn,
    }, { parent: this });

    const customEventTarget = new aws.cloudwatch.EventTarget(`data-aggregator-event-target-${environmentSuffix}`, {
      rule: customEventRule.name,
      arn: dataAggregatorFunction.arn,
    }, { parent: this, dependsOn: [customEventPermission] });

    // S3 bucket notification to trigger DataIngestion Lambda
    const bucketNotificationRole = new aws.iam.Role(`bucket-notification-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
        }],
      }),
      tags: baseTags,
    }, { parent: this });

    const s3LambdaPermission = new aws.lambda.Permission(`s3-invoke-ingestion-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: dataIngestionFunction.name,
      principal: 's3.amazonaws.com',
      sourceArn: dataBucket.arn,
    }, { parent: this });

    const bucketNotification = new aws.s3.BucketNotification(`bucket-notification-${environmentSuffix}`, {
      bucket: dataBucket.id,
      lambdaFunctions: [{
        lambdaFunctionArn: dataIngestionFunction.arn,
        events: ['s3:ObjectCreated:*'],
      }],
    }, { parent: this, dependsOn: [s3LambdaPermission] });

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(`market-data-api-${environmentSuffix}`, {
      name: `MarketDataAPI-${environmentSuffix}`,
      description: 'API for market data ingestion',
      tags: baseTags,
    }, { parent: this });

    const apiResource = new aws.apigateway.Resource(`ingest-resource-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: 'ingest',
    }, { parent: this });

    const apiMethod = new aws.apigateway.Method(`ingest-method-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: apiResource.id,
      httpMethod: 'POST',
      authorization: 'AWS_IAM',
    }, { parent: this });

    const apiIntegration = new aws.apigateway.Integration(`ingest-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: apiResource.id,
      httpMethod: apiMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: dataIngestionFunction.invokeArn,
    }, { parent: this });

    const apiLambdaPermission = new aws.lambda.Permission(`api-invoke-ingestion-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: dataIngestionFunction.name,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }, { parent: this });

    const apiDeployment = new aws.apigateway.Deployment(`api-deployment-${environmentSuffix}`, {
      restApi: api.id,
      stageName: 'prod',
    }, { parent: this, dependsOn: [apiIntegration] });

    // API Gateway Usage Plan for throttling
    const usagePlan = new aws.apigateway.UsagePlan(`api-usage-plan-${environmentSuffix}`, {
      name: `MarketDataAPIUsagePlan-${environmentSuffix}`,
      apiStages: [{
        apiId: api.id,
        stage: apiDeployment.stageName,
      }],
      throttleSettings: {
        burstLimit: 10000,
        rateLimit: 10000,
      },
      tags: baseTags,
    }, { parent: this });

    // Export stack outputs
    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${aws.config.region}.amazonaws.com/${apiDeployment.stageName}/ingest`;
    this.bucketName = dataBucket.id;
    this.tableArn = marketDataTable.arn;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      bucketName: this.bucketName,
      tableArn: this.tableArn,
    });
  }
}
```

## File: lib/lambda/data-ingestion/index.ts

```typescript
import { S3Event, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const sqs = new SQSClient({});
const dynamodb = new DynamoDBClient({});

const QUEUE_URL = process.env.QUEUE_URL!;
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: S3Event | APIGatewayProxyEvent): Promise<APIGatewayProxyResult | void> => {
  console.log('[INFO] DataIngestion Lambda invoked', JSON.stringify(event));

  try {
    // Check if this is an S3 event or API Gateway event
    if ('Records' in event && event.Records[0]?.eventSource === 'aws:s3') {
      // S3 Event handling
      const s3Event = event as S3Event;

      for (const record of s3Event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`[INFO] Processing S3 object: ${bucket}/${key}`);

        // Extract symbol from file key (assuming format: symbol/timestamp.json)
        const symbol = key.split('/')[0] || 'UNKNOWN';
        const timestamp = Date.now();

        // Store metadata in DynamoDB
        await dynamodb.send(new PutItemCommand({
          TableName: TABLE_NAME,
          Item: {
            symbol: { S: symbol },
            timestamp: { N: timestamp.toString() },
            s3Bucket: { S: bucket },
            s3Key: { S: key },
            status: { S: 'ingested' },
          },
        }));

        // Send message to SQS for processing
        await sqs.send(new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({
            bucket,
            key,
            symbol,
            timestamp,
          }),
        }));

        console.log(`[INFO] Successfully processed S3 object: ${key}`);
      }

      return;
    } else {
      // API Gateway event handling
      const apiEvent = event as APIGatewayProxyEvent;

      if (!apiEvent.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const data = JSON.parse(apiEvent.body);
      const symbol = data.symbol || 'UNKNOWN';
      const timestamp = Date.now();

      console.log(`[INFO] Processing API request for symbol: ${symbol}`);

      // Store in DynamoDB
      await dynamodb.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          symbol: { S: symbol },
          timestamp: { N: timestamp.toString() },
          data: { S: JSON.stringify(data) },
          status: { S: 'ingested' },
        },
      }));

      // Send to SQS for processing
      await sqs.send(new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({
          symbol,
          timestamp,
          data,
        }),
      }));

      console.log(`[INFO] Successfully processed API request for symbol: ${symbol}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Data ingested successfully',
          symbol,
          timestamp,
        }),
      };
    }
  } catch (error) {
    console.error('[ERROR] Error processing event:', error);

    if ('httpMethod' in event) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }

    throw error;
  }
};
```

## File: lib/lambda/data-ingestion/package.json

```json
{
  "name": "data-ingestion",
  "version": "1.0.0",
  "description": "Lambda function for market data ingestion",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0"
  }
}
```

## File: lib/lambda/data-processor/index.ts

```typescript
import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const dynamodb = new DynamoDBClient({});
const eventbridge = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('[INFO] DataProcessor Lambda invoked', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { symbol, timestamp } = message;

      console.log(`[INFO] Processing message for symbol: ${symbol}`);

      // Get current state from DynamoDB
      const getResult = await dynamodb.send(new GetItemCommand({
        TableName: TABLE_NAME,
        Key: {
          symbol: { S: symbol },
          timestamp: { N: timestamp.toString() },
        },
      }));

      // Perform processing logic (placeholder - add your business logic here)
      const processedData = {
        symbol,
        timestamp,
        processed: true,
        processingTime: Date.now(),
        originalData: message,
      };

      // Update DynamoDB with processed status
      await dynamodb.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
          symbol: { S: symbol },
          timestamp: { N: timestamp.toString() },
        },
        UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'processed' },
          ':processedAt': { N: Date.now().toString() },
        },
      }));

      // Send custom event to EventBridge for DataAggregator
      await eventbridge.send(new PutEventsCommand({
        Entries: [{
          Source: 'market.analytics.processor',
          DetailType: 'MarketDataProcessed',
          Detail: JSON.stringify(processedData),
        }],
      }));

      console.log(`[INFO] Successfully processed message for symbol: ${symbol}`);
    } catch (error) {
      console.error('[ERROR] Error processing SQS message:', error);
      // Message will be sent to DLQ after max retries
      throw error;
    }
  }
};
```

## File: lib/lambda/data-processor/package.json

```json
{
  "name": "data-processor",
  "version": "1.0.0",
  "description": "Lambda function for market data processing",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-eventbridge": "^3.0.0"
  }
}
```

## File: lib/lambda/data-aggregator/index.ts

```typescript
import { EventBridgeEvent, ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({});

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: EventBridgeEvent<string, any> | ScheduledEvent): Promise<void> => {
  console.log('[INFO] DataAggregator Lambda invoked', JSON.stringify(event));

  try {
    // Check if this is a scheduled event or custom event
    const isScheduled = 'detail-type' in event && event['detail-type'] === 'Scheduled Event';

    if (isScheduled) {
      console.log('[INFO] Processing scheduled aggregation');

      // Scan table for recent processed data
      const scanResult = await dynamodb.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'processed' },
        },
        Limit: 1000,
      }));

      const items = scanResult.Items || [];
      console.log(`[INFO] Found ${items.length} processed items for aggregation`);

      // Perform aggregation logic (placeholder - add your business logic here)
      const aggregatedData = {
        totalItems: items.length,
        timestamp: Date.now(),
        symbols: new Set(items.map(item => item.symbol?.S)).size,
      };

      console.log('[INFO] Aggregation result:', aggregatedData);
    } else {
      // Custom event from DataProcessor
      console.log('[INFO] Processing custom event from DataProcessor');

      const eventDetail = (event as EventBridgeEvent<string, any>).detail;
      const { symbol, timestamp } = eventDetail;

      // Query specific symbol data for real-time aggregation
      const queryResult = await dynamodb.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'symbol = :symbol',
        ExpressionAttributeValues: {
          ':symbol': { S: symbol },
        },
        ScanIndexForward: false,
        Limit: 100,
      }));

      const items = queryResult.Items || [];
      console.log(`[INFO] Found ${items.length} items for symbol: ${symbol}`);

      // Perform symbol-specific aggregation
      const symbolAggregation = {
        symbol,
        itemCount: items.length,
        latestTimestamp: timestamp,
        aggregationTime: Date.now(),
      };

      console.log('[INFO] Symbol aggregation result:', symbolAggregation);
    }

    console.log('[INFO] DataAggregator completed successfully');
  } catch (error) {
    console.error('[ERROR] Error in DataAggregator:', error);
    throw error;
  }
};
```

## File: lib/lambda/data-aggregator/package.json

```json
{
  "name": "data-aggregator",
  "version": "1.0.0",
  "description": "Lambda function for market data aggregation",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0"
  }
}
```

## File: lib/README.md

```markdown
# Serverless Financial Data Processing Pipeline

A comprehensive serverless architecture for processing financial market data using AWS services.

## Architecture

This solution implements a complete event-driven data processing pipeline:

### Data Flow

1. **Ingestion**: Market data is uploaded to S3 or sent via API Gateway POST /ingest
2. **Initial Processing**: DataIngestion Lambda stores metadata in DynamoDB and queues messages in SQS
3. **Processing**: DataProcessor Lambda consumes SQS messages, processes data, and emits custom events
4. **Aggregation**: DataAggregator Lambda runs on schedule (every 5 minutes) and on custom events

### AWS Services

- **S3**: Raw data storage with versioning, encryption, and lifecycle policies
- **Lambda**: Three functions for ingestion, processing, and aggregation
- **DynamoDB**: State management with on-demand billing and point-in-time recovery
- **SQS**: Message queuing with dead letter queue for reliability
- **EventBridge**: Event routing and scheduled triggers
- **API Gateway**: REST API with throttling and IAM authentication
- **CloudWatch**: Logging and error monitoring for all functions
- **IAM**: Least privilege roles for each Lambda function

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials

### Deploy

```bash
# Install dependencies
npm install

# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy stack
pulumi up --yes
```

### Destroy

```bash
pulumi destroy --yes
```

## Configuration

All resources are named with an environment suffix for multi-environment deployments:

- S3 Bucket: `market-data-bucket-${environmentSuffix}`
- DynamoDB Table: `MarketDataState-${environmentSuffix}`
- Lambda Functions: `DataIngestion-${environmentSuffix}`, etc.

## Testing

After deployment, you can test the API:

```bash
# Get API URL from stack outputs
API_URL=$(pulumi stack output apiUrl)

# Send test data
curl -X POST "https://${API_URL}" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","price":150.25,"volume":1000000}'
```

## Monitoring

All Lambda functions have CloudWatch Log Groups with:
- 7-day retention
- Metric filters for error tracking
- X-Ray tracing enabled

## Security

- S3 encryption at rest with AES256
- IAM roles follow least privilege principle
- API Gateway uses IAM authentication
- All resources tagged for compliance

## Outputs

The stack exports:
- `apiUrl`: API Gateway endpoint URL
- `bucketName`: S3 bucket name for data uploads
- `tableArn`: DynamoDB table ARN
```