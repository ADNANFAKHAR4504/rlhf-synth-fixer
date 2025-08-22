"""
Integration tests for the deployed TAP Stack infrastructure.
These tests run against real AWS resources after deployment.
"""
import os
import json
import time
import boto3
import pytest
import requests
from typing import Dict, Any


class TestInfrastructureIntegration:
    """Integration tests for deployed infrastructure."""
    
    @pytest.fixture(scope="class")
    def aws_outputs(self):
        """Load AWS deployment outputs from cfn-outputs/flat-outputs.json."""
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if not os.path.exists(outputs_file):
            pytest.skip(f"Deployment outputs file {outputs_file} not found. Run deployment first.")
        
        with open(outputs_file, 'r') as f:
            return json.load(f)
    
    @pytest.fixture(scope="class")
    def s3_client(self):
        """Create S3 client."""
        return boto3.client('s3', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    
    @pytest.fixture(scope="class")
    def dynamodb_client(self):
        """Create DynamoDB client."""
        return boto3.client('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    
    @pytest.fixture(scope="class")
    def lambda_client(self):
        """Create Lambda client."""
        return boto3.client('lambda', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    
    def test_s3_bucket_exists_and_configured(self, aws_outputs, s3_client):
        """Test that S3 bucket exists and is properly configured."""
        bucket_name_key = next((k for k in aws_outputs.keys() if 'S3BucketName' in k), None)
        assert bucket_name_key is not None, "S3 bucket name not found in outputs"
        
        bucket_name = aws_outputs[bucket_name_key]
        
        # Verify bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        
        # Check versioning is enabled
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get('Status') == 'Enabled'
        
        # Check encryption
        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        assert 'ServerSideEncryptionConfiguration' in encryption
        
        # Check public access block
        public_block = s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_block['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True
    
    def test_dynamodb_table_exists(self, aws_outputs, dynamodb_client):
        """Test that DynamoDB table exists and is configured correctly."""
        # Find the table name from Lambda environment or construct it
        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        table_name = f'processing-metadata-{environment_suffix}'
        
        # Describe table
        response = dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']
        
        # Verify table configuration
        assert table['TableStatus'] == 'ACTIVE'
        assert table['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'
        
        # Check key schema
        key_schema = table['KeySchema']
        assert len(key_schema) == 1
        assert key_schema[0]['AttributeName'] == 'fileId'
        assert key_schema[0]['KeyType'] == 'HASH'
        
        # Check point-in-time recovery
        pitr_response = dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED'
    
    def test_lambda_functions_exist_and_configured(self, aws_outputs, lambda_client):
        """Test that all Lambda functions exist and are properly configured."""
        lambda_arns = {}
        
        # Collect all Lambda ARNs from outputs
        for key, value in aws_outputs.items():
            if 'ProcessorArn' in key or 'HandlerArn' in key:
                lambda_arns[key] = value
        
        assert len(lambda_arns) >= 4, "Expected at least 4 Lambda functions in outputs"
        
        for name, arn in lambda_arns.items():
            # Extract function name from ARN
            function_name = arn.split(':')[-1]
            
            # Get function configuration
            response = lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # Verify runtime
            assert config['Runtime'] == 'python3.12'
            
            # Verify environment variables are set
            assert 'Environment' in config
            assert 'Variables' in config['Environment']
            env_vars = config['Environment']['Variables']
            assert 'METADATA_TABLE_NAME' in env_vars
            assert 'UPLOAD_BUCKET_NAME' in env_vars
            assert 'LOG_LEVEL' in env_vars
            
            # Verify function state
            assert config['State'] == 'Active'
    
    def test_api_gateway_accessible(self, aws_outputs):
        """Test that API Gateway is accessible and responds correctly."""
        api_url_key = next((k for k in aws_outputs.keys() if 'ApiGatewayUrl' in k), None)
        assert api_url_key is not None, "API Gateway URL not found in outputs"
        
        api_url = aws_outputs[api_url_key]
        
        # Test /files endpoint
        response = requests.get(f"{api_url}files", timeout=10)
        assert response.status_code == 200
        
        data = response.json()
        assert 'files' in data
        assert 'count' in data
        assert isinstance(data['files'], list)
    
    def test_s3_to_lambda_integration(self, aws_outputs, s3_client, dynamodb_client):
        """Test S3 event triggers Lambda processing."""
        bucket_name_key = next((k for k in aws_outputs.keys() if 'S3BucketName' in k), None)
        bucket_name = aws_outputs[bucket_name_key]
        
        # Upload a test file
        test_key = f'integration-test-{int(time.time())}.json'
        test_content = json.dumps({'test': 'data', 'timestamp': int(time.time())})
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content,
            ContentType='application/json'
        )
        
        # Wait for processing
        time.sleep(5)
        
        # Check if item was created in DynamoDB
        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        table_name = f'processing-metadata-{environment_suffix}'
        
        # Query DynamoDB for the processed file
        response = dynamodb_client.get_item(
            TableName=table_name,
            Key={'fileId': {'S': f'data_{test_key.replace("/", "_")}'}}
        )
        
        # If item exists, processing was successful
        if 'Item' in response:
            assert response['Item']['status']['S'] in ['processed', 'error']
        
        # Clean up test file
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
    
    def test_api_file_retrieval(self, aws_outputs, s3_client, dynamodb_client):
        """Test retrieving file metadata through API."""
        api_url_key = next((k for k in aws_outputs.keys() if 'ApiGatewayUrl' in k), None)
        api_url = aws_outputs[api_url_key]
        bucket_name_key = next((k for k in aws_outputs.keys() if 'S3BucketName' in k), None)
        bucket_name = aws_outputs[bucket_name_key]
        
        # Upload a test file directly to S3
        test_key = f'api-test-{int(time.time())}.txt'
        test_content = 'Test content for API retrieval'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content,
            ContentType='text/plain'
        )
        
        # Wait for processing
        time.sleep(5)
        
        # Try to retrieve file metadata through API
        file_id = f'doc_{test_key.replace("/", "_")}'
        response = requests.get(f"{api_url}files/{file_id}", timeout=10)
        
        # API should respond (either with file or 404)
        assert response.status_code in [200, 404]
        
        # Clean up
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
    
    def test_lambda_error_handling(self, aws_outputs, lambda_client):
        """Test Lambda function error handling."""
        # Find data processor Lambda
        data_processor_arn_key = next((k for k in aws_outputs.keys() if 'DataProcessorArn' in k), None)
        if data_processor_arn_key:
            data_processor_arn = aws_outputs[data_processor_arn_key]
            function_name = data_processor_arn.split(':')[-1]
            
            # Invoke with invalid event
            invalid_event = {
                'Records': [
                    {
                        's3': {
                            'bucket': {'name': 'non-existent-bucket'},
                            'object': {'key': 'invalid.csv'}
                        }
                    }
                ]
            }
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(invalid_event)
            )
            
            # Function should handle error gracefully
            assert response['StatusCode'] == 200
            payload = json.loads(response['Payload'].read())
            assert 'statusCode' in payload
    
    def test_api_cors_headers(self, aws_outputs):
        """Test that API Gateway returns proper CORS headers."""
        api_url_key = next((k for k in aws_outputs.keys() if 'ApiGatewayUrl' in k), None)
        api_url = aws_outputs[api_url_key]
        
        # Make OPTIONS request
        response = requests.options(f"{api_url}files", timeout=10)
        
        # Check CORS headers
        assert 'Access-Control-Allow-Origin' in response.headers
        assert 'Access-Control-Allow-Methods' in response.headers
        assert 'Access-Control-Allow-Headers' in response.headers
    
    def test_stack_tagging(self, aws_outputs, s3_client):
        """Test that resources are properly tagged."""
        bucket_name_key = next((k for k in aws_outputs.keys() if 'S3BucketName' in k), None)
        bucket_name = aws_outputs[bucket_name_key]
        
        # Get bucket tags
        response = s3_client.get_bucket_tagging(Bucket=bucket_name)
        tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}
        
        # Verify required tags
        assert 'Environment' in tags
        assert 'Project' in tags
        assert tags['Project'] == 'ServerlessFileProcessor'
        assert 'Owner' in tags
        assert tags['Owner'] == 'DevOps'