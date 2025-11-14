"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
from unittest.mock import Mock, patch
import pulumi

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        args = TapStackArgs(
            environment_suffix='prod',
            tags={'test': 'value'}
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {'test': 'value'})


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @pulumi.runtime.test
    def test_stack_creates_lambda_function(self):
        """Test that the stack creates a Lambda function."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test",
                tags={"test": "true"}
            )
        )

        # Verify Lambda function is created
        self.assertIsNotNone(stack.lambda_function)

        # Verify Lambda function properties
        def check_lambda(args):
            runtime, memory_size, timeout = args
            assert runtime == "nodejs18.x"
            assert memory_size == 1024
            assert timeout == 10
            # Note: reserved_concurrent_executions was removed to avoid account limit issues

        pulumi.Output.all(
            stack.lambda_function.runtime,
            stack.lambda_function.memory_size,
            stack.lambda_function.timeout
        ).apply(check_lambda)

    @pulumi.runtime.test
    def test_stack_creates_api_gateway(self):
        """Test that the stack creates API Gateway."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify API Gateway is created
        self.assertIsNotNone(stack.api_gateway)
        self.assertIsNotNone(stack.api_resource)
        self.assertIsNotNone(stack.api_method)

    @pulumi.runtime.test
    def test_stack_creates_iam_role(self):
        """Test that the stack creates IAM role with correct policies."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify IAM role is created
        self.assertIsNotNone(stack.lambda_role)
        self.assertIsNotNone(stack.lambda_logs_policy_attachment)
        self.assertIsNotNone(stack.lambda_xray_policy_attachment)

    @pulumi.runtime.test
    def test_stack_applies_correct_tags(self):
        """Test that the stack applies required tags."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify tags
        def check_tags(tags):
            assert tags["Environment"] == "production"
            assert tags["Service"] == "currency-api"

        stack.lambda_function.tags.apply(check_tags)

    @pulumi.runtime.test
    def test_stack_enables_xray_tracing(self):
        """Test that X-Ray tracing is enabled."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify X-Ray on Lambda
        def check_xray_lambda(mode):
            assert mode == "Active"

        stack.lambda_function.tracing_config.mode.apply(check_xray_lambda)

        # Verify X-Ray on API Gateway stage
        def check_xray_api(enabled):
            assert enabled is True

        stack.api_stage.xray_tracing_enabled.apply(check_xray_api)

    @pulumi.runtime.test
    def test_stack_configures_throttling(self):
        """Test that throttling is configured correctly."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify usage plan throttling
        def check_throttling(args):
            rate_limit, burst_limit = args
            assert rate_limit == 5000
            assert burst_limit == 5000

        pulumi.Output.all(
            stack.usage_plan.throttle_settings.rate_limit,
            stack.usage_plan.throttle_settings.burst_limit
        ).apply(check_throttling)

    @pulumi.runtime.test
    def test_stack_configures_environment_variables(self):
        """Test that Lambda environment variables are set."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify environment variables
        def check_env_vars(variables):
            assert variables["API_VERSION"] == "v1"
            assert variables["RATE_PRECISION"] == "2"

        stack.lambda_function.environment.variables.apply(check_env_vars)

    @pulumi.runtime.test
    def test_stack_exports_outputs(self):
        """Test that the stack exports required outputs."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify outputs are set
        self.assertIsNotNone(stack.api_url)
        self.assertIsNotNone(stack.api_key)

    @pulumi.runtime.test
    def test_stack_uses_environment_suffix(self):
        """Test that environment suffix is used in resource names."""
        stack = TapStack(
            "test-stack",
            TapStackArgs(
                environment_suffix="test123"
            )
        )

        # Verify suffix is used
        self.assertEqual(stack.environment_suffix, "test123")


if __name__ == "__main__":
    unittest.main()
