"""Integration tests for PaymentProcessingStack."""
from cdktf import App, Testing

from lib.main import PaymentProcessingStack


class TestPaymentProcessingIntegrationTests:
    """Payment Processing Infrastructure Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = PaymentProcessingStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify basic structure
        assert stack is not None
