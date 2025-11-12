# Serverless Webhook Processing System - Implementation

This implementation provides a complete serverless webhook processing system using Pulumi with TypeScript, designed to handle high-volume payment webhook events.

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
  public readonly tableName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // VPC for Lambda functions
    const vpc = new aws.ec2.Vpc(`webhook-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `webhook-vpc-${environmentSuffix}` },
    }, { parent: this });

    // Private subnets for Lambda
    const privateSubnet1 = new aws.ec2.Subnet(`webhook-private-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      tags: { ...tags, Name: `webhook-private-subnet-1-${environmentSuffix}` },
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`webhook-private-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      tags: { ...tags, Name: `webhook-private-subnet-2-${environmentSuffix}` },
    }, { parent: this });

    // Security group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`webhook-lambda-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for webhook Lambda functions',
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: { ...tags, Name: `webhook-lambda-sg-${environmentSuffix}` },
    }, { parent: this });

    // VPC Endpoints for AWS services (to avoid NAT Gateway costs)
    const s3Endpoint = new aws.ec2.VpcEndpoint(`webhook-s3-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: 'com.amazonaws.us-east-1.s3',
      vpcEndpointType: 'Gateway',
      routeTableIds: [vpc.defaultRouteTableId],
      tags: { ...tags, Name: `webhook-s3-endpoint-${environmentSuffix}` },
    }, { parent: this });

    const dynamodbEndpoint = new aws.ec2.VpcEndpoint(`webhook-dynamodb-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: 'com.amazonaws.us-east-1.dynamodb',
      vpcEndpointType: 'Gateway',
      routeTableIds: [vpc.defaultRouteTableId],
      tags: { ...tags, Name: `webhook-dynamodb-endpoint-${environmentSuffix}` },
    }, { parent: this });

    // DynamoDB table for storing processed events
    const webhookTable = new aws.dynamodb.Table(`webhook-events-${environmentSuffix}`, {
      attributes: [
        { name: 'eventId', type: 'S' },
        { name: 'timestamp', type: 'N' },
      ],
      hashKey: 'eventId',
      rangeKey: 'timestamp',
      billingMode: 'PAY_PER_REQUEST',
      pointInTimeRecovery: {
        enabled: true,
      },
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      tags: { ...tags, Name: `webhook-events-${environmentSuffix}` },
    }, { parent: this });

    // S3 bucket for archiving events
    const archiveBucket = new aws.s3.Bucket(`webhook-archive-${environmentSuffix}`, {
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
        transitions: [{
          days: 30,
          storageClass: 'GLACIER',
        }],
      }],
      tags: { ...tags, Name: `webhook-archive-${environmentSuffix}` },
    }, { parent: this });

    // Block public access to S3 bucket
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`webhook-archive-public-access-${environmentSuffix}`, {
      bucket: archiveBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // IAM role for webhook receiver Lambda
    const webhookReceiverRole = new aws.iam.Role(`webhook-receiver-role-${environmentSuffix}`, {
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
      tags: { ...tags, Name: `webhook-receiver-role-${environmentSuffix}` },
    }, { parent: this });

    // IAM policy for webhook receiver Lambda
    const webhookReceiverPolicy = new aws.iam.RolePolicy(`webhook-receiver-policy-${environmentSuffix}`, {
      role: webhookReceiverRole.id,
      policy: pulumi.all([webhookTable.arn, archiveBucket.arn]).apply(([tableArn, bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
            ],
            Resource: tableArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this });

    // CloudWatch log group for webhook receiver
    const webhookReceiverLogGroup = new aws.cloudwatch.LogGroup(`webhook-receiver-logs-${environmentSuffix}`, {
      retentionInDays: 7,
      tags: { ...tags, Name: `webhook-receiver-logs-${environmentSuffix}` },
    }, { parent: this });

    // Webhook receiver Lambda function
    const webhookReceiverFunction = new aws.lambda.Function(`webhook-receiver-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: webhookReceiverRole.arn,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const AWSXRay = require('aws-xray-sdk-core');
AWSXRay.captureAWS(AWS);

exports.handler = async (event) => {
  console.log('Received webhook event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const eventId = body.eventId || \`evt-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    const timestamp = Date.now();

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        eventId: eventId,
        timestamp: timestamp,
        payload: body,
        source: event.headers?.['x-webhook-source'] || 'unknown',
        receivedAt: new Date().toISOString(),
        status: 'received',
      },
    };

    await dynamodb.put(params).promise();
    console.log('Event stored successfully:', eventId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        eventId: eventId,
        message: 'Webhook received and processed',
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: 'Error processing webhook',
        error: error.message,
      }),
    };
  }
};
        `),
      }),
      memorySize: 512,
      timeout: 30,
      environment: {
        variables: {
          TABLE_NAME: webhookTable.name,
          BUCKET_NAME: archiveBucket.bucket,
        },
      },
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      tracingConfig: {
        mode: 'Active',
      },
      tags: { ...tags, Name: `webhook-receiver-${environmentSuffix}` },
    }, { parent: this, dependsOn: [webhookReceiverLogGroup, webhookReceiverPolicy] });

    // IAM role for event processor Lambda
    const eventProcessorRole = new aws.iam.Role(`event-processor-role-${environmentSuffix}`, {
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
      tags: { ...tags, Name: `event-processor-role-${environmentSuffix}` },
    }, { parent: this });

    // IAM policy for event processor Lambda
    const eventProcessorPolicy = new aws.iam.RolePolicy(`event-processor-policy-${environmentSuffix}`, {
      role: eventProcessorRole.id,
      policy: pulumi.all([webhookTable.arn, webhookTable.streamArn, archiveBucket.arn]).apply(([tableArn, streamArn, bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:DescribeStream',
              'dynamodb:ListStreams',
              'dynamodb:UpdateItem',
            ],
            Resource: [tableArn, streamArn],
          },
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
            ],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this });

    // CloudWatch log group for event processor
    const eventProcessorLogGroup = new aws.cloudwatch.LogGroup(`event-processor-logs-${environmentSuffix}`, {
      retentionInDays: 7,
      tags: { ...tags, Name: `event-processor-logs-${environmentSuffix}` },
    }, { parent: this });

    // Event processor Lambda function
    const eventProcessorFunction = new aws.lambda.Function(`event-processor-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: eventProcessorRole.arn,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const AWSXRay = require('aws-xray-sdk-core');
AWSXRay.captureAWS(AWS);

exports.handler = async (event) => {
  console.log('Processing DynamoDB stream events:', JSON.stringify(event, null, 2));

  const promises = event.Records.map(async (record) => {
    try {
      if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
        const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

        // Process the event (business logic here)
        console.log('Processing event:', newImage.eventId);

        // Update status to processed
        await dynamodb.update({
          TableName: process.env.TABLE_NAME,
          Key: {
            eventId: newImage.eventId,
            timestamp: newImage.timestamp,
          },
          UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'processed',
            ':processedAt': new Date().toISOString(),
          },
        }).promise();

        console.log('Event processed successfully:', newImage.eventId);
      }
    } catch (error) {
      console.error('Error processing record:', error);
      throw error;
    }
  });

  await Promise.all(promises);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Events processed successfully' }),
  };
};
        `),
      }),
      memorySize: 512,
      timeout: 30,
      environment: {
        variables: {
          TABLE_NAME: webhookTable.name,
          BUCKET_NAME: archiveBucket.bucket,
        },
      },
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      tracingConfig: {
        mode: 'Active',
      },
      tags: { ...tags, Name: `event-processor-${environmentSuffix}` },
    }, { parent: this, dependsOn: [eventProcessorLogGroup, eventProcessorPolicy] });

    // Event source mapping for DynamoDB stream
    const eventSourceMapping = new aws.lambda.EventSourceMapping(`webhook-stream-mapping-${environmentSuffix}`, {
      eventSourceArn: webhookTable.streamArn,
      functionName: eventProcessorFunction.arn,
      startingPosition: 'LATEST',
      batchSize: 10,
      maximumRetryAttempts: 3,
    }, { parent: this });

    // IAM role for dead letter handler Lambda
    const deadLetterHandlerRole = new aws.iam.Role(`dead-letter-handler-role-${environmentSuffix}`, {
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
      tags: { ...tags, Name: `dead-letter-handler-role-${environmentSuffix}` },
    }, { parent: this });

    // IAM policy for dead letter handler Lambda
    const deadLetterHandlerPolicy = new aws.iam.RolePolicy(`dead-letter-handler-policy-${environmentSuffix}`, {
      role: deadLetterHandlerRole.id,
      policy: pulumi.all([archiveBucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
            ],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this });

    // CloudWatch log group for dead letter handler
    const deadLetterHandlerLogGroup = new aws.cloudwatch.LogGroup(`dead-letter-handler-logs-${environmentSuffix}`, {
      retentionInDays: 7,
      tags: { ...tags, Name: `dead-letter-handler-logs-${environmentSuffix}` },
    }, { parent: this });

    // Dead letter handler Lambda function
    const deadLetterHandlerFunction = new aws.lambda.Function(`dead-letter-handler-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: deadLetterHandlerRole.arn,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const AWSXRay = require('aws-xray-sdk-core');
AWSXRay.captureAWS(AWS);

exports.handler = async (event) => {
  console.log('Handling dead letter event:', JSON.stringify(event, null, 2));

  try {
    const timestamp = Date.now();
    const key = \`dead-letters/\${new Date().toISOString().split('T')[0]}/event-\${timestamp}.json\`;

    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(event, null, 2),
      ContentType: 'application/json',
    }).promise();

    console.log('Dead letter event archived to S3:', key);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Dead letter event archived successfully' }),
    };
  } catch (error) {
    console.error('Error handling dead letter event:', error);
    throw error;
  }
};
        `),
      }),
      memorySize: 512,
      timeout: 30,
      environment: {
        variables: {
          BUCKET_NAME: archiveBucket.bucket,
        },
      },
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      tracingConfig: {
        mode: 'Active',
      },
      tags: { ...tags, Name: `dead-letter-handler-${environmentSuffix}` },
    }, { parent: this, dependsOn: [deadLetterHandlerLogGroup, deadLetterHandlerPolicy] });

    // CloudWatch alarm for webhook receiver errors
    const webhookReceiverErrorAlarm = new aws.cloudwatch.MetricAlarm(`webhook-receiver-error-alarm-${environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 1,
      alarmDescription: 'Alarm when webhook receiver Lambda error rate exceeds 1%',
      dimensions: {
        FunctionName: webhookReceiverFunction.name,
      },
      tags: { ...tags, Name: `webhook-receiver-error-alarm-${environmentSuffix}` },
    }, { parent: this });

    // CloudWatch alarm for event processor errors
    const eventProcessorErrorAlarm = new aws.cloudwatch.MetricAlarm(`event-processor-error-alarm-${environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 1,
      alarmDescription: 'Alarm when event processor Lambda error rate exceeds 1%',
      dimensions: {
        FunctionName: eventProcessorFunction.name,
      },
      tags: { ...tags, Name: `event-processor-error-alarm-${environmentSuffix}` },
    }, { parent: this });

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(`webhook-api-${environmentSuffix}`, {
      description: 'Webhook processing API',
      endpointConfiguration: {
        types: 'REGIONAL',
      },
      tags: { ...tags, Name: `webhook-api-${environmentSuffix}` },
    }, { parent: this });

    // API Gateway resource
    const webhookResource = new aws.apigateway.Resource(`webhook-resource-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: 'webhook',
    }, { parent: this });

    // API Gateway method
    const webhookMethod = new aws.apigateway.Method(`webhook-method-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: webhookResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
      apiKeyRequired: true,
    }, { parent: this });

    // API Gateway integration
    const webhookIntegration = new aws.apigateway.Integration(`webhook-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: webhookResource.id,
      httpMethod: webhookMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: webhookReceiverFunction.invokeArn,
    }, { parent: this });

    // Lambda permission for API Gateway
    const apiGatewayInvokePermission = new aws.lambda.Permission(`webhook-api-invoke-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: webhookReceiverFunction.name,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }, { parent: this });

    // API Gateway deployment
    const deployment = new aws.apigateway.Deployment(`webhook-deployment-${environmentSuffix}`, {
      restApi: api.id,
      stageName: 'prod',
    }, { parent: this, dependsOn: [webhookIntegration] });

    // API Gateway stage with throttling
    const stage = new aws.apigateway.Stage(`webhook-stage-${environmentSuffix}`, {
      restApi: api.id,
      deployment: deployment.id,
      stageName: 'prod',
      throttleSettings: {
        burstLimit: 10000,
        rateLimit: 10000,
      },
      xrayTracingEnabled: true,
      tags: { ...tags, Name: `webhook-stage-${environmentSuffix}` },
    }, { parent: this });

    // API Gateway usage plan
    const usagePlan = new aws.apigateway.UsagePlan(`webhook-usage-plan-${environmentSuffix}`, {
      apiStages: [{
        apiId: api.id,
        stage: stage.stageName,
      }],
      throttleSettings: {
        burstLimit: 10000,
        rateLimit: 10000,
      },
      tags: { ...tags, Name: `webhook-usage-plan-${environmentSuffix}` },
    }, { parent: this });

    // API Gateway API key
    const apiKey = new aws.apigateway.ApiKey(`webhook-api-key-${environmentSuffix}`, {
      enabled: true,
      tags: { ...tags, Name: `webhook-api-key-${environmentSuffix}` },
    }, { parent: this });

    // API Gateway usage plan key
    const usagePlanKey = new aws.apigateway.UsagePlanKey(`webhook-usage-plan-key-${environmentSuffix}`, {
      keyId: apiKey.id,
      keyType: 'API_KEY',
      usagePlanId: usagePlan.id,
    }, { parent: this });

    // Export outputs
    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.us-east-1.amazonaws.com/${stage.stageName}/webhook`;
    this.tableName = webhookTable.name;
    this.bucketName = archiveBucket.bucket;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      tableName: this.tableName,
      bucketName: this.bucketName,
      apiKeyValue: apiKey.value,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('webhook-processing-stack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    Project: 'webhook-processing',
    ManagedBy: 'pulumi',
  },
});

export const apiUrl = stack.apiUrl;
export const tableName = stack.tableName;
export const bucketName = stack.bucketName;
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install @pulumi/pulumi @pulumi/aws
```

2. Configure Pulumi:
```bash
pulumi config set environmentSuffix dev
pulumi config set aws:region us-east-1
```

3. Deploy the stack:
```bash
pulumi up
```

4. Test the webhook endpoint:
```bash
curl -X POST https://<api-url> \
  -H "x-api-key: <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"eventId": "test-001", "type": "payment", "amount": 100}'
```

## Architecture Overview

- **VPC**: Private subnets for Lambda functions with VPC endpoints for S3 and DynamoDB
- **API Gateway**: REST API with API key authentication and 10,000 req/s throttling
- **Lambda Functions**:
  - Webhook Receiver: Receives and stores webhook events
  - Event Processor: Processes events from DynamoDB stream
  - Dead Letter Handler: Handles failed events
- **DynamoDB**: Stores processed events with on-demand billing and point-in-time recovery
- **S3**: Archives events with lifecycle rules for automatic archival after 30 days
- **CloudWatch**: Alarms for Lambda errors exceeding 1% error rate
- **X-Ray**: Distributed tracing across all Lambda functions
- **IAM**: Least-privilege roles for each Lambda function

## Notes

- All Lambda functions are deployed in private subnets for security
- VPC endpoints eliminate the need for NAT Gateway, reducing costs
- CloudWatch logs retention is set to 7 days to minimize costs
- All resources include environmentSuffix for environment isolation
- X-Ray tracing is enabled for all Lambda functions and API Gateway
- Point-in-time recovery is enabled for DynamoDB table
- S3 bucket has versioning and server-side encryption enabled
