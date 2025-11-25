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

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_synthesizes_without_errors(self):
        """TapStack synthesizes without errors."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackSynth",
            environment_suffix="test"
        )

        # Synthesize the stack
        synth = Testing.synth(stack)

        # Verify synthesis produces valid JSON
        assert synth is not None
        assert len(synth) > 0


# add more test suites and cases as needed
