"""Comprehensive unit tests for TapStack"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix),
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates KMS key with proper configuration")
    def test_creates_kms_key(self):
        """Test KMS key creation and configuration"""
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "Description": f"Encryption key for payment webhook system-{self.env_suffix}",
                "EnableKeyRotation": True,
            },
        )

    @mark.it("creates DynamoDB table with proper configuration")
    def test_creates_dynamodb_table(self):
        """Test DynamoDB table with stream and encryption"""
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": f"PaymentWebhooks-{self.env_suffix}",
                "BillingMode": "PAY_PER_REQUEST",
                "StreamSpecification": {
                    "StreamViewType": "NEW_AND_OLD_IMAGES",
                },
                "SSESpecification": {
                    "SSEEnabled": True,
                    "SSEType": "KMS",
                },
                "KeySchema": Match.array_with(
                    [
                        {"AttributeName": "webhookId", "KeyType": "HASH"},
                        {"AttributeName": "timestamp", "KeyType": "RANGE"},
                    ]
                ),
            },
        )

    @mark.it("creates SQS DLQ with encryption")
    def test_creates_sqs_dlq(self):
        """Test dead letter queue configuration"""
        self.template.resource_count_is("AWS::SQS::Queue", 2)
        self.template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": f"webhook-dlq-{self.env_suffix}",
                "MessageRetentionPeriod": 1209600,  # 14 days
                "KmsMasterKeyId": Match.any_value(),
            },
        )

    @mark.it("creates processing queue with DLQ association")
    def test_creates_processing_queue(self):
        """Test processing queue with DLQ configuration"""
        self.template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": f"webhook-processing-{self.env_suffix}",
                "VisibilityTimeout": 360,  # 6 minutes
                "RedrivePolicy": Match.object_like(
                    {
                        "maxReceiveCount": 3,
                    }
                ),
            },
        )

    @mark.it("creates SNS topic with KMS encryption")
    def test_creates_sns_topic(self):
        """Test SNS alert topic configuration"""
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        self.template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "TopicName": f"webhook-alerts-{self.env_suffix}",
                "DisplayName": "Payment Webhook Alerts",
                "KmsMasterKeyId": Match.any_value(),
            },
        )

    @mark.it("creates webhook receiver Lambda with proper config")
    def test_creates_webhook_receiver_lambda(self):
        """Test webhook receiver Lambda configuration"""
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": f"webhook-receiver-{self.env_suffix}-lo",
                "Runtime": "python3.11",
                "Handler": "receiver.handler",
                "Timeout": 30,
                "ReservedConcurrentExecutions": 10,
                "Architectures": ["arm64"],
                "TracingConfig": {"Mode": "Active"},
            },
        )

    @mark.it("creates payment processor Lambda with proper config")
    def test_creates_payment_processor_lambda(self):
        """Test payment processor Lambda configuration"""
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": f"payment-processor-{self.env_suffix}-lo",
                "Runtime": "python3.11",
                "Handler": "processor.handler",
                "Timeout": 300,  # 5 minutes
                "ReservedConcurrentExecutions": 5,
                "Architectures": ["arm64"],
                "TracingConfig": {"Mode": "Active"},
                "DeadLetterConfig": Match.object_like({"TargetArn": Match.any_value()}),
            },
        )

    @mark.it("creates audit logger Lambda with proper config")
    def test_creates_audit_logger_lambda(self):
        """Test audit logger Lambda configuration"""
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": f"audit-logger-{self.env_suffix}-lo",
                "Runtime": "python3.11",
                "Handler": "audit.handler",
                "Timeout": 60,
                "Architectures": ["arm64"],
                "TracingConfig": {"Mode": "Active"},
            },
        )

    @mark.it("creates all three Lambda functions")
    def test_creates_all_lambda_functions(self):
        """Test that all Lambda functions are created"""
        self.template.resource_count_is("AWS::Lambda::Function", 3)

    @mark.it("verifies Lambda functions configuration")
    def test_lambda_configuration(self):
        """Test that Lambda functions are properly configured"""
        # Lambda functions will automatically create log groups on first invocation
        # This avoids conflicts with existing log groups from failed deployments
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": f"webhook-receiver-{self.env_suffix}-lo",
                "Runtime": "python3.11",
            },
        )

    @mark.it("creates Lambda event source for SQS")
    def test_creates_sqs_event_source(self):
        """Test SQS event source mapping for processor"""
        self.template.has_resource_properties(
            "AWS::Lambda::EventSourceMapping",
            {
                "BatchSize": 10,
                "MaximumBatchingWindowInSeconds": 5,
            },
        )

    @mark.it("creates Lambda event source for DynamoDB stream")
    def test_creates_dynamodb_event_source(self):
        """Test DynamoDB stream event source for audit logger"""
        self.template.has_resource_properties(
            "AWS::Lambda::EventSourceMapping",
            {
                "BatchSize": 10,
                "StartingPosition": "LATEST",
                "MaximumRetryAttempts": 2,
            },
        )

    @mark.it("creates API Gateway with proper configuration")
    def test_creates_api_gateway(self):
        """Test API Gateway REST API configuration"""
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        self.template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {
                "Name": f"webhook-api-{self.env_suffix}",
                "Description": "Payment Webhook Processing API",
            },
        )

    @mark.it("creates API Gateway deployment with tracing and throttling")
    def test_creates_api_gateway_deployment(self):
        """Test API Gateway stage configuration"""
        self.template.has_resource_properties(
            "AWS::ApiGateway::Stage",
            {
                "StageName": "prod",
                "TracingEnabled": True,
                "MethodSettings": Match.array_with(
                    [
                        Match.object_like({
                            "DataTraceEnabled": False,
                            "HttpMethod": "*",
                            "ResourcePath": "/*",
                            "ThrottlingBurstLimit": 2000,
                            "ThrottlingRateLimit": 1000,
                        })
                    ]
                ),
            },
        )

    @mark.it("creates API Gateway POST method for webhook")
    def test_creates_api_gateway_post_method(self):
        """Test POST method creation"""
        self.template.has_resource_properties(
            "AWS::ApiGateway::Method",
            {
                "HttpMethod": "POST",
                "Integration": Match.object_like({"Type": "AWS_PROXY"}),
            },
        )

    @mark.it("creates WAF Web ACL with rate limiting")
    def test_creates_waf_web_acl(self):
        """Test WAF configuration with rate limiting rule"""
        self.template.resource_count_is("AWS::WAFv2::WebACL", 1)
        self.template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Scope": "REGIONAL",
                "DefaultAction": {"Allow": {}},
                "Rules": Match.array_with(
                    [
                        Match.object_like({
                            "Name": "RateLimitRule",
                            "Priority": 1,
                            "Statement": {
                                "RateBasedStatement": {
                                    "Limit": 600,
                                    "AggregateKeyType": "IP",
                                }
                            },
                            "Action": {"Block": {}},
                        })
                    ]
                ),
            },
        )

    @mark.it("creates WAF association with API Gateway")
    def test_creates_waf_association(self):
        """Test WAF association with API Gateway stage"""
        self.template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    @mark.it("creates CloudWatch alarm for DLQ")
    def test_creates_cloudwatch_alarm(self):
        """Test CloudWatch alarm configuration"""
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": f"webhook-dlq-alarm-{self.env_suffix}",
                "AlarmDescription": "Triggers when messages appear in DLQ",
                "Threshold": 1,
                "EvaluationPeriods": 1,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            },
        )

    @mark.it("creates IAM roles for Lambda functions")
    def test_creates_iam_roles(self):
        """Test IAM role creation for Lambda functions"""
        # Should have roles for 3 Lambda functions + 1 for API Gateway CloudWatch role
        self.template.resource_count_is("AWS::IAM::Role", 4)

    @mark.it("creates IAM policies for Lambda permissions")
    def test_creates_iam_policies(self):
        """Test IAM policy creation"""
        # Verify IAM policies exist (at least 1 for each Lambda)
        resources = self.template.to_json()["Resources"]
        policy_count = sum(
            1 for r in resources.values() if r["Type"] == "AWS::IAM::Policy"
        )
        self.assertGreaterEqual(policy_count, 3)

    @mark.it("creates stack outputs for API endpoint")
    def test_creates_api_output(self):
        """Test API endpoint output"""
        outputs = self.template.to_json()["Outputs"]
        self.assertIn("APIEndpoint", outputs)
        self.assertEqual(
            outputs["APIEndpoint"]["Description"], "API Gateway endpoint URL"
        )

    @mark.it("creates stack outputs for table name")
    def test_creates_table_name_output(self):
        """Test DynamoDB table name output"""
        outputs = self.template.to_json()["Outputs"]
        self.assertIn("TableName", outputs)
        self.assertEqual(outputs["TableName"]["Description"], "DynamoDB table name")

    @mark.it("creates stack outputs for DLQ URL")
    def test_creates_dlq_output(self):
        """Test DLQ URL output"""
        outputs = self.template.to_json()["Outputs"]
        self.assertIn("DLQUrl", outputs)
        self.assertEqual(outputs["DLQUrl"]["Description"], "Dead letter queue URL")

    @mark.it("creates stack outputs for processing queue URL")
    def test_creates_processing_queue_output(self):
        """Test processing queue URL output"""
        outputs = self.template.to_json()["Outputs"]
        self.assertIn("ProcessingQueueUrl", outputs)
        self.assertEqual(
            outputs["ProcessingQueueUrl"]["Description"], "Processing queue URL"
        )

    @mark.it("creates stack outputs for alert topic ARN")
    def test_creates_alert_topic_output(self):
        """Test SNS alert topic ARN output"""
        outputs = self.template.to_json()["Outputs"]
        self.assertIn("AlertTopicArn", outputs)
        self.assertEqual(
            outputs["AlertTopicArn"]["Description"], "SNS alert topic ARN"
        )

    @mark.it("defaults environment suffix to dev when not provided")
    def test_defaults_environment_suffix_to_dev(self):
        """Test default environment suffix"""
        app = cdk.App()
        stack = TapStack(app, "TapStackDefault", TapStackProps())
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": "PaymentWebhooks-dev",
            },
        )

    @mark.it("uses environment suffix from props when provided")
    def test_uses_environment_suffix_from_props(self):
        """Test environment suffix from props"""
        app = cdk.App()
        custom_suffix = "custom123"
        stack = TapStack(
            app,
            "TapStackCustom",
            TapStackProps(environment_suffix=custom_suffix),
        )
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": f"PaymentWebhooks-{custom_suffix}",
            },
        )

    @mark.it("grants KMS permissions to required services")
    def test_grants_kms_permissions(self):
        """Test KMS key permissions for services"""
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "KeyPolicy": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Effect": "Allow",
                                        "Principal": Match.object_like(
                                            {"Service": Match.any_value()}
                                        ),
                                    }
                                )
                            ]
                        )
                    }
                )
            },
        )

    @mark.it("configures Lambda environment variables correctly")
    def test_lambda_environment_variables(self):
        """Test Lambda environment variables"""
        # Test receiver Lambda has TABLE_NAME and QUEUE_URL
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": f"webhook-receiver-{self.env_suffix}-lo",
                "Environment": {
                    "Variables": {
                        "TABLE_NAME": Match.any_value(),
                        "QUEUE_URL": Match.any_value(),
                    }
                },
            },
        )

        # Test processor and audit logger have TABLE_NAME
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": f"payment-processor-{self.env_suffix}-lo",
                "Environment": {
                    "Variables": {
                        "TABLE_NAME": Match.any_value(),
                    }
                },
            },
        )

