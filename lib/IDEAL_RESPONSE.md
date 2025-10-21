# CDKTF Python Infrastructure for Learning Management System

I'll help you create the CDKTF Python infrastructure for deploying a containerized Learning Management System with ECS Fargate, ElastiCache Redis, and Application Load Balancer.

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.elasticache_serverless_cache import ElasticacheServerlessCache
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


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

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC
        vpc = Vpc(
            self,
            "lms_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"lms-vpc-{environment_suffix}"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "lms_igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"lms-igw-{environment_suffix}"
            }
        )

        # Create public subnets in two AZs
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=Fn.element(azs.names, 0),
            map_public_ip_on_launch=True,
            tags={
                "Name": f"lms-public-subnet-1-{environment_suffix}"
            }
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=Fn.element(azs.names, 1),
            map_public_ip_on_launch=True,
            tags={
                "Name": f"lms-public-subnet-2-{environment_suffix}"
            }
        )

        # Create private subnets in two AZs
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=Fn.element(azs.names, 0),
            tags={
                "Name": f"lms-private-subnet-1-{environment_suffix}"
            }
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=Fn.element(azs.names, 1),
            tags={
                "Name": f"lms-private-subnet-2-{environment_suffix}"
            }
        )

        # Create Elastic IP for NAT Gateway
        eip_nat = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={
                "Name": f"lms-nat-eip-{environment_suffix}"
            }
        )

        # Create NAT Gateway in first public subnet
        nat_gateway = NatGateway(
            self,
            "lms_nat",
            allocation_id=eip_nat.id,
            subnet_id=public_subnet_1.id,
            tags={
                "Name": f"lms-nat-{environment_suffix}"
            }
        )

        # Create public route table
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"lms-public-rt-{environment_suffix}"
            }
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # Create private route table
        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id
                )
            ],
            tags={
                "Name": f"lms-private-rt-{environment_suffix}"
            }
        )

        # Associate private subnets with private route table
        RouteTableAssociation(
            self,
            "private_rt_assoc_1",
            subnet_id=private_subnet_1.id,
            route_table_id=private_rt.id
        )

        RouteTableAssociation(
            self,
            "private_rt_assoc_2",
            subnet_id=private_subnet_2.id,
            route_table_id=private_rt.id
        )

        # Create security group for ALB
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"lms-alb-sg-{environment_suffix}",
            description="Security group for LMS Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP traffic from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS traffic from internet"
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
                "Name": f"lms-alb-sg-{environment_suffix}"
            }
        )

        # Create security group for ECS tasks
        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"lms-ecs-sg-{environment_suffix}",
            description="Security group for LMS ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[alb_sg.id],
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
                "Name": f"lms-ecs-sg-{environment_suffix}"
            }
        )

        # Create security group for Redis
        redis_sg = SecurityGroup(
            self,
            "redis_sg",
            name=f"lms-redis-sg-{environment_suffix}",
            description="Security group for LMS Redis cluster",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow Redis traffic from ECS tasks"
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
                "Name": f"lms-redis-sg-{environment_suffix}"
            }
        )

        # Create Secrets Manager secret for database credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_credentials",
            name=f"lms-db-credentials-{environment_suffix}",
            description="Database credentials for LMS application",
            recovery_window_in_days=0,
            tags={
                "Name": f"lms-db-credentials-{environment_suffix}"
            }
        )

        # Create secret version with placeholder values
        db_secret_value = {
            "username": "lmsadmin",
            "password": "change-me-in-production",
            "host": "db.example.com",
            "port": 5432,
            "database": "lms"
        }

        SecretsmanagerSecretVersion(
            self,
            "db_credentials_version",
            secret_id=db_secret.id,
            secret_string=json.dumps(db_secret_value)
        )

        # Create ElastiCache Serverless for Redis
        redis_cache = ElasticacheServerlessCache(
            self,
            "lms_redis",
            engine="redis",
            name=f"lms-redis-{environment_suffix}",
            cache_usage_limits={
                "data_storage": {
                    "maximum": 10,
                    "unit": "GB"
                },
                "ecpu_per_second": {
                    "maximum": 5000
                }
            },
            security_group_ids=[redis_sg.id],
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={
                "Name": f"lms-redis-{environment_suffix}"
            }
        )

        # Create Secrets Manager secret for Redis connection
        redis_secret = SecretsmanagerSecret(
            self,
            "redis_connection",
            name=f"lms-redis-connection-{environment_suffix}",
            description="Redis connection details for LMS application",
            recovery_window_in_days=0,
            tags={
                "Name": f"lms-redis-connection-{environment_suffix}"
            }
        )

        # Create secret version with Redis endpoint
        redis_secret_value = {
            "endpoint": redis_cache.endpoint[0].address,
            "port": 6379
        }

        SecretsmanagerSecretVersion(
            self,
            "redis_connection_version",
            secret_id=redis_secret.id,
            secret_string=json.dumps(redis_secret_value)
        )

        # Create CloudWatch log group for ECS
        log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/lms-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"lms-ecs-logs-{environment_suffix}"
            }
        )

        # Create ECS Task Execution Role
        ecs_task_execution_role = IamRole(
            self,
            "ecs_task_execution_role",
            name=f"lms-ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"lms-ecs-task-execution-role-{environment_suffix}"
            }
        )

        # Attach ECS Task Execution policy
        IamRolePolicyAttachment(
            self,
            "ecs_task_execution_policy",
            role=ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create ECS Task Role with Secrets Manager access
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"lms-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            inline_policy=[
                {
                    "name": "secrets-access",
                    "policy": json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "secretsmanager:GetSecretValue"
                                ],
                                "Resource": [
                                    db_secret.arn,
                                    redis_secret.arn
                                ]
                            }
                        ]
                    })
                }
            ],
            tags={
                "Name": f"lms-ecs-task-role-{environment_suffix}"
            }
        )

        # Create ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            "lms_cluster",
            name=f"lms-cluster-{environment_suffix}",
            tags={
                "Name": f"lms-cluster-{environment_suffix}"
            }
        )

        # Create ECS Task Definition
        task_definition = EcsTaskDefinition(
            self,
            "lms_task",
            family=f"lms-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=ecs_task_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=json.dumps([
                {
                    "name": "lms-app",
                    "image": "nginx:latest",
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {
                            "name": "REDIS_ENDPOINT",
                            "value": redis_cache.endpoint[0].address
                        }
                    ],
                    "secrets": [
                        {
                            "name": "DB_CREDENTIALS",
                            "valueFrom": db_secret.arn
                        },
                        {
                            "name": "REDIS_CONNECTION",
                            "valueFrom": redis_secret.arn
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": log_group.name,
                            "awslogs-region": aws_region,
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }
            ]),
            tags={
                "Name": f"lms-task-{environment_suffix}"
            }
        )

        # Create Application Load Balancer
        alb = Lb(
            self,
            "lms_alb",
            name=f"lms-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            tags={
                "Name": f"lms-alb-{environment_suffix}"
            }
        )

        # Create Target Group
        target_group = LbTargetGroup(
            self,
            "lms_tg",
            name=f"lms-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            target_type="ip",
            vpc_id=vpc.id,
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "interval": 30,
                "matcher": "200",
                "path": "/",
                "port": "traffic-port",
                "protocol": "HTTP",
                "timeout": 5,
                "unhealthy_threshold": 2
            },
            tags={
                "Name": f"lms-tg-{environment_suffix}"
            }
        )

        # Create ALB Listener
        LbListener(
            self,
            "lms_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ]
        )

        # Create ECS Service
        EcsService(
            self,
            "lms_service",
            name=f"lms-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[private_subnet_1.id, private_subnet_2.id],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=target_group.arn,
                    container_name="lms-app",
                    container_port=8080
                )
            ],
            depends_on=[target_group],
            tags={
                "Name": f"lms-service-{environment_suffix}"
            }
        )
```

This complete CDKTF Python infrastructure includes:

1. VPC with public and private subnets across 2 availability zones
2. Internet Gateway and NAT Gateway for network connectivity
3. Security groups for ALB, ECS tasks, and Redis with appropriate rules
4. ElastiCache Serverless for Redis with Multi-AZ deployment and automatic failover
5. Application Load Balancer in public subnets
6. ECS Fargate cluster and service in private subnets
7. AWS Secrets Manager for storing database credentials and Redis connection details
8. IAM roles with proper permissions for ECS tasks
9. CloudWatch log group for container logging
10. Multi-AZ deployment with automatic failover capabilities

The infrastructure is configured for the ca-central-1 region and follows security best practices with resources deployed in private subnets where appropriate.
