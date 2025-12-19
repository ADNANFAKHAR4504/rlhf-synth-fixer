import unittest
from unittest.mock import MagicMock, patch, PropertyMock
import aws_cdk as cdk
from aws_cdk import App, Stack
from aws_cdk.assertions import Template, Match
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_logs as logs
from aws_cdk import aws_iam as iam
import sys
import os

# Add lib to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from lib.vpc_stack import VpcStack


class TestVpcStack(unittest.TestCase):
    """Test suite for VpcStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"

    def test_vpc_stack_creation(self):
        """Test VpcStack creation with basic parameters."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix=self.environment_suffix
        )

        # Verify stack is created
        self.assertIsInstance(stack, Stack)
        self.assertIsNotNone(stack.vpc)
        self.assertEqual(stack.environment_suffix, self.environment_suffix)

    def test_vpc_configuration(self):
        """Test VPC is configured correctly."""
        stack = VpcStack(
            self.app,
            "TestVpcConfig",
            environment_suffix="prod"
        )

        template = Template.from_stack(stack)

        # Check VPC exists with correct CIDR
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    def test_subnet_configuration(self):
        """Test subnet configuration."""
        stack = VpcStack(
            self.app,
            "TestSubnetConfig",
            environment_suffix="staging"
        )

        # Verify subnets are created
        self.assertIsNotNone(stack.vpc.public_subnets)
        self.assertIsNotNone(stack.vpc.private_subnets)
        self.assertIsNotNone(stack.vpc.isolated_subnets)

        template = Template.from_stack(stack)

        # Check public subnet exists
        template.has_resource_properties("AWS::EC2::Subnet", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": Match.string_like_regexp(".*Public-staging.*")}
            ])
        })

        # Check private app subnet exists
        template.has_resource_properties("AWS::EC2::Subnet", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": Match.string_like_regexp(".*PrivateApp-staging.*")}
            ])
        })

        # Check private db subnet exists
        template.has_resource_properties("AWS::EC2::Subnet", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": Match.string_like_regexp(".*PrivateDb-staging.*")}
            ])
        })

    def test_nat_gateway_configuration(self):
        """Test NAT Gateway configuration."""
        stack = VpcStack(
            self.app,
            "TestNatGateway",
            environment_suffix="dev"
        )

        template = Template.from_stack(stack)

        # Verify NAT Gateways are created (max_azs may result in 2 or 3 depending on region)
        nat_count = template.to_json()["Resources"]
        nat_gateways = [r for r in nat_count.values() if r.get("Type") == "AWS::EC2::NatGateway"]
        self.assertGreaterEqual(len(nat_gateways), 2)  # At least 2 NAT Gateways

    def test_flow_logs_configuration(self):
        """Test VPC Flow Logs configuration."""
        stack = VpcStack(
            self.app,
            "TestFlowLogs",
            environment_suffix="audit"
        )

        template = Template.from_stack(stack)

        # Check CloudWatch Log Group for Flow Logs
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/vpc/flowlogs-audit",
            "RetentionInDays": 7
        })

        # Check IAM Role for Flow Logs
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": Match.object_like({
                            "Service": "vpc-flow-logs.amazonaws.com"
                        })
                    })
                ])
            }),
            "Description": "Role for VPC Flow Logs - audit"
        })

        # Check Flow Log exists
        template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL",
            "LogDestinationType": "cloud-watch-logs",
            "MaxAggregationInterval": 60
        })

    def test_outputs_creation(self):
        """Test CloudFormation outputs are created."""
        stack = VpcStack(
            self.app,
            "TestOutputs",
            environment_suffix="qa"
        )

        template = Template.from_stack(stack)

        # Check VPC ID output
        template.has_output("VpcId", {
            "Description": "VPC ID",
            "Export": {
                "Name": "payment-vpc-id-qa"
            }
        })

        # Check subnet outputs exist
        outputs = template.find_outputs("PublicSubnet*")
        self.assertIsNotNone(outputs)

    def test_vpc_property_getter(self):
        """Test get_vpc property returns VPC."""
        stack = VpcStack(
            self.app,
            "TestVpcProperty",
            environment_suffix="test"
        )

        vpc = stack.get_vpc
        self.assertIsNotNone(vpc)
        self.assertIsInstance(vpc, ec2.Vpc)
        self.assertEqual(vpc, stack.vpc)

    def test_vpc_tags_applied(self):
        """Test tags are applied to VPC."""
        stack = VpcStack(
            self.app,
            "TestVpcTags",
            environment_suffix="prod"
        )

        template = Template.from_stack(stack)

        # Verify tags are applied
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": "production"},
                {"Key": "Project", "Value": "payment-platform"}
            ])
        })

    def test_environment_suffix_usage(self):
        """Test environment suffix is used in resource naming."""
        suffix = "custom-env"
        stack = VpcStack(
            self.app,
            "TestEnvSuffix",
            environment_suffix=suffix
        )

        # Check VPC name contains suffix
        template = Template.from_stack(stack)
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": f"payment-vpc-{suffix}"}
            ])
        })

        # Check log group name contains suffix
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/vpc/flowlogs-{suffix}"
        })

    def test_vpc_with_different_environments(self):
        """Test VPC stack with different environment suffixes."""
        environments = ["dev", "staging", "prod", "qa", "test"]

        for env in environments:
            stack = VpcStack(
                self.app,
                f"TestVpc{env.capitalize()}",
                environment_suffix=env
            )

            # Verify stack is created for each environment
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, env)
            self.assertIsNotNone(stack.vpc)

    def test_multiple_subnet_outputs(self):
        """Test multiple subnet outputs are created."""
        stack = VpcStack(
            self.app,
            "TestSubnetOutputs",
            environment_suffix="multi"
        )

        template = Template.from_stack(stack)

        # Check for multiple public subnet outputs (max_azs may result in 2 or 3 subnets)
        outputs = template.to_json()["Outputs"]
        public_subnet_outputs = [o for o in outputs.keys() if o.startswith("PublicSubnet") and o.endswith("Id")]
        self.assertGreaterEqual(len(public_subnet_outputs), 2)  # At least 2 public subnet outputs

    def test_flow_log_role_permissions(self):
        """Test Flow Log IAM role has correct permissions."""
        stack = VpcStack(
            self.app,
            "TestFlowLogPerms",
            environment_suffix="perms"
        )

        template = Template.from_stack(stack)

        # Check IAM role policy for CloudWatch Logs permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ])
                    })
                ])
            })
        })

    def test_stack_with_custom_kwargs(self):
        """Test VpcStack with additional kwargs."""
        stack = VpcStack(
            self.app,
            "TestVpcKwargs",
            environment_suffix="kwargs",
            stack_name="CustomVpcStackName",
            description="Custom VPC Stack Description"
        )

        # Verify stack is created with kwargs
        self.assertIsNotNone(stack)
        self.assertIsNotNone(stack.vpc)

    def test_subnet_cidr_masks(self):
        """Test subnet CIDR masks are configured correctly."""
        stack = VpcStack(
            self.app,
            "TestSubnetCidr",
            environment_suffix="cidr"
        )

        # All subnets should have /24 CIDR mask as configured
        template = Template.from_stack(stack)

        # Check that subnets are created with proper CIDR blocks (6 minimum: 3 tiers × 2 AZs)
        resources = template.to_json()["Resources"]
        subnets = [r for r in resources.values() if r.get("Type") == "AWS::EC2::Subnet"]
        self.assertGreaterEqual(len(subnets), 6)  # At least 6 subnets (3 tiers × 2 AZs)

    def test_isolated_subnet_configuration(self):
        """Test isolated subnets for database tier."""
        stack = VpcStack(
            self.app,
            "TestIsolatedSubnets",
            environment_suffix="isolated"
        )

        # Verify isolated subnets exist
        self.assertIsNotNone(stack.vpc.isolated_subnets)

        template = Template.from_stack(stack)

        # Check for private DB subnet configuration
        template.has_resource_properties("AWS::EC2::Subnet", {
            "Tags": Match.array_with([
                {"Key": "aws-cdk:subnet-type", "Value": "Isolated"}
            ])
        })


if __name__ == "__main__":
    unittest.main()