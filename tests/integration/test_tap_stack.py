# tests/integration/test_tap_stack.py
import os
import socket

import boto3
import pytest
from botocore.exceptions import BotoCoreError, ClientError

REGION = os.getenv("AWS_REGION") or os.getenv(
    "AWS_DEFAULT_REGION") or "us-east-1"

# ---- Helpers ---------------------------------------------------------------


def _elb_client():
  return boto3.client("elbv2", region_name=REGION)


def _rds_client():
  return boto3.client("rds", region_name=REGION)


def _sns_client():
  return boto3.client("sns", region_name=REGION)


def _sm_client():
  return boto3.client("secretsmanager", region_name=REGION)


def _first(predicate, iterable):
  for x in iterable:
    if predicate(x):
      return x
  return None

# ---- Tests -----------------------------------------------------------------


def test_alb_exists_and_resolves():
  """
  Find the ALB created by the stack:
    - Name starts with 'dev-alb-'
    - DNS resolves
    - ALB is 'application' type (sanity)
  """
  elb = _elb_client()

  # List all LBs (handle pagination)
  lbs = []
  marker = None
  while True:
    kwargs = {}
    if marker:
      kwargs["Marker"] = marker
    resp = elb.describe_load_balancers(**kwargs)
    lbs.extend(resp.get("LoadBalancers", []))
    marker = resp.get("NextMarker")
    if not marker:
      break

  cand = _first(lambda lb: lb.get(
      "LoadBalancerName", "").startswith("dev-alb-"), lbs)
  assert cand is not None, "Could not find an ALB whose name starts with 'dev-alb-'"

  dns = cand.get("DNSName")
  assert dns, "ALB DNSName is empty"
  # DNS must resolve
  try:
    socket.gethostbyname(dns)
  except Exception as e:
    pytest.fail(f"ALB DNS '{dns}' did not resolve: {e}")

  # Basic sanity on type/scheme
  assert cand.get(
      "Type") == "application", f"Expected application ALB, got {cand.get('Type')}"
  assert cand.get("Scheme") in ("internet-facing",
                                "internal"), "Unexpected ALB scheme"


def test_secrets_exist():
  """
  Ensure the two Secrets Manager secrets exist.
  Names are prefixed and include random suffixes:
    - dev-db-secret-*
    - dev-app-config-*
  """
  sm = _sm_client()

  # Paginator for list_secrets
  paginator = sm.get_paginator("list_secrets")
  found_db = None
  found_app = None

  try:
    for page in paginator.paginate():
      for s in page.get("SecretList", []):
        name = s.get("Name", "")
        if name.startswith("dev-db-secret-"):
          found_db = s
        if name.startswith("dev-app-config-"):
          found_app = s
      if found_db and found_app:
        break
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"Failed listing secrets: {e}")

  assert found_db is not None, "Secret 'dev-db-secret-*' not found"
  assert found_app is not None, "Secret 'dev-app-config-*' not found"

  # Describe to ensure they are accessible and active
  for s in (found_db, found_app):
    try:
      desc = sm.describe_secret(SecretId=s["ARN"])
      assert desc.get("ARN"), "describe_secret missing ARN"
      assert not desc.get(
          "DeletedDate"), f"Secret {s['Name']} is scheduled for deletion"
    except (ClientError, BotoCoreError) as e:
      pytest.fail(f"describe_secret failed for {s.get('Name')}: {e}")


def test_rds_secure_config():
  """
  Validate RDS instance security posture for 'dev-db':
    - Exists
    - Not publicly accessible
    - Storage encrypted with KMS
    - Has a subnet group
  """
  rds = _rds_client()
  db_id = "dev-db"
  try:
    resp = rds.describe_db_instances(DBInstanceIdentifier=db_id)
  except rds.exceptions.DBInstanceNotFoundFault:
    pytest.fail(f"RDS instance '{db_id}' not found")
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_db_instances error: {e}")

  dbs = resp.get("DBInstances", [])
  assert dbs, f"No DBInstances returned for '{db_id}'"
  db = dbs[0]

  assert db.get("DBInstanceIdentifier") == db_id
  assert not db.get("PubliclyAccessible",
                    True), "RDS must not be publicly accessible"
  assert db.get("StorageEncrypted", False), "RDS storage must be encrypted"
  assert db.get("KmsKeyId"), "RDS should reference a KMS key"
  assert db.get("DBSubnetGroup", {}).get(
      "DBSubnetGroupName"), "RDS must be in a subnet group"


def test_sns_topic_exists():
  """
  Confirm the SNS topic 'dev-infra-alerts' exists.
  """
  sns = _sns_client()

  # list_topics is paginated
  paginator = sns.get_paginator("list_topics")
  arn = None
  try:
    for page in paginator.paginate():
      for t in page.get("Topics", []):
        t_arn = t.get("TopicArn", "")
        if t_arn.endswith(":dev-infra-alerts"):
          arn = t_arn
          break
      if arn:
        break
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"Failed listing SNS topics: {e}")

  assert arn, "SNS topic 'dev-infra-alerts' not found"

  # Basic attributes check (confirms topic is accessible)
  try:
    attrs = sns.get_topic_attributes(TopicArn=arn).get("Attributes", {})
    assert "Owner" in attrs and "Policy" in attrs, "Unexpected SNS topic attributes"
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"get_topic_attributes failed for {arn}: {e}")
