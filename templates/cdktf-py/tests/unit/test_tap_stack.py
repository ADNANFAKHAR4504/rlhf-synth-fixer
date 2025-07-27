"""Unit tests for TAP Stack."""
import sys
import os

from cdktf import App, Testing

from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Setup CDKTF testing environment
Testing.setup_jest()


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
        synthesized = Testing.synth(stack)

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert synthesized is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")
        synthesized = Testing.synth(stack)

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert synthesized is not None

    def test_s3_bucket_is_created(self):
        """S3 bucket is created with proper configuration."""
        app = App()
        stack = TapStack(app, "TestS3Bucket")
        synthesized = Testing.synth(stack)

        # Verify S3 bucket configuration
        assert "resource" in synthesized
        assert "aws_s3_bucket" in synthesized["resource"]
        assert "tap_bucket" in synthesized["resource"]["aws_s3_bucket"]

# add more test suites and cases as needed
