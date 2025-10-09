### Reasoning Trace

---

The user is asking for a comprehensive, production-ready image processing pipeline using Pulumi with Python. Let me break down the requirements:

1. Serverless architecture using AWS Lambda
2. S3 buckets for source and destination
3. Image resizing to two sizes: 800x600 and 150x150
4. IAM roles with least privilege
5. CloudWatch logging
6. Event-driven architecture with S3 triggers
7. Modular and reusable code
8. AWS best practices
9. Region agnostic/configurable
10. Maintainable and extensible

I'll need to create:

- Multiple Python files for modularity
- A main Pulumi program
- Lambda function code for image processing
- IAM policies and roles
- S3 buckets with appropriate configurations
- CloudWatch log groups
- S3 event notifications

Let me structure this as a complete, production-ready solution.

### Answer

---

I'll design a comprehensive, modular, and production-ready serverless image processing pipeline using Pulumi with Python. This solution follows AWS best practices for security, scalability, and maintainability.

## Project Structure

```
image-processing-pipeline/
├── __main__.py                 # Main Pulumi program
├── Pulumi.yaml                 # Pulumi project configuration
├── requirements.txt            # Python dependencies
├── config.py                   # Configuration settings
├── infrastructure/
│   ├── __init__.py
│   ├── s3.py                  # S3 bucket resources
│   ├── iam.py                 # IAM roles and policies
│   ├── lambda_function.py     # Lambda configuration
│   └── monitoring.py          # CloudWatch logging
└── lambda_code/
    ├── image_processor.py     # Lambda function code
    └── requirements.txt       # Lambda dependencies
```

## Implementation

### 1. Pulumi Project Configuration (`Pulumi.yaml`)

```yaml
name: image-processing-pipeline
runtime:
  name: python
  options:
    virtualenv: venv
description: Automated serverless image processing pipeline for resizing images
config:
  aws:region: us-east-1 # Default region, can be overridden
```

### 2. Main Requirements (`requirements.txt`)

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

### 3. Configuration Module (`config.py`)

```python
"""
Configuration settings for the image processing pipeline.
Centralized configuration for easy maintenance and environment-specific deployments.
"""

import pulumi
from typing import Dict, List

# Get configuration from Pulumi config or use defaults
config = pulumi.Config()

# AWS Configuration
AWS_REGION = config.get("aws_region") or "us-east-1"

# S3 Configuration
SOURCE_BUCKET_PREFIX = config.get("source_bucket_prefix") or "image-uploads"
DEST_BUCKET_PREFIX = config.get("dest_bucket_prefix") or "processed-images"

# Lambda Configuration
LAMBDA_TIMEOUT = config.get_int("lambda_timeout") or 60  # seconds
LAMBDA_MEMORY = config.get_int("lambda_memory") or 1024  # MB
LAMBDA_RUNTIME = "python3.11"

# Image Processing Configuration
IMAGE_SIZES = {
    "standard": {"width": 800, "height": 600, "suffix": "standard"},
    "thumbnail": {"width": 150, "height": 150, "suffix": "thumb"}
}

# Supported image formats
SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]

# Tags for all resources
DEFAULT_TAGS = {
    "Project": "ImageProcessingPipeline",
    "ManagedBy": "Pulumi",
    "Environment": pulumi.get_stack(),
    "CostCenter": "Engineering"
}

# CloudWatch Configuration
LOG_RETENTION_DAYS = config.get_int("log_retention_days") or 7
```

### 4. IAM Module (`infrastructure/iam.py`)

```python
"""
IAM roles and policies for the image processing pipeline.
Implements least privilege principle for Lambda execution.
"""

import pulumi
import pulumi_aws as aws
import json
from typing import List
from config import DEFAULT_TAGS

def create_lambda_role(
    name_prefix: str,
    source_bucket_arn: str,
    dest_bucket_arn: str
) -> aws.iam.Role:
    """
    Creates an IAM role for Lambda with least privilege permissions.

    Args:
        name_prefix: Prefix for naming resources
        source_bucket_arn: ARN of the source S3 bucket
        dest_bucket_arn: ARN of the destination S3 bucket

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
        f"{name_prefix}-lambda-role",
        assume_role_policy=json.dumps(assume_role_policy),
        description="Execution role for image processing Lambda function",
        tags={**DEFAULT_TAGS, "Name": f"{name_prefix}-lambda-role"}
    )

    # Attach basic Lambda execution policy for CloudWatch Logs
    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-lambda-basic-execution",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Create custom policy for S3 access
    s3_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                "Resource": f"{source_bucket_arn}/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                "Resource": f"{dest_bucket_arn}/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket"
                ],
                "Resource": [source_bucket_arn, dest_bucket_arn]
            }
        ]
    }

    # Create and attach the S3 policy
    s3_policy = aws.iam.Policy(
        f"{name_prefix}-s3-policy",
        policy=json.dumps(s3_policy_document),
        description="Policy for Lambda to access source and destination S3 buckets",
        tags={**DEFAULT_TAGS, "Name": f"{name_prefix}-s3-policy"}
    )

    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-s3-policy-attachment",
        role=lambda_role.name,
        policy_arn=s3_policy.arn
    )

    return lambda_role
```

### 5. S3 Module (`infrastructure/s3.py`)

```python
"""
S3 bucket resources for the image processing pipeline.
Includes source and destination buckets with appropriate configurations.
"""

import pulumi
import pulumi_aws as aws
from config import DEFAULT_TAGS, SOURCE_BUCKET_PREFIX, DEST_BUCKET_PREFIX

def create_source_bucket(stack_name: str) -> aws.s3.Bucket:
    """
    Creates the source S3 bucket for image uploads.

    Args:
        stack_name: Current Pulumi stack name

    Returns:
        Source S3 bucket resource
    """

    bucket = aws.s3.Bucket(
        f"{SOURCE_BUCKET_PREFIX}-{stack_name}",
        bucket=f"{SOURCE_BUCKET_PREFIX}-{stack_name}",
        acl="private",
        versioning=aws.s3.BucketVersioningArgs(
            enabled=True  # Enable versioning for data protection
        ),
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"  # Enable encryption at rest
                )
            )
        ),
        lifecycle_rules=[
            aws.s3.BucketLifecycleRuleArgs(
                id="delete-old-versions",
                enabled=True,
                noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                    days=30  # Delete old versions after 30 days
                )
            )
        ],
        tags={**DEFAULT_TAGS, "Name": f"{SOURCE_BUCKET_PREFIX}-{stack_name}", "Type": "Source"}
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
        f"{SOURCE_BUCKET_PREFIX}-{stack_name}-pab",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )

    return bucket

def create_destination_bucket(stack_name: str) -> aws.s3.Bucket:
    """
    Creates the destination S3 bucket for processed images.
    Optimized for web display with appropriate caching headers.

    Args:
        stack_name: Current Pulumi stack name

    Returns:
        Destination S3 bucket resource
    """

    bucket = aws.s3.Bucket(
        f"{DEST_BUCKET_PREFIX}-{stack_name}",
        bucket=f"{DEST_BUCKET_PREFIX}-{stack_name}",
        acl="private",
        versioning=aws.s3.BucketVersioningArgs(
            enabled=False  # No versioning needed for processed images
        ),
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        ),
        cors_rules=[
            aws.s3.BucketCorsRuleArgs(
                allowed_headers=["*"],
                allowed_methods=["GET", "HEAD"],
                allowed_origins=["*"],  # Configure based on your domain requirements
                expose_headers=["ETag"],
                max_age_seconds=3600
            )
        ],
        lifecycle_rules=[
            aws.s3.BucketLifecycleRuleArgs(
                id="delete-old-processed-images",
                enabled=True,
                expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                    days=90  # Delete processed images after 90 days
                )
            )
        ],
        tags={**DEFAULT_TAGS, "Name": f"{DEST_BUCKET_PREFIX}-{stack_name}", "Type": "Destination"}
    )

    # Block public access (can be modified if CDN is used)
    aws.s3.BucketPublicAccessBlock(
        f"{DEST_BUCKET_PREFIX}-{stack_name}-pab",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )

    return bucket
```

### 6. CloudWatch Monitoring Module (`infrastructure/monitoring.py`)

```python
"""
CloudWatch monitoring resources for the image processing pipeline.
Provides logging and monitoring capabilities for Lambda functions.
"""

import pulumi
import pulumi_aws as aws
from config import DEFAULT_TAGS, LOG_RETENTION_DAYS

def create_log_group(function_name: str) -> aws.cloudwatch.LogGroup:
    """
    Creates a CloudWatch Log Group for Lambda function logs.

    Args:
        function_name: Name of the Lambda function

    Returns:
        CloudWatch Log Group resource
    """

    log_group = aws.cloudwatch.LogGroup(
        f"/aws/lambda/{function_name}",
        name=f"/aws/lambda/{function_name}",
        retention_in_days=LOG_RETENTION_DAYS,
        tags={**DEFAULT_TAGS, "Name": f"/aws/lambda/{function_name}"}
    )

    return log_group

def create_cloudwatch_alarms(
    function_name: str,
    function_arn: pulumi.Output[str]
) -> dict:
    """
    Creates CloudWatch alarms for monitoring Lambda function health.

    Args:
        function_name: Name of the Lambda function
        function_arn: ARN of the Lambda function

    Returns:
        Dictionary of CloudWatch alarm resources
    """

    alarms = {}

    # Error rate alarm
    alarms['error_alarm'] = aws.cloudwatch.MetricAlarm(
        f"{function_name}-error-alarm",
        name=f"{function_name}-error-rate",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=10,
        alarm_description="Alarm when Lambda function error rate is too high",
        dimensions={
            "FunctionName": function_name
        },
        tags={**DEFAULT_TAGS, "Name": f"{function_name}-error-alarm"}
    )

    # Duration alarm
    alarms['duration_alarm'] = aws.cloudwatch.MetricAlarm(
        f"{function_name}-duration-alarm",
        name=f"{function_name}-duration",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Average",
        threshold=30000,  # 30 seconds
        alarm_description="Alarm when Lambda function duration is too long",
        dimensions={
            "FunctionName": function_name
        },
        tags={**DEFAULT_TAGS, "Name": f"{function_name}-duration-alarm"}
    )

    return alarms
```

### 7. Lambda Function Module (`infrastructure/lambda_function.py`)

```python
"""
Lambda function configuration for image processing.
Handles the deployment and configuration of the serverless compute layer.
"""

import pulumi
import pulumi_aws as aws
import os
import zipfile
from io import BytesIO
from config import (
    DEFAULT_TAGS, LAMBDA_TIMEOUT, LAMBDA_MEMORY,
    LAMBDA_RUNTIME, IMAGE_SIZES
)

def create_lambda_deployment_package() -> bytes:
    """
    Creates a deployment package for the Lambda function.
    Includes the function code and dependencies.

    Returns:
        Bytes of the zipped deployment package
    """

    # Create an in-memory ZIP file
    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add the Lambda function code
        lambda_code_path = os.path.join(os.path.dirname(__file__), '..', 'lambda_code', 'image_processor.py')
        zip_file.write(lambda_code_path, 'image_processor.py')

    return zip_buffer.getvalue()

def create_lambda_function(
    name_prefix: str,
    role_arn: pulumi.Output[str],
    source_bucket_name: pulumi.Output[str],
    dest_bucket_name: pulumi.Output[str],
    log_group: aws.cloudwatch.LogGroup
) -> aws.lambda_.Function:
    """
    Creates the Lambda function for image processing.

    Args:
        name_prefix: Prefix for naming resources
        role_arn: ARN of the Lambda execution role
        source_bucket_name: Name of the source S3 bucket
        dest_bucket_name: Name of the destination S3 bucket
        log_group: CloudWatch Log Group for the function

    Returns:
        Lambda function resource
    """

    # Create Lambda layer for dependencies
    layer = create_lambda_layer(name_prefix)

    # Create the Lambda function
    lambda_function = aws.lambda_.Function(
        f"{name_prefix}-processor",
        name=f"{name_prefix}-processor",
        runtime=LAMBDA_RUNTIME,
        role=role_arn,
        handler="image_processor.handler",
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive("./lambda_code")
        }),
        timeout=LAMBDA_TIMEOUT,
        memory_size=LAMBDA_MEMORY,
        layers=[layer.arn],
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DEST_BUCKET": dest_bucket_name,
                "IMAGE_SIZES": str(IMAGE_SIZES),
                "LOG_LEVEL": "INFO"
            }
        ),
        reserved_concurrent_executions=100,  # Limit concurrent executions
        dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
            target_arn=""  # Can be configured with SQS/SNS for error handling
        ),
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active"  # Enable X-Ray tracing
        ),
        description="Processes uploaded images and creates resized versions",
        tags={**DEFAULT_TAGS, "Name": f"{name_prefix}-processor"}
    )

    return lambda_function

def create_lambda_layer(name_prefix: str) -> aws.lambda_.LayerVersion:
    """
    Creates a Lambda layer with Python dependencies for image processing.

    Args:
        name_prefix: Prefix for naming resources

    Returns:
        Lambda layer version resource
    """

    layer = aws.lambda_.LayerVersion(
        f"{name_prefix}-deps-layer",
        layer_name=f"{name_prefix}-deps",
        code=pulumi.AssetArchive({
            "python": pulumi.FileArchive("./lambda_code/layer")
        }),
        compatible_runtimes=[LAMBDA_RUNTIME],
        description="Dependencies for image processing Lambda function"
    )

    return layer

def configure_s3_trigger(
    lambda_function: aws.lambda_.Function,
    source_bucket: aws.s3.Bucket
) -> None:
    """
    Configures S3 event trigger for the Lambda function.

    Args:
        lambda_function: Lambda function to trigger
        source_bucket: Source S3 bucket that triggers the function
    """

    # Grant S3 permission to invoke the Lambda function
    aws.lambda_.Permission(
        "s3-invoke-permission",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="s3.amazonaws.com",
        source_arn=source_bucket.arn
    )

    # Configure S3 bucket notification
    aws.s3.BucketNotification(
        "image-upload-notification",
        bucket=source_bucket.id,
        lambda_functions=[
            aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix="uploads/",
                filter_suffix=""  # Process all file types, filtering done in Lambda
            )
        ]
    )
```

### 8. Lambda Function Code (`lambda_code/image_processor.py`)

```python
"""
Lambda function for processing uploaded images.
Resizes images to predefined sizes and stores them in the destination bucket.
"""

import json
import os
import io
import urllib.parse
import boto3
from PIL import Image
import logging
from typing import Dict, Any, Tuple
import traceback

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')

# Configuration from environment variables
DEST_BUCKET = os.environ['DEST_BUCKET']
IMAGE_SIZES = json.loads(os.environ['IMAGE_SIZES'])

# Supported image formats
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing S3 events.

    Args:
        event: S3 event containing information about uploaded objects
        context: Lambda context object

    Returns:
        Response with processing status
    """

    logger.info(f"Processing event: {json.dumps(event, default=str)}")

    results = []

    try:
        # Process each record in the event
        for record in event.get('Records', []):
            result = process_record(record)
            results.append(result)

    except Exception as e:
        logger.error(f"Unexpected error processing event: {str(e)}")
        logger.error(traceback.format_exc())
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

            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()

    except Exception as e:
        logger.error(f"Error resizing image: {str(e)}")
        raise

def generate_output_key(original_key: str, suffix: str) -> str:
    """
    Generates output key for processed image.

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
        s3_client.put_object(
            Bucket=DEST_BUCKET,
            Key=key,
            Body=image_data,
            ContentType=mime_type,
            CacheControl='max-age=86400',  # Cache for 1 day
            Metadata={
                'processed': 'true',
                'processor': 'image-resize-lambda'
            }
        )
        logger.info(f"Successfully uploaded: {key}")
    except Exception as e:
        logger.error(f"Error uploading to S3: {str(e)}")
        raise
```

### 9. Lambda Dependencies (`lambda_code/requirements.txt`)

```txt
Pillow==10.1.0
boto3==1.28.84
```

### 10. Lambda Layer Setup Script (`lambda_code/prepare_layer.sh`)

```bash
#!/bin/bash
# Prepares Lambda layer with dependencies

mkdir -p layer/python
pip install -r requirements.txt -t layer/python/
```

### 11. Main Pulumi Program (`__main__.py`)

```python
"""
Main Pulumi program for deploying the image processing pipeline.
Orchestrates all infrastructure components and outputs important information.
"""

import pulumi
import pulumi_aws as aws
from infrastructure import s3, iam, lambda_function, monitoring
from config import DEFAULT_TAGS

# Get current stack name for unique resource naming
stack = pulumi.get_stack()
name_prefix = f"img-proc-{stack}"

# Create source S3 bucket for image uploads
source_bucket = s3.create_source_bucket(stack)
pulumi.export("source_bucket_name", source_bucket.bucket)
pulumi.export("source_bucket_arn", source_bucket.arn)

# Create destination S3 bucket for processed images
dest_bucket = s3.create_destination_bucket(stack)
pulumi.export("dest_bucket_name", dest_bucket.bucket)
pulumi.export("dest_bucket_arn", dest_bucket.arn)

# Create IAM role for Lambda execution
lambda_role = iam.create_lambda_role(
    name_prefix=name_prefix,
    source_bucket_arn=source_bucket.arn,
    dest_bucket_arn=dest_bucket.arn
)
pulumi.export("lambda_role_arn", lambda_role.arn)

# Create CloudWatch log group for Lambda
log_group = monitoring.create_log_group(f"{name_prefix}-processor")
pulumi.export("log_group_name", log_group.name)

# Create Lambda function for image processing
processor_function = lambda_function.create_lambda_function(
    name_prefix=name_prefix,
    role_arn=lambda_role.arn,
    source_bucket_name=source_bucket.bucket,
    dest_bucket_name=dest_bucket.bucket,
    log_group=log_group
)
pulumi.export("lambda_function_name", processor_function.name)
pulumi.export("lambda_function_arn", processor_function.arn)

# Configure S3 trigger for Lambda
lambda_function.configure_s3_trigger(
    lambda_function=processor_function,
    source_bucket=source_bucket
)

# Create CloudWatch alarms for monitoring
alarms = monitoring.create_cloudwatch_alarms(
    function_name=processor_function.name,
    function_arn=processor_function.arn
)

# Export stack outputs for reference
pulumi.export("stack_outputs", {
    "source_bucket": source_bucket.bucket,
    "dest_bucket": dest_bucket.bucket,
    "lambda_function": processor_function.name,
    "log_group": log_group.name,
    "upload_prefix": "uploads/",
    "instructions": "Upload images to the source bucket with prefix 'uploads/' to trigger processing"
})
```

## Deployment Instructions

### 1. Prerequisites

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Configure AWS credentials
aws configure

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Prepare Lambda Layer

```bash
cd lambda_code
bash prepare_layer.sh
cd ..
```

### 3. Initialize and Deploy

```bash
# Initialize Pulumi stack
pulumi stack init dev

# Set AWS region (optional, defaults to us-east-1)
pulumi config set aws:region us-west-2

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

### 4. Test the Pipeline

```bash
# Get the source bucket name
SOURCE_BUCKET=$(pulumi stack output source_bucket_name)

# Upload a test image
aws s3 cp test-image.jpg s3://$SOURCE_BUCKET/uploads/test-image.jpg

# Check processed images in destination bucket
DEST_BUCKET=$(pulumi stack output dest_bucket_name)
aws s3 ls s3://$DEST_BUCKET/
```

## Key Features

### Security

- **Least Privilege IAM**: Lambda has only necessary permissions
- **Encryption**: All S3 buckets use AES-256 encryption
- **Private Buckets**: Public access blocked on all buckets
- **VPC Optional**: Can be extended to run Lambda in VPC

### Scalability

- **Serverless Architecture**: Automatically scales with demand
- **Concurrent Execution Limits**: Prevents runaway costs
- **Efficient Processing**: Uses Pillow for optimized image processing

### Monitoring

- **CloudWatch Logs**: Comprehensive logging for debugging
- **CloudWatch Alarms**: Alerts for errors and performance issues
- **X-Ray Tracing**: Enabled for performance analysis

### Maintainability

- **Modular Design**: Separated into logical components
- **Configuration Management**: Centralized configuration
- **Tagged Resources**: All resources properly tagged
- **Stack-based Deployment**: Easy environment management

## Extension Points

1. **Add CloudFront CDN** for global distribution
2. **Implement DLQ** with SQS for failed processing
3. **Add SNS notifications** for processing completion
4. **Integrate with API Gateway** for REST API access
5. **Add image optimization** (WebP conversion, compression)
6. **Implement batch processing** for bulk uploads
7. **Add custom metrics** to CloudWatch

This solution provides a production-ready, scalable, and maintainable serverless image processing pipeline that follows AWS best practices and can be easily extended for additional requirements.
