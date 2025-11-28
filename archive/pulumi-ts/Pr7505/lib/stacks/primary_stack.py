"""
Primary Region Stack (us-east-1)
Contains Aurora primary cluster, Lambda health checks, monitoring, and networking
"""

from cdktf import TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from constructs import Construct

from lib.constructs_lib.aurora_global import AuroraGlobalConstruct
from lib.constructs_lib.kms_keys import KmsKeyConstruct
from lib.constructs_lib.lambda_health_check import LambdaHealthCheckConstruct
from lib.constructs_lib.monitoring import MonitoringConstruct
from lib.constructs_lib.vpc import VpcConstruct


class PrimaryStack(TerraformStack):
    """
    Primary region stack for disaster recovery infrastructure.
    Deploys resources in us-east-1.
    """

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.region = region

        # AWS Provider for us-east-1
        AwsProvider(
            self,
            "aws",
            region=region,
            default_tags=[{
                "tags": {
                    "Environment": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Application": "FinancialTradingPlatform",
                    "DR-Role": "Primary",
                    "Region": region,
                }
            }]
        )

        # 1. KMS Customer-Managed Key for encryption
        self.kms_key = KmsKeyConstruct(
            self,
            "kms-key",
            environment_suffix=environment_suffix,
            region=region,
            description="KMS key for Aurora and DynamoDB encryption in us-east-1"
        )

        # 2. VPC with 3 AZs and private subnets
        self.vpc = VpcConstruct(
            self,
            "vpc",
            environment_suffix=environment_suffix,
            region=region,
            cidr_block="10.0.0.0/16",
            availability_zones=["us-east-1a", "us-east-1b", "us-east-1c"],
        )

        # 3. Aurora Global Database - Primary Cluster
        self.aurora = AuroraGlobalConstruct(
            self,
            "aurora",
            environment_suffix=environment_suffix,
            region=region,
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            database_security_group_id=self.vpc.database_security_group_id,
            kms_key_arn=self.kms_key.key_arn,
            is_primary=True,
        )

        # 4. Lambda Health Check Function
        self.health_check = LambdaHealthCheckConstruct(
            self,
            "health-check",
            environment_suffix=environment_suffix,
            region=region,
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            lambda_security_group_id=self.vpc.lambda_security_group_id,
            database_endpoint=self.aurora.writer_endpoint,
            database_secret_arn=self.aurora.master_secret_arn,
        )

        # 5. CloudWatch Monitoring and SNS Alarms
        self.monitoring = MonitoringConstruct(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            region=region,
            aurora_cluster_id=self.aurora.cluster_id,
            lambda_function_name=self.health_check.function_name,
            alarm_email="ops-team@example.com",
        )

        # Stack Outputs
        TerraformOutput(
            self,
            "vpc-id",
            value=self.vpc.vpc_id,
            description="VPC ID in us-east-1"
        )

        TerraformOutput(
            self,
            "aurora-cluster-id",
            value=self.aurora.cluster_id,
            description="Aurora Global Database Cluster ID (Primary)"
        )

        TerraformOutput(
            self,
            "aurora-writer-endpoint",
            value=self.aurora.writer_endpoint,
            description="Aurora Writer Endpoint"
        )

        TerraformOutput(
            self,
            "aurora-reader-endpoint",
            value=self.aurora.reader_endpoint,
            description="Aurora Reader Endpoint"
        )

        TerraformOutput(
            self,
            "health-check-url",
            value=self.health_check.function_url,
            description="Lambda Health Check Function URL"
        )

        TerraformOutput(
            self,
            "sns-topic-arn",
            value=self.monitoring.sns_topic_arn,
            description="SNS Topic ARN for Alarms"
        )

        TerraformOutput(
            self,
            "global-cluster-id",
            value=self.aurora.global_cluster_id,
            description="Aurora Global Cluster ID"
        )

    @property
    def aurora_writer_endpoint(self) -> str:
        """Returns Aurora writer endpoint for cross-stack reference."""
        return self.aurora.writer_endpoint

    @property
    def aurora_global_cluster_id(self) -> str:
        """Returns Aurora Global Cluster ID for secondary stack."""
        return self.aurora.global_cluster_id

    @property
    def health_check_url(self) -> str:
        """Returns health check Lambda URL for Route53."""
        return self.health_check.function_url