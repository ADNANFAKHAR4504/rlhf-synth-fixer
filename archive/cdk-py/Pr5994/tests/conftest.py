"""
Pytest configuration and fixtures for TapStack tests.
"""

import pytest
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create a CDK app for testing."""
    return cdk.App()


@pytest.fixture
def stack(app):
    """Create a TapStack instance for testing."""
    props = TapStackProps(environment_suffix="test")
    return TapStack(app, "TestTapStack", props=props)


@pytest.fixture
def stack_with_custom_suffix(app):
    """Create a TapStack instance with custom environment suffix."""
    props = TapStackProps(environment_suffix="prod")
    return TapStack(app, "TestTapStackProd", props=props)


@pytest.fixture
def stack_with_default_suffix(app):
    """Create a TapStack instance with default environment suffix."""
    return TapStack(app, "TestTapStackDefault")

