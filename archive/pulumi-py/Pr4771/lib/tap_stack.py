"""
tap_stack.py

Industrial IoT Data Processing Infrastructure Stack

This module defines the TapStack class, which orchestrates the deployment of a secure
data processing infrastructure for manufacturing sensor data collection and analytics.

The stack includes:
- VPC with public and private subnets for network isolation
- Amazon Kinesis Data Stream for real-time sensor data ingestion
- RDS Aurora Serverless v2 cluster for persistent data storage
- ElastiCache Redis cluster for real-time data processing
- AWS Secrets Manager for credential management
- AWS KMS keys for encryption at rest
- Security groups for network access control
"""

from typing import Optional
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the
            deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Industrial IoT Data Processing Infrastructure Stack.

    This component orchestrates the creation of a secure, scalable infrastructure for
    collecting and processing sensor data from industrial equipment.

    Features:
    - Real-time data ingestion via Kinesis
    - Persistent storage with Aurora Serverless v2
    - Real-time caching with ElastiCache Redis
    - Comprehensive encryption using KMS
    - Network isolation with VPC and security groups
    - Secure credential management with Secrets Manager

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

        # Get AWS region from config
        config = pulumi.Config()
        aws_region = config.get('aws:region') or 'sa-east-1'

        # Define common tags
        common_tags = {
            'Environment': self.environment_suffix,
            'Project': 'IndustrialIoT',
            'ManagedBy': 'Pulumi',
            **self.tags
        }

        # ===== KMS Keys for Encryption =====

        # KMS key for Kinesis encryption
        self.kinesis_kms_key = aws.kms.Key(
            f"kinesis-kms-key-{self.environment_suffix}",
            description=f"KMS key for Kinesis Data Stream encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={**common_tags, 'Service': 'Kinesis'},
            opts=ResourceOptions(parent=self)
        )

        self.kinesis_kms_alias = aws.kms.Alias(
            f"kinesis-kms-alias-{self.environment_suffix}",
            name=f"alias/kinesis-{self.environment_suffix}",
            target_key_id=self.kinesis_kms_key.id,
            opts=ResourceOptions(parent=self.kinesis_kms_key)
        )

        # KMS key for RDS encryption
        self.rds_kms_key = aws.kms.Key(
            f"rds-kms-key-{self.environment_suffix}",
            description=f"KMS key for RDS Aurora encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={**common_tags, 'Service': 'RDS'},
            opts=ResourceOptions(parent=self)
        )

        self.rds_kms_alias = aws.kms.Alias(
            f"rds-kms-alias-{self.environment_suffix}",
            name=f"alias/rds-{self.environment_suffix}",
            target_key_id=self.rds_kms_key.id,
            opts=ResourceOptions(parent=self.rds_kms_key)
        )

        # KMS key for Secrets Manager encryption
        self.secrets_kms_key = aws.kms.Key(
            f"secrets-kms-key-{self.environment_suffix}",
            description=f"KMS key for Secrets Manager encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={**common_tags, 'Service': 'SecretsManager'},
            opts=ResourceOptions(parent=self)
        )

        self.secrets_kms_alias = aws.kms.Alias(
            f"secrets-kms-alias-{self.environment_suffix}",
            name=f"alias/secrets-{self.environment_suffix}",
            target_key_id=self.secrets_kms_key.id,
            opts=ResourceOptions(parent=self.secrets_kms_key)
        )

        # ===== VPC and Networking =====

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"iot-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, 'Name': f"iot-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"iot-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f"iot-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets (for NAT Gateway if needed)
        self.public_subnet_1 = aws.ec2.Subnet(
            f"iot-public-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=azs.names[0],
            map_public_ip_on_launch=True,
            tags={**common_tags, 'Name': f"iot-public-subnet-1-{self.environment_suffix}", 'Type': 'Public'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.public_subnet_2 = aws.ec2.Subnet(
            f"iot-public-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=azs.names[1],
            map_public_ip_on_launch=True,
            tags={**common_tags, 'Name': f"iot-public-subnet-2-{self.environment_suffix}", 'Type': 'Public'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create private subnets (for RDS and ElastiCache)
        self.private_subnet_1 = aws.ec2.Subnet(
            f"iot-private-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=azs.names[0],
            tags={**common_tags, 'Name': f"iot-private-subnet-1-{self.environment_suffix}", 'Type': 'Private'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.private_subnet_2 = aws.ec2.Subnet(
            f"iot-private-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=azs.names[1],
            tags={**common_tags, 'Name': f"iot-private-subnet-2-{self.environment_suffix}", 'Type': 'Private'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"iot-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f"iot-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Route to Internet Gateway
        self.public_route = aws.ec2.Route(
            f"iot-public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Associate public subnets with public route table
        self.public_rt_assoc_1 = aws.ec2.RouteTableAssociation(
            f"iot-public-rt-assoc-1-{self.environment_suffix}",
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        self.public_rt_assoc_2 = aws.ec2.RouteTableAssociation(
            f"iot-public-rt-assoc-2-{self.environment_suffix}",
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Create private route table (no NAT Gateway for cost optimization)
        self.private_route_table = aws.ec2.RouteTable(
            f"iot-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f"iot-private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate private subnets with private route table
        self.private_rt_assoc_1 = aws.ec2.RouteTableAssociation(
            f"iot-private-rt-assoc-1-{self.environment_suffix}",
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

        self.private_rt_assoc_2 = aws.ec2.RouteTableAssociation(
            f"iot-private-rt-assoc-2-{self.environment_suffix}",
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

        # ===== Security Groups =====

        # Security group for RDS
        self.rds_security_group = aws.ec2.SecurityGroup(
            f"rds-sg-{self.environment_suffix}",
            name=f"rds-sg-{self.environment_suffix}",
            description=f"Security group for RDS Aurora cluster - {self.environment_suffix}",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL access from VPC",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=[self.vpc.cidr_block]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**common_tags, 'Name': f"rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for ElastiCache
        self.elasticache_security_group = aws.ec2.SecurityGroup(
            f"elasticache-sg-{self.environment_suffix}",
            name=f"elasticache-sg-{self.environment_suffix}",
            description=f"Security group for ElastiCache Redis - {self.environment_suffix}",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="Redis access from VPC",
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    cidr_blocks=[self.vpc.cidr_block]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**common_tags, 'Name': f"elasticache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # ===== Kinesis Data Stream =====

        self.kinesis_stream = aws.kinesis.Stream(
            f"sensor-data-stream-{self.environment_suffix}",
            name=f"sensor-data-stream-{self.environment_suffix}",
            shard_count=2,
            retention_period=24,  # 24 hours retention
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
            ],
            stream_mode_details=aws.kinesis.StreamStreamModeDetailsArgs(
                stream_mode="PROVISIONED"
            ),
            encryption_type="KMS",
            kms_key_id=self.kinesis_kms_key.id,
            tags={**common_tags, 'Name': f"sensor-data-stream-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.kinesis_kms_key])
        )

        # ===== Secrets Manager for Database Credentials =====

        # Generate database credentials
        self.db_password = aws.secretsmanager.Secret(
            f"db-master-password-{self.environment_suffix}",
            name=f"db-master-password-{self.environment_suffix}",
            description=f"Master password for RDS Aurora cluster - {self.environment_suffix}",
            kms_key_id=self.secrets_kms_key.id,
            tags={**common_tags, 'Name': f"db-master-password-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.secrets_kms_key])
        )

        # Create a random password for the database
        import random
        import string

        def generate_password(length=32):
            chars = string.ascii_letters + string.digits
            # Ensure at least one of each required character type
            password = [
                random.choice(string.ascii_uppercase),
                random.choice(string.ascii_lowercase),
                random.choice(string.digits),
            ]
            # Fill the rest randomly
            password.extend(random.choice(chars) for _ in range(length - 3))
            random.shuffle(password)
            return ''.join(password)

        db_password_value = generate_password()

        self.db_password_version = aws.secretsmanager.SecretVersion(
            f"db-master-password-version-{self.environment_suffix}",
            secret_id=self.db_password.id,
            secret_string=json.dumps({
                "username": "dbadmin",
                "password": db_password_value,
                "engine": "aurora-postgresql",
                "host": "",  # Will be updated after RDS creation
                "port": 5432,
                "dbname": "sensordata"
            }),
            opts=ResourceOptions(parent=self.db_password)
        )

        # ===== RDS Aurora Serverless v2 Cluster =====

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-{self.environment_suffix}",
            name=f"aurora-subnet-group-{self.environment_suffix}",
            description=f"Subnet group for Aurora cluster - {self.environment_suffix}",
            subnet_ids=[
                self.private_subnet_1.id,
                self.private_subnet_2.id
            ],
            tags={**common_tags, 'Name': f"aurora-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create Aurora cluster
        self.aurora_cluster = aws.rds.Cluster(
            f"aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"aurora-cluster-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="sensordata",
            master_username="dbadmin",
            master_password=db_password_value,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group.id],
            storage_encrypted=True,
            kms_key_id=self.rds_kms_key.arn,
            backup_retention_period=30,  # 30 days as per requirement
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,  # For destroyability
            apply_immediately=True,
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                max_capacity=2.0,
                min_capacity=0.5
            ),
            tags={**common_tags, 'Name': f"aurora-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.db_subnet_group, self.rds_security_group, self.rds_kms_key]
            )
        )

        # Create Aurora Serverless v2 instance
        self.aurora_instance = aws.rds.ClusterInstance(
            f"aurora-instance-{self.environment_suffix}",
            identifier=f"aurora-instance-{self.environment_suffix}",
            cluster_identifier=self.aurora_cluster.id,
            instance_class="db.serverless",
            engine=self.aurora_cluster.engine,
            engine_version=self.aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={**common_tags, 'Name': f"aurora-instance-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.aurora_cluster)
        )

        # ===== ElastiCache Redis Cluster =====

        # Create ElastiCache subnet group
        self.elasticache_subnet_group = aws.elasticache.SubnetGroup(
            f"redis-subnet-group-{self.environment_suffix}",
            name=f"redis-subnet-group-{self.environment_suffix}",
            description=f"Subnet group for ElastiCache Redis - {self.environment_suffix}",
            subnet_ids=[
                self.private_subnet_1.id,
                self.private_subnet_2.id
            ],
            tags={**common_tags, 'Name': f"redis-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create ElastiCache Redis replication group
        self.redis_cluster = aws.elasticache.ReplicationGroup(
            f"redis-cluster-{self.environment_suffix}",
            replication_group_id=f"redis-{self.environment_suffix}",
            description=f"Redis cluster for real-time data processing - {self.environment_suffix}",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            parameter_group_name="default.redis7",
            port=6379,
            subnet_group_name=self.elasticache_subnet_group.name,
            security_group_ids=[self.elasticache_security_group.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            automatic_failover_enabled=True,
            auto_minor_version_upgrade=True,
            maintenance_window="mon:05:00-mon:06:00",
            snapshot_retention_limit=5,
            snapshot_window="03:00-04:00",
            tags={**common_tags, 'Name': f"redis-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.elasticache_subnet_group, self.elasticache_security_group]
            )
        )

        # ===== CloudWatch Log Groups for Monitoring =====

        self.kinesis_log_group = aws.cloudwatch.LogGroup(
            f"kinesis-logs-{self.environment_suffix}",
            name=f"/aws/kinesis/sensor-data-stream-{self.environment_suffix}",
            retention_in_days=7,
            tags={**common_tags, 'Name': f"kinesis-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.rds_log_group = aws.cloudwatch.LogGroup(
            f"rds-logs-{self.environment_suffix}",
            name=f"/aws/rds/cluster/aurora-cluster-{self.environment_suffix}",
            retention_in_days=7,
            tags={**common_tags, 'Name': f"rds-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ===== Outputs =====

        # Export important resource identifiers
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'vpc_cidr': self.vpc.cidr_block,
            'public_subnet_ids': Output.all(self.public_subnet_1.id, self.public_subnet_2.id),
            'private_subnet_ids': Output.all(self.private_subnet_1.id, self.private_subnet_2.id),
            'kinesis_stream_name': self.kinesis_stream.name,
            'kinesis_stream_arn': self.kinesis_stream.arn,
            'aurora_cluster_id': self.aurora_cluster.id,
            'aurora_cluster_endpoint': self.aurora_cluster.endpoint,
            'aurora_cluster_reader_endpoint': self.aurora_cluster.reader_endpoint,
            'redis_cluster_id': self.redis_cluster.id,
            'redis_primary_endpoint': self.redis_cluster.primary_endpoint_address,
            'redis_reader_endpoint': self.redis_cluster.reader_endpoint_address,
            'secrets_manager_secret_arn': self.db_password.arn,
            'kinesis_kms_key_id': self.kinesis_kms_key.id,
            'rds_kms_key_id': self.rds_kms_key.id,
            'secrets_kms_key_id': self.secrets_kms_key.id,
            'rds_security_group_id': self.rds_security_group.id,
            'elasticache_security_group_id': self.elasticache_security_group.id,
        })
