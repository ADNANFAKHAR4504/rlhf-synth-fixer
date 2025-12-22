"""
Unit tests for TAP Stack configuration
Tests stack properties and configuration without external dependencies
"""

import os
import pytest
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


def test_tap_stack_creation():
    """Test that TapStack can be instantiated"""
    app = cdk.App()

    stack = TapStack(
        app,
        "TestStack",
        props=TapStackProps(environment_suffix='test'),
        env=cdk.Environment(account='000000000000', region='us-east-1')
    )

    assert stack is not None
    assert isinstance(stack, cdk.Stack)


def test_tap_stack_with_default_props():
    """Test TapStack creation with default props"""
    app = cdk.App()

    stack = TapStack(
        app,
        "TestStack",
        env=cdk.Environment(account='000000000000', region='us-east-1')
    )

    assert stack is not None


def test_tap_stack_synthesizes():
    """Test that the stack can be synthesized without errors"""
    app = cdk.App()

    stack = TapStack(
        app,
        "TestStack",
        props=TapStackProps(environment_suffix='test'),
        env=cdk.Environment(account='000000000000', region='us-east-1')
    )

    # Synthesize the stack
    template = app.synth()

    assert template is not None


def test_tap_stack_has_lambda_function():
    """Test that stack creates a Lambda function"""
    app = cdk.App()

    stack = TapStack(
        app,
        "TestStack",
        props=TapStackProps(environment_suffix='test'),
        env=cdk.Environment(account='000000000000', region='us-east-1')
    )

    # Verify lambda_function attribute exists
    assert hasattr(stack, 'lambda_function')
    assert stack.lambda_function is not None


def test_tap_stack_has_ssm_parameters():
    """Test that stack creates SSM parameters"""
    app = cdk.App()

    stack = TapStack(
        app,
        "TestStack",
        props=TapStackProps(environment_suffix='test'),
        env=cdk.Environment(account='000000000000', region='us-east-1')
    )

    # Verify SSM parameter attributes exist
    assert hasattr(stack, 'database_url_param')
    assert hasattr(stack, 'api_key_param')
    assert hasattr(stack, 'secret_token_param')

    assert stack.database_url_param is not None
    assert stack.api_key_param is not None
    assert stack.secret_token_param is not None


def test_tap_stack_props():
    """Test TapStackProps configuration"""
    props = TapStackProps(environment_suffix='dev')

    assert props.environment_suffix == 'dev'


def test_tap_stack_props_default():
    """Test TapStackProps with None suffix"""
    props = TapStackProps(environment_suffix=None)

    assert props.environment_suffix is None
