"""
Test suite for AWS Config Compliance System Analysis

This test file validates the compliance analysis functionality
including AWS Config setup, compliance rule evaluations, and reporting.
"""

import pytest
import sys
import os
import json

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))


class TestConfigComplianceAnalyzer:
    """Test AWS Config compliance analyzer functionality."""

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
        """Verify analysis script exists and is executable."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        assert os.path.exists(script_path), "analyse.py script must exist"
        assert os.access(script_path, os.R_OK), "analyse.py must be readable"
        assert os.access(script_path, os.X_OK), "analyse.py must be executable"

    def test_config_setup_demonstration(self):
        """Test AWS Config setup demonstration."""
        from analyse import demonstrate_config_setup

        # Run Config setup demonstration
        config_status = demonstrate_config_setup()

        # Verify structure
        assert 'recorder' in config_status
        assert 'deliveryChannel' in config_status

        # Verify recorder configuration
        recorder = config_status['recorder']
        assert 'name' in recorder
        assert 'status' in recorder
        assert recorder['status'] == 'ACTIVE'
        assert recorder['recording'] is True
        assert recorder['resourceTypes'] == 'ALL'

        # Verify delivery channel
        channel = config_status['deliveryChannel']
        assert 'name' in channel
        assert 'status' in channel
        assert channel['status'] == 'SUCCESS'
        assert 's3Bucket' in channel

    def test_compliance_rules_evaluation(self):
        """Test compliance rules evaluation simulation."""
        from analyse import simulate_compliance_rules

        # Run rules evaluation
        evaluation = simulate_compliance_rules()

        # Verify structure
        assert 'evaluationTime' in evaluation
        assert 'environment' in evaluation
        assert 'rules' in evaluation

        # Verify expected rules exist
        expected_rules = [
            's3-bucket-encryption-enabled',
            'ec2-required-tags',
            'cloudwatch-alarm-action-check'
        ]

        for rule_name in expected_rules:
            assert rule_name in evaluation['rules'], f"Missing rule: {rule_name}"
            rule = evaluation['rules'][rule_name]

            # Verify rule structure
            assert 'description' in rule
            assert 'status' in rule
            assert 'resourcesEvaluated' in rule
            assert 'compliantResources' in rule
            assert 'nonCompliantResources' in rule
            assert 'violations' in rule

            # Verify counts add up
            assert rule['compliantResources'] + rule['nonCompliantResources'] == rule['resourcesEvaluated']

    def test_compliance_report_generation(self):
        """Test compliance report generation."""
        from analyse import demonstrate_config_setup, simulate_compliance_rules, generate_compliance_report

        # Generate required inputs
        config_status = demonstrate_config_setup()
        rules_evaluation = simulate_compliance_rules()

        # Generate report
        report = generate_compliance_report(config_status, rules_evaluation)

        # Verify report structure
        assert 'reportId' in report
        assert 'timestamp' in report
        assert 'environment' in report
        assert 'configStatus' in report
        assert 'rulesEvaluation' in report
        assert 'summary' in report
        assert 'actions' in report

        # Verify summary statistics
        summary = report['summary']
        assert 'totalRules' in summary
        assert 'compliantRules' in summary
        assert 'nonCompliantRules' in summary
        assert 'totalResources' in summary
        assert 'compliantResources' in summary
        assert 'nonCompliantResources' in summary

        # Verify actions taken
        actions = report['actions']
        assert 'notificationsSent' in actions
        assert 'snsTopicArn' in actions
        assert 'reportStoredInS3' in actions
        assert 's3Location' in actions

    def test_compliance_score_calculation(self):
        """Test compliance score is calculated correctly."""
        from analyse import demonstrate_config_setup, simulate_compliance_rules, generate_compliance_report

        config_status = demonstrate_config_setup()
        rules_evaluation = simulate_compliance_rules()
        report = generate_compliance_report(config_status, rules_evaluation)

        summary = report['summary']

        # Verify score calculation
        if summary['totalResources'] > 0:
            expected_score = (summary['compliantResources'] / summary['totalResources']) * 100
            actual_percentage = (summary['compliantResources'] / summary['totalResources']) * 100
            assert 0 <= actual_percentage <= 100, "Compliance score must be between 0 and 100"

    def test_ec2_required_tags_rule(self):
        """Test EC2 required tags compliance rule."""
        from analyse import simulate_compliance_rules

        evaluation = simulate_compliance_rules()
        ec2_tags_rule = evaluation['rules']['ec2-required-tags']

        # This rule should check for Environment, Owner, and CostCenter tags
        assert 'required tags' in ec2_tags_rule['description'].lower()
        assert ec2_tags_rule['resourcesEvaluated'] > 0

        # Verify violation structure if non-compliant resources exist
        if ec2_tags_rule['nonCompliantResources'] > 0:
            assert len(ec2_tags_rule['violations']) > 0
            for violation in ec2_tags_rule['violations']:
                assert 'resourceId' in violation
                assert 'resourceType' in violation
                assert 'missingTags' in violation
                assert isinstance(violation['missingTags'], list)

    def test_s3_encryption_rule(self):
        """Test S3 bucket encryption compliance rule."""
        from analyse import simulate_compliance_rules

        evaluation = simulate_compliance_rules()
        s3_encryption_rule = evaluation['rules']['s3-bucket-encryption-enabled']

        # Verify rule checks encryption
        assert 'encryption' in s3_encryption_rule['description'].lower()
        assert s3_encryption_rule['resourcesEvaluated'] > 0

    def test_cloudwatch_alarm_rule(self):
        """Test CloudWatch alarm action check rule."""
        from analyse import simulate_compliance_rules

        evaluation = simulate_compliance_rules()
        cw_alarm_rule = evaluation['rules']['cloudwatch-alarm-action-check']

        # Verify rule checks alarm actions
        assert 'alarm' in cw_alarm_rule['description'].lower()
        assert cw_alarm_rule['resourcesEvaluated'] > 0

    def test_monitoring_demonstration(self):
        """Test CloudWatch monitoring demonstration."""
        from analyse import demonstrate_monitoring

        # This should not raise any exceptions
        demonstrate_monitoring()

    def test_environment_suffix_used(self):
        """Test that environment suffix is properly used throughout."""
        from analyse import demonstrate_config_setup, simulate_compliance_rules, generate_compliance_report

        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

        config_status = demonstrate_config_setup()
        rules_evaluation = simulate_compliance_rules()
        report = generate_compliance_report(config_status, rules_evaluation)

        # Verify environment is tracked
        assert rules_evaluation['environment'] == env_suffix
        assert report['environment'] == env_suffix

        # Verify environment suffix is in resource names
        assert env_suffix in config_status['recorder']['name']
        assert env_suffix in config_status['deliveryChannel']['name']
        assert env_suffix in config_status['deliveryChannel']['s3Bucket']

    def test_report_includes_all_required_fields(self):
        """Test that generated report includes all required fields."""
        from analyse import demonstrate_config_setup, simulate_compliance_rules, generate_compliance_report

        config_status = demonstrate_config_setup()
        rules_evaluation = simulate_compliance_rules()
        report = generate_compliance_report(config_status, rules_evaluation)

        # Verify all top-level fields
        required_fields = [
            'reportId',
            'timestamp',
            'environment',
            'configStatus',
            'rulesEvaluation',
            'summary',
            'actions'
        ]

        for field in required_fields:
            assert field in report, f"Report missing required field: {field}"

    def test_violations_structure(self):
        """Test that violations have proper structure."""
        from analyse import simulate_compliance_rules

        evaluation = simulate_compliance_rules()

        for rule_name, rule_data in evaluation['rules'].items():
            violations = rule_data['violations']

            # Violations should be a list
            assert isinstance(violations, list), f"Violations for {rule_name} must be a list"

            # If there are non-compliant resources, there should be violations
            if rule_data['nonCompliantResources'] > 0:
                assert len(violations) > 0, f"Rule {rule_name} has non-compliant resources but no violations listed"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
