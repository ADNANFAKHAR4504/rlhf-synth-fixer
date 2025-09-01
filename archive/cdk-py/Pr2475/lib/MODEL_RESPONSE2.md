The error indicates that `BillingMode.ON_DEMAND` doesn't exist in the version of AWS CDK you're using. Let me fix this and other potential compatibility issues:

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
        # Fixed: Use PAY_PER_REQUEST instead of ON_DEMAND
        metadata_table = dynamodb.Table(
            self, "MetadataTable",
            table_name="file-metadata-table",
            partition_key=dynamodb.Attribute(
                name="file_key",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Fixed: Changed from ON_DEMAND
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
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
                "DYNAMODB_TABLE_ARN": metadata_table.table_arn,
                "AWS_REGION": self.region or "us-east-1"  # Fallback region
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

## Alternative Stack for Older CDK Versions

If you're using an older version of CDK, here's a more compatible version:

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
        # Alternative approach for older CDK versions
        metadata_table = dynamodb.Table(
            self, "MetadataTable",
            table_name="file-metadata-table",
            partition_key=dynamodb.Attribute(
                name="file_key",
                type=dynamodb.AttributeType.STRING
            ),
            # Use this for older CDK versions
            read_capacity=None,
            write_capacity=None,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Apply tags to DynamoDB table
        for key, value in common_tags.items():
            Tags.of(metadata_table).add(key, value)

        # Create S3 bucket with versioning
        data_bucket = s3.Bucket(
            self, "DataBucket",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Apply tags to S3 bucket
        for key, value in common_tags.items():
            Tags.of(data_bucket).add(key, value)

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "ProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com")
        )

        # Add CloudWatch logs permissions
        lambda_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        )

        # Add specific permissions for S3 read access
        s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            resources=[f"{data_bucket.bucket_arn}/*"]
        )
        lambda_role.add_to_policy(s3_policy)

        # Add specific permissions for DynamoDB write access
        dynamodb_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:PutItem",
                "dynamodb:UpdateItem"
            ],
            resources=[metadata_table.table_arn]
        )
        lambda_role.add_to_policy(dynamodb_policy)

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
                "DYNAMODB_TABLE_ARN": metadata_table.table_arn,
                "AWS_REGION": "us-east-1"
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
            value=data_bucket.bucket_website_url,
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

## Updated Requirements (`requirements.txt`)

```txt
aws-cdk-lib>=2.80.0,<3.0.0
constructs>=10.0.0,<11.0.0
boto3>=1.26.0
```

## Key Fixes Made:

1. **Fixed DynamoDB billing mode**: Changed from `BillingMode.ON_DEMAND` to `BillingMode.PAY_PER_REQUEST`
2. **Improved tagging**: Used `Tags.of(resource).add()` instead of metadata
3. **Added fallback for region**: Handle cases where `self.region` might be None
4. **Enhanced S3 security**: Added block public access settings
5. **Cleaner policy statements**: Separated policy creation for better readability
6. **Version constraints**: Added upper bounds to prevent breaking changes

## If You're Still Getting Errors:

Check your CDK version:

```bash
cdk --version
```

If you're using CDK v1, you'll need to use different imports:

```python
from aws_cdk import (
    core as cdk,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_s3_notifications as s3n,
)
```

Let me know your CDK version if you continue to have issues, and I can provide a version-specific solution.
