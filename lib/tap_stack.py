"""Multi-region disaster recovery stack."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking_stack import NetworkingStack
from lib.database_stack import DatabaseStack
from lib.compute_stack import ComputeStack
from lib.monitoring_stack import MonitoringStack
from lib.backup_stack import BackupStack
from lib.dns_stack import DnsStack


class TapStack(TerraformStack):
    """Multi-region disaster recovery infrastructure."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id)

        # Configuration
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        default_tags = kwargs.get('default_tags', {})

        # Multi-region configuration
        primary_region = "us-east-1"
        secondary_region = "us-west-2"

        # AWS Providers for both regions
        primary_provider = AwsProvider(
            self, "aws_primary",
            region=primary_region,
            alias="primary",
            default_tags=[default_tags],
        )

        secondary_provider = AwsProvider(
            self, "aws_secondary",
            region=secondary_region,
            alias="secondary",
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

        # Networking in both regions
        networking_primary = NetworkingStack(
            self, "networking_primary",
            environment_suffix=environment_suffix,
            region=primary_region,
            provider=primary_provider,
        )

        networking_secondary = NetworkingStack(
            self, "networking_secondary",
            environment_suffix=environment_suffix,
            region=secondary_region,
            provider=secondary_provider,
        )

        # Database (Aurora Global + DynamoDB Global Tables)
        database = DatabaseStack(
            self, "database",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_vpc=networking_primary.vpc,
            secondary_vpc=networking_secondary.vpc,
            primary_private_subnets=networking_primary.private_subnets,
            secondary_private_subnets=networking_secondary.private_subnets,
            primary_db_security_group=networking_primary.db_security_group,
            secondary_db_security_group=networking_secondary.db_security_group,
        )

        # Compute (Lambda + EventBridge)
        compute = ComputeStack(
            self, "compute",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_vpc=networking_primary.vpc,
            secondary_vpc=networking_secondary.vpc,
            primary_private_subnets=networking_primary.private_subnets,
            secondary_private_subnets=networking_secondary.private_subnets,
            primary_lambda_security_group=networking_primary.lambda_security_group,
            secondary_lambda_security_group=networking_secondary.lambda_security_group,
            primary_aurora_endpoint=database.primary_aurora_endpoint,
            secondary_aurora_endpoint=database.secondary_aurora_endpoint,
            dynamodb_table_name=database.dynamodb_table_name,
        )

        # Monitoring (CloudWatch)
        monitoring = MonitoringStack(
            self, "monitoring",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_aurora_cluster_id=database.primary_aurora_cluster_id,
            secondary_aurora_cluster_id=database.secondary_aurora_cluster_id,
            primary_lambda_function_name=compute.primary_lambda_function_name,
            secondary_lambda_function_name=compute.secondary_lambda_function_name,
            dynamodb_table_name=database.dynamodb_table_name,
        )

        # Backup (AWS Backup with cross-region copy)
        backup = BackupStack(
            self, "backup",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_aurora_cluster_arn=database.primary_aurora_cluster_arn,
        )

        # DNS (Route 53 failover)
        dns = DnsStack(
            self, "dns",
            environment_suffix=environment_suffix,
            primary_provider=primary_provider,
            primary_lambda_url=compute.primary_lambda_url,
            secondary_lambda_url=compute.secondary_lambda_url,
        )