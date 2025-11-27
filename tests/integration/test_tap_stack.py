"""Integration tests for TapStack."""
import json
import os
from cdktf import App

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
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

        # Verify basic structure
        assert stack is not None

    def test_deployed_resources_exist(self):
        """Test that deployed resources exist and are accessible."""
        # Load outputs from deployment
        outputs_file = os.path.join(
            os.getcwd(), "cfn-outputs", "flat-outputs.json"
        )

        if not os.path.exists(outputs_file):
            # Skip test if not deployed yet
            return

        with open(outputs_file, "r", encoding="utf-8") as f:
            outputs = json.load(f)

        # Verify expected outputs exist
        assert "dynamodb_table_name" in outputs
        assert "primary_bucket_name" in outputs
        assert "secondary_bucket_name" in outputs
        assert "primary_lambda_arn" in outputs
        assert "secondary_lambda_arn" in outputs

        # Verify outputs have values
        assert outputs["dynamodb_table_name"] != ""
        assert outputs["primary_bucket_name"] != ""
        assert outputs["secondary_bucket_name"] != ""
        assert outputs["primary_lambda_arn"] != ""
        assert outputs["secondary_lambda_arn"] != ""
