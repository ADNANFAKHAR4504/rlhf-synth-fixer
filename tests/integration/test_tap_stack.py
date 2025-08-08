"""Integration tests with proper boto3 session initialization."""

import os
import unittest

import boto3
from botocore.exceptions import ClientError

from lib.tap_stack import TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
    """Corrected integration tests with proper boto3 session handling."""
    
    @classmethod
    def setUpClass(cls):
        cls.ci_mode = os.getenv("CI", "").lower() == "true"
        cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        cls.team = "nova"
        cls.region = "us-west-2"  # Hardcoded to match your deployment
        
        if not cls.ci_mode:
            # Initialize session with explicit region configuration
            cls.session = boto3.Session(
                region_name=cls.region
            )
            
            # Verify region configuration
            print(f"\nConfigured AWS Region: {cls.session.region_name}")
            
            # Initialize service clients
            cls.dynamodb = cls.session.client('dynamodb')
            cls.lambda_client = cls.session.client('lambda')
            cls.sqs = cls.session.client('sqs')
            
            cls.resources = {
                'table': f"{cls.environment_suffix}-nova-data-{cls.team}",
                'processor': f"{cls.environment_suffix}-processor-{cls.team}",
                'analyzer': f"{cls.environment_suffix}-analyzer-{cls.team}",
                'dlq': f"{cls.environment_suffix}-nova-dlq-{cls.team}"
            }

    def _get_resource(self, client, method, resource_name, **kwargs):
        """Resource check with diagnostics."""
        try:
            response = getattr(client, method)(**kwargs)
            print(f"✅ Found {resource_name} in {client.meta.region_name}")
            return response
        except ClientError as e:
            print(f"❌ Failed to find {resource_name} in {client.meta.region_name}")
            print(f"   Error: {e.response['Error']['Message']}")
            raise

    def test_01_dynamodb_table(self):
        if self.ci_mode:
            self.skipTest("Skipped in CI")
            
        response = self._get_resource(
            self.dynamodb, 'describe_table',
            self.resources['table'],
            TableName=self.resources['table']
        )
        self.assertTrue(response['Table']['StreamSpecification']['StreamEnabled'])

    def test_02_lambda_functions(self):
        if self.ci_mode:
            self.skipTest("Skipped in CI")
            
        for func in ['processor', 'analyzer']:
            response = self._get_resource(
                self.lambda_client, 'get_function',
                self.resources[func],
                FunctionName=self.resources[func]
            )
            self.assertEqual(response['Configuration']['Runtime'], "python3.9")

    def test_03_dlq_configuration(self):
        if self.ci_mode:
            self.skipTest("Skipped in CI")
            
        response = self._get_resource(
            self.sqs, 'list_queues',
            self.resources['dlq'],
            QueueNamePrefix=self.resources['dlq']
        )
        self.assertIn('QueueUrls', response)

    def test_04_ci_safe_checks(self):
        """Always runs in both CI and local."""
        args = TapStackArgs(
            environment_suffix=self.environment_suffix,
            team=self.team,
            region=self.region
        )
        self.assertEqual(args.team, self.team)
        if self.ci_mode:
            print("CI-safe validation passed")

if __name__ == '__main__':
    unittest.main()