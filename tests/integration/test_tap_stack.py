import json
import os
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

# Load deployment outputs if available
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.loads(f.read())
else:
  flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for synthesized CloudFormation template"""

  def setUp(self):
    """Set up a fresh CDK app and stack for each test"""
    self.app = cdk.App()
    props = TapStackProps(environment_suffix="integration")
    self.stack = TapStack(self.app, "integration-test-stack", props=props)
    self.template = Template.from_stack(self.stack)

  @mark.it("validates synthesized resource counts")
  def test_resource_counts(self):
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    self.template.resource_count_is("AWS::DynamoDB::Table", 1)
    self.template.resource_count_is("AWS::SNS::Topic", 1)
    self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)

  @mark.it("validates S3 bucket configuration")
  def test_s3_bucket_config(self):
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": Match.string_like_regexp("^tap-bucket-integration"),
      "BucketEncryption": {
        "ServerSideEncryptionConfiguration": [{
          "ServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          }
        }]
      }
    })

  @mark.it("validates DynamoDB table configuration")
  def test_dynamodb_table_config(self):
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "TableName": Match.string_like_regexp("^tap-object-metadata-integration"),
      "BillingMode": "PAY_PER_REQUEST",
      "AttributeDefinitions": Match.array_with([
        Match.object_like({"AttributeName": "objectKey", "AttributeType": "S"}),
        Match.object_like({"AttributeName": "uploadTime", "AttributeType": "S"})
      ]),
      "KeySchema": Match.array_with([
        Match.object_like({"AttributeName": "objectKey", "KeyType": "HASH"}),
        Match.object_like({"AttributeName": "uploadTime", "KeyType": "RANGE"})
      ])
    })

  @mark.it("validates SNS topic configuration")
  def test_sns_topic_config(self):
    self.template.has_resource_properties("AWS::SNS::Topic", {
      "TopicName": Match.string_like_regexp("^tap-notification-integration")
    })

  @mark.it("validates Lambda function configuration")
  def test_lambda_function_config(self):
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "FunctionName": Match.string_like_regexp("^tap-object-processor-integration"),
      "Runtime": "python3.9",
      "Handler": "index.lambda_handler",
      "Timeout": 30,
      "Environment": {
        "Variables": {
          "DDB_TABLE": Match.any_value(),
          "SNS_TOPIC": Match.any_value(),
          "TIMEOUT": "30"
        }
      }
    })

  @mark.it("validates API Gateway configuration")
  def test_api_gateway_config(self):
    self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
      "Name": Match.string_like_regexp("^tap-api-integration")
    })

  @mark.it("validates IAM role and policies for Lambda")
  def test_lambda_iam_role_and_policies(self):
    self.template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"}
        }],
        "Version": "2012-10-17"
      },
      "Description": "Lambda execution role for TapStack"
    })
    self.template.has_resource_properties("AWS::IAM::Policy", {
      "PolicyDocument": {
        "Statement": Match.array_with([
          Match.object_like({
            "Action": Match.any_value(),
            "Effect": "Allow",
            "Resource": Match.any_value()
          })
        ])
      },
      "Roles": Match.any_value()
    })

  @mark.it("validates S3 notification Lambda permission")
  def test_s3_notification_lambda_permission(self):
    self.template.has_resource_properties("AWS::Lambda::Permission", {
      "Action": "lambda:InvokeFunction",
      "Principal": "s3.amazonaws.com",
      "SourceAccount": Match.any_value()
    })


@mark.integration
class TestTapStackDeployedResources(unittest.TestCase):
  """Integration tests using actual AWS deployment outputs"""

  def setUp(self):
    if not flat_outputs:
      self.skipTest("No deployment outputs available - stack not deployed")

  @mark.it("validates deployed S3 bucket exists")
  def test_deployed_s3_bucket(self):
    bucket_name = flat_outputs.get("S3BucketNameOutput")
    self.assertIsNotNone(bucket_name, "S3BucketNameOutput not found in deployment outputs")
    self.assertTrue(bucket_name.startswith("tap-bucket-"),
      "S3 bucket should follow naming convention")

  @mark.it("validates deployed DynamoDB table exists")
  def test_deployed_dynamodb_table(self):
    table_name = flat_outputs.get("DynamoDBTableNameOutput")
    self.assertIsNotNone(table_name, "DynamoDBTableNameOutput not found in deployment outputs")
    self.assertTrue(table_name.startswith("tap-object-metadata-"),
      "DynamoDB table should follow naming convention")

  @mark.it("validates deployed SNS topic exists")
  def test_deployed_sns_topic(self):
    topic_arn = flat_outputs.get("SnsTopicArnOutput")
    self.assertIsNotNone(topic_arn, "SnsTopicArnOutput not found in deployment outputs")
    self.assertTrue(topic_arn.startswith("arn:aws:sns:"),
      "SNS topic ARN should start with arn:aws:sns:")

  @mark.it("validates deployed Lambda function exists")
  def test_deployed_lambda_function(self):
    lambda_name = flat_outputs.get("LambdaFunctionNameOutput")
    self.assertIsNotNone(lambda_name, "LambdaFunctionNameOutput not found in deployment outputs")
    self.assertTrue(lambda_name.startswith("tap-object-processor-"),
      "Lambda function should follow naming convention")

  @mark.it("validates deployed API Gateway exists")
  def test_deployed_api_gateway(self):
    api_url = flat_outputs.get("ApiGatewayUrlOutput")
    self.assertIsNotNone(api_url, "ApiGatewayUrlOutput not found in deployment outputs")
    self.assertTrue(api_url.startswith("https://"),
      "API Gateway URL should start with https://")


if __name__ == '__main__':
  unittest.main()
