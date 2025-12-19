import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Unit Tests")
class TestTapStack(unittest.TestCase):
    """Comprehensive unit test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table_with_correct_configuration(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "BillingMode": "PAY_PER_REQUEST",
                "AttributeDefinitions": [
                    {"AttributeName": "shipmentId", "AttributeType": "S"},
                    {"AttributeName": "timestamp", "AttributeType": "S"},
                    {"AttributeName": "status", "AttributeType": "S"},
                ],
                "KeySchema": [
                    {"AttributeName": "shipmentId", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "GlobalSecondaryIndexes": [
                    {
                        "IndexName": "StatusIndex",
                        "KeySchema": [
                            {"AttributeName": "status", "KeyType": "HASH"},
                            {"AttributeName": "timestamp", "KeyType": "RANGE"},
                        ],
                        "Projection": {"ProjectionType": "ALL"},
                    }
                ],
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": True
                },
                "StreamSpecification": {"StreamViewType": "NEW_AND_OLD_IMAGES"},
            },
        )

    @mark.it("creates Lambda function with Python 3.10 runtime")
    def test_creates_lambda_function_with_correct_runtime(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.10",
                "Handler": "index.lambda_handler",
                "Timeout": 30,
                "MemorySize": 512,
                "TracingConfig": {"Mode": "Active"},
                "Environment": {
                    "Variables": Match.object_like({"ENVIRONMENT": env_suffix})
                },
            },
        )

    @mark.it("creates EventBridge custom event bus")
    def test_creates_eventbridge_custom_bus(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Events::EventBus", 1)
        # Just verify the resource exists and has a Name property
        template.has_resource_properties(
            "AWS::Events::EventBus", {"Name": Match.any_value()}
        )

    @mark.it("creates EventBridge rule with correct event patterns")
    def test_creates_eventbridge_rule_with_patterns(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Events::Rule", 1)
        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "EventPattern": {
                    "source": ["logistics.shipments"],
                    "detail-type": [
                        "Shipment Update",
                        "Shipment Created",
                        "Shipment Delayed",
                    ],
                },
                "Targets": Match.array_with(
                    [
                        Match.object_like(
                            {
                                "Arn": Match.any_value(),
                                "Id": Match.any_value(),
                                "RetryPolicy": {"MaximumRetryAttempts": 2},
                            }
                        )
                    ]
                ),
            },
        )

    @mark.it("creates SNS topic with email subscription")
    def test_creates_sns_topic_with_email_subscription(self):
        # ARRANGE
        env_suffix = "testenv"
        notification_email = "test@example.com"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(
                environment_suffix=env_suffix, notification_email=notification_email
            ),
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties(
            "AWS::SNS::Topic", {"DisplayName": "Shipment Processing Alerts"}
        )

        template.resource_count_is("AWS::SNS::Subscription", 1)
        template.has_resource_properties(
            "AWS::SNS::Subscription", {"Protocol": "email"}
        )

    @mark.it("creates IAM role with least privilege permissions")
    def test_creates_iam_role_with_least_privilege(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Lambda execution role
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                        }
                    ]
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {"Ref": "AWS::Partition"},
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                            ],
                        ]
                    }
                ],
            },
        )

        # ASSERT - DynamoDB permissions policy
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            {
                                "Action": [
                                    "dynamodb:BatchWriteItem",
                                    "dynamodb:PutItem",
                                    "dynamodb:UpdateItem",
                                    "dynamodb:DeleteItem",
                                    "dynamodb:DescribeTable",
                                ],
                                "Effect": "Allow",
                                "Resource": Match.any_value(),
                            }
                        ]
                    )
                }
            },
        )

        # ASSERT - SNS publish permissions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            {
                                "Action": "sns:Publish",
                                "Effect": "Allow",
                                "Resource": Match.any_value(),
                            }
                        ]
                    )
                }
            },
        )

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 4 CloudWatch alarms total
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)

        # ASSERT - Lambda error alarm
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
                "EvaluationPeriods": 1,
                "MetricName": "Errors",
                "Namespace": "AWS/Lambda",
                "Statistic": "Sum",
                "Threshold": 5,
            },
        )

        # ASSERT - Lambda duration alarm
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "ComparisonOperator": "GreaterThanThreshold",
                "EvaluationPeriods": 2,
                "MetricName": "Duration",
                "Namespace": "AWS/Lambda",
                "Statistic": "Average",
                "Threshold": 10000,
            },
        )

        # ASSERT - Lambda throttle alarm
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
                "EvaluationPeriods": 1,
                "MetricName": "Throttles",
                "Namespace": "AWS/Lambda",
                "Statistic": "Sum",
                "Threshold": 1,
            },
        )

        # ASSERT - DynamoDB throttle alarm
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
                "EvaluationPeriods": 1,
                "MetricName": "UserErrors",
                "Namespace": "AWS/DynamoDB",
                "Statistic": "Sum",
                "Threshold": 5,
            },
        )

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Just verify dashboard exists and has a body
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard", {"DashboardBody": Match.any_value()}
        )

    @mark.it("creates Lambda permission for EventBridge invocation")
    def test_creates_lambda_permission_for_eventbridge(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::Lambda::Permission",
            {"Action": "lambda:InvokeFunction", "Principal": "events.amazonaws.com"},
        )

    @mark.it("creates CloudFormation parameters")
    def test_creates_cloudformation_parameters(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_parameter(
            "NotificationEmail",
            {
                "Type": "String",
                "Description": "Email address for receiving failure and delay notifications",
                "Default": "admin@example.com",
            },
        )

    @mark.it("creates stack outputs for all key resources")
    def test_creates_stack_outputs(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - All required outputs exist
        template.has_output(
            "DynamoDBTableName",
            {"Description": "DynamoDB table name for shipment logs"},
        )

        template.has_output(
            "LambdaFunctionName",
            {"Description": "Lambda function name for event processing"},
        )

        template.has_output(
            "EventBusName", {"Description": "EventBridge event bus name"}
        )

        template.has_output("SNSTopicArn", {"Description": "SNS topic ARN for alerts"})

        template.has_output("DashboardURL", {"Description": "CloudWatch Dashboard URL"})

    @mark.it("validates TapStackProps configuration")
    def test_tap_stack_props_configuration(self):
        # ARRANGE & ACT
        env_suffix = "custom-env"
        notification_email = "alerts@company.com"
        props = TapStackProps(
            environment_suffix=env_suffix, notification_email=notification_email
        )

        # ASSERT
        self.assertEqual(props.environment_suffix, env_suffix)
        self.assertEqual(props.notification_email, notification_email)

    @mark.it("ensures removal policy is set for data protection")
    def test_dynamodb_removal_policy_retain(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - DynamoDB table has RETAIN deletion policy for data protection
        template.has_resource("AWS::DynamoDB::Table", {"DeletionPolicy": "Retain"})

    @mark.it("verifies all CloudWatch alarms have SNS actions configured")
    def test_cloudwatch_alarms_have_sns_actions(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Each alarm should have AlarmActions pointing to SNS topic
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        for alarm_id, alarm_config in alarms.items():
            self.assertIn("AlarmActions", alarm_config["Properties"])
            self.assertEqual(len(alarm_config["Properties"]["AlarmActions"]), 1)

    @mark.it("verifies Lambda environment variables are correctly set")
    def test_lambda_environment_variables(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Lambda should have TABLE_NAME, SNS_TOPIC_ARN, and ENVIRONMENT variables
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Environment": {
                    "Variables": {
                        "TABLE_NAME": Match.any_value(),
                        "SNS_TOPIC_ARN": Match.any_value(),
                        "ENVIRONMENT": env_suffix,
                    }
                }
            },
        )

    @mark.it("verifies EventBridge rule is associated with custom event bus")
    def test_eventbridge_rule_uses_custom_bus(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Rule should reference the custom event bus
        template.has_resource_properties(
            "AWS::Events::Rule", {"EventBusName": Match.any_value()}
        )

    @mark.it("verifies EventBridge rule has retry configuration")
    def test_eventbridge_rule_has_retry_config(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Rule target should have retry policy with 2 max attempts
        event_rules = template.find_resources("AWS::Events::Rule")
        for rule_id, rule_config in event_rules.items():
            targets = rule_config["Properties"]["Targets"]
            self.assertGreater(len(targets), 0)
            target = targets[0]
            self.assertIn("RetryPolicy", target)
            self.assertEqual(target["RetryPolicy"]["MaximumRetryAttempts"], 2)

    @mark.it("verifies DynamoDB table has global secondary index")
    def test_dynamodb_has_gsi(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Table should have StatusIndex GSI
        tables = template.find_resources("AWS::DynamoDB::Table")
        for table_id, table_config in tables.items():
            gsi_list = table_config["Properties"]["GlobalSecondaryIndexes"]
            self.assertEqual(len(gsi_list), 1)
            self.assertEqual(gsi_list[0]["IndexName"], "StatusIndex")

    @mark.it("verifies Lambda function has log retention configured")
    def test_lambda_has_log_retention(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Custom resource for log retention should exist
        template.has_resource_properties("Custom::LogRetention", {"RetentionInDays": 7})
