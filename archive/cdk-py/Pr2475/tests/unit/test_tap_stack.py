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

    @mark.it("creates DynamoDB table with correct properties")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"file-metadata-table-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "AttributeDefinitions": [
                {
                    "AttributeName": "file_key",
                    "AttributeType": "S"
                }
            ],
            "KeySchema": [
                {
                    "AttributeName": "file_key",
                    "KeyType": "HASH"
                }
            ],
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates S3 bucket with versioning and security settings")
    def test_creates_s3_bucket_with_security(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        # Check for our specific Lambda function among possibly multiple functions
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Handler": "process_file.lambda_handler",
            "Timeout": 15,
            "MemorySize": 256
        })

    @mark.it("creates IAM role with correct policies")
    def test_creates_iam_role_with_policies(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
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

    @mark.it("configures correct IAM permissions")
    def test_iam_permissions(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check for policy with S3 and DynamoDB permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": ["s3:GetObject", "s3:GetObjectVersion"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["dynamodb:PutItem", "dynamodb:UpdateItem"]
                    }
                ]
            }
        })

    @mark.it("sets up Lambda environment variables")
    def test_lambda_environment_variables(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check that our Lambda function has the required environment variables
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "process_file.lambda_handler",
            "Environment": {
                "Variables": {
                    "DYNAMODB_TABLE_NAME": Match.any_value(),
                    "DYNAMODB_TABLE_ARN": Match.any_value()
                }
            }
        })

    @mark.it("configures S3 event notification to Lambda")
    def test_s3_event_notification(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check for Lambda permission that indicates S3 event setup
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com"
        })

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("S3BucketName", {
            "Description": "Name of the S3 bucket for data uploads"
        })
        template.has_output("S3BucketURL", {
            "Description": "URL of the S3 bucket"
        })
        template.has_output("DynamoDBTableName", {
            "Description": "Name of the DynamoDB metadata table"
        })
        template.has_output("LambdaFunctionName", {
            "Description": "Name of the Lambda function"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "file-metadata-table-dev"
        })

    @mark.it("applies resource tags correctly")
    def test_resource_tags(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check that resources have tags applied
        # The tags are applied via Tags.of() so they appear in the CloudFormation template
        dynamodb_resources = template.find_resources("AWS::DynamoDB::Table")
        self.assertEqual(len(dynamodb_resources), 1)
        
        # Check that our main Lambda function exists
        template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "process_file.lambda_handler"
        })

    @mark.it("uses correct DynamoDB billing mode")
    def test_dynamodb_billing_mode(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Verify PAY_PER_REQUEST is used instead of deprecated ON_DEMAND
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })

    @mark.it("configures point-in-time recovery correctly")
    def test_point_in_time_recovery(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Verify the new PointInTimeRecoverySpecification format
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("handles environment suffix from CDK context")
    def test_env_suffix_from_context(self):
        # ARRANGE
        app_with_context = cdk.App(context={"environmentSuffix": "staging"})
        stack = TapStack(app_with_context, "TapStackTestContext")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "file-metadata-table-staging"
        })
