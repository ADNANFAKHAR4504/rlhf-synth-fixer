"""
tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the static website with Lambda backend project.
It provisions S3 bucket for static hosting and Lambda function for dynamic content.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3_deployment
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        # Validate environment_suffix
        if environment_suffix is not None and not isinstance(environment_suffix, str):
            raise ValueError("environment_suffix must be a string")
        if environment_suffix is not None and len(environment_suffix.strip()) == 0:
            raise ValueError("environment_suffix cannot be empty")
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Represents the main CDK stack for the static website with Lambda backend.

    This stack provisions:
    - S3 bucket for static website hosting
    - Lambda function for dynamic content
    - IAM roles with least privilege access
    - Static content deployment

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        website_bucket (s3.Bucket): The S3 bucket used for static website hosting.
        lambda_function (_lambda.Function): The Lambda function for dynamic content.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use default
        self.environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        # Validate environment_suffix
        if not self.environment_suffix or not isinstance(self.environment_suffix, str):
            raise ValueError(
                "environment_suffix is required and must be a non-empty string"
            )

        # Create S3 bucket for static website hosting (private - accessed via CloudFront)
        self.website_bucket = s3.Bucket(
            self,
            "WebsiteBucket",
            bucket_name=f"static-website-{self.environment_suffix}-{self.account}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            # Remove public access for security - CloudFront will handle access
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # Create IAM role for Lambda function with least privilege
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
            inline_policies={
                "S3AccessPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                                "s3:ListBucket",
                            ],
                            resources=[
                                self.website_bucket.bucket_arn,
                                f"{self.website_bucket.bucket_arn}/*",
                            ],
                        )
                    ]
                )
            },
        )

        # Create Lambda function for dynamic content using external file
        self.lambda_function = _lambda.Function(
            self,
            "DynamicContentFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=128,
            environment={
                "WEBSITE_BUCKET": self.website_bucket.bucket_name,
            },
            description="Lambda function for dynamic content processing",
        )

        # Create CloudFront Origin Access Identity for secure S3 access
        origin_access_identity = cloudfront.OriginAccessIdentity(
            self,
            "WebsiteOAI",
            comment=f"OAI for static website {self.environment_suffix}",
        )

        # Grant CloudFront access to S3 bucket
        self.website_bucket.grant_read(origin_access_identity)

        # Create CloudFront distribution for secure static content delivery
        self.distribution = cloudfront.CloudFrontWebDistribution(
            self,
            "WebsiteDistribution",
            origin_configs=[
                cloudfront.SourceConfiguration(
                    s3_origin_source=cloudfront.S3OriginConfig(
                        s3_bucket_source=self.website_bucket,
                        origin_access_identity=origin_access_identity,
                    ),
                    behaviors=[
                        cloudfront.Behavior(
                            is_default_behavior=True,
                            compress=True,
                            allowed_methods=cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                            cached_methods=cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                            min_ttl=Duration.seconds(0),
                            default_ttl=Duration.seconds(86400),
                            max_ttl=Duration.seconds(31536000),
                        )
                    ],
                )
            ],
            default_root_object="index.html",
            error_configurations=[
                cloudfront.CfnDistribution.CustomErrorResponseProperty(
                    error_code=404,
                    response_code=200,
                    response_page_path="/error.html",
                    error_caching_min_ttl=300,
                ),
                cloudfront.CfnDistribution.CustomErrorResponseProperty(
                    error_code=403,
                    response_code=200,
                    response_page_path="/error.html",
                    error_caching_min_ttl=300,
                ),
            ],
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True,
        )

        # Deploy static content to S3 bucket
        s3_deployment.BucketDeployment(
            self,
            "WebsiteDeployment",
            sources=[s3_deployment.Source.asset("lib/static_content")],
            destination_bucket=self.website_bucket,
            destination_key_prefix="",
            # Invalidate CloudFront cache after deployment
            distribution=self.distribution,
            distribution_paths=["/*"],
        )

        # Output the CloudFront distribution URL and Lambda function ARN
        CfnOutput(
            self,
            "WebsiteURL",
            value=f"https://{self.distribution.distribution_domain_name}",
            description="URL of the static website via CloudFront",
        )

        CfnOutput(
            self,
            "CloudFrontDistributionId",
            value=self.distribution.distribution_id,
            description="CloudFront Distribution ID",
        )

        CfnOutput(
            self,
            "LambdaFunctionARN",
            value=self.lambda_function.function_arn,
            description="ARN of the Lambda function",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Name of the Lambda function",
        )

        CfnOutput(
            self,
            "S3BucketName",
            value=self.website_bucket.bucket_name,
            description="Name of the S3 bucket",
        )
