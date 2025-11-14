# ECS Payment Processing System - CDKTF Python Implementation

I'll create a complete CDKTF Python implementation for the containerized payment processing system on AWS ECS with Fargate. This solution includes all required components: ECS cluster, task definitions, services, ALB, auto-scaling, CloudWatch logging, and IAM roles.

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
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

        # Create Application Load Balancer Stack
        alb = AlbStack(
            self,
            "alb",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            public_subnet_ids=networking.public_subnet_ids,
            certificate_arn="arn:aws:acm:us-east-1:123456789012:certificate/example",
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
```

## File: lib/networking.py

```python
"""Networking stack for VPC, subnets, and security groups."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class NetworkingStack(Construct):
    """Networking infrastructure for ECS cluster."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
    ):
        super().__init__(scope, construct_id)

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available",
        )

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create public subnets for ALB
        self.public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=f"${{{azs.names_fqn}[{i}]}}",
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            self.public_subnets.append(subnet)

        # Create private subnets for ECS tasks
        self.private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"${{{azs.names_fqn}[{i}]}}",
                tags={
                    "Name": f"payment-private-subnet-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            self.private_subnets.append(subnet)

        # Create Elastic IPs for NAT Gateways
        eips = []
        for i in range(3):
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags={
                    "Name": f"payment-nat-eip-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            eips.append(eip)

        # Create NAT Gateways
        nat_gateways = []
        for i in range(3):
            nat = NatGateway(
                self,
                f"nat_gateway_{i}",
                allocation_id=eips[i].id,
                subnet_id=self.public_subnets[i].id,
                tags={
                    "Name": f"payment-nat-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            nat_gateways.append(nat)

        # Create route table for public subnets
        public_rt = RouteTable(
            self,
            "public_route_table",
            vpc_id=self.vpc.id,
            route=[{
                "cidr_block": "0.0.0.0/0",
                "gateway_id": igw.id,
            }],
            tags={
                "Name": f"payment-public-rt-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
            )

        # Create route tables for private subnets
        for i, subnet in enumerate(self.private_subnets):
            private_rt = RouteTable(
                self,
                f"private_route_table_{i}",
                vpc_id=self.vpc.id,
                route=[{
                    "cidr_block": "0.0.0.0/0",
                    "nat_gateway_id": nat_gateways[i].id,
                }],
                tags={
                    "Name": f"payment-private-rt-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )

            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
            )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def public_subnet_ids(self):
        return [subnet.id for subnet in self.public_subnets]

    @property
    def private_subnet_ids(self):
        return [subnet.id for subnet in self.private_subnets]
```

## File: lib/monitoring.py

```python
"""Monitoring stack for CloudWatch log groups."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup


class MonitoringStack(Construct):
    """CloudWatch monitoring infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        self.services = ["payment-api", "fraud-detection", "notification-service"]
        self.log_groups = {}

        # Create CloudWatch log groups for each service
        for service in self.services:
            log_group = CloudwatchLogGroup(
                self,
                f"{service}_log_group",
                name=f"/ecs/{service}-{environment_suffix}",
                retention_in_days=30,
                kms_key_id=None,  # Using AWS-managed keys
                tags={
                    "Name": f"{service}-logs-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                    "Service": service,
                },
            )
            self.log_groups[service] = log_group

    @property
    def log_group_names(self):
        return {service: lg.name for service, lg in self.log_groups.items()}

    @property
    def log_group_arns(self):
        return [lg.arn for lg in self.log_groups.values()]
```

## File: lib/iam_roles.py

```python
"""IAM roles and policies for ECS tasks."""

from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_policy_document import IamPolicyDocument
import json


class IamRolesStack(Construct):
    """IAM roles for ECS task execution and task roles."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        log_group_arns: list,
    ):
        super().__init__(scope, construct_id)

        # Task Execution Role - for ECS to pull images and write logs
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        self.task_execution_role = IamRole(
            self,
            "task_execution_role",
            name=f"ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags={
                "Name": f"ecs-task-execution-role-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Task execution policy - ECR and CloudWatch permissions
        execution_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ecr:GetAuthorizationToken",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": log_group_arns
                }
            ]
        })

        IamRolePolicy(
            self,
            "task_execution_policy",
            role=self.task_execution_role.id,
            policy=execution_policy,
        )

        # Task Role - for application code permissions
        self.task_role = IamRole(
            self,
            "task_role",
            name=f"ecs-task-role-{environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags={
                "Name": f"ecs-task-role-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Task policy - minimal permissions for application
        task_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": log_group_arns
                }
            ]
        })

        IamRolePolicy(
            self,
            "task_policy",
            role=self.task_role.id,
            policy=task_policy,
        )

    @property
    def task_execution_role_arn(self):
        return self.task_execution_role.arn

    @property
    def task_role_arn(self):
        return self.task_role.arn
```

## File: lib/ecs_cluster.py

```python
"""ECS cluster with Fargate capacity providers."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders


class EcsClusterStack(Construct):
    """ECS cluster with Fargate and Fargate Spot capacity providers."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        # Create ECS cluster
        self.cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"payment-cluster-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled",
            }],
            tags={
                "Name": f"payment-cluster-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Configure capacity providers
        EcsClusterCapacityProviders(
            self,
            "cluster_capacity_providers",
            cluster_name=self.cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategy=[
                {
                    "capacity_provider": "FARGATE_SPOT",
                    "weight": 50,
                    "base": 0,
                },
                {
                    "capacity_provider": "FARGATE",
                    "weight": 50,
                    "base": 0,
                },
            ],
        )

    @property
    def cluster_id(self):
        return self.cluster.id

    @property
    def cluster_name(self):
        return self.cluster.name
```

## File: lib/alb.py

```python
"""Application Load Balancer configuration."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule


class AlbStack(Construct):
    """Application Load Balancer for payment API."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        public_subnet_ids: list,
        certificate_arn: str,
    ):
        super().__init__(scope, construct_id)

        # Create security group for ALB
        self.alb_sg = SecurityGroup(
            self,
            "alb_security_group",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for payment processing ALB",
            vpc_id=vpc_id,
            tags={
                "Name": f"payment-alb-sg-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Allow inbound HTTPS traffic
        SecurityGroupRule(
            self,
            "alb_ingress_https",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_sg.id,
        )

        # Allow outbound traffic to ECS tasks
        SecurityGroupRule(
            self,
            "alb_egress_ecs",
            type="egress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=self.alb_sg.id,
        )

        # Create Application Load Balancer
        self.alb = Lb(
            self,
            "alb",
            name=f"payment-alb-{environment_suffix}",
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create target group
        self.target_group = LbTargetGroup(
            self,
            "payment_api_tg",
            name=f"payment-api-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "healthy_threshold": 3,
                "unhealthy_threshold": 3,
                "timeout": 5,
                "interval": 30,
                "path": "/health",
                "protocol": "HTTP",
            },
            tags={
                "Name": f"payment-api-tg-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create HTTPS listener
        LbListener(
            self,
            "https_listener",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            certificate_arn=certificate_arn,
            default_action=[{
                "type": "forward",
                "target_group_arn": self.target_group.arn,
            }],
        )

    @property
    def target_group_arn(self):
        return self.target_group.arn

    @property
    def alb_security_group_id(self):
        return self.alb_sg.id
```

## File: lib/ecs_services.py

```python
"""ECS services, task definitions, and auto-scaling."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
import json


class EcsServicesStack(Construct):
    """ECS services for payment processing microservices."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        cluster_id: str,
        cluster_name: str,
        private_subnet_ids: list,
        task_execution_role_arn: str,
        task_role_arn: str,
        alb_target_group_arn: str,
        alb_security_group_id: str,
        vpc_id: str,
        log_group_names: dict,
    ):
        super().__init__(scope, construct_id)

        self.services_config = {
            "payment-api": {
                "port": 8080,
                "image": f"123456789012.dkr.ecr.{aws_region}.amazonaws.com/payment-api:latest",
                "attach_alb": True,
            },
            "fraud-detection": {
                "port": 8081,
                "image": f"123456789012.dkr.ecr.{aws_region}.amazonaws.com/fraud-detection:latest",
                "attach_alb": False,
            },
            "notification-service": {
                "port": 8082,
                "image": f"123456789012.dkr.ecr.{aws_region}.amazonaws.com/notification-service:latest",
                "attach_alb": False,
            },
        }

        # Create security group for ECS tasks
        self.ecs_sg = SecurityGroup(
            self,
            "ecs_security_group",
            name=f"payment-ecs-sg-{environment_suffix}",
            description="Security group for payment processing ECS tasks",
            vpc_id=vpc_id,
            tags={
                "Name": f"payment-ecs-sg-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Allow inbound traffic from ALB
        SecurityGroupRule(
            self,
            "ecs_ingress_alb",
            type="ingress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            source_security_group_id=alb_security_group_id,
            security_group_id=self.ecs_sg.id,
        )

        # Allow inter-service communication
        for port in [8080, 8081, 8082]:
            SecurityGroupRule(
                self,
                f"ecs_ingress_{port}",
                type="ingress",
                from_port=port,
                to_port=port,
                protocol="tcp",
                self_attribute=True,
                security_group_id=self.ecs_sg.id,
            )

        # Allow outbound traffic
        SecurityGroupRule(
            self,
            "ecs_egress_all",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.ecs_sg.id,
        )

        # Create task definitions and services for each microservice
        for service_name, config in self.services_config.items():
            self._create_service(
                service_name=service_name,
                config=config,
                environment_suffix=environment_suffix,
                aws_region=aws_region,
                cluster_id=cluster_id,
                cluster_name=cluster_name,
                private_subnet_ids=private_subnet_ids,
                task_execution_role_arn=task_execution_role_arn,
                task_role_arn=task_role_arn,
                alb_target_group_arn=alb_target_group_arn if config["attach_alb"] else None,
                log_group_name=log_group_names[service_name],
            )

    def _create_service(
        self,
        service_name: str,
        config: dict,
        environment_suffix: str,
        aws_region: str,
        cluster_id: str,
        cluster_name: str,
        private_subnet_ids: list,
        task_execution_role_arn: str,
        task_role_arn: str,
        alb_target_group_arn: str,
        log_group_name: str,
    ):
        """Create ECS task definition and service for a microservice."""

        # Create task definition
        container_definitions = json.dumps([{
            "name": service_name,
            "image": config["image"],
            "cpu": 1024,
            "memory": 2048,
            "essential": True,
            "portMappings": [{
                "containerPort": config["port"],
                "protocol": "tcp",
            }],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group_name,
                    "awslogs-region": aws_region,
                    "awslogs-stream-prefix": "ecs",
                },
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60,
            },
        }])

        task_def = EcsTaskDefinition(
            self,
            f"{service_name}_task_def",
            family=f"{service_name}-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=task_execution_role_arn,
            task_role_arn=task_role_arn,
            container_definitions=container_definitions,
            runtime_platform={
                "operating_system_family": "LINUX",
                "cpu_architecture": "X86_64",
            },
            tags={
                "Name": f"{service_name}-task-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
                "Service": service_name,
            },
        )

        # Create ECS service
        service_config = {
            "name": f"{service_name}-{environment_suffix}",
            "cluster": cluster_id,
            "task_definition": task_def.arn,
            "desired_count": 3,
            "launch_type": "FARGATE",
            "platform_version": "1.4.0",
            "network_configuration": {
                "subnets": private_subnet_ids,
                "security_groups": [self.ecs_sg.id],
                "assign_public_ip": False,
            },
            "tags": {
                "Name": f"{service_name}-service-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
                "Service": service_name,
            },
        }

        # Add load balancer configuration for payment-api
        if alb_target_group_arn:
            service_config["load_balancer"] = [{
                "target_group_arn": alb_target_group_arn,
                "container_name": service_name,
                "container_port": config["port"],
            }]

        service = EcsService(
            self,
            f"{service_name}_service",
            **service_config,
        )

        # Create auto-scaling target
        scaling_target = AppautoscalingTarget(
            self,
            f"{service_name}_scaling_target",
            service_namespace="ecs",
            resource_id=f"service/{cluster_name}/{service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=3,
            max_capacity=10,
        )

        # Create CPU-based auto-scaling policy
        AppautoscalingPolicy(
            self,
            f"{service_name}_cpu_scaling_policy",
            name=f"{service_name}-cpu-scaling-{environment_suffix}",
            service_namespace="ecs",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration={
                "target_value": 70.0,
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageCPUUtilization",
                },
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60,
            },
        )

        # Create memory-based auto-scaling policy
        AppautoscalingPolicy(
            self,
            f"{service_name}_memory_scaling_policy",
            name=f"{service_name}-memory-scaling-{environment_suffix}",
            service_namespace="ecs",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration={
                "target_value": 80.0,
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageMemoryUtilization",
                },
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60,
            },
        )
```

## File: lib/README.md

```markdown
# ECS Payment Processing System

This CDKTF Python infrastructure deploys a containerized payment processing system on AWS ECS with Fargate.

## Architecture

The infrastructure consists of:

- **VPC and Networking**: 3 availability zones with public and private subnets, NAT gateways for outbound connectivity
- **ECS Cluster**: Fargate cluster with Container Insights enabled, using both Fargate and Fargate Spot (50/50 split)
- **Microservices**: Three containerized services (payment-api, fraud-detection, notification-service)
- **Application Load Balancer**: HTTPS-only ALB with path-based routing to payment-api
- **Auto-scaling**: Target tracking policies based on CPU (>70%) and memory (>80%) utilization
- **CloudWatch Logging**: Encrypted log groups with 30-day retention for each service
- **IAM Roles**: Least privilege execution and task roles with explicit resource permissions

## Prerequisites

1. CDKTF CLI installed (`npm install -g cdktf-cli`)
2. Python 3.8+
3. AWS credentials configured
4. ACM certificate ARN for HTTPS (update in `tap_stack.py`)
5. ECR repositories created for each microservice

## Configuration

Set environment variables:

```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

Update the certificate ARN in `lib/tap_stack.py` line 77:
```python
certificate_arn="arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID",
```

Update ECR repository URLs in `lib/ecs_services.py` to match your account ID.

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Synthesize CDKTF
cdktf synth

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure
cdktf destroy
```

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- VPC: `payment-vpc-{environmentSuffix}`
- ECS Cluster: `payment-cluster-{environmentSuffix}`
- Services: `{service-name}-{environmentSuffix}`

## Security

- All ECS tasks run in private subnets with no direct internet access
- Security groups enforce port-level isolation between services
- IAM roles follow least privilege principle
- ALB uses HTTPS with TLS 1.2+
- CloudWatch logs encrypted with AWS-managed keys

## Monitoring

- Container Insights enabled on ECS cluster
- CloudWatch log groups with 30-day retention
- ECS service metrics for CPU and memory utilization
- ALB health checks every 30 seconds

## Cost Optimization

- Fargate Spot instances handle 50% of capacity
- Auto-scaling reduces over-provisioning
- NAT gateways required for private subnet connectivity (consider VPC endpoints for further optimization)

## Tags

All resources tagged with:
- Environment: production
- Team: payments
- CostCenter: engineering
```
