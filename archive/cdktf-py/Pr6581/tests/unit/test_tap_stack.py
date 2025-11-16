"""Unit tests for TAP Stack."""
import json
import os
import sys

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
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'environment_suffix')
        assert stack.environment_suffix == 'prod'

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'environment_suffix')
        assert stack.environment_suffix == 'dev'  # default value

    def test_tap_stack_synth_generates_terraform_config(self):
        """TapStack synthesizes to valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestSynthStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )
        
        # Synthesize the stack to JSON string
        synth = Testing.synth(stack)
        
        # Verify synth produces JSON output
        assert synth is not None
        assert isinstance(synth, str)
        
        # Parse JSON and verify structure
        config = json.loads(synth)
        assert "resource" in config
        
    def test_tap_stack_has_required_outputs(self):
        """TapStack defines required Terraform outputs."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )
        
        # Synthesize to check outputs
        synth = Testing.synth(stack)
        
        # Parse JSON string
        config = json.loads(synth)
        
        # Verify outputs exist
        assert "output" in config
        outputs = config.get("output", {})
        
        # Check for expected outputs
        assert "api_gateway_url" in outputs
        assert "dynamodb_table_name" in outputs
        assert "validator_queue_url" in outputs
        assert "processor_queue_url" in outputs
        assert "vpc_id" in outputs


# add more test suites and cases as needed
