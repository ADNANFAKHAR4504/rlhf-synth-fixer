"""Unit tests for TapStack."""
import unittest
from unittest.mock import patch, MagicMock
import pulumi


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack component."""

    @pulumi.runtime.test
    def test_stack_creation(self):
        """Test that TapStack creates resources without errors."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        # Create the stack
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify stack was created
        self.assertIsNotNone(stack)
        self.assertIsNotNone(stack.bucket)
        self.assertIsNotNone(stack.lambda_function)
        self.assertIsNotNone(stack.lambda_role)


if __name__ == '__main__':
    unittest.main()
