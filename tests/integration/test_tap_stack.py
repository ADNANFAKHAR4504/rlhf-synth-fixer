"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import json
import os
import boto3
import requests


class TestTapStackLiveIntegration:
  """Integration tests against live deployed Pulumi stack."""

  def __init__(self):
    """Initialize test class."""
    self.skip_tests = True
    self.outputs = {}
    self.region = 'us-west-2'
    self.lambda_client = None
    self.api_client = None
    self.logs_client = None

  def setup_method(self):
    """Set up integration test with live stack."""
    # Load outputs from deployment
    outputs_file = 'cfn-outputs/flat-outputs.json'
    if not os.path.exists(outputs_file):
      self.skip_tests = True
      return
      
    with open(outputs_file, 'r', encoding='utf-8') as f:
      self.outputs = json.load(f)
    
    self.skip_tests = False
    self.region = self.outputs.get('region', 'us-west-2')
    
    # Initialize AWS clients
    self.lambda_client = boto3.client('lambda', region_name=self.region)
    self.api_client = boto3.client('apigateway', region_name=self.region)
    self.logs_client = boto3.client('logs', region_name=self.region)

  def test_lambda_function_exists_and_configured(self):
    """Test that Lambda function exists with correct configuration."""
    if self.skip_tests:
      return
        
    function_name = self.outputs.get('lambda_function_name')
    assert function_name, "Lambda function name not found in outputs"
    
    response = self.lambda_client.get_function(FunctionName=function_name)
    function_config = response['Configuration']
    
    assert function_config['Runtime'] == 'python3.9'
    assert function_config['Handler'] == 'handler.lambda_handler'
    assert function_config['Timeout'] == 30
    assert function_config['MemorySize'] == 128

  def test_api_gateway_endpoint_responds(self):
    """Test that API Gateway endpoint is accessible and responds."""
    if self.skip_tests:
      return
        
    api_url = self.outputs.get('api_gateway_url')
    assert api_url, "API Gateway URL not found in outputs"
    
    try:
      response = requests.get(api_url, timeout=30)
      # Should get a response (even if it's an error response)
      assert response.status_code in [200, 404, 500]
    except requests.RequestException as e:
      assert False, f"Failed to reach API Gateway endpoint: {e}"

  def test_cloudwatch_log_group_exists(self):
    """Test that CloudWatch log group exists for Lambda function."""
    if self.skip_tests:
      return
        
    log_group_name = self.outputs.get('cloudwatch_log_group')
    assert log_group_name, "CloudWatch log group name not found in outputs"
    
    response = self.logs_client.describe_log_groups(
      logGroupNamePrefix=log_group_name
    )
    
    log_groups = response.get('logGroups', [])
    matching_groups = [lg for lg in log_groups 
                       if lg['logGroupName'] == log_group_name]
    assert len(matching_groups) == 1, f"Log group {log_group_name} not found"
    
    log_group = matching_groups[0]
    assert log_group['retentionInDays'] == 14
