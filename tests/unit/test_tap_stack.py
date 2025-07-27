import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from cdktf import App, Testing
from lib.tap_stack import TapStack

# Setup CDKTF testing environment
Testing.setup_jest()

class TestStackStructure:
    """Test suite for Stack Structure"""

    def setup_method(self):
        """Reset mocks before each test"""
        # Clear any previous test state if needed
        pass

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props"""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )
        synthesized = Testing.synth(stack)

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert synthesized is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided"""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")
        synthesized = Testing.synth(stack)

        # Verify that TapStack instantiates without errors when no props are provided
        assert stack is not None
        assert synthesized is not None

    def test_s3_bucket_is_created(self):
        """Test that S3 bucket is created with correct configuration"""
        app = App()
        stack = TapStack(app, "TestS3Stack", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Verify that the stack has a bucket
        assert hasattr(stack, 'bucket')
        assert stack.bucket is not None

        # Verify that bucket versioning is configured
        assert hasattr(stack, 'bucket_versioning')
        assert stack.bucket_versioning is not None

        # Verify that bucket encryption is configured
        assert hasattr(stack, 'bucket_encryption')
        assert stack.bucket_encryption is not None

    def test_s3_bucket_naming_convention(self):
        """Test that S3 bucket follows naming convention"""
        app = App()
        stack = TapStack(app, "TestNamingStack", environment_suffix="staging")
        
        # Check bucket name contains environment suffix
        bucket_name = stack.bucket.bucket
        assert "staging" in bucket_name
        assert "testnamingstack" in bucket_name.lower()
        assert bucket_name.startswith("tap-app-bucket-")

# add more test suites and cases as needed