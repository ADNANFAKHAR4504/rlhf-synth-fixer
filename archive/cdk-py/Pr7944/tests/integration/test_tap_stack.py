import json
import os
import unittest

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        pass

    @mark.it("validates compliance analyzer Lambda function exists")
    def test_compliance_analyzer_lambda_exists(self):
        """Test that Lambda function was deployed"""
        # ARRANGE - Get Lambda function name from outputs
        lambda_name = flat_outputs.get('ComplianceAnalyzerFunction', None)

        # ASSERT
        self.assertIsNotNone(lambda_name, "Lambda function name not found in outputs")
        self.assertTrue(lambda_name.startswith('compliance-analyzer-'),
                       "Lambda function should be named 'compliance-analyzer-*'")

    @mark.it("validates S3 bucket for reports exists")
    def test_s3_reports_bucket_exists(self):
        """Test that S3 reports bucket was deployed"""
        # ARRANGE - Get bucket name from outputs
        bucket_name = flat_outputs.get('ReportsBucket', None)

        # ASSERT
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        self.assertTrue(bucket_name.startswith('compliance-reports-'),
                       "S3 bucket should be named 'compliance-reports-*'")
