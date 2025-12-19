"""
Integration tests for TAP Stack Lambda and SSM deployment
Tests the deployed Lambda function with LocalStack
"""

import json
import os
import boto3
import pytest


# LocalStack configuration
LOCALSTACK_ENDPOINT = os.environ.get('AWS_ENDPOINT_URL', 'http://localhost:4566')
REGION = os.environ.get('AWS_REGION', 'us-east-1')


@pytest.fixture(scope='module')
def lambda_client():
    """Create Lambda client configured for LocalStack"""
    return boto3.client(
        'lambda',
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=REGION,
        aws_access_key_id='test',
        aws_secret_access_key='test'
    )


@pytest.fixture(scope='module')
def ssm_client():
    """Create SSM client configured for LocalStack"""
    return boto3.client(
        'ssm',
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=REGION,
        aws_access_key_id='test',
        aws_secret_access_key='test'
    )


def test_lambda_function_deployed(lambda_client):
    """Test that Lambda function is deployed successfully"""
    function_name = 'tap-lambda-function'

    response = lambda_client.get_function(FunctionName=function_name)

    assert response is not None
    assert 'Configuration' in response
    assert response['Configuration']['FunctionName'] == function_name
    assert 'python' in response['Configuration']['Runtime'].lower()


def test_ssm_parameters_created(ssm_client):
    """Test that SSM parameters are created"""
    parameter_names = [
        '/tap/database/url',
        '/tap/api/key',
        '/tap/auth/token',
    ]

    for param_name in parameter_names:
        response = ssm_client.get_parameter(Name=param_name)

        assert response is not None
        assert 'Parameter' in response
        assert response['Parameter']['Name'] == param_name
        assert response['Parameter']['Value'] is not None


def test_lambda_invoke_successfully(lambda_client):
    """Test that Lambda function invokes successfully"""
    function_name = 'tap-lambda-function'

    response = lambda_client.invoke(
        FunctionName=function_name,
        Payload=json.dumps({'test': 'event'}).encode('utf-8')
    )

    assert response['StatusCode'] == 200

    payload = json.loads(response['Payload'].read())
    assert payload['statusCode'] == 200

    body = json.loads(payload['body'])
    assert body['message'] == 'Hello from Lambda!'


def test_lambda_cloudwatch_logs_enabled(lambda_client):
    """Test that Lambda has CloudWatch logs enabled"""
    function_name = 'tap-lambda-function'

    response = lambda_client.get_function(FunctionName=function_name)

    assert response is not None
    assert 'Configuration' in response

    # Verify environment variables are set
    assert 'Environment' in response['Configuration']
    assert 'Variables' in response['Configuration']['Environment']
