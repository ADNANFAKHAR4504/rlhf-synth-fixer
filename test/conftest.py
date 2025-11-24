#!/usr/bin/env python3
"""
Pytest configuration and fixtures for CloudFormation EKS stack tests
Provides common fixtures for both unit and integration tests
"""

import json
import os
import pytest
from typing import Dict, Any


@pytest.fixture(scope="session")
def cfn_template() -> Dict[str, Any]:
    """Load CloudFormation template for testing"""
    template_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'lib',
        'TapStack.json'
    )
    with open(template_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="session")
def cfn_outputs() -> Dict[str, str]:
    """Load CloudFormation stack outputs if available"""
    outputs_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'cfn-outputs',
        'flat-outputs.json'
    )

    if os.path.exists(outputs_path):
        with open(outputs_path, 'r') as f:
            return json.load(f)
    return {}


@pytest.fixture(scope="session")
def aws_region() -> str:
    """Get AWS region from environment or default"""
    region_file = os.path.join(
        os.path.dirname(__file__),
        '..',
        'lib',
        'AWS_REGION'
    )

    if os.path.exists(region_file):
        with open(region_file, 'r') as f:
            return f.read().strip()

    return os.environ.get('AWS_REGION', 'us-east-1')


@pytest.fixture
def template_resources(cfn_template: Dict[str, Any]) -> Dict[str, Any]:
    """Extract resources from template"""
    return cfn_template.get('Resources', {})


@pytest.fixture
def template_parameters(cfn_template: Dict[str, Any]) -> Dict[str, Any]:
    """Extract parameters from template"""
    return cfn_template.get('Parameters', {})


@pytest.fixture
def template_outputs(cfn_template: Dict[str, Any]) -> Dict[str, Any]:
    """Extract outputs from template"""
    return cfn_template.get('Outputs', {})


def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test (requires deployed stack)"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test (template validation only)"
    )


def pytest_collection_modifyitems(config, items):
    """Automatically mark tests based on their location"""
    for item in items:
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
