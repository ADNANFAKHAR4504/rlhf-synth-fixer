"""Unit tests for TapStack"""
import unittest
from unittest.mock import Mock, patch
import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [f"{args.name}_id", args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-west-2a", "us-west-2b"]}
        if args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-west-2"}
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack"""

    @pulumi.runtime.test
    def test_stack_creation(self):
        """Test that the stack can be created"""
        import sys
        import os

        # Add lib to path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        # Create stack with test args
        args = TapStackArgs(
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        stack = TapStack("test-stack", args)

        # Basic assertion - stack should be created
        self.assertIsNotNone(stack)

    @pulumi.runtime.test
    def test_network_creation(self):
        """Test that network infrastructure is created"""
        import sys
        import os

        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify network component exists
        self.assertIsNotNone(stack.network)

    @pulumi.runtime.test
    def test_monitoring_creation(self):
        """Test that monitoring infrastructure is created"""
        import sys
        import os

        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify monitoring component exists
        self.assertIsNotNone(stack.monitoring)


if __name__ == '__main__':
    unittest.main()
