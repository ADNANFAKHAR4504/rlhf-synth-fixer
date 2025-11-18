"""
ECS Module - Creates ECS Fargate cluster with Application Load Balancer.
Supports environment-based container scaling and task definitions.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from typing import List
import json


class EcsModule(Construct):
    """
    ECS Fargate Module with Application Load Balancer.
    Scales container counts based on environment configuration.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        vpc_id: str,
        public_subnet_ids: List[str],
        private_subnet_ids: List[str],
        execution_role_arn: str,
        task_role_arn: str,
        container_count: int = 2,
        enable_alb_deletion_protection: bool = False,
        version: str = "v2",
        **kwargs
    ):
        """
        Initialize ECS module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
            vpc_id: VPC ID where ECS will be deployed
            public_subnet_ids: List of public subnet IDs for ALB
            private_subnet_ids: List of private subnet IDs for ECS tasks
            execution_role_arn: ARN of ECS execution role
            task_role_arn: ARN of ECS task role
            container_count: Number of containers to run (desired count)
            enable_alb_deletion_protection: Whether to enable ALB deletion protection
            version: Version suffix for resource naming (default: v2)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace
        self.container_count = container_count
        self.version = version

        # Create CloudWatch Log Group for ECS tasks
        self.log_group = CloudwatchLogGroup(
            self,
            f"ecs-log-group-{version}-{environment_suffix}",
            name=f"/ecs/{workspace}-app-{environment_suffix}-{version}",
            retention_in_days=7 if workspace != "prod" else 30,
            skip_destroy=True,  # Prevent errors if log group already exists
            tags={
                "Name": f"ecs-log-group-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create ECS Cluster
        self.cluster = EcsCluster(
            self,
            f"ecs-cluster-{version}-{environment_suffix}",
            name=f"ecs-cluster-{environment_suffix}-{version}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled" if workspace == "prod" else "disabled"
            }],
            tags={
                "Name": f"ecs-cluster-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create security group for ALB
        self.alb_security_group = SecurityGroup(
            self,
            f"alb-sg-{version}-{environment_suffix}",
            name=f"alb-sg-{environment_suffix}-{version}",
            description=f"Security group for ALB - {workspace}",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"alb-sg-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create security group for ECS tasks
        self.ecs_security_group = SecurityGroup(
            self,
            f"ecs-sg-{version}-{environment_suffix}",
            name=f"ecs-sg-{environment_suffix}-{version}",
            description=f"Security group for ECS tasks - {workspace}",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.alb_security_group.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"ecs-sg-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create Application Load Balancer
        self.alb = Lb(
            self,
            f"app-alb-{version}-{environment_suffix}",
            name=f"app-alb-{environment_suffix}-{version}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=enable_alb_deletion_protection,
            tags={
                "Name": f"app-alb-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create target group
        self.target_group = LbTargetGroup(
            self,
            f"app-tg-{version}-{environment_suffix}",
            name=f"app-tg-{environment_suffix}-{version}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "port": "8080",
                "protocol": "HTTP",
                "healthy_threshold": 2,
                "unhealthy_threshold": 3,
                "timeout": 5,
                "interval": 30,
                "matcher": "200"
            },
            deregistration_delay="30",
            tags={
                "Name": f"app-tg-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create ALB listener
        self.alb_listener = LbListener(
            self,
            f"alb-listener-{version}-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            tags={
                "Name": f"alb-listener-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create ECS Task Definition
        container_definitions = [
            {
                "name": f"app-container-{workspace}-{version}",
                "image": "nginx:latest",  # Placeholder image
                "cpu": 256,
                "memory": 512,
                "essential": True,
                "portMappings": [
                    {
                        "containerPort": 8080,
                        "hostPort": 8080,
                        "protocol": "tcp"
                    }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": self.log_group.name,
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {
                        "name": "ENVIRONMENT",
                        "value": workspace
                    },
                    {
                        "name": "APP_PORT",
                        "value": "8080"
                    }
                ]
            }
        ]

        self.task_definition = EcsTaskDefinition(
            self,
            f"app-task-def-{version}-{environment_suffix}",
            family=f"app-task-{environment_suffix}-{version}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=execution_role_arn,
            task_role_arn=task_role_arn,
            container_definitions=json.dumps(container_definitions),
            tags={
                "Name": f"app-task-def-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create ECS Service
        self.service = EcsService(
            self,
            f"app-service-{version}-{environment_suffix}",
            name=f"app-service-{environment_suffix}-{version}",
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=container_count,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=private_subnet_ids,
                security_groups=[self.ecs_security_group.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=self.target_group.arn,
                    container_name=f"app-container-{workspace}-{version}",
                    container_port=8080
                )
            ],
            depends_on=[self.alb_listener],
            tags={
                "Name": f"app-service-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

    def get_cluster_name(self) -> str:
        """Return ECS cluster name."""
        return self.cluster.name

    def get_cluster_arn(self) -> str:
        """Return ECS cluster ARN."""
        return self.cluster.arn

    def get_alb_dns_name(self) -> str:
        """Return ALB DNS name."""
        return self.alb.dns_name

    def get_alb_arn(self) -> str:
        """Return ALB ARN."""
        return self.alb.arn

    def get_ecs_security_group_id(self) -> str:
        """Return ECS security group ID."""
        return self.ecs_security_group.id
