"""Unit tests for TAP Stack."""
import os
import sys
import json
import pytest
from cdktf import Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


# Use real configuration values from the project
REAL_ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "dev")
REAL_AWS_REGION = os.getenv("AWS_REGION", "us-east-1") 
REAL_STATE_BUCKET = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
REAL_STATE_BUCKET_REGION = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
REAL_REPOSITORY = os.getenv("REPOSITORY", "iac-test-automations")
REAL_COMMIT_AUTHOR = os.getenv("COMMIT_AUTHOR", "test-user")

REAL_DEFAULT_TAGS = {
    "tags": {
        "Environment": REAL_ENVIRONMENT_SUFFIX,
        "Repository": REAL_REPOSITORY,
        "Author": REAL_COMMIT_AUTHOR,
    }
}


def test_tap_stack_creates_resources():
    """Test that TAP stack creates expected resources with real configuration."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        state_bucket=REAL_STATE_BUCKET,
        state_bucket_region=REAL_STATE_BUCKET_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    assert synthesized is not None
    
    # Verify that the synthesized JSON contains expected structure
    synthesized_json = json.dumps(synthesized)
    assert "resource" in synthesized_json
    assert "data" in synthesized_json


def test_stack_has_aws_provider():
    """Test that stack configures AWS provider with real region."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    # Verify provider configuration exists with real region
    assert "provider" in synthesized
    synthesized_dict = json.loads(synthesized)
    provider_config = synthesized_dict.get("provider", {})
    aws_provider = provider_config.get("aws", [])
    assert aws_provider is not None and len(aws_provider) > 0
    # Verify the real AWS region is configured
    assert REAL_AWS_REGION in synthesized


def test_stack_uses_environment_suffix():
    """Test that resources use real environment suffix."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    # Verify real environment suffix is used in resource names
    synthesized_str = json.dumps(synthesized)
    assert REAL_ENVIRONMENT_SUFFIX in synthesized_str
    
    # Verify tags contain real environment values
    assert REAL_REPOSITORY in synthesized_str
    assert REAL_COMMIT_AUTHOR in synthesized_str


def test_stack_configures_encryption():
    """Test that encryption is configured for resources with real values."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    synthesized_str = json.dumps(synthesized).lower()
    # Verify KMS and encryption settings are present
    assert "kms" in synthesized_str or "encryption" in synthesized_str
    # Verify encryption is enabled on resources
    assert "server_side_encryption_configuration" in synthesized_str or "encrypt" in synthesized_str


def test_stack_creates_kinesis_stream():
    """Test that Kinesis stream is created with real configuration."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    synthesized_str = json.dumps(synthesized).lower()
    # Verify Kinesis stream exists with proper naming
    assert "kinesis_stream" in synthesized_str
    assert REAL_ENVIRONMENT_SUFFIX.lower() in synthesized_str


def test_stack_creates_dynamodb_resources():
    """Test that DynamoDB table is created with proper configuration."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    synthesized_str = json.dumps(synthesized).lower()
    # Verify DynamoDB resources exist
    assert "dynamodb_table" in synthesized_str
    assert "sensor_id" in synthesized_str  # Hash key
    assert "timestamp" in synthesized_str  # Range key
    assert "pay_per_request" in synthesized_str  # Billing mode


def test_stack_creates_s3_buckets():
    """Test that S3 buckets are created with proper configuration."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    synthesized_str = json.dumps(synthesized).lower()
    # Verify S3 buckets exist with proper naming convention
    assert "s3_bucket" in synthesized_str
    # Verify bucket versioning and encryption
    assert "versioning" in synthesized_str or "bucket_versioning" in synthesized_str


def test_stack_creates_lambda_function():
    """Test that Lambda function is created with real runtime configuration."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    synthesized_str = json.dumps(synthesized).lower()
    # Verify Lambda function exists with proper configuration
    assert "lambda_function" in synthesized_str
    assert "runtime" in synthesized_str
    assert "handler" in synthesized_str


def test_stack_creates_secrets_manager():
    """Test that Secrets Manager secret is created with proper configuration."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    synthesized_str = json.dumps(synthesized).lower()
    # Verify Secrets Manager secret exists
    assert "secretsmanager_secret" in synthesized_str
    # Verify secret has proper configuration
    assert "description" in synthesized_str


def test_stack_output_values():
    """Test that stack produces expected output values."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        state_bucket=REAL_STATE_BUCKET,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    # Verify outputs section exists
    assert "output" in synthesized or "//outputs" in json.dumps(synthesized)


def test_stack_iam_roles_and_policies():
    """Test that proper IAM roles and policies are created."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        default_tags=REAL_DEFAULT_TAGS
    )

    synthesized = Testing.synth(stack)
    synthesized_str = json.dumps(synthesized).lower()
    # Verify IAM resources exist
    assert "iam_role" in synthesized_str
    assert "iam_policy" in synthesized_str or "iam_role_policy" in synthesized_str
    # Verify assume role policy exists
    assert "assume_role_policy" in synthesized_str


def test_stack_has_s3_backend():
    """Test that S3 backend is configured with real bucket."""
    app = Testing.app()
    stack = TapStack(
        app,
        f"TapStack{REAL_ENVIRONMENT_SUFFIX}",
        environment_suffix=REAL_ENVIRONMENT_SUFFIX,
        aws_region=REAL_AWS_REGION,
        state_bucket=REAL_STATE_BUCKET,
        state_bucket_region=REAL_STATE_BUCKET_REGION
    )

    synthesized = Testing.synth(stack)
    # Verify backend configuration with real values
    synthesized_str = json.dumps(synthesized)
    assert "backend" in synthesized_str.lower()
    assert REAL_STATE_BUCKET in synthesized_str
    assert REAL_STATE_BUCKET_REGION in synthesized_str


def test_stack_creates_kinesis_stream():
    """Test that Kinesis stream is created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify Kinesis stream exists
    assert "kinesis" in str(synthesized).lower()


def test_stack_creates_timestream_resources():
    """Test that DynamoDB table is created (replacing Timestream)."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify DynamoDB resources exist (replaced Timestream)
    assert "dynamodb" in str(synthesized).lower()


def test_stack_creates_s3_buckets():
    """Test that S3 buckets are created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify S3 buckets exist
    assert "s3_bucket" in str(synthesized).lower()


def test_stack_creates_lambda_function():
    """Test that Lambda function is created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify Lambda function exists
    assert "lambda" in str(synthesized).lower()


def test_stack_creates_secrets_manager():
    """Test that Secrets Manager secret is created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify Secrets Manager secret exists
    assert "secretsmanager" in str(synthesized).lower()
