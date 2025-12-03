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

    def test_config_rules_analysis(self):
        """Test Config rules analysis functionality."""
        from analyse import analyze_config_rules

        results = analyze_config_rules()

        # Verify structure
        assert 'total_rules' in results
        assert 'active_rules' in results
        assert 'rules' in results
        assert 'average_compliance' in results

        # Verify rules data
        assert results['total_rules'] > 0
        assert results['active_rules'] <= results['total_rules']
        assert 0 <= results['average_compliance'] <= 100

        # Verify each rule has required fields
        for rule in results['rules']:
            assert 'name' in rule
            assert 'description' in rule
            assert 'status' in rule
            assert 'compliance_rate' in rule

    def test_lambda_functions_analysis(self):
        """Test Lambda functions analysis functionality."""
        from analyse import analyze_lambda_functions

        results = analyze_lambda_functions()

        # Verify structure
        assert 'functions' in results
        assert 'total_functions' in results
        assert 'deployed_functions' in results

        # Verify counts
        assert results['total_functions'] > 0
        assert results['deployed_functions'] <= results['total_functions']
        assert len(results['functions']) == results['total_functions']

        # Verify each function has required fields
        for func in results['functions']:
            assert 'name' in func
            assert 'purpose' in func
            assert 'status' in func

    def test_monitoring_dashboard_analysis(self):
        """Test CloudWatch dashboard analysis functionality."""
        from analyse import analyze_monitoring_dashboard

        results = analyze_monitoring_dashboard()

        # Verify structure
        assert 'dashboard_name' in results
        assert 'widgets' in results
        assert 'metrics_tracked' in results
        assert 'status' in results

        # Verify content
        assert len(results['dashboard_name']) > 0
        assert len(results['widgets']) > 0
        assert len(results['metrics_tracked']) > 0
        assert results['status'] in ['ACTIVE', 'INACTIVE']

    def test_analysis_results_comprehensive(self):
        """Test that analysis produces comprehensive results."""
        from analyse import simulate_compliance_scan

        results = simulate_compliance_scan()

        # Count services with violations
        services_with_violations = sum(
            1 for data in results['findings'].values() if data['violations'] > 0
        )

        # Verify we have realistic data
        assert results['summary']['totalResources'] > 50, "Should scan significant number of resources"
        assert results['summary']['complianceScore'] < 100, "Should have some violations for realism"
        assert services_with_violations > 0, "Should have violations in at least one service"
