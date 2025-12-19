# Image Optimization Service Infrastructure

Here's the Pulumi Python infrastructure code for the image optimization service:

## tap_stack.py
```python
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
from .image_optimization_stack import ImageOptimizationStack


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

        # Instantiate the Image Optimization Stack
        self.image_optimization = ImageOptimizationStack(
            f"image-optimization-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "upload_bucket": self.image_optimization.upload_bucket.id,
            "cloudfront_distribution": self.image_optimization.distribution.domain_name,
            "dynamodb_table": self.image_optimization.metadata_table.name,
            "lambda_function": self.image_optimization.processor_function.name,
        })
```

## image_optimization_stack.py
```python
"""
image_optimization_stack.py

Defines the infrastructure for the image optimization service including S3 buckets,
Lambda functions, CloudFront distribution, and DynamoDB table.
"""

import json
from typing import Optional, Dict

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3, lambda_, dynamodb, cloudfront, iam, cloudwatch

class ImageOptimizationStack(pulumi.ComponentResource):
    """
    Creates the complete infrastructure for image optimization service.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str = "dev",
        tags: Optional[Dict[str, str]] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:ImageOptimizationStack', name, None, opts)

        self.environment_suffix = environment_suffix
        self.tags = tags or {}

        # Create S3 buckets
        self._create_s3_buckets()

        # Create DynamoDB table
        self._create_dynamodb_table()

        # Create IAM role and policies
        self._create_iam_resources()

        # Create Lambda function
        self._create_lambda_function()

        # Configure S3 event notifications
        self._configure_s3_notifications()

        # Create CloudFront distribution
        self._create_cloudfront_distribution()

        # Create CloudWatch dashboard
        self._create_cloudwatch_dashboard()

        self.register_outputs({})

    def _create_s3_buckets(self):
        """Create S3 buckets for uploads and optimized images."""

        # Upload bucket with transfer acceleration
        self.upload_bucket = s3.Bucket(
            f"upload-bucket-{self.environment_suffix}",
            bucket=f"image-uploads-{self.environment_suffix}",
            versioning=s3.BucketVersioningArgs(
                enabled=True
            ),
            acceleration_status="Enabled",
            cors_rules=[s3.BucketCorsRuleArgs(
                allowed_headers=["*"],
                allowed_methods=["PUT", "POST"],
                allowed_origins=["*"],
                expose_headers=["ETag"]
            )],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Optimized images buckets
        self.webp_bucket = s3.Bucket(
            f"webp-bucket-{self.environment_suffix}",
            bucket=f"optimized-webp-{self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.jpeg_bucket = s3.Bucket(
            f"jpeg-bucket-{self.environment_suffix}",
            bucket=f"optimized-jpeg-{self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.png_bucket = s3.Bucket(
            f"png-bucket-{self.environment_suffix}",
            bucket=f"optimized-png-{self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Public access block for optimized buckets
        for bucket in [self.webp_bucket, self.jpeg_bucket, self.png_bucket]:
            s3.BucketPublicAccessBlock(
                f"{bucket._name}-pab",
                bucket=bucket.id,
                block_public_acls=False,
                block_public_policy=False,
                ignore_public_acls=False,
                restrict_public_buckets=False,
                opts=ResourceOptions(parent=bucket)
            )

    def _create_dynamodb_table(self):
        """Create DynamoDB table for image metadata."""

        self.metadata_table = dynamodb.Table(
            f"image-metadata-{self.environment_suffix}",
            name=f"image-metadata-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="image_id",
            attributes=[
                dynamodb.TableAttributeArgs(
                    name="image_id",
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="upload_timestamp",
                    type="N"
                )
            ],
            global_secondary_indexes=[
                dynamodb.TableGlobalSecondaryIndexArgs(
                    name="timestamp-index",
                    hash_key="upload_timestamp",
                    projection_type="ALL"
                )
            ],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_iam_resources(self):
        """Create IAM role and policies for Lambda."""

        # Lambda execution role
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        self.lambda_role = iam.Role(
            f"lambda-processor-role-{self.environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda policy
        lambda_policy = iam.RolePolicy(
            f"lambda-processor-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=pulumi.Output.all(
                self.upload_bucket.arn,
                self.webp_bucket.arn,
                self.jpeg_bucket.arn,
                self.png_bucket.arn,
                self.metadata_table.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:us-west-1:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        "Resource": [
                            f"{args[1]}/*",
                            f"{args[2]}/*",
                            f"{args[3]}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:GetItem"
                        ],
                        "Resource": args[4]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

    def _create_lambda_function(self):
        """Create Lambda function for image processing."""

        # Create Lambda function
        self.processor_function = lambda_.Function(
            f"image-processor-{self.environment_suffix}",
            name=f"image-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="handler.process_image",
            role=self.lambda_role.arn,
            timeout=300,
            memory_size=1024,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    "WEBP_BUCKET": self.webp_bucket.id,
                    "JPEG_BUCKET": self.jpeg_bucket.id,
                    "PNG_BUCKET": self.png_bucket.id,
                    "METADATA_TABLE": self.metadata_table.name,
                    "REGION": "us-west-1"
                }
            ),
            code=pulumi.FileArchive("./lambda_code.zip"),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _configure_s3_notifications(self):
        """Configure S3 event notifications to trigger Lambda."""

        # Grant S3 permission to invoke Lambda
        lambda_permission = lambda_.Permission(
            f"s3-invoke-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.processor_function.name,
            principal="s3.amazonaws.com",
            source_arn=self.upload_bucket.arn,
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket notification
        bucket_notification = s3.BucketNotification(
            f"upload-notification-{self.environment_suffix}",
            bucket=self.upload_bucket.id,
            lambda_functions=[s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=self.processor_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_suffix=".jpg"
            ), s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=self.processor_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_suffix=".jpeg"
            ), s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=self.processor_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_suffix=".png"
            ), s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=self.processor_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_suffix=".webp"
            )],
            opts=ResourceOptions(depends_on=[lambda_permission], parent=self)
        )

    def _create_cloudfront_distribution(self):
        """Create CloudFront distribution for optimized image delivery."""

        # Origin Access Identity
        oai = cloudfront.OriginAccessIdentity(
            f"oai-{self.environment_suffix}",
            comment=f"OAI for image optimization {self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # Bucket policies for CloudFront access
        for bucket in [self.webp_bucket, self.jpeg_bucket, self.png_bucket]:
            bucket_policy = s3.BucketPolicy(
                f"{bucket._name}-cf-policy",
                bucket=bucket.id,
                policy=pulumi.Output.all(bucket.arn, oai.iam_arn).apply(
                    lambda args: json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Sid": "AllowCloudFrontAccess",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": args[1]
                            },
                            "Action": "s3:GetObject",
                            "Resource": f"{args[0]}/*"
                        }]
                    })
                ),
                opts=ResourceOptions(parent=bucket)
            )

        # CloudFront distribution
        self.distribution = cloudfront.Distribution(
            f"image-cdn-{self.environment_suffix}",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Image CDN for {self.environment_suffix}",
            default_root_object="index.html",

            origins=[
                cloudfront.DistributionOriginArgs(
                    domain_name=self.webp_bucket.bucket_regional_domain_name,
                    origin_id="webp-origin",
                    s3_origin_config=cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=oai.cloudfront_access_identity_path
                    )
                ),
                cloudfront.DistributionOriginArgs(
                    domain_name=self.jpeg_bucket.bucket_regional_domain_name,
                    origin_id="jpeg-origin",
                    s3_origin_config=cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=oai.cloudfront_access_identity_path
                    )
                ),
                cloudfront.DistributionOriginArgs(
                    domain_name=self.png_bucket.bucket_regional_domain_name,
                    origin_id="png-origin",
                    s3_origin_config=cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=oai.cloudfront_access_identity_path
                    )
                )
            ],

            default_cache_behavior=cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id="webp-origin",
                viewer_protocol_policy="redirect-to-https",
                min_ttl=0,
                default_ttl=2592000,  # 30 days
                max_ttl=2592000,
                forwarded_values=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="none"
                    )
                )
            ),

            ordered_cache_behaviors=[
                cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/jpeg/*",
                    allowed_methods=["GET", "HEAD", "OPTIONS"],
                    cached_methods=["GET", "HEAD"],
                    target_origin_id="jpeg-origin",
                    viewer_protocol_policy="redirect-to-https",
                    min_ttl=0,
                    default_ttl=2592000,
                    max_ttl=2592000,
                    forwarded_values=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=False,
                        cookies=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="none"
                        )
                    )
                ),
                cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/png/*",
                    allowed_methods=["GET", "HEAD", "OPTIONS"],
                    cached_methods=["GET", "HEAD"],
                    target_origin_id="png-origin",
                    viewer_protocol_policy="redirect-to-https",
                    min_ttl=0,
                    default_ttl=2592000,
                    max_ttl=2592000,
                    forwarded_values=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=False,
                        cookies=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="none"
                        )
                    )
                )
            ],

            restrictions=cloudfront.DistributionRestrictionsArgs(
                geo_restriction=cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),

            viewer_certificate=cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),

            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_cloudwatch_dashboard(self):
        """Create CloudWatch dashboard for monitoring."""

        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Duration", {"stat": "Average"}],
                            [".", ".", {"stat": "Maximum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Throttles", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-west-1",
                        "title": "Lambda Performance"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "UserErrors", {"stat": "Sum"}],
                            [".", "SystemErrors", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-west-1",
                        "title": "DynamoDB Errors"
                    }
                }
            ]
        })

        self.dashboard = cloudwatch.Dashboard(
            f"image-optimization-dashboard-{self.environment_suffix}",
            dashboard_name=f"image-optimization-{self.environment_suffix}",
            dashboard_body=dashboard_body,
            opts=ResourceOptions(parent=self)
        )
```

## lambda_handler.py
```python
"""
lambda_handler.py

Lambda function handler for image processing and optimization.
"""

import json
import os
import boto3
import time
from datetime import datetime
from PIL import Image
import io
import uuid
from decimal import Decimal

s3_client = boto3.client('s3', region_name='us-west-1')
dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
cloudwatch = boto3.client('cloudwatch', region_name='us-west-1')

WEBP_BUCKET = os.environ['WEBP_BUCKET']
JPEG_BUCKET = os.environ['JPEG_BUCKET']
PNG_BUCKET = os.environ['PNG_BUCKET']
METADATA_TABLE = os.environ['METADATA_TABLE']

def process_image(event, context):
    """
    Process uploaded images and generate optimized versions.

    Args:
        event: S3 event notification
        context: Lambda context

    Returns:
        Response with processing status
    """
    start_time = time.time()

    try:
        # Parse S3 event
        record = event['Records'][0]
        bucket_name = record['s3']['bucket']['name']
        object_key = record['s3']['object']['key']
        object_size = record['s3']['object']['size']

        print(f"Processing image: {object_key} from bucket: {bucket_name}")

        # Download image from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        image_data = response['Body'].read()

        # Open image with PIL
        img = Image.open(io.BytesIO(image_data))

        # Generate unique ID for this image
        image_id = str(uuid.uuid4())
        base_name = os.path.splitext(os.path.basename(object_key))[0]

        # Process and upload different formats
        formats_info = {}

        # WebP format
        webp_key = f"{base_name}_{image_id}.webp"
        webp_buffer = io.BytesIO()
        img.save(webp_buffer, format='WEBP', quality=85, method=6)
        webp_buffer.seek(0)
        s3_client.put_object(
            Bucket=WEBP_BUCKET,
            Key=webp_key,
            Body=webp_buffer.getvalue(),
            ContentType='image/webp'
        )
        formats_info['webp'] = {
            'bucket': WEBP_BUCKET,
            'key': webp_key,
            'size': len(webp_buffer.getvalue())
        }

        # JPEG format
        jpeg_key = f"{base_name}_{image_id}.jpg"
        jpeg_buffer = io.BytesIO()
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        img.save(jpeg_buffer, format='JPEG', quality=85, optimize=True)
        jpeg_buffer.seek(0)
        s3_client.put_object(
            Bucket=JPEG_BUCKET,
            Key=jpeg_key,
            Body=jpeg_buffer.getvalue(),
            ContentType='image/jpeg'
        )
        formats_info['jpeg'] = {
            'bucket': JPEG_BUCKET,
            'key': jpeg_key,
            'size': len(jpeg_buffer.getvalue())
        }

        # PNG format
        png_key = f"{base_name}_{image_id}.png"
        png_buffer = io.BytesIO()
        img.save(png_buffer, format='PNG', optimize=True)
        png_buffer.seek(0)
        s3_client.put_object(
            Bucket=PNG_BUCKET,
            Key=png_key,
            Body=png_buffer.getvalue(),
            ContentType='image/png'
        )
        formats_info['png'] = {
            'bucket': PNG_BUCKET,
            'key': png_key,
            'size': len(png_buffer.getvalue())
        }

        # Store metadata in DynamoDB
        table = dynamodb.Table(METADATA_TABLE)
        table.put_item(
            Item={
                'image_id': image_id,
                'original_filename': object_key,
                'upload_timestamp': Decimal(str(datetime.now().timestamp())),
                'original_size': object_size,
                'formats': formats_info,
                'conversion_status': 'completed',
                'processing_time': Decimal(str(time.time() - start_time))
            }
        )

        # Send metrics to CloudWatch
        processing_time = time.time() - start_time
        cloudwatch.put_metric_data(
            Namespace='ImageOptimization',
            MetricData=[
                {
                    'MetricName': 'ProcessingTime',
                    'Value': processing_time,
                    'Unit': 'Seconds'
                },
                {
                    'MetricName': 'ProcessedImages',
                    'Value': 1,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'TotalBytesProcessed',
                    'Value': object_size,
                    'Unit': 'Bytes'
                }
            ]
        )

        print(f"Successfully processed image {image_id} in {processing_time:.2f} seconds")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'image_id': image_id,
                'formats': formats_info,
                'processing_time': processing_time
            })
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")

        # Send error metric to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='ImageOptimization',
            MetricData=[
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        # Store error in DynamoDB
        if 'image_id' in locals():
            table = dynamodb.Table(METADATA_TABLE)
            table.put_item(
                Item={
                    'image_id': image_id,
                    'original_filename': object_key,
                    'upload_timestamp': Decimal(str(datetime.now().timestamp())),
                    'conversion_status': 'failed',
                    'error_message': str(e)
                }
            )

        raise e
```

## create_lambda_package.py
```python
"""
create_lambda_package.py

Script to create Lambda deployment package with dependencies.
"""

import os
import subprocess
import zipfile
import shutil

def create_lambda_package():
    """Create Lambda deployment package with Pillow and dependencies."""

    # Create temp directory for package
    package_dir = 'lambda_package'
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    os.makedirs(package_dir)

    # Install Pillow and dependencies
    subprocess.run([
        'pip', 'install',
        '--target', package_dir,
        'Pillow==10.2.0',
        '--platform', 'manylinux2014_x86_64',
        '--only-binary', ':all:'
    ], check=True)

    # Copy Lambda handler
    shutil.copy('lambda_handler.py', os.path.join(package_dir, 'handler.py'))

    # Create ZIP file
    zip_file = 'lambda_code.zip'
    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, package_dir)
                zf.write(file_path, arcname)

    # Clean up
    shutil.rmtree(package_dir)

    print(f"Lambda package created: {zip_file}")

if __name__ == '__main__':
    create_lambda_package()
```