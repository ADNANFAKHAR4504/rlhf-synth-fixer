"""
TAP Stack: Serverless Data Processing Pipeline
A complete AWS serverless infrastructure for automated file processing
"""
```python
import pulumi
import pulumi_aws as aws
import json
import base64

# Configuration
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()
environment = config.get("environment") or "dev"

# Common tags for all resources
common_tags = {
    "Project": project_name,
    "Environment": environment,
    "Stack": stack_name,
    "ManagedBy": "Pulumi"
}

# ============================================================================
# S3 BUCKET CONFIGURATION
# ============================================================================

# Create S3 bucket for file uploads
file_processing_bucket = aws.s3.Bucket(
    "file-processing-bucket",
    bucket=f"{project_name}-{environment}-files-{stack_name}",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            ),
            bucket_key_enabled=True
        )
    ),
    tags={**common_tags, "Purpose": "File Storage"}
)

# Configure CORS for web application access
bucket_cors = aws.s3.BucketCorsConfigurationV2(
    "bucket-cors",
    bucket=file_processing_bucket.id,
    cors_rules=[
        aws.s3.BucketCorsConfigurationV2CorsRuleArgs(
            allowed_headers=["*"],
            allowed_methods=["GET", "PUT", "POST", "DELETE", "HEAD"],
            allowed_origins=["*"],  # In production, restrict this to specific domains
            expose_headers=["ETag"],
            max_age_seconds=3000
        )
    ]
)

# Block public access for security
bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    "bucket-public-access-block",
    bucket=file_processing_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# ============================================================================
# DYNAMODB TABLE CONFIGURATION
# ============================================================================

# Create DynamoDB table for metadata storage
metadata_table = aws.dynamodb.Table(
    "file-metadata-table",
    name=f"{project_name}-{environment}-file-metadata",
    billing_mode="PROVISIONED",
    read_capacity=100,
    write_capacity=100,
    hash_key="object_key",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="object_key",
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="upload_timestamp",
            type="S"
        )
    ],
    global_secondary_indexes=[
        aws.dynamodb.TableGlobalSecondaryIndexArgs(
            name="timestamp-index",
            hash_key="upload_timestamp",
            read_capacity=50,
            write_capacity=50,
            projection_type="ALL"
        )
    ],
    server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
        enabled=True
    ),
    tags={**common_tags, "Purpose": "Metadata Storage"}
)

# ============================================================================
# CLOUDWATCH LOGS GROUP
# ============================================================================

# Create CloudWatch Logs group for Lambda function
lambda_log_group = aws.cloudwatch.LogGroup(
    "lambda-log-group",
    name=f"/aws/lambda/{project_name}-{environment}-file-processor",
    retention_in_days=14,
    tags={**common_tags, "Purpose": "Lambda Logs"}
)

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# Create IAM role for Lambda function
lambda_role = aws.iam.Role(
    "lambda-execution-role",
    assume_role_policy=json.dumps({
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
    }),
    tags={**common_tags, "Purpose": "Lambda Execution"}
)

# Attach basic Lambda execution policy
lambda_basic_policy_attachment = aws.iam.RolePolicyAttachment(
    "lambda-basic-execution-policy",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Attach X-Ray tracing policy
lambda_xray_policy_attachment = aws.iam.RolePolicyAttachment(
    "lambda-xray-tracing-policy",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
)

# Create custom policy for S3 and DynamoDB access
lambda_custom_policy = aws.iam.Policy(
    "lambda-custom-policy",
    policy=pulumi.Output.all(
        file_processing_bucket.arn,
        metadata_table.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:GetObjectAttributes"
                ],
                "Resource": f"{args[0]}/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem"
                ],
                "Resource": [
                    args[1],
                    f"{args[1]}/index/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": f"arn:aws:logs:*:*:log-group:/aws/lambda/{project_name}-{environment}-file-processor*"
            }
        ]
    }))
)

# Attach custom policy to Lambda role
lambda_custom_policy_attachment = aws.iam.RolePolicyAttachment(
    "lambda-custom-policy-attachment",
    role=lambda_role.name,
    policy_arn=lambda_custom_policy.arn
)

# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

# Lambda function code
lambda_code = """
import json
import boto3
import os
import logging
from datetime import datetime
from urllib.parse import unquote_plus
import traceback

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get table name from environment variable
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    \"\"\"
    Process S3 events and extract file metadata
    \"\"\"
    logger.info(f"Received event: {json.dumps(event)}")
    
    processed_records = 0
    failed_records = 0
    
    try:
        for record in event['Records']:
            try:
                # Parse S3 event record
                bucket_name = record['s3']['bucket']['name']
                object_key = unquote_plus(record['s3']['object']['key'])
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for {object_key} in bucket {bucket_name}")
                
                # Skip delete events
                if 'Delete' in event_name:
                    logger.info(f"Skipping delete event for {object_key}")
                    continue
                
                # Get object metadata from S3
                metadata = get_object_metadata(bucket_name, object_key)
                
                if metadata:
                    # Store metadata in DynamoDB
                    store_metadata(metadata)
                    processed_records += 1
                    logger.info(f"Successfully processed {object_key}")
                else:
                    failed_records += 1
                    logger.error(f"Failed to get metadata for {object_key}")
                    
            except Exception as e:
                failed_records += 1
                logger.error(f"Error processing record: {str(e)}")
                logger.error(traceback.format_exc())
                
        logger.info(f"Processing complete. Success: {processed_records}, Failed: {failed_records}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': processed_records,
                'failed': failed_records
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in lambda_handler: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def get_object_metadata(bucket_name, object_key):
    \"\"\"
    Extract metadata from S3 object
    \"\"\"
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            
            # Extract relevant metadata
            metadata = {
                'object_key': object_key,
                'bucket_name': bucket_name,
                'file_size': response.get('ContentLength', 0),
                'content_type': response.get('ContentType', 'unknown'),
                'last_modified': response.get('LastModified').isoformat() if response.get('LastModified') else None,
                'etag': response.get('ETag', '').replace('"', ''),
                'upload_timestamp': datetime.utcnow().isoformat(),
                'version_id': response.get('VersionId'),
                'metadata': response.get('Metadata', {})
            }
            
            logger.info(f"Extracted metadata for {object_key}: {json.dumps(metadata, default=str)}")
            return metadata
            
        except Exception as e:
            retry_count += 1
            logger.warning(f"Attempt {retry_count} failed for {object_key}: {str(e)}")
            
            if retry_count >= max_retries:
                logger.error(f"Failed to get metadata for {object_key} after {max_retries} attempts")
                return None
                
            # Simple backoff
            import time
            time.sleep(2 ** retry_count)

def store_metadata(metadata):
    \"\"\"
    Store metadata in DynamoDB with retry logic
    \"\"\"
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            table.put_item(Item=metadata)
            logger.info(f"Successfully stored metadata for {metadata['object_key']}")
            return True
            
        except Exception as e:
            retry_count += 1
            logger.warning(f"DynamoDB put_item attempt {retry_count} failed: {str(e)}")
            
            if retry_count >= max_retries:
                logger.error(f"Failed to store metadata after {max_retries} attempts")
                raise
                
            # Simple backoff
            import time
            time.sleep(2 ** retry_count)
    
    return False
"""

# Create Lambda function
file_processor_lambda = aws.lambda_.Function(
    "file-processor-lambda",
    name=f"{project_name}-{environment}-file-processor",
    runtime="python3.9",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(lambda_code)
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    timeout=300,  # 5 minutes
    memory_size=512,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE_NAME": metadata_table.name
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"  # Enable X-Ray tracing
    ),
    depends_on=[
        lambda_log_group,
        lambda_basic_policy_attachment,
        lambda_custom_policy_attachment,
        lambda_xray_policy_attachment
    ],
    tags={**common_tags, "Purpose": "File Processing"}
)

# ============================================================================
# S3 EVENT NOTIFICATION
# ============================================================================

# Grant S3 permission to invoke Lambda
lambda_permission = aws.lambda_.Permission(
    "s3-invoke-lambda-permission",
    statement_id="AllowS3InvokeLambda",
    action="lambda:InvokeFunction",
    function=file_processor_lambda.name,
    principal="s3.amazonaws.com",
    source_arn=file_processing_bucket.arn
)

# Configure S3 bucket notification
bucket_notification = aws.s3.BucketNotification(
    "bucket-notification",
    bucket=file_processing_bucket.id,
    lambda_functions=[
        aws.s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=file_processor_lambda.arn,
            events=["s3:ObjectCreated:*"],
            filter_prefix="",  # Process all objects
            filter_suffix=""   # No suffix filter
        )
    ],
    depends_on=[lambda_permission]
)

# ============================================================================
# CLOUDWATCH MONITORING AND ALARMS
# ============================================================================

# CloudWatch alarm for Lambda errors
lambda_error_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-error-alarm",
    alarm_name=f"{project_name}-{environment}-lambda-errors",
    alarm_description="Lambda function error rate alarm",
    metric_name="Errors",
    namespace="AWS/Lambda",
    statistic="Sum",
    period=300,  # 5 minutes
    evaluation_periods=2,
    threshold=1,
    comparison_operator="GreaterThanOrEqualToThreshold",
    dimensions={
        "FunctionName": file_processor_lambda.name
    },
    tags={**common_tags, "Purpose": "Monitoring"}
)

# CloudWatch alarm for Lambda duration
lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-duration-alarm",
    alarm_name=f"{project_name}-{environment}-lambda-duration",
    alarm_description="Lambda function duration alarm",
    metric_name="Duration",
    namespace="AWS/Lambda",
    statistic="Average",
    period=300,
    evaluation_periods=2,
    threshold=240000,  # 4 minutes (240 seconds * 1000 ms)
    comparison_operator="GreaterThanThreshold",
    dimensions={
        "FunctionName": file_processor_lambda.name
    },
    tags={**common_tags, "Purpose": "Monitoring"}
)

# CloudWatch alarm for DynamoDB throttling
dynamodb_throttle_alarm = aws.cloudwatch.MetricAlarm(
    "dynamodb-throttle-alarm",
    alarm_name=f"{project_name}-{environment}-dynamodb-throttling",
    alarm_description="DynamoDB throttling alarm",
    metric_name="UserErrors",
    namespace="AWS/DynamoDB",
    statistic="Sum",
    period=300,
    evaluation_periods=1,
    threshold=0,
    comparison_operator="GreaterThanThreshold",
    dimensions={
        "TableName": metadata_table.name
    },
    tags={**common_tags, "Purpose": "Monitoring"}
)

# ============================================================================
# OUTPUTS
# ============================================================================

# Export important resource information
pulumi.export("bucket_name", file_processing_bucket.id)
pulumi.export("bucket_arn", file_processing_bucket.arn)
pulumi.export("dynamodb_table_name", metadata_table.name)
pulumi.export("dynamodb_table_arn", metadata_table.arn)
pulumi.export("lambda_function_name", file_processor_lambda.name)
pulumi.export("lambda_function_arn", file_processor_lambda.arn)
pulumi.export("cloudwatch_log_group", lambda_log_group.name)

# Export URLs for easy access
pulumi.export("s3_console_url", pulumi.Output.concat(
    "https://s3.console.aws.amazon.com/s3/buckets/",
    file_processing_bucket.id
))

pulumi.export("dynamodb_console_url", pulumi.Output.concat(
    "https://console.aws.amazon.com/dynamodbv2/home?region=",
    aws.get_region().name,
    "#tables:selected=",
    metadata_table.name
))

pulumi.export("lambda_console_url", pulumi.Output.concat(
    "https://console.aws.amazon.com/lambda/home?region=",
    aws.get_region().name,
    "#/functions/",
    file_processor_lambda.name
))
```
