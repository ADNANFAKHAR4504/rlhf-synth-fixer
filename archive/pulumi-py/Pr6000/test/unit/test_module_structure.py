"""
Unit tests for module structure and imports.
"""

import unittest
from lib import database, tap_stack, api, compute
from lib.database import DatabaseStack
from lib.tap_stack import TapStack, TapStackArgs
from lib.api import ApiGatewayStack
from lib.compute import ComputeStack


class TestModuleStructure(unittest.TestCase):
    """Test module structure and class definitions."""

    def test_database_module_exports(self):
        """Test database module has required exports."""
        self.assertTrue(hasattr(database, 'DatabaseStack'))
        self.assertTrue(callable(DatabaseStack))

    def test_tap_stack_module_exports(self):
        """Test tap_stack module has required exports."""
        self.assertTrue(hasattr(tap_stack, 'TapStack'))
        self.assertTrue(hasattr(tap_stack, 'TapStackArgs'))
        self.assertTrue(callable(TapStack))
        self.assertTrue(callable(TapStackArgs))

    def test_api_module_exports(self):
        """Test api module has required exports."""
        self.assertTrue(hasattr(api, 'ApiGatewayStack'))
        self.assertTrue(callable(ApiGatewayStack))

    def test_compute_module_exports(self):
        """Test compute module has required exports."""
        self.assertTrue(hasattr(compute, 'ComputeStack'))
        self.assertTrue(callable(ComputeStack))

    def test_database_stack_class_attributes(self):
        """Test DatabaseStack class has required methods."""
        self.assertTrue(hasattr(DatabaseStack, '__init__'))

    def test_tap_stack_class_attributes(self):
        """Test TapStack class has required methods."""
        self.assertTrue(hasattr(TapStack, '__init__'))
        self.assertTrue(hasattr(TapStackArgs, '__init__'))

    def test_api_gateway_stack_class_attributes(self):
        """Test ApiGatewayStack class has required methods."""
        self.assertTrue(hasattr(ApiGatewayStack, '__init__'))

    def test_compute_stack_class_attributes(self):
        """Test ComputeStack class has required methods."""
        self.assertTrue(hasattr(ComputeStack, '__init__'))

    def test_tap_stack_args_initialization_signature(self):
        """Test TapStackArgs initialization signature."""
        # Test that we can create instances with different parameters
        args1 = TapStackArgs()
        args2 = TapStackArgs('test')
        args3 = TapStackArgs('test', {})
        args4 = TapStackArgs(environment_suffix='test')
        args5 = TapStackArgs(tags={'key': 'value'})
        args6 = TapStackArgs(environment_suffix='test', tags={'key': 'value'})

        # Verify all instances were created
        self.assertIsNotNone(args1)
        self.assertIsNotNone(args2)
        self.assertIsNotNone(args3)
        self.assertIsNotNone(args4)
        self.assertIsNotNone(args5)
        self.assertIsNotNone(args6)

    def test_module_docstrings(self):
        """Test modules have docstrings."""
        self.assertIsNotNone(database.__doc__)
        self.assertIsNotNone(tap_stack.__doc__)
        self.assertIsNotNone(api.__doc__)
        self.assertIsNotNone(compute.__doc__)

    def test_class_docstrings(self):
        """Test classes have docstrings."""
        self.assertIsNotNone(DatabaseStack.__doc__)
        self.assertIsNotNone(TapStack.__doc__)
        self.assertIsNotNone(TapStackArgs.__doc__)
        self.assertIsNotNone(ApiGatewayStack.__doc__)
        self.assertIsNotNone(ComputeStack.__doc__)


if __name__ == '__main__':
    unittest.main()
