"""
Comprehensive unit tests for the TapStack Pulumi component.

These tests exercise the real TapStack while running under Pulumi mocks so that
all nested infrastructure stacks are instantiated, providing realistic coverage.
"""

import os
import sys
import unittest
from unittest.mock import Mock

import pulumi


class InfraMocks(pulumi.runtime.Mocks):
    """Pulumi mocks that provide deterministic outputs for AWS resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = {**args.inputs}
        outputs.setdefault("arn", f"arn:aws:mock::{args.name}")
        outputs.setdefault("id", f"{args.name}-id")

        typ = args.typ
        if typ == "aws:rds/cluster:Cluster":
            outputs.setdefault("endpoint", f"{args.name}.cluster-123.mock.rds.amazonaws.com")
            outputs.setdefault("readerEndpoint", f"{args.name}.reader-123.mock.rds.amazonaws.com")
            outputs.setdefault("clusterIdentifier", args.inputs.get("cluster_identifier", args.name))
        elif typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs.setdefault("identifier", args.inputs.get("identifier", args.name))
        elif typ == "aws:dynamodb/table:Table":
            outputs.setdefault("name", args.inputs.get("name", args.name))
        elif typ == "aws:s3/bucket:Bucket":
            outputs.setdefault("bucket", args.inputs.get("bucket", args.name))
        elif typ == "aws:lambda/function:Function":
            outputs.setdefault("name", args.inputs.get("name", args.name))
        elif typ == "aws:apigateway/restApi:RestApi":
            outputs.setdefault("id", f"{args.name}-api-id")
            outputs.setdefault("execution_arn", f"arn:aws:execute-api:mock-region:123456789012:{args.name}")
        elif typ == "aws:route53/healthCheck:HealthCheck":
            outputs.setdefault("healthCheckId", f"{args.name}-hc-id")
        elif typ == "aws:cloudwatch/dashboard:Dashboard":
            outputs.setdefault("dashboardName", args.inputs.get("dashboard_name", f"dashboard-{args.name}"))
        elif typ == "random:index/randomString:RandomString":
            outputs.setdefault("result", "abc123")
        elif typ == "aws:dms/replicationInstance:ReplicationInstance":
            outputs.setdefault("replicationInstanceArn", f"arn:aws:dms:mock::{args.name}")

        return [f"{args.name}-id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["eu-central-1a", "eu-central-1b", "eu-central-1c"],
                "group_names": [],
                "zones": [],
                "zone_ids": [],
                "network_border_group": "eu-central-1",
            }
        if args.token == "aws:ec2/getVpc:getVpc":
            return {"id": "vpc-12345", "cidr_block": "10.0.0.0/16"}
        if args.token == "aws:ec2/getSubnets:getSubnets":
            return {"ids": ["subnet-1", "subnet-2", "subnet-3"]}
        if args.token == "aws:getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012"}
        if args.token == "aws:kms/getKey:getKey":
            return {"arn": "arn:aws:kms:mock:123456789012:key/mock"}
        return {}


pulumi.runtime.set_mocks(InfraMocks(), preview=False)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from lib.tap_stack import TapStack, TapStackArgs  # noqa: E402


def _build_tap_stack(environment_suffix: str = "unit") -> TapStack:
    return TapStack(
        name=f"test-trading-platform-{environment_suffix}",
        args=TapStackArgs(
            environment_suffix=environment_suffix,
            tags={"Environment": environment_suffix},
            alert_email_addresses=["alerts@example.com"],
        ),
    )


class TestTapStackArgs(unittest.TestCase):
    def test_default_values(self):
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, "dev")
        self.assertEqual(args.tags, {})
        self.assertEqual(args.primary_region, "eu-central-1")
        self.assertEqual(args.secondary_region, "eu-central-2")

    def test_custom_values(self):
        tags = {"Environment": "test", "Project": "DR"}
        args = TapStackArgs(
            environment_suffix="test123",
            tags=tags,
            primary_region="us-west-1",
            secondary_region="us-west-2",
            domain_name="example.com",
        )
        self.assertEqual(args.environment_suffix, "test123")
        self.assertEqual(args.tags, tags)
        self.assertEqual(args.primary_region, "us-west-1")
        self.assertEqual(args.secondary_region, "us-west-2")
        self.assertEqual(args.domain_name, "example.com")


class TestTapStackRuntime(unittest.TestCase):
    @pulumi.runtime.test
    def test_stack_instantiation(self):
        stack = _build_tap_stack("cov")

        return pulumi.Output.all(
            stack.environment_suffix,
            stack.primary_region,
            stack.secondary_region,
            stack.network_stack.production_vpc.id,
            stack.storage_stack.primary_bucket_name,
            stack.aurora_stack.primary_cluster_id,
            stack.dms_stack.replication_instance_arn,
            stack.lambda_stack.primary_function_arn,
            stack.api_gateway_stack.primary_api_endpoint,
            stack.monitoring_stack.dashboard.dashboard_name,
        ).apply(self._assert_stack_outputs)

    def _assert_stack_outputs(self, outputs):
        (
            env_suffix,
            primary_region,
            secondary_region,
            vpc_id,
            bucket_name,
            aurora_cluster_id,
            dms_instance_arn,
            lambda_arn,
            api_endpoint,
            dashboard_name,
        ) = outputs

        self.assertEqual(env_suffix, "cov")
        self.assertTrue(primary_region)
        self.assertTrue(secondary_region)
        self.assertTrue(vpc_id)
        self.assertTrue(bucket_name)
        self.assertTrue(aurora_cluster_id)
        self.assertTrue(dms_instance_arn)
        self.assertTrue(lambda_arn)
        self.assertTrue(api_endpoint)
        self.assertTrue(dashboard_name)

    @pulumi.runtime.test
    def test_component_presence(self):
        stack = _build_tap_stack("components")

        return pulumi.Output.all().apply(
            lambda _: self._assert_component_presence(stack)
        )

    def _assert_component_presence(self, stack: TapStack):
        self.assertIsNotNone(stack.network_stack)
        self.assertIsNotNone(stack.aurora_stack)
        self.assertIsNotNone(stack.dynamodb_stack)
        self.assertIsNotNone(stack.storage_stack)
        self.assertIsNotNone(stack.lambda_stack)
        self.assertIsNotNone(stack.api_gateway_stack)
        self.assertIsNotNone(stack.route53_stack)
        self.assertIsNotNone(stack.monitoring_stack)
        self.assertIsNotNone(stack.synthetics_stack)
        self.assertIsNotNone(stack.failover_stack)

    @pulumi.runtime.test
    def test_tags_and_regions_propagate(self):
        stack = _build_tap_stack("tags")

        return pulumi.Output.all(
            stack.tags,
            stack.network_stack.tags,
            stack.storage_stack.tags,
            stack.aurora_stack.primary_region,
            stack.aurora_stack.secondary_region,
        ).apply(self._assert_tags_and_regions)

    def _assert_tags_and_regions(self, values):
        tap_tags, network_tags, storage_tags, primary_region, secondary_region = values
        self.assertEqual(tap_tags["Environment"], "tags")
        self.assertEqual(network_tags["Environment"], "tags")
        self.assertEqual(storage_tags["Environment"], "tags")
        self.assertTrue(primary_region)
        self.assertTrue(secondary_region)


class TestIndividualStacks(unittest.TestCase):
    def test_network_stack_args(self):
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(environment_suffix="demo")
        self.assertEqual(args.environment_suffix, "demo")
        self.assertEqual(args.primary_region, "ap-southeast-1")
        self.assertEqual(args.secondary_region, "us-east-1")
        self.assertEqual(args.tertiary_region, "us-east-2")

    def test_storage_stack_args(self):
        from lib.storage_stack import StorageStackArgs

        args = StorageStackArgs(environment_suffix="demo", tags={"Owner": "Team"})
        self.assertEqual(args.environment_suffix, "demo")
        self.assertEqual(args.tags, {"Owner": "Team"})

    def test_dms_stack_args(self):
        from lib.dms_stack import DmsStackArgs

        mock_subnets = [Mock(), Mock()]
        args = DmsStackArgs(
            environment_suffix="demo",
            dms_subnet_ids=mock_subnets,
            dms_security_group_id=Mock(),
            source_cluster_endpoint=Mock(),
            source_cluster_arn=Mock(),
            target_cluster_endpoint=Mock(),
            target_cluster_arn=Mock(),
            db_subnet_group_name=Mock(),
        )
        self.assertEqual(args.environment_suffix, "demo")
        self.assertEqual(args.dms_subnet_ids, mock_subnets)


if __name__ == "__main__":
    unittest.main()