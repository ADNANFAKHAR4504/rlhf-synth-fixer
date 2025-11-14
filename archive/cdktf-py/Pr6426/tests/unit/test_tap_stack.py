"""Unit tests for TAP Stack."""
import os
import sys
from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


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

    def test_tap_stack_with_prod_environment(self):
        """TapStack instantiates with prod environment to enable versioning."""
        # Set environment to prod to trigger versioning code path
        os.environ['ENVIRONMENT'] = 'prod'
        try:
            app = App()
            stack = TapStack(
                app,
                "TestTapStackProd",
                environment_suffix="prod-test",
                state_bucket="test-bucket",
                state_bucket_region="us-east-1",
                aws_region="us-east-1",
            )

            # Verify that TapStack instantiates without errors in prod mode
            assert stack is not None
            assert hasattr(stack, 'bucket')
            assert hasattr(stack, 'bucket_versioning')
            assert hasattr(stack, 'bucket_encryption')
        finally:
            # Clean up environment variable
            if 'ENVIRONMENT' in os.environ:
                del os.environ['ENVIRONMENT']


# add more test suites and cases as needed
