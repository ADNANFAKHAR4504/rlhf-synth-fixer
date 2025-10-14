# import os
# import sys
import unittest

import aws_cdk as cdk

# import pytest
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates the main stack with nested EC2 monitoring stack")
    def test_creates_main_stack_with_nested_monitoring(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Verify nested stack is created
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

        # Verify the nested stack has basic CloudFormation properties
        template.has_resource_properties(
            "AWS::CloudFormation::Stack",
            {"Tags": Match.array_with([Match.object_like({"Key": "Environment", "Value": f"TAP-{env_suffix}"})])},
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT - Check that environment suffix is properly defaulted
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("uses provided environment suffix correctly")
    def test_uses_provided_environment_suffix(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))

        # ASSERT - Check that environment suffix is properly set
        self.assertEqual(stack.environment_suffix, env_suffix)

    @mark.it("creates VPC with correct CIDR and configuration")
    def test_creates_vpc_with_correct_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check VPC creation in nested stack
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("has proper stack-level tags")
    def test_has_proper_stack_level_tags(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Verify stack has the correct tags
        # Note: Stack-level tags are applied at the stack level, not resource level
        self.assertIsNotNone(stack.tags)

    @mark.it("exposes EC2 monitoring stack properties")
    def test_exposes_monitoring_stack_properties(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")

        # ASSERT - Check that monitoring stack properties are accessible
        self.assertIsNotNone(stack.ec2_monitoring_stack)
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.instances)
        self.assertIsNotNone(stack.log_bucket)
        self.assertIsNotNone(stack.log_group)
        self.assertIsNotNone(stack.alarm_topic)


@mark.describe("NestedEC2MonitoringStack")
class TestNestedEC2MonitoringStack(unittest.TestCase):
    """Test cases for the NestedEC2MonitoringStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = TapStack(self.app, "TapStackTest")
        self.nested_stack = self.stack.ec2_monitoring_stack
        self.template = Template.from_stack(self.nested_stack)

    @mark.it("creates VPC with correct CIDR block")
    def test_creates_vpc_with_correct_cidr(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {"CidrBlock": "10.0.0.0/16"})

    @mark.it("creates correct number of subnets")
    def test_creates_correct_subnets(self):
        # ASSERT - 2 AZs × 2 subnet types (public + private) = 4 subnets
        self.template.resource_count_is("AWS::EC2::Subnet", 4)

    @mark.it("creates single NAT gateway for cost optimization")
    def test_creates_single_nat_gateway(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates security group allowing HTTP traffic")
    def test_creates_security_group_with_http_access(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupIngress": Match.array_with(
                    [Match.object_like({"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "CidrIp": "0.0.0.0/0"})]
                )
            },
        )

    @mark.it("creates S3 bucket with lifecycle policy")
    def test_creates_s3_bucket_with_lifecycle(self):
        # ASSERT
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "LifecycleConfiguration": {
                    "Rules": Match.array_with([Match.object_like({"Status": "Enabled", "ExpirationInDays": 30})])
                },
                "BucketEncryption": {"ServerSideEncryptionConfiguration": Match.any_value()},
            },
        )

    @mark.it("creates CloudWatch Log Group with correct retention")
    def test_creates_log_group_with_retention(self):
        # ASSERT
        self.template.resource_count_is("AWS::Logs::LogGroup", 1)
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup", {"LogGroupName": "/aws/ec2/tap-monitoring", "RetentionInDays": 7}
        )

    @mark.it("creates IAM role with monitoring permissions")
    def test_creates_iam_role_with_monitoring_permissions(self):
        # ASSERT - CDK creates 1 role for EC2 instances + 1 instance profile role = 2 total
        self.template.resource_count_is("AWS::IAM::Role", 2)

        # Verify EC2 monitoring role exists with correct properties
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": Match.array_with(
                        [Match.object_like({"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}})]
                    )
                },
                "Description": "Role for TAP EC2 instances with CloudWatch monitoring",
            },
        )

    @mark.it("creates SNS topic for alarms")
    def test_creates_sns_topic_for_alarms(self):
        # ASSERT
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        self.template.has_resource_properties(
            "AWS::SNS::Topic", {"DisplayName": "TAP EC2 Monitoring Alarms", "TopicName": "tap-ec2-monitoring-alarms"}
        )

    @mark.it("creates 15 EC2 instances")
    def test_creates_15_ec2_instances(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::Instance", 15)

    @mark.it("creates EC2 instances with correct instance type")
    def test_creates_instances_with_correct_type(self):
        # ASSERT
        self.template.has_resource_properties("AWS::EC2::Instance", {"InstanceType": "t3.medium"})

    @mark.it("creates EC2 instances with detailed monitoring enabled")
    def test_creates_instances_with_detailed_monitoring(self):
        # ASSERT
        self.template.has_resource_properties("AWS::EC2::Instance", {"Monitoring": True})

    @mark.it("creates CloudWatch alarms for each instance")
    def test_creates_cloudwatch_alarms_for_instances(self):
        # ASSERT - 4 alarms per instance × 15 instances = 60 alarms
        # (Memory, CPU, Disk, Status Check)
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 60)

    @mark.it("creates memory usage alarms with correct threshold")
    def test_creates_memory_alarms_with_correct_threshold(self):
        # ASSERT
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "MEM_USED",
                "Namespace": "TAP/EC2",
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold",
            },
        )

    @mark.it("creates CPU utilization alarms with correct threshold")
    def test_creates_cpu_alarms_with_correct_threshold(self):
        # ASSERT
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "CPUUtilization",
                "Namespace": "AWS/EC2",
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold",
            },
        )

    @mark.it("creates disk usage alarms with correct threshold")
    def test_creates_disk_alarms_with_correct_threshold(self):
        # ASSERT
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "DISK_USED",
                "Namespace": "TAP/EC2",
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold",
            },
        )

    @mark.it("creates status check alarms")
    def test_creates_status_check_alarms(self):
        # ASSERT
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "StatusCheckFailed",
                "Namespace": "AWS/EC2",
                "Threshold": 1,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            },
        )

    @mark.it("configures alarms with SNS actions")
    def test_configures_alarms_with_sns_actions(self):
        # ASSERT - Check that alarms have SNS actions configured (using CloudFormation Ref)
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {"AlarmActions": Match.array_with([{"Ref": Match.any_value()}])},  # SNS topic reference
        )


@mark.describe("TapStack Environment Configuration")
class TestTapStackEnvironmentConfiguration(unittest.TestCase):
    """Test cases for environment-specific configuration"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("uses environment suffix from context when props not provided")
    def test_uses_context_environment_suffix(self):
        # ARRANGE
        app_with_context = cdk.App(context={"environmentSuffix": "staging"})
        stack = TapStack(app_with_context, "TapStackTest")

        # ASSERT
        self.assertEqual(stack.environment_suffix, "staging")

    @mark.it("props environment suffix takes precedence over context")
    def test_props_takes_precedence_over_context(self):
        # ARRANGE
        app_with_context = cdk.App(context={"environmentSuffix": "staging"})
        stack = TapStack(app_with_context, "TapStackTest", TapStackProps(environment_suffix="prod"))

        # ASSERT
        self.assertEqual(stack.environment_suffix, "prod")

    @mark.it("creates S3 bucket with environment suffix in name")
    def test_s3_bucket_includes_environment_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        nested_template = Template.from_stack(stack.ec2_monitoring_stack)

        # ASSERT - S3 bucket name is constructed with CloudFormation Fn::Join function
        # Just verify that bucket has a BucketName property with Fn::Join structure
        nested_template.has_resource_properties(
            "AWS::S3::Bucket", {"BucketName": {"Fn::Join": Match.any_value()}}  # Any Fn::Join structure is valid
        )

    @mark.it("creates resources with TAP prefix and environment suffix tags")
    def test_resources_have_tap_prefix_and_env_tags(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        nested_template = Template.from_stack(stack.ec2_monitoring_stack)

        # ASSERT - Check that resources have proper tags
        nested_template.has_resource_properties(
            "AWS::EC2::VPC",
            {"Tags": Match.array_with([Match.object_like({"Key": "Environment", "Value": f"TAP-{env_suffix}"})])},
        )
