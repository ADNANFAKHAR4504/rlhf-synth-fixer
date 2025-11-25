"""Unit tests for the TapStack CDK stack."""
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
        self.env_suffix = "testenv"

    @mark.it("creates SNS topic with correct naming")
    def test_creates_sns_topic(self):
        """Test that SNS topic is created with environment suffix"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"payment-alarms-{self.env_suffix}"
        })

    @mark.it("creates DynamoDB table with PITR enabled")
    def test_creates_dynamodb_table(self):
        """Test DynamoDB table with point-in-time recovery"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"transactions-{self.env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates SQS queues with DLQ configured")
    def test_creates_sqs_queues(self):
        """Test SQS queue and DLQ creation"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 2)
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"failed-transactions-{self.env_suffix}"
        })
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"failed-transactions-dlq-{self.env_suffix}"
        })

    @mark.it("creates three Lambda functions")
    def test_creates_lambda_functions(self):
        """Test all three Lambda functions are created"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 4)  # 3 + 1 log retention
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"payment-validation-{self.env_suffix}",
            "Runtime": "python3.11"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"payment-processing-{self.env_suffix}",
            "Runtime": "python3.11"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"health-monitor-{self.env_suffix}",
            "Runtime": "python3.11"
        })

    @mark.it("creates API Gateway with correct endpoints")
    def test_creates_api_gateway(self):
        """Test API Gateway REST API creation"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"payment-api-{self.env_suffix}"
        })
        # Check for API Gateway resources (validate, process, health)
        template.resource_count_is("AWS::ApiGateway::Resource", 3)

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        """Test CloudWatch alarms creation"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - 4 alarms total (API latency, DynamoDB throttle, 2 Lambda errors)
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"api-latency-{self.env_suffix}"
        })
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"dynamodb-throttle-{self.env_suffix}"
        })

    @mark.it("creates CloudWatch Dashboard")
    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch Dashboard creation"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"payment-dashboard-{self.env_suffix}"
        })

    @mark.it("sets up IAM roles with least privilege")
    def test_creates_iam_roles(self):
        """Test IAM roles for Lambda functions"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have roles for 3 Lambda functions + API Gateway + log retention
        template.resource_count_is("AWS::IAM::Role", 5)

    @mark.it("configures all resources with RemovalPolicy DESTROY")
    def test_removal_policies(self):
        """Test that resources are configured for destruction"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check DynamoDB has UpdateReplacePolicy and DeletionPolicy as Delete
        template.has_resource("AWS::DynamoDB::Table", {
            "UpdateReplacePolicy": "Delete",
            "DeletionPolicy": "Delete"
        })
        template.has_resource("AWS::SQS::Queue", {
            "UpdateReplacePolicy": "Delete",
            "DeletionPolicy": "Delete"
        })

    @mark.it("creates stack outputs for integration")
    def test_creates_stack_outputs(self):
        """Test CloudFormation outputs are created"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check outputs exist
        outputs = template.to_json()["Outputs"]
        assert "APIEndpoint" in outputs
        assert "TransactionsTableName" in outputs
        assert "AlarmTopicArn" in outputs
        assert "DashboardName" in outputs

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "payment-alarms-dev"
        })

    @mark.it("configures Lambda environment variables correctly")
    def test_lambda_environment_variables(self):
        """Test Lambda functions have correct environment variables"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Validation function has table and queue URL references
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"payment-validation-{self.env_suffix}",
            "Environment": {
                "Variables": {
                    "TRANSACTIONS_TABLE": Match.object_like({"Ref": Match.any_value()}),
                    "FAILED_QUEUE_URL": Match.object_like({"Ref": Match.any_value()})
                }
            }
        })

    @mark.it("configures API Gateway throttling")
    def test_api_gateway_throttling(self):
        """Test API Gateway has throttling configured"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check stage has throttling in method settings
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": Match.array_with([
                Match.object_like({
                    "ThrottlingRateLimit": 1000,
                    "ThrottlingBurstLimit": 2000
                })
            ])
        })

    @mark.it("tags all resources with Environment tag")
    def test_environment_tagging(self):
        """Test resources are tagged with Environment"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check SNS topic has environment tag
        template.has_resource_properties("AWS::SNS::Topic", {
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": self.env_suffix}
            ])
        })

    @mark.it("grants correct permissions to Lambda functions")
    def test_lambda_permissions(self):
        """Test Lambda IAM policies are configured"""
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check IAM policies exist for Lambda functions
        template.resource_count_is("AWS::IAM::Policy", 4)  # 3 Lambda + 1 log retention

    @mark.it("uses TapStackProps correctly")
    def test_tapstack_props_initialization(self):
        """Test TapStackProps class initialization"""
        # ARRANGE & ASSERT
        props = TapStackProps(environment_suffix="test123")
        assert props.environment_suffix == "test123"

        # Test default
        props_default = TapStackProps()
        assert props_default.environment_suffix is None
