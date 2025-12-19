# Enhanced AWS Serverless Infrastructure with EventBridge and X-Ray

I'll help you create a comprehensive serverless infrastructure using AWS CDK TypeScript with Lambda function, S3 bucket, DynamoDB table, EventBridge custom bus, X-Ray tracing, and proper IAM roles. This enhanced infrastructure includes event-driven architecture and distributed tracing capabilities.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create DynamoDB table for Lambda invocation logs
    const logsTable = new dynamodb.Table(this, 'LambdaInvocationLogs', {
      tableName: `lambda-invocation-logs-${environmentSuffix}`,
      partitionKey: {
        name: 'requestId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add global secondary index for querying by timestamp
    logsTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Create EventBridge custom bus
    const customEventBus = new events.EventBus(this, 'ProcessingEventBus', {
      eventBusName: `processing-events-${environmentSuffix}`,
      description: 'Custom event bus for S3 processing events',
    });

    // Create CloudWatch log group for EventBridge rule targets
    const eventLogGroup = new logs.LogGroup(this, 'EventProcessingLogGroup', {
      logGroupName: `/aws/events/processing-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create EventBridge rules for different event types
    const successEventRule = new events.Rule(this, 'SuccessEventRule', {
      eventBus: customEventBus,
      ruleName: `s3-processing-success-${environmentSuffix}`,
      description: 'Rule for successful S3 processing events',
      eventPattern: {
        source: ['custom.s3.processor'],
        detailType: ['S3 Object Processed Successfully'],
        detail: {
          status: ['SUCCESS']
        }
      },
      targets: [
        new targets.CloudWatchLogGroup(eventLogGroup, {
          logEvent: targets.LogGroupTargetInput.fromObject({
            timestamp: events.EventField.fromPath('$.time'),
            source: events.EventField.fromPath('$.source'),
            account: events.EventField.fromPath('$.account'),
            region: events.EventField.fromPath('$.region'),
            detail: events.EventField.fromPath('$.detail')
          })
        })
      ]
    });

    const errorEventRule = new events.Rule(this, 'ErrorEventRule', {
      eventBus: customEventBus,
      ruleName: `s3-processing-error-${environmentSuffix}`,
      description: 'Rule for error events in S3 processing',
      eventPattern: {
        source: ['custom.s3.processor'],
        detailType: ['S3 Object Processing Error'],
        detail: {
          status: ['ERROR']
        }
      },
      targets: [
        new targets.CloudWatchLogGroup(eventLogGroup, {
          logEvent: targets.LogGroupTargetInput.fromObject({
            timestamp: events.EventField.fromPath('$.time'),
            source: events.EventField.fromPath('$.source'),
            account: events.EventField.fromPath('$.account'),
            region: events.EventField.fromPath('$.region'),
            detail: events.EventField.fromPath('$.detail')
          })
        })
      ]
    });

    // Create IAM role for Lambda function with enhanced permissions
    const lambdaRole = new iam.Role(this, 'S3ProcessorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSXRayDaemonWriteAccess'
        ),
      ],
      inlinePolicies: {
        DynamoDBWritePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
              resources: [logsTable.tableArn],
            }),
          ],
        }),
        S3ReadPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:GetObjectVersion'],
              resources: ['*'],
            }),
          ],
        }),
        EventBridgePublishPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['events:PutEvents'],
              resources: [customEventBus.eventBusArn],
            }),
          ],
        }),
      },
    });

    // Create Lambda function with Python 3.13 runtime, X-Ray tracing, and EventBridge integration
    const processingFunction = new lambda.Function(this, 'S3ObjectProcessor', {
      functionName: `s3-object-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'index.handler',
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
import json
import boto3
import uuid
from datetime import datetime
import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK calls for X-Ray tracing
patch_all()

dynamodb = boto3.resource('dynamodb')
eventbridge = boto3.client('events')
table_name = os.environ['DYNAMODB_TABLE_NAME']
event_bus_name = os.environ['EVENT_BUS_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('lambda_handler')
def handler(event, context):
    """Process S3 object creation events with X-Ray tracing and EventBridge integration"""
    print(f"Received event: {json.dumps(event)}")
    
    request_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    # Add X-Ray annotations
    xray_recorder.put_annotation("requestId", request_id)
    xray_recorder.put_annotation("functionName", context.function_name)
    
    try:
        processed_objects = []
        
        with xray_recorder.in_subsegment('process_s3_records'):
            for record in event.get('Records', []):
                if record.get('eventSource') == 'aws:s3':
                    bucket_name = record['s3']['bucket']['name']
                    object_key = record['s3']['object']['key']
                    event_name = record['eventName']
                    
                    # Add X-Ray metadata for each object
                    xray_recorder.put_metadata("s3_object", {
                        "bucket": bucket_name,
                        "key": object_key,
                        "event": event_name
                    })
                    
                    # Log to DynamoDB with X-Ray subsegment
                    with xray_recorder.in_subsegment('dynamodb_write'):
                        response = table.put_item(
                            Item={
                                'requestId': request_id,
                                'timestamp': timestamp,
                                'bucketName': bucket_name,
                                'objectKey': object_key,
                                'eventName': event_name,
                                'functionName': context.function_name,
                                'functionVersion': context.function_version,
                                'awsRequestId': context.aws_request_id,
                                'xrayTraceId': os.environ.get('_X_AMZN_TRACE_ID', '')
                            }
                        )
                    
                    processed_objects.append({
                        'bucket': bucket_name,
                        'key': object_key,
                        'event': event_name
                    })
                    
                    print(f"Logged invocation to DynamoDB: {request_id}")
        
        # Publish success event to EventBridge
        with xray_recorder.in_subsegment('publish_success_event'):
            event_detail = {
                'requestId': request_id,
                'timestamp': timestamp,
                'processedObjects': processed_objects,
                'status': 'SUCCESS',
                'functionName': context.function_name,
                'xrayTraceId': os.environ.get('_X_AMZN_TRACE_ID', '')
            }
            
            eventbridge.put_events(
                Entries=[
                    {
                        'Source': 'custom.s3.processor',
                        'DetailType': 'S3 Object Processed Successfully',
                        'Detail': json.dumps(event_detail),
                        'EventBusName': event_bus_name
                    }
                ]
            )
            
            print(f"Published success event to EventBridge: {request_id}")
                
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 event',
                'requestId': request_id,
                'timestamp': timestamp,
                'processedObjects': len(processed_objects)
            })
        }
        
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        error_request_id = str(uuid.uuid4())
        error_timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Add X-Ray error annotation
        xray_recorder.put_annotation("error", str(e))
        
        try:
            # Log error to DynamoDB
            with xray_recorder.in_subsegment('dynamodb_error_write'):
                table.put_item(
                    Item={
                        'requestId': error_request_id,
                        'timestamp': error_timestamp,
                        'errorMessage': str(e),
                        'functionName': context.function_name,
                        'status': 'ERROR',
                        'xrayTraceId': os.environ.get('_X_AMZN_TRACE_ID', '')
                    }
                )
            
            # Publish error event to EventBridge
            with xray_recorder.in_subsegment('publish_error_event'):
                error_detail = {
                    'requestId': error_request_id,
                    'timestamp': error_timestamp,
                    'errorMessage': str(e),
                    'status': 'ERROR',
                    'functionName': context.function_name,
                    'xrayTraceId': os.environ.get('_X_AMZN_TRACE_ID', '')
                }
                
                eventbridge.put_events(
                    Entries=[
                        {
                            'Source': 'custom.s3.processor',
                            'DetailType': 'S3 Object Processing Error',
                            'Detail': json.dumps(error_detail),
                            'EventBusName': event_bus_name
                        }
                    ]
                )
                
                print(f"Published error event to EventBridge: {error_request_id}")
                
        except Exception as log_error:
            print(f"Failed to log error: {str(log_error)}")
        
        raise e
`),
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: logsTable.tableName,
        EVENT_BUS_NAME: customEventBus.eventBusName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      description: 'Process S3 object creation events with X-Ray tracing and EventBridge integration',
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'XRayLayer',
          `arn:aws:lambda:${cdk.Aws.REGION}:580247275435:layer:LambdaInsightsExtension:14`
        )
      ]
    });

    // Create S3 bucket
    const triggerBucket = new s3.Bucket(this, 'ObjectTriggerBucket', {
      bucketName: `object-trigger-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      eventBridgeEnabled: false,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // Add S3 event notification to trigger Lambda function on object creation
    triggerBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processingFunction)
    );

    // Grant Lambda permission to read from S3 bucket
    triggerBucket.grantRead(processingFunction);

    // Add tags
    cdk.Tags.of(logsTable).add('Environment', environmentSuffix);
    cdk.Tags.of(logsTable).add('Purpose', 'LambdaInvocationLogging');
    cdk.Tags.of(processingFunction).add('Environment', environmentSuffix);
    cdk.Tags.of(processingFunction).add('Purpose', 'S3EventProcessing');
    cdk.Tags.of(triggerBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(triggerBucket).add('Purpose', 'LambdaTrigger');
    cdk.Tags.of(customEventBus).add('Environment', environmentSuffix);
    cdk.Tags.of(customEventBus).add('Purpose', 'EventRouting');

    // Add outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: logsTable.tableName,
      description: 'Name of the DynamoDB table for Lambda invocation logs',
      exportName: `DynamoDBTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: logsTable.tableArn,
      description: 'ARN of the DynamoDB table',
      exportName: `DynamoDBTableArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: processingFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `LambdaFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: processingFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: `LambdaFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: triggerBucket.bucketName,
      description: 'Name of the S3 bucket that triggers Lambda function',
      exportName: `S3BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: triggerBucket.bucketArn,
      description: 'ARN of the S3 bucket that triggers Lambda function',
      exportName: `S3BucketArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: customEventBus.eventBusName,
      description: 'Name of the custom EventBridge event bus',
      exportName: `EventBusName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: customEventBus.eventBusArn,
      description: 'ARN of the custom EventBridge event bus',
      exportName: `EventBusArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'XRayServiceMap', {
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/xray/home?region=${cdk.Aws.REGION}#/service-map`,
      description: 'URL to view X-Ray service map',
    });
  }
}
```

This enhanced infrastructure provides:

1. **DynamoDB Table** with point-in-time recovery and timestamp indexing
2. **Lambda Function** with Python 3.13 runtime, active X-Ray tracing, and comprehensive error handling
3. **S3 Bucket** with security best practices and lifecycle management
4. **EventBridge Custom Bus** for event-driven architecture with success and error event routing
5. **X-Ray Integration** with annotations, metadata, and subsegments for distributed tracing
6. **CloudWatch Logs Integration** through EventBridge rules for centralized logging
7. **Enhanced IAM Permissions** supporting EventBridge publishing and X-Ray tracing
8. **Comprehensive Monitoring** with CloudWatch logs and X-Ray service maps
9. **Event Pattern Matching** for routing different types of processing events
10. **Performance Tracking** through X-Ray traces with custom annotations and metadata

Key enhancements include:
- **EventBridge Custom Bus** routes events based on success/error patterns
- **X-Ray Active Tracing** provides end-to-end observability across Lambda and DynamoDB
- **Event Rules** automatically route processing events to CloudWatch for monitoring
- **Enhanced Lambda Code** includes X-Ray SDK integration with subsegments and annotations
- **Distributed Tracing** tracks requests across S3, Lambda, DynamoDB, and EventBridge
