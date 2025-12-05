"""Integration tests for PaymentProcessingStack."""
import os

from cdktf import App, Testing

from lib.main import PaymentProcessingStack


class TestPaymentProcessingIntegrationTests:
    """Payment Processing Infrastructure Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        # Set environment variables that PaymentProcessingStack reads
        os.environ["ENVIRONMENT"] = "test"
        os.environ["AWS_REGION"] = "us-east-1"

        app = App()
        stack = PaymentProcessingStack(app, "IntegrationTestStack")

        # Verify basic structure
        assert stack is not None
        assert stack.environment == "test"
        assert stack.region == "us-east-1"

    def test_stack_resources_created(self):
        """Test that essential resources are created in the stack."""
        os.environ["ENVIRONMENT"] = "test"
        os.environ["AWS_REGION"] = "us-east-1"

        app = App()
        stack = PaymentProcessingStack(app, "ResourceTestStack")

        # Verify VPC components exist
        assert stack.vpc is not None
        assert stack.private_subnets is not None
        assert len(stack.private_subnets) == 2

        # Verify database components exist
        assert stack.db_subnet_group is not None
        assert stack.db_instance is not None

        # Verify Lambda components exist
        assert stack.lambda_function is not None

        # Verify security components exist
        assert stack.log_kms_key is not None
        assert stack.db_password_secret is not None
