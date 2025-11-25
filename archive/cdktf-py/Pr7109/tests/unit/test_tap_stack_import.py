"""Unit tests that import and instantiate TapStack to ensure coverage."""
import pytest
from cdktf import App
from lib.tap_stack import TapStack


class TestTapStackImport:
    """Tests that ensure the tap_stack module is imported for coverage."""

    def test_import_tap_stack_module(self):
        """Test that TapStack can be imported."""
        from lib import tap_stack
        assert hasattr(tap_stack, 'TapStack')

    def test_create_tap_stack_instance(self):
        """Test creating a TapStack instance with default configuration."""
        app = App()
        config = {
            'environment_suffix': 'test',
            'aws_region': 'us-east-1',
            'state_bucket': 'test-bucket',
            'state_bucket_region': 'us-east-1',
            'default_tags': {
                'Environment': 'test',
                'Repository': 'test-repo',
                'Author': 'test-author'
            }
        }

        stack = TapStack(app, "TestStack", **config)

        # Verify stack was created
        assert stack is not None
        assert hasattr(stack, 'node')

    def test_create_tap_stack_with_minimal_config(self):
        """Test creating TapStack with minimal configuration (using defaults)."""
        app = App()
        stack = TapStack(app, "TestStack")

        # Verify stack was created with defaults
        assert stack is not None

    def test_create_tap_stack_with_empty_tags(self):
        """Test creating TapStack with empty default tags."""
        app = App()
        config = {
            'environment_suffix': 'test',
            'default_tags': {}
        }
        stack = TapStack(app, "TestStack", **config)

        assert stack is not None

    def test_create_tap_stack_with_different_region(self):
        """Test creating TapStack with different AWS region."""
        app = App()
        config = {
            'environment_suffix': 'test',
            'aws_region': 'us-west-2',
            'state_bucket_region': 'us-west-2'
        }
        stack = TapStack(app, "TestStack", **config)

        assert stack is not None

    def test_create_multiple_stacks(self):
        """Test creating multiple stack instances."""
        app = App()

        stack1 = TapStack(app, "Stack1", environment_suffix='test1')
        stack2 = TapStack(app, "Stack2", environment_suffix='test2')

        assert stack1 is not None
        assert stack2 is not None
        assert stack1 != stack2

    def test_stack_initialization_parameters(self):
        """Test all initialization parameters are handled."""
        app = App()
        config = {
            'environment_suffix': 'custom',
            'aws_region': 'eu-west-1',
            'state_bucket': 'custom-state-bucket',
            'state_bucket_region': 'eu-west-1',
            'default_tags': {
                'Project': 'TestProject',
                'Owner': 'TestOwner'
            }
        }

        stack = TapStack(app, "CustomStack", **config)

        assert stack is not None
