"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Get configuration
        config = pulumi.Config("blue-green-ecs")
        aws_config = pulumi.Config("aws")

        # Project name from config or default
        project_name = config.get("project_name") or "blue-green-ecs"
        environment = config.get("environment") or "dev"

        # Create tags for all resources
        common_tags = {
            "Project": project_name,
            "Environment": environment,
            "ManagedBy": "Pulumi"
        }

        # Step 1: Create networking infrastructure
        pulumi.log.info("Creating networking infrastructure...")
        from modules.networking import NetworkingStack
        networking = NetworkingStack(f"{project_name}-{environment}", config)

        # Step 2: Create security groups and IAM roles
        pulumi.log.info("Creating security resources...")
        from modules.security import SecurityStack
        security = SecurityStack(
            f"{project_name}-{environment}", 
            config, 
            networking.vpc.id
        )

        # Step 3: Create RDS Aurora database
        pulumi.log.info("Creating RDS Aurora database...")
        from modules.database import DatabaseStack
        database = DatabaseStack(
            f"{project_name}-{environment}",
            config,
            networking.db_subnet_group.name,
            security.rds_sg.id
        )

        # Step 4: Create ECS infrastructure
        pulumi.log.info("Creating ECS cluster and services...")
        from modules.ecs import EcsStack
        ecs = EcsStack(
            f"{project_name}-{environment}",
            config,
            networking.vpc.id,
            networking.private_subnets,
            {
                "alb_sg": security.alb_sg,
                "ecs_sg": security.ecs_sg
            },
            {
                "execution_role": security.ecs_execution_role,
                "task_role": security.ecs_task_role,
                "autoscaling_role": security.autoscaling_role
            },
            database.endpoint,
            database.db_secret_arn
        )

        # Step 5: Setup monitoring and alerting
        pulumi.log.info("Setting up CloudWatch monitoring...")
        from modules.monitoring import MonitoringStack
        monitoring = MonitoringStack(
            f"{project_name}-{environment}",
            config,
            ecs.cluster.name,
            ecs.blue_service.name,
            ecs.green_service.name,
            ecs.alb.arn
        )

        # Export important values
        self.vpc_id = networking.vpc.id
        self.alb_dns = ecs.alb.dns_name
        self.alb_url = pulumi.Output.concat("http://", ecs.alb.dns_name)
        self.cluster_name = ecs.cluster.name
        self.blue_service = ecs.blue_service.name
        self.green_service = ecs.green_service.name
        self.blue_target_group = ecs.blue_target_group.arn
        self.green_target_group = ecs.green_target_group.arn
        self.database_endpoint = database.endpoint
        self.database_reader_endpoint = database.reader_endpoint
        self.sns_topic = monitoring.sns_topic.arn
        self.deployment_instructions = """
Blue-Green Deployment Instructions:
====================================
1. Deploy new version to inactive environment (green if blue is active)
2. Update task definition with new container image
3. Verify green deployment health via target group health checks
4. Gradually shift traffic using weighted routing:
   - pulumi config set blue_weight 90 && pulumi config set green_weight 10
   - pulumi config set blue_weight 50 && pulumi config set green_weight 50
   - pulumi config set blue_weight 0 && pulumi config set green_weight 100
5. Monitor CloudWatch metrics and alarms during traffic shift
6. If issues detected, quickly rollback:
   - pulumi config set blue_weight 100 && pulumi config set green_weight 0
7. Once stable, the inactive environment becomes standby for next deployment

Traffic Control Commands:
========================
# All traffic to blue:
pulumi config set blue_weight 100 && pulumi config set green_weight 0 && pulumi up

# 50/50 traffic split:
pulumi config set blue_weight 50 && pulumi config set green_weight 50 && pulumi up

# All traffic to green:
pulumi config set blue_weight 0 && pulumi config set green_weight 100 && pulumi up

Monitoring:
==========
- CloudWatch Dashboard: Check the exported dashboard URL
- Container Insights: Enabled on ECS cluster
- Alarms: CPU, Memory, Task count, ALB latency and errors
"""

        # Register outputs if needed
        self.register_outputs({
            "vpc_id": self.vpc_id,
            "alb_dns": self.alb_dns,
            "alb_url": self.alb_url,
            "cluster_name": self.cluster_name,
            "blue_service": self.blue_service,
            "green_service": self.green_service,
            "blue_target_group": self.blue_target_group,
            "green_target_group": self.green_target_group,
            "database_endpoint": self.database_endpoint,
            "database_reader_endpoint": self.database_reader_endpoint,
            "sns_topic": self.sns_topic,
            "deployment_instructions": self.deployment_instructions
        })
