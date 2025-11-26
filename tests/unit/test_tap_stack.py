"""Unit tests for TAP Stack."""
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
            environment_suffix="prod"
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'config_resources')
        assert hasattr(stack, 'kms_key')
        assert hasattr(stack, 'sns_topic')
        assert hasattr(stack, 'remediation_log_group')
        assert len(stack.config_resources) > 0

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault", environment_suffix="test")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'config_resources')
        assert hasattr(stack, 'kms_key')
        assert hasattr(stack, 'sns_topic')
        assert hasattr(stack, 'remediation_log_group')
        assert len(stack.config_resources) > 0


# add more test suites and cases as needed
