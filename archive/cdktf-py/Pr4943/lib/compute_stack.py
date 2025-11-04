"""Compute infrastructure stack with ECS Fargate."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json


class ComputeStack(Construct):
    """Compute infrastructure with ECS Fargate."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        public_subnet_ids: list,
        kms_key_arn: str,
        db_endpoint: str,
        redis_endpoint: str,
        db_secret_arn: str
    ):
        """Initialize compute stack."""
        super().__init__(scope, construct_id)

        # Create ECS cluster
        self.ecs_cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"healthcare-cluster-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={
                "Name": f"healthcare-cluster-{environment_suffix}"
            }
        )

        # Create CloudWatch log group for container logs
        self.log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/healthcare-app-{environment_suffix}",
            retention_in_days=7,
            kms_key_id=kms_key_arn,
            tags={
                "Name": f"healthcare-ecs-logs-{environment_suffix}"
            }
        )

        # Create IAM role for ECS task execution
        self.task_execution_role = IamRole(
            self,
            "task_execution_role",
            name=f"healthcare-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"healthcare-task-execution-role-{environment_suffix}"
            }
        )

        # Attach managed policies to execution role
        IamRolePolicyAttachment(
            self,
            "task_execution_policy",
            role=self.task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create IAM role for ECS task
        self.task_role = IamRole(
            self,
            "task_role",
            name=f"healthcare-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            inline_policy=[{
                "name": "secrets-access",
                "policy": json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "kms:Decrypt"
                        ],
                        "Resource": [
                            db_secret_arn,
                            kms_key_arn
                        ]
                    }]
                })
            }],
            tags={
                "Name": f"healthcare-task-role-{environment_suffix}"
            }
        )

        # Create security group for ECS tasks
        self.ecs_security_group = SecurityGroup(
            self,
            "ecs_security_group",
            name=f"healthcare-ecs-sg-{environment_suffix}",
            description="Security group for healthcare ECS tasks",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow HTTP from VPC"
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
                "Name": f"healthcare-ecs-sg-{environment_suffix}"
            }
        )

        # Create security group for ALB
        self.alb_security_group = SecurityGroup(
            self,
            "alb_security_group",
            name=f"healthcare-alb-sg-{environment_suffix}",
            description="Security group for healthcare ALB",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere"
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
                "Name": f"healthcare-alb-sg-{environment_suffix}"
            }
        )

        # Create Application Load Balancer
        self.alb = Lb(
            self,
            "alb",
            name=f"healthcare-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=public_subnet_ids,
            tags={
                "Name": f"healthcare-alb-{environment_suffix}"
            }
        )

        # Create target group
        self.target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"healthcare-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "protocol": "HTTP",
                "matcher": "200",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            tags={
                "Name": f"healthcare-tg-{environment_suffix}"
            }
        )

        # Create ALB listener
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=self.target_group.arn
            )]
        )

        # Create ECS task definition with customer managed key for ephemeral storage
        self.task_definition = EcsTaskDefinition(
            self,
            "task_definition",
            family=f"healthcare-app-{environment_suffix}",
            requires_compatibilities=["FARGATE"],
            network_mode="awsvpc",
            cpu="256",
            memory="512",
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            ephemeral_storage={
                "size_in_gib": 21
            },
            container_definitions=json.dumps([{
                "name": "healthcare-app",
                "image": "nginx:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {
                        "name": "DB_ENDPOINT",
                        "value": db_endpoint
                    },
                    {
                        "name": "REDIS_ENDPOINT",
                        "value": redis_endpoint
                    }
                ],
                "secrets": [{
                    "name": "DB_CREDENTIALS",
                    "valueFrom": db_secret_arn
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": self.log_group.name,
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }]),
            runtime_platform={
                "operating_system_family": "LINUX",
                "cpu_architecture": "X86_64"
            },
            tags={
                "Name": f"healthcare-task-{environment_suffix}"
            }
        )

        # Create ECS service
        self.ecs_service = EcsService(
            self,
            "ecs_service",
            name=f"healthcare-service-{environment_suffix}",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="1.4.0",
            network_configuration={
                "subnets": private_subnet_ids,
                "security_groups": [self.ecs_security_group.id],
                "assign_public_ip": False
            },
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=self.target_group.arn,
                container_name="healthcare-app",
                container_port=8080
            )],
            tags={
                "Name": f"healthcare-service-{environment_suffix}",
                "HIPAA": "true"
            },
            depends_on=[self.alb]
        )

    @property
    def alb_dns_name(self):
        """Return ALB DNS name."""
        return self.alb.dns_name
