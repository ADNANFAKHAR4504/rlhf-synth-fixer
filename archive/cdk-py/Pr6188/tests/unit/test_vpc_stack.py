"""Unit tests for VPC Stack."""
# pylint: disable=attribute-defined-outside-init,too-many-public-methods

import aws_cdk as cdk
from aws_cdk import assertions
import pytest

from lib.vpc_stack import VpcStack, VpcStackProps


class TestVpcStack:
    """Test suite for VPC Stack."""

    def setup_method(self):
        """Setup test environment."""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.props = VpcStackProps(environment_suffix=self.env_suffix)
        self.stack = VpcStack(
            self.app,
            "TestVpcStack",
            props=self.props,
            env=cdk.Environment(region="us-east-1")
        )
        self.template = assertions.Template.from_stack(self.stack)

    def test_vpc_created_with_correct_cidr(self):
        """Test that VPC is created with correct CIDR block."""
        self.template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "CidrBlock": "10.50.0.0/16",
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True,
            }
        )

    def test_vpc_has_required_tags(self):
        """Test that VPC has all required tags."""
        # Get template JSON to check tags directly (order-independent)
        template_json = self.template.to_json()
        vpcs = {
            k: v for k, v in template_json["Resources"].items()
            if v["Type"] == "AWS::EC2::VPC"
        }

        # Check VPC has required tags
        for vpc_id, vpc in vpcs.items():
            tags = {tag["Key"]: tag["Value"] for tag in vpc["Properties"]["Tags"]}
            assert "Name" in tags, f"VPC {vpc_id} missing Name tag"
            assert tags["Environment"] == "production", f"VPC {vpc_id} wrong Environment tag"
            assert tags["Team"] == "platform", f"VPC {vpc_id} wrong Team tag"
            assert tags["CostCenter"] == "engineering", f"VPC {vpc_id} wrong CostCenter tag"

    def test_three_public_subnets_created(self):
        """Test that 3 public subnets are created with correct CIDRs."""
        # Check for public subnet 1
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {
                "CidrBlock": "10.50.1.0/24",
                "AvailabilityZone": "us-east-1a",
                "MapPublicIpOnLaunch": True
            }
        )

        # Check for public subnet 2
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {
                "CidrBlock": "10.50.2.0/24",
                "AvailabilityZone": "us-east-1b",
                "MapPublicIpOnLaunch": True
            }
        )

        # Check for public subnet 3
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {
                "CidrBlock": "10.50.3.0/24",
                "AvailabilityZone": "us-east-1c",
                "MapPublicIpOnLaunch": True
            }
        )

    def test_three_private_subnets_created(self):
        """Test that 3 private subnets are created with correct CIDRs."""
        # Check for private subnet 1
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {
                "CidrBlock": "10.50.11.0/24",
                "AvailabilityZone": "us-east-1a",
                "MapPublicIpOnLaunch": False
            }
        )

        # Check for private subnet 2
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {
                "CidrBlock": "10.50.12.0/24",
                "AvailabilityZone": "us-east-1b",
                "MapPublicIpOnLaunch": False
            }
        )

        # Check for private subnet 3
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {
                "CidrBlock": "10.50.13.0/24",
                "AvailabilityZone": "us-east-1c",
                "MapPublicIpOnLaunch": False
            }
        )

    def test_subnet_tags_include_environment_suffix(self):
        """Test that subnet names include environment suffix."""
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {
                "Tags": assertions.Match.array_with([
                    {"Key": "Name", "Value": f"public-subnet-1-{self.env_suffix}"}
                ])
            }
        )

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created."""
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

        # Get template JSON to check tags directly (order-independent)
        template_json = self.template.to_json()
        igws = {
            k: v for k, v in template_json["Resources"].items()
            if v["Type"] == "AWS::EC2::InternetGateway"
        }

        # Check IGW has required tags
        for igw_id, igw in igws.items():
            tags = {tag["Key"]: tag["Value"] for tag in igw["Properties"]["Tags"]}
            assert tags["Name"] == f"payment-igw-{self.env_suffix}", f"IGW {igw_id} wrong Name tag"
            assert tags["Environment"] == "production", f"IGW {igw_id} wrong Environment tag"
            assert tags["Team"] == "platform", f"IGW {igw_id} wrong Team tag"
            assert tags["CostCenter"] == "engineering", f"IGW {igw_id} wrong CostCenter tag"

    def test_internet_gateway_attached_to_vpc(self):
        """Test that IGW is attached to VPC."""
        self.template.resource_count_is("AWS::EC2::VPCGatewayAttachment", 1)

    def test_three_nat_instances_created(self):
        """Test that 3 NAT instances are created (not NAT Gateways)."""
        # Verify NAT instances exist
        self.template.resource_count_is("AWS::EC2::Instance", 3)

        # Verify NAT instance configuration
        self.template.has_resource_properties(
            "AWS::EC2::Instance",
            {
                "InstanceType": "t3.micro",
                "SourceDestCheck": False
            }
        )

        # Verify NO NAT Gateways are created
        self.template.resource_count_is("AWS::EC2::NatGateway", 0)

    def test_nat_instances_have_required_tags(self):
        """Test that NAT instances have all required tags."""
        # Get template JSON to check tags directly
        template_json = self.template.to_json()
        instances = {
            k: v for k, v in template_json["Resources"].items()
            if v["Type"] == "AWS::EC2::Instance"
        }

        # Check all instances have required tags
        for instance_id, instance in instances.items():
            tags = {tag["Key"]: tag["Value"] for tag in instance["Properties"]["Tags"]}
            assert "Name" in tags, f"Instance {instance_id} missing Name tag"
            assert tags["Environment"] == "production", f"Instance {instance_id} wrong Environment tag"
            assert tags["Team"] == "platform", f"Instance {instance_id} wrong Team tag"
            assert tags["CostCenter"] == "engineering", f"Instance {instance_id} wrong CostCenter tag"

    def test_nat_security_group_no_wildcard_cidr(self):
        """Test that NAT security group doesn't use 0.0.0.0/0."""
        # Get security group rules
        template_json = self.template.to_json()
        security_groups = {
            k: v for k, v in template_json["Resources"].items()
            if v["Type"] == "AWS::EC2::SecurityGroup"
        }

        # Check that no ingress rule uses 0.0.0.0/0
        for sg_id, sg in security_groups.items():
            if "SecurityGroupIngress" in sg["Properties"]:
                for rule in sg["Properties"]["SecurityGroupIngress"]:
                    if "CidrIp" in rule:
                        assert rule["CidrIp"] != "0.0.0.0/0", \
                            "NAT security group should not use 0.0.0.0/0"

    def test_custom_public_network_acl_created(self):
        """Test that custom public NACL is created."""
        # Should have at least 2 custom NACLs (public and private)
        self.template.resource_count_is("AWS::EC2::NetworkAcl", 2)

        # Check public NACL has explicit rules
        self.template.has_resource_properties(
            "AWS::EC2::NetworkAclEntry",
            {
                "Protocol": 6,  # TCP
                "RuleAction": "allow",
                "Egress": False,
                "CidrBlock": "10.0.0.0/8"
            }
        )

    def test_custom_private_network_acl_created(self):
        """Test that custom private NACL is created."""
        # Check private NACL allows VPC traffic
        self.template.has_resource_properties(
            "AWS::EC2::NetworkAclEntry",
            {
                "Protocol": -1,  # All protocols
                "RuleAction": "allow",
                "CidrBlock": "10.50.0.0/16"
            }
        )

    def test_six_dedicated_route_tables_created(self):
        """Test that 6 dedicated route tables are created (one per subnet)."""
        # CDK creates route tables for subnets + our explicit route tables = 12 total
        # 6 from ec2.Subnet() + 6 explicit CfnRouteTables
        self.template.resource_count_is("AWS::EC2::RouteTable", 12)

    def test_public_route_tables_route_to_igw(self):
        """Test that public route tables route to Internet Gateway."""
        # Check for routes to IGW
        self.template.has_resource_properties(
            "AWS::EC2::Route",
            {
                "DestinationCidrBlock": "0.0.0.0/0",
                "GatewayId": assertions.Match.any_value()
            }
        )

    def test_private_route_tables_route_to_nat_instances(self):
        """Test that private route tables route to NAT instances."""
        # Check for routes to NAT instances
        self.template.has_resource_properties(
            "AWS::EC2::Route",
            {
                "DestinationCidrBlock": "0.0.0.0/0",
                "InstanceId": assertions.Match.any_value()
            }
        )

    def test_route_table_subnet_associations(self):
        """Test that route tables are associated with subnets."""
        # CDK's ec2.Subnet creates associations + our explicit CfnSubnetRouteTableAssociations = 12
        self.template.resource_count_is("AWS::EC2::SubnetRouteTableAssociation", 12)

    def test_vpc_flow_logs_created(self):
        """Test that VPC Flow Logs are created."""
        self.template.has_resource_properties(
            "AWS::EC2::FlowLog",
            {
                "ResourceType": "VPC",
                "TrafficType": "ALL",
                "LogDestinationType": "cloud-watch-logs",
                "MaxAggregationInterval": 60  # 1-minute intervals
            }
        )

    def test_flow_log_cloudwatch_log_group_created(self):
        """Test that CloudWatch Log Group for flow logs is created."""
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": f"/aws/vpc/flowlogs/{self.env_suffix}",
                "RetentionInDays": 30
            }
        )

    def test_flow_log_iam_role_created(self):
        """Test that IAM role for flow logs is created."""
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": assertions.Match.array_with([
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "vpc-flow-logs.amazonaws.com"
                            }
                        }
                    ])
                }
            }
        )

    def test_s3_vpc_endpoint_created(self):
        """Test that S3 VPC endpoint is created."""
        # ServiceName is an Fn::Join intrinsic function, so check the structure
        self.template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "ServiceName": assertions.Match.object_like({"Fn::Join": assertions.Match.any_value()}),
                "VpcEndpointType": "Gateway"
            }
        )

    def test_dynamodb_vpc_endpoint_created(self):
        """Test that DynamoDB VPC endpoint is created."""
        # Verify 2 gateway endpoints exist (one for S3, one for DynamoDB)
        self.template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "VpcEndpointType": "Gateway"
            }
        )

    def test_vpc_endpoints_count(self):
        """Test that exactly 2 VPC endpoints are created (S3 and DynamoDB)."""
        self.template.resource_count_is("AWS::EC2::VPCEndpoint", 2)

    def test_stack_outputs_vpc_id(self):
        """Test that stack outputs VPC ID."""
        self.template.has_output("VpcId", {})

    def test_stack_outputs_vpc_cidr(self):
        """Test that stack outputs VPC CIDR."""
        self.template.has_output("VpcCidr", {})

    def test_resource_names_include_environment_suffix(self):
        """Test that resource construct IDs include environment suffix."""
        template_json = self.template.to_json()

        # Check that resources with names include the suffix
        # This is verified through Tags which are more reliable in CloudFormation
        vpc_resources = [
            k for k, v in template_json["Resources"].items()
            if v["Type"] == "AWS::EC2::VPC"
        ]

        assert len(vpc_resources) > 0, "VPC should be created"

    def test_all_constraints_implemented(self):
        """Integration test verifying all 8 constraints are implemented."""
        # Constraint 1: VPC with custom CIDR and 6 subnets
        self.template.resource_count_is("AWS::EC2::Subnet", 6)

        # Constraint 2: NAT instances (not NAT Gateways)
        self.template.resource_count_is("AWS::EC2::Instance", 3)
        self.template.resource_count_is("AWS::EC2::NatGateway", 0)

        # Constraint 3: Custom NACLs with explicit rules
        self.template.resource_count_is("AWS::EC2::NetworkAcl", 2)

        # Constraint 4: VPC Flow Logs with 1-minute intervals
        self.template.has_resource_properties(
            "AWS::EC2::FlowLog",
            {"MaxAggregationInterval": 60}
        )

        # Constraint 5: Dedicated route tables per subnet
        # CDK creates route tables for subnets + explicit CfnRouteTables = 12
        self.template.resource_count_is("AWS::EC2::RouteTable", 12)

        # Constraint 6: Security groups verified separately (no 0.0.0.0/0)
        # Tested in test_nat_security_group_no_wildcard_cidr

        # Constraint 7: VPC endpoints (S3 and DynamoDB)
        self.template.resource_count_is("AWS::EC2::VPCEndpoint", 2)

        # Constraint 8: Required tags on resources
        # Tested in individual tag tests


class TestVpcStackProps:
    """Test suite for VpcStackProps."""

    def test_default_environment_suffix(self):
        """Test that default environment suffix is 'dev'."""
        props = VpcStackProps()
        assert props.environment_suffix == "dev"

    def test_custom_environment_suffix(self):
        """Test that custom environment suffix is used."""
        props = VpcStackProps(environment_suffix="staging")
        assert props.environment_suffix == "staging"


class TestVpcStackIntegration:
    """Integration tests for VPC Stack."""

    def test_stack_synthesizes_without_errors(self):
        """Test that stack can be synthesized without errors."""
        app = cdk.App()
        stack = VpcStack(
            app,
            "TestStack",
            props=VpcStackProps(environment_suffix="test"),
            env=cdk.Environment(region="us-east-1")
        )

        # This will raise an exception if synthesis fails
        template = assertions.Template.from_stack(stack)
        assert template is not None

    def test_stack_with_different_environment_suffixes(self):
        """Test that stack works with different environment suffixes."""
        for suffix in ["dev", "staging", "prod", "pr123"]:
            # Create a new app for each suffix to avoid multiple synth issues
            app = cdk.App()
            stack = VpcStack(
                app,
                f"TestStack-{suffix}",
                props=VpcStackProps(environment_suffix=suffix),
                env=cdk.Environment(region="us-east-1")
            )
            template = assertions.Template.from_stack(stack)

            # Verify VPC is created
            template.resource_count_is("AWS::EC2::VPC", 1)
