import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"shipment-events-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [
                {"AttributeName": "shipment_id", "KeyType": "HASH"},
                {"AttributeName": "event_timestamp", "KeyType": "RANGE"}
            ],
            "AttributeDefinitions": [
                {"AttributeName": "shipment_id", "AttributeType": "S"},
                {"AttributeName": "event_timestamp", "AttributeType": "S"},
                {"AttributeName": "processing_status", "AttributeType": "S"}
            ],
            "TimeToLiveSpecification": {
                "AttributeName": "expires_at",
                "Enabled": True
            },
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}
        })

    @mark.it("creates SQS queues with proper configuration")
    def test_creates_sqs_queues(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 2)  # Main queue + DLQ
        
        # Check main queue
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"shipment-events-queue-{env_suffix}",
            "VisibilityTimeoutSeconds": 360,
            "MessageRetentionPeriod": 345600,  # 4 days
            "ReceiveMessageWaitTimeSeconds": 20
        })
        
        # Check DLQ
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"shipment-events-dlq-{env_suffix}",
            "MessageRetentionPeriod": 1209600,  # 14 days
            "VisibilityTimeoutSeconds": 300
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"shipment-event-processor-{env_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.lambda_handler",
            "Timeout": 60,
            "MemorySize": 512,
            "TracingConfig": {"Mode": "Active"},
            "Environment": {
                "Variables": {
                    "ENVIRONMENT": env_suffix
                }
            }
        })

    @mark.it("creates EventBridge resources")
    def test_creates_eventbridge_resources(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Events::EventBus", 1)
        template.resource_count_is("AWS::Events::Rule", 1)
        template.resource_count_is("AWS::Events::Archive", 1)
        
        template.has_resource_properties("AWS::Events::EventBus", {
            "Name": f"shipment-events-{env_suffix}"
        })
        
        template.has_resource_properties("AWS::Events::Rule", {
            "Name": f"shipment-event-rule-{env_suffix}",
            "EventPattern": {
                "source": ["shipment.service"],
                "detail-type": [{"prefix": "shipment."}]
            }
        })

    @mark.it("creates CloudWatch monitoring resources")
    def test_creates_cloudwatch_monitoring(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"shipment-processing-{env_suffix}"
        })

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 6)
        
        # Check high queue depth alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"shipment-high-queue-depth-{env_suffix}",
            "Threshold": 1000,
            "ComparisonOperator": "GreaterThanThreshold"
        })
        
        # Check DLQ alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"shipment-messages-in-dlq-{env_suffix}",
            "Threshold": 1,
            "ComparisonOperator": "GreaterThanOrEqualToThreshold"
        })

    @mark.it("creates IAM role with least privilege permissions")
    def test_creates_iam_role(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            },
            "ManagedPolicyArns": [
                Match.string_like_regexp(".*AWSLambdaBasicExecutionRole")
            ]
        })

    @mark.it("creates stack outputs for integration")
    def test_creates_stack_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("SQSQueueURL", outputs)
        self.assertIn("SQSQueueARN", outputs)
        self.assertIn("ProcessorLambdaARN", outputs)
        self.assertIn("EventsTableName", outputs)
        self.assertIn("EventBusName", outputs)
        self.assertIn("DashboardURL", outputs)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "shipment-events-dev"
        })

    @mark.it("configures SQS event source for Lambda")
    def test_configures_sqs_event_source(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)
        template.has_resource_properties("AWS::Lambda::EventSourceMapping", {
            "BatchSize": 10,
            "MaximumBatchingWindowInSeconds": 10,
            "FunctionResponseTypes": ["ReportBatchItemFailures"]
        })

    @mark.it("creates DynamoDB Global Secondary Index")
    def test_creates_gsi(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": [{
                "IndexName": "status-timestamp-index",
                "KeySchema": [
                    {"AttributeName": "processing_status", "KeyType": "HASH"},
                    {"AttributeName": "event_timestamp", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }]
        })

    @mark.it("validates resource naming with environment suffix")
    def test_resource_naming_with_env_suffix(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"shipment-events-{env_suffix}"
        })
        template.has_resource_properties("AWS::Events::EventBus", {
            "Name": f"shipment-events-{env_suffix}"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"shipment-event-processor-{env_suffix}"
        })
