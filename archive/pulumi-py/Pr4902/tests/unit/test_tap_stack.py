"""
Unit tests for tap_stack using Pulumi mocks.
"""

import unittest
from typing import Any, Dict

import pulumi
import pulumi.runtime as runtime
from pulumi.runtime import mocks

from lib.tap_stack import TapStack, TapStackArgs


def _serialize(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, (list, tuple, set)):
        return [_serialize(v) for v in value]
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if hasattr(value, "__dict__"):
        return {k: _serialize(v) for k, v in vars(value).items()}
    return str(value)


class AwsMocks(mocks.Mocks):
    """Pulumi mocks that provide deterministic outputs for AWS resources."""

    def new_resource(self, args: mocks.MockResourceArgs):
        typ = args.typ
        name = args.name
        inputs = dict(args.inputs)
        resource_id = getattr(args, "id", None) or getattr(args, "resource_id", None) or f"{name}-id"

        outputs: Dict[str, Any] = {
            "id": resource_id,
            "arn": f"arn:aws:{typ.split(':')[1]}::123456789012:{name}",
            "name": inputs.get("name", name),
        }

        for key, value in inputs.items():
            outputs[key] = _serialize(value)

        if typ == "aws:ec2/vpc:Vpc":
            outputs.setdefault("cidr_block", inputs.get("cidr_block", "10.0.0.0/16"))
        if typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs.setdefault("name", inputs.get("name", f"{name}-name"))
        if typ == "aws:elasticache/subnetGroup:SubnetGroup":
            outputs.setdefault("name", inputs.get("name", f"{name}-name"))
        if typ == "aws:rds/instance:Instance":
            outputs.setdefault("endpoint", "db.example.amazonaws.com:5432")
            outputs.setdefault("port", 5432)
            outputs.setdefault("identifier", inputs.get("identifier", name))
        if typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs.setdefault("primary_endpoint_address", "redis-primary.example.amazonaws.com")
            outputs.setdefault("reader_endpoint_address", "redis-reader.example.amazonaws.com")
            outputs.setdefault("port", 6379)
        if typ == "aws:secretsmanager/secret:Secret":
            outputs.setdefault("arn", f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{name}")
        if typ == "aws:iam/role:Role":
            outputs.setdefault(
                "arn", f"arn:aws:iam::123456789012:role/{inputs.get('name', name)}"
            )

        return resource_id, outputs

    def call(self, args: mocks.MockCallArgs):
        token = args.token
        if token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b"]}
        if token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1"}
        return {}


runtime.set_mocks(AwsMocks())


class TestTapStack(unittest.TestCase):
    """Unit tests that validate high-level configuration."""

    def setUp(self):
        self.args = TapStackArgs(environment_suffix="test")

    @pulumi.runtime.test
    def test_vpc_created_with_subnets(self):
        stack = TapStack("unit-test-stack", self.args)

        def check(values):
            vpc_id, public_ids, private_ids = values
            self.assertTrue(vpc_id.startswith("medtech-vpc"), "VPC id naming mismatch")
            self.assertEqual(len(public_ids), 2)
            self.assertEqual(len(private_ids), 2)
            return True

        return pulumi.Output.all(
            stack.vpc.id,
            [stack.public_subnet_1.id, stack.public_subnet_2.id],
            [stack.private_subnet_1.id, stack.private_subnet_2.id],
        ).apply(check)

    @pulumi.runtime.test
    def test_kinesis_stream_encrypted(self):
        stack = TapStack("unit-test-stack-kinesis", self.args)

        def check(values):
            name, encryption, kms = values
            self.assertIn("medtech-patient-records", name)
            self.assertEqual(encryption, "KMS")
            self.assertEqual(kms, "alias/aws/kinesis")
            return True

        return pulumi.Output.all(
            stack.kinesis_stream.name,
            stack.kinesis_stream.encryption_type,
            stack.kinesis_stream.kms_key_id,
        ).apply(check)

    @pulumi.runtime.test
    def test_rds_configuration(self):
        stack = TapStack("unit-test-stack-rds", self.args)

        def check(values):
            storage_encrypted, multi_az, backups = values
            self.assertTrue(storage_encrypted)
            self.assertTrue(multi_az)
            self.assertEqual(backups, 30)
            return True

        return pulumi.Output.all(
            stack.rds_instance.storage_encrypted,
            stack.rds_instance.multi_az,
            stack.rds_instance.backup_retention_period,
        ).apply(check)

    @pulumi.runtime.test
    def test_redis_configuration(self):
        stack = TapStack("unit-test-stack-redis", self.args)

        def check(values):
            at_rest, transit, port = values
            self.assertTrue(at_rest)
            self.assertTrue(transit)
            self.assertEqual(port, 6379)
            return True

        return pulumi.Output.all(
            stack.redis_cluster.at_rest_encryption_enabled,
            stack.redis_cluster.transit_encryption_enabled,
            stack.redis_cluster.port,
        ).apply(check)

    @pulumi.runtime.test
    def test_component_outputs_registered(self):
        stack = TapStack("unit-test-stack-outputs", self.args)

        def check(outputs):
            expected_keys = {
                'region',
                'vpc_id',
                'kinesis_stream_name',
                'rds_endpoint',
                'redis_primary_endpoint',
            }
            self.assertTrue(expected_keys.issubset(outputs.keys()))
            for key in expected_keys:
                value = outputs[key]
                self.assertIsNotNone(value)
                if isinstance(value, str):
                    self.assertTrue(value)
            return True

        # Access internal outputs through a helper Output
        combined = pulumi.Output.all(
            stack.region,
            stack.vpc.id,
            stack.kinesis_stream.name,
            stack.rds_instance.endpoint,
            stack.redis_cluster.primary_endpoint_address,
        )
        return combined.apply(lambda values: check({
            'region': values[0],
            'vpc_id': values[1],
            'kinesis_stream_name': values[2],
            'rds_endpoint': values[3],
            'redis_primary_endpoint': values[4],
        }))


if __name__ == "__main__":
    unittest.main()
