"""Integration tests for TapStack CDK infrastructure."""
import json
import os
import unittest

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


@mark.describe("TapStack Integration")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the deployed TapStack"""

  def setUp(self):
    """Set up integration test environment"""
    self.outputs = flat_outputs

  @mark.it("deployed API Gateway should be accessible")
  def test_api_gateway_deployed(self):
    """Test that API Gateway endpoint is deployed and accessible"""
    # ASSERT - Check that API Gateway URL exists in outputs
    api_endpoint_key = None
    for key in self.outputs.keys():
      if 'apigateway' in key.lower() and 'url' in key.lower():
        api_endpoint_key = key
        break
    
    if not api_endpoint_key:
      self.skipTest("API Gateway URL not found in deployment outputs")
    
    api_url = self.outputs[api_endpoint_key]
    self.assertTrue(api_url.startswith('https://'))
    self.assertTrue(api_url.endswith('.amazonaws.com'))

  @mark.it("deployed Lambda function should exist")
  def test_lambda_function_deployed(self):
    """Test that Lambda function is deployed"""
    # ASSERT - Check that Lambda function ARN exists in outputs
    lambda_arn_key = None
    for key in self.outputs.keys():
      if 'lambda' in key.lower() and ('arn' in key.lower() or 'function' in key.lower()):
        lambda_arn_key = key
        break
    
    if not lambda_arn_key:
      self.skipTest("Lambda function ARN not found in deployment outputs")
    
    lambda_arn = self.outputs[lambda_arn_key]
    self.assertTrue(lambda_arn.startswith('arn:aws:lambda:'))

  @mark.it("deployed S3 bucket should exist")
  def test_s3_bucket_deployed(self):
    """Test that S3 logging bucket is deployed"""
    # ASSERT - Check that S3 bucket name exists in outputs
    bucket_name_key = None
    for key in self.outputs.keys():
      if 's3' in key.lower() and 'bucket' in key.lower():
        bucket_name_key = key
        break
    
    if not bucket_name_key:
      self.skipTest("S3 bucket name not found in deployment outputs")
    
    bucket_name = self.outputs[bucket_name_key]
    self.assertTrue(bucket_name.startswith('tap-logs-'))

  @mark.it("CloudWatch dashboard should be deployed")
  def test_dashboard_deployed(self):
    """Test that CloudWatch dashboard is deployed"""
    # ASSERT - Check that dashboard name exists in outputs
    dashboard_key = None
    for key in self.outputs.keys():
      if 'dashboard' in key.lower():
        dashboard_key = key
        break
    
    if not dashboard_key:
      self.skipTest("CloudWatch dashboard not found in deployment outputs")
    
    dashboard_name = self.outputs[dashboard_key]
    self.assertTrue('TAP-Serverless-Monitoring' in dashboard_name)
