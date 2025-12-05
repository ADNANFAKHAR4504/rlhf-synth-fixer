#!/usr/bin/env python3
"""
Analysis tests for monitoring infrastructure validation.

This test file runs lib/analyse.sh to validate deployed monitoring infrastructure.
"""

import subprocess
import os
import pytest


class TestMonitoringAnalysis:
    """Test suite for monitoring infrastructure analysis."""

    def test_analysis_script_exists(self):
        """Verify that the analysis script exists and is executable."""
        script_path = os.path.join(os.getcwd(), "lib", "analyse.sh")
        assert os.path.exists(script_path), f"Analysis script not found at {script_path}"
        assert os.access(script_path, os.X_OK), f"Analysis script is not executable: {script_path}"

    def test_monitoring_infrastructure_analysis(self):
        """
        Run the monitoring infrastructure analysis script.

        This script validates:
        - KMS key configuration
        - CloudWatch log groups
        - SNS FIFO topic
        - Lambda function (ARM64)
        - CloudWatch dashboard
        """
        script_path = os.path.join(os.getcwd(), "lib", "analyse.sh")

        # Run the analysis script
        result = subprocess.run(
            ["bash", script_path],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )

        # Print output for debugging
        print("\n=== Analysis Script Output ===")
        print(result.stdout)
        if result.stderr:
            print("\n=== Analysis Script Errors ===")
            print(result.stderr)

        # The script exits with 0 if:
        # 1. No stack found (expected in CI before deployment) - gracefully handles this
        # 2. All validations pass
        # Both cases are acceptable
        assert result.returncode == 0, (
            f"Analysis script failed with exit code {result.returncode}\n"
            f"stdout: {result.stdout}\n"
            f"stderr: {result.stderr}"
        )

        # Verify expected output patterns
        assert "Monitoring Infrastructure Analysis" in result.stdout, (
            "Analysis script did not produce expected output"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
