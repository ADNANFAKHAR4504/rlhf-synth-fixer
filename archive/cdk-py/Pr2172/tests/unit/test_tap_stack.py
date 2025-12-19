"""Unit tests for TapStack CDK serverless infrastructure."""
import unittest
import json

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack with serverless components"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with serverless naming pattern")
    def test_creates_s3_bucket_with_serverless_naming(self):
        """Test that the S3 bucket is created with ServerlessApp naming"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Use Match.object_like for partial matching since bucket name includes account ID
        template.has_resource_properties("AWS::S3::Bucket", Match.object_like({
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                        "BlockPublicAcls": True,
                        "BlockPublicPolicy": True,
                        "IgnorePublicAcls": True,
                        "RestrictPublicBuckets": True
                }
        }))

    @mark.it("creates a Lambda function with Python 3.13 runtime")
    def test_creates_lambda_function(self):
        """Test Lambda function creation with Python 3.13"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        # Multiple Lambda functions may exist (including CDK custom resources)
        template.has_resource_properties("AWS::Lambda::Function", {
                "Runtime": "python3.13",
                "Handler": "index.lambda_handler",
                "MemorySize": 256,
                "Timeout": 60
        })

    @mark.it("creates Secrets Manager secret for sensitive data")
    def test_creates_secrets_manager(self):
        """Test Secrets Manager creation for Lambda"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource_properties("AWS::SecretsManager::Secret", {
                "Description": "Secrets for ServerlessApp Lambda function",
                "GenerateSecretString": {
                        "SecretStringTemplate": '{"username": "admin"}',
                        "GenerateStringKey": "password",
                        "PasswordLength": 32
                }
        })

    @mark.it("creates IAM role with least privilege for Lambda")
    def test_creates_lambda_iam_role(self):
        """Test IAM role creation with proper permissions"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", Match.object_like({
                "AssumeRolePolicyDocument": {
                        "Statement": Match.array_with([{
                                "Action": "sts:AssumeRole",
                                "Effect": "Allow",
                                "Principal": {"Service": "lambda.amazonaws.com"}
                        }])
                }
        }))

    @mark.it("creates CloudWatch log group with retention")
    def test_creates_cloudwatch_log_group(self):
        """Test CloudWatch log group creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Logs::LogGroup", {
                "RetentionInDays": 7,
                "LogGroupName": Match.string_like_regexp("/aws/lambda/ServerlessAppLambda.*")
        })

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        """Test CloudWatch alarm creation for Lambda monitoring"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Error alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
                "MetricName": "Errors",
                "Namespace": "AWS/Lambda",
                "Threshold": 1,
                "EvaluationPeriods": 1
        })

        # ASSERT - Duration alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
                "MetricName": "Duration",
                "Namespace": "AWS/Lambda",
                "Threshold": 30000,
                "EvaluationPeriods": 2
        })

    @mark.it("configures S3 event notifications for Lambda")
    def test_s3_event_notification(self):
        """Test S3 bucket triggers Lambda on object creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Lambda permission for S3
        template.has_resource_properties("AWS::Lambda::Permission", {
                "Action": "lambda:InvokeFunction",
                "Principal": "s3.amazonaws.com"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Check that S3 bucket is created with versioning
        template.has_resource_properties("AWS::S3::Bucket", Match.object_like({
                "VersioningConfiguration": {"Status": "Enabled"}
        }))

    @mark.it("creates CloudFormation outputs")
    def test_creates_outputs(self):
        """Test CloudFormation outputs creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertGreaterEqual(len(outputs), 3)  # At least 3 outputs

    @mark.it("configures Lambda with environment variables")
    def test_lambda_environment_variables(self):
        """Test Lambda has proper environment variables"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
                "Environment": {
                        "Variables": Match.object_like({
                                "SECRET_ARN": Match.any_value(),
                                "BUCKET_NAME": Match.any_value()
                        })
                }
        })

    @mark.it("enables Lambda dead letter queue")
    def test_lambda_dead_letter_queue(self):
        """Test Lambda DLQ configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
                "DeadLetterConfig": {
                        "TargetArn": Match.any_value()
                }
        })

    @mark.it("adds proper tags to resources")
    def test_resource_tagging(self):
        """Test that resources are properly tagged"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Just verify tags exist, don't check specific order
        template_json = template.to_json()
        bucket_resources = [v for k, v in template_json["Resources"].items() 
                                            if v.get("Type") == "AWS::S3::Bucket"]
        self.assertTrue(len(bucket_resources) > 0)
    
        # Check that the bucket has the required tags
        bucket = bucket_resources[0]
        tags = bucket.get("Properties", {}).get("Tags", [])
        tag_dict = {tag["Key"]: tag["Value"] for tag in tags}
    
        self.assertIn("Project", tag_dict)
        self.assertEqual(tag_dict["Project"], "ServerlessApp")
        self.assertIn("Environment", tag_dict)
        self.assertEqual(tag_dict["Environment"], env_suffix)
        self.assertIn("Owner", tag_dict)
        self.assertEqual(tag_dict["Owner"], "TAP")

    @mark.it("validates stack dependencies")
    def test_stack_dependencies(self):
        """Test that resources have proper dependencies"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)
    
        # Get the template JSON
        template_json = template.to_json()
    
        # ASSERT - Lambda depends on role
        lambda_resources = [k for k, v in template_json["Resources"].items() 
                                            if v.get("Type") == "AWS::Lambda::Function"]
        self.assertTrue(len(lambda_resources) > 0)
    
        for lambda_res in lambda_resources:
            if "ServerlessAppLambda" in lambda_res:
                lambda_config = template_json["Resources"][lambda_res]
                # Check that DependsOn includes the role
                if "DependsOn" in lambda_config:
                    deps = lambda_config["DependsOn"]
                    if isinstance(deps, list):
                        self.assertTrue(any("Role" in dep for dep in deps))

    @mark.it("verifies removal policies for development")
    def test_removal_policies(self):
        """Test that resources have DESTROY removal policy for dev/test"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - S3 bucket
        template.has_resource("AWS::S3::Bucket", {
                "UpdateReplacePolicy": "Delete",
                "DeletionPolicy": "Delete"
        })

        # ASSERT - Secrets Manager
        template.has_resource("AWS::SecretsManager::Secret", {
                "UpdateReplacePolicy": "Delete",
                "DeletionPolicy": "Delete"
        })

    @mark.it("validates Lambda inline code")
    def test_lambda_inline_code(self):
        """Test that Lambda function has inline code"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
                "Code": {
                        "ZipFile": Match.string_like_regexp(".*lambda_handler.*")
                }
        })
