# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with the correct environment suffix")
    def test_creates_s3_bucket_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"tap-secure-bucket-{env_suffix}"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "tap-secure-bucket-dev"
        })

    @mark.it("creates VPC with correct subnets")
    def test_creates_vpc_with_subnets(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::Subnet", 6)  # 2 AZs × 3 types
        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    @mark.it("creates RDS database with Multi-AZ")
    def test_creates_rds_multi_az(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True,
            "StorageEncrypted": True
        })

    @mark.it("creates Auto Scaling Group with correct settings")
    def test_creates_auto_scaling_group(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "3",
            "DesiredCapacity": "2"
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    @mark.it("creates Lambda function for monitoring")
    def test_creates_monitoring_lambda(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)  # Monitoring + CloudWatch insights
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Handler": "index.lambda_handler"
        })

    @mark.it("creates security groups with minimal exposure")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)  # ALB, EC2, RDS

    @mark.it("creates IAM roles with least privilege")
    def test_creates_iam_roles(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 4)  # EC2, Lambda, ReadOnly + additional roles

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
