"""Pytest configuration and fixtures for CDKTF tests."""
import json
import os
import boto3
import pytest


@pytest.fixture(scope='session')
def stack_outputs():
    """
    Load and flatten stack outputs from deployment.

    Handles both local (flat) and CI (nested) output formats.
    """
    outputs_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'cfn-outputs',
        'flat-outputs.json'
    )

    with open(outputs_path, 'r') as f:
        raw_outputs = json.load(f)

    # Check if outputs are nested (CI format: {'StackName': {outputs}})
    # or flat (local format: {outputs})
    if isinstance(raw_outputs, dict):
        # Try to detect nested structure
        first_key = next(iter(raw_outputs.keys()))
        first_value = raw_outputs[first_key]

        # If first value is a dict with known output keys, it's nested
        if isinstance(first_value, dict) and any(
            key in first_value for key in [
                'api_endpoint', 'lambda_function_arn', 'dynamodb_table_name',
                's3_bucket_name', 'api_id', 'lambda_function_name'
            ]
        ):
            # Flatten nested structure - extract the inner dict
            return first_value

    # Already flat
    return raw_outputs


@pytest.fixture(scope='session')
def aws_clients(stack_outputs):
    """Fixture to provide AWS clients configured for the deployment region."""
    # Extract region from Lambda ARN or use default
    lambda_arn = stack_outputs.get('lambda_function_arn', '')

    if lambda_arn and ':' in lambda_arn:
        region = lambda_arn.split(':')[3]
    else:
        # Fallback to environment or default
        region = os.environ.get('AWS_REGION', 'us-east-1')

    return {
        'dynamodb': boto3.client('dynamodb', region_name=region),
        'dynamodb_resource': boto3.resource('dynamodb', region_name=region),
        's3': boto3.client('s3', region_name=region),
        'lambda': boto3.client('lambda', region_name=region),
        'apigateway': boto3.client('apigateway', region_name=region),
        'logs': boto3.client('logs', region_name=region),
        'iam': boto3.client('iam', region_name=region),
        'region': region
    }
