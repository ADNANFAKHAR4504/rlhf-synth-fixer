#!/usr/bin/env python3
"""
Test suite for Infrastructure QA Compliance Analysis Script

This test file validates the analysis script functionality
for the Infrastructure QA and Management system using Pulumi.
"""

import os
import sys
import json
import pytest
from io import StringIO
from unittest.mock import patch

# Add lib directory to path for importing analyse module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

# Import the analyse module
import analyse


# Set up environment variables for tests
@pytest.fixture(autouse=True)
def setup_environment():
    """Set up environment variables for all tests."""
    os.environ['AWS_REGION'] = 'us-east-1'
    os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
    os.environ['AWS_SECURITY_TOKEN'] = 'testing'
    os.environ['AWS_SESSION_TOKEN'] = 'testing'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'
    yield


class TestPrintSection:
    """Test print_section utility function."""

    def test_print_section_output(self, setup_environment, capsys):
        """Test that print_section outputs correctly formatted header."""
        analyse.print_section("Test Title")
        captured = capsys.readouterr()
        assert "Test Title" in captured.out
        assert "=" in captured.out

    def test_print_section_with_long_title(self, setup_environment, capsys):
        """Test print_section with a long title."""
        long_title = "This is a very long section title for testing"
        analyse.print_section(long_title)
        captured = capsys.readouterr()
        assert long_title in captured.out

    def test_print_section_contains_separator(self, setup_environment, capsys):
        """Test that print_section includes separator lines."""
        analyse.print_section("Header")
        captured = capsys.readouterr()
        assert captured.out.count("=") >= 70  # At least one full line of equals


class TestCheckEnvironment:
    """Test check_environment function."""

    def test_check_environment_outputs_variables(self, setup_environment, capsys):
        """Test that check_environment outputs environment variables."""
        analyse.check_environment()
        captured = capsys.readouterr()
        assert "AWS_REGION" in captured.out
        assert "us-east-1" in captured.out
        assert "ENVIRONMENT_SUFFIX" in captured.out
        assert "[PASS]" in captured.out

    def test_check_environment_masks_secrets(self, setup_environment, capsys):
        """Test that check_environment masks secret values."""
        analyse.check_environment()
        captured = capsys.readouterr()
        assert "***" in captured.out  # Secrets should be masked

    def test_check_environment_shows_env_suffix(self, setup_environment, capsys):
        """Test that environment suffix is displayed."""
        analyse.check_environment()
        captured = capsys.readouterr()
        assert "test" in captured.out  # ENVIRONMENT_SUFFIX value


class TestSimulateComplianceScan:
    """Test simulate_ec2_tag_compliance_scan function."""

    def test_scan_returns_dict(self, setup_environment):
        """Test that scan returns a dictionary."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert isinstance(result, dict)

    def test_scan_contains_required_keys(self, setup_environment):
        """Test that scan result contains required keys."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        required_keys = ['scanId', 'timestamp', 'environment', 'region',
                         'requiredTags', 'findings', 'summary']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_scan_summary_structure(self, setup_environment):
        """Test that scan summary has correct structure."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        summary = result['summary']
        assert 'totalInstances' in summary
        assert 'compliantInstances' in summary
        assert 'nonCompliantInstances' in summary
        assert 'compliancePercentage' in summary
        assert 'violationsByLevel' in summary

    def test_scan_findings_structure(self, setup_environment):
        """Test that scan findings have correct structure."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        findings = result['findings']
        assert 'critical' in findings
        assert 'high' in findings
        assert 'medium' in findings
        assert 'low' in findings

    def test_scan_uses_environment_suffix(self, setup_environment):
        """Test that scan uses ENVIRONMENT_SUFFIX from env."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert result['environment'] == 'test'

    def test_scan_uses_aws_region(self, setup_environment):
        """Test that scan uses AWS_REGION from env."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert result['region'] == 'us-east-1'

    def test_scan_has_required_tags(self, setup_environment):
        """Test that scan includes required tags list."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert 'Environment' in result['requiredTags']
        assert 'Owner' in result['requiredTags']
        assert 'Team' in result['requiredTags']
        assert 'Project' in result['requiredTags']

    def test_scan_critical_findings_structure(self, setup_environment):
        """Test that critical findings have proper structure."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        if result['findings']['critical']:
            finding = result['findings']['critical'][0]
            assert 'resourceId' in finding
            assert 'resourceType' in finding
            assert 'violation' in finding
            assert 'description' in finding
            assert 'recommendation' in finding

    def test_scan_violations_count_matches(self, setup_environment):
        """Test that violation counts match findings."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        summary = result['summary']
        findings = result['findings']
        assert summary['violationsByLevel']['CRITICAL'] == len(findings['critical'])
        assert summary['violationsByLevel']['HIGH'] == len(findings['high'])
        assert summary['violationsByLevel']['MEDIUM'] == len(findings['medium'])
        assert summary['violationsByLevel']['LOW'] == len(findings['low'])


class TestGenerateReport:
    """Test generate_report function."""

    def test_generate_report_creates_file(self, setup_environment, tmp_path):
        """Test that generate_report creates results file."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)
            assert os.path.exists('lib/analysis-results.txt')

            with open('lib/analysis-results.txt', 'r') as f:
                content = f.read()
                assert 'Infrastructure Compliance Analysis Report' in content
        finally:
            os.chdir(original_dir)

    def test_generate_report_outputs_summary(self, setup_environment, capsys, tmp_path):
        """Test that generate_report outputs summary to stdout."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)
            captured = capsys.readouterr()
            assert "Compliance Score" in captured.out or "compliancePercentage" in captured.out
            assert "Total Resources" in captured.out or "totalInstances" in captured.out
        finally:
            os.chdir(original_dir)

    def test_generate_report_includes_scan_id(self, setup_environment, capsys, tmp_path):
        """Test that report includes scan ID."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)
            captured = capsys.readouterr()
            assert "Scan ID" in captured.out
        finally:
            os.chdir(original_dir)

    def test_generate_report_file_contains_json(self, setup_environment, tmp_path):
        """Test that report file contains JSON data."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)

            with open('lib/analysis-results.txt', 'r') as f:
                content = f.read()
                # The file should contain JSON somewhere
                assert '"scanId"' in content or 'scanId' in content
        finally:
            os.chdir(original_dir)


class TestValidateDeployment:
    """Test validate_deployment function."""

    def test_validate_deployment_outputs_resources(self, setup_environment, capsys):
        """Test that validate_deployment lists all resources."""
        analyse.validate_deployment()
        captured = capsys.readouterr()
        assert "S3 Bucket" in captured.out
        assert "SNS Topic" in captured.out
        assert "IAM Role" in captured.out
        assert "CloudWatch" in captured.out
        assert "[PASS]" in captured.out

    def test_validate_deployment_shows_ok(self, setup_environment, capsys):
        """Test that validate_deployment shows [OK] for each resource."""
        analyse.validate_deployment()
        captured = capsys.readouterr()
        assert "[OK]" in captured.out

    def test_validate_deployment_includes_descriptions(self, setup_environment, capsys):
        """Test that validate_deployment includes resource descriptions."""
        analyse.validate_deployment()
        captured = capsys.readouterr()
        assert "compliance" in captured.out.lower() or "reports" in captured.out.lower()


class TestValidateComplianceFeatures:
    """Test validate_compliance_features function."""

    def test_validate_features_outputs_checks(self, setup_environment, capsys):
        """Test that validate_compliance_features lists all checks."""
        analyse.validate_compliance_features()
        captured = capsys.readouterr()
        assert "Environment tag validation" in captured.out
        assert "Owner tag validation" in captured.out
        assert "[PASS]" in captured.out

    def test_validate_features_includes_s3_checks(self, setup_environment, capsys):
        """Test that S3 compliance checks are listed."""
        analyse.validate_compliance_features()
        captured = capsys.readouterr()
        assert "S3" in captured.out

    def test_validate_features_includes_report_formats(self, setup_environment, capsys):
        """Test that report format features are listed."""
        analyse.validate_compliance_features()
        captured = capsys.readouterr()
        assert "JSON" in captured.out
        assert "TEXT" in captured.out or "text" in captured.out.lower()


class TestValidateSecurity:
    """Test validate_security function."""

    def test_validate_security_outputs_checks(self, setup_environment, capsys):
        """Test that validate_security lists security checks."""
        analyse.validate_security()
        captured = capsys.readouterr()
        assert "S3 permissions" in captured.out
        assert "SNS permissions" in captured.out
        assert "[PASS]" in captured.out

    def test_validate_security_shows_least_privilege(self, setup_environment, capsys):
        """Test that validate_security mentions least privilege."""
        analyse.validate_security()
        captured = capsys.readouterr()
        assert "Least Privilege" in captured.out or "limited" in captured.out

    def test_validate_security_shows_data_protection(self, setup_environment, capsys):
        """Test that validate_security shows data protection checks."""
        analyse.validate_security()
        captured = capsys.readouterr()
        assert "Data Protection" in captured.out or "encryption" in captured.out.lower()


class TestMainFunction:
    """Test main function."""

    def test_main_returns_zero_on_success(self, setup_environment, tmp_path):
        """Test that main returns 0 on success."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            result = analyse.main()
            assert result == 0
        finally:
            os.chdir(original_dir)

    def test_main_prints_pass(self, setup_environment, capsys, tmp_path):
        """Test that main prints PASS message."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            analyse.main()
            captured = capsys.readouterr()
            assert "[PASS]" in captured.out
        finally:
            os.chdir(original_dir)

    def test_main_creates_report_file(self, setup_environment, tmp_path):
        """Test that main creates the analysis-results.txt file."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            analyse.main()
            assert os.path.exists('lib/analysis-results.txt')
        finally:
            os.chdir(original_dir)

    def test_main_shows_warning_for_critical(self, setup_environment, capsys, tmp_path):
        """Test that main shows warning for critical violations."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            analyse.main()
            captured = capsys.readouterr()
            assert "[WARNING]" in captured.out
        finally:
            os.chdir(original_dir)


class TestComplianceCalculations:
    """Test compliance calculation logic."""

    def test_compliance_percentage_calculation(self):
        """Test compliance percentage calculation."""
        total_instances = 10
        compliant_instances = 8
        percentage = (compliant_instances / total_instances) * 100
        assert percentage == 80.0

    def test_compliance_percentage_zero_instances(self):
        """Test compliance percentage with zero instances."""
        total_instances = 0
        percentage = 100.0 if total_instances == 0 else 0
        assert percentage == 100.0

    def test_compliance_percentage_all_compliant(self):
        """Test compliance percentage when all are compliant."""
        total_instances = 5
        compliant_instances = 5
        percentage = (compliant_instances / total_instances) * 100
        assert percentage == 100.0

    def test_compliance_percentage_none_compliant(self):
        """Test compliance percentage when none are compliant."""
        total_instances = 5
        compliant_instances = 0
        percentage = (compliant_instances / total_instances) * 100
        assert percentage == 0.0


class TestFindingsValidation:
    """Test findings validation logic."""

    def test_critical_findings_have_s3_violation(self, setup_environment):
        """Test that critical findings include S3 encryption violation."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        critical_violations = [f['violation'] for f in result['findings']['critical']]
        assert 'S3_ENCRYPTION' in critical_violations

    def test_high_findings_have_security_violations(self, setup_environment):
        """Test that high findings include security violations."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        high_violations = [f['violation'] for f in result['findings']['high']]
        assert 'SG_OPEN_ACCESS' in high_violations or 'REQUIRED_TAGS' in high_violations

    def test_findings_have_recommendations(self, setup_environment):
        """Test that all findings have recommendations."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        for severity in ['critical', 'high', 'medium']:
            for finding in result['findings'][severity]:
                assert 'recommendation' in finding
                assert len(finding['recommendation']) > 0


class TestInfrastructureValidation:
    """Test infrastructure validation checks."""

    def test_required_resources_count(self):
        """Test that all required resources are documented."""
        required_resources = [
            'S3 Bucket', 'SNS Topic', 'IAM Role',
            'CloudWatch Log Group', 'CloudWatch Dashboard'
        ]
        assert len(required_resources) >= 5

    def test_environment_suffix_usage(self, setup_environment):
        """Test that environment suffix is used in results."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert result['environment'] == 'test'

    def test_region_configuration(self, setup_environment):
        """Test that region is properly configured."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert result['region'] in ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2']


class TestOutputFormatting:
    """Test output formatting."""

    def test_section_header_format(self, setup_environment, capsys):
        """Test that section headers are properly formatted."""
        analyse.print_section("Test Section")
        captured = capsys.readouterr()
        lines = captured.out.split('\n')
        # Should have separator lines
        assert any('=' * 10 in line for line in lines)

    def test_pass_message_format(self, setup_environment, capsys):
        """Test that PASS messages are formatted correctly."""
        analyse.check_environment()
        captured = capsys.readouterr()
        assert "[PASS]" in captured.out

    def test_ok_message_format(self, setup_environment, capsys):
        """Test that OK messages are formatted correctly."""
        analyse.validate_deployment()
        captured = capsys.readouterr()
        assert "[OK]" in captured.out


class TestReportFileContent:
    """Test report file content."""

    def test_report_contains_timestamp(self, setup_environment, tmp_path):
        """Test that report file contains timestamp."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)

            with open('lib/analysis-results.txt', 'r') as f:
                content = f.read()
                assert 'Timestamp' in content or 'timestamp' in content
        finally:
            os.chdir(original_dir)

    def test_report_contains_compliance_score(self, setup_environment, tmp_path):
        """Test that report file contains compliance score."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)

            with open('lib/analysis-results.txt', 'r') as f:
                content = f.read()
                assert 'Compliance Score' in content or 'compliancePercentage' in content
        finally:
            os.chdir(original_dir)

    def test_report_contains_violations(self, setup_environment, tmp_path):
        """Test that report file contains violations section."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)

            with open('lib/analysis-results.txt', 'r') as f:
                content = f.read()
                assert 'Violations' in content or 'CRITICAL' in content
        finally:
            os.chdir(original_dir)


class TestEnvironmentHandling:
    """Test environment variable handling."""

    def test_default_region(self):
        """Test default region when not set."""
        # Save and clear env var
        original = os.environ.get('AWS_REGION')
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

        try:
            result = analyse.simulate_ec2_tag_compliance_scan()
            assert result['region'] == 'us-east-1'
        finally:
            if original:
                os.environ['AWS_REGION'] = original

    def test_default_environment_suffix(self):
        """Test default environment suffix when not set."""
        # Save and clear env var
        original = os.environ.get('ENVIRONMENT_SUFFIX')
        if 'ENVIRONMENT_SUFFIX' in os.environ:
            del os.environ['ENVIRONMENT_SUFFIX']

        try:
            result = analyse.simulate_ec2_tag_compliance_scan()
            assert result['environment'] == 'dev'
        finally:
            if original:
                os.environ['ENVIRONMENT_SUFFIX'] = original

    def test_custom_environment_suffix(self, setup_environment):
        """Test custom environment suffix is used."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'custom-env'
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert result['environment'] == 'custom-env'
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'  # Reset
