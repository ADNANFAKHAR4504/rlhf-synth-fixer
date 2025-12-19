# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a VPC with the correct configuration")
    def test_creates_vpc(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsSupport": True,
            "EnableDnsHostnames": True,
        })

    @mark.it("creates an ECS cluster with Fargate capacity providers")
    def test_creates_ecs_cluster(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates an Application Load Balancer")
    def test_creates_application_load_balancer(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates a Payment Fargate service")
    def test_creates_payment_service(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Service", 2)  # Payment and Auth services
        template.has_resource_properties("AWS::ECS::Service", {
            "LaunchType": "FARGATE",
            "DesiredCount": 2,
        })

    @mark.it("creates an Auth Fargate service")
    def test_creates_auth_service(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Service", 2)  # Payment and Auth services
        template.has_resource_properties("AWS::ECS::Service", {
            "LaunchType": "FARGATE",
            "DesiredCount": 2,
        })

    @mark.it("creates Cloud Map namespace for service discovery")
    def test_creates_cloud_map_namespace(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ServiceDiscovery::PrivateDnsNamespace", 1)
        template.has_resource_properties("AWS::ServiceDiscovery::PrivateDnsNamespace", {
            "Name": "micro-dev.local"
        })

    @mark.it("creates outputs for key resources")
    def test_creates_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("LoadBalancerDNS", {
            "Description": "DNS name of the Application Load Balancer",
        })
        template.has_output("VpcId", {
            "Description": "ID of the VPC",
        })
        template.has_output("ClusterName", {
            "Description": "Name of the ECS Cluster",
        })
        template.has_output("PaymentServiceName", {
            "Description": "Name of the Payment Service",
        })
        template.has_output("AuthServiceName", {
            "Description": "Name of the Auth Service",
        })
        template.has_output("ServiceDiscoveryNamespace", {
            "Description": "Service Discovery Namespace",
        })
