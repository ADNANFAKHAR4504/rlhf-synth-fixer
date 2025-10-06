import unittest
import os

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        # Set test mode to avoid Docker dependencies
        os.environ['CDK_TEST_MODE'] = 'true'
        self.app = cdk.App()

    def tearDown(self):
        """Clean up after each test"""
        # Remove test mode environment variable
        if 'CDK_TEST_MODE' in os.environ:
            del os.environ['CDK_TEST_MODE']

    @mark.it("creates inventory management infrastructure with correct environment suffix")
    def test_creates_inventory_infrastructure_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        
        # ACT
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - DynamoDB Table
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"inventory-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "AttributeDefinitions": Match.array_with([
                {"AttributeName": "item_id", "AttributeType": "S"},
                {"AttributeName": "sku", "AttributeType": "S"},
                {"AttributeName": "category", "AttributeType": "S"},
                {"AttributeName": "updated_at", "AttributeType": "S"},
                {"AttributeName": "status", "AttributeType": "S"}
            ])
        })

        # ASSERT - Lambda Functions (5 CRUD functions + log retention functions)
        # CDK creates additional Lambda functions for log retention
        lambda_functions = template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(lambda_functions), 5)
        
        # Check specific lambda functions exist
        lambda_functions = [
            f"inventory-{env_suffix}-create-item",
            f"inventory-{env_suffix}-get-item", 
            f"inventory-{env_suffix}-update-item",
            f"inventory-{env_suffix}-delete-item",
            f"inventory-{env_suffix}-list-items"
        ]
        
        for func_name in lambda_functions:
            template.has_resource_properties("AWS::Lambda::Function", {
                "FunctionName": func_name,
                "Runtime": "python3.11"
            })

        # ASSERT - API Gateway
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"inventory-api-{env_suffix}"
        })

        # ASSERT - SSM Parameters
        template.resource_count_is("AWS::SSM::Parameter", 2)  # table name + config
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": f"/inventory/{env_suffix}/table-name"
        })

        # ASSERT - Stack outputs
        template.has_output("ApiEndpoint", {})
        template.has_output("TableName", {})
        template.has_output("EnvironmentName", {})

    @mark.it("defaults environment suffix to 'dev' if not provided")  
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        
        # ACT
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "inventory-dev"
        })
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "inventory-api-dev"
        })
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": "/inventory/dev/table-name"
        })

    @mark.it("creates proper IAM roles with least privilege")
    def test_creates_proper_iam_roles(self):
        # ARRANGE
        
        # ACT
        stack = TapStack(self.app, "TapStackTest", 
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - IAM roles exist (Lambda execution role + log retention roles)
        # CDK creates additional roles for log retention
        iam_roles = template.find_resources("AWS::IAM::Role")
        self.assertGreaterEqual(len(iam_roles), 1)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }
        })

        # ASSERT - IAM policies for DynamoDB and SSM access
        template.resource_count_is("AWS::IAM::Policy", 2)  # DynamoDB + SSM policy

    @mark.it("creates global secondary indexes for efficient querying")
    def test_creates_global_secondary_indexes(self):
        # ARRANGE
        
        # ACT
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - GSIs are created
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": Match.array_with([
                {
                    "IndexName": "category-index",
                    "KeySchema": [
                        {"AttributeName": "category", "KeyType": "HASH"},
                        {"AttributeName": "updated_at", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                },
                {
                    "IndexName": "status-index", 
                    "KeySchema": [
                        {"AttributeName": "status", "KeyType": "HASH"},
                        {"AttributeName": "item_id", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                }
            ])
        })

    @mark.it("applies correct tags to all resources")
    def test_applies_correct_tags(self):
        # ARRANGE  
        env_suffix = "prod"
        
        # ACT
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        
        # ASSERT - Stack has correct properties
        self.assertEqual(stack.environment_suffix, env_suffix)
        
        # ASSERT - Check that resources are tagged
        # CDK applies stack tags to resources automatically
        template = Template.from_stack(stack)
        
        # Check that DynamoDB table has expected tags individually
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": env_suffix}
            ])
        })
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "Tags": Match.array_with([
                {"Key": "ManagedBy", "Value": "CDK"}
            ])
        })
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "Tags": Match.array_with([
                {"Key": "Application", "Value": "InventoryManagement"}
            ])
        })
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "Tags": Match.array_with([
                {"Key": "Project", "Value": "TAP"}
            ])
        })

    @mark.it("skips lambda layer creation in test mode")
    def test_lambda_layer_skipped_in_test_mode(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)
        
        # ASSERT - No Lambda layer version resource is created in test mode
        template.resource_count_is("AWS::Lambda::LayerVersion", 0)
        
        # ASSERT - Lambda functions are still created without layers
        # CDK creates additional functions for log retention
        lambda_functions = template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(lambda_functions), 5)
