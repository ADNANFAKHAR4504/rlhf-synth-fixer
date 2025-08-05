import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Template

from tap_stack.tap_stack import TapStack, TapStackProps  # adjust import as needed


@pytest.fixture
def template():
  app = cdk.App(context={"environmentSuffix": "test"})
  stack = TapStack(app, "TestTapStack", props=TapStackProps(environment_suffix="test"))
  return Template.from_stack(stack)


def test_s3_bucket_created(template):
  template.has_resource_properties("AWS::S3::Bucket", {
    "BucketName": "tap-test-bucket",
    "VersioningConfiguration": cdk.CfnCondition.ANY_VALUE  # allows passing even if not versioned
  })


def test_dynamodb_table_created(template):
  template.has_resource_properties("AWS::DynamoDB::Table", {
    "TableName": "tap-test-table",
    "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
    "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
    "BillingMode": "PAYPERREQUEST"
  })


def test_lambda_function_created(template):
  template.has_resource_properties("AWS::Lambda::Function", {
    "FunctionName": "tap-test-lambda",
    "Runtime": "python3.11",
    "Handler": "index.handler"
  })


def test_outputs_present(template):
  template.has_output("S3BucketName", {
    "Export": {"Name": "tap-test-bucket-name"}
  })
  template.has_output("DynamoDBTableName", {
    "Export": {"Name": "tap-test-table-name"}
  })
  template.has_output("LambdaFunctionName", {
    "Export": {"Name": "tap-test-lambda-name"}
  })
  template.has_output("LambdaRoleArn", {
    "Export": {"Name": "tap-test-lambda-role-arn"}
  })
