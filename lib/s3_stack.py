"""s3_stack.py
This module defines the S3Stack class, which creates S3 buckets
for storing CI/CD pipeline artifacts and build outputs.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_s3 as s3
from constructs import Construct


class S3StackProps(cdk.StackProps):
  """
  S3StackProps defines the properties for the S3Stack.
  
  Args:
    environment_suffix (Optional[str]): Environment suffix for resource naming
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps
  """
  
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class S3Stack(cdk.NestedStack):
  """
  S3Stack creates S3 buckets for CI/CD pipeline artifacts.
  
  This stack creates:
  - Artifacts bucket for pipeline artifacts and build outputs
  
  Args:
    scope (Construct): The parent construct
    construct_id (str): The unique identifier for this stack
    props (Optional[S3StackProps]): Optional properties for configuring the stack
    **kwargs: Additional keyword arguments passed to the CDK NestedStack
  """
  
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[S3StackProps] = None,
    **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)
    
    environment_suffix = props.environment_suffix if props else 'dev'
    
    # S3 bucket for pipeline artifacts
    self.artifacts_bucket = s3.Bucket(
      self,
      "ArtifactsBucket",
      bucket_name=f"ciapp-{environment_suffix}-artifacts-{cdk.Aws.ACCOUNT_ID}",
      versioned=True,
      encryption=s3.BucketEncryption.S3_MANAGED,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=cdk.RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          id="DeleteOldVersions",
          enabled=True,
          noncurrent_version_expiration=cdk.Duration.days(30)
        ),
        s3.LifecycleRule(
          id="DeleteIncompleteUploads", 
          enabled=True,
          abort_incomplete_multipart_upload_after=cdk.Duration.days(7)
        )
      ]
    )
    
    # Add tags to all resources
    cdk.Tags.of(self).add("Environment", environment_suffix)
    cdk.Tags.of(self).add("Component", "Storage")
