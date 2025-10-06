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
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ])
            },
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
            "TableName": "UserManagementTable-test",
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            "KeySchema": [
                {"AttributeName": "userId", "KeyType": "HASH"},
                {"AttributeName": "createdDate", "KeyType": "RANGE"}
            ],
            "AttributeDefinitions": [
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "createdDate", "AttributeType": "S"}
            ]
        })

    @mark.it("creates an SQS dead letter queue with correct configuration")
    def test_sqs_dlq(self):
        """Test SQS dead letter queue creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 1)
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": "user-management-dlq-test",
            "KmsMasterKeyId": "alias/aws/sqs"
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
            "Handler": "index.lambda_handler",
            "Runtime": "python3.9",
            "Environment": {
                "Variables": {
                    "TABLE_NAME": Match.any_value(),
                    "LOG_BUCKET": Match.any_value()
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
            "Name": "UserManagementAPI",
            "Description": "API for user management operations"
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

    @mark.it("creates CloudWatch alarms with correct configuration")
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms creation and configuration"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 5)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "CreateUserDurationAlarm-test",
            "Threshold": 25000,  # 25 seconds in milliseconds
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 2
        })
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "CreateUserErrorAlarm-test",
            "Threshold": 1,
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "EvaluationPeriods": 1
        })

    @mark.it("outputs all required stack information")
    def test_stack_outputs(self):
        """Test stack outputs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("ApiUrl", {
            "Description": "API Gateway URL",
            "Value": Match.any_value()
        })
        template.has_output("CloudFrontUrl", {
            "Description": "CloudFront Distribution URL",
            "Value": Match.any_value()
        })
        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB Table Name",
            "Value": Match.any_value()
        })
        template.has_output("LogBucketName", {
            "Description": "S3 Log Bucket Name",
            "Value": Match.any_value()
        })
        template.has_output("DLQUrl", {
            "Description": "Dead Letter Queue URL",
            "Value": Match.any_value()
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Lambda Function Name",
            "Value": Match.any_value()
        })
        template.has_output("LambdaFunctionArn", {
            "Description": "Lambda Function ARN",
            "Value": Match.any_value()
        })
        template.has_output("CloudWatchLogGroupName", {
            "Description": "CloudWatch Log Group Name",
            "Value": Match.any_value()
        })
        template.has_output("S3BucketArn", {
            "Description": "S3 Bucket ARN",
            "Value": Match.any_value()
        })
        template.has_output("DynamoDBTableArn", {
            "Description": "DynamoDB Table ARN",
            "Value": Match.any_value()
        })
        template.has_output("DLQArn", {
            "Description": "Dead Letter Queue ARN",
            "Value": Match.any_value()
        })
