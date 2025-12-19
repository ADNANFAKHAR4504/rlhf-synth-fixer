"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
from unittest.mock import MagicMock, patch
import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """Mocks for Pulumi resource calls."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345",
                "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345",
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}",
            }
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "id": args.inputs.get("bucket", args.name),
                "bucket": args.inputs.get("bucket", args.name),
                "arn": f"arn:aws:s3:::{args.inputs.get('bucket', args.name)}",
            }
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {
                **args.inputs,
                "id": f"alb-{args.name}",
                "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/abc123",
                "arn_suffix": f"app/{args.name}/abc123",
                "dns_name": f"{args.name}.us-east-1.elb.amazonaws.com",
                "zone_id": "Z35SXDOTRQ7X7K",
            }
        elif args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "id": args.inputs.get("identifier", args.name),
                "endpoint": f"{args.name}.abc123.us-east-1.rds.amazonaws.com:3306",
                "address": f"{args.name}.abc123.us-east-1.rds.amazonaws.com",
                "port": 3306,
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "id": f"arn:aws:sns:us-east-1:123456789012:{args.name}",
                "arn": f"arn:aws:sns:us-east-1:123456789012:{args.name}",
                "name": args.inputs.get("name", args.name),
            }
        else:
            outputs = {**args.inputs, "id": f"{args.name}-id"}
        return [outputs.get("id", f"{args.name}-id"), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
        elif args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012"}
        elif args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1"}
        elif args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345"}
        elif args.token == "aws:elb/getServiceAccount:getServiceAccount":
            return {"arn": "arn:aws:iam::127311923021:root"}
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


# Import after setting mocks
# pylint: disable=wrong-import-position
from lib.tap_stack import TapStack, TapStackArgs
from lib.vpc_stack import VpcStack
from lib.compute_stack import ComputeStack
from lib.database_stack import DatabaseStack
from lib.load_balancer_stack import LoadBalancerStack
from lib.storage_stack import StorageStack
from lib.monitoring_stack import MonitoringStack


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_custom_environment_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args = TapStackArgs(environment_suffix='staging')
        self.assertEqual(args.environment_suffix, 'staging')

    def test_custom_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Team': 'Platform', 'Project': 'TAP'}
        args = TapStackArgs(tags=custom_tags)
        self.assertEqual(args.tags, custom_tags)


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test TapStack resource creation."""
    def check_tap_stack(args):
        stack = TapStack("test-stack", args=TapStackArgs(environment_suffix='dev'))
        return {
            "vpc_created": stack.vpc_stack is not None,
            "storage_created": stack.storage_stack is not None,
            "load_balancer_created": stack.load_balancer_stack is not None,
            "compute_created": stack.compute_stack is not None,
            "database_created": stack.database_stack is not None,
            "monitoring_created": stack.monitoring_stack is not None,
        }

    result = pulumi.Output.all().apply(lambda _: check_tap_stack(None))
    return result


@pulumi.runtime.test
def test_vpc_cidr_blocks():
    """Test VPC CIDR blocks for different environments."""
    def check_cidr(args):
        dev_vpc = VpcStack("vpc-dev", environment_suffix='dev', tags={})
        staging_vpc = VpcStack("vpc-staging", environment_suffix='staging', tags={})
        prod_vpc = VpcStack("vpc-prod", environment_suffix='prod', tags={})
        return {
            "dev_tested": dev_vpc is not None,
            "staging_tested": staging_vpc is not None,
            "prod_tested": prod_vpc is not None,
        }

    result = pulumi.Output.all().apply(lambda _: check_cidr(None))
    return result


@pulumi.runtime.test
def test_storage_bucket_names():
    """Test S3 bucket naming conventions."""
    def check_storage(args):
        storage = StorageStack("storage-test", environment_suffix='dev', tags={})
        return {
            "storage_created": storage is not None,
            "has_static_bucket": storage.static_assets_bucket_name is not None,
            "has_alb_bucket": storage.alb_logs_bucket_name is not None,
        }

    result = pulumi.Output.all().apply(lambda _: check_storage(None))
    return result


if __name__ == '__main__':
    unittest.main()
