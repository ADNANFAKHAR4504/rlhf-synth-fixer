"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import S3Backend, TerraformStack
from cdktf_cdktf_provider_aws.provider import (AwsProvider,
                                               AwsProviderDefaultTags)
from constructs import Construct

from lib.networking_stack import NetworkingStack


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
        aws_region = kwargs.get('aws_region', 'eu-west-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')

        # Get default tags from kwargs (already structured with "tags" key)
        # and merge with mandatory project tags
        default_tags_input = kwargs.get('default_tags', {"tags": {}})
        merged_tags = {
            'Environment': 'Production',
            'Project': 'PaymentGateway',
            'EnvironmentSuffix': environment_suffix,
            **default_tags_input.get('tags', {}),
        }
        default_tags = [{"tags": merged_tags}]

        # Configure AWS Provider with standard tags
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=default_tags,
        )

        # Configure remote state backend in S3 for shared environments
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Create Networking Stack
        self.networking_stack = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )
