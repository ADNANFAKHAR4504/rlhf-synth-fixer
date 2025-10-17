"""
Unit tests for the Pulumi-based disaster recovery stacks.

These tests rely on Pulumi runtime mocks so that the infrastructure code can be
executed without reaching out to AWS. The goal is to validate that the stacks
compose the expected resources and surface meaningful outputs, while also
providing the coverage required by the quality gates.
"""

import pulumi
import pytest
from pulumi.runtime import Mocks, MockResourceArgs, MockCallArgs, set_mocks

from lib.tap_stack import TapStack, TapStackArgs
from lib.monitoring_stack import MonitoringStack
from lib.storage_stack import StorageStack


class _InfrastructureMocks(Mocks):
    """Simple Pulumi mocks that return deterministic IDs and ARNs."""

    def new_resource(self, args: MockResourceArgs):
        outputs = dict(args.inputs)
        outputs.setdefault("id", args.name)  # Use name as default ID instead of name-id
        outputs.setdefault("name", args.name)

        if args.typ == "pulumi:providers:aws":
            outputs.setdefault("region", outputs.get("region", "us-east-1"))
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs.setdefault("endpoint", f"{args.name}.cluster.endpoint")
            outputs.setdefault("arn", f"arn:aws:rds:::cluster/{args.name}")
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs.setdefault("dnsName", f"{args.name}.elb.amazonaws.com")
            outputs.setdefault("arn", f"arn:aws:elasticloadbalancing:::loadbalancer/{args.name}")
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs.setdefault("arn", f"arn:aws:elasticloadbalancing:::targetgroup/{args.name}")
        elif args.typ == "aws:lambda/function:Function":
            outputs.setdefault("arn", f"arn:aws:lambda:::function:{args.name}")
            outputs.setdefault("name", args.name)
        elif args.typ == "aws:sns/topic:Topic":
            outputs.setdefault("arn", f"arn:aws:sns:::topic/{args.name}")
        elif args.typ == "aws:s3/bucket:Bucket":
            bucket_name = outputs.get("bucket", args.name)
            outputs.setdefault("arn", f"arn:aws:s3:::{bucket_name}")
            outputs["id"] = bucket_name  # Override the default id with bucket name
            return bucket_name, outputs  # Return bucket name as ID for S3 buckets
        elif args.typ.startswith("aws:ec2/"):
            outputs.setdefault("arn", f"arn:aws:ec2:::resource/{args.name}")
        elif args.typ == "aws:ssm/parameter:Parameter":
            outputs.setdefault("arn", f"arn:aws:ssm:::parameter/{args.name}")
        elif args.typ.startswith("aws:iam/role"):
            outputs.setdefault("arn", f"arn:aws:iam:::role/{args.name}")

        return outputs.get("id", args.name), outputs

    def call(self, args: MockCallArgs):
        return args.inputs


set_mocks(_InfrastructureMocks())


@pulumi.runtime.test
def test_tap_stack_exposes_multi_region_outputs():
    """TapStack should stitch together the child stacks and expose usable outputs."""
    args = TapStackArgs(environment_suffix="qa", tags={"Owner": "Platform"})
    stack = TapStack("tap", args)

    assert stack.environment_suffix == "qa"
    assert stack.tags["Project"] == "ECommerceDR"
    assert stack.tags["Environment"] == "qa"

    def check(outputs):
        primary_dns, secondary_dns, db_endpoint, bucket_name, sns_arn = outputs
        assert primary_dns.endswith(".elb.amazonaws.com")
        assert secondary_dns.endswith(".elb.amazonaws.com")
        assert "cluster.endpoint" in db_endpoint
        assert bucket_name.endswith("qa")
        assert sns_arn.startswith("arn:aws:sns")

    return pulumi.Output.all(
        stack.compute.primary_alb_dns,
        stack.compute.secondary_alb_dns,
        stack.database.primary_endpoint,
        stack.storage.primary_bucket_name,
        stack.monitoring.sns_topic_arn,
    ).apply(check)


@pulumi.runtime.test
def test_storage_stack_bucket_names_include_environment_suffix():
    """Storage layer should name buckets with the environment suffix for uniqueness."""
    storage = StorageStack(
        "storage",
        environment_suffix="qa",
        primary_region="us-east-1",
        secondary_region="us-west-2",
        tags={"Service": "DR"},
    )

    def check(names):
        primary, secondary = names
        assert primary == "ecommerce-assets-primary-qa"
        assert secondary == "ecommerce-assets-secondary-qa"

    return pulumi.Output.all(
        storage.primary_bucket_name,
        storage.secondary_bucket_name,
    ).apply(check)


@pulumi.runtime.test
def test_monitoring_stack_derives_target_group_dimension():
    """Monitoring stack should derive the CloudWatch dimensions from the target group ARN."""
    monitoring = MonitoringStack(
        "monitoring",
        environment_suffix="qa",
        primary_region="us-east-1",
        compute_target_group=pulumi.Output.from_input(
            "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/sample/abc123"
        ),
        database_cluster_id=pulumi.Output.from_input("aurora-cluster-qa"),
        tags={"Team": "SRE"},
    )

    def check(dimensions):
        assert dimensions["TargetGroup"].endswith("abc123")

    return monitoring.alb_alarm.dimensions.apply(check)
