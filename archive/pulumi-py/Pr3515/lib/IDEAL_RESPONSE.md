# Image Optimization Infrastructure - Ideal Response Documentation

## Overview
This document outlines the ideal response and expected behavior for the **TAP (Test Automation Platform) Image Optimization Infrastructure** implemented using **Pulumi** and **AWS services**. The stack provides a complete serverless image processing pipeline with global content delivery.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Upload   │───▶│   Upload Bucket  │───▶│ Lambda Processor│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌──────────────────┐    ┌─────────▼─────────┐
                       │  CloudFront CDN  │◀───│ Optimized Buckets │
                       └──────────────────┘    └───────────────────┘
                                │                         │
                       ┌────────▼────────┐              │
                       │   Global Users  │              │
                       └─────────────────┘              │
                                                ┌───────▼────────┐
                                                │ DynamoDB Table │
                                                └────────────────┘
```

## Infrastructure Components

### 1. **S3 Storage Layer**
#### Upload Bucket (`image-uploads-{environment_suffix}`)
- **Purpose**: Receives original images from users
- **Configuration**: 
  - Versioning enabled for data protection
  - Transfer acceleration for global uploads
  - CORS configured for web uploads
  - S3 event notifications trigger processing
- **Expected Behavior**: Accept images up to Lambda size limits

#### Optimized Storage Buckets
- **WebP Bucket** (`optimized-webp-{environment_suffix}`): Modern format with superior compression
- **JPEG Bucket** (`optimized-jpeg-{environment_suffix}`): Universal compatibility format  
- **PNG Bucket** (`optimized-png-{environment_suffix}`): Lossless format for graphics
- **Configuration**: Public read access for CloudFront origins

### 2. **Processing Layer**
#### Lambda Function (`image-processor-{environment_suffix}`)
- **Runtime**: Python 3.11
- **Memory**: 1024MB 
- **Timeout**: 300 seconds (5 minutes)
- **Dependencies**: Pillow (PIL) for image processing
- **Triggers**: S3 upload events from upload bucket
- **Environment Variables**:
  - `WEBP_BUCKET`: Target bucket for WebP images
  - `JPEG_BUCKET`: Target bucket for JPEG images  
  - `PNG_BUCKET`: Target bucket for PNG images
  - `METADATA_TABLE`: DynamoDB table for metadata storage
  - `REGION`: AWS region (us-west-1)

**Processing Logic**:
1. Receive S3 event notification
2. Download original image from upload bucket
3. Generate optimized versions in multiple formats
4. Upload processed images to respective buckets
5. Store processing metadata in DynamoDB
6. Log processing metrics to CloudWatch

### 3. **Content Delivery Layer**
#### CloudFront Distribution
- **Purpose**: Global CDN for optimized image delivery
- **Origins**: All three optimized storage buckets
- **Cache Behavior**: Optimized for image content
- **Expected Performance**:
  - Cache hit ratio > 90%
  - Global edge location coverage
  - Automatic compression and optimization

### 4. **Metadata Storage**
#### DynamoDB Table (`image-metadata-{environment_suffix}`)
- **Primary Key**: `image_id` (HASH)
- **Billing Mode**: Pay-per-request
- **Purpose**: Store image processing metadata and metrics
- **Schema**:
  ```json
  {
    "image_id": "string",
    "original_size": "number",
    "optimized_sizes": {
      "webp": "number",
      "jpeg": "number", 
      "png": "number"
    },
    "processing_time": "number",
    "timestamp": "string",
    "status": "string"
  }
  ```

### 5. **Monitoring Layer**
#### CloudWatch Dashboard
- **Metrics Tracked**:
  - Lambda execution duration and success rate
  - S3 bucket storage utilization
  - CloudFront cache hit ratio and error rates
  - DynamoDB read/write capacity utilization

## Expected Stack Outputs

When deployed, the stack should export the following outputs:

```yaml
Outputs:
  upload_bucket: "image-uploads-{environment_suffix}"
  webp_bucket: "optimized-webp-{environment_suffix}"
  jpeg_bucket: "optimized-jpeg-{environment_suffix}"
  png_bucket: "optimized-png-{environment_suffix}"
  cloudfront_distribution: "{distribution_id}.cloudfront.net"
  cloudfront_distribution_id: "{CLOUDFRONT_ID}"
  dynamodb_table: "image-metadata-{environment_suffix}"
  lambda_function: "image-processor-{environment_suffix}"
  lambda_function_arn: "arn:aws:lambda:us-west-1:{account}:function:image-processor-{environment_suffix}"
```

## Deployment Requirements

### Prerequisites
- **AWS Credentials**: Configured with appropriate IAM permissions
- **Pulumi CLI**: Version 3.x installed and configured
- **Python**: 3.11+ with required dependencies
- **Lambda Package**: Pre-built deployment package with Pillow

### Environment Configuration
- **Environment Suffix**: Unique identifier for the deployment (e.g., `pr3515`)
- **AWS Region**: us-west-1 (configurable)
- **Tags**: Environment, Repository, Author metadata

## Expected Behaviors & Performance

### 1. **Image Upload Flow**
```
User Upload → S3 Upload Bucket → S3 Event → Lambda Trigger → Image Processing → 
Multi-format Output → Optimized Buckets → CloudFront Cache → Global Delivery
```

### 2. **Processing Performance**
- **Small Images** (< 1MB): < 10 seconds processing time
- **Medium Images** (1-5MB): < 30 seconds processing time  
- **Large Images** (5-10MB): < 60 seconds processing time
- **Optimization Ratio**: 20-70% size reduction depending on format and content

### 3. **Availability & Reliability**
- **Lambda Success Rate**: > 99%
- **S3 Durability**: 99.999999999% (11 9's)
- **CloudFront Uptime**: > 99.9%
- **DynamoDB Availability**: > 99.99%

### 4. **Cost Optimization**
- **DynamoDB**: Pay-per-request billing for variable workloads
- **Lambda**: Pay-per-execution with efficient memory allocation
- **S3**: Standard storage for optimized images, lifecycle policies for cleanup
- **CloudFront**: Reduced origin requests through effective caching

## Testing & Validation Criteria

### 1. **Infrastructure Validation**
- ✅ All S3 buckets created with correct permissions and configurations
- ✅ Lambda function deployed with proper IAM roles and environment variables
- ✅ DynamoDB table created with correct schema and billing mode
- ✅ CloudFront distribution configured with all origin buckets
- ✅ All stack outputs available and accessible

### 2. **Functional Testing**
- ✅ Image upload triggers Lambda function execution
- ✅ Lambda processes images and generates optimized formats
- ✅ Processed images stored in correct buckets
- ✅ Metadata recorded in DynamoDB with accurate information
- ✅ Images accessible via CloudFront URLs
- ✅ Processing completes within expected time limits

### 3. **Integration Testing**
- ✅ End-to-end image optimization workflow
- ✅ Error handling for unsupported formats
- ✅ Concurrent processing capability
- ✅ CloudWatch metrics and logging functionality
- ✅ Clean resource cleanup and teardown

### 4. **Security Validation**
- ✅ IAM roles follow least privilege principle
- ✅ S3 buckets have appropriate access controls
- ✅ Lambda function execution in isolated environment
- ✅ No sensitive data in logs or error messages

## Monitoring & Alerting

### Key Metrics
- **Lambda Errors**: Monitor failed executions and timeout errors
- **Processing Duration**: Track average and p99 processing times  
- **Storage Growth**: Monitor bucket size growth patterns
- **Cache Performance**: CloudFront cache hit ratio and response times
- **Cost Tracking**: Resource usage and billing alerts

### Recommended Alarms
- Lambda error rate > 5%
- Average processing time > 60 seconds
- S3 storage growth > expected threshold
- CloudFront 4xx/5xx error rate > 1%
- Unexpected cost spikes

## Troubleshooting Guide

### Common Issues
1. **Lambda Timeout**: Increase memory allocation or timeout duration
2. **Large File Processing**: Implement chunked processing or file size limits
3. **Cold Start Latency**: Consider provisioned concurrency for consistent performance
4. **DynamoDB Throttling**: Review capacity settings or switch to provisioned mode
5. **CloudFront Cache Issues**: Check cache behaviors and TTL settings

## Future Enhancements
- **Advanced Image Formats**: Support for AVIF, WebP 2.0
- **AI-Powered Optimization**: Smart cropping and content-aware compression
- **Progressive Loading**: Generate multiple resolution variants
- **Real-time Processing**: WebSocket-based processing status updates
- **Batch Processing**: Bulk image optimization capabilities

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

# image_optimization_stack.py
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

        # Upload bucket
        self.upload_bucket = s3.Bucket(
            f"upload-bucket-{self.environment_suffix}",
            bucket=f"image-uploads-{self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure versioning for upload bucket
        s3.BucketVersioning(
            f"upload-bucket-versioning-{self.environment_suffix}",
            bucket=self.upload_bucket.id,
            versioning_configuration=s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.upload_bucket)
        )

        # Configure transfer acceleration for upload bucket
        s3.BucketAccelerateConfiguration(
            f"upload-bucket-acceleration-{self.environment_suffix}",
            bucket=self.upload_bucket.id,
            status="Enabled",
            opts=ResourceOptions(parent=self.upload_bucket)
        )

        # Configure CORS for upload bucket
        s3.BucketCorsConfiguration(
            f"upload-bucket-cors-{self.environment_suffix}",
            bucket=self.upload_bucket.id,
            cors_rules=[s3.BucketCorsConfigurationCorsRuleArgs(
                allowed_headers=["*"],
                allowed_methods=["PUT", "POST"],
                allowed_origins=["*"],
                expose_headers=["ETag"]
            )],
            opts=ResourceOptions(parent=self.upload_bucket)
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
        for bucket, name in [(self.webp_bucket, "webp"), (self.jpeg_bucket, "jpeg"), (self.png_bucket, "png")]:
            s3.BucketPublicAccessBlock(
                f"{name}-bucket-{self.environment_suffix}-pab",
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
        for bucket, name in [(self.webp_bucket, "webp"), (self.jpeg_bucket, "jpeg"), (self.png_bucket, "png")]:
            bucket_policy = s3.BucketPolicy(
                f"{name}-bucket-{self.environment_suffix}-cf-policy",
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
