from cdktf import TerraformStack, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingModule
from lib.security import SecurityModule
from lib.monitoring import MonitoringModule
from lib.data_processing import DataProcessingModule


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Note: Using local backend for deployment
        # S3 backend configuration is typically managed by CI/CD

        # Networking Module
        self.networking = NetworkingModule(
            self, "networking",
            environment_suffix=environment_suffix,
            vpc_cidr="10.0.0.0/16"
        )

        # Security Module
        self.security = SecurityModule(
            self, "security",
            environment_suffix=environment_suffix,
            vpc_id=self.networking.vpc.id
        )

        # Monitoring Module
        self.monitoring = MonitoringModule(
            self, "monitoring",
            environment_suffix=environment_suffix,
            kms_key_arn=self.security.kms_key.arn
        )

        # Data Processing Module
        self.data_processing = DataProcessingModule(
            self, "data-processing",
            environment_suffix=environment_suffix,
            vpc_id=self.networking.vpc.id,
            private_subnet_ids=self.networking.private_subnet_ids,
            security_group_id=self.security.lambda_sg.id,
            kms_key_arn=self.security.kms_key.arn,
            lambda_role_arn=self.security.lambda_role.arn
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=self.networking.vpc.id
        )

        TerraformOutput(self, "kms_key_id",
            value=self.security.kms_key.id
        )

        TerraformOutput(self, "s3_bucket_name",
            value=self.data_processing.data_bucket.bucket
        )
