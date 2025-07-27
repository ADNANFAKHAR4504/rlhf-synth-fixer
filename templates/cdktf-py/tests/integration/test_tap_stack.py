"""Integration tests for TapStack."""
from cdktf import App, Testing

from lib.tap_stack import TapStack


# Setup CDKTF testing environment
Testing.setup_jest()


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that Terraform configuration synthesizes properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)

        # Verify basic structure
        assert synthesized is not None
        assert "resource" in synthesized
        assert "terraform" in synthesized

    def test_s3_backend_configuration(self):
        """Test S3 backend configuration is present."""
        app = App()
        stack = TapStack(
            app,
            "BackendTestStack",
            state_bucket="test-state-bucket",
            state_bucket_region="us-west-2",
        )
        synthesized = Testing.synth(stack)

        # Verify S3 backend configuration
        terraform_config = synthesized.get("terraform", {})
        backend_config = terraform_config.get("backend", {})
        assert "s3" in backend_config
