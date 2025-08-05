import pytest
from aws_cdk import App
from aws_cdk.assertions import Template
from tap_stack import TapStack, TapStackProps  # Adjust import path as needed


@pytest.fixture
def template():
  app = App(context={"environmentSuffix": "test"})
  stack = TapStack(app, "TapStack", props=TapStackProps(environment_suffix="test"))
  return Template.from_stack(stack)


def test_s3_bucket_created(template):
  template.has_resource_properties("AWS::S3::Bucket", {
    "BucketName": "tap-test-bucket",
    "PublicAccessBlockConfiguration": {
      "RestrictPublicBuckets": True,
      "BlockPublicAcls": True,
      "IgnorePublicAcls": True,
      "BlockPublicPolicy": True
    }
  })


def test_dynamodb_table_created(template):
  template.has_resource_properties("AWS::DynamoDB::Table", {
    "TableName": "tap-test-table",
    "BillingMode": "PAY_PER_REQUEST",
    "KeySchema": [
      {"AttributeName": "id", "KeyType": "HASH"}
    ],
    "AttributeDefinitions": [
      {"AttributeName": "id", "AttributeType": "S"}
    ]
  })


def test_lambda_function_created(template):
  template.has_resource_properties("AWS::Lambda::Function", {
    "FunctionName": "tap-test-lambda",
    "Handler": "index.handler",
    "Runtime": "python3.11",
    "Environment": {
      "Variables": {
        "TABLE_NAME": {"Ref": "AppTable"},
        "BUCKET_NAME": {"Ref": "AppBucket"}
      }
    }
  })


def test_lambda_has_bucket_and_table_permissions(template):
  resources = template.find_resources("AWS::IAM::Policy")
  found_bucket_permission = False
  found_table_permission = False

  for resource in resources.values():
    policy_doc = resource["Properties"]["PolicyDocument"]
    statements = policy_doc.get("Statement", [])
    for stmt in statements:
      actions = stmt.get("Action", [])
      if isinstance(actions, str):
        actions = [actions]

      if "s3:GetObject" in actions or "s3:PutObject" in actions:
        found_bucket_permission = True
      if "dynamodb:GetItem" in actions or "dynamodb:PutItem" in actions:
        found_table_permission = True

  assert found_bucket_permission, "Lambda does not have bucket permissions"
  assert found_table_permission, "Lambda does not have DynamoDB permissions"


def test_lambda_has_s3_event_source_mapping(template):
  resources = template.find_resources("AWS::Lambda::EventSourceMapping")
  assert len(resources) == 1
  for resource in resources.values():
    assert resource["Properties"]["EventSourceArn"]
    assert resource["Properties"]["StartingPosition"] == "LATEST"


def test_outputs_created(template):
  template.has_output("S3BucketName", {
    "Value": {"Ref": "AppBucket"},
    "Export": {"Name": "tap-test-bucket-name"}
  })

  template.has_output("DynamoDBTableName", {
    "Value": {"Ref": "AppTable"},
    "Export": {"Name": "tap-test-table-name"}
  })

  template.has_output("LambdaFunctionName", {
    "Value": {"Ref": "AppLambda"},
    "Export": {"Name": "tap-test-lambda-name"}
  })

  template.has_output("LambdaRoleArn", {
    "Value": {"Fn::GetAtt": ["AppLambdaServiceRole", "Arn"]},
    "Export": {"Name": "tap-test-lambda-role-arn"}
  })
