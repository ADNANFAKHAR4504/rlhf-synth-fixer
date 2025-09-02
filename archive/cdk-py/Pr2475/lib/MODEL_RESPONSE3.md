I'll fix both the deprecation warning and the environment variable error. Here's the updated stack:

## Fixed Stack Definition (`data_pipeline/data_pipeline_stack.py`)

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct
import os

class DataPipelineStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Project": "DataPipeline"
        }

        # Create DynamoDB table with on-demand capacity
        # Fixed: Use pointInTimeRecoverySpecification instead of pointInTimeRecovery
        metadata_table = dynamodb.Table(
            self, "MetadataTable",
            table_name="file-metadata-table",
            partition_key=dynamodb.Attribute(
                name="file_key",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            # Fixed: Updated deprecated property
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            )
        )

        # Apply tags to DynamoDB table
        for key, value in common_tags.items():
            Tags.of(metadata_table).add(key, value)

        # Create S3 bucket with versioning
        data_bucket = s3.Bucket(
            self, "DataBucket",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Apply tags to S3 bucket
        for key, value in common_tags.items():
            Tags.of(data_bucket).add(key, value)

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "ProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific permissions for S3 read access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                resources=[f"{data_bucket.bucket_arn}/*"]
            )
        )

        # Add specific permissions for DynamoDB write access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                resources=[metadata_table.table_arn]
            )
        )

        # Apply tags to IAM role
        for key, value in common_tags.items():
            Tags.of(lambda_role).add(key, value)

        # Create Lambda function
        # Fixed: Removed AWS_REGION from environment variables as it's reserved
        processor_lambda = _lambda.Function(
            self, "FileProcessorLambda",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="process_file.lambda_handler",
            code=_lambda.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda")
            ),
            role=lambda_role,
            timeout=Duration.seconds(15),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": metadata_table.table_name,
                "DYNAMODB_TABLE_ARN": metadata_table.table_arn
                # Removed AWS_REGION as it's automatically provided by Lambda runtime
            }
        )

        # Apply tags to Lambda function
        for key, value in common_tags.items():
            Tags.of(processor_lambda).add(key, value)

        # Add S3 trigger to Lambda
        data_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(processor_lambda)
        )

        # Stack outputs
        CfnOutput(
            self, "S3BucketName",
            value=data_bucket.bucket_name,
            description="Name of the S3 bucket for data uploads"
        )

        CfnOutput(
            self, "S3BucketURL",
            value=f"https://{data_bucket.bucket_name}.s3.amazonaws.com",
            description="URL of the S3 bucket"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=metadata_table.table_name,
            description="Name of the DynamoDB metadata table"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=processor_lambda.function_name,
            description="Name of the Lambda function"
        )
```

## Updated Lambda Function Code (`data_pipeline/lambda/process_file.py`)

```python
import json
import boto3
import os
import logging
from datetime import datetime
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Process S3 object creation events and store metadata in DynamoDB
    """
    try:
        # Get DynamoDB table name from environment variables
        table_name = os.environ['DYNAMODB_TABLE_NAME']
        table = dynamodb.Table(table_name)

        # AWS_REGION is automatically available in Lambda runtime
        # No need to pass it as environment variable
        current_region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

        logger.info(f"Processing S3 event in region: {current_region}")

        # Process each record in the event
        for record in event['Records']:
            # Extract S3 event information
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
            object_size = record['s3']['object']['size']
            event_time = record['eventTime']
            event_name = record['eventName']

            logger.info(f"Processing file: {object_key} from bucket: {bucket_name}")

            # Get additional object metadata from S3
            try:
                response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                content_type = response.get('ContentType', 'unknown')
                last_modified = response.get('LastModified')
                if last_modified:
                    last_modified = last_modified.isoformat()
                else:
                    last_modified = datetime.now().isoformat()
                etag = response.get('ETag', '').strip('"')

            except Exception as e:
                logger.error(f"Error getting object metadata: {str(e)}")
                content_type = 'unknown'
                last_modified = datetime.now().isoformat()
                etag = 'unknown'

            # Prepare metadata for DynamoDB
            metadata_item = {
                'file_key': object_key,
                'bucket_name': bucket_name,
                'file_size': object_size,
                'content_type': content_type,
                'event_name': event_name,
                'event_time': event_time,
                'last_modified': last_modified,
                'etag': etag,
                'processed_at': datetime.now().isoformat(),
                'processing_status': 'completed',
                'region': current_region
            }

            # Store metadata in DynamoDB
            table.put_item(Item=metadata_item)

            logger.info(f"Successfully processed and stored metadata for: {object_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} file(s)',
                'processed_files': [
                    unquote_plus(record['s3']['object']['key'])
                    for record in event['Records']
                ],
                'region': current_region
            })
        }

    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to process S3 event'
            })
        }
```

## Alternative Stack for Older CDK Versions (if needed)

If you're still having issues with the `pointInTimeRecoverySpecification`, use this version:

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct
import os

class DataPipelineStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Project": "DataPipeline"
        }

        # Create DynamoDB table with on-demand capacity
        # Alternative approach if pointInTimeRecoverySpecification doesn't work
        metadata_table = dynamodb.Table(
            self, "MetadataTable",
            table_name="file-metadata-table",
            partition_key=dynamodb.Attribute(
                name="file_key",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
            # Remove point-in-time recovery if causing issues
        )

        # Apply tags to DynamoDB table
        for key, value in common_tags.items():
            Tags.of(metadata_table).add(key, value)

        # Create S3 bucket with versioning
        data_bucket = s3.Bucket(
            self, "DataBucket",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Apply tags to S3 bucket
        for key, value in common_tags.items():
            Tags.of(data_bucket).add(key, value)

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "ProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific permissions for S3 read access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                resources=[f"{data_bucket.bucket_arn}/*"]
            )
        )

        # Add specific permissions for DynamoDB write access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                resources=[metadata_table.table_arn]
            )
        )

        # Apply tags to IAM role
        for key, value in common_tags.items():
            Tags.of(lambda_role).add(key, value)

        # Create Lambda function
        processor_lambda = _lambda.Function(
            self, "FileProcessorLambda",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="process_file.lambda_handler",
            code=_lambda.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda")
            ),
            role=lambda_role,
            timeout=Duration.seconds(15),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": metadata_table.table_name,
                "DYNAMODB_TABLE_ARN": metadata_table.table_arn
            }
        )

        # Apply tags to Lambda function
        for key, value in common_tags.items():
            Tags.of(processor_lambda).add(key, value)

        # Add S3 trigger to Lambda
        data_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(processor_lambda)
        )

        # Stack outputs
        CfnOutput(
            self, "S3BucketName",
            value=data_bucket.bucket_name,
            description="Name of the S3 bucket for data uploads"
        )

        CfnOutput(
            self, "S3BucketURL",
            value=f"https://{data_bucket.bucket_name}.s3.amazonaws.com",
            description="URL of the S3 bucket"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=metadata_table.table_name,
            description="Name of the DynamoDB metadata table"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=processor_lambda.function_name,
            description="Name of the Lambda function"
        )
```

## Key Fixes Made:

1. **Fixed DynamoDB deprecation**: Updated `pointInTimeRecovery` to `point_in_time_recovery_specification`
2. **Removed reserved environment variable**: Removed `AWS_REGION` from Lambda environment variables
3. **Updated Lambda code**: Now uses `AWS_DEFAULT_REGION` which is automatically available in Lambda runtime
4. **Enhanced error handling**: Better handling of datetime serialization in Lambda

The stack should now deploy without errors. The Lambda function will automatically have access to the AWS region through the runtime environment variables.
