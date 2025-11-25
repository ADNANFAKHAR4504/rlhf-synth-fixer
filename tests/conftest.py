"""
Shared test fixtures for unit and integration tests
"""
import os
import json
import pytest
from cdktf import Testing
from lib.tap_stack import PaymentInfrastructureStack


@pytest.fixture(scope="session")
def environment_suffix():
    """Set environment suffix for testing"""
    original = os.environ.get('ENVIRONMENT_SUFFIX')
    os.environ['ENVIRONMENT_SUFFIX'] = 'test123'
    yield 'test123'
    if original:
        os.environ['ENVIRONMENT_SUFFIX'] = original
    else:
        os.environ.pop('ENVIRONMENT_SUFFIX', None)


@pytest.fixture(scope="session")
def stack(environment_suffix):
    """Create test stack instance - shared across all tests in session"""
    app = Testing.app()
    return PaymentInfrastructureStack(
        app,
        f'TapStacktest123',
        environment_suffix='test123',
        state_bucket=None,
        state_bucket_region='us-east-1',
        primary_region='us-east-1',
        default_tags=None
    )


@pytest.fixture(scope="session")
def synthesized_config(stack):
    """Synthesize stack once and cache the result - shared across all tests"""
    synthesized = Testing.synth(stack)
    return json.loads(synthesized)
