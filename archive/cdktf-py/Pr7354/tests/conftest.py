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


@pytest.fixture(scope="session")
def stack_outputs():
    """Load stack outputs from deployment for integration tests"""
    outputs_file = os.getenv('STACK_OUTPUTS_FILE', 'cfn-outputs/flat-outputs.json')
    
    # Try multiple possible output file locations
    possible_paths = [
        outputs_file,
        'cfn-outputs/flat-outputs.json',
        '../cfn-outputs/flat-outputs.json',
        '/home/runner/work/iac-test-automations/iac-test-automations/cfn-outputs/flat-outputs.json'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                outputs = json.load(f)
                
                # Handle nested structure: {'TapStackpr7110': {...}}
                # Extract the inner dictionary
                if isinstance(outputs, dict):
                    # Check if outputs has a single key that looks like a stack name
                    keys = list(outputs.keys())
                    if len(keys) == 1 and keys[0].startswith('TapStack'):
                        # Return the nested outputs
                        return outputs[keys[0]]
                    # If already flat, return as-is
                    return outputs
                return outputs
    
    # If no outputs file found, return empty dict for local testing
    return {}
