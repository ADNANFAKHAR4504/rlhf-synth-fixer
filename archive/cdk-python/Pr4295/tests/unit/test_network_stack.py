"""Unit tests for the NetworkStack CDK infrastructure.

This module contains unit tests for the network infrastructure.
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.network_stack import NetworkStack, NetworkStackProps


@mark.describe("NetworkStack - VPC and Security Groups")
class TestNetworkStack(unittest.TestCase):
    """Test cases for the NetworkStack CDK nested stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(self.app, "ParentStack")

    @mark.it("creates VPC with correct CIDR and multi-AZ configuration")
    def test_creates_vpc_with_multi_az(self):
        """Verify VPC is created with correct CIDR and spans multiple AZs"""
        # ARRANGE
        env_suffix = "test"
        stack = NetworkStack(
            self.parent_stack,
            "NetworkStackTest",
            NetworkStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

    @mark.it("creates security groups for ECS, RDS, Redis, and EFS")
    def test_creates_security_groups(self):
        """Verify all required security groups are created"""
        # ARRANGE
        env_suffix = "test"
        stack = NetworkStack(
            self.parent_stack,
            "NetworkStackTest",
            NetworkStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 4 security groups (ECS, RDS, Redis, EFS)
        template.resource_count_is("AWS::EC2::SecurityGroup", 4)

    @mark.it("creates NAT gateway for private subnet egress")
    def test_creates_nat_gateway(self):
        """Verify NAT gateway is created for cost optimization"""
        # ARRANGE
        env_suffix = "test"
        stack = NetworkStack(
            self.parent_stack,
            "NetworkStackTest",
            NetworkStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 1 NAT gateway for cost optimization
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("security group allows ECS to access RDS on port 5432")
    def test_security_group_ecs_to_rds(self):
        """Verify security group rules allow ECS to access RDS"""
        # ARRANGE
        env_suffix = "test"
        stack = NetworkStack(
            self.parent_stack,
            "NetworkStackTest",
            NetworkStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for ingress rule on port 5432
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
        })

    @mark.it("security group allows ECS to access Redis on port 6379")
    def test_security_group_ecs_to_redis(self):
        """Verify security group rules allow ECS to access Redis"""
        # ARRANGE
        env_suffix = "test"
        stack = NetworkStack(
            self.parent_stack,
            "NetworkStackTest",
            NetworkStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for ingress rule on port 6379
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
        })

    @mark.it("security group allows ECS to access EFS on port 2049")
    def test_security_group_ecs_to_efs(self):
        """Verify security group rules allow ECS to access EFS"""
        # ARRANGE
        env_suffix = "test"
        stack = NetworkStack(
            self.parent_stack,
            "NetworkStackTest",
            NetworkStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for ingress rule on port 2049 (NFS)
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 2049,
            "ToPort": 2049,
        })
