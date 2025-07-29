"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import boto3
import pulumi
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  def setUp(self):
    """Set up integration test with live stack."""
    self.stack_name = "tap-infra-dev"  # Your live Pulumi stack name
    self.project_name = "tap-infra"  # Your Pulumi project name
    self.s3_client = boto3.client('s3')

  def test_live_stack_outputs_exist(self):
    """Test that live stack has expected outputs."""
    # Get stack outputs from live Pulumi stack
    stack = auto.select_stack(
      stack_name=self.stack_name,
      project_name=self.project_name,
      work_dir="."
    )
    outputs = stack.outputs()
    
    # Verify dummy_bucket_name output exists
    self.assertIn("dummy_bucket_name", outputs)
    bucket_name = outputs["dummy_bucket_name"].value
    self.assertTrue(bucket_name.startswith("tap-dummy-bucket-dev"))

  def test_s3_bucket_exists_in_aws(self):
    """Test that S3 bucket actually exists in AWS."""
    # Get bucket name from Pulumi stack
    stack = auto.select_stack(
      stack_name=self.stack_name,
      project_name=self.project_name,
      work_dir="."
    )
    bucket_name = stack.outputs()["dummy_bucket_name"].value
    
    # Verify bucket exists in AWS
    response = self.s3_client.head_bucket(Bucket=bucket_name)
    self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

  def test_s3_bucket_has_correct_tags(self):
    """Test that S3 bucket has expected tags."""
    # Get bucket name from Pulumi stack
    stack = auto.select_stack(
      stack_name=self.stack_name,
      project_name=self.project_name,
      work_dir="."
    )
    bucket_name = stack.outputs()["dummy_bucket_name"].value
    
    # Get bucket tags
    tags_response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
    tags = {tag['Key']: tag['Value'] for tag in tags_response['TagSet']}
    
    # Verify expected tags
    self.assertEqual(tags['Environment'], 'dev')
    self.assertEqual(tags['Owner'], 'test-user')
    self.assertEqual(tags['Project'], 'pulumi-dummy')


if __name__ == '__main__':
  unittest.main()