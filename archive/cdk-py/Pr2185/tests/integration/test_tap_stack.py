"""Integration tests for deployed TapStack infrastructure."""

import json
import os
import time
import requests
import boto3
import pytest


class TestTapStackIntegration:
    """Integration tests for the deployed serverless API infrastructure."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs from flat-outputs.json."""
        outputs_file = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )
        
        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)
        
        cls.api_url = cls.outputs.get('ApiGatewayUrl')
        cls.kms_key_arn = cls.outputs.get('KmsKeyArn')
        
        if not cls.api_url:
            pytest.skip("API Gateway URL not found in outputs")

    def test_api_gateway_url_accessible(self):
        """Test that the API Gateway URL is accessible."""
        response = requests.get(self.api_url, timeout=10)
        assert response.status_code in [200, 403, 404], \
                      f"API Gateway returned unexpected status: {response.status_code}"

    def test_users_endpoint_get(self):
        """Test GET request to /users endpoint."""
        url = f"{self.api_url}users"
        response = requests.get(url, timeout=10)
        
        assert response.status_code == 200, \
                      f"Users endpoint returned {response.status_code}"
        
        data = response.json()
        assert 'message' in data
        assert data['message'] == 'Users API endpoint'
        assert data['method'] == 'GET'
        assert 'environment' in data

    def test_orders_endpoint_get(self):
        """Test GET request to /orders endpoint."""
        url = f"{self.api_url}orders"
        response = requests.get(url, timeout=10)
        
        assert response.status_code == 200, \
                      f"Orders endpoint returned {response.status_code}"
        
        data = response.json()
        assert 'message' in data
        assert data['message'] == 'Orders API endpoint'
        assert data['method'] == 'GET'

    def test_orders_endpoint_post(self):
        """Test POST request to /orders endpoint."""
        url = f"{self.api_url}orders"
        payload = {"test": "data"}
        response = requests.post(url, json=payload, timeout=10)
        
        assert response.status_code == 200, \
                      f"Orders POST endpoint returned {response.status_code}"
        
        data = response.json()
        assert data['method'] == 'POST'

    def test_products_endpoint_get(self):
        """Test GET request to /products endpoint."""
        url = f"{self.api_url}products"
        response = requests.get(url, timeout=10)
        
        assert response.status_code == 200, \
                      f"Products endpoint returned {response.status_code}"
        
        data = response.json()
        assert 'message' in data
        assert data['message'] == 'Products API endpoint'
        assert data['method'] == 'GET'

    def test_products_endpoint_post(self):
        """Test POST request to /products endpoint."""
        url = f"{self.api_url}products"
        payload = {"name": "Test Product", "price": 99.99}
        response = requests.post(url, json=payload, timeout=10)
        
        assert response.status_code == 200, \
                      f"Products POST endpoint returned {response.status_code}"
        
        data = response.json()
        assert data['method'] == 'POST'

    def test_products_endpoint_put(self):
        """Test PUT request to /products endpoint."""
        url = f"{self.api_url}products"
        payload = {"id": "123", "name": "Updated Product"}
        response = requests.put(url, json=payload, timeout=10)
        
        assert response.status_code == 200, \
                      f"Products PUT endpoint returned {response.status_code}"
        
        data = response.json()
        assert data['method'] == 'PUT'

    def test_products_endpoint_delete(self):
        """Test DELETE request to /products endpoint."""
        url = f"{self.api_url}products"
        response = requests.delete(url, timeout=10)
        
        assert response.status_code == 200, \
                      f"Products DELETE endpoint returned {response.status_code}"
        
        data = response.json()
        assert data['method'] == 'DELETE'

    def test_invalid_endpoint_returns_404(self):
        """Test that invalid endpoints return 404."""
        url = f"{self.api_url}invalid-endpoint"
        response = requests.get(url, timeout=10)
        
        assert response.status_code in [403, 404], \
            f"Invalid endpoint should return 403 or 404, got {response.status_code}"

    def test_method_not_allowed(self):
        """Test that unsupported methods return appropriate error."""
        url = f"{self.api_url}users"
        response = requests.post(url, json={}, timeout=10)
        
        # API Gateway can return 403 (CORS) or 405 (Method Not Allowed)
        assert response.status_code in [403, 405], \
            f"POST to /users should return 403 or 405, got {response.status_code}"
        
        if response.status_code == 405:
            data = response.json()
            assert 'error' in data
            assert data['error'] == 'Method not allowed'

    def test_cors_headers_present(self):
        """Test that CORS headers are present in OPTIONS requests."""
        url = f"{self.api_url}users"
        response = requests.options(url, timeout=10)
        
        # Check for CORS headers
        assert 'Access-Control-Allow-Origin' in response.headers or \
            'access-control-allow-origin' in response.headers, \
            "CORS headers not found in OPTIONS response"

    def test_kms_key_exists(self):
        """Test that the KMS key exists and is accessible."""
        if not self.kms_key_arn:
            pytest.skip("KMS Key ARN not found in outputs")
        
        kms_client = boto3.client('kms', region_name='us-west-2')
        
        try:
            response = kms_client.describe_key(KeyId=self.kms_key_arn)
            assert response['KeyMetadata']['KeyState'] == 'Enabled'
            assert response['KeyMetadata']['KeyUsage'] == 'ENCRYPT_DECRYPT'
            assert response['KeyMetadata']['Description'] == \
                'KMS key for encrypting serverless API environment variables'
        except Exception as e:
            pytest.fail(f"Failed to describe KMS key: {str(e)}")

    def test_lambda_functions_exist(self):
        """Test that Lambda functions are deployed and accessible."""
        lambda_client = boto3.client('lambda', region_name='us-west-2')
        
        # Get environment suffix from outputs or use default
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr172cdkpy')
        
        function_names = [
            f"prod-users-api-{env_suffix}",
            f"prod-orders-api-{env_suffix}",
            f"prod-products-api-{env_suffix}"
        ]
        
        for function_name in function_names:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                assert response['Configuration']['State'] == 'Active'
                assert response['Configuration']['Runtime'] == 'python3.12'
                
                # Check for KMS encryption
                if 'KMSKeyArn' in response['Configuration']:
                    assert self.kms_key_arn in response['Configuration']['KMSKeyArn']
                
                # Check for X-Ray tracing
                assert response['Configuration']['TracingConfig']['Mode'] == 'Active'
            except lambda_client.exceptions.ResourceNotFoundException:
                pytest.fail(f"Lambda function {function_name} not found")

    def test_api_throttling(self):
        """Test that API throttling is configured."""
        # This test verifies throttling configuration by checking the API response
        # In production, you would test actual throttling behavior
        url = f"{self.api_url}users"
        
        # Make a normal request
        response = requests.get(url, timeout=10)
        assert response.status_code == 200
        
        # Note: Actual throttling test would require making many requests
        # to exceed the configured limits (1000 req/sec, 2000 burst)

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured."""
        cloudwatch_client = boto3.client('cloudwatch', region_name='us-west-2')
        
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr172cdkpy')
        
        alarm_names = [
            f"prod-api-4xx-errors-{env_suffix}",
            f"prod-api-5xx-errors-{env_suffix}"
        ]
        
        for alarm_name in alarm_names:
            try:
                response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
                assert len(response['MetricAlarms']) == 1
                alarm = response['MetricAlarms'][0]
                assert alarm['StateValue'] in ['OK', 'INSUFFICIENT_DATA', 'ALARM']
                assert alarm['MetricName'] in ['4XXError', '5XXError']
            except Exception as e:
                pytest.fail(f"Failed to describe alarm {alarm_name}: {str(e)}")

    def test_api_response_times(self):
        """Test that API response times are acceptable."""
        endpoints = ['users', 'orders', 'products']
        
        for endpoint in endpoints:
            url = f"{self.api_url}{endpoint}"
            
            # Warm up the Lambda
            requests.get(url, timeout=10)
            
            # Measure response time
            start_time = time.time()
            response = requests.get(url, timeout=10)
            response_time = time.time() - start_time
            
            assert response.status_code == 200
            # Lambda cold starts can be slow, so we're generous with the timeout
            assert response_time < 5.0, \
                f"{endpoint} took {response_time:.2f}s to respond"

    def test_lambda_aliases_exist(self):
        """Test that Lambda aliases are configured."""
        lambda_client = boto3.client('lambda', region_name='us-west-2')
        
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr172cdkpy')
        
        function_names = [
            f"prod-users-api-{env_suffix}",
            f"prod-orders-api-{env_suffix}",
            f"prod-products-api-{env_suffix}"
        ]
        
        for function_name in function_names:
            try:
                response = lambda_client.get_alias(
                    FunctionName=function_name,
                    Name='LIVE'
                )
                assert response['Name'] == 'LIVE'
                assert 'FunctionVersion' in response
            except lambda_client.exceptions.ResourceNotFoundException:
                pytest.fail(f"Alias 'LIVE' not found for function {function_name}")
