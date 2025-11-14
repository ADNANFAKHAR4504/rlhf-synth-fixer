#!/usr/bin/env python3
"""
Pytest configuration for all tests.

Provides:
1. AWS environment setup for integration tests (moto server credentials)
2. Prevents duplicate --cov argument conflicts for unit tests
"""

import os
import pytest


def pytest_load_initial_conftests(early_config, parser, args):
    """
    Hook called before pytest.ini addopts are processed.

    Removes addopts from pytest.ini to prevent duplicate --cov arguments
    when the Pipfile command already specifies them.

    This prevents: argparse.ArgumentError: argument --cov: conflicting option string
    """
    # Clear the addopts from ini file to prevent duplication
    if hasattr(early_config, 'inicfg') and early_config.inicfg:
        if 'addopts' in early_config.inicfg:
            # Clear addopts to prevent duplicate --cov registration
            early_config.inicfg['addopts'] = ''


@pytest.fixture(scope="session", autouse=True)
def setup_aws_environment():
    """
    Automatically configure AWS environment variables for all tests.
    Sets up AWS credentials and endpoint URL for moto server integration.
    """
    if not os.environ.get("AWS_ENDPOINT_URL"):
        os.environ["AWS_ENDPOINT_URL"] = "http://localhost:5001"
    if not os.environ.get("AWS_ACCESS_KEY_ID"):
        os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    if not os.environ.get("AWS_SECRET_ACCESS_KEY"):
        os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    if not os.environ.get("AWS_DEFAULT_REGION"):
        os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
    yield
