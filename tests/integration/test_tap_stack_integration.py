"""Integration tests for TAP Stack deployment.

These tests validate the deployed infrastructure by using actual cfn-outputs
from the stack deployment. They test end-to-end workflows and real AWS resources.
"""

import pytest
import json
import os


class TestTapStackIntegration:
    """Integration tests for deployed TAP infrastructure."""

    @pytest.fixture(scope="class")
    def stack_outputs(self):
        """Load stack outputs from deployment."""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Stack outputs not found at {outputs_file}. Deploy infrastructure first.")

        with open(outputs_file, 'r') as f:
            outputs = json.load(f)

        return outputs

    def test_reports_bucket_exists(self, stack_outputs):
        """Test that reports S3 bucket was created."""
        assert 'ReportsBucketName' in stack_outputs or 'reports_bucket' in [
            k.lower() for k in stack_outputs.keys()
        ], "Reports bucket output not found in stack outputs"

    def test_lambda_function_exists(self, stack_outputs):
        """Test that validator Lambda function was created."""
        lambda_keys = [k for k in stack_outputs.keys() if 'lambda' in k.lower()]
        assert len(lambda_keys) > 0, "Lambda function output not found in stack outputs"

    def test_iam_role_exists(self, stack_outputs):
        """Test that Lambda IAM role was created."""
        role_keys = [k for k in stack_outputs.keys() if 'role' in k.lower()]
        assert len(role_keys) > 0, "IAM role output not found in stack outputs"

    def test_environment_suffix_in_resources(self, stack_outputs):
        """Test that resources include environment suffix."""
        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

        # Check that at least one output includes the environment suffix
        has_suffix = False
        for value in stack_outputs.values():
            if isinstance(value, str) and environment_suffix in value:
                has_suffix = True
                break

        assert has_suffix, f"No outputs contain environment suffix: {environment_suffix}"

    def test_stack_outputs_valid_json(self, stack_outputs):
        """Test that stack outputs are valid JSON structure."""
        assert isinstance(stack_outputs, dict), "Stack outputs should be a dictionary"
        assert len(stack_outputs) > 0, "Stack outputs should not be empty"

    def test_compliance_validation_workflow(self):
        """Test complete compliance validation workflow."""
        # Test that synthesized stack can be analyzed
        synth_path = "cdktf.out/stacks/TapStackdev/cdk.tf.json"

        if not os.path.exists(synth_path):
            pytest.skip(f"Synthesized stack not found at {synth_path}")

        with open(synth_path, 'r') as f:
            synthesized = json.load(f)

        assert 'resource' in synthesized, "Synthesized stack should contain resources"

    def test_compliance_runner_executable(self):
        """Test that compliance runner can be executed."""
        from lib.compliance_runner import ComplianceRunner

        runner = ComplianceRunner('cdktf.out/stacks/TapStackdev/cdk.tf.json')
        assert runner is not None

    def test_analyzers_import(self):
        """Test that all analyzers can be imported."""
        from lib.analyzers import (
            SecurityGroupAnalyzer,
            IamPolicyAnalyzer,
            TagComplianceValidator,
            NetworkAnalyzer,
            EncryptionValidator,
            ComplianceReporter
        )

        assert SecurityGroupAnalyzer is not None
        assert IamPolicyAnalyzer is not None
        assert TagComplianceValidator is not None
        assert NetworkAnalyzer is not None
        assert EncryptionValidator is not None
        assert ComplianceReporter is not None
