# import os
# import sys
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

    @mark.it("creates stack with correct environment suffix")
    def test_creates_stack_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))

        # ASSERT
        self.assertEqual(stack.environment_suffix, env_suffix)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("creates KMS key with proper configuration")
    def test_creates_kms_key(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": f"KMS key for serverless application encryption - {env_suffix}",
            "EnableKeyRotation": True
        })

        # Check KMS alias
        template.resource_count_is("AWS::KMS::Alias", 1)
        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": f"alias/serverless-app-key-{env_suffix}"
        })

    @mark.it("creates DynamoDB table with encryption and best practices")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "AttributeDefinitions": [
                {
                    "AttributeName": "id",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "status",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "created_at",
                    "AttributeType": "S"
                }
            ],
            "KeySchema": [
                {
                    "AttributeName": "id",
                    "KeyType": "HASH"
                }
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {
                "SSEEnabled": True
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            },
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            },
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "StatusCreatedIndex",
                    "KeySchema": [
                        {
                            "AttributeName": "status",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "created_at",
                            "KeyType": "RANGE"
                        }
                    ],
                    "Projection": {
                        "ProjectionType": "ALL"
                    }
                }
            ]
        })

    @mark.it("creates S3 bucket with encryption and security features")
    def test_creates_s3_bucket(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
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
            "VersioningConfiguration": {
                "Status": "Enabled"
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
                        "Id": "TransitionToIA",
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "STANDARD_IA",
                                "TransitionInDays": 30
                            }
                        ]
                    })
                ])
            }
        })

    @mark.it("creates Lambda function with proper configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"api-handler-{env_suffix}",
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
            "MemorySize": 512,
            "Timeout": 30,
            "TracingConfig": {
                "Mode": "Active"
            },
            "DeadLetterConfig": Match.any_value(),
            "Environment": {
                "Variables": {
                    "ENVIRONMENT": env_suffix
                }
            }
        })

    @mark.it("creates Lambda execution role with least privilege permissions")
    def test_creates_lambda_execution_role(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 3)  # Lambda role + API Gateway CloudWatch role
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"lambda-execution-role-{env_suffix}",
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

        # Check Lambda role has DynamoDB permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Scan",
                            "dynamodb:Query",
                            "dynamodb:DescribeTable"
                        ]
                    })
                ])
            }
        })

    @mark.it("creates API Gateway resources and methods")
    def test_creates_api_gateway_resources(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # Check that API Gateway resources are created (health, items, {id})
        template.resource_count_is("AWS::ApiGateway::Resource", 3)

        # Check that API Gateway methods are created
        template.resource_count_is("AWS::ApiGateway::Method", 10)  # GET health, GET/POST items, GET/PUT/DELETE {id}

        # Check health resource
        template.has_resource_properties("AWS::ApiGateway::Resource", {
            "PathPart": "health"
        })

        # Check items resource
        template.has_resource_properties("AWS::ApiGateway::Resource", {
            "PathPart": "items"
        })

        # Check {id} resource
        template.has_resource_properties("AWS::ApiGateway::Resource", {
            "PathPart": "{id}"
        })

    @mark.it("creates API Gateway usage plan with throttling and quotas")
    def test_creates_usage_plan(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        template.has_resource_properties("AWS::ApiGateway::UsagePlan", {
            "UsagePlanName": f"Serverless Usage Plan - {env_suffix}",
            "Description": f"Production usage plan with rate limiting and quotas - {env_suffix}",
            "Throttle": {
                "RateLimit": 300,
                "BurstLimit": 600
            },
            "Quota": {
                "Limit": 100000,
                "Period": "DAY"
            }
        })

        # Check API key creation
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
        template.has_resource_properties("AWS::ApiGateway::ApiKey", {
            "Name": f"serverless-api-key-{env_suffix}",
            "Description": f"API key for serverless web application access - {env_suffix}"
        })

        # Check usage plan key association
        template.resource_count_is("AWS::ApiGateway::UsagePlanKey", 1)

    @mark.it("creates CloudWatch monitoring and alarms")
    def test_creates_cloudwatch_monitoring(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # Check SNS topic for alerts
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"serverless-alerts-{env_suffix}",
            "DisplayName": f"Serverless Application Alerts - {env_suffix}"
        })

        # Check CloudWatch alarms
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)

        # Lambda error alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"lambda-errors-{env_suffix}",
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda",
            "Statistic": "Sum",
            "Threshold": 5,
            "EvaluationPeriods": 2
        })

        # Lambda duration alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"lambda-duration-{env_suffix}",
            "MetricName": "Duration",
            "Namespace": "AWS/Lambda",
            "Statistic": "Average",
            "Threshold": 15000,
            "EvaluationPeriods": 3
        })

        # API Gateway 4XX alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"api-4xx-errors-{env_suffix}",
            "MetricName": "4XXError",
            "Namespace": "AWS/ApiGateway",
            "Statistic": "Sum",
            "Threshold": 20,
            "EvaluationPeriods": 2
        })

        # Check CloudWatch dashboard
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"Serverless-App-{env_suffix}"
        })

    @mark.it("creates CloudFormation outputs")
    def test_creates_outputs(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # Check that all expected outputs are created
        template.has_output("ApiGatewayUrl", {
            "Description": "API Gateway URL for the serverless application"
        })

        template.has_output("ApiGatewayId", {
            "Description": "API Gateway ID"
        })

        template.has_output("DynamoDBTableName", {
            "Description": "DynamoDB table name for storing application data"
        })

        template.has_output("LambdaFunctionName", {
            "Description": "Lambda function name handling API requests"
        })

        template.has_output("LambdaFunctionArn", {
            "Description": "Lambda function ARN"
        })

        template.has_output("S3BucketName", {
            "Description": "S3 bucket name for additional storage"
        })

        template.has_output("KMSKeyId", {
            "Description": "KMS key ID for encryption"
        })

    @mark.it("validates Lambda function environment variables")
    def test_lambda_environment_variables(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "TABLE_NAME": Match.any_value(),
                    "BUCKET_NAME": Match.any_value(),
                    "KMS_KEY_ID": Match.any_value(),
                    "ENVIRONMENT": env_suffix
                }
            }
        })

    @mark.it("validates security configurations")
    def test_security_configurations(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # S3 bucket should block public access
        template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

        # DynamoDB should have encryption enabled
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })

        # Lambda should have tracing enabled
        template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    @mark.it("validates resource counts")
    def test_resource_counts(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # Verify expected resource counts
        template.resource_count_is("AWS::KMS::Key", 1)
        template.resource_count_is("AWS::KMS::Alias", 1)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.resource_count_is("AWS::IAM::Role", 3)  # Lambda + API Gateway CloudWatch
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::ApiGateway::Resource", 3)
        template.resource_count_is("AWS::ApiGateway::Method", 10)
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("validates context-based environment suffix")
    def test_context_based_env_suffix(self):
        # ARRANGE
        app_with_context = cdk.App(context={"environmentSuffix": "prod"})
        stack = TapStack(app_with_context, "TapStackTestContext")

        # ASSERT
        self.assertEqual(stack.environment_suffix, "prod")


if __name__ == '__main__':
    unittest.main()
