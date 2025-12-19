"""Unit tests for TapStack CDK infrastructure."""

import os
import pytest
from aws_cdk import App, Environment
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create a CDK app for testing."""
    return App()


@pytest.fixture
def environment_suffix():
    """Get environment suffix from env or default to test."""
    return os.environ.get('ENVIRONMENT_SUFFIX', 'test')


def test_stack_creation(app, environment_suffix):
    """Test that TapStack can be created successfully."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    assert stack is not None
    assert stack.environment_suffix == environment_suffix


def test_stack_resources(app, environment_suffix):
    """Test that TapStack creates expected resources."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    # Synthesize the stack to CloudFormation template
    template = app.synth().get_stack_by_name(stack.stack_name).template

    # Verify critical resources exist
    resources = template.get('Resources', {})

    # Check for KMS keys (at least 1 for S3, possibly 2 if RDS is created)
    kms_keys = [r for r in resources.values() if r.get('Type') == 'AWS::KMS::Key']
    assert len(kms_keys) >= 1, "Should have at least 1 KMS key (S3)"

    # Check for VPC (conditional based on environment)
    vpcs = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::VPC']
    is_localstack = os.environ.get('AWS_ENDPOINT_URL') is not None
    if not is_localstack:
        assert len(vpcs) == 1, "Should have exactly 1 VPC in non-LocalStack environment"
    else:
        assert len(vpcs) == 0, "Should not have VPC in LocalStack environment"

    # Check for S3 bucket (always created)
    s3_buckets = [r for r in resources.values() if r.get('Type') == 'AWS::S3::Bucket']
    assert len(s3_buckets) >= 1, "Should have at least 1 S3 bucket"


def test_stack_with_environment(app):
    """Test TapStack with explicit environment configuration."""
    env = Environment(account='000000000000', region='us-east-1')
    props = TapStackProps(environment_suffix='prod')

    stack = TapStack(
        app,
        "TapStackprod",
        props=props,
        env=env
    )

    assert stack is not None
    assert stack.environment_suffix == 'prod'


def test_stack_removal_policies(app, environment_suffix):
    """Test that resources have proper RemovalPolicy for LocalStack."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check KMS keys have RemovalPolicy
    kms_keys = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::KMS::Key'
    }
    for key_id, key_resource in kms_keys.items():
        assert 'DeletionPolicy' in key_resource, f"KMS key {key_id} should have DeletionPolicy"


def test_stack_encryption(app, environment_suffix):
    """Test that S3 buckets and RDS instances use encryption."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, f"TapStack{environment_suffix}", props=props)

    template = app.synth().get_stack_by_name(stack.stack_name).template
    resources = template.get('Resources', {})

    # Check S3 bucket encryption (always present)
    s3_buckets = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::S3::Bucket'
    }
    for bucket_id, bucket in s3_buckets.items():
        properties = bucket.get('Properties', {})
        assert 'BucketEncryption' in properties, f"S3 bucket {bucket_id} should have encryption"

    # Check RDS instance encryption (only if RDS is created)
    rds_instances = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::RDS::DBInstance'
    }
    is_localstack = os.environ.get('AWS_ENDPOINT_URL') is not None
    if not is_localstack:
        assert len(rds_instances) > 0, "RDS instances should be present in non-LocalStack environment"
        for instance_id, instance in rds_instances.items():
            properties = instance.get('Properties', {})
            assert properties.get('StorageEncrypted', False), f"RDS instance {instance_id} should have storage encrypted"
    else:
        assert len(rds_instances) == 0, "RDS instances should not be created in LocalStack environment"
