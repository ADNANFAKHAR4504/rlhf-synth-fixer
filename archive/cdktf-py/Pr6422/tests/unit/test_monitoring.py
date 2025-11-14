"""Unit tests for Monitoring Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.monitoring import MonitoringStack  # noqa: E402


class TestMonitoringStack:
    """Test suite for Monitoring Stack."""

    def test_monitoring_stack_instantiates_successfully(self):
        """Monitoring stack instantiates successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = MonitoringStack(
            parent_stack,
            "test_monitoring",
            environment_suffix="test",
        )

        assert stack is not None
        assert hasattr(stack, 'log_groups')
        assert hasattr(stack, 'services')

    def test_monitoring_stack_creates_log_groups_for_all_services(self):
        """Monitoring stack creates log groups for all services."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = MonitoringStack(
            parent_stack,
            "test_monitoring",
            environment_suffix="test",
        )

        # Should have 3 services
        assert len(stack.services) == 3
        assert "payment-api" in stack.services
        assert "fraud-detection" in stack.services
        assert "notification-service" in stack.services

        # Should have 3 log groups
        assert len(stack.log_groups) == 3
        for service in stack.services:
            assert service in stack.log_groups
            assert stack.log_groups[service] is not None

    def test_monitoring_stack_exports_log_group_names(self):
        """Monitoring stack exports log group names."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = MonitoringStack(
            parent_stack,
            "test_monitoring",
            environment_suffix="test",
        )

        log_group_names = stack.log_group_names
        assert len(log_group_names) == 3

        for service in stack.services:
            assert service in log_group_names
            assert log_group_names[service] is not None

    def test_monitoring_stack_exports_log_group_arns(self):
        """Monitoring stack exports log group ARNs."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = MonitoringStack(
            parent_stack,
            "test_monitoring",
            environment_suffix="test",
        )

        log_group_arns = stack.log_group_arns
        assert len(log_group_arns) == 3

        for arn in log_group_arns:
            assert arn is not None

    def test_monitoring_stack_with_different_suffix(self):
        """Monitoring stack works with different environment suffix."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = MonitoringStack(
            parent_stack,
            "test_monitoring",
            environment_suffix="prod",
        )

        assert stack is not None
        assert len(stack.log_groups) == 3
