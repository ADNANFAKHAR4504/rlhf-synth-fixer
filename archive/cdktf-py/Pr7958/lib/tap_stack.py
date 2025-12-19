from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingConstruct
from lib.database import DatabaseConstruct
from lib.compute import ComputeConstruct
from lib.storage import StorageConstruct
from lib.session_state import SessionStateConstruct
from lib.failover_orchestration import FailoverOrchestrationConstruct
from lib.monitoring import MonitoringConstruct
from lib.traffic_management import TrafficManagementConstruct

# Unique suffix to avoid resource naming conflicts
UNIQUE_SUFFIX = "n4p7"


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-east-2",
    ):
        super().__init__(scope, construct_id)

        # Add unique suffix to environment suffix for resource naming
        env_suffix_with_unique = f"{environment_suffix}-{UNIQUE_SUFFIX}"
        self.environment_suffix = env_suffix_with_unique
        self.primary_region = primary_region
        self.secondary_region = secondary_region

        # Primary region provider
        self.primary_provider = AwsProvider(
            self,
            "aws-primary",
            region=primary_region,
            alias="primary"
        )

        # Secondary region provider
        self.secondary_provider = AwsProvider(
            self,
            "aws-secondary",
            region=secondary_region,
            alias="secondary"
        )

        # Networking layer - VPCs and peering
        self.networking = NetworkingConstruct(
            self,
            "networking",
            env_suffix_with_unique,
            self.primary_provider,
            self.secondary_provider,
            primary_region,
            secondary_region
        )

        # Database layer - Aurora clusters in both regions
        self.database = DatabaseConstruct(
            self,
            "database",
            env_suffix_with_unique,
            self.primary_provider,
            self.secondary_provider,
            self.networking.primary_vpc.id,
            self.networking.secondary_vpc.id,
            self.networking.primary_private_subnet_ids,
            self.networking.secondary_private_subnet_ids,
            self.networking.primary_db_security_group_id,
            self.networking.secondary_db_security_group_id
        )

        # Compute layer - ASG and ALB in both regions
        self.compute = ComputeConstruct(
            self,
            "compute",
            env_suffix_with_unique,
            self.primary_provider,
            self.secondary_provider,
            self.networking.primary_public_subnet_ids,
            self.networking.secondary_public_subnet_ids,
            self.networking.primary_private_subnet_ids,
            self.networking.secondary_private_subnet_ids,
            self.database.primary_cluster_endpoint,
            self.database.secondary_cluster_endpoint,
            self.networking.primary_app_security_group_id,
            self.networking.primary_alb_security_group_id,
            self.networking.secondary_app_security_group_id,
            self.networking.secondary_alb_security_group_id,
            self.networking.primary_vpc.id,
            self.networking.secondary_vpc.id
        )

        # Session state - DynamoDB global tables
        self.session_state = SessionStateConstruct(
            self,
            "session-state",
            env_suffix_with_unique,
            self.primary_provider,
            self.secondary_provider,
            primary_region,
            secondary_region
        )

        # Storage - S3 with cross-region replication
        self.storage = StorageConstruct(
            self,
            "storage",
            env_suffix_with_unique,
            self.primary_provider,
            self.secondary_provider,
            primary_region,
            secondary_region
        )

        # Monitoring - CloudWatch and SNS
        self.monitoring = MonitoringConstruct(
            self,
            "monitoring",
            env_suffix_with_unique,
            self.primary_provider,
            self.secondary_provider,
            self.compute.primary_alb_arn_suffix,
            self.compute.secondary_alb_arn_suffix,
            self.compute.primary_asg_name,
            self.compute.secondary_asg_name,
            self.database.primary_cluster_id,
            self.database.secondary_cluster_id
        )

        # Failover orchestration - Lambda functions
        self.failover = FailoverOrchestrationConstruct(
            self,
            "failover",
            env_suffix_with_unique,
            self.primary_provider,
            self.networking.primary_private_subnet_ids,
            self.monitoring.primary_sns_topic_arn,
            self.compute.primary_alb_full_arn,
            self.compute.secondary_alb_full_arn,
            primary_region,
            secondary_region,
            self.networking.primary_lambda_security_group_id
        )

        # Traffic management - Route 53 with failover
        self.traffic_management = TrafficManagementConstruct(
                self,
            "traffic",
            env_suffix_with_unique,
            self.primary_provider,
            self.compute.primary_alb_dns,
            self.compute.secondary_alb_dns,
            primary_region,
            secondary_region,
            self.compute.primary_alb_zone_id,
            self.compute.secondary_alb_zone_id
        )

        # Outputs
        TerraformOutput(
                self,
            "primary_alb_endpoint",
            value=self.compute.primary_alb_dns,
            description="Primary ALB DNS endpoint"
        )

        TerraformOutput(
            self,
            "secondary_alb_endpoint",
            value=self.compute.secondary_alb_dns,
            description="Secondary ALB DNS endpoint"
        )

        TerraformOutput(
            self,
            "route53_domain",
            value=self.traffic_management.domain_name,
            description="Route 53 domain for failover"
        )

        TerraformOutput(
            self,
            "primary_db_endpoint",
            value=self.database.primary_cluster_endpoint,
            description="Primary Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.session_state.table_name,
            description="DynamoDB global table name"
        )

        TerraformOutput(
            self,
            "s3_bucket_primary",
            value=self.storage.primary_bucket_name,
            description="Primary S3 bucket"
        )
