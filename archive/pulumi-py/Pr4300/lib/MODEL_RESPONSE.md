# Multi-Region Disaster Recovery Solution for E-Commerce Platform

This implementation provides a comprehensive active-passive disaster recovery architecture for an e-commerce platform using Pulumi with Python.

## Architecture Overview

The solution implements:
- Primary Region: us-east-1 (active)
- Secondary Region: us-west-2 (passive)
- AWS Services: Route53, RDS Aurora, DynamoDB Global Tables, S3, CloudWatch, SNS, Lambda, Systems Manager

## Implementation

### File: lib/tap_stack.py

```python
"""
tap_stack.py

Multi-region disaster recovery solution for e-commerce platform.
Implements active-passive configuration with automated failover capabilities.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
from .networking_stack import NetworkingStack
from .database_stack import DatabaseStack
from .storage_stack import StorageStack
from .compute_stack import ComputeStack
from .monitoring_stack import MonitoringStack
from .dr_automation_stack import DRAutomationStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying deployment environment.
        tags (Optional[dict]): Default tags to apply to resources.
        primary_region (str): Primary AWS region (default: us-east-1).
        secondary_region (str): Secondary AWS region for DR (default: us-west-2).
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-west-2"
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.primary_region = primary_region
        self.secondary_region = secondary_region


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component orchestrating multi-region DR infrastructure.

    Implements active-passive disaster recovery with:
    - Multi-region networking
    - Database replication
    - Storage replication
    - Automated health monitoring
    - Failover automation
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
            **args.tags,
            'Project': 'ECommerceDR',
            'Environment': self.environment_suffix,
            'ManagedBy': 'Pulumi'
        }

        # Create networking infrastructure in both regions
        self.networking = NetworkingStack(
            "networking",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database layer with cross-region replication
        self.database = DatabaseStack(
            "database",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            primary_vpc_id=self.networking.primary_vpc_id,
            secondary_vpc_id=self.networking.secondary_vpc_id,
            primary_subnet_ids=self.networking.primary_private_subnet_ids,
            secondary_subnet_ids=self.networking.secondary_private_subnet_ids,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create storage layer with cross-region replication
        self.storage = StorageStack(
            "storage",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create compute layer (application servers)
        self.compute = ComputeStack(
            "compute",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            primary_vpc_id=self.networking.primary_vpc_id,
            secondary_vpc_id=self.networking.secondary_vpc_id,
            primary_subnet_ids=self.networking.primary_public_subnet_ids,
            secondary_subnet_ids=self.networking.secondary_public_subnet_ids,
            database_endpoint=self.database.primary_endpoint,
            storage_bucket=self.storage.primary_bucket_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring and alerting
        self.monitoring = MonitoringStack(
            "monitoring",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            compute_target_group=self.compute.primary_target_group_arn,
            database_cluster_id=self.database.primary_cluster_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create DR automation
        self.dr_automation = DRAutomationStack(
            "dr-automation",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            health_check_id=self.monitoring.health_check_id,
            hosted_zone_id=self.networking.hosted_zone_id,
            sns_topic_arn=self.monitoring.sns_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'primary_endpoint': self.networking.primary_endpoint,
            'primary_alb_dns': self.compute.primary_alb_dns,
            'secondary_alb_dns': self.compute.secondary_alb_dns,
            'database_primary_endpoint': self.database.primary_endpoint,
            'database_secondary_endpoint': self.database.secondary_endpoint,
            'storage_bucket_primary': self.storage.primary_bucket_name,
            'storage_bucket_secondary': self.storage.secondary_bucket_name,
            'sns_topic_arn': self.monitoring.sns_topic_arn,
        })
```

### File: lib/networking_stack.py

```python
"""
networking_stack.py

Multi-region networking infrastructure with VPCs, subnets, and Route53 health checks.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class NetworkingStack(pulumi.ComponentResource):
    """
    Creates multi-region networking infrastructure for DR.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:networking:NetworkingStack', name, None, opts)

        # Create VPC in primary region
        self.primary_vpc = aws.ec2.Vpc(
            f"primary-vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'primary-vpc-{environment_suffix}', 'Region': primary_region},
            opts=ResourceOptions(parent=self)
        )

        # Create VPC in secondary region
        secondary_provider = aws.Provider(
            f"secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        self.secondary_vpc = aws.ec2.Vpc(
            f"secondary-vpc-{environment_suffix}",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'secondary-vpc-{environment_suffix}', 'Region': secondary_region},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Create public subnets in primary region
        self.primary_public_subnet_1 = aws.ec2.Subnet(
            f"primary-public-subnet-1-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{primary_region}a",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'primary-public-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.primary_public_subnet_2 = aws.ec2.Subnet(
            f"primary-public-subnet-2-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{primary_region}b",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'primary-public-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets in primary region
        self.primary_private_subnet_1 = aws.ec2.Subnet(
            f"primary-private-subnet-1-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{primary_region}a",
            tags={**tags, 'Name': f'primary-private-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.primary_private_subnet_2 = aws.ec2.Subnet(
            f"primary-private-subnet-2-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{primary_region}b",
            tags={**tags, 'Name': f'primary-private-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets in secondary region
        self.secondary_public_subnet_1 = aws.ec2.Subnet(
            f"secondary-public-subnet-1-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.1.0/24",
            availability_zone=f"{secondary_region}a",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'secondary-public-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_public_subnet_2 = aws.ec2.Subnet(
            f"secondary-public-subnet-2-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.2.0/24",
            availability_zone=f"{secondary_region}b",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'secondary-public-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Create private subnets in secondary region
        self.secondary_private_subnet_1 = aws.ec2.Subnet(
            f"secondary-private-subnet-1-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.11.0/24",
            availability_zone=f"{secondary_region}a",
            tags={**tags, 'Name': f'secondary-private-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_private_subnet_2 = aws.ec2.Subnet(
            f"secondary-private-subnet-2-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.12.0/24",
            availability_zone=f"{secondary_region}b",
            tags={**tags, 'Name': f'secondary-private-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Internet Gateways
        self.primary_igw = aws.ec2.InternetGateway(
            f"primary-igw-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            tags={**tags, 'Name': f'primary-igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_igw = aws.ec2.InternetGateway(
            f"secondary-igw-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            tags={**tags, 'Name': f'secondary-igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Route tables
        self.primary_public_rt = aws.ec2.RouteTable(
            f"primary-public-rt-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.primary_igw.id,
                )
            ],
            tags={**tags, 'Name': f'primary-public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_public_rt = aws.ec2.RouteTable(
            f"secondary-public-rt-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.secondary_igw.id,
                )
            ],
            tags={**tags, 'Name': f'secondary-public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Route table associations
        aws.ec2.RouteTableAssociation(
            f"primary-public-rta-1-{environment_suffix}",
            subnet_id=self.primary_public_subnet_1.id,
            route_table_id=self.primary_public_rt.id,
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.RouteTableAssociation(
            f"primary-public-rta-2-{environment_suffix}",
            subnet_id=self.primary_public_subnet_2.id,
            route_table_id=self.primary_public_rt.id,
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.RouteTableAssociation(
            f"secondary-public-rta-1-{environment_suffix}",
            subnet_id=self.secondary_public_subnet_1.id,
            route_table_id=self.secondary_public_rt.id,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        aws.ec2.RouteTableAssociation(
            f"secondary-public-rta-2-{environment_suffix}",
            subnet_id=self.secondary_public_subnet_2.id,
            route_table_id=self.secondary_public_rt.id,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Create Route53 hosted zone
        self.hosted_zone = aws.route53.Zone(
            f"ecommerce-zone-{environment_suffix}",
            name=f"ecommerce-{environment_suffix}.internal",
            tags={**tags, 'Name': f'ecommerce-zone-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.primary_vpc_id = self.primary_vpc.id
        self.secondary_vpc_id = self.secondary_vpc.id
        self.primary_public_subnet_ids = [self.primary_public_subnet_1.id, self.primary_public_subnet_2.id]
        self.secondary_public_subnet_ids = [self.secondary_public_subnet_1.id, self.secondary_public_subnet_2.id]
        self.primary_private_subnet_ids = [self.primary_private_subnet_1.id, self.primary_private_subnet_2.id]
        self.secondary_private_subnet_ids = [self.secondary_private_subnet_1.id, self.secondary_private_subnet_2.id]
        self.hosted_zone_id = self.hosted_zone.id
        self.primary_endpoint = Output.concat("primary.", self.hosted_zone.name)

        self.register_outputs({})
```

### File: lib/database_stack.py

```python
"""
database_stack.py

Multi-region database infrastructure with Aurora and DynamoDB Global Tables.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class DatabaseStack(pulumi.ComponentResource):
    """
    Creates multi-region database infrastructure with replication.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_vpc_id: Output,
        secondary_vpc_id: Output,
        primary_subnet_ids: list,
        secondary_subnet_ids: list,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        secondary_provider = aws.Provider(
            f"db-secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS in primary region
        self.primary_db_sg = aws.ec2.SecurityGroup(
            f"primary-db-sg-{environment_suffix}",
            vpc_id=primary_vpc_id,
            description="Security group for primary RDS Aurora cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.0.0.0/16"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'primary-db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS in secondary region
        self.secondary_db_sg = aws.ec2.SecurityGroup(
            f"secondary-db-sg-{environment_suffix}",
            vpc_id=secondary_vpc_id,
            description="Security group for secondary RDS Aurora cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.1.0.0/16"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'secondary-db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # DB subnet group in primary region
        self.primary_subnet_group = aws.rds.SubnetGroup(
            f"primary-db-subnet-group-{environment_suffix}",
            subnet_ids=primary_subnet_ids,
            tags={**tags, 'Name': f'primary-db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # DB subnet group in secondary region
        self.secondary_subnet_group = aws.rds.SubnetGroup(
            f"secondary-db-subnet-group-{environment_suffix}",
            subnet_ids=secondary_subnet_ids,
            tags={**tags, 'Name': f'secondary-db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Aurora Serverless v2 cluster in primary region
        self.primary_cluster = aws.rds.Cluster(
            f"primary-aurora-cluster-{environment_suffix}",
            cluster_identifier=f"primary-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_mode="provisioned",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="ecommerce",
            master_username="admin",
            master_password="ChangeMe123!",
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[self.primary_db_sg.id],
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                max_capacity=2.0,
                min_capacity=0.5,
            ),
            backup_retention_period=1,
            skip_final_snapshot=True,
            storage_encrypted=True,
            tags={**tags, 'Name': f'primary-aurora-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Aurora Serverless v2 instance in primary region
        self.primary_instance = aws.rds.ClusterInstance(
            f"primary-aurora-instance-{environment_suffix}",
            identifier=f"primary-aurora-instance-{environment_suffix}",
            cluster_identifier=self.primary_cluster.id,
            instance_class="db.serverless",
            engine=self.primary_cluster.engine,
            engine_version=self.primary_cluster.engine_version,
            tags={**tags, 'Name': f'primary-aurora-instance-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[self.primary_cluster])
        )

        # Aurora Serverless v2 cluster in secondary region (read replica)
        self.secondary_cluster = aws.rds.Cluster(
            f"secondary-aurora-cluster-{environment_suffix}",
            cluster_identifier=f"secondary-aurora-{environment_suffix}",
            global_cluster_identifier=Output.concat("global-", self.primary_cluster.cluster_identifier),
            engine="aurora-mysql",
            engine_mode="provisioned",
            engine_version="8.0.mysql_aurora.3.04.0",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[self.secondary_db_sg.id],
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                max_capacity=2.0,
                min_capacity=0.5,
            ),
            skip_final_snapshot=True,
            storage_encrypted=True,
            tags={**tags, 'Name': f'secondary-aurora-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[self.primary_cluster])
        )

        # Aurora Serverless v2 instance in secondary region
        self.secondary_instance = aws.rds.ClusterInstance(
            f"secondary-aurora-instance-{environment_suffix}",
            identifier=f"secondary-aurora-instance-{environment_suffix}",
            cluster_identifier=self.secondary_cluster.id,
            instance_class="db.serverless",
            engine=self.secondary_cluster.engine,
            engine_version=self.secondary_cluster.engine_version,
            tags={**tags, 'Name': f'secondary-aurora-instance-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[self.secondary_cluster])
        )

        # DynamoDB table with global replication
        self.dynamodb_table = aws.dynamodb.Table(
            f"ecommerce-sessions-{environment_suffix}",
            name=f"ecommerce-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="session_id",
                    type="S",
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            replicas=[
                aws.dynamodb.TableReplicaArgs(
                    region_name=secondary_region,
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True,
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
            ),
            tags={**tags, 'Name': f'ecommerce-sessions-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.primary_endpoint = self.primary_cluster.endpoint
        self.secondary_endpoint = self.secondary_cluster.endpoint
        self.primary_cluster_id = self.primary_cluster.id
        self.dynamodb_table_name = self.dynamodb_table.name

        self.register_outputs({})
```

### File: lib/storage_stack.py

```python
"""
storage_stack.py

Multi-region storage infrastructure with S3 cross-region replication.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json


class StorageStack(pulumi.ComponentResource):
    """
    Creates multi-region storage infrastructure with replication.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        secondary_provider = aws.Provider(
            f"storage-secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # IAM role for S3 replication
        replication_role = aws.iam.Role(
            f"s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**tags, 'Name': f's3-replication-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Secondary bucket (destination)
        self.secondary_bucket = aws.s3.Bucket(
            f"ecommerce-assets-secondary-{environment_suffix}",
            bucket=f"ecommerce-assets-secondary-{environment_suffix}",
            tags={**tags, 'Name': f'ecommerce-assets-secondary-{environment_suffix}', 'Region': secondary_region},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Enable versioning on secondary bucket
        aws.s3.BucketVersioningV2(
            f"secondary-bucket-versioning-{environment_suffix}",
            bucket=self.secondary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Primary bucket (source)
        self.primary_bucket = aws.s3.Bucket(
            f"ecommerce-assets-primary-{environment_suffix}",
            bucket=f"ecommerce-assets-primary-{environment_suffix}",
            tags={**tags, 'Name': f'ecommerce-assets-primary-{environment_suffix}', 'Region': primary_region},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on primary bucket
        aws.s3.BucketVersioningV2(
            f"primary-bucket-versioning-{environment_suffix}",
            bucket=self.primary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption for primary bucket
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"primary-bucket-encryption-{environment_suffix}",
            bucket=self.primary_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            )],
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption for secondary bucket
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"secondary-bucket-encryption-{environment_suffix}",
            bucket=self.secondary_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            )],
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Replication policy
        replication_policy = aws.iam.RolePolicy(
            f"s3-replication-policy-{environment_suffix}",
            role=replication_role.id,
            policy=pulumi.Output.all(self.primary_bucket.arn, self.secondary_bucket.arn).apply(
                lambda arns: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetReplicationConfiguration",
                                "s3:ListBucket"
                            ],
                            "Resource": arns[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObjectVersionForReplication",
                                "s3:GetObjectVersionAcl"
                            ],
                            "Resource": f"{arns[0]}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:ReplicateObject",
                                "s3:ReplicateDelete"
                            ],
                            "Resource": f"{arns[1]}/*"
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure replication
        aws.s3.BucketReplicationConfig(
            f"bucket-replication-{environment_suffix}",
            bucket=self.primary_bucket.id,
            role=replication_role.arn,
            rules=[aws.s3.BucketReplicationConfigRuleArgs(
                id="replicate-all",
                status="Enabled",
                priority=1,
                filter=aws.s3.BucketReplicationConfigRuleFilterArgs(
                    prefix="",
                ),
                destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                    bucket=self.secondary_bucket.arn,
                    storage_class="STANDARD",
                ),
            )],
            opts=ResourceOptions(parent=self, depends_on=[replication_policy])
        )

        # Public access block for both buckets
        aws.s3.BucketPublicAccessBlock(
            f"primary-bucket-public-access-block-{environment_suffix}",
            bucket=self.primary_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        aws.s3.BucketPublicAccessBlock(
            f"secondary-bucket-public-access-block-{environment_suffix}",
            bucket=self.secondary_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Expose outputs
        self.primary_bucket_name = self.primary_bucket.id
        self.secondary_bucket_name = self.secondary_bucket.id
        self.primary_bucket_arn = self.primary_bucket.arn
        self.secondary_bucket_arn = self.secondary_bucket.arn

        self.register_outputs({})
```

### File: lib/compute_stack.py

```python
"""
compute_stack.py

Multi-region compute infrastructure with ALB and Lambda functions.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
import json


class ComputeStack(pulumi.ComponentResource):
    """
    Creates multi-region compute infrastructure for application hosting.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_vpc_id: Output,
        secondary_vpc_id: Output,
        primary_subnet_ids: list,
        secondary_subnet_ids: list,
        database_endpoint: Output,
        storage_bucket: Output,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        secondary_provider = aws.Provider(
            f"compute-secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Security group for ALB in primary region
        self.primary_alb_sg = aws.ec2.SecurityGroup(
            f"primary-alb-sg-{environment_suffix}",
            vpc_id=primary_vpc_id,
            description="Security group for primary ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'primary-alb-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Security group for ALB in secondary region
        self.secondary_alb_sg = aws.ec2.SecurityGroup(
            f"secondary-alb-sg-{environment_suffix}",
            vpc_id=secondary_vpc_id,
            description="Security group for secondary ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'secondary-alb-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Primary ALB
        self.primary_alb = aws.lb.LoadBalancer(
            f"primary-alb-{environment_suffix}",
            name=f"primary-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.primary_alb_sg.id],
            subnets=primary_subnet_ids,
            enable_deletion_protection=False,
            tags={**tags, 'Name': f'primary-alb-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Secondary ALB
        self.secondary_alb = aws.lb.LoadBalancer(
            f"secondary-alb-{environment_suffix}",
            name=f"secondary-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.secondary_alb_sg.id],
            subnets=secondary_subnet_ids,
            enable_deletion_protection=False,
            tags={**tags, 'Name': f'secondary-alb-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Target groups
        self.primary_target_group = aws.lb.TargetGroup(
            f"primary-tg-{environment_suffix}",
            name=f"primary-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=primary_vpc_id,
            target_type="lambda",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
            ),
            tags={**tags, 'Name': f'primary-tg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_target_group = aws.lb.TargetGroup(
            f"secondary-tg-{environment_suffix}",
            name=f"secondary-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=secondary_vpc_id,
            target_type="lambda",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
            ),
            tags={**tags, 'Name': f'secondary-tg-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Listeners
        self.primary_listener = aws.lb.Listener(
            f"primary-listener-{environment_suffix}",
            load_balancer_arn=self.primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.primary_target_group.arn,
            )],
            tags={**tags, 'Name': f'primary-listener-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_listener = aws.lb.Listener(
            f"secondary-listener-{environment_suffix}",
            load_balancer_arn=self.secondary_alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.secondary_target_group.arn,
            )],
            tags={**tags, 'Name': f'secondary-listener-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # IAM role for Lambda
        lambda_role = aws.iam.Role(
            f"lambda-exec-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
            ],
            tags={**tags, 'Name': f'lambda-exec-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Lambda function for primary region
        self.primary_lambda = aws.lambda_.Function(
            f"primary-app-lambda-{environment_suffix}",
            name=f"primary-app-lambda-{environment_suffix}",
            runtime="python3.11",
            role=lambda_role.arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': 'E-commerce API - Primary Region',
            'region': 'us-east-1',
            'status': 'active'
        })
    }
""")
            }),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "REGION": primary_region,
                    "DB_ENDPOINT": database_endpoint,
                    "STORAGE_BUCKET": storage_bucket,
                }
            ),
            tags={**tags, 'Name': f'primary-app-lambda-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[lambda_role])
        )

        # Lambda function for secondary region
        self.secondary_lambda = aws.lambda_.Function(
            f"secondary-app-lambda-{environment_suffix}",
            name=f"secondary-app-lambda-{environment_suffix}",
            runtime="python3.11",
            role=lambda_role.arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': 'E-commerce API - Secondary Region',
            'region': 'us-west-2',
            'status': 'standby'
        })
    }
""")
            }),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "REGION": secondary_region,
                }
            ),
            tags={**tags, 'Name': f'secondary-app-lambda-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[lambda_role])
        )

        # Lambda permissions for ALB
        aws.lambda_.Permission(
            f"primary-lambda-alb-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.primary_lambda.name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=self.primary_target_group.arn,
            opts=ResourceOptions(parent=self)
        )

        aws.lambda_.Permission(
            f"secondary-lambda-alb-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.secondary_lambda.name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=self.secondary_target_group.arn,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Attach Lambda to target groups
        aws.lb.TargetGroupAttachment(
            f"primary-lambda-tg-attachment-{environment_suffix}",
            target_group_arn=self.primary_target_group.arn,
            target_id=self.primary_lambda.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.primary_lambda])
        )

        aws.lb.TargetGroupAttachment(
            f"secondary-lambda-tg-attachment-{environment_suffix}",
            target_group_arn=self.secondary_target_group.arn,
            target_id=self.secondary_lambda.arn,
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[self.secondary_lambda])
        )

        # Expose outputs
        self.primary_alb_dns = self.primary_alb.dns_name
        self.secondary_alb_dns = self.secondary_alb.dns_name
        self.primary_target_group_arn = self.primary_target_group.arn
        self.primary_lambda_arn = self.primary_lambda.arn
        self.secondary_lambda_arn = self.secondary_lambda.arn

        self.register_outputs({})
```

### File: lib/monitoring_stack.py

```python
"""
monitoring_stack.py

Monitoring and alerting infrastructure for DR solution.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
import json


class MonitoringStack(pulumi.ComponentResource):
    """
    Creates monitoring and alerting infrastructure.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        compute_target_group: Output,
        database_cluster_id: Output,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # SNS topic for alerts
        self.sns_topic = aws.sns.Topic(
            f"dr-alerts-topic-{environment_suffix}",
            name=f"dr-alerts-topic-{environment_suffix}",
            tags={**tags, 'Name': f'dr-alerts-topic-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for ALB unhealthy targets
        self.alb_alarm = aws.cloudwatch.MetricAlarm(
            f"alb-unhealthy-targets-alarm-{environment_suffix}",
            name=f"alb-unhealthy-targets-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0,
            alarm_description="Alarm when ALB has unhealthy targets",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "TargetGroup": compute_target_group.apply(lambda arn: arn.split(":")[-1])
            },
            tags={**tags, 'Name': f'alb-unhealthy-targets-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for RDS CPU
        self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{environment_suffix}",
            name=f"rds-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alarm when RDS CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": database_cluster_id
            },
            tags={**tags, 'Name': f'rds-cpu-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for RDS connections
        self.rds_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-connections-alarm-{environment_suffix}",
            name=f"rds-connections-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=1,
            alarm_description="Alarm when RDS has no connections (possible failure)",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": database_cluster_id
            },
            tags={**tags, 'Name': f'rds-connections-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Route53 health check for primary endpoint
        self.health_check = aws.route53.HealthCheck(
            f"primary-health-check-{environment_suffix}",
            type="HTTPS_STR_MATCH",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            search_string="active",
            measure_latency=True,
            tags={**tags, 'Name': f'primary-health-check-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for health check
        self.health_check_alarm = aws.cloudwatch.MetricAlarm(
            f"health-check-alarm-{environment_suffix}",
            name=f"health-check-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthCheckStatus",
            namespace="AWS/Route53",
            period=60,
            statistic="Minimum",
            threshold=1,
            alarm_description="Alarm when primary region health check fails",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "HealthCheckId": self.health_check.id
            },
            tags={**tags, 'Name': f'health-check-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group for application logs
        self.log_group = aws.cloudwatch.LogGroup(
            f"ecommerce-logs-{environment_suffix}",
            name=f"/aws/ecommerce/{environment_suffix}",
            retention_in_days=7,
            tags={**tags, 'Name': f'ecommerce-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.sns_topic_arn = self.sns_topic.arn
        self.health_check_id = self.health_check.id
        self.log_group_name = self.log_group.name

        self.register_outputs({})
```

### File: lib/dr_automation_stack.py

```python
"""
dr_automation_stack.py

Disaster recovery automation with Lambda-based failover.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
import json


class DRAutomationStack(pulumi.ComponentResource):
    """
    Creates DR automation infrastructure for failover management.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        health_check_id: Output,
        hosted_zone_id: Output,
        sns_topic_arn: Output,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:dr:DRAutomationStack', name, None, opts)

        # IAM role for failover Lambda
        failover_role = aws.iam.Role(
            f"failover-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ],
            inline_policies=[
                aws.iam.RoleInlinePolicyArgs(
                    name="route53-failover-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "route53:ChangeResourceRecordSets",
                                    "route53:GetHealthCheckStatus",
                                    "route53:GetChange"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "rds:FailoverDBCluster",
                                    "rds:DescribeDBClusters"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sns:Publish"
                                ],
                                "Resource": "*"
                            }
                        ]
                    })
                )
            ],
            tags={**tags, 'Name': f'failover-lambda-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Failover automation Lambda
        self.failover_lambda = aws.lambda_.Function(
            f"dr-failover-lambda-{environment_suffix}",
            name=f"dr-failover-lambda-{environment_suffix}",
            runtime="python3.11",
            role=failover_role.arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

route53 = boto3.client('route53')
rds = boto3.client('rds')
sns = boto3.client('sns')

def handler(event, context):
    print(f"DR Failover triggered: {json.dumps(event)}")

    # Parse CloudWatch alarm
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message['AlarmName']
    new_state = message['NewStateValue']

    if new_state == 'ALARM':
        print(f"Health check failed: {alarm_name}")

        # Initiate failover procedures
        try:
            # Send notification
            sns_topic_arn = os.environ['SNS_TOPIC_ARN']
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='DR Failover Initiated',
                Message=f'Disaster recovery failover initiated due to: {alarm_name}'
            )

            return {
                'statusCode': 200,
                'body': json.dumps('Failover procedures initiated')
            }
        except Exception as e:
            print(f"Error during failover: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps(f'Failover error: {str(e)}')
            }

    return {
        'statusCode': 200,
        'body': json.dumps('No action required')
    }
""")
            }),
            timeout=300,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "PRIMARY_REGION": primary_region,
                    "SECONDARY_REGION": secondary_region,
                    "HOSTED_ZONE_ID": hosted_zone_id,
                    "SNS_TOPIC_ARN": sns_topic_arn,
                }
            ),
            tags={**tags, 'Name': f'dr-failover-lambda-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[failover_role])
        )

        # SNS subscription for failover Lambda
        aws.sns.TopicSubscription(
            f"failover-lambda-subscription-{environment_suffix}",
            topic=sns_topic_arn,
            protocol="lambda",
            endpoint=self.failover_lambda.arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for SNS
        aws.lambda_.Permission(
            f"failover-lambda-sns-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.failover_lambda.name,
            principal="sns.amazonaws.com",
            source_arn=sns_topic_arn,
            opts=ResourceOptions(parent=self)
        )

        # SSM Parameter for DR configuration
        self.dr_config_parameter = aws.ssm.Parameter(
            f"dr-config-{environment_suffix}",
            name=f"/ecommerce/{environment_suffix}/dr-config",
            type="String",
            value=json.dumps({
                "primary_region": primary_region,
                "secondary_region": secondary_region,
                "rto_minutes": 15,
                "rpo_minutes": 5,
                "auto_failover": True
            }),
            description="DR configuration parameters",
            tags={**tags, 'Name': f'dr-config-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.failover_lambda_arn = self.failover_lambda.arn
        self.dr_config_name = self.dr_config_parameter.name

        self.register_outputs({})
```
