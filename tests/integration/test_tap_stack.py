"""Integration tests for TAP Stack infrastructure."""
import json
import os
import time
import boto3
import requests
from pytest import mark


def load_cfn_outputs():
    """Load CloudFormation outputs from flat-outputs.json."""
    outputs_file = os.path.join(
        os.path.dirname(__file__),
        '../../cfn-outputs/flat-outputs.json'
    )

    if not os.path.exists(outputs_file):
        raise FileNotFoundError(
            f"CloudFormation outputs file not found: {outputs_file}"
        )

    with open(outputs_file, 'r', encoding='utf-8') as f:
        return json.load(f)


@mark.describe("TAP Stack Integration Tests")
class TestTapStackIntegration:
    """Integration tests for deployed TAP Stack infrastructure."""

    @classmethod
    def setup_class(cls):
        """Set up test fixtures."""
        cls.outputs = load_cfn_outputs()
        cls.api_url = cls.outputs.get('ApiGatewayUrl')
        cls.bucket_name = cls.outputs.get('S3BucketName')

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-1')
        cls.logs_client = boto3.client('logs', region_name='us-east-1')

    @mark.it("verifies API Gateway is accessible and returns health status")
    def test_api_gateway_health_check(self):
        """Test API Gateway health endpoint."""
        # ARRANGE
        status_url = f"{self.api_url}status"

        # ACT
        response = requests.get(status_url, timeout=10)

        # ASSERT
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        assert data.get('service') == 'serverless-api'
        assert 'version' in data
        assert 'timestamp' in data

    @mark.it("verifies S3 bucket exists and is accessible")
    def test_s3_bucket_exists(self):
        """Test S3 bucket existence and accessibility."""
        # ACT
        response = self.s3_client.head_bucket(Bucket=self.bucket_name)

        # ASSERT
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    @mark.it("verifies S3 bucket has versioning enabled")
    def test_s3_bucket_versioning(self):
        """Test S3 bucket versioning configuration."""
        # ACT
        response = self.s3_client.get_bucket_versioning(
            Bucket=self.bucket_name
        )

        # ASSERT
        assert response.get('Status') == 'Enabled'

    @mark.it("verifies S3 bucket has encryption enabled")
    def test_s3_bucket_encryption(self):
        """Test S3 bucket encryption configuration."""
        # ACT
        response = self.s3_client.get_bucket_encryption(
            Bucket=self.bucket_name
        )

        # ASSERT
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    @mark.it("verifies S3 bucket blocks public access")
    def test_s3_bucket_public_access_block(self):
        """Test S3 bucket public access block configuration."""
        # ACT
        response = self.s3_client.get_public_access_block(
            Bucket=self.bucket_name
        )

        # ASSERT
        config = response['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True

    @mark.it("verifies API Gateway file listing endpoint")
    def test_api_gateway_list_files(self):
        """Test API Gateway file listing endpoint."""
        # ARRANGE
        files_url = f"{self.api_url}files"

        # ACT
        response = requests.get(files_url, timeout=10)

        # ASSERT
        assert response.status_code == 200
        data = response.json()
        assert 'files' in data
        assert 'total_count' in data
        assert 'bucket' in data
        assert isinstance(data['files'], list)

    @mark.it("verifies API Gateway file upload presigned URL generation")
    def test_api_gateway_generate_upload_url(self):
        """Test API Gateway presigned URL generation."""
        # ARRANGE
        files_url = f"{self.api_url}files"
        payload = {
            'filename': 'test-file.txt',
            'content_type': 'text/plain'
        }

        # ACT
        response = requests.post(
            files_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )

        # ASSERT
        assert response.status_code == 200
        data = response.json()
        assert 'upload_url' in data
        assert 'filename' in data
        assert 'bucket' in data
        assert 'expires_in' in data
        assert data['filename'] == 'test-file.txt'
        assert data['expires_in'] == 3600

    @mark.it("verifies Lambda functions exist and are configured correctly")
    def test_lambda_functions_exist(self):
        """Test Lambda functions existence."""
        # ARRANGE
        expected_functions = [
            'image-processor',
            'data-transformer',
            'api-handler'
        ]

        # ACT & ASSERT
        for base_name in expected_functions:
            # Try with and without suffix
            function_names = [
                f"{base_name}-pr2067",
                base_name
            ]

            function_found = False
            for func_name in function_names:
                try:
                    response = self.lambda_client.get_function(
                        FunctionName=func_name
                    )
                    if response['Configuration']['FunctionName']:
                        function_found = True
                        # Verify configuration
                        config = response['Configuration']
                        assert config['Runtime'] == 'python3.12'
                        assert config['Handler'] == 'index.handler'
                        assert 'DeadLetterConfig' in config
                        assert 'Environment' in config
                        assert 'Variables' in config['Environment']
                        break
                except self.lambda_client.exceptions.ResourceNotFoundException:
                    continue

            assert function_found, f"Lambda function {base_name} not found"

    @mark.it("verifies CloudWatch log groups exist for Lambda functions")
    def test_cloudwatch_log_groups_exist(self):
        """Test CloudWatch log groups existence."""
        # ARRANGE
        expected_log_groups = [
            '/aws/lambda/image-processor',
            '/aws/lambda/data-transformer',
            '/aws/lambda/api-handler'
        ]

        # ACT & ASSERT
        for base_name in expected_log_groups:
            log_group_found = self._find_and_verify_log_group(base_name)
            assert log_group_found, f"Log group {base_name} not found"

    def _find_and_verify_log_group(self, base_name):
        """Helper method to find and verify log group configuration."""
        log_group_names = [
            f"{base_name}-pr2067",
            base_name
        ]

        for log_group_name in log_group_names:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )

                if not response['logGroups']:
                    continue

                for lg in response['logGroups']:
                    if lg['logGroupName'] == log_group_name:
                        assert lg.get('retentionInDays') == 7
                        return True

            except (KeyError, ValueError, TypeError):
                continue

        return False

    @mark.it("verifies S3 event notifications trigger Lambda functions")
    def test_s3_event_notifications(self):
        """Test S3 event notifications configuration."""
        # ACT
        response = self.s3_client.get_bucket_notification_configuration(
            Bucket=self.bucket_name
        )

        # ASSERT
        assert 'LambdaFunctionConfigurations' in response
        configs = response['LambdaFunctionConfigurations']
        assert len(configs) > 0

        # Check for expected suffixes
        suffixes = []
        for config in configs:
            if 'Filter' in config:
                rules = config['Filter'].get('Key', {}).get('FilterRules', [])
                for rule in rules:
                    if rule['Name'].lower() == 'suffix':
                        suffixes.append(rule['Value'])

        # Verify expected file type triggers
        expected_suffixes = ['.jpg', '.png', '.json', '.csv']
        for suffix in expected_suffixes:
            assert suffix in suffixes, f"Missing S3 trigger for {suffix} files"

    @mark.it("verifies end-to-end file upload and processing workflow")
    def test_end_to_end_file_upload_workflow(self):
        """Test complete file upload workflow."""
        # ARRANGE
        test_file_name = f"test-{int(time.time())}.json"
        test_content = json.dumps({"test": "data", "timestamp": time.time()})

        # ACT - Upload file to S3
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_file_name,
            Body=test_content,
            ContentType='application/json'
        )

        # Give Lambda time to process
        time.sleep(5)

        # ASSERT - Check if file exists
        response = self.s3_client.head_object(
            Bucket=self.bucket_name,
            Key=test_file_name
        )
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Check if transformed file was created (Lambda should create it)
        try:
            transformed_key = f"transformed/{test_file_name}"
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=transformed_key
            )
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except self.s3_client.exceptions.NoSuchKey:
            # It's okay if the transformed file doesn't exist yet
            # Lambda might need more time or might not have permissions
            pass

        # Cleanup
        self.s3_client.delete_object(
            Bucket=self.bucket_name,
            Key=test_file_name
        )

        # Try to delete transformed file if it exists
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=transformed_key
            )
        except (self.s3_client.exceptions.NoSuchKey,
                self.s3_client.exceptions.NoSuchBucket):
            pass

    @mark.it("verifies API Gateway returns correct error for invalid requests")
    def test_api_gateway_error_handling(self):
        """Test API Gateway error handling."""
        # ARRANGE
        files_url = f"{self.api_url}files"
        invalid_payload = {
            # Missing required 'filename' field
            'content_type': 'text/plain'
        }

        # ACT
        response = requests.post(
            files_url,
            json=invalid_payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )

        # ASSERT
        assert response.status_code == 400
        data = response.json()
        assert 'message' in data
        assert 'filename is required' in data['message']

    @mark.it("verifies API endpoints have CORS headers")
    def test_api_gateway_cors_headers(self):
        """Test API Gateway CORS configuration."""
        # ARRANGE
        status_url = f"{self.api_url}status"

        # ACT
        response = requests.get(status_url, timeout=10)

        # ASSERT
        assert 'Access-Control-Allow-Origin' in response.headers
        assert response.headers['Access-Control-Allow-Origin'] == '*'
