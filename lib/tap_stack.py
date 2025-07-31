# """TAP Stack module for CDKTF Python infrastructure."""

# import os
# import sys

# from cdktf import App, TerraformStack, S3Backend
# from constructs import Construct
# from cdktf_cdktf_provider_aws.provider import AwsProvider
# from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket

# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# from tap import SecureAwsEnvironment

# # ----- ENVIRONMENT CONFIG (Global variables for the entire script) -----
# # These are the primary source of configuration values from environment variables
# global_environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
# global_state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
# global_state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
# global_aws_region = os.getenv("AWS_REGION", "us-east-1")
# global_repository_name = os.getenv("REPOSITORY", "unknown")
# global_commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# # Define DEV_ACCOUNT_ID and PROD_ACCOUNT_ID globally by reading from environment variables
# DEV_ACCOUNT_ID = os.getenv("DEV_ACCOUNT_ID")
# PROD_ACCOUNT_ID = os.getenv("PROD_ACCOUNT_ID")

# # Define accounts and regions for SecureAwsEnvironment instantiations globally
# # CORRECTED: This should be a dictionary, not a set containing a dictionary
# accounts = {
#     "dev": DEV_ACCOUNT_ID,
#     "prod": PROD_ACCOUNT_ID
# }
# regions = ["us-east-1", "eu-west-1"]
# app = App()
# class TapStack(TerraformStack):
#   """CDKTF Python stack for TAP infrastructure."""

#   def __init__(
#       self,
#       scope: Construct,
#       construct_id: str,
#       **kwargs
#   ):
     
#     """Initialize the TAP stack with AWS infrastructure."""
#     super().__init__(scope, construct_id)

#     # Extract configuration from kwargs - These must be inside __init__
#     environment_suffix = kwargs.get('environment_suffix', 'dev')
#     aws_region = kwargs.get('aws_region', 'us-east-1')
#     state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
#     state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
#     default_tags = kwargs.get('default_tags', {})

#     # Configure AWS Provider
#     AwsProvider(
#         self,
#         "aws",
#         region=aws_region,
#         default_tags=[default_tags],
#     )

#     # Configure S3 Backend with native state locking
#     S3Backend(
#         self,
#         bucket=state_bucket,
#         key=f"{environment_suffix}/{construct_id}.tfstate",
#         region=state_bucket_region,
#         encrypt=True,
#     )

#     # Add S3 state locking using escape hatch
#     self.add_override("terraform.backend.s3.use_lockfile", True)

#     # Create S3 bucket for demonstration
#     S3Bucket(
#         self,
#         "tap_bucket",
#         bucket=f"tap-bucket-{environment_suffix}-{construct_id}",
#         versioning={"enabled": True},
#         server_side_encryption_configuration={
#             "rule": {
#                 "apply_server_side_encryption_by_default": {
#                     "sse_algorithm": "AES256"
#                 }
#             }
#         }
#     )

#     # ? Add your stack instantiations here
#     # ! Do NOT create resources directly in this stack.
#     # ! Instead, create separate stacks for each resource type.

#     app_scope = self.node.root

#     # Defensive check to ensure the root is the App
#     if not isinstance(app_scope, App):
#         raise TypeError("Could not find the root App instance from the construct tree.")

#     # Loop through the accounts and regions to instantiate a separate stack for each.
#     # Each stack is now correctly scoped to the app, not nested inside TapStack.
#     for env, account_id in accounts.items(): # Use the global 'accounts' dictionary
#       for region in regions: # Use the global 'regions' list
#         SecureAwsEnvironment(
#           app_scope,  # <-- Use the retrieved App instance as the scope
#           f"SecureStack-{env}-{region.replace('-', '')}",
#           account_id=account_id,
#           region=region,
#           environment=env,
#         )
# # --- Instantiate your TapStack here ---

# TapStack(
#     app,
#     f"TapStack-{global_environment_suffix}",
#     environment_suffix=global_environment_suffix,
#     aws_region=global_aws_region,
#     state_bucket_region=global_state_bucket_region,
#     state_bucket=global_state_bucket,
#     default_tags={
#         "Repository": global_repository_name,
#         "CommitAuthor": global_commit_author,
#         "Environment": global_environment_suffix,
#     }
# )

# # Synthesize the app to generate Terraform configuration files
# app.synth()


"""TAP Stack module for CDKTF Python infrastructure."""

import os
import sys

from cdktf import App, TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from tap import SecureAwsEnvironment

# ----- ENVIRONMENT CONFIG (Global variables for the entire script) -----
# These are the primary source of configuration values from environment variables
global_environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
global_state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
global_state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
global_aws_region = os.getenv("AWS_REGION", "us-east-1")
global_repository_name = os.getenv("REPOSITORY", "unknown")
global_commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Define DEV_ACCOUNT_ID and PROD_ACCOUNT_ID globally by reading from environment variables
DEV_ACCOUNT_ID = os.getenv("DEV_ACCOUNT_ID")
PROD_ACCOUNT_ID = os.getenv("PROD_ACCOUNT_ID")

# Define accounts and regions for SecureAwsEnvironment instantiations globally
accounts = {
    "dev": DEV_ACCOUNT_ID,
    "prod": PROD_ACCOUNT_ID
}
regions = ["us-east-1", "eu-west-1"]

# Initialize the App instance
app = App()

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
    environment_suffix = kwargs.get('environment_suffix', global_environment_suffix) # Use global for defaults
    aws_region = kwargs.get('aws_region', global_aws_region) # Use global for defaults
    state_bucket_region = kwargs.get('state_bucket_region', global_state_bucket_region) # Use global for defaults
    state_bucket = kwargs.get('state_bucket', global_state_bucket) # Use global for defaults
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

    # The SecureAwsEnvironment stacks are intended to be top-level.
    # So, we pass 'self.node.root' (which is the App instance) as their scope.
    app_scope = self.node.root

    # Defensive check to ensure the root is the App
    if not isinstance(app_scope, App):
        raise TypeError("Could not find the root App instance from the construct tree.")

    # Loop through the accounts and regions to instantiate a separate stack for each.
    for env, account_id in accounts.items():
      # Important: Ensure account_id is not None before proceeding
      if account_id is None:
          print(f"Warning: Skipping SecureAwsEnvironment for '{env}' as ACCOUNT_ID is not set.")
          continue

      for region in regions:
        SecureAwsEnvironment(
          app_scope,
          f"SecureStack-{env}-{region.replace('-', '')}",
          account_id=account_id,
          region=region,
          environment=env,
        )

# --- Instantiate your TapStack here ---
TapStack(
    app,
    f"TapStack-{global_environment_suffix}",
    environment_suffix=global_environment_suffix,
    aws_region=global_aws_region,
    state_bucket_region=global_state_bucket_region,
    state_bucket=global_state_bucket,
    default_tags={
        "Repository": global_repository_name,
        "CommitAuthor": global_commit_author,
        "Environment": global_environment_suffix,
    }
)

# Synthesize the app to generate Terraform configuration files
app.synth()