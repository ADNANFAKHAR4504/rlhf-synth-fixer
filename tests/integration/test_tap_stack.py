"""Integration tests for TapStack."""
import json

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="eu-south-2",
        )

        # Verify basic structure
        assert stack is not None
        
        # Verify stack can be synthesized
        synth = Testing.synth(stack)
        assert synth is not None
        
    def test_stack_outputs_structure(self):
        """Test that stack defines required outputs."""
        app = App()
        stack = TapStack(
            app,
            "OutputTestStack",
            environment_suffix="test",
            aws_region="eu-south-2",
        )
        
        # Synthesize the stack
        synth = Testing.synth(stack)
        manifest = json.loads(synth)
        
        # Verify stack exists in manifest
        assert "stacks" in manifest
        stack_config = manifest["stacks"]["OutputTestStack"]
        
        # Verify outputs are defined
        outputs = stack_config.get("outputs", {})
        expected_outputs = [
            "vpc_eu_south_id",
            "vpc_eu_id",
            "s3_bucket_eu_south",
            "s3_bucket_eu",
            "rds_endpoint",
            "dynamodb_table",
            "lambda_function_arn",
            "api_gateway_endpoint"
        ]
        
        for output_name in expected_outputs:
            assert output_name in outputs, f"Expected output '{output_name}' not found in stack outputs"
