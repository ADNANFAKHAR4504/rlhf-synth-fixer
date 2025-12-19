# Shipment Tracking System - Ideal CDK Implementation

This implementation successfully deploys a serverless shipment tracking system with all required components.

## Key Implementation Details

### Infrastructure Stack (lib/tap-stack.ts)

The stack uses standard Lambda functions instead of NodejsFunction to avoid Docker dependency:

```typescript
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
```

### Lambda Functions

All Lambda functions are compiled from TypeScript to JavaScript and deployed from `lib/lambdas/` directory:
- status-update.ts/js - Handles REST API requests
- stream-processor.ts/js - Processes DynamoDB streams
- websocket-handler.ts/js - Manages WebSocket connections

### Key Features

1. DynamoDB with Streams (NEW_AND_OLD_IMAGES)
2. REST API Gateway with Lambda integration
3. WebSocket API with $connect, $disconnect, and $default routes
4. SNS topic subscribed by SQS queue for buffering
5. Stream processing with S3 failure destination
6. CloudWatch alarms for queue depth and SNS failures
7. X-Ray tracing enabled on all Lambda functions
8. Proper IAM permissions for all resource access
9. Environment suffix support for multi-environment deployments

### Dependencies

Required AWS SDK packages in dependencies (not devDependencies):
- @aws-sdk/client-sns
- @aws-sdk/client-apigatewaymanagementapi  
- @aws-sdk/util-dynamodb

### Deployment

The stack deploys successfully to us-east-1 region with all resources properly configured and tested.

All resources use DESTROY removal policy for easy cleanup.
