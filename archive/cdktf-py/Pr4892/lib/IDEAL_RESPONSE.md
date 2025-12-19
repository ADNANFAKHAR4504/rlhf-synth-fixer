# Working CDKTF Infrastructure Code

This contains the complete working CDKTF infrastructure code for healthcare LMS deployment with ECS Fargate, ElastiCache Redis, and multi-AZ configuration.

## tap.py

```python
#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
    }
}

app = App()

# Create the TapStack with the calculated properties
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()
```

## tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn, TerraformOutput
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
        environment_suffix = kwargs.get('environment_suffix', 'stage')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})
        
        # Allow callers (or CI) to disable creating an Internet-facing NAT + EIP
        # by passing `create_nat_gateway=False`. Default behavior: disable for
        # pull-request style environments (environment_suffix matching 'pr' + digits),
        # otherwise enabled.
        import re
        import time
        is_pr_environment = re.match(r'^pr\d+$', str(environment_suffix).lower())
        create_nat_gateway = kwargs.get(
            'create_nat_gateway', False if is_pr_environment else True
        )
        
        # Add unique suffix for PR environments to avoid resource conflicts in CI
        # Use timestamp-based suffix for PR environments, nothing for others
        unique_suffix = ""
        if is_pr_environment:
            # Add last 6 digits of current timestamp for uniqueness
            unique_suffix = f"-{int(time.time()) % 1000000}"
        
        # Create effective environment name with uniqueness for CI
        effective_env = f"{environment_suffix}{unique_suffix}"

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend (commented out for local deployment)
        # S3Backend(
        #     self,
        #     bucket=state_bucket,
        #     key=f"{environment_suffix}/{construct_id}.tfstate",
        #     region=state_bucket_region,
        #     encrypt=True,
        # )

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
                "Name": f"lms-vpc-{effective_env}"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "lms_igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"lms-igw-{effective_env}"
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
                "Name": f"lms-public-subnet-1-{effective_env}"
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
                "Name": f"lms-public-subnet-2-{effective_env}"
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
                "Name": f"lms-private-subnet-1-{effective_env}"
            }
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=Fn.element(azs.names, 1),
            tags={
                "Name": f"lms-private-subnet-2-{effective_env}"
            }
        )

        # Optionally create Elastic IP and NAT Gateway. In CI / PR runs we
        # default this off to avoid exhausting account EIP quotas.
        if create_nat_gateway:
            # Create Elastic IP for NAT Gateway
            eip_nat = Eip(
                self,
                "nat_eip",
                domain="vpc",
                tags={
                    "Name": f"lms-nat-eip-{effective_env}"
                }
            )

            # Create NAT Gateway in first public subnet
            nat_gateway = NatGateway(
                self,
                "lms_nat",
                allocation_id=eip_nat.id,
                subnet_id=public_subnet_1.id,
                tags={
                    "Name": f"lms-nat-{effective_env}"
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
                "Name": f"lms-public-rt-{effective_env}"
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

        # Create private route table - with or without NAT Gateway
        if create_nat_gateway:
            # Private subnets route through NAT Gateway for internet access
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
                    "Name": f"lms-private-rt-{effective_env}"
                }
            )
        else:
            # Private subnets without internet access (no NAT Gateway)
            private_rt = RouteTable(
                self,
                "private_rt",
                vpc_id=vpc.id,
                tags={
                    "Name": f"lms-private-rt-{effective_env}"
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
            name=f"lms-alb-sg-{effective_env}",
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
                "Name": f"lms-alb-sg-{effective_env}"
            }
        )

        # Create security group for ECS tasks
        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"lms-ecs-sg-{effective_env}",
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
                "Name": f"lms-ecs-sg-{effective_env}"
            }
        )

        # Create security group for Redis
        redis_sg = SecurityGroup(
            self,
            "redis_sg",
            name=f"lms-redis-sg-{effective_env}",
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
                "Name": f"lms-redis-sg-{effective_env}"
            }
        )

        # Create Secrets Manager secret for database credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_credentials",
            name=f"lms-db-credentials-{effective_env}",
            description="Database credentials for LMS application",
            recovery_window_in_days=0,
            tags={
                "Name": f"lms-db-credentials-{effective_env}"
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
        # NOTE: `cache_usage_limits` caused a provider inconsistency during CI
        # apply (block count changed). To avoid this provider bug in CI, we do
        # not set cache_usage_limits here. If needed, it can be enabled via a
        # runtime flag and validated against the provider version.
        redis_cache = ElasticacheServerlessCache(
            self,
            "lms_redis",
            engine="redis",
            name=f"lms-redis-{effective_env}",
            security_group_ids=[redis_sg.id],
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={
                "Name": f"lms-redis-{effective_env}"
            }
        )

        # Create Secrets Manager secret for Redis connection
        redis_secret = SecretsmanagerSecret(
            self,
            "redis_connection",
            name=f"lms-redis-connection-{effective_env}",
            description="Redis connection details for LMS application",
            recovery_window_in_days=0,
            tags={
                "Name": f"lms-redis-connection-{effective_env}"
            }
        )

        # Create secret version with Redis endpoint
        # Note: endpoint will be populated after deployment
        redis_secret_value = {
            "endpoint": "to-be-updated-after-deployment",
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
            name=f"/ecs/lms-{effective_env}",
            retention_in_days=7,
            tags={
                "Name": f"lms-ecs-logs-{effective_env}"
            }
        )

        # Create ECS Task Execution Role
        ecs_task_execution_role = IamRole(
            self,
            "ecs_task_execution_role",
            name=f"lms-ecs-task-execution-role-{effective_env}",
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
                "Name": f"lms-ecs-task-execution-role-{effective_env}"
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
            name=f"lms-ecs-task-role-{effective_env}",
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
                "Name": f"lms-ecs-task-role-{effective_env}"
            }
        )

        # Create ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            "lms_cluster",
            name=f"lms-cluster-{effective_env}",
            tags={
                "Name": f"lms-cluster-{effective_env}"
            }
        )

        # Create ECS Task Definition
        task_definition = EcsTaskDefinition(
            self,
            "lms_task",
            family=f"lms-task-{effective_env}",
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
                    "environment": [],
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
                "Name": f"lms-task-{effective_env}"
            }
        )

        # Create Application Load Balancer
        alb = Lb(
            self,
            "lms_alb",
            name=f"lms-alb-{effective_env}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            tags={
                "Name": f"lms-alb-{effective_env}"
            }
        )

        # Create Target Group
        target_group = LbTargetGroup(
            self,
            "lms_tg",
            name=f"lms-tg-{effective_env}",
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
                "Name": f"lms-tg-{effective_env}"
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
            name=f"lms-service-{effective_env}",
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
                "Name": f"lms-service-{effective_env}"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_cluster.name,
            description="ECS Cluster name"
        )

        TerraformOutput(
            self,
            "ecs_service_name",
            value=f"lms-service-{effective_env}",
            description="ECS Service name"
        )

        TerraformOutput(
            self,
            "redis_cache_name",
            value=redis_cache.name,
            description="ElastiCache Serverless Redis cache name"
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=db_secret.arn,
            description="Database credentials secret ARN"
        )

        TerraformOutput(
            self,
            "redis_secret_arn",
            value=redis_secret.arn,
            description="Redis connection secret ARN"
        )
```
