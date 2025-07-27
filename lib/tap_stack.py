from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from typing import Optional, Dict, Any

# ? Import your stacks here
# from .my_stack import MyStack

class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: Optional[str] = None,
        state_bucket: Optional[str] = None,
        state_bucket_region: Optional[str] = None,
        aws_region: Optional[str] = None,
        default_tags: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(scope, id)

        environment_suffix = environment_suffix or "dev"
        aws_region = aws_region or "us-east-1"
        state_bucket_region = state_bucket_region or "us-east-1"
        state_bucket = state_bucket or "iac-rlhf-tf-states"
        default_tags = [default_tags] if default_tags else []

        # Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
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
            key=f"{environment_suffix}/{id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )
        # Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
        # ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # ? Add your stack instantiations here
        # ! Do NOT create resources directly in this stack.
        # ! Instead, create separate stacks for each resource type.