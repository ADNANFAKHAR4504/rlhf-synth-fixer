"""
Pytest configuration specifically for unit tests
Mocks all AWS calls to avoid requiring credentials
"""
import pytest
from unittest.mock import patch


@pytest.fixture(scope="function")
def mock_backend_setup():
    """Mock the setup_backend_infrastructure method to avoid real AWS calls during unit tests"""
    with patch('lib.tap_stack.TapStack.setup_backend_infrastructure', return_value=None):
        yield


@pytest.fixture(scope="function")
def mock_lambda_bundle():
    """Mock the bundle_lambda_code method to avoid creating actual zip files during unit tests"""
    # Return tuple: (zip_path, source_hash)
    with patch('lib.tap_stack.TapStack.bundle_lambda_code', return_value=('lambda_function.zip', 'mockhash123')):
        yield

