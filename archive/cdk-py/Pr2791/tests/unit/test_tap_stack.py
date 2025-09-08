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

    @mark.it("creates an S3 bucket with versioning, encryption, and lifecycle rules")
    def test_s3_bucket_properties(self):
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
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "LifecycleConfiguration": {
                "Rules": [
                    {
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 30
                            }
                        ],
                        "NoncurrentVersionExpiration": {"NoncurrentDays": 90},
                        "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 7}
                    }
                ]
            }
        })

    @mark.it("creates an SQS Dead Letter Queue with correct retention and encryption")
    def test_sqs_dlq_properties(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 1)
        template.has_resource_properties("AWS::SQS::Queue", {
            "MessageRetentionPeriod": 1209600,  # 14 days in seconds
            "VisibilityTimeout": 30,
            "KmsMasterKeyId": "alias/aws/sqs"
        })

    @mark.it("creates an SNS topic with an email subscription")
    def test_sns_topic_and_subscription(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.resource_count_is("AWS::SNS::Subscription", 1)
        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "veerasolaiyappan@gmail.com"
        })

    @mark.it("creates a Lambda function with correct runtime, timeout, and environment variables")
    def test_lambda_function_properties(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Timeout": 30,
            "MemorySize": 512,
        })

    @mark.it("creates a CloudWatch log group with correct retention")
    def test_log_group_properties(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    @mark.it("outputs key resource identifiers")
    def test_stack_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("BucketName", {})
        template.has_output("LambdaFunctionName", {})
        template.has_output("SNSTopicArn", {})
        template.has_output("DLQUrl", {})
        template.has_output("EnvironmentSuffix", {})
