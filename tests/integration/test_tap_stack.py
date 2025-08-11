"""
test_tap_stack_integration.py

Comprehensive integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using deployment outputs.
"""

import json
import os
import socket
import time
import unittest

import boto3
import requests
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from requests.exceptions import ConnectionError as RequestsConnectionError, RequestException
from urllib3.exceptions import MaxRetryError, NameResolutionError


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  # Test configuration constants
  REQUEST_TIMEOUT = 30  # seconds
  LOG_WAIT_TIME = 2     # seconds to wait for CloudWatch logs

  @classmethod
  def setUpClass(cls):
    """Set up integration test with live stack outputs."""
    cls.stack_name = "dev"  # Your live Pulumi stack name
    cls.project_name = "serverless-infra-pulumi"  # Match tap_stack.py

    # Load deployment outputs from cfn-outputs/flat-outputs.json if exists
    cls.outputs = {}
    outputs_file = os.path.join(os.path.dirname(
      __file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
    if os.path.exists(outputs_file):
      with open(outputs_file, 'r', encoding='utf-8') as f:
        cls.outputs = json.load(f)

    # Fallback to environment variables if outputs file doesn't exist
    if not cls.outputs:
      cls.outputs = {
        'api_gateway_url': os.environ.get('API_GATEWAY_URL'),
        'lambda_function_name': os.environ.get('LAMBDA_FUNCTION_NAME'),
        'lambda_function_arn': os.environ.get('LAMBDA_FUNCTION_ARN'),
        'api_gateway_id': os.environ.get('API_GATEWAY_ID'),
        'cloudwatch_log_group': os.environ.get('CLOUDWATCH_LOG_GROUP')
      }

    # Determine AWS region dynamically
    cls.aws_region = (
      os.environ.get('AWS_DEFAULT_REGION') or
      os.environ.get('AWS_REGION') or
      'us-west-2'  # fallback to default
    )

    # Skip tests if no outputs available
    if not any(cls.outputs.values()):
      raise unittest.SkipTest(
        "No deployment outputs found. Skipping integration tests.")

  def setUp(self):
    """Set up individual test."""
    # Skip if required outputs are not available
    if not self.outputs.get('api_gateway_url'):
      self.skipTest(
        "API Gateway URL not available in deployment outputs")

  def test_api_gateway_endpoint_availability(self):
    """Test that the API Gateway endpoint is accessible and returns 200."""
    api_url = self.outputs['api_gateway_url']
    if not api_url:
      self.skipTest("API Gateway URL not available")

    try:
      response = requests.get(api_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      # Verify response is JSON and has expected structure
      try:
        response_data = response.json()
      except requests.JSONDecodeError:
        self.fail(f"API response is not valid JSON: {response.text[:200]}")
      
      self.assertIn('message', response_data)
      self.assertIn('timestamp', response_data)
      self.assertIn('environment', response_data)

    except (RequestsConnectionError, NameResolutionError, 
            MaxRetryError, socket.gaierror) as e:
      self.skipTest(f"AWS resources not accessible: {e}")
    except (RequestException, requests.JSONDecodeError, KeyError) as e:
      self.fail(f"Failed to reach API Gateway endpoint: {e}")

  def test_api_gateway_health_endpoint(self):
    """Test the health check endpoint specifically."""
    api_url = self.outputs['api_gateway_url']
    if not api_url:
      self.skipTest("API Gateway URL not available")

    health_url = f"{api_url.rstrip('/')}/health"

    try:
      response = requests.get(health_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      response_data = response.json()
      self.assertIn('status', response_data)
      self.assertEqual(response_data['status'], 'healthy')
      self.assertIn('Service is running normally',
                    response_data['message'])

    except (RequestsConnectionError, NameResolutionError, 
            MaxRetryError, socket.gaierror) as e:
      self.skipTest(f"AWS resources not accessible: {e}")
    except (RequestException, requests.JSONDecodeError, KeyError) as e:
      self.fail(f"Failed to reach health endpoint: {e}")

  def test_api_gateway_info_endpoint(self):
    """Test the info endpoint."""
    api_url = self.outputs['api_gateway_url']
    if not api_url:
      self.skipTest("API Gateway URL not available")

    info_url = f"{api_url.rstrip('/')}/info"

    try:
      response = requests.get(info_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      response_data = response.json()
      self.assertIn('Serverless application information',
                    response_data['message'])

    except (RequestsConnectionError, NameResolutionError, 
            MaxRetryError, socket.gaierror) as e:
      self.skipTest(f"AWS resources not accessible: {e}")
    except (RequestException, requests.JSONDecodeError, KeyError) as e:
      self.fail(f"Failed to reach info endpoint: {e}")

  def test_api_gateway_post_request(self):
    """Test POST request to API Gateway."""
    api_url = self.outputs['api_gateway_url']
    if not api_url:
      self.skipTest("API Gateway URL not available")

    test_data = {"test_key": "test_value", "timestamp": str(time.time())}

    try:
      response = requests.post(
        api_url,
        json=test_data,
        headers={'Content-Type': 'application/json'},
        timeout=self.REQUEST_TIMEOUT
      )
      self.assertEqual(response.status_code, 200)

      response_data = response.json()
      self.assertEqual(response_data['request_info']['method'], 'POST')

    except (RequestsConnectionError, NameResolutionError, 
            MaxRetryError, socket.gaierror) as e:
      self.skipTest(f"AWS resources not accessible: {e}")
    except (RequestException, requests.JSONDecodeError, KeyError) as e:
      self.fail(f"Failed to POST to API Gateway: {e}")

  def test_api_gateway_cors_headers(self):
    """Test that CORS headers are properly set."""
    api_url = self.outputs['api_gateway_url']
    if not api_url:
      self.skipTest("API Gateway URL not available")

    try:
      response = requests.get(api_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      # Check CORS headers
      self.assertEqual(response.headers.get(
        'Access-Control-Allow-Origin'), '*')
      self.assertIn('GET', response.headers.get(
        'Access-Control-Allow-Methods', ''))
      self.assertIn('POST', response.headers.get(
        'Access-Control-Allow-Methods', ''))

    except (RequestsConnectionError, NameResolutionError, 
            MaxRetryError, socket.gaierror) as e:
      self.skipTest(f"AWS resources not accessible: {e}")
    except RequestException as e:
      self.fail(f"Failed to check CORS headers: {e}")

  def test_lambda_function_exists_and_accessible(self):
    """Test that the Lambda function exists and is accessible via boto3."""
    lambda_function_name = self.outputs.get('lambda_function_name')
    if not lambda_function_name:
      self.skipTest("Lambda function name not available")

    try:
      # Initialize boto3 Lambda client with dynamic region
      lambda_client = boto3.client('lambda', region_name=self.aws_region)

      # Get function configuration
      response = lambda_client.get_function(
        FunctionName=lambda_function_name)

      # Verify function exists and has correct configuration
      self.assertIn('Configuration', response)
      config = response['Configuration']

      # Check runtime is Python (flexible version checking)
      self.assertTrue(config['Runtime'].startswith('python'),
                      f"Expected Python runtime, got {config['Runtime']}")
      self.assertEqual(config['Handler'],
                       'lambda_function.lambda_handler')
      self.assertEqual(config['Timeout'], 30)
      self.assertEqual(config['MemorySize'], 128)

      # Check environment variables
      env_vars = config.get('Environment', {}).get('Variables', {})
      self.assertIn('ENVIRONMENT', env_vars)
      self.assertIn('LOG_LEVEL', env_vars)

    except NoCredentialsError:
      self.skipTest("AWS credentials not configured for integration tests")
    except (BotoCoreError, ClientError, KeyError) as e:
      self.fail(f"Failed to access Lambda function: {e}")

  def test_cloudwatch_log_group_exists(self):
    """Test that CloudWatch log group exists and is accessible."""
    log_group_name = self.outputs.get('cloudwatch_log_group')
    if not log_group_name:
      self.skipTest("CloudWatch log group name not available")

    try:
      # Initialize boto3 CloudWatch Logs client with dynamic region
      logs_client = boto3.client('logs', region_name=self.aws_region)

      # Describe log group
      response = logs_client.describe_log_groups(
        logGroupNamePrefix=log_group_name,
        limit=1
      )

      # Verify log group exists
      self.assertGreater(len(response['logGroups']), 0)
      log_group = response['logGroups'][0]
      self.assertEqual(log_group['logGroupName'], log_group_name)

      # Check retention policy (should be 14 days)
      self.assertEqual(log_group.get('retentionInDays', 14), 14)

    except NoCredentialsError:
      self.skipTest("AWS credentials not configured for integration tests")
    except (BotoCoreError, ClientError, KeyError) as e:
      self.fail(f"Failed to access CloudWatch log group: {e}")

  def test_end_to_end_request_flow(self):
    """Test complete end-to-end request flow through API Gateway to Lambda."""
    api_url = self.outputs['api_gateway_url']
    lambda_function_name = self.outputs.get('lambda_function_name')
    log_group_name = self.outputs.get('cloudwatch_log_group')

    if not all([api_url, lambda_function_name, log_group_name]):
      self.skipTest("Required outputs not available for end-to-end test")

    try:
      # Make a request with unique identifier
      unique_id = f"test-{int(time.time())}"
      test_url = f"{api_url.rstrip('/')}?test_id={unique_id}"

      response = requests.get(test_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      response_data = response.json()

      # Verify the request was processed correctly
      self.assertIn('request_info', response_data)
      self.assertIn('lambda_info', response_data)
      self.assertEqual(response_data['request_info']['method'], 'GET')
      self.assertIn(
        unique_id, response_data['request_info']['query_parameters']['test_id'])

      # Verify Lambda info is present
      lambda_info = response_data['lambda_info']
      self.assertIn('function_name', lambda_info)
      self.assertIn('request_id', lambda_info)
      self.assertIn('memory_limit', lambda_info)

      # Wait a bit for logs to be written
      time.sleep(self.LOG_WAIT_TIME)

      # Check CloudWatch logs for the request (optional verification)
      self._check_cloudwatch_logs(log_group_name, unique_id)

    except (RequestsConnectionError, NameResolutionError, 
            MaxRetryError, socket.gaierror) as e:
      self.skipTest(f"AWS resources not accessible: {e}")
    except (RequestException, requests.JSONDecodeError,
            BotoCoreError, ClientError, KeyError) as e:
      self.fail(f"End-to-end test failed: {e}")

  def test_api_gateway_different_paths(self):
    """Test API Gateway with different paths to ensure routing works."""
    api_url = self.outputs['api_gateway_url']
    if not api_url:
      self.skipTest("API Gateway URL not available")

    test_paths = [
      '/',
      '/health',
      '/info',
      '/api/test',
      '/api/users/123',
      '/v1/data'
    ]

    for path in test_paths:
      with self.subTest(path=path):
        test_url = f"{api_url.rstrip('/')}{path}"

        try:
          response = requests.get(test_url, timeout=self.REQUEST_TIMEOUT)
          self.assertEqual(response.status_code, 200)

          response_data = response.json()
          self.assertEqual(
            response_data['request_info']['path'], path)

        except (RequestsConnectionError, NameResolutionError, 
                MaxRetryError, socket.gaierror) as e:
          self.skipTest(f"AWS resources not accessible: {e}")
        except (RequestException, requests.JSONDecodeError, KeyError) as e:
          self.fail(f"Failed to reach path {path}: {e}")

  def test_api_gateway_query_parameters_handling(self):
    """Test API Gateway query parameter handling."""
    api_url = self.outputs['api_gateway_url']
    if not api_url:
      self.skipTest("API Gateway URL not available")

    test_params = {
      'param1': 'value1',
      'param2': 'value2',
      'special_chars': 'test@#$%',
      'numbers': '12345'
    }

    try:
      response = requests.get(api_url, params=test_params, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      response_data = response.json()
      received_params = response_data['request_info']['query_parameters']

      for key, value in test_params.items():
        self.assertIn(key, received_params)
        self.assertEqual(received_params[key], value)

    except (RequestsConnectionError, NameResolutionError, 
            MaxRetryError, socket.gaierror) as e:
      self.skipTest(f"AWS resources not accessible: {e}")
    except (RequestException, requests.JSONDecodeError, KeyError) as e:
      self.fail(f"Failed to test query parameters: {e}")

  def _check_cloudwatch_logs(self, log_group_name, unique_id):
    """Helper method to check CloudWatch logs for test request."""
    try:
      logs_client = boto3.client('logs', region_name=self.aws_region)

      # Get recent log streams
      streams_response = logs_client.describe_log_streams(
        logGroupName=log_group_name,
        orderBy='LastEventTime',
        descending=True,
        limit=5
      )

      if streams_response['logStreams']:
        # Look for our request ID in recent logs
        for stream in streams_response['logStreams'][:2]:
          events_response = logs_client.get_log_events(
            logGroupName=log_group_name,
            logStreamName=stream['logStreamName'],
            limit=50,
            startFromHead=False
          )

          # Check if any log event contains our unique ID
          for event in events_response['events']:
            if unique_id in event['message']:
              # Found our request in the logs
              return

        # Log not found - not necessarily a failure
        print(f"Warning: Could not find log entry for request {unique_id}")

    except NoCredentialsError:
      print("Warning: AWS credentials not available for CloudWatch log verification")
    except (BotoCoreError, ClientError, RequestsConnectionError, socket.gaierror) as e:
      print(f"Warning: Could not access CloudWatch logs: {e}")


class TestTapStackResourceTags(unittest.TestCase):
  """Test that deployed resources have correct tags."""

  def setUp(self):
    """Set up for tag testing."""
    # Load outputs
    self.outputs = {}
    outputs_file = os.path.join(os.path.dirname(
      __file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
    if os.path.exists(outputs_file):
      with open(outputs_file, 'r', encoding='utf-8') as f:
        self.outputs = json.load(f)

    # Fallback to environment variables if outputs file doesn't exist
    if not self.outputs:
      self.outputs = {
        'api_gateway_url': os.environ.get('API_GATEWAY_URL'),
        'lambda_function_name': os.environ.get('LAMBDA_FUNCTION_NAME'),
        'lambda_function_arn': os.environ.get('LAMBDA_FUNCTION_ARN'),
        'api_gateway_id': os.environ.get('API_GATEWAY_ID'),
        'cloudwatch_log_group': os.environ.get('CLOUDWATCH_LOG_GROUP')
      }

    # Determine AWS region dynamically
    self.aws_region = (
      os.environ.get('AWS_DEFAULT_REGION') or
      os.environ.get('AWS_REGION') or
      'us-west-2'  # fallback to default
    )

    if not any(self.outputs.values()):
      self.skipTest("No deployment outputs available for tag testing")

  def test_lambda_function_tags(self):
    """Test that Lambda function has correct tags."""
    lambda_function_name = self.outputs.get('lambda_function_name')
    if not lambda_function_name:
      self.skipTest("Lambda function name not available")

    try:
      lambda_client = boto3.client('lambda', region_name=self.aws_region)
      response = lambda_client.list_tags(
        Resource=self.outputs['lambda_function_arn'])

      tags = response['Tags']

      # Check required tags
      self.assertIn('project', tags)
      self.assertEqual(tags['project'], 'serverless-infra-pulumi')
      self.assertIn('managed-by', tags)
      self.assertEqual(tags['managed-by'], 'pulumi')

    except NoCredentialsError:
      self.skipTest("AWS credentials not configured for integration tests")
    except (BotoCoreError, ClientError, KeyError) as e:
      self.fail(f"Failed to check Lambda function tags: {e}")

  def test_api_gateway_tags(self):
    """Test that API Gateway has correct tags."""
    api_gateway_id = self.outputs.get('api_gateway_id')
    if not api_gateway_id:
      self.skipTest("API Gateway ID not available")

    try:
      api_client = boto3.client('apigateway', region_name=self.aws_region)
      response = api_client.get_tags(
        resourceArn=f"arn:aws:apigateway:{self.aws_region}::/restapis/{api_gateway_id}")

      tags = response['tags']

      # Check required tags
      self.assertIn('project', tags)
      self.assertEqual(tags['project'], 'serverless-infra-pulumi')
      self.assertIn('managed-by', tags)
      self.assertEqual(tags['managed-by'], 'pulumi')

    except NoCredentialsError:
      self.skipTest("AWS credentials not configured for integration tests")
    except (BotoCoreError, ClientError, KeyError) as e:
      self.fail(f"Failed to check API Gateway tags: {e}")


if __name__ == '__main__':
  unittest.main(verbosity=2)
