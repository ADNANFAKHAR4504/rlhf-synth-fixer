"""S3 and CloudFront Stack for TapStack Architecture

This module combines S3 and CloudFront stacks to avoid circular dependencies.
The CloudFront OAI and bucket permissions must be created together.
"""

from typing import Optional

from aws_cdk import Duration, RemovalPolicy, Tags
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_kms as kms
from aws_cdk import aws_s3 as s3
from constructs import Construct


class S3CloudFrontStackProps:
  """Properties for S3 and CloudFront Stack"""
  
  def __init__(self, environment_suffix: Optional[str] = None):
    self.environment_suffix = environment_suffix


class S3CloudFrontStack(Construct):
  """Combined S3 and CloudFront Stack to avoid circular dependencies"""
  
  def __init__(self, scope: Construct, construct_id: str, props: S3CloudFrontStackProps):
    super().__init__(scope, construct_id)
    
    # Create KMS key for S3 encryption
    self.s3_kms_key = kms.Key(
      self,
      "S3EncryptionKey",
      description="KMS key for S3 bucket encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )
    
    # S3 Bucket for static website hosting with versioning and KMS encryption
    # Made private - will be accessed via CloudFront distribution only
    self.bucket = s3.Bucket(
      self,
      "FrontendBucket",
      versioned=True,
      encryption=s3.BucketEncryption.KMS,
      encryption_key=self.s3_kms_key,
      website_index_document="index.html",
      website_error_document="error.html",
      public_read_access=False,  # Private bucket - accessed via CloudFront
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY
    )
    
    # Tag bucket with environment: production
    Tags.of(self.bucket).add("environment", "production")
    
    # Create CloudFront Origin Access Identity for secure S3 access
    self.origin_access_identity = cloudfront.OriginAccessIdentity(
      self,
      "WebsiteOAI",
      comment=f"OAI for static website {props.environment_suffix or 'dev'}"
    )
    
    # Grant CloudFront access to S3 bucket
    self.bucket.grant_read(self.origin_access_identity)
    
    # Create CloudFront distribution for secure static content delivery
    self.distribution = cloudfront.CloudFrontWebDistribution(
      self,
      "WebsiteDistribution",
      origin_configs=[
        cloudfront.SourceConfiguration(
          s3_origin_source=cloudfront.S3OriginConfig(
            s3_bucket_source=self.bucket,
            origin_access_identity=self.origin_access_identity
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
              max_ttl=Duration.seconds(31536000)
            )
          ]
        )
      ],
      default_root_object="index.html",
      error_configurations=[
        cloudfront.CfnDistribution.CustomErrorResponseProperty(
          error_code=404,
          response_code=200,
          response_page_path="/error.html",
          error_caching_min_ttl=300
        ),
        cloudfront.CfnDistribution.CustomErrorResponseProperty(
          error_code=403,
          response_code=200,
          response_page_path="/error.html",
          error_caching_min_ttl=300
        )
      ],
      price_class=cloudfront.PriceClass.PRICE_CLASS_100,
      enabled=True
    )
