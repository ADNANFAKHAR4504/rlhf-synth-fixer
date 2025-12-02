"""
Test suite for S3 Compliance Analysis script.

This test suite verifies that the lib/analyse.py script:
1. Runs successfully
2. Validates infrastructure components
3. Simulates S3 compliance scans
4. Generates compliance reports
5. Returns appropriate exit codes
"""

import subprocess
import os
import sys
import json
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
    assert "S3 Compliance Analysis Infrastructure Demo" in result.stdout, "Should display demo title"


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
    assert "S3 Bucket (compliance reports storage)" in result.stdout, "Should mention S3 bucket"
    assert "Lambda Function (S3 compliance analyzer)" in result.stdout, "Should mention Lambda"
    assert "CloudWatch Alarm (critical compliance violations)" in result.stdout, "Should mention CloudWatch alarm"
    assert "SNS Topic (critical alert notifications)" in result.stdout, "Should mention SNS topic"
    assert "EventBridge Rule (daily scheduled analysis)" in result.stdout, "Should mention EventBridge"


def test_analysis_validates_compliance_features():
    """Test that the script validates all compliance features."""
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

    # Check for compliance features validation
    assert "Compliance Features Validation" in result.stdout, "Should validate features"
    assert "Server-side encryption detection" in result.stdout, "Should check encryption"
    assert "Public access block validation" in result.stdout, "Should check public access"
    assert "Lifecycle policy verification" in result.stdout, "Should check lifecycle policies"
    assert "7-year retention for financial data" in result.stdout, "Should verify retention"
    assert "CloudWatch metrics analysis" in result.stdout, "Should analyze metrics"


def test_analysis_simulates_compliance_scan():
    """Test that the script simulates S3 compliance scanning."""
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
    assert "Simulating S3 Compliance Scan" in result.stdout, "Should simulate scan"
    assert "Analyzing S3 buckets..." in result.stdout, "Should mention bucket analysis"
    assert "Checking server-side encryption" in result.stdout, "Should check encryption"
    assert "Verifying public access block" in result.stdout, "Should verify public access"
    assert "S3 compliance scan completed" in result.stdout, "Should complete scan"


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
    assert "S3 Compliance Analysis Report" in result.stdout, "Should generate report"
    assert "Overall S3 Compliance Score" in result.stdout, "Should show compliance score"
    assert "Total Buckets:" in result.stdout, "Should show total buckets"
    assert "Violations by Severity" in result.stdout, "Should categorize by severity"
    assert "CRITICAL" in result.stdout, "Should show critical violations"
    assert "HIGH" in result.stdout, "Should show high violations"

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
    assert "S3 Compliance Analysis Report" in report_content, "Should have report title"
    assert "Scan ID:" in report_content, "Should have scan ID"
    assert "Overall Compliance Score:" in report_content, "Should have compliance score"
    assert "Violations by Severity:" in report_content, "Should list violations"


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
    assert "✅" in result.stdout, "Should use success indicators"
    assert "📋" in result.stdout or "Analyzing" in result.stdout, "Should have progress indicators"


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
    assert "Overall compliance score:" in result.stdout, "Should show final score"
    assert "violation" in result.stdout.lower(), "Should mention violations"


if __name__ == '__main__':
    # Run all tests
    import pytest
    sys.exit(pytest.main([__file__, '-v']))
