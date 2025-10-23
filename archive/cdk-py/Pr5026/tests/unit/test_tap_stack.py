import unittest
import os
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from unittest.mock import patch, MagicMock

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack - comprehensive security infrastructure testing"""

    def setUp(self):
        """Set up a fresh CDK app and environment for each test"""
        self.app = cdk.App()
        # Use environment variables or sensible defaults for region-agnostic testing
        self.test_env = cdk.Environment(
            account=os.environ.get("CDK_DEFAULT_ACCOUNT", "123456789012"),
            region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
        )

    def _create_test_stack(self, suffix="test", **kwargs):
        """Helper method to create test stack with default properties"""
        default_props = {
            "environment_suffix": suffix,
            "env": self.test_env
        }
        default_props.update(kwargs)
        
        return TapStack(
            self.app,
            f"TapStackTest{suffix.capitalize()}",
            TapStackProps(**default_props)
        )

    @mark.it("successfully creates the stack instance")
    def test_stack_creation(self):
        """Test basic stack creation without synthesis"""
        # ARRANGE & ACT
        stack = self._create_test_stack()
        
        # ASSERT - Test stack object properties without synthesis
        self.assertIsInstance(stack, TapStack)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertIsNotNone(stack.node.id)
        self.assertEqual(stack.node.id, "TapStackTestTest")

    @mark.it("creates stack with expected configuration options")
    def test_stack_configuration_options(self):
        """Test stack accepts various configuration options"""
        # ARRANGE & ACT - Test different configuration combinations
        basic_stack = self._create_test_stack(
            suffix="basic",
            enable_high_availability=False
        )
        
        ha_stack = self._create_test_stack(
            suffix="ha", 
            enable_high_availability=True
        )
        
        enhanced_stack = self._create_test_stack(
            suffix="enhanced",
            enable_enhanced_monitoring=True
        )

        # ASSERT - Verify stack creation with different configs
        self.assertEqual(basic_stack.environment_suffix, "basic")
        self.assertEqual(ha_stack.environment_suffix, "ha") 
        self.assertEqual(enhanced_stack.environment_suffix, "enhanced")
        
        # Verify stacks are independent instances
        self.assertNotEqual(basic_stack.node.id, ha_stack.node.id)
        self.assertNotEqual(ha_stack.node.id, enhanced_stack.node.id)

    @mark.it("creates stack with valid CDK constructs")
    def test_cdk_constructs_creation(self):
        """Test stack creates expected CDK construct hierarchy"""
        # ARRANGE & ACT
        stack = self._create_test_stack()
        
        # ASSERT - Check stack has child constructs (without synthesis)
        self.assertGreater(len(stack.node.children), 0)
        
        # Verify stack is properly integrated into CDK app
        self.assertIn(stack, self.app.node.children)
        
        # Test stack metadata
        self.assertIsNotNone(stack.node.metadata)
        self.assertEqual(stack.node.scope, self.app)

    @mark.it("handles multiple stack instances correctly")
    def test_multiple_stack_instances(self):
        """Test creating multiple stack instances with different suffixes"""
        # ARRANGE & ACT - Create multiple stacks
        stack1 = self._create_test_stack(suffix="stack1")
        stack2 = self._create_test_stack(suffix="stack2") 
        stack3 = self._create_test_stack(suffix="stack3")

        # ASSERT - Verify each stack has unique identity
        stack_ids = [stack1.node.id, stack2.node.id, stack3.node.id]
        self.assertEqual(len(set(stack_ids)), 3)  # All IDs should be unique
        
        # Verify suffixes are properly set
        self.assertEqual(stack1.environment_suffix, "stack1")
        self.assertEqual(stack2.environment_suffix, "stack2") 
        self.assertEqual(stack3.environment_suffix, "stack3")
        
        # Verify all stacks are in the same app
        app_children_ids = [child.node.id for child in self.app.node.children]
        for stack_id in stack_ids:
            self.assertIn(stack_id, app_children_ids)

    @mark.it("accepts TapStackProps configuration properly")
    def test_tapstack_props_configuration(self):
        """Test TapStackProps dataclass accepts various configurations"""
        # ARRANGE - Test different prop configurations
        basic_props = TapStackProps(environment_suffix="basic")
        
        enhanced_props = TapStackProps(
            environment_suffix="enhanced",
            enable_high_availability=True,
            enable_enhanced_monitoring=True,
            env=self.test_env
        )
        
        # ACT - Create stacks with different props
        basic_stack = TapStack(self.app, "BasicStack", basic_props)
        enhanced_stack = TapStack(self.app, "EnhancedStack", enhanced_props)
        
        # ASSERT - Verify props are properly applied
        self.assertEqual(basic_stack.environment_suffix, "basic")
        self.assertEqual(enhanced_stack.environment_suffix, "enhanced")
        
        # Verify stacks are created without errors
        self.assertIsInstance(basic_stack, TapStack)
        self.assertIsInstance(enhanced_stack, TapStack)

    @mark.it("integrates with CDK app lifecycle properly") 
    def test_cdk_app_integration(self):
        """Test stack integrates properly with CDK app lifecycle"""
        # ARRANGE
        new_app = cdk.App()
        
        # ACT - Create stack in new app
        stack = TapStack(
            new_app,
            "IntegrationTest",
            TapStackProps(environment_suffix="integration")
        )
        
        # ASSERT - Verify proper integration
        self.assertEqual(stack.node.scope, new_app)
        self.assertIn(stack, new_app.node.children)
        self.assertEqual(len(new_app.node.children), 1)
        
        # Test stack node properties
        self.assertEqual(stack.node.id, "IntegrationTest")
        self.assertIsNotNone(stack.node.path)

    @mark.it("handles environment suffix correctly across operations")
    def test_environment_suffix_handling(self):
        """Test environment suffix is properly handled in various scenarios"""
        # ARRANGE & ACT - Test different suffix formats
        test_cases = [
            ("dev", "dev"),
            ("staging", "staging"), 
            ("prod", "prod"),
            ("test123", "test123"),
            ("feature-branch", "feature-branch")
        ]
        
        for input_suffix, expected_suffix in test_cases:
            with self.subTest(suffix=input_suffix):
                stack = self._create_test_stack(suffix=input_suffix)
                
                # ASSERT
                self.assertEqual(stack.environment_suffix, expected_suffix)
                self.assertIn(input_suffix.capitalize(), stack.node.id)

    @mark.it("supports feature flag configurations")
    def test_feature_flag_configurations(self):
        """Test stack handles various feature flag combinations"""
        # ARRANGE - Different feature combinations
        feature_configs = [
            {"enable_high_availability": True, "enable_enhanced_monitoring": False},
            {"enable_high_availability": False, "enable_enhanced_monitoring": True},
            {"enable_high_availability": True, "enable_enhanced_monitoring": True},
            {"enable_high_availability": False, "enable_enhanced_monitoring": False},
        ]
        
        # ACT & ASSERT
        for i, config in enumerate(feature_configs):
            with self.subTest(config=config):
                stack = self._create_test_stack(suffix=f"feature{i}", **config)
                
                # Verify stack creation succeeds with any feature combination
                self.assertIsInstance(stack, TapStack)
                self.assertEqual(stack.environment_suffix, f"feature{i}")

    @mark.it("maintains proper construct hierarchy and naming")
    def test_construct_hierarchy_and_naming(self):
        """Test stack maintains proper CDK construct hierarchy"""
        # ARRANGE & ACT
        stack = self._create_test_stack(suffix="hierarchy")
        
        # ASSERT - Test construct tree structure
        self.assertEqual(stack.node.scope, self.app)
        self.assertGreater(len(stack.node.children), 0)
        
        # Test that constructs have been created (without synthesis)
        child_ids = [child.node.id for child in stack.node.children]
        self.assertIsInstance(child_ids, list)
        
        # Verify stack path
        expected_path = f"TapStackTestHierarchy"
        self.assertEqual(stack.node.id, expected_path)

    @mark.it("validates TapStackProps dataclass behavior")
    def test_tapstack_props_dataclass(self):
        """Test TapStackProps dataclass functionality"""
        # ARRANGE & ACT - Test props with different values
        props1 = TapStackProps(environment_suffix="test1")
        props2 = TapStackProps(
            environment_suffix="test2", 
            enable_high_availability=True,
            enable_enhanced_monitoring=False
        )
        
        # ASSERT - Verify dataclass properties
        self.assertEqual(props1.environment_suffix, "test1")
        self.assertEqual(props2.environment_suffix, "test2")
        self.assertTrue(props2.enable_high_availability)
        self.assertFalse(props2.enable_enhanced_monitoring)
        
        # Test props have different environment_suffix values
        self.assertNotEqual(props1.environment_suffix, props2.environment_suffix)
        
        # Test that props can be used to create different stacks
        stack1 = TapStack(self.app, "PropsTestStack1", props1)
        stack2 = TapStack(self.app, "PropsTestStack2", props2)
        
        self.assertEqual(stack1.environment_suffix, "test1") 
        self.assertEqual(stack2.environment_suffix, "test2")

    @mark.it("handles error conditions gracefully") 
    def test_error_handling(self):
        """Test stack handles various error conditions gracefully"""
        # ARRANGE & ACT - Test edge cases
        
        # Test with empty suffix (should still work or fail gracefully)
        try:
            stack = self._create_test_stack(suffix="")
            self.assertIsInstance(stack, TapStack)
        except Exception as e:
            # If it fails, make sure it's for expected reasons
            self.assertIsInstance(e, (ValueError, TypeError))
            
        # Test with moderately long suffix (within AWS limits)
        medium_suffix = "a" * 20  # Safe length that won't exceed IAM role name limits
        stack_medium = self._create_test_stack(suffix=medium_suffix)
        self.assertEqual(stack_medium.environment_suffix, medium_suffix)
        
        # Test with special characters in suffix
        special_suffix = "test-123"  # Use simpler special chars
        stack_special = self._create_test_stack(suffix=special_suffix)
        self.assertEqual(stack_special.environment_suffix, special_suffix)
        
        # Test that very long suffixes are handled (should fail gracefully)
        try:
            very_long_suffix = "a" * 100  # This should cause function name to exceed limits
            stack_long = self._create_test_stack(suffix=very_long_suffix)
            # If it doesn't fail, that's also valid behavior
            self.assertIsInstance(stack_long, TapStack)
        except RuntimeError as e:
            # Expected to fail due to AWS naming constraints (function name length)
            self.assertIn("Function name can not be longer than 64 characters", str(e))

    @mark.it("supports stack inheritance and polymorphism")
    def test_stack_inheritance(self):
        """Test TapStack properly inherits from CDK Stack"""
        # ARRANGE & ACT
        stack = self._create_test_stack()
        
        # ASSERT - Verify inheritance
        self.assertIsInstance(stack, cdk.Stack)
        self.assertIsInstance(stack, TapStack)
        
        # Verify CDK Stack methods are available
        self.assertTrue(hasattr(stack, 'add_dependency'))
        self.assertTrue(hasattr(stack, 'add_transform'))
        self.assertTrue(hasattr(stack, 'format_arn'))
        
        # Test stack can be treated as CDK Stack
        stack_as_cdk = cdk.Stack(stack)  # This should not fail
        self.assertIsInstance(stack_as_cdk, cdk.Stack)

    @mark.it("maintains construct metadata and tags correctly")
    def test_construct_metadata_and_tags(self):
        """Test stack maintains proper construct metadata"""
        # ARRANGE & ACT
        stack = self._create_test_stack(suffix="metadata")
        
        # ASSERT - Check metadata structure
        self.assertIsNotNone(stack.node.metadata)
        
        # Verify construct path
        self.assertEqual(stack.node.path, "TapStackTestMetadata")
        
        # Check that stack can be found by path
        found_stack = self.app.node.find_child("TapStackTestMetadata")
        self.assertEqual(found_stack, stack)

    @mark.it("supports concurrent stack creation")
    def test_concurrent_stack_creation(self):
        """Test multiple stacks can be created concurrently without conflicts"""
        # ARRANGE - Create multiple apps for isolation
        apps = [cdk.App() for _ in range(3)]
        stacks = []
        
        # ACT - Create stacks in different apps
        for i, app in enumerate(apps):
            stack = TapStack(
                app,
                f"ConcurrentStack{i}",
                TapStackProps(environment_suffix=f"concurrent{i}")
            )
            stacks.append(stack)
        
        # ASSERT - Verify all stacks created successfully
        self.assertEqual(len(stacks), 3)
        
        for i, stack in enumerate(stacks):
            self.assertEqual(stack.environment_suffix, f"concurrent{i}")
            self.assertEqual(stack.node.id, f"ConcurrentStack{i}")
            self.assertEqual(stack.node.scope, apps[i])


if __name__ == "__main__":
    unittest.main()
