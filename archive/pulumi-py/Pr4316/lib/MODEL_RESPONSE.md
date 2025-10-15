# PCI-DSS Compliant Payment Processing Environment - Pulumi Python Implementation

This implementation creates a PCI-DSS compliant payment processing environment using Pulumi with Python in the us-east-1 region.

## File: lib/vpc_stack.py

```python
"""
VPC Stack - Network infrastructure for PCI-DSS compliant environment.

This module creates a VPC with public and private subnets across multiple
availability zones, VPC endpoints for S3 and DynamoDB to avoid NAT Gateway costs,
and VPC Flow Logs for audit compliance.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class VpcStackArgs:
    """
    Arguments for VPC Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        cidr_block: VPC CIDR block
        log_bucket_arn: ARN of S3 bucket for VPC Flow Logs
    """
    def __init__(
        self,
        environment_suffix: str,
        cidr_block: str = "10.0.0.0/16",
        log_bucket_arn: Optional[pulumi.Output] = None
    ):
        self.environment_suffix = environment_suffix
        self.cidr_block = cidr_block
        self.log_bucket_arn = log_bucket_arn


class VpcStack(pulumi.ComponentResource):
    """
    VPC Component Resource for payment processing environment.

    Creates isolated network infrastructure with:
    - VPC with DNS support enabled
    - 2 public and 2 private subnets across 2 AZs
    - Internet Gateway for public subnet connectivity
    - VPC Endpoints for S3 and DynamoDB (cost optimization)
    - VPC Flow Logs to S3 for PCI-DSS audit requirements
    """

    def __init__(
        self,
        name: str,
        args: VpcStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:network:VpcStack', name, None, opts)

        # PCI-DSS Requirement: Network segmentation for cardholder data environment
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{args.environment_suffix}",
            cidr_block=args.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Compliance": "PCI-DSS",
            },
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create private subnets for RDS and internal services
        # PCI-DSS Requirement: Isolate cardholder data in private network
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{i+1}-{args.environment_suffix}",
                    "Type": "private",
                    "Environment": args.environment_suffix,
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create public subnets for future load balancers or bastion hosts
        self.public_subnets: List[aws.ec2.Subnet] = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{args.environment_suffix}",
                    "Type": "public",
                    "Environment": args.environment_suffix,
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Internet Gateway for public subnet internet access
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={
                "Name": f"public-rt-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Route table for private subnets (no internet gateway)
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"private-rt-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # VPC Endpoint for S3 (cost optimization - avoid NAT Gateway)
        self.s3_endpoint = aws.ec2.VpcEndpoint(
            f"s3-endpoint-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.us-east-1.s3",
            route_table_ids=[self.private_route_table.id],
            tags={
                "Name": f"s3-endpoint-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # VPC Endpoint for DynamoDB (cost optimization)
        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"dynamodb-endpoint-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.us-east-1.dynamodb",
            route_table_ids=[self.private_route_table.id],
            tags={
                "Name": f"dynamodb-endpoint-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # PCI-DSS Requirement: Audit logging of network traffic
        # VPC Flow Logs to S3 for compliance monitoring
        if args.log_bucket_arn:
            self.flow_log = aws.ec2.FlowLog(
                f"vpc-flow-log-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                traffic_type="ALL",
                log_destination_type="s3",
                log_destination=args.log_bucket_arn,
                tags={
                    "Name": f"vpc-flow-log-{args.environment_suffix}",
                    "Environment": args.environment_suffix,
                    "Compliance": "PCI-DSS-Audit",
                },
                opts=ResourceOptions(parent=self)
            )

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "private_subnet_ids": [s.id for s in self.private_subnets],
            "public_subnet_ids": [s.id for s in self.public_subnets],
        })
```

## File: lib/monitoring_stack.py

```python
"""
Monitoring Stack - CloudWatch and S3 logging infrastructure.

This module creates CloudWatch log groups and S3 buckets for storing
audit logs required for PCI-DSS compliance.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class MonitoringStackArgs:
    """
    Arguments for Monitoring Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        log_retention_days: CloudWatch log retention in days
    """
    def __init__(
        self,
        environment_suffix: str,
        log_retention_days: int = 7
    ):
        self.environment_suffix = environment_suffix
        self.log_retention_days = log_retention_days


class MonitoringStack(pulumi.ComponentResource):
    """
    Monitoring Component Resource for logging and audit trails.

    Creates:
    - S3 bucket for VPC Flow Logs (encrypted, versioned)
    - CloudWatch log groups for ECS tasks
    - Lifecycle policies for log retention
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:monitoring:MonitoringStack', name, None, opts)

        # PCI-DSS Requirement: Encrypted storage for audit logs
        self.log_bucket = aws.s3.Bucket(
            f"payment-logs-{args.environment_suffix}",
            bucket=f"payment-logs-{args.environment_suffix}",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True,
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                ),
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=30,
                    ),
                )
            ],
            force_destroy=True,  # Allow cleanup in test environments
            tags={
                "Name": f"payment-logs-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Purpose": "audit-logs",
            },
            opts=ResourceOptions(parent=self)
        )

        # Block all public access to logs bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"log-bucket-public-access-block-{args.environment_suffix}",
            bucket=self.log_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group for ECS tasks
        # PCI-DSS Requirement: Application logging for security monitoring
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"ecs-payment-processor-{args.environment_suffix}",
            name=f"/ecs/payment-processor-{args.environment_suffix}",
            retention_in_days=args.log_retention_days,
            tags={
                "Name": f"ecs-payment-processor-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "payment-processor",
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "log_bucket_arn": self.log_bucket.arn,
            "log_bucket_name": self.log_bucket.bucket,
            "ecs_log_group_name": self.ecs_log_group.name,
        })
```

## File: lib/security_stack.py

```python
"""
Security Stack - Security groups and KMS encryption keys.

This module creates security groups for network access control and
KMS keys for encryption at rest, following PCI-DSS security requirements.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class SecurityStackArgs:
    """
    Arguments for Security Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        vpc_id: VPC ID where security groups will be created
    """
    def __init__(
        self,
        environment_suffix: str,
        vpc_id: pulumi.Output
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id


class SecurityStack(pulumi.ComponentResource):
    """
    Security Component Resource for access control and encryption.

    Creates:
    - KMS keys for RDS encryption with automatic rotation
    - Security group for ECS tasks
    - Security group for RDS database
    - Least privilege security rules
    """

    def __init__(
        self,
        name: str,
        args: SecurityStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:security:SecurityStack', name, None, opts)

        # PCI-DSS Requirement: Encryption key management with rotation
        self.rds_kms_key = aws.kms.Key(
            f"rds-kms-key-{args.environment_suffix}",
            description=f"KMS key for RDS encryption - {args.environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"rds-kms-key-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Purpose": "rds-encryption",
            },
            opts=ResourceOptions(parent=self)
        )

        self.rds_kms_key_alias = aws.kms.Alias(
            f"rds-kms-alias-{args.environment_suffix}",
            name=f"alias/rds-{args.environment_suffix}",
            target_key_id=self.rds_kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )

        # Security group for ECS tasks
        # PCI-DSS Requirement: Network segmentation and access control
        self.ecs_security_group = aws.ec2.SecurityGroup(
            f"ecs-sg-{args.environment_suffix}",
            name=f"ecs-sg-{args.environment_suffix}",
            description="Security group for ECS payment processor tasks",
            vpc_id=args.vpc_id,
            # Egress rules - allow outbound to RDS and AWS services
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic for AWS service communication",
                )
            ],
            tags={
                "Name": f"ecs-sg-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "ecs-tasks",
            },
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS
        # PCI-DSS Requirement: Database access restricted to application tier only
        self.rds_security_group = aws.ec2.SecurityGroup(
            f"rds-sg-{args.environment_suffix}",
            name=f"rds-sg-{args.environment_suffix}",
            description="Security group for RDS payment database",
            vpc_id=args.vpc_id,
            tags={
                "Name": f"rds-sg-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "rds",
            },
            opts=ResourceOptions(parent=self)
        )

        # Ingress rule for RDS - only allow traffic from ECS security group
        # PCI-DSS Requirement: Least privilege access to cardholder data
        self.rds_ingress_rule = aws.ec2.SecurityGroupRule(
            f"rds-ingress-from-ecs-{args.environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            security_group_id=self.rds_security_group.id,
            source_security_group_id=self.ecs_security_group.id,
            description="Allow PostgreSQL access from ECS tasks only",
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "rds_kms_key_id": self.rds_kms_key.key_id,
            "rds_kms_key_arn": self.rds_kms_key.arn,
            "ecs_security_group_id": self.ecs_security_group.id,
            "rds_security_group_id": self.rds_security_group.id,
        })
```

## File: lib/rds_stack.py

```python
"""
RDS Stack - Aurora Serverless PostgreSQL database.

This module creates an encrypted Aurora Serverless v2 PostgreSQL cluster
for storing payment transaction data with PCI-DSS compliant configuration.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class RdsStackArgs:
    """
    Arguments for RDS Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        subnet_ids: List of private subnet IDs for RDS
        security_group_id: Security group ID for RDS
        kms_key_arn: KMS key ARN for encryption
    """
    def __init__(
        self,
        environment_suffix: str,
        subnet_ids: List[pulumi.Output],
        security_group_id: pulumi.Output,
        kms_key_arn: pulumi.Output
    ):
        self.environment_suffix = environment_suffix
        self.subnet_ids = subnet_ids
        self.security_group_id = security_group_id
        self.kms_key_arn = kms_key_arn


class RdsStack(pulumi.ComponentResource):
    """
    RDS Component Resource for transaction database.

    Creates Aurora Serverless v2 PostgreSQL cluster with:
    - Encryption at rest using KMS
    - Automated backups
    - Private subnet placement
    - PCI-DSS compliant configuration
    """

    def __init__(
        self,
        name: str,
        args: RdsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:database:RdsStack', name, None, opts)

        # DB Subnet Group for RDS placement in private subnets
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"payment-db-subnet-group-{args.environment_suffix}",
            name=f"payment-db-subnet-group-{args.environment_suffix}",
            subnet_ids=args.subnet_ids,
            tags={
                "Name": f"payment-db-subnet-group-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # PCI-DSS Requirement: Encrypted storage for cardholder data
        # Aurora Serverless v2 for cost optimization and faster provisioning
        self.db_cluster = aws.rds.Cluster(
            f"payment-db-cluster-{args.environment_suffix}",
            cluster_identifier=f"payment-db-cluster-{args.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_mode="provisioned",  # Required for Serverless v2
            engine_version="15.5",
            database_name="paymentdb",
            master_username="dbadmin",
            master_password="ChangeMe123!",  # In production, use AWS Secrets Manager
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[args.security_group_id],
            # PCI-DSS Requirement: Encryption at rest
            storage_encrypted=True,
            kms_key_id=args.kms_key_arn,
            # Backup configuration for data protection
            backup_retention_period=1,  # Minimum for faster creation
            preferred_backup_window="03:00-04:00",
            # Disable deletion protection for test environments
            deletion_protection=False,
            skip_final_snapshot=True,
            # Serverless v2 scaling configuration
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=2.0,
            ),
            tags={
                "Name": f"payment-db-cluster-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Compliance": "PCI-DSS",
            },
            opts=ResourceOptions(parent=self)
        )

        # Aurora Serverless v2 instance
        self.db_instance = aws.rds.ClusterInstance(
            f"payment-db-instance-{args.environment_suffix}",
            identifier=f"payment-db-instance-{args.environment_suffix}",
            cluster_identifier=self.db_cluster.id,
            instance_class="db.serverless",
            engine=self.db_cluster.engine,
            engine_version=self.db_cluster.engine_version,
            tags={
                "Name": f"payment-db-instance-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self, depends_on=[self.db_cluster])
        )

        # Register outputs
        self.register_outputs({
            "db_cluster_endpoint": self.db_cluster.endpoint,
            "db_cluster_reader_endpoint": self.db_cluster.reader_endpoint,
            "db_cluster_arn": self.db_cluster.arn,
            "db_name": self.db_cluster.database_name,
        })
```

## File: lib/ecs_stack.py

```python
"""
ECS Stack - Container orchestration for payment processing.

This module creates an ECS cluster with Fargate tasks for running
payment processing workloads with appropriate IAM roles and logging.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json


class EcsStackArgs:
    """
    Arguments for ECS Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        log_group_name: CloudWatch log group name for container logs
        security_group_id: Security group ID for ECS tasks
        subnet_ids: List of private subnet IDs for ECS tasks
    """
    def __init__(
        self,
        environment_suffix: str,
        log_group_name: pulumi.Output,
        security_group_id: pulumi.Output,
        subnet_ids: list
    ):
        self.environment_suffix = environment_suffix
        self.log_group_name = log_group_name
        self.security_group_id = security_group_id
        self.subnet_ids = subnet_ids


class EcsStack(pulumi.ComponentResource):
    """
    ECS Component Resource for payment processing containers.

    Creates:
    - ECS cluster
    - IAM roles for task execution and task runtime
    - Task definition with CloudWatch logging
    - Fargate configuration for serverless containers
    """

    def __init__(
        self,
        name: str,
        args: EcsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:compute:EcsStack', name, None, opts)

        # ECS Cluster
        self.cluster = aws.ecs.Cluster(
            f"payment-processor-cluster-{args.environment_suffix}",
            name=f"payment-processor-cluster-{args.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled",
                )
            ],
            tags={
                "Name": f"payment-processor-cluster-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "payment-processing",
            },
            opts=ResourceOptions(parent=self)
        )

        # IAM role for ECS task execution (pulling images, writing logs)
        # PCI-DSS Requirement: Least privilege access for system components
        self.task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{args.environment_suffix}",
            name=f"ecs-task-execution-role-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-task-execution-role-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        self.task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-{args.environment_suffix}",
            role=self.task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # IAM role for ECS task (application runtime permissions)
        self.task_role = aws.iam.Role(
            f"ecs-task-role-{args.environment_suffix}",
            name=f"ecs-task-role-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-task-role-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Task definition for payment processor
        # PCI-DSS Requirement: Secure container configuration with logging
        self.task_definition = aws.ecs.TaskDefinition(
            f"payment-processor-task-{args.environment_suffix}",
            family=f"payment-processor-{args.environment_suffix}",
            cpu="256",
            memory="512",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=pulumi.Output.all(args.log_group_name).apply(
                lambda args: json.dumps([{
                    "name": "payment-processor",
                    "image": "nginx:latest",  # Placeholder - replace with actual payment processor image
                    "cpu": 256,
                    "memory": 512,
                    "essential": True,
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[0],
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "payment-processor"
                        }
                    },
                    "environment": [
                        {
                            "name": "ENVIRONMENT",
                            "value": args.environment_suffix
                        }
                    ]
                }])
            ),
            tags={
                "Name": f"payment-processor-task-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "cluster_id": self.cluster.id,
            "cluster_name": self.cluster.name,
            "task_definition_arn": self.task_definition.arn,
            "task_execution_role_arn": self.task_execution_role.arn,
            "task_role_arn": self.task_role.arn,
        })
```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions

# Import nested stacks for PCI-DSS payment processing environment
from .monitoring_stack import MonitoringStack, MonitoringStackArgs
from .vpc_stack import VpcStack, VpcStackArgs
from .security_stack import SecurityStack, SecurityStackArgs
from .rds_stack import RdsStack, RdsStackArgs
from .ecs_stack import EcsStack, EcsStackArgs


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

    This component orchestrates a PCI-DSS compliant payment processing environment with:
    - VPC with public and private subnets
    - Aurora Serverless PostgreSQL database (encrypted)
    - ECS Fargate cluster for payment processing
    - KMS encryption keys
    - Security groups with least privilege access
    - CloudWatch logging and S3 audit logs

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
        self.tags = args.tags

        # Step 1: Create monitoring infrastructure (needed for VPC Flow Logs)
        self.monitoring = MonitoringStack(
            "monitoring",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                log_retention_days=7
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 2: Create VPC and networking
        self.vpc = VpcStack(
            "vpc",
            VpcStackArgs(
                environment_suffix=self.environment_suffix,
                cidr_block="10.0.0.0/16",
                log_bucket_arn=self.monitoring.log_bucket.arn
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 3: Create security infrastructure (KMS keys, security groups)
        self.security = SecurityStack(
            "security",
            SecurityStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.vpc.vpc.id
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 4: Create RDS database
        self.rds = RdsStack(
            "rds",
            RdsStackArgs(
                environment_suffix=self.environment_suffix,
                subnet_ids=[s.id for s in self.vpc.private_subnets],
                security_group_id=self.security.rds_security_group.id,
                kms_key_arn=self.security.rds_kms_key.arn
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 5: Create ECS cluster and task definitions
        self.ecs = EcsStack(
            "ecs",
            EcsStackArgs(
                environment_suffix=self.environment_suffix,
                log_group_name=self.monitoring.ecs_log_group.name,
                security_group_id=self.security.ecs_security_group.id,
                subnet_ids=[s.id for s in self.vpc.private_subnets]
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export key infrastructure outputs
        self.register_outputs({
            "vpc_id": self.vpc.vpc.id,
            "rds_endpoint": self.rds.db_cluster.endpoint,
            "ecs_cluster_name": self.ecs.cluster.name,
            "log_bucket_name": self.monitoring.log_bucket.bucket,
        })
```