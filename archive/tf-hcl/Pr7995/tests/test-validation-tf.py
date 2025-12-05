"""
Integration Tests for Terraform Infrastructure Validation

This test suite validates the Terraform validation configuration.
Tests verify that validation.tf correctly validates infrastructure compliance.

Coverage target: End-to-end validation logic
"""

import json
import os
import subprocess
import sys

import pytest


class TestTerraformValidation:
    """Integration tests for Terraform validation configuration"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.lib_dir = os.path.join(os.path.dirname(__file__), '..', 'lib')
        cls.terraform_bin = 'terraform'

    def test_terraform_configuration_is_valid(self):
        """Test that Terraform configuration passes validation"""
        result = subprocess.run(
            [self.terraform_bin, 'validate'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0, f"Validation failed: {result.stderr}"
        assert "Success!" in result.stdout

    def test_terraform_plan_succeeds_with_empty_lists(self):
        """Test that plan succeeds when no resources to validate"""
        result = subprocess.run(
            [self.terraform_bin, 'plan', '-input=false'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            timeout=60
        )

        assert result.returncode == 0, f"Plan failed: {result.stderr}"
        assert "Plan:" in result.stdout

    def test_outputs_are_generated(self):
        """Test that Terraform outputs are generated correctly"""
        # Get outputs from applied configuration
        result = subprocess.run(
            [self.terraform_bin, 'output', '-json'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0
        outputs = json.loads(result.stdout)

        # Verify required outputs exist
        assert 'validation_summary' in outputs
        assert 'validation_report_json' in outputs
        assert 'failed_resources' in outputs

    def test_validation_summary_structure(self):
        """Test validation summary output structure"""
        result = subprocess.run(
            [self.terraform_bin, 'output', '-json', 'validation_summary'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0
        output = json.loads(result.stdout)
        summary = output['value'] if 'value' in output else output

        # Verify structure
        assert 'overall_status' in summary
        assert 's3_versioning_pass' in summary
        assert 's3_lifecycle_pass' in summary
        assert 'security_groups_pass' in summary
        assert 'ec2_ami_pass' in summary
        assert 'ec2_tags_pass' in summary

    def test_validation_report_json_structure(self):
        """Test validation report JSON output structure"""
        result = subprocess.run(
            [self.terraform_bin, 'output', '-raw', 'validation_report_json'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0
        report = json.loads(result.stdout)

        # Verify top-level structure
        assert 'timestamp' in report
        assert 'account_id' in report
        assert 'region' in report
        assert 'environment_suffix' in report
        assert 'overall_status' in report
        assert 'validation_results' in report

        # Verify validation results structure
        results = report['validation_results']
        assert 's3_buckets' in results
        assert 'security_groups' in results
        assert 'ec2_instances' in results

        # Verify S3 bucket checks
        assert 'versioning' in results['s3_buckets']
        assert 'lifecycle_policies' in results['s3_buckets']

        # Verify each check has required fields
        for check_name, check_data in results['s3_buckets'].items():
            assert 'status' in check_data
            assert 'details' in check_data
            assert 'failures' in check_data

    def test_failed_resources_output_structure(self):
        """Test failed resources output structure"""
        result = subprocess.run(
            [self.terraform_bin, 'output', '-json', 'failed_resources'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0
        output = json.loads(result.stdout)
        failed = output['value'] if 'value' in output else output

        # Verify structure
        assert 's3_buckets_no_versioning' in failed
        assert 's3_buckets_no_lifecycle' in failed
        assert 'security_groups_unrestricted' in failed
        assert 'ec2_unapproved_amis' in failed
        assert 'ec2_missing_tags' in failed

        # All should be empty lists for test configuration
        assert isinstance(failed['s3_buckets_no_versioning'], list)
        assert isinstance(failed['s3_buckets_no_lifecycle'], list)

    def test_terraform_fmt_passes(self):
        """Test that all Terraform files are properly formatted"""
        result = subprocess.run(
            [self.terraform_bin, 'fmt', '-check', '-recursive'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0, f"Files not formatted: {result.stdout}"

    def test_environment_suffix_is_used(self):
        """Test that environment_suffix is properly used in configuration"""
        result = subprocess.run(
            [self.terraform_bin, 'output', '-raw', 'validation_report_json'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0
        report = json.loads(result.stdout)

        # Verify environment suffix is present and correct
        assert 'environment_suffix' in report
        assert len(report['environment_suffix']) > 0

    def test_validation_passes_with_empty_resource_lists(self):
        """Test that validation passes when no resources are specified"""
        result = subprocess.run(
            [self.terraform_bin, 'output', '-json', 'validation_summary'],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0
        output = json.loads(result.stdout)
        summary = output['value'] if 'value' in output else output

        # All checks should pass when no resources to validate
        assert summary['overall_status'] == 'PASS'
        assert summary['s3_versioning_pass'] == True
        assert summary['s3_lifecycle_pass'] == True
        assert summary['security_groups_pass'] == True
        assert summary['ec2_ami_pass'] == True
        assert summary['ec2_tags_pass'] == True

    def test_terraform_files_exist(self):
        """Test that all required Terraform files exist"""
        required_files = [
            'provider.tf',
            'variables.tf',
            'data.tf',
            'validation.tf',
            'outputs.tf',
            'terraform.tfvars'
        ]

        for filename in required_files:
            filepath = os.path.join(self.lib_dir, filename)
            assert os.path.exists(filepath), f"Missing required file: {filename}"

    def test_readme_exists(self):
        """Test that README documentation exists"""
        readme_path = os.path.join(self.lib_dir, 'README.md')
        assert os.path.exists(readme_path)

        with open(readme_path, 'r') as f:
            content = f.read()
            assert len(content) > 100  # Should have substantial content
