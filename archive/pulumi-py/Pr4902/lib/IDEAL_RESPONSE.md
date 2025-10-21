# IDEAL_RESPONSE.md — HIPAA-Compliant Monitoring Stack (Pulumi Python) 

---

## Files Represented

- `lib/tap_stack.py` — Pulumi component implementing VPC, Kinesis, RDS (Multi‑AZ), ElastiCache Redis, Secrets Manager, IAM, and exports used by tests.

---

## lib/tap_stack.py

```python
"""
tap_stack.py

HIPAA-Compliant Healthcare Data Pipeline Infrastructure

This module defines the TapStack class for deploying a HIPAA-compliant monitoring system
for healthcare data processing. It creates:
- VPC with private subnets and NAT Gateway
- Amazon Kinesis for data streaming
- Amazon RDS (PostgreSQL) with encryption and 30-day backups
- Amazon ElastiCache Redis for performance metrics
- AWS Secrets Manager for credential management
- Security groups and IAM roles with least privilege access
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws
import pulumi_random as random


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for HIPAA-compliant healthcare data pipeline infrastructure.

    This component creates:
    - VPC with public and private subnets across 2 AZs
    - NAT Gateway for outbound connectivity
    - Kinesis stream for patient data ingestion
    - RDS PostgreSQL with Multi-AZ, encryption, and 30-day backups
    - ElastiCache Redis with encryption
    - Secrets Manager for credentials
    - Security groups and IAM roles

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments.
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

        # Region awareness for tests/exports
        region_info = aws.get_region()
        self.region = region_info.name if hasattr(region_info, "name") else region_info.id

        # ---------------------
        # Networking
        # ---------------------
        self.vpc = aws.ec2.Vpc(
            f"medtech-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"medtech-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.igw = aws.ec2.InternetGateway(
            f"medtech-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"medtech-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        azs = aws.get_availability_zones(state="available")

        self.public_subnet_1 = aws.ec2.Subnet(
            f"medtech-public-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=azs.names[0],
            map_public_ip_on_launch=True,
            tags={**self.tags, "Name": f"medtech-public-subnet-1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        self.public_subnet_2 = aws.ec2.Subnet(
            f"medtech-public-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=azs.names[1],
            map_public_ip_on_launch=True,
            tags={**self.tags, "Name": f"medtech-public-subnet-2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.private_subnet_1 = aws.ec2.Subnet(
            f"medtech-private-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=azs.names[0],
            tags={**self.tags, "Name": f"medtech-private-subnet-1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        self.private_subnet_2 = aws.ec2.Subnet(
            f"medtech-private-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=azs.names[1],
            tags={**self.tags, "Name": f"medtech-private-subnet-2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.nat_eip = aws.ec2.Eip(
            f"medtech-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**self.tags, "Name": f"medtech-nat-eip-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        self.nat_gateway = aws.ec2.NatGateway(
            f"medtech-nat-gateway-{self.environment_suffix}",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={**self.tags, "Name": f"medtech-nat-gateway-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.public_route_table = aws.ec2.RouteTable(
            f"medtech-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", gateway_id=self.igw.id)],
            tags={**self.tags, "Name": f"medtech-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        aws.ec2.RouteTableAssociation(
            f"medtech-public-rta-1-{self.environment_suffix}",
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self)
        )
        aws.ec2.RouteTableAssociation(
            f"medtech-public-rta-2-{self.environment_suffix}",
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        self.private_route_table = aws.ec2.RouteTable(
            f"medtech-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", nat_gateway_id=self.nat_gateway.id)],
            tags={**self.tags, "Name": f"medtech-private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        aws.ec2.RouteTableAssociation(
            f"medtech-private-rta-1-{self.environment_suffix}",
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self)
        )
        aws.ec2.RouteTableAssociation(
            f"medtech-private-rta-2-{self.environment_suffix}",
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        # ---------------------
        # Data + Security
        # ---------------------
        self.kinesis_stream = aws.kinesis.Stream(
            f"medtech-kinesis-{self.environment_suffix}",
            name=f"medtech-patient-records-{self.environment_suffix}",
            shard_count=2,
            retention_period=24,
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",
            tags={**self.tags, "Name": f"medtech-kinesis-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.rds_security_group = aws.ec2.SecurityGroup(
            f"medtech-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS PostgreSQL database",
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=5432, to_port=5432, protocol="tcp",
                cidr_blocks=["10.0.0.0/16"], description="Allow PostgreSQL from VPC")],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0, to_port=0, protocol="-1",
                cidr_blocks=["0.0.0.0/0"], description="Allow all outbound")],
            tags={**self.tags, "Name": f"medtech-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.redis_security_group = aws.ec2.SecurityGroup(
            f"medtech-redis-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis",
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=6379, to_port=6379, protocol="tcp",
                cidr_blocks=["10.0.0.0/16"], description="Allow Redis from VPC")],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0, to_port=0, protocol="-1",
                cidr_blocks=["0.0.0.0/0"], description="Allow all outbound")],
            tags={**self.tags, "Name": f"medtech-redis-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.db_subnet_group = aws.rds.SubnetGroup(
            f"medtech-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
            tags={**self.tags, "Name": f"medtech-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.elasticache_subnet_group = aws.elasticache.SubnetGroup(
            f"medtech-elasticache-subnet-group-{self.environment_suffix}",
            subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
            description="Subnet group for ElastiCache Redis",
            opts=ResourceOptions(parent=self)
        )

        # Correct password generation via pulumi-random
        self.rds_password = random.RandomPassword(
            f"medtech-rds-password-{self.environment_suffix}",
            length=32,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?",  # allowed for Secrets
            opts=ResourceOptions(parent=self)
        )

        self.rds_secret = aws.secretsmanager.Secret(
            f"medtech-rds-secret-{self.environment_suffix}",
            name=f"medtech-rds-credentials-{self.environment_suffix}",
            description="RDS PostgreSQL master credentials for patient database",
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        self.rds_secret_version = aws.secretsmanager.SecretVersion(
            f"medtech-rds-secret-version-{self.environment_suffix}",
            secret_id=self.rds_secret.id,
            secret_string=Output.all(self.rds_password.result).apply(
                lambda args: json.dumps({
                    "username": "medtechadmin",
                    "password": args[0],
                    "engine": "postgres",
                    "host": "",
                    "port": 5432,
                    "dbname": "patientdb",
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        self.rds_instance = aws.rds.Instance(
            f"medtech-rds-{self.environment_suffix}",
            identifier=f"medtech-patient-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.8",  # fixed
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            multi_az=True,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group.id],
            username="medtechadmin",
            password=self.rds_password.result,  # correct attribute
            db_name="patientdb",
            backup_retention_period=30,
            backup_window="03:00-04:00",
            maintenance_window="Mon:04:00-Mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            publicly_accessible=False,
            tags={**self.tags, "Name": f"medtech-rds-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.rds_secret_version_update = aws.secretsmanager.SecretVersion(
            f"medtech-rds-secret-version-update-{self.environment_suffix}",
            secret_id=self.rds_secret.id,
            secret_string=Output.all(self.rds_password.result, self.rds_instance.endpoint).apply(
                lambda args: json.dumps({
                    "username": "medtechadmin",
                    "password": args[0],
                    "engine": "postgres",
                    "host": args[1].split(":")[0],
                    "port": 5432,
                    "dbname": "patientdb",
                })
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.rds_instance])
        )

        # Redis auth token rules (ElastiCache constraints)
        self.redis_auth_token = random.RandomPassword(
            f"medtech-redis-auth-token-{self.environment_suffix}",
            length=32,
            special=True,
            override_special="!&#$^<>-",  # allowed by ElastiCache
            opts=ResourceOptions(parent=self)
        )

        self.redis_secret = aws.secretsmanager.Secret(
            f"medtech-redis-secret-{self.environment_suffix}",
            name=f"medtech-redis-credentials-{self.environment_suffix}",
            description="ElastiCache Redis authentication token",
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        self.redis_secret_version = aws.secretsmanager.SecretVersion(
            f"medtech-redis-secret-version-{self.environment_suffix}",
            secret_id=self.redis_secret.id,
            secret_string=Output.all(self.redis_auth_token.result).apply(
                lambda args: json.dumps({"auth_token": args[0]})
            ),
            opts=ResourceOptions(parent=self)
        )

        self.redis_cluster = aws.elasticache.ReplicationGroup(
            f"medtech-redis-{self.environment_suffix}",
            replication_group_id=f"medtech-redis-{self.environment_suffix}",
            description="Redis cluster for performance metrics tracking",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            port=6379,
            parameter_group_name="default.redis7",
            subnet_group_name=self.elasticache_subnet_group.name,
            security_group_ids=[self.redis_security_group.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token=self.redis_auth_token.result,  # correct attribute
            automatic_failover_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="02:00-03:00",
            maintenance_window="sun:05:00-sun:06:00",
            tags={**self.tags, "Name": f"medtech-redis-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ---------------------
        # IAM
        # ---------------------
        self.kinesis_producer_role = aws.iam.Role(
            f"medtech-kinesis-producer-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]
            }),
            tags={**self.tags, "Name": f"medtech-kinesis-producer-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        self.kinesis_producer_policy = aws.iam.RolePolicy(
            f"medtech-kinesis-producer-policy-{self.environment_suffix}",
            role=self.kinesis_producer_role.id,
            policy=self.kinesis_stream.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Action": ["kinesis:PutRecord", "kinesis:PutRecords", "kinesis:DescribeStream"], "Resource": arn}]
            })),
            opts=ResourceOptions(parent=self)
        )

        self.secrets_reader_role = aws.iam.Role(
            f"medtech-secrets-reader-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Principal": {"Service": ["ec2.amazonaws.com", "lambda.amazonaws.com"]}, "Action": "sts:AssumeRole"}]
            }),
            tags={**self.tags, "Name": f"medtech-secrets-reader-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        self.secrets_reader_policy = aws.iam.RolePolicy(
            f"medtech-secrets-reader-policy-{self.environment_suffix}",
            role=self.secrets_reader_role.id,
            policy=Output.all(self.rds_secret.arn, self.redis_secret.arn).apply(
                lambda arns: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{"Effect": "Allow", "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"], "Resource": arns}]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # ---------------------
        # Exports
        # ---------------------
        outputs = {
            "region": self.region,
            "vpc_id": self.vpc.id,
            "public_subnet_ids": [self.public_subnet_1.id, self.public_subnet_2.id],
            "private_subnet_ids": [self.private_subnet_1.id, self.private_subnet_2.id],
            "nat_eip_id": self.nat_eip.id,
            "nat_gateway_id": self.nat_gateway.id,
            "public_route_table_id": self.public_route_table.id,
            "private_route_table_id": self.private_route_table.id,
            "kinesis_stream_name": self.kinesis_stream.name,
            "kinesis_stream_arn": self.kinesis_stream.arn,
            "rds_instance_identifier": self.rds_instance.identifier,
            "rds_endpoint": self.rds_instance.endpoint,
            "rds_port": self.rds_instance.port,
            "rds_secret_arn": self.rds_secret.arn,
            "rds_security_group_id": self.rds_security_group.id,
            "redis_primary_endpoint": self.redis_cluster.primary_endpoint_address,
            "redis_reader_endpoint": self.redis_cluster.reader_endpoint_address,
            "redis_port": self.redis_cluster.port,
            "redis_secret_arn": self.redis_secret.arn,
            "redis_security_group_id": self.redis_security_group.id,
            "db_subnet_group_name": self.db_subnet_group.name,
            "elasticache_subnet_group_name": self.elasticache_subnet_group.name,
            "kinesis_producer_role_arn": self.kinesis_producer_role.arn,
            "secrets_reader_role_arn": self.secrets_reader_role.arn,
        }

        self.register_outputs(outputs)

        # If used as root program, also export for convenience
        if opts is None or getattr(opts, "parent", None) is None:
            for key, value in outputs.items():
                pulumi.export(key, value)
```

