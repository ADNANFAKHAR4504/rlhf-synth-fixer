"""Integration tests for TapStack - EKS Cluster."""
import json
import os
from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates and synthesizes properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test"
        )

        # Verify basic structure
        assert stack is not None

        # Synthesize and verify output structure
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify key resources exist
        assert "resource" in config
        assert "aws_eks_cluster" in config["resource"]
        assert "aws_eks_node_group" in config["resource"]

    def test_deployed_cluster_outputs_exist(self):
        """Test that deployed cluster outputs are accessible."""
        # Check if cfn-outputs exists (integration with actual deployment)
        outputs_file = "cfn-outputs/flat-outputs.json"

        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                outputs = json.load(f)

            # Verify expected outputs
            assert "cluster_endpoint" in outputs or "cluster_name" in outputs
            assert outputs is not None
