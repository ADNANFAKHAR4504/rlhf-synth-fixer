"""
tap_stack.py

Serverless Infrastructure Stack using Pulumi Python

This module creates a complete serverless data processing pipeline that:
1. S3 bucket that triggers Lambda on object creation
2. Lambda function that processes S3 events and extracts metadata
3. DynamoDB table to store metadata
4. CloudWatch Logs for monitoring
5. X-Ray tracing for performance monitoring
6. Proper IAM roles and permissions
7. Security best practices including encryption and tagging
"""

import json
import pulumi
from pulumi import ResourceOptions
from pulumi_aws import (
    s3,
    lambda_,
    dynamodb,
    iam,
    cloudwatch,
    xray
)


def create_s3_bucket(environment_suffix: str, tags: dict) -> s3.Bucket:
    """Create S3 bucket with versioning, encryption, and CORS configuration."""
    
    bucket = s3.Bucket(
        f"serverless-data-bucket-{environment_suffix}",
        versioning=s3.BucketVersioningArgs(
            enabled=True
        ),
        server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
            rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        ),
        tags=tags,
        opts=ResourceOptions(protect=False)
    )
    
    # Add CORS configuration
    s3.BucketCorsConfiguration(
        f"bucket-cors-{environment_suffix}",
        bucket=bucket.id,
        cors_rules=[s3.BucketCorsConfigurationCorsRuleArgs(
            allowed_headers=["*"],
            allowed_methods=["GET", "PUT", "POST", "DELETE", "HEAD"],
            allowed_origins=["*"],
            expose_headers=["ETag"],
            max_age_seconds=3000
        )],
        opts=ResourceOptions(protect=False)
    )
    
    return bucket


def create_dynamodb_table(environment_suffix: str, tags: dict) -> dynamodb.Table:
    """Create DynamoDB table for storing metadata with 100 RCU/100 WCU."""
    
    table = dynamodb.Table(
        f"metadata-table-{environment_suffix}",
        attributes=[
            dynamodb.TableAttributeArgs(
                name="id",
                type="S"
            ),
            dynamodb.TableAttributeArgs(
                name="timestamp",
                type="S"
            )
        ],
        hash_key="id",
        range_key="timestamp",
        billing_mode="PROVISIONED",
        read_capacity=100,
        write_capacity=100,
        server_side_encryption=dynamodb.TableServerSideEncryptionArgs(
            enabled=True
        ),
        tags=tags,
        opts=ResourceOptions(protect=False)
    )
    
    return table


def create_lambda_role(environment_suffix: str, bucket_arn: str, table_arn: str, tags: dict) -> iam.Role:
    """Create IAM role for Lambda function with necessary permissions."""
    
    # Trust policy for Lambda
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    })
    
    role = iam.Role(
        f"lambda-execution-role-{environment_suffix}",
        assume_role_policy=assume_role_policy,
        tags=tags,
        opts=ResourceOptions(protect=False)
    )
    
    # Attach basic Lambda execution policy
    iam.RolePolicyAttachment(
        f"lambda-basic-execution-{environment_suffix}",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )
    
    # Attach X-Ray tracing policy
    iam.RolePolicyAttachment(
        f"lambda-xray-{environment_suffix}",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
    )
    
    # Custom policy for S3 and DynamoDB access
    custom_policy = iam.RolePolicy(
        f"lambda-custom-policy-{environment_suffix}",
        role=role.id,
        policy=pulumi.Output.all(bucket_arn, table_arn).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })
        )
    )
    
    return role


def create_lambda_function(environment_suffix: str, role_arn: str, table_name: str, tags: dict) -> lambda_.Function:
    """Create Lambda function that processes S3 events and extracts metadata."""
    
    # Lambda function code
    lambda_code = '''
import json
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Process S3 events and extract metadata to store in DynamoDB.
    """
    try:
        # Get DynamoDB table name from environment variable
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        if not table_name:
            raise ValueError("DYNAMODB_TABLE_NAME environment variable not set")
        
        table = dynamodb.Table(table_name)
        
        # Process each record in the event
        for record in event.get('Records', []):
            try:
                # Extract S3 event information
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing event: {event_name} for object: {object_key}")
                
                # Get object metadata from S3
                try:
                    response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                    
                    # Extract metadata
                    metadata = {
                        'id': f"{bucket_name}/{object_key}",
                        'timestamp': datetime.utcnow().isoformat(),
                        'bucket_name': bucket_name,
                        'object_key': object_key,
                        'event_name': event_name,
                        'content_type': response.get('ContentType', 'unknown'),
                        'content_length': response.get('ContentLength', 0),
                        'last_modified': response.get('LastModified', '').isoformat() if response.get('LastModified') else '',
                        'etag': response.get('ETag', ''),
                        'storage_class': response.get('StorageClass', 'STANDARD'),
                        'server_side_encryption': response.get('ServerSideEncryption', ''),
                        'version_id': response.get('VersionId', ''),
                        'metadata': response.get('Metadata', {})
                    }
                    
                    # Store metadata in DynamoDB
                    table.put_item(Item=metadata)
                    logger.info(f"Successfully stored metadata for {object_key}")
                    
                except ClientError as e:
                    error_code = e.response['Error']['Code']
                    if error_code == 'NoSuchKey':
                        logger.warning(f"Object {object_key} not found in bucket {bucket_name}")
                    else:
                        logger.error(f"Error getting object metadata: {str(e)}")
                        raise
                        
            except Exception as e:
                logger.error(f"Error processing record: {str(e)}")
                # Continue processing other records even if one fails
                continue
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 events',
                'processed_records': len(event.get('Records', []))
            })
        }
        
    except Exception as e:
        logger.error(f"Lambda function error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
'''
    
    # Create Lambda function
    lambda_func = lambda_.Function(
        f"metadata-processor-{environment_suffix}",
        code=pulumi.AssetArchive({
            "lambda_function.py": pulumi.StringAsset(lambda_code)
        }),
        handler="lambda_function.lambda_handler",
        runtime="python3.9",
        role=role_arn,
        timeout=60,
        memory_size=256,
        environment=lambda_.FunctionEnvironmentArgs(
            variables={
                "DYNAMODB_TABLE_NAME": table_name
            }
        ),
        tracing_config=lambda_.FunctionTracingConfigArgs(
            mode="Active"
        ),
        tags=tags,
        opts=ResourceOptions(protect=False)
    )
    
    return lambda_func


def create_s3_lambda_permission(environment_suffix: str, bucket_name, lambda_arn) -> lambda_.Permission:
    """Create permission for S3 to invoke Lambda function."""
    
    # Handle both string and Pulumi Output types
    if hasattr(bucket_name, 'apply'):
        # It's a Pulumi Output
        source_arn = bucket_name.apply(lambda name: f"arn:aws:s3:::{name}")
    else:
        # It's a regular string
        source_arn = f"arn:aws:s3:::{bucket_name}"
    
    permission = lambda_.Permission(
        f"s3-lambda-permission-{environment_suffix}",
        statement_id="AllowExecutionFromS3Bucket",
        action="lambda:InvokeFunction",
        function=lambda_arn,
        principal="s3.amazonaws.com",
        source_arn=source_arn,
        opts=ResourceOptions(protect=False)
    )
    
    return permission


def create_s3_notification(environment_suffix: str, bucket_name, lambda_arn) -> s3.BucketNotification:
    """Create S3 bucket notification to trigger Lambda on object creation."""
    
    notification = s3.BucketNotification(
        f"bucket-notification-{environment_suffix}",
        bucket=bucket_name,
        lambda_functions=[s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=lambda_arn,
            events=["s3:ObjectCreated:*"],
            filter_prefix="",
            filter_suffix=""
        )],
        opts=ResourceOptions(protect=False)
    )
    
    return notification


def create_cloudwatch_alarms(environment_suffix: str, lambda_name, tags: dict):
    """Create CloudWatch alarms for Lambda function monitoring."""
    
    # Alarm for Lambda errors
    error_alarm = cloudwatch.MetricAlarm(
        f"lambda-errors-{environment_suffix}",
        name=f"lambda-errors-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=1,
        alarm_description="Lambda function errors",
        alarm_actions=[],
        dimensions={
            "FunctionName": lambda_name
        },
        tags=tags,
        opts=ResourceOptions(protect=False)
    )
    
    # Alarm for Lambda duration
    duration_alarm = cloudwatch.MetricAlarm(
        f"lambda-duration-{environment_suffix}",
        name=f"lambda-duration-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Average",
        threshold=30000,  # 30 seconds
        alarm_description="Lambda function duration too high",
        alarm_actions=[],
        dimensions={
            "FunctionName": lambda_name
        },
        tags=tags,
        opts=ResourceOptions(protect=False)
    )
    
    return error_alarm, duration_alarm


# Main stack creation
def create_serverless_stack():
    """Create the complete serverless infrastructure stack."""
    
    # Configuration
    config = pulumi.Config()
    environment_suffix = config.get("environment") or "dev"
    
    # Default tags
    default_tags = {
        "Environment": environment_suffix,
        "Project": "ServerlessDataPipeline",
        "ManagedBy": "Pulumi",
        "CostCenter": "Engineering"
    }
    
    # Create S3 bucket
    bucket = create_s3_bucket(environment_suffix, default_tags)
    
    # Create DynamoDB table
    table = create_dynamodb_table(environment_suffix, default_tags)
    
    # Create Lambda execution role
    lambda_role = create_lambda_role(
        environment_suffix, 
        bucket.arn, 
        table.arn, 
        default_tags
    )
    
    # Create Lambda function
    lambda_func = create_lambda_function(
        environment_suffix,
        lambda_role.arn,
        table.name,
        default_tags
    )
    
    # Create S3-Lambda permissions and notification
    s3_permission = create_s3_lambda_permission(
        environment_suffix,
        bucket.bucket,
        lambda_func.arn
    )
    
    s3_notification = create_s3_notification(
        environment_suffix,
        bucket.bucket,
        lambda_func.arn
    )
    
    # Create CloudWatch alarms
    error_alarm, duration_alarm = create_cloudwatch_alarms(
        environment_suffix,
        lambda_func.name,
        default_tags
    )
    
    # Export outputs
    pulumi.export("bucket_name", bucket.bucket)
    pulumi.export("bucket_arn", bucket.arn)
    pulumi.export("table_name", table.name)
    pulumi.export("table_arn", table.arn)
    pulumi.export("lambda_function_name", lambda_func.name)
    pulumi.export("lambda_function_arn", lambda_func.arn)
    pulumi.export("lambda_role_arn", lambda_role.arn)
    pulumi.export("log_group_name", f"/aws/lambda/metadata-processor-{environment_suffix}")


# Create the stack only when run directly, not when imported
if __name__ == "__main__":
    create_serverless_stack()
