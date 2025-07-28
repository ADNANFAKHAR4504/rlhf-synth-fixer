"""CloudFront Stack for TapStack Architecture

This module defines the CloudFront stack responsible for creating 
the CloudFront distribution for secure static content delivery.
"""

from typing import Optional

from aws_cdk import Duration
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_s3 as s3
from constructs import Construct


class CloudFrontStackProps:
  """Properties for CloudFront Stack"""
  
  def __init__(self, bucket: s3.Bucket, environment_suffix: Optional[str] = None):
    self.bucket = bucket
    self.environment_suffix = environment_suffix


class CloudFrontStack(Construct):
  """CloudFront Stack for secure content delivery"""
  
  def __init__(self, scope: Construct, construct_id: str, props: CloudFrontStackProps):
    super().__init__(scope, construct_id)
    
    # Create CloudFront Origin Access Identity for secure S3 access
    self.origin_access_identity = cloudfront.OriginAccessIdentity(
      self,
      "WebsiteOAI",
      comment=f"OAI for static website {props.environment_suffix or 'dev'}"
    )
    
    # Grant CloudFront access to S3 bucket
    props.bucket.grant_read(self.origin_access_identity)
    
    # Create CloudFront distribution for secure static content delivery
    self.distribution = cloudfront.CloudFrontWebDistribution(
      self,
      "WebsiteDistribution",
      origin_configs=[
        cloudfront.SourceConfiguration(
          s3_origin_source=cloudfront.S3OriginConfig(
            s3_bucket_source=props.bucket,
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
