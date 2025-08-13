import os
import re
import json
import time
import boto3
import requests
from datetime import datetime, timezone
import pytest

OUT = {}
outputs_file = os.path.join(
    os.path.dirname(__file__),
    '../../cfn-outputs/flat-outputs.json'
)
if os.path.exists(outputs_file):
  with open(outputs_file, 'r') as f:
    OUT = json.load(f)


REGION = OUT["api_gateway_execution_arn"].split(":")[3]
ACCOUNT = OUT["api_gateway_execution_arn"].split(":")[4]

session = boto3.Session(region_name=REGION)
apigw = session.client("apigateway")
logs = session.client("logs")
lam = session.client("lambda")
s3 = session.client("s3")
iam = session.client("iam")
sts = session.client("sts")
cloudwatch = session.client("cloudwatch")

API_ID = OUT["api_gateway_id"]
STAGE = OUT["api_gateway_stage"]
API_URL = OUT["api_gateway_url"]
ECHO_URL = OUT["echo_endpoint"]
HEALTH_URL = OUT["health_endpoint"]
INFO_URL = OUT["info_endpoint"]
LAMBDA_ARN = OUT["lambda_function_arn"]
LAMBDA_NAME = OUT["lambda_function_name"]
LOG_GROUP_API = OUT["api_log_group"]
LOG_GROUP_LAMBDA = OUT["lambda_log_group"]
S3_BUCKET = OUT["s3_log_bucket"]
ROLE_ARN = OUT["apigw_cloudwatch_role_arn"]

# ---------- Basic JSON / ARN validations (1-4) ----------


def test_json_has_expected_keys():  # 1
  expected = {
      "api_gateway_execution_arn",
      "api_gateway_id",
      "api_gateway_stage",
      "api_gateway_url",
      "api_log_group",
      "apigw_cloudwatch_role_arn",
      "echo_endpoint",
      "health_endpoint",
      "info_endpoint",
      "lambda_function_arn",
      "lambda_function_name",
      "lambda_log_group",
      "lambda_version",
      "s3_log_bucket",
      "s3_log_bucket_arn"}
  assert expected.issubset(set(OUT.keys()))


def test_execute_api_arn_format():  # 2
  assert re.match(
      r"^arn:aws:execute-api:[a-z0-9-]+:\d{12}:[A-Za-z0-9]+$",
      OUT["api_gateway_execution_arn"])


def test_lambda_arn_format():  # 3
  assert re.match(
      r"^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[A-Za-z0-9-_]+$",
      LAMBDA_ARN)


def test_s3_arn_format():  # 4
  assert re.match(
      r"^arn:aws:s3:::([a-z0-9.-]{3,63})$",
      OUT["s3_log_bucket_arn"])

# ---------- STS / account checks (5) ----------


def test_sts_account_matches_arn_account():  # 5
  who = sts.get_caller_identity()
  assert who["Account"] == ACCOUNT

# ---------- API Gateway existence & stage (6-10) ----------


def test_rest_api_exists():  # 6
  api = apigw.get_rest_api(restApiId=API_ID)
  assert api["id"] == API_ID


def test_stage_exists():  # 7
  stage = apigw.get_stage(restApiId=API_ID, stageName=STAGE)
  assert stage["stageName"] == STAGE


def test_stage_access_logs_enabled():  # 8
  stage = apigw.get_stage(restApiId=API_ID, stageName=STAGE)
  assert "accessLogSettings" in stage and stage["accessLogSettings"].get(
      "destinationArn")


def test_stage_method_settings_present():  # 9
  stage = apigw.get_stage(restApiId=API_ID, stageName=STAGE)
  assert "methodSettings" in stage and len(stage["methodSettings"]) >= 1


def test_apigw_account_cloudwatch_role_matches():  # 10
  acct = apigw.get_account()
  assert acct.get("cloudwatchRoleArn") == ROLE_ARN

# ---------- CloudWatch Logs groups (11-14) ----------


def _get_log_group(name):
  resp = logs.describe_log_groups(logGroupNamePrefix=name)
  for g in resp.get("logGroups", []):
    if g["logGroupName"] == name:
      return g
  return None


def test_api_log_group_exists():  # 11
  g = _get_log_group(LOG_GROUP_API)
  assert g is not None


def test_api_log_group_retention_14():  # 12
  g = _get_log_group(LOG_GROUP_API)
  assert g.get("retentionInDays") == 14


def test_lambda_log_group_exists():  # 13
  g = _get_log_group(LOG_GROUP_LAMBDA)
  assert g is not None


def test_lambda_log_group_retention_14():  # 14
  g = _get_log_group(LOG_GROUP_LAMBDA)
  assert g.get("retentionInDays") == 14

# ---------- Lambda configuration (15-21) ----------


def test_lambda_exists():  # 15
  conf = lam.get_function_configuration(FunctionName=LAMBDA_NAME)
  assert conf["FunctionName"] == LAMBDA_NAME


def test_lambda_runtime_python39():  # 16
  conf = lam.get_function_configuration(FunctionName=LAMBDA_NAME)
  assert conf["Runtime"].startswith("python3.9")


def test_lambda_memory_256():  # 17
  conf = lam.get_function_configuration(FunctionName=LAMBDA_NAME)
  assert conf["MemorySize"] == 256


def test_lambda_env_has_bucket():  # 18
  conf = lam.get_function_configuration(FunctionName=LAMBDA_NAME)
  env = (conf.get("Environment") or {}).get("Variables") or {}
  assert env.get("LOG_BUCKET_NAME") == S3_BUCKET


def test_lambda_policy_allows_apigw_invoke():  # 19
  pol = lam.get_policy(FunctionName=LAMBDA_NAME)
  assert "apigateway.amazonaws.com" in pol["Policy"]


def test_lambda_invoke_health_direct_event():  # 20
  event = {
      "httpMethod": "GET",
      "path": "/health",
      "headers": {},
      "queryStringParameters": {},
      "body": None,
      "isBase64Encoded": False,
      "requestContext": {
          "requestId": "pytest"}}
  resp = lam.invoke(
      FunctionName=LAMBDA_NAME,
      InvocationType="RequestResponse",
      Payload=json.dumps(event).encode("utf-8"))
  payload = json.loads(resp["Payload"].read().decode("utf-8"))
  assert payload["statusCode"] == 200
  body = json.loads(payload["body"])
  assert body["status"] == "ok"


def test_lambda_version_is_number_string():  # 21
  v = OUT["lambda_version"]
  assert isinstance(v, str) and v.isdigit()

# ---------- Public HTTP endpoints (22-24) ----------


def test_public_health_ok():  # 22
  r = requests.get(HEALTH_URL, timeout=15)
  assert r.status_code == 200
  assert r.json().get("status") == "ok"


def test_public_echo_ok():  # 23
  payload = {"ping": "pong"}
  r = requests.post(ECHO_URL, json=payload, timeout=15)
  assert r.status_code == 200
  j = r.json()
  assert j.get("message") == "echo"
  assert j.get("body") == payload


def test_public_info_ok():  # 24
  r = requests.get(INFO_URL, timeout=15)
  assert r.status_code == 200
  j = r.json()
  assert j.get("function_name") == LAMBDA_NAME

# ---------- S3 bucket configuration and logging side-effects (25-27) ----


def test_s3_bucket_exists():  # 25
  resp = s3.head_bucket(Bucket=S3_BUCKET)
  assert resp["ResponseMetadata"]["HTTPStatusCode"] in (200, 301, 302)


def test_s3_public_access_block_enabled():  # 26
  pab = s3.get_public_access_block(Bucket=S3_BUCKET)
  cfg = pab["PublicAccessBlockConfiguration"]
  assert cfg["BlockPublicAcls"] and cfg["BlockPublicPolicy"] and cfg["IgnorePublicAcls"] and cfg["RestrictPublicBuckets"]


def test_s3_lifecycle_config_present():  # 27
  cfg = s3.get_bucket_lifecycle_configuration(Bucket=S3_BUCKET)
  assert len(cfg.get("Rules", [])) >= 1

# ---------- CloudWatch alarms existence (28-29) ----------


def test_cw_alarm_lambda_errors_exists():  # 28
  resp = cloudwatch.describe_alarms_for_metric(
      MetricName="Errors",
      Namespace="AWS/Lambda",
      Dimensions=[{"Name": "FunctionName", "Value": LAMBDA_NAME}]
  )
  assert len(resp.get("MetricAlarms", [])) >= 1


def test_cw_alarm_lambda_duration_exists():  # 29
  resp = cloudwatch.describe_alarms_for_metric(
      MetricName="Duration",
      Namespace="AWS/Lambda",
      Dimensions=[{"Name": "FunctionName", "Value": LAMBDA_NAME}]
  )
  assert len(resp.get("MetricAlarms", [])) >= 1

# ---------- End-to-end: call echo, expect fresh S3 log object today (30)


def test_invoke_and_find_recent_s3_log_object():  # 30
  _ = requests.post(ECHO_URL, json={"hello": "world"}, timeout=15)
  now = datetime.now(timezone.utc)
  prefix = f"requests/{now.strftime('%Y/%m/%d')}/"
  listed = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix, MaxKeys=100)
  objs = listed.get("Contents", [])
  fresh = [
      o for o in objs if (
          now -
          o["LastModified"].replace(
              tzinfo=timezone.utc)).total_seconds() < 600]
  assert len(fresh) >= 1
