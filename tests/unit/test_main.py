"""Unit tests for FinancialTransactionStack (main.py)"""
import pytest
from cdktf import Testing, TerraformStack, App
from lib.main import FinancialTransactionStack


class TestFinancialTransactionStack:
    """Test cases for FinancialTransactionStack"""

    @pytest.fixture
    def app(self):
        """Create CDKTF app for testing"""
        return Testing.app()

    @pytest.fixture
    def stack(self, app):
        """Create FinancialTransactionStack for testing"""
        return FinancialTransactionStack(app, "test-stack", "test")

    def test_stack_initialization(self, stack):
        """Test FinancialTransactionStack initializes correctly"""
        assert stack is not None
        assert isinstance(stack, TerraformStack)

    def test_stack_with_default_environment(self, app):
        """Test stack uses default environment suffix when not provided"""
        stack = FinancialTransactionStack(app, "test-stack-default")
        assert stack is not None
        assert stack.environment_suffix == "dev"

    def test_stack_with_custom_environment(self, app):
        """Test stack accepts custom environment suffix"""
        stack = FinancialTransactionStack(app, "test-stack-custom", "production")
        assert stack is not None
        assert stack.environment_suffix == "production"

    def test_stack_synthesizes(self, stack):
        """Test stack synthesizes without errors"""
        synth = Testing.synth(stack)
        assert synth is not None

    def test_stack_with_different_environments(self, app):
        """Test stack works with various environment suffixes"""
        environments = ["dev", "staging", "production", "test"]
        for i, env in enumerate(environments):
            stack = FinancialTransactionStack(app, f"test-stack-{i}", env)
            assert stack is not None
            assert stack.environment_suffix == env
