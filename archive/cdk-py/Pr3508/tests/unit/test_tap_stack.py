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

    @mark.it("creates DynamoDB tables with correct configuration")
    def test_creates_dynamodb_tables(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Gift Card Table
        template.resource_count_is("AWS::DynamoDB::Table", 2)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"gift-cards-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates Lambda function with correct runtime")
    def test_creates_lambda_function(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # There are 2 Lambda functions (main + version for alias)
        template.resource_count_is("AWS::Lambda::Function", 2)
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "redemption_handler.lambda_handler",
            "FunctionName": f"gift-card-redemption-{env_suffix}"
        })

    @mark.it("creates API Gateway with request validation")
    def test_creates_api_gateway(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"gift-card-api-{env_suffix}"
        })
        template.resource_count_is("AWS::ApiGateway::RequestValidator", 1)

    @mark.it("creates SNS topic for notifications")
    def test_creates_sns_topic(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"gift-card-redemptions-{env_suffix}"
        })

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)

    @mark.it("creates Secrets Manager secret")
    def test_creates_secrets_manager(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"gift-card-encryption-{env_suffix}"
        })

    @mark.it("creates AppConfig resources")
    def test_creates_appconfig(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AppConfig::Application", 1)
        template.resource_count_is("AWS::AppConfig::Environment", 1)
        template.resource_count_is("AWS::AppConfig::ConfigurationProfile", 1)

    @mark.it("enables X-Ray tracing")
    def test_enables_xray_tracing(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    @mark.it("creates Fraud Detector resources")
    def test_creates_fraud_detector(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::FraudDetector::Variable", 1)
        template.resource_count_is("AWS::FraudDetector::Label", 2)  # Two labels: fraud and legit
        template.resource_count_is("AWS::FraudDetector::EntityType", 1)
        template.resource_count_is("AWS::FraudDetector::EventType", 1)
