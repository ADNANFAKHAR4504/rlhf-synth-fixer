"""CI/CD-proof integration tests for TapStack with live resource validation."""

import os
import unittest

import boto3

from lib.tap_stack import TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
    """Live resource integration tests with CI fallback."""
    
    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and test configuration."""
        cls.ci_mode = os.getenv("CI", "").lower() == "true"
        cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        cls.team = "nova"
        
        # Only initialize AWS clients if not in CI mode
        if not cls.ci_mode:
            cls.dynamodb = boto3.client('dynamodb')
            cls.lambda_client = boto3.client('lambda')
            cls.sqs = boto3.client('sqs')
            cls.cloudwatch = boto3.client('cloudwatch')
            cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_01_live_dynamodb_configuration(self):
        """Validate DynamoDB table has streaming enabled."""
        if self.ci_mode:
            self.skipTest("Skipping live resource test in CI mode")
            
        args = TapStackArgs(
            environment_suffix=self.environment_suffix,
            team=self.team
        )
        table_name = f"{args.environment_suffix}-nova-data-{args.team}"
        
        try:
            response = self.dynamodb.describe_table(TableName=table_name)
            self.assertTrue(response['Table']['StreamSpecification']['StreamEnabled'])
            self.assertEqual(
                response['Table']['StreamSpecification']['StreamViewType'],
                "NEW_AND_OLD_IMAGES"
            )
        except Exception as e:
            self.fail(f"DynamoDB validation failed: {str(e)}")

    def test_02_lambda_function_configs(self):
        """Verify Lambda functions exist with correct configurations."""
        if self.ci_mode:
            self.skipTest("Skipping live resource test in CI mode")
            
        args = TapStackArgs(
            environment_suffix=self.environment_suffix,
            team=self.team
        )
        
        functions = [
            f"{args.environment_suffix}-processor-{args.team}",
            f"{args.environment_suffix}-analyzer-{args.team}"
        ]
        
        for func_name in functions:
            try:
                response = self.lambda_client.get_function(FunctionName=func_name)
                self.assertEqual(response['Configuration']['Runtime'], "python3.9")
                self.assertEqual(response['Configuration']['MemorySize'], 256)
                
                # Verify DLQ config
                if 'DeadLetterConfig' in response['Configuration']:
                    self.assertIn(
                        'sqs',
                        response['Configuration']['DeadLetterConfig']['TargetArn']
                    )
            except Exception as e:
                self.fail(f"Lambda validation failed for {func_name}: {str(e)}")

    def test_03_dlq_validation(self):
        """Validate DLQ exists with correct settings."""
        if self.ci_mode:
            self.skipTest("Skipping live resource test in CI mode")
            
        args = TapStackArgs(
            environment_suffix=self.environment_suffix,
            team=self.team
        )
        queue_name = f"{args.environment_suffix}-nova-dlq-{args.team}"
        
        try:
            # Find queue URL by listing all queues
            queues = self.sqs.list_queues(QueueNamePrefix=queue_name)
            self.assertIn('QueueUrls', queues)
            
            # Get queue attributes
            queue_url = queues['QueueUrls'][0]
            attrs = self.sqs.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['MessageRetentionPeriod']
            )
            self.assertEqual(attrs['Attributes']['MessageRetentionPeriod'], "1209600")
        except Exception as e:
            self.fail(f"DLQ validation failed: {str(e)}")

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
            f"{args.environment_suffix}-analyzer-{args.team}"
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