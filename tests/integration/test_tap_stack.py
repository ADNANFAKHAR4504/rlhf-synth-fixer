import json
import os
import unittest
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
    self.lambda_client = boto3.client('lambda', region_name='us-west-2')
    self.kms_client = boto3.client('kms', region_name='us-west-2')
    self.cloudformation_client = boto3.client(
        'cloudformation', region_name='us-west-2')

  @mark.it("verifies Lambda function exists in deployed stack")
  def test_lambda_function_exists(self):
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")

    lambda_function_arn = next((value for key, value in flat_outputs.items(
    ) if 'lambda' in key.lower() and 'arn' in key.lower()), None)

    if not lambda_function_arn:
      self.skipTest("Lambda function ARN not found in stack outputs")

    function_name = lambda_function_arn.split(':')[-1]

    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      self.assertIsNotNone(response)
      self.assertEqual(response['Configuration']['Runtime'], 'python3.8')
      self.assertEqual(
          response['Configuration']['Handler'],
          'lambda_function.handler')
    except ClientError as e:
      self.fail(f"Lambda function verification failed: {e}")

  @mark.it("verifies KMS key exists and has correct configuration")
  def test_kms_key_configuration(self):
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")

    kms_key_id = next((value for key, value in flat_outputs.items(
    ) if 'kms' in key.lower() and 'key' in key.lower()), None)

    if not kms_key_id:
      self.skipTest("KMS key ID not found in stack outputs")

    try:
      response = self.kms_client.describe_key(KeyId=kms_key_id)
      key_metadata = response['KeyMetadata']

      self.assertIsNotNone(key_metadata)
      self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
      self.assertTrue(key_metadata['Enabled'])

      rotation_response = self.kms_client.get_key_rotation_status(
          KeyId=kms_key_id)
      self.assertTrue(rotation_response['KeyRotationEnabled'])

    except ClientError as e:
      self.fail(f"KMS key verification failed: {e}")

  @mark.it("verifies Lambda function has encrypted environment variables")
  def test_lambda_environment_encryption(self):
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")

    lambda_function_arn = next((value for key, value in flat_outputs.items(
    ) if 'lambda' in key.lower() and 'arn' in key.lower()), None)
    kms_key_id = next((value for key, value in flat_outputs.items(
    ) if 'kms' in key.lower() and 'key' in key.lower()), None)

    if not lambda_function_arn or not kms_key_id:
      self.skipTest("Required resources not found in stack outputs")

    function_name = lambda_function_arn.split(':')[-1]

    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      config = response['Configuration']

      self.assertIn('Environment', config)
      self.assertIn('Variables', config['Environment'])
      self.assertIn('SECRET_KEY', config['Environment']['Variables'])

      if 'KMSKeyArn' in config:
        self.assertIn(kms_key_id, config['KMSKeyArn'])

    except ClientError as e:
      self.fail(f"Lambda environment encryption verification failed: {e}")

  @mark.it("verifies end-to-end Lambda execution")
  def test_lambda_execution_end_to_end(self):
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")

    lambda_function_arn = next((value for key, value in flat_outputs.items(
    ) if 'lambda' in key.lower() and 'arn' in key.lower()), None)

    if not lambda_function_arn:
      self.skipTest("Lambda function ARN not found in stack outputs")

    function_name = lambda_function_arn.split(':')[-1]

    try:
      response = self.lambda_client.invoke(
          FunctionName=function_name,
          InvocationType='RequestResponse',
          Payload=json.dumps({"test": "data"})
      )

      self.assertEqual(response['StatusCode'], 200)
      self.assertNotIn('FunctionError', response)

      payload = json.loads(response['Payload'].read())
      self.assertIsNotNone(payload)

    except ClientError as e:
      self.fail(f"Lambda end-to-end execution failed: {e}")

  @mark.it("verifies infrastructure security best practices")
  def test_infrastructure_security_best_practices(self):
    if not flat_outputs:
      self.skipTest("No CloudFormation outputs available - stack not deployed")

    lambda_function_arn = next((value for key, value in flat_outputs.items(
    ) if 'lambda' in key.lower() and 'arn' in key.lower()), None)

    if not lambda_function_arn:
      self.skipTest("Lambda function ARN not found in stack outputs")

    function_name = lambda_function_arn.split(':')[-1]

    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      config = response['Configuration']

      self.assertLessEqual(config['Timeout'], 30)
      self.assertGreaterEqual(config['MemorySize'], 128)
      self.assertIn('Role', config)
      self.assertTrue(config['Role'].startswith('arn:aws:iam::'))

    except ClientError as e:
      self.fail(f"Security best practices verification failed: {e}")
