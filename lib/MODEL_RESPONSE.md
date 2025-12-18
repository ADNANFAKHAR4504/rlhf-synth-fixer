To create a scalable serverless IoT data processor using AWS CDK and TypeScript, follow these steps. Below is a complete example of how to set up the infrastructure.

### Step 1: Initialize a new CDK project

```bash
mkdir serverless-iot-processor
cd serverless-iot-processor
cdk init app --language typescript
```

### Step 2: Install necessary dependencies

```bash
npm install @aws-cdk/aws-lambda @aws-cdk/aws-s3 @aws-cdk/aws-dynamodb @aws-cdk/aws-iam @aws-cdk/aws-logs
```

### Step 3: Define the CDK Stack

Replace the contents of `lib/serverless-iot-processor-stack.ts` with the following:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ServerlessIotProcessorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    const iotBucket = new s3.Bucket(this, 'IoTDataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create a DynamoDB table
    const dataTable = new dynamodb.Table(this, 'IoTDataTable', {
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create a dedicated IAM role for the Lambda function
    const lambdaRole = new iam.Role(this, 'IoTDataProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions to the Lambda role
    iotBucket.grantRead(lambdaRole);
    dataTable.grantWriteData(lambdaRole);

    // Create the Lambda function
    const lambdaFunction = new lambda.Function(this, 'IoTDataProcessor', {
      functionName: 'IoTDataProcessor',
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'iotDataProcessor.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        DATA_TABLE_NAME: dataTable.tableName,
      },
      role: lambdaRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Create a specific log group
    new logs.LogGroup(this, 'IoTDataProcessorLogGroup', {
      logGroupName: '/aws/lambda/IoTDataProcessor',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add S3 trigger to the Lambda function
    lambdaFunction.addEventSource(new lambda_event_sources.S3EventSource(iotBucket, {
      events: [s3.EventType.OBJECT_CREATED],
    }));
  }
}
```

### Step 4: Create the Lambda Function Code

Create a directory named `lambda` and add a file `iotDataProcessor.ts` with the following content:

```typescript
import { DynamoDB } from 'aws-sdk';
import { S3Event } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient();
const DATA_TABLE_NAME = process.env.DATA_TABLE_NAME!;

export const handler = async (event: S3Event) => {
  console.log('Processing S3 event:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      // Simulate data processing
      const processedData = {
        deviceId: objectKey,
        timestamp: new Date().toISOString(),
        data: 'processed',
      };

      // Store the processed data in DynamoDB
      await dynamoDb.put({
        TableName: DATA_TABLE_NAME,
        Item: processedData,
      }).promise();

      console.log(`Successfully processed data for object ${objectKey} from bucket ${bucketName}`);
    } catch (error) {
      console.error(`Error processing data for object ${objectKey} from bucket ${bucketName}:`, error);
    }
  }
};
```

### Step 5: Update `bin/serverless-iot-processor.ts`

Ensure the stack is instantiated in the `us-west-2` region:

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessIotProcessorStack } from '../lib/serverless-iot-processor-stack';

const app = new cdk.App();
new ServerlessIotProcessorStack(app, 'ServerlessIotProcessorStack', {
  env: { region: 'us-west-2' },
});
```

### Step 6: Add a README.md

Create a `README.md` file with the following content:

```markdown
# Scalable Serverless IoT Data Processor

This project sets up a scalable serverless infrastructure using AWS CDK and TypeScript to process IoT device data in near real-time.

## Features

- **AWS Lambda**: To process IoT data.
- **Amazon S3**: To store raw IoT data.
- **Amazon DynamoDB**: To store processed data.
- **IAM Role**: For least privilege access.
- **CloudWatch Logs**: For logging and monitoring.

## Prerequisites

- AWS CLI installed and configured.
- Node.js and npm installed.
- AWS CDK installed.

## Deployment

1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Deploy the stack:
   ```bash
   cdk deploy
   ```

## Architecture

- **Lambda Function**: Triggered by S3 PUT events, processes data, and writes to DynamoDB.
- **S3 Bucket**: Stores raw IoT data files.
- **DynamoDB Table**: Stores processed IoT data.
- **IAM Role**: Grants necessary permissions to the Lambda function.

## Security

The Lambda function's IAM role is configured with the least privilege principle, allowing only necessary access to S3, DynamoDB, and CloudWatch Logs.

## Monitoring

All logs are stored in CloudWatch Logs under the `/aws/lambda/IoTDataProcessor` log group.
```

### Step 7: Deploy the CDK Stack

```bash
cdk deploy
```

This setup ensures that the serverless infrastructure is scalable, resilient, and secure, adhering to the specified requirements.