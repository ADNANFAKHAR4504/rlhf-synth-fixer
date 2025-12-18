import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

// Detect LocalStack environment
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // S3 Bucket with versioning and security configurations
    const processingBucket = new s3.Bucket(this, 'ProcessingBucket', {
      bucketName: `serverless-processing-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: !isLocalStack, // LocalStack doesn't enforce SSL
      lifecycleRules: isLocalStack ? [] : [ // LocalStack has limited lifecycle support
        {
          id: 'CostOptimization',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // CRITICAL: autoDeleteObjects requires custom resource with asset publishing
      // This fails in LocalStack, so we remove it for LocalStack environments
      autoDeleteObjects: false,
    });

    // CloudWatch Log Group for Lambda
    const logGroup = new logs.LogGroup(this, 'ProcessorLogGroup', {
      logGroupName: `/aws/lambda/s3-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda with least privilege permissions
    const lambdaRole = new iam.Role(this, 'ProcessorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for S3 event processor Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        S3ProcessingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:PutObjectAcl',
                's3:DeleteObject',
              ],
              resources: [processingBucket.arnForObjects('*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ListBucket',
                's3:GetBucketNotification',
                's3:GetBucketVersioning',
              ],
              resources: [processingBucket.bucketArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [logGroup.logGroupArn, `${logGroup.logGroupArn}:*`],
            }),
          ],
        }),
      },
    });

    // Lambda Function with Python 3.11 runtime
    const processorFunction = new lambda.Function(this, 'S3ProcessorFunction', {
      functionName: `s3-event-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      role: lambdaRole,
      logGroup: logGroup,
      code: lambda.Code.fromInline(`
import json
import logging
import boto3
import urllib.parse
import os
from typing import Dict, Any
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize S3 client with LocalStack endpoint if available
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
s3_config = {'endpoint_url': endpoint_url} if endpoint_url else {}
s3_client = boto3.client('s3', **s3_config)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Process S3 event notifications for object creation
    
    Args:
        event: S3 event notification payload
        context: Lambda context object
        
    Returns:
        Dict containing processing results
    """
    
    try:
        logger.info(f"Received event: {json.dumps(event, indent=2)}")
        
        processing_results = []
        
        # Process each record in the event
        for record in event.get('Records', []):
            result = process_s3_record(record)
            processing_results.append(result)
            
        response = {
            'statusCode': 200,
            'processed_objects': len(processing_results),
            'results': processing_results,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Processing completed: {json.dumps(response, indent=2)}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        raise

def process_s3_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process individual S3 record
    
    Args:
        record: Individual S3 event record
        
    Returns:
        Dict containing processing result for the record
    """
    
    try:
        # Extract S3 object information
        bucket_name = record['s3']['bucket']['name']
        object_key = urllib.parse.unquote_plus(
            record['s3']['object']['key'], 
            encoding='utf-8'
        )
        object_size = record['s3']['object']['size']
        event_name = record['eventName']
        
        logger.info(f"Processing {event_name} for {object_key} in {bucket_name}")
        
        # Get object metadata
        response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
        content_type = response.get('ContentType', 'unknown')
        last_modified = response.get('LastModified')
        
        # Perform processing based on object type
        processing_action = determine_processing_action(content_type, object_key)
        
        # Create processing result record
        result = {
            'bucket': bucket_name,
            'key': object_key,
            'size': object_size,
            'content_type': content_type,
            'event': event_name,
            'processing_action': processing_action,
            'processed_at': datetime.utcnow().isoformat(),
            'last_modified': last_modified.isoformat() if last_modified else None,
            'status': 'success'
        }
        
        # Log processing result
        logger.info(f"Successfully processed {object_key}: {processing_action}")
        
        return result
        
    except Exception as e:
        error_result = {
            'bucket': record.get('s3', {}).get('bucket', {}).get('name', 'unknown'),
            'key': record.get('s3', {}).get('object', {}).get('key', 'unknown'),
            'error': str(e),
            'status': 'error',
            'processed_at': datetime.utcnow().isoformat()
        }
        
        logger.error(f"Error processing record: {json.dumps(error_result, indent=2)}")
        return error_result

def determine_processing_action(content_type: str, object_key: str) -> str:
    """
    Determine appropriate processing action based on object characteristics
    
    Args:
        content_type: MIME type of the object
        object_key: S3 object key
        
    Returns:
        String describing the processing action
    """
    
    if content_type.startswith('image/'):
        return 'image_analysis'
    elif content_type.startswith('text/'):
        return 'text_processing'
    elif content_type == 'application/json':
        return 'json_validation'
    elif object_key.endswith(('.csv', '.xlsx')):
        return 'data_processing'
    elif content_type.startswith('video/'):
        return 'video_analysis'
    else:
        return 'general_processing'
`),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64, // Using Graviton2 for better price-performance
      reservedConcurrentExecutions: 10,
      environment: {
        BUCKET_NAME: processingBucket.bucketName,
        LOG_LEVEL: 'INFO',
        ENVIRONMENT: environmentSuffix,
      },
      description:
        'Processes S3 object creation events with comprehensive logging and error handling',
    });

    // Configure S3 event notifications to trigger Lambda
    processingBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorFunction),
      {
        prefix: 'incoming/',
        suffix: '',
      }
    );

    // Additional event notification for object removal (optional)
    processingBucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED,
      new s3n.LambdaDestination(processorFunction)
    );

    // Create CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      'ProcessingDashboard',
      {
        dashboardName: `serverless-processing-${environmentSuffix}`,
        widgets: [
          [
            new cdk.aws_cloudwatch.GraphWidget({
              title: 'Lambda Function Metrics',
              left: [processorFunction.metricInvocations()],
              right: [
                processorFunction.metricErrors(),
                processorFunction.metricThrottles(),
              ],
            }),
          ],
          [
            new cdk.aws_cloudwatch.GraphWidget({
              title: 'Lambda Duration and Memory',
              left: [processorFunction.metricDuration()],
              right: [processorFunction.metric('MemoryUtilization')],
            }),
          ],
        ],
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: processingBucket.bucketName,
      description: 'S3 bucket name for serverless processing',
      exportName: `${this.stackName}-BucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: processorFunction.functionName,
      description: 'Lambda function name for S3 event processing',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: processorFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL for monitoring',
      exportName: `${this.stackName}-DashboardUrl`,
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'ServerlessEventProcessing');
    cdk.Tags.of(this).add('Component', 'EventDrivenArchitecture');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
  }
}
