"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import boto3
import pulumi
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  def setUp(self):
    """Set up integration test with live stack."""
    self.stack_name = "dev"  # Your live Pulumi stack name (just the env part)
    self.project_name = "tap-infra"  # Your Pulumi project name
    self.s3_client = boto3.client('s3')
    
    # Configure Pulumi to use S3 backend (not Pulumi Cloud)
    self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', 's3://iac-rlhf-pulumi-states')

  def test_live_stack_outputs_exist(self):
    """Test that live stack has expected outputs."""
    # Get stack outputs from live Pulumi stack using S3 backend
    workspace = auto.LocalWorkspace(
      project_settings=auto.ProjectSettings(
        name=self.project_name,
        runtime="python"
      ),
      work_dir="."
    )
    
    # Set backend URL to S3
    workspace.install_plugin("aws", "v6.0.2")
    
    stack = auto.Stack.select(
      stack_name=self.stack_name,
      workspace=workspace
    )
    
    outputs = stack.outputs()
    
    # Verify dummy_bucket_name output exists
    self.assertIn("dummy_bucket_name", outputs)
    bucket_name = outputs["dummy_bucket_name"].value
    self.assertTrue(bucket_name.startswith("tap-dummy-bucket-dev"))

  def test_s3_bucket_exists_in_aws(self):
    """Test that S3 bucket actually exists in AWS."""
    # Get bucket name from Pulumi stack using S3 backend
    workspace = auto.LocalWorkspace(work_dir=".")
    stack = auto.Stack.select(stack_name=self.stack_name, workspace=workspace)
    bucket_name = stack.outputs()["dummy_bucket_name"].value
    
    # Verify bucket exists in AWS
    response = self.s3_client.head_bucket(Bucket=bucket_name)
    self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

  def test_s3_bucket_has_correct_tags(self):
    """Test that S3 bucket has expected tags."""
    # Get bucket name from Pulumi stack using S3 backend
    workspace = auto.LocalWorkspace(work_dir=".")
    stack = auto.Stack.select(stack_name=self.stack_name, workspace=workspace)
    bucket_name = stack.outputs()["dummy_bucket_name"].value
    
    # Get bucket tags (handle case where no tags exist)
    try:
      tags_response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
      tags = {tag['Key']: tag['Value'] for tag in tags_response['TagSet']}
      
      # Verify expected tags
      self.assertEqual(tags['Environment'], 'dev')
      self.assertEqual(tags['Owner'], 'test-user')
      self.assertEqual(tags['Project'], 'pulumi-dummy')
    except Exception as e:
      if 'NoSuchTagSet' in str(e):
        self.fail("S3 bucket has no tags, but tags were expected")
      else:
        raise e


if __name__ == '__main__':
  unittest.main()