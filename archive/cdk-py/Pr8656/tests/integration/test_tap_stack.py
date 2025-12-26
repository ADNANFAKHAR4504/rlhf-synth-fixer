import json
import os
import unittest

import pytest
from pytest import mark

# Open file cfn-outputs/flat-outputs.json or cdk-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path_cfn = os.path.join(
        base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)
flat_outputs_path_cdk = os.path.join(
        base_dir, '..', '..', 'cdk-outputs', 'flat-outputs.json'
)

flat_outputs = {}
outputs_file_exists = False
if os.path.exists(flat_outputs_path_cdk):
    with open(flat_outputs_path_cdk, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
    outputs_file_exists = True
elif os.path.exists(flat_outputs_path_cfn):
    with open(flat_outputs_path_cfn, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
    outputs_file_exists = True


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up for integration tests"""
        self.outputs = flat_outputs
        if not outputs_file_exists:
            pytest.skip("Deployment outputs not found - skipping integration tests")

    @mark.it("verifies S3 bucket output exists")
    def test_s3_bucket_output_exists(self):
        # ARRANGE & ACT
        # Check if any output contains 'S3Bucket' or 'Bucket'
        bucket_outputs = [k for k in self.outputs.keys() if 'bucket' in k.lower() or 's3' in k.lower()]

        # ASSERT
        self.assertTrue(len(bucket_outputs) > 0, "Expected at least one S3 bucket output")

    @mark.it("verifies CloudFront distribution output exists")
    def test_cloudfront_output_exists(self):
        # ARRANGE & ACT
        # Check if any output contains 'CloudFront' or 'Distribution'
        cf_outputs = [k for k in self.outputs.keys() if 'cloudfront' in k.lower() or 'distribution' in k.lower()]

        # ASSERT
        self.assertTrue(len(cf_outputs) > 0, "Expected at least one CloudFront output")

    @mark.it("verifies RDS endpoint output exists")
    def test_rds_endpoint_output_exists(self):
        # ARRANGE & ACT
        # Check if any output contains 'Rds' or 'Database'
        rds_outputs = [k for k in self.outputs.keys() if 'rds' in k.lower() or 'database' in k.lower() or 'endpoint' in k.lower()]

        # ASSERT
        self.assertTrue(len(rds_outputs) > 0, "Expected at least one RDS output")

    @mark.it("verifies all required stack outputs exist")
    def test_all_outputs_exist(self):
        # ARRANGE
        # The stack should have at least 3-4 outputs (S3, CloudFront, RDS endpoint, RDS secret)

        # ACT & ASSERT
        self.assertGreaterEqual(len(self.outputs), 3, f"Expected at least 3 outputs, got {len(self.outputs)}")
