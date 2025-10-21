"""Unit tests for Secrets stack."""

import pytest
from cdktf import Testing, TerraformStack
from lib.secrets_stack import SecretsStack


class TestSecretsStack:
    """Test Secrets stack creation and configuration."""

    @pytest.fixture
    def synth_stack(self):
        """Create a synthesized stack for testing."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        secrets_stack = SecretsStack(
            stack,
            "test-secrets",
            environment_suffix="test"
        )
        return Testing.synth(stack)

    def test_db_secret_created(self, synth_stack):
        """Test that database secret is created."""
        secret = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_secretsmanager_secret",
            {
                "name": "pc/db-test",
                "description": "Database connection string for product catalog"
            }
        )
        assert secret is not None

    def test_api_secret_created(self, synth_stack):
        """Test that API secret is created."""
        secret = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_secretsmanager_secret",
            {
                "name": "pc/api-test",
                "description": "API keys for product catalog service"
            }
        )
        assert secret is not None

    def test_secret_versions_created(self, synth_stack):
        """Test that secret versions are created."""
        secret_version = Testing.to_have_resource(
            synth_stack,
            "aws_secretsmanager_secret_version"
        )
        assert secret_version is not None

    def test_stack_properties(self):
        """Test that stack properties are accessible."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        secrets_stack = SecretsStack(
            stack,
            "test-secrets",
            environment_suffix="test"
        )

        # Test that properties exist
        assert secrets_stack.db_secret_arn is not None
        assert secrets_stack.api_secret_arn is not None
