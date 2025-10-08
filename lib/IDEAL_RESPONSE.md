# Recommendation Engine Infrastructure - Ideal Implementation

This implementation provides a complete, production-ready recommendation engine infrastructure using AWS CDK with TypeScript.

## Architecture Overview

The system consists of:
1. Kinesis Data Stream for real-time event ingestion (4 shards)
2. Lambda functions for stream and batch processing (Python 3.11)
3. DynamoDB table for user profiles with auto-scaling
4. S3 bucket for model artifacts storage
5. CloudWatch alarms for monitoring
6. EventBridge rule for scheduled batch processing
7. Proper IAM roles and permissions

## Code Implementation

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RecommendationEngineStack } from './recommendation-engine-stack';

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

    new RecommendationEngineStack(this, 'RecommendationEngine', {
      environmentSuffix,
    });
  }
}
```

### lib/recommendation-engine-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { KinesisEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

interface RecommendationEngineStackProps {
  environmentSuffix: string;
}

export class RecommendationEngineStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: RecommendationEngineStackProps
  ) {
    super(scope, id);

    const stackName = `recommendation-${props.environmentSuffix}`;

    // Kinesis Data Stream for event ingestion
    const eventStream = new kinesis.Stream(this, 'EventStream', {
      streamName: `${stackName}-user-events`,
      streamMode: kinesis.StreamMode.PROVISIONED,
      shardCount: 4,
      retentionPeriod: cdk.Duration.hours(24),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for user profiles with auto-scaling
    const userProfilesTable = new dynamodb.Table(this, 'UserProfiles', {
      tableName: `${stackName}-user-profiles`,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable auto-scaling for DynamoDB
    const readScaling = userProfilesTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 100,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    const writeScaling = userProfilesTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 100,
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    // S3 bucket for model artifacts
    const modelArtifactsBucket = new s3.Bucket(this, 'ModelArtifacts', {
      bucketName: `${stackName}-model-artifacts-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Note: SageMaker endpoint creation would require actual model artifacts in S3
    // For this infrastructure setup, we'll create placeholder outputs instead
    // In production, you would upload model.tar.gz to S3 before deploying
    const sagemakerEndpointName = `${stackName}-endpoint`;

    // Lambda function for real-time stream processing
    const streamProcessorFunction = new lambda.Function(
      this,
      'StreamProcessor',
      {
        functionName: `${stackName}-stream-processor`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda', 'stream-processor')
        ),
        timeout: cdk.Duration.seconds(60),
        reservedConcurrentExecutions: 50,
        environment: {
          TABLE_NAME: userProfilesTable.tableName,
          ENDPOINT_NAME: sagemakerEndpointName,
        },
        logRetention: logs.RetentionDays.ONE_DAY,
      }
    );

    // Grant permissions to Lambda
    userProfilesTable.grantWriteData(streamProcessorFunction);
    streamProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sagemaker:InvokeEndpoint'],
        resources: [
          `arn:aws:sagemaker:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:endpoint/${sagemakerEndpointName}`,
        ],
      })
    );

    // Add Kinesis as event source for Lambda
    streamProcessorFunction.addEventSource(
      new KinesisEventSource(eventStream, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        retryAttempts: 3,
      })
    );

    // Lambda function for batch processing
    const batchProcessorFunction = new lambda.Function(this, 'BatchProcessor', {
      functionName: `${stackName}-batch-processor`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, 'lambda', 'batch-processor')
      ),
      timeout: cdk.Duration.minutes(15),
      environment: {
        TABLE_NAME: userProfilesTable.tableName,
        BUCKET_NAME: modelArtifactsBucket.bucketName,
        ENDPOINT_NAME: sagemakerEndpointName,
      },
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    userProfilesTable.grantReadData(batchProcessorFunction);
    modelArtifactsBucket.grantReadWrite(batchProcessorFunction);
    batchProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sagemaker:InvokeEndpoint'],
        resources: [
          `arn:aws:sagemaker:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:endpoint/${sagemakerEndpointName}`,
        ],
      })
    );

    // EventBridge rule for batch processing (runs daily at 2 AM)
    const batchProcessingRule = new events.Rule(this, 'BatchProcessingRule', {
      ruleName: `${stackName}-batch-processing`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
      }),
    });

    batchProcessingRule.addTarget(
      new targets.LambdaFunction(batchProcessorFunction)
    );

    // CloudWatch alarms for monitoring
    new cloudwatch.Alarm(this, 'LambdaLatencyAlarm', {
      alarmName: `${stackName}-lambda-latency`,
      metric: streamProcessorFunction.metricDuration({
        statistic: 'Average',
      }),
      threshold: 30000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${stackName}-lambda-errors`,
      metric: streamProcessorFunction.metricErrors({
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Kinesis monitoring
    new cloudwatch.Alarm(this, 'KinesisIteratorAgeAlarm', {
      alarmName: `${stackName}-kinesis-iterator-age`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Kinesis',
        metricName: 'GetRecords.IteratorAgeMilliseconds',
        dimensionsMap: {
          StreamName: eventStream.streamName,
        },
        statistic: 'Maximum',
      }),
      threshold: 60000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // DynamoDB monitoring
    new cloudwatch.Alarm(this, 'DynamoReadThrottleAlarm', {
      alarmName: `${stackName}-dynamo-read-throttle`,
      metric: userProfilesTable.metricUserErrors({
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Outputs
    new cdk.CfnOutput(this, 'StreamName', {
      value: eventStream.streamName,
      description: 'Kinesis Stream Name',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: userProfilesTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: modelArtifactsBucket.bucketName,
      description: 'S3 Bucket Name for Model Artifacts',
    });

    new cdk.CfnOutput(this, 'EndpointName', {
      value: sagemakerEndpointName,
      description: 'SageMaker Endpoint Name (placeholder)',
    });

    new cdk.CfnOutput(this, 'StreamProcessorFunctionName', {
      value: streamProcessorFunction.functionName,
      description: 'Stream Processor Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'BatchProcessorFunctionName', {
      value: batchProcessorFunction.functionName,
      description: 'Batch Processor Lambda Function Name',
    });
  }
}
```

### lib/lambda/stream-processor/index.py

```python
import json
import base64
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sagemaker_runtime = boto3.client('sagemaker-runtime')

table_name = os.environ['TABLE_NAME']
endpoint_name = os.environ['ENDPOINT_NAME']

table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    processed_records = 0
    failed_records = 0

    for record in event['Records']:
        try:
            payload = base64.b64decode(record['kinesis']['data'])
            data = json.loads(payload)

            user_id = data.get('userId')
            interaction_type = data.get('interactionType', 'view')
            item_id = data.get('itemId')
            timestamp = data.get('timestamp', datetime.utcnow().isoformat())

            if not user_id or not item_id:
                failed_records += 1
                continue

            # Update user profile in DynamoDB
            response = table.update_item(
                Key={'userId': user_id},
                UpdateExpression='SET lastInteraction = :timestamp, interactionCount = if_not_exists(interactionCount, :zero) + :inc, lastItemId = :itemId',
                ExpressionAttributeValues={
                    ':timestamp': timestamp,
                    ':zero': 0,
                    ':inc': 1,
                    ':itemId': item_id
                },
                ReturnValues='UPDATED_NEW'
            )

            processed_records += 1

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            failed_records += 1

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processedRecords': processed_records,
            'failedRecords': failed_records
        })
    }
```

### lib/lambda/batch-processor/index.py

```python
import json
import boto3
import os
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sagemaker_runtime = boto3.client('sagemaker-runtime')

table_name = os.environ['TABLE_NAME']
bucket_name = os.environ['BUCKET_NAME']
endpoint_name = os.environ['ENDPOINT_NAME']

table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    print(f"Starting batch processing at {datetime.utcnow().isoformat()}")

    processed_users = 0
    recommendations_generated = 0

    try:
        # Scan DynamoDB for active users (last interaction within 30 days)
        cutoff_date = (datetime.utcnow() - timedelta(days=30)).isoformat()

        response = table.scan(
            FilterExpression='lastInteraction > :cutoff',
            ExpressionAttributeValues={
                ':cutoff': cutoff_date
            }
        )

        users = response.get('Items', [])

        # Process users in batches
        for user in users:
            user_id = user['userId']

            # Generate recommendations using SageMaker endpoint
            try:
                inference_response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=endpoint_name,
                    ContentType='application/json',
                    Body=json.dumps({
                        'userId': user_id,
                        'interactionCount': user.get('interactionCount', 0),
                        'lastItemId': user.get('lastItemId', '')
                    })
                )

                recommendations = json.loads(inference_response['Body'].read().decode())

                # Update user profile with recommendations
                table.update_item(
                    Key={'userId': user_id},
                    UpdateExpression='SET recommendations = :recs, lastUpdated = :timestamp',
                    ExpressionAttributeValues={
                        ':recs': recommendations,
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )

                recommendations_generated += 1

            except Exception as e:
                print(f"Error generating recommendations for user {user_id}: {str(e)}")

            processed_users += 1

        # Store batch processing results in S3
        result = {
            'timestamp': datetime.utcnow().isoformat(),
            'processedUsers': processed_users,
            'recommendationsGenerated': recommendations_generated
        }

        s3.put_object(
            Bucket=bucket_name,
            Key=f"batch-results/{datetime.utcnow().strftime('%Y-%m-%d')}/results.json",
            Body=json.dumps(result)
        )

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Batch processing error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Key Features

- **Auto-scaling DynamoDB**: Configured for 5-100 capacity units with 70% target utilization
- **CloudWatch Monitoring**: Alarms for Lambda latency, errors, Kinesis iterator age, and DynamoDB throttling
- **EventBridge Scheduling**: Daily batch processing at 2 AM UTC
- **S3 Configuration**: Versioning and encryption enabled
- **Resource Cleanup**: RemovalPolicy.DESTROY on all resources for easy teardown
- **IAM Permissions**: Properly scoped permissions following least privilege principle
- **Lambda Configuration**: Reserved concurrency for stream processor, extended timeout for batch processor
