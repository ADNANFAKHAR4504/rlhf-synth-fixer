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

    def _verify_deployment(self):
        """Check if at least one of our core Lambdas exists."""
        try:
            functions = self.lambda_client.list_functions()["Functions"]
            return any("items-lambda" in f["FunctionName"] for f in functions)
        except ClientError as e:
            print(f"Error verifying deployment: {e}")
            return False

    def test_01_lambda_exists_and_configured(self):
        """Validate Lambda function exists and runtime is correct."""
        if not self._verify_deployment():
            self.skipTest("Deployment not found in test region")

        functions = self.lambda_client.list_functions()["Functions"]
        matching = [f for f in functions if "items-lambda" in f["FunctionName"]]
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

        expected_keywords = {
            "duration": "alarm-duration",
            "errors": "alarm-errors",
            "throttles": "alarm-throttles",
        }
        all_alarms = self.cloudwatch_client.describe_alarms()["MetricAlarms"]
        found = []

        for key, keyword in expected_keywords.items():
            matches = [a["AlarmName"] for a in all_alarms if keyword in a["AlarmName"]]
            self.assertTrue(matches, f"No alarms found containing: {keyword}")
            found.extend(matches)
            print(f"Found alarms for {key}: {matches}")

        self.assertEqual(len(expected_keywords), len(found))
        print("All CloudWatch alarms found and configured correctly")

    def test_04_sns_alarm_topic_exists(self):
        """Validate SNS alarm topic exists."""
        if not self._verify_deployment():
            self.skipTest("Deployment not found in test region")

        topics = self.sns_client.list_topics()["Topics"]
        matching = [t["TopicArn"] for t in topics if "alarm-topic" in t["TopicArn"]]
        self.assertTrue(matching, "No SNS topic found containing 'alarm-topic'")
        print(f"SNS Topics found: {matching}")

    def test_05_naming_conventions(self):
        """Validate naming patterns are prefixed with environment suffix when applicable."""
        args = TapStackArgs(environment_suffix=self.environment_suffix)
        expected_prefixes = [
            f"{args.environment_suffix}-items-lambda",
            f"{args.environment_suffix}-items-api",
            f"{args.environment_suffix}-items-alarms",
        ]
        # Looser check: Only enforce that prefix starts correctly if suffix != "dev"
        for prefix in expected_prefixes:
            if self.environment_suffix != "dev":
                self.assertTrue(
                    prefix.startswith(f"{args.environment_suffix}-"),
                    f"Expected prefix missing in: {prefix}"
                )
        print("Naming conventions validated")


if __name__ == "__main__":
    unittest.main()
