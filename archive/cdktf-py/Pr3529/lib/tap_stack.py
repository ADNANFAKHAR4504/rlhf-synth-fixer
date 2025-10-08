"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.ecr_stack import ECRStack
from lib.lambda_stack import LambdaStack
from lib.monitoring_stack import MonitoringStack
from lib.database_stack import DatabaseStack


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
        aws_region = kwargs.get('aws_region', 'us-east-2')
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

        # S3 backend automatically supports state locking via DynamoDB
        # No need to add use_lockfile override

        # Create Database Stack
        database_stack = DatabaseStack(
            self,
            environment_suffix=environment_suffix
        )

        # Create ECR Stack
        ecr_stack = ECRStack(
            self,
            environment_suffix=environment_suffix
        )

        # Create Lambda Stack
        lambda_stack = LambdaStack(
            self,
            environment_suffix=environment_suffix,
            ecr_repository_arn=ecr_stack.repository_arn,
            dynamodb_table_name=database_stack.table_name,
            dynamodb_table_arn=database_stack.table_arn
        )

        # Create Monitoring Stack
        monitoring_stack = MonitoringStack(
            self,
            environment_suffix=environment_suffix,
            ecr_repository_name=ecr_stack.repository_name,
            lambda_function_arn=lambda_stack.function_arn,
            lambda_function_name=lambda_stack.function_name,
            sns_topic_arn=lambda_stack.sns_topic_arn
        )
