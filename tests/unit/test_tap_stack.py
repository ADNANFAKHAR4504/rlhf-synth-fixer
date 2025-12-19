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

    # Check for KMS keys
    kms_keys = [r for r in resources.values() if r.get('Type') == 'AWS::KMS::Key']
    assert len(kms_keys) >= 2, "Should have at least 2 KMS keys (S3 and RDS)"

    # Check for VPC
    vpcs = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::VPC']
    assert len(vpcs) == 1, "Should have exactly 1 VPC"

    # Check for S3 bucket
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

    # Check S3 bucket encryption
    s3_buckets = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::S3::Bucket'
    }
    for bucket_id, bucket in s3_buckets.items():
        properties = bucket.get('Properties', {})
        assert 'BucketEncryption' in properties, f"S3 bucket {bucket_id} should have encryption"

    # Check RDS instance encryption
    rds_instances = {
        k: v for k, v in resources.items()
        if v.get('Type') == 'AWS::RDS::DBInstance'
    }
    for instance_id, instance in rds_instances.items():
        properties = instance.get('Properties', {})
        assert properties.get('StorageEncrypted', False), f"RDS instance {instance_id} should have storage encrypted"
