"""Main CDKTF stack orchestrating all infrastructure components."""
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity

from lib.networking import NetworkingStack
from lib.security import SecurityStack
from lib.storage import StorageStack
from lib.vpc_endpoints import VpcEndpointsStack
from lib.monitoring import MonitoringStack
from lib.compliance import ComplianceStack


class TapStack(TerraformStack):
    """Main stack for zero-trust payment processing infrastructure."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        state_bucket: str = None,
        state_bucket_region: str = None,
        aws_region: str = "us-east-1",
        default_tags: dict = None
    ):
        super().__init__(scope, id)

        # AWS Provider - use default_tags from parameter or create default
        provider_tags = default_tags if default_tags is not None else {
            "tags": {
                "Environment": f"payment-{environment_suffix}",
                "ManagedBy": "cdktf",
                "Project": "zero-trust-payment-processing"
            }
        }

        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[provider_tags]
        )

        # Get current AWS account ID
        current_account = DataAwsCallerIdentity(self, "current")

        # Networking
        networking = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix
        )

        # Security (KMS, Security Groups, Network Firewall)
        security = SecurityStack(
            self,
            "security",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc.id,
            subnet_ids=[s.id for s in networking.private_subnets],
            account_id=current_account.account_id
        )

        # Storage (S3 buckets with compliance features)
        storage = StorageStack(
            self,
            "storage",
            environment_suffix=environment_suffix,
            kms_key_arn=security.s3_kms_key.arn
        )

        # VPC Endpoints
        vpc_endpoints = VpcEndpointsStack(
            self,
            "vpc_endpoints",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc.id,
            subnet_ids=[s.id for s in networking.private_subnets],
            security_group_id=security.app_security_group.id
        )

        # Monitoring (CloudWatch Logs)
        monitoring = MonitoringStack(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            kms_key_arn=security.cloudwatch_kms_key.arn
        )

        # Compliance (IAM roles, SSM parameters)
        compliance = ComplianceStack(
            self,
            "compliance",
            environment_suffix=environment_suffix,
            kms_key_arn=security.ssm_kms_key.arn,
            account_id=current_account.account_id
        )

        # Stack-level outputs
        TerraformOutput(
            self,
            "deployment_summary",
            value={
                "environment": f"payment-{environment_suffix}",
                "region": "us-east-1",
                "compliance": "pci-dss-level-1",
                "architecture": "zero-trust"
            },
            description="Deployment summary"
        )


def create_stack(environment_suffix: str):
    """Factory function to create the stack."""
    app = App()
    TapStack(app, "payment-processing", environment_suffix=environment_suffix)
    return app
