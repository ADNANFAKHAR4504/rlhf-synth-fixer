"""Unit tests for Lambda handler function."""
import os
import sys
import json

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Add lambda directory to path for handler imports
lambda_dir = os.path.join(project_root, "lib", "lambda")
sys.path.append(lambda_dir)


class TestLambdaHandler:
    """Test suite for Lambda handler function existence and structure."""

    def test_lambda_handler_module_exists(self):
        """Test that the Lambda handler module exists and can be imported."""
        import index
        assert hasattr(index, "handler")
        assert callable(index.handler)

    def test_lambda_handler_has_handle_cleanup(self):
        """Test that the Lambda handler has a cleanup handler."""
        import index
        assert hasattr(index, "handle_cleanup")
        assert callable(index.handle_cleanup)

    def test_lambda_handler_has_initialize_clients(self):
        """Test that the Lambda handler has client initialization."""
        import index
        assert hasattr(index, "initialize_clients")
        assert callable(index.initialize_clients)
