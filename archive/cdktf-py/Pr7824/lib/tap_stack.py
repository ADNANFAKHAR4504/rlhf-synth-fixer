"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.environment_config import EnvironmentConfig
from lib.fintech_infrastructure_construct import FinTechInfrastructureConstruct


class TapStack(TerraformStack):
    """CDKTF Python stack for multi-environment FinTech infrastructure."""

    def __init__(
        self, scope: Construct, construct_id: str, **kwargs
    ):  # pylint: disable=too-many-locals
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get("environment_suffix", "dev")
        aws_region = kwargs.get("aws_region", "us-east-1")
        state_bucket_region = kwargs.get("state_bucket_region", "us-east-1")
        state_bucket = kwargs.get("state_bucket", "iac-rlhf-tf-states")
        default_tags = kwargs.get("default_tags", {})

        # Determine environment from suffix (extract environment name)
        # Environment suffix format: {random_string} or may contain environment hint
        # For this implementation, we'll extract environment from environment variable or default
        import os

        environment = os.getenv("ENVIRONMENT", "dev")

        # Get environment-specific configuration
        env_config = EnvironmentConfig.get_config(environment)

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

        # Build common tags
        common_tags = {
            "Environment": environment,
            "CostCenter": "FinTech",
            "ManagedBy": "CDKTF",
            "Project": "payment-processing",
            "EnvironmentSuffix": environment_suffix,
        }

        # Merge with default tags if provided
        if default_tags and "tags" in default_tags:
            common_tags.update(default_tags["tags"])

        # Create FinTech infrastructure using reusable construct
        FinTechInfrastructureConstruct(
            self,
            "fintech_infrastructure",
            environment=environment,
            environment_suffix=environment_suffix,
            config=env_config,
            common_tags=common_tags,
        )
