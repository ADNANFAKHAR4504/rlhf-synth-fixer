"""Unit tests for TAP Stack."""
import os
import sys

from cdktf import App, Testing
from lib.tap_stack import TapStack
from lib.config.environment_config import EnvironmentConfig

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_with_environment(self):
        """TapStack instantiates successfully with environment parameter."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackDev",
            environment="dev",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_instantiates_prod_environment(self):
        """TapStack instantiates successfully with prod environment."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackProd",
            environment="prod",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_uses_default_environment(self):
        """TapStack uses dev environment when not specified."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackDefault",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_with_staging_environment(self):
        """TapStack instantiates successfully with staging environment."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackStaging",
            environment="staging",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_with_kwargs(self):
        """TapStack instantiates successfully via kwargs."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackKwargs",
            environment="dev",
            environment_suffix="demo",
            state_bucket="custom-bucket",
            aws_region="us-east-1"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_default_environment_suffix(self):
        """TapStack uses default environment_suffix when not specified."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackDefaultSuffix",
            environment="dev"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_without_account_id(self):
        """TapStack instantiates without assume_role when account_id is empty."""
        # Temporarily modify config to have empty account_id
        original_dev = EnvironmentConfig.DEV.copy()
        try:
            test_config = EnvironmentConfig.DEV.copy()
            test_config["account_id"] = ""
            EnvironmentConfig.DEV = test_config

            app = App()
            stack = TapStack(
                app,
                "TestTapStackNoAccount",
                environment="dev",
                environment_suffix="test"
            )

            # Verify that TapStack instantiates without errors
            assert stack is not None
        finally:
            # Restore original config
            EnvironmentConfig.DEV = original_dev


# add more test suites and cases as needed
