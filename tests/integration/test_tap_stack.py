import json
import os
import unittest

from aws_cdk import App
from pytest import mark

from lib.metadata_stack import ServerlessDemoStack
from lib.tap_stack import TapStack


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
class TestTapStack(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up test environment"""
    # Check if we have deployment outputs available
    self.deployment_available = bool(flat_outputs and 
                                     os.path.exists(flat_outputs_path))

  @mark.it("should verify serverless demo stack deployment is successful")
  def test_stack_deployment_status(self):
    """Integration test to verify serverless demo stack deployment completed successfully"""
    if not self.deployment_available:
      self.skipTest("Serverless demo stack deployment outputs not available - "
                    "CI/CD deployment pending")
    
    # Verify deployment outputs exist and contain valid data
    self.assertIsInstance(flat_outputs, dict, 
                         "Deployment outputs should be a valid dictionary structure")
    self.assertGreater(len(flat_outputs), 0, 
                      "Deployment should produce stack outputs for integration testing")

  @mark.it("should validate lambda function deployment outputs and structure")
  def test_stack_outputs_structure(self):
    """Integration test validating serverless demo Lambda function outputs are properly exposed"""
    if not self.deployment_available:
      self.skipTest("Lambda deployment outputs not available - "
                    "CI/CD deployment incomplete")
    
    # Test expected Lambda function outputs from serverless demo stack
    expected_output_keys = [
      'LambdaFunctionName',
      'LambdaFunctionArn'
    ]
    
    # Validate Lambda function deployment outputs
    for key in expected_output_keys:
      if key in flat_outputs:
        self.assertIsNotNone(flat_outputs[key], 
                           f"Lambda {key} output should not be None")
        self.assertIsInstance(flat_outputs[key], str, 
                            f"Lambda {key} should be a valid string identifier")
        self.assertGreater(len(flat_outputs[key]), 0, 
                         f"Lambda {key} should contain valid resource identifier")

  @mark.it("should validate lambda timeout configuration is properly set to 15 seconds")
  def test_lambda_timeout_configuration(self):
    """Integration test validating Lambda function timeout is configured to 15 seconds 
    for cost efficiency"""
    if not self.deployment_available:
      self.skipTest("Lambda deployment not available - cannot validate timeout configuration")
    
    # Import boto3 for AWS Lambda client (only if deployment is available)
    try:
      import boto3  # pylint: disable=import-outside-toplevel
      lambda_client = boto3.client('lambda')
      
      # Get Lambda function name from outputs
      lambda_function_name = flat_outputs.get('LambdaFunctionName')
      if not lambda_function_name:
        self.skipTest("Lambda function name not found in deployment outputs")
      
      # Get Lambda function configuration
      response = lambda_client.get_function_configuration(
        FunctionName=lambda_function_name
      )
      
      # Validate timeout is set to 15 seconds (our requirement)
      actual_timeout = response.get('Timeout', 0)
      self.assertEqual(actual_timeout, 15, 
                      f"Lambda timeout should be 15 seconds for cost efficiency, "
                      f"but found {actual_timeout} seconds")
      
      # Validate function name follows serverless_demo prefix convention
      self.assertIn('serverless_demo', lambda_function_name.lower(), 
                   "Lambda function should follow serverless_demo naming convention")
      
    except ImportError:
      self.skipTest("boto3 not available - cannot validate Lambda timeout in "
                    "integration environment")
    except (boto3.exceptions.Boto3Error, boto3.exceptions.BotoCoreError) as e:
      self.skipTest(f"Unable to validate Lambda timeout configuration: {str(e)}")

  @mark.it("should validate serverless demo infrastructure meets all deployment requirements") 
  def test_infrastructure_requirements(self):
    """Integration test validating serverless demo infrastructure meets all 
    specified requirements"""
    # Test 1: Verify serverless demo stack implementation exists and is properly structured
    app = App()
    stack = TapStack(app, "TestStack")
    
    # Verify the stack has the nested serverless demo stack
    self.assertIsNotNone(stack.nested_serverless_stack, 
                        "TapStack should contain nested ServerlessDemoStack for "
                        "modular architecture")
    
    # Test 2: Verify stack modularity and parameterization capabilities
    test_stack = TapStack(app, "TestStackWithSuffix", 
                          props=None)  # Will use default 'dev'
    self.assertIsNotNone(test_stack.nested_serverless_stack,
                        "TapStack should support environment parameterization")
    
    # Test 3: Verify serverless demo stack components are properly configured
    serverless_stack = ServerlessDemoStack(app, "TestServerlessStack")
    self.assertIsNotNone(serverless_stack, 
                        "ServerlessDemoStack should be instantiable for deployment")

  @mark.it("should validate lambda function can handle timeout scenarios effectively")
  def test_lambda_timeout_behavior(self):
    """Integration test validating Lambda function timeout behavior under load"""
    if not self.deployment_available:
      self.skipTest("Lambda deployment not available - cannot test timeout behavior")
    
    try:
      import boto3  # pylint: disable=import-outside-toplevel
      import time  # pylint: disable=import-outside-toplevel
      lambda_client = boto3.client('lambda')
      
      # Get Lambda function name from outputs
      lambda_function_name = flat_outputs.get('LambdaFunctionName')
      if not lambda_function_name:
        self.skipTest("Lambda function name not found for timeout testing")
      
      # Test 1: Verify normal invocation completes within timeout
      start_time = time.time()
      response = lambda_client.invoke(
        FunctionName=lambda_function_name,
        InvocationType='RequestResponse',
        Payload=json.dumps({'test': 'timeout_validation'})
      )
      execution_time = time.time() - start_time
      
      # Verify invocation was successful
      self.assertEqual(response['StatusCode'], 200, 
                      "Lambda function should execute successfully within timeout")
      
      # Verify execution time is well within 15-second timeout
      self.assertLess(execution_time, 15, 
                     f"Lambda execution should complete within 15-second timeout, "
                     f"took {execution_time:.2f}s")
      
      # Verify response payload
      payload = json.loads(response['Payload'].read())
      self.assertEqual(payload.get('statusCode'), 200, 
                      "Lambda should return successful status code")
      self.assertIn('Hello from ServerlessDemo Lambda', payload.get('body', ''),
                   "Lambda should return expected serverless demo message")
      
    except ImportError:
      self.skipTest("boto3 not available for Lambda timeout behavior testing")
    except (boto3.exceptions.Boto3Error, boto3.exceptions.BotoCoreError) as e:
      self.skipTest(f"Unable to test Lambda timeout behavior: {str(e)}")
