"""
Test suite for Infrastructure Compliance Analysis script.

This test suite verifies that the lib/analyse.py script:
1. Runs successfully
2. Validates infrastructure components
3. Simulates compliance scans
4. Generates compliance reports
5. Returns appropriate exit codes
"""

import subprocess
import os
import sys
from pathlib import Path


def test_analysis_script_exists():
    """Verify that the analysis script exists and is executable."""
    script_path = Path("lib/analyse.py")
    assert script_path.exists(), "lib/analyse.py should exist"
    assert os.access(script_path, os.X_OK), "lib/analyse.py should be executable"


def test_analysis_script_runs_successfully():
    """Test that the analysis script runs without errors."""
    # Set required environment variables
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test-analysis'
    })

    # Run the script
    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Verify it ran successfully
    assert result.returncode == 0, f"Script should exit with 0, got {result.returncode}\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
    assert "Infrastructure Compliance Analysis Demo" in result.stdout, "Should display demo title"


def test_analysis_validates_infrastructure():
    """Test that the script validates all required infrastructure components."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for infrastructure validation
    assert "Infrastructure Validation" in result.stdout, "Should validate infrastructure"
    assert "S3 Bucket" in result.stdout, "Should mention S3 bucket"
    assert "Lambda Function" in result.stdout, "Should mention Lambda"
    assert "IAM Role" in result.stdout, "Should mention IAM Role"
    assert "CloudWatch Log Group" in result.stdout, "Should mention CloudWatch logs"


def test_analysis_validates_ec2_features():
    """Test that the script validates EC2 compliance features."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for EC2 features validation
    assert "EC2 Instance Analysis" in result.stdout, "Should validate EC2 features"
    assert "unencrypted EBS volumes" in result.stdout, "Should check encryption"
    assert "Environment, Owner, CostCenter" in result.stdout, "Should verify required tags"


def test_analysis_validates_security_group_features():
    """Test that the script validates security group compliance features."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for security group features validation
    assert "Security Group Analysis" in result.stdout, "Should validate security group features"
    assert "overly permissive" in result.stdout, "Should check permissive rules"
    assert "80 and 443" in result.stdout, "Should mention allowed ports"


def test_analysis_validates_iam_features():
    """Test that the script validates IAM compliance features."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for IAM features validation
    assert "IAM Role Compliance" in result.stdout, "Should validate IAM features"
    assert "policy attached" in result.stdout, "Should verify policy attachment"
    assert "AdministratorAccess" in result.stdout or "overly broad" in result.stdout, "Should check broad permissions"


def test_analysis_validates_vpc_features():
    """Test that the script validates VPC flow log features."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for VPC features validation
    assert "VPC Flow Logs" in result.stdout, "Should validate VPC features"
    assert "CloudWatch logging" in result.stdout or "flow log" in result.stdout.lower(), "Should check flow logs"


def test_analysis_validates_cloudwatch_metrics():
    """Test that the script validates CloudWatch metrics features."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for CloudWatch metrics validation
    assert "CloudWatch Metrics" in result.stdout, "Should validate CloudWatch metrics"
    assert "ComplianceScanner" in result.stdout, "Should mention namespace"
    assert "UnencryptedVolumes" in result.stdout, "Should mention unencrypted volumes metric"


def test_analysis_simulates_compliance_scan():
    """Test that the script simulates compliance scanning."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for compliance scan simulation
    assert "Simulating Infrastructure Compliance Scan" in result.stdout, "Should simulate scan"
    assert "Analyzing infrastructure" in result.stdout, "Should mention infrastructure analysis"
    assert "compliance scan completed" in result.stdout, "Should complete scan"


def test_analysis_generates_report():
    """Test that the script generates a compliance report."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for report generation
    assert "Infrastructure Compliance Analysis Report" in result.stdout, "Should generate report"
    assert "Scan ID:" in result.stdout, "Should show scan ID"
    assert "Total Violations:" in result.stdout, "Should show total violations"
    assert "Violations by Category" in result.stdout, "Should categorize violations"

    # Check that report file was created
    report_path = Path("lib/analysis-results.txt")
    assert report_path.exists(), "Should create analysis-results.txt"


def test_analysis_report_file_content():
    """Test that the generated report file contains expected content."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test-report'
    })

    # Run the script
    subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Read and verify report file
    report_path = Path("lib/analysis-results.txt")
    assert report_path.exists(), "Report file should exist"

    report_content = report_path.read_text()
    assert "Infrastructure Compliance Analysis Report" in report_content, "Should have report title"
    assert "Scan ID:" in report_content, "Should have scan ID"
    assert "Total Violations:" in report_content, "Should have total violations"
    assert "Unencrypted Volumes:" in report_content, "Should list unencrypted volumes"
    assert "Permissive Security Groups:" in report_content, "Should list security group violations"


def test_analysis_shows_violation_categories():
    """Test that the script shows all violation categories."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for all violation categories
    assert "Unencrypted Volumes" in result.stdout, "Should show unencrypted volumes"
    assert "Permissive Security Groups" in result.stdout, "Should show permissive security groups"
    assert "Missing" in result.stdout and "Tags" in result.stdout, "Should show missing tags"
    assert "IAM Violations" in result.stdout, "Should show IAM violations"
    assert "Flow Logs" in result.stdout, "Should show flow logs violations"


def test_analysis_shows_violation_details():
    """Test that the script shows detailed violation information."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for detailed violation information
    assert "Instance:" in result.stdout or "instanceId" in result.stdout.lower(), "Should show instance details"
    assert "SG:" in result.stdout or "securityGroupId" in result.stdout.lower(), "Should show security group details"
    assert "Role:" in result.stdout or "roleName" in result.stdout.lower(), "Should show role details"
    assert "VPC:" in result.stdout or "vpcId" in result.stdout.lower(), "Should show VPC details"


def test_analysis_with_missing_env_vars():
    """Test that script handles missing environment variables gracefully."""
    # Run with minimal environment
    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env={'PATH': os.environ.get('PATH', '')},
        capture_output=True,
        text=True
    )

    # Script should still run (uses defaults)
    assert result.returncode == 0, "Should handle missing env vars gracefully"


def test_analysis_output_format():
    """Test that the script output follows expected format."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check output formatting
    assert "===" in result.stdout, "Should use section separators"
    assert "[OK]" in result.stdout, "Should use success indicators"
    assert "[SCAN]" in result.stdout or "Analyzing" in result.stdout, "Should have progress indicators"


def test_analysis_completion_message():
    """Test that script shows completion status."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for completion message
    assert "Analysis Complete" in result.stdout, "Should show analysis complete"
    assert "violation" in result.stdout.lower(), "Should mention violations"


def test_analysis_environment_suffix_used():
    """Test that environment suffix is used in the scan results."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'custom-env'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check that environment suffix is displayed
    assert "custom-env" in result.stdout, "Should display environment suffix"


def test_analysis_region_used():
    """Test that AWS region is used in the scan results."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-west-2',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check that region is displayed
    assert "us-west-2" in result.stdout, "Should display AWS region"


def test_analysis_required_tags_mentioned():
    """Test that required tags are mentioned in the output."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check that required tags are mentioned
    assert "Environment" in result.stdout, "Should mention Environment tag"
    assert "Owner" in result.stdout, "Should mention Owner tag"
    assert "CostCenter" in result.stdout, "Should mention CostCenter tag"


def test_analysis_allowed_ports_mentioned():
    """Test that allowed public ports are mentioned in the output."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check that allowed ports are mentioned
    assert "80" in result.stdout and "443" in result.stdout, "Should mention ports 80 and 443"


def test_analysis_severity_levels():
    """Test that severity levels are shown in the output."""
    env = os.environ.copy()
    env.update({
        'AWS_REGION': 'us-east-1',
        'AWS_ACCESS_KEY_ID': 'test',
        'AWS_SECRET_ACCESS_KEY': 'test',
        'ENVIRONMENT_SUFFIX': 'test'
    })

    result = subprocess.run(
        ['python3', 'lib/analyse.py'],
        env=env,
        capture_output=True,
        text=True
    )

    # Check for severity levels
    assert "CRITICAL" in result.stdout, "Should show CRITICAL severity"
    assert "HIGH" in result.stdout, "Should show HIGH severity"
    assert "MEDIUM" in result.stdout, "Should show MEDIUM severity"


if __name__ == '__main__':
    # Run all tests
    import pytest
    sys.exit(pytest.main([__file__, '-v']))
