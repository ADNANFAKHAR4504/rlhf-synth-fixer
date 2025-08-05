import aws_cdk as cdk
from aws_cdk import assertions
from aws_cdk.assertions import Match
from lib.tap_stack import TapStack, TapStackProps  # adjust if your path is different
import pytest


@pytest.fixture
def template():
  app = cdk.App(context={"environmentSuffix": "test"})
  stack = TapStack(app, "TestStack", props=TapStackProps(environment_suffix="test"))
  return assertions.Template.from_stack(stack)


def test_s3_bucket_created(template):
  template.has_resource_properties("AWS::S3::Bucket", {
    "BucketName": "tap-test-bucket",
    "PublicAccessBlockConfiguration": Match.any_value()
  })


def test_dynamodb_table_created(template):
  template.has_resource_properties("AWS::DynamoDB::Table", {
    "TableName": "tap-test-table",
    "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
    "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
    "BillingMode": "PAY_PER_REQUEST"
  })


def test_lambda_function_created(template):
  template.has_resource_properties("AWS::Lambda::Function", {
    "Handler": "index.handler",
    "Runtime": "python3.11",
    "Environment": {
      "Variables": {
        "TABLE_NAME": "tap-test-table",
        "BUCKET_NAME": "tap-test-bucket"
      }
    }
  })


def test_outputs_exist(template):
  template.has_output("S3BucketName", {
    "Export": {"Name": "tap-test-bucket-name"},
    "Value": {"Ref": Match.any_value()}
  })
  template.has_output("DynamoDBTableName", {
    "Export": {"Name": "tap-test-table-name"},
    "Value": {"Ref": Match.any_value()}
  })
  template.has_output("LambdaFunctionName", {
    "Export": {"Name": "tap-test-lambda-name"},
    "Value": {"Ref": Match.any_value()}
  })
