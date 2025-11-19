"""Pytest configuration for integration tests."""
import pytest


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests (require live AWS resources)"
    )

