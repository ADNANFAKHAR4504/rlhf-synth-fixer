"""
Unit tests for TapStack using Pulumi mocks.
"""

import unittest
import pulumi
from pulumi.runtime import Mocks, set_mocks

from lib.tap_stack import TapStack, TapStackArgs

MOCK_REGION = "eu-west-2"


class TapStackArgsTests(unittest.TestCase):
    """Validation for argument dataclass."""

    def test_defaults(self):
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, "dev")
        self.assertIsNone(args.tags)

    def test_custom_values(self):
        tags = {"Project": "FedRAMP", "Compliance": "High"}
        args = TapStackArgs(environment_suffix="prod", tags=tags)
        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.tags, tags)


class AwsMocks(Mocks):
    """Pulumi mock provider that returns deterministic outputs."""

    def new_resource(self, args):  # type: ignore[override]
        outputs = {"id": f"{args.name}-id"}
        outputs.update(args.inputs)

        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = f"vpc-{args.name}"
        elif args.typ == "aws:kinesis/stream:Stream":
            outputs.setdefault("name", args.inputs.get("name", args.name))
            outputs["arn"] = f"arn:aws:kinesis:{MOCK_REGION}:123456789012:stream/{args.name}"
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs.setdefault("name", args.inputs.get("name", args.name))
            outputs["arn"] = f"arn:aws:ecs:{MOCK_REGION}:123456789012:cluster/{args.name}"
        elif args.typ == "aws:rds/instance:Instance":
            outputs["endpoint"] = f"{args.name}.example.com:5432"
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs["configuration_endpoint_address"] = f"{args.name}.cache.{MOCK_REGION}.amazonaws.com"
        elif args.typ == "aws:efs/fileSystem:FileSystem":
            outputs["arn"] = f"arn:aws:elasticfilesystem:{MOCK_REGION}:123456789012:file-system/{args.name}"
        elif args.typ == "aws:apigatewayv2/api:Api":
            outputs["api_endpoint"] = f"https://{args.name}.execute-api.{MOCK_REGION}.amazonaws.com"
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs["dns_name"] = f"{args.name}.{MOCK_REGION}.elb.amazonaws.com"
        elif args.typ == "aws:kms/key:Key":
            outputs["arn"] = f"arn:aws:kms:{MOCK_REGION}:123456789012:key/{args.name}"
        elif args.typ == "aws:cloudtrail/trail:Trail":
            outputs.setdefault("name", args.inputs.get("name", args.name))

        return outputs["id"], outputs

    def call(self, args):  # type: ignore[override]
        if args.token == "aws:index/getRegion:getRegion":
            return {"region": MOCK_REGION, "name": MOCK_REGION}
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": [f"{MOCK_REGION}a", f"{MOCK_REGION}b", f"{MOCK_REGION}c"]}
        if args.token == "aws:iam/getCallerIdentity:getCallerIdentity":
            return {
                "accountId": "123456789012",
                "arn": "arn:aws:iam::123456789012:role/TestRole",
                "userId": "AROA1234567890EXAMPLE:bot",
            }
        return {}


set_mocks(AwsMocks())


@pulumi.runtime.test
def test_tap_stack_exports():
    stack = TapStack("unit-test-stack", TapStackArgs(environment_suffix="test"))

    def _check(values):
        (
            vpc_id,
            stream_name,
            stream_arn,
            ecs_cluster_arn,
            rds_endpoint,
            redis_endpoint,
            api_endpoint,
            kms_key_id,
        ) = values

        assert vpc_id.startswith("vpc-")
        assert "fedramp-data-stream" in stream_name
        assert MOCK_REGION in stream_arn
        assert MOCK_REGION in ecs_cluster_arn
        assert rds_endpoint.endswith(":5432")
        assert "cache" in redis_endpoint
        assert api_endpoint.startswith("https://")
        assert kms_key_id
        return True

    return pulumi.Output.all(
        stack.vpc_id,
        stack.kinesis_stream_name,
        stack.kinesis_stream_arn,
        stack.ecs_cluster_arn,
        stack.rds_endpoint,
        stack.elasticache_endpoint,
        stack.api_endpoint,
        stack.kms_key_id,
    ).apply(_check)


if __name__ == "__main__":
    unittest.main()
