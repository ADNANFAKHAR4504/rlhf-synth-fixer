"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from lib.stacks.multi_region_dr_stack import MultiRegionDRStack


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure - Multi-Region DR implementation."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with Multi-Region DR infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

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

        # Create the Multi-Region DR Stack
        self.dr_stack = MultiRegionDRStack(
            self,
            "multi-region-dr",
            environment_suffix=environment_suffix
        )
