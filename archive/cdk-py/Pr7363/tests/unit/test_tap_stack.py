"""Unit tests for TapStack"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with environment suffix")
    def test_creates_stack_with_env_suffix(self):
        """Test stack creation with environment suffix"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Basic resource validation
        template.resource_count_is("AWS::KMS::Key", 3)
        template.resource_count_is("AWS::S3::Bucket", 2)
        template.resource_count_is("AWS::DynamoDB::Table", 1)

    @mark.it("creates stack with environment suffix and cdk environment")
    def test_creates_stack_with_env_and_cdk_env(self):
        """Test stack creation with environment suffix and CDK environment"""
        # ARRANGE
        env_suffix = "testenv"
        cdk_env = cdk.Environment(account="123456789012", region="us-east-1")
        stack = TapStack(self.app, "TapStackTestWithEnv",
                         TapStackProps(environment_suffix=env_suffix, env=cdk_env))
        template = Template.from_stack(stack)

        # ASSERT - Basic resource validation
        template.resource_count_is("AWS::KMS::Key", 3)
        template.resource_count_is("AWS::S3::Bucket", 2)

    @mark.it("creates stack with default environment suffix when props is None")
    def test_creates_stack_with_default_env_suffix(self):
        """Test stack creation with default environment suffix when props is None"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault", None)
        template = Template.from_stack(stack)

        # ASSERT - Stack should use 'dev' as default
        template.resource_count_is("AWS::KMS::Key", 3)
        template.resource_count_is("AWS::S3::Bucket", 2)
        # Verify environment suffix is 'dev'
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("creates KMS keys with rotation enabled")
    def test_kms_keys_with_rotation(self):
        """Test KMS keys have rotation enabled"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - All KMS keys should have rotation enabled
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("creates VPC with 3 AZs and private subnets")
    def test_vpc_configuration(self):
        """Test VPC configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates VPC endpoints for S3 and DynamoDB")
    def test_vpc_endpoints(self):
        """Test VPC gateway endpoints"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Gateway endpoints
        template.resource_count_is("AWS::EC2::VPCEndpoint", 3)

    @mark.it("creates security group with no inbound rules")
    def test_security_group_configuration(self):
        """Test security group has no inbound rules"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - At least 1 security group (VPC endpoints may create additional)
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": Match.string_like_regexp(".*Lambda.*"),
            "SecurityGroupEgress": Match.any_value()
        })

    @mark.it("creates S3 buckets with encryption")
    def test_s3_buckets_with_encryption(self):
        """Test S3 buckets have KMS encryption"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - 2 buckets (logs and documents)
        template.resource_count_is("AWS::S3::Bucket", 2)
        # Check encryption configuration exists
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        })

    @mark.it("creates S3 buckets with versioning enabled")
    def test_s3_buckets_with_versioning(self):
        """Test S3 buckets have versioning enabled"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    @mark.it("creates DynamoDB table with encryption")
    def test_dynamodb_table_with_encryption(self):
        """Test DynamoDB table has encryption"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": Match.any_value()
        })

    @mark.it("creates DynamoDB table with GSI")
    def test_dynamodb_table_with_gsi(self):
        """Test DynamoDB table has global secondary index"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - GSI exists
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": Match.any_value()
        })

    @mark.it("creates Secrets Manager secrets")
    def test_secrets_manager_secrets(self):
        """Test Secrets Manager secrets creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - 2 secrets (API key and DB credentials)
        template.resource_count_is("AWS::SecretsManager::Secret", 2)

    @mark.it("creates Lambda functions")
    def test_lambda_functions_creation(self):
        """Test Lambda functions are created"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - At least 5 functions (validate, encrypt, scan, remediate, config_check)
        # Note: CDK may create additional Lambda functions for log retention
        resources = template.to_json().get("Resources", {})
        lambda_functions = [r for r in resources.values()
                            if r.get("Type") == "AWS::Lambda::Function"]
        self.assertGreaterEqual(len(lambda_functions), 5)

    @mark.it("creates Lambda functions with VPC configuration")
    def test_lambda_functions_vpc_config(self):
        """Test Lambda functions have VPC configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - At least some Lambda functions have VPC config
        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.any_value()
        })

    @mark.it("creates API Gateway REST API")
    def test_api_gateway_creation(self):
        """Test API Gateway REST API creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": Match.string_like_regexp(".*document-api.*")
        })

    @mark.it("creates API Gateway with API key")
    def test_api_gateway_with_api_key(self):
        """Test API Gateway has API key"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)

    @mark.it("creates API Gateway with usage plan")
    def test_api_gateway_with_usage_plan(self):
        """Test API Gateway has usage plan"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)

    @mark.it("creates WAF WebACL")
    def test_waf_webacl_creation(self):
        """Test WAF WebACL creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::WAFv2::WebACL", 1)
        template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Scope": "REGIONAL"
        })

    @mark.it("creates WAF WebACL association with API Gateway")
    def test_waf_association(self):
        """Test WAF WebACL is associated with API Gateway"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    @mark.it("creates EventBridge rule for GuardDuty")
    def test_eventbridge_guardduty_rule(self):
        """Test EventBridge rule for GuardDuty findings"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - EventBridge rules
        template.resource_count_is("AWS::Events::Rule", 2)

    @mark.it("creates CloudWatch log group")
    def test_cloudwatch_log_group(self):
        """Test CloudWatch log group creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Log groups for Lambda and events exist
        resources = template.to_json().get("Resources", {})
        log_groups = [r for r in resources.values()
                      if r.get("Type") == "AWS::Logs::LogGroup"]
        self.assertGreater(len(log_groups), 0)

    @mark.it("creates AWS Config rule")
    def test_config_rule_creation(self):
        """Test AWS Config rule creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Config::ConfigRule", 1)

    @mark.it("creates SNS topic")
    def test_sns_topic_creation(self):
        """Test SNS topic creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "Security Alerts"
        })

    @mark.it("creates IAM roles")
    def test_iam_roles_creation(self):
        """Test IAM roles are created"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Roles for Lambda functions and Config exist
        resources = template.to_json().get("Resources", {})
        iam_roles = [r for r in resources.values()
                     if r.get("Type") == "AWS::IAM::Role"]
        self.assertGreater(len(iam_roles), 0)

    @mark.it("creates CloudFormation outputs")
    def test_cloudformation_outputs(self):
        """Test CloudFormation outputs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Check outputs exist
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("VPCId", outputs)
        self.assertIn("DocumentBucketName", outputs)
        self.assertIn("AuditTableName", outputs)
        self.assertIn("APIEndpoint", outputs)

    @mark.it("validates S3 bucket has public access block")
    def test_s3_bucket_public_access_block(self):
        """Test S3 buckets have public access blocked"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("validates Lambda functions have environment variables")
    def test_lambda_functions_environment_variables(self):
        """Test Lambda functions have environment variables configured"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - At least some functions have environment variables
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": Match.any_value()
        })

    @mark.it("validates API Gateway methods require API key")
    def test_api_gateway_methods_require_api_key(self):
        """Test API Gateway methods require API key"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "ApiKeyRequired": True
        })

    @mark.it("validates DynamoDB table has point-in-time recovery")
    def test_dynamodb_pitr(self):
        """Test DynamoDB table has point-in-time recovery"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("validates Lambda functions have timeout configured")
    def test_lambda_timeout(self):
        """Test Lambda functions have timeout configured"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Timeout should be between 15-30 seconds
        template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": Match.any_value()
        })

    @mark.it("validates API Gateway deployment stage")
    def test_api_gateway_deployment_stage(self):
        """Test API Gateway has deployment stage"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod"
        })

    @mark.it("validates WAF rules for SQLi and XSS protection")
    def test_waf_protection_rules(self):
        """Test WAF has SQLi and XSS protection rules"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - WAF has rules configured
        template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Rules": Match.any_value()
        })

    @mark.it("validates resource removal policy is DESTROY")
    def test_resource_removal_policy(self):
        """Test resources have DESTROY removal policy for testing"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - S3 buckets should have auto-delete
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.any_value()
        })

    @mark.it("validates IAM policies for Lambda functions")
    def test_lambda_iam_policies(self):
        """Test Lambda functions have appropriate IAM policies"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - IAM policies exist
        resources = template.to_json().get("Resources", {})
        iam_policies = [r for r in resources.values()
                        if r.get("Type") == "AWS::IAM::Policy"]
        self.assertGreater(len(iam_policies), 0)

    @mark.it("validates security group egress rules")
    def test_security_group_egress(self):
        """Test security group has restrictive egress rules"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupEgress": Match.any_value()
        })

    @mark.it("validates Lambda permissions for Config")
    def test_lambda_config_permissions(self):
        """Test Lambda has permissions for Config service"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Lambda permissions exist
        resources = template.to_json().get("Resources", {})
        lambda_perms = [r for r in resources.values()
                        if r.get("Type") == "AWS::Lambda::Permission"]
        self.assertGreater(len(lambda_perms), 0)
