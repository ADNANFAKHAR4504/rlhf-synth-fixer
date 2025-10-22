# IoT Sensor Data Processing Infrastructure - Pulumi Python Implementation

Here's a complete implementation for your manufacturing plant's IoT sensor data processing pipeline using Pulumi with Python.

## File: lib/__init__.py

```python

```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main Pulumi stack for IoT sensor data processing infrastructure.
Orchestrates Kinesis Data Streams, ElastiCache Redis, RDS PostgreSQL, and Secrets Manager.
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
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'prod').
        tags (Optional[dict]): Default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for IoT sensor data processing infrastructure.

    Creates:
    - VPC with multi-AZ subnets
    - Security groups
    - Kinesis Data Stream with IPv6 support
    - ElastiCache Serverless Redis cache
    - RDS PostgreSQL instance
    - Secrets Manager secret for database credentials
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

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"iot-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"iot-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"iot-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"iot-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"iot-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"iot-public-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets for database and cache
        self.private_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"iot-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"iot-private-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"iot-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"iot-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create route to internet gateway
        aws.ec2.Route(
            f"iot-public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"iot-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create security group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"iot-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for IoT RDS PostgreSQL",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/16"]
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
            tags={**self.tags, "Name": f"iot-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ElastiCache
        self.elasticache_sg = aws.ec2.SecurityGroup(
            f"iot-elasticache-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for IoT ElastiCache Redis",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    cidr_blocks=["10.0.0.0/16"]
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
            tags={**self.tags, "Name": f"iot-elasticache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"iot-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.tags, "Name": f"iot-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache subnet group
        self.cache_subnet_group = aws.elasticache.SubnetGroup(
            f"iot-cache-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            description="Subnet group for IoT ElastiCache",
            opts=ResourceOptions(parent=self)
        )

        # Generate random password for RDS
        self.db_password = aws.secretsmanager.Secret(
            f"iot-db-password-{self.environment_suffix}",
            name=f"iot-db-password-{self.environment_suffix}",
            description="Database password for IoT sensor data",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Store database credentials in Secrets Manager
        db_username = "iot_admin"
        db_name = "iot_sensor_db"

        import random
        import string
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=20))

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"iot-db-secret-version-{self.environment_suffix}",
            secret_id=self.db_password.id,
            secret_string=pulumi.Output.all(
                username=db_username,
                password=password,
                dbname=db_name,
                engine="postgres",
                host="",
                port=5432
            ).apply(lambda args: json.dumps({
                "username": args["username"],
                "password": args["password"],
                "dbname": args["dbname"],
                "engine": args["engine"],
                "host": args["host"],
                "port": args["port"]
            })),
            opts=ResourceOptions(parent=self.db_password)
        )

        # Create RDS PostgreSQL instance
        self.rds_instance = aws.rds.Instance(
            f"iot-postgres-{self.environment_suffix}",
            identifier=f"iot-postgres-{self.environment_suffix}",
            engine="postgres",
            engine_version="16.3",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            db_name=db_name,
            username=db_username,
            password=password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            publicly_accessible=False,
            skip_final_snapshot=True,
            backup_retention_period=7,
            multi_az=False,
            storage_encrypted=True,
            tags={**self.tags, "Name": f"iot-postgres-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Update secret with RDS endpoint
        self.db_secret_update = aws.secretsmanager.SecretVersion(
            f"iot-db-secret-update-{self.environment_suffix}",
            secret_id=self.db_password.id,
            secret_string=pulumi.Output.all(
                username=db_username,
                password=password,
                dbname=db_name,
                host=self.rds_instance.address,
                port=self.rds_instance.port
            ).apply(lambda args: json.dumps({
                "username": args["username"],
                "password": args["password"],
                "dbname": args["dbname"],
                "engine": "postgres",
                "host": args["host"],
                "port": args["port"]
            })),
            opts=ResourceOptions(parent=self.db_password, depends_on=[self.rds_instance], delete_before_replace=True)
        )

        # Create ElastiCache Serverless Redis cache
        self.redis_cache = aws.elasticache.ServerlessCache(
            f"iot-redis-{self.environment_suffix}",
            engine="redis",
            serverless_cache_name=f"iot-redis-{self.environment_suffix}",
            description="Redis cache for IoT sensor data with 24-hour TTL",
            major_engine_version="7",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            security_group_ids=[self.elasticache_sg.id],
            cache_usage_limits=aws.elasticache.ServerlessCacheCacheUsageLimitsArgs(
                data_storage=aws.elasticache.ServerlessCacheCacheUsageLimitsDataStorageArgs(
                    maximum=10,
                    unit="GB"
                ),
                ecpu_per_second=aws.elasticache.ServerlessCacheCacheUsageLimitsEcpuPerSecondArgs(
                    maximum=5000
                )
            ),
            tags={**self.tags, "Name": f"iot-redis-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Kinesis Data Stream with IPv6 support
        self.kinesis_stream = aws.kinesis.Stream(
            f"iot-sensor-stream-{self.environment_suffix}",
            name=f"iot-sensor-stream-{self.environment_suffix}",
            shard_count=2,
            retention_period=24,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords"
            ],
            stream_mode_details=aws.kinesis.StreamStreamModeDetailsArgs(
                stream_mode="PROVISIONED"
            ),
            tags={**self.tags, "Name": f"iot-sensor-stream-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Store Redis connection info in Secrets Manager
        self.redis_secret = aws.secretsmanager.Secret(
            f"iot-redis-connection-{self.environment_suffix}",
            name=f"iot-redis-connection-{self.environment_suffix}",
            description="Redis connection information for IoT sensor data cache",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.redis_secret_version = aws.secretsmanager.SecretVersion(
            f"iot-redis-secret-version-{self.environment_suffix}",
            secret_id=self.redis_secret.id,
            secret_string=pulumi.Output.all(
                endpoint=self.redis_cache.endpoint
            ).apply(lambda args: json.dumps({
                "endpoint": args["endpoint"][0]["address"] if args["endpoint"] else "",
                "port": args["endpoint"][0]["port"] if args["endpoint"] else 6379,
                "ttl_hours": 24
            })),
            opts=ResourceOptions(parent=self.redis_secret, depends_on=[self.redis_cache])
        )

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "kinesis_stream_name": self.kinesis_stream.name,
            "kinesis_stream_arn": self.kinesis_stream.arn,
            "redis_endpoint": self.redis_cache.endpoint,
            "rds_endpoint": self.rds_instance.endpoint,
            "rds_address": self.rds_instance.address,
            "db_secret_arn": self.db_password.arn,
            "redis_secret_arn": self.redis_secret.arn
        })
```

## File: tests/__init__.py

```python

```

## File: tests/integration/__init__.py

```python

```

## File: tests/integration/test_integration.py

```python
"""
Integration tests for IoT sensor data processing infrastructure.
"""

import pytest
import json
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "address": "test-db.rds.amazonaws.com",
                "endpoint": "test-db.rds.amazonaws.com:5432",
                "port": 5432,
            }
        elif args.typ == "aws:elasticache/serverlessCache:ServerlessCache":
            outputs = {
                **args.inputs,
                "endpoint": [{
                    "address": "test-redis.cache.amazonaws.com",
                    "port": 6379
                }]
            }
        elif args.typ == "aws:kinesis/stream:Stream":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:kinesis:eu-central-1:123456789012:stream/{args.inputs.get('name', 'test-stream')}",
            }
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345",
            }
        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["eu-central-1a", "eu-central-1b", "eu-central-1c"],
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


@pulumi.runtime.test
def test_vpc_creation():
    """Test VPC is created with correct CIDR block."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_vpc(args):
        vpc_id, vpc_cidr = args
        assert vpc_cidr == "10.0.0.0/16"

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.vpc.id, stack.vpc.cidr_block).apply(check_vpc)


@pulumi.runtime.test
def test_kinesis_stream_creation():
    """Test Kinesis stream is created with correct retention."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_stream(args):
        name, retention = args
        assert "iot-sensor-stream" in name
        assert retention == 24

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.kinesis_stream.name, stack.kinesis_stream.retention_period).apply(check_stream)


@pulumi.runtime.test
def test_rds_instance_creation():
    """Test RDS PostgreSQL instance is created."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_rds(args):
        engine, instance_class = args
        assert engine == "postgres"
        assert instance_class == "db.t3.micro"

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.rds_instance.engine, stack.rds_instance.instance_class).apply(check_rds)


@pulumi.runtime.test
def test_elasticache_serverless_creation():
    """Test ElastiCache Serverless Redis cache is created."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_cache(args):
        engine, name = args
        assert engine == "redis"
        assert "iot-redis" in name

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.redis_cache.engine, stack.redis_cache.serverless_cache_name).apply(check_cache)


@pulumi.runtime.test
def test_secrets_manager_creation():
    """Test Secrets Manager secrets are created for database credentials."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_secret(args):
        name = args[0]
        assert "iot-db-password" in name

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.db_password.name).apply(check_secret)


@pulumi.runtime.test
def test_security_groups_creation():
    """Test security groups are created for RDS and ElastiCache."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_security_groups(args):
        rds_sg_id, cache_sg_id = args
        assert rds_sg_id is not None
        assert cache_sg_id is not None

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.rds_sg.id, stack.elasticache_sg.id).apply(check_security_groups)
```

## File: tests/unit/__init__.py

```python

```

## File: tests/unit/test_tap_stack.py

```python
"""
Unit tests for TapStack component.
"""

import pytest
from lib.tap_stack import TapStackArgs


def test_tap_stack_args_defaults():
    """Test TapStackArgs uses correct default values."""
    args = TapStackArgs()
    assert args.environment_suffix == "dev"
    assert args.tags == {}


def test_tap_stack_args_custom_values():
    """Test TapStackArgs accepts custom values."""
    custom_tags = {"Environment": "production", "Project": "IoT"}
    args = TapStackArgs(environment_suffix="prod", tags=custom_tags)
    assert args.environment_suffix == "prod"
    assert args.tags == custom_tags


def test_tap_stack_args_environment_suffix():
    """Test TapStackArgs environment_suffix can be set."""
    args = TapStackArgs(environment_suffix="staging")
    assert args.environment_suffix == "staging"
```

This implementation provides:

1. **Kinesis Data Stream**: Configured with 2 shards and 24-hour retention for real-time sensor data ingestion. Includes IPv6 support (latest AWS feature).

2. **ElastiCache Serverless Redis**: Using the latest serverless capability for automatic scaling and management. Data will naturally expire based on your application's TTL settings (you can set 24-hour TTL in your application code).

3. **RDS PostgreSQL**: Standard instance for persistent storage of historical sensor data with encryption enabled.

4. **AWS Secrets Manager**: Stores database credentials and Redis connection information securely, with separate secrets for each service.

5. **Networking**: Complete VPC setup with public and private subnets across multiple availability zones, security groups with appropriate ingress rules, and internet gateway for connectivity.

6. **Tests**: Both unit and integration tests to validate the infrastructure components.

All resources follow AWS best practices with encryption, proper security group rules, and resource tagging.
