import os
import sys
import unittest
from aws_cdk import assertions
import aws_cdk as core

# Add root project directory to path for proper imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from lib.tap_stack import ServerlessStack  # Ensure this path and class exist


class TestServerlessStack(unittest.TestCase):
  """
  A full test suite for the ServerlessStack, including fixes for the
  previously failing tests related to IAM roles and DynamoDB permissions.
  """

  def setUp(self):
    """Set up the CDK app, stack, and template for each test."""
    self.app = core.App()
    self.stack = ServerlessStack(self.app, "TestTapStack")
    self.template = assertions.Template.from_stack(self.stack)

  def test_autoscaling_targets_created(self):
    """Test that autoscaling targets are created for the DynamoDB table."""
    self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
      "MaxCapacity": 100,
      "MinCapacity": 5,
      "ResourceId": assertions.Match.object_like({"Fn::Join": ["", [
        "table/",
        {"Ref": "TapTableE5D3E85C"}
      ]]}),
      "ScalableDimension": "dynamodb:table:ReadCapacityUnits",
      "ServiceNamespace": "dynamodb"
    })
    self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
      "MaxCapacity": 100,
      "MinCapacity": 5,
      "ResourceId": assertions.Match.object_like({"Fn::Join": ["", [
        "table/",
        {"Ref": "TapTableE5D3E85C"}
      ]]}),
      "ScalableDimension": "dynamodb:table:WriteCapacityUnits",
      "ServiceNamespace": "dynamodb"
    })

  def test_cfn_outputs_exist(self):
    """Test that the CloudFormation outputs are created."""
    self.template.has_output("TapTableName")
    self.template.has_output("LambdaFunctionName")

  def test_cloudwatch_dashboard_created(self):
    """Test that a CloudWatch Dashboard resource is created."""
    self.template.has_resource("AWS::CloudWatch::Dashboard", {})

  def test_dynamodb_table_created(self):
    """Test that a DynamoDB table with the correct properties is created."""
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "KeySchema": [
        {"AttributeName": "id", "KeyType": "HASH"}
      ],
      "AttributeDefinitions": [
        {"AttributeName": "id", "AttributeType": "S"}
      ],
      "BillingMode": "PROVISIONED",
      "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
      }
    })

  def test_lambda_execution_role_created(self):
    """
    Ensure IAM role for Lambda has the correct trust policy and the
    AWSLambdaBasicExecutionRole managed policy.
    """
    self.template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          }
        }]
      },
      "ManagedPolicyArns": assertions.Match.array_with([
        assertions.Match.string_like_regexp(
          r"arn:.+:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )
      ])
    })

  def test_lambda_function_created(self):
    """Test that the Lambda function is created with the correct runtime."""
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Runtime": "python3.12"
    })

  def test_lambda_grants_dynamodb_access(self):
    """
    Ensure the IAM policy attached to the Lambda's role grants
    permissions to access the DynamoDB table.
    """
    self.template.has_resource_properties("AWS::IAM::Policy", {
      "PolicyDocument": {
        "Statement": [
          assertions.Match.object_like({
            "Action": assertions.Match.array_with([
              "dynamodb:BatchGetItem",
              "dynamodb:GetRecords",
              "dynamodb:GetShardIterator",
              "dynamodb:Query",
              "dynamodb:GetItem",
              "dynamodb:Scan",
              "dynamodb:ConditionCheckItem",
              "dynamodb:BatchWriteItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:DescribeTable"
            ]),
            "Effect": "Allow"
          })
        ]
      }
    })


if __name__ == "__main__":
  unittest.main()
