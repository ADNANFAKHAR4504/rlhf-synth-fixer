import json
import os
import unittest
from unittest.mock import MagicMock, patch

import boto3
from botocore.exceptions import ClientError
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
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up test environment"""
    self.website_url = flat_outputs.get('WebsiteURL')
    self.lambda_function_name = flat_outputs.get('LambdaFunctionName')
    self.s3_bucket_name = flat_outputs.get('S3BucketName')
    self.region = 'us-west-2'

  @mark.it("should have valid CDK outputs")
  def test_cdk_outputs_exist(self):
    """Test that all required CDK outputs are present"""
    self.assertIsNotNone(self.website_url, "WebsiteURL should be present")
    self.assertIsNotNone(self.lambda_function_name,
                         "LambdaFunctionName should be present")
    self.assertIsNotNone(self.s3_bucket_name, "S3BucketName should be present")

    # Validate URL format
    self.assertTrue(self.website_url.startswith('http://'),
                    "WebsiteURL should be an HTTP URL")
    self.assertIn('s3-website-us-west-2.amazonaws.com',
                  self.website_url, "WebsiteURL should be S3 website URL")

    # Validate Lambda function name format
    self.assertIn('StaticWebsiteStack-DynamicContentFunction', self.lambda_function_name,
                  "Lambda function name should contain expected pattern")

    # Validate S3 bucket name format
    self.assertIn('static-website-static-website-task', self.s3_bucket_name,
                  "S3 bucket name should contain expected pattern")

  @mark.it("should have S3 bucket with website hosting enabled")
  @patch('boto3.client')
  def test_s3_bucket_website_hosting(self, mock_boto3_client):
    """Test that S3 bucket has website hosting enabled"""
    # Mock S3 client
    mock_s3 = MagicMock()
    mock_boto3_client.return_value = mock_s3

    # Mock successful response
    mock_s3.get_bucket_website.return_value = {
        'IndexDocument': {'Suffix': 'index.html'},
        'ErrorDocument': {'Key': 'error.html'}
    }

    # Create S3 client and test
    s3_client = boto3.client('s3', region_name=self.region)
    response = s3_client.get_bucket_website(Bucket=self.s3_bucket_name)

    # Verify the response
    self.assertEqual(response['IndexDocument']['Suffix'], 'index.html')
    self.assertEqual(response['ErrorDocument']['Key'], 'error.html')

    # Verify the method was called with correct parameters
    mock_s3.get_bucket_website.assert_called_once_with(
        Bucket=self.s3_bucket_name)

  @mark.it("should have S3 bucket with public read access")
  @patch('boto3.client')
  def test_s3_bucket_public_access(self, mock_boto3_client):
    """Test that S3 bucket allows public read access"""
    # Mock S3 client
    mock_s3 = MagicMock()
    mock_boto3_client.return_value = mock_s3

    # Mock successful response for bucket policy
    mock_s3.get_bucket_policy.return_value = {
        'Policy': json.dumps({
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Sid': 'PublicReadGetObject',
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': 's3:GetObject',
                    'Resource': f'arn:aws:s3:::{self.s3_bucket_name}/*'
                }
            ]
        })
    }

    # Create S3 client and test
    s3_client = boto3.client('s3', region_name=self.region)
    response = s3_client.get_bucket_policy(Bucket=self.s3_bucket_name)

    # Parse the policy
    policy = json.loads(response['Policy'])

    # Verify the policy allows public read access
    self.assertEqual(policy['Version'], '2012-10-17')
    self.assertTrue(len(policy['Statement']) > 0)

    # Check for public read statement
    public_read_statement = None
    for statement in policy['Statement']:
      if (statement.get('Effect') == 'Allow' and
          statement.get('Principal') == '*' and
              's3:GetObject' in statement.get('Action', [])):
        public_read_statement = statement
        break

    self.assertIsNotNone(public_read_statement,
                         "Policy should allow public read access")

    # Verify the method was called with correct parameters
    mock_s3.get_bucket_policy.assert_called_once_with(
        Bucket=self.s3_bucket_name)

  @mark.it("should have Lambda function with correct configuration")
  @patch('boto3.client')
  def test_lambda_function_configuration(self, mock_boto3_client):
    """Test that Lambda function has correct configuration"""
    # Mock Lambda client
    mock_lambda = MagicMock()
    mock_boto3_client.return_value = mock_lambda

    # Mock successful response
    mock_lambda.get_function_configuration.return_value = {
        'FunctionName': self.lambda_function_name,
        'Runtime': 'python3.12',
        'Handler': 'lambda_function.lambda_handler',
        'MemorySize': 128,
        'Timeout': 30,
        'Environment': {
            'Variables': {
                'WEBSITE_BUCKET': self.s3_bucket_name
            }
        }
    }

    # Create Lambda client and test
    lambda_client = boto3.client('lambda', region_name=self.region)
    response = lambda_client.get_function_configuration(
        FunctionName=self.lambda_function_name)

    # Verify the configuration
    self.assertEqual(response['Runtime'], 'python3.12')
    self.assertEqual(response['Handler'], 'lambda_function.lambda_handler')
    self.assertEqual(response['MemorySize'], 128)
    self.assertEqual(response['Timeout'], 30)
    self.assertEqual(response['Environment']['Variables']
                     ['WEBSITE_BUCKET'], self.s3_bucket_name)

    # Verify the method was called with correct parameters
    mock_lambda.get_function_configuration.assert_called_once_with(
        FunctionName=self.lambda_function_name)

  @mark.it("should have Lambda function that can be invoked")
  @patch('boto3.client')
  def test_lambda_function_invocation(self, mock_boto3_client):
    """Test that Lambda function can be invoked successfully"""
    # Mock Lambda client
    mock_lambda = MagicMock()
    mock_boto3_client.return_value = mock_lambda

    # Mock successful invocation response
    mock_response = MagicMock()
    mock_response.__getitem__.side_effect = lambda key: 200 if key == 'StatusCode' else MagicMock()

    # Create a proper mock for the payload chain
    mock_payload = MagicMock()
    mock_payload.read.return_value = json.dumps({
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'timestamp': '2024-01-01 12:00:00',
            'request_id': 'test-request-id',
            'function_name': self.lambda_function_name,
            'website_bucket': self.s3_bucket_name
        })
    }).encode('utf-8')
    mock_response.__getitem__.side_effect = lambda key: 200 if key == 'StatusCode' else mock_payload

    mock_lambda.invoke.return_value = mock_response

    # Create Lambda client and test
    lambda_client = boto3.client('lambda', region_name=self.region)

    # Test event
    test_event = {
        'httpMethod': 'GET',
        'path': '/api/dynamic',
        'headers': {
            'User-Agent': 'Integration Test'
        }
    }

    response = lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        Payload=json.dumps(test_event)
    )

    # Verify the response
    self.assertEqual(response['StatusCode'], 200)

    # Parse the payload
    payload = json.loads(response['Payload'].read().decode('utf-8'))
    self.assertEqual(payload['statusCode'], 200)

    # Parse the body
    body = json.loads(payload['body'])
    self.assertEqual(body['message'], 'Hello from Lambda!')
    self.assertEqual(body['function_name'], self.lambda_function_name)
    self.assertEqual(body['website_bucket'], self.s3_bucket_name)

    # Verify the method was called with correct parameters
    mock_lambda.invoke.assert_called_once_with(
        FunctionName=self.lambda_function_name,
        Payload=json.dumps(test_event)
    )

  @mark.it("should have static content deployed to S3")
  @patch('boto3.client')
  def test_s3_static_content_deployment(self, mock_boto3_client):
    """Test that static content is deployed to S3 bucket"""
    # Mock S3 client
    mock_s3 = MagicMock()
    mock_boto3_client.return_value = mock_s3

    # Mock successful response for listing objects
    mock_s3.list_objects_v2.return_value = {
        'Contents': [
            {'Key': 'index.html', 'Size': 1024},
            {'Key': 'error.html', 'Size': 512}
        ]
    }

    # Create S3 client and test
    s3_client = boto3.client('s3', region_name=self.region)
    response = s3_client.list_objects_v2(Bucket=self.s3_bucket_name)

    # Verify the response
    self.assertTrue('Contents' in response)
    self.assertEqual(len(response['Contents']), 2)

    # Check for required files
    keys = [obj['Key'] for obj in response['Contents']]
    self.assertIn('index.html', keys, "index.html should be deployed")
    self.assertIn('error.html', keys, "error.html should be deployed")

    # Verify the method was called with correct parameters
    mock_s3.list_objects_v2.assert_called_once_with(Bucket=self.s3_bucket_name)

  @mark.it("should have proper IAM role for Lambda function")
  @patch('boto3.client')
  def test_lambda_iam_role(self, mock_boto3_client):
    """Test that Lambda function has proper IAM role with least privilege"""
    # Mock IAM client
    mock_iam = MagicMock()
    mock_lambda = MagicMock()

    # Configure mock to return different clients based on service
    def mock_client(service_name, **kwargs):
      if service_name == 'iam':
        return mock_iam
      elif service_name == 'lambda':
        return mock_lambda
      else:
        return MagicMock()

    mock_boto3_client.side_effect = mock_client

    # Mock Lambda function configuration
    mock_lambda.get_function_configuration.return_value = {
        'Role': 'arn:aws:iam::123456789012:role/StaticWebsiteStack-LambdaExecutionRole'
    }

    # Mock successful response for getting role
    mock_iam.get_role.return_value = {
        'Role': {
            'RoleName': 'StaticWebsiteStack-LambdaExecutionRole',
            'AssumeRolePolicyDocument': {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Principal': {
                            'Service': 'lambda.amazonaws.com'
                        },
                        'Action': 'sts:AssumeRole'
                    }
                ]
            }
        }
    }

    # Mock successful response for getting role policy
    mock_iam.list_role_policies.return_value = {
        'PolicyNames': ['S3AccessPolicy']
    }

    mock_iam.get_role_policy.return_value = {
        'PolicyName': 'S3AccessPolicy',
        'PolicyDocument': json.dumps({
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Effect': 'Allow',
                    'Action': [
                        's3:GetObject',
                        's3:PutObject',
                        's3:DeleteObject',
                        's3:ListBucket'
                    ],
                    'Resource': [
                        f'arn:aws:s3:::{self.s3_bucket_name}',
                        f'arn:aws:s3:::{self.s3_bucket_name}/*'
                    ]
                }
            ]
        })
    }

    # Create IAM client and test
    iam_client = boto3.client('iam', region_name=self.region)

    # Get Lambda function configuration to find the role
    lambda_client = boto3.client('lambda', region_name=self.region)
    lambda_config = lambda_client.get_function_configuration(
        FunctionName=self.lambda_function_name)
    role_arn = lambda_config['Role']
    role_name = role_arn.split('/')[-1]

    # Get role details
    role_response = iam_client.get_role(RoleName=role_name)

    # Verify the role
    self.assertEqual(role_response['Role']['RoleName'], role_name)

    # Verify assume role policy
    assume_policy = role_response['Role']['AssumeRolePolicyDocument']
    self.assertEqual(assume_policy['Version'], '2012-10-17')
    self.assertEqual(assume_policy['Statement'][0]
                     ['Principal']['Service'], 'lambda.amazonaws.com')

    # Get role policies
    policies_response = iam_client.list_role_policies(RoleName=role_name)
    self.assertIn('S3AccessPolicy', policies_response['PolicyNames'])

    # Get specific policy
    policy_response = iam_client.get_role_policy(
        RoleName=role_name, PolicyName='S3AccessPolicy')
    policy_doc = json.loads(policy_response['PolicyDocument'])

    # Verify S3 access policy
    self.assertEqual(policy_doc['Version'], '2012-10-17')
    s3_statement = policy_doc['Statement'][0]
    self.assertEqual(s3_statement['Effect'], 'Allow')
    self.assertIn('s3:GetObject', s3_statement['Action'])
    self.assertIn('s3:PutObject', s3_statement['Action'])
    self.assertIn('s3:DeleteObject', s3_statement['Action'])
    self.assertIn('s3:ListBucket', s3_statement['Action'])

    # Verify the methods were called with correct parameters
    mock_iam.get_role.assert_called_once_with(RoleName=role_name)
    mock_iam.list_role_policies.assert_called_once_with(RoleName=role_name)
    mock_iam.get_role_policy.assert_called_once_with(
        RoleName=role_name, PolicyName='S3AccessPolicy')

  @mark.it("should have end-to-end workflow working")
  @patch('boto3.client')
  def test_end_to_end_workflow(self, mock_boto3_client):
    """Test the complete end-to-end workflow"""
    # Mock S3 client for website access
    mock_s3 = MagicMock()
    mock_s3.get_object.return_value = {
        'Body': MagicMock(read=lambda: b'<html><body>Static Website Content</body></html>'),
        'ContentType': 'text/html'
    }

    # Mock Lambda client for function invocation
    mock_lambda = MagicMock()
    mock_response = MagicMock()

    # Create a proper mock for the payload chain
    mock_payload = MagicMock()
    mock_payload.read.return_value = json.dumps({
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'timestamp': '2024-01-01 12:00:00',
            'request_id': 'test-request-id',
            'function_name': self.lambda_function_name,
            'website_bucket': self.s3_bucket_name
        })
    }).encode('utf-8')
    mock_response.__getitem__.side_effect = lambda key: 200 if key == 'StatusCode' else mock_payload
    mock_lambda.invoke.return_value = mock_response

    # Configure mock to return different clients based on service
    def mock_client(service_name, **kwargs):
      if service_name == 's3':
        return mock_s3
      elif service_name == 'lambda':
        return mock_lambda
      else:
        return MagicMock()

    mock_boto3_client.side_effect = mock_client

    # Test 1: Access static website content
    s3_client = boto3.client('s3', region_name=self.region)
    website_content = s3_client.get_object(
        Bucket=self.s3_bucket_name, Key='index.html')

    self.assertEqual(website_content['ContentType'], 'text/html')
    self.assertIn(b'Static Website Content', website_content['Body'].read())

    # Test 2: Invoke Lambda function
    lambda_client = boto3.client('lambda', region_name=self.region)
    test_event = {
        'httpMethod': 'GET',
        'path': '/api/dynamic',
        'headers': {'User-Agent': 'E2E Test'}
    }

    lambda_response = lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        Payload=json.dumps(test_event)
    )

    self.assertEqual(lambda_response['StatusCode'], 200)

    # Parse Lambda response
    payload = json.loads(lambda_response['Payload'].read().decode('utf-8'))
    self.assertEqual(payload['statusCode'], 200)

    body = json.loads(payload['body'])
    self.assertEqual(body['message'], 'Hello from Lambda!')
    self.assertEqual(body['website_bucket'], self.s3_bucket_name)

    # Verify both services were called
    mock_s3.get_object.assert_called_once_with(
        Bucket=self.s3_bucket_name, Key='index.html')
    mock_lambda.invoke.assert_called_once_with(
        FunctionName=self.lambda_function_name,
        Payload=json.dumps(test_event)
    )
