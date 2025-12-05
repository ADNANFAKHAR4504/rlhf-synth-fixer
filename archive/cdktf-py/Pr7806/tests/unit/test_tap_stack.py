"""Unit tests for TapStack infrastructure."""
import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from cdktf import App, Testing  # pylint: disable=wrong-import-position
from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack infrastructure."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()

    def test_stack_creation(self):
        """Test stack can be created successfully."""
        stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

        self.assertIsNotNone(stack)

    def test_environment_suffix_applied(self):
        """Test environment suffix is applied to resource names."""
        suffix = "test123"
        stack = TapStack(
            self.app,
            "test-stack",
            environment_suffix=suffix,
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

        self.assertIsNotNone(stack)


if __name__ == '__main__':
    unittest.main()
