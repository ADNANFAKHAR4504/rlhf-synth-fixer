import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
  logsTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
  public readonly processingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'S3ProcessorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        DynamoDBWritePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
              resources: [props.logsTable.tableArn],
            }),
          ],
        }),
        S3ReadPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:GetObjectVersion'],
              resources: ['*'], // Will be restricted by S3 bucket policy
            }),
          ],
        }),
      },
    });

    // Create Lambda function with Python 3.13 runtime (latest feature)
    this.processingFunction = new lambda.Function(this, 'S3ObjectProcessor', {
      functionName: `s3-object-processor-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_13, // Latest Python runtime
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import uuid
from datetime import datetime
import os

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Process S3 object creation events and log to DynamoDB
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Process each S3 record
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                # Safely extract S3 information with validation
                s3_info = record.get('s3', {})
                bucket_info = s3_info.get('bucket', {})
                object_info = s3_info.get('object', {})
                
                bucket_name = bucket_info.get('name', 'unknown')
                object_key = object_info.get('key', 'unknown')
                event_name = record.get('eventName', 'unknown')
                
                # Skip if essential information is missing
                if bucket_name == 'unknown' or object_key == 'unknown':
                    print(f"Skipping record with incomplete S3 information")
                    continue
                
                # Log invocation to DynamoDB
                response = table.put_item(
                    Item={
                        'requestId': request_id,
                        'timestamp': timestamp,
                        'bucketName': bucket_name,
                        'objectKey': object_key,
                        'eventName': event_name,
                        'functionName': context.function_name,
                        'functionVersion': context.function_version,
                        'awsRequestId': context.aws_request_id
                    }
                )
                
                print(f"Logged invocation to DynamoDB: {request_id}")
                
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 event',
                'requestId': request_id,
                'timestamp': timestamp
            })
        }
        
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        # Log error to DynamoDB
        error_request_id = str(uuid.uuid4())
        error_timestamp = datetime.utcnow().isoformat() + 'Z'
        
        try:
            table.put_item(
                Item={
                    'requestId': error_request_id,
                    'timestamp': error_timestamp,
                    'errorMessage': str(e),
                    'functionName': context.function_name,
                    'status': 'ERROR'
                }
            )
        except Exception as log_error:
            print(f"Failed to log error to DynamoDB: {str(log_error)}")
        
        # Return error response instead of raising
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing S3 event',
                'error': str(e)
            })
        }
`),
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: props.logsTable.tableName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      description: 'Process S3 object creation events and log to DynamoDB',
    });

    // Add tags
    cdk.Tags.of(this.processingFunction).add(
      'Environment',
      props.environmentSuffix
    );
    cdk.Tags.of(this.processingFunction).add('Purpose', 'S3EventProcessing');

    // Add outputs
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.processingFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `LambdaFunctionName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.processingFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: `LambdaFunctionArn-${props.environmentSuffix}`,
    });
  }
}
