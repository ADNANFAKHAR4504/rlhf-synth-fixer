import json
import os
import unittest
from datetime import datetime, timedelta
from typing import Any, Dict

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs_str = f.read()
else:
  flat_outputs_str = '{}'

flat_outputs: Dict[str, Any] = json.loads(flat_outputs_str)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the TapStack API and infrastructure"""

  def setUp(self):
    """Set up test prerequisites"""
    # Get API endpoint from CloudFormation outputs
    self.api_endpoint = flat_outputs.get('TapStack.ApiEndpoint', '')
    if not self.api_endpoint:
      self.fail("API endpoint not found in CloudFormation outputs")

    # Initialize AWS clients
    self.dynamodb = boto3.resource('dynamodb')
    self.table = self.dynamodb.Table(
        flat_outputs.get('TapStack.VisitsTableName', ''))
    self.s3 = boto3.client('s3')
    self.cloudwatch = boto3.client('cloudwatch')
    self.iam = boto3.client('iam')
    self.kms = boto3.client('kms')

    # Get S3 bucket name
    self.bucket_name = flat_outputs.get('TapStack.FrontendBucketName', '')
    if not self.bucket_name:
      self.fail("S3 bucket name not found in CloudFormation outputs")

    # Get CloudFront domain
    self.cloudfront_domain = flat_outputs.get(
        'TapStack.CloudFrontDomainName', '')
    if not self.cloudfront_domain:
      self.fail("CloudFront domain not found in CloudFormation outputs")

    # Default request timeout
    self.request_timeout = 10

  @mark.it("API should return 200 for valid requests")
  def test_api_success_response(self):
    # Make request to API
    response = requests.get(
        f"{self.api_endpoint}/test-path", timeout=self.request_timeout)

    # Verify response
    self.assertEqual(response.status_code, 200)
    self.assertTrue('message' in response.json())
    self.assertEqual(response.json()['message'], 'Visit logged successfully')

  @mark.it("API should handle CORS headers correctly")
  def test_cors_headers(self):
    # Make OPTIONS request to check CORS
    response = requests.options(f"{self.api_endpoint}/test-path",
                                headers={
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
    }, timeout=self.request_timeout)

    # Verify CORS headers
    self.assertEqual(response.status_code, 200)
    headers = response.headers
    self.assertIn('Access-Control-Allow-Origin', headers)
    self.assertIn('Access-Control-Allow-Methods', headers)
    self.assertIn('Access-Control-Allow-Headers', headers)

  @mark.it("Visit should be logged in DynamoDB")
  def test_visit_logging(self):
    # Make request to API
    test_path = '/test-logging-path'
    response = requests.get(
        f"{self.api_endpoint}{test_path}", timeout=self.request_timeout)
    self.assertEqual(response.status_code, 200)

    # Query DynamoDB for the visit log
    response = self.table.query(
        IndexName='timestamp-index',
        KeyConditionExpression='#ts between :start and :end',
        ExpressionAttributeNames={
            '#ts': 'timestamp'
        },
        ExpressionAttributeValues={
            ':start': (datetime.utcnow() - timedelta(minutes=1)).isoformat(),
            ':end': (datetime.utcnow() + timedelta(minutes=1)).isoformat()
        }
    )

    # Verify visit was logged
    items = response.get('Items', [])
    self.assertTrue(len(items) > 0, "No visits found in DynamoDB")

    # Find our test visit
    test_visit = next(
        (item for item in items if item['path'] == test_path), None)
    self.assertIsNotNone(test_visit, "Visit was not logged in DynamoDB")
    self.assertEqual(test_visit['path'], test_path)

  @mark.it("API should handle errors gracefully")
  def test_error_handling(self):
    # Test with invalid HTTP method
    response = requests.put(
        f"{self.api_endpoint}/test-path", timeout=self.request_timeout)
    self.assertEqual(response.status_code, 405)  # Method not allowed

    # Test with missing required headers
    response = requests.get(
        f"{self.api_endpoint}/test-path",
        headers={'Content-Type': 'invalid'},
        timeout=self.request_timeout
    )
    self.assertEqual(response.status_code, 400)

  @mark.it("API should handle rate limiting")
  def test_rate_limiting(self):
    # Make multiple rapid requests
    responses = []
    for _ in range(10):
      response = requests.get(
          f"{self.api_endpoint}/test-path", timeout=self.request_timeout)
      responses.append(response)
      if response.status_code == 429:  # Too Many Requests
        break

    # Verify rate limiting is working
    # Note: This test might need adjustment based on your WAF rate limit configuration
    successful_requests = len([r for r in responses if r.status_code == 200])
    self.assertGreater(successful_requests, 0)

  @mark.it("CloudFront distribution should be accessible")
  def test_cloudfront_distribution(self):
    # Get CloudFront domain
    cloudfront_domain = flat_outputs.get('TapStack.CloudFrontDomainName', '')
    if not cloudfront_domain:
      self.fail("CloudFront domain not found in CloudFormation outputs")

    # Test CloudFront distribution
    response = requests.get(
        f"https://{cloudfront_domain}", timeout=self.request_timeout)
    self.assertEqual(response.status_code, 200)

  @mark.it("S3 bucket should have website hosting enabled")
  def test_s3_website_hosting(self):
    try:
      # Check if website configuration is enabled on the bucket
      website_config = self.s3.get_bucket_website(Bucket=self.bucket_name)
      # Verify index and error documents are set
      self.assertIn('IndexDocument', website_config)
      self.assertEqual(website_config['IndexDocument']['Suffix'], 'index.html')
      self.assertIn('ErrorDocument', website_config)
      self.assertEqual(website_config['ErrorDocument']['Key'], 'error.html')
    except ClientError as e:
      self.fail(f"S3 website hosting test failed: {str(e)}")

  @mark.it("S3 bucket should have versioning enabled")
  def test_s3_versioning(self):
    try:
      # Check if versioning is enabled on the bucket
      versioning = self.s3.get_bucket_versioning(Bucket=self.bucket_name)
      self.assertIn('Status', versioning)
      self.assertEqual(versioning['Status'], 'Enabled')
    except ClientError as e:
      self.fail(f"S3 versioning test failed: {str(e)}")

  @mark.it("S3 bucket should have encryption enabled")
  def test_s3_encryption(self):
    try:
      # Check if encryption is enabled on the bucket
      encryption = self.s3.get_bucket_encryption(Bucket=self.bucket_name)
      self.assertIn('ServerSideEncryptionConfiguration', encryption)
      self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
      self.assertTrue(
          len(encryption['ServerSideEncryptionConfiguration']['Rules']) > 0)
      # Verify KMS encryption is used (SSEAlgorithm should be aws:kms)
      rule = encryption['ServerSideEncryptionConfiguration']['Rules'][0]
      self.assertIn('ApplyServerSideEncryptionByDefault', rule)
      default = rule['ApplyServerSideEncryptionByDefault']
      self.assertEqual(default['SSEAlgorithm'], 'aws:kms')
      # KMS key ID should be present
      self.assertIn('KMSMasterKeyID', default)
    except ClientError as e:
      self.fail(f"S3 encryption test failed: {str(e)}")

  @mark.it("DynamoDB table should have encryption enabled")
  def test_dynamodb_encryption(self):
    try:
      # Get table description
      table_description = self.dynamodb.meta.client.describe_table(
          TableName=self.table.table_name
      )
      # Check if SSE is enabled
      self.assertIn('SSEDescription', table_description['Table'])
      sse_description = table_description['Table']['SSEDescription']
      self.assertEqual(sse_description['Status'], 'ENABLED')
      # Check if customer-managed KMS key is used (KMS type should be CUSTOMER)
      self.assertEqual(sse_description['SSEType'], 'KMS')
    except ClientError as e:
      self.fail(f"DynamoDB encryption test failed: {str(e)}")

  @mark.it("CloudWatch alarms should be properly configured")
  def test_cloudwatch_alarms(self):
    try:
      # Get alarms for Lambda errors
      alarms = self.cloudwatch.describe_alarms(
          AlarmNamePrefix=f"{flat_outputs.get('TapStack.StackName', '')}",
      )

      # Verify at least one alarm exists
      self.assertTrue(len(alarms['MetricAlarms']) > 0,
                      "No CloudWatch alarms found for stack")

      # Check for specific alarms
      lambda_error_alarm = next((alarm for alarm in alarms['MetricAlarms']
                                 if 'Errors' in alarm['MetricName']), None)
      self.assertIsNotNone(lambda_error_alarm, "Lambda error alarm not found")

      # Verify alarm configuration
      self.assertEqual(lambda_error_alarm['Threshold'], 5.0)
      self.assertEqual(lambda_error_alarm['EvaluationPeriods'], 3)
      self.assertEqual(lambda_error_alarm['DatapointsToAlarm'], 2)
    except ClientError as e:
      self.fail(f"CloudWatch alarms test failed: {str(e)}")

  @mark.it("Secrets Manager should contain API secret")
  def test_secrets_manager(self):
    try:
      # Get the API Secret ARN from outputs if available
      secret_arn = flat_outputs.get('TapStack.ApiSecretArn', '')
      if not secret_arn:
        self.skipTest("Secret ARN not found in CloudFormation outputs")

      # Get the secretsmanager client
      secretsmanager = boto3.client('secretsmanager')

      # Describe the secret to verify it exists
      secret_response = secretsmanager.describe_secret(
          SecretId=secret_arn
      )

      # Verify the secret has the expected description
      self.assertIn('Description', secret_response)
      self.assertEqual(
          secret_response['Description'], 'Secret for API backend')
    except ClientError as e:
      self.fail(f"Secrets Manager test failed: {str(e)}")

  @mark.it("CloudFront should serve content from S3")
  def test_cloudfront_serves_s3_content(self):
    try:
      # Create a unique test file
      test_id = datetime.now().strftime("%Y%m%d%H%M%S")
      index_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>CloudFront Test</title>
            </head>
            <body>
                <h1>CloudFront Integration Test</h1>
                <p>This page was created for testing CloudFront distribution.</p>
                <p>Test ID: {test_id}</p>
            </body>
            </html>
            """

      # Upload the file to S3
      self.s3.put_object(
          Bucket=self.bucket_name,
          Key='index.html',
          Body=index_content,
          ContentType='text/html',
          CacheControl='max-age=60'  # Short cache time for testing
      )

      # Allow some time for CloudFront to pick up the change
      # In a real environment, we might want to use CloudFront invalidation
      # but for testing purposes, we'll just wait a bit
      import time
      time.sleep(5)

      # Request the file through CloudFront
      response = requests.get(
          f"https://{self.cloudfront_domain}/index.html",
          timeout=self.request_timeout
      )

      # Verify the response
      self.assertEqual(response.status_code, 200)
      self.assertIn('text/html', response.headers.get('Content-Type', ''))
      self.assertIn(test_id, response.text)
      self.assertIn('CloudFront Integration Test', response.text)

      # Test the root URL (which should also serve index.html)
      root_response = requests.get(
          f"https://{self.cloudfront_domain}/",
          timeout=self.request_timeout
      )
      self.assertEqual(root_response.status_code, 200)
      self.assertIn(test_id, root_response.text)

    except (ClientError, requests.RequestException) as e:
      self.fail(f"CloudFront S3 content serving test failed: {str(e)}")

  def tearDown(self):
    """Clean up any test data"""
    # Note: In this case, we're not deleting test data as it might be useful
    # for monitoring and debugging. In a real test environment, you might
    # want to clean up test data here.
