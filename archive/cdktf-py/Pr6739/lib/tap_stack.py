"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
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

        # Define outputs at the stack level (without prefix)
        TerraformOutput(self, 'vpc_primary_id', value=self.dr_stack.vpc_primary.id)
        TerraformOutput(self, 'vpc_secondary_id', value=self.dr_stack.vpc_secondary.id)
        TerraformOutput(self, 'aurora_primary_endpoint', value=self.dr_stack.aurora_primary.endpoint)
        TerraformOutput(self, 'aurora_secondary_endpoint', value=self.dr_stack.aurora_secondary.endpoint)
        TerraformOutput(self, 'dynamodb_table_name', value=self.dr_stack.dynamodb_table.name)
        TerraformOutput(self, 'api_primary_endpoint', value=self.dr_stack.api_primary.api_endpoint)
        TerraformOutput(self, 'api_secondary_endpoint', value=self.dr_stack.api_secondary.api_endpoint)
        TerraformOutput(self, 'hosted_zone_id', value=self.dr_stack.hosted_zone.zone_id)
        TerraformOutput(self, 'health_check_id', value=self.dr_stack.health_check.id)
        TerraformOutput(self, 's3_primary_bucket', value=self.dr_stack.s3_primary.bucket)
        TerraformOutput(self, 's3_secondary_bucket', value=self.dr_stack.s3_secondary.bucket)
        TerraformOutput(self, 'sns_primary_topic_arn', value=self.dr_stack.sns_primary.arn)
        TerraformOutput(self, 'sns_secondary_topic_arn', value=self.dr_stack.sns_secondary.arn)
