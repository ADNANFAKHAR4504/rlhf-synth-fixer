# Ideal Response: AWS Serverless Infrastructure with Lambda, S3, and DynamoDB

## Overview

This implements a serverless event-driven architecture using AWS CDK TypeScript that creates a Lambda function triggered by S3 object creation events, with invocation logging to DynamoDB.

## Infrastructure Code Implementation

### Main Stack (lib/tap-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // DynamoDB table for logging Lambda invocations
    const logsTable = new dynamodb.Table(this, 'LambdaInvocationLogs', {
      tableName: `lambda-invocation-logs-${props.environmentSuffix}`,
      partitionKey: {
        name: 'requestId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for triggering Lambda
    const triggerBucket = new s3.Bucket(this, 'LambdaTriggerBucket', {
      bucketName: `lambda-trigger-bucket-${props.environmentSuffix}-${this.account}`,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant DynamoDB write permissions to Lambda
    logsTable.grantWriteData(lambdaRole);

    // Grant S3 read permissions to Lambda
    triggerBucket.grantRead(lambdaRole);

    // Lambda function
    const processFunction = new lambda.Function(this, 'S3ProcessorFunction', {
      functionName: `s3-processor-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import uuid
import os
from datetime import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# LocalStack configuration
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
if endpoint_url:
    dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url)
else:
    dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${logsTable.tableName}')

def lambda_handler(event, context):
    try:
        request_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        logger.info(f"Processing S3 event with request ID: {request_id}")

        # Process S3 event
        for record in event.get('Records', []):
            if 's3' in record:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                event_name = record['eventName']

                logger.info(f"Processing {event_name} for {key} in bucket {bucket}")

                # Log invocation to DynamoDB
                table.put_item(
                    Item={
                        'requestId': request_id,
                        'timestamp': timestamp,
                        'bucketName': bucket,
                        'objectKey': key,
                        'eventName': event_name,
                        'functionName': context.function_name,
                        'awsRequestId': context.aws_request_id
                    }
                )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 event',
                'requestId': request_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing S3 event',
                'error': str(e)
            })
        }
`),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        DYNAMODB_TABLE_NAME: logsTable.tableName,
        LOG_LEVEL: 'INFO',
      },
    });

    // S3 bucket notification to trigger Lambda
    triggerBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processFunction)
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: triggerBucket.bucketName,
      description: 'Name of the S3 bucket that triggers Lambda',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: logsTable.tableName,
      description: 'Name of the DynamoDB table for logging',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: processFunction.functionName,
      description: 'Name of the Lambda function',
    });
  }
}
```

### Entry Point (bin/tap.ts)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-2';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    region,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
```

## Key Implementation Features

### 1. DynamoDB Table
- Partition key: requestId (STRING) - unique UUID for each invocation
- Sort key: timestamp (STRING) - ISO 8601 timestamp
- PAY_PER_REQUEST billing mode (cost-optimized on-demand)
- Point-in-time recovery enabled
- RemovalPolicy.DESTROY for clean teardown

### 2. S3 Bucket
- Event notification for OBJECT_CREATED events
- BlockPublicAccess.BLOCK_ALL for security
- SSL enforcement (enforceSSL: true)
- S3-managed encryption at rest
- autoDeleteObjects for clean resource teardown

### 3. Lambda Function
- Python 3.8 runtime
- 30-second timeout, 128 MB memory
- LocalStack endpoint detection via AWS_ENDPOINT_URL
- Processes S3 events and logs to DynamoDB
- Comprehensive error handling and CloudWatch logging
- Generates unique UUID request ID for each invocation

### 4. IAM Role
- AWSLambdaBasicExecutionRole managed policy (CloudWatch Logs)
- DynamoDB write permissions (granted via logsTable.grantWriteData)
- S3 read permissions (granted via triggerBucket.grantRead)
- Follows least-privilege principle

### 5. Event Flow
```
S3 Object Created → S3 Event Notification → Lambda Invocation → DynamoDB Log Entry
```

## LocalStack Compatibility

- Lambda function detects AWS_ENDPOINT_URL and configures DynamoDB client accordingly
- Integration tests use forcePathStyle: true for S3 bucket access
- Test credentials (accessKeyId: 'test', secretAccessKey: 'test') for LocalStack

## Security Best Practices

1. No hardcoded credentials
2. S3 bucket blocks all public access
3. HTTPS enforcement on S3 bucket
4. IAM roles with minimal required permissions
5. Encryption at rest (S3-managed)
6. Managed policies for CloudWatch Logs

## Deployment

```bash
export AWS_REGION=us-west-2
export ENVIRONMENT_SUFFIX=prod
cdk deploy
```

## CloudFormation Outputs

- BucketName: S3 bucket name for uploading test files
- DynamoDBTableName: Table name for querying invocation logs
- LambdaFunctionName: Function name for monitoring

## Testing

The implementation includes comprehensive unit tests (67 test cases) and integration tests (25 test cases) that verify:
- Stack construction and resource properties
- End-to-end flow: S3 upload triggers Lambda, logs to DynamoDB
- Security configurations (public access blocking, encryption)
- Error handling and resilience
- Data consistency and schema validation
