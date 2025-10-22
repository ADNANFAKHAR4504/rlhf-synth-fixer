# E-commerce Product Catalog Infrastructure - CDKTF Python Implementation

I'll help you create a production-ready infrastructure for your e-commerce product catalog service in Brazil using CDKTF with Python. This solution includes ECS Fargate, ElastiCache Serverless, Application Load Balancer, and all necessary networking components with security best practices.

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
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
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster, EcsClusterConfiguration
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition, EcsTaskDefinitionContainerDefinitions
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer, EcsServiceServiceConnectConfiguration
from cdktf_cdktf_provider_aws.elasticache_serverless_cache import ElasticacheServerlessCache, ElasticacheServerlessCacheConfig, ElasticacheServerlessCacheCacheUsageLimits, ElasticacheServerlessCacheCacheUsageLimitsDataStorage, ElasticacheServerlessCacheCacheUsageLimitsEcpuPerSecond
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.service_discovery_private_dns_namespace import ServiceDiscoveryPrivateDnsNamespace
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
        aws_region = kwargs.get('aws_region', 'sa-east-1')
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

        # Create VPC for the infrastructure
        vpc = Vpc(
            self,
            "catalog_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"catalog-vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "catalog_igw",
            vpc_id=vpc.id,
            tags={"Name": f"catalog-igw-{environment_suffix}"}
        )

        # Create public subnets in multiple AZs for high availability
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"catalog-public-subnet-1-{environment_suffix}"}
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"catalog-public-subnet-2-{environment_suffix}"}
        )

        # Create private subnets for ECS tasks and ElastiCache
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"catalog-private-subnet-1-{environment_suffix}"}
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"catalog-private-subnet-2-{environment_suffix}"}
        )

        # Create Elastic IPs for NAT Gateways
        eip_1 = Eip(
            self,
            "nat_eip_1",
            domain="vpc",
            tags={"Name": f"catalog-nat-eip-1-{environment_suffix}"}
        )

        eip_2 = Eip(
            self,
            "nat_eip_2",
            domain="vpc",
            tags={"Name": f"catalog-nat-eip-2-{environment_suffix}"}
        )

        # Create NAT Gateways for private subnet internet access
        nat_gateway_1 = NatGateway(
            self,
            "nat_gateway_1",
            allocation_id=eip_1.id,
            subnet_id=public_subnet_1.id,
            tags={"Name": f"catalog-nat-gw-1-{environment_suffix}"},
            depends_on=[igw]
        )

        nat_gateway_2 = NatGateway(
            self,
            "nat_gateway_2",
            allocation_id=eip_2.id,
            subnet_id=public_subnet_2.id,
            tags={"Name": f"catalog-nat-gw-2-{environment_suffix}"},
            depends_on=[igw]
        )

        # Create route table for public subnets
        public_route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"catalog-public-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_subnet_1_association",
            subnet_id=public_subnet_1.id,
            route_table_id=public_route_table.id
        )

        RouteTableAssociation(
            self,
            "public_subnet_2_association",
            subnet_id=public_subnet_2.id,
            route_table_id=public_route_table.id
        )

        # Create route tables for private subnets
        private_route_table_1 = RouteTable(
            self,
            "private_route_table_1",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway_1.id
            )],
            tags={"Name": f"catalog-private-rt-1-{environment_suffix}"}
        )

        private_route_table_2 = RouteTable(
            self,
            "private_route_table_2",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway_2.id
            )],
            tags={"Name": f"catalog-private-rt-2-{environment_suffix}"}
        )

        # Associate private subnets with private route tables
        RouteTableAssociation(
            self,
            "private_subnet_1_association",
            subnet_id=private_subnet_1.id,
            route_table_id=private_route_table_1.id
        )

        RouteTableAssociation(
            self,
            "private_subnet_2_association",
            subnet_id=private_subnet_2.id,
            route_table_id=private_route_table_2.id
        )

        # Create security group for ALB
        alb_security_group = SecurityGroup(
            self,
            "alb_security_group",
            name=f"catalog-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
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
            tags={"Name": f"catalog-alb-sg-{environment_suffix}"}
        )

        # Create security group for ECS tasks
        ecs_security_group = SecurityGroup(
            self,
            "ecs_security_group",
            name=f"catalog-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[alb_security_group.id],
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
            tags={"Name": f"catalog-ecs-sg-{environment_suffix}"}
        )

        # Create security group for ElastiCache
        elasticache_security_group = SecurityGroup(
            self,
            "elasticache_security_group",
            name=f"catalog-redis-sg-{environment_suffix}",
            description="Security group for ElastiCache Redis",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[ecs_security_group.id],
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
            tags={"Name": f"catalog-redis-sg-{environment_suffix}"}
        )

        # Create CloudWatch Log Group for ECS tasks
        log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/catalog-service-{environment_suffix}",
            retention_in_days=7,
            tags={"Name": f"catalog-ecs-logs-{environment_suffix}"}
        )

        # Create IAM role for ECS task execution
        ecs_task_execution_role = IamRole(
            self,
            "ecs_task_execution_role",
            name=f"catalog-ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags={"Name": f"catalog-ecs-execution-role-{environment_suffix}"}
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            "ecs_task_execution_role_policy",
            role=ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create IAM role for ECS task
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"catalog-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags={"Name": f"catalog-ecs-task-role-{environment_suffix}"}
        )

        # Create IAM policy for accessing Secrets Manager
        secrets_policy = IamPolicy(
            self,
            "secrets_policy",
            name=f"catalog-secrets-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": f"arn:aws:secretsmanager:{aws_region}:*:secret:catalog-*"
                }]
            })
        )

        # Attach secrets policy to task role
        IamRolePolicyAttachment(
            self,
            "task_role_secrets_policy",
            role=ecs_task_role.name,
            policy_arn=secrets_policy.arn
        )

        # Create Secrets Manager secret for sensitive configuration
        db_credentials_secret = SecretsmanagerSecret(
            self,
            "db_credentials_secret",
            name=f"catalog-db-credentials-{environment_suffix}",
            description="Database credentials for catalog service",
            kms_key_id="alias/aws/secretsmanager",
            tags={"Name": f"catalog-db-secret-{environment_suffix}"}
        )

        # Create secret version with placeholder credentials
        SecretsmanagerSecretVersion(
            self,
            "db_credentials_secret_version",
            secret_id=db_credentials_secret.id,
            secret_string=json.dumps({
                "username": "catalog_user",
                "password": "placeholder_password_change_me",
                "database": "catalog_db"
            })
        )

        # Create ElastiCache Serverless cache for Redis
        redis_cache = ElasticacheServerlessCache(
            self,
            "redis_cache",
            engine="redis",
            serverless_cache_name=f"catalog-cache-{environment_suffix}",
            description="ElastiCache Serverless for product catalog caching",
            major_engine_version="7",
            cache_usage_limits=ElasticacheServerlessCacheCacheUsageLimits(
                data_storage=ElasticacheServerlessCacheCacheUsageLimitsDataStorage(
                    maximum=10,
                    unit="GB"
                ),
                ecpu_per_second=ElasticacheServerlessCacheCacheUsageLimitsEcpuPerSecond(
                    maximum=5000
                )
            ),
            security_group_ids=[elasticache_security_group.id],
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={"Name": f"catalog-redis-cache-{environment_suffix}"}
        )

        # Create Application Load Balancer
        alb = Lb(
            self,
            "catalog_alb",
            name=f"catalog-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_security_group.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            enable_http2=True,
            tags={"Name": f"catalog-alb-{environment_suffix}"}
        )

        # Create target group for ECS service
        target_group = LbTargetGroup(
            self,
            "ecs_target_group",
            name=f"catalog-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=3
            ),
            tags={"Name": f"catalog-tg-{environment_suffix}"}
        )

        # Create ALB listener
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=target_group.arn
            )],
            tags={"Name": f"catalog-listener-{environment_suffix}"}
        )

        # Create ECS cluster with Service Connect
        ecs_cluster = EcsCluster(
            self,
            "catalog_cluster",
            name=f"catalog-cluster-{environment_suffix}",
            configuration=EcsClusterConfiguration(
                execute_command_configuration={
                    "logging": "DEFAULT"
                }
            ),
            service_connect_defaults={
                "namespace": f"catalog-{environment_suffix}"
            },
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={"Name": f"catalog-cluster-{environment_suffix}"}
        )

        # Set cluster capacity providers
        EcsClusterCapacityProviders(
            self,
            "cluster_capacity_providers",
            cluster_name=ecs_cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategy=[{
                "capacity_provider": "FARGATE",
                "weight": 1,
                "base": 1
            }]
        )

        # Create Service Discovery namespace for Service Connect
        service_namespace = ServiceDiscoveryPrivateDnsNamespace(
            self,
            "service_namespace",
            name=f"catalog-{environment_suffix}",
            description="Service discovery namespace for catalog services",
            vpc=vpc.id,
            tags={"Name": f"catalog-namespace-{environment_suffix}"}
        )

        # Create ECS task definition
        container_definitions = json.dumps([{
            "name": "catalog-service",
            "image": "nginx:latest",
            "cpu": 256,
            "memory": 512,
            "essential": True,
            "portMappings": [{
                "containerPort": 8080,
                "hostPort": 8080,
                "protocol": "tcp",
                "name": "catalog-service-port"
            }],
            "environment": [
                {
                    "name": "REDIS_ENDPOINT",
                    "value": redis_cache.endpoint[0]["address"]
                },
                {
                    "name": "AWS_REGION",
                    "value": aws_region
                }
            ],
            "secrets": [{
                "name": "DB_CREDENTIALS",
                "valueFrom": db_credentials_secret.arn
            }],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group.name,
                    "awslogs-region": aws_region,
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }])

        task_definition = EcsTaskDefinition(
            self,
            "catalog_task_definition",
            family=f"catalog-service-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=ecs_task_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=container_definitions,
            tags={"Name": f"catalog-task-{environment_suffix}"}
        )

        # Create ECS service with Service Connect
        EcsService(
            self,
            "catalog_service",
            name=f"catalog-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[private_subnet_1.id, private_subnet_2.id],
                security_groups=[ecs_security_group.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=target_group.arn,
                container_name="catalog-service",
                container_port=8080
            )],
            service_connect_configuration=EcsServiceServiceConnectConfiguration(
                enabled=True,
                namespace=service_namespace.arn,
                service=[{
                    "port_name": "catalog-service-port",
                    "discovery_name": "catalog-service",
                    "client_alias": [{
                        "port": 8080,
                        "dns_name": "catalog-service"
                    }]
                }]
            ),
            enable_execute_command=True,
            health_check_grace_period_seconds=60,
            tags={"Name": f"catalog-service-{environment_suffix}"},
            depends_on=[target_group]
        )

        # Stack outputs
        TerraformOutput(
            self,
            "VpcId",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "EcsClusterName",
            value=ecs_cluster.name,
            description="ECS Cluster Name"
        )

        TerraformOutput(
            self,
            "ElastiCacheEndpoint", 
            value="${aws_elasticache_serverless_cache.redis_cache.endpoint[0].address}",
            description="ElastiCache Redis Endpoint"
        )

        TerraformOutput(
            self,
            "AlbDns",
            value=alb.dns_name,
            description="Application Load Balancer DNS Name"
        )

        TerraformOutput(
            self,
            "SnsTopicArn",
            value=alarm_topic.arn,
            description="SNS Topic ARN"
        )

        TerraformOutput(
            self,
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment Suffix"
        )

        TerraformOutput(
            self,
            "AwsRegion",
            value=aws_region,
            description="AWS Region"
        )
```

## lib/__init__.py

```python
# Empty __init__.py file to make the lib directory a Python package
```

## Key Features Implemented

### 1. High Availability Architecture
- Multi-AZ deployment with subnets in different availability zones
- NAT Gateways in each AZ for redundancy
- ECS service running 2 tasks across multiple AZs
- Application Load Balancer distributing traffic

### 2. Security Best Practices
- VPC with public and private subnets
- Security groups with least privilege access
- ElastiCache Serverless with encryption (default enabled)
- Secrets Manager for sensitive configuration
- IAM roles with minimal permissions
- Private subnets for ECS tasks and Redis cache

### 3. Latest AWS Features (2025)
- ElastiCache Serverless for automatic scaling without infrastructure management
- ECS Service Connect for simplified service-to-service communication
- Container Insights enabled for monitoring

### 4. LGPD Compliance
- All data stored in sa-east-1 region
- Encryption at rest and in-transit for Redis cache
- Secrets Manager for credential management
- VPC isolation for data protection

### 5. Scalability
- Fargate for automatic scaling
- ElastiCache Serverless scales to match demand
- Application Load Balancer handles traffic distribution
- Support for FARGATE_SPOT for cost optimization

### 6. Monitoring and Operations
- CloudWatch Logs for ECS tasks
- Container Insights for cluster monitoring
- Health checks configured for target group
- ECS Exec enabled for troubleshooting

## Deployment Instructions

1. Install dependencies:
```bash
pipenv install
```

2. Initialize CDKTF:
```bash
cdktf get
```

3. Deploy the infrastructure:
```bash
pipenv run python tap.py
cdktf deploy
```

4. Update the container image in the task definition with your actual application image

5. Update the database credentials in Secrets Manager with actual values

## Notes

- The current task definition uses nginx as a placeholder. Replace with your actual catalog service image
- Update health check path if your application uses a different endpoint
- Consider adding Route53 for DNS management
- Consider adding ACM certificate for HTTPS support on ALB
- Adjust ElastiCache usage limits based on your actual requirements
- Review and adjust task CPU/memory based on application needs
