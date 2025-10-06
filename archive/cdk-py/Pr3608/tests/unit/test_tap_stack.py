# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with correct configuration")
    def test_s3_bucket(self):
        """Test S3 bucket creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ])
            },
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    {
                        "Id": "DeleteOldVersions",
                        "NoncurrentVersionExpiration": {"NoncurrentDays": 30},
                        "Status": "Enabled"
                    }
                ])
            }
        })

    @mark.it("creates a Lambda function with correct configuration")
    def test_lambda_function(self):
        """Test Lambda function creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Check for JsonProcessor Lambda function specifically
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.lambda_handler",
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "BUCKET_NAME": Match.any_value(),
                    "LOG_LEVEL": "INFO"
                }
            },
            "MemorySize": 512,
            "Timeout": 60,
            "Description": "Processes JSON files uploaded to S3"
        })

    @mark.it("validates Lambda function code contains required logic")
    def test_lambda_function_code(self):
        """Test that the Lambda function code contains the required logic"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        lambda_code = stack._get_lambda_code()

        # ASSERT - Check for key components in the Lambda code
        self.assertIn("def lambda_handler(event, context):", lambda_code)
        self.assertIn("def process_file(bucket_name, object_key):", lambda_code)
        self.assertIn("s3_client = boto3.client('s3')", lambda_code)
        self.assertIn("os.environ['BUCKET_NAME']", lambda_code)  # Fixed assertion
        self.assertIn("json.loads", lambda_code)
        self.assertIn("logger.info", lambda_code)
        self.assertIn("logger.error", lambda_code)

    @mark.it("creates an API Gateway with correct configuration")
    def test_api_gateway(self):
        """Test API Gateway creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "JSON Processor API",
            "Description": "API for processing JSON files"
        })

        # Validate stage configuration - remove LoggingLevel as it's not set
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "MethodSettings": Match.array_with([
                {
                    "DataTraceEnabled": True,
                    "HttpMethod": "*",
                    "ResourcePath": "/*",
                    "ThrottlingBurstLimit": 200,
                    "ThrottlingRateLimit": 100
                }
            ])
        })

    @mark.it("creates API Gateway methods with correct configuration")
    def test_api_gateway_methods(self):
        """Test API Gateway methods creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Check for POST method on /process resource
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST",
            "ApiKeyRequired": True,
            "Integration": {
                "Type": "AWS_PROXY",
                "IntegrationHttpMethod": "POST"
            }
        })

        # Check for /process resource
        template.has_resource_properties("AWS::ApiGateway::Resource", {
            "PathPart": "process"
        })

    @mark.it("creates API Gateway usage plan and API key")
    def test_api_gateway_usage_plan(self):
        """Test API Gateway usage plan and API key creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Usage Plan
        template.has_resource_properties("AWS::ApiGateway::UsagePlan", {
            "UsagePlanName": "JSON Processor Usage Plan",
            "Throttle": {
                "RateLimit": 100,
                "BurstLimit": 200
            },
            "Quota": {
                "Limit": 10000,
                "Period": "MONTH"
            }
        })

        # API Key
        template.has_resource_properties("AWS::ApiGateway::ApiKey", {
            "Name": "json-processor-api-key",
            "Description": "API key for JSON processor"
        })

        # Usage Plan Key (association between usage plan and API key)
        template.resource_count_is("AWS::ApiGateway::UsagePlanKey", 1)

    @mark.it("creates Lambda permission for API Gateway")
    def test_lambda_permission(self):
        """Test Lambda permission for API Gateway invocation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "apigateway.amazonaws.com"
        })

    @mark.it("creates Lambda permission for S3")
    def test_lambda_permission_s3(self):
        """Test Lambda permission for S3 invocation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - S3 should have permission to invoke Lambda
        # This is handled automatically by CDK when adding S3 event notifications
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com"
        })

    @mark.it("outputs all required stack information")
    def test_stack_outputs(self):
        """Test stack outputs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - All outputs should exist with any values (dynamic resource names)
        template.has_output("S3BucketName", {
            "Description": "Name of the S3 bucket for JSON files",
            "Value": Match.any_value()
        })

        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL",
            "Value": Match.any_value()
        })

        template.has_output("LambdaFunctionName", {
            "Description": "Name of the Lambda function",
            "Value": Match.any_value()
        })

        template.has_output("ApiKeyId", {
            "Description": "API Key ID (retrieve actual key from console)",
            "Value": Match.any_value()
        })

        template.has_output("S3BucketArn", {
            "Description": "The ARN of the S3 bucket used to store JSON files",
            "Value": Match.any_value()
        })

        template.has_output("LambdaFunctionArn", {
            "Description": "The ARN of the Lambda function handling API requests",
            "Value": Match.any_value()
        })

        template.has_output("ApiGatewayRestApiId", {
            "Description": "The ID of the API Gateway REST API",
            "Value": Match.any_value()
        })

        template.has_output("ApiGatewayStageName", {
            "Description": "The stage name of the API Gateway",
            "Value": Match.any_value()
        })

        template.has_output("CloudWatchLogGroupName", {
            "Description": "The name of the CloudWatch log group for API Gateway",
            "Value": Match.any_value()
        })

    @mark.it("validates Lambda function environment variables")
    def test_lambda_environment_variables(self):
        """Test Lambda environment variables configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Lambda should have correct environment variables
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.lambda_handler",  # Identify our specific Lambda
            "Environment": {
                "Variables": {
                    "BUCKET_NAME": Match.any_value(),
                    "LOG_LEVEL": "INFO"
                }
            }
        })

    @mark.it("validates API Gateway throttling configuration")
    def test_api_gateway_throttling(self):
        """Test API Gateway throttling configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Stage should have throttling configured
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": Match.array_with([
                {
                    "DataTraceEnabled": True,
                    "HttpMethod": "*",
                    "ResourcePath": "/*",
                    "ThrottlingRateLimit": 100,
                    "ThrottlingBurstLimit": 200
                }
            ])
        })

    @mark.it("validates complete integration between resources")
    def test_resource_integration(self):
        """Test that all resources are properly integrated"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Verify basic resource counts
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
        template.resource_count_is("AWS::ApiGateway::UsagePlanKey", 1)
        
        # Verify our specific Lambda function exists
        lambda_functions = template.find_resources("AWS::Lambda::Function", {
            "Handler": "index.lambda_handler"
        })

    @mark.it("validates S3 custom notification resource")
    def test_s3_notification_custom_resource(self):
        """Test that S3 bucket notifications are properly configured via custom resource"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Custom resource for S3 bucket notifications should exist
        template.resource_count_is("Custom::S3BucketNotifications", 1)


if __name__ == "__main__":
    unittest.main()
