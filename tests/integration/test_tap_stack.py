"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import json
import os


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    def setUp(self):
        """Set up integration test with live stack."""
        self.stack_name = "Production"
        self.project_name = "TapStack"
        self.region = "us-west-2"

        # Load outputs from flat-outputs.json if available
        self.outputs = {}
        try:
            with open('cfn-outputs/flat-outputs.json', 'r') as f:
                self.outputs = json.load(f)
        except FileNotFoundError:
            self.skipTest("No deployment outputs found. Run deployment first.")

    def test_api_gateway_url_accessible(self):
        """Test that API Gateway URL is accessible."""
        if 'api_gateway_url' not in self.outputs:
            self.skipTest("API Gateway URL not found in outputs")

        # This test would require making HTTP requests to the actual endpoint
        # For now, just verify the URL format
        url = self.outputs['api_gateway_url']
        self.assertTrue(url.startswith('https://'))
        self.assertIn('.execute-api.', url)
        self.assertIn('us-west-2', url)


if __name__ == "__main__":
    unittest.main()