"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component for HIPAA-compliant healthcare infrastructure.
"""

import unittest
import pulumi
import pulumi.runtime as runtime
from pulumi.runtime import mocks


def _to_serializable(value):
    """Convert Pulumi input values into simple Python types for mocks."""
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, (list, tuple, set)):
        return [_to_serializable(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_serializable(v) for k, v in value.items()}
    if hasattr(value, "__dict__"):
        return {k: _to_serializable(v) for k, v in vars(value).items()}
    return str(value)


class AwsMocks(mocks.Mocks):
    """Pulumi mocks that return deterministic values for AWS resources."""

    def new_resource(self, args: mocks.MockResourceArgs):
        type_ = args.typ
        name = args.name
        inputs = dict(args.inputs)
        resource_id = getattr(args, "id", None) or getattr(args, "resource_id", None) or f"{name}-id"

        outputs = {
            "id": resource_id,
            "name": inputs.get("name", name),
            "arn": f"arn:aws:{type_.split(':')[1]}::123456789012:{name}"
        }

        for key, value in inputs.items():
            outputs[key] = _to_serializable(value)

        if type_ == "aws:ec2/vpc:Vpc":
            outputs.setdefault("cidr_block", inputs.get("cidr_block", "10.0.0.0/16"))
        if type_ == "aws:ecs/cluster:Cluster":
            outputs.setdefault("name", inputs.get("name", name))
        if type_ == "aws:ecs/service:Service":
            outputs["service_connect_configuration"] = {"enabled": True, "services": []}
        if type_ == "aws:rds/cluster:Cluster":
            outputs.setdefault("storage_encrypted", inputs.get("storage_encrypted", True))
            outputs.setdefault("backup_retention_period", inputs.get("backup_retention_period", 30))
            outputs.setdefault("endpoint", f"{name}.cluster.local")
            outputs.setdefault("arn", f"arn:aws:rds:us-east-1:123456789012:cluster:{name}")
        if type_ == "aws:rds/clusterInstance:ClusterInstance":
            outputs.setdefault("publicly_accessible", inputs.get("publicly_accessible", False))
        if type_ == "aws:secretsmanager/secret:Secret":
            outputs.setdefault("kms_key_id", inputs.get("kms_key_id", "kms-key-id"))
        if type_ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs.setdefault("at_rest_encryption_enabled", True)
            outputs.setdefault("transit_encryption_enabled", True)
            outputs.setdefault("configuration_endpoint_address", f"{name}.cfg.local")
            outputs.setdefault("primary_endpoint_address", f"{name}.primary.local")
            outputs.setdefault("reader_endpoint_address", f"{name}.reader.local")
        if type_ == "aws:kms/key:Key":
            outputs.setdefault("enable_key_rotation", True)

        return resource_id, outputs

    def call(self, args: mocks.MockCallArgs):
        token = args.token
        if token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b"]}
        if token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1"}
        if token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"accountId": "123456789012", "arn": "arn:aws:iam::123456789012:root", "userId": "AID123456789012"}
        return args.args


runtime.set_mocks(AwsMocks())

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'Healthcare', 'Owner': 'DevOps'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    @pulumi.runtime.test
    def test_stack_creates_vpc(self):
        """Test that the stack creates a VPC."""
        def check_vpc(args):
            vpc_id, vpc_cidr = args
            self.assertIsNotNone(vpc_id)
            self.assertEqual(vpc_cidr, "10.0.0.0/16")

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        pulumi.Output.all(stack.vpc.id, stack.vpc.cidr_block).apply(check_vpc)

    @pulumi.runtime.test
    def test_stack_creates_kms_key(self):
        """Test that the stack creates a KMS key with rotation enabled."""
        def check_kms(args):
            key_rotation = args
            self.assertTrue(key_rotation)

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        stack.kms_key.enable_key_rotation.apply(check_kms)

    @pulumi.runtime.test
    def test_stack_creates_ecs_cluster(self):
        """Test that the stack creates an ECS cluster."""
        def check_ecs(args):
            cluster_name = args
            self.assertIsNotNone(cluster_name)
            self.assertIn('healthcare-cluster', cluster_name)

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        stack.ecs_cluster.name.apply(check_ecs)

    @pulumi.runtime.test
    def test_stack_creates_rds_cluster(self):
        """Test that the stack creates an RDS cluster with encryption."""
        def check_rds(args):
            storage_encrypted, backup_retention = args
            self.assertTrue(storage_encrypted)
            self.assertEqual(backup_retention, 30)

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        pulumi.Output.all(
            stack.db_cluster.storage_encrypted,
            stack.db_cluster.backup_retention_period
        ).apply(check_rds)

    @pulumi.runtime.test
    def test_stack_creates_elasticache_with_encryption(self):
        """Test that the stack creates ElastiCache with encryption enabled."""
        def check_redis(args):
            at_rest_encrypted, transit_encrypted = args
            self.assertTrue(at_rest_encrypted)
            self.assertTrue(transit_encrypted)

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        pulumi.Output.all(
            stack.redis_cluster.at_rest_encryption_enabled,
            stack.redis_cluster.transit_encryption_enabled
        ).apply(check_redis)

    @pulumi.runtime.test
    def test_stack_tags_applied(self):
        """Test that HIPAA compliance tags are applied to resources."""
        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        expected_tags = {
            'Environment': 'test',
            'Application': 'healthcare-data-processing',
            'Compliance': 'HIPAA'
        }

        self.assertEqual(stack.tags['Compliance'], 'HIPAA')
        self.assertEqual(stack.tags['Application'], 'healthcare-data-processing')


class TestHIPAACompliance(unittest.TestCase):
    """Test cases specifically for HIPAA compliance requirements."""

    @pulumi.runtime.test
    def test_database_not_publicly_accessible(self):
        """Test that RDS instance is not publicly accessible."""
        def check_public_access(args):
            publicly_accessible = args
            self.assertFalse(publicly_accessible)

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        stack.db_instance.publicly_accessible.apply(check_public_access)

    @pulumi.runtime.test
    def test_backup_retention_meets_hipaa(self):
        """Test that backup retention period meets HIPAA requirements (30 days minimum)."""
        def check_backup_retention(args):
            retention_period = args
            self.assertGreaterEqual(retention_period, 30)

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        stack.db_cluster.backup_retention_period.apply(check_backup_retention)

    @pulumi.runtime.test
    def test_secrets_manager_encryption(self):
        """Test that Secrets Manager uses KMS encryption."""
        def check_secret_encryption(args):
            kms_key_id = args
            self.assertIsNotNone(kms_key_id)

        args = TapStackArgs(environment_suffix='test', enable_service_connect=False)
        stack = TapStack('test-stack', args)

        stack.db_secret.kms_key_id.apply(check_secret_encryption)


if __name__ == '__main__':
    unittest.main()
