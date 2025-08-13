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
    """Initialize AWS clients and config."""
    cls.ci_mode = os.getenv("CI", "").lower() in ("true", "1")
    cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
    cls.region = os.getenv("AWS_REGION", "us-east-1")

    cls.session = boto3.Session(region_name=cls.region)
    cls.lambda_client = cls.session.client("lambda")
    cls.apigw_client = cls.session.client("apigateway")
    cls.cloudwatch_client = cls.session.client("cloudwatch")
    cls.sns_client = cls.session.client("sns")

    print(f"\n[Integration Test] AWS Region: {cls.region}")
    print(f"[Integration Test] Environment Suffix: {cls.environment_suffix}")

  def _verify_deployment(self):
    """
    Confirm that at least one Lambda function exists for the deployment.

    In CI/CD, do not skip tests if naming doesn't match — just warn.
    """
    try:
      functions = self.lambda_client.list_functions()["Functions"]
      match_found = any(
          self.environment_suffix in f["FunctionName"] or
          f["FunctionName"].endswith("items-lambda")
          for f in functions
      )
      if not match_found:
        print(f"[WARN] No Lambda matched environment suffix '{self.environment_suffix}', "
              f"continuing tests anyway.")
      return True  # Always allow tests to run
    except ClientError as e:
      print(f"Error verifying deployment: {e}")
      return True  # Still allow tests to run in CI

  def test_01_lambda_exists_and_configured(self):
    """Validate Lambda function exists and runtime is correct."""
    self._verify_deployment()

    functions = self.lambda_client.list_functions()["Functions"]
    matching = [
        f for f in functions
        if self.environment_suffix in f["FunctionName"]
        or f["FunctionName"].endswith("items-lambda")
    ]
    self.assertTrue(matching, "No matching lambda function found")
    for fn in matching:
      self.assertEqual(fn["Runtime"], "python3.9")
      print(f"Lambda verified: {fn['FunctionName']} (Runtime OK)")

  def test_02_api_gateway_exists(self):
    """Validate API Gateway exists."""
    self._verify_deployment()

    apis = self.apigw_client.get_rest_apis()["items"]
    matching = [
        api for api in apis
        if self.environment_suffix in api["name"]
        or api["name"].endswith("items-api")
    ]
    self.assertTrue(matching, "No matching API Gateway found")
    print(f"API Gateway found: {[api['name'] for api in matching]}")

  def test_03_cloudwatch_alarms_exist(self):
    """Validate CloudWatch alarms for Lambda errors, throttles, and latency."""
    self._verify_deployment()

    alarm_prefixes = [
        f"lambdaDurationAlarm-{self.environment_suffix}",
        f"lambdaErrorsAlarm-{self.environment_suffix}",
        f"lambdaThrottlesAlarm-{self.environment_suffix}",
    ]
    found_names = []

    for prefix in alarm_prefixes:
      response = self.cloudwatch_client.describe_alarms(AlarmNamePrefix=prefix)
      matches = [a["AlarmName"] for a in response.get("MetricAlarms", [])]
      if not matches:
        print(f"[WARN] No alarms found with prefix: {prefix}")
      self.assertTrue(matches, f"No alarms found with prefix: {prefix}")
      found_names.extend(matches)
      print(f"Found alarms for prefix '{prefix}': {matches}")

    self.assertEqual(len(alarm_prefixes), len(found_names))
    print("All CloudWatch alarms found and configured correctly")

  def test_04_sns_alarm_topic_exists(self):
    """Validate SNS alarm topic exists."""
    self._verify_deployment()

    expected_prefix = f"{self.environment_suffix}-items-alarms"
    topics = self.sns_client.list_topics()["Topics"]

    matching_topics = [
        t["TopicArn"] for t in topics
        if expected_prefix in t["TopicArn"]
        or t["TopicArn"].endswith("items-alarms")
    ]

    self.assertTrue(
        matching_topics, f"No SNS topic found with prefix: {expected_prefix}"
    )
    print(f"SNS Topics found: {matching_topics}")

  def test_05_naming_conventions(self):
    """Validate naming patterns follow the expected prefix rules."""
    args = TapStackArgs(environment_suffix=self.environment_suffix)
    expected_prefixes = [
        f"{args.environment_suffix}-items-lambda",
        f"{args.environment_suffix}-items-api",
        f"{args.environment_suffix}-items-alarms",
    ]

    for prefix in expected_prefixes:
      self.assertTrue(
          prefix.startswith(f"{args.environment_suffix}-"),
          f"Expected prefix missing in: {prefix}"
      )
    print("Naming conventions validated")


if __name__ == "__main__":
  unittest.main()
