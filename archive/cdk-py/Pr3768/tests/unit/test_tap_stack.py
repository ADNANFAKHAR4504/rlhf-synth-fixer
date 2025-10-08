import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from lib.tap_stack import TapStack, TapStackProps, LogisticsEventProcessingStack


@mark.describe("LogisticsEventProcessingStack")
class TestLogisticsEventProcessingStack(unittest.TestCase):
    """Test cases for the LogisticsEventProcessingStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = LogisticsEventProcessingStack(self.app, "TestStack")
        self.template = Template.from_stack(self.stack)

    @mark.it("creates SNS topic for delivery events")
    def test_creates_sns_topic(self):
        self.template.resource_count_is("AWS::SNS::Topic", 2)  # Main topic + alerts topic
        self.template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "DisplayName": "Logistics Delivery Events Topic ",
                "TopicName": "logistics-delivery-events"
            }
        )

    @mark.it("creates SQS queues with DLQ configuration")
    def test_creates_sqs_queues(self):
        # Should have main queue and DLQ
        self.template.resource_count_is("AWS::SQS::Queue", 2)
        
        # Check main queue properties
        self.template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": "logistics-delivery-events-queue",
                "VisibilityTimeout": 300,  # CDK uses VisibilityTimeout, not VisibilityTimeoutSeconds
                "MessageRetentionPeriod": 604800  # 7 days
            }
        )
        
        # Check DLQ properties
        self.template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": "logistics-delivery-events-dlq",
                "MessageRetentionPeriod": 1209600  # 14 days
            }
        )

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": "logistics-processed-events",
                "BillingMode": "PAY_PER_REQUEST",
                "AttributeDefinitions": [
                    {"AttributeName": "event_id", "AttributeType": "S"},
                    {"AttributeName": "timestamp", "AttributeType": "S"}
                ],
                "KeySchema": [
                    {"AttributeName": "event_id", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"}
                ],
                "TimeToLiveSpecification": {
                    "AttributeName": "ttl",
                    "Enabled": True
                }
            }
        )

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        self.template.resource_count_is("AWS::Lambda::Function", 1)
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": "logistics-event-processor",
                "Runtime": "python3.9",
                "Handler": "index.handler",
                "Timeout": 300,
                "MemorySize": 512
            }
        )

    @mark.it("creates SQS event source mapping for Lambda")
    def test_creates_lambda_event_source(self):
        self.template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)
        self.template.has_resource_properties(
            "AWS::Lambda::EventSourceMapping",
            {
                "BatchSize": 10
            }
        )

    @mark.it("creates SNS subscription for SQS queue")
    def test_creates_sns_subscription(self):
        self.template.resource_count_is("AWS::SNS::Subscription", 1)
        self.template.has_resource_properties(
            "AWS::SNS::Subscription",
            {
                "Protocol": "sqs"
            }
        )

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        
        # DLQ alarm
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "LogisticsDLQMessagesAlarm",
                "Threshold": 10,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold"
            }
        )
        
        # Lambda errors alarm
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "LogisticsLambdaErrorsAlarm",
                "Threshold": 5,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold"
            }
        )
        
        # Queue delay alarm
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "LogisticsQueueDelayAlarm",
                "Threshold": 300,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold"
            }
        )

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        self.template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": "LogisticsEventsProcessing"
            }
        )

    @mark.it("creates IAM roles with correct permissions")
    def test_creates_iam_roles(self):
        # Lambda execution role
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
            }
        )

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        self.template.has_output("EventTopicArn", {})
        self.template.has_output("ProcessingQueueUrl", {})
        self.template.has_output("ProcessingQueueArn", {})
        self.template.has_output("DlqQueueUrl", {})
        self.template.has_output("HandlerLambdaName", {})
        self.template.has_output("DeliveryTableName", {})
        self.template.has_output("Region", {})
        self.template.has_output("MonitoringAlarmName", {})


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates TapStack with environment suffix")
    def test_creates_stack_with_env_suffix(self):
        env_suffix = "test123"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props)
        
        # Verify the stack is created and has the environment suffix
        self.assertEqual(stack.environment_suffix, env_suffix)
        
        # Verify it inherits from LogisticsEventProcessingStack
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::SNS::Topic", 2)
        template.resource_count_is("AWS::SQS::Queue", 2)
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.resource_count_is("AWS::DynamoDB::Table", 1)

    @mark.it("creates TapStack with environment configuration")
    def test_creates_stack_with_env_config(self):
        env_suffix = "prod"
        env = cdk.Environment(account="123456789012", region="us-west-2")
        props = TapStackProps(environment_suffix=env_suffix, env=env)
        stack = TapStack(self.app, "TapStackEnvTest", props)
        
        self.assertEqual(stack.environment_suffix, env_suffix)
        
    @mark.it("TapStackProps dataclass works correctly")
    def test_tap_stack_props_dataclass(self):
        # Test required field
        props = TapStackProps(environment_suffix="test")
        self.assertEqual(props.environment_suffix, "test")
        self.assertIsNone(props.env)
        
        # Test with optional field
        env = cdk.Environment(account="123456789012", region="us-east-1")
        props_with_env = TapStackProps(environment_suffix="test", env=env)
        self.assertEqual(props_with_env.environment_suffix, "test")
        self.assertEqual(props_with_env.env, env)
