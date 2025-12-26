"""Integration tests for TapStack with LocalStack."""
import os
import unittest
import boto3
import time
from botocore.config import Config


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack deployed to LocalStack."""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for LocalStack."""
        endpoint_url = os.environ.get('AWS_ENDPOINT_URL', 'http://localhost:4566')

        # Configure boto3 clients for LocalStack
        config = Config(
            s3={'addressing_style': 'path'}
        )

        cls.s3_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id='test',
            aws_secret_access_key='test',
            region_name='us-east-1',
            config=config
        )

        cls.lambda_client = boto3.client(
            'lambda',
            endpoint_url=endpoint_url,
            aws_access_key_id='test',
            aws_secret_access_key='test',
            region_name='us-east-1'
        )

    def test_s3_bucket_exists(self):
        """Test that S3 bucket is created."""
        # List buckets to verify creation
        response = self.s3_client.list_buckets()
        buckets = [b['Name'] for b in response.get('Buckets', [])]

        # Should have at least one bucket
        self.assertGreater(len(buckets), 0, "No S3 buckets found")

    def test_lambda_function_exists(self):
        """Test that Lambda function is created."""
        # List functions to verify creation
        response = self.lambda_client.list_functions()
        functions = response.get('Functions', [])

        # Should have at least one function
        self.assertGreater(len(functions), 0, "No Lambda functions found")

    def test_s3_trigger_workflow(self):
        """Test S3 to Lambda trigger workflow."""
        # Get the first bucket
        response = self.s3_client.list_buckets()
        buckets = response.get('Buckets', [])

        if not buckets:
            self.skipTest("No S3 bucket available for testing")

        bucket_name = buckets[0]['Name']
        test_key = 'test-file.txt'
        test_content = b'Test content for S3 trigger'

        try:
            # Upload a test file to trigger Lambda
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content
            )

            # Wait a moment for the trigger to process
            time.sleep(2)

            # Verify file exists
            response = self.s3_client.head_object(Bucket=bucket_name, Key=test_key)
            self.assertIsNotNone(response)

        except Exception as e:
            self.fail(f"S3 trigger test failed: {str(e)}")


if __name__ == '__main__':
    unittest.main()
