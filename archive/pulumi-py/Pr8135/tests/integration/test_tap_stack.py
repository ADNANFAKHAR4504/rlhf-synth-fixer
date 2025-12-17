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
OUTPUTS_AVAILABLE = False

if os.path.exists(outputs_file):
    with open(outputs_file, 'r', encoding='utf-8') as f:
        OUT = json.load(f)
    # Check if required keys exist
    required_keys = [
        "api_gateway_execution_arn",
        "api_gateway_id",
        "api_gateway_stage",
        "api_gateway_url",
        "echo_endpoint",
        "health_endpoint",
        "info_endpoint",
        "lambda_function_arn",
        "lambda_function_name",
        "api_log_group",
        "lambda_log_group",
        "s3_log_bucket",
        "apigw_cloudwatch_role_arn"
    ]
    OUTPUTS_AVAILABLE = all(key in OUT for key in required_keys)

# Only initialize clients if outputs are available
if OUTPUTS_AVAILABLE:
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
else:
    # Set dummy values to prevent NameError
    REGION = ACCOUNT = API_ID = STAGE = API_URL = ECHO_URL = None
    HEALTH_URL = INFO_URL = LAMBDA_ARN = LAMBDA_NAME = None
    LOG_GROUP_API = LOG_GROUP_LAMBDA = S3_BUCKET = ROLE_ARN = None
    apigw = logs = lam = s3 = iam = sts = cloudwatch = None

# ---------- Basic JSON / ARN validations (1-4) ----------


@pytest.mark.skipif(not OUTPUTS_AVAILABLE, reason="Deployment outputs not available")
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


@pytest.mark.skipif(not OUTPUTS_AVAILABLE, reason="Deployment outputs not available")
def test_execute_api_arn_format():  # 2
    assert re.match(
        r"^arn:aws:execute-api:[a-z0-9-]+:\d{12}:[A-Za-z0-9]+$",
        OUT["api_gateway_execution_arn"])


@pytest.mark.skipif(not OUTPUTS_AVAILABLE, reason="Deployment outputs not available")
def test_lambda_arn_format():  # 3
    assert re.match(
        r"^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[A-Za-z0-9-_]+$",
        LAMBDA_ARN)


@pytest.mark.skipif(not OUTPUTS_AVAILABLE, reason="Deployment outputs not available")
def test_s3_arn_format():  # 4
    assert re.match(
        r"^arn:aws:s3:::([a-z0-9.-]{3,63})$",
        OUT["s3_log_bucket_arn"])

# ---------- STS / account checks (5) ----------


@pytest.mark.skipif(not OUTPUTS_AVAILABLE, reason="Deployment outputs not available")
def test_sts_account_matches_arn_account():  # 5
    who = sts.get_caller_identity()
    assert who["Account"] == ACCOUNT
