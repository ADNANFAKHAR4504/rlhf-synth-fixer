import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with the correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": "tap-testenv-bucket",
      "VersioningConfiguration": Match.absent(),
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True
      }
    })
    template.has_resource("AWS::S3::Bucket", {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": "tap-testenv-bucket"
      },
      "UpdateReplacePolicy": "Delete",
      "DeletionPolicy": "Delete"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": "tap-dev-bucket"
    })

  @mark.it("creates a DynamoDB table with correct properties")
  def test_creates_dynamodb_table(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
      "TableName": "tap-testenv-table",
      "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
      "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
      "BillingMode": "PAY_PER_REQUEST"
    })
    template.has_resource("AWS::DynamoDB::Table", {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "tap-testenv-table"
      },
      "UpdateReplacePolicy": "Delete",
      "DeletionPolicy": "Delete"
    })

  @mark.it("creates a Lambda function with correct properties and environment variables")
  def test_creates_lambda_function(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
      "FunctionName": "tap-testenv-lambda",
      "Runtime": "python3.11",
      "Handler": "index.handler",
      "Code": {
        "ZipFile": Match.string_like_regexp(
          r"def handler\(event, context\):\n\s*print\('Event:', event\)"
          r"\n\s*return {'statusCode': 200, 'body': 'Hello from Lambda'}"
        )
      },
      "Environment": {
        "Variables": {
          "TABLE_NAME": {"Fn::GetAtt": [Match.any_value(), "TableName"]},
          "BUCKET_NAME": {"Ref": Match.any_value()}
        }
      }
    })

  @mark.it("grants Lambda read/write permissions to DynamoDB table")
  def test_lambda_grants_dynamodb_permissions(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::IAM::Policy", {
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
            "Resource": {"Fn::GetAtt": [Match.any_value(), "Arn"]}
          })
        ])
      },
      "Roles": [{"Fn::GetAtt": [Match.any_value(), "Arn"]}]
    })

  @mark.it("grants Lambda read/write permissions to S3 bucket")
  def test_lambda_grants_s3_permissions(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::IAM::Policy", {
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
              {
                "Fn::Join": ["", [
                  {"Fn::GetAtt": [Match.any_value(), "Arn"]},
                  "/*"
                ]]
              }
            ]
          })
        ])
      },
      "Roles": [{"Fn::GetAtt": [Match.any_value(), "Arn"]}]
    })

  @mark.it("configures S3 event source for Lambda function")
  def test_s3_event_source_configured(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::Lambda::Permission", {
      "Action": "lambda:InvokeFunction",
      "FunctionName": {"Fn::GetAtt": [Match.any_value(), "Arn"]},
      "Principal": "s3.amazonaws.com",
      "SourceArn": {"Fn::GetAtt": [Match.any_value(), "Arn"]}
    })

    template.has_resource_properties("AWS::S3::Bucket", {
      "NotificationConfiguration": {
        "LambdaConfigurations": [
          {
            "Event": "s3:ObjectCreated:*",
            "Function": {"Fn::GetAtt": [Match.any_value(), "Arn"]}
          }
        ]
      }
    })

  @mark.it("creates CDK outputs for all resources")
  def test_cdk_outputs_created(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.has_output("S3BucketName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": f"tap-{env_suffix}-bucket-name"}
    })

    template.has_output("DynamoDBTableName", {
      "Value": {"Fn::GetAtt": [Match.any_value(), "TableName"]},
      "Export": {"Name": f"tap-{env_suffix}-table-name"}
    })

    template.has_output("LambdaFunctionName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": f"tap-{env_suffix}-lambda-name"}
    })

    template.has_output("LambdaRoleArn", {
      "Value": {"Fn::GetAtt": [Match.any_value(), "Arn"]},
      "Export": {"Name": f"tap-{env_suffix}-lambda-role-arn"}
    })
