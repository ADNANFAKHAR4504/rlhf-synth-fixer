"""Pytest configuration and fixtures for FinOps Analyzer tests."""

import os
import sys
import pytest

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

# Set dummy AWS credentials for moto
os.environ.setdefault('AWS_ACCESS_KEY_ID', 'testing')
os.environ.setdefault('AWS_SECRET_ACCESS_KEY', 'testing')
os.environ.setdefault('AWS_SECURITY_TOKEN', 'testing')
os.environ.setdefault('AWS_SESSION_TOKEN', 'testing')
os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')


@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
    os.environ['AWS_SECURITY_TOKEN'] = 'testing'
    os.environ['AWS_SESSION_TOKEN'] = 'testing'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'


@pytest.fixture
def cleanup_report():
    """Clean up any generated report files after test."""
    yield
    if os.path.exists('finops_report.json'):
        os.remove('finops_report.json')

