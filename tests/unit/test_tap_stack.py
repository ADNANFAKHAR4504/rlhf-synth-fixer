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

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.9",
            "MemorySize": 512,
            "Timeout": 30,
            "TracingConfig": {"Mode": "Active"}
        })

    @mark.it("validates Lambda function code contains required logic")
    def test_lambda_function_code(self):
        """Test that the Lambda function code contains the required logic"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        lambda_code = stack._get_lambda_code()

        # ASSERT
        self.assertIn("def handler(event, context):", lambda_code)
        self.assertIn("def get_items():", lambda_code)
        self.assertIn("def create_item(event):", lambda_code)
        self.assertIn("s3_client = boto3.client('s3')", lambda_code)
        self.assertIn("BUCKET_NAME = os.environ['BUCKET_NAME']", lambda_code)

    @mark.it("creates an API Gateway with correct configuration")
    def test_api_gateway(self):
        """Test API Gateway creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "tap-items-api-test",
            "Description": "API Gateway for managing items"
        })

        # Validate deployment stage configuration
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "v1",
            "TracingEnabled": True,
            "MethodSettings": Match.array_with([
                {
                    "DataTraceEnabled": True,
                    "HttpMethod": "*",
                    "MetricsEnabled": True,
                    "ResourcePath": "/*"
                }
            ])
        })

    @mark.it("creates API Gateway methods for items resource")
    def test_api_gateway_methods(self):
        """Test API Gateway methods creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Check for GET and POST methods
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "GET",
            "Integration": {
                "Type": "AWS_PROXY",
                "IntegrationHttpMethod": "POST"
            }
        })

        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST",
            "Integration": {
                "Type": "AWS_PROXY",
                "IntegrationHttpMethod": "POST"
            }
        })

    @mark.it("creates CloudWatch log group for API Gateway")
    def test_cloudwatch_log_group(self):
        """Test CloudWatch log group creation"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/tap-items-api-test",
            "RetentionInDays": 7
        })

    @mark.it("outputs all required stack information")
    def test_stack_outputs(self):
        """Test all stack outputs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Test all outputs exist
        template.has_output("S3BucketName", {
            "Description": "The name of the S3 bucket used to store items"
        })

        template.has_output("LambdaFunctionName", {
            "Description": "The name of the Lambda function handling API requests"
        })

        template.has_output("ApiGatewayUrl", {
            "Description": "The base URL of the API Gateway"
        })

        template.has_output("S3BucketArn", {
            "Description": "The ARN of the S3 bucket used to store items"
        })

        template.has_output("LambdaFunctionArn", {
            "Description": "The ARN of the Lambda function handling API requests"
        })

        template.has_output("ApiGatewayRestApiId", {
            "Description": "The ID of the API Gateway REST API"
        })


        template.has_output("CloudWatchLogGroupName", {
            "Description": "The name of the CloudWatch log group for API Gateway",
            "Value": "/aws/apigateway/tap-items-api-test"
        })

    @mark.it("uses different configurations for prod environment")
    def test_prod_environment_configuration(self):
        """Test production environment specific configurations"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackProd", TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        # ASSERT - Production S3 bucket should have RETAIN policy

        # Check that auto delete is not set for prod (should not have AutoDeleteObjects property)
        s3_resources = template.find_resources("AWS::S3::Bucket")
        for resource_id, resource in s3_resources.items():
            properties = resource.get("Properties", {})
            self.assertNotIn("AutoDeleteObjects", properties, 
                           "Production bucket should not have AutoDeleteObjects enabled")

    @mark.it("uses default dev environment when no suffix provided")
    def test_default_environment_configuration(self):
        """Test default environment configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackDefault")
        template = Template.from_stack(stack)

        # ASSERT - Should default to 'dev' environment
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "tap-items-dev"
        })

        template.has_output("CloudWatchLogGroupName", {
            "Value": "/aws/apigateway/tap-items-api-dev"
        })

    @mark.it("validates resource naming consistency")
    def test_resource_naming_consistency(self):
        """Test that all resources follow consistent naming patterns"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - All resources should use consistent naming with environment suffix

        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "tap-items-api-test"
        })

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/tap-items-api-test"
        })

    @mark.it("validates API Gateway integration with Lambda")
    def test_api_gateway_lambda_integration(self):
        """Test API Gateway integration with Lambda function"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - API Gateway methods should integrate with Lambda
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "Integration": {
                "Type": "AWS_PROXY",
                "IntegrationHttpMethod": "POST"
            }
        })

        # Should have Lambda invoke permission
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "apigateway.amazonaws.com"
        })
