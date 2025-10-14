"""
test_tap_stack.py

Unit tests for the TapStack configuration and argument handling.
These tests use Pulumi's testing framework with minimal mocking for computed outputs.
"""

import unittest
import pulumi


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that provides only essential computed outputs.
    Returns inputs as outputs, plus critical computed properties.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs, "id": f"{args.name}-id"}
        
        # Add only the computed outputs that are actually used in the code
        if "execution_arn" not in outputs and args.typ in ["aws:apigatewayv2/api:Api"]:
            outputs["execution_arn"] = f"arn:aws:execute-api:us-east-1:123456789012:{args.name}"
        
        return [f"{args.name}-id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Return empty dict for all function calls."""
        return {}


# Set mocks before importing the stack
pulumi.runtime.set_mocks(MinimalMocks())

from lib.tap_stack import TapStackArgs, TapStack


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Team": "DevOps", "CostCenter": "Engineering"}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_empty_string_suffix(self):
        """Test TapStackArgs with empty string defaults to 'dev'."""
        args = TapStackArgs(environment_suffix='')
        
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_none_suffix(self):
        """Test TapStackArgs with None suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_multiple_environments(self):
        """Test TapStackArgs with various environment suffix values."""
        environments = ['dev', 'staging', 'qa', 'prod', 'test', 'demo']
        
        for env in environments:
            args = TapStackArgs(environment_suffix=env)
            self.assertEqual(args.environment_suffix, env)

    def test_tap_stack_args_complex_tags(self):
        """Test TapStackArgs with complex tag values."""
        complex_tags = {
            "Team": "Platform Engineering",
            "CostCenter": "12345",
            "Environment": "production",
            "ManagedBy": "Pulumi",
            "Owner": "platform-team@example.com"
        }
        args = TapStackArgs(environment_suffix='prod', tags=complex_tags)
        
        self.assertEqual(args.tags, complex_tags)
        self.assertEqual(len(args.tags), 5)


class TestTapStackCreation(unittest.TestCase):
    """Test TapStack instantiation and resource creation."""

    @pulumi.runtime.test
    def test_tap_stack_instantiation(self):
        """Test TapStack can be instantiated."""
        def check_instantiation(args):
            stack = TapStack("test-stack", TapStackArgs())
            
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, 'dev')
            return {}
        
        return pulumi.Output.from_input(check_instantiation({}))

    @pulumi.runtime.test
    def test_tap_stack_with_custom_config(self):
        """Test TapStack with custom configuration."""
        def check_custom_config(args):
            custom_tags = {"Environment": "prod", "Team": "ML"}
            stack = TapStack(
                "prod-stack",
                TapStackArgs(environment_suffix='prod', tags=custom_tags)
            )
            
            self.assertEqual(stack.environment_suffix, 'prod')
            self.assertEqual(stack.tags, custom_tags)
            return {}
        
        return pulumi.Output.from_input(check_custom_config({}))

    @pulumi.runtime.test
    def test_tap_stack_resources_exist(self):
        """Test that all expected resources are created."""
        def check_resources(args):
            stack = TapStack("test-stack", TapStackArgs())
            
            # Verify all major infrastructure components exist
            self.assertIsNotNone(stack.image_bucket, "S3 bucket should be created")
            self.assertIsNotNone(stack.results_table, "DynamoDB table should be created")
            self.assertIsNotNone(stack.preprocessing_queue, "Preprocessing queue should be created")
            self.assertIsNotNone(stack.inference_queue, "Inference queue should be created")
            self.assertIsNotNone(stack.dlq, "Dead letter queue should be created")
            self.assertIsNotNone(stack.preprocessing_function, "Preprocessing Lambda should be created")
            self.assertIsNotNone(stack.inference_function, "Inference Lambda should be created")
            self.assertIsNotNone(stack.api_handler_function, "API handler Lambda should be created")
            self.assertIsNotNone(stack.model_layer, "Lambda layer should be created")
            self.assertIsNotNone(stack.api, "API Gateway should be created")
            
            return {}
        
        return pulumi.Output.from_input(check_resources({}))

    @pulumi.runtime.test
    def test_tap_stack_multiple_environments(self):
        """Test creating stacks for different environments."""
        def check_environments(args):
            for env in ['dev', 'staging', 'prod']:
                stack = TapStack(f"{env}-stack", TapStackArgs(environment_suffix=env))
                self.assertEqual(stack.environment_suffix, env)
            
            return {}
        
        return pulumi.Output.from_input(check_environments({}))


class TestTapStackConfiguration(unittest.TestCase):
    """Test stack configuration and settings."""

    @pulumi.runtime.test
    def test_stack_uses_environment_suffix(self):
        """Test that environment suffix is properly used."""
        def check_suffix(args):
            stack = TapStack("my-stack", TapStackArgs(environment_suffix='production'))
            self.assertEqual(stack.environment_suffix, 'production')
            return {}
        
        return pulumi.Output.from_input(check_suffix({}))

    @pulumi.runtime.test
    def test_stack_applies_custom_tags(self):
        """Test that custom tags are applied to the stack."""
        def check_tags(args):
            tags = {
                "CostCenter": "Engineering",
                "Project": "ML-Pipeline",
                "Owner": "data-team"
            }
            stack = TapStack("tagged-stack", TapStackArgs(tags=tags))
            self.assertEqual(stack.tags, tags)
            return {}
        
        return pulumi.Output.from_input(check_tags({}))

    @pulumi.runtime.test
    def test_stack_default_tags(self):
        """Test that stack uses empty dict for tags when none provided."""
        def check_default_tags(args):
            stack = TapStack("test-stack", TapStackArgs())
            self.assertEqual(stack.tags, {})
            return {}
        
        return pulumi.Output.from_input(check_default_tags({}))


if __name__ == '__main__':
    unittest.main()
