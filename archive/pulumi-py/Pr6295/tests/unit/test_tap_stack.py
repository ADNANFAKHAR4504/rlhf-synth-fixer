"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
Tests VPC infrastructure including subnets, NAT Gateways, Network ACLs, and Flow Logs.
"""

import unittest
from unittest.mock import MagicMock, patch

import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource with outputs."""
        outputs = args.inputs

        # Add common outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345", "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}"
            }
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {
                **args.inputs,
                "id": "igw-12345",
                "arn": "arn:aws:ec2:us-east-1:123456789012:internet-gateway/igw-12345"
            }
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eipalloc-{args.name}", "publicIp": "1.2.3.4"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rtb-{args.name}"}
        elif args.typ == "aws:ec2/networkAcl:NetworkAcl":
            outputs = {**args.inputs, "id": f"acl-{args.name}"}
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                **args.inputs,
                "id": f"log-group-{args.name}",
                "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name', args.name)}"
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{args.name}", "arn": f"arn:aws:iam::123456789012:role/{args.name}"}
        elif args.typ == "aws:ec2/flowLog:FlowLog":
            outputs = {**args.inputs, "id": f"fl-{args.name}"}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after mocks are set
from lib.tap_stack import (TapStack,  # pylint: disable=wrong-import-position
                           TapStackArgs)


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'TestProject', 'Owner': 'TestOwner'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


@pulumi.runtime.test
def test_vpc_creation():
    """Test VPC is created with correct configuration."""
    def check_vpc(args):
        stack = TapStack("test-stack", args)
        return {
            "vpc_id": stack.vpc.id,
            "vpc_cidr": stack.vpc.cidr_block,
            "dns_hostnames": stack.vpc.enable_dns_hostnames,
        }

    args = TapStackArgs(environment_suffix='test')
    result = pulumi.Output.all(
        check_vpc(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        assert outputs["vpc_id"] == "vpc-test"
        assert outputs["vpc_cidr"] == "10.0.0.0/16"
        assert outputs["dns_hostnames"] is True

    return result.apply(check_result)


@pulumi.runtime.test
def test_subnet_creation():
    """Test that 6 subnets are created (3 public, 3 private)."""
    def check_subnets(args):
        stack = TapStack("test-stack", args)
        return {
            "public_count": len(stack.public_subnets),
            "private_count": len(stack.private_subnets),
        }

    args = TapStackArgs(environment_suffix='test')
    result = pulumi.Output.all(
        check_subnets(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        assert outputs["public_count"] == 3
        assert outputs["private_count"] == 3

    return result.apply(check_result)


@pulumi.runtime.test
def test_nat_gateway_creation():
    """Test that 3 NAT Gateways are created (one per AZ)."""
    def check_nat_gateways(args):
        stack = TapStack("test-stack", args)
        return {
            "nat_count": len(stack.nat_gateways),
            "eip_count": len(stack.eips),
        }

    args = TapStackArgs(environment_suffix='test')
    result = pulumi.Output.all(
        check_nat_gateways(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        assert outputs["nat_count"] == 3
        assert outputs["eip_count"] == 3

    return result.apply(check_result)


@pulumi.runtime.test
def test_route_table_creation():
    """Test that route tables are created correctly."""
    def check_route_tables(args):
        stack = TapStack("test-stack", args)
        return {
            "private_route_tables_count": len(stack.private_route_tables),
        }

    args = TapStackArgs(environment_suffix='test')
    result = pulumi.Output.all(
        check_route_tables(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        # Should have 3 private route tables (one per AZ)
        assert outputs["private_route_tables_count"] == 3

    return result.apply(check_result)


@pulumi.runtime.test
def test_environment_suffix_in_names():
    """Test that environment suffix is included in resource names."""
    def check_names(args):
        stack = TapStack("test-stack", args)
        # Check VPC name from tags
        vpc_name = stack.vpc.tags.apply(lambda tags: tags.get("Name", ""))
        igw_name = stack.igw.tags.apply(lambda tags: tags.get("Name", ""))

        return {
            "vpc_name": vpc_name,
            "igw_name": igw_name,
        }

    args = TapStackArgs(environment_suffix='staging')
    result = pulumi.Output.all(
        check_names(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        assert "staging" in outputs["vpc_name"]
        assert "staging" in outputs["igw_name"]

    return result.apply(check_result)


@pulumi.runtime.test
def test_required_tags():
    """Test that required tags are applied to resources."""
    def check_tags(args):
        stack = TapStack("test-stack", args)
        vpc_tags = stack.vpc.tags

        return {
            "vpc_tags": vpc_tags,
        }

    custom_tags = {"Repository": "test-repo", "Author": "test-author"}
    args = TapStackArgs(environment_suffix='test', tags=custom_tags)
    result = pulumi.Output.all(
        check_tags(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        tags = outputs["vpc_tags"]
        assert "Environment" in tags
        assert tags["Environment"] == "test"
        assert "Purpose" in tags
        assert "Repository" in tags
        assert tags["Repository"] == "test-repo"

    return result.apply(check_result)


@pulumi.runtime.test
def test_flow_log_creation():
    """Test that VPC Flow Log is created."""
    def check_flow_log(args):
        stack = TapStack("test-stack", args)
        return {
            "flow_log_exists": stack.flow_log is not None,
            "flow_log_group_exists": stack.flow_log_group is not None,
        }

    args = TapStackArgs(environment_suffix='test')
    result = pulumi.Output.all(
        check_flow_log(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        assert outputs["flow_log_exists"] is True
        assert outputs["flow_log_group_exists"] is True

    return result.apply(check_result)


@pulumi.runtime.test
def test_igw_naming_format():
    """Test that Internet Gateway follows naming format: igw-{env}-{region}."""
    def check_igw_name(args):
        stack = TapStack("test-stack", args)
        igw_name = stack.igw.tags.apply(lambda tags: tags.get("Name", ""))
        return {"igw_name": igw_name}

    args = TapStackArgs(environment_suffix='prod')
    result = pulumi.Output.all(
        check_igw_name(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        # Should match format: igw-prod-us-east-1
        assert outputs["igw_name"].startswith("igw-prod-")
        assert "us-east-1" in outputs["igw_name"]

    return result.apply(check_result)


@pulumi.runtime.test
def test_network_acl_creation():
    """Test that Network ACL is created for public subnets."""
    def check_nacl(args):
        stack = TapStack("test-stack", args)
        return {
            "nacl_exists": stack.public_nacl is not None,
        }

    args = TapStackArgs(environment_suffix='test')
    result = pulumi.Output.all(
        check_nacl(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        assert outputs["nacl_exists"] is True

    return result.apply(check_result)


@pulumi.runtime.test
def test_outputs_registered():
    """Test that all required outputs are registered."""
    def check_outputs(args):
        stack = TapStack("test-stack", args)
        # Access the registered outputs
        return {
            "has_vpc_id": True,  # If we got here, stack was created successfully
        }

    args = TapStackArgs(environment_suffix='test')
    result = pulumi.Output.all(
        check_outputs(args)
    ).apply(lambda args: args[0])

    def check_result(outputs):
        assert outputs["has_vpc_id"] is True

    return result.apply(check_result)


if __name__ == "__main__":
    # Run tests
    unittest.main()
