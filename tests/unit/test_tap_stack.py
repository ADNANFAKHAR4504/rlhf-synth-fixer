import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps, TrackingAsyncProcessingStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.props = TapStackProps(environment_suffix=self.env_suffix)
        self.stack = TapStack(self.app, f"TapStackTest{id(self)}", self.props)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates stack with correct environment suffix")
    def test_stack_creation_with_env_suffix(self):
        # Assert stack is created with correct environment suffix
        self.assertEqual(self.stack.environment_suffix, self.env_suffix)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        stack = TapStack(self.app, "TapStackTestDefault")
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("creates KMS keys for encryption")
    def test_creates_kms_keys(self):
        # Should create 2 KMS keys - one for SQS, one for DynamoDB
        self.template.resource_count_is("AWS::KMS::Key", 2)
        
        # Verify KMS key properties
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": "KMS Key for SQS Queue encryption"
        })
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": "KMS Key for DynamoDB encryption"
        })

    @mark.it("creates SQS queue with proper configuration")
    def test_creates_sqs_queue(self):
        # Main queue + DLQ = 2 SQS queues
        self.template.resource_count_is("AWS::SQS::Queue", 2)
        
        # Verify main queue properties (CDK uses VisibilityTimeout, not VisibilityTimeoutSeconds)
        self.template.has_resource_properties("AWS::SQS::Queue", {
            "VisibilityTimeout": 150,
            "MessageRetentionPeriod": 604800,  # 7 days
            "KmsMasterKeyId": Match.any_value(),
            "RedrivePolicy": {
                "deadLetterTargetArn": Match.any_value(),
                "maxReceiveCount": 3
            }
        })
        
        # Verify DLQ properties (DLQ doesn't have RedrivePolicy)
        self.template.has_resource_properties("AWS::SQS::Queue", {
            "VisibilityTimeout": 300,
            "MessageRetentionPeriod": 1209600,  # 14 days
            "KmsMasterKeyId": Match.any_value()
        })

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        
        # Verify table properties
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "AttributeDefinitions": [
                {"AttributeName": "tracking_id", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "S"},
                {"AttributeName": "status", "AttributeType": "S"}
            ],
            "KeySchema": [
                {"AttributeName": "tracking_id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            "SSESpecification": {"SSEEnabled": True}
        })
        
        # Verify GSI
        self.template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "StatusIndex",
                    "KeySchema": [
                        {"AttributeName": "status", "KeyType": "HASH"},
                        {"AttributeName": "timestamp", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                }
            ]
        })

    @mark.it("creates Lambda functions with correct configuration")
    def test_creates_lambda_functions(self):
        # Should create 2 Lambda functions - processor + cleanup
        self.template.resource_count_is("AWS::Lambda::Function", 2)
        
        # Verify processor Lambda
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "Timeout": 60,
            "MemorySize": 512,
            "ReservedConcurrencyLimit": Match.absent(),
            "Environment": {
                "Variables": {
                    "AUDIT_TABLE_NAME": Match.any_value()
                }
            }
        })
        
        # Verify cleanup Lambda
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "Timeout": 300,  # 5 minutes
            "MemorySize": 256
        })

    @mark.it("creates Lambda event source mapping")
    def test_creates_event_source_mapping(self):
        self.template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)
        
        self.template.has_resource_properties("AWS::Lambda::EventSourceMapping", {
            "BatchSize": 10,
            "MaximumBatchingWindowInSeconds": 30,
            "FunctionResponseTypes": ["ReportBatchItemFailures"]
        })

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        self.template.resource_count_is("AWS::SNS::Subscription", 1)
        
        # Verify email subscription
        self.template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "govardhan.y@turing.com"
        })

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        # Should create 5 alarms: queue depth, message age, lambda errors, lambda throttles, DLQ messages
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 5)
        
        # Queue depth alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "ApproximateNumberOfMessagesVisible",
            "Threshold": 1000,
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 3
        })
        
        # Message age alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "ApproximateAgeOfOldestMessage",
            "Threshold": 300,  # 5 minutes
            "ComparisonOperator": "GreaterThanThreshold"
        })
        
        # Lambda errors alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Errors",
            "Namespace": "AWS/Lambda",
            "Threshold": 5,
            "ComparisonOperator": "GreaterThanThreshold"
        })
        
        # Lambda throttles alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "Throttles",
            "Namespace": "AWS/Lambda",
            "Threshold": 5,
            "ComparisonOperator": "GreaterThanThreshold"
        })
        
        # DLQ messages alarm
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "ApproximateNumberOfMessagesVisible",
            "Threshold": 1,
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "EvaluationPeriods": 1
        })

    @mark.it("creates EventBridge scheduled rule")
    def test_creates_eventbridge_rule(self):
        self.template.resource_count_is("AWS::Events::Rule", 1)
        
        self.template.has_resource_properties("AWS::Events::Rule", {
            "ScheduleExpression": "cron(0 1 * * ? *)",  # 1 AM UTC daily
            "State": "ENABLED"
        })

    @mark.it("creates proper IAM permissions")
    def test_creates_iam_permissions(self):
        # Should create IAM roles for Lambda functions
        self.template.resource_count_is("AWS::IAM::Role", 2)
        
        # Lambda execution role should have basic execution permissions
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }
        })

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        # Verify all required outputs are present
        outputs = self.template.to_json().get("Outputs", {})
        
        expected_outputs = [
            "TrackingQueueURL",
            "DeadLetterQueueURL", 
            "ProcessorLambdaName",
            "AuditTableName",
            "AlertTopicARN"
        ]
        
        for output_name in expected_outputs:
            self.assertIn(output_name, outputs, f"Missing output: {output_name}")

    @mark.it("applies correct tags")
    def test_applies_correct_tags(self):
        # Verify resources have proper tags applied
        template_json = self.template.to_json()
        
        # Look for tags in resources
        resources = template_json.get("Resources", {})
        tagged_resources = 0
        for resource_name, resource_def in resources.items():
            if "Properties" in resource_def and "Tags" in resource_def["Properties"]:
                tags = resource_def["Properties"]["Tags"]
                # Check for environment and project tags
                tag_keys = [tag["Key"] for tag in tags]
                if "Environment" in tag_keys or "Project" in tag_keys:
                    tagged_resources += 1
        
        self.assertGreater(tagged_resources, 0, "Should have some resources with proper tags")

    @mark.it("TrackingAsyncProcessingStack can be instantiated directly")
    def test_tracking_async_processing_stack_direct(self):
        # Test the base class directly with unique app
        direct_app = cdk.App()
        stack = TrackingAsyncProcessingStack(direct_app, "DirectStack", environment_suffix="direct")
        template = Template.from_stack(stack)
        
        # Should have same components
        template.resource_count_is("AWS::SQS::Queue", 2)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.resource_count_is("AWS::Lambda::Function", 2)

    @mark.it("handles None props gracefully")
    def test_handles_none_props(self):
        # Test TapStack with None props using unique app
        none_app = cdk.App()
        stack = TapStack(none_app, "NonePropsTest", None)
        self.assertEqual(stack.environment_suffix, "dev")
        
        # Should still create resources
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::SQS::Queue", 2)

    @mark.it("handles props with env parameter")
    def test_handles_props_with_env(self):
        # Test with environment parameter using unique app
        env_app = cdk.App()
        env = cdk.Environment(account="123456789012", region="us-west-2")
        props = TapStackProps(environment_suffix="prod", env=env)
        
        stack = TapStack(env_app, "EnvTest", props, env=env)
        self.assertEqual(stack.environment_suffix, "prod")
        
        # Verify stack was created successfully
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::SQS::Queue", 2)
