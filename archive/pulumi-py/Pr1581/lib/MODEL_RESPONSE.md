I'll design and implement a comprehensive CI/CD pipeline for deploying AWS infrastructure using Pulumi's Python SDK. This will be a production-ready solution with enterprise-level security and automation.

## Project Structure

```
pulumi-aws-cicd/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       ├── security-scan.yml
│       └── disaster-recovery.yml
├── infrastructure/
│   ├── __init__.py
│   ├── main.py
│   ├── components/
│   │   ├── __init__.py
│   │   ├── networking.py
│   │   ├── compute.py
│   │   ├── database.py
│   │   ├── storage.py
│   │   ├── monitoring.py
│   │   └── security.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── dev.yaml
│   │   ├── staging.yaml
│   │   └── prod.yaml
│   └── utils/
│       ├── __init__.py
│       ├── tags.py
│       └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_networking.py
│   │   ├── test_compute.py
│   │   └── test_database.py
│   └── integration/
│       ├── __init__.py
│       └── test_infrastructure.py
├── scripts/
│   ├── deploy.sh
│   ├── rollback.sh
│   └── disaster-recovery.sh
├── docs/
│   ├── deployment-runbook.md
│   ├── troubleshooting.md
│   └── architecture.md
├── Pulumi.yaml
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── .gitignore
└── README.md
```

## Core Infrastructure Components

### 1. Pulumi Configuration (`Pulumi.yaml`)

```yaml
name: microservices-infrastructure
runtime: python
description: Production-ready microservices infrastructure on AWS
template:
  config:
    aws:region:
      description: The AWS region to deploy to
      default: us-east-1
    environment:
      description: Environment name (dev, staging, prod)
      default: prod
    project-name:
      description: Project name for resource naming
      default: microservices-ci
    enable-blue-green:
      description: Enable blue-green deployment
      type: boolean
      default: true
    multi-az:
      description: Enable Multi-AZ deployment
      type: boolean
      default: true
```

### 2. Dependencies (`requirements.txt`)

```txt
pulumi>=3.90.0
pulumi-aws>=6.0.0
pulumi-awsx>=2.0.0
boto3>=1.28.0
pydantic>=2.0.0
PyYAML>=6.0
cryptography>=41.0.0
```

### 3. Development Dependencies (`requirements-dev.txt`)

```txt
pytest>=7.4.0
pytest-cov>=4.1.0
pytest-mock>=3.11.0
moto>=4.2.0
black>=23.7.0
flake8>=6.0.0
mypy>=1.5.0
bandit>=1.7.0
safety>=2.3.0
```

### 4. Utility Functions (`infrastructure/utils/tags.py`)

```python
"""Common tagging utilities for AWS resources."""
from typing import Dict, Any
import pulumi

def get_common_tags(environment: str, project: str, component: str = "") -> Dict[str, str]:
    """Generate common tags for all resources."""
    tags = {
        "Environment": environment,
        "Project": project,
        "Owner": "DevOps",
        "ManagedBy": "Pulumi",
        "CreatedAt": pulumi.get_stack(),
    }

    if component:
        tags["Component"] = component

    return tags

def merge_tags(base_tags: Dict[str, str], additional_tags: Dict[str, str]) -> Dict[str, str]:
    """Merge additional tags with base tags."""
    return {**base_tags, **additional_tags}
```

### 5. Networking Component (`infrastructure/components/networking.py`)

```python
"""Networking infrastructure components."""
import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any
from ..utils.tags import get_common_tags

class NetworkingStack:
    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.config = config
        self.tags = get_common_tags(
            environment=config["environment"],
            project=config["project_name"],
            component="networking"
        )

        self.vpc = self._create_vpc()
        self.internet_gateway = self._create_internet_gateway()
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()
        self.nat_gateways = self._create_nat_gateways()
        self.route_tables = self._create_route_tables()
        self.security_groups = self._create_security_groups()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC with DNS support."""
        return aws.ec2.Vpc(
            f"{self.name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"{self.name}-vpc"}
        )

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway."""
        igw = aws.ec2.InternetGateway(
            f"{self.name}-igw",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"{self.name}-igw"}
        )
        return igw

    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """Create public subnets across multiple AZs."""
        public_subnets = []
        availability_zones = self.config.get("availability_zones", ["a", "b"])

        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"{self.name}-public-subnet-{az}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=f"{self.config['region']}{az}",
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"{self.name}-public-subnet-{az}", "Type": "Public"}
            )
            public_subnets.append(subnet)

        return public_subnets

    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """Create private subnets across multiple AZs."""
        private_subnets = []
        availability_zones = self.config.get("availability_zones", ["a", "b"])

        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"{self.name}-private-subnet-{az}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"{self.config['region']}{az}",
                tags={**self.tags, "Name": f"{self.name}-private-subnet-{az}", "Type": "Private"}
            )
            private_subnets.append(subnet)

        return private_subnets

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """Create NAT Gateways for private subnet internet access."""
        nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{self.name}-nat-eip-{i}",
                domain="vpc",
                tags={**self.tags, "Name": f"{self.name}-nat-eip-{i}"}
            )

            # Create NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{self.name}-nat-gateway-{i}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**self.tags, "Name": f"{self.name}-nat-gateway-{i}"}
            )
            nat_gateways.append(nat_gw)

        return nat_gateways

    def _create_route_tables(self) -> Dict[str, aws.ec2.RouteTable]:
        """Create route tables for public and private subnets."""
        route_tables = {}

        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"{self.name}-public-rt",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"{self.name}-public-rt", "Type": "Public"}
        )

        # Route to Internet Gateway
        aws.ec2.Route(
            f"{self.name}-public-route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.internet_gateway.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.name}-public-rt-association-{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        route_tables["public"] = public_rt

        # Private route tables (one per AZ for high availability)
        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"{self.name}-private-rt-{i}",
                vpc_id=self.vpc.id,
                tags={**self.tags, "Name": f"{self.name}-private-rt-{i}", "Type": "Private"}
            )

            # Route to NAT Gateway
            aws.ec2.Route(
                f"{self.name}-private-route-{i}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )

            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"{self.name}-private-rt-association-{i}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id
            )

            route_tables[f"private-{i}"] = private_rt

        return route_tables

    def _create_security_groups(self) -> Dict[str, aws.ec2.SecurityGroup]:
        """Create security groups for different tiers."""
        security_groups = {}

        # ALB Security Group
        alb_sg = aws.ec2.SecurityGroup(
            f"{self.name}-alb-sg",
            name=f"{self.name}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"{self.name}-alb-sg"}
        )
        security_groups["alb"] = alb_sg

        # ECS Security Group
        ecs_sg = aws.ec2.SecurityGroup(
            f"{self.name}-ecs-sg",
            name=f"{self.name}-ecs-sg",
            description="Security group for ECS services",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[alb_sg.id]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[alb_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"{self.name}-ecs-sg"}
        )
        security_groups["ecs"] = ecs_sg

        # RDS Security Group
        rds_sg = aws.ec2.SecurityGroup(
            f"{self.name}-rds-sg",
            name=f"{self.name}-rds-sg",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[ecs_sg.id]
                )
            ],
            tags={**self.tags, "Name": f"{self.name}-rds-sg"}
        )
        security_groups["rds"] = rds_sg

        # ElastiCache Security Group
        elasticache_sg = aws.ec2.SecurityGroup(
            f"{self.name}-elasticache-sg",
            name=f"{self.name}-elasticache-sg",
            description="Security group for ElastiCache Redis",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[ecs_sg.id]
                )
            ],
            tags={**self.tags, "Name": f"{self.name}-elasticache-sg"}
        )
        security_groups["elasticache"] = elasticache_sg

        return security_groups
```

### 6. Compute Component (`infrastructure/components/compute.py`)

```python
"""Compute infrastructure components including ECS and ALB."""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any, List
from ..utils.tags import get_common_tags

class ComputeStack:
    def __init__(self, name: str, config: Dict[str, Any], networking_stack):
        self.name = name
        self.config = config
        self.networking = networking_stack
        self.tags = get_common_tags(
            environment=config["environment"],
            project=config["project_name"],
            component="compute"
        )

        self.ecs_cluster = self._create_ecs_cluster()
        self.alb = self._create_application_load_balancer()
        self.target_groups = self._create_target_groups()
        self.listeners = self._create_alb_listeners()
        self.ecs_task_role = self._create_ecs_task_role()
        self.ecs_execution_role = self._create_ecs_execution_role()
        self.task_definitions = self._create_task_definitions()
        self.services = self._create_ecs_services()
        self.auto_scaling = self._setup_auto_scaling()

    def _create_ecs_cluster(self) -> aws.ecs.Cluster:
        """Create ECS Fargate cluster."""
        return aws.ecs.Cluster(
            f"{self.name}-ecs-cluster",
            name=f"{self.name}-ecs-cluster",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags={**self.tags, "Name": f"{self.name}-ecs-cluster"}
        )

    def _create_application_load_balancer(self) -> aws.lb.LoadBalancer:
        """Create Application Load Balancer."""
        return aws.lb.LoadBalancer(
            f"{self.name}-alb",
            name=f"{self.name}-alb",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.networking.public_subnets],
            security_groups=[self.networking.security_groups["alb"].id],
            enable_deletion_protection=self.config.get("enable_deletion_protection", True),
            tags={**self.tags, "Name": f"{self.name}-alb"}
        )

    def _create_target_groups(self) -> Dict[str, aws.lb.TargetGroup]:
        """Create target groups for blue-green deployment."""
        target_groups = {}

        # Blue target group
        blue_tg = aws.lb.TargetGroup(
            f"{self.name}-blue-tg",
            name=f"{self.name}-blue-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.networking.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200",
                protocol="HTTP"
            ),
            tags={**self.tags, "Name": f"{self.name}-blue-tg", "Deployment": "blue"}
        )
        target_groups["blue"] = blue_tg

        # Green target group
        green_tg = aws.lb.TargetGroup(
            f"{self.name}-green-tg",
            name=f"{self.name}-green-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.networking.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200",
                protocol="HTTP"
            ),
            tags={**self.tags, "Name": f"{self.name}-green-tg", "Deployment": "green"}
        )
        target_groups["green"] = green_tg

        return target_groups

    def _create_alb_listeners(self) -> Dict[str, aws.lb.Listener]:
        """Create ALB listeners for HTTP and HTTPS."""
        listeners = {}

        # HTTP Listener (redirect to HTTPS)
        http_listener = aws.lb.Listener(
            f"{self.name}-http-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="redirect",
                    redirect=aws.lb.ListenerDefaultActionRedirectArgs(
                        port="443",
                        protocol="HTTPS",
                        status_code="HTTP_301"
                    )
                )
            ]
        )
        listeners["http"] = http_listener

        # HTTPS Listener (requires SSL certificate)
        if self.config.get("ssl_certificate_arn"):
            https_listener = aws.lb.Listener(
                f"{self.name}-https-listener",
                load_balancer_arn=self.alb.arn,
                port=443,
                protocol="HTTPS",
                ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
                certificate_arn=self.config["ssl_certificate_arn"],
                default_actions=[
                    aws.lb.ListenerDefaultActionArgs(
                        type="forward",
                        target_group_arn=self.target_groups["blue"].arn
                    )
                ]
            )
            listeners["https"] = https_listener

        return listeners

    def _create_ecs_task_role(self) -> aws.iam.Role:
        """Create IAM role for ECS tasks."""
        task_role = aws.iam.Role(
            f"{self.name}-ecs-task-role",
            name=f"{self.name}-ecs-task-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        }
                    }
                ]
            }""",
            tags={**self.tags, "Name": f"{self.name}-ecs-task-role"}
        )

        # Attach policies for application needs
        aws.iam.RolePolicyAttachment(
            f"{self.name}-ecs-task-policy-secrets",
            role=task_role.name,
            policy_arn="arn:aws:iam::aws:policy/SecretsManagerReadWrite"
        )

        aws.iam.RolePolicyAttachment(
            f"{self.name}-ecs-task-policy-s3",
            role=task_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
        )

        return task_role

    def _create_ecs_execution_role(self) -> aws.iam.Role:
        """Create IAM role for ECS task execution."""
        execution_role = aws.iam.Role(
            f"{self.name}-ecs-execution-role",
            name=f"{self.name}-ecs-execution-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        }
                    }
                ]
            }""",
            tags={**self.tags, "Name": f"{self.name}-ecs-execution-role"}
        )

        # Attach execution role policy
        aws.iam.RolePolicyAttachment(
            f"{self.name}-ecs-execution-policy",
            role=execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        return execution_role

    def _create_task_definitions(self) -> Dict[str, aws.ecs.TaskDefinition]:
        """Create ECS task definitions."""
        task_definitions = {}

        # Microservice task definition
        microservice_td = aws.ecs.TaskDefinition(
            f"{self.name}-microservice-td",
            family=f"{self.name}-microservice",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=self.ecs_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                ecr_repo_url=self.config.get("ecr_repository_url", "nginx:latest")
            ).apply(lambda args: f"""[
                {{
                    "name": "microservice",
                    "image": "{args['ecr_repo_url']}",
                    "portMappings": [
                        {{
                            "containerPort": 80,
                            "protocol": "tcp"
                        }}
                    ],
                    "essential": true,
                    "logConfiguration": {{
                        "logDriver": "awslogs",
                        "options": {{
                            "awslogs-group": "/ecs/{self.name}-microservice",
                            "awslogs-region": "{self.config['region']}",
                            "awslogs-stream-prefix": "ecs"
                        }}
                    }},
                    "environment": [
                        {{
                            "name": "ENVIRONMENT",
                            "value": "{self.config['environment']}"
                        }}
                    ],
                    "healthCheck": {{
                        "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
                        "interval": 30,
                        "timeout": 5,
                        "retries": 3
                    }}
                }}
            ]"""),
            tags={**self.tags, "Name": f"{self.name}-microservice-td"}
        )
        task_definitions["microservice"] = microservice_td

        return task_definitions

    def _create_ecs_services(self) -> Dict[str, aws.ecs.Service]:
        """Create ECS services."""
        services = {}

        # Create CloudWatch log group
        aws.cloudwatch.LogGroup(
            f"{self.name}-microservice-logs",
            name=f"/ecs/{self.name}-microservice",
            retention_in_days=30,
            tags={**self.tags, "Name": f"{self.name}-microservice-logs"}
        )

        # Blue service
        blue_service = aws.ecs.Service(
            f"{self.name}-blue-service",
            name=f"{self.name}-blue-service",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definitions["microservice"].arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.networking.private_subnets],
                security_groups=[self.networking.security_groups["ecs"].id],
                assign_public_ip=False
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_groups["blue"].arn,
                    container_name="microservice",
                    container_port=80
                )
            ],
            deployment_configuration=aws.ecs.ServiceDeploymentConfigurationArgs(
                maximum_percent=200,
                minimum_healthy_percent=50
            ),
            tags={**self.tags, "Name": f"{self.name}-blue-service", "Deployment": "blue"}
        )
        services["blue"] = blue_service

        return services

    def _setup_auto_scaling(self) -> Dict[str, Any]:
        """Setup auto scaling for ECS services."""
        auto_scaling = {}

        # Auto scaling target
        scaling_target = aws.appautoscaling.Target(
            f"{self.name}-ecs-scaling-target",
            max_capacity=10,
            min_capacity=2,
            resource_id=pulumi.Output.concat(
                "service/",
                self.ecs_cluster.name,
                "/",
                self.services["blue"].name
            ),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )
        auto_scaling["target"] = scaling_target

        # CPU scaling policy
        cpu_policy = aws.appautoscaling.Policy(
            f"{self.name}-ecs-cpu-scaling",
            name=f"{self.name}-ecs-cpu-scaling",
            policy_type="TargetTrackingScaling",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            service_namespace=scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=70.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_out_cooldown=300,
                scale_in_cooldown=300
            )
        )
        auto_scaling["cpu_policy"] = cpu_policy

        # Memory scaling policy
        memory_policy = aws.appautoscaling.Policy(
            f"{self.name}-ecs-memory-scaling",
            name=f"{self.name}-ecs-memory-scaling",
            policy_type="TargetTrackingScaling",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            service_namespace=scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=80.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageMemoryUtilization"
                ),
                scale_out_cooldown=300,
                scale_in_cooldown=300
            )
        )
        auto_scaling["memory_policy"] = memory_policy

        return auto_scaling
```

### 7. Database Component (`infrastructure/components/database.py`)

```python
"""Database infrastructure components including RDS and ElastiCache."""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any
from ..utils.tags import get_common_tags

class DatabaseStack:
    def __init__(self, name: str, config: Dict[str, Any], networking_stack):
        self.name = name
        self.config = config
        self.networking = networking_stack
        self.tags = get_common_tags(
            environment=config["environment"],
            project=config["project_name"],
            component="database"
        )

        self.db_subnet_group = self._create_db_subnet_group()
        self.elasticache_subnet_group = self._create_elasticache_subnet_group()
        self.rds_instance = self._create_rds_instance()
        self.elasticache_cluster = self._create_elasticache_cluster()
        self.database_secrets = self._create_database_secrets()

    def _create_db_subnet_group(self) -> aws.rds.SubnetGroup:
        """Create RDS subnet group."""
        return aws.rds.SubnetGroup(
            f"{self.name}-db-subnet-group",
            name
```
