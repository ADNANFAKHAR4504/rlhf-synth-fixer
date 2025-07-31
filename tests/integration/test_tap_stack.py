import os
import json
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

    self.outputs = flat_outputs  # Already flat
    self.bucket_name = self.outputs.get('TapStackSecureBucketName')
    self.role_name = self.outputs.get('TapStackIamRoleName')

  @mark.it("S3 bucket exists and has encryption enabled")
  def test_s3_bucket_exists_and_encrypted(self):
    if not self.bucket_name:
      self.fail("❌ 'TapStackSecureBucketName' not found in flat-outputs.json")

    response = self.s3.get_bucket_encryption(Bucket=self.bucket_name)
    rules = response['ServerSideEncryptionConfiguration']['Rules']

    encryption_types = [
      rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
      for rule in rules
    ]

    self.assertIn('aws:kms', encryption_types)

  @mark.it("S3 bucket blocks public access")
  def test_s3_bucket_blocks_public_access(self):
    if not self.bucket_name:
      self.fail("❌ 'TapStackSecureBucketName' not found in flat-outputs.json")

    response = self.s3.get_bucket_policy_status(Bucket=self.bucket_name)
    self.assertFalse(
      response['PolicyStatus']['IsPublic'],
      "Bucket should not be public"
    )

  @mark.it("IAM Role exists and trusts EC2")
  def test_iam_role_exists_and_trusts_ec2(self):
    if not self.role_name:
      self.fail("❌ 'TapStackIamRoleName' not found in flat-outputs.json")

    response = self.iam.get_role(RoleName=self.role_name)
    assume_policy = response['Role']['AssumeRolePolicyDocument']

    found_ec2 = any(
      stmt.get('Principal', {}).get('Service') == 'ec2.amazonaws.com'
      for stmt in assume_policy.get('Statement', [])
    )

    self.assertTrue(
      found_ec2,
      "IAM Role does not trust EC2"
    )

  @mark.it("IAM Role has inline EC2 read-only policy")
  def test_iam_role_has_policy(self):
    if not self.role_name:
      self.fail("❌ 'TapStackIamRoleName' not found in flat-outputs.json")

    role = self.iam.get_role(RoleName=self.role_name)
    inline_policies = self.iam.list_role_policies(RoleName=self.role_name)

    self.assertIn(
      "CustomEC2ReadOnlyPolicy",
      inline_policies.get("PolicyNames", []),
      "Expected inline policy 'CustomEC2ReadOnlyPolicy' not found"
    )
