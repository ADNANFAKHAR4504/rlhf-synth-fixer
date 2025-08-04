"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import os
import boto3


class TestTapStackLiveIntegration:
  """Integration tests against live deployed Pulumi stack."""

  def __init__(self):
    """Initialize test attributes."""
    self.stack_name = "dev"
    self.project_name = "tap-infra"
    self.s3_client = boto3.client('s3')
    backend_url = 's3://iac-rlhf-pulumi-states'
    self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', backend_url)

  def setup_method(self):
    """Set up integration test with live stack."""
