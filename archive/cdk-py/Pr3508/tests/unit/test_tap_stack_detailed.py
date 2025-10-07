"""Detailed unit tests for TapStack to achieve higher coverage"""
import unittest
import os
from unittest.mock import patch, MagicMock

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match, Capture
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Detailed Tests")
class TestTapStackDetailed(unittest.TestCase):
    """Detailed test cases for TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("uses environment suffix from props")
    def test_environment_suffix_from_props(self):
        """Test that environment suffix is properly used from props"""
        env_suffix = "qa-test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # Check resources use the suffix
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"gift-cards-{env_suffix}"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"gift-card-redemption-{env_suffix}"
        })

    @mark.it("uses context environment suffix when props not provided")
    def test_environment_suffix_from_context(self):
        """Test environment suffix from context"""
        # Create app with context
        app_with_context = cdk.App(context={'environmentSuffix': 'context-env'})
        stack = TapStack(app_with_context, "TapStackTest")
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "gift-cards-context-env"
        })

    @mark.it("defaults to 'dev' when no environment suffix provided")
    def test_environment_suffix_default(self):
        """Test default environment suffix"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "gift-cards-dev"
        })

    @mark.it("creates Lambda with all required environment variables")
    def test_lambda_environment_variables(self):
        """Test Lambda has all required environment variables"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # Capture environment variables
        template.has_resource_properties("AWS::Lambda::Function",
            Match.object_like({
                "Environment": {
                    "Variables": Match.object_like({
                        "GIFT_CARD_TABLE": Match.any_value(),
                        "IDEMPOTENCY_TABLE": Match.any_value(),
                        "SNS_TOPIC_ARN": Match.any_value(),
                        "SECRET_ARN": Match.any_value(),
                        "FRAUD_DETECTOR_NAME": f"redemption_detector_{env_suffix}",
                        "APPCONFIG_APP_ID": Match.any_value(),
                        "APPCONFIG_ENV": env_suffix,
                        "APPCONFIG_PROFILE": "feature-flags",
                        "AWS_XRAY_TRACING_NAME": f"gift-card-{env_suffix}"
                    })
                }
            })
        )

    @mark.it("creates IAM role with correct permissions")
    def test_iam_role_permissions(self):
        """Test IAM role has correct permissions"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # Check IAM role exists with Lambda service principal
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            })
        })

        # Check for DynamoDB permissions
        template.has_resource_properties("AWS::IAM::Policy",
            Match.object_like({
                "PolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Action": Match.array_with([
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:Query",
                                "dynamodb:TransactWriteItems",
                                "dynamodb:TransactGetItems"
                            ])
                        })
                    ])
                })
            })
        )

    @mark.it("creates DynamoDB table with global secondary index")
    def test_dynamodb_global_secondary_index(self):
        """Test DynamoDB table has GSI configured"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table",
            Match.object_like({
                "GlobalSecondaryIndexes": Match.array_with([
                    Match.object_like({
                        "IndexName": "customer-index",
                        "KeySchema": Match.array_with([
                            Match.object_like({
                                "AttributeName": "customer_id",
                                "KeyType": "HASH"
                            }),
                            Match.object_like({
                                "AttributeName": "created_at",
                                "KeyType": "RANGE"
                            })
                        ])
                    })
                ])
            })
        )

    @mark.it("creates idempotency table with TTL")
    def test_idempotency_table_ttl(self):
        """Test idempotency table has TTL configured"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"redemption-idempotency-{env_suffix}",
            "TimeToLiveSpecification": {
                "AttributeName": "ttl",
                "Enabled": True
            }
        })

    @mark.it("creates API Gateway with throttling")
    def test_api_gateway_throttling(self):
        """Test API Gateway has throttling configured"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Stage",
            Match.object_like({
                "MethodSettings": Match.array_with([
                    Match.object_like({
                        "ThrottlingRateLimit": 1000,
                        "ThrottlingBurstLimit": 2000
                    })
                ])
            })
        )

    @mark.it("creates CloudWatch Dashboard with widgets")
    def test_cloudwatch_dashboard(self):
        """Test CloudWatch Dashboard is created"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"gift-card-metrics-{env_suffix}"
        })

    @mark.it("creates Lambda alias with auto-scaling")
    def test_lambda_alias_autoscaling(self):
        """Test Lambda alias with auto-scaling configuration"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # Check Lambda alias exists
        template.resource_count_is("AWS::Lambda::Alias", 1)
        template.has_resource_properties("AWS::Lambda::Alias", {
            "Name": "live"
        })

        # Check auto-scaling target
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 1)
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 1,
            "MaxCapacity": 100,
            "ServiceNamespace": "lambda"
        })

    @mark.it("creates X-Ray sampling rule")
    def test_xray_sampling_rule(self):
        """Test X-Ray sampling rule configuration"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::XRay::SamplingRule", 1)
        template.has_resource_properties("AWS::XRay::SamplingRule", {
            "RuleName": f"gift-card-sampling-{env_suffix}",
            "SamplingRule": Match.object_like({
                "Priority": 1000,
                "FixedRate": 0.1,
                "ReservoirSize": 1
            })
        })

    @mark.it("creates Fraud Detector resources correctly")
    def test_fraud_detector_resources(self):
        """Test all Fraud Detector resources are created"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # Check Variable
        template.has_resource_properties("AWS::FraudDetector::Variable", {
            "Name": f"transaction_amount_{env_suffix}",
            "DataType": "STRING",
            "DataSource": "EVENT"
        })

        # Check Label
        template.has_resource_properties("AWS::FraudDetector::Label", {
            "Name": f"fraud_label_{env_suffix}"
        })

        # Check EntityType
        template.has_resource_properties("AWS::FraudDetector::EntityType", {
            "Name": f"customer_{env_suffix}"
        })

        # Check EventType
        template.has_resource_properties("AWS::FraudDetector::EventType", {
            "Name": f"redemption_event_{env_suffix}"
        })

    @mark.it("creates outputs for API endpoint and table name")
    def test_stack_outputs(self):
        """Test stack outputs are created"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # Check outputs exist
        outputs = template.find_outputs("*")
        self.assertIn("APIEndpoint", outputs)
        self.assertIn("GiftCardTableName", outputs)

    @mark.it("sets removal policy to DESTROY for stateful resources")
    def test_removal_policies(self):
        """Test removal policies are set to DESTROY"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # Check DynamoDB tables have DESTROY policy
        template.has_resource("AWS::DynamoDB::Table",
            Match.object_like({
                "Properties": Match.object_like({
                    "TableName": Match.any_value()
                }),
                "UpdateReplacePolicy": "Delete",
                "DeletionPolicy": "Delete"
            })
        )

    @mark.it("configures Lambda with correct memory and timeout")
    def test_lambda_configuration(self):
        """Test Lambda configuration settings"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function",
            Match.object_like({
                "MemorySize": 512,
                "Timeout": 30,
                "ReservedConcurrentExecutions": 100
            })
        )

    @mark.it("creates API Gateway request model")
    def test_api_gateway_model(self):
        """Test API Gateway request model"""
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::Model", 1)
        template.has_resource_properties("AWS::ApiGateway::Model",
            Match.object_like({
                "ContentType": "application/json",
                "Schema": Match.object_like({
                    "required": ["card_id", "amount", "customer_id", "idempotency_key"]
                })
            })
        )


if __name__ == '__main__':
    unittest.main()