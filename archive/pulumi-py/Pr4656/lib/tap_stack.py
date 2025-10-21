
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.

This implementation creates a blue-green ECS deployment infrastructure with:
- VPC and networking across 3 availability zones
- Application Load Balancer with weighted routing
- ECS Fargate cluster with blue/green services
- RDS Aurora PostgreSQL with encryption and backups
- CloudWatch Container Insights and monitoring
- IAM roles with least privilege access
- Auto-scaling based on CPU and memory
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions, Output, export
from pulumi_aws import s3  # example import for any AWS resource

# Import nested components
from .components.networking import NetworkingStack
from .components.security import SecurityStack
from .components.database import DatabaseStack
from .components.ecs import EcsStack
from .components.monitoring import MonitoringStack


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

    This component orchestrates the instantiation of a complete blue-green 
    ECS deployment infrastructure on AWS.

    The stack includes:
    - Networking: VPC, subnets, NAT gateways, and routing
    - Security: Security groups and IAM roles with least privilege
    - Database: RDS Aurora PostgreSQL with encryption
    - ECS: Fargate cluster with blue/green services and ALB
    - Monitoring: CloudWatch dashboards and alarms

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
        self.tags = args.tags or {}
        
        # Get configuration from Pulumi config
        config = pulumi.Config()
        
        # Project name from config or default
        project_name = config.get("project_name") or name
        environment = self.environment_suffix
        
        # Centralized configuration variables
        # Environment settings
        self.environment = environment
        
        # Container settings
        self.container_image = config.get("container_image") or "nginx:latest"
        self.container_port = config.get_int("container_port") or 80
        self.cpu = config.get_int("cpu") or 256
        self.memory = config.get_int("memory") or 512
        
        # Service settings
        self.desired_count = config.get_int("desired_count") or 2
        self.min_capacity = config.get_int("min_capacity") or 1
        self.max_capacity = config.get_int("max_capacity") or 10
        
        # Auto-scaling thresholds
        self.scale_target_cpu = config.get_int("scale_target_cpu") or 70
        self.scale_target_memory = config.get_int("scale_target_memory") or 80
        
        # Traffic weights (blue-green)
        self.blue_weight = config.get_int("blue_weight") or 100
        self.green_weight = config.get_int("green_weight") or 0
        
        # Database settings
        self.db_username = config.get("db_username") or "dbadmin"
        self.db_name = config.get("db_name") or "appdb"
        
        # Monitoring
        self.alert_email = config.get("alert_email")
        
        # Add common tags
        common_tags = {
            **self.tags,
            "Project": project_name,
            "Environment": environment,
            "ManagedBy": "Pulumi"
        }
        
        # Step 1: Create networking infrastructure
        pulumi.log.info("Creating networking infrastructure...")
        self.networking = NetworkingStack(
            f"{project_name}-{environment}"
        )
        
        # Step 2: Create security groups and IAM roles
        pulumi.log.info("Creating security resources...")
        self.security = SecurityStack(
            f"{project_name}-{environment}", 
            self.networking.vpc.id,
            self.container_port
        )
        
        # Step 3: Create RDS Aurora database
        pulumi.log.info("Creating RDS Aurora database...")
        self.database = DatabaseStack(
            f"{project_name}-{environment}",
            self.networking.db_subnet_group.name,
            self.security.rds_sg.id,
            self.db_username,
            self.db_name,
            self.environment
        )
        
        # Step 4: Create ECS infrastructure
        pulumi.log.info("Creating ECS cluster and services...")
        self.ecs = EcsStack(
            f"{project_name}-{environment}",
            self.networking.vpc.id,
            self.networking.public_subnets,
            self.networking.private_subnets,
            {
                "alb_sg": self.security.alb_sg,
                "ecs_sg": self.security.ecs_sg
            },
            {
                "execution_role": self.security.ecs_execution_role,
                "task_role": self.security.ecs_task_role,
                "autoscaling_role": self.security.autoscaling_role
            },
            self.database.endpoint,
            self.database.db_secret_arn,
            # ECS configuration
            self.container_image,
            self.container_port,
            self.cpu,
            self.memory,
            self.desired_count,
            self.environment,
            self.blue_weight,
            self.green_weight,
            self.min_capacity,
            self.max_capacity,
            self.scale_target_cpu,
            self.scale_target_memory
        )
        
        # Step 5: Setup monitoring and alerting
        pulumi.log.info("Setting up CloudWatch monitoring...")
        self.monitoring = MonitoringStack(
            f"{project_name}-{environment}",
            self.ecs.cluster.name,
            self.ecs.blue_service.name,
            self.ecs.green_service.name,
            self.ecs.alb.arn,
            self.environment,
            self.alert_email
        )
        
        # Store outputs as instance variables
        self.vpc_id = self.networking.vpc.id
        self.alb_dns = self.ecs.alb.dns_name
        # Handle None dns_name gracefully for testing with minimal mocks
        self.alb_url = self.ecs.alb.dns_name.apply(
            lambda dns: f"http://{dns}" if dns else "http://mock-alb-dns"
        )
        self.cluster_name = self.ecs.cluster.name
        self.blue_service_name = self.ecs.blue_service.name
        self.green_service_name = self.ecs.green_service.name
        self.blue_target_group_arn = self.ecs.blue_target_group.arn
        self.green_target_group_arn = self.ecs.green_target_group.arn
        self.database_endpoint = self.database.endpoint
        self.database_reader_endpoint = self.database.reader_endpoint
        self.sns_topic_arn = self.monitoring.sns_topic.arn
        
        # Export outputs using pulumi.export()
        pulumi.export("vpc_id", self.vpc_id)
        pulumi.export("alb_dns", self.alb_dns)
        pulumi.export("alb_url", self.alb_url)
        pulumi.export("cluster_name", self.cluster_name)
        pulumi.export("blue_service", self.blue_service_name)
        pulumi.export("green_service", self.green_service_name)
        pulumi.export("blue_target_group", self.blue_target_group_arn)
        pulumi.export("green_target_group", self.green_target_group_arn)
        pulumi.export("database_endpoint", self.database_endpoint)
        pulumi.export("database_reader_endpoint", self.database_reader_endpoint)
        pulumi.export("sns_topic", self.sns_topic_arn)
        pulumi.export("deployment_instructions", """
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
- CloudWatch Dashboard: Check the AWS Console for the generated dashboard
- Container Insights: Enabled on ECS cluster
- Alarms: CPU, Memory, Task count, ALB latency and errors
""")
        
        # Register outputs for component resource
        self.register_outputs({})