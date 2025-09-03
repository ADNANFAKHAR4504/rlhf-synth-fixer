import os
import pytest
import boto3
from botocore.exceptions import NoCredentialsError, EndpointConnectionError


@pytest.fixture(scope="session")
def aws_region():
    """Get AWS region from environment or use default"""
    return os.environ.get('AWS_REGION', 'us-east-1')


@pytest.fixture(scope="session")
def aws_credentials():
    """Verify AWS credentials are available"""
    try:
        sts_client = boto3.client('sts')
        identity = sts_client.get_caller_identity()
        print(f"✅ AWS credentials verified. Account: {identity['Account']}")
        return True
    except (NoCredentialsError, EndpointConnectionError) as e:
        pytest.skip(f"AWS credentials not available: {e}")
        return None  # This line will never be reached due to pytest.skip
    except Exception as e:
        pytest.skip(f"Failed to verify AWS credentials: {e}")
        return None  # This line will never be reached due to pytest.skip


@pytest.fixture(scope="session")
def aws_clients(aws_region, aws_credentials):
    """Provide AWS clients for testing"""
    clients = {
        'ec2': boto3.client('ec2', region_name=aws_region),
        'elbv2': boto3.client('elbv2', region_name=aws_region),
        'rds': boto3.client('rds', region_name=aws_region),
        's3': boto3.client('s3', region_name=aws_region),
        'dynamodb': boto3.client('dynamodb', region_name=aws_region),
        'cloudfront': boto3.client('cloudfront', region_name=aws_region),
        'autoscaling': boto3.client('autoscaling', region_name=aws_region),
        'iam': boto3.client('iam', region_name=aws_region),
        'logs': boto3.client('logs', region_name=aws_region),
        'sts': boto3.client('sts', region_name=aws_region)
    }
    
    yield clients
    
    # Cleanup: close HTTP sessions
    for client in clients.values():
        try:
            # Access protected member for cleanup - this is intentional
            # pylint: disable=protected-access
            client._endpoint.http_session.close()
        except Exception:  # pylint: disable=broad-except
            pass


@pytest.fixture(scope="session")
def cloudformation_outputs():
    """Load CloudFormation outputs for testing"""
    import json
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    flat_outputs_path = os.path.join(
        base_dir, '..', 'cfn-outputs', 'flat-outputs.json'
    )
    
    if os.path.exists(flat_outputs_path):
        with open(flat_outputs_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        return {}


def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "aws: mark test as requiring AWS access"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow (typically skipped in CI)"
    )


def pytest_collection_modifyitems(config, items):
    """Automatically mark integration tests with aws marker"""
    for item in items:
        if "integration" in item.nodeid:
            item.add_marker(pytest.mark.aws)
