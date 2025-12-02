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
        self.stack_name = "dev"
        self.project_name = "tap-infra"
        self.s3_client = boto3.client('s3')
        backend_url = 's3://iac-rlhf-pulumi-states'
        self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', backend_url)
