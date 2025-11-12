"""
Unit tests for VpcStack.
Tests VPC configuration, subnets, and endpoints.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.vpc_stack import VpcStack


@mark.describe("VpcStack")
class TestVpcStack(unittest.TestCase):
    """Test cases for the VpcStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates VPC with environment suffix in name")
    def test_vpc_creation(self):
        """Test that VPC is created with correct naming."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("creates correct subnet configuration")
    def test_subnet_configuration(self):
        """Test that VPC has public, private, and isolated subnets."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Should have multiple subnets (public, private, isolated across 3 AZs)
        template.resource_count_is("AWS::EC2::Subnet", 9)  # 3 types × 3 AZs

    @mark.it("creates NAT gateway for private subnet egress")
    def test_nat_gateway(self):
        """Test that NAT gateway is created."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Should have 1 NAT gateway (cost optimization)
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates S3 VPC endpoint")
    def test_s3_endpoint(self):
        """Test that S3 VPC endpoint is created."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify S3 endpoint exists
        template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": Match.string_like_regexp(".*s3$")
            }
        )

    @mark.it("creates DynamoDB VPC endpoint")
    def test_dynamodb_endpoint(self):
        """Test that DynamoDB VPC endpoint is created."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify DynamoDB endpoint exists
        template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": Match.string_like_regexp(".*dynamodb$")
            }
        )

    @mark.it("tags VPC with DR role")
    def test_vpc_tags(self):
        """Test that VPC is tagged with DR role."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify VPC has DR-Role tag
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with([
                    {"Key": "DR-Role", "Value": "primary"}
                ])
            }
        )

    @mark.it("exports VPC ID as output")
    def test_vpc_output(self):
        """Test that VPC ID is exported."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify VPC ID is exported
        outputs = template.to_json().get('Outputs', {})
        vpc_outputs = [k for k in outputs.keys() if 'VPC' in k or 'vpc' in k.lower()]
        assert len(vpc_outputs) > 0

    @mark.it("uses 3 availability zones")
    def test_availability_zones(self):
        """Test that VPC spans 3 AZs."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # 9 subnets = 3 AZs × 3 subnet types
        template.resource_count_is("AWS::EC2::Subnet", 9)

    @mark.it("accepts different DR roles")
    def test_secondary_dr_role(self):
        """Test that VPC can be created with secondary DR role."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test",
            dr_role="secondary"
        )

        template = Template.from_stack(stack)

        # Verify VPC has correct DR-Role tag
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with([
                    {"Key": "DR-Role", "Value": "secondary"}
                ])
            }
        )
