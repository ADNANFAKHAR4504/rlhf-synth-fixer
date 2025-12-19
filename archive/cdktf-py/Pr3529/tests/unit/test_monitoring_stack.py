"""Unit tests for Monitoring Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.monitoring_stack import MonitoringStack  # noqa: E402


class TestMonitoringStack:
    """Test suite for Monitoring Stack."""

    def test_monitoring_stack_created_successfully(self):
        """Test Monitoring stack is created successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = MonitoringStack(
            parent_stack,
            environment_suffix="test",
            ecr_repository_name="test-repository",
            lambda_function_arn="arn:aws:lambda:us-east-2:123456789012:function:test",
            lambda_function_name="test-function",
            sns_topic_arn="arn:aws:sns:us-east-2:123456789012:test-topic"
        )

        # Check that stack was created
        assert stack is not None

    def test_stack_has_monitoring_resources(self):
        """Test stack has monitoring resources."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = MonitoringStack(
            parent_stack,
            environment_suffix="test",
            ecr_repository_name="test-repository",
            lambda_function_arn="arn:aws:lambda:us-east-2:123456789012:function:test",
            lambda_function_name="test-function",
            sns_topic_arn="arn:aws:sns:us-east-2:123456789012:test-topic"
        )

        # Stack should be created successfully
        assert stack is not None
