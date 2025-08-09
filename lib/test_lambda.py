"""
Unit tests for the serverless Lambda function
Tests Lambda handler functionality and API Gateway integration simulation
"""

import json
import os
import sys
import unittest
from unittest.mock import MagicMock

from . import lambda_function

# Add the current directory to Python path to import lambda_function
sys.path.insert(0, os.path.dirname(__file__))


class TestLambdaFunction(unittest.TestCase):
    """Test cases for Lambda function handler"""

    def setUp(self):
        """Set up test fixtures before each test method"""
        # Mock Lambda context
        self.mock_context = MagicMock()
        self.mock_context.function_name = "test-api-handler"
        self.mock_context.function_version = "1"
        self.mock_context.aws_request_id = "test-request-id-123"
        self.mock_context.memory_limit_in_mb = 128

        # Set environment variables for testing
        os.environ['ENVIRONMENT'] = 'test'
        os.environ['LOG_LEVEL'] = 'INFO'

    def create_api_gateway_event(self, method='GET', path='/',
                                 query_params=None, headers=None):
        """
        Create a mock API Gateway event

        Args:
            method (str): HTTP method
            path (str): Request path
            query_params (dict): Query parameters
            headers (dict): Request headers

        Returns:
            dict: Mock API Gateway event
        """
        return {
            "httpMethod": method,
            "path": path,
            "queryStringParameters": query_params,
            "headers": headers or {
                "User-Agent": "test-client/1.0",
                "Content-Type": "application/json"
            },
            "body": None,
            "isBase64Encoded": False,
            "requestContext": {
                "requestId": "test-request-123",
                "stage": "test"
            }
        }

    def test_successful_get_request_root_path(self):
        """Test successful GET request to root path"""
        # Arrange
        event = self.create_api_gateway_event(method='GET', path='/')

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertIn('Content-Type', response['headers'])
        self.assertEqual(response['headers']
                         ['Content-Type'], 'application/json')

        # Parse response body
        body = json.loads(response['body'])
        self.assertIn('message', body)
        self.assertIn('timestamp', body)
        self.assertIn('environment', body)
        self.assertIn('request_info', body)
        self.assertIn('lambda_info', body)

        # Verify request info
        self.assertEqual(body['request_info']['method'], 'GET')
        self.assertEqual(body['request_info']['path'], '/')
        self.assertEqual(body['environment'], 'test')

        # Verify lambda info
        self.assertEqual(body['lambda_info']
                         ['function_name'], 'test-api-handler')
        self.assertEqual(body['lambda_info']
                         ['request_id'], 'test-request-id-123')

    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        # Arrange
        event = self.create_api_gateway_event(method='GET', path='/health')

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        self.assertIn('status', body)
        self.assertEqual(body['status'], 'healthy')
        self.assertIn('Service is running normally', body['message'])

    def test_info_endpoint(self):
        """Test info endpoint"""
        # Arrange
        event = self.create_api_gateway_event(method='GET', path='/info')

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        self.assertIn('Serverless application information', body['message'])

    def test_post_request_with_query_params(self):
        """Test POST request with query parameters"""
        # Arrange
        query_params = {"param1": "value1", "param2": "value2"}
        event = self.create_api_gateway_event(
            method='POST',
            path='/api/test',
            query_params=query_params
        )

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        self.assertEqual(body['request_info']['method'], 'POST')
        self.assertEqual(body['request_info']['path'], '/api/test')
        self.assertEqual(body['request_info']
                         ['query_parameters'], query_params)

    def test_cors_headers_present(self):
        """Test that CORS headers are present in response"""
        # Arrange
        event = self.create_api_gateway_event()

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        headers = response['headers']
        self.assertIn('Access-Control-Allow-Origin', headers)
        self.assertIn('Access-Control-Allow-Methods', headers)
        self.assertIn('Access-Control-Allow-Headers', headers)
        self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

    def test_exception_handling(self):
        """Test exception handling in lambda function"""
        # Arrange - Create an event that might cause issues
        event = None  # This should cause an exception

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 500)

        body = json.loads(response['body'])
        self.assertIn('error', body)
        self.assertIn('Internal server error', body['error'])
        self.assertIn('request_id', body)

    def test_health_check_function(self):
        """Test standalone health check function"""
        # Act
        result = lambda_function.health_check()

        # Assert
        self.assertIn('status', result)
        self.assertEqual(result['status'], 'healthy')
        self.assertIn('timestamp', result)
        self.assertIn('service', result)
        self.assertEqual(result['service'], 'serverless-web-app')

    def test_response_structure_consistency(self):
        """Test that response structure is consistent across different requests"""
        # Arrange
        test_paths = ['/', '/health', '/info', '/api/test']

        for path in test_paths:
            with self.subTest(path=path):
                # Arrange
                event = self.create_api_gateway_event(path=path)

                # Act
                response = lambda_function.lambda_handler(
                    event, self.mock_context)

                # Assert
                self.assertIn('statusCode', response)
                self.assertIn('headers', response)
                self.assertIn('body', response)
                self.assertEqual(response['statusCode'], 200)

                # Verify body is valid JSON
                body = json.loads(response['body'])
                self.assertIn('timestamp', body)
                self.assertIn('environment', body)


class TestAPIGatewayIntegration(unittest.TestCase):
    """Integration tests simulating API Gateway behavior"""

    def setUp(self):
        """Set up test fixtures"""
        self.mock_context = MagicMock()
        self.mock_context.function_name = "dev-api-handler"
        self.mock_context.function_version = "1"
        self.mock_context.aws_request_id = "integration-test-123"
        self.mock_context.memory_limit_in_mb = 128

    def test_api_gateway_proxy_integration(self):
        """Test API Gateway proxy integration simulation"""
        # Simulate API Gateway proxy integration event
        event = {
            "resource": "/{proxy+}",
            "path": "/api/users",
            "httpMethod": "GET",
            "headers": {
                "Accept": "application/json",
                "User-Agent": "Amazon CloudFront"
            },
            "queryStringParameters": {"limit": "10"},
            "pathParameters": {"proxy": "api/users"},
            "requestContext": {
                "requestId": "integration-test-request",
                "stage": "dev",
                "httpMethod": "GET"
            },
            "body": None,
            "isBase64Encoded": False
        }

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertIn('application/json', response['headers']['Content-Type'])

        body = json.loads(response['body'])
        self.assertEqual(body['request_info']['method'], 'GET')
        self.assertEqual(body['request_info']['path'], '/api/users')
        self.assertIn('limit', body['request_info']['query_parameters'])


if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)
