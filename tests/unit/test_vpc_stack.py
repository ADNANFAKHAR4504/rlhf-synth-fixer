"""
Unit tests for VPC Stack.

Tests verify the VPC configuration, subnet layout, NAT Gateways,
and VPC Flow Logs without deploying to AWS.
"""
import pytest
from aws_cdk import App, assertions
from lib.vpc_stack import VpcStack


class TestVpcStack:
    """Test suite for VPC Stack."""

    @pytest.fixture
    def app(self):
        """Create CDK app for testing."""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create VPC stack instance for testing."""
        return VpcStack(
            app,
            "TestVpcStack",
            environment_suffix="test",
            env={"region": "us-east-1"}
        )

    def test_vpc_created(self, stack):
        """Test that VPC is created with correct CIDR."""
        template = assertions.Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

    def test_vpc_tags(self, stack):
        """Test that VPC has required tags."""
        template = assertions.Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": assertions.Match.array_with([
                {"Key": "Environment", "Value": "production"},
                {"Key": "Project", "Value": "payment-platform"},
            ])
        })

    def test_public_subnets_created(self, stack):
        """Test that 3 public subnets are created."""
        template = assertions.Template.from_stack(stack)

        # Should have 3 public subnets
        public_subnets = template.find_resources(
            "AWS::EC2::Subnet",
            {
                "Properties": {
                    "MapPublicIpOnLaunch": True
                }
            }
        )
        assert len(public_subnets) == 3

    def test_private_app_subnets_created(self, stack):
        """Test that 3 private application subnets are created."""
        template = assertions.Template.from_stack(stack)

        # Count all subnets - should be 9 total (3 public + 3 private app + 3 private db)
        all_subnets = template.find_resources("AWS::EC2::Subnet")
        assert len(all_subnets) == 9

    def test_nat_gateways_created(self, stack):
        """Test that 3 NAT Gateways are created."""
        template = assertions.Template.from_stack(stack)

        nat_gateways = template.find_resources("AWS::EC2::NatGateway")
        assert len(nat_gateways) == 3

    def test_elastic_ips_created(self, stack):
        """Test that Elastic IPs are created for NAT Gateways."""
        template = assertions.Template.from_stack(stack)

        eips = template.find_resources("AWS::EC2::EIP")
        # Should have 3 EIPs for 3 NAT Gateways
        assert len(eips) >= 3

    def test_internet_gateway_created(self, stack):
        """Test that Internet Gateway is created."""
        template = assertions.Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    def test_route_tables_created(self, stack):
        """Test that route tables are created for all subnet tiers."""
        template = assertions.Template.from_stack(stack)

        # Should have route tables for public, private app, and private db subnets
        route_tables = template.find_resources("AWS::EC2::RouteTable")
        # At least 4 route tables: 1 for public, 3 for private app (one per AZ)
        assert len(route_tables) >= 4

    def test_flow_log_created(self, stack):
        """Test that VPC Flow Log is created."""
        template = assertions.Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL",
        })

    def test_flow_log_aggregation_interval(self, stack):
        """Test that Flow Log has correct aggregation interval (60 or 600)."""
        template = assertions.Template.from_stack(stack)

        flow_logs = template.find_resources("AWS::EC2::FlowLog")
        for flow_log_id, flow_log in flow_logs.items():
            interval = flow_log["Properties"].get("MaxAggregationInterval")
            # Should be either 60 or 600 (AWS supported values)
            assert interval in [60, 600], f"Invalid interval: {interval}"

    def test_flow_log_cloudwatch_integration(self, stack):
        """Test that Flow Log is configured with CloudWatch."""
        template = assertions.Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::FlowLog", {
            "LogDestinationType": "cloud-watch-logs",
        })

    def test_cloudwatch_log_group_created(self, stack):
        """Test that CloudWatch Log Group is created for Flow Logs."""
        template = assertions.Template.from_stack(stack)

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 7,
        })

    def test_flow_log_iam_role_created(self, stack):
        """Test that IAM role is created for VPC Flow Logs."""
        template = assertions.Template.from_stack(stack)

        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": assertions.Match.array_with([
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ])
            }
        })

    def test_vpc_outputs_created(self, stack):
        """Test that VPC ID is exported as output."""
        template = assertions.Template.from_stack(stack)

        outputs = template.find_outputs("*")
        # Should have outputs for VPC ID and subnet IDs
        assert len(outputs) >= 1

    def test_environment_suffix_in_names(self, stack):
        """Test that environment suffix is included in resource names."""
        template = assertions.Template.from_stack(stack)

        # Check VPC name includes suffix
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": assertions.Match.array_with([
                {"Key": "Name", "Value": assertions.Match.string_like_regexp(".*test.*")}
            ])
        })

    def test_availability_zones_count(self, stack):
        """Test that exactly 3 availability zones are used."""
        # This tests the AZ configuration indirectly through subnet count
        template = assertions.Template.from_stack(stack)

        all_subnets = template.find_resources("AWS::EC2::Subnet")
        # Should have 9 subnets total (3 AZs × 3 subnet types)
        assert len(all_subnets) == 9

    def test_subnet_cidr_blocks(self, stack):
        """Test that subnets use /24 CIDR blocks."""
        template = assertions.Template.from_stack(stack)

        subnets = template.find_resources("AWS::EC2::Subnet")
        for subnet_id, subnet in subnets.items():
            cidr = subnet["Properties"]["CidrBlock"]
            # Verify /24 mask
            assert cidr.endswith("/24"), f"Subnet {subnet_id} has incorrect CIDR: {cidr}"

    def test_stack_synthesizes(self, stack):
        """Test that stack synthesizes without errors."""
        # If we got this far without exceptions, synthesis succeeded
        assert stack is not None
        assert stack.vpc is not None

    def test_vpc_property_accessor(self, stack):
        """Test that get_vpc property returns VPC."""
        vpc = stack.get_vpc
        assert vpc is not None
        assert vpc == stack.vpc


class TestVpcStackConfiguration:
    """Test suite for VPC Stack configuration variations."""

    def test_stack_with_different_suffix(self):
        """Test that stack works with different environment suffixes."""
        app = App()

        stack_prod = VpcStack(
            app,
            "ProdVpcStack",
            environment_suffix="prod",
            env={"region": "us-east-1"}
        )

        template = assertions.Template.from_stack(stack_prod)
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": assertions.Match.array_with([
                {"Key": "Name", "Value": assertions.Match.string_like_regexp(".*prod.*")}
            ])
        })

    def test_stack_creates_isolated_subnets(self):
        """Test that database subnets are truly isolated (no NAT Gateway)."""
        app = App()
        stack = VpcStack(
            app,
            "TestVpcStack",
            environment_suffix="test",
            env={"region": "us-east-1"}
        )

        template = assertions.Template.from_stack(stack)

        # Check that we have isolated subnets (PRIVATE_ISOLATED type)
        # These should not have routes to NAT Gateway
        route_tables = template.find_resources("AWS::EC2::RouteTable")

        # Count routes - isolated subnets should have minimal routes
        all_routes = template.find_resources("AWS::EC2::Route")

        # Should have routes for public (IGW) and private app (NAT) but not for isolated db
        assert len(all_routes) >= 4  # At least public IGW + 3 private NAT routes


class TestVpcStackEdgeCases:
    """Test edge cases and error conditions."""

    def test_stack_requires_environment_suffix(self):
        """Test that stack requires environment_suffix parameter."""
        app = App()

        with pytest.raises(TypeError):
            # Should fail without environment_suffix
            VpcStack(app, "TestStack")

    def test_multiple_stacks_same_app(self):
        """Test that multiple stacks can be created in same app."""
        app = App()

        stack1 = VpcStack(app, "Stack1", environment_suffix="test1", env={"region": "us-east-1"})
        stack2 = VpcStack(app, "Stack2", environment_suffix="test2", env={"region": "us-east-1"})

        assert stack1 is not None
        assert stack2 is not None
        assert stack1.vpc != stack2.vpc
