import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates DynamoDB table with environment suffix")
    def test_creates_dynamodb_table_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"PaymentWebhooks-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST"
        })

    @mark.it("creates DynamoDB table with streams enabled")
    def test_dynamodb_table_with_streams(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            }
        })

    @mark.it("creates DynamoDB table with correct keys")
    def test_dynamodb_table_keys(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "webhookId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ]
        })

    @mark.it("creates DynamoDB table with customer-managed encryption")
    def test_dynamodb_table_encryption(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True,
                "SSEType": "KMS"
            }
        })

    @mark.it("creates Lambda functions with ARM64 architecture")
    def test_creates_lambda_with_arm64(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Should have 3 Lambda functions
        template.resource_count_is("AWS::Lambda::Function", 3)
        # All should use ARM64
        functions = template.find_resources("AWS::Lambda::Function")
        for func in functions.values():
            assert func["Properties"]["Architectures"] == ["arm64"]

    @mark.it("creates Lambda functions with Python 3.11 runtime")
    def test_lambda_runtime(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        functions = template.find_resources("AWS::Lambda::Function")
        for func in functions.values():
            assert func["Properties"]["Runtime"] == "python3.11"

    @mark.it("creates Lambda functions with X-Ray tracing enabled")
    def test_lambda_xray_tracing(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        functions = template.find_resources("AWS::Lambda::Function")
        for func in functions.values():
            assert func["Properties"]["TracingConfig"]["Mode"] == "Active"

    @mark.it("creates Lambda layer with shared dependencies")
    def test_lambda_layer_creation(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::LayerVersion", 1)
        template.has_resource_properties("AWS::Lambda::LayerVersion", {
            "CompatibleRuntimes": ["python3.11"],
            "CompatibleArchitectures": ["arm64"]
        })

    @mark.it("creates KMS key with rotation enabled")
    def test_kms_key_rotation(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("creates SQS Dead Letter Queues with correct retention")
    def test_sqs_dlq_retention(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - 2 DLQs (webhook-dlq and processor-dlq)
        template.resource_count_is("AWS::SQS::Queue", 2)
        queues = template.find_resources("AWS::SQS::Queue")
        for queue in queues.values():
            # 14 days = 1209600 seconds
            assert queue["Properties"]["MessageRetentionPeriod"] == 1209600

    @mark.it("creates SQS queues with KMS encryption")
    def test_sqs_encryption(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        queues = template.find_resources("AWS::SQS::Queue")
        for queue in queues.values():
            assert "KmsMasterKeyId" in queue["Properties"]

    @mark.it("creates SNS topic for alerts")
    def test_sns_topic_creation(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates CloudWatch alarm for DLQ messages")
    def test_cloudwatch_alarm(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 1,
            "EvaluationPeriods": 1
        })

    @mark.it("creates API Gateway with WAF")
    def test_creates_api_gateway_with_waf(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::WAFv2::WebACL", 1)
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    @mark.it("creates API Gateway with correct throttling settings")
    def test_api_gateway_throttling(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Throttling is configured in MethodSettings
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                Match.object_like({
                    "ThrottlingRateLimit": 1000,
                    "ThrottlingBurstLimit": 2000
                })
            ]
        })

    @mark.it("creates API Gateway with X-Ray tracing enabled")
    def test_api_gateway_tracing(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "TracingEnabled": True
        })

    @mark.it("creates WAF with rate-based rule")
    def test_waf_rate_limit_rule(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Rules": [
                {
                    "Priority": 1,
                    "Statement": {
                        "RateBasedStatement": {
                            "Limit": 10,
                            "AggregateKeyType": "IP"
                        }
                    }
                }
            ]
        })

    @mark.it("creates DynamoDB event source for audit logger")
    def test_dynamodb_event_source(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)
        template.has_resource_properties("AWS::Lambda::EventSourceMapping", {
            "StartingPosition": "LATEST",
            "BatchSize": 100
        })

    @mark.it("creates IAM roles for Lambda functions")
    def test_lambda_iam_roles(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Should have IAM roles for each Lambda function
        roles = template.find_resources("AWS::IAM::Role")
        lambda_roles = [r for r in roles.values() if "lambda.amazonaws.com" in str(r.get("Properties", {}).get("AssumeRolePolicyDocument", {}))]
        assert len(lambda_roles) >= 3

    @mark.it("creates CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        assert "ApiEndpoint" in outputs
        assert "WebhooksTableName" in outputs
        assert "DLQUrl" in outputs

    @mark.it("applies removal policy DESTROY to resources")
    def test_removal_policy_destroy(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - DynamoDB table should have DeletionPolicy: Delete
        table = template.find_resources("AWS::DynamoDB::Table")
        for resource in table.values():
            assert resource.get("DeletionPolicy") == "Delete" or resource.get("UpdateReplacePolicy") == "Delete"
