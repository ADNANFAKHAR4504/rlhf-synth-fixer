"""Test configuration and fixtures for TapStack unit tests."""

import pytest
import aws_cdk as cdk
from aws_cdk import App
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture(scope="function")
def app():
    """Create a new CDK app for each test."""
    return App()


@pytest.fixture(scope="function") 
def stack(app):
    """Create a TapStack with default properties for testing."""
    return TapStack(app, "TestTapStack")


@pytest.fixture(scope="function")
def stack_with_props(app):
    """Create a TapStack with custom properties for testing."""
    props = TapStackProps(environment_suffix="test")
    return TapStack(app, "TestTapStackWithProps", props=props)


@pytest.fixture(scope="function")
def stack_prod(app):
    """Create a TapStack with production environment for testing."""
    props = TapStackProps(environment_suffix="prod")
    return TapStack(app, "TestTapStackProd", props=props)


@pytest.fixture
def synthesized_template(stack):
    """Get the synthesized CloudFormation template for assertions."""
    return cdk.assertions.Template.from_stack(stack)


@pytest.fixture
def synthesized_template_with_props(stack_with_props):
    """Get the synthesized CloudFormation template with props for assertions."""
    return cdk.assertions.Template.from_stack(stack_with_props)