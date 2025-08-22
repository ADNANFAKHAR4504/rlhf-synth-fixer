"""Unit tests for VPC Stack"""
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
        self.env_suffix = "test"
        self.stack = VpcStack(self.app, "TestVpcStack", environment_suffix=self.env_suffix)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates a VPC with correct configuration")
    def test_creates_vpc(self):
        """Test that a VPC is created with proper configuration"""
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

    @mark.it("creates public and private subnets")
    def test_creates_subnets(self):
        """Test that public and private subnets are created"""
        # Check for public subnets
        self.template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
        
        # Check for NAT gateways
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

    @mark.it("creates security groups for ALB and Fargate")
    def test_creates_security_groups(self):
        """Test that security groups are created"""
        # Check ALB security group
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer"
        })
        
        # Check Fargate security group
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Fargate tasks"
        })

    @mark.it("allows HTTP and HTTPS traffic to ALB")
    def test_alb_security_group_rules(self):
        """Test that ALB security group has correct ingress rules"""
        # Check that we have the Fargate ingress rule from ALB
        self.template.resource_count_is("AWS::EC2::SecurityGroupIngress", 1)
        
        # Check for Fargate ingress rule from ALB (uses SourceSecurityGroupId)
        self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "Description": "Allow traffic from ALB"
        })
        
        # Check that ALB security group has inline rules for HTTP and HTTPS
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                }),
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    @mark.it("exports VPC ID")
    def test_exports_vpc_id(self):
        """Test that VPC ID is exported"""
        outputs = self.template.find_outputs("*")
        # Check if any output has the correct export name
        vpc_output_exists = any(
            output.get('Export', {}).get('Name') == f"webapp-vpc-id-{self.env_suffix}"
            for output in outputs.values()
        )
        self.assertTrue(vpc_output_exists, "VPC ID should be exported with correct export name")

    @mark.it("provides access to vpc and security groups")
    def test_provides_access_to_resources(self):
        """Test that the stack provides access to created resources"""
        self.assertIsNotNone(self.stack.vpc)
        self.assertIsNotNone(self.stack.alb_security_group)
        self.assertIsNotNone(self.stack.fargate_security_group)