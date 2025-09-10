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
        self.env_suffix = "testenv"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates a DynamoDB table with the correct properties")
    def test_creates_dynamodb_table(self):
        # Assert that a DynamoDB table is created
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"serverless-data-table-{self.env_suffix}",
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"}
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            },
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates an IAM role for the API Lambda function")
    def test_creates_api_lambda_role(self):
        # Assert that an IAM role is created for the API Lambda
        self.template.resource_count_is("AWS::IAM::Role", 3)  # One for API Lambda, one for Stream Lambda
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"}
                    }
                ],
                "Version": "2012-10-17"
            }
        })

    @mark.it("creates a Lambda function for API Gateway")
    def test_creates_api_lambda_function(self):
        # Assert that the API Lambda function is created
        self.template.resource_count_is("AWS::Lambda::Function", 2)  # One for API Lambda, one for Stream Lambda
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.8",
            "Timeout": 15,
            "Environment": {
                "Variables": {
                    "STAGE": self.env_suffix
                }
            }
        })

    @mark.it("creates a Lambda function for DynamoDB Streams")
    def test_creates_stream_lambda_function(self):
        # Assert that the Stream Lambda function is created
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.8",
            "Timeout": 15,
            "Environment": {
                "Variables": {
                    "STAGE": self.env_suffix
                }
            }
        })

    @mark.it("creates an API Gateway with CORS enabled")
    def test_creates_api_gateway(self):
        # Assert that an API Gateway is created
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"serverless-api-{self.env_suffix}"
        })
        self.template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                {
                    "CachingEnabled": True,
                    "CacheTtlInSeconds": 30
                }
            ]
        })

    @mark.it("creates a KMS key for Lambda environment variable encryption")
    def test_creates_kms_key(self):
        # Assert that a KMS key is created
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties("AWS::KMS::Key", {
            "Description": "KMS key for Lambda environment variable encryption",
            "EnableKeyRotation": True
        })

    @mark.it("creates CloudWatch alarms for Lambda functions")
    def test_creates_cloudwatch_alarms(self):
        # Assert that CloudWatch alarms are created for Lambda functions
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 2)
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 1,
            "EvaluationPeriods": 2
        })

    @mark.it("outputs key resources")
    def test_outputs_resources(self):
        # Assert that key resources are output
        self.template.has_output("ApiGatewayUrl", {})
        self.template.has_output("DynamoDBTableName", {})
        self.template.has_output("ApiLambdaArn", {})
        self.template.has_output("StreamLambdaArn", {})
        self.template.has_output("KmsKeyId", {})
        self.template.has_output("EnvironmentSuffix", {})
