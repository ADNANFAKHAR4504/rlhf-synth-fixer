import json
import os
import unittest
import boto3
from pytest import mark

# Load raw outputs
base = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(base, '..', '..', 'cfn-outputs', 'flat-outputs.json')
flat = {}
if os.path.exists(path):
  with open(path, 'r') as f:
    flat = json.load(f)

@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  def setUp(self):
    self.s3 = boto3.client('s3')
    self.iam = boto3.client('iam')
    self.region = os.environ.get('AWS_REGION', None)
    # flatten export names to values
    self.outputs = {}
    for entries in flat.values():
      for ent in entries:
        self.outputs[ent['ExportName']] = ent['OutputValue']
    self.bucket_name = self.outputs.get('TapStackSecureBucketName')
    self.role_name = self.outputs.get('TapStackIamRoleName')

  @mark.it("S3 bucket exists and has encryption enabled")
  def test_s3_bucket_exists_and_encrypted(self):
    self.assertTrue(self.bucket_name, "Missing bucket name")
    resp = self.s3.get_bucket_encryption(Bucket=self.bucket_name)
    algos = [rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
             for rule in resp['ServerSideEncryptionConfiguration']['Rules']]
    self.assertIn('aws:kms', algos)

  @mark.it("S3 bucket blocks public access")
  def test_s3_bucket_blocks_public_access(self):
    self.assertTrue(self.bucket_name, "Missing bucket name")
    resp = self.s3.get_public_access_block(Bucket=self.bucket_name)
    block = resp.get('PublicAccessBlockConfiguration', {})
    self.assertTrue(block.get('BlockPublicAcls'))
    self.assertTrue(block.get('BlockPublicPolicy'))

  @mark.it("IAM role exists and trusts EC2")
  def test_iam_role_exists_and_trusts_ec2(self):
    self.assertTrue(self.role_name, "Missing role name")
    resp = self.iam.get_role(RoleName=self.role_name)
    pol = resp['Role']['AssumeRolePolicyDocument']
    stmts = pol.get('Statement', [])
    self.assertTrue(any(stmt.get('Principal', {}).get('Service') == 'ec2.amazonaws.com'
                        for stmt in stmts),
                    "Role does not trust EC2")

  @mark.it("IAM role has EC2 permission policy")
  def test_iam_role_has_policy(self):
    self.assertTrue(self.role_name, "Missing role name")
    resp = self.iam.list_role_policies(RoleName=self.role_name)
    self.assertIn('CustomEC2ReadOnlyPolicy', resp.get('PolicyNames', []))
