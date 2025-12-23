#!/usr/bin/env python3
"""
Integration tests for analyse.py script against Moto server
Tests the actual analysis script execution with mocked AWS services
"""

import pytest
import os
import sys
import subprocess
import json

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))


class TestAnalysisExecution:
    """Test actual execution of analyse.py against Moto server"""

    def test_analysis_script_executes(self):
        """Test that analyse.py runs successfully"""
        # Set environment variables
        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = 'test'
        env['AWS_REGION'] = 'us-east-1'
        env['AWS_ACCESS_KEY_ID'] = 'testing'
        env['AWS_SECRET_ACCESS_KEY'] = 'testing'
        env['AWS_ENDPOINT_URL'] = os.environ.get('AWS_ENDPOINT_URL', 'http://127.0.0.1:5001')

        # Run the analysis script
        result = subprocess.run(
            [sys.executable, 'lib/analyse.py'],
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )

        # The script should run without crashing
        # It may return exit code 1 or 2 due to low compliance score with empty AWS
        assert result.returncode in [0, 1, 2], f"Unexpected exit code: {result.returncode}"

        # Check that the script produced output
        assert len(result.stdout) > 0, "No output from analysis script"
        assert "Infrastructure Analysis Report" in result.stdout or "[INFO]" in result.stdout

    def test_analysis_with_json_export(self, tmp_path):
        """Test analysis with JSON report export"""
        output_file = tmp_path / "analysis-report.json"

        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = 'test'
        env['AWS_REGION'] = 'us-east-1'
        env['AWS_ACCESS_KEY_ID'] = 'testing'
        env['AWS_SECRET_ACCESS_KEY'] = 'testing'
        env['AWS_ENDPOINT_URL'] = os.environ.get('AWS_ENDPOINT_URL', 'http://127.0.0.1:5001')
        env['OUTPUT_FILE'] = str(output_file)

        result = subprocess.run(
            [sys.executable, 'lib/analyse.py'],
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )

        # Check script executed
        assert result.returncode in [0, 1, 2]

        # Check JSON file was created
        assert output_file.exists(), "JSON report file was not created"

        # Validate JSON structure
        with open(output_file, 'r') as f:
            report = json.load(f)
            assert 'compliance_score' in report
            assert 'log_groups' in report
            assert 'alarms' in report
            assert 'recommendations' in report

    def test_analysis_compliance_scoring(self):
        """Test that compliance scoring works"""
        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = 'test'
        env['AWS_REGION'] = 'us-east-1'
        env['AWS_ACCESS_KEY_ID'] = 'testing'
        env['AWS_SECRET_ACCESS_KEY'] = 'testing'
        env['AWS_ENDPOINT_URL'] = os.environ.get('AWS_ENDPOINT_URL', 'http://127.0.0.1:5001')

        result = subprocess.run(
            [sys.executable, 'lib/analyse.py'],
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )

        # With empty Moto server, compliance should be low
        # Exit code 2 indicates non-compliant (< 50%)
        # Exit code 1 indicates warnings (50-79%)
        # Exit code 0 indicates compliant (>= 80%)
        assert result.returncode in [1, 2], "Expected non-compliant score with empty AWS"
        assert "Compliance Score:" in result.stdout
