"""
Unit tests for module imports and class definitions.
"""

import unittest
import sys
from unittest.mock import Mock, patch, MagicMock
import pulumi


class MockPulumiResourceOptions:
    """Mock for Pulumi ResourceOptions."""
    def __init__(self, parent=None, depends_on=None):
        self.parent = parent
        self.depends_on = depends_on or []


class MockPulumiOutput:
    """Mock for Pulumi Output."""
    @staticmethod
    def from_input(value):
        mock_output = Mock()
        mock_output.apply = lambda func: func(value)
        return mock_output

    @staticmethod
    def all(*args):
        mock_output = Mock()
        mock_output.apply = lambda func: func(list(args))
        return mock_output


def setup_pulumi_mocks():
    """Setup Pulumi mocks for testing."""
    pulumi.ResourceOptions = MockPulumiResourceOptions
    pulumi.Output = MockPulumiOutput


class TestModuleImports(unittest.TestCase):
    """Test that all modules can be imported successfully."""

    def test_import_api(self):
        """Test api module can be imported."""
        from lib import api
        self.assertTrue(hasattr(api, 'ApiGatewayStack'))

    def test_import_compute(self):
        """Test compute module can be imported."""
        from lib import compute
        self.assertTrue(hasattr(compute, 'ComputeStack'))

    def test_import_database(self):
        """Test database module can be imported."""
        from lib import database
        self.assertTrue(hasattr(database, 'DatabaseStack'))

    def test_import_networking(self):
        """Test networking module can be imported."""
        from lib import networking
        self.assertTrue(hasattr(networking, 'NetworkingStack'))

    def test_import_storage(self):
        """Test storage module can be imported."""
        from lib import storage
        self.assertTrue(hasattr(storage, 'StorageStack'))

    def test_import_monitoring(self):
        """Test monitoring module can be imported."""
        from lib import monitoring
        self.assertTrue(hasattr(monitoring, 'MonitoringStack'))

    def test_import_tap_stack(self):
        """Test tap_stack module can be imported."""
        from lib import tap_stack
        self.assertTrue(hasattr(tap_stack, 'TapStack'))
        self.assertTrue(hasattr(tap_stack, 'TapStackArgs'))

    def test_import_config(self):
        """Test config module can be imported."""
        from lib import config
        self.assertTrue(hasattr(config, 'get_environment_config'))
        self.assertTrue(hasattr(config, 'get_default_egress_rules'))
        self.assertTrue(hasattr(config, 'EnvironmentConfig'))


class TestClassDefinitions(unittest.TestCase):
    """Test class definitions and attributes."""

    def test_api_gateway_stack_class_exists(self):
        """Test ApiGatewayStack class is defined."""
        from lib.api import ApiGatewayStack
        self.assertTrue(callable(ApiGatewayStack))

    def test_compute_stack_class_exists(self):
        """Test ComputeStack class is defined."""
        from lib.compute import ComputeStack
        self.assertTrue(callable(ComputeStack))

    def test_database_stack_class_exists(self):
        """Test DatabaseStack class is defined."""
        from lib.database import DatabaseStack
        self.assertTrue(callable(DatabaseStack))

    def test_networking_stack_class_exists(self):
        """Test NetworkingStack class is defined."""
        from lib.networking import NetworkingStack
        self.assertTrue(callable(NetworkingStack))

    def test_storage_stack_class_exists(self):
        """Test StorageStack class is defined."""
        from lib.storage import StorageStack
        self.assertTrue(callable(StorageStack))

    def test_monitoring_stack_class_exists(self):
        """Test MonitoringStack class is defined."""
        from lib.monitoring import MonitoringStack
        self.assertTrue(callable(MonitoringStack))

    def test_tap_stack_class_exists(self):
        """Test TapStack class is defined."""
        from lib.tap_stack import TapStack
        self.assertTrue(callable(TapStack))

    def test_tap_stack_args_class_exists(self):
        """Test TapStackArgs class is defined."""
        from lib.tap_stack import TapStackArgs
        self.assertTrue(callable(TapStackArgs))

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs can be initialized."""
        from lib.tap_stack import TapStackArgs

        # Test with defaults
        args1 = TapStackArgs()
        self.assertEqual(args1.environment_suffix, 'dev')
        self.assertEqual(args1.tags, {})

        # Test with custom values
        args2 = TapStackArgs(environment_suffix='prod', tags={'key': 'value'})
        self.assertEqual(args2.environment_suffix, 'prod')
        self.assertEqual(args2.tags, {'key': 'value'})


class TestStackDocstrings(unittest.TestCase):
    """Test that all stack classes have proper documentation."""

    def test_api_gateway_stack_docstring(self):
        """Test ApiGatewayStack has docstring."""
        from lib.api import ApiGatewayStack
        self.assertIsNotNone(ApiGatewayStack.__doc__)
        self.assertIn('API Gateway', ApiGatewayStack.__doc__)

    def test_compute_stack_docstring(self):
        """Test ComputeStack has docstring."""
        from lib.compute import ComputeStack
        self.assertIsNotNone(ComputeStack.__doc__)
        self.assertIn('Lambda', ComputeStack.__doc__)

    def test_database_stack_docstring(self):
        """Test DatabaseStack has docstring."""
        from lib.database import DatabaseStack
        self.assertIsNotNone(DatabaseStack.__doc__)
        self.assertIn('RDS', DatabaseStack.__doc__)

    def test_networking_stack_docstring(self):
        """Test NetworkingStack has docstring."""
        from lib.networking import NetworkingStack
        self.assertIsNotNone(NetworkingStack.__doc__)
        self.assertIn('VPC', NetworkingStack.__doc__)

    def test_storage_stack_docstring(self):
        """Test StorageStack has docstring."""
        from lib.storage import StorageStack
        self.assertIsNotNone(StorageStack.__doc__)
        self.assertIn('S3', StorageStack.__doc__)

    def test_monitoring_stack_docstring(self):
        """Test MonitoringStack has docstring."""
        from lib.monitoring import MonitoringStack
        self.assertIsNotNone(MonitoringStack.__doc__)
        self.assertIn('CloudWatch', MonitoringStack.__doc__)

    def test_tap_stack_docstring(self):
        """Test TapStack has docstring."""
        from lib.tap_stack import TapStack
        self.assertIsNotNone(TapStack.__doc__)


if __name__ == '__main__':
    unittest.main()
