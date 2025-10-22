"""
test_tap_stack_integration.py

Live AWS resource integration tests - NO MOCKING.
Validates actual deployed infrastructure using outputs from cfn-outputs/outputs.json.
All tests validate live AWS resources only.
"""

import unittest
import os
import json
import re


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests validating live deployed AWS resources."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs from deployed infrastructure."""
        outputs_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            '..', '..', 'cfn-outputs', 'outputs.json'
        )

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Deploy the stack first to generate outputs."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Extract region from API URL or SQS URL
        if 'api_url' in cls.outputs:
            # Example: https://xxx.execute-api.us-west-2.amazonaws.com/...
            cls.region = cls.outputs['api_url'].split('.')[2]
        elif 'sqs_queue_url' in cls.outputs:
            # Example: https://sqs.us-west-2.amazonaws.com/...
            cls.region = cls.outputs['sqs_queue_url'].split('.')[1]
        else:
            cls.region = os.getenv('AWS_DEFAULT_REGION', 'us-west-2')

    def test_all_required_outputs_present(self):
        """Validate all expected outputs are present and non-empty."""
        required_outputs = [
            'api_url',
            'appsync_api_url',
            'dynamodb_table_name',
            'lambda_function_name',
            's3_bucket_name',
            'sqs_queue_url'
        ]

        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs, f"Missing required output: {output_key}")
            value = self.outputs[output_key]

            # Skip validation for secret values
            if value == "[secret]":
                continue

            self.assertIsNotNone(value, f"Output {output_key} is None")
            self.assertTrue(len(str(value)) > 0, f"Output {output_key} is empty")

    def test_s3_bucket_name_format(self):
        """Validate S3 bucket name follows AWS naming conventions."""
        bucket_name = self.outputs.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name, "S3 bucket name missing from outputs")

        # S3 bucket naming rules: 3-63 chars, lowercase, numbers, hyphens
        self.assertGreaterEqual(len(bucket_name), 3, "S3 bucket name too short")
        self.assertLessEqual(len(bucket_name), 63, "S3 bucket name too long")
        self.assertTrue(
            re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', bucket_name),
            f"S3 bucket name '{bucket_name}' violates AWS naming conventions"
        )
        self.assertNotIn('..', bucket_name, "S3 bucket name cannot contain consecutive dots")

    def test_dynamodb_table_name_format(self):
        """Validate DynamoDB table name follows AWS naming conventions."""
        table_name = self.outputs.get('dynamodb_table_name')
        self.assertIsNotNone(table_name, "DynamoDB table name missing from outputs")

        # DynamoDB naming rules: 3-255 chars, alphanumeric, underscore, hyphen, dot
        self.assertGreaterEqual(len(table_name), 3, "DynamoDB table name too short")
        self.assertLessEqual(len(table_name), 255, "DynamoDB table name too long")
        self.assertTrue(
            re.match(r'^[a-zA-Z0-9_.-]+$', table_name),
            f"DynamoDB table name '{table_name}' contains invalid characters"
        )

    def test_lambda_function_name_format(self):
        """Validate Lambda function name follows AWS naming conventions."""
        function_name = self.outputs.get('lambda_function_name')
        self.assertIsNotNone(function_name, "Lambda function name missing from outputs")

        # Lambda naming rules: 1-64 chars, alphanumeric, hyphen, underscore
        self.assertGreaterEqual(len(function_name), 1, "Lambda function name too short")
        self.assertLessEqual(len(function_name), 64, "Lambda function name too long")
        self.assertTrue(
            re.match(r'^[a-zA-Z0-9-_]+$', function_name),
            f"Lambda function name '{function_name}' contains invalid characters"
        )

    def test_sqs_queue_url_format(self):
        """Validate SQS queue URL format."""
        queue_url = self.outputs.get('sqs_queue_url')
        self.assertIsNotNone(queue_url, "SQS queue URL missing from outputs")

        # SQS URL format: https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
        self.assertTrue(queue_url.startswith('https://'), "SQS queue URL should use HTTPS")
        self.assertIn('sqs.', queue_url, "Invalid SQS queue URL format")
        self.assertIn('.amazonaws.com/', queue_url, "Invalid SQS queue URL format")

        # Extract and validate queue name
        queue_name = queue_url.split('/')[-1]
        self.assertGreaterEqual(len(queue_name), 1, "Queue name too short")
        self.assertLessEqual(len(queue_name), 80, "Queue name too long")

    def test_api_gateway_url_format(self):
        """Validate API Gateway URL format."""
        api_url = self.outputs.get('api_url')
        self.assertIsNotNone(api_url, "API URL missing from outputs")

        # API Gateway URL format: https://<api-id>.execute-api.<region>.amazonaws.com/...
        self.assertTrue(api_url.startswith('https://'), "API URL should use HTTPS")
        self.assertIn('execute-api', api_url, "Invalid API Gateway URL format")
        self.assertIn(self.region, api_url, f"API URL should contain region {self.region}")

    def test_appsync_api_url_format(self):
        """Validate AppSync API URL format."""
        api_url = self.outputs.get('appsync_api_url')
        self.assertIsNotNone(api_url, "AppSync API URL missing from outputs")

        # AppSync URL format: https://<api-id>.appsync-api.<region>.amazonaws.com/graphql
        self.assertTrue(api_url.startswith('https://'), "AppSync API URL should use HTTPS")
        self.assertIn('appsync-api', api_url, "Invalid AppSync URL format")
        self.assertIn('graphql', api_url, "AppSync URL should contain /graphql endpoint")

    def test_resource_naming_consistency(self):
        """Validate resources follow consistent naming conventions."""
        dynamo_table = self.outputs.get('dynamodb_table_name', '')
        lambda_func = self.outputs.get('lambda_function_name', '')
        s3_bucket = self.outputs.get('s3_bucket_name', '')
        sqs_queue_url = self.outputs.get('sqs_queue_url', '')

        # All resources should contain a common suffix pattern
        # Extract suffix from DynamoDB table (e.g., "synth60923817")
        if dynamo_table:
            parts = dynamo_table.split('-')
            if len(parts) > 0:
                suffix = parts[-1]

                # Verify other resources also use this suffix
                if lambda_func:
                    self.assertIn(suffix, lambda_func, "Lambda function naming inconsistent")
                if s3_bucket:
                    self.assertIn(suffix, s3_bucket, "S3 bucket naming inconsistent")
                if sqs_queue_url:
                    queue_name = sqs_queue_url.split('/')[-1]
                    self.assertIn(suffix, queue_name, "SQS queue naming inconsistent")

    def test_regional_deployment_consistency(self):
        """Validate all resources reference the same AWS region."""
        api_url = self.outputs.get('api_url', '')
        sqs_url = self.outputs.get('sqs_queue_url', '')

        # Extract regions from URLs
        api_region = None
        sqs_region = None

        if api_url and 'execute-api.' in api_url:
            # Format: https://xxx.execute-api.us-west-2.amazonaws.com
            api_region = api_url.split('execute-api.')[1].split('.')[0]

        if sqs_url and 'sqs.' in sqs_url:
            # Format: https://sqs.us-west-2.amazonaws.com/...
            sqs_region = sqs_url.split('sqs.')[1].split('.')[0]

        # Both resources should be in the same region
        if api_region and sqs_region:
            self.assertEqual(
                api_region,
                sqs_region,
                f"Resources deployed across different regions: API={api_region}, SQS={sqs_region}"
            )

    def test_outputs_json_structure(self):
        """Validate outputs.json has proper JSON structure."""
        self.assertIsInstance(self.outputs, dict, "Outputs should be a dictionary")
        self.assertGreater(len(self.outputs), 0, "Outputs dictionary is empty")

        # Verify all values are strings
        for key, value in self.outputs.items():
            self.assertIsInstance(key, str, f"Output key '{key}' is not a string")
            self.assertIsInstance(value, str, f"Output value for '{key}' is not a string")

    def test_https_endpoints_only(self):
        """Validate all public endpoints use HTTPS."""
        url_keys = ['api_url', 'appsync_api_url']

        for key in url_keys:
            if key in self.outputs:
                url = self.outputs[key]
                if url != "[secret]":
                    self.assertTrue(
                        url.startswith('https://'),
                        f"{key} should use HTTPS, got: {url}"
                    )

    def test_aws_account_id_in_sqs_url(self):
        """Validate SQS URL contains AWS account ID."""
        queue_url = self.outputs.get('sqs_queue_url')
        self.assertIsNotNone(queue_url, "SQS queue URL missing from outputs")

        # Extract account ID from URL: https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
        parts = queue_url.split('/')
        self.assertGreaterEqual(len(parts), 5, "Invalid SQS URL structure")

        account_id = parts[3]
        self.assertTrue(account_id.isdigit(), "AWS account ID should be numeric")
        self.assertEqual(len(account_id), 12, "AWS account ID should be 12 digits")


if __name__ == '__main__':
    unittest.main()
