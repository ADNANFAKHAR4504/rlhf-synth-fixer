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
        self.stack = TapStack(self.app, "TapStackTest",
                              TapStackProps(environment_suffix="test"))
        self.template = Template.from_stack(self.stack)

    @mark.it("creates DynamoDB table with correct properties")
    def test_creates_dynamodb_table(self):
        # ASSERT - DynamoDB table exists with correct properties
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "AttributeDefinitions": [
                {"AttributeName": "id", "AttributeType": "S"}
            ],
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"}
            ],
            "SSESpecification": {"SSEEnabled": True}
        })

    @mark.it("creates S3 bucket with security features")
    def test_creates_s3_bucket_with_security(self):
        # ASSERT - S3 bucket with Object Lock, versioning, encryption
        self.template.resource_count_is("AWS::S3::Bucket", 1)  # Only the main bucket
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "ObjectLockEnabled": True,
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [{
                    "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                }]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates Lambda function with correct runtime and environment")
    def test_creates_lambda_function(self):
        # ASSERT - Lambda function with nodejs20.x runtime
        self.template.resource_count_is("AWS::Lambda::Function", 1)  # Main function only
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "nodejs20.x",
            "Handler": "index.handler",
            "Environment": {
                "Variables": {
                    "TABLE_NAME": Match.any_value(),
                    "BUCKET_NAME": Match.any_value()
                }
            }
        })

    @mark.it("creates API Gateway with POST method and usage plan")
    def test_creates_api_gateway(self):
        # ASSERT - REST API exists
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        
        # ASSERT - POST method on /process resource with API key required
        self.template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST",
            "ApiKeyRequired": True
        })
        
        # ASSERT - Usage plan with daily quota
        self.template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        self.template.has_resource_properties("AWS::ApiGateway::UsagePlan", {
            "Quota": {
                "Limit": 1000,
                "Period": "DAY"
            }
        })

    @mark.it("creates CloudFront distribution with HTTPS only")
    def test_creates_cloudfront_distribution(self):
        # ASSERT - CloudFront distribution with HTTPS only
        self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
        self.template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "https-only"
                },
                "Enabled": True
            }
        })

    @mark.it("creates SNS topic with email subscription")
    def test_creates_sns_topic(self):
        # ASSERT - SNS topic exists
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        
        # ASSERT - Email subscription exists
        self.template.resource_count_is("AWS::SNS::Subscription", 1)
        self.template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email"
        })

    @mark.it("creates CloudWatch Log Groups with retention")
    def test_creates_log_groups(self):
        # ASSERT - Log groups for Lambda and API Gateway
        self.template.resource_count_is("AWS::Logs::LogGroup", 2)
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    @mark.it("creates IAM role and separate policy")
    def test_creates_iam_role_and_policy(self):
        # ASSERT - IAM role exists (Lambda role + auto-delete role + possible CloudFront role)
        iam_roles = self.template.find_resources("AWS::IAM::Role")
        self.assertGreaterEqual(len(iam_roles), 2)  # At least Lambda role + auto-delete role
        
        # ASSERT - Separate IAM policies exist (not inline)
        self.template.resource_count_is("AWS::IAM::Policy", 2)  # Lambda policy + error topic policy

    @mark.it("applies production environment tags")
    def test_applies_production_tags(self):
        # ASSERT - Resources have Environment=Production tag
        resources = self.template.to_json()["Resources"]
        
        # Check that DynamoDB table has Production tag
        dynamodb_resources = [r for r in resources.values() 
                             if r["Type"] == "AWS::DynamoDB::Table"]
        self.assertTrue(len(dynamodb_resources) > 0)
        
        table_tags = dynamodb_resources[0].get("Properties", {}).get("Tags", [])
        production_tag = next((tag for tag in table_tags 
                              if tag["Key"] == "Environment"), None)
        self.assertIsNotNone(production_tag)
        self.assertEqual(production_tag["Value"], "Production")

    @mark.it("defaults environment suffix to dev when not provided")
    def test_defaults_environment_suffix(self):
        # ARRANGE
        default_stack = TapStack(self.app, "DefaultStack")
        
        # ASSERT
        self.assertEqual(default_stack.environment_suffix, "dev")

    @mark.it("has all required stack attributes for testing")
    def test_stack_attributes_exist(self):
        # ASSERT - Stack exposes required attributes for integration tests
        self.assertIsNotNone(self.stack.table)
        self.assertIsNotNone(self.stack.bucket)
        self.assertIsNotNone(self.stack.lambda_function)
        self.assertIsNotNone(self.stack.api)
        self.assertIsNotNone(self.stack.distribution)
        self.assertIsNotNone(self.stack.error_topic)

    @mark.it("creates CloudFront Origin Access Control")
    def test_creates_cloudfront_oac(self):
        # ASSERT - OAC for CloudFront to S3 integration
        self.template.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)

    @mark.it("validates infrastructure security configuration")
    def test_security_configuration(self):
        # ASSERT - S3 bucket policy for CloudFront access
        self.template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudfront.amazonaws.com"},
                        "Action": "s3:GetObject"
                    })
                ])
            }
        })
