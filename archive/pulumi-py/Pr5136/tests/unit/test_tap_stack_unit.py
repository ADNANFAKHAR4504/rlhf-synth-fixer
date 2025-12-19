"""
Unit tests for TapStack using Pulumi mocking.
"""

import unittest
from unittest.mock import Mock, MagicMock, patch
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource creation and calls."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "id": "mock-kms-key-id",
                "arn": "arn:aws:kms:ap-northeast-1:123456789012:key/mock-key-id",
            }
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-mock123",
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-mock-{args.name}",
            }
        elif args.typ == "aws:kinesis/stream:Stream":
            outputs = {
                **args.inputs,
                "id": "mock-kinesis-stream",
                "arn": "arn:aws:kinesis:ap-northeast-1:123456789012:stream/mock-stream",
            }
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs = {
                **args.inputs,
                "id": "mock-redis-cluster",
                "configuration_endpoint_address": "mock-redis-endpoint.cache.amazonaws.com",
            }
        elif args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "id": "mock-rds-instance",
                "endpoint": "mock-rds.amazonaws.com:5432",
                "db_name": "transactions",
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                **args.inputs,
                "id": "mock-log-group",
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": "mock-iam-role",
                "arn": "arn:aws:iam::123456789012:role/mock-role",
                "assume_role_policy": args.inputs.get("assume_role_policy", "{}"),
            }
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs = {
                **args.inputs,
                "id": "mock-iam-policy",
            }
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs = {
                **args.inputs,
                "id": "mock-policy-attachment",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-mock-{args.name}",
            }
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {
                **args.inputs,
                "id": "mock-subnet-group",
            }
        elif args.typ == "aws:elasticache/subnetGroup:SubnetGroup":
            outputs = {
                **args.inputs,
                "id": "mock-cache-subnet-group",
            }
        elif args.typ == "aws:elasticache/parameterGroup:ParameterGroup":
            outputs = {
                **args.inputs,
                "id": "mock-param-group",
                "name": f"mock-param-{args.name}",
            }
        elif args.typ == "aws:kms/alias:Alias":
            outputs = {
                **args.inputs,
                "id": "mock-kms-alias",
            }
        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {
                "account_id": "123456789012",
                "arn": "arn:aws:iam::123456789012:user/mock-user",
                "user_id": "MOCK123456",
            }
        elif args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {
                "json": '{"Version": "2012-10-17", "Statement": []}',
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack."""

    @pulumi.runtime.test
    def test_stack_creates_kms_key(self):
        """Test that KMS key is created with correct configuration."""
        from lib.tap_stack import TapStack

        def check_kms(args):
            kms_key = args[0]
            self.assertEqual(kms_key["description"], "KMS key for transaction monitoring system test-env")
            self.assertEqual(kms_key["deletion_window_in_days"], 10)
            self.assertEqual(kms_key["enable_key_rotation"], True)
            self.assertIn("Name", kms_key["tags"])
            self.assertEqual(kms_key["tags"]["ManagedBy"], "Pulumi")

        stack = TapStack("test-env", "ap-northeast-1")
        pulumi.Output.all(stack.kms_key.description, stack.kms_key.deletion_window_in_days,
                         stack.kms_key.enable_key_rotation, stack.kms_key.tags).apply(
            lambda args: check_kms([{
                "description": args[0],
                "deletion_window_in_days": args[1],
                "enable_key_rotation": args[2],
                "tags": args[3]
            }])
        )

    @pulumi.runtime.test
    def test_stack_creates_vpc(self):
        """Test that VPC is created with correct configuration."""
        from lib.tap_stack import TapStack

        def check_vpc(args):
            vpc = args[0]
            self.assertEqual(vpc["cidr_block"], "10.0.0.0/16")
            self.assertEqual(vpc["enable_dns_hostnames"], True)
            self.assertEqual(vpc["enable_dns_support"], True)

        stack = TapStack("test-env", "ap-northeast-1")
        pulumi.Output.all(stack.vpc.cidr_block, stack.vpc.enable_dns_hostnames,
                         stack.vpc.enable_dns_support).apply(
            lambda args: check_vpc([{
                "cidr_block": args[0],
                "enable_dns_hostnames": args[1],
                "enable_dns_support": args[2]
            }])
        )

    @pulumi.runtime.test
    def test_stack_creates_subnets(self):
        """Test that private subnets are created in multiple AZs."""
        from lib.tap_stack import TapStack

        stack = TapStack("test-env", "ap-northeast-1")
        self.assertEqual(len(stack.private_subnets), 3)

        def check_subnet_0(args):
            self.assertEqual(args[0], "10.0.1.0/24")
            self.assertEqual(args[1], "ap-northeast-1a")

        pulumi.Output.all(stack.private_subnets[0].cidr_block,
                         stack.private_subnets[0].availability_zone).apply(check_subnet_0)

    @pulumi.runtime.test
    def test_stack_creates_kinesis_stream(self):
        """Test that Kinesis stream is created with correct configuration."""
        from lib.tap_stack import TapStack

        def check_kinesis(args):
            kinesis = args[0]
            self.assertEqual(kinesis["name"], "transaction-stream-test-env")
            self.assertEqual(kinesis["shard_count"], 2)
            self.assertEqual(kinesis["retention_period"], 24)
            self.assertEqual(kinesis["encryption_type"], "KMS")

        stack = TapStack("test-env", "ap-northeast-1")
        pulumi.Output.all(stack.kinesis_stream.name, stack.kinesis_stream.shard_count,
                         stack.kinesis_stream.retention_period,
                         stack.kinesis_stream.encryption_type).apply(
            lambda args: check_kinesis([{
                "name": args[0],
                "shard_count": args[1],
                "retention_period": args[2],
                "encryption_type": args[3]
            }])
        )

    @pulumi.runtime.test
    def test_stack_creates_redis_cluster(self):
        """Test that Redis cluster is created with Multi-AZ configuration."""
        from lib.tap_stack import TapStack

        def check_redis(args):
            redis = args[0]
            self.assertEqual(redis["replication_group_id"], "redis-test-env")
            self.assertEqual(redis["engine"], "redis")
            self.assertEqual(redis["engine_version"], "7.0")
            self.assertEqual(redis["num_cache_clusters"], 2)
            self.assertEqual(redis["automatic_failover_enabled"], True)
            self.assertEqual(redis["multi_az_enabled"], True)
            self.assertEqual(redis["at_rest_encryption_enabled"], True)
            self.assertEqual(redis["transit_encryption_enabled"], True)

        stack = TapStack("test-env", "ap-northeast-1")
        pulumi.Output.all(
            stack.redis_cluster.replication_group_id,
            stack.redis_cluster.engine,
            stack.redis_cluster.engine_version,
            stack.redis_cluster.num_cache_clusters,
            stack.redis_cluster.automatic_failover_enabled,
            stack.redis_cluster.multi_az_enabled,
            stack.redis_cluster.at_rest_encryption_enabled,
            stack.redis_cluster.transit_encryption_enabled
        ).apply(
            lambda args: check_redis([{
                "replication_group_id": args[0],
                "engine": args[1],
                "engine_version": args[2],
                "num_cache_clusters": args[3],
                "automatic_failover_enabled": args[4],
                "multi_az_enabled": args[5],
                "at_rest_encryption_enabled": args[6],
                "transit_encryption_enabled": args[7]
            }])
        )

    @pulumi.runtime.test
    def test_stack_creates_rds_instance(self):
        """Test that RDS instance is created with Multi-AZ configuration."""
        from lib.tap_stack import TapStack

        def check_rds(args):
            rds = args[0]
            self.assertEqual(rds["identifier"], "txdb-test-env")
            self.assertEqual(rds["engine"], "postgres")
            self.assertEqual(rds["engine_version"], "15.7")
            self.assertEqual(rds["multi_az"], True)
            self.assertEqual(rds["storage_encrypted"], True)
            self.assertEqual(rds["deletion_protection"], False)
            self.assertEqual(rds["skip_final_snapshot"], True)

        stack = TapStack("test-env", "ap-northeast-1")
        pulumi.Output.all(
            stack.rds_instance.identifier,
            stack.rds_instance.engine,
            stack.rds_instance.engine_version,
            stack.rds_instance.multi_az,
            stack.rds_instance.storage_encrypted,
            stack.rds_instance.deletion_protection,
            stack.rds_instance.skip_final_snapshot
        ).apply(
            lambda args: check_rds([{
                "identifier": args[0],
                "engine": args[1],
                "engine_version": args[2],
                "multi_az": args[3],
                "storage_encrypted": args[4],
                "deletion_protection": args[5],
                "skip_final_snapshot": args[6]
            }])
        )

    @pulumi.runtime.test
    def test_stack_creates_security_groups(self):
        """Test that security groups are created correctly."""
        from lib.tap_stack import TapStack

        stack = TapStack("test-env", "ap-northeast-1")

        # Check RDS security group
        def check_rds_sg(args):
            ingress = args[0]
            self.assertEqual(ingress[0]["protocol"], "tcp")
            self.assertEqual(ingress[0]["from_port"], 5432)
            self.assertEqual(ingress[0]["to_port"], 5432)

        pulumi.Output.all(stack.rds_sg.ingress).apply(check_rds_sg)

        # Check Redis security group
        def check_redis_sg(args):
            ingress = args[0]
            self.assertEqual(ingress[0]["protocol"], "tcp")
            self.assertEqual(ingress[0]["from_port"], 6379)
            self.assertEqual(ingress[0]["to_port"], 6379)

        pulumi.Output.all(stack.redis_sg.ingress).apply(check_redis_sg)

    @pulumi.runtime.test
    def test_stack_uses_environment_suffix(self):
        """Test that environment suffix is used consistently in resource names."""
        from lib.tap_stack import TapStack

        stack = TapStack("my-test-suffix", "ap-northeast-1")
        self.assertEqual(stack.environment_suffix, "my-test-suffix")

    @pulumi.runtime.test
    def test_stack_creates_cloudwatch_log_group(self):
        """Test that CloudWatch log group is created with KMS encryption."""
        from lib.tap_stack import TapStack

        def check_log_group(args):
            log_group = args[0]
            self.assertEqual(log_group["name"], "/aws/transaction-monitoring/test-env")
            self.assertEqual(log_group["retention_in_days"], 7)

        stack = TapStack("test-env", "ap-northeast-1")
        pulumi.Output.all(stack.log_group.name, stack.log_group.retention_in_days).apply(
            lambda args: check_log_group([{
                "name": args[0],
                "retention_in_days": args[1]
            }])
        )

    @pulumi.runtime.test
    def test_stack_creates_iam_role(self):
        """Test that IAM role is created for Kinesis access."""
        from lib.tap_stack import TapStack

        def check_role(args):
            role_name = args[0]
            self.assertEqual(role_name, "kinesis-role-test-env")

        stack = TapStack("test-env", "ap-northeast-1")
        pulumi.Output.all(stack.kinesis_role.name).apply(check_role)


if __name__ == "__main__":
    unittest.main()
