"""TAP Stack module for CDKTF Python infrastructure."""

import os
from cdktf import App, TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider

# Import the SecureAwsEnvironment stack from your tap.py file
# Make sure tap.py is in the same directory or accessible in your Python path
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from tap import SecureAwsEnvironment

# ----- ENVIRONMENT CONFIG (Global variables for the entire script) -----
# These are the primary source of configuration values from environment variables
global_environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
global_state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
global_state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
global_aws_region = os.getenv("AWS_REGION", "us-east-1")
global_repository_name = os.getenv("REPOSITORY", "unknown")
global_commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Define accounts and regions for SecureAwsEnvironment instantiations
accounts = {
    "dev": "405184066547",
    "prod": "405184066547"
}
regions = ["us-east-1", "eu-west-1"]


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

    # Extract configuration from kwargs - These must be inside __init__
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

    # Create S3 bucket for demonstration
    S3Bucket(
        self,
        "tap_bucket",
        bucket=f"tap-bucket-{environment_suffix}-{construct_id}",
        versioning={"enabled": True},
        server_side_encryption_configuration={
            "rule": {
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }
        }
    )

    # ? Add your stack instantiations here
    # ! Do NOT create resources directly in this stack.
    # ! Instead, create separate stacks for each resource type.

    # Instantiate SecureAwsEnvironment stacks for each account and region
    # These also need to be inside the __init__ method to have access to 'self'
    for env, account_id in accounts.items():
      for region in regions:
        SecureAwsEnvironment(
          self,  # Use 'self' as the scope for these nested stacks
          f"SecureStack-{env}-{region.replace('-', '')}",
          account_id=account_id,
          region=region,
          environment=env,
        )


# ----- STACK EXECUTION -----
# This is the entry point for your CDKTF application
app = App()

# Instantiate the main TapStack, passing in the necessary configurations
# Using the global variables defined at the top of the file
TapStack(
    app,
    f"TapStack-{global_environment_suffix}",
    environment_suffix=global_environment_suffix,
    aws_region=global_aws_region,
    state_bucket_region=global_state_bucket_region,
    state_bucket=global_state_bucket,
    default_tags={
        "Environment": global_environment_suffix,
        "Repository": global_repository_name,
        "Author": global_commit_author,
    }
)

app.synth()
