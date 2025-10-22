# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a DynamoDB table with the correct configuration")
    def test_dynamodb_table_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "ecommerce-products-testenv",
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            "KeySchema": [
                {"AttributeName": "product_id", "KeyType": "HASH"}
            ],
        })

    @mark.it("creates an S3 bucket with the correct configuration")
    def test_s3_bucket_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
        })

    @mark.it("creates an SNS topic with the correct configuration")
    def test_sns_topic_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "ecommerce-inventory-alerts-testenv",
            "DisplayName": "E-commerce Inventory Alerts (testenv)"
        })

    @mark.it("creates Lambda functions with the correct configuration")
    def test_lambda_functions_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 7)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 30,
            "MemorySize": 256,
            "TracingConfig": {"Mode": "Active"}
        })

    @mark.it("creates an API Gateway with the correct configuration")
    def test_api_gateway_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "ecommerce-api-testenv"
        })

        # Validate CORS configuration
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "OPTIONS",
            "Integration": {
                "IntegrationResponses": [
                    {
                        "ResponseParameters": {
                            "method.response.header.Access-Control-Allow-Origin": "'*'"
                        }
                    }
                ]
            }
        })

    @mark.it("creates a CloudFront distribution with the correct configuration")
    def test_cloudfront_distribution_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https",
                },
                "Enabled": True
            }
        })

    @mark.it("creates CloudFormation outputs for key resources")
    def test_cloudformation_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL"
        })
        template.has_output("CloudFrontUrl", {
            "Description": "CloudFront distribution URL"
        })
        template.has_output("S3BucketName", {
            "Description": "S3 bucket for product images"
        })
        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB table for products"
        })
        template.has_output("Environment", {
            "Description": "Environment suffix"
        })


if __name__ == "__main__":
    unittest.main()
