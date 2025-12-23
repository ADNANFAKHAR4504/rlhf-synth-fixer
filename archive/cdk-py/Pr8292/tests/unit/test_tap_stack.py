"""Unit tests for TapStack and RDS High Availability Infrastructure."""

import unittest
from unittest.mock import MagicMock, patch
import aws_cdk as cdk
from aws_cdk import assertions
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.rds_high_availability_infra import (RdsHighAvailabilityInfra,
                                             RdsHighAvailabilityInfraProps)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()

    @mark.it("creates nested stack with correct configuration")
    def test_creates_nested_stack(self):
        """Test that TapStack creates a nested RDS infrastructure stack."""
        # ARRANGE
        env_suffix = "testenv"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props)
        template = assertions.Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFormation::Stack", 1)
        template.has_resource(
            "AWS::CloudFormation::Stack", {
                "Properties": {
                    "Tags":
                    assertions.Match.array_with([{
                        "Key": "CostCenter",
                        "Value": "engineering"
                    }, {
                        "Key": "Environment",
                        "Value": env_suffix
                    }, {
                        "Key": "Project",
                        "Value": "tap"
                    }])
                }
            })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix."""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = assertions.Template.from_stack(stack)

        # ASSERT
        template.has_resource(
            "AWS::CloudFormation::Stack", {
                "Properties": {
                    "Tags":
                    assertions.Match.array_with([{
                        "Key": "Environment",
                        "Value": "dev"
                    }])
                }
            })

    @mark.it("uses context values when props not provided")
    def test_uses_context_values(self):
        """Test that stack uses CDK context values."""
        # ARRANGE
        self.app.node.set_context("environmentSuffix", "context-env")
        self.app.node.set_context("costCenter", "context-center")
        self.app.node.set_context("project", "context-project")

        stack = TapStack(self.app, "TapStackContext")
        template = assertions.Template.from_stack(stack)

        # ASSERT
        template.has_resource(
            "AWS::CloudFormation::Stack", {
                "Properties": {
                    "Tags":
                    assertions.Match.array_with([{
                        "Key": "Environment",
                        "Value": "context-env"
                    }])
                }
            })

    @mark.it("props override context values")
    def test_props_override_context(self):
        """Test that props values override context values."""
        # ARRANGE
        self.app.node.set_context("environmentSuffix", "context-env")
        self.app.node.set_context("costCenter", "context-center")

        props = TapStackProps(environment_suffix="props-env",
                              cost_center="props-center")
        stack = TapStack(self.app, "TapStackOverride", props)
        template = assertions.Template.from_stack(stack)

        # ASSERT
        template.has_resource(
            "AWS::CloudFormation::Stack", {
                "Properties": {
                    "Tags":
                    assertions.Match.array_with([{
                        "Key": "Environment",
                        "Value": "props-env"
                    }])
                }
            })

    @mark.it("creates RDS infrastructure with correct props")
    def test_creates_rds_infrastructure(self):
        """Test that RDS infrastructure is created with correct properties."""
        # ARRANGE
        props = TapStackProps(
            environment_suffix="test",
            vpc_id=
            None,  # Don't use existing VPC in tests to avoid lookup issues
            admin_email="admin@test.com",
            cost_center="testing",
            project="unittest")
        stack = TapStack(
            self.app,
            "TapStackRds",
            props,
            env=cdk.Environment(
                account="123456789012",  # Mock account for testing
                region="us-east-1"  # Mock region for testing
            ))

        # ASSERT
        self.assertIsNotNone(stack.rds_infra)
        self.assertIsInstance(stack.rds_infra, RdsHighAvailabilityInfra)
        self.assertEqual(stack.rds_infra.props.environment_suffix, "test")
        self.assertEqual(stack.rds_infra.props.vpc_id,
                         None)  # Updated expectation
        self.assertEqual(stack.rds_infra.props.admin_email, "admin@test.com")
        self.assertEqual(stack.rds_infra.props.cost_center, "testing")
        self.assertEqual(stack.rds_infra.props.project, "unittest")


@mark.describe("RdsHighAvailabilityInfra")
class TestRdsHighAvailabilityInfra(unittest.TestCase):
    """Test cases for RDS High Availability Infrastructure."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")
        self.props = RdsHighAvailabilityInfraProps(
            environment_suffix="test", admin_email="test@example.com")

    @mark.it("creates all required AWS resources")
    def test_creates_required_resources(self):
        """Test that all required AWS resources are created."""
        # ARRANGE
        # Use is_localstack=False to test full AWS resources
        props = RdsHighAvailabilityInfraProps(
            environment_suffix="test",
            admin_email="test@example.com",
            is_localstack=False
        )
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra", props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT - Verify key resources are created
        template.resource_count_is("AWS::KMS::Key", 2)  # RDS and S3 KMS keys
        template.resource_count_is("AWS::S3::Bucket", 1)  # Backup bucket
        template.resource_count_is("AWS::SNS::Topic", 1)  # Notification topic
        template.resource_count_is(
            "AWS::IAM::Role",
            3)  # Monitoring, backup, and service-linked roles
        template.resource_count_is("AWS::RDS::DBInstance", 1)  # RDS instance
        template.resource_count_is("AWS::Backup::BackupPlan", 1)  # Backup plan
        template.resource_count_is("AWS::Backup::BackupVault",
                                   1)  # Backup vault
        template.resource_count_is("AWS::CloudWatch::Alarm",
                                   3)  # CloudWatch alarms

    @mark.it("creates VPC when vpc_id not provided")
    def test_creates_vpc_when_not_provided(self):
        """Test VPC creation when vpc_id is not provided."""
        # ARRANGE
        props = RdsHighAvailabilityInfraProps(environment_suffix="test")
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra", props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC", {
                "Tags":
                assertions.Match.array_with([{
                    "Key": "Environment",
                    "Value": "test"
                }])
            })

    @mark.it("configures S3 bucket with versioning and encryption")
    def test_s3_bucket_configuration(self):
        """Test S3 bucket configuration."""
        # ARRANGE
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra",
                                             self.props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::S3::Bucket", {
                "BucketName": "rds-backups-tap-test",
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

    @mark.it("configures RDS with Multi-AZ and encryption")
    def test_rds_instance_configuration(self):
        """Test RDS instance configuration."""
        # ARRANGE
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra",
                                             self.props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::RDS::DBInstance", {
                "DBInstanceIdentifier": "postgres-tap-test",
                "Engine": "postgres",
                "MultiAZ": True,
                "StorageEncrypted": True,
                "AllocatedStorage": "100",
                "MaxAllocatedStorage": 1000,
                "BackupRetentionPeriod": 35,
                "PreferredBackupWindow": "03:00-04:00",
                "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
                "DeletionProtection": False,
                "EnablePerformanceInsights": True
            })

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms configuration."""
        # ARRANGE
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra",
                                             self.props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT - CPU alarm
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm", {
                "AlarmName": "rds-cpu-test",
                "MetricName": "CPUUtilization",
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold"
            })

        # Storage alarm
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm", {
                "AlarmName": "rds-storage-test",
                "MetricName": "FreeStorageSpace",
                "Threshold": 2000000000,
                "ComparisonOperator": "LessThanThreshold"
            })

        # Connections alarm
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm", {
                "AlarmName": "rds-connections-test",
                "MetricName": "DatabaseConnections",
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold"
            })

    @mark.it("configures backup plan with hourly backups")
    def test_backup_plan_rpo(self):
        """Test backup plan with hourly backup schedule."""
        # ARRANGE
        # Use is_localstack=False to test AWS Backup (not supported in LocalStack)
        props = RdsHighAvailabilityInfraProps(
            environment_suffix="test",
            admin_email="test@example.com",
            is_localstack=False
        )
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra", props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::Backup::BackupPlan",
            {
                "BackupPlan": {
                    "BackupPlanName":
                    "rds-backup-plan-test",
                    "BackupPlanRule":
                    assertions.Match.array_with([
                        assertions.Match.object_like({
                            "RuleName":
                            "FrequentBackups",
                            "ScheduleExpression":
                            "cron(0 * * * ? *)"  # Every hour
                        })
                    ])
                }
            })

    @mark.it("creates SNS topic with email subscription")
    def test_sns_configuration(self):
        """Test SNS topic and subscription configuration."""
        # ARRANGE
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra",
                                             self.props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "rds-alerts-test",
            "DisplayName": "RDS Alerts - TEST"
        })

        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "test@example.com"
        })

    @mark.it("enables KMS key rotation")
    def test_kms_key_rotation(self):
        """Test KMS keys have rotation enabled."""
        # ARRANGE
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra",
                                             self.props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::KMS::Key", {
                "Description": "KMS key for RDS encryption - test",
                "EnableKeyRotation": True
            })

        template.has_resource_properties(
            "AWS::KMS::Key", {
                "Description": "KMS key for S3 backup encryption - test",
                "EnableKeyRotation": True
            })

    @mark.it("sets DESTROY removal policy for cleanup")
    def test_removal_policies(self):
        """Test resources have DESTROY removal policy."""
        # ARRANGE
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra",
                                             self.props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        template.has_resource("AWS::S3::Bucket", {"DeletionPolicy": "Delete"})

        template.has_resource("AWS::KMS::Key", {"DeletionPolicy": "Delete"})

        template.has_resource("AWS::RDS::DBInstance",
                              {"DeletionPolicy": "Delete"})

    @mark.it("creates CloudFormation outputs")
    def test_cfn_outputs(self):
        """Test CloudFormation outputs are created."""
        # ARRANGE
        rds_stack = RdsHighAvailabilityInfra(self.stack, "RdsInfra",
                                             self.props)
        template = assertions.Template.from_stack(rds_stack)

        # ASSERT
        # No Export names for nested stack outputs (LocalStack compatibility)
        template.has_output("RdsEndpoint", {
            "Description": "RDS PostgreSQL endpoint"
        })

        template.has_output("RdsPort", {
            "Description": "RDS PostgreSQL port"
        })

        template.has_output("BackupBucketName", {
            "Description": "S3 backup bucket name"
        })

        template.has_output("NotificationTopicArn", {
            "Description": "SNS notification topic ARN"
        })


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps class."""

    @mark.it("initializes with default values")
    def test_default_values(self):
        """Test default values for TapStackProps."""
        # ARRANGE & ACT
        props = TapStackProps()

        # ASSERT
        self.assertIsNone(props.environment_suffix)
        self.assertIsNone(props.vpc_id)
        self.assertEqual(props.admin_email, "admin@company.com")
        self.assertEqual(props.cost_center, "engineering")
        self.assertEqual(props.project, "tap")

    @mark.it("accepts custom values")
    def test_custom_values(self):
        """Test custom values for TapStackProps."""
        # ARRANGE & ACT
        props = TapStackProps(environment_suffix="prod",
                              vpc_id="vpc-custom",
                              admin_email="custom@test.com",
                              cost_center="finance",
                              project="myproject")

        # ASSERT
        self.assertEqual(props.environment_suffix, "prod")
        self.assertEqual(props.vpc_id, "vpc-custom")
        self.assertEqual(props.admin_email, "custom@test.com")
        self.assertEqual(props.cost_center, "finance")
        self.assertEqual(props.project, "myproject")


@mark.describe("RdsHighAvailabilityInfraProps")
class TestRdsHighAvailabilityInfraProps(unittest.TestCase):
    """Test cases for RdsHighAvailabilityInfraProps class."""

    @mark.it("requires environment_suffix")
    def test_requires_environment_suffix(self):
        """Test that environment_suffix is required."""
        # ARRANGE & ACT
        props = RdsHighAvailabilityInfraProps(environment_suffix="test")

        # ASSERT
        self.assertEqual(props.environment_suffix, "test")

    @mark.it("has correct default values")
    def test_default_values(self):
        """Test default values for RdsHighAvailabilityInfraProps."""
        # ARRANGE & ACT
        props = RdsHighAvailabilityInfraProps(environment_suffix="test")

        # ASSERT
        self.assertIsNone(props.vpc_id)
        self.assertEqual(props.admin_email, "admin@company.com")
        self.assertEqual(props.cost_center, "engineering")
        self.assertEqual(props.project, "tap")

    @mark.it("accepts all custom values")
    def test_all_custom_values(self):
        """Test all custom values for RdsHighAvailabilityInfraProps."""
        # ARRANGE & ACT
        props = RdsHighAvailabilityInfraProps(environment_suffix="staging",
                                              vpc_id="vpc-staging",
                                              admin_email="staging@test.com",
                                              cost_center="operations",
                                              project="staging-project")

        # ASSERT
        self.assertEqual(props.environment_suffix, "staging")
        self.assertEqual(props.vpc_id, "vpc-staging")
        self.assertEqual(props.admin_email, "staging@test.com")
        self.assertEqual(props.cost_center, "operations")
        self.assertEqual(props.project, "staging-project")
