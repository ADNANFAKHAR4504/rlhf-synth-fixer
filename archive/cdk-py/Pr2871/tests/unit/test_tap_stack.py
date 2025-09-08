# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

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

    @mark.it("creates a KMS key")
    def test_creates_kms_key(self):
        # Assert that a KMS key is created
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties("AWS::KMS::Key", {
            "Description": f"KMS key for serverless infrastructure encryption - {self.env_suffix}"
        })

    @mark.it("creates a VPC with public and private subnets")
    def test_creates_vpc(self):
        # Assert that a VPC is created
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
        self.template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True
        })

    @mark.it("creates an S3 bucket for Lambda code deployment")
    def test_creates_s3_bucket(self):
        # Assert that an S3 bucket is created
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}
                ]
            }
        })

    @mark.it("creates an SNS topic for error notifications")
    def test_creates_sns_topic(self):
        # Assert that an SNS topic is created
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        self.template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": f"Serverless Error Notifications - {self.env_suffix}"
        })

    @mark.it("creates a Dead Letter Queue (DLQ) for Lambda functions")
    def test_creates_dlq(self):
        # Assert that an SQS queue is created for DLQ
        self.template.resource_count_is("AWS::SQS::Queue", 1)
        self.template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"serverless-lambda-dlq-{self.env_suffix.lower()}",
            "MessageRetentionPeriod": 1209600  # 14 days in seconds
        })

    @mark.it("creates Lambda functions with proper configurations")
    def test_creates_lambda_functions(self):
        # Assert that three Lambda functions are created
        self.template.resource_count_is("AWS::Lambda::Function", 3)
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Timeout": 300,  # 5 minutes
            "MemorySize": 512
        })

    @mark.it("creates an API Gateway with resources and methods")
    def test_creates_api_gateway(self):
        # Assert that an API Gateway is created
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        self.template.resource_count_is("AWS::ApiGateway::Resource", 2)  # /hello and /data
        self.template.resource_count_is("AWS::ApiGateway::Method", 2)  # GET and POST methods

    @mark.it("creates Parameter Store parameters")
    def test_creates_parameter_store(self):
        # Assert that two SSM parameters are created
        self.template.resource_count_is("AWS::SSM::Parameter", 2)
        self.template.has_resource_properties("AWS::SSM::Parameter", {
            "Type": "String",
            "Name": f"/serverless/api/key-{self.env_suffix}"
        })
        self.template.has_resource_properties("AWS::SSM::Parameter", {
            "Type": "String",
            "Name": f"/serverless/database/connection-string-{self.env_suffix}"
        })

    @mark.it("outputs key resources")
    def test_outputs_resources(self):
        # Assert that key resources are output
        self.template.has_output("VPCId", {})
        self.template.has_output("ApiGatewayUrl", {})
        self.template.has_output("HelloLambdaArn", {})
        self.template.has_output("DataProcessorLambdaArn", {})
        self.template.has_output("SNSTopicArn", {})
        self.template.has_output("KMSKeyId", {})
        self.template.has_output("LambdaCodeBucketName", {})
