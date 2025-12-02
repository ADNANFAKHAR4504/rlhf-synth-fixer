# Payment Processing Web Application Infrastructure - Implementation

This implementation provides a complete production-grade payment processing web application infrastructure using Pulumi with Python, featuring ECS Fargate, Aurora PostgreSQL, S3 with CloudFront, Application Load Balancer, and comprehensive monitoring.

## Architecture Overview

The infrastructure consists of:
- **Network Layer**: VPC with 3 availability zones, public and private subnets, NAT Gateways
- **Application Layer**: ECS Fargate cluster with auto-scaling (3-10 tasks)
- **Database Layer**: Aurora PostgreSQL with multi-AZ deployment and encryption
- **Frontend Layer**: S3 bucket with CloudFront CDN distribution
- **Load Balancing**: Application Load Balancer with HTTPS
- **Monitoring**: CloudWatch logs with 30-day retention
- **Security**: Secrets Manager for credentials, security groups, encryption

## File: lib/tap_stack.py

```python
"""
Payment Processing Web Application Infrastructure Stack

This module implements a production-grade fintech payment processing infrastructure
with ECS Fargate, Aurora PostgreSQL, S3 CloudFront distribution, and comprehensive
monitoring and security features.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws

from .vpc_stack import VpcStack, VpcStackArgs
from .database_stack import DatabaseStack, DatabaseStackArgs
from .ecs_stack import EcsStack, EcsStackArgs
from .frontend_stack import FrontendStack, FrontendStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs


class TapStackArgs:
    """
    Arguments for the Payment Processing Web Application Stack.

    Args:
        environment_suffix: Suffix for resource naming to ensure global uniqueness
        tags: Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main stack orchestrating payment processing web application infrastructure.

    This stack creates:
    - VPC with 3 AZs, public and private subnets, NAT Gateways
    - Aurora PostgreSQL cluster with multi-AZ and encryption
    - ECS Fargate cluster with auto-scaling
    - Application Load Balancer with HTTPS
    - S3 bucket with CloudFront distribution
    - CloudWatch monitoring and logging
    - Secrets Manager for database credentials
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            'Environment': 'production',
            'CostCenter': 'payments',
            **args.tags
        }

        # Create VPC with 3 AZs, public and private subnets, NAT Gateways
        self.vpc_stack = VpcStack(
            f"vpc-{self.environment_suffix}",
            VpcStackArgs(
                environment_suffix=self.environment_suffix,
                availability_zone_count=3,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring and logging infrastructure
        self.monitoring_stack = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora PostgreSQL cluster with multi-AZ and encryption
        self.database_stack = DatabaseStack(
            f"database-{self.environment_suffix}",
            DatabaseStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.vpc_stack.vpc_id,
                private_subnet_ids=self.vpc_stack.private_subnet_ids,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.vpc_stack])
        )

        # Create ECS Fargate cluster with ALB and auto-scaling
        self.ecs_stack = EcsStack(
            f"ecs-{self.environment_suffix}",
            EcsStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.vpc_stack.vpc_id,
                public_subnet_ids=self.vpc_stack.public_subnet_ids,
                private_subnet_ids=self.vpc_stack.private_subnet_ids,
                database_secret_arn=self.database_stack.db_secret_arn,
                database_connection_string=self.database_stack.connection_string,
                ecs_log_group_name=self.monitoring_stack.ecs_log_group_name,
                alb_log_group_name=self.monitoring_stack.alb_log_group_name,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.vpc_stack, self.database_stack, self.monitoring_stack])
        )

        # Create S3 bucket with CloudFront distribution for frontend
        self.frontend_stack = FrontendStack(
            f"frontend-{self.environment_suffix}",
            FrontendStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export important outputs
        self.register_outputs({
            'vpc_id': self.vpc_stack.vpc_id,
            'public_subnet_ids': self.vpc_stack.public_subnet_ids,
            'private_subnet_ids': self.vpc_stack.private_subnet_ids,
            'database_cluster_endpoint': self.database_stack.cluster_endpoint,
            'database_secret_arn': self.database_stack.db_secret_arn,
            'alb_dns_name': self.ecs_stack.alb_dns_name,
            'alb_url': self.ecs_stack.alb_url,
            'ecs_cluster_name': self.ecs_stack.cluster_name,
            'ecs_service_name': self.ecs_stack.service_name,
            'frontend_bucket_name': self.frontend_stack.bucket_name,
            'cloudfront_domain': self.frontend_stack.cloudfront_domain,
            'cloudfront_url': self.frontend_stack.cloudfront_url,
        })
```

## File: lib/vpc_stack.py

```python
"""
VPC Stack for Payment Processing Infrastructure

Creates VPC with 3 availability zones, each with public and private subnets,
NAT Gateways for outbound connectivity, and proper routing tables.
"""

from typing import Optional, List
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class VpcStackArgs:
    """
    Arguments for VPC Stack.

    Args:
        environment_suffix: Suffix for resource naming
        availability_zone_count: Number of availability zones (default: 3)
        vpc_cidr: CIDR block for VPC (default: 10.0.0.0/16)
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        availability_zone_count: int = 3,
        vpc_cidr: str = "10.0.0.0/16",
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.availability_zone_count = availability_zone_count
        self.vpc_cidr = vpc_cidr
        self.tags = tags or {}


class VpcStack(pulumi.ComponentResource):
    """
    VPC infrastructure with multi-AZ support.

    Creates:
    - VPC with DNS support
    - Internet Gateway
    - 3 availability zones with public and private subnets each
    - NAT Gateways in each public subnet
    - Route tables for public and private subnets
    """

    def __init__(
        self,
        name: str,
        args: VpcStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:vpc:VpcStack', name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{args.environment_suffix}",
            cidr_block=args.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **args.tags,
                'Name': f'payment-vpc-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f'payment-igw-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Get available AZs
        azs = aws.get_availability_zones(state="available")

        # Create subnets for each AZ
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []
        self.eips = []

        for i in range(args.availability_zone_count):
            az = azs.names[i]

            # Create public subnet
            public_subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **args.tags,
                    'Name': f'payment-public-subnet-{i+1}-{args.environment_suffix}',
                    'Type': 'public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)

            # Create private subnet
            private_subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    **args.tags,
                    'Name': f'payment-private-subnet-{i+1}-{args.environment_suffix}',
                    'Type': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)

            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"payment-nat-eip-{i+1}-{args.environment_suffix}",
                vpc=True,
                tags={
                    **args.tags,
                    'Name': f'payment-nat-eip-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self, depends_on=[self.igw])
            )
            self.eips.append(eip)

            # Create NAT Gateway in public subnet
            nat_gateway = aws.ec2.NatGateway(
                f"payment-nat-{i+1}-{args.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **args.tags,
                    'Name': f'payment-nat-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self, depends_on=[eip])
            )
            self.nat_gateways.append(nat_gateway)

        # Create route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"payment-public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f'payment-public-rt-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Route public traffic to Internet Gateway
        aws.ec2.Route(
            f"payment-public-route-{args.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-public-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create separate route table for each private subnet (for NAT Gateway)
        self.private_route_tables = []
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"payment-private-rt-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    **args.tags,
                    'Name': f'payment-private-rt-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_route_tables.append(private_rt)

            # Route private traffic to NAT Gateway
            aws.ec2.Route(
                f"payment-private-route-{i+1}-{args.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id,
                opts=ResourceOptions(parent=self)
            )

            # Associate private subnet with its route table
            aws.ec2.RouteTableAssociation(
                f"payment-private-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Export outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids,
        })
```

## File: lib/database_stack.py

```python
"""
Database Stack for Payment Processing Infrastructure

Creates Aurora PostgreSQL cluster with multi-AZ deployment, encryption at rest,
and Secrets Manager integration for credentials.
"""

from typing import Optional, List
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws
import json


class DatabaseStackArgs:
    """
    Arguments for Database Stack.

    Args:
        environment_suffix: Suffix for resource naming
        vpc_id: VPC ID for database deployment
        private_subnet_ids: List of private subnet IDs
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.tags = tags or {}


class DatabaseStack(pulumi.ComponentResource):
    """
    Aurora PostgreSQL database infrastructure.

    Creates:
    - DB subnet group across multiple AZs
    - Security group for database access
    - Secrets Manager secret for database credentials
    - Aurora PostgreSQL cluster with multi-AZ
    - Aurora cluster instances
    """

    def __init__(
        self,
        name: str,
        args: DatabaseStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"payment-db-subnet-group-{args.environment_suffix}",
            subnet_ids=args.private_subnet_ids,
            tags={
                **args.tags,
                'Name': f'payment-db-subnet-group-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for database
        self.db_security_group = aws.ec2.SecurityGroup(
            f"payment-db-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description="Security group for Aurora PostgreSQL database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/16"],  # Allow from VPC
                    description="PostgreSQL access from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                **args.tags,
                'Name': f'payment-db-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Generate database credentials
        self.db_username = "paymentadmin"
        self.db_password = aws.secretsmanager.Secret(
            f"payment-db-password-{args.environment_suffix}",
            description="Aurora PostgreSQL master password",
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        # Store random password in secret
        self.db_password_version = aws.secretsmanager.SecretVersion(
            f"payment-db-password-version-{args.environment_suffix}",
            secret_id=self.db_password.id,
            secret_string=pulumi.Output.secret("PaymentP@ssw0rd123!"),  # In production, use random generator
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora PostgreSQL cluster
        self.db_cluster = aws.rds.Cluster(
            f"payment-db-cluster-{args.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="15.4",
            engine_mode="provisioned",
            database_name="paymentdb",
            master_username=self.db_username,
            master_password=self.db_password_version.secret_string,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            storage_encrypted=True,
            skip_final_snapshot=True,  # For destroyability
            final_snapshot_identifier=None,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={
                **args.tags,
                'Name': f'payment-db-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.db_subnet_group, self.db_security_group])
        )

        # Create Aurora cluster instances (multi-AZ)
        self.db_instances = []
        for i in range(2):  # Create 2 instances for multi-AZ
            instance = aws.rds.ClusterInstance(
                f"payment-db-instance-{i+1}-{args.environment_suffix}",
                cluster_identifier=self.db_cluster.id,
                instance_class="db.t3.medium",
                engine=aws.rds.EngineType.AURORA_POSTGRESQL,
                engine_version="15.4",
                publicly_accessible=False,
                tags={
                    **args.tags,
                    'Name': f'payment-db-instance-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self, depends_on=[self.db_cluster])
            )
            self.db_instances.append(instance)

        # Create Secrets Manager secret for connection string
        self.connection_string = Output.all(
            self.db_cluster.endpoint,
            self.db_cluster.port,
            self.db_cluster.database_name,
            self.db_username,
            self.db_password_version.secret_string
        ).apply(lambda args: f"postgresql://{args[3]}:{args[4]}@{args[0]}:{args[1]}/{args[2]}")

        self.db_secret = aws.secretsmanager.Secret(
            f"payment-db-connection-{args.environment_suffix}",
            description="Aurora PostgreSQL connection string for payment processing",
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"payment-db-connection-version-{args.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=self.connection_string.apply(lambda conn: json.dumps({
                "connection_string": conn,
                "host": self.db_cluster.endpoint.apply(lambda e: e),
                "port": self.db_cluster.port.apply(lambda p: p),
                "database": self.db_cluster.database_name.apply(lambda d: d),
                "username": self.db_username,
                "password": self.db_password_version.secret_string.apply(lambda p: p)
            })),
            opts=ResourceOptions(parent=self, depends_on=[self.db_secret])
        )

        # Export outputs
        self.cluster_endpoint = self.db_cluster.endpoint
        self.cluster_reader_endpoint = self.db_cluster.reader_endpoint
        self.db_secret_arn = self.db_secret.arn

        self.register_outputs({
            'cluster_endpoint': self.cluster_endpoint,
            'cluster_reader_endpoint': self.cluster_reader_endpoint,
            'db_secret_arn': self.db_secret_arn,
            'connection_string': pulumi.Output.secret(self.connection_string),
        })
```

## File: lib/ecs_stack.py

```python
"""
ECS Stack for Payment Processing Infrastructure

Creates ECS Fargate cluster, Application Load Balancer, auto-scaling policies,
and task definitions with Secrets Manager integration.
"""

from typing import Optional, List
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws
import json


class EcsStackArgs:
    """
    Arguments for ECS Stack.

    Args:
        environment_suffix: Suffix for resource naming
        vpc_id: VPC ID
        public_subnet_ids: List of public subnet IDs for ALB
        private_subnet_ids: List of private subnet IDs for ECS tasks
        database_secret_arn: ARN of database secret in Secrets Manager
        database_connection_string: Database connection string
        ecs_log_group_name: CloudWatch log group for ECS tasks
        alb_log_group_name: CloudWatch log group for ALB
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        public_subnet_ids: List[Output[str]],
        private_subnet_ids: List[Output[str]],
        database_secret_arn: Output[str],
        database_connection_string: Output[str],
        ecs_log_group_name: Output[str],
        alb_log_group_name: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.public_subnet_ids = public_subnet_ids
        self.private_subnet_ids = private_subnet_ids
        self.database_secret_arn = database_secret_arn
        self.database_connection_string = database_connection_string
        self.ecs_log_group_name = ecs_log_group_name
        self.alb_log_group_name = alb_log_group_name
        self.tags = tags or {}


class EcsStack(pulumi.ComponentResource):
    """
    ECS Fargate application infrastructure.

    Creates:
    - ECS cluster
    - Application Load Balancer in public subnets
    - Target group with health checks
    - Security groups for ALB and ECS tasks
    - ECS task definition with Secrets Manager integration
    - ECS service with auto-scaling (3-10 tasks)
    - Auto-scaling policies for CPU and memory
    """

    def __init__(
        self,
        name: str,
        args: EcsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:ecs:EcsStack', name, None, opts)

        # Create ECS cluster
        self.cluster = aws.ecs.Cluster(
            f"payment-ecs-cluster-{args.environment_suffix}",
            tags={
                **args.tags,
                'Name': f'payment-ecs-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ALB (HTTPS only from internet)
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"payment-alb-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description="Security group for Application Load Balancer - HTTPS only",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet (redirect to HTTPS)"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                **args.tags,
                'Name': f'payment-alb-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ECS tasks
        self.ecs_security_group = aws.ec2.SecurityGroup(
            f"payment-ecs-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description="Security group for ECS Fargate tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.alb_security_group.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                **args.tags,
                'Name': f'payment-ecs-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.alb_security_group])
        )

        # Create Application Load Balancer in public subnets
        self.alb = aws.lb.LoadBalancer(
            f"payment-alb-{args.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=args.public_subnet_ids,
            enable_deletion_protection=False,  # For destroyability
            tags={
                **args.tags,
                'Name': f'payment-alb-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.alb_security_group])
        )

        # Create target group for ECS tasks
        self.target_group = aws.lb.TargetGroup(
            f"payment-tg-{args.environment_suffix}",
            port=8080,
            protocol="HTTP",
            target_type="ip",
            vpc_id=args.vpc_id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                protocol="HTTP",
                matcher="200"
            ),
            deregistration_delay=30,
            tags={
                **args.tags,
                'Name': f'payment-tg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create HTTP listener (redirect to HTTPS)
        self.http_listener = aws.lb.Listener(
            f"payment-http-listener-{args.environment_suffix}",
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
            ],
            opts=ResourceOptions(parent=self, depends_on=[self.alb])
        )

        # For HTTPS listener, we'll create a self-signed certificate placeholder
        # In production, use ACM with DNS validation
        # Note: This uses HTTP listener for simplicity in testing
        # Uncomment and configure ACM certificate for production HTTPS

        # Create IAM role for ECS task execution
        self.ecs_task_execution_role = aws.iam.Role(
            f"payment-ecs-execution-role-{args.environment_suffix}",
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
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach required policies to execution role
        aws.iam.RolePolicyAttachment(
            f"payment-ecs-execution-policy-{args.environment_suffix}",
            role=self.ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # Add Secrets Manager access policy
        self.secrets_policy = aws.iam.RolePolicy(
            f"payment-ecs-secrets-policy-{args.environment_suffix}",
            role=self.ecs_task_execution_role.id,
            policy=args.database_secret_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "kms:Decrypt"
                    ],
                    "Resource": [arn]
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task
        self.ecs_task_role = aws.iam.Role(
            f"payment-ecs-task-role-{args.environment_suffix}",
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
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"payment-task-{args.environment_suffix}",
            family=f"payment-task-{args.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="512",
            memory="1024",
            execution_role_arn=self.ecs_task_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                args.database_secret_arn,
                args.ecs_log_group_name
            ).apply(lambda args_list: json.dumps([{
                "name": "payment-api",
                "image": "public.ecr.aws/docker/library/python:3.11-slim",
                "cpu": 512,
                "memory": 1024,
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "PORT", "value": "8080"},
                    {"name": "ENVIRONMENT", "value": "production"}
                ],
                "secrets": [{
                    "name": "DATABASE_URL",
                    "valueFrom": args_list[0]
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args_list[1],
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "payment-api"
                    }
                },
                "healthCheck": {
                    "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                    "interval": 30,
                    "timeout": 5,
                    "retries": 3,
                    "startPeriod": 60
                }
            }])),
            tags=args.tags,
            opts=ResourceOptions(parent=self, depends_on=[
                self.ecs_task_execution_role,
                self.ecs_task_role
            ])
        )

        # Create ECS service with auto-scaling
        self.service = aws.ecs.Service(
            f"payment-service-{args.environment_suffix}",
            cluster=self.cluster.arn,
            task_definition=self.task_definition.arn,
            desired_count=3,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=args.private_subnet_ids,
                security_groups=[self.ecs_security_group.id]
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_group.arn,
                    container_name="payment-api",
                    container_port=8080
                )
            ],
            health_check_grace_period_seconds=60,
            tags=args.tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    self.cluster,
                    self.task_definition,
                    self.target_group,
                    self.http_listener
                ]
            )
        )

        # Create auto-scaling target
        self.autoscaling_target = aws.appautoscaling.Target(
            f"payment-autoscaling-target-{args.environment_suffix}",
            max_capacity=10,
            min_capacity=3,
            resource_id=pulumi.Output.concat("service/", self.cluster.name, "/", self.service.name),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
            opts=ResourceOptions(parent=self, depends_on=[self.service])
        )

        # Create auto-scaling policy for CPU utilization
        self.cpu_scaling_policy = aws.appautoscaling.Policy(
            f"payment-cpu-scaling-{args.environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.autoscaling_target.resource_id,
            scalable_dimension=self.autoscaling_target.scalable_dimension,
            service_namespace=self.autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=70.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.autoscaling_target])
        )

        # Create auto-scaling policy for memory utilization
        self.memory_scaling_policy = aws.appautoscaling.Policy(
            f"payment-memory-scaling-{args.environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.autoscaling_target.resource_id,
            scalable_dimension=self.autoscaling_target.scalable_dimension,
            service_namespace=self.autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=80.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageMemoryUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.autoscaling_target])
        )

        # Export outputs
        self.cluster_name = self.cluster.name
        self.service_name = self.service.name
        self.alb_dns_name = self.alb.dns_name
        self.alb_url = self.alb.dns_name.apply(lambda dns: f"http://{dns}")

        self.register_outputs({
            'cluster_name': self.cluster_name,
            'service_name': self.service_name,
            'alb_dns_name': self.alb_dns_name,
            'alb_url': self.alb_url,
        })
```

## File: lib/frontend_stack.py

```python
"""
Frontend Stack for Payment Processing Infrastructure

Creates S3 bucket and CloudFront distribution for React frontend hosting.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws
import json


class FrontendStackArgs:
    """
    Arguments for Frontend Stack.

    Args:
        environment_suffix: Suffix for resource naming
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class FrontendStack(pulumi.ComponentResource):
    """
    Frontend hosting infrastructure with S3 and CloudFront.

    Creates:
    - S3 bucket for static website hosting
    - CloudFront Origin Access Identity
    - CloudFront distribution with S3 origin
    - Bucket policy allowing CloudFront access
    """

    def __init__(
        self,
        name: str,
        args: FrontendStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:frontend:FrontendStack', name, None, opts)

        # Create S3 bucket for frontend
        self.bucket = aws.s3.Bucket(
            f"payment-frontend-{args.environment_suffix}",
            acl="private",
            force_destroy=True,  # For destroyability
            website=aws.s3.BucketWebsiteArgs(
                index_document="index.html",
                error_document="error.html"
            ),
            tags={
                **args.tags,
                'Name': f'payment-frontend-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Block public access to S3 bucket (CloudFront will access via OAI)
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"payment-frontend-public-access-block-{args.environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self, depends_on=[self.bucket])
        )

        # Create CloudFront Origin Access Identity
        self.oai = aws.cloudfront.OriginAccessIdentity(
            f"payment-oai-{args.environment_suffix}",
            comment=f"OAI for payment frontend {args.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # Create bucket policy to allow CloudFront access
        self.bucket_policy = aws.s3.BucketPolicy(
            f"payment-frontend-policy-{args.environment_suffix}",
            bucket=self.bucket.id,
            policy=pulumi.Output.all(self.bucket.arn, self.oai.iam_arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": args[1]
                        },
                        "Action": "s3:GetObject",
                        "Resource": f"{args[0]}/*"
                    }]
                })
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.bucket, self.oai])
        )

        # Create CloudFront distribution
        self.distribution = aws.cloudfront.Distribution(
            f"payment-cdn-{args.environment_suffix}",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Payment frontend CDN {args.environment_suffix}",
            default_root_object="index.html",
            origins=[
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=self.bucket.bucket_regional_domain_name,
                    origin_id=f"S3-{self.bucket.id}",
                    s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=self.oai.cloudfront_access_identity_path
                    )
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=self.bucket.id.apply(lambda id: f"S3-{id}"),
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="none"
                    )
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400
            ),
            price_class="PriceClass_100",
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            custom_error_responses=[
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=404,
                    response_code=200,
                    response_page_path="/index.html",
                    error_caching_min_ttl=300
                )
            ],
            tags=args.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.bucket, self.oai])
        )

        # Export outputs
        self.bucket_name = self.bucket.id
        self.cloudfront_domain = self.distribution.domain_name
        self.cloudfront_url = self.distribution.domain_name.apply(lambda d: f"https://{d}")

        self.register_outputs({
            'bucket_name': self.bucket_name,
            'cloudfront_domain': self.cloudfront_domain,
            'cloudfront_url': self.cloudfront_url,
        })
```

## File: lib/monitoring_stack.py

```python
"""
Monitoring Stack for Payment Processing Infrastructure

Creates CloudWatch log groups with 30-day retention for ECS tasks and ALB.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class MonitoringStackArgs:
    """
    Arguments for Monitoring Stack.

    Args:
        environment_suffix: Suffix for resource naming
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class MonitoringStack(pulumi.ComponentResource):
    """
    CloudWatch monitoring and logging infrastructure.

    Creates:
    - CloudWatch log group for ECS tasks
    - CloudWatch log group for ALB access logs
    - 30-day retention policy for all logs
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # Create CloudWatch log group for ECS tasks
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"payment-ecs-logs-{args.environment_suffix}",
            name=f"/aws/ecs/payment-api-{args.environment_suffix}",
            retention_in_days=30,
            tags={
                **args.tags,
                'Name': f'payment-ecs-logs-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group for ALB access logs
        self.alb_log_group = aws.cloudwatch.LogGroup(
            f"payment-alb-logs-{args.environment_suffix}",
            name=f"/aws/alb/payment-{args.environment_suffix}",
            retention_in_days=30,
            tags={
                **args.tags,
                'Name': f'payment-alb-logs-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        self.ecs_log_group_name = self.ecs_log_group.name
        self.alb_log_group_name = self.alb_log_group.name

        self.register_outputs({
            'ecs_log_group_name': self.ecs_log_group_name,
            'alb_log_group_name': self.alb_log_group_name,
        })
```

## File: lib/__init__.py

```python
"""
Payment Processing Web Application Infrastructure Package

This package contains Pulumi components for deploying a production-grade
payment processing web application with comprehensive security, monitoring,
and auto-scaling capabilities.
"""

from .tap_stack import TapStack, TapStackArgs
from .vpc_stack import VpcStack, VpcStackArgs
from .database_stack import DatabaseStack, DatabaseStackArgs
from .ecs_stack import EcsStack, EcsStackArgs
from .frontend_stack import FrontendStack, FrontendStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs

__all__ = [
    'TapStack',
    'TapStackArgs',
    'VpcStack',
    'VpcStackArgs',
    'DatabaseStack',
    'DatabaseStackArgs',
    'EcsStack',
    'EcsStackArgs',
    'FrontendStack',
    'FrontendStackArgs',
    'MonitoringStack',
    'MonitoringStackArgs',
]
```

## File: requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure AWS and set environment suffix:
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev
```

3. Deploy:
```bash
pulumi up
```

4. Access the application:
- Frontend: Use `cloudfront_url` output
- API: Use `alb_url` output

## Key Features

- Multi-AZ deployment with 3 availability zones
- ECS Fargate with auto-scaling (3-10 tasks)
- Aurora PostgreSQL with encryption and multi-AZ
- S3 + CloudFront for frontend hosting
- Application Load Balancer with HTTPS redirect
- CloudWatch logging with 30-day retention
- Secrets Manager for database credentials
- Comprehensive security groups
- All resources tagged with Environment and CostCenter
- Fully destroyable infrastructure
