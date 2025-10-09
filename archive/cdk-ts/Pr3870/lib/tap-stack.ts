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
      partitionKey: {
        name: 'connectionId',
        type: dynamodb.AttributeType.STRING,
      },
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
    const statusUpdateFunction = new lambda.Function(
      this,
      'StatusUpdateFunction',
      {
        functionName: `status-update-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'status-update.handler',
        code: lambda.Code.fromAsset('lib/lambdas'),
        environment: {
          TABLE_NAME: shipmentsTable.tableName,
          SNS_TOPIC_ARN: notificationTopic.topicArn,
        },
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    shipmentsTable.grantWriteData(statusUpdateFunction);
    notificationTopic.grantPublish(statusUpdateFunction);

    // Lambda function for processing DynamoDB Streams
    const streamProcessorFunction = new lambda.Function(
      this,
      'StreamProcessorFunction',
      {
        functionName: `stream-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'stream-processor.handler',
        code: lambda.Code.fromAsset('lib/lambdas'),
        environment: {
          WEBSOCKET_API_ENDPOINT: '', // Will be updated after WebSocket API creation
          CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
        },
        timeout: cdk.Duration.seconds(60),
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    connectionsTable.grantReadWriteData(streamProcessorFunction);

    // Add DynamoDB Stream event source with S3 failure destination
    const streamEventSource = new lambdaEventSources.DynamoEventSource(
      shipmentsTable,
      {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        bisectBatchOnError: true,
        onFailure: new cdk.aws_lambda_event_sources.S3OnFailureDestination(
          failureBucket
        ),
        retryAttempts: 3,
      }
    );

    streamProcessorFunction.addEventSource(streamEventSource);

    // Lambda function for WebSocket connection management
    const websocketFunction = new lambda.Function(this, 'WebSocketFunction', {
      functionName: `websocket-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'websocket-handler.handler',
      code: lambda.Code.fromAsset('lib/lambdas'),
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
    shipments.addMethod(
      'POST',
      new apigateway.LambdaIntegration(statusUpdateFunction)
    );

    // WebSocket API Gateway
    const webSocketApi = new apigatewayv2.WebSocketApi(
      this,
      'ShipmentWebSocketApi',
      {
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
      }
    );

    const webSocketStage = new apigatewayv2.WebSocketStage(
      this,
      'WebSocketStage',
      {
        webSocketApi,
        stageName: environmentSuffix,
        autoDeploy: true,
      }
    );

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
    new cloudwatch.Alarm(this, 'QueueDepthAlarm', {
      alarmName: `shipment-queue-depth-${environmentSuffix}`,
      metric: notificationQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'SNSFailureAlarm', {
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
