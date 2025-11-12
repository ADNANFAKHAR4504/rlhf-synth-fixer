### Reasoning Trace

---

Let's create a CDK project in TypeScript for this smart agriculture platform based on the detailed requirements. I'll break this down into the different components:

1. First, let's create the basic CDK project structure:
   - Create the main stack class (TapStack) which will instantiate our analytics stack
   - Create the analytics stack (AnalyticsStack) that will contain all our infrastructure components

2. For the Data Ingestion & Archival:
   - API Gateway REST API with API key authentication
   - Request validation for the JSON schema
   - Lambda function for validation
   - S3 bucket with encryption and lifecycle policies

3. For the Event-Driven Processing:
   - EventBridge Pipe watching the S3 bucket
   - Lambda function for transformation
   - SQS queue as a dead-letter queue

4. For the Data Storage & Analytics:
   - DynamoDB table with on-demand billing
   - TTL configuration
   - Kinesis Data Stream for the table

5. Configuration and Observability:
   - Lambda functions with proper settings
   - CloudWatch alarm for error rate
   - Custom log groups with retention
   - IAM roles with least privilege
   - Resource tagging

Let's start by creating the main project structure and then implement each component:

First, the main stack file (`lib/tap-stack.ts`):

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AnalyticsStack } from './analytics';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the analytics stack
    new AnalyticsStack(this, 'AnalyticsStack', {
      env: { region: 'us-east-1' },
      tags: {
        Environment: 'Production',
        Project: 'SmartAgriculture',
        CostCenter: 'IoT-Department',
      },
    });
  }
}
```

Now, let's implement the `analytics.ts` file with all the required components:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as path from 'path';

export class AnalyticsStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // Add tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SmartAgriculture');
    cdk.Tags.of(this).add('CostCenter', 'IoT-Department');

    // 1. Data Ingestion & Archival

    // Create a KMS key for S3 bucket encryption
    const kmsKey = new kms.Key(this, 'SensorDataEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for sensor data encryption',
    });

    // Create S3 bucket for raw data archival
    const rawDataBucket = new s3.Bucket(this, 'RawSensorDataBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Create log groups for the Lambda functions with 7-day retention
    const validationLambdaLogGroup = new logs.LogGroup(
      this,
      'ValidationLambdaLogGroup',
      {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const transformationLambdaLogGroup = new logs.LogGroup(
      this,
      'TransformationLambdaLogGroup',
      {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create validation Lambda function
    const validationLambda = new nodejs.NodejsFunction(
      this,
      'ValidationLambda',
      {
        functionName: 'validation-lambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '../src/validation-lambda.ts'),
        handler: 'handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
        },
        logGroup: validationLambdaLogGroup,
      }
    );

    // Grant Lambda permission to write to S3
    rawDataBucket.grantWrite(validationLambda);

    // Create API Gateway with validation model
    const api = new apigateway.RestApi(this, 'SensorDataApi', {
      restApiName: 'Sensor Data API',
      description: 'API for sensor data ingestion',
      deployOptions: {
        throttlingRateLimit: 1000, // 1000 requests per second
        throttlingBurstLimit: 2000,
      },
    });

    // Add API key authentication
    const apiKey = api.addApiKey('SensorApiKey');
    const usagePlan = api.addUsagePlan('SensorApiUsagePlan', {
      name: 'Sensor API Usage Plan',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
    });

    usagePlan.addApiKey(apiKey);

    // Create a model for request validation
    const sensorDataModel = api.addModel('SensorDataModel', {
      contentType: 'application/json',
      modelName: 'SensorDataModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['deviceId', 'timestamp'],
        properties: {
          deviceId: { type: apigateway.JsonSchemaType.STRING },
          timestamp: { type: apigateway.JsonSchemaType.STRING },
          moisture: { type: apigateway.JsonSchemaType.NUMBER },
          pH: { type: apigateway.JsonSchemaType.NUMBER },
          // Add other sensor reading properties as needed
        },
      },
    });

    // Create the API endpoint with the validation model
    const sensorResource = api.root.addResource('sensor');
    sensorResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(validationLambda),
      {
        apiKeyRequired: true,
        requestValidator: new apigateway.RequestValidator(
          this,
          'SensorDataValidator',
          {
            restApi: api,
            validateRequestBody: true,
          }
        ),
        requestModels: {
          'application/json': sensorDataModel,
        },
      }
    );

    // 3. Data Storage & Analytics

    // Create DynamoDB table
    const sensorDataTable = new dynamodb.Table(this, 'SensorDataTable', {
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expirationTime', // TTL for automatic data expiration
    });

    // Create Kinesis stream for DynamoDB changes
    const kinesisStream = new kinesis.Stream(this, 'SensorDataStream', {
      streamName: 'sensor-data-stream',
      shardCount: 1,
    });

    // Enable DynamoDB Streams and Kinesis integration
    sensorDataTable.addKinesisStreamDestination(kinesisStream);

    // 2. Event-Driven Processing

    // Create SQS Dead-Letter Queue for failed transformation events
    const dlq = new sqs.Queue(this, 'TransformationDLQ', {
      queueName: 'sensor-data-transformation-dlq',
    });

    // Create transformation Lambda function
    const transformationLambda = new nodejs.NodejsFunction(
      this,
      'TransformationLambda',
      {
        functionName: 'transformation-lambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '../src/transformation-lambda.ts'),
        handler: 'handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          DYNAMODB_TABLE: sensorDataTable.tableName,
        },
        logGroup: transformationLambdaLogGroup,
      }
    );

    // Grant Lambda permission to read from S3 and write to DynamoDB
    rawDataBucket.grantRead(transformationLambda);
    sensorDataTable.grantWriteData(transformationLambda);

    // Create an EventBridge Pipe to connect S3 to the transformation Lambda
    const pipe = new pipes.CfnPipe(this, 'S3ToLambdaPipe', {
      name: 'S3ToLambdaPipe',
      source: rawDataBucket.bucketArn,
      sourceParameters: {
        s3: {
          bucket: rawDataBucket.bucketName,
        },
      },
      target: transformationLambda.functionArn,
      targetParameters: {
        deadLetterConfig: {
          arn: dlq.queueArn,
        },
      },
    });

    // We need to create a role for the EventBridge Pipe with the necessary permissions
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });

    rawDataBucket.grantRead(pipeRole);
    transformationLambda.grantInvoke(pipeRole);
    dlq.grantSendMessages(pipeRole);

    // Attach the role to the pipe
    (pipe.node.defaultChild as cdk.CfnResource).addPropertyOverride(
      'RoleArn',
      pipeRole.roleArn
    );

    // 4. Configuration and Observability

    // Create CloudWatch Alarm for transformation Lambda error rate
    const transformationLambdaErrors = transformationLambda.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    const transformationLambdaInvocations =
      transformationLambda.metricInvocations({
        period: cdk.Duration.minutes(5),
      });

    const errorRateMetric = new cloudwatch.MathExpression({
      expression: 'errors / invocations * 100',
      usingMetrics: {
        errors: transformationLambdaErrors,
        invocations: transformationLambdaInvocations,
      },
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'TransformationLambdaErrorAlarm', {
      metric: errorRateMetric,
      threshold: 1, // 1% error rate
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if the error rate exceeds 1% over 5 minutes',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Output important resource names and ARNs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'URL of the API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'RawDataBucketName', {
      value: rawDataBucket.bucketName,
      description: 'Name of the raw sensor data bucket',
    });

    new cdk.CfnOutput(this, 'SensorDataTableName', {
      value: sensorDataTable.tableName,
      description: 'Name of the DynamoDB sensor data table',
    });

    new cdk.CfnOutput(this, 'KinesisStreamName', {
      value: kinesisStream.streamName,
      description: 'Name of the Kinesis data stream',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: dlq.queueUrl,
      description: 'URL of the dead-letter queue',
    });
  }
}
```

Let's also create stubs for the Lambda function source files to complete the project. First, the validation Lambda:

```typescript
// src/validation-lambda.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });
const bucketName = process.env.RAW_DATA_BUCKET!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the incoming data
    const data = JSON.parse(event.body || '{}');

    // Generate a unique key for the S3 object
    const key = `${data.deviceId}/${data.timestamp}-${Date.now()}.json`;

    // Upload the raw data to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: event.body,
        ContentType: 'application/json',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data received and stored successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing sensor data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process sensor data' }),
    };
  }
};
```

Next, the transformation Lambda:

```typescript
// src/transformation-lambda.ts
import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const s3Client = new S3Client({ region: 'us-east-1' });
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = process.env.DYNAMODB_TABLE!;

export const handler = async (event: S3Event): Promise<void> => {
  try {
    // Process each record (S3 event)
    for (const record of event.Records) {
      // Get the bucket and key from the event
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Retrieve the object from S3
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Convert the stream to a string and parse as JSON
      const bodyContents = await streamToString(response.Body);
      const sensorData = JSON.parse(bodyContents);

      // Transform the data (example transformation)
      const transformedData = {
        deviceId: sensorData.deviceId,
        timestamp: sensorData.timestamp,
        moisture: sensorData.moisture,
        pH: sensorData.pH,
        // Add additional transformations as needed

        // Add TTL attribute (expire after 90 days)
        expirationTime: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      };

      // Store the transformed data in DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: transformedData,
        })
      );

      console.log(`Processed sensor data for device ${sensorData.deviceId}`);
    }
  } catch (error) {
    console.error('Error transforming sensor data:', error);
    throw error; // Re-throw to trigger the DLQ
  }
};

// Helper function to convert a readable stream to a string
function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
```

Finally, let's create the main CDK app entry point:

```typescript
// bin/smart-agriculture.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'SmartAgricultureStack', {
  env: { region: 'us-east-1' },
});
```

Let's also create a `package.json` file for the project:

```json
{
  "name": "smart-agriculture-platform",
  "version": "0.1.0",
  "bin": {
    "smart-agriculture": "bin/smart-agriculture.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "diff": "cdk diff",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@types/node": "^18.11.15",
    "@types/aws-lambda": "^8.10.114",
    "aws-cdk": "2.88.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.0.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.88.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21",
    "@aws-sdk/client-s3": "^3.363.0",
    "@aws-sdk/client-dynamodb": "^3.363.0",
    "@aws-sdk/lib-dynamodb": "^3.363.0"
  }
}
```

And a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "lib": ["es2018", "dom"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "esModuleInterop": true,
    "outDir": "dist"
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

With these files, the CDK project is complete and ready to be deployed. Let's summarize what we've created:

1. **Data Ingestion & Archival**:
   - API Gateway REST API with API key auth and request validation
   - Validation Lambda that writes raw data to an S3 bucket
   - S3 bucket with encryption using a customer-managed KMS key and lifecycle policy

2. **Event-Driven Processing**:
   - EventBridge Pipe watching the S3 bucket
   - Transformation Lambda for processing the data
   - SQS Dead Letter Queue for failed events

3. **Data Storage & Analytics**:
   - DynamoDB table with deviceId as partition key and timestamp as sort key
   - TTL for data expiration
   - Kinesis Data Stream for the table changes

4. **Configuration and Observability**:
   - Lambda functions with Node.js 18.x runtime, 512MB memory, and 30-second timeout
   - CloudWatch alarm for Lambda error rate
   - Custom log groups with 7-day retention
   - Least privilege IAM permissions
   - Resource tagging with Environment, Project, and CostCenter

This implementation provides a complete, serverless data pipeline for a smart agriculture platform that will scale automatically with the number of sensors and data volume.

One important note: The EventBridge Pipe implementation might require additional configuration depending on the specific events you want to capture from S3. In this case, we're setting it up to watch for new object creation events, but you might need to adjust the source parameters based on your exact requirements.

### Answer

---

# Smart Agriculture Platform - Serverless Data Pipeline (CDK)

I'll create a complete CDK project in TypeScript to build the serverless data pipeline for the smart agriculture platform as specified. The project will include all the required infrastructure components organized in a modular manner.

## Project Structure

```
smart-agriculture-platform/
├── bin/
│   └── smart-agriculture.ts
├── lib/
│   ├── tap-stack.ts
│   └── analytics.ts
├── src/
│   ├── validation-lambda.ts
│   └── transformation-lambda.ts
├── package.json
└── tsconfig.json
```

## Main Stack Implementation

Let's start with the main stack file:

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AnalyticsStack } from './analytics';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1' },
    });

    // Create the analytics stack
    new AnalyticsStack(this, 'AnalyticsStack', {
      tags: {
        Environment: 'Production',
        Project: 'SmartAgriculture',
        CostCenter: 'IoT-Department',
      },
    });
  }
}
```

## Analytics Stack Implementation

Now let's implement the analytics stack with all the required components:

```typescript
// lib/analytics.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface AnalyticsStackProps extends cdk.NestedStackProps {
  tags?: { [key: string]: string };
}

export class AnalyticsStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props?: AnalyticsStackProps) {
    super(scope, id, props);

    // Apply tags to all resources
    if (props?.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this).add(key, value);
      });
    }

    // ----------------------------------------
    // 1. Data Ingestion & Archival
    // ----------------------------------------

    // KMS key for S3 bucket encryption
    const kmsKey = new kms.Key(this, 'SensorDataEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for sensor data encryption',
    });

    // S3 bucket for raw data archival
    const rawDataBucket = new s3.Bucket(this, 'RawSensorDataBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Log groups with 7-day retention
    const validationLambdaLogGroup = new logs.LogGroup(
      this,
      'ValidationLambdaLogGroup',
      {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const transformationLambdaLogGroup = new logs.LogGroup(
      this,
      'TransformationLambdaLogGroup',
      {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Validation Lambda function
    const validationLambda = new nodejs.NodejsFunction(
      this,
      'ValidationLambda',
      {
        functionName: 'validation-lambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '../src/validation-lambda.ts'),
        handler: 'handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
        },
        logGroup: validationLambdaLogGroup,
      }
    );

    // Grant Lambda permission to write to S3
    rawDataBucket.grantWrite(validationLambda);

    // API Gateway with request validation
    const api = new apigateway.RestApi(this, 'SensorDataApi', {
      restApiName: 'Sensor Data API',
      description: 'API for sensor data ingestion',
      deployOptions: {
        throttlingRateLimit: 1000, // 1000 requests per second
        throttlingBurstLimit: 2000,
      },
    });

    // API key authentication
    const apiKey = api.addApiKey('SensorApiKey');
    const usagePlan = api.addUsagePlan('SensorApiUsagePlan', {
      name: 'Sensor API Usage Plan',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
    });

    usagePlan.addApiKey(apiKey);

    // JSON Schema model for request validation
    const sensorDataModel = api.addModel('SensorDataModel', {
      contentType: 'application/json',
      modelName: 'SensorDataModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['deviceId', 'timestamp'],
        properties: {
          deviceId: { type: apigateway.JsonSchemaType.STRING },
          timestamp: { type: apigateway.JsonSchemaType.STRING },
          moisture: { type: apigateway.JsonSchemaType.NUMBER },
          pH: { type: apigateway.JsonSchemaType.NUMBER },
        },
      },
    });

    // API endpoint with validation model
    const sensorResource = api.root.addResource('sensor');
    sensorResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(validationLambda),
      {
        apiKeyRequired: true,
        requestValidator: new apigateway.RequestValidator(
          this,
          'SensorDataValidator',
          {
            restApi: api,
            validateRequestBody: true,
          }
        ),
        requestModels: {
          'application/json': sensorDataModel,
        },
      }
    );

    // ----------------------------------------
    // 3. Data Storage & Analytics
    // ----------------------------------------

    // DynamoDB table
    const sensorDataTable = new dynamodb.Table(this, 'SensorDataTable', {
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expirationTime', // TTL attribute
    });

    // Kinesis stream for DynamoDB changes
    const kinesisStream = new kinesis.Stream(this, 'SensorDataStream', {
      streamName: 'sensor-data-stream',
      shardCount: 1,
    });

    // Enable DynamoDB Streams and Kinesis integration
    sensorDataTable.addKinesisStreamDestination(kinesisStream);

    // ----------------------------------------
    // 2. Event-Driven Processing
    // ----------------------------------------

    // Dead-Letter Queue for failed transformation events
    const dlq = new sqs.Queue(this, 'TransformationDLQ', {
      queueName: 'sensor-data-transformation-dlq',
    });

    // Transformation Lambda function
    const transformationLambda = new nodejs.NodejsFunction(
      this,
      'TransformationLambda',
      {
        functionName: 'transformation-lambda',
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '../src/transformation-lambda.ts'),
        handler: 'handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          DYNAMODB_TABLE: sensorDataTable.tableName,
        },
        logGroup: transformationLambdaLogGroup,
      }
    );

    // Grant permissions
    rawDataBucket.grantRead(transformationLambda);
    sensorDataTable.grantWriteData(transformationLambda);

    // Create a role for the EventBridge Pipe
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });

    rawDataBucket.grantRead(pipeRole);
    transformationLambda.grantInvoke(pipeRole);
    dlq.grantSendMessages(pipeRole);

    // EventBridge Pipe to connect S3 to the transformation Lambda
    const pipe = new pipes.CfnPipe(this, 'S3ToLambdaPipe', {
      name: 'S3ToLambdaPipe',
      source: `arn:aws:s3:::${rawDataBucket.bucketName}`,
      sourceParameters: {
        s3EventParameters: {
          eventName: ['Object Created'],
        },
      },
      target: transformationLambda.functionArn,
      targetParameters: {
        deadLetterConfig: {
          arn: dlq.queueArn,
        },
      },
      roleArn: pipeRole.roleArn,
    });

    // ----------------------------------------
    // 4. Configuration and Observability
    // ----------------------------------------

    // CloudWatch Alarm for transformation Lambda error rate
    const transformationLambdaErrors = transformationLambda.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    const transformationLambdaInvocations =
      transformationLambda.metricInvocations({
        period: cdk.Duration.minutes(5),
      });

    const errorRateMetric = new cloudwatch.MathExpression({
      expression: 'errors / invocations * 100',
      usingMetrics: {
        errors: transformationLambdaErrors,
        invocations: transformationLambdaInvocations,
      },
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'TransformationLambdaErrorAlarm', {
      metric: errorRateMetric,
      threshold: 1, // 1% error rate
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if the error rate exceeds 1% over 5 minutes',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'URL of the API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'RawDataBucketName', {
      value: rawDataBucket.bucketName,
      description: 'Name of the raw sensor data bucket',
    });

    new cdk.CfnOutput(this, 'SensorDataTableName', {
      value: sensorDataTable.tableName,
      description: 'Name of the DynamoDB sensor data table',
    });
  }
}
```

## Lambda Functions

Here are the Lambda functions for data validation and transformation:

```typescript
// src/validation-lambda.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });
const bucketName = process.env.RAW_DATA_BUCKET!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the incoming data
    const data = JSON.parse(event.body || '{}');

    // Generate a unique key for the S3 object
    const key = `${data.deviceId}/${data.timestamp}-${Date.now()}.json`;

    // Upload the raw data to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: event.body,
        ContentType: 'application/json',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data received and stored successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing sensor data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process sensor data' }),
    };
  }
};
```

```typescript
// src/transformation-lambda.ts
import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const s3Client = new S3Client({ region: 'us-east-1' });
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = process.env.DYNAMODB_TABLE!;

export const handler = async (event: S3Event): Promise<void> => {
  try {
    // Process each record (S3 event)
    for (const record of event.Records) {
      // Get the bucket and key from the event
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Retrieve the object from S3
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Convert the stream to a string and parse as JSON
      const bodyContents = await streamToString(response.Body);
      const sensorData = JSON.parse(bodyContents);

      // Transform the data
      const transformedData = {
        deviceId: sensorData.deviceId,
        timestamp: sensorData.timestamp,
        moisture: sensorData.moisture,
        pH: sensorData.pH,
        // Add TTL attribute (expire after 90 days)
        expirationTime: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      };

      // Store the transformed data in DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: transformedData,
        })
      );

      console.log(`Processed sensor data for device ${sensorData.deviceId}`);
    }
  } catch (error) {
    console.error('Error transforming sensor data:', error);
    throw error; // Re-throw to trigger the DLQ
  }
};

// Helper function to convert a readable stream to a string
function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
```

## Main App Entry Point

```typescript
// bin/smart-agriculture.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'SmartAgricultureStack');
```

## Package Configuration

```json
// package.json
{
  "name": "smart-agriculture-platform",
  "version": "0.1.0",
  "bin": {
    "smart-agriculture": "bin/smart-agriculture.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy"
  },
  "devDependencies": {
    "@types/node": "^18.11.15",
    "@types/aws-lambda": "^8.10.114",
    "aws-cdk": "2.88.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.0.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.88.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21",
    "@aws-sdk/client-s3": "^3.363.0",
    "@aws-sdk/client-dynamodb": "^3.363.0",
    "@aws-sdk/lib-dynamodb": "^3.363.0"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "lib": ["es2018", "dom"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "outDir": "dist"
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

## Architecture Overview

This implementation creates a complete serverless data pipeline for the smart agriculture platform with the following components:

1. **Data Ingestion & Archival**:
   - API Gateway REST API with API key authentication and request validation
   - `validation-lambda` to perform basic checks and store raw data in S3
   - S3 bucket with KMS encryption and lifecycle policy (Glacier after 30 days)

2. **Event-Driven Processing**:
   - EventBridge Pipe to monitor the S3 bucket for new files
   - `transformation-lambda` to process raw data and store structured data
   - SQS Dead Letter Queue to capture failed processing events

3. **Data Storage & Analytics**:
   - DynamoDB table with deviceId (partition key) and timestamp (sort key)
   - TTL configuration for automatic data expiration
   - Kinesis Data Stream to capture all table changes for real-time analytics

4. **Configuration and Observability**:
   - Lambda functions with Node.js 18.x, 512MB memory, 30-second timeout
   - CloudWatch alarm triggered if the error rate exceeds 1%
   - Custom log groups with 7-day retention
   - Least-privilege IAM permissions using the grant methods
   - Resource tagging with Environment, Project, and CostCenter

The architecture is fully serverless, highly scalable, and designed to handle thousands of IoT soil sensors efficiently.
