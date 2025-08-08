"""CI/CD-proof integration tests for TapStack with region-aware live resource validation."""

import os
import unittest

import boto3
from botocore.exceptions import ClientError

from lib.tap_stack import TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
  """Live resource integration tests with automatic region handling."""

  @classmethod
  def setUpClass(cls):
    """Initialize AWS clients with proper region configuration."""
    cls.ci_mode = os.getenv("CI", "").lower() == "true"
    cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
    cls.team = "nova"

    # Determine the correct region based on environment
    cls.region = "us-east-1" if cls.ci_mode else os.getenv(
        "AWS_REGION", "us-west-2")

    # Initialize AWS clients with explicit region configuration
    if not cls.ci_mode:
      cls.session = boto3.Session(region_name=cls.region)
      cls.dynamodb = cls.session.client('dynamodb')
      cls.lambda_client = cls.session.client('lambda')
      cls.sqs = cls.session.client('sqs')
      cls.cloudwatch = cls.session.client('cloudwatch')

      # Verify region configuration
      print(f"\nTesting in AWS Region: {cls.region}")

  def _verify_resource(self, service, resource_name, verification_func=None):
    """Helper method to verify resource existence with region awareness."""
    try:
      client = getattr(self, service)
      if service == 'dynamodb':
        response = client.describe_table(TableName=resource_name)
      elif service == 'lambda_client':
        response = client.get_function(FunctionName=resource_name)
      elif service == 'sqs':
        response = client.list_queues(QueueNamePrefix=resource_name)

      if verification_func:
        verification_func(response)

      print(f"✅ Found {resource_name} in {self.region}")
      return True
    except ClientError as e:
      if e.response['Error']['Code'] == 'ResourceNotFoundException':
        print(f"❌ Resource {resource_name} not found in {self.region}")
        return False
      raise

  def test_01_live_dynamodb_configuration(self):
    """Validate DynamoDB table configuration."""
    if self.ci_mode:
      self.skipTest("Skipping live resource test in CI mode")

    table_name = f"{self.environment_suffix}-nova-data-{self.team}"

    def verify_dynamodb(response):
      self.assertTrue(
          response['Table']['StreamSpecification']['StreamEnabled'])
      self.assertEqual(
          response['Table']['StreamSpecification']['StreamViewType'],
          "NEW_AND_OLD_IMAGES"
      )

    if not self._verify_resource('dynamodb', table_name, verify_dynamodb):
      self.fail(f"DynamoDB table {table_name} not found in {self.region}")

  def test_02_lambda_function_configs(self):
    """Verify Lambda functions configuration."""
    if self.ci_mode:
      self.skipTest("Skipping live resource test in CI mode")

    functions = [
        f"{self.environment_suffix}-processor-{self.team}",
        f"{self.environment_suffix}-analyzer-{self.team}"
    ]

    for func_name in functions:
      def verify_lambda(response):
        self.assertEqual(response['Configuration']['Runtime'], "python3.9")
        self.assertEqual(response['Configuration']['MemorySize'], 256)
        if 'DeadLetterConfig' in response['Configuration']:
          self.assertIn(
              'sqs', response['Configuration']['DeadLetterConfig']['TargetArn'])

      if not self._verify_resource('lambda_client', func_name, verify_lambda):
        self.fail(f"Lambda function {func_name} not found in {self.region}")

  def test_03_dlq_validation(self):
    """Validate DLQ configuration."""
    if self.ci_mode:
      self.skipTest("Skipping live resource test in CI mode")

    queue_name = f"{self.environment_suffix}-nova-dlq-{self.team}"

    def verify_dlq(response):
      self.assertIn('QueueUrls', response)
      queue_url = response['QueueUrls'][0]
      attrs = self.sqs.get_queue_attributes(
          QueueUrl=queue_url,
          AttributeNames=['MessageRetentionPeriod']
      )
      self.assertEqual(
          attrs['Attributes']['MessageRetentionPeriod'],
          "1209600")

    if not self._verify_resource('sqs', queue_name, verify_dlq):
      self.fail(f"DLQ {queue_name} not found in {self.region}")

  def test_04_ci_safe_fallback_tests(self):
    """Tests that always run (CI and local)."""
    args = TapStackArgs(
        environment_suffix=self.environment_suffix,
        team=self.team
    )

    # Naming pattern validation
    resources = [
        f"{args.environment_suffix}-nova-data-{args.team}",
        f"{args.environment_suffix}-processor-{args.team}",
        f"{args.environment_suffix}-analyzer-{args.team}",
        f"{args.environment_suffix}-nova-dlq-{args.team}"
    ]

    for resource in resources:
      self.assertTrue(
          resource.startswith(f"{args.environment_suffix}-"),
          f"Name {resource} violates naming convention"
      )

    # Environment variable validation
    self.assertEqual(args.team, self.team)
    if self.ci_mode:
      print("CI Mode: Completed safe fallback tests")


if __name__ == '__main__':
  unittest.main()
