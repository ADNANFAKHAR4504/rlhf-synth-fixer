"""TAP Stack module for StreamFlix video processing pipeline infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingConstruct
from lib.kinesis import KinesisConstruct
from lib.database import DatabaseConstruct
from lib.compute import ComputeConstruct
from lib.monitoring import MonitoringConstruct


class TapStack(TerraformStack):
    """CDKTF Python stack for StreamFlix video processing pipeline."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get("environment_suffix", "dev")
        aws_region = kwargs.get("aws_region", "eu-central-1")
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

        # Create Kinesis stream for video ingestion
        kinesis = KinesisConstruct(
            self,
            "kinesis",
            environment_suffix=environment_suffix,
        )

        # Create database infrastructure
        database = DatabaseConstruct(
            self,
            "database",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            database_security_group_id=networking.database_security_group_id,
        )

        # Create compute infrastructure
        compute = ComputeConstruct(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            ecs_security_group_id=networking.ecs_security_group_id,
            kinesis_stream_arn=kinesis.stream_arn,
            kinesis_stream_name=kinesis.stream_name,
            db_secret_arn=database.db_secret_arn,
            db_cluster_endpoint=database.db_cluster_endpoint,
        )

        # Create monitoring infrastructure
        monitoring = MonitoringConstruct(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            kinesis_stream_name=kinesis.stream_name,
            ecs_cluster_name=compute.ecs_cluster_name,
            ecs_service_name=compute.ecs_service_name,
            db_cluster_id=database.db_cluster_id,
        )

        # Stack outputs
        TerraformOutput(
            self,
            "kinesis_stream_name",
            value=kinesis.stream_name,
            description="Kinesis Data Stream name for video ingestion",
        )

        TerraformOutput(
            self,
            "kinesis_stream_arn",
            value=kinesis.stream_arn,
            description="Kinesis Data Stream ARN",
        )

        TerraformOutput(
            self,
            "database_endpoint",
            value=database.db_cluster_endpoint,
            description="RDS Aurora cluster endpoint",
        )

        TerraformOutput(
            self,
            "database_secret_arn",
            value=database.db_secret_arn,
            description="Database credentials secret ARN",
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=compute.ecs_cluster_name,
            description="ECS cluster name",
        )

        TerraformOutput(
            self,
            "ecs_service_name",
            value=compute.ecs_service_name,
            description="ECS service name",
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=networking.vpc_id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=monitoring.sns_topic_arn,
            description="SNS topic ARN for alerts",
        )
