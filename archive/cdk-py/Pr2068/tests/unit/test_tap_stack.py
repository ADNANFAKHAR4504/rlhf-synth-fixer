"""Unit tests for TapStack and SecurityStack"""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from lib.tap_stack import TapStack, TapStackProps
from lib.security_stack import SecurityStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a nested security stack with correct environment suffix")
    def test_creates_nested_security_stack(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        
        # ASSERT
        self.assertIsNotNone(stack.security_stack)
        self.assertEqual(stack.environment_suffix, env_suffix)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        
        # ASSERT
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("gets environment suffix from context if not in props")
    def test_gets_env_suffix_from_context(self):
        # ARRANGE
        self.app = cdk.App(context={'environmentSuffix': 'context-env'})
        stack = TapStack(self.app, "TapStackTestContext")
        
        # ASSERT
        self.assertEqual(stack.environment_suffix, "context-env")


@mark.describe("SecurityStack")
class TestSecurityStack(unittest.TestCase):
    """Test cases for the SecurityStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates VPC with public subnets")
    def test_creates_vpc_with_public_subnets(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest", 
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        # Check for public subnets
        template.resource_count_is("AWS::EC2::Subnet", 2)

    @mark.it("creates S3 bucket with encryption")
    def test_creates_s3_bucket_with_encryption(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [{
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }]
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates SNS topics for notifications")
    def test_creates_sns_topics(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 2)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"SecureApp-CPUAlarms-{self.env_suffix}"
        })
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"SecureApp-S3Notifications-{self.env_suffix}"
        })

    @mark.it("creates RDS MySQL instance in public subnet")
    def test_creates_rds_mysql_instance(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": f"secureapp-mysql-{self.env_suffix}",
            "Engine": "mysql",
            "PubliclyAccessible": True,
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7
        })

    @mark.it("creates DB subnet group")
    def test_creates_db_subnet_group(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupName": f"secureapp-db-subnet-group-{self.env_suffix}",
            "DBSubnetGroupDescription": "Subnet group for SecureApp RDS instance"
        })

    @mark.it("creates security groups for RDS and EC2")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        # Should have at least 2 security groups (RDS and EC2)
        security_groups = template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(security_groups), 2)
        
        # Check RDS security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"SecureApp-RDSSecurityGroup-{self.env_suffix}",
            "GroupDescription": "Security group for SecureApp RDS MySQL instance"
        })
        
        # Check EC2 security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"SecureApp-EC2SecurityGroup-{self.env_suffix}",
            "GroupDescription": "Security group for SecureApp EC2 instances"
        })

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_ec2_iam_role(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"SecureApp-EC2Role-{self.env_suffix}",
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }]
            }
        })

    @mark.it("creates Auto Scaling Group with correct capacity")
    def test_creates_auto_scaling_group(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "AutoScalingGroupName": f"SecureApp-AutoScalingGroup-{self.env_suffix}",
            "MinSize": "2",
            "MaxSize": "5",
            "DesiredCapacity": "2"
        })

    @mark.it("creates launch template for EC2 instances")
    def test_creates_launch_template(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateName": f"SecureApp-LaunchTemplate-{self.env_suffix}"
        })

    @mark.it("creates CloudWatch alarm for CPU utilization")
    def test_creates_cloudwatch_alarm(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"SecureApp-HighCPUUtilization-{self.env_suffix}",
            "AlarmDescription": "Alert when EC2 CPU utilization exceeds 75%",
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/EC2",
            "Statistic": "Average",
            "Threshold": 75,
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2
        })

    @mark.it("creates security group ingress rules")
    def test_creates_security_group_rules(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        # Should have ingress rules for RDS
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306
        })

    @mark.it("creates CloudFormation outputs")
    def test_creates_cfn_outputs(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("VPCId", outputs)
        self.assertIn("S3BucketName", outputs)
        self.assertIn("RDSEndpoint", outputs)
        self.assertIn("AutoScalingGroupName", outputs)
        self.assertIn("SNSTopicArn", outputs)

    @mark.it("creates S3 bucket notification configuration")
    def test_creates_s3_bucket_notifications(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        # Check for custom resource for S3 notifications
        template.resource_count_is("Custom::S3BucketNotifications", 1)

    @mark.it("uses correct MySQL engine version")
    def test_uses_correct_mysql_version(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "EngineVersion": Match.string_like_regexp("8\\.0\\.*")
        })

    @mark.it("creates secrets for RDS credentials")
    def test_creates_rds_secrets(self):
        # ARRANGE
        stack = SecurityStack(self.app, "SecurityStackTest",
                             environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"SecureApp-RDSCredentials-{self.env_suffix}"
        })


if __name__ == "__main__":
    unittest.main()