"""
Test suite for AWS Infrastructure Compliance Analyzer

This test file validates the compliance analysis functionality
including resource scanning, violation detection, and reporting.
"""

import pytest
import sys
import os

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))


class TestComplianceAnalyzer:
    """Test compliance analyzer functionality."""

    def test_environment_variables_set(self):
        """Verify required environment variables are configured."""
        required_vars = [
            'AWS_REGION',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY'
        ]

        for var in required_vars:
            assert os.environ.get(var) is not None, f"Environment variable {var} must be set"

    def test_analysis_script_exists(self):
        """Verify analysis script exists and is readable."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        assert os.path.exists(script_path), "analyse.py script must exist"
        assert os.access(script_path, os.R_OK), "analyse.py must be readable"

    def test_compliance_scan_simulation(self):
        """Test compliance scan simulation logic."""
        from analyse import simulate_compliance_scan

        # Run scan simulation
        results = simulate_compliance_scan()

        # Verify structure
        assert 'scanId' in results
        assert 'timestamp' in results
        assert 'findings' in results
        assert 'summary' in results

        # Verify findings for each service
        expected_services = ['ec2', 'securityGroups', 's3', 'iam', 'ebs', 'vpc']
        for service in expected_services:
            assert service in results['findings'], f"Missing findings for {service}"
            assert 'total' in results['findings'][service]
            assert 'compliant' in results['findings'][service]
            assert 'violations' in results['findings'][service]

        # Verify summary
        summary = results['summary']
        assert summary['totalResources'] > 0
        assert 0 <= summary['complianceScore'] <= 100
        assert summary['totalViolations'] >= 0

    def test_compliance_score_calculation(self):
        """Test compliance score is calculated correctly."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()
        summary = results['summary']

        # Compliance score should be percentage of compliant resources
        expected_score = (summary['compliantResources'] / summary['totalResources']) * 100
        assert abs(summary['complianceScore'] - expected_score) < 0.1

    def test_service_scores_present(self):
        """Test individual service scores are calculated."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()
        service_scores = results['summary']['serviceScores']

        expected_services = ['ec2', 'securityGroups', 's3', 'iam', 'ebs', 'vpc']
        for service in expected_services:
            assert service in service_scores, f"Missing service score for {service}"
            assert 0 <= service_scores[service] <= 100, f"Invalid score for {service}"

    def test_violation_details(self):
        """Test violation details are included."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()

        # Check that violations have descriptive issues
        for service, data in results['findings'].items():
            if data['violations'] > 0:
                assert 'issues' in data, f"Missing issues for {service}"
                assert len(data['issues']) == data['violations'], \
                    f"Issue count mismatch for {service}"
                # Each issue should be a non-empty string
                for issue in data['issues']:
                    assert isinstance(issue, str) and len(issue) > 0

    def test_report_generation(self):
        """Test compliance report generation."""
        from analyse import simulate_compliance_scan, generate_report
        import tempfile
        import shutil

        # Use temporary directory
        temp_dir = tempfile.mkdtemp()
        original_dir = os.getcwd()

        try:
            os.chdir(temp_dir)
            os.makedirs('lib', exist_ok=True)

            results = simulate_compliance_scan()
            generate_report(results)

            report_path = os.path.join('lib', 'analysis-results.txt')
            assert os.path.exists(report_path), "Report file should be created"

            # Verify report content
            with open(report_path, 'r') as f:
                content = f.read()
                assert 'Compliance Analysis Report' in content
                assert 'Scan ID' in content
                assert 'Compliance Score' in content

        finally:
            os.chdir(original_dir)
            shutil.rmtree(temp_dir, ignore_errors=True)

    def test_check_environment_function(self):
        """Test environment check function."""
        from analyse import check_environment

        # Should not raise any exceptions
        try:
            check_environment()
        except Exception as e:
            pytest.fail(f"check_environment() raised unexpected exception: {e}")

    def test_validate_deployment_function(self):
        """Test deployment validation function."""
        from analyse import validate_deployment

        # Should not raise any exceptions
        try:
            validate_deployment()
        except Exception as e:
            pytest.fail(f"validate_deployment() raised unexpected exception: {e}")

    def test_main_execution_success(self):
        """Test main function executes successfully."""
        from analyse import main
        import tempfile
        import shutil

        # Use temporary directory
        temp_dir = tempfile.mkdtemp()
        original_dir = os.getcwd()

        try:
            os.chdir(temp_dir)
            os.makedirs('lib', exist_ok=True)

            # Run main function
            exit_code = main()

            # Should return 0 for success
            assert exit_code == 0, "Main function should return success"

            # Report should be generated
            report_path = os.path.join('lib', 'analysis-results.txt')
            assert os.path.exists(report_path), "Report should be generated by main()"

        finally:
            os.chdir(original_dir)
            shutil.rmtree(temp_dir, ignore_errors=True)


class TestComplianceFindings:
    """Test compliance findings validation."""

    def test_ec2_violations_detected(self):
        """Test EC2 compliance violations are detected."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()
        ec2_findings = results['findings']['ec2']

        assert ec2_findings['violations'] > 0, "Should detect EC2 violations"
        assert any('tag' in issue.lower() for issue in ec2_findings['issues']), \
            "Should include tag-related violations"

    def test_security_group_violations_detected(self):
        """Test security group violations are detected."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()
        sg_findings = results['findings']['securityGroups']

        assert sg_findings['violations'] > 0, "Should detect security group violations"
        assert any('0.0.0.0/0' in issue for issue in sg_findings['issues']), \
            "Should detect overly permissive rules"

    def test_s3_violations_detected(self):
        """Test S3 bucket violations are detected."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()
        s3_findings = results['findings']['s3']

        assert s3_findings['violations'] > 0, "Should detect S3 violations"
        assert any('encryption' in issue.lower() or 'public' in issue.lower()
                   for issue in s3_findings['issues']), \
            "Should detect encryption and public access issues"

    def test_iam_violations_detected(self):
        """Test IAM user violations are detected."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()
        iam_findings = results['findings']['iam']

        assert iam_findings['violations'] > 0, "Should detect IAM violations"
        assert any('access key' in issue.lower() for issue in iam_findings['issues']), \
            "Should detect old access keys"

    def test_vpc_compliance_perfect(self):
        """Test VPC compliance shows as perfect (100%)."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()
        vpc_findings = results['findings']['vpc']

        assert vpc_findings['violations'] == 0, "VPC should have no violations"
        assert results['summary']['serviceScores']['vpc'] == 100.0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
