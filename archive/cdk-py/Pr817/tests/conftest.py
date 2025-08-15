"""Pytest configuration and fixtures for TapStack tests"""

import os
import pytest
import boto3
from botocore.exceptions import ClientError

from tests.utils import load_flat_outputs, TestMetrics


def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "describe(name): mark test class with description")
    config.addinivalue_line("markers", "it(description): mark test with BDD-style description")
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "performance: mark test as performance test")
    config.addinivalue_line("markers", "disaster_recovery: mark test as disaster recovery test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line("markers", "requires_aws: mark test as requiring AWS credentials")


@pytest.fixture(scope="session")
def aws_credentials():
    """Fixture to ensure AWS credentials are available"""
    try:
        # Try to get caller identity to verify AWS credentials
        sts = boto3.client('sts')
        response = sts.get_caller_identity()
        return {
            'account_id': response.get('Account'),
            'user_id': response.get('UserId'),
            'arn': response.get('Arn')
        }
    except ClientError:
        pytest.skip("AWS credentials not configured")


@pytest.fixture(scope="session")
def cloudformation_outputs():
    """Fixture to provide CloudFormation outputs"""
    outputs = load_flat_outputs()
    if not outputs:
        pytest.skip("CloudFormation outputs not found - ensure infrastructure is deployed")
    return outputs


@pytest.fixture(scope="session")
def environment_suffix():
    """Fixture to provide environment suffix for testing"""
    return os.environ.get('ENVIRONMENT_SUFFIX', 'dev')


@pytest.fixture(scope="session")
def aws_regions():
    """Fixture to provide AWS regions used in testing"""
    return ['eu-west-2', 'eu-central-1']


@pytest.fixture(scope="session")
def aws_clients(aws_regions):
    """Fixture to provide AWS service clients for all regions"""
    clients = {}
    for region in aws_regions:
        session = boto3.Session(region_name=region)
        clients[region] = {
            'lambda': session.client('lambda'),
            's3': session.client('s3'),
            'rds': session.client('rds'),
            'ec2': session.client('ec2'),
            'sns': session.client('sns'),
            'cloudwatch': session.client('cloudwatch'),
            'kms': session.client('kms'),
            'logs': session.client('logs'),
            'sts': session.client('sts')
        }
    return clients


@pytest.fixture(scope="function")
def test_metrics():
    """Fixture to provide test metrics collection"""
    return TestMetrics()


@pytest.fixture(scope="session")
def lambda_functions(cloudformation_outputs, environment_suffix):
    """Fixture to provide Lambda function ARNs"""
    functions = {}
    
    # Extract Lambda function ARNs from outputs
    for key, value in cloudformation_outputs.items():
        if 'LambdaFunctionArn' in key and environment_suffix in key:
            if 'EUWest' in key:
                functions['eu-west-2'] = value
            elif 'EUCentral' in key:
                functions['eu-central-1'] = value
    
    return functions


@pytest.fixture(scope="session")
def s3_buckets(cloudformation_outputs, environment_suffix):
    """Fixture to provide S3 bucket names"""
    buckets = {}
    
    for key, value in cloudformation_outputs.items():
        if environment_suffix in key:
            if 'S3BucketSSES3Name' in key:
                region = 'eu-west-2' if 'EUWest' in key else 'eu-central-1'
                if region not in buckets:
                    buckets[region] = {}
                buckets[region]['sse_s3'] = value
            elif 'S3BucketSSEKMSName' in key:
                region = 'eu-west-2' if 'EUWest' in key else 'eu-central-1'
                if region not in buckets:
                    buckets[region] = {}
                buckets[region]['sse_kms'] = value
    
    return buckets


@pytest.fixture(scope="session")
def database_endpoints(cloudformation_outputs, environment_suffix):
    """Fixture to provide RDS database endpoints"""
    databases = {}
    
    for key, value in cloudformation_outputs.items():
        if 'DatabaseEndpoint' in key and environment_suffix in key:
            if 'EUWest' in key:
                databases['eu-west-2'] = value
            elif 'EUCentral' in key:
                databases['eu-central-1'] = value
    
    return databases


@pytest.fixture(scope="session")
def vpc_ids(cloudformation_outputs, environment_suffix):
    """Fixture to provide VPC IDs"""
    vpcs = {}
    
    for key, value in cloudformation_outputs.items():
        if 'VPCId' in key and environment_suffix in key:
            if 'EUWest' in key:
                vpcs['eu-west-2'] = value
            elif 'EUCentral' in key:
                vpcs['eu-central-1'] = value
    
    return vpcs


@pytest.fixture(scope="session")
def sns_topics(cloudformation_outputs, environment_suffix):
    """Fixture to provide SNS topic ARNs"""
    topics = {}
    
    for key, value in cloudformation_outputs.items():
        if 'SNSTopicArn' in key and environment_suffix in key:
            if 'EUWest' in key:
                topics['eu-west-2'] = value
            elif 'EUCentral' in key:
                topics['eu-central-1'] = value
    
    return topics


@pytest.fixture(scope="function")
def cleanup_s3_objects():
    """Fixture to clean up S3 objects created during tests"""
    created_objects = []
    
    def add_object(bucket_name, key, region='eu-west-2'):
        created_objects.append({
            'bucket': bucket_name,
            'key': key,
            'region': region
        })
    
    yield add_object
    
    # Cleanup after test
    for obj in created_objects:
        try:
            s3_client = boto3.client('s3', region_name=obj['region'])
            s3_client.delete_object(Bucket=obj['bucket'], Key=obj['key'])
        except Exception:
            pass  # Ignore cleanup errors


@pytest.fixture(scope="function")
def performance_threshold():
    """Fixture to provide performance test thresholds"""
    return {
        'lambda_cold_start_max': 5.0,  # seconds
        'lambda_warm_execution_max': 1.0,  # seconds
        'lambda_concurrent_efficiency': 0.8,  # 80% efficiency
        's3_upload_min_throughput': 1.0,  # MB/s for files > 100KB
        'cross_region_latency_max': 5.0,  # seconds
        'rto_verification_max': 30.0,  # seconds
        'rpo_replication_max': 60.0  # seconds (for testing)
    }


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on file location"""
    for item in items:
        # Add markers based on test file path
        if "unit" in item.fspath.strpath:
            item.add_marker(pytest.mark.unit)
        elif "integration" in item.fspath.strpath:
            item.add_marker(pytest.mark.integration)
            item.add_marker(pytest.mark.requires_aws)
        elif "performance" in item.fspath.strpath:
            item.add_marker(pytest.mark.performance)
            item.add_marker(pytest.mark.requires_aws)
            item.add_marker(pytest.mark.slow)
        elif "disaster_recovery" in item.fspath.strpath:
            item.add_marker(pytest.mark.disaster_recovery)
            item.add_marker(pytest.mark.requires_aws)
            item.add_marker(pytest.mark.slow)


def pytest_runtest_makereport(item, call):
    """Generate test reports with additional information"""
    if "incremental" in item.keywords:
        if call.excinfo is not None:
            parent = item.parent
            parent._previous_failed = item


def pytest_runtest_setup(item):
    """Setup for incremental tests"""
    if "incremental" in item.keywords:
        previous_failed = getattr(item.parent, "_previous_failed", None)
        if previous_failed is not None:
            pytest.xfail("previous test failed (%s)" % previous_failed.name)