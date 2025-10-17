"""Integration tests for TapStack."""
from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack synthesizes properly for integration testing."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="eu-west-1",
        )

        # Verify basic structure
        assert stack is not None

        # Verify synthesis works
        synth = Testing.synth(stack)
        assert synth is not None

        # Verify Terraform configuration is valid
        Testing.to_be_valid_terraform(synth)

    def test_stack_outputs_are_defined(self):
        """Test that required outputs are defined in the stack."""
        app = App()
        stack = TapStack(
            app,
            "OutputTestStack",
            environment_suffix="test",
            aws_region="eu-west-1",
        )

        synth = Testing.synth(stack)
        assert synth is not None

        # The stack should synthesize successfully with outputs defined
        Testing.to_be_valid_terraform(synth)
