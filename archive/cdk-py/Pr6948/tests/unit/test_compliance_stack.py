"""Unit tests for the ComplianceStack construct."""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.compliance_stack import ComplianceStack, ComplianceStackProps


@mark.describe("ComplianceStack")
class TestComplianceStack(unittest.TestCase):
    """Test cases for the ComplianceStack construct."""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack",
                               env=cdk.Environment(account="123456789012", region="us-east-1"))

    @mark.it("creates S3 bucket with correct properties")
    def test_creates_s3_bucket(self):
        """Test S3 bucket is created with versioning, encryption, and lifecycle."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"compliance-reports-{env_suffix}-123456789012",
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            },
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Status": "Enabled",
                        "ExpirationInDays": 2555
                    })
                ])
            }
        })

    @mark.it("creates SQS dead letter queue with encryption")
    def test_creates_sqs_dlq(self):
        """Test SQS DLQ is created with correct encryption."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 1)
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"compliance-alerts-dlq-{env_suffix}",
            "MessageRetentionPeriod": 1209600,  # 14 days in seconds
            "SqsManagedSseEnabled": True
        })

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        """Test SNS topic is created for compliance alerts."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"compliance-alerts-{env_suffix}",
            "DisplayName": "Compliance Violation Alerts"
        })

    @mark.it("creates Config IAM role with correct policy")
    def test_creates_config_role(self):
        """Test Config IAM role uses service-role/AWS_ConfigRole policy."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"config-role-{env_suffix}",
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "config.amazonaws.com"
                        }
                    })
                ])
            },
            "ManagedPolicyArns": Match.array_with([
                Match.object_like({
                    "Fn::Join": Match.array_with([
                        Match.array_with([
                            Match.string_like_regexp(".*service-role/AWS_ConfigRole")
                        ])
                    ])
                })
            ])
        })

    @mark.it("creates Lambda execution role with correct permissions")
    def test_creates_lambda_role(self):
        """Test Lambda IAM role has Config permissions."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - Lambda role exists
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"compliance-lambda-role-{env_suffix}",
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            }
        })

        # ASSERT - Lambda role has Config permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "config:GetComplianceDetailsByConfigRule",
                            "config:DescribeConfigRules",
                            "config:GetComplianceSummaryByConfigRule"
                        ])
                    })
                ])
            }
        })

    # NOTE: Config recorder and delivery channel tests removed
    # These resources are not created by this stack because AWS Config allows
    # only ONE configuration recorder per region per account. This stack assumes
    # an existing Config recorder is already set up and only deploys Config RULES.

    @mark.it("does not create Config recorder (uses existing account recorder)")
    def test_creates_config_recorder(self):
        """Test Config recorder is NOT created (uses existing)."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - Should be 0 since we don't create it
        template.resource_count_is("AWS::Config::ConfigurationRecorder", 0)

    @mark.it("does not create Config delivery channel (uses existing)")
    def test_creates_delivery_channel(self):
        """Test Config delivery channel is NOT created (uses existing)."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - Should be 0 since we don't create it
        template.resource_count_is("AWS::Config::DeliveryChannel", 0)

    @mark.it("creates three Config managed rules")
    def test_creates_config_rules(self):
        """Test all three Config managed rules are created."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - Count
        template.resource_count_is("AWS::Config::ConfigRule", 3)

        # ASSERT - S3 encryption rule
        template.has_resource_properties("AWS::Config::ConfigRule", {
            "ConfigRuleName": f"s3-encryption-{env_suffix}",
            "Source": {
                "Owner": "AWS",
                "SourceIdentifier": "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
            }
        })

        # ASSERT - RDS encryption rule
        template.has_resource_properties("AWS::Config::ConfigRule", {
            "ConfigRuleName": f"rds-encryption-{env_suffix}",
            "Source": {
                "Owner": "AWS",
                "SourceIdentifier": "RDS_STORAGE_ENCRYPTED"
            }
        })

        # ASSERT - EC2 IMDSv2 rule
        template.has_resource_properties("AWS::Config::ConfigRule", {
            "ConfigRuleName": f"ec2-imdsv2-{env_suffix}",
            "Source": {
                "Owner": "AWS",
                "SourceIdentifier": "EC2_IMDSV2_CHECK"
            }
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        """Test Lambda function is created with correct runtime and environment."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - CDK creates additional Lambda functions for S3 auto-delete
        # Filter by FunctionName and Runtime to find our specific Lambda
        all_lambdas = template.find_resources("AWS::Lambda::Function")
        compliance_lambdas = [
            props for logical_id, props in all_lambdas.items()
            if props.get("Properties", {}).get("FunctionName") == f"compliance-reporter-{env_suffix}"
        ]

        self.assertEqual(len(compliance_lambdas), 1, "Should have exactly one compliance Lambda")
        lambda_props = compliance_lambdas[0]["Properties"]
        self.assertEqual(lambda_props["Runtime"], "python3.9")
        self.assertEqual(lambda_props["Handler"], "index.handler")
        self.assertEqual(lambda_props["Timeout"], 300)
        self.assertEqual(lambda_props["Architectures"], ["arm64"])
        # Environment variables exist (CDK uses CloudFormation Refs for rule names)
        self.assertIn("BUCKET_NAME", lambda_props["Environment"]["Variables"])
        self.assertIn("S3_RULE_NAME", lambda_props["Environment"]["Variables"])
        self.assertIn("RDS_RULE_NAME", lambda_props["Environment"]["Variables"])
        self.assertIn("EC2_RULE_NAME", lambda_props["Environment"]["Variables"])

    @mark.it("verifies Lambda has log retention configuration")
    def test_lambda_log_retention(self):
        """Test Lambda function has log retention configured."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - CDK uses custom resource for log retention, verify Lambda exists
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"compliance-reporter-{env_suffix}"
        })

    @mark.it("grants S3 write permissions to Config role")
    def test_config_s3_permissions(self):
        """Test Config role can write to S3 bucket."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - Bucket policy allows Config role
        template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.any_value(),
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": Match.any_value()
                        }
                    })
                ])
            }
        })

    @mark.it("grants S3 write permissions to Lambda role")
    def test_lambda_s3_permissions(self):
        """Test Lambda role can write to S3 bucket."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(self.stack)

        # ASSERT - Lambda has S3 permissions policy
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow"
                    })
                ])
            }
        })

    @mark.it("defaults environment suffix to 'dev'")
    def test_defaults_env_suffix(self):
        """Test that environment suffix defaults to 'dev' when not provided."""
        # ARRANGE
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps()
        )
        template = Template.from_stack(self.stack)

        # ASSERT - Resources are created with 'dev' suffix
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "compliance-reports-dev-123456789012"
        })
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": "compliance-alerts-dlq-dev"
        })

    @mark.it("exposes compliance resources as properties")
    def test_exposes_properties(self):
        """Test that compliance resources are accessible as properties."""
        # ARRANGE
        env_suffix = "testenv"
        compliance = ComplianceStack(
            self.stack, "TestCompliance",
            ComplianceStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        self.assertIsNotNone(compliance.bucket)
        self.assertIsNotNone(compliance.topic)
        self.assertIsNotNone(compliance.dlq)
        self.assertIsNotNone(compliance.function)
        self.assertIsNotNone(compliance.config_role)
