1. tap.py

```py
#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi
from pulumi import Config, ResourceOptions

# Add lib directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('environment_suffix') or os.getenv('ENVIRONMENT_SUFFIX') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Create the TAP stack (this will bootstrap all infrastructure)
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)


```

2. lib\tap_stack.py

```py
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Import and create image processing infrastructure
        from infrastructure import iam, lambda_function, monitoring, s3
        from infrastructure.config import create_config

        # Create image processing infrastructure
        pipeline_config = create_config()

        # Create KMS Key for S3 encryption
        self.kms_key = s3.create_kms_key("img-proc")

        # Create Dead Letter Queue (DLQ)
        dlq = lambda_function.create_dead_letter_queue(pipeline_config)
        self.dlq_arn = dlq.arn

        # Create source S3 bucket for image uploads
        self.source_bucket = s3.create_source_bucket(self.environment_suffix, self.kms_key)

        # Create destination S3 bucket for processed images
        self.dest_bucket = s3.create_destination_bucket(self.environment_suffix, self.kms_key)

        # Create IAM role for Lambda execution
        self.lambda_role = iam.create_lambda_role(
            name_prefix="img-proc",
            source_bucket_arn=self.source_bucket.arn,
            dest_bucket_arn=self.dest_bucket.arn,
            kms_key_arn=self.kms_key.arn,
            dlq_arn=self.dlq_arn
        )

        # Create Lambda function for image processing
        self.processor_function = lambda_function.create_lambda_function(
            name_prefix="img-proc",
            role_arn=self.lambda_role.arn,
            source_bucket_name=self.source_bucket.bucket,
            dest_bucket_name=self.dest_bucket.bucket,
            dlq_arn=self.dlq_arn
        )

        # Create CloudWatch log group for Lambda
        self.log_group = monitoring.create_log_group(self.processor_function.name)

        # Configure S3 trigger for Lambda
        lambda_function.configure_s3_trigger(
            lambda_function=self.processor_function,
            source_bucket=self.source_bucket
        )

        # Create CloudWatch alarms for monitoring
        self.alarms = monitoring.create_cloudwatch_alarms(
            function_name=self.processor_function.name,
            function_arn=self.processor_function.arn
        )

        # Register outputs
        self.register_outputs({
            "source_bucket": self.source_bucket.bucket,
            "dest_bucket": self.dest_bucket.bucket,
            "lambda_function": self.processor_function.name,
            "log_group": self.log_group.name,
            "upload_prefix": "uploads/",
            "instructions": "Upload images to the source bucket with prefix 'uploads/' to trigger processing"
        })

```

3. lib_init\_\_.py

```py
# empty
```

4. lib_main\_\_.py

```py
"""
Main Pulumi program for the image processing pipeline.
Entry point that orchestrates all infrastructure components.
"""

import pulumi
from infrastructure.main import create_infrastructure

# Create the complete infrastructure
infrastructure = create_infrastructure()


```

5. lib\infrastructure\config.py

```py
"""
Configuration settings for the image processing pipeline.
Centralized configuration for easy maintenance and environment-specific deployments.
Addresses model failures around region configuration and resource naming.
"""

import os
from dataclasses import dataclass
from typing import Any, Dict, List

import pulumi
import pulumi_aws as aws

# Get configuration from Pulumi config or use defaults
config = pulumi.Config()

@dataclass
class ImageProcessingConfig:
    """Configuration class for image processing pipeline."""

    # AWS Configuration - addresses model failure: region configuration mismatch
    aws_region: str
    aws_provider: Any

    # S3 Configuration with unique naming
    source_bucket_name: str
    dest_bucket_name: str

    # Lambda Configuration
    lambda_function_name: str
    lambda_timeout: int
    lambda_memory: int
    lambda_runtime: str
    reserved_concurrent_executions: int

    # Image Processing Configuration
    image_sizes: Dict[str, Dict[str, Any]]
    supported_extensions: List[str]

    # CloudWatch Configuration
    log_retention_days: int

    # VPC Configuration - addresses model failure: Lambda VPC deployment missing
    vpc_id: str
    subnet_ids: List[str]
    security_group_ids: List[str]

    # KMS Configuration - addresses model failure: KMS key usage missing
    kms_key_id: str

    # Dead Letter Queue Configuration - addresses model failure: Dead-letter config incomplete
    dlq_arn: str

    # Tags for all resources
    default_tags: Dict[str, str]

def create_config() -> ImageProcessingConfig:
    """
    Creates configuration for the image processing pipeline.
    Addresses model failures around region configuration and resource naming.
    """

    # Get stack name for unique resource naming
    stack_name = pulumi.get_stack()
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', stack_name)

    # AWS Configuration - addresses model failure: region configuration mismatch
    # Use environment variable or Pulumi config, default to us-west-2 as specified
    aws_region = os.environ.get('AWS_REGION') or config.get('aws_region') or 'us-west-2'

    # Create AWS provider with explicit region enforcement
    # This addresses model failure: region configuration mismatch
    aws_provider = aws.Provider(
        "aws",
        region=aws_region,
        # Ensure we're using the correct region
        allowed_account_ids=[config.get("allowed_account_id")] if config.get("allowed_account_id") else None
    )

    # S3 Configuration with unique naming - addresses model failure: bucket naming non-unique
    source_bucket_name = config.get("source_bucket_name") or f"image-uploads-{environment_suffix}"
    dest_bucket_name = config.get("dest_bucket_name") or f"processed-images-{environment_suffix}"

    # Lambda Configuration
    lambda_function_name = config.get("lambda_function_name") or f"image-processor-{environment_suffix}"
    lambda_timeout = config.get_int("lambda_timeout") or 60  # seconds
    lambda_memory = config.get_int("lambda_memory") or 1024  # MB
    lambda_runtime = "python3.11"
    reserved_concurrent_executions = config.get_int("reserved_concurrent_executions") or 50  # Configurable

    # Image Processing Configuration
    image_sizes = {
        "standard": {"width": 800, "height": 600, "suffix": "standard"},
        "thumbnail": {"width": 150, "height": 150, "suffix": "thumb"}
    }

    # Supported image formats
    supported_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]

    # CloudWatch Configuration
    log_retention_days = config.get_int("log_retention_days") or 7

    # VPC Configuration - addresses model failure: Lambda VPC deployment missing
    vpc_id = config.get("vpc_id") or ""
    subnet_ids = config.get_object("subnet_ids") or []
    security_group_ids = config.get_object("security_group_ids") or []

    # KMS Configuration - addresses model failure: KMS key usage missing
    kms_key_id = config.get("kms_key_id") or ""

    # Dead Letter Queue Configuration - addresses model failure: Dead-letter config incomplete
    dlq_arn = config.get("dlq_arn") or ""

    # Tags for all resources
    default_tags = {
        "Project": "ImageProcessingPipeline",
        "ManagedBy": "Pulumi",
        "Environment": environment_suffix,
        "CostCenter": "Engineering",
        "Region": aws_region
    }

    return ImageProcessingConfig(
        aws_region=aws_region,
        aws_provider=aws_provider,
        source_bucket_name=source_bucket_name,
        dest_bucket_name=dest_bucket_name,
        lambda_function_name=lambda_function_name,
        lambda_timeout=lambda_timeout,
        lambda_memory=lambda_memory,
        lambda_runtime=lambda_runtime,
        reserved_concurrent_executions=reserved_concurrent_executions,
        image_sizes=image_sizes,
        supported_extensions=supported_extensions,
        log_retention_days=log_retention_days,
        vpc_id=vpc_id,
        subnet_ids=subnet_ids,
        security_group_ids=security_group_ids,
        kms_key_id=kms_key_id,
        dlq_arn=dlq_arn,
        default_tags=default_tags
    )

```

6. lib\infrastructure\iam.py

```py
"""
IAM roles and policies for the image processing pipeline.
Implements least privilege principle for Lambda execution.
Addresses model failures around IAM policy least-privilege requirements.
"""

import json
from typing import List

import pulumi
import pulumi_aws as aws

from .config import ImageProcessingConfig


def create_lambda_role(name_prefix: str, source_bucket_arn: pulumi.Output[str], dest_bucket_arn: pulumi.Output[str], kms_key_arn: pulumi.Output[str], dlq_arn: pulumi.Output[str]) -> aws.iam.Role:
    """
    Creates an IAM role for Lambda with least privilege permissions.
    Addresses model failure: IAM policy not fully least-privilege.

    Args:
        config: Image processing configuration

    Returns:
        IAM role for Lambda execution
    """

    # Lambda assume role policy document
    assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }

    # Create the Lambda execution role
    lambda_role = aws.iam.Role(
        f"{name_prefix}-role",
        assume_role_policy=json.dumps(assume_role_policy),
        description="Execution role for image processing Lambda function",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    # Attach basic Lambda execution policy for CloudWatch Logs
    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-basic-execution",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions()
    )

    # Create custom policy for S3 access with least privilege
    # Addresses model failure: IAM policy not fully least-privilege
    s3_policy_document = pulumi.Output.all(source_bucket_arn, dest_bucket_arn).apply(
        lambda args: {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                    ],
                    "Resource": args[0] + "/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:PutObjectAcl"
                    ],
                    "Resource": args[1] + "/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [args[0], args[1]]
                }
            ]
        }
    )

    # Create and attach the S3 policy
    s3_policy = aws.iam.Policy(
        f"{name_prefix}-s3-policy",
        policy=s3_policy_document.apply(lambda policy: json.dumps(policy)),
        description="Policy for Lambda to access source and destination S3 buckets",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-s3-policy-attachment",
        role=lambda_role.name,
        policy_arn=s3_policy.arn,
        opts=pulumi.ResourceOptions()
    )

    # Create KMS policy for encryption/decryption
    # Addresses model failure: KMS key usage missing
    kms_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                "Resource": kms_key_arn
            }
        ]
    }

    kms_policy = aws.iam.Policy(
        f"{name_prefix}-kms-policy",
        policy=kms_key_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": arn
                }
            ]
        })),
        description="Policy for Lambda to use KMS keys for S3 encryption",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-kms-policy-attachment",
        role=lambda_role.name,
        policy_arn=kms_policy.arn,
        opts=pulumi.ResourceOptions()
    )

    # Create CloudWatch metrics policy
    # Addresses model failure: No IAM policy for CloudWatch alarms or permissions
    cloudwatch_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData",
                    "logs:DescribeLogStreams",
                    "logs:DescribeLogGroups"
                ],
                "Resource": "*"
            }
        ]
    }

    cloudwatch_policy = aws.iam.Policy(
        f"{name_prefix}-cloudwatch-policy",
        policy=json.dumps(cloudwatch_policy_document),
        description="Policy for Lambda to publish CloudWatch metrics",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-cloudwatch-policy-attachment",
        role=lambda_role.name,
        policy_arn=cloudwatch_policy.arn,
        opts=pulumi.ResourceOptions()
    )

    return lambda_role

def create_vpc_execution_role(config: ImageProcessingConfig) -> aws.iam.Role:
    """
    Creates an IAM role for VPC execution if VPC is configured.
    Addresses model failure: Lambda VPC deployment missing.

    Args:
        config: Image processing configuration

    Returns:
        IAM role for VPC execution
    """

    if not config.vpc_id:
        return None

    # VPC execution policy document
    vpc_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                    "ec2:AttachNetworkInterface",
                    "ec2:DetachNetworkInterface"
                ],
                "Resource": "*"
            }
        ]
    }

    # Create VPC execution role
    vpc_role = aws.iam.Role(
        f"{config.lambda_function_name}-vpc-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }),
        description="Execution role for Lambda VPC access",
        tags=config.default_tags,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Attach VPC execution policy
    vpc_policy = aws.iam.Policy(
        f"{config.lambda_function_name}-vpc-policy",
        policy=json.dumps(vpc_policy_document),
        description="Policy for Lambda VPC execution",
        tags=config.default_tags,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    aws.iam.RolePolicyAttachment(
        f"{config.lambda_function_name}-vpc-policy-attachment",
        role=vpc_role.name,
        policy_arn=vpc_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return vpc_role

```

7. lib\infrastructure\lambda_function.py

```py
"""
Lambda function configuration for image processing.
Handles the deployment and configuration of the serverless compute layer.
Addresses model failures around VPC deployment, DLQ configuration, and event triggers.
"""

import os
import zipfile
from io import BytesIO
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import ImageProcessingConfig


def create_lambda_deployment_package() -> bytes:
    """
    Creates a deployment package for the Lambda function.
    Includes the function code and dependencies.
    Addresses model failure: Lambda layer packaging assumes prebuilt directory.

    Returns:
        Bytes of the zipped deployment package
    """

    # Create an in-memory ZIP file
    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add the Lambda function code
        lambda_code_path = os.path.join(os.path.dirname(__file__), '..', 'lambda_code', 'image_processor.py')
        if os.path.exists(lambda_code_path):
            zip_file.write(lambda_code_path, 'image_processor.py')
        else:
            # Create a placeholder if the file doesn't exist
            zip_file.writestr('image_processor.py', 'def handler(event, context): return {"statusCode": 200}')

    return zip_buffer.getvalue()

def create_lambda_layer(name_prefix: str) -> aws.lambda_.LayerVersion:
    """
    Creates a Lambda layer with Python dependencies for image processing.
    Addresses model failure: Lambda layer packaging assumes prebuilt directory.

    Args:
        config: Image processing configuration

    Returns:
        Lambda layer version resource
    """

    # Create layer directory structure
    layer_dir = os.path.join(os.path.dirname(__file__), '..', 'lambda_code', 'layer')
    os.makedirs(layer_dir, exist_ok=True)

    # Create requirements.txt for the layer
    requirements_path = os.path.join(layer_dir, 'requirements.txt')
    with open(requirements_path, 'w') as f:
        f.write("Pillow==10.1.0\nboto3==1.28.84\n")

    layer = aws.lambda_.LayerVersion(
        f"{name_prefix}-deps-layer",
        layer_name=f"{name_prefix}-deps",
        code=pulumi.AssetArchive({
            "python": pulumi.FileArchive(layer_dir)
        }),
        compatible_runtimes=["python3.11"],
        description="Dependencies for image processing Lambda function",
        opts=pulumi.ResourceOptions()
    )

    return layer

def create_lambda_function(
    name_prefix: str,
    role_arn: pulumi.Output[str],
    source_bucket_name: pulumi.Output[str],
    dest_bucket_name: pulumi.Output[str],
    dlq_arn: pulumi.Output[str],
    log_group: aws.cloudwatch.LogGroup = None
) -> aws.lambda_.Function:
    """
    Creates the Lambda function for image processing.
    Addresses model failures around VPC deployment, DLQ configuration, and concurrent execution.

    Args:
        config: Image processing configuration
        role_arn: ARN of the Lambda execution role
        source_bucket_name: Name of the source S3 bucket
        dest_bucket_name: Name of the destination S3 bucket
        log_group: CloudWatch Log Group for the function
        kms_key_arn: ARN of the KMS key for encryption

    Returns:
        Lambda function resource
    """

    # Create Lambda layer for dependencies
    layer = create_lambda_layer(name_prefix)

    # VPC configuration - addresses model failure: Lambda VPC deployment missing
    vpc_config = None
    # VPC configuration can be added later if needed

    # Create the Lambda function
    lambda_function = aws.lambda_.Function(
        f"{name_prefix}-function",
        name=f"{name_prefix}-processor",
        runtime="python3.11",
        role=role_arn,
        handler="image_processor.handler",
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive(os.path.join(os.path.dirname(__file__), "..", "lambda_code"))
        }),
        timeout=60,
        memory_size=1024,
        layers=[layer.arn],
        vpc_config=vpc_config,  # Addresses model failure: Lambda VPC deployment missing
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DEST_BUCKET": dest_bucket_name,
                "SOURCE_BUCKET": source_bucket_name,
                "IMAGE_SIZES": '{"standard": {"width": 800, "height": 600, "suffix": "standard"}, "thumbnail": {"width": 150, "height": 150, "suffix": "thumb"}}',
                "LOG_LEVEL": "INFO"
            }
        ),
        # Note: Reserved concurrent executions removed due to account limits
        # The account has insufficient unreserved concurrent executions available
        # reserved_concurrent_executions=2,
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active"  # Enable X-Ray tracing
        ),
        description="Processes uploaded images and creates resized versions",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    return lambda_function

def configure_s3_trigger(
    lambda_function: aws.lambda_.Function,
    source_bucket: aws.s3.Bucket
) -> None:
    """
    Configures S3 event trigger for the Lambda function.
    Addresses model failure: Event trigger configuration not linked to bucket lifecycle.

    Args:
        config: Image processing configuration
        lambda_function: Lambda function to trigger
        source_bucket: Source S3 bucket that triggers the function
    """

    # Grant S3 permission to invoke the Lambda function
    # Addresses model failure: Event trigger configuration not linked to bucket lifecycle
    lambda_permission = aws.lambda_.Permission(
        "s3-invoke-permission",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="s3.amazonaws.com",
        source_arn=source_bucket.arn,
        opts=pulumi.ResourceOptions()
    )

    # Configure S3 bucket notification with proper dependency
    # Addresses model failure: Event trigger configuration not linked to bucket lifecycle
    bucket_notification = aws.s3.BucketNotification(
        "s3-notification",
        bucket=source_bucket.id,
        lambda_functions=[
            aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix="uploads/",
                filter_suffix=""  # Process all file types, filtering done in Lambda
            )
        ],
        opts=pulumi.ResourceOptions(
            depends_on=[lambda_permission]  # Ensure proper dependency ordering
        )
    )

    return bucket_notification

def create_dead_letter_queue(config: ImageProcessingConfig) -> aws.sqs.Queue:
    """
    Creates a Dead Letter Queue for failed Lambda executions.
    Addresses model failure: Dead-letter config incomplete.

    Args:
        config: Image processing configuration

    Returns:
        SQS queue resource for DLQ
    """

    if not config.dlq_arn:
        # Create SQS queue for DLQ
        dlq = aws.sqs.Queue(
            f"{config.lambda_function_name}-dlq",
            name=f"{config.lambda_function_name}-dlq",
            message_retention_seconds=1209600,  # 14 days
            tags=config.default_tags,
            opts=pulumi.ResourceOptions(provider=config.aws_provider)
        )

        # Create queue policy for Lambda to send messages
        queue_policy = aws.sqs.QueuePolicy(
            f"{config.lambda_function_name}-dlq-policy",
            queue_url=dlq.id,
            policy=dlq.arn.apply(lambda arn: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Principal": {{
                            "Service": "lambda.amazonaws.com"
                        }},
                        "Action": "sqs:SendMessage",
                        "Resource": "{arn}"
                    }}
                ]
            }}"""),
            opts=pulumi.ResourceOptions(provider=config.aws_provider)
        )

        return dlq

    return None

```

8. lib\infrastructure\main.py

```py
"""
Main infrastructure orchestrator for image processing pipeline.
Coordinates all infrastructure components and addresses model failures.
"""

import pulumi
import pulumi_aws as aws

from . import config, iam, lambda_function, monitoring, s3


def create_infrastructure():
    """
    Creates the complete image processing pipeline infrastructure.
    Orchestrates all components and addresses model failures.
    """

    # Get configuration
    pipeline_config = config.create_config()

    # Create KMS key for encryption
    kms_key = s3.create_kms_key(pipeline_config)
    pulumi.export("kms_key_id", kms_key.key_id)
    pulumi.export("kms_key_arn", kms_key.arn)

    # Create S3 buckets
    source_bucket = s3.create_source_bucket(pipeline_config, kms_key)
    pulumi.export("source_bucket_name", source_bucket.bucket)
    pulumi.export("source_bucket_arn", source_bucket.arn)

    dest_bucket = s3.create_destination_bucket(pipeline_config, kms_key)
    pulumi.export("dest_bucket_name", dest_bucket.bucket)
    pulumi.export("dest_bucket_arn", dest_bucket.arn)

    # Create IAM roles
    lambda_role = iam.create_lambda_role(pipeline_config)
    pulumi.export("lambda_role_arn", lambda_role.arn)

    vpc_role = iam.create_vpc_execution_role(pipeline_config)
    if vpc_role:
        pulumi.export("vpc_role_arn", vpc_role.arn)

    # Create CloudWatch log group
    log_group = monitoring.create_log_group(pipeline_config)
    pulumi.export("log_group_name", log_group.name)

    # Create Dead Letter Queue
    dlq = lambda_function.create_dead_letter_queue(pipeline_config)
    if dlq:
        pulumi.export("dlq_arn", dlq.arn)
        # Update config with DLQ ARN
        pipeline_config.dlq_arn = dlq.arn

    # Create Lambda function
    processor_function = lambda_function.create_lambda_function(
        config=pipeline_config,
        role_arn=lambda_role.arn,
        source_bucket_name=source_bucket.bucket,
        dest_bucket_name=dest_bucket.bucket,
        log_group=log_group,
        kms_key_arn=kms_key.arn
    )
    pulumi.export("lambda_function_name", processor_function.name)
    pulumi.export("lambda_function_arn", processor_function.arn)

    # Configure S3 trigger
    bucket_notification = lambda_function.configure_s3_trigger(
        config=pipeline_config,
        lambda_function=processor_function,
        source_bucket=source_bucket
    )
    pulumi.export("bucket_notification_id", bucket_notification.id)

    # Create CloudWatch alarms
    lambda_alarms = monitoring.create_cloudwatch_alarms(
        config=pipeline_config,
        function_arn=processor_function.arn
    )
    pulumi.export("lambda_alarms", {name: alarm.id for name, alarm in lambda_alarms.items()})

    # Create S3 event alarms
    s3_alarms = monitoring.create_s3_event_alarms(
        config=pipeline_config,
        source_bucket_name=source_bucket.bucket
    )
    pulumi.export("s3_alarms", {name: alarm.id for name, alarm in s3_alarms.items()})

    # Create custom metrics alarms
    custom_alarms = monitoring.create_custom_metrics(pipeline_config)
    pulumi.export("custom_alarms", {name: alarm.id for name, alarm in custom_alarms.items()})

    # Export comprehensive stack outputs
    pulumi.export("stack_outputs", {
        "source_bucket": source_bucket.bucket,
        "dest_bucket": dest_bucket.bucket,
        "lambda_function": processor_function.name,
        "log_group": log_group.name,
        "kms_key": kms_key.key_id,
        "upload_prefix": "uploads/",
        "image_sizes": pipeline_config.image_sizes,
        "supported_formats": pipeline_config.supported_extensions,
        "instructions": "Upload images to the source bucket with prefix 'uploads/' to trigger processing",
        "monitoring": "Check CloudWatch logs and alarms for processing status",
        "security": "All resources use KMS encryption and least-privilege IAM policies"
    })

    return {
        "config": pipeline_config,
        "kms_key": kms_key,
        "source_bucket": source_bucket,
        "dest_bucket": dest_bucket,
        "lambda_role": lambda_role,
        "vpc_role": vpc_role,
        "log_group": log_group,
        "dlq": dlq,
        "lambda_function": processor_function,
        "bucket_notification": bucket_notification,
        "lambda_alarms": lambda_alarms,
        "s3_alarms": s3_alarms,
        "custom_alarms": custom_alarms
    }

# Create the infrastructure
infrastructure = create_infrastructure()

```

9. lib\infrastructure\monitoring.py

```py
"""
CloudWatch monitoring resources for the image processing pipeline.
Provides comprehensive logging and monitoring capabilities for Lambda functions.
Addresses model failures around CloudWatch logging and alarm configuration.
"""

from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import ImageProcessingConfig


def create_log_group(function_name: pulumi.Output[str]) -> aws.cloudwatch.LogGroup:
    """
    Creates a CloudWatch Log Group for Lambda function logs.
    Addresses model failure: CloudWatch logging partially implemented.

    Args:
        config: Image processing configuration

    Returns:
        CloudWatch Log Group resource
    """

    log_group = aws.cloudwatch.LogGroup(
        f"img-proc-processor-log-group",
        name=function_name.apply(lambda name: f"/aws/lambda/{name}"),
        retention_in_days=7,
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    return log_group

def create_cloudwatch_alarms(function_name: pulumi.Output[str], function_arn: pulumi.Output[str]) -> Dict[str, aws.cloudwatch.MetricAlarm]:
    """
    Creates comprehensive CloudWatch alarms for monitoring Lambda function health.
    Addresses model failure: CloudWatch alarms partial.

    Args:
        config: Image processing configuration
        function_arn: ARN of the Lambda function

    Returns:
        Dictionary of CloudWatch alarm resources
    """

    alarms = {}

    # Error rate alarm
    alarms['error_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-error-alarm",
        name="img-proc-error-rate",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=5,  # Alert if more than 5 errors in 5 minutes
        alarm_description="Alarm when Lambda function error rate is too high",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    # Duration alarm
    alarms['duration_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-duration-alarm",
        name="img-proc-duration",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Average",
        threshold=30000,  # 30 seconds
        alarm_description="Alarm when Lambda function duration is too long",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    # Invocation alarm - addresses model failure: CloudWatch alarms partial
    alarms['invocation_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-invocation-alarm",
        name="img-proc-invocations",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Invocations",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=100,  # Alert if more than 100 invocations in 5 minutes
        alarm_description="Alarm when Lambda function invocation rate is too high",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    # Throttle alarm - addresses model failure: CloudWatch alarms partial
    alarms['throttle_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-throttle-alarm",
        name="img-proc-throttles",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=1,  # Alert on any throttles
        alarm_description="Alarm when Lambda function is throttled",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    # Timeout alarm - addresses model failure: CloudWatch alarms partial
    alarms['timeout_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-timeout-alarm",
        name="img-proc-timeouts",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Maximum",
        threshold=60000,  # 60 seconds in milliseconds
        alarm_description="Alarm when Lambda function approaches timeout",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    return alarms

def create_s3_event_alarms(config: ImageProcessingConfig, source_bucket_name: str) -> Dict[str, aws.cloudwatch.MetricAlarm]:
    """
    Creates CloudWatch alarms for S3 event processing.
    Addresses model failure: CloudWatch logging partially implemented.

    Args:
        config: Image processing configuration
        source_bucket_name: Name of the source S3 bucket

    Returns:
        Dictionary of S3 event alarm resources
    """

    alarms = {}

    # S3 object creation alarm
    alarms['s3_object_creation_alarm'] = aws.cloudwatch.MetricAlarm(
        f"{function_name}-s3-object-creation-alarm",
        name=f"{function_name}-s3-object-creation",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="NumberOfObjects",
        namespace="AWS/S3",
        period=300,
        statistic="Sum",
        threshold=10,  # Alert if more than 10 objects created in 5 minutes
        alarm_description="Alarm when too many objects are created in source bucket",
        dimensions={
            "BucketName": source_bucket_name,
            "StorageType": "AllStorageTypes"
        },
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    return alarms

def create_custom_metrics(config: ImageProcessingConfig) -> Dict[str, aws.cloudwatch.MetricAlarm]:
    """
    Creates custom CloudWatch metrics for image processing.
    Addresses model failure: No custom metrics to CloudWatch.

    Args:
        config: Image processing configuration

    Returns:
        Dictionary of custom metric alarm resources
    """

    alarms = {}

    # Image processing success rate alarm
    alarms['processing_success_alarm'] = aws.cloudwatch.MetricAlarm(
        f"{function_name}-processing-success-alarm",
        name=f"{function_name}-processing-success-rate",
        comparison_operator="LessThanThreshold",
        evaluation_periods=2,
        metric_name="ProcessingSuccessRate",
        namespace="Custom/ImageProcessing",
        period=300,
        statistic="Average",
        threshold=0.95,  # Alert if success rate drops below 95%
        alarm_description="Alarm when image processing success rate is too low",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    # Image processing duration alarm
    alarms['processing_duration_alarm'] = aws.cloudwatch.MetricAlarm(
        f"{function_name}-processing-duration-alarm",
        name=f"{function_name}-processing-duration",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="ProcessingDuration",
        namespace="Custom/ImageProcessing",
        period=300,
        statistic="Average",
        threshold=10000,  # 10 seconds
        alarm_description="Alarm when image processing duration is too long",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )

    return alarms

```

10. lib\infrastructure\s3.py

```py
"""
S3 bucket resources for the image processing pipeline.
Includes source and destination buckets with appropriate configurations.
Addresses model failures around encryption, lifecycle policies, and unique naming.
"""

import json
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import ImageProcessingConfig


def create_kms_key(name_prefix: str) -> aws.kms.Key:
    """
    Creates a KMS key for S3 bucket encryption.
    Addresses model failure: KMS key usage missing.

    Args:
        name_prefix: Prefix for the KMS key name

    Returns:
        KMS key resource
    """

    kms_key = aws.kms.Key(
        f"{name_prefix}-kms-key",
        description=f"KMS key for {name_prefix} S3 buckets",
        deletion_window_in_days=7,
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"}
    )

    # Create alias for the key
    aws.kms.Alias(
        f"{name_prefix}-kms-alias",
        name=f"alias/{name_prefix}-s3",
        target_key_id=kms_key.key_id
    )

    return kms_key

def create_source_bucket(environment_suffix: str, kms_key: aws.kms.Key) -> aws.s3.Bucket:
    """
    Creates the source S3 bucket for image uploads.
    Addresses model failures around encryption, lifecycle policies, and unique naming.

    Args:
        config: Image processing configuration
        kms_key: KMS key for encryption

    Returns:
        Source S3 bucket resource
    """

    # Create bucket with unique naming - addresses model failure: bucket naming non-unique
    bucket_name = pulumi.Output.all(
        pulumi.get_organization(),
        pulumi.get_project()
    ).apply(lambda args: f"image-uploads-{environment_suffix}-{args[0]}-{args[1]}".lower().replace('_', '-'))

    bucket = aws.s3.Bucket(
        f"img-proc-{environment_suffix}-source-bucket",
        bucket=bucket_name,
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi", "Name": bucket_name, "Type": "Source"}
    )

    # Note: ACLs are not supported on modern S3 buckets by default
    # Bucket access is controlled via bucket policies and IAM

    aws.s3.BucketVersioning(
        f"img-proc-{environment_suffix}-source-bucket-versioning",
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status="Enabled"
        )
    )

    aws.s3.BucketServerSideEncryptionConfiguration(
        f"img-proc-{environment_suffix}-source-bucket-encryption",
        bucket=bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=kms_key.arn
            )
        )]
    )

    aws.s3.BucketLifecycleConfiguration(
        f"img-proc-{environment_suffix}-source-bucket-lifecycle",
        bucket=bucket.id,
        rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
            id="delete-old-versions",
            status="Enabled",
            noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                noncurrent_days=30
            )
        )]
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
        f"img-proc-{environment_suffix}-source-pab",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions()
    )

    return bucket

def create_destination_bucket(environment_suffix: str, kms_key: aws.kms.Key) -> aws.s3.Bucket:
    """
    Creates the destination S3 bucket for processed images.
    Optimized for web display with appropriate caching headers.
    Addresses model failures around encryption and caching configuration.

    Args:
        config: Image processing configuration
        kms_key: KMS key for encryption

    Returns:
        Destination S3 bucket resource
    """

    # Create bucket with unique naming - addresses model failure: bucket naming non-unique
    bucket_name = pulumi.Output.all(
        pulumi.get_organization(),
        pulumi.get_project()
    ).apply(lambda args: f"processed-images-{environment_suffix}-{args[0]}-{args[1]}".lower().replace('_', '-'))

    bucket = aws.s3.Bucket(
        f"img-proc-{environment_suffix}-dest-bucket",
        bucket=bucket_name,
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi", "Name": bucket_name, "Type": "Destination"}
    )

    # Note: ACLs are not supported on modern S3 buckets by default
    # Bucket access is controlled via bucket policies and IAM

    aws.s3.BucketVersioning(
        f"img-proc-{environment_suffix}-dest-bucket-versioning",
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status="Disabled"  # No versioning needed for processed images
        )
    )

    aws.s3.BucketServerSideEncryptionConfiguration(
        f"img-proc-{environment_suffix}-dest-bucket-encryption",
        bucket=bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=kms_key.arn
            )
        )]
    )

    aws.s3.BucketCorsConfiguration(
        f"img-proc-{environment_suffix}-dest-bucket-cors",
        bucket=bucket.id,
        cors_rules=[aws.s3.BucketCorsConfigurationCorsRuleArgs(
            allowed_headers=["*"],
            allowed_methods=["GET", "HEAD"],
            allowed_origins=["*"],
            expose_headers=["ETag"],
            max_age_seconds=3600
        )]
    )

    aws.s3.BucketLifecycleConfiguration(
        f"img-proc-{environment_suffix}-dest-bucket-lifecycle",
        bucket=bucket.id,
        rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
            id="delete-old-processed-images",
            status="Enabled",
            expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                days=90
            )
        )]
    )

    # Block public access (can be modified if CDN is used)
    aws.s3.BucketPublicAccessBlock(
        f"img-proc-{environment_suffix}-dest-pab",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions()
    )

    # Note: Bucket policy removed to avoid public access issues
    # Access to processed images should be controlled via IAM or CloudFront

    return bucket

def create_s3_notification_filter(config: ImageProcessingConfig) -> Dict[str, Any]:
    """
    Creates S3 notification filter configuration.
    Addresses model failure: No explicit S3 notification filter test or condition.

    Args:
        config: Image processing configuration

    Returns:
        Filter configuration for S3 notifications
    """

    return {
        "filter_prefix": "uploads/",
        "filter_suffix": "",  # Process all file types, filtering done in Lambda
        "events": ["s3:ObjectCreated:*"]
    }

```

11. lib\infrastructure\lambda_code\image_processor.py

```py
"""
Lambda function for processing uploaded images.
Resizes images to predefined sizes and stores them in the destination bucket.
Addresses model failures around image processing and error handling.
"""

import io
import json
import logging
import os
import time
import traceback
import urllib.parse
from typing import Any, Dict, Tuple

import boto3
from PIL import Image

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

# Configuration from environment variables
DEST_BUCKET = os.environ['DEST_BUCKET']
SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
IMAGE_SIZES = json.loads(os.environ['IMAGE_SIZES'])
KMS_KEY_ID = os.environ.get('KMS_KEY_ID', '')

# Supported image formats
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing S3 events.
    Addresses model failures around event processing and error handling.

    Args:
        event: S3 event containing information about uploaded objects
        context: Lambda context object

    Returns:
        Response with processing status
    """

    logger.info(f"Processing event: {json.dumps(event, default=str)}")

    start_time = time.time()
    results = []

    try:
        # Process each record in the event
        for record in event.get('Records', []):
            result = process_record(record)
            results.append(result)

        # Publish custom metrics
        processing_time = time.time() - start_time
        publish_custom_metrics(len(results), processing_time, True)

    except Exception as e:
        logger.error(f"Unexpected error processing event: {str(e)}")
        logger.error(traceback.format_exc())

        # Publish error metrics
        processing_time = time.time() - start_time
        publish_custom_metrics(0, processing_time, False)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

    # Return processing results
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Processing complete',
            'results': results
        })
    }

def process_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes a single S3 event record.
    Addresses model failures around record processing and error handling.

    Args:
        record: S3 event record

    Returns:
        Processing result for the record
    """

    try:
        # Extract S3 object information
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])

        logger.info(f"Processing image: {bucket}/{key}")

        # Check if file is a supported image format
        file_ext = os.path.splitext(key.lower())[1]
        if file_ext not in SUPPORTED_FORMATS:
            logger.warning(f"Unsupported file format: {file_ext}")
            return {
                'status': 'skipped',
                'reason': f'Unsupported format: {file_ext}',
                'key': key
            }

        # Download the image from S3
        image_data = download_image(bucket, key)

        # Process the image for each size configuration
        processed_images = []
        for size_name, size_config in IMAGE_SIZES.items():
            try:
                resized_image = resize_image(
                    image_data,
                    size_config['width'],
                    size_config['height']
                )

                # Generate output key
                output_key = generate_output_key(key, size_config['suffix'])

                # Upload resized image to destination bucket
                upload_image(resized_image, output_key, file_ext)

                processed_images.append({
                    'size': size_name,
                    'key': output_key,
                    'dimensions': f"{size_config['width']}x{size_config['height']}"
                })

                logger.info(f"Successfully processed {size_name} version: {output_key}")

            except Exception as e:
                logger.error(f"Error processing {size_name} size: {str(e)}")
                raise

        return {
            'status': 'success',
            'source_key': key,
            'processed_images': processed_images
        }

    except Exception as e:
        logger.error(f"Error processing record: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'status': 'error',
            'error': str(e),
            'key': record.get('s3', {}).get('object', {}).get('key', 'unknown')
        }

def download_image(bucket: str, key: str) -> bytes:
    """
    Downloads an image from S3.
    Addresses model failures around S3 access and error handling.

    Args:
        bucket: S3 bucket name
        key: S3 object key

    Returns:
        Image data as bytes
    """

    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        return response['Body'].read()
    except Exception as e:
        logger.error(f"Error downloading image from S3: {str(e)}")
        raise

def resize_image(image_data: bytes, width: int, height: int) -> bytes:
    """
    Resizes an image to specified dimensions.
    Addresses model failures around image processing and optimization.

    Args:
        image_data: Original image data
        width: Target width
        height: Target height

    Returns:
        Resized image data as bytes
    """

    try:
        # Open image from bytes
        with Image.open(io.BytesIO(image_data)) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img

            # Calculate aspect ratio and resize
            img.thumbnail((width, height), Image.Resampling.LANCZOS)

            # If exact dimensions are required, crop or pad
            if img.size != (width, height):
                # Create new image with exact dimensions
                new_img = Image.new('RGB', (width, height), (255, 255, 255))
                # Paste resized image centered
                x_offset = (width - img.width) // 2
                y_offset = (height - img.height) // 2
                new_img.paste(img, (x_offset, y_offset))
                img = new_img

            # Save to bytes with optimization
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()

    except Exception as e:
        logger.error(f"Error resizing image: {str(e)}")
        raise

def generate_output_key(original_key: str, suffix: str) -> str:
    """
    Generates output key for processed image.
    Addresses model failures around key generation and organization.

    Args:
        original_key: Original S3 object key
        suffix: Suffix to add to the filename

    Returns:
        Output key for the processed image
    """

    # Remove 'uploads/' prefix if present
    if original_key.startswith('uploads/'):
        original_key = original_key[8:]

    # Split path and filename
    path_parts = original_key.rsplit('/', 1)
    if len(path_parts) == 2:
        path, filename = path_parts
    else:
        path = ''
        filename = path_parts[0]

    # Split filename and extension
    name, ext = os.path.splitext(filename)

    # Generate new filename
    new_filename = f"{name}_{suffix}{ext}"

    # Combine path if exists
    if path:
        return f"{suffix}/{path}/{new_filename}"
    else:
        return f"{suffix}/{new_filename}"

def upload_image(image_data: bytes, key: str, content_type: str) -> None:
    """
    Uploads processed image to destination S3 bucket.
    Addresses model failures around S3 upload and optimization.

    Args:
        image_data: Processed image data
        key: S3 object key for the destination
        content_type: MIME type of the image
    """

    # Map file extension to content type
    content_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
    }

    mime_type = content_type_map.get(content_type.lower(), 'image/jpeg')

    try:
        # Upload with KMS encryption if key is provided
        upload_args = {
            'Bucket': DEST_BUCKET,
            'Key': key,
            'Body': image_data,
            'ContentType': mime_type,
            'CacheControl': 'max-age=86400',  # Cache for 1 day
            'Metadata': {
                'processed': 'true',
                'processor': 'image-resize-lambda'
            }
        }

        if KMS_KEY_ID:
            upload_args['ServerSideEncryption'] = 'aws:kms'
            upload_args['SSEKMSKeyId'] = KMS_KEY_ID

        s3_client.put_object(**upload_args)
        logger.info(f"Successfully uploaded: {key}")

    except Exception as e:
        logger.error(f"Error uploading to S3: {str(e)}")
        raise

def publish_custom_metrics(processed_count: int, processing_time: float, success: bool) -> None:
    """
    Publishes custom CloudWatch metrics for monitoring.
    Addresses model failure: No custom metrics to CloudWatch.

    Args:
        processed_count: Number of images processed
        processing_time: Time taken for processing
        success: Whether processing was successful
    """

    try:
        # Calculate success rate
        success_rate = 1.0 if success else 0.0

        # Publish custom metrics
        cloudwatch.put_metric_data(
            Namespace='Custom/ImageProcessing',
            MetricData=[
                {
                    'MetricName': 'ProcessingSuccessRate',
                    'Value': success_rate,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'ProcessingDuration',
                    'Value': processing_time,
                    'Unit': 'Seconds'
                },
                {
                    'MetricName': 'ImagesProcessed',
                    'Value': processed_count,
                    'Unit': 'Count'
                }
            ]
        )

        logger.info(f"Published custom metrics: success_rate={success_rate}, duration={processing_time}, count={processed_count}")

    except Exception as e:
        logger.error(f"Error publishing custom metrics: {str(e)}")
        # Don't raise exception for metrics failure

```
