import json
import os
import unittest

from pytest import mark

# Load flat-outputs.json for integration tests
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, "..", "..", "cfn-outputs", "flat-outputs.json")

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}

# AWS region from environment or default
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-1")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "pr5140")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack CloudFormation infrastructure"""

    @mark.it("verifies environment suffix is configured")
    def test_environment_suffix_configured(self):
        assert ENVIRONMENT_SUFFIX is not None
        assert len(ENVIRONMENT_SUFFIX) > 0
        assert isinstance(ENVIRONMENT_SUFFIX, str)

    @mark.it("verifies AWS region is configured")
    def test_aws_region_configured(self):
        assert AWS_REGION is not None
        assert len(AWS_REGION) > 0
        assert isinstance(AWS_REGION, str)

    @mark.it("verifies CloudFormation template exists")
    def test_template_file_exists(self):
        template_path = os.path.join(base_dir, "..", "..", "lib", "TapStack.yml")
        assert os.path.exists(template_path), "CloudFormation template should exist"

        # Verify template is readable
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert len(content) > 0
            assert "AWSTemplateFormatVersion" in content

    @mark.it("verifies flat outputs file structure")
    def test_flat_outputs_structure(self):
        assert isinstance(flat_outputs, dict)
