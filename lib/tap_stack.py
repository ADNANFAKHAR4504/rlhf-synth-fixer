"""TAP Stack module for CDKTF Python infrastructure."""

import os

from cdktf import App, S3Backend, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from constructs import Construct


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
      default_tags=default_tags,
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

    # Create S3 bucket for demonstration
    self.bucket_versioning = {"enabled": True}
    self.bucket_encryption = {
      "rule": {
        "apply_server_side_encryption_by_default": {"sse_algorithm": "AES256"}
      }
    }
    self.bucket = S3Bucket(
      self,
      "tap_bucket",
      bucket=f"tap-bucket-{environment_suffix}-{construct_id}",
      versioning=self.bucket_versioning,
      server_side_encryption_configuration=self.bucket_encryption,
    )

    # ? Add your stack instantiations here
    # ! Do NOT create resources directly in this stack.
    # ! Instead, create separate stacks for each resource type.


if __name__ == "__main__":
  environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
  state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
  state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
  aws_region = os.getenv("AWS_REGION", "us-east-1")
  repository_name = os.getenv("REPOSITORY", "unknown")
  commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

  stack_name = f"TapStack{environment_suffix}"

  default_tags = {
    "tags": {
      "Environment": environment_suffix,
      "Repository": repository_name,
      "Author": commit_author,
    }
  }

  app = App()
  TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
  )
  app.synth()
