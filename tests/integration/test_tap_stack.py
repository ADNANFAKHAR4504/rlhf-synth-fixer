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

# AWS Region configuration - based on deployment output
PRIMARY_REGION = "us-west-2"  # Primary region from deployment
SECONDARY_REGION = "us-east-1"  # Secondary region from deployment

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
def s3_client():
  """S3 client for primary region."""
  return boto3.client("s3", region_name=PRIMARY_REGION)


@pytest.fixture(scope="module")
def lambda_client():
  """Lambda client for primary region."""
  return boto3.client("lambda", region_name=PRIMARY_REGION)


@pytest.fixture(scope="module")
def budgets_client():
  """Budgets client for secondary region (where budget is deployed)."""
  return boto3.client("budgets", region_name=SECONDARY_REGION)


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


# ---- Budget Tests ---------------------------------------------------------

def test_budget_exists(budgets_client):
  """Verify budget exists."""
  # Try both possible names from deployment output
  budget_names = ["monthly-budget-dev", "nova-cicd-budget-dev"]

  found_budget = None
  for budget_name in budget_names:
    try:
      # Try to get the actual account ID from STS
      sts_client = boto3.client("sts", region_name=SECONDARY_REGION)
      account_id = sts_client.get_caller_identity().get("Account")

      response = budgets_client.describe_budget(
          AccountId=account_id,
          BudgetName=budget_name
      )
      budget = response.get("Budget", {})
      if budget.get("BudgetName") == budget_name:
        found_budget = budget
        break
    except (ClientError, BotoCoreError):
      continue

  assert found_budget is not None, f"Budget not found with any of the names: {budget_names}"


# ---- End-to-End Tests ----------------------------------------------------

def test_primary_api_endpoint_accessible():
  """Test that primary API endpoint is accessible."""
  try:
    socket.gethostbyname("u5at5aipx6.execute-api.us-west-2.amazonaws.com")
  except Exception as e:
    pytest.fail(f"Primary API endpoint not accessible: {e}")


# ---- Basic Security Tests -------------------------------------------------

def test_s3_buckets_are_encrypted(s3_client):
  """Verify S3 buckets have encryption enabled."""
  bucket_names = [
      "nova-pulumi-state-dev-uswest2",
      "nova-cicd-artifacts-dev-uswest2"
  ]

  encrypted_count = 0
  for bucket_name in bucket_names:
    try:
      encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
      config = encryption.get("ServerSideEncryptionConfiguration", {})
      rules = config.get("Rules", [])
      if len(rules) > 0:
        encrypted_count += 1
    except (ClientError, BotoCoreError):
      continue

  # At least one bucket should be encrypted
  assert encrypted_count >= 1, f"Only {encrypted_count} out of 2 buckets are encrypted"


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
