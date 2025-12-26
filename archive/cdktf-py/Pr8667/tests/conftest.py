"""
Pytest configuration and fixtures for TapStack tests.
"""
import os
import sys
import pytest

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture(autouse=True)
def clean_environment():
    """Clean environment variables before and after each test."""
    # Store original value
    original_endpoint = os.environ.get("AWS_ENDPOINT_URL")
    
    yield
    
    # Restore original value
    if original_endpoint:
        os.environ["AWS_ENDPOINT_URL"] = original_endpoint
    else:
        os.environ.pop("AWS_ENDPOINT_URL", None)

