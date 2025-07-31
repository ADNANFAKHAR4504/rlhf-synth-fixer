import json
import os
import unittest
import boto3

from pytest import mark

# Load CloudFormation flat outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)
else:
  flat_outputs = {}

@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):

  def setUp(self):
    self.s3 = boto3.client('s3')
    self.iam = boto3.client('iam')
    self.region = os.environ.get('AWS_REGION', 'us-east-1')

    # Outputs expected in flat-outputs.json
    self.bucket_name = flat_outputs.get('TapStackSecureBucketName')
    self.role_name = flat_outputs.get('TapStackIamRoleName')

  @mark.it("S3 bucket exists and has encryption enabled")
  def test_s3_bucket_exists_and_encrypted(self):
    self.assertIsNotNone(self.bucket_name, "Bucket name not found in flat-outputs.json")

    response = self.s3.get_bucket_encryption(Bucket=self.bucket_name)
    rules = response['ServerSideEncryptionConfiguration']['Rules']

    encryption_types = [rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] for rule in rules]
    self.assertIn('aws:kms', encryption_types)

  @mark.it("S3 bucket blocks public access")
  def test_s3_bucket_blocks_public_access(self):
    self.assertIsNotNone(self.bucket_name, "Bucket name not found in flat-outputs.json")

    response = self.s3.get_bucket_policy_status(Bucket=self.bucket_name)
    self.assertTrue(response['PolicyStatus']['IsPublic'] is False)

  @mark.it("IAM Role exists and has expected trust policy")
  def test_iam_role_exists_and_trusts_lambda(self):
    self.assertIsNotNone(self.role_name, "IAM Role name not found in flat-outputs.json")

    response = self.iam.get_role(RoleName=self.role_name)
    assume_policy = response['Role']['AssumeRolePolicyDocument']
    
    found_lambda = any(
      stmt.get('Principal', {}).get('Service') == 'lambda.amazonaws.com'
      for stmt in assume_policy.get('Statement', [])
    )

    self.assertTrue(found_lambda, "IAM Role does not trust Lambda")

  @mark.it("IAM Role has AWSLambdaBasicExecutionRole managed policy")
  def test_iam_role_has_lambda_execution_policy(self):
    self.assertIsNotNone(self.role_name, "IAM Role name not found in flat-outputs.json")

    response = self.iam.list_attached_role_policies(RoleName=self.role_name)
    attached_policies = [p['PolicyArn'] for p in response['AttachedPolicies']]

    expected_policy = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    self.assertIn(expected_policy, attached_policies)
