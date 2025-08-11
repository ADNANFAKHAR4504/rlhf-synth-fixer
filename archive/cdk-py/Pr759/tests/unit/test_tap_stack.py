import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import ServerlessStack

class TestServerlessStack(unittest.TestCase):
  """
  A test suite for the ServerlessStack, with corrected assertions for the
  DynamoDB table and the Lambda execution role.
  """

  def setUp(self):
    """Set up the CDK app, stack, and template for each test."""
    self.app = cdk.App()
    self.stack = ServerlessStack(self.app, "TestServerlessStack")
    self.template = Template.from_stack(self.stack)

  def test_dynamodb_table_created(self):
    """
    FIXED: The assertion has been corrected.
    The stack's `PAY_PER_REQUEST` billing mode results in a top-level
    `BillingMode` property, not `ProvisionedThroughput`.
    """
    self.template.resource_count_is("AWS::DynamoDB::Table", 1)
    self.template.has_resource_properties("AWS::DynamoDB::Table", Match.object_like({
      "KeySchema": [{
        "AttributeName": "ItemId",
        "KeyType": "HASH"
      }],
      "AttributeDefinitions": [{
        "AttributeName": "ItemId",
        "AttributeType": "S"
      }],
      "BillingMode": "PAY_PER_REQUEST"
    }))

  def test_lambda_function_created(self):
    """Test that the Lambda function is created with the correct properties."""
    self.template.resource_count_is("AWS::Lambda::Function", 1)
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Handler": "index.handler",
      "Runtime": "python3.12",
      "Timeout": 5,
      "Environment": {
        "Variables": {
          "TABLE_NAME": {
            "Ref": Match.any_value()
          }
        }
      }
    })

  ### Validation for UNit test on IAM role are added
  def test_lambda_execution_role_created(self):
    """
    FIXED: The assertion has been corrected to use a robust matcher that
    accurately reflects the CloudFormation intrinsic function (Fn::Join)
    used to create the managed policy ARN.
    """
    self.template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": Match.array_with([
          Match.object_like({
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            }
          })
        ])
      },
      "ManagedPolicyArns": Match.array_with([
        {
          "Fn::Join": [
            "",
            Match.array_with([
              "arn:",
              {"Ref": "AWS::Partition"},
              ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ])
          ]
        }
      ])
    })

  def test_lambda_grants_dynamodb_access(self):
    """Test that the IAM policy grants the correct DynamoDB access."""
    self.template.has_resource_properties("AWS::IAM::Policy", {
      "PolicyDocument": {
        "Statement": Match.array_with([
          Match.object_like({
            "Effect": "Allow",
            "Action": Match.array_with([
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem"
            ])
          })
        ])
      }
    })

  def test_autoscaling_targets_created(self):
    """Test that two autoscaling targets are created for the DynamoDB table."""
    self.template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 2)
    self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
      "MinCapacity": 1,
      "MaxCapacity": 1000,
      "ScalableDimension": "dynamodb:table:ReadCapacityUnits",
      "ServiceNamespace": "dynamodb"
    })
    self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
      "MinCapacity": 1,
      "MaxCapacity": 1000,
      "ScalableDimension": "dynamodb:table:WriteCapacityUnits",
      "ServiceNamespace": "dynamodb"
    })

  def test_cloudwatch_dashboard_created(self):
    """Test that a CloudWatch Dashboard resource is created."""
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
    self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
      "DashboardName": "TestServerlessStack-ServerlessMonitoringDashboardV3"
    })

  def test_cfn_outputs_exist(self):
    """Test that the CloudFormation outputs are created with correct export names."""
    self.template.has_output("DynamoDBTableName", {
      "Value": {
        "Ref": Match.any_value()
      },
      "Export": {
        "Name": "ServerlessStackV3DynamoDBTableName"
      }
    })
    self.template.has_output("LambdaFunctionName", {
      "Value": {
        "Ref": Match.any_value()
      },
      "Export": {
        "Name": "ServerlessStackV3LambdaFunctionName"
      }
    })
    self.template.has_output("CloudWatchDashboardName", {
      "Value": {
        "Ref": Match.any_value()
      },
      "Export": {
        "Name": "ServerlessStackV3CloudWatchDashboardName"
      }
    })
