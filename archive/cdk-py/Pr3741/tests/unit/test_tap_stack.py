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
        template.resource_count_is("AWS::S3::Bucket", 2)  # Storage and Logging buckets
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
        })

    @mark.it("creates a DynamoDB table with correct configuration")
    def test_dynamodb_table(self):
        """Test DynamoDB table creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "StreamSpecification": {"StreamViewType": "NEW_AND_OLD_IMAGES"},
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
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
            "Runtime": "python3.11",
            "Environment": {
                "Variables": {
                    "DYNAMODB_TABLE": Match.any_value(),
                    "S3_BUCKET": Match.any_value(),
                    "SNS_TOPIC_ARN": Match.any_value()
                }
            },
            "MemorySize": 512,
            "Timeout": 30,
            "TracingConfig": {"Mode": "Active"}
        })

    @mark.it("creates an API Gateway with correct configuration")
    def test_api_gateway(self):
        """Test API Gateway creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "ServerlessInfraAPI",
            "Description": "Serverless Infrastructure API"
        })

        # Validate stage configuration
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
        })

    @mark.it("creates a CloudFront distribution with correct configuration")
    def test_cloudfront_distribution(self):
        """Test CloudFront distribution creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "Enabled": True,
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https",
                    "AllowedMethods": ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
                    "CachePolicyId": Match.any_value()
                }
            }
        })

    @mark.it("creates an SNS topic with correct configuration")
    def test_sns_topic(self):
        """Test SNS topic creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "Serverless Application Notifications"
        })

    @mark.it("outputs all required stack information")
    def test_stack_outputs(self):
        """Test stack outputs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiEndpoint", {
            "Description": "API Gateway endpoint URL",
            "Value": Match.any_value()
        })
        template.has_output("CloudFrontDomain", {
            "Description": "CloudFront distribution domain",
            "Value": Match.any_value()
        })
        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB table name",
            "Value": Match.any_value()
        })
        template.has_output("StorageBucketName", {
            "Description": "S3 storage bucket name",
            "Value": Match.any_value()
        })
        template.has_output("SNSTopicArn", {
            "Description": "SNS topic ARN for notifications",
            "Value": Match.any_value()
        })
