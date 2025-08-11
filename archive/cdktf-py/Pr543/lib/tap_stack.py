"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import S3Backend, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from constructs import Construct

from .infrastructure import Infrastructure


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

    # ? Add your stack instantiations here
    # ! Do NOT create resources directly in this stack.
    # ! Instead, create separate stacks for each resource type.

    # Initialize Infrastructure construct
    Infrastructure(
        self,
        "infrastructure",
        environment_suffix=environment_suffix,
        default_tags=default_tags
    )
