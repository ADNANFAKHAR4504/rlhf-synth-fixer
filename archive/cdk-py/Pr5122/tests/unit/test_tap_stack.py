"""Unit tests for TapStack SMS notification system."""

import unittest
from unittest.mock import patch, MagicMock
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack SMS Notification System")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates DynamoDB tables with correct configuration")
    def test_creates_dynamodb_tables(self):
        # ARRANGE
        env_suffix = "testenv"
        
        # Mock time.time to return a fixed value for predictable naming
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Check notification logs table
        template.resource_count_is("AWS::DynamoDB::Table", 2)
        
        # Notification logs table
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"order-notification-logs-{env_suffix}-567890",
            "KeySchema": [
                {"AttributeName": "orderId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "AttributeDefinitions": [
                {"AttributeName": "orderId", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "S"},
                {"AttributeName": "deliveryStatus", "AttributeType": "S"}
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}
        })
        
        # Customer preferences table
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"customer-preferences-{env_suffix}-567890",
            "KeySchema": [
                {"AttributeName": "customerId", "KeyType": "HASH"}
            ],
            "AttributeDefinitions": [
                {"AttributeName": "customerId", "AttributeType": "S"}
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}
        })

    @mark.it("creates Global Secondary Index for delivery status tracking")
    def test_creates_gsi_for_delivery_status(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Check GSI configuration
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "DeliveryStatusIndex",
                    "KeySchema": [
                        {"AttributeName": "deliveryStatus", "KeyType": "HASH"},
                        {"AttributeName": "timestamp", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                }
            ]
        })

    @mark.it("creates SNS topics with proper configuration")
    def test_creates_sns_topics(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 2)
        
        # SMS Topic
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"order-updates-sms-{env_suffix}-567890",
            "DisplayName": "E-commerce Order Updates SMS"
        })
        
        # Email Topic
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"order-updates-email-{env_suffix}-567890",
            "DisplayName": "E-commerce Order Updates Email"
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"order-notification-processor-{env_suffix}-567890",
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
            "Timeout": 300,  # 5 minutes
            "MemorySize": 512,
            "Environment": {
                "Variables": {
                    "NOTIFICATION_LOGS_TABLE": {"Ref": Match.any_value()},
                    "CUSTOMER_PREFERENCES_TABLE": {"Ref": Match.any_value()},
                    "SMS_TOPIC_ARN": {"Ref": Match.any_value()},
                    "EMAIL_TOPIC_ARN": {"Ref": Match.any_value()},
                    "ENVIRONMENT": env_suffix,
                    "LOG_LEVEL": "INFO"
                }
            }
        })

    @mark.it("creates IAM role with appropriate permissions")
    def test_creates_iam_role_with_permissions(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 1)
        
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"notification-processor-role-{env_suffix}-567890",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            },
            "ManagedPolicyArns": [
                {"Fn::Join": ["", [
                    "arn:",
                    {"Ref": "AWS::Partition"},
                    ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                ]]}
            ]
        })

    @mark.it("grants proper DynamoDB permissions to Lambda role")
    def test_grants_dynamodb_permissions(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Check for DynamoDB permissions policy
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": [
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
                        ],
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

    @mark.it("grants SNS publish permissions to Lambda role")
    def test_grants_sns_permissions(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Check for SNS permissions policy
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": "sns:Publish",
                        "Resource": Match.any_value()
                    }
                ])
            }
        })

    @mark.it("grants SES permissions to Lambda role")
    def test_grants_ses_permissions(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Check for SES permissions policy
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ses:SendEmail",
                            "ses:SendRawEmail"
                        ],
                        "Resource": "*"
                    }
                ])
            }
        })

    @mark.it("creates CloudWatch log group with retention policy")
    def test_creates_cloudwatch_log_group(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/order-notification-processor-{env_suffix}-567890",
            "RetentionInDays": 14
        })

    @mark.it("creates CloudWatch metric filter for monitoring")
    def test_creates_cloudwatch_metric_filter(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::MetricFilter", 1)
        
        template.has_resource_properties("AWS::Logs::MetricFilter", {
            "FilterPattern": "SMS sent successfully",
            "MetricTransformations": [
                {
                    "MetricNamespace": "OrderNotifications",
                    "MetricName": "ProcessedNotifications",
                    "MetricValue": "1"
                }
            ]
        })

    @mark.it("creates EventBridge rule for monitoring")
    def test_creates_eventbridge_monitoring_rule(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Events::Rule", 1)
        
        template.has_resource_properties("AWS::Events::Rule", {
            "Name": f"notification-monitoring-{env_suffix}-567890",
            "Description": "Periodic monitoring of notification system health",
            "ScheduleExpression": "rate(1 hour)"
        })

    @mark.it("creates all required CloudFormation outputs")
    def test_creates_cloudformation_outputs(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Check for all outputs
        template.has_output("NotificationProcessorLambdaArn", {
            "Description": "ARN of the notification processor Lambda function"
        })
        
        template.has_output("SMSTopicArn", {
            "Description": "ARN of the SMS notification topic"
        })
        
        template.has_output("EmailTopicArn", {
            "Description": "ARN of the email notification topic"
        })
        
        template.has_output("NotificationLogsTableName", {
            "Description": "Name of the notification logs DynamoDB table"
        })
        
        template.has_output("CustomerPreferencesTableName", {
            "Description": "Name of the customer preferences DynamoDB table"
        })
        
        template.has_output("EnvironmentSuffix", {
            "Description": "Unique environment suffix used for this deployment"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTestDefault")
            template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "order-notification-logs-dev-567890"
        })

    @mark.it("uses context environment suffix when props not provided")
    def test_uses_context_environment_suffix(self):
        # ARRANGE
        app_with_context = cdk.App(context={"environmentSuffix": "staging"})
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(app_with_context, "TapStackTestContext")
            template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "order-notification-logs-staging-567890"
        })

    @mark.it("handles TapStackProps correctly")
    def test_tap_stack_props_initialization(self):
        # ARRANGE & ASSERT
        props = TapStackProps(environment_suffix="production")
        self.assertEqual(props.environment_suffix, "production")
        
        # Test without environment suffix
        props_default = TapStackProps()
        self.assertIsNone(props_default.environment_suffix)

    @mark.it("creates unique resource names using timestamp")
    def test_creates_unique_resource_names(self):
        # ARRANGE
        env_suffix = "test"
        
        # Test with different timestamps
        with patch('time.time', return_value=1234567890):
            stack1 = TapStack(self.app, "TapStackTest1",
                            TapStackProps(environment_suffix=env_suffix))
            template1 = Template.from_stack(stack1)
        
        app2 = cdk.App()
        with patch('time.time', return_value=1234567999):
            stack2 = TapStack(app2, "TapStackTest2",
                            TapStackProps(environment_suffix=env_suffix))
            template2 = Template.from_stack(stack2)

        # ASSERT - Different timestamps should create different resource names
        template1.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "order-notification-logs-test-567890"
        })
        
        template2.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "order-notification-logs-test-567999"
        })

    @mark.it("validates Lambda function environment variables contain all required values")
    def test_lambda_environment_variables_complete(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Check all required environment variables are present
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "NOTIFICATION_LOGS_TABLE": {"Ref": Match.any_value()},
                    "CUSTOMER_PREFERENCES_TABLE": {"Ref": Match.any_value()},
                    "SMS_TOPIC_ARN": {"Ref": Match.any_value()},
                    "EMAIL_TOPIC_ARN": {"Ref": Match.any_value()},
                    "ENVIRONMENT": env_suffix,
                    "LOG_LEVEL": "INFO"
                }
            }
        })

    @mark.it("ensures Lambda function has inline code with handler")
    def test_lambda_function_has_inline_code(self):
        # ARRANGE
        env_suffix = "testenv"
        
        with patch('time.time', return_value=1234567890):
            stack = TapStack(self.app, "TapStackTest",
                           TapStackProps(environment_suffix=env_suffix))
            template = Template.from_stack(stack)

        # ASSERT - Lambda should have inline code
        template.has_resource_properties("AWS::Lambda::Function", {
            "Code": {
                "ZipFile": Match.string_like_regexp(".*lambda_handler.*")
            }
        })


if __name__ == "__main__":
    unittest.main()