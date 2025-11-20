"""
Fraud Detection Stack ComponentResource
Encapsulates all infrastructure for a fraud detection environment
"""

from typing import Optional, Dict, Any, List
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output

from lib.networking import create_vpc_and_networking
from lib.compute import create_ecs_cluster_and_service
from lib.database import create_aurora_cluster, create_dynamodb_table
from lib.monitoring import create_cloudwatch_dashboard, create_sns_alerting
from lib.iam import create_iam_roles


class FraudDetectionStack(ComponentResource):
    """
    ComponentResource that encapsulates the complete fraud detection stack.
    Includes VPC, ECS, Aurora, DynamoDB, monitoring, and IAM resources.
    """

    def __init__(
        self,
        name: str,
        environment: str,
        region: str,
        environment_suffix: str,
        az_count: int = 3,
        owner: str = "fraud-detection-team",
        cost_center: str = "fraud-detection",
        ecs_cpu: int = 256,
        ecs_memory: int = 512,
        container_image: str = "nginx:latest",
        desired_count: int = 2,
        aurora_instance_class: str = "db.t4g.medium",
        aurora_instance_count: int = 1,
        enable_aurora_replica: bool = False,
        enable_global_table: bool = False,
        replica_regions: Optional[List[str]] = None,
        iam_mode: str = "read-only",
        alert_email: str = "devops@example.com",
        cpu_threshold: int = 80,
        error_rate_threshold: int = 5,
        prod_stack_ref: Optional[pulumi.StackReference] = None,
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:app:FraudDetectionStack", name, None, opts)

        # Store configuration
        self.environment = environment
        self.region = region
        self.environment_suffix = environment_suffix
        self.prod_stack_ref = prod_stack_ref

        # Common tags for all resources
        self.common_tags = {
            "Environment": environment,
            "Owner": owner,
            "CostCenter": cost_center,
            "ManagedBy": "Pulumi",
            "Project": "FraudDetection",
        }

        # 1. Create VPC and networking
        networking = create_vpc_and_networking(
            environment=environment,
            region=region,
            environment_suffix=environment_suffix,
            az_count=az_count,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        self.vpc_id = networking["vpc_id"]
        self.public_subnet_ids = networking["public_subnet_ids"]
        self.private_subnet_ids = networking["private_subnet_ids"]
        self.alb_security_group_id = networking["alb_security_group_id"]
        self.ecs_security_group_id = networking["ecs_security_group_id"]
        self.aurora_security_group_id = networking["aurora_security_group_id"]

        # 2. Create IAM roles
        iam_roles = create_iam_roles(
            environment=environment,
            environment_suffix=environment_suffix,
            iam_mode=iam_mode,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        self.ecs_task_role_arn = iam_roles["ecs_task_role_arn"]
        self.ecs_execution_role_arn = iam_roles["ecs_execution_role_arn"]

        # 3. Create Aurora cluster
        aurora = create_aurora_cluster(
            environment=environment,
            region=region,
            environment_suffix=environment_suffix,
            vpc_id=self.vpc_id,
            subnet_ids=self.private_subnet_ids,
            security_group_id=self.aurora_security_group_id,
            instance_class=aurora_instance_class,
            instance_count=aurora_instance_count,
            enable_replica=enable_aurora_replica,
            prod_stack_ref=prod_stack_ref,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        self.aurora_cluster_arn = aurora["cluster_arn"]
        self.aurora_endpoint = aurora["endpoint"]
        self.aurora_reader_endpoint = aurora["reader_endpoint"]

        # 4. Create DynamoDB table
        dynamodb = create_dynamodb_table(
            environment=environment,
            region=region,
            environment_suffix=environment_suffix,
            enable_global_table=enable_global_table,
            replica_regions=replica_regions or [],
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        self.dynamodb_table_name = dynamodb["table_name"]
        self.dynamodb_table_arn = dynamodb["table_arn"]

        # 5. Create ECS cluster and service
        compute = create_ecs_cluster_and_service(
            environment=environment,
            region=region,
            environment_suffix=environment_suffix,
            vpc_id=self.vpc_id,
            public_subnet_ids=self.public_subnet_ids,
            private_subnet_ids=self.private_subnet_ids,
            alb_security_group_id=self.alb_security_group_id,
            ecs_security_group_id=self.ecs_security_group_id,
            ecs_task_role_arn=self.ecs_task_role_arn,
            ecs_execution_role_arn=self.ecs_execution_role_arn,
            cpu=ecs_cpu,
            memory=ecs_memory,
            container_image=container_image,
            desired_count=desired_count,
            aurora_endpoint=self.aurora_endpoint,
            dynamodb_table_name=self.dynamodb_table_name,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        self.ecs_cluster_arn = compute["cluster_arn"]
        self.ecs_cluster_name = compute["cluster_name"]
        self.ecs_service_name = compute["service_name"]
        self.alb_dns_name = compute["alb_dns_name"]
        self.alb_arn = compute["alb_arn"]
        self.target_group_arn = compute["target_group_arn"]

        # 6. Create SNS alerting
        sns = create_sns_alerting(
            environment=environment,
            environment_suffix=environment_suffix,
            alert_email=alert_email,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        self.sns_topic_arn = sns["topic_arn"]

        # 7. Create CloudWatch dashboard
        dashboard = create_cloudwatch_dashboard(
            environment=environment,
            region=region,
            environment_suffix=environment_suffix,
            ecs_cluster_name=self.ecs_cluster_name,
            ecs_service_name=self.ecs_service_name,
            alb_arn=self.alb_arn,
            target_group_arn=self.target_group_arn,
            aurora_cluster_id=self.aurora_cluster_arn,
            dynamodb_table_name=self.dynamodb_table_name,
            sns_topic_arn=self.sns_topic_arn,
            cpu_threshold=cpu_threshold,
            error_rate_threshold=error_rate_threshold,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        self.dashboard_name = dashboard["dashboard_name"]

        self.register_outputs(
            {
                "vpc_id": self.vpc_id,
                "ecs_cluster_arn": self.ecs_cluster_arn,
                "ecs_cluster_name": self.ecs_cluster_name,
                "alb_dns_name": self.alb_dns_name,
                "aurora_endpoint": self.aurora_endpoint,
                "dynamodb_table_name": self.dynamodb_table_name,
                "sns_topic_arn": self.sns_topic_arn,
                "dashboard_name": self.dashboard_name,
            }
        )
