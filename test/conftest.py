"""
Pytest configuration for infrastructure testing
"""

import pytest

def pytest_configure(config):
    """Configure pytest for infrastructure testing"""
    config.addinivalue_line(
        "markers", "infrastructure: mark test as infrastructure configuration test"
    )
