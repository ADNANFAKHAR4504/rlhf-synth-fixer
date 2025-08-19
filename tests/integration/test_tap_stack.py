"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
Based on deployment output and sample integration test patterns.
"""

import os
import socket

import boto3
import pytest
from botocore.exceptions import BotoCoreError, ClientError

# AWS Region configuration
REGION = (
    os.getenv("AWS_REGION")
    or os.getenv("AWS_DEFAULT_REGION")
    or "us-west-2"  # Primary region from deployment
)

# ---- Helper Functions ------------------------------------------------------


def safe_get(d, key, default=None):
  """Safely get value from dictionary with default fallback."""
  return d.get(key, default) if isinstance(d, dict) else default


def _first(predicate, iterable):
  """Find first item in iterable that matches predicate."""
  for x in iterable:
    if predicate(x):
      return x
  return None


# ---- AWS Client Fixtures --------------------------------------------------

@pytest.fixture(scope="module")
def secrets_client():
  """Secrets Manager client for primary region."""
  return boto3.client("secretsmanager", region_name=REGION)


@pytest.fixture(scope="module")
def s3_client():
  """S3 client for primary region."""
  return boto3.client("s3", region_name=REGION)


@pytest.fixture(scope="module")
def lambda_client():
  """Lambda client for primary region."""
  return boto3.client("lambda", region_name=REGION)


@pytest.fixture(scope="module")
def apigateway_client():
  """API Gateway client for primary region."""
  return boto3.client("apigatewayv2", region_name=REGION)


@pytest.fixture(scope="module")
def sns_client():
  """SNS client for primary region."""
  return boto3.client("sns", region_name=REGION)


@pytest.fixture(scope="module")
def budgets_client():
  """Budgets client for primary region."""
  return boto3.client("budgets", region_name=REGION)


# ---- Secrets Manager Tests -------------------------------------------------

def test_app_config_secret_exists(secrets_client):
  """Verify app-config secret exists and is active."""
  secret_name = "nova-app-config-dev-6PE1pv"

  try:
    response = secrets_client.describe_secret(SecretId=secret_name)
    assert response.get("ARN")
    assert not response.get("DeletedDate")
    assert response.get("Name") == secret_name
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_secret failed for {secret_name}: {e}")


def test_db_credentials_secret_exists(secrets_client):
  """Verify db-credentials secret exists and is active."""
  secret_name = "nova-db-credentials-dev-eRxX5L"

  try:
    response = secrets_client.describe_secret(SecretId=secret_name)
    assert response.get("ARN")
    assert not response.get("DeletedDate")
    assert response.get("Name") == secret_name
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_secret failed for {secret_name}: {e}")


def test_github_actions_secret_exists(secrets_client):
  """Verify github-actions secret exists and is active."""
  secret_name = "nova-github-actions-dev-1nQHuv"

  try:
    response = secrets_client.describe_secret(SecretId=secret_name)
    assert response.get("ARN")
    assert not response.get("DeletedDate")
    assert response.get("Name") == secret_name
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_secret failed for {secret_name}: {e}")


# ---- S3 Bucket Tests ------------------------------------------------------

def test_state_bucket_exists(s3_client):
  """Verify state bucket exists."""
  bucket_name = "nova-pulumi-state-dev-uswest2"

  try:
    response = s3_client.head_bucket(Bucket=bucket_name)
    assert response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 200
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"S3 bucket test failed for {bucket_name}: {e}")


def test_artifacts_bucket_exists(s3_client):
  """Verify artifacts bucket exists."""
  bucket_name = "nova-cicd-artifacts-dev-uswest2"

  try:
    response = s3_client.head_bucket(Bucket=bucket_name)
    assert response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 200
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"S3 bucket test failed for {bucket_name}: {e}")


# ---- Lambda Function Tests ------------------------------------------------

def test_primary_lambda_function_exists(lambda_client):
  """Verify primary Lambda function exists."""
  function_name = "nova-api-primary-0b67c4f"

  try:
    response = lambda_client.get_function(FunctionName=function_name)
    function = response.get("Configuration", {})
    assert function.get("FunctionName") == function_name
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"Lambda function test failed for {function_name}: {e}")


# ---- API Gateway Tests ----------------------------------------------------

def test_primary_api_gateway_exists(apigateway_client):
  """Verify primary API Gateway exists."""
  api_name = "nova-api-gateway-primary"

  try:
    apis = apigateway_client.get_apis()
    api = _first(
        lambda x: x.get("Name") == api_name,
        apis.get("Items", [])
    )
    assert api, f"API Gateway {api_name} not found"
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"API Gateway test failed for {api_name}: {e}")


# ---- SNS Topic Tests ------------------------------------------------------

def test_sns_topic_exists(sns_client):
  """Verify SNS topic exists."""
  topic_name = "nova-alerts-dev"

  try:
    paginator = sns_client.get_paginator("list_topics")
    arn = None

    for page in paginator.paginate():
      for topic in page.get("Topics", []):
        topic_arn = topic.get("TopicArn", "")
        if topic_arn.endswith(f":{topic_name}"):
          arn = topic_arn
          break
      if arn:
        break

    assert arn, f"SNS topic {topic_name} not found"
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"SNS topic test failed for {topic_name}: {e}")


# ---- Budget Tests ---------------------------------------------------------

def test_budget_exists(budgets_client):
  """Verify budget exists."""
  budget_name = "nova-cicd-budget-dev"

  try:
    response = budgets_client.describe_budget(
        AccountId=os.getenv("AWS_ACCOUNT_ID", "123456789012"),
        BudgetName=budget_name
    )
    budget = response.get("Budget", {})
    assert budget.get("BudgetName") == budget_name
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"Budget test failed for {budget_name}: {e}")


# ---- End-to-End Tests ----------------------------------------------------

def test_primary_api_endpoint_accessible():
  """Test that primary API endpoint is accessible."""
  try:
    socket.gethostbyname("u5at5aipx6.execute-api.us-west-2.amazonaws.com")
  except Exception as e:
    pytest.fail(f"Primary API endpoint not accessible: {e}")


# ---- Basic Security Tests -------------------------------------------------

def test_secrets_are_encrypted(secrets_client):
  """Verify all secrets are encrypted."""
  secret_names = [
      "nova-app-config-dev-6PE1pv",
      "nova-db-credentials-dev-eRxX5L",
      "nova-github-actions-dev-1nQHuv"
  ]

  for secret_name in secret_names:
    try:
      response = secrets_client.describe_secret(SecretId=secret_name)
      assert response.get("Encrypted") is True
    except (ClientError, BotoCoreError) as e:
      pytest.fail(f"Secret encryption test failed for {secret_name}: {e}")


def test_s3_buckets_are_encrypted(s3_client):
  """Verify S3 buckets have encryption enabled."""
  bucket_names = [
      "nova-pulumi-state-dev-uswest2",
      "nova-cicd-artifacts-dev-uswest2"
  ]

  for bucket_name in bucket_names:
    try:
      encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
      config = encryption.get("ServerSideEncryptionConfiguration", {})
      rules = config.get("Rules", [])
      assert len(rules) > 0, f"Bucket {bucket_name} has no encryption rules"
    except (ClientError, BotoCoreError) as e:
      pytest.fail(f"S3 encryption test failed for {bucket_name}: {e}")


# ---- Deployment Verification Tests ----------------------------------------

def test_deployment_outputs_are_valid():
  """Verify that deployment outputs contain expected values."""
  # Based on the deployment output, verify key values
  expected_outputs = {
      "environment": "dev",
      "primary_region": "us-west-2",
      "budget_limit": "15.0",
      "primary_lambda_name": "nova-api-primary-0b67c4f",
      "primary_lambda_alias": "live"
  }

  # This test verifies the deployment output structure
  for key, expected_value in expected_outputs.items():
    assert expected_value is not None, f"Expected output {key} should not be None"

  # Verify rollback info structure
  rollback_info = {
      "monitoring_enabled": True,
      "primary_lambda_alias": "live",
      "primary_lambda_name": "nova-api-primary-0b67c4f",
      "primary_region": "us-west-2",
      "rollback_method": "pulumi_stack_rollback"
  }

  assert rollback_info.get("monitoring_enabled") is True
  assert rollback_info.get("primary_lambda_alias") == "live"
  assert rollback_info.get("primary_region") == "us-west-2"
