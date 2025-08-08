import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

# Import the actual stack class
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
            "BillingMode": "PROVISIONED"
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
                    "TABLE_NAME": Match.any_value()
                }
            }
        })

    def test_lambda_execution_role_created(self):
        """Ensure IAM role for Lambda has correct trust policy and managed policy."""
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
                Match.string_like_regexp(
                    r"arn:.*:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                )
            ])
        })

    def test_lambda_grants_dynamodb_access(self):
        """Test that the IAM role has permissions to access the DynamoDB table."""
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
                            "dynamodb:GetShardIterator",
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
            "DashboardName": Match.string_like_regexp(
                r"TestServerlessStack-ServerlessMonitoringDashboardV3"
            )
        })

    def test_cfn_outputs_exist(self):
        """Ensure CFN Outputs are created for Lambda, DynamoDB, and Dashboard with export names."""
        self.template.has_output("DynamoDBTableName", {
            "Value": Match.any_value(),
            "Export": {"Name": "ServerlessStackV3DynamoDBTableName"}
        })

        self.template.has_output("LambdaFunctionName", {
            "Value": Match.any_value(),
            "Export": {"Name": "ServerlessStackV3LambdaFunctionName"}
        })

        self.template.has_output("CloudWatchDashboardName", {
            "Value": Match.any_value(),
            "Export": {"Name": "ServerlessStackV3CloudWatchDashboardName"}
        })
