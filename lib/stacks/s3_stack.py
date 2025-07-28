"""S3 Stack for TapStack Architecture

This module defines the S3 stack responsible for creating 
the S3 bucket for static website hosting with KMS encryption.
"""

from typing import Optional

from aws_cdk import RemovalPolicy, Tags
from aws_cdk import aws_kms as kms
from aws_cdk import aws_s3 as s3
from constructs import Construct


class S3StackProps:
  """Properties for S3 Stack"""
  
  def __init__(self, environment_suffix: Optional[str] = None):
    self.environment_suffix = environment_suffix


class S3Stack(Construct):
  """S3 Stack for static website hosting"""
  
  def __init__(self, scope: Construct, construct_id: str, props: S3StackProps):
    super().__init__(scope, construct_id)
    
    # Store environment suffix for potential future use
    self.environment_suffix = props.environment_suffix
    
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
