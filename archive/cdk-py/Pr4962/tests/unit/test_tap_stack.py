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
    """Unit test cases for the TapStack CDK stack"""

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
            "EnableDnsSupport": True,
            "EnableDnsHostnames": True
        })

    @mark.it("creates an S3 bucket with the correct configuration")
    def test_creates_s3_bucket(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
                ]
            }
        })

    @mark.it("creates an RDS database with the correct configuration")
    def test_creates_rds_database(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "MultiAZ": True,
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7
        })

    @mark.it("creates a CloudFront distribution with the correct configuration")
    def test_creates_cloudfront_distribution(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https"
                },
                "Enabled": True
            }
        })

    @mark.it("creates a Lambda function with the correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 30,
            "MemorySize": 256
        })

    @mark.it("creates an ECS cluster with the correct configuration")
    def test_creates_ecs_cluster(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": "TapStack-cluster-dev"
        })

    @mark.it("creates an Application Load Balancer for ECS")
    def test_creates_ecs_alb(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 2)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates an Auto Scaling Group for EC2 instances")
    def test_creates_ec2_asg(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "10",
            "DesiredCapacity": "2"
        })

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 5,
            "EvaluationPeriods": 2
        })

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "TapStack Dev Alerts"
        })

    @mark.it("outputs all required CloudFormation outputs")
    def test_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("VPCId", {"Description": "VPC ID"})
        template.has_output("CloudFrontURL", {"Description": "CloudFront distribution URL"})
        template.has_output("ECSServiceURL", {"Description": "ECS Service Load Balancer URL"})
        template.has_output("DatabaseEndpoint", {"Description": "RDS Database Endpoint"})
        template.has_output("StaticBucketName", {"Description": "Static assets S3 bucket name"})
