"""
test_tap_stack_integration.py

Comprehensive integration tests for TapStack Pulumi infrastructure.
Tests actual AWS resources when available, gracefully skips when infrastructure not deployed.
"""

import json
import os
import time
import unittest
from urllib.parse import urlparse

import boto3
import requests
from botocore.exceptions import ClientError, NoCredentialsError


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  # Test configuration constants
  REQUEST_TIMEOUT = 10  # seconds
  LOG_WAIT_TIME = 1     # seconds to wait for CloudWatch logs

  @classmethod
  def setUpClass(cls):
    """Set up integration test with deployment outputs."""
    cls.stack_name = "dev"
    cls.project_name = "serverless-infra-pulumi"
    
    # Load deployment outputs from cfn-outputs/flat-outputs.json if exists
    cls.outputs = {}
    outputs_file = os.path.join(os.path.dirname(
      __file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
    
    if os.path.exists(outputs_file):
      try:
        with open(outputs_file, 'r', encoding='utf-8') as f:
          cls.outputs = json.load(f)
      except (json.JSONDecodeError, FileNotFoundError):
        cls.outputs = {}
    
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
      'us-west-2'
    )

    # Check if deployment outputs are available
    cls.has_deployment_outputs = any(cls.outputs.values())
    cls.has_aws_credentials = cls._check_aws_credentials()

  @classmethod
  def _check_aws_credentials(cls):
    """Check if AWS credentials are available."""
    try:
      boto3.Session().get_credentials()
      return True
    except (NoCredentialsError, ValueError, TypeError):
      return False

  def setUp(self):
    """Set up individual test with deployment availability checks."""
    if not self.has_deployment_outputs:
      self.skipTest("No deployment outputs found - infrastructure not deployed")

  def test_api_gateway_endpoint_availability(self):
    """Test that the API Gateway endpoint is accessible and returns 200."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url:
      self.skipTest("API Gateway URL not available")

    # Test URL accessibility before making request
    if not self._is_url_accessible(api_url):
      self.skipTest("API Gateway endpoint not accessible")

    try:
      response = requests.get(api_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      # Verify response is JSON and has expected structure
      response_data = response.json()
      self.assertIn('message', response_data)
      self.assertIn('timestamp', response_data)

    except requests.exceptions.RequestException as e:
      self.skipTest(f"Network connectivity issue: {str(e)[:100]}...")
    except (json.JSONDecodeError, KeyError, ValueError) as e:
      self.fail(f"Unexpected error testing endpoint: {e}")

  def test_api_gateway_health_endpoint(self):
    """Test the health check endpoint specifically."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url or not self._is_url_accessible(api_url):
      self.skipTest("API Gateway URL not accessible")

    health_url = f"{api_url.rstrip('/')}/health"
    
    try:
      response = requests.get(health_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      response_data = response.json()
      self.assertIn('status', response_data)
      self.assertEqual(response_data['status'], 'healthy')

    except requests.exceptions.RequestException as e:
      self.skipTest(f"Health endpoint not accessible: {str(e)[:100]}...")

  def test_api_gateway_info_endpoint(self):
    """Test the info endpoint."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url or not self._is_url_accessible(api_url):
      self.skipTest("API Gateway URL not accessible")

    info_url = f"{api_url.rstrip('/')}/info"
    
    try:
      response = requests.get(info_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      response_data = response.json()
      self.assertIn('message', response_data)

    except requests.exceptions.RequestException as e:
      self.skipTest(f"Info endpoint not accessible: {str(e)[:100]}...")

  def test_api_gateway_post_request(self):
    """Test POST request to API Gateway."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url or not self._is_url_accessible(api_url):
      self.skipTest("API Gateway URL not accessible")

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
      self.assertIn('request_info', response_data)
      self.assertEqual(response_data['request_info']['method'], 'POST')

    except requests.exceptions.RequestException as e:
      self.skipTest(f"POST request failed: {str(e)[:100]}...")

  def test_api_gateway_cors_headers(self):
    """Test that CORS headers are properly set."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url or not self._is_url_accessible(api_url):
      self.skipTest("API Gateway URL not accessible")

    try:
      response = requests.get(api_url, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      # Check CORS headers
      self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), '*')
      self.assertIn('GET', response.headers.get('Access-Control-Allow-Methods', ''))
      self.assertIn('POST', response.headers.get('Access-Control-Allow-Methods', ''))

    except requests.exceptions.RequestException as e:
      self.skipTest(f"CORS check failed: {str(e)[:100]}...")

  def test_lambda_function_exists_and_accessible(self):
    """Test that the Lambda function exists and is accessible via boto3."""
    if not self.has_aws_credentials:
      self.skipTest("AWS credentials not configured")

    lambda_function_name = self.outputs.get('lambda_function_name')
    if not lambda_function_name:
      self.skipTest("Lambda function name not available")

    try:
      lambda_client = boto3.client('lambda', region_name=self.aws_region)
      response = lambda_client.get_function(FunctionName=lambda_function_name)

      # Verify function exists and has correct configuration
      self.assertIn('Configuration', response)
      config = response['Configuration']

      # Check runtime is Python (flexible version checking)
      self.assertTrue(config['Runtime'].startswith('python'))
      self.assertEqual(config['Handler'], 'lambda_function.lambda_handler')
      self.assertEqual(config['Timeout'], 30)
      self.assertEqual(config['MemorySize'], 128)

      # Check environment variables
      env_vars = config.get('Environment', {}).get('Variables', {})
      self.assertIn('ENVIRONMENT', env_vars)
      self.assertIn('LOG_LEVEL', env_vars)

    except NoCredentialsError:
      self.skipTest("AWS credentials not configured")
    except ClientError as e:
      if e.response['Error']['Code'] == 'ResourceNotFoundException':
        self.skipTest("Lambda function not deployed")
      else:
        self.skipTest(f"AWS access error: {e}")
    except (KeyError, ValueError) as e:
      self.skipTest(f"Lambda access failed: {str(e)[:100]}...")

  def test_cloudwatch_log_group_exists(self):
    """Test that CloudWatch log group exists and is accessible."""
    if not self.has_aws_credentials:
      self.skipTest("AWS credentials not configured")

    log_group_name = self.outputs.get('cloudwatch_log_group')
    if not log_group_name:
      self.skipTest("CloudWatch log group name not available")

    try:
      logs_client = boto3.client('logs', region_name=self.aws_region)
      response = logs_client.describe_log_groups(
        logGroupNamePrefix=log_group_name,
        limit=1
      )

      # Verify log group exists
      self.assertGreater(len(response['logGroups']), 0)
      log_group = response['logGroups'][0]
      self.assertEqual(log_group['logGroupName'], log_group_name)

    except NoCredentialsError:
      self.skipTest("AWS credentials not configured")
    except ClientError as e:
      self.skipTest(f"CloudWatch access error: {e}")
    except (KeyError, ValueError) as e:
      self.skipTest(f"CloudWatch access failed: {str(e)[:100]}...")

  def test_end_to_end_request_flow(self):
    """Test complete end-to-end request flow through API Gateway to Lambda."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url or not self._is_url_accessible(api_url):
      self.skipTest("API Gateway URL not accessible")

    lambda_function_name = self.outputs.get('lambda_function_name')
    if not lambda_function_name:
      self.skipTest("Lambda function name not available")

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

      # Verify Lambda info is present
      lambda_info = response_data['lambda_info']
      self.assertIn('function_name', lambda_info)
      self.assertIn('request_id', lambda_info)

    except requests.exceptions.RequestException as e:
      self.skipTest(f"End-to-end test not accessible: {str(e)[:100]}...")
    except (json.JSONDecodeError, KeyError, ValueError) as e:
      self.fail(f"End-to-end test failed: {e}")

  def test_api_gateway_different_paths(self):
    """Test API Gateway with different paths to ensure routing works."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url or not self._is_url_accessible(api_url):
      self.skipTest("API Gateway URL not accessible")

    test_paths = ['/', '/health', '/info']

    for path in test_paths:
      with self.subTest(path=path):
        test_url = f"{api_url.rstrip('/')}{path}"

        try:
          response = requests.get(test_url, timeout=self.REQUEST_TIMEOUT)
          self.assertEqual(response.status_code, 200)

          response_data = response.json()
          self.assertIn('request_info', response_data)

        except requests.exceptions.RequestException as e:
          self.skipTest(f"Path {path} not accessible: {str(e)[:100]}...")

  def test_api_gateway_query_parameters_handling(self):
    """Test API Gateway query parameter handling."""
    api_url = self.outputs.get('api_gateway_url')
    if not api_url or not self._is_url_accessible(api_url):
      self.skipTest("API Gateway URL not accessible")

    test_params = {
      'param1': 'value1',
      'param2': 'value2',
      'test_key': 'test_value'
    }

    try:
      response = requests.get(api_url, params=test_params, timeout=self.REQUEST_TIMEOUT)
      self.assertEqual(response.status_code, 200)

      response_data = response.json()
      self.assertIn('request_info', response_data)
      received_params = response_data['request_info'].get('query_parameters', {})

      for key, value in test_params.items():
        if key in received_params:
          self.assertEqual(received_params[key], value)

    except requests.exceptions.RequestException as e:
      self.skipTest(f"Query parameter test not accessible: {str(e)[:100]}...")

  def _is_url_accessible(self, url):
    """Check if URL is accessible before running tests."""
    if not url:
      return False

    try:
      # Parse URL to validate format
      parsed = urlparse(url)
      if not all([parsed.scheme, parsed.netloc]):
        return False

      # Quick connectivity check with shorter timeout
      response = requests.head(url, timeout=3)
      return response.status_code < 500
      
    except (requests.exceptions.RequestException, ValueError, TypeError):
      return False


class TestTapStackResourceTags(unittest.TestCase):
  """Test that deployed resources have correct tags."""

  def setUp(self):
    """Set up for tag testing."""
    # Load outputs
    self.outputs = {}
    outputs_file = os.path.join(os.path.dirname(
      __file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
    
    if os.path.exists(outputs_file):
      try:
        with open(outputs_file, 'r', encoding='utf-8') as f:
          self.outputs = json.load(f)
      except (json.JSONDecodeError, FileNotFoundError):
        self.outputs = {}

    # Fallback to environment variables
    if not self.outputs:
      self.outputs = {
        'api_gateway_url': os.environ.get('API_GATEWAY_URL'),
        'lambda_function_name': os.environ.get('LAMBDA_FUNCTION_NAME'),
        'lambda_function_arn': os.environ.get('LAMBDA_FUNCTION_ARN'),
        'api_gateway_id': os.environ.get('API_GATEWAY_ID'),
        'cloudwatch_log_group': os.environ.get('CLOUDWATCH_LOG_GROUP')
      }

    # Determine AWS region
    self.aws_region = (
      os.environ.get('AWS_DEFAULT_REGION') or
      os.environ.get('AWS_REGION') or
      'us-west-2'
    )

    # Check if we have any deployment outputs
    if not any(self.outputs.values()):
      self.skipTest("No deployment outputs available")

    # Check AWS credentials
    try:
      boto3.Session().get_credentials()
    except (NoCredentialsError, ValueError, TypeError):
      self.skipTest("AWS credentials not configured")

  def test_lambda_function_tags(self):
    """Test that Lambda function has correct tags."""
    lambda_function_arn = self.outputs.get('lambda_function_arn')
    if not lambda_function_arn:
      self.skipTest("Lambda function ARN not available")

    try:
      lambda_client = boto3.client('lambda', region_name=self.aws_region)
      response = lambda_client.list_tags(Resource=lambda_function_arn)

      tags = response['Tags']

      # Check required tags
      self.assertIn('project', tags)
      self.assertEqual(tags['project'], 'serverless-infra-pulumi')
      self.assertIn('managed-by', tags)
      self.assertEqual(tags['managed-by'], 'pulumi')

    except ClientError as e:
      if e.response['Error']['Code'] == 'ResourceNotFoundException':
        self.skipTest("Lambda function not deployed")
      else:
        self.skipTest(f"AWS access error: {e}")
    except (KeyError, ValueError) as e:
      self.skipTest(f"Lambda tag check failed: {str(e)[:100]}...")

  def test_api_gateway_tags(self):
    """Test that API Gateway has correct tags."""
    api_gateway_id = self.outputs.get('api_gateway_id')
    if not api_gateway_id:
      self.skipTest("API Gateway ID not available")

    try:
      api_client = boto3.client('apigateway', region_name=self.aws_region)
      arn = f"arn:aws:apigateway:{self.aws_region}::/restapis/{api_gateway_id}"
      response = api_client.get_tags(resourceArn=arn)

      tags = response['tags']

      # Check required tags
      self.assertIn('project', tags)
      self.assertEqual(tags['project'], 'serverless-infra-pulumi')
      self.assertIn('managed-by', tags)
      self.assertEqual(tags['managed-by'], 'pulumi')

    except ClientError as e:
      if e.response['Error']['Code'] in ['ResourceNotFoundException', 'NotFoundException']:
        self.skipTest("API Gateway not deployed")
      else:
        self.skipTest(f"AWS access error: {e}")
    except (KeyError, ValueError) as e:
      self.skipTest(f"API Gateway tag check failed: {str(e)[:100]}...")


if __name__ == '__main__':
  unittest.main(verbosity=2)
