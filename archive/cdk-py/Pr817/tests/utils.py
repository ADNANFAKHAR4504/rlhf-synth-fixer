"""Utility functions for tests"""

import json
import os
import time
from typing import Dict, Optional, Any


def load_flat_outputs():
  """
  Load CloudFormation outputs from flat-outputs.json file.

  Returns:
      dict: CloudFormation outputs as a dictionary or empty dict if file doesn't exist
  """
  base_dir = os.path.dirname(os.path.abspath(__file__))
  flat_outputs_path = os.path.join(
      base_dir, '..', 'cfn-outputs', 'flat-outputs.json'
  )

  if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
      flat_outputs = f.read()
  else:
    flat_outputs = '{}'

  return json.loads(flat_outputs)


def get_stack_output(stack_prefix: str, output_key: str, env_suffix: str = 'dev') -> Optional[str]:
  """
  Get a specific output value from CloudFormation stacks.
  
  Args:
      stack_prefix: Prefix to match stack names (e.g., 'MultiRegionStackEUWest')
      output_key: The output key to retrieve (e.g., 'VPCId')
      env_suffix: Environment suffix to match (default: 'dev')
      
  Returns:
      Output value if found, None otherwise
  """
  flat_outputs = load_flat_outputs()
  
  for stack_output_key in flat_outputs.keys():
    if stack_output_key.endswith(f".{output_key}"):
      stack_name = stack_output_key.replace(f".{output_key}", "")
      if stack_prefix in stack_name and env_suffix in stack_name:
        return flat_outputs[stack_output_key]
  return None


def get_all_stack_outputs(env_suffix: str = 'dev') -> Dict[str, Dict[str, str]]:
  """
  Get all outputs organized by stack.
  
  Args:
      env_suffix: Environment suffix to filter by (default: 'dev')
      
  Returns:
      Dictionary organized as {stack_name: {output_key: output_value}}
  """
  flat_outputs = load_flat_outputs()
  organized_outputs = {}
  
  for full_key, value in flat_outputs.items():
    if env_suffix in full_key:
      parts = full_key.split('.')
      if len(parts) >= 2:
        stack_name = '.'.join(parts[:-1])
        output_key = parts[-1]
        
        if stack_name not in organized_outputs:
          organized_outputs[stack_name] = {}
        organized_outputs[stack_name][output_key] = value
  
  return organized_outputs


def wait_for_function_ready(lambda_client, function_name: str, timeout: int = 60) -> bool:
  """
  Wait for Lambda function to be in Active state.
  
  Args:
      lambda_client: Boto3 Lambda client
      function_name: Name of the Lambda function
      timeout: Maximum time to wait in seconds
      
  Returns:
      True if function becomes active, False if timeout
  """
  start_time = time.time()
  
  while time.time() - start_time < timeout:
    try:
      response = lambda_client.get_function(FunctionName=function_name)
      if response['Configuration']['State'] == 'Active':
        return True
    except Exception:
      pass
    
    time.sleep(2)
  
  return False


def create_test_payload(test_type: str, **kwargs) -> Dict[str, Any]:
  """
  Create standardized test payloads for Lambda functions.
  
  Args:
      test_type: Type of test ('unit', 'integration', 'performance', 'dr')
      **kwargs: Additional payload data
      
  Returns:
      Test payload dictionary
  """
  base_payload = {
    'test_type': test_type,
    'timestamp': time.time(),
    'test_id': f"{test_type}_{int(time.time())}"
  }
  
  base_payload.update(kwargs)
  return base_payload


def validate_aws_resource_name(resource_name: str, resource_type: str) -> bool:
  """
  Validate AWS resource naming conventions.
  
  Args:
      resource_name: Name of the AWS resource
      resource_type: Type of resource ('s3', 'lambda', 'vpc', 'rds', 'sns')
      
  Returns:
      True if name follows conventions, False otherwise
  """
  if not resource_name:
    return False
  
  # Common AWS naming rules
  if resource_type == 's3':
    return (len(resource_name) >= 3 and len(resource_name) <= 63 and 
            resource_name.islower() and not resource_name.startswith('-') and 
            not resource_name.endswith('-'))
  elif resource_type == 'lambda':
    return len(resource_name) <= 64 and resource_name.replace('-', '').replace('_', '').isalnum()
  elif resource_type in ['vpc', 'rds']:
    return len(resource_name) <= 255
  elif resource_type == 'sns':
    return len(resource_name) <= 256 and resource_name.replace('-', '').replace('_', '').isalnum()
  
  return True


def get_region_from_arn(arn: str) -> Optional[str]:
  """
  Extract region from AWS ARN.
  
  Args:
      arn: AWS ARN string
      
  Returns:
      Region string if found, None otherwise
  """
  if not arn or not arn.startswith('arn:aws:'):
    return None
  
  parts = arn.split(':')
  if len(parts) >= 4:
    return parts[3]
  return None


class TestMetrics:
  """Class to collect and analyze test metrics"""
  
  def __init__(self):
    self.metrics = {
      'execution_times': [],
      'success_count': 0,
      'failure_count': 0,
      'error_messages': []
    }
  
  def record_execution_time(self, duration: float):
    """Record test execution time"""
    self.metrics['execution_times'].append(duration)
  
  def record_success(self):
    """Record successful test"""
    self.metrics['success_count'] += 1
  
  def record_failure(self, error_message: str = ""):
    """Record failed test"""
    self.metrics['failure_count'] += 1
    if error_message:
      self.metrics['error_messages'].append(error_message)
  
  def get_average_execution_time(self) -> float:
    """Get average execution time"""
    if not self.metrics['execution_times']:
      return 0.0
    return sum(self.metrics['execution_times']) / len(self.metrics['execution_times'])
  
  def get_success_rate(self) -> float:
    """Get success rate percentage"""
    total_tests = self.metrics['success_count'] + self.metrics['failure_count']
    if total_tests == 0:
      return 0.0
    return (self.metrics['success_count'] / total_tests) * 100
  
  def get_summary(self) -> Dict[str, Any]:
    """Get comprehensive metrics summary"""
    return {
      'total_tests': self.metrics['success_count'] + self.metrics['failure_count'],
      'successful_tests': self.metrics['success_count'],
      'failed_tests': self.metrics['failure_count'],
      'success_rate': self.get_success_rate(),
      'average_execution_time': self.get_average_execution_time(),
      'total_execution_time': sum(self.metrics['execution_times']),
      'error_messages': self.metrics['error_messages']
    }
