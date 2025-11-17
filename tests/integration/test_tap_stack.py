"""Integration tests for TapStack deployment validation."""
import os
import sys
import json
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs if available."""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "cfn-outputs",
            "flat-outputs.json"
        )

        cls.outputs_available = os.path.exists(outputs_file)
        if cls.outputs_available:
            with open(outputs_file, 'r', encoding='utf-8') as f:
                all_outputs = json.load(f)
                cls.stack_name = list(all_outputs.keys())[0]
                cls.outputs = all_outputs[cls.stack_name]

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates and synthesizes properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify basic structure
        assert stack is not None

        # Synthesize and validate CDKTF structure
        synth = Testing.synth(stack)
        assert synth is not None
        assert len(synth) > 0

        # Parse and validate synthesized JSON
        resources = json.loads(synth)
        assert "resource" in resources
        assert len(resources["resource"]) > 0

    def test_deployment_outputs_available(self):
        """Test that deployment outputs file exists and is valid."""
        if not self.outputs_available:
            pytest.skip("Outputs file not found - deployment may not have completed")

        assert hasattr(self, 'outputs'), "Outputs should be loaded"
        assert isinstance(self.outputs, dict), "Outputs should be a dictionary"
        assert len(self.outputs) > 0, "Outputs should not be empty"

    def test_deployed_stack_has_required_outputs(self):
        """Test that deployed stack has all required outputs."""
        if not self.outputs_available:
            pytest.skip("Outputs file not found - deployment may not have completed")

        required_outputs = [
            'vpc_id',
            'alb_dns_name',
            'ecs_cluster_name',
            'rds_cluster_endpoint',
            'logs_bucket_name',
            'assets_bucket_name',
            'kms_key_id'
        ]

        for output_name in required_outputs:
            assert output_name in self.outputs, f"Missing required output: {output_name}"
            assert self.outputs[output_name], f"Output {output_name} is empty"

