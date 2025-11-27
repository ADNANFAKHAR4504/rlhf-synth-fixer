"""Single-region payment processing infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking_stack import NetworkingStack
from lib.database_stack import DatabaseStack
from lib.compute_stack import ComputeStack
from lib.monitoring_stack import MonitoringStack
from lib.backup_stack import BackupStack
from lib.dns_stack import DnsStack


class TapStack(TerraformStack):
    """Single-region payment processing infrastructure."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id)

        # Configuration
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        default_tags = kwargs.get('default_tags', {})

        # Single-region configuration
        region = "us-east-1"

        # AWS Provider
        provider = AwsProvider(
            self, "aws",
            region=region,
            default_tags=[default_tags],
        )

        # S3 Backend - temporarily disabled for local testing due to S3 access issues
        # S3Backend(
        #     self,
        #     bucket=state_bucket,
        #     key=f"{environment_suffix}/{construct_id}.tfstate",
        #     region=state_bucket_region,
        #     encrypt=True,
        # )

        # Networking
        networking = NetworkingStack(
            self, "networking",
            environment_suffix=environment_suffix,
            region=region,
            provider=provider,
        )

        # Database (Aurora + DynamoDB)
        database = DatabaseStack(
            self, "database",
            environment_suffix=environment_suffix,
            region=region,
            provider=provider,
            vpc=networking.vpc,
            private_subnets=networking.private_subnets,
            db_security_group=networking.db_security_group,
        )

        # Compute (Lambda + EventBridge)
        compute = ComputeStack(
            self, "compute",
            environment_suffix=environment_suffix,
            region=region,
            provider=provider,
            vpc=networking.vpc,
            private_subnets=networking.private_subnets,
            lambda_security_group=networking.lambda_security_group,
            aurora_endpoint=database.aurora_endpoint,
            dynamodb_table_name=database.dynamodb_table_name,
        )

        # Monitoring (CloudWatch)
        monitoring = MonitoringStack(
            self, "monitoring",
            environment_suffix=environment_suffix,
            region=region,
            provider=provider,
            aurora_cluster_id=database.aurora_cluster_id,
            lambda_function_name=compute.lambda_function_name,
            dynamodb_table_name=database.dynamodb_table_name,
        )

        # Backup (AWS Backup)
        backup = BackupStack(
            self, "backup",
            environment_suffix=environment_suffix,
            region=region,
            provider=provider,
            aurora_cluster_arn=database.aurora_cluster_arn,
        )

        # DNS (Route 53)
        dns = DnsStack(
            self, "dns",
            environment_suffix=environment_suffix,
            provider=provider,
            lambda_url=compute.lambda_url,
        )

        # Outputs
        TerraformOutput(self, "vpc_id", value=networking.vpc.id)
        TerraformOutput(self, "aurora_endpoint", value=database.aurora_endpoint)
        TerraformOutput(self, "aurora_cluster_id", value=database.aurora_cluster_id)
        TerraformOutput(self, "aurora_cluster_arn", value=database.aurora_cluster_arn)
        TerraformOutput(self, "dynamodb_table_name", value=database.dynamodb_table_name)
        TerraformOutput(self, "lambda_function_name", value=compute.lambda_function_name)
        TerraformOutput(self, "lambda_url", value=compute.lambda_url)
        TerraformOutput(self, "hosted_zone_id", value=dns.hosted_zone_id)
