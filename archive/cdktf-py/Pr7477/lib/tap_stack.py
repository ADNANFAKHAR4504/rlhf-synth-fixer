"""TAP Stack module for CDKTF Python multi-region DR infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP multi-region infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with multi-region AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider for primary region (us-east-1)
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            alias="primary",
            region="us-east-1",
            default_tags=[default_tags],
        )

        # Configure AWS Provider for secondary region (us-west-2)
        secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            alias="secondary",
            region="us-west-2",
            default_tags=[default_tags],
        )

        # Configure S3 Backend (state locking handled by DynamoDB table if configured)
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Import multi-region DR stacks
        from lib.networking_stack import NetworkingStack
        from lib.database_stack import DatabaseStack
        from lib.monitoring_stack import MonitoringStack
        from lib.failover_stack import FailoverStack

        # Create networking infrastructure in both regions
        networking = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
        )

        # Create Aurora Global Database
        database = DatabaseStack(
            self,
            "database",
            environment_suffix=environment_suffix,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_vpc_id=networking.primary_vpc_id,
            secondary_vpc_id=networking.secondary_vpc_id,
            primary_subnet_ids=networking.primary_private_subnet_ids,
            secondary_subnet_ids=networking.secondary_private_subnet_ids,
            primary_security_group_id=networking.primary_db_security_group_id,
            secondary_security_group_id=networking.secondary_db_security_group_id,
        )

        # Create monitoring and alerting infrastructure
        monitoring = MonitoringStack(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_cluster_id=database.primary_cluster_id,
            secondary_cluster_id=database.secondary_cluster_id,
        )

        # Create failover orchestration
        failover = FailoverStack(
            self,
            "failover",
            environment_suffix=environment_suffix,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_cluster_endpoint=database.primary_cluster_endpoint,
            secondary_cluster_endpoint=database.secondary_cluster_endpoint,
            global_cluster_id=database.global_cluster_id,
            primary_subnet_ids=networking.primary_private_subnet_ids,
            secondary_subnet_ids=networking.secondary_private_subnet_ids,
            primary_lambda_security_group_id=networking.primary_lambda_security_group_id,
            secondary_lambda_security_group_id=networking.secondary_lambda_security_group_id,
            primary_sns_topic_arn=monitoring.primary_sns_topic_arn,
            secondary_sns_topic_arn=monitoring.secondary_sns_topic_arn,
            primary_replication_alarm=monitoring.primary_replication_alarm,
            secondary_cpu_alarm=monitoring.secondary_cpu_alarm,
        )
