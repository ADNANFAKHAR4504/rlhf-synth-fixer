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
            code=pulumi.FileArchive("./lib/lambda_code.zip"),
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
