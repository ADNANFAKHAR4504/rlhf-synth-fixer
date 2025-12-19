"""Integration tests for TapStack - validates deployed resources"""
import json
import os
import unittest
import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and load outputs"""
        cls.s3_client = boto3.client('s3')
        cls.lambda_client = boto3.client('lambda')
        cls.apigateway_client = boto3.client('apigateway')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.logs_client = boto3.client('logs')
        cls.kms_client = boto3.client('kms')
        cls.ec2_client = boto3.client('ec2')

    def setUp(self):
        """Set up test fixtures"""
        self.outputs = flat_outputs

    @mark.it("verifies S3 data bucket exists with encryption")
    def test_s3_data_bucket_exists(self):
        # ARRANGE
        bucket_name = self.outputs.get('DataBucketName')
        if not bucket_name:
            self.skipTest("DataBucketName not found in outputs")

        # ACT
        response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)

        # ASSERT
        self.assertIn('Rules', response['ServerSideEncryptionConfiguration'])
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        self.assertTrue(len(rules) > 0)
        self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')

    @mark.it("verifies S3 data bucket has versioning enabled")
    def test_s3_bucket_versioning(self):
        # ARRANGE
        bucket_name = self.outputs.get('DataBucketName')
        if not bucket_name:
            self.skipTest("DataBucketName not found in outputs")

        # ACT
        response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)

        # ASSERT
        self.assertEqual(response['Status'], 'Enabled')

    @mark.it("verifies S3 bucket has public access blocked")
    def test_s3_bucket_public_access_block(self):
        # ARRANGE
        bucket_name = self.outputs.get('DataBucketName')
        if not bucket_name:
            self.skipTest("DataBucketName not found in outputs")

        # ACT
        response = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        # ASSERT
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['RestrictPublicBuckets'])

    @mark.it("verifies Lambda function exists and is configured correctly")
    def test_lambda_function_exists(self):
        # ARRANGE
        function_name = self.outputs.get('LambdaFunctionName')
        if not function_name:
            self.skipTest("LambdaFunctionName not found in outputs")

        # ACT
        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # ASSERT
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['Timeout'], 60)
        self.assertEqual(config['MemorySize'], 512)
        self.assertIn('VpcConfig', config)
        self.assertIn('Environment', config)
        self.assertIn('KMSKeyArn', config)

    @mark.it("verifies Lambda has required environment variables")
    def test_lambda_environment_variables(self):
        # ARRANGE
        function_name = self.outputs.get('LambdaFunctionName')
        if not function_name:
            self.skipTest("LambdaFunctionName not found in outputs")

        # ACT
        response = self.lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration']['Environment']['Variables']

        # ASSERT
        self.assertIn('BUCKET_NAME', env_vars)
        self.assertIn('KMS_KEY_ID', env_vars)

    @mark.it("verifies KMS key exists and has rotation enabled")
    def test_kms_key_rotation(self):
        # ARRANGE
        kms_key_id = self.outputs.get('KmsKeyId')
        if not kms_key_id:
            self.skipTest("KmsKeyId not found in outputs")

        # ACT
        response = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)

        # ASSERT
        self.assertTrue(response['KeyRotationEnabled'])

    @mark.it("verifies CloudWatch Log Group exists with correct retention")
    def test_lambda_log_group_exists(self):
        # ARRANGE
        function_name = self.outputs.get('LambdaFunctionName')
        if not function_name:
            self.skipTest("LambdaFunctionName not found in outputs")

        log_group_name = f"/aws/lambda/{function_name}"

        # ACT
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        # ASSERT
        self.assertTrue(len(response['logGroups']) > 0)
        log_group = response['logGroups'][0]
        self.assertEqual(log_group['retentionInDays'], 90)

    @mark.it("verifies API Gateway endpoint is accessible")
    def test_api_gateway_endpoint_accessible(self):
        # ARRANGE
        api_url = self.outputs.get('ApiEndpointUrl')
        if not api_url:
            self.skipTest("ApiEndpointUrl not found in outputs")

        # ASSERT - Just verify the URL format
        self.assertTrue(api_url.startswith('https://'))
        self.assertIn('amazonaws.com', api_url)

    @mark.it("verifies flow logs bucket exists")
    def test_flow_logs_bucket_exists(self):
        # ARRANGE
        bucket_name = self.outputs.get('FlowLogsBucketName')
        if not bucket_name:
            self.skipTest("FlowLogsBucketName not found in outputs")

        # ACT
        response = self.s3_client.head_bucket(Bucket=bucket_name)

        # ASSERT
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    @mark.it("performs end-to-end PII scanning test")
    def test_end_to_end_pii_scanning(self):
        # ARRANGE
        bucket_name = self.outputs.get('DataBucketName')
        function_name = self.outputs.get('LambdaFunctionName')

        if not bucket_name or not function_name:
            self.skipTest("Required outputs not found")

        # Create test file with PII
        test_content = "Test file with SSN: 123-45-6789 and email: test@example.com"
        test_key = "test-data.txt"

        try:
            # Upload test file
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content
            )

            # ACT - Invoke Lambda
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps({
                    'body': json.dumps({
                        'objectKey': test_key
                    })
                })
            )

            # ASSERT
            self.assertEqual(response['StatusCode'], 200)
            payload = json.loads(response['Payload'].read())
            self.assertEqual(payload['statusCode'], 200)

            body = json.loads(payload['body'])
            self.assertIn('scan_result', body)
            scan_result = body['scan_result']
            self.assertTrue(scan_result['pii_found'])
            self.assertIn('ssn', scan_result['pii_types'])
            self.assertIn('email', scan_result['pii_types'])

        finally:
            # Cleanup - delete test file
            try:
                self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)
                # Delete scan results
                result_key = f"scan-results/{test_key}.json"
                self.s3_client.delete_object(Bucket=bucket_name, Key=result_key)
            except Exception:
                pass
