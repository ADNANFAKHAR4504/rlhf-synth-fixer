"""
Unit tests for TapStack component.
"""

import pytest
import pulumi


@pulumi.runtime.test
def test_tap_stack_args_defaults():
    """Test TapStackArgs uses correct default values."""
    from lib.tap_stack import TapStackArgs
    args = TapStackArgs()
    assert args.environment_suffix == "dev"
    assert args.tags == {}


@pulumi.runtime.test
def test_tap_stack_args_custom_values():
    """Test TapStackArgs accepts custom values."""
    from lib.tap_stack import TapStackArgs
    custom_tags = {"Environment": "production", "Project": "IoT"}
    args = TapStackArgs(environment_suffix="prod", tags=custom_tags)
    assert args.environment_suffix == "prod"
    assert args.tags == custom_tags


@pulumi.runtime.test
def test_tap_stack_args_environment_suffix():
    """Test TapStackArgs environment_suffix can be set."""
    from lib.tap_stack import TapStackArgs
    args = TapStackArgs(environment_suffix="staging")
    assert args.environment_suffix == "staging"


class MyMocks(pulumi.runtime.Mocks):
    """Mock for Pulumi resources."""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "address": "test-db.rds.amazonaws.com",
                "endpoint": "test-db.rds.amazonaws.com:5432",
                "port": 5432,
                "arn": "arn:aws:rds:eu-central-1:123456789012:db:test-db"
            }
        elif args.typ == "aws:elasticache/serverlessCache:ServerlessCache":
            outputs = {
                **args.inputs,
                "endpoints": [{
                    "address": "test-redis.cache.amazonaws.com",
                    "port": 6379
                }],
                "arn": "arn:aws:elasticache:eu-central-1:123456789012:serverlesscache:test-redis"
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
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name[:8]}",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-{args.name[:8]}",
            }
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:secretsmanager:eu-central-1:123456789012:secret:{args.inputs.get('name', 'test-secret')}",
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
        assert vpc_id is not None

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.vpc.id, stack.vpc.cidr_block).apply(check_vpc)


@pulumi.runtime.test
def test_kinesis_stream_creation():
    """Test Kinesis stream is created with correct retention."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_stream(args):
        name, retention, shard_count = args
        assert "iot-sensor-stream" in name
        assert retention == 24
        assert shard_count == 2

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(
        stack.kinesis_stream.name,
        stack.kinesis_stream.retention_period,
        stack.kinesis_stream.shard_count
    ).apply(check_stream)


@pulumi.runtime.test
def test_rds_instance_creation():
    """Test RDS PostgreSQL instance is created."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_rds(args):
        engine, instance_class, storage_encrypted = args
        assert engine == "postgres"
        assert instance_class == "db.t3.micro"
        assert storage_encrypted is True

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(
        stack.rds_instance.engine,
        stack.rds_instance.instance_class,
        stack.rds_instance.storage_encrypted
    ).apply(check_rds)


@pulumi.runtime.test
def test_elasticache_serverless_creation():
    """Test ElastiCache Serverless Redis cache is created."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_cache(args):
        engine, name, major_version = args
        assert engine == "redis"
        assert "iot-redis" in name
        assert major_version == "7"

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(
        stack.redis_cache.engine,
        stack.redis_cache.name,
        stack.redis_cache.major_engine_version
    ).apply(check_cache)


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


@pulumi.runtime.test
def test_subnets_creation():
    """Test public and private subnets are created."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_subnets(args):
        public_count, private_count = args
        assert public_count == 2
        assert private_count == 2

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(
        len(stack.public_subnets),
        len(stack.private_subnets)
    ).apply(check_subnets)


@pulumi.runtime.test
def test_internet_gateway_creation():
    """Test Internet Gateway is created."""
    from lib.tap_stack import TapStack, TapStackArgs

    def check_igw(args):
        igw_id, vpc_id = args
        assert igw_id is not None
        assert vpc_id is not None

    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
    return pulumi.Output.all(stack.igw.id, stack.igw.vpc_id).apply(check_igw)


@pulumi.runtime.test
def test_tags_applied():
    """Test tags are applied to resources."""
    from lib.tap_stack import TapStack, TapStackArgs

    custom_tags = {"Project": "IoT", "Environment": "test"}
    stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

    def check_tags(tags):
        assert tags.get("Project") == "IoT"
        assert tags.get("Environment") == "test"

    return stack.vpc.tags.apply(check_tags)
