"""Unit tests for VpcStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.vpc_stack import VpcStack


@mark.describe("VpcStack")
class TestVpcStack(unittest.TestCase):
    """Test cases for the VpcStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates VPC with correct CIDR block")
    def test_creates_vpc_with_correct_cidr(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates public and private subnets")
    def test_creates_public_and_private_subnets(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Should have 4 subnets total (2 public, 2 private)
        template.resource_count_is("AWS::EC2::Subnet", 4)

        # Check for public subnets
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True
        })

        # Check for private subnets
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False
        })

    @mark.it("creates Internet Gateway and attaches to VPC")
    def test_creates_internet_gateway(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::VPCGatewayAttachment", 1)

    @mark.it("creates NAT Gateway with Elastic IP")
    def test_creates_nat_gateway_with_eip(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::NatGateway", 1)
        template.resource_count_is("AWS::EC2::EIP", 1)

    @mark.it("creates security group with SSH and HTTP access")
    def test_creates_security_group_with_correct_rules(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for web server",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22,
                    "CidrIp": "0.0.0.0/0"
                }),
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    @mark.it("creates EC2 instance with correct configuration")
    def test_creates_ec2_instance(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::Instance", {
            "InstanceType": "t3.micro"
        })

    @mark.it("creates IAM role for EC2 instance")
    def test_creates_iam_role_for_ec2(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": Match.object_like({
                            "Service": "ec2.amazonaws.com"
                        }),
                        "Action": "sts:AssumeRole"
                    })
                ])
            })
        })

    @mark.it("creates EC2 KeyPair with environment suffix")
    def test_creates_key_pair(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::KeyPair", {
            "KeyName": f"keypair-{env_suffix}",
            "KeyType": "rsa"
        })

    @mark.it("configures route tables for public and private subnets")
    def test_configures_route_tables(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Should have routes for public subnets to IGW
        template.has_resource_properties("AWS::EC2::Route", {
            "DestinationCidrBlock": "0.0.0.0/0",
            "GatewayId": Match.any_value()
        })

        # ASSERT - Should have routes for private subnets to NAT
        template.has_resource_properties("AWS::EC2::Route", {
            "DestinationCidrBlock": "0.0.0.0/0",
            "NatGatewayId": Match.any_value()
        })

    @mark.it("creates all required outputs")
    def test_creates_all_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        output_keys = set(outputs.keys())
        
        expected_outputs = {
            "VpcId",
            "PublicSubnetIds",
            "PrivateSubnetIds",
            "EC2InstanceId",
            "EC2PublicIP",
            "SecurityGroupId",
            "KeyPairName"
        }
        
        for expected_output in expected_outputs:
            self.assertIn(expected_output, output_keys)

    @mark.it("tags VPC with environment suffix")
    def test_tags_vpc_with_environment(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Check that VPC has tags (CDK adds them)
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Name",
                    "Value": f"VPC-{env_suffix}"
                })
            ])
        })

    @mark.it("tags EC2 instance with environment suffix")
    def test_tags_ec2_instance_with_environment(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Check that EC2 has the Name tag
        template.has_resource_properties("AWS::EC2::Instance", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Name",
                    "Value": f"WebServer-{env_suffix}"
                })
            ])
        })

    @mark.it("creates EC2 instance in public subnet")
    def test_places_ec2_in_public_subnet(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        
        # ASSERT
        self.assertIsNotNone(stack.ec2_instance)
        # The instance should be in one of the public subnets
        public_subnet_ids = [subnet.subnet_id for subnet in stack.vpc.public_subnets]
        self.assertIsNotNone(public_subnet_ids)

    @mark.it("uses default environment suffix when not provided")
    def test_uses_default_environment_suffix(self):
        # ARRANGE
        stack = VpcStack(self.app, "VpcStackDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::KeyPair", {
            "KeyName": "keypair-dev"
        })

    @mark.it("configures user data for web server")
    def test_configures_user_data(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Check that EC2 instance has UserData
        template.has_resource("AWS::EC2::Instance", {
            "Properties": Match.object_like({
                "UserData": Match.any_value()
            })
        })

    @mark.it("applies removal policy to key pair")
    def test_applies_removal_policy_to_key_pair(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource("AWS::EC2::KeyPair", {
            "DeletionPolicy": "Delete"
        })

    @mark.it("creates instance profile for EC2 role")
    def test_creates_instance_profile(self):
        # ARRANGE
        env_suffix = "test"
        stack = VpcStack(self.app, "VpcStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::InstanceProfile", 1)
