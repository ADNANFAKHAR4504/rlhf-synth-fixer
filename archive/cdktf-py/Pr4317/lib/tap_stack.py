"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingConstruct
from lib.storage import StorageConstruct
from lib.compute import ComputeConstruct
from lib.api import ApiGatewayConstruct
from lib.monitoring import MonitoringConstruct
from lib.backup import BackupConstruct


class TapStack(TerraformStack):
    """CDKTF Python stack for HIPAA-compliant Healthcare API infrastructure."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get("environment_suffix", "dev")
        aws_region = kwargs.get("aws_region", "us-east-1")
        state_bucket_region = kwargs.get("state_bucket_region", "us-east-1")
        state_bucket = kwargs.get("state_bucket", "iac-rlhf-tf-states")
        default_tags = kwargs.get("default_tags", {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Create networking infrastructure
        networking = NetworkingConstruct(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # Create storage infrastructure
        storage = StorageConstruct(
            self,
            "storage",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
        )

        # Create compute infrastructure
        compute = ComputeConstruct(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            security_group_id=networking.lambda_security_group_id,
            data_bucket_name=storage.data_bucket_name,
            dynamodb_table_name=storage.dynamodb_table_name,
            kms_key_arn=storage.kms_key_arn,
        )

        # Create API Gateway
        api = ApiGatewayConstruct(
            self,
            "api",
            environment_suffix=environment_suffix,
            data_processor_function_name=compute.data_processor_function_name,
            data_processor_invoke_arn=compute.data_processor_invoke_arn,
        )

        # Create monitoring infrastructure
        monitoring = MonitoringConstruct(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            api_gateway_id=api.api_gateway_id,
            api_gateway_stage_name=api.api_gateway_stage_name,
            data_processor_function_name=compute.data_processor_function_name,
            dynamodb_table_name=storage.dynamodb_table_name,
            remediation_function_arn=compute.remediation_function_arn,
        )

        # Create backup infrastructure
        backup = BackupConstruct(
            self,
            "backup",
            environment_suffix=environment_suffix,
            dynamodb_table_arn=storage.dynamodb_table_arn,
        )

        # Stack outputs
        TerraformOutput(
            self,
            "api_gateway_endpoint",
            value=api.api_gateway_endpoint,
            description="API Gateway endpoint URL",
        )

        TerraformOutput(
            self,
            "data_bucket_name",
            value=storage.data_bucket_name,
            description="S3 bucket for healthcare data",
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=storage.dynamodb_table_name,
            description="DynamoDB table for patient records",
        )

        TerraformOutput(
            self,
            "kms_key_arn",
            value=storage.kms_key_arn,
            description="KMS key ARN for encryption",
        )

        TerraformOutput(
            self,
            "cloudwatch_dashboard_url",
            value=monitoring.dashboard_url,
            description="CloudWatch dashboard URL",
        )
