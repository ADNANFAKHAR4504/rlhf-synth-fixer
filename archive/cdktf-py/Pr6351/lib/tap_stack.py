"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingModule
from lib.security import SecurityModule
from lib.data_storage import DataStorageModule
from lib.compute import ComputeModule
from lib.monitoring import MonitoringModule
from lib.compliance import ComplianceModule


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
        aws_region = kwargs.get('aws_region', 'ap-southeast-1')
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

        # Configure S3 Backend with dynamic bucket name
        S3Backend(
            self,
            bucket=f"terraform-state-{environment_suffix}-{aws_region}",
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=aws_region,
            encrypt=True,
        )

        # Create networking infrastructure
        networking = NetworkingModule(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # Create security infrastructure (KMS, IAM)
        security = SecurityModule(
            self,
            "security",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            vpc_id=networking.vpc.id,
        )

        # Create data storage infrastructure (S3)
        data_storage = DataStorageModule(
            self,
            "data_storage",
            environment_suffix=environment_suffix,
            kms_key_id=security.s3_kms_key.id,
            vpc_id=networking.vpc.id,
            flow_logs_bucket_arn=networking.flow_logs_bucket_arn,
        )

        # Create compute infrastructure (Lambda)
        compute = ComputeModule(
            self,
            "compute",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            vpc_id=networking.vpc.id,
            private_subnet_ids=networking.private_subnet_ids,
            security_group_id=networking.lambda_security_group_id,
            kms_key_arn=security.lambda_kms_key.arn,
            data_bucket_arn=data_storage.data_bucket_arn,
            lambda_role_arn=security.lambda_role_arn,
        )

        # Create monitoring infrastructure (CloudWatch)
        monitoring = MonitoringModule(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            kms_key_id=security.cloudwatch_kms_key.id,
            vpc_id=networking.vpc.id,
        )

        # Create compliance infrastructure (Config, EventBridge)
        compliance = ComplianceModule(
            self,
            "compliance",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            config_role_arn=security.config_role_arn,
            sns_topic_arn=monitoring.security_alerts_topic_arn,
        )

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=networking.vpc.id,
            description="VPC ID for the secure environment"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=Fn.jsonencode(networking.private_subnet_ids),
            description="Private subnet IDs"
        )

        TerraformOutput(
            self,
            "data_bucket_name",
            value=data_storage.data_bucket_name,
            description="S3 bucket for data storage"
        )

        TerraformOutput(
            self,
            "lambda_function_arn",
            value=compute.lambda_function_arn,
            description="Lambda function ARN"
        )

        TerraformOutput(
            self,
            "kms_key_arns",
            value=Fn.jsonencode({
                "s3": security.s3_kms_key.arn,
                "lambda": security.lambda_kms_key.arn,
                "cloudwatch": security.cloudwatch_kms_key.arn,
            }),
            description="KMS key ARNs for different services"
        )

        TerraformOutput(
            self,
            "security_alerts_topic_arn",
            value=monitoring.security_alerts_topic_arn,
            description="SNS topic for security alerts"
        )

        TerraformOutput(
            self,
            "config_recorder_name",
            value=compliance.config_recorder_name,
            description="AWS Config recorder name"
        )
