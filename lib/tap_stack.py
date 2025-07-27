"""Infrastructure stack for Turn Around Prompt (TAP) application."""

from typing import Optional

from cdktf import S3Backend, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
  S3BucketServerSideEncryptionConfiguration,
  S3BucketServerSideEncryptionConfigurationRule,
  S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault,
)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
  S3BucketVersioning,
  S3BucketVersioningVersioningConfiguration,
)
from constructs import Construct


class TapStack(TerraformStack):
  """Infrastructure stack for TAP application with S3 backend and resources."""

  def __init__(
    self,
    scope: Construct,
    id_: str,  # pylint: disable=redefined-builtin
    *,
    environment_suffix: str = "dev",
    state_bucket: Optional[str] = None,
    state_bucket_region: Optional[str] = None,
    aws_region: Optional[str] = None,
    **kwargs
  ):
    """Initialize the TAP stack.
    
    Args:
      scope: The construct scope
      id_: Unique identifier for this stack
      environment_suffix: Environment suffix for resource naming
      state_bucket: S3 bucket for Terraform state storage
      state_bucket_region: AWS region for state bucket
      aws_region: AWS region for resources
      **kwargs: Additional keyword arguments
    """
    super().__init__(scope, id_, **kwargs)

    # Set default values
    aws_region = aws_region or "us-east-1"
    state_bucket = state_bucket or f"tap-terraform-state-{environment_suffix}"
    state_bucket_region = state_bucket_region or aws_region

    # Configure S3 backend for Terraform state
    S3Backend(
      self,
      bucket=state_bucket,
      key=f"terraform/{id_}/terraform.tfstate",
      region=state_bucket_region,
    )

    # Configure AWS provider
    AwsProvider(
      self,
      "aws",
      region=aws_region,
    )

    # Create S3 bucket for application data
    bucket_name = f"tap-app-bucket-{id_.lower()}-{environment_suffix}"
    self.bucket = S3Bucket(
      self,
      "app_bucket",
      bucket=bucket_name,
      tags={
        "Name": bucket_name,
        "Environment": environment_suffix,
        "ManagedBy": "CDKTF",
        "Application": "TAP",
      },
    )

    # Configure bucket versioning
    self.bucket_versioning = S3BucketVersioning(
      self,
      "app_bucket_versioning",
      bucket=self.bucket.id,
      versioning_configuration=S3BucketVersioningVersioningConfiguration(
        status="Enabled"
      ),
    )

    # Configure bucket encryption
    self.bucket_encryption = S3BucketServerSideEncryptionConfiguration(
      self,
      "app_bucket_encryption",
      bucket=self.bucket.id,
      rule=[
        S3BucketServerSideEncryptionConfigurationRule(
          apply_server_side_encryption_by_default=(
            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
              sse_algorithm="AES256"
            )
          )
        )
      ],
    )
