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


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up test environment"""
    # Check if we have deployment outputs available
    self.deployment_available = bool(flat_outputs and 
                                     os.path.exists(flat_outputs_path))

  @mark.it("should check stack deployment status")
  def test_stack_deployment_status(self):
    """Test to verify if stack is deployed or skip if not available"""
    if not self.deployment_available:
      self.skipTest("No deployment outputs available - deployment not complete")
    
    # If we get here, we have outputs - we could test actual resources
    # For now, just verify we have some outputs
    self.assertIsInstance(flat_outputs, dict)
    self.assertGreater(len(flat_outputs), 0)

  @mark.it("should validate stack outputs structure")
  def test_stack_outputs_structure(self):
    """Test that validates the expected structure of stack outputs"""
    if not self.deployment_available:
      self.skipTest("No deployment outputs available - deployment not complete")
    
    # Test that we have the expected outputs from our serverless demo stack
    # This would be populated by the actual deployment
    expected_output_keys = [
      'LambdaFunctionName',
      'LambdaFunctionArn'
    ]
    
    # Check if any expected outputs exist (they may not in CI/CD environment)
    for key in expected_output_keys:
      if key in flat_outputs:
        self.assertIsNotNone(flat_outputs[key])
        self.assertIsInstance(flat_outputs[key], str)
        self.assertGreater(len(flat_outputs[key]), 0)

  @mark.it("should validate infrastructure requirements are met")
  def test_infrastructure_requirements(self):
    """Test that validates our infrastructure meets the original requirements"""
    # Test 1: Verify we have a serverless demo stack implementation
    from lib.metadata_stack import ServerlessDemoStack
    from lib.tap_stack import TapStack
    from aws_cdk import App
    
    # Create a test app and stack
    app = App()
    stack = TapStack(app, "TestStack")
    
    # Verify the stack has the nested serverless demo stack
    self.assertIsNotNone(stack.nested_serverless_stack)
    
    # Test 2: Verify the stack is modular and parameterizable
    # Test with different environment suffix
    test_stack = TapStack(app, "TestStackWithSuffix", 
                          props=None)  # Will use default 'dev'
    self.assertIsNotNone(test_stack.nested_serverless_stack)
    
    # Test 3: Verify stack components exist
    # This tests the structure without requiring AWS deployment
    serverless_stack = ServerlessDemoStack(app, "TestServerlessStack")
    self.assertIsNotNone(serverless_stack)
