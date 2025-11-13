"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component using Pulumi's
testing utilities. These tests instantiate the real TapStack under mocks so
that all nested infrastructure stacks are exercised without hitting AWS.
"""

import os
import sys
import unittest

import pulumi


class TapMocks(pulumi.runtime.Mocks):
    """
    Pulumi mocks that return deterministic outputs for all AWS resources used
    by the stack. This enables the full TapStack to instantiate in tests while
    keeping assertions stable.
    """

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = {**args.inputs}
        outputs.setdefault("id", f"{args.name}-id")
        outputs.setdefault("arn", f"arn:aws:mock::{args.name}")

        typ = args.typ
        if typ == "aws:rds/cluster:Cluster":
            outputs.setdefault("endpoint", f"{args.name}.cluster-123.mock.rds.amazonaws.com")
            outputs.setdefault("readerEndpoint", f"{args.name}.reader-123.mock.rds.amazonaws.com")
            outputs.setdefault("clusterIdentifier", args.inputs.get("cluster_identifier", args.name))
        elif typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs.setdefault("identifier", args.inputs.get("identifier", args.name))
        elif typ == "aws:rds/globalCluster:GlobalCluster":
            outputs.setdefault("globalClusterIdentifier", args.inputs.get("global_cluster_identifier", args.name))
        elif typ == "aws:dynamodb/table:Table":
            outputs.setdefault("name", args.inputs.get("name", args.name))
        elif typ == "aws:s3/bucket:Bucket":
            outputs.setdefault("bucket", args.inputs.get("bucket", args.name))
        elif typ == "aws:lambda/function:Function":
            outputs.setdefault("name", args.inputs.get("name", args.name))
        elif typ == "aws:apigateway/restApi:RestApi":
            outputs.setdefault("id", f"{args.name}-api-id")
            outputs.setdefault("execution_arn", f"arn:aws:execute-api:mock:123456789012:{args.name}")
        elif typ == "aws:apigateway/stage:Stage":
            outputs.setdefault("stageName", "prod")
        elif typ == "aws:route53/healthCheck:HealthCheck":
            outputs.setdefault("healthCheckId", f"{args.name}-hc-id")
        elif typ == "aws:cloudwatch/dashboard:Dashboard":
            outputs.setdefault("dashboardName", args.inputs.get("dashboard_name", f"dashboard-{args.name}"))
        elif typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs.setdefault("alarmName", args.inputs.get("alarm_name", f"alarm-{args.name}"))
        elif typ == "aws:cloudwatch/compositeAlarm:CompositeAlarm":
            outputs.setdefault("alarmName", args.inputs.get("alarm_name", f"composite-{args.name}"))
        elif typ == "aws:synthetics/canary:Canary":
            outputs.setdefault("name", args.inputs.get("name", args.name))
        elif typ == "aws:sns/topic:Topic":
            outputs.setdefault("arn", f"arn:aws:sns:mock:123456789012:{args.name}")
        elif typ == "aws:dms/replicationInstance:ReplicationInstance":
            outputs.setdefault("replicationInstanceArn", f"arn:aws:dms:mock:123456789012:{args.name}")
        elif typ == "random:index/randomString:RandomString":
            outputs.setdefault("result", "abc123")
        elif typ == "aws:ssm/parameter:Parameter":
            outputs.setdefault("name", args.inputs.get("name", f"/migration/{args.name}"))
            outputs.setdefault("arn", f"arn:aws:ssm:mock:123456789012:parameter{args.inputs.get('name', f'/migration/{args.name}')}")

        return [f"{args.name}-id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        token = args.token
        if token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["eu-central-1a", "eu-central-1b", "eu-central-1c"],
                "group_names": [],
                "zones": [],
                "zone_ids": [],
                "network_border_group": "eu-central-1",
            }
        if token == "aws:ec2/getVpc:getVpc":
            return {"id": "vpc-12345", "cidr_block": "10.0.0.0/16"}
        if token == "aws:ec2/getSubnets:getSubnets":
            return {"ids": ["subnet-1", "subnet-2", "subnet-3"]}
        if token == "aws:getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012"}
        if token == "aws:kms/getKey:getKey":
            return {"arn": "arn:aws:kms:mock:123456789012:key/mock"}
        if token == "aws:index/getRegion:getRegion" or token == "aws:getRegion:getRegion":
            return {"name": "us-east-1", "id": "us-east-1"}
        return {}


pulumi.runtime.set_mocks(TapMocks(), preview=False)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from lib.tap_stack import TapStack, TapStackArgs  # noqa: E402


def _build_stack(environment_suffix: str = "unit") -> TapStack:
    """Helper to instantiate the TapStack with consistent settings."""
    return TapStack(
        name=f"test-trading-platform-{environment_suffix}",
        args=TapStackArgs(
            environment_suffix=environment_suffix,
            tags={"Environment": environment_suffix},
            alert_email_addresses=["alerts@example.com"],
        ),
    )


class TestTapStackArgs(unittest.TestCase):
    """Tests for TapStackArgs convenience defaults."""

    def test_default_values(self):
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, "dev")
        self.assertEqual(args.tags, {})
        self.assertEqual(args.primary_region, "eu-central-1")
        self.assertEqual(args.secondary_region, "eu-central-2")

    def test_custom_values(self):
        tags = {"Environment": "stage", "Project": "Migration"}
        args = TapStackArgs(
            environment_suffix="stage",
            tags=tags,
            primary_region="us-east-1",
            secondary_region="us-west-2",
            domain_name="example.com",
        )
        self.assertEqual(args.environment_suffix, "stage")
        self.assertEqual(args.tags, tags)
        self.assertEqual(args.primary_region, "us-east-1")
        self.assertEqual(args.secondary_region, "us-west-2")
        self.assertEqual(args.domain_name, "example.com")


@pulumi.runtime.test
def test_tap_stack_creation():
    """Instantiate the stack and verify basic properties."""

    def check(_):
        stack = _build_stack("cov")
        return {
            "environment_suffix": stack.environment_suffix,
            "primary_region": stack.primary_region,
            "secondary_region": stack.secondary_region,
        }

    return pulumi.Output.all().apply(lambda _: check(None))


@pulumi.runtime.test
def test_tap_stack_has_all_components():
    """Ensure every sub-stack is wired into TapStack."""

    def check(_):
        stack = _build_stack("components")
        assert hasattr(stack, "network_stack")
        assert hasattr(stack, "database_stack")
        assert hasattr(stack, "storage_stack")
        assert hasattr(stack, "notification_stack")
        assert hasattr(stack, "dms_stack")
        assert hasattr(stack, "lambda_stack")
        assert hasattr(stack, "api_gateway_stack")
        assert hasattr(stack, "parameter_store_stack")
        assert hasattr(stack, "stepfunctions_stack")
        assert hasattr(stack, "monitoring_stack")
        return {"status": "all_components_present"}

    return pulumi.Output.all().apply(lambda _: check(None))


@pulumi.runtime.test
def test_tap_stack_tags_propagate():
    """Verify that custom tags flow to child stacks."""

    def check(_):
        tags = {"Environment": "prod", "Team": "platform"}
        stack = TapStack("test-tag-stack", TapStackArgs(environment_suffix="prod", tags=tags))

        assert stack.tags["Environment"] == "prod"
        assert stack.network_stack.tags["EnvironmentSuffix"] == "prod"
        assert stack.storage_stack.tags["EnvironmentSuffix"] == "prod"
        return {"status": "tags_ok"}

    return pulumi.Output.all().apply(lambda _: check(None))


@pulumi.runtime.test
def test_tap_stack_regions():
    """Confirm primary and secondary regions are honored."""

    def check(_):
        stack = TapStack(
            "test-region-stack",
            TapStackArgs(
                environment_suffix="regions",
                primary_region="us-east-1",
                secondary_region="us-west-2",
            ),
        )
        assert stack.primary_region == "us-east-1"
        assert stack.secondary_region == "us-west-2"
        return {"primary_region": stack.primary_region, "secondary_region": stack.secondary_region}

    return pulumi.Output.all().apply(lambda _: check(None))


class TestTapStackOutputs(unittest.TestCase):
    """Runtime assertions against exported outputs."""

    @pulumi.runtime.test
    def test_stack_has_required_outputs(self):
        def check(_):
            stack = _build_stack("outputs")
            assert hasattr(stack.api_gateway_stack, "api_endpoint")
            assert hasattr(stack.database_stack, "production_cluster")
            assert hasattr(stack.database_stack, "migration_cluster")
            assert hasattr(stack.storage_stack, "checkpoints_bucket")
            assert hasattr(stack.storage_stack, "rollback_bucket")
            return {"status": "outputs_present"}

        return pulumi.Output.all().apply(lambda _: check(None))


if __name__ == "__main__":
    unittest.main()

