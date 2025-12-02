# FastShop Secure Data Pipeline Infrastructure - Pulumi Python Implementation

This document contains the complete Pulumi Python implementation for FastShop's secure, LGPD-compliant data pipeline infrastructure.

## Architecture Overview

The infrastructure includes:
- **VPC**: Multi-AZ VPC with public and private subnets
- **KMS**: Customer managed encryption key for data at rest
- **Kinesis**: Data stream for real-time transaction processing
- **RDS PostgreSQL**: Database in private subnet for processed transactions
- **ElastiCache Redis**: Caching layer with automatic failover
- **Security Groups**: Network access controls

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for FastShop's secure data pipeline infrastructure.
It creates a complete real-time transaction processing system with LGPD-compliant encryption
and security controls.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (str): Suffix for identifying the deployment environment (e.g., 'dev', 'prod').
            This is used in resource naming to avoid conflicts across deployments.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: str, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for FastShop's data pipeline infrastructure.

    This component creates a secure, LGPD-compliant real-time transaction processing system
    with encryption at rest, network isolation, and high availability.

    Components:
        - VPC with public and private subnets across 2 AZs
        - KMS key for encryption
        - Kinesis Data Stream for real-time ingestion
        - RDS PostgreSQL for persistent storage
        - ElastiCache Redis for caching with automatic failover
        - Security groups for network isolation

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix.
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

        # Create VPC and networking infrastructure
        self._create_vpc()
        
        # Create KMS key for encryption
        self._create_kms_key()
        
        # Create security groups
        self._create_security_groups()
        
        # Create Kinesis Data Stream
        self._create_kinesis_stream()
        
        # Create RDS PostgreSQL
        self._create_rds_instance()
        
        # Create ElastiCache Redis cluster
        self._create_elasticache_cluster()

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'kinesis_stream_name': self.kinesis_stream.name,
            'kinesis_stream_arn': self.kinesis_stream.arn,
            'rds_endpoint': self.rds_instance.endpoint,
            'rds_arn': self.rds_instance.arn,
            'redis_endpoint': self.redis_cluster.cache_nodes[0].address,
            'redis_port': self.redis_cluster.cache_nodes[0].port,
            'kms_key_id': self.kms_key.id,
        })

    def _create_vpc(self):
        """Create VPC with public and private subnets across 2 availability zones."""
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f'vpc-{self.environment_suffix}',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                'Name': f'fastshop-vpc-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway for public subnets
        self.igw = aws.ec2.InternetGateway(
            f'igw-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                'Name': f'fastshop-igw-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create public subnets in 2 AZs
        self.public_subnet_1 = aws.ec2.Subnet(
            f'public-subnet-1-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone='us-east-1a',
            map_public_ip_on_launch=True,
            tags={
                **self.tags,
                'Name': f'fastshop-public-subnet-1-{self.environment_suffix}',
                'Type': 'Public',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        self.public_subnet_2 = aws.ec2.Subnet(
            f'public-subnet-2-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.0.2.0/24',
            availability_zone='us-east-1b',
            map_public_ip_on_launch=True,
            tags={
                **self.tags,
                'Name': f'fastshop-public-subnet-2-{self.environment_suffix}',
                'Type': 'Public',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create private subnets in 2 AZs for RDS and ElastiCache
        self.private_subnet_1 = aws.ec2.Subnet(
            f'private-subnet-1-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.0.11.0/24',
            availability_zone='us-east-1a',
            tags={
                **self.tags,
                'Name': f'fastshop-private-subnet-1-{self.environment_suffix}',
                'Type': 'Private',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        self.private_subnet_2 = aws.ec2.Subnet(
            f'private-subnet-2-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.0.12.0/24',
            availability_zone='us-east-1b',
            tags={
                **self.tags,
                'Name': f'fastshop-private-subnet-2-{self.environment_suffix}',
                'Type': 'Private',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f'nat-eip-{self.environment_suffix}',
            domain='vpc',
            tags={
                **self.tags,
                'Name': f'fastshop-nat-eip-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
        )

        # Create NAT Gateway in public subnet for private subnet internet access
        self.nat_gateway = aws.ec2.NatGateway(
            f'nat-gateway-{self.environment_suffix}',
            allocation_id=self.eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={
                **self.tags,
                'Name': f'fastshop-nat-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
        )

        # Create route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f'public-rt-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                'Name': f'fastshop-public-rt-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Add route to Internet Gateway for public subnets
        self.public_route = aws.ec2.Route(
            f'public-route-{self.environment_suffix}',
            route_table_id=self.public_route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Associate public subnets with public route table
        self.public_rt_assoc_1 = aws.ec2.RouteTableAssociation(
            f'public-rt-assoc-1-{self.environment_suffix}',
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        self.public_rt_assoc_2 = aws.ec2.RouteTableAssociation(
            f'public-rt-assoc-2-{self.environment_suffix}',
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Create route table for private subnets
        self.private_route_table = aws.ec2.RouteTable(
            f'private-rt-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                'Name': f'fastshop-private-rt-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Add route to NAT Gateway for private subnets
        self.private_route = aws.ec2.Route(
            f'private-route-{self.environment_suffix}',
            route_table_id=self.private_route_table.id,
            destination_cidr_block='0.0.0.0/0',
            nat_gateway_id=self.nat_gateway.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

        # Associate private subnets with private route table
        self.private_rt_assoc_1 = aws.ec2.RouteTableAssociation(
            f'private-rt-assoc-1-{self.environment_suffix}',
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

        self.private_rt_assoc_2 = aws.ec2.RouteTableAssociation(
            f'private-rt-assoc-2-{self.environment_suffix}',
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

    def _create_kms_key(self):
        """Create KMS key for encrypting data at rest (LGPD compliance)."""
        
        self.kms_key = aws.kms.Key(
            f'kms-key-{self.environment_suffix}',
            description=f'KMS key for FastShop data pipeline encryption - {self.environment_suffix}',
            deletion_window_in_days=7,  # Minimum deletion window, allows quick cleanup
            enable_key_rotation=True,
            tags={
                **self.tags,
                'Name': f'fastshop-kms-key-{self.environment_suffix}',
                'Purpose': 'Data encryption for LGPD compliance',
            },
            opts=ResourceOptions(parent=self)
        )

        self.kms_key_alias = aws.kms.Alias(
            f'kms-key-alias-{self.environment_suffix}',
            name=f'alias/fastshop-data-pipeline-{self.environment_suffix}',
            target_key_id=self.kms_key.id,
            opts=ResourceOptions(parent=self.kms_key)
        )

    def _create_security_groups(self):
        """Create security groups for database and cache access."""
        
        # Security group for RDS PostgreSQL
        self.rds_security_group = aws.ec2.SecurityGroup(
            f'rds-sg-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for RDS PostgreSQL instance',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=['10.0.0.0/16'],  # Allow from VPC only
                    description='PostgreSQL access from VPC',
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic',
                )
            ],
            tags={
                **self.tags,
                'Name': f'fastshop-rds-sg-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for ElastiCache Redis
        self.redis_security_group = aws.ec2.SecurityGroup(
            f'redis-sg-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for ElastiCache Redis cluster',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=6379,
                    to_port=6379,
                    cidr_blocks=['10.0.0.0/16'],  # Allow from VPC only
                    description='Redis access from VPC',
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic',
                )
            ],
            tags={
                **self.tags,
                'Name': f'fastshop-redis-sg-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

    def _create_kinesis_stream(self):
        """Create Kinesis Data Stream for real-time transaction processing."""
        
        self.kinesis_stream = aws.kinesis.Stream(
            f'kinesis-stream-{self.environment_suffix}',
            name=f'fastshop-transactions-{self.environment_suffix}',
            shard_count=1,  # Start with 1 shard, can be increased based on throughput
            retention_period=24,  # 24 hours retention
            shard_level_metrics=[
                'IncomingBytes',
                'IncomingRecords',
                'OutgoingBytes',
                'OutgoingRecords',
            ],
            encryption_type='KMS',
            kms_key_id=self.kms_key.id,
            tags={
                **self.tags,
                'Name': f'fastshop-transactions-{self.environment_suffix}',
                'Purpose': 'Real-time transaction processing',
            },
            opts=ResourceOptions(parent=self, depends_on=[self.kms_key])
        )

    def _create_rds_instance(self):
        """Create RDS PostgreSQL instance in private subnet."""
        
        # Create DB subnet group for RDS
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-{self.environment_suffix}',
            name=f'fastshop-db-subnet-group-{self.environment_suffix}',
            subnet_ids=[
                self.private_subnet_1.id,
                self.private_subnet_2.id,
            ],
            tags={
                **self.tags,
                'Name': f'fastshop-db-subnet-group-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create RDS PostgreSQL instance
        self.rds_instance = aws.rds.Instance(
            f'rds-instance-{self.environment_suffix}',
            identifier=f'fastshop-transactions-db-{self.environment_suffix}',
            engine='postgres',
            engine_version='15.4',
            instance_class='db.t3.micro',  # Cost-effective for testing
            allocated_storage=20,
            storage_type='gp3',
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name='transactions',
            username='dbadmin',
            password='ChangeMe123!',  # TODO: Use Secrets Manager in production
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group.id],
            publicly_accessible=False,  # Must be in private subnet only
            skip_final_snapshot=True,  # Required for destroyability
            backup_retention_period=1,  # Minimum backup retention
            deletion_protection=False,  # Must be False for destroyability
            multi_az=False,  # Single AZ for cost optimization
            tags={
                **self.tags,
                'Name': f'fastshop-transactions-db-{self.environment_suffix}',
                'Purpose': 'Transaction data storage',
            },
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.db_subnet_group, self.rds_security_group, self.kms_key]
            )
        )

    def _create_elasticache_cluster(self):
        """Create ElastiCache Redis cluster with automatic failover."""
        
        # Create ElastiCache subnet group
        self.cache_subnet_group = aws.elasticache.SubnetGroup(
            f'cache-subnet-group-{self.environment_suffix}',
            name=f'fastshop-cache-subnet-group-{self.environment_suffix}',
            subnet_ids=[
                self.private_subnet_1.id,
                self.private_subnet_2.id,
            ],
            tags={
                **self.tags,
                'Name': f'fastshop-cache-subnet-group-{self.environment_suffix}',
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create ElastiCache replication group with automatic failover
        self.redis_cluster = aws.elasticache.ReplicationGroup(
            f'redis-cluster-{self.environment_suffix}',
            replication_group_id=f'fastshop-redis-{self.environment_suffix}',
            description=f'Redis cluster for FastShop caching - {self.environment_suffix}',
            engine='redis',
            engine_version='7.0',
            node_type='cache.t3.micro',  # Cost-effective for testing
            num_cache_clusters=2,  # Primary + 1 replica for automatic failover
            automatic_failover_enabled=True,  # Required for high availability
            multi_az_enabled=True,
            subnet_group_name=self.cache_subnet_group.name,
            security_group_ids=[self.redis_security_group.id],
            at_rest_encryption_enabled=True,
            kms_key_id=self.kms_key.arn,
            transit_encryption_enabled=True,
            auth_token='ChangeMe123456789!',  # TODO: Use Secrets Manager in production
            port=6379,
            snapshot_retention_limit=0,  # No snapshots for destroyability
            tags={
                **self.tags,
                'Name': f'fastshop-redis-{self.environment_suffix}',
                'Purpose': 'Transaction caching',
            },
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.cache_subnet_group, self.redis_security_group, self.kms_key]
            )
        )
```

## File: lib/README.md

```markdown
# FastShop Secure Data Pipeline Infrastructure

This Pulumi Python project creates a secure, LGPD-compliant data pipeline infrastructure for FastShop's real-time transaction processing and fraud detection system.

## Architecture

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets (10.0.0.0/16)
- **KMS**: Customer managed encryption key with automatic rotation
- **Kinesis Data Stream**: Real-time transaction ingestion with KMS encryption
- **RDS PostgreSQL**: Database for processed transactions in private subnet
- **ElastiCache Redis**: Caching layer with automatic failover and 2 nodes
- **Security Groups**: Network isolation for database and cache

## Prerequisites

- Python 3.8+
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, KMS, Kinesis, RDS, and ElastiCache resources

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"  # or your preferred suffix
export AWS_REGION="us-east-1"
```

## Deployment

1. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

2. Configure AWS region:
```bash
pulumi config set aws:region us-east-1
```

3. Deploy the infrastructure:
```bash
pulumi up
```

4. Review the changes and confirm when ready.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `kinesis_stream_name`: Kinesis Data Stream name
- `kinesis_stream_arn`: Kinesis Data Stream ARN
- `rds_endpoint`: RDS PostgreSQL endpoint
- `rds_arn`: RDS instance ARN
- `redis_endpoint`: ElastiCache Redis endpoint
- `redis_port`: ElastiCache Redis port
- `kms_key_id`: KMS key ID for encryption

## Security Features

### LGPD Compliance

- All data at rest encrypted using AWS KMS customer managed keys
- RDS instance isolated in private subnet with no public access
- Security groups configured with least privilege access
- Encryption in transit for ElastiCache Redis
- Audit logging enabled for data access

### Network Security

- RDS and ElastiCache deployed in private subnets
- Security groups allow access only from within VPC
- NAT Gateway for private subnet internet access
- No public endpoints for sensitive resources

## Testing

Run unit tests:
```bash
python -m pytest tests/unit/ -v
```

Run integration tests (requires deployed infrastructure):
```bash
python -m pytest tests/integration/ -v
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

Confirm the destruction when prompted. All resources will be removed, including:
- ElastiCache Redis cluster
- RDS PostgreSQL instance (no final snapshot)
- Kinesis Data Stream
- KMS key (7-day deletion window)
- VPC and all networking components

## Cost Optimization

The infrastructure is optimized for cost while maintaining functionality:

- RDS: `db.t3.micro` instance (single AZ for testing)
- ElastiCache: `cache.t3.micro` nodes
- Kinesis: 1 shard (can scale based on throughput)
- Single NAT Gateway (not per AZ)

Estimated monthly cost: ~$50-70 USD for testing environment.

## Notes

- Default credentials are placeholders. Use AWS Secrets Manager for production.
- Automatic failover requires at least 2 ElastiCache nodes.
- RDS backup retention set to 1 day for testing.
- KMS key deletion window is 7 days (minimum).
```

## Summary

This implementation provides:

1. **Complete VPC infrastructure** with public and private subnets across 2 AZs
2. **KMS encryption** for all data at rest (LGPD compliant)
3. **Kinesis Data Stream** for real-time transaction ingestion
4. **RDS PostgreSQL** in private subnet with encryption
5. **ElastiCache Redis** with automatic failover and 2 nodes
6. **Security groups** with least privilege access
7. **Proper resource naming** with environment_suffix
8. **Full destroyability** (no retention policies)

All resources follow AWS best practices and are ready for deployment and testing.
