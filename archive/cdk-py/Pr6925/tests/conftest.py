"""Pytest configuration for all tests"""

import pytest


def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test requiring AWS resources"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to handle integration tests"""
    for item in items:
        # Mark all tests in integration folder as integration tests
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
