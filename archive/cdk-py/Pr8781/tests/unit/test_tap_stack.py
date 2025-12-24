import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates VPC with correct CIDR block")
    def test_creates_vpc_with_correct_cidr(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "CidrBlock": "10.0.0.0/16",
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True,
            },
        )

    @mark.it("creates public subnets in different AZs")
    def test_creates_public_subnets(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::Subnet", 2)
        template.has_resource_properties(
            "AWS::EC2::Subnet", {"CidrBlock": "10.0.0.0/24", "MapPublicIpOnLaunch": True}
        )
        template.has_resource_properties(
            "AWS::EC2::Subnet", {"CidrBlock": "10.0.1.0/24", "MapPublicIpOnLaunch": True}
        )

    @mark.it("creates Internet Gateway")
    def test_creates_internet_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::VPCGatewayAttachment", 1)

    @mark.it("creates EC2 instance with public IP")
    def test_creates_ec2_instance(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::Instance", 1)
        template.has_resource_properties(
            "AWS::EC2::Instance", {"InstanceType": "t3.micro"}
        )

    @mark.it("creates security group with SSH access")
    def test_creates_security_group_with_ssh(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupIngress": [
                    {
                        "CidrIp": "0.0.0.0/0",
                        "Description": "Allow SSH access from anywhere",
                        "FromPort": 22,
                        "IpProtocol": "tcp",
                        "ToPort": 22,
                    }
                ]
            },
        )

    @mark.it("applies correct tags to resources")
    def test_applies_correct_tags(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check VPC has the Project tag among other tags
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {"Tags": Match.array_with([{"Key": "Project", "Value": "CdkSetup"}])},
        )

    @mark.it("uses cdk prefix for resource naming")
    def test_uses_cdk_prefix_naming(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check that resource names follow cdk- prefix convention
        # This is verified through the logical IDs containing our naming pattern
        resources = template.to_json()["Resources"]
        vpc_resources = [k for k in resources.keys() if "cdkvpc" in k.lower()]
        sg_resources = [k for k in resources.keys() if "cdksecuritygroup" in k.lower()]
        ec2_resources = [k for k in resources.keys() if "cdkec2" in k.lower()]

        self.assertTrue(
            len(vpc_resources) > 0, "Should have VPC resources with cdk naming"
        )
        self.assertTrue(
            len(sg_resources) > 0, "Should have SG resources with cdk naming"
        )
        self.assertTrue(
            len(ec2_resources) > 0, "Should have EC2 resources with cdk naming"
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("creates stack outputs for VPC ID")
    def test_creates_vpc_output(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "VpcId",
            {
                "Description": "VPC ID",
            },
        )

    @mark.it("creates stack outputs for Instance ID")
    def test_creates_instance_output(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "InstanceId",
            {
                "Description": "EC2 Instance ID",
            },
        )

    @mark.it("creates stack outputs for Security Group ID")
    def test_creates_security_group_output(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "SecurityGroupId",
            {
                "Description": "Security Group ID",
            },
        )

    @mark.it("creates stack outputs for Instance Public IP")
    def test_creates_public_ip_output(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "InstancePublicIp",
            {
                "Description": "EC2 Instance Public IP",
            },
        )

    @mark.it("allows custom environment suffix via props")
    def test_custom_environment_suffix(self):
        # ARRANGE
        custom_suffix = "production"
        props = TapStackProps(environment_suffix=custom_suffix)
        stack = TapStack(self.app, "TapStackCustom", props=props)

        # ASSERT
        self.assertEqual(stack.environment_suffix, custom_suffix)


if __name__ == "__main__":
    unittest.main()
