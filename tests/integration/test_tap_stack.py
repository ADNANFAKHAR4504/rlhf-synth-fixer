"""
Integration tests for the TapStack CDK stack.
Verifies deployed AWS resources using boto3 and CloudFormation outputs.
"""

import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load flat CloudFormation outputs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(
    BASE_DIR, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(FLAT_OUTPUTS_PATH):
  with open(FLAT_OUTPUTS_PATH, 'r', encoding='utf-8') as f:
    FLAT_OUTPUTS = json.load(f)
else:
  FLAT_OUTPUTS = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack resources"""

  def setUp(self):
    """Initialise boto3 clients"""
    self.s3_client = boto3.client('s3')
    self.cf_client = boto3.client('cloudformation')

  @mark.it("verifies S3 bucket exists and is accessible")
  def test_s3_bucket_exists(self):
    bucket_name = FLAT_OUTPUTS.get('BucketName')
    self.assertIsNotNone(bucket_name, "BucketName missing from outputs")

    try:
      self.s3_client.head_bucket(Bucket=bucket_name)
    except ClientError as exc:
      self.fail(f"S3 bucket '{bucket_name}' does not exist or is inaccessible: {exc}")

  @mark.it("verifies S3 bucket has versioning enabled")
  def test_s3_bucket_versioning(self):
    bucket_name = FLAT_OUTPUTS.get('BucketName')
    self.assertIsNotNone(bucket_name, "BucketName missing from outputs")

    response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
    status = response.get('Status', '')
    self.assertEqual(status, 'Enabled', f"Versioning not enabled for bucket '{bucket_name}'")

  @mark.it("verifies CloudFormation stack exists")
  def test_cloudformation_stack_exists(self):
    stack_name = FLAT_OUTPUTS.get('StackName')
    self.assertIsNotNone(stack_name, "StackName missing from outputs")

    try:
      stacks = self.cf_client.describe_stacks(StackName=stack_name)['Stacks']
      self.assertTrue(stacks, f"Stack '{stack_name}' not found")
    except ClientError as exc:
      self.fail(f"CloudFormation stack '{stack_name}' not found: {exc}")

  @mark.it("verifies CloudFormation stack is in CREATE_COMPLETE or UPDATE_COMPLETE state")
  def test_cloudformation_stack_status(self):
    stack_name = FLAT_OUTPUTS.get('StackName')
    self.assertIsNotNone(stack_name, "StackName missing from outputs")

    stacks = self.cf_client.describe_stacks(StackName=stack_name)['Stacks']
    status = stacks[0].get('StackStatus')
    self.assertIn(
        status,
        ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
        f"Stack '{stack_name}' status is '{status}'"
    )
