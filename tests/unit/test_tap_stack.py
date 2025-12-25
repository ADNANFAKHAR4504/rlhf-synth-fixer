"""Unit tests for TapStack"""
import unittest
from unittest.mock import Mock, patch
import pulumi
import os


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [f"{args.name}_id", args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-west-2a", "us-west-2b"]}
        if args.token == "aws:index/getRegion:getRegion":
            return {"region": "us-west-2"}
        return {}


pulumi.runtime.set_mocks(PulumiMocks())

# Ensure AWS_ENDPOINT_URL is NOT set to avoid LocalStack-specific logic in tests
if 'AWS_ENDPOINT_URL' in os.environ:
    del os.environ['AWS_ENDPOINT_URL']


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

    @pulumi.runtime.test
    def test_backend_creation(self):
        """Test that backend infrastructure is created"""
        import sys
        import os

        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify backend component exists
        self.assertIsNotNone(stack.backend)

    @pulumi.runtime.test
    def test_data_processing_creation(self):
        """Test that data processing infrastructure is created"""
        import sys
        import os

        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify data processing component exists
        self.assertIsNotNone(stack.data_processing)

    @pulumi.runtime.test
    def test_frontend_creation_in_aws(self):
        """Test that frontend is created in AWS (not LocalStack)"""
        import sys
        import os

        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        # Ensure LocalStack detection is false
        if 'AWS_ENDPOINT_URL' in os.environ:
            del os.environ['AWS_ENDPOINT_URL']

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify frontend component exists (should be created in non-LocalStack)
        self.assertIsNotNone(stack.frontend)

    @pulumi.runtime.test
    def test_stack_with_tags(self):
        """Test that stack respects custom tags"""
        import sys
        import os

        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {"Environment": "test", "Project": "test-project"}
        args = TapStackArgs(environment_suffix="test", tags=custom_tags)
        stack = TapStack("test-stack", args)

        # Verify tags are passed
        self.assertEqual(stack.tags, custom_tags)


if __name__ == '__main__':
    unittest.main()
