"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import S3Backend, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from constructs import Construct

from .enterprise_security_stack import EnterpriseSecurityStack


class TapStack(TerraformStack):
  """CDKTF Python stack for TAP infrastructure."""

  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    **kwargs
  ):
    """Initialize the TAP stack with AWS infrastructure."""
    super().__init__(scope, construct_id)

    # Extract configuration from kwargs
    environment_suffix = kwargs.get('environment_suffix', 'dev')
    aws_region = kwargs.get('aws_region', 'us-east-1')
    state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
    state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
    default_tags = kwargs.get('default_tags', {})

    # Configure AWS Provider
    AwsProvider(
      self,
      "aws",
      region=aws_region,
      default_tags=[default_tags],
    )

    # Configure S3 Backend with native state locking
    S3Backend(
      self,
      bucket=state_bucket,
      key=f"{environment_suffix}/{construct_id}.tfstate",
      region=state_bucket_region,
      encrypt=True,
    )

    # Add S3 state locking using escape hatch
    self.add_override("terraform.backend.s3.use_lockfile", True)

    # Create S3 bucket for demonstration with valid name
    self.tap_bucket = S3Bucket(
      self,
      "tap_bucket",
      bucket=f"tap-bucket-{environment_suffix}-{construct_id}".lower().replace("_", "-")[:63],
      force_destroy=True
    )

    # Use separate resource for bucket versioning
    from cdktf_cdktf_provider_aws.s3_bucket_versioning import \
        S3BucketVersioning
    S3BucketVersioning(
      self,
      "tap_bucket_versioning", 
      bucket=self.tap_bucket.id,
      versioning_configuration={
        "status": "Enabled"
      }
    )

    # Use separate resource for server-side encryption
    from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
        S3BucketServerSideEncryptionConfigurationA,
        S3BucketServerSideEncryptionConfigurationRuleA,
        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA)
    
    S3BucketServerSideEncryptionConfigurationA(
      self,
      "tap_bucket_encryption",
      bucket=self.tap_bucket.id,
      rule=[
        S3BucketServerSideEncryptionConfigurationRuleA(
          apply_server_side_encryption_by_default=
            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
              sse_algorithm="AES256"
            )
        )
      ]
    )

    # Instantiate the enterprise security stack
    EnterpriseSecurityStack(self, "EnterpriseSecurity")

    # ? Add your stack instantiations here
    # ! Do NOT create resources directly in this stack.
    # ! Instead, create separate stacks for each resource type.
