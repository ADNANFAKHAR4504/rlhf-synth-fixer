"""Integration tests for TapStack."""
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
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        # Verify basic structure
        assert stack is not None
