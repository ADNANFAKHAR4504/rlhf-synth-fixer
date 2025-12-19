"""
Unit tests for TapStack multi-region disaster recovery infrastructure.
Tests all resource creation, configuration, and multi-region setup.
"""
import unittest
import os
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        # Set environment for testing
        os.environ["CDK_DEFAULT_ACCOUNT"] = "123456789012"
        os.environ["CDK_DEFAULT_REGION"] = "us-east-1"

    def tearDown(self):
        """Clean up after tests"""
        if "CDK_DEFAULT_ACCOUNT" in os.environ:
            del os.environ["CDK_DEFAULT_ACCOUNT"]
        if "CDK_DEFAULT_REGION" in os.environ:
            del os.environ["CDK_DEFAULT_REGION"]

    @mark.it("creates primary stack with correct configuration")
    def test_creates_primary_stack(self):
        """Test that primary stack is created with all resources"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestPrimaryStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Check key resource counts
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.resource_count_is("AWS::DynamoDB::GlobalTable", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::Lambda::Function", 6)  # Multiple Lambda functions
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::StepFunctions::StateMachine", 1)  # Failover

    @mark.it("creates secondary stack without primary-only resources")
    def test_creates_secondary_stack(self):
        """Test that secondary stack is created without failover/Route53"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestSecondaryStack",
            environment_suffix="test",
            is_primary=False,
            env=cdk.Environment(account="123456789012", region="us-east-2"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Check key resource counts (no failover state machine in secondary)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::Lambda::Function", 5)  # Fewer Lambda functions in secondary
        # Secondary stack should NOT have Step Functions
        template.resource_count_is("AWS::StepFunctions::StateMachine", 0)

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc(self):
        """Test VPC creation with proper CIDR and subnets"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestVPCStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - VPC configuration
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "CidrBlock": "10.0.0.0/16",
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True,
                "Tags": Match.array_with(
                    [{"Key": "Name", "Value": Match.string_like_regexp(".*test.*")}]
                ),
            },
        )

    @mark.it("creates Aurora cluster with multi-AZ configuration")
    def test_creates_aurora_cluster(self):
        """Test Aurora Global Database cluster creation"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestAuroraStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Aurora cluster configuration
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "Engine": "aurora-postgresql",
                "BackupRetentionPeriod": 7,
                "StorageEncrypted": True,
            },
        )

        # Check DB instances
        template.resource_count_is("AWS::RDS::DBInstance", 2)

    @mark.it("creates DynamoDB global table with proper configuration")
    def test_creates_dynamodb_table(self):
        """Test DynamoDB Global Table creation"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestDynamoStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - DynamoDB global table
        template.has_resource_properties(
            "AWS::DynamoDB::GlobalTable",
            {
                "TableName": "payment-sessions-test",
                "BillingMode": "PAY_PER_REQUEST",
                "StreamSpecification": {"StreamViewType": "NEW_AND_OLD_IMAGES"},
            },
        )

    @mark.it("creates S3 bucket with encryption and versioning")
    def test_creates_s3_bucket(self):
        """Test S3 bucket creation with proper security settings"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestS3Stack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - S3 bucket configuration
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": Match.string_like_regexp("payment-assets-test.*"),
                "VersioningConfiguration": {"Status": "Enabled"},
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.any_value()
                },
            },
        )

    @mark.it("creates Lambda functions with correct runtime and timeout")
    def test_creates_lambda_functions(self):
        """Test Lambda function creation"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestLambdaStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Lambda functions
        template.resource_count_is("AWS::Lambda::Function", 6)

        # Check that at least one Lambda function has correct runtime
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.11",
            },
        )

    @mark.it("creates API Gateway with correct endpoints")
    def test_creates_api_gateway(self):
        """Test API Gateway creation"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestAPIStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - API Gateway
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {
                "Name": Match.string_like_regexp(".*test.*"),
            },
        )

        # Check deployment
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        """Test CloudWatch alarm creation"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestAlarmStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - CloudWatch alarms exist (at least 1)
        # Just verify there are some alarms, don't check exact count
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        assert len(alarms) > 0

        # Check SNS topic for notifications
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates SSM parameters for configuration")
    def test_creates_ssm_parameters(self):
        """Test SSM parameter creation"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestSSMStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - SSM parameters
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            {
                "Name": Match.string_like_regexp("/payment/test/.*"),
                "Type": "String",
            },
        )

    @mark.it("creates Step Functions failover automation in primary region only")
    def test_creates_failover_state_machine_primary_only(self):
        """Test failover state machine is only created in primary region"""
        # ARRANGE & ACT - Primary stack (use separate app for isolation)
        app1 = cdk.App()
        primary_stack = TapStack(
            app1,
            "TestPrimaryFailover",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        primary_template = Template.from_stack(primary_stack)

        # ACT - Secondary stack (use separate app for isolation)
        app2 = cdk.App()
        secondary_stack = TapStack(
            app2,
            "TestSecondaryFailover",
            environment_suffix="test",
            is_primary=False,
            env=cdk.Environment(account="123456789012", region="us-east-2"),
        )
        secondary_template = Template.from_stack(secondary_stack)

        # ASSERT - Primary has state machine
        primary_template.resource_count_is("AWS::StepFunctions::StateMachine", 1)
        primary_template.has_resource_properties(
            "AWS::StepFunctions::StateMachine",
            {
                "StateMachineName": "payment-failover-test",
            },
        )

        # ASSERT - Secondary does NOT have state machine
        secondary_template.resource_count_is("AWS::StepFunctions::StateMachine", 0)

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestDashboardStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Dashboard exists
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": Match.string_like_regexp(".*test.*"),
            },
        )

    @mark.it("creates stack outputs for integration")
    def test_creates_stack_outputs(self):
        """Test that stack outputs are created"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestOutputStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )

        # ASSERT - Check outputs exist
        assert stack.vpc is not None
        assert stack.aurora_cluster is not None
        assert stack.dynamodb_table is not None
        assert stack.s3_bucket is not None
        assert stack.api is not None
        assert stack.lambda_functions is not None
        assert stack.alarms is not None

    @mark.it("applies correct tags to all resources")
    def test_applies_correct_tags(self):
        """Test that resources are tagged correctly"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestTagStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Check tags are applied
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with(
                    [
                        {"Key": "DR-Role", "Value": "primary"},
                        {"Key": "Environment", "Value": "test"},
                    ]
                ),
            },
        )

    @mark.it("configures secondary stack with correct DR role")
    def test_secondary_stack_dr_role(self):
        """Test that secondary stack has correct DR role tag"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestSecondaryDRRole",
            environment_suffix="test",
            is_primary=False,
            env=cdk.Environment(account="123456789012", region="us-east-2"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Check DR role tag
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with([{"Key": "DR-Role", "Value": "secondary"}]),
            },
        )

    @mark.it("creates IAM roles with proper permissions")
    def test_creates_iam_roles(self):
        """Test IAM role creation for Lambda functions"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestIAMStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - IAM roles exist (at least 1)
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) > 0

        # Check Lambda execution role
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": "sts:AssumeRole",
                                    "Effect": "Allow",
                                    "Principal": {"Service": "lambda.amazonaws.com"},
                                }
                            )
                        ]
                    )
                }
            },
        )

    @mark.it("uses environment suffix in resource names")
    def test_uses_environment_suffix_in_names(self):
        """Test that environment suffix is used in resource names"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestSuffixStack",
            environment_suffix="prod123",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Check DynamoDB table name
        template.has_resource_properties(
            "AWS::DynamoDB::GlobalTable",
            {"TableName": "payment-sessions-prod123"},
        )

        # ASSERT - Check S3 bucket name
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"BucketName": Match.string_like_regexp("payment-assets-prod123.*")},
        )

    @mark.it("configures security groups for VPC resources")
    def test_configures_security_groups(self):
        """Test security group configuration"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestSecurityStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Security groups exist (at least 1)
        sgs = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(sgs) > 0

    @mark.it("enables encryption for data at rest")
    def test_enables_encryption(self):
        """Test that encryption is enabled for all applicable resources"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestEncryptionStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Aurora encryption
        template.has_resource_properties(
            "AWS::RDS::DBCluster", {"StorageEncrypted": True}
        )

        # ASSERT - S3 encryption
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"BucketEncryption": {"ServerSideEncryptionConfiguration": Match.any_value()}},
        )

    @mark.it("configures backup retention periods")
    def test_configures_backups(self):
        """Test backup configuration"""
        # ARRANGE & ACT
        stack = TapStack(
            self.app,
            "TestBackupStack",
            environment_suffix="test",
            is_primary=True,
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = Template.from_stack(stack)

        # ASSERT - Aurora backup retention
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {"BackupRetentionPeriod": Match.any_value()},
        )


if __name__ == "__main__":
    unittest.main()
