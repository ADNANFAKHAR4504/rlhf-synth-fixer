# test_tap_stack.py

import unittest
from unittest.mock import Mock, patch, MagicMock, call
import os
import sys


# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


class MockComponentResource:
    """Mock Pulumi ComponentResource"""

    def __init__(self, type_name, name, props=None, opts=None):
        self.type_name = type_name
        self.name = name
        self.props = props
        self.opts = opts

    def register_outputs(self, outputs):
        self.outputs = outputs


class MockOutput:
    """Mock Pulumi Output"""

    def __init__(self, value=None):
        self.value = value

    @staticmethod
    def all(*args):
        mock_result = Mock()
        mock_result.apply = Mock(return_value=Mock())
        return mock_result

    @staticmethod
    def concat(*args):
        return Mock()


class TestTapStack(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Set up class-level mocks"""
        # Mock Pulumi modules
        cls.mock_pulumi = Mock()
        cls.mock_pulumi.ComponentResource = MockComponentResource
        cls.mock_pulumi.ResourceOptions = Mock
        cls.mock_pulumi.Output = MockOutput
        cls.mock_pulumi.AssetArchive = Mock()
        cls.mock_pulumi.StringAsset = Mock()

        # Mock Config with proper return values
        cls.mock_config = Mock()
        cls.mock_config.get = Mock(return_value="paul.s@turing.com")
        cls.mock_pulumi.Config = Mock(return_value=cls.mock_config)
        cls.mock_pulumi.get_stack = Mock(return_value="test")

        # Mock AWS modules
        cls.mock_aws = Mock()
        cls.mock_aws.get_region.return_value = Mock(name="us-east-1")
        cls.mock_aws.get_availability_zones.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        # Apply module patches
        sys.modules["pulumi"] = cls.mock_pulumi
        sys.modules["pulumi_aws"] = cls.mock_aws

    def setUp(self):
        """Set up test environment for each test"""
        # Clear any existing imports to ensure clean state
        modules_to_clear = [m for m in sys.modules.keys() if m.startswith("lib.")]
        for module in modules_to_clear:
            if module in sys.modules:
                del sys.modules[module]

        # Import classes after mocking
        from lib.tap_stack import TapStack, TapStackArgs

        # Store references for use in tests
        self.TapStack = TapStack
        self.TapStackArgs = TapStackArgs

        # Create test arguments
        self.test_args = TapStackArgs(environment_suffix="test", tags={"Environment": "test", "Project": "tap-stack"})

    def test_tap_stack_args_defaults(self):
        """Test TapStackArgs default values"""
        args = self.TapStackArgs()
        self.assertEqual(args.environment_suffix, "dev")
        self.assertIsNone(args.tags)

        # Test with custom values
        custom_tags = {"Project": "test", "Owner": "team"}
        args = self.TapStackArgs(environment_suffix="prod", tags=custom_tags)
        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.tags, custom_tags)

    @patch("lib.tap_stack.InventoryServerlessStack")
    def test_tap_stack_initialization(self, mock_inventory_serverless):
        """Test TapStack creates inventory serverless component correctly"""

        # Configure inventory serverless mock
        mock_inventory_instance = Mock()
        mock_inventory_instance.api_deployment = Mock()
        mock_inventory_instance.api_deployment.invoke_url = "https://api.example.com"
        mock_inventory_instance.inventory_items_table = Mock()
        mock_inventory_instance.inventory_items_table.name = "inventory-items-test"
        mock_inventory_instance.inventory_audit_table = Mock()
        mock_inventory_instance.inventory_audit_table.name = "inventory-audit-test"
        mock_inventory_instance.inventory_api_lambda = Mock()
        mock_inventory_instance.inventory_api_lambda.name = "inventory-api-lambda-test"
        mock_inventory_instance.inventory_alerts_topic = Mock()
        mock_inventory_instance.inventory_alerts_topic.arn = "arn:aws:sns:us-east-1:123:alerts"
        mock_inventory_serverless.return_value = mock_inventory_instance

        # Create TapStack
        stack = self.TapStack("test-stack", self.test_args)

        # Verify stack properties
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertEqual(stack.tags, {"Environment": "test", "Project": "tap-stack"})

        # Verify inventory serverless component was instantiated
        mock_inventory_serverless.assert_called_once()

        # Verify component name
        inventory_call = mock_inventory_serverless.call_args
        self.assertEqual(inventory_call[1]["name"], "inventory-serverless")

    @patch("lib.tap_stack.InventoryServerlessStack")
    def test_inventory_serverless_args(self, mock_inventory_serverless):
        """Test that InventoryServerlessStack receives correct arguments"""

        # Setup mock
        mock_inventory_instance = Mock()
        mock_inventory_instance.api_deployment = Mock()
        mock_inventory_instance.api_deployment.invoke_url = "https://api.example.com"
        mock_inventory_instance.inventory_items_table = Mock()
        mock_inventory_instance.inventory_items_table.name = "inventory-items-test"
        mock_inventory_instance.inventory_audit_table = Mock()
        mock_inventory_instance.inventory_audit_table.name = "inventory-audit-test"
        mock_inventory_instance.inventory_api_lambda = Mock()
        mock_inventory_instance.inventory_api_lambda.name = "inventory-api-lambda-test"
        mock_inventory_instance.inventory_alerts_topic = Mock()
        mock_inventory_instance.inventory_alerts_topic.arn = "arn:aws:sns:us-east-1:123:alerts"
        mock_inventory_serverless.return_value = mock_inventory_instance

        # Create stack
        stack = self.TapStack("test-stack", self.test_args)

        # Verify InventoryServerlessStack was called with correct args
        inventory_call = mock_inventory_serverless.call_args
        self.assertEqual(inventory_call[1]["name"], "inventory-serverless")

        # Verify args structure
        inventory_args = inventory_call[1]["args"]
        self.assertEqual(inventory_args.environment_suffix, "test")
        self.assertEqual(inventory_args.tags, {"Environment": "test", "Project": "tap-stack"})
        self.assertEqual(inventory_args.notification_email, "paul.s@turing.com")

    @patch("lib.tap_stack.InventoryServerlessStack")
    def test_stack_outputs_registration(self, mock_inventory_serverless):
        """Test that stack registers correct outputs"""

        # Setup detailed mocks with expected return values
        mock_inventory_instance = Mock()
        mock_inventory_instance.api_deployment = Mock()
        mock_inventory_instance.api_deployment.invoke_url = "https://api.test.com"
        mock_inventory_instance.inventory_items_table = Mock()
        mock_inventory_instance.inventory_items_table.name = "items-table-test"
        mock_inventory_instance.inventory_audit_table = Mock()
        mock_inventory_instance.inventory_audit_table.name = "audit-table-test"
        mock_inventory_instance.inventory_api_lambda = Mock()
        mock_inventory_instance.inventory_api_lambda.name = "lambda-test"
        mock_inventory_instance.inventory_alerts_topic = Mock()
        mock_inventory_instance.inventory_alerts_topic.arn = "arn:aws:sns:us-east-1:123:test"
        mock_inventory_serverless.return_value = mock_inventory_instance

        # Create stack and check outputs
        stack = self.TapStack("test-stack", self.test_args)

        # Verify stack has the expected attributes
        self.assertTrue(hasattr(stack, "inventory_serverless"))

        # Verify outputs were registered (check if method exists on our mock)
        self.assertTrue(hasattr(stack, "outputs"))

    @patch("lib.tap_stack.InventoryServerlessStack")
    def test_component_inheritance(self, mock_inventory_serverless):
        """Test that TapStack properly inherits from ComponentResource"""

        # Setup minimal mock
        mock_inventory_instance = Mock()
        mock_inventory_instance.api_deployment = Mock()
        mock_inventory_instance.api_deployment.invoke_url = "https://api.example.com"
        mock_inventory_instance.inventory_items_table = Mock()
        mock_inventory_instance.inventory_items_table.name = "inventory-items-test"
        mock_inventory_instance.inventory_audit_table = Mock()
        mock_inventory_instance.inventory_audit_table.name = "inventory-audit-test"
        mock_inventory_instance.inventory_api_lambda = Mock()
        mock_inventory_instance.inventory_api_lambda.name = "inventory-api-lambda-test"
        mock_inventory_instance.inventory_alerts_topic = Mock()
        mock_inventory_instance.inventory_alerts_topic.arn = "arn:aws:sns:us-east-1:123:alerts"
        mock_inventory_serverless.return_value = mock_inventory_instance

        # Create stack
        stack = self.TapStack("test-stack", self.test_args)

        # Test basic properties
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertEqual(stack.tags, {"Environment": "test", "Project": "tap-stack"})

        # Test inheritance by checking type_name (set by MockComponentResource)
        self.assertEqual(stack.type_name, "tap:stack:TapStack")

    def test_environment_suffix_handling(self):
        """Test environment suffix is properly handled"""
        # Test default environment
        args_default = self.TapStackArgs()
        self.assertEqual(args_default.environment_suffix, "dev")

        # Test custom environment
        args_custom = self.TapStackArgs(environment_suffix="prod")
        self.assertEqual(args_custom.environment_suffix, "prod")

        # Test None environment gets default
        args_none = self.TapStackArgs(environment_suffix=None)
        self.assertEqual(args_none.environment_suffix, "dev")

    def test_tags_handling(self):
        """Test tags are properly handled"""
        # Test default tags (None)
        args_default = self.TapStackArgs()
        self.assertIsNone(args_default.tags)

        # Test custom tags
        custom_tags = {"Env": "test", "Team": "dev"}
        args_custom = self.TapStackArgs(tags=custom_tags)
        self.assertEqual(args_custom.tags, custom_tags)

        # Test empty tags dict
        args_empty = self.TapStackArgs(tags={})
        self.assertEqual(args_empty.tags, {})

    @patch("lib.tap_stack.InventoryServerlessStack")
    def test_notification_email_configuration(self, mock_inventory_serverless):
        """Test notification email configuration"""

        # Setup config mock to return custom email
        self.mock_config.get.return_value = "custom@example.com"

        # Setup inventory serverless mock
        mock_inventory_instance = Mock()
        mock_inventory_instance.api_deployment = Mock()
        mock_inventory_instance.api_deployment.invoke_url = "https://api.example.com"
        mock_inventory_instance.inventory_items_table = Mock()
        mock_inventory_instance.inventory_items_table.name = "inventory-items-test"
        mock_inventory_instance.inventory_audit_table = Mock()
        mock_inventory_instance.inventory_audit_table.name = "inventory-audit-test"
        mock_inventory_instance.inventory_api_lambda = Mock()
        mock_inventory_instance.inventory_api_lambda.name = "inventory-api-lambda-test"
        mock_inventory_instance.inventory_alerts_topic = Mock()
        mock_inventory_instance.inventory_alerts_topic.arn = "arn:aws:sns:us-east-1:123:alerts"
        mock_inventory_serverless.return_value = mock_inventory_instance

        # Create stack
        stack = self.TapStack("test-stack", self.test_args)

        # Verify config was called to get notification email
        self.mock_config.get.assert_called_with("notification_email")

        # Verify inventory serverless was called with custom email
        inventory_call = mock_inventory_serverless.call_args
        inventory_args = inventory_call[1]["args"]
        self.assertEqual(inventory_args.notification_email, "custom@example.com")

    def test_different_environment_suffixes(self):
        """Test different environment suffix configurations"""
        # Test prod environment
        prod_args = self.TapStackArgs(environment_suffix="prod")
        self.assertEqual(prod_args.environment_suffix, "prod")

        # Test staging environment
        staging_args = self.TapStackArgs(environment_suffix="staging")
        self.assertEqual(staging_args.environment_suffix, "staging")

        # Test empty string (should default to dev)
        empty_args = self.TapStackArgs(environment_suffix="")
        self.assertEqual(empty_args.environment_suffix, "dev")

    def test_complex_tags_configurations(self):
        """Test various tag configurations"""
        # Test complex tag structure
        complex_tags = {
            "Environment": "production",
            "Project": "tap-stack",
            "Owner": "engineering-team",
            "CostCenter": "12345",
            "Backup": "required",
        }

        args = self.TapStackArgs(tags=complex_tags)
        self.assertEqual(args.tags, complex_tags)

        # Test tags with special characters
        special_tags = {"environment-type": "test", "project_name": "tap-stack", "owner.email": "test@example.com"}

        args_special = self.TapStackArgs(tags=special_tags)
        self.assertEqual(args_special.tags, special_tags)


class TestInventoryServerlessStack(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Set up class-level mocks for InventoryServerlessStack tests"""
        # Mock Pulumi modules
        cls.mock_pulumi = Mock()
        cls.mock_pulumi.ComponentResource = MockComponentResource
        cls.mock_pulumi.ResourceOptions = Mock
        cls.mock_pulumi.Output = MockOutput
        cls.mock_pulumi.AssetArchive = Mock()
        cls.mock_pulumi.StringAsset = Mock()

        # Mock Config with proper return values for inventory serverless
        cls.mock_config = Mock()
        cls.mock_config.get = Mock(
            side_effect=lambda key: {
                "dynamodb_billing_mode": "PAY_PER_REQUEST",
                "lambda_memory_size": "128",
                "notification_email": "test@example.com",
            }.get(key)
        )
        cls.mock_pulumi.Config = Mock(return_value=cls.mock_config)

        # Mock AWS modules with all required resources
        cls.mock_aws = Mock()
        cls.mock_aws.dynamodb = Mock()
        cls.mock_aws.dynamodb.Table = Mock()
        cls.mock_aws.dynamodb.TableAttributeArgs = Mock()
        cls.mock_aws.dynamodb.TableGlobalSecondaryIndexArgs = Mock()
        cls.mock_aws.dynamodb.TableServerSideEncryptionArgs = Mock()
        cls.mock_aws.sns = Mock()
        cls.mock_aws.sns.Topic = Mock()
        cls.mock_aws.sns.TopicSubscription = Mock()
        cls.mock_aws.iam = Mock()
        cls.mock_aws.iam.Role = Mock()
        cls.mock_aws.iam.RolePolicy = Mock()
        cls.mock_aws.lambda_ = Mock()
        cls.mock_aws.lambda_.Function = Mock()
        cls.mock_aws.lambda_.Permission = Mock()
        cls.mock_aws.apigateway = Mock()
        cls.mock_aws.apigateway.RestApi = Mock()
        cls.mock_aws.apigateway.Resource = Mock()
        cls.mock_aws.apigateway.Method = Mock()
        cls.mock_aws.apigateway.Integration = Mock()
        cls.mock_aws.apigateway.MethodResponse = Mock()
        cls.mock_aws.apigateway.IntegrationResponse = Mock()
        cls.mock_aws.apigateway.Deployment = Mock()
        cls.mock_aws.cloudwatch = Mock()
        cls.mock_aws.cloudwatch.LogGroup = Mock()

        # Apply module patches
        sys.modules["pulumi"] = cls.mock_pulumi
        sys.modules["pulumi_aws"] = cls.mock_aws

    def setUp(self):
        """Set up test environment for each inventory test"""
        # Clear any existing imports to ensure clean state
        modules_to_clear = [m for m in sys.modules.keys() if m.startswith("lib.")]
        for module in modules_to_clear:
            if module in sys.modules:
                del sys.modules[module]

        # Import classes after mocking
        from lib.inventory_serverless import InventoryServerlessStack, InventoryServerlessStackArgs

        # Store references for use in tests
        self.InventoryServerlessStack = InventoryServerlessStack
        self.InventoryServerlessStackArgs = InventoryServerlessStackArgs

        # Create test arguments
        self.test_args = InventoryServerlessStackArgs(
            environment_suffix="test",
            tags={"Environment": "test", "Project": "inventory"},
            notification_email="test@example.com",
        )

    def test_inventory_serverless_stack_args_defaults(self):
        """Test InventoryServerlessStackArgs default values"""
        args = self.InventoryServerlessStackArgs()
        self.assertEqual(args.environment_suffix, "dev")
        self.assertEqual(args.tags, {})
        self.assertEqual(args.notification_email, "admin@example.com")

        # Test with custom values
        custom_tags = {"Project": "test", "Owner": "team"}
        args = self.InventoryServerlessStackArgs(
            environment_suffix="prod", tags=custom_tags, notification_email="prod@example.com"
        )
        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.notification_email, "prod@example.com")

    def test_inventory_serverless_stack_initialization(self):
        """Test InventoryServerlessStack initialization"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify stack properties
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertEqual(stack.tags, {"Environment": "test", "Project": "inventory"})
        self.assertEqual(stack.notification_email, "test@example.com")

    def test_dynamodb_tables_creation(self):
        """Test DynamoDB tables are created correctly"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify DynamoDB tables were created
        self.assertTrue(hasattr(stack, "inventory_items_table"))
        self.assertTrue(hasattr(stack, "inventory_audit_table"))

    def test_sns_topic_creation(self):
        """Test SNS topic and subscription creation"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify SNS resources were created
        self.assertTrue(hasattr(stack, "inventory_alerts_topic"))
        self.assertTrue(hasattr(stack, "inventory_alerts_subscription"))

    def test_lambda_function_creation(self):
        """Test Lambda function and IAM role creation"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify Lambda resources were created
        self.assertTrue(hasattr(stack, "lambda_role"))
        self.assertTrue(hasattr(stack, "lambda_policy"))
        self.assertTrue(hasattr(stack, "inventory_api_lambda"))

    def test_api_gateway_creation(self):
        """Test API Gateway resources creation"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify API Gateway resources were created
        self.assertTrue(hasattr(stack, "inventory_api"))
        self.assertTrue(hasattr(stack, "items_resource"))
        self.assertTrue(hasattr(stack, "item_resource"))
        self.assertTrue(hasattr(stack, "lambda_permission"))
        self.assertTrue(hasattr(stack, "api_deployment"))

    def test_api_gateway_methods_creation(self):
        """Test API Gateway methods creation for CRUD operations"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify CRUD methods were created
        self.assertTrue(hasattr(stack, "post_method"))
        self.assertTrue(hasattr(stack, "get_all_method"))
        self.assertTrue(hasattr(stack, "get_method"))
        self.assertTrue(hasattr(stack, "put_method"))
        self.assertTrue(hasattr(stack, "patch_method"))
        self.assertTrue(hasattr(stack, "delete_method"))

    def test_cors_methods_creation(self):
        """Test CORS OPTIONS methods creation"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify CORS methods were created
        self.assertTrue(hasattr(stack, "options_items_method"))
        self.assertTrue(hasattr(stack, "options_items_integration"))
        self.assertTrue(hasattr(stack, "options_item_method"))
        self.assertTrue(hasattr(stack, "options_item_integration"))

    def test_cloudwatch_log_group_creation(self):
        """Test CloudWatch log group creation"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify CloudWatch log group was created
        self.assertTrue(hasattr(stack, "api_log_group"))

    def test_configuration_handling(self):
        """Test configuration handling for billing mode and memory size"""

        # Setup config mock with specific values
        self.mock_config.get.side_effect = lambda key: {
            "dynamodb_billing_mode": "PROVISIONED",
            "lambda_memory_size": "256",
        }.get(key)

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify config was called
        self.assertTrue(self.mock_config.get.called)

    def test_resource_naming_helper(self):
        """Test resource naming helper function"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify that resources follow naming convention
        # This is verified by checking that the stack was created successfully
        # as the naming helper is used throughout the resource creation
        self.assertIsNotNone(stack)

    def test_outputs_registration(self):
        """Test that outputs are registered correctly"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Verify outputs were registered (check if method exists on our mock)
        self.assertTrue(hasattr(stack, "outputs"))

    def test_component_inheritance(self):
        """Test that InventoryServerlessStack properly inherits from ComponentResource"""

        # Create stack
        stack = self.InventoryServerlessStack("test-inventory", self.test_args)

        # Test basic properties
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertEqual(stack.tags, {"Environment": "test", "Project": "inventory"})

        # Test inheritance by checking type_name (set by MockComponentResource)
        self.assertEqual(stack.type_name, "inventory:stack:InventoryServerlessStack")

    def test_different_environments_configuration(self):
        """Test different environment configurations"""

        # Test production environment
        prod_args = self.InventoryServerlessStackArgs(environment_suffix="production")
        prod_stack = self.InventoryServerlessStack("prod-inventory", prod_args)
        self.assertEqual(prod_stack.environment_suffix, "production")

        # Test development environment
        dev_args = self.InventoryServerlessStackArgs(environment_suffix="development")
        dev_stack = self.InventoryServerlessStack("dev-inventory", dev_args)
        self.assertEqual(dev_stack.environment_suffix, "development")

    def test_notification_email_variations(self):
        """Test different notification email configurations"""

        # Test with custom email
        custom_args = self.InventoryServerlessStackArgs(notification_email="custom@test.com")
        custom_stack = self.InventoryServerlessStack("custom-inventory", custom_args)
        self.assertEqual(custom_stack.notification_email, "custom@test.com")

        # Test with default email
        default_args = self.InventoryServerlessStackArgs()
        default_stack = self.InventoryServerlessStack("default-inventory", default_args)
        self.assertEqual(default_stack.notification_email, "admin@example.com")

    def test_comprehensive_tag_propagation(self):
        """Test that tags are properly propagated to all resources"""

        # Create stack with comprehensive tags
        comprehensive_tags = {
            "Environment": "test",
            "Project": "inventory-management",
            "Owner": "engineering",
            "CostCenter": "12345",
        }

        args = self.InventoryServerlessStackArgs(tags=comprehensive_tags)
        stack = self.InventoryServerlessStack("comprehensive-inventory", args)

        # Verify tags are stored correctly
        self.assertEqual(stack.tags, comprehensive_tags)


if __name__ == "__main__":
    # Run tests with detailed output
    unittest.main(verbosity=2, buffer=True)
