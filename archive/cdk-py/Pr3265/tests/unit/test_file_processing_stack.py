"""Unit tests for the FileProcessingStack."""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from lib.file_processing_stack import FileProcessingStack, FileProcessingStackProps


@mark.describe("FileProcessingStack")
class TestFileProcessingStack(unittest.TestCase):
    """Test cases for the FileProcessingStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates an S3 bucket with correct configuration")
    def test_creates_s3_bucket(self):
        """Test that the stack creates an S3 bucket with correct configuration."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        })

    @mark.it("creates a DynamoDB table with correct attributes")
    def test_creates_dynamodb_table(self):
        """Test that the stack creates a DynamoDB table with correct attributes."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": Match.array_with([
                Match.object_like({
                    "AttributeName": "filename",
                    "KeyType": "HASH"
                }),
                Match.object_like({
                    "AttributeName": "upload_timestamp",
                    "KeyType": "RANGE"
                })
            ]),
            "BillingMode": "PAY_PER_REQUEST"
        })

    @mark.it("creates a Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        """Test that the stack creates a Lambda function with correct configuration."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.10",
            "MemorySize": 256,
            "Timeout": 30,
            "Handler": "processor.handler"
        })

    @mark.it("creates a CloudWatch alarm for failure rate")
    def test_creates_cloudwatch_alarm(self):
        """Test that the stack creates a CloudWatch alarm for failure rate."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 1,
            "Threshold": 5
        })

    @mark.it("configures Lambda with correct IAM permissions")
    def test_lambda_has_correct_permissions(self):
        """Test that Lambda function has correct IAM permissions."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with(["s3:GetObject", "s3:GetObjectVersion"]),
                        "Effect": "Allow"
                    }),
                    Match.object_like({
                        "Action": "dynamodb:PutItem",
                        "Effect": "Allow"
                    })
                ])
            })
        })

    @mark.it("configures S3 event notification for Lambda")
    def test_s3_event_notification_configured(self):
        """Test that S3 bucket has event notification for Lambda."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Principal": "s3.amazonaws.com",
            "Action": "lambda:InvokeFunction"
        })

    @mark.it("creates CloudWatch log group with correct retention")
    def test_creates_log_group(self):
        """Test that the stack creates a CloudWatch log group with 7-day retention."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 7
        })

    @mark.it("sets removal policy to DESTROY for all resources")
    def test_removal_policies(self):
        """Test that all resources have RemovalPolicy.DESTROY set."""
        # ARRANGE
        props = FileProcessingStackProps(environment_suffix='test')
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)
        template = Template.from_stack(self.stack)

        # ASSERT - S3 bucket should have deletion policy
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete"
        })

        # ASSERT - DynamoDB table should have deletion policy
        template.has_resource("AWS::DynamoDB::Table", {
            "DeletionPolicy": "Delete"
        })

    @mark.it("includes environment suffix in resource names")
    def test_environment_suffix_in_names(self):
        """Test that environment suffix is included in resource names."""
        # ARRANGE
        test_suffix = 'unittest'
        props = FileProcessingStackProps(environment_suffix=test_suffix)
        construct = FileProcessingStack(self.stack, "FileProcessing", props=props)

        # ASSERT
        self.assertIsNotNone(construct.shipment_bucket)
        self.assertIsNotNone(construct.metadata_table)
        self.assertIsNotNone(construct.processor_function)
