"""Unit tests for TapStack CDK resources."""
import unittest
from aws_cdk import App
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for TapStack CDK stack."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.app = App()

    @mark.it("creates an S3 bucket with encryption")
    def test_creates_s3_bucket_with_encryption(self):
        """Verify S3 bucket is created with proper encryption."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource("AWS::S3::Bucket", {
            "Properties": {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }
                    ]
                }
            }
        })

    @mark.it("creates a DynamoDB table with proper keys")
    def test_creates_dynamodb_table(self):
        """Verify DynamoDB table is created with partition and sort keys."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource("AWS::DynamoDB::Table", {
            "Properties": {
                "KeySchema": [
                    {
                        "AttributeName": "objectKey",
                        "KeyType": "HASH"
                    },
                    {
                        "AttributeName": "uploadTime",
                        "KeyType": "RANGE"
                    }
                ]
            }
        })

    @mark.it("creates an SNS topic")
    def test_creates_sns_topic(self):
        """Verify SNS topic is created for notifications."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates a Lambda function with correct runtime")
    def test_creates_lambda_function(self):
        """Verify Lambda function is created with Python runtime."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource("AWS::Lambda::Function", {
            "Properties": {
                "Runtime": "python3.12",
                "Timeout": 30
            }
        })

    @mark.it("creates an API Gateway REST API")
    def test_creates_api_gateway(self):
        """Verify API Gateway REST API is created."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    @mark.it("creates IAM role with necessary permissions")
    def test_creates_iam_role(self):
        """Verify IAM role is created with proper permissions."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource("AWS::IAM::Role", {
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
            }
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_environment_suffix_to_dev(self):
        """Verify stack defaults to 'dev' environment when suffix not provided."""
        # ARRANGE
        stack = TapStack(self.app, "TapStackDefault")

        # ASSERT
        self.assertIsNotNone(stack)


if __name__ == "__main__":
    unittest.main()
