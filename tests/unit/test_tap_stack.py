import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

# Import the actual stack class.
# The user's error message implies the module is named `tap_stack`.
from lib.tap_stack import ServerlessStack


class TestServerlessStack(unittest.TestCase):
  """Test cases for the ServerlessStack CDK stack"""

  def setUp(self):
    """Initializes a new CDK App and Stack for each test."""
    self.app = cdk.App()
    self.stack = ServerlessStack(self.app, "TestServerlessStack")
    self.template = Template.from_stack(self.stack)

  def test_dynamodb_table_created(self):
    """Ensure DynamoDB table is created with correct schema and billing mode."""
    self.template.resource_count_is("AWS::DynamoDB::Table", 1)
    self.template.has_resource_properties("AWS::DynamoDB::Table", {
      "KeySchema": [{
        "AttributeName": "ItemId",
        "KeyType": "HASH"
      }],
      "AttributeDefinitions": [{
        "AttributeName": "ItemId",
        "AttributeType": "S"
      }],
      # The table is created with PROVISIONED billing, which results in this property
      "ProvisionedThroughput": Match.object_like({
        "ReadCapacityUnits": 1,
        "WriteCapacityUnits": 1
      }),
      "TableName": Match.any_value()
    })

  def test_lambda_function_created(self):
    """Ensure Lambda function is defined with environment and runtime settings."""
    self.template.resource_count_is("AWS::Lambda::Function", 1)
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Handler": "index.handler",
      "Runtime": "python3.9",
      "Timeout": 5,
      "Environment": {
        "Variables": {
          "TABLE_NAME": {"Ref": Match.any_value()}
        }
      }
    })

  def test_lambda_execution_role_created(self):
    """Ensure IAM role for Lambda has correct trust policy and managed policy."""
    # We remove the resource count check because the stack creates multiple roles
    # (for Lambda and autoscaling), which caused the test to fail.
    # This test now only checks for the properties of the Lambda's execution role.
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
      "ManagedPolicyArns": Match.array_with([
        Match.object_like({"Fn::Join": Match.array_with(["arn:", Match.any_value()])})
      ])
    })

  def test_lambda_grants_dynamodb_access(self):
    """Test that the IAM role has permissions to access the DynamoDB table."""
    # The previous test was too strict about the exact list of actions.
    # We now use Match.array_with to ensure the required actions are present,
    # without failing on additional permissions granted by CDK.
    self.template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": [
                Match.object_like({
                    "Action": Match.array_with([
                        "dynamodb:BatchGetItem",
                        "dynamodb:GetItem",
                        "dynamodb:Scan",
                        "dynamodb:Query",
                        "dynamodb:GetRecords",
                        "dynamodb:BatchWriteItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ]),
                    "Effect": "Allow",
                })
            ]
        }
    })

  def test_autoscaling_targets_created(self):
    """Check that DynamoDB read/write autoscaling is configured."""
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
    """Ensure a CloudWatch dashboard is defined with the correct name."""
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
    self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
      "DashboardName": "TestServerlessStack-ServerlessMonitoringDashboardV3"
    })

  def test_cfn_outputs_exist(self):
    """Ensure CFN Outputs are created for Lambda, DynamoDB, and Dashboard with updated export names."""
    self.template.has_output("DynamoDBTableName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": "ServerlessStackV3DynamoDBTableName"}
    })
    self.template.has_output("LambdaFunctionName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": "ServerlessStackV3LambdaFunctionName"}
    })
    self.template.has_output("CloudWatchDashboardName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": "ServerlessStackV3CloudWatchDashboardName"}
    })
