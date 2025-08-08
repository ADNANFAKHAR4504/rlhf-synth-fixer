import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import ServerlessStack


class TestServerlessStack(unittest.TestCase):

  def setUp(self):
    self.app = cdk.App()
    self.stack = ServerlessStack(self.app, "TestServerlessStack")
    self.template = Template.from_stack(self.stack)

  def test_dynamodb_table_created(self):
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
      "BillingMode": "PROVISIONED"
    }))

  def test_lambda_function_created(self):
    self.template.resource_count_is("AWS::Lambda::Function", 1)
    self.template.has_resource_properties("AWS::Lambda::Function", {
      "Handler": "index.handler",
      "Runtime": "python3.9",
      "Timeout": 5,
      "Environment": {
        "Variables": {
          "TABLE_NAME": {
            "Ref": Match.any_value()
          }
        }
      }
    })

  def test_lambda_execution_role_created(self):
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
        Match.object_like({
          "Fn::Join": Match.array_with([
            Match.any_value(),
            Match.array_with([
              "arn:aws:iam::aws:policy/",
              "service-role/AWSLambdaBasicExecutionRole"
            ])
          ])
        })
      ])
    })

  def test_lambda_grants_dynamodb_access(self):
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
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
    self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
      "DashboardName": "TestServerlessStack-ServerlessMonitoringDashboardV3"
    })

  def test_cfn_outputs_exist(self):
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
