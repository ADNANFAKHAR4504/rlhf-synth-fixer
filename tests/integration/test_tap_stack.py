# tests/integration/test_tap_stack.py
import json
import os
import socket

import boto3
import pytest
from botocore.exceptions import ClientError


def safe_get(d, key, default=None):
  if isinstance(d, dict):
    return d.get(key, default)
  return default


@pytest.fixture(scope="session")
def stack_outputs():
  with open("pulumi_outputs.json") as f:
    return json.load(f)


def test_alb_exists_and_resolves(stack_outputs):
  dns = safe_get(stack_outputs, "dev_alb_dns")
  assert dns, "dev_alb_dns output missing"
  # 1) DNS resolves
  try:
    socket.gethostbyname(dns)
  except Exception as e:
    pytest.fail(f"ALB DNS {dns} did not resolve: {e}")
  # 2) ALB registered in AWS
  elb = boto3.client("elbv2", region_name="us-east-1")
  try:
    resp = elb.describe_load_balancers(Names=[dns.split(".")[0]])
    lbs = resp.get("LoadBalancers", [])
    assert lbs, f"ALB {dns} not found in AWS"
  except ClientError as e:
    pytest.fail(f"ELBv2 lookup failed: {e}")


def test_secrets_exist(stack_outputs):
  sm = boto3.client("secretsmanager", region_name="us-east-1")
  for key in ["dev_db_credentials_secret_arn", "dev_app_config_secret_arn"]:
    arn = safe_get(stack_outputs, key)
    assert arn, f"{key} output missing"
    try:
      sm.describe_secret(SecretId=arn)
    except ClientError as e:
      pytest.fail(f"Secret {arn} not found: {e}")


def test_rds_secure_config(stack_outputs):
  rds = boto3.client("rds", region_name="us-east-1")
  endpoint = safe_get(stack_outputs, "dev_rds_endpoint")
  assert endpoint, "dev_rds_endpoint missing"
  db_id = endpoint.split(".")[0].split(":")[0] if endpoint else None
  assert db_id, "Could not parse DB identifier from endpoint"
  try:
    resp = rds.describe_db_instances(DBInstanceIdentifier=db_id)
    dbs = resp.get("DBInstances", [])
    assert dbs, f"No DB instance found for {db_id}"
    db = dbs[0]
    assert not db.get("PubliclyAccessible", True)
    assert db.get("StorageEncrypted", False)
    assert db.get("KmsKeyId"), "RDS should have KMS key"
  except ClientError as e:
    pytest.fail(f"RDS describe failed: {e}")


def test_sns_topic_exists(stack_outputs):
  sns = boto3.client("sns", region_name="us-east-1")
  arn = safe_get(stack_outputs, "dev_sns_topic_arn")
  assert arn, "dev_sns_topic_arn missing"
  try:
    topics = sns.list_topics().get("Topics", [])
    arns = [t["TopicArn"] for t in topics if "TopicArn" in t]
    assert arn in arns, f"SNS topic {arn} not found"
  except ClientError as e:
    pytest.fail(f"SNS lookup failed: {e}")
