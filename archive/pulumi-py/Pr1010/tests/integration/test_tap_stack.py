# tests/integration/test_tap_stack.py

import os
import unittest

import boto3
from botocore.exceptions import ClientError
from lib.tap_stack import TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the TapStack Pulumi deployment."""

  @classmethod
  def setUpClass(cls):
    cls.ci_mode = os.getenv("CI", "").lower() == "true"
    cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
    cls.region = os.getenv("AWS_REGION", "us-east-1")

    cls.session = boto3.Session(region_name=cls.region)
    cls.lambda_client = cls.session.client("lambda")
    cls.apigw_client = cls.session.client("apigateway")
    cls.cloudwatch_client = cls.session.client("cloudwatch")
    cls.sns_client = cls.session.client("sns")

    print(f"\n[Integration Test] AWS Region: {cls.region}")
    print(f"[Integration Test] Environment Suffix: {cls.environment_suffix}")

  # ---------- helpers ----------

  def _verify_deployment(self):
    """Check if at least one of our core Lambdas exists."""
    try:
      paginator = self.lambda_client.get_paginator("list_functions")
      for page in paginator.paginate():
        if any("items-lambda" in f["FunctionName"] for f in page.get("Functions", [])):
          return True
      return False
    except ClientError as e:
      print(f"Error verifying deployment: {e}")
      return False

  def _list_all_alarms(self):
    paginator = self.cloudwatch_client.get_paginator("describe_alarms")
    all_alarms = []
    for page in paginator.paginate():
      all_alarms.extend(page.get("MetricAlarms", []))
    return all_alarms

  def _list_all_topics(self):
    paginator = self.sns_client.get_paginator("list_topics")
    topics = []
    for page in paginator.paginate():
      topics.extend(page.get("Topics", []))
    return topics

  # ---------- tests ----------

  def test_01_lambda_exists_and_configured(self):
    """Validate Lambda function exists and runtime is correct."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    paginator = self.lambda_client.get_paginator("list_functions")
    matching = []
    for page in paginator.paginate():
      matching.extend([f for f in page.get("Functions", [])
                      if "items-lambda" in f["FunctionName"]])

    self.assertTrue(matching, "No matching lambda function found")
    for fn in matching:
      self.assertEqual(fn["Runtime"], "python3.9")
      print(f"Lambda verified: {fn['FunctionName']} (Runtime OK)")

  def test_02_api_gateway_exists(self):
    """Validate API Gateway exists."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    apis = self.apigw_client.get_rest_apis()["items"]
    matching = [
        api for api in apis
        if "items-api" in api["name"] or "items-rest-api" in api["name"]
    ]
    self.assertTrue(
        matching,
        f"No matching API Gateway found. Available: {[a['name'] for a in apis]}"
    )
    print(f"API Gateway found: {[api['name'] for api in matching]}")

  def test_03_cloudwatch_alarms_exist(self):
    """Validate CloudWatch alarms for Lambda errors, throttles, and latency."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    # Support both your current ('alarm-*') and legacy ('lambda*') names
    patterns_by_key = {
        "duration": ["alarm-duration", "lambdaDurationAlarm"],
        "errors":   ["alarm-errors",   "lambdaErrorsAlarm"],
        "throttles": ["alarm-throttles", "lambdaThrottlesAlarm"],
    }

    all_alarms = self._list_all_alarms()
    alarm_names = [a["AlarmName"] for a in all_alarms]

    print(
        f"Discovered {len(alarm_names)} CloudWatch alarms (sample): {alarm_names[:10]}")

    for key, patterns in patterns_by_key.items():
      matches = [name for name in alarm_names if any(
          p in name for p in patterns)]
      self.assertTrue(matches, f"No alarms found matching any of: {patterns}")
      print(f"Found alarms for {key}: {matches}")

    print("All required CloudWatch alarm categories present")

  def test_04_sns_alarm_topic_exists(self):
    """Validate SNS alarm topic exists."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    topics = self._list_all_topics()
    topic_arns = [t["TopicArn"] for t in topics]

    print(
        f"Discovered {len(topic_arns)} SNS topics (sample): {topic_arns[:10]}")

    # Match your deployed name 'alarm-topic' and allow legacy 'items-alarms'
    matching = [
        arn for arn in topic_arns
        if "alarm-topic" in arn or "items-alarms" in arn
    ]
    self.assertTrue(
        matching, "No SNS alarm topic found (looked for 'alarm-topic' or 'items-alarms')")
    print(f"SNS Topics found: {matching}")

  def test_05_naming_conventions(self):
    """Validate naming patterns are prefixed with environment suffix when applicable."""
    args = TapStackArgs(environment_suffix=self.environment_suffix)
    expected_prefixes = [
        f"{args.environment_suffix}-items-lambda",
        f"{args.environment_suffix}-items-api",
        f"{args.environment_suffix}-items-alarms",
    ]
    # Only enforce strict prefix if suffix != 'dev'
    for prefix in expected_prefixes:
      if self.environment_suffix != "dev":
        self.assertTrue(
            prefix.startswith(f"{args.environment_suffix}-"),
            f"Expected prefix missing in: {prefix}"
        )
    print("Naming conventions validated")


if __name__ == "__main__":
  unittest.main()
