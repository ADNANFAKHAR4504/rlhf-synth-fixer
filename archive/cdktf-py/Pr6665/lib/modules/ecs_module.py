"""ECS module for Fargate services with Application Load Balancer."""
from cdktf import TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition, EcsTaskDefinitionRuntimePlatform
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from typing import List
from .naming import NamingModule


class EcsModule(Construct):
    """ECS Fargate module with ALB integration."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        naming: NamingModule,
        vpc_id: str,
        public_subnet_ids: List[str],
        private_subnet_ids: List[str],
        task_cpu: str = "256",
        task_memory: str = "512",
        desired_count: int = 1
    ):
        super().__init__(scope, id)

        self.naming = naming

        # ECS Cluster
        self.cluster = EcsCluster(
            self,
            "cluster",
            name=naming.generate_simple_name("cluster"),
            tags={
                "Name": naming.generate_simple_name("cluster"),
                "Environment": naming.environment
            }
        )

        # CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            "log_group",
            name=f"/ecs/{naming.generate_unique_name('app')}",
            retention_in_days=7,
            tags={
                "Name": naming.generate_unique_name("ecs-logs"),
                "Environment": naming.environment
            }
        )

        # Task Execution Role
        task_exec_role = IamRole(
            self,
            "task_exec_role",
            name=naming.generate_unique_name("ecs-task-exec-role"),
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": naming.generate_unique_name("ecs-task-exec-role"),
                "Environment": naming.environment
            }
        )

        IamRolePolicyAttachment(
            self,
            "task_exec_policy",
            role=task_exec_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Task Role
        task_role = IamRole(
            self,
            "task_role",
            name=naming.generate_unique_name("ecs-task-role"),
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": naming.generate_unique_name("ecs-task-role"),
                "Environment": naming.environment
            }
        )

        # Task Definition
        self.task_definition = EcsTaskDefinition(
            self,
            "task_def",
            family=naming.generate_simple_name("app"),
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu=task_cpu,
            memory=task_memory,
            execution_role_arn=task_exec_role.arn,
            task_role_arn=task_role.arn,
            runtime_platform=EcsTaskDefinitionRuntimePlatform(
                operating_system_family="LINUX",
                cpu_architecture="X86_64"
            ),
            container_definitions=Fn.jsonencode([{
                "name": "app",
                "image": "nginx:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 80,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": log_group.name,
                        "awslogs-region": naming.region,
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }]),
            tags={
                "Name": naming.generate_simple_name("task-def"),
                "Environment": naming.environment
            }
        )

        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=naming.generate_simple_name("alb-sg"),
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from anywhere",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": naming.generate_simple_name("alb-sg"),
                "Environment": naming.environment
            }
        )

        # ECS Service Security Group
        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=naming.generate_simple_name("ecs-sg"),
            description="Security group for ECS tasks",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[alb_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": naming.generate_simple_name("ecs-sg"),
                "Environment": naming.environment
            }
        )

        # Application Load Balancer
        self.alb = Lb(
            self,
            "alb",
            name=naming.generate_unique_name("alb"),
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            tags={
                "Name": naming.generate_unique_name("alb"),
                "Environment": naming.environment
            }
        )

        # Target Group
        target_group = LbTargetGroup(
            self,
            "tg",
            name=naming.generate_unique_name("tg"),
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="ip",
            deregistration_delay="30",
            health_check={
                "enabled": True,
                "path": "/",
                "port": "traffic-port",
                "protocol": "HTTP",
                "healthy_threshold": 2,
                "unhealthy_threshold": 2,
                "timeout": 5,
                "interval": 30
            },
            tags={
                "Name": naming.generate_unique_name("tg"),
                "Environment": naming.environment
            }
        )

        # Listener
        LbListener(
            self,
            "listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ]
        )

        # ECS Service
        self.service = EcsService(
            self,
            "service",
            name=naming.generate_unique_name("service"),
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=desired_count,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=private_subnet_ids,
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=target_group.arn,
                    container_name="app",
                    container_port=80
                )
            ],
            tags={
                "Name": naming.generate_unique_name("service"),
                "Environment": naming.environment
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "cluster_name",
            value=self.cluster.name,
            description="ECS cluster name"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=self.alb.dns_name,
            description="ALB DNS name"
        )
