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
    self.env_suffix = "testenv"
    self.stack = TapStack(self.app, "TapStackTest",
                          TapStackProps(environment_suffix=self.env_suffix))
    self.template = Template.from_stack(self.stack)

  @mark.it("creates an S3 bucket with the correct environment suffix and properties")
  def test_creates_s3_bucket_with_env_suffix_and_properties(self):
    # ASSERT
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    self.template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": f"tap-testenv-bucket",
        "VersioningConfiguration": Match.absent(), # versioned=False
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        }
    })
    # Check removal policy and auto_delete_objects by looking for DeletionPolicy and UpdateReplacePolicy
    self.template.has_resource("AWS::S3::Bucket", {
        "DeletionPolicy": "Delete",
        "UpdateReplacePolicy": "Delete"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack_default = TapStack(self.app, "TapStackTestDefault")
    template_default = Template.from_stack(stack_default)

    # ASSERT
    template_default.resource_count_is("AWS::S3::Bucket", 1)
    template_default.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": "tap-dev-bucket"
    })

  @mark.it("creates a DynamoDB table with the correct properties")
  def test_creates_dynamodb_table(self):
    # ASSERT
    self.template.resource_count_is("AWS::DynamoDB::Table", 1)
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
        "TableName": f"tap-testenv-table",
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id", "AttributeType": "S"}
        ],
        "BillingMode": "PAY_PER_REQUEST"
    })
    self.template.has_resource("AWS::DynamoDB::Table", {
        "DeletionPolicy": "Delete",
        "UpdateReplacePolicy": "Delete"
    })

  @mark.it("creates a Lambda function with the correct properties and environment variables")
  def test_creates_lambda_function(self):
    # ASSERT
    self.template.resource_count_is("AWS::Lambda::Function", 1)
    self.template.has_resource_properties("AWS::Lambda::Function", {
        "FunctionName": f"tap-testenv-lambda",
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Environment": {
            "Variables": {
                "TABLE_NAME": {"Fn::GetAtt": [Match.any_value(), "TableName"]},
                "BUCKET_NAME": {"Ref": Match.any_value()}
            }
        }
    })

  @mark.it("grants Lambda read/write access to DynamoDB table")
  def test_lambda_grants_dynamodb_access(self):
    # ASSERT
    self.template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": [
                        "dynamodb:BatchGetItem",
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:Query",
                        "dynamodb:GetItem",
                        "dynamodb:Scan",
                        "dynamodb:BatchWriteItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Effect": "Allow",
                    "Resource": [
                        {"Fn::GetAtt": [Match.any_value(), "Arn"]},
                        {"Fn::Join": ["", [
                            {"Fn::GetAtt": [Match.any_value(), "Arn"]},
                            "/index/*"
                        ]]}
                    ]
                })
            ])
        },
        "Roles": [
            {"Fn::GetAtt": [Match.any_value(), "Arn"]}
        ]
    })

  @mark.it("grants Lambda read/write access to S3 bucket")
  def test_lambda_grants_s3_access(self):
    # ASSERT
    self.template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": [
                        "s3:GetObject*",
                        "s3:GetBucket*",
                        "s3:List*",
                        "s3:DeleteObject*",
                        "s3:PutObject*",
                        "s3:AbortMultipartUpload"
                    ],
                    "Effect": "Allow",
                    "Resource": [
                        {"Fn::GetAtt": [Match.any_value(), "Arn"]},
                        {"Fn::Join": ["", [
                            {"Fn::GetAtt": [Match.any_value(), "Arn"]},
                            "/*"
                        ]]}
                    ]
                })
            ])
        },
        "Roles": [
            {"Fn::GetAtt": [Match.any_value(), "Arn"]}
        ]
    })

  @mark.it("configures S3 bucket to trigger Lambda on ObjectCreated events")
  def test_s3_bucket_triggers_lambda(self):
    # ASSERT
    # Check for the Lambda Permission resource that allows S3 to invoke the Lambda
    self.template.has_resource_properties("AWS::Lambda::Permission", {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {"Fn::GetAtt": [Match.any_value(), "Arn"]},
        "Principal": "s3.amazonaws.com",
        "SourceAccount": {"Ref": "AWS::AccountId"},
        "SourceArn": {"Fn::GetAtt": [Match.any_value(), "Arn"]}
    })

    # Check for the S3 Bucket Notification Configuration
    self.template.has_resource_properties("AWS::S3::Bucket", {
        "NotificationConfiguration": {
            "LambdaConfigurations": [
                {
                    "Event": "s3:ObjectCreated:*",
                    "Function": {"Fn::GetAtt": [Match.any_value(), "Arn"]}
                }
            ]
        }
    })

  @mark.it("creates correct CloudFormation outputs")
  def test_creates_cfn_outputs(self):
    # ASSERT
    self.template.has_output("S3BucketName", {
        "Value": {"Ref": Match.any_value()},
        "ExportName": f"tap-{self.env_suffix}-bucket-name"
    })
    self.template.has_output("DynamoDBTableName", {
        "Value": {"Fn::GetAtt": [Match.any_value(), "TableName"]},
        "ExportName": f"tap-{self.env_suffix}-table-name"
    })
    self.template.has_output("LambdaFunctionName", {
        "Value": {"Ref": Match.any_value()},
        "ExportName": f"tap-{self.env_suffix}-lambda-name"
    })
    self.template.has_output("LambdaRoleArn", {
        "Value": {"Fn::GetAtt": [Match.any_value(), "Arn"]},
        "ExportName": f"tap-{self.env_suffix}-lambda-role-arn"
    })

  @mark.it("Lambda function has basic execution role permissions")
  def test_lambda_has_basic_execution_role_permissions(self):
    # ASSERT
    self.template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Effect": "Allow",
                    "Resource": {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {"Ref": "AWS::Partition"},
                                ":logs:",
                                {"Ref": "AWS::Region"},
                                ":",
                                {"Ref": "AWS::AccountId"},
                                ":log-group:/aws/lambda/",
                                {"Ref": Match.any_value()},
                                ":*"
                            ]
                        ]
                    }
                })
            ])
        },
        "Roles": [
            {"Fn::GetAtt": [Match.any_value(), "Arn"]}
        ]
    })
