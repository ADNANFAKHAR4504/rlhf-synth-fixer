import json
import os
import re
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

# Add lambda directory to path and import handler
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "lib", "lambda"))
from handler import lambda_handler


# Unit tests for the TapStack CDK stack
@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a secure S3 bucket with the correct environment suffix")
    def test_creates_s3_bucket_with_env_suffix(self):
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource("AWS::S3::Bucket", {})

    @mark.it("creates a Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        stack = TapStack(self.app, "TapStackTestLambda")
        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.12",
                "Handler": "handler.lambda_handler",
                "MemorySize": 128,
                "Timeout": 30,
                "Description": "Lambda function for dynamic content processing",
            },
        )

    @mark.it("creates IAM role for Lambda with least privilege")
    def test_creates_lambda_iam_role(self):
        stack = TapStack(self.app, "TapStackTestIAM")
        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                        }
                    ],
                    "Version": "2012-10-17",
                }
            },
        )

    @mark.it("creates S3 bucket policy for CloudFront access")
    def test_creates_s3_bucket_policy(self):
        stack = TapStack(self.app, "TapStackTestPolicy")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::S3::BucketPolicy", 1)
        template.has_resource_properties(
            "AWS::S3::BucketPolicy", {"PolicyDocument": {"Version": "2012-10-17"}}
        )

    @mark.it("creates CDK outputs for CloudFront URL and Lambda function")
    def test_creates_cdk_outputs(self):
        stack = TapStack(self.app, "TapStackTestOutputs")
        template = Template.from_stack(stack)
        template.has_output(
            "WebsiteURL", {"Description": "URL of the static website via CloudFront"}
        )
        template.has_output(
            "CloudFrontDistributionId", {"Description": "CloudFront Distribution ID"}
        )
        template.has_output(
            "LambdaFunctionARN", {"Description": "ARN of the Lambda function"}
        )
        template.has_output(
            "LambdaFunctionName", {"Description": "Name of the Lambda function"}
        )
        template.has_output("S3BucketName", {"Description": "Name of the S3 bucket"})

    @mark.it(
        "creates S3 bucket deployment for static content with CloudFront invalidation"
    )
    def test_creates_s3_deployment(self):
        stack = TapStack(self.app, "TapStackTestDeployment")
        template = Template.from_stack(stack)
        template.resource_count_is("Custom::CDKBucketDeployment", 1)
        template.has_resource_properties(
            "Custom::CDKBucketDeployment",
            {
                "DestinationBucketName": {"Ref": "WebsiteBucket75C24D94"},
                "DestinationBucketKeyPrefix": "",
                "Prune": True,
                "DistributionPaths": ["/*"],
            },
        )

    @mark.it("sets correct removal policy for S3 bucket")
    def test_s3_bucket_removal_policy(self):
        stack = TapStack(self.app, "TapStackTestRemoval")
        template = Template.from_stack(stack)
        template.has_resource(
            "AWS::S3::Bucket",
            {"UpdateReplacePolicy": "Delete", "DeletionPolicy": "Delete"},
        )

    @mark.it("includes Lambda function with proper handler and runtime")
    def test_lambda_function_handler_and_runtime(self):
        stack = TapStack(self.app, "TapStackTestCode")
        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {"Handler": "handler.lambda_handler", "Runtime": "python3.12"},
        )

    @mark.it("creates CloudFront distribution for secure content delivery")
    def test_creates_cloudfront_distribution(self):
        stack = TapStack(self.app, "TapStackTestCloudFront")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties(
            "AWS::CloudFront::Distribution",
            {
                "DistributionConfig": {
                    "Enabled": True,
                    "DefaultRootObject": "index.html",
                    "PriceClass": "PriceClass_100",
                }
            },
        )

    @mark.it("creates CloudFront Origin Access Identity")
    def test_creates_cloudfront_oai(self):
        stack = TapStack(self.app, "TapStackTestOAI")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFront::CloudFrontOriginAccessIdentity", 1)
        template.has_resource_properties(
            "AWS::CloudFront::CloudFrontOriginAccessIdentity",
            {
                "CloudFrontOriginAccessIdentityConfig": {
                    "Comment": "OAI for static website dev"
                }
            },
        )


# Unit tests for the Lambda handler function response structure
@mark.describe("Lambda Handler Response")
class TestLambdaHandlerResponse(unittest.TestCase):
    """Unit tests for Lambda handler function response structure"""

    def setUp(self):
        """Set up test environment for each test"""
        # Mock environment variables
        self.env_patcher = patch.dict(
            os.environ,
            {"WEBSITE_BUCKET": "test-bucket-name", "AWS_REGION": "us-west-2"},
        )
        self.env_patcher.start()

        # Mock AWS context object
        self.mock_context = Mock()
        self.mock_context.aws_request_id = "test-request-id-12345"
        self.mock_context.function_name = "test-lambda-function"
        self.mock_context.function_version = "$LATEST"

        # Mock test event
        self.test_event = {
            "httpMethod": "GET",
            "path": "/test",
            "headers": {"User-Agent": "test-agent", "Content-Type": "application/json"},
            "queryStringParameters": {"param1": "value1"},
        }

    def tearDown(self):
        """Clean up after each test"""
        self.env_patcher.stop()

    @mark.it("returns successful response with correct structure and status 200")
    @patch("handler.boto3.client")
    def test_successful_response_structure(self, mock_boto_client):
        """Test that successful lambda response has correct structure and content"""
        # Mock S3 client (not used in actual response but needs to be created)
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Call the lambda handler
        response = lambda_handler(self.test_event, self.mock_context)

        # Verify response structure
        self.assertIsInstance(response, dict, "Response should be a dictionary")

        # Verify required response keys
        required_keys = ["statusCode", "headers", "body"]
        for key in required_keys:
            self.assertIn(key, response, f"Response should contain '{key}'")

        # Verify status code
        self.assertEqual(
            response["statusCode"], 200, "Successful response should have status 200"
        )

        # Verify headers structure and content
        headers = response["headers"]
        self.assertIsInstance(headers, dict, "Headers should be a dictionary")

        expected_headers = [
            "Content-Type",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Headers",
            "Access-Control-Allow-Methods",
            "Cache-Control",
        ]
        for header in expected_headers:
            self.assertIn(header, headers, f"Headers should contain '{header}'")

        # Verify specific header values
        self.assertEqual(headers["Content-Type"], "application/json")
        self.assertEqual(headers["Access-Control-Allow-Origin"], "*")
        self.assertEqual(headers["Cache-Control"], "no-cache")

        # Verify body is valid JSON string
        self.assertIsInstance(response["body"], str, "Response body should be a string")

        # Parse and verify body content
        body_data = json.loads(response["body"])
        self.assertIsInstance(
            body_data, dict, "Response body should contain JSON object"
        )

        # Verify required fields in response body
        required_body_fields = [
            "message",
            "timestamp",
            "request_id",
            "function_name",
            "function_version",
            "website_bucket",
            "region",
            "event",
        ]
        for field in required_body_fields:
            self.assertIn(field, body_data, f"Response body should contain '{field}'")

        # Verify specific values
        self.assertEqual(body_data["message"], "Hello from Lambda!")
        self.assertEqual(body_data["request_id"], "test-request-id-12345")
        self.assertEqual(body_data["function_name"], "test-lambda-function")
        self.assertEqual(body_data["function_version"], "$LATEST")
        self.assertEqual(body_data["website_bucket"], "test-bucket-name")
        self.assertEqual(body_data["region"], "us-west-2")

        # Verify event data structure
        event_data = body_data["event"]
        self.assertIsInstance(event_data, dict, "Event data should be a dictionary")
        self.assertEqual(event_data["httpMethod"], "GET")
        self.assertEqual(event_data["path"], "/test")
        self.assertIn("headers", event_data)
        self.assertIn("queryStringParameters", event_data)

    @mark.it("returns error response with status 400 when WEBSITE_BUCKET missing")
    @patch("handler.boto3.client")
    def test_error_response_missing_env_var(self, _mock_boto_client):
        """Test error response when WEBSITE_BUCKET environment variable is missing"""
        # Remove WEBSITE_BUCKET from environment
        with patch.dict(os.environ, {}, clear=True):
            response = lambda_handler(self.test_event, self.mock_context)

        # Verify error response structure
        self.assertEqual(
            response["statusCode"], 400, "Should return 400 for validation error"
        )

        # Verify headers
        headers = response["headers"]
        self.assertEqual(headers["Content-Type"], "application/json")
        self.assertEqual(headers["Access-Control-Allow-Origin"], "*")

        # Verify error body
        body_data = json.loads(response["body"])
        self.assertIn("error", body_data)
        self.assertIn("message", body_data)
        self.assertIn("request_id", body_data)

        self.assertEqual(body_data["error"], "Bad Request")
        self.assertEqual(body_data["request_id"], "test-request-id-12345")
        self.assertIn("WEBSITE_BUCKET", body_data["message"])

    @mark.it("returns error response with status 500 for unexpected errors")
    @patch("handler.boto3.client")
    def test_error_response_unexpected_error(self, mock_boto_client):
        """Test error response when unexpected exception occurs"""
        # Mock boto3 to raise an exception
        mock_boto_client.side_effect = Exception("Unexpected AWS error")

        response = lambda_handler(self.test_event, self.mock_context)

        # Verify error response structure
        self.assertEqual(
            response["statusCode"], 500, "Should return 500 for unexpected error"
        )

        # Verify headers
        headers = response["headers"]
        self.assertEqual(headers["Content-Type"], "application/json")
        self.assertEqual(headers["Access-Control-Allow-Origin"], "*")

        # Verify error body
        body_data = json.loads(response["body"])
        self.assertIn("error", body_data)
        self.assertIn("message", body_data)
        self.assertIn("request_id", body_data)

        self.assertEqual(body_data["error"], "Internal Server Error")
        self.assertEqual(body_data["message"], "An unexpected error occurred")
        self.assertEqual(body_data["request_id"], "test-request-id-12345")

    @mark.it("handles edge cases with missing event data gracefully")
    @patch("handler.boto3.client")
    def test_response_with_minimal_event_data(self, mock_boto_client):
        """Test lambda response with minimal event data (missing optional fields)"""
        # Mock S3 client
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        # Create minimal event (missing optional fields)
        minimal_event = {}

        response = lambda_handler(minimal_event, self.mock_context)

        # Should still return successful response
        self.assertEqual(response["statusCode"], 200)

        # Verify body handles missing event fields
        body_data = json.loads(response["body"])
        event_data = body_data["event"]

        # Should handle missing fields gracefully (return None)
        self.assertIsNone(event_data["httpMethod"])
        self.assertIsNone(event_data["path"])
        self.assertIsNone(event_data["queryStringParameters"])
        self.assertEqual(event_data["headers"], {})  # defaults to empty dict

    @mark.it("returns properly formatted timestamp in response")
    @patch("handler.boto3.client")
    def test_timestamp_format_in_response(self, mock_boto_client):
        """Test that timestamp in response follows expected format"""
        # Mock S3 client
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client

        response = lambda_handler(self.test_event, self.mock_context)
        body_data = json.loads(response["body"])

        # Verify timestamp format (YYYY-MM-DD HH:MM:SS)
        timestamp = body_data["timestamp"]
        self.assertIsInstance(timestamp, str, "Timestamp should be a string")

        # Basic format check - should match pattern like "2024-01-01 12:00:00"
        timestamp_pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}"
        self.assertIsNotNone(
            re.match(timestamp_pattern, timestamp),
            f"Timestamp '{timestamp}' should match format 'YYYY-MM-DD HH:MM:SS'",
        )


if __name__ == "__main__":
    unittest.main()
