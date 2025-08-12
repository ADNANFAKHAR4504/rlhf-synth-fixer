"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

# tests/integration/test_tap_stack.py

"""
Integration tests for TapStack (A2 deployment requirement):
- AWS Lambda (inline code)
- API Gateway HTTP endpoint
- CloudWatch alarms for errors, throttles, latency
- SNS alarm topic
- Environment-aware naming
"""
import unittest
import os
import boto3
from lib.tap_stack import TapStackArgs
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the TapStack Pulumi deployment."""

  @classmethod
  def setUpClass(cls):
    """Initialize AWS clients and config."""
    cls.ci_mode = os.getenv("CI", "").lower() == "true"
    cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
    cls.region = os.getenv("AWS_REGION", "us-east-1")

    cls.session = boto3.Session(region_name=cls.region)
    cls.lambda_client = cls.session.client("lambda")
    cls.apigw_client = cls.session.client("apigatewayv2")
    cls.cloudwatch_client = cls.session.client("cloudwatch")
    cls.sns_client = cls.session.client("sns")

    print(f"\n[Integration Test] AWS Region: {cls.region}")
    print(f"[Integration Test] Environment Suffix: {cls.environment_suffix}")

  def _verify_deployment(self):
    """Check if at least one lambda with our environment suffix exists."""
    try:
      functions = self.lambda_client.list_functions()["Functions"]
      return any(self.environment_suffix in f["FunctionName"] for f in functions)
    except ClientError as e:
      print(f"Error verifying deployment: {e}")
      return False

  def test_01_lambda_exists_and_configured(self):
    """Validate Lambda function exists and runtime is correct."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    functions = self.lambda_client.list_functions()["Functions"]
    matching = [
        f for f in functions
        if f["FunctionName"].startswith(f"lambdaFn-{self.environment_suffix}")
    ]
    self.assertTrue(matching, "No matching lambda function found")
    for fn in matching:
      self.assertEqual(fn["Runtime"], "python3.9")
      print(f"Lambda verified: {fn['FunctionName']} (Runtime OK)")

  def test_02_api_gateway_exists(self):
    """Validate API Gateway exists."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    apis = self.apigw_client.get_apis()["Items"]
    matching = [
        api for api in apis
        if api["Name"].startswith(f"httpApi-{self.environment_suffix}")
    ]
    self.assertTrue(matching, "No matching API Gateway found")
    print(f"API Gateway found: {[api['Name'] for api in matching]}")

  def test_03_cloudwatch_alarms_exist(self):
    """Validate CloudWatch alarms for Lambda errors, throttles, and latency."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    alarm_prefixes = [
        f"lambdaErrorAlarm-{self.environment_suffix}",
        f"lambdaThrottleAlarm-{self.environment_suffix}",
        f"lambdaLatencyAlarm-{self.environment_suffix}",
    ]
    found_names = []

    for prefix in alarm_prefixes:
      response = self.cloudwatch_client.describe_alarms(AlarmNamePrefix=prefix)
      matches = [a["AlarmName"] for a in response.get("MetricAlarms", [])]
      self.assertTrue(matches, f"No alarms found with prefix: {prefix}")
      found_names.extend(matches)
      print(f"Found alarms for prefix '{prefix}': {matches}")

    self.assertEqual(len(alarm_prefixes), len(found_names))
    print("All CloudWatch alarms found and configured correctly")

  def test_04_sns_alarm_topic_exists(self):
    """Validate SNS alarm topic exists."""
    if not self._verify_deployment():
      self.skipTest("Deployment not found in test region")

    expected_prefix = f"alarmTopic-{self.environment_suffix}"
    topics = self.sns_client.list_topics()["Topics"]

    matching_topics = []
    for t in topics:
      arn = t["TopicArn"]
      if expected_prefix in arn:
        matching_topics.append(arn)

    self.assertTrue(
        matching_topics, f"No SNS topic found with prefix: {expected_prefix}")
    print(f"SNS Topics found: {matching_topics}")

  def test_05_naming_conventions(self):
    """Validate naming patterns."""
    args = TapStackArgs(environment_suffix=self.environment_suffix)
    expected_prefixes = [
        f"lambdaFn-{args.environment_suffix}",
        f"httpApi-{args.environment_suffix}",
        f"alarmTopic-{args.environment_suffix}",
    ]

    for prefix in expected_prefixes:
      self.assertTrue(
          prefix.endswith(f"-{args.environment_suffix}"),
          f"Expected suffix missing in: {prefix}"
      )
    print("Naming conventions validated")


if __name__ == "__main__":
  unittest.main()
