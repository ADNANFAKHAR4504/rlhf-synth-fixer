"""Unit tests for TAP stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')

    def test_tap_stack_creation(self):
        """Test that TAP stack can be created without errors."""
        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-west-2",
            default_tags={
                "Environment": "test",
                "Project": "tap"
            }
        )

        # Synthesize the stack to ensure no errors
        synth = app.synth()
        stack_artifact = synth.get_stack_by_name("test-stack")
        assert stack_artifact is not None

    def test_stack_has_required_resources(self):
        """Test that the stack contains required resources."""
        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test"
        )

        # This would test for specific resources in the synthesized output
        synth = app.synth()
        stack_artifact = synth.get_stack_by_name("test-stack")
        assert stack_artifact is not None
        # Add more specific assertions as needed


# add more test suites and cases as needed
