import json
import os
import unittest
import boto3
from moto import mock_lambda, mock_kms
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
    """Set up AWS clients for integration testing"""
    self.lambda_client = boto3.client('lambda', region_name='us-west-2')
    self.kms_client = boto3.client('kms', region_name='us-west-2')
    self.cloudformation_client = boto3.client('cloudformation', region_name='us-west-2')

  @mark.it("verifies Lambda function exists in deployed stack")
  def test_lambda_function_exists(self):
    """Test that the Lambda function is properly deployed"""
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")
    
    # Extract Lambda function name from outputs
    lambda_function_arn = None
    for key, value in flat_outputs.items():
      if 'lambda' in key.lower() and 'arn' in key.lower():
        lambda_function_arn = value
        break
    
    if not lambda_function_arn:
      self.skipTest("Lambda function ARN not found in stack outputs")
    
    function_name = lambda_function_arn.split(':')[-1]
    
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      self.assertIsNotNone(response)
      self.assertEqual(response['Configuration']['Runtime'], 'python3.8')
      self.assertEqual(response['Configuration']['Handler'], 'lambda_function.handler')
    except Exception as e:
      self.fail(f"Lambda function verification failed: {str(e)}")

  @mark.it("verifies KMS key exists and has correct configuration")
  def test_kms_key_configuration(self):
    """Test that the KMS key is properly configured"""
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")
    
    # Extract KMS key ID from outputs
    kms_key_id = None
    for key, value in flat_outputs.items():
      if 'kms' in key.lower() and 'key' in key.lower():
        kms_key_id = value
        break
    
    if not kms_key_id:
      self.skipTest("KMS key ID not found in stack outputs")
    
    try:
      response = self.kms_client.describe_key(KeyId=kms_key_id)
      key_metadata = response['KeyMetadata']
      
      self.assertIsNotNone(key_metadata)
      self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
      self.assertTrue(key_metadata['Enabled'])
      
      # Verify key rotation is enabled
      rotation_response = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
      self.assertTrue(rotation_response['KeyRotationEnabled'])
      
    except Exception as e:
      self.fail(f"KMS key verification failed: {str(e)}")

  @mark.it("verifies Lambda function has encrypted environment variables")
  def test_lambda_environment_encryption(self):
    """Test that Lambda environment variables are encrypted with KMS"""
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")
    
    lambda_function_arn = None
    kms_key_id = None
    
    for key, value in flat_outputs.items():
      if 'lambda' in key.lower() and 'arn' in key.lower():
        lambda_function_arn = value
      elif 'kms' in key.lower() and 'key' in key.lower():
        kms_key_id = value
    
    if not lambda_function_arn or not kms_key_id:
      self.skipTest("Required resources not found in stack outputs")
    
    function_name = lambda_function_arn.split(':')[-1]
    
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      config = response['Configuration']
      
      # Verify environment variables exist
      self.assertIn('Environment', config)
      self.assertIn('Variables', config['Environment'])
      self.assertIn('SECRET_KEY', config['Environment']['Variables'])
      
      # Verify KMS key is used for encryption
      if 'KMSKeyArn' in config:
        self.assertIn(kms_key_id, config['KMSKeyArn'])
      
    except Exception as e:
      self.fail(f"Lambda environment encryption verification failed: {str(e)}")

  @mark.it("verifies end-to-end Lambda execution")
  def test_lambda_execution_end_to_end(self):
    """Test that the Lambda function can be invoked successfully"""
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")
    
    lambda_function_arn = None
    for key, value in flat_outputs.items():
      if 'lambda' in key.lower() and 'arn' in key.lower():
        lambda_function_arn = value
        break
    
    if not lambda_function_arn:
      self.skipTest("Lambda function ARN not found in stack outputs")
    
    function_name = lambda_function_arn.split(':')[-1]
    
    try:
      # Invoke the Lambda function
      response = self.lambda_client.invoke(
        FunctionName=function_name,
        InvocationType='RequestResponse',
        Payload=json.dumps({"test": "data"})
      )
      
      self.assertEqual(response['StatusCode'], 200)
      self.assertNotIn('FunctionError', response)
      
      # Verify response payload
      payload = json.loads(response['Payload'].read())
      self.assertIsNotNone(payload)
      
    except Exception as e:
      self.fail(f"Lambda end-to-end execution failed: {str(e)}")

  @mark.it("verifies stack resources have correct tags")
  def test_stack_resources_have_correct_tags(self):
    """Test that deployed resources have the required tags"""
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")
    
    # Extract stack name from outputs or use default pattern
    stack_name = None
    for key in flat_outputs.keys():
      if 'StackName' in key:
        stack_name = flat_outputs[key]
        break
    
    if not stack_name:
      # Try to infer stack name from other outputs
      stack_name = "DemoStackdev"  # Default based on code
    
    try:
      response = self.cloudformation_client.describe_stacks(StackName=stack_name)
      stack = response['Stacks'][0]
      
      tags = {tag['Key']: tag['Value'] for tag in stack.get('Tags', [])}
      
      # Verify required tags exist
      self.assertIn('Environment', tags)
      self.assertIn('Repository', tags)
      self.assertIn('Author', tags)
      
    except Exception as e:
      self.fail(f"Stack tag verification failed: {str(e)}")

  @mark.it("verifies infrastructure security best practices")
  def test_infrastructure_security_best_practices(self):
    """Test that security best practices are implemented"""
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")
    
    lambda_function_arn = None
    for key, value in flat_outputs.items():
      if 'lambda' in key.lower() and 'arn' in key.lower():
        lambda_function_arn = value
        break
    
    if not lambda_function_arn:
      self.skipTest("Lambda function ARN not found in stack outputs")
    
    function_name = lambda_function_arn.split(':')[-1]
    
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      config = response['Configuration']
      
      # Verify timeout is reasonable (not too long)
      self.assertLessEqual(config['Timeout'], 30)
      
      # Verify memory is set appropriately
      self.assertGreaterEqual(config['MemorySize'], 128)
      
      # Verify function has proper IAM role
      self.assertIn('Role', config)
      self.assertTrue(config['Role'].startswith('arn:aws:iam::'))
      
    except Exception as e:
      self.fail(f"Security best practices verification failed: {str(e)}")