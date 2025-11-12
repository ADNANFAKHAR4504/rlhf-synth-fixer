# Shipment Tracking System - CDK Implementation

I'll help you build a serverless shipment tracking system with all the components you need. Here's the complete implementation:

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // S3 bucket for failed stream events
    const failureBucket = new s3.Bucket(this, 'FailureBucket', {
      bucketName: `shipment-tracking-failures-${environmentSuffix}-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // DynamoDB table for shipment tracking
    const shipmentsTable = new dynamodb.Table(this, 'ShipmentsTable', {
      tableName: `shipments-${environmentSuffix}`,
      partitionKey: { name: 'shipmentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for WebSocket connections
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: `connections-${environmentSuffix}`,
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS topic for notifications
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `shipment-notifications-${environmentSuffix}`,
      displayName: 'Shipment Status Notifications',
    });

    // SQS queue for buffering notifications
    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: `shipment-notifications-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(7),
    });

    // Subscribe queue to SNS topic
    notificationTopic.addSubscription(
      new cdk.aws_sns_subscriptions.SqsSubscription(notificationQueue)
    );

    // Lambda function for processing status updates
    const statusUpdateFunction = new NodejsFunction(this, 'StatusUpdateFunction', {
      functionName: `status-update-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambdas/status-update.ts'),
      environment: {
        TABLE_NAME: shipmentsTable.tableName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
    });

    shipmentsTable.grantWriteData(statusUpdateFunction);
    notificationTopic.grantPublish(statusUpdateFunction);

    // Lambda function for processing DynamoDB Streams
    const streamProcessorFunction = new NodejsFunction(this, 'StreamProcessorFunction', {
      functionName: `stream-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambdas/stream-processor.ts'),
      environment: {
        WEBSOCKET_API_ENDPOINT: '', // Will be updated after WebSocket API creation
        CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      },
      timeout: cdk.Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
    });

    connectionsTable.grantReadWriteData(streamProcessorFunction);

    // Add DynamoDB Stream event source with S3 failure destination
    const streamEventSource = new lambdaEventSources.DynamoEventSource(shipmentsTable, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 100,
      bisectBatchOnError: true,
      onFailure: new cdk.aws_lambda_event_sources.S3OnFailureDestination(failureBucket),
      retryAttempts: 3,
    });

    streamProcessorFunction.addEventSource(streamEventSource);

    // Lambda function for WebSocket connection management
    const websocketFunction = new NodejsFunction(this, 'WebSocketFunction', {
      functionName: `websocket-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambdas/websocket-handler.ts'),
      environment: {
        CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
    });

    connectionsTable.grantReadWriteData(websocketFunction);

    // REST API Gateway
    const restApi = new apigateway.RestApi(this, 'ShipmentTrackingApi', {
      restApiName: `shipment-tracking-api-${environmentSuffix}`,
      description: 'API for shipment status updates',
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
      },
    });

    const shipments = restApi.root.addResource('shipments');
    shipments.addMethod('POST', new apigateway.LambdaIntegration(statusUpdateFunction));

    // WebSocket API Gateway
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'ShipmentWebSocketApi', {
      apiName: `shipment-tracking-ws-${environmentSuffix}`,
      connectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          'ConnectIntegration',
          websocketFunction
        ),
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          'DisconnectIntegration',
          websocketFunction
        ),
      },
      defaultRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          'DefaultIntegration',
          websocketFunction
        ),
      },
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi,
      stageName: environmentSuffix,
      autoDeploy: true,
    });

    // Grant WebSocket API permissions to stream processor
    streamProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/${environmentSuffix}/*`,
        ],
      })
    );

    // Update stream processor environment variable with WebSocket endpoint
    streamProcessorFunction.addEnvironment(
      'WEBSOCKET_API_ENDPOINT',
      `${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${environmentSuffix}`
    );

    // CloudWatch Alarms
    const queueDepthAlarm = new cloudwatch.Alarm(this, 'QueueDepthAlarm', {
      alarmName: `shipment-queue-depth-${environmentSuffix}`,
      metric: notificationQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const snsFailureAlarm = new cloudwatch.Alarm(this, 'SNSFailureAlarm', {
      alarmName: `shipment-sns-failures-${environmentSuffix}`,
      metric: notificationTopic.metricNumberOfNotificationsFailed({
        statistic: 'sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: restApi.url,
      description: 'REST API URL',
      exportName: `RestApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketStage.url,
      description: 'WebSocket API URL',
      exportName: `WebSocketApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ShipmentsTableName', {
      value: shipmentsTable.tableName,
      description: 'Shipments DynamoDB Table Name',
      exportName: `ShipmentsTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS Topic ARN for notifications',
      exportName: `NotificationTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NotificationQueueUrl', {
      value: notificationQueue.queueUrl,
      description: 'SQS Queue URL for notifications',
      exportName: `NotificationQueueUrl-${environmentSuffix}`,
    });
  }
}
```

## File: lib/lambdas/status-update.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const body = JSON.parse(event.body);
    const { shipmentId, status, location, customerId, customerEmail } = body;

    if (!shipmentId || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: shipmentId, status' }),
      };
    }

    const timestamp = new Date().toISOString();

    // Store shipment update in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          shipmentId,
          timestamp,
          status,
          location: location || 'Unknown',
          customerId: customerId || '',
          customerEmail: customerEmail || '',
          updatedAt: timestamp,
        },
      })
    );

    // Publish notification to SNS
    const message = {
      shipmentId,
      status,
      location: location || 'Unknown',
      timestamp,
      customerId: customerId || '',
      customerEmail: customerEmail || '',
    };

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify(message),
        Subject: `Shipment ${shipmentId} Status Update`,
      })
    );

    console.log('Successfully processed shipment update:', shipmentId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Shipment status updated successfully',
        shipmentId,
        status,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error processing shipment update:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
```

## File: lib/lambdas/stream-processor.ts

```typescript
import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT!;
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  console.log('Processing DynamoDB stream event:', JSON.stringify(event, null, 2));

  const apiGwClient = new ApiGatewayManagementApiClient({
    endpoint: `https://${WEBSOCKET_API_ENDPOINT}`,
  });

  for (const record of event.Records) {
    try {
      await processRecord(record, apiGwClient);
    } catch (error) {
      console.error('Error processing record:', error);
      throw error; // Throw to trigger retry or failure destination
    }
  }
};

async function processRecord(
  record: DynamoDBRecord,
  apiGwClient: ApiGatewayManagementApiClient
): Promise<void> {
  if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
    if (!record.dynamodb?.NewImage) {
      console.log('No new image in record, skipping');
      return;
    }

    const newImage = unmarshall(
      record.dynamodb.NewImage as Record<string, AttributeValue>
    );
    const shipmentId = newImage.shipmentId;

    console.log('Processing shipment update:', shipmentId);

    // Query all active WebSocket connections
    const connections = await getActiveConnections();

    console.log(`Found ${connections.length} active connections`);

    // Send update to all connected clients
    const postPromises = connections.map(async (connection) => {
      try {
        await apiGwClient.send(
          new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: Buffer.from(
              JSON.stringify({
                type: 'shipment-update',
                data: newImage,
              })
            ),
          })
        );
        console.log(`Sent update to connection: ${connection.connectionId}`);
      } catch (error: any) {
        if (error.statusCode === 410) {
          console.log(`Stale connection: ${connection.connectionId}`);
          // Could delete stale connection here
        } else {
          console.error(`Error sending to connection ${connection.connectionId}:`, error);
        }
      }
    });

    await Promise.all(postPromises);
  }
}

async function getActiveConnections(): Promise<any[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: CONNECTIONS_TABLE_NAME,
        IndexName: undefined, // Scan all connections
        Limit: 100,
      })
    );

    return result.Items || [];
  } catch (error) {
    console.error('Error querying connections:', error);
    return [];
  }
}
```

## File: lib/lambdas/websocket-handler.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const routeKey = event.requestContext.routeKey;

  try {
    switch (routeKey) {
      case '$connect':
        await handleConnect(connectionId!);
        break;
      case '$disconnect':
        await handleDisconnect(connectionId!);
        break;
      case '$default':
        await handleDefault(connectionId!, event.body);
        break;
      default:
        console.log('Unknown route:', routeKey);
    }

    return {
      statusCode: 200,
      body: 'Success',
    };
  } catch (error) {
    console.error('Error handling WebSocket event:', error);
    return {
      statusCode: 500,
      body: 'Failed to process request',
    };
  }
};

async function handleConnect(connectionId: string): Promise<void> {
  console.log('Client connected:', connectionId);

  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

  await docClient.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE_NAME,
      Item: {
        connectionId,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    })
  );

  console.log('Connection stored:', connectionId);
}

async function handleDisconnect(connectionId: string): Promise<void> {
  console.log('Client disconnected:', connectionId);

  await docClient.send(
    new DeleteCommand({
      TableName: CONNECTIONS_TABLE_NAME,
      Key: {
        connectionId,
      },
    })
  );

  console.log('Connection removed:', connectionId);
}

async function handleDefault(connectionId: string, body: string | null): Promise<void> {
  console.log('Default route called:', connectionId, body);

  // Handle custom messages if needed
  if (body) {
    const message = JSON.parse(body);
    console.log('Received message:', message);

    // You can add custom logic here to handle different message types
  }
}
```

This implementation includes all the components you requested:

1. REST API for receiving shipment status updates
2. Lambda function to process updates and store in DynamoDB
3. DynamoDB table with Streams enabled (NEW_AND_OLD_IMAGES)
4. Stream processor Lambda with S3 failure destination
5. SNS topic for notifications with SQS buffer
6. WebSocket API for real-time updates with $connect, $disconnect, and $default routes
7. CloudWatch alarms for queue depth and SNS failures
8. X-Ray tracing enabled on all Lambda functions
9. Proper IAM permissions throughout

The system is designed to handle 5,900 daily updates efficiently using on-demand DynamoDB billing and serverless components.
