"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

        # Verify the synthesized stack contains expected resources
        synth_json = Testing.synth(stack)
        assert synth_json is not None

        synth = json.loads(synth_json)
        assert "resource" in synth

        # Verify AWS provider is configured
        assert "provider" in synth
        assert "aws" in synth["provider"]

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

        # Verify the synthesized stack contains expected resources
        synth_json = Testing.synth(stack)
        assert synth_json is not None

        synth = json.loads(synth_json)
        assert "resource" in synth

        # Verify key resources are created with default environment_suffix
        resources = synth["resource"]
        assert "aws_kinesis_stream" in resources
        assert "aws_rds_cluster" in resources
        assert "aws_ecs_cluster" in resources
        assert "aws_secretsmanager_secret" in resources


# add more test suites and cases as needed
