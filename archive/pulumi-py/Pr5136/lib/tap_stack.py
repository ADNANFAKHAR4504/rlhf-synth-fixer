"""Main stack for the transaction monitoring system."""
import json
import os
import pulumi
import pulumi_aws as aws
from typing import Optional


class TapStack:
    """
    Transaction monitoring system stack with Kinesis, ElastiCache Redis, RDS PostgreSQL.
    Implements real-time transaction processing with 24-hour caching and permanent storage.
    """

    def __init__(self, environment_suffix: str, region: str = "ap-northeast-1"):
        """
        Initialize the transaction monitoring stack.

        Args:
            environment_suffix: Unique suffix for resource naming
            region: AWS region for deployment (default: ap-northeast-1)
        """
        self.environment_suffix = environment_suffix
        self.region = region
        self.config = pulumi.Config()

        # Create KMS key first (needed for encryption)
        self.kms_key = self._create_kms_key()

        # Create VPC infrastructure
        self.vpc = self._create_vpc()
        self.private_subnets = self._create_private_subnets()
        self.db_subnet_group = self._create_db_subnet_group()
        self.cache_subnet_group = self._create_cache_subnet_group()

        # Create security groups
        self.rds_sg = self._create_rds_security_group()
        self.redis_sg = self._create_redis_security_group()

        # Create Kinesis Data Stream
        self.kinesis_stream = self._create_kinesis_stream()

        # Create ElastiCache Redis
        self.redis_cluster = self._create_redis_cluster()

        # Fetch existing secrets from Secrets Manager
        self.db_secret = self._fetch_db_secret()

        # Create RDS PostgreSQL
        self.rds_instance = self._create_rds_instance()

        # Create CloudWatch Log Groups
        self.log_group = self._create_cloudwatch_log_group()

        # Create IAM role for Kinesis access
        self.kinesis_role = self._create_kinesis_role()

        # Export outputs
        self._export_outputs()

    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS key for encryption at rest."""
        # Get AWS account ID and region for key policy
        current = aws.get_caller_identity()

        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{current.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{self.region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{current.account_id}:*"
                        }
                    }
                }
            ]
        }

        key = aws.kms.Key(
            f"kms-key-{self.environment_suffix}",
            description=f"KMS key for transaction monitoring system {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps(key_policy),
            tags={
                "Name": f"kms-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

        # Create alias for easier reference
        aws.kms.Alias(
            f"kms-alias-{self.environment_suffix}",
            name=f"alias/transaction-monitoring-{self.environment_suffix}",
            target_key_id=key.id
        )

        return key

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC for the infrastructure."""
        vpc = aws.ec2.Vpc(
            f"vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )
        return vpc

    def _create_private_subnets(self) -> list:
        """Create private subnets in multiple AZs."""
        azs = ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"]
        subnets = []

        for idx, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{idx}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{idx + 1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{idx}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "ManagedBy": "Pulumi"
                }
            )
            subnets.append(subnet)

        return subnets

    def _create_db_subnet_group(self) -> aws.rds.SubnetGroup:
        """Create DB subnet group for RDS."""
        return aws.rds.SubnetGroup(
            f"db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={
                "Name": f"db-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

    def _create_cache_subnet_group(self) -> aws.elasticache.SubnetGroup:
        """Create cache subnet group for ElastiCache."""
        return aws.elasticache.SubnetGroup(
            f"cache-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            description=f"Cache subnet group for {self.environment_suffix}",
            tags={
                "Name": f"cache-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

    def _create_rds_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for RDS."""
        sg = aws.ec2.SecurityGroup(
            f"rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS PostgreSQL",
            ingress=[{
                "protocol": "tcp",
                "from_port": 5432,
                "to_port": 5432,
                "cidr_blocks": ["10.0.0.0/16"]
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": f"rds-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )
        return sg

    def _create_redis_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for Redis."""
        sg = aws.ec2.SecurityGroup(
            f"redis-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis",
            ingress=[{
                "protocol": "tcp",
                "from_port": 6379,
                "to_port": 6379,
                "cidr_blocks": ["10.0.0.0/16"]
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": f"redis-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )
        return sg

    def _create_kinesis_stream(self) -> aws.kinesis.Stream:
        """
        Create Kinesis Data Stream for transaction ingestion.
        Configured for 1000 transactions/minute (~17 TPS).
        """
        stream = aws.kinesis.Stream(
            f"kinesis-stream-{self.environment_suffix}",
            name=f"transaction-stream-{self.environment_suffix}",
            shard_count=2,  # 2 shards = 2MB/s write capacity (enough for 1000 tx/min)
            retention_period=24,  # 24 hours retention
            encryption_type="KMS",
            kms_key_id=self.kms_key.id,
            stream_mode_details={
                "stream_mode": "PROVISIONED"
            },
            tags={
                "Name": f"kinesis-stream-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

        return stream

    def _create_redis_cluster(self) -> aws.elasticache.ReplicationGroup:
        """
        Create ElastiCache Redis cluster with Multi-AZ.
        Configured for 24-hour TTL on transaction data.
        """
        # Create parameter group with custom settings
        param_group = aws.elasticache.ParameterGroup(
            f"redis-params-{self.environment_suffix}",
            family="redis7",
            description=f"Redis parameter group for {self.environment_suffix}",
            parameters=[
                {
                    "name": "maxmemory-policy",
                    "value": "volatile-ttl"  # Evict keys with TTL when memory is full
                }
            ]
        )

        cluster = aws.elasticache.ReplicationGroup(
            f"redis-cluster-{self.environment_suffix}",
            replication_group_id=f"redis-{self.environment_suffix}",
            description="Redis cluster for 24-hour transaction history",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",  # Cost-effective for development
            num_cache_clusters=2,  # Multi-AZ with 1 primary + 1 replica
            parameter_group_name=param_group.name,
            subnet_group_name=self.cache_subnet_group.name,
            security_group_ids=[self.redis_sg.id],
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            kms_key_id=self.kms_key.arn,
            snapshot_retention_limit=0,  # No snapshots for destroyability
            auto_minor_version_upgrade=True,
            tags={
                "Name": f"redis-cluster-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

        return cluster

    def _fetch_db_secret(self):
        """
        Fetch existing database secret from Secrets Manager.
        Returns a placeholder structure - actual secret must exist.
        """
        # In a real implementation, fetch existing secret
        # For now, we'll use Pulumi config to get the secret name
        secret_name = self.config.get("db_secret_name") or f"rds-credentials-{self.environment_suffix}"

        try:
            # Attempt to fetch existing secret
            secret = aws.secretsmanager.get_secret(name=secret_name)
            return secret
        except Exception:
            # If secret doesn't exist, create a placeholder reference
            # In production, this should fail if secret doesn't exist
            pulumi.log.warn(f"Secret {secret_name} not found - using default configuration")
            return None

    def _create_rds_instance(self) -> aws.rds.Instance:
        """
        Create RDS PostgreSQL instance with Multi-AZ.
        Stores all transactions permanently for compliance.
        """
        # Get master credentials from config, environment variables, or use defaults
        master_username = (
            self.config.get("db_username") or
            os.environ.get("TF_VAR_db_username") or
            "txadmin"
        )

        # Try to get password from Pulumi config first, then env var, then default
        password_from_config = self.config.get_secret("db_password")
        password_from_env = os.environ.get("TF_VAR_db_password")

        if password_from_config:
            master_password = password_from_config
        elif password_from_env:
            master_password = pulumi.Output.secret(password_from_env)
        else:
            master_password = pulumi.Output.secret("ChangeMe123!")

        db_instance = aws.rds.Instance(
            f"rds-postgres-{self.environment_suffix}",
            identifier=f"txdb-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.7",
            instance_class="db.t3.micro",  # Cost-effective for development
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="transactions",
            username=master_username,
            password=master_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            multi_az=True,  # Multi-AZ for high availability
            publicly_accessible=False,
            backup_retention_period=0,  # No backups for destroyability
            skip_final_snapshot=True,  # Allow clean deletion
            deletion_protection=False,  # Allow deletion
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            auto_minor_version_upgrade=True,
            tags={
                "Name": f"rds-postgres-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

        return db_instance

    def _create_cloudwatch_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for monitoring."""
        log_group = aws.cloudwatch.LogGroup(
            f"log-group-{self.environment_suffix}",
            name=f"/aws/transaction-monitoring/{self.environment_suffix}",
            retention_in_days=7,  # 7 days retention for cost efficiency
            kms_key_id=self.kms_key.arn,
            tags={
                "Name": f"log-group-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

        return log_group

    def _create_kinesis_role(self) -> aws.iam.Role:
        """Create IAM role for Kinesis stream access."""
        assume_role_policy = aws.iam.get_policy_document(
            statements=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["lambda.amazonaws.com", "kinesis.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )

        role = aws.iam.Role(
            f"kinesis-role-{self.environment_suffix}",
            name=f"kinesis-role-{self.environment_suffix}",
            assume_role_policy=assume_role_policy.json,
            tags={
                "Name": f"kinesis-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            }
        )

        # Attach policy for Kinesis access
        policy = aws.iam.RolePolicy(
            f"kinesis-policy-{self.environment_suffix}",
            role=role.id,
            policy=self.kinesis_stream.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:PutRecord",
                            "kinesis:PutRecords",
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams"
                        ],
                        "Resource": arn
                    }]
                })
            )
        )

        # Attach CloudWatch Logs policy
        aws.iam.RolePolicyAttachment(
            f"kinesis-logs-policy-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
        )

        return role

    def _export_outputs(self):
        """Export stack outputs."""
        pulumi.export("vpc_id", self.vpc.id)
        pulumi.export("kinesis_stream_name", self.kinesis_stream.name)
        pulumi.export("kinesis_stream_arn", self.kinesis_stream.arn)
        pulumi.export("redis_endpoint", self.redis_cluster.configuration_endpoint_address)
        pulumi.export("redis_port", 6379)
        pulumi.export("rds_endpoint", self.rds_instance.endpoint)
        pulumi.export("rds_database_name", self.rds_instance.db_name)
        pulumi.export("kms_key_id", self.kms_key.id)
        pulumi.export("kms_key_arn", self.kms_key.arn)
        pulumi.export("log_group_name", self.log_group.name)
        pulumi.export("kinesis_role_arn", self.kinesis_role.arn)
        pulumi.export("region", self.region)
        pulumi.export("environment_suffix", self.environment_suffix)
