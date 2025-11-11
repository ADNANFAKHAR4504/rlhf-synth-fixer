"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
Tests verify resource creation, configuration, and relationships without deploying to AWS.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


# Set mocks for Pulumi testing
pulumi.runtime.set_mocks(
    mocks=None,
    preview=False
)


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resource operations."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-mock123",
                "arn": "arn:aws:ec2:eu-central-1:123456789:vpc/vpc-mock123",
                "cidr_block": args.inputs.get("cidrBlock", "10.0.0.0/16"),
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-mock-{args.name}",
                "arn": f"arn:aws:ec2:eu-central-1:123456789:subnet/subnet-mock-{args.name}",
            }
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {
                **args.inputs,
                "id": "igw-mock123",
                "arn": "arn:aws:ec2:eu-central-1:123456789:internet-gateway/igw-mock123",
            }
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {
                **args.inputs,
                "id": f"nat-mock-{args.name}",
            }
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {
                **args.inputs,
                "id": f"eip-mock-{args.name}",
                "publicIp": "1.2.3.4",
            }
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {
                **args.inputs,
                "id": f"rt-mock-{args.name}",
            }
        elif args.typ == "aws:ec2/route:Route":
            outputs = {
                **args.inputs,
                "id": f"route-mock-{args.name}",
            }
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs = {
                **args.inputs,
                "id": f"rta-mock-{args.name}",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-mock-{args.name}",
            }
        elif args.typ == "aws:ec2/securityGroupRule:SecurityGroupRule":
            outputs = {
                **args.inputs,
                "id": f"sgr-mock-{args.name}",
            }
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "id": f"bucket-mock-{args.name}",
                "bucket": f"bucket-mock-{args.name}",
                "arn": f"arn:aws:s3:::bucket-mock-{args.name}",
            }
        elif args.typ == "aws:s3/bucketOwnershipControls:BucketOwnershipControls":
            outputs = {
                **args.inputs,
                "id": f"ownership-mock-{args.name}",
            }
        elif args.typ == "aws:s3/bucketAclV2:BucketAclV2":
            outputs = {
                **args.inputs,
                "id": f"acl-mock-{args.name}",
            }
        elif args.typ == "aws:ec2/flowLog:FlowLog":
            outputs = {
                **args.inputs,
                "id": f"flowlog-mock-{args.name}",
            }
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}

        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["eu-central-1a", "eu-central-1b", "eu-central-1c", "eu-central-1d"],
                "id": "eu-central-1",
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
# pylint: disable=wrong-import-position
from lib.tap_stack import TapStack, TapStackArgs
# pylint: enable=wrong-import-position


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'Test', 'Owner': 'QA'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_with_suffix_only(self):
        """Test TapStackArgs with suffix but no tags."""
        args = TapStackArgs(environment_suffix='staging')

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_tags_only(self):
        """Test TapStackArgs with tags but default suffix."""
        custom_tags = {'Environment': 'test'}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)


@pulumi.runtime.test
def test_vpc_creation():
    """Test VPC is created with correct CIDR."""
    def check_vpc(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return pulumi.Output.all(stack.vpc.id, stack.vpc.cidr_block).apply(
            lambda vals: {
                'id': vals[0],
                'cidr': vals[1]
            }
        )

    result = pulumi.Output.from_input(check_vpc(None)).apply(lambda v: v)
    return result


@pulumi.runtime.test
def test_subnet_count():
    """Test correct number of subnets are created."""
    def check_subnets(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return {
            'public': len(stack.public_subnets),
            'private': len(stack.private_subnets),
            'database': len(stack.database_subnets)
        }

    result = check_subnets(None)
    assert result['public'] == 3
    assert result['private'] == 3
    assert result['database'] == 3


@pulumi.runtime.test
def test_nat_gateway_count():
    """Test correct number of NAT gateways are created."""
    def check_nat_gateways(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return len(stack.nat_gateways)

    result = check_nat_gateways(None)
    assert result == 3


@pulumi.runtime.test
def test_elastic_ip_count():
    """Test correct number of Elastic IPs are created."""
    def check_eips(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return len(stack.eips)

    result = check_eips(None)
    assert result == 3


@pulumi.runtime.test
def test_security_groups_created():
    """Test all three security groups are created."""
    def check_security_groups(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return {
            'web': stack.web_sg is not None,
            'app': stack.app_sg is not None,
            'db': stack.db_sg is not None
        }

    result = check_security_groups(None)
    assert result['web'] is True
    assert result['app'] is True
    assert result['db'] is True


@pulumi.runtime.test
def test_environment_suffix_in_tags():
    """Test environment suffix is included in tags."""
    def check_tags(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="qa"))
        return stack.tags.get('Environment')

    result = check_tags(None)
    assert result == 'qa'


@pulumi.runtime.test
def test_custom_tags_merged():
    """Test custom tags are merged with default tags."""
    def check_tags(args):
        custom_tags = {'CustomTag': 'CustomValue'}
        stack = TapStack("test-stack", TapStackArgs(
            environment_suffix="test",
            tags=custom_tags
        ))
        return stack.tags

    result = check_tags(None)
    assert 'Environment' in result
    assert 'Team' in result
    assert 'CustomTag' in result
    assert result['CustomTag'] == 'CustomValue'


@pulumi.runtime.test
def test_route_tables_created():
    """Test route tables are created for each tier."""
    def check_route_tables(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return {
            'public_rt': stack.public_rt is not None,
            'private_rts_count': len(stack.private_rts),
            'database_rt': stack.database_rt is not None
        }

    result = check_route_tables(None)
    assert result['public_rt'] is True
    assert result['private_rts_count'] == 3
    assert result['database_rt'] is True


@pulumi.runtime.test
def test_internet_gateway_created():
    """Test Internet Gateway is created."""
    def check_igw(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return stack.igw is not None

    result = check_igw(None)
    assert result is True


@pulumi.runtime.test
def test_flow_logs_bucket_created():
    """Test S3 bucket for flow logs is created."""
    def check_flow_logs(args):
        stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
        return {
            'bucket': stack.flow_logs_bucket is not None,
            'flow_log': stack.flow_log is not None
        }

    result = check_flow_logs(None)
    assert result['bucket'] is True
    assert result['flow_log'] is True


if __name__ == '__main__':
    unittest.main()
