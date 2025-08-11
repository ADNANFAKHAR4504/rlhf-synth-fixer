import json
import os
import unittest
import boto3
from pytest import mark

# Load flat outputs
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
    
    # Use keys that actually exist in flat-outputs.json
    self.bucket_name = flat_outputs.get("SecureBucketNameOutput")
    self.role_name = flat_outputs.get("IamRoleNameOutput")

  @mark.it("✅ S3 bucket exists and has encryption enabled")
  def test_s3_bucket_exists_and_encrypted(self):
    if not self.bucket_name:
      self.fail("❌ 'SecureBucketNameOutput' not found in flat-outputs.json")

    response = self.s3.get_bucket_encryption(Bucket=self.bucket_name)
    rules = response['ServerSideEncryptionConfiguration']['Rules']

    encryption_types = [
      rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
      for rule in rules
    ]

    self.assertIn('aws:kms', encryption_types)

  @mark.it("✅ S3 bucket blocks public access")
  def test_s3_bucket_blocks_public_access(self):
    if not self.bucket_name:
      self.fail("❌ 'SecureBucketNameOutput' not found in flat-outputs.json")

    response = self.s3.get_bucket_policy_status(Bucket=self.bucket_name)
    is_public = response['PolicyStatus']['IsPublic']
    self.assertFalse(is_public, "❌ S3 bucket is public")

  @mark.it("✅ IAM Role exists and trusts EC2")
  def test_iam_role_exists_and_trusts_ec2(self):
    if not self.role_name:
      self.fail("❌ 'IamRoleNameOutput' not found in flat-outputs.json")

    response = self.iam.get_role(RoleName=self.role_name)
    assume_policy = response['Role']['AssumeRolePolicyDocument']

    trusted_services = [
      stmt.get('Principal', {}).get('Service')
      for stmt in assume_policy.get('Statement', [])
    ]
    self.assertIn('ec2.amazonaws.com', trusted_services)

  @mark.it("✅ IAM Role has inline EC2 read-only policy")
  def test_iam_role_has_policy(self):
    if not self.role_name:
      self.fail("❌ 'IamRoleNameOutput' not found in flat-outputs.json")

    response = self.iam.get_role_policy(
      RoleName=self.role_name,
      PolicyName='CustomEC2ReadOnlyPolicy'
    )

    statements = response['PolicyDocument']['Statement']
    found = any(
      stmt['Effect'] == 'Allow'
      and 'ec2:DescribeInstances' in stmt['Action']
      and 'ec2:DescribeTags' in stmt['Action']
      for stmt in statements
    )

    self.assertTrue(found, "❌ IAM policy missing required EC2 read-only actions")

