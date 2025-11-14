"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingStack
from lib.ecs_cluster import EcsClusterStack
from lib.iam_roles import IamRolesStack
from lib.alb import AlbStack
from lib.ecs_services import EcsServicesStack
from lib.monitoring import MonitoringStack


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
        aws_region = kwargs.get('aws_region', 'us-east-1')
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

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create Networking Stack
        networking = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # Create Monitoring Stack (CloudWatch Log Groups)
        monitoring = MonitoringStack(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
        )

        # Create IAM Roles Stack
        iam_roles = IamRolesStack(
            self,
            "iam_roles",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            log_group_arns=monitoring.log_group_arns,
        )

        # Create ECS Cluster Stack
        ecs_cluster = EcsClusterStack(
            self,
            "ecs_cluster",
            environment_suffix=environment_suffix,
        )

        # Create Application Load Balancer Stack (HTTP only for simplicity)
        alb = AlbStack(
            self,
            "alb",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            public_subnet_ids=networking.public_subnet_ids,
        )

        # Create ECS Services Stack
        ecs_services = EcsServicesStack(
            self,
            "ecs_services",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            cluster_id=ecs_cluster.cluster_id,
            cluster_name=ecs_cluster.cluster_name,
            private_subnet_ids=networking.private_subnet_ids,
            task_execution_role_arn=iam_roles.task_execution_role_arn,
            task_role_arn=iam_roles.task_role_arn,
            alb_target_group_arn=alb.target_group_arn,
            alb_security_group_id=alb.alb_security_group_id,
            vpc_id=networking.vpc_id,
            log_group_names=monitoring.log_group_names,
        )

        # Outputs for integration tests
        TerraformOutput(
            self,
            "AlbDnsName",
            value=alb.alb.dns_name,
            description="ALB DNS name for HTTP access",
        )

        TerraformOutput(
            self,
            "AlbArn",
            value=alb.alb.arn,
            description="ALB ARN",
        )

        TerraformOutput(
            self,
            "TargetGroupArn",
            value=alb.target_group_arn,
            description="Target group ARN for payment-api",
        )

        TerraformOutput(
            self,
            "VpcId",
            value=networking.vpc_id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "ClusterName",
            value=ecs_cluster.cluster_name,
            description="ECS cluster name",
        )

        TerraformOutput(
            self,
            "ClusterArn",
            value=ecs_cluster.cluster_id,
            description="ECS cluster ARN",
        )

        TerraformOutput(
            self,
            "PaymentApiServiceName",
            value=f"payment-api-{environment_suffix}",
            description="Payment API service name",
        )

        TerraformOutput(
            self,
            "FraudDetectionServiceName",
            value=f"fraud-detection-{environment_suffix}",
            description="Fraud detection service name",
        )

        TerraformOutput(
            self,
            "NotificationServiceName",
            value=f"notification-service-{environment_suffix}",
            description="Notification service name",
        )

        TerraformOutput(
            self,
            "Region",
            value=aws_region,
            description="AWS region",
        )

        TerraformOutput(
            self,
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment suffix",
        )
