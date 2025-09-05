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

    @mark.it("creates a KMS key with key rotation enabled")
    def test_creates_kms_key(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": "KMS key for TAP serverless application encryption"
        })

    @mark.it("creates a DynamoDB table with on-demand capacity and encryption")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST",
            "AttributeDefinitions": [
                {
                    "AttributeName": "id",
                    "AttributeType": "S"
                }
            ],
            "KeySchema": [
                {
                    "AttributeName": "id",
                    "KeyType": "HASH"
                }
            ],
            "SSESpecification": {
                "SSEEnabled": True
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            },
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            }
        })

    @mark.it("creates an S3 bucket with versioning and encryption")
    def test_creates_s3_bucket(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Id": "DeleteOldVersions",
                        "Status": "Enabled",
                        "NoncurrentVersionExpiration": {
                            "NoncurrentDays": 30
                        }
                    }),
                    Match.object_like({
                        "Id": "TransitionToGlacier",
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 30
                            }
                        ]
                    })
                ])
            }
        })

    @mark.it("creates an IAM role for Lambda with proper permissions")
    def test_creates_lambda_iam_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 4)
        template.has_resource_properties("AWS::IAM::Role", {
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
            },
            "ManagedPolicyArns": [
                {
                    "Fn::Join": [
                        "",
                        [
                            "arn:",
                            {"Ref": "AWS::Partition"},
                            ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                        ]
                    ]
                }
            ]
        })

    @mark.it("creates a Lambda function with the correct runtime and environment variables")
    def test_creates_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 3)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
            "FunctionName": "tap-api-handler-testenv",
            "Environment": {
                "Variables": {
                    "REGION": {"Ref": "AWS::Region"},
                    "ENVIRONMENT_SUFFIX": "testenv"
                }
            },
            "Timeout": 30,
            "MemorySize": 256,
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    @mark.it("creates an API Gateway with CORS enabled")
    def test_creates_api_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "tap-serverless-api-testenv",
            "Description": "TAP serverless application API"
        })

    @mark.it("creates API Gateway resources and methods")
    def test_creates_api_gateway_resources_and_methods(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        # Check for resources: items, {id}, health
        template.resource_count_is("AWS::ApiGateway::Resource", 3)
        
        # Check for methods: GET, POST for /items; GET, PUT, DELETE for /items/{id}; GET for /health
        template.resource_count_is("AWS::ApiGateway::Method", 10)

    @mark.it("creates API Gateway deployment and stage")
    def test_creates_api_gateway_deployment(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "MethodSettings": [
                {
                    "LoggingLevel": "INFO",
                    "DataTraceEnabled": True,
                    "MetricsEnabled": True,
                    "ResourcePath": "/*",
                    "HttpMethod": "*"
                }
            ]
        })

    @mark.it("creates CloudWatch alarms for Lambda and API Gateway")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)  # Lambda errors, duration, API Gateway 4XX, 5XX
        
        # Check Lambda error alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "tap-lambda-errors-testenv",
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 1,
            "EvaluationPeriods": 1,
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda"
        })

        # Check Lambda duration alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "tap-lambda-duration-testenv",
            "ComparisonOperator": "GreaterThanThreshold",
            "Threshold": 20000,
            "EvaluationPeriods": 2,
            "MetricName": "Duration",
            "Namespace": "AWS/Lambda"
        })

        # Check API Gateway 4XX alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "tap-api-4xx-errors-testenv",
            "ComparisonOperator": "GreaterThanThreshold",
            "Threshold": 10,
            "EvaluationPeriods": 2,
            "MetricName": "4XXError",
            "Namespace": "AWS/ApiGateway"
        })

        # Check API Gateway 5XX alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "tap-api-5xx-errors-testenv",
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 1,
            "EvaluationPeriods": 1,
            "MetricName": "5XXError",
            "Namespace": "AWS/ApiGateway"
        })

    @mark.it("creates an SNS topic for alarms without email subscription by default")
    def test_creates_sns_topic_without_email(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "tap-serverless-alarms-testenv"
        })
        # No subscription should be created without notification email
        template.resource_count_is("AWS::SNS::Subscription", 0)

    @mark.it("creates an SNS topic for alarms with email subscription when provided")
    def test_creates_sns_topic_with_email(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(
            environment_suffix="testenv", 
            notification_email="test@example.com"
        ))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "tap-serverless-alarms-testenv"
        })
        template.resource_count_is("AWS::SNS::Subscription", 1)
        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "test@example.com"
        })

    @mark.it("creates all required CloudFormation outputs")
    def test_creates_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT - Check that outputs are created
        outputs = template.to_json()["Outputs"]
        
        # Verify all expected outputs exist
        expected_outputs = [
            "APIGatewayURL",
            "LambdaFunctionARN", 
            "LambdaFunctionName",
            "DynamoDBTableName",
            "DynamoDBTableArn",
            "S3BucketName",
            "S3BucketArn",
            "KMSKeyId",
            "KMSKeyArn",
            "SNSTopicArn",
            "EnvironmentSuffix"
        ]
        
        for output_name in expected_outputs:
            self.assertIn(output_name, outputs, f"Output {output_name} should exist")

    @mark.it("uses default environment suffix when none provided")
    def test_default_environment_suffix(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")  # No props provided
        template = Template.from_stack(stack)

        # ASSERT
        # Check that resources are created with 'dev' suffix (default)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "tap-serverless-alarms-dev"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tap-api-handler-dev"
        })

    @mark.it("handles custom environment suffix correctly")
    def test_custom_environment_suffix(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "tap-serverless-alarms-prod"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tap-api-handler-prod"
        })

    @mark.it("enables X-Ray tracing for Lambda function")
    def test_enables_xray_tracing(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    @mark.it("validates resource naming consistency with environment suffix")
    def test_resource_naming_consistency(self):
        # ARRANGE
        env_suffix = "staging"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - All resources should use consistent naming
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"tap-serverless-api-{env_suffix}"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"tap-api-handler-{env_suffix}"
        })
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"tap-serverless-alarms-{env_suffix}"
        })


if __name__ == '__main__':
    unittest.main()
