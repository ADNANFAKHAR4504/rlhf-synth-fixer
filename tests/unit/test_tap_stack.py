import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

# Import the actual stack class
from lib.tap_stack import ServerlessStack


class TestServerlessStack(unittest.TestCase):
  """Test cases for the ServerlessStack CDK stack"""

  def setUp(self):
    self.app = cdk.App()
    self.stack = ServerlessStack(self.app, "TestServerlessStack")
    self.template = Template.from_stack(self.stack)

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
    """Ensure a CloudWatch dashboard is defined."""
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
    self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
      "DashboardName": "ServerlessMonitoringDashboard"
    })

  def test_cfn_outputs_exist(self):
    """Ensure CFN Outputs are created for Lambda, DynamoDB, and Dashboard."""
    self.template.has_output("DynamoDBTableName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": "ServerlessStackDynamoDBTableName"}
    })
    self.template.has_output("LambdaFunctionName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": "ServerlessStackLambdaFunctionName"}
    })
    self.template.has_output("CloudWatchDashboardName", {
      "Value": {"Ref": Match.any_value()},
      "Export": {"Name": "ServerlessStackCloudWatchDashboardName"}
    })
