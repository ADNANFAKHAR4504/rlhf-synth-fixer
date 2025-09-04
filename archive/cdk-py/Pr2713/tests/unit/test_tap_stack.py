# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a VPC with public and private subnets")
    def test_vpc_creation(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private subnets

    @mark.it("creates security groups for ALB, EC2, and RDS")
    def test_security_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)  # ALB, EC2, RDS

        # Check ALB security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer"
        })

        # Check EC2 security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for EC2 instances"
        })

        # Check RDS security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for RDS database"
        })

    @mark.it("creates an RDS MySQL instance with the correct configuration")
    def test_rds_instance(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "DBInstanceClass": Match.string_like_regexp("db.t3.micro"),
            "AllocatedStorage": "20",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "DeletionProtection": False
        })

    @mark.it("creates an S3 bucket with versioning and lifecycle rules")
    def test_s3_bucket(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 30
                            }
                        ]
                    })
                ])
            }
        })

    @mark.it("creates an IAM role for EC2 with proper permissions")
    def test_ec2_iam_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 2)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
        })

    @mark.it("creates an Application Load Balancer with a listener")
    def test_application_load_balancer(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)

    @mark.it("creates an Auto Scaling Group with the correct configuration")
    def test_auto_scaling_group(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "6",
            "DesiredCapacity": "2"
        })

    @mark.it("creates CloudWatch alarms for CPU utilization and ALB response time")
    def test_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)  # CPU, Response Time, Unhealthy Targets

        # Check CPU utilization alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 80,
            "EvaluationPeriods": 2
        })

        # Check ALB response time alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 1,
            "EvaluationPeriods": 3
        })

    @mark.it("creates CloudFormation outputs for key resources")
    def test_cloudformation_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.to_json()["Outputs"]
        expected_outputs = [
            "LoadBalancerDNS",
            "VPCId",
            "DatabaseEndpoint",
            "S3BucketName",
            "EnvironmentSuffix"
        ]
        for output in expected_outputs:
            self.assertIn(output, outputs, f"Output {output} should exist")
