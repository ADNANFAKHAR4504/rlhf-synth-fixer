"""
test_tap_stack_comprehensive_unit_test.py

Comprehensive unit tests for TapStack using Pulumi testing framework.
Targets 100% code coverage.
"""

import unittest
import pulumi
from unittest.mock import Mock


class MyMocks(pulumi.runtime.Mocks):
    """Custom mock class for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new_resource for resource creation."""
        outputs = dict(args.inputs)

        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = "vpc-mock-123"
            outputs["cidrBlock"] = args.inputs.get("cidrBlock", "10.0.0.0/16")
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs["id"] = "igw-mock-123"
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-mock-{args.name}"
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rt-mock-{args.name}"
        elif args.typ == "aws:ec2/route:Route":
            outputs["id"] = f"route-mock-{args.name}"
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs["id"] = f"rta-mock-{args.name}"
        elif args.typ == "aws:kms/key:Key":
            outputs["id"] = f"key-mock-{args.name}"
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:key/{args.name}"
        elif args.typ == "aws:kms/alias:Alias":
            outputs["id"] = f"alias-mock-{args.name}"
        elif args.typ == "aws:dynamodb/table:Table":
            outputs["id"] = f"table-mock-{args.name}"
            outputs["arn"] = f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-mock-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = f"policy-mock-{args.name}"
        elif args.typ == "aws:lambda/function:Function":
            outputs["id"] = f"function-mock-{args.name}"
            outputs["arn"] = f"arn:aws:lambda:us-east-1:123456789012:function/{args.name}"
            outputs["invokeArn"] = f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function/{args.name}/invocations"
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = f"log-mock-{args.name}"
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.name}"
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs["id"] = f"api-mock-{args.name}"
            outputs["rootResourceId"] = f"root-{args.name}"
        elif args.typ == "aws:apigateway/resource:Resource":
            outputs["id"] = f"resource-mock-{args.name}"
        elif args.typ == "aws:apigateway/authorizer:Authorizer":
            outputs["id"] = f"auth-mock-{args.name}"
        elif args.typ == "aws:apigateway/method:Method":
            outputs["id"] = f"method-mock-{args.name}"
        else:
            outputs["id"] = f"mock-{args.name}"

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock call for provider functions."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b"],
                "zone_ids": ["use1-az1", "use1-az2"]
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs class."""

    def test_args_with_all_parameters(self):
        """Test TapStackArgs with all parameters."""
        custom_tags = {"env": "prod", "team": "platform"}
        args = TapStackArgs(
            environment_suffix="prod",
            tenant_ids=["tenant-001", "tenant-002"],
            vpc_cidr="192.168.0.0/16",
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.tenant_ids, ["tenant-001", "tenant-002"])
        self.assertEqual(args.vpc_cidr, "192.168.0.0/16")
        self.assertEqual(args.tags, custom_tags)

    def test_args_default_vpc_cidr(self):
        """Test default VPC CIDR is set correctly."""
        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )
        self.assertEqual(args.vpc_cidr, "10.0.0.0/16")

    def test_args_default_tags(self):
        """Test default tags are applied when not provided."""
        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )
        self.assertIn("environment", args.tags)
        self.assertIn("cost_center", args.tags)
        self.assertEqual(args.tags["environment"], "production")
        self.assertEqual(args.tags["cost_center"], "platform")

    def test_args_custom_tags_override_defaults(self):
        """Test custom tags override the default tags."""
        custom_tags = {"my_tag": "value", "team": "devops"}
        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"],
            tags=custom_tags
        )
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.tags["my_tag"], "value")


if __name__ == "__main__":
    unittest.main()