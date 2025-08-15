import json
import pytest
from moto import mock_lambda
from unittest.mock import MagicMock
import sys
import os

# Add the parent directory to sys.path to import the handler
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from index import handler, health_check

class TestLambdaHandler:
    """Test suite for the Lambda handler function."""
    
    def test_direct_invocation(self):
        """Test direct Lambda invocation without API Gateway."""
        # Mock context
        context = MagicMock()
        context.function_name = 'test-function'
        context.function_version = '1'
        context.aws_request_id = 'test-request-id'
        
        # Test event
        event = {}
        
        # Call handler
        response = handler(event, context)
        
        # Assertions
        assert response['statusCode'] == 200
        assert 'application/json' in response['headers']['Content-Type']
        
        body = json.loads(response['body'])
        assert body['message'] == 'Hello from Serverless CI/CD Pipeline!'
        assert body['method'] == 'DIRECT_INVOKE'
        assert body['function_name'] == 'test-function'
        assert 'timestamp' in body
    
    def test_api_gateway_get_request(self):
        """Test API Gateway GET request."""
        context = MagicMock()
        context.function_name = 'test-function'
        context.function_version = '1'
        context.aws_request_id = 'test-request-id'
        
        event = {
            'httpMethod': 'GET',
            'path': '/api/test',
            'queryStringParameters': {'param1': 'value1', 'param2': 'value2'}
        }
        
        response = handler(event, context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['method'] == 'GET'
        assert body['path'] == '/api/test'
        assert body['action'] == 'Retrieved data successfully'
        assert body['query_parameters'] == {'param1': 'value1', 'param2': 'value2'}
    
    def test_api_gateway_post_request(self):
        """Test API Gateway POST request with body."""
        context = MagicMock()
        context.function_name = 'test-function'
        context.function_version = '1'
        context.aws_request_id = 'test-request-id'
        
        post_data = {'name': 'test', 'value': 123}
        event = {
            'httpMethod': 'POST',
            'path': '/api/create',
            'body': json.dumps(post_data)
        }
        
        response = handler(event, context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['method'] == 'POST'
        assert body['action'] == 'Processed POST request'
        assert body['received_data'] == post_data
    
    def test_error_handling(self):
        """Test error handling in the handler."""
        context = MagicMock()
        context.function_name = 'test-function'
        context.function_version = '1'
        context.aws_request_id = 'test-request-id'
        
        # Create an event that will cause JSON parsing error
        event = {
            'httpMethod': 'POST',
            'body': 'invalid json'
        }
        
        response = handler(event, context)
        
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert body['error'] == 'Internal server error'
        assert 'message' in body
    
    def test_cors_headers(self):
        """Test that CORS headers are properly set."""
        context = MagicMock()
        event = {'httpMethod': 'GET'}
        
        response = handler(event, context)
        
        headers = response['headers']
        assert headers['Access-Control-Allow-Origin'] == '*'
        assert 'Access-Control-Allow-Headers' in headers
        assert 'Access-Control-Allow-Methods' in headers
    
    def test_health_check(self):
        """Test the health check function."""
        result = health_check()
        
        assert result['status'] == 'healthy'
        assert result['version'] == '1.0.0'
        assert 'timestamp' in result
    
    def test_different_http_methods(self):
        """Test different HTTP methods."""
        context = MagicMock()
        context.function_name = 'test-function'
        
        methods = ['PUT', 'DELETE', 'PATCH']
        expected_actions = ['Updated resource', 'Deleted resource', 'Direct invocation or unsupported method']
        
        for method, expected_action in zip(methods, expected_actions):
            event = {'httpMethod': method, 'path': '/test'}
            response = handler(event, context)
            
            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert body['method'] == method
            assert body['action'] == expected_action

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
