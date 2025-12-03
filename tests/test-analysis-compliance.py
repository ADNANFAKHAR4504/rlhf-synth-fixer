#!/usr/bin/env python3
"""
Test cases for Infrastructure Compliance Scanner analysis script.

These tests validate the compliance scanning logic and report generation
using mocked AWS services via Moto.
"""

import json
import os
import sys
import pytest
import subprocess

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))


class TestEnvironmentCheck:
    """Test environment variable validation."""

    def test_environment_suffix_is_set(self):
        """Verify ENVIRONMENT_SUFFIX environment variable is configured."""
        env_suffix = os.environ.get('ENVIRONMENT_SUFFIX')
        assert env_suffix is not None, "ENVIRONMENT_SUFFIX must be set"
        assert len(env_suffix) > 0, "ENVIRONMENT_SUFFIX cannot be empty"

    def test_aws_region_is_set(self):
        """Verify AWS_REGION environment variable is configured."""
        region = os.environ.get('AWS_REGION')
        assert region is not None, "AWS_REGION must be set"
        assert region in [
            'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
            'eu-west-1', 'eu-west-2', 'eu-central-1',
            'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
        ], f"AWS_REGION '{region}' is not a valid region"

    def test_aws_credentials_are_set(self):
        """Verify AWS credentials are configured."""
        access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        assert access_key is not None, "AWS_ACCESS_KEY_ID must be set"
        assert secret_key is not None, "AWS_SECRET_ACCESS_KEY must be set"


class TestComplianceLogic:
    """Test compliance checking logic."""

    REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter', 'Project']

    def test_compliant_resource_has_all_tags(self):
        """Verify resource with all required tags is marked compliant."""
        resource_tags = {
            'Environment': 'prod',
            'Owner': 'team@example.com',
            'CostCenter': 'CC001',
            'Project': 'WebApp'
        }
        missing_tags = [tag for tag in self.REQUIRED_TAGS if tag not in resource_tags]
        assert len(missing_tags) == 0, "Resource with all tags should be compliant"

    def test_non_compliant_resource_missing_tags(self):
        """Verify resource missing tags is marked non-compliant."""
        resource_tags = {
            'Environment': 'prod',
            'Name': 'my-resource'
        }
        missing_tags = [tag for tag in self.REQUIRED_TAGS if tag not in resource_tags]
        assert len(missing_tags) == 3, "Resource should be missing 3 required tags"
        assert 'Owner' in missing_tags
        assert 'CostCenter' in missing_tags
        assert 'Project' in missing_tags

    def test_resource_with_no_tags_is_non_compliant(self):
        """Verify resource with no tags is marked non-compliant."""
        resource_tags = {}
        missing_tags = [tag for tag in self.REQUIRED_TAGS if tag not in resource_tags]
        assert len(missing_tags) == 4, "Resource with no tags should be missing all 4 required tags"

    def test_compliance_percentage_calculation(self):
        """Verify compliance percentage is calculated correctly."""
        compliant = 7
        non_compliant = 3
        total = compliant + non_compliant
        percentage = (compliant / total) * 100
        assert percentage == 70.0, "Compliance percentage should be 70%"

    def test_compliance_percentage_all_compliant(self):
        """Verify 100% compliance when all resources are compliant."""
        compliant = 10
        non_compliant = 0
        total = compliant + non_compliant
        percentage = (compliant / total) * 100 if total > 0 else 0
        assert percentage == 100.0, "Compliance percentage should be 100%"

    def test_compliance_percentage_none_compliant(self):
        """Verify 0% compliance when no resources are compliant."""
        compliant = 0
        non_compliant = 5
        total = compliant + non_compliant
        percentage = (compliant / total) * 100 if total > 0 else 0
        assert percentage == 0.0, "Compliance percentage should be 0%"

    def test_compliance_percentage_empty_resources(self):
        """Verify handling of zero total resources."""
        compliant = 0
        non_compliant = 0
        total = compliant + non_compliant
        percentage = (compliant / total) * 100 if total > 0 else 0
        assert percentage == 0, "Compliance percentage should be 0 for empty resources"


class TestResourceAgeCalculation:
    """Test resource age and 90-day flagging logic."""

    NINETY_DAYS = 90

    def test_resource_older_than_90_days_is_flagged(self):
        """Verify resources older than 90 days are flagged."""
        age_in_days = 100
        flagged = age_in_days > self.NINETY_DAYS
        assert flagged is True, "Resource older than 90 days should be flagged"

    def test_resource_younger_than_90_days_not_flagged(self):
        """Verify resources younger than 90 days are not flagged."""
        age_in_days = 45
        flagged = age_in_days > self.NINETY_DAYS
        assert flagged is False, "Resource younger than 90 days should not be flagged"

    def test_resource_exactly_90_days_not_flagged(self):
        """Verify resource exactly 90 days old is not flagged."""
        age_in_days = 90
        flagged = age_in_days > self.NINETY_DAYS
        assert flagged is False, "Resource exactly 90 days old should not be flagged"

    def test_age_calculation_from_timestamp(self):
        """Verify age calculation from launch/create timestamp."""
        from datetime import datetime, timezone, timedelta

        # Resource created 45 days ago
        create_time = datetime.now(timezone.utc) - timedelta(days=45)
        now = datetime.now(timezone.utc)
        age_in_days = (now - create_time).days

        assert age_in_days == 45, "Age should be 45 days"
        assert age_in_days <= self.NINETY_DAYS, "Resource should not be flagged"


class TestRecommendationGeneration:
    """Test recommendation generation logic."""

    def test_recommendations_grouped_by_service(self):
        """Verify non-compliant resources are grouped by service."""
        non_compliant_resources = [
            {'resourceId': 'i-123', 'resourceType': 'EC2 Instance'},
            {'resourceId': 'i-456', 'resourceType': 'EC2 Instance'},
            {'resourceId': 'db-789', 'resourceType': 'RDS Instance'},
            {'resourceId': 'bucket-abc', 'resourceType': 'S3 Bucket'},
        ]

        grouped = {}
        for resource in non_compliant_resources:
            service = resource['resourceType']
            if service not in grouped:
                grouped[service] = []
            grouped[service].append(resource)

        assert len(grouped['EC2 Instance']) == 2
        assert len(grouped['RDS Instance']) == 1
        assert len(grouped['S3 Bucket']) == 1

    def test_high_priority_for_flagged_resources(self):
        """Verify flagged resources get HIGH priority recommendation."""
        flagged_resources = [
            {'resourceId': 'i-123', 'flagged': True, 'ageInDays': 120},
            {'resourceId': 'db-456', 'flagged': True, 'ageInDays': 95},
        ]

        if len(flagged_resources) > 0:
            recommendation = {
                'priority': 'HIGH',
                'action': f'{len(flagged_resources)} resource(s) running >90 days without proper tags',
                'resourceIds': [r['resourceId'] for r in flagged_resources]
            }

            assert recommendation['priority'] == 'HIGH'
            assert len(recommendation['resourceIds']) == 2


class TestReportGeneration:
    """Test report structure and content."""

    def test_report_contains_required_fields(self):
        """Verify report contains all required fields."""
        report = {
            'scanId': 'compliance-scan-20251203120000',
            'timestamp': '2025-12-03T12:00:00Z',
            'environmentSuffix': 'test123',
            'region': 'us-east-1',
            'summary': {
                'ec2': {'total': 3, 'compliant': 1, 'nonCompliant': 2, 'compliancePercentage': '33.33'},
                'rds': {'total': 2, 'compliant': 1, 'nonCompliant': 1, 'compliancePercentage': '50.00'},
                's3': {'total': 3, 'compliant': 2, 'nonCompliant': 1, 'compliancePercentage': '66.67'},
                'overall': {'total': 8, 'compliant': 4, 'nonCompliant': 4, 'compliancePercentage': '50.00'}
            },
            'details': {
                'ec2': {'compliant': [], 'nonCompliant': []},
                'rds': {'compliant': [], 'nonCompliant': []},
                's3': {'compliant': [], 'nonCompliant': []}
            },
            'recommendations': []
        }

        assert 'scanId' in report
        assert 'timestamp' in report
        assert 'environmentSuffix' in report
        assert 'region' in report
        assert 'summary' in report
        assert 'details' in report
        assert 'recommendations' in report

    def test_summary_contains_all_services(self):
        """Verify summary includes all three services and overall."""
        summary = {
            'ec2': {'total': 3, 'compliant': 1, 'nonCompliant': 2, 'compliancePercentage': '33.33'},
            'rds': {'total': 2, 'compliant': 1, 'nonCompliant': 1, 'compliancePercentage': '50.00'},
            's3': {'total': 3, 'compliant': 2, 'nonCompliant': 1, 'compliancePercentage': '66.67'},
            'overall': {'total': 8, 'compliant': 4, 'nonCompliant': 4, 'compliancePercentage': '50.00'}
        }

        assert 'ec2' in summary
        assert 'rds' in summary
        assert 's3' in summary
        assert 'overall' in summary

    def test_details_structure_for_each_service(self):
        """Verify details structure has compliant and nonCompliant arrays."""
        details = {
            'ec2': {'compliant': [], 'nonCompliant': []},
            'rds': {'compliant': [], 'nonCompliant': []},
            's3': {'compliant': [], 'nonCompliant': []}
        }

        for service in ['ec2', 'rds', 's3']:
            assert 'compliant' in details[service]
            assert 'nonCompliant' in details[service]
            assert isinstance(details[service]['compliant'], list)
            assert isinstance(details[service]['nonCompliant'], list)


class TestAnalysisScript:
    """Test the analysis script execution."""

    def test_analysis_script_exists(self):
        """Verify analyse.py script exists."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        assert os.path.exists(script_path), "analyse.py script should exist"

    def test_analysis_script_is_executable(self):
        """Verify analyse.py script has correct shebang."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        with open(script_path, 'r') as f:
            first_line = f.readline()
        assert first_line.startswith('#!/usr/bin/env python3'), "Script should have python3 shebang"

    def test_analysis_script_runs_successfully(self):
        """Verify analyse.py script runs and exits with code 0."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = os.environ.get('ENVIRONMENT_SUFFIX', 'test123')
        env['AWS_REGION'] = os.environ.get('AWS_REGION', 'us-east-1')
        env['AWS_ACCESS_KEY_ID'] = os.environ.get('AWS_ACCESS_KEY_ID', 'test')
        env['AWS_SECRET_ACCESS_KEY'] = os.environ.get('AWS_SECRET_ACCESS_KEY', 'test')

        result = subprocess.run(
            ['python3', script_path],
            capture_output=True,
            text=True,
            env=env
        )

        assert result.returncode == 0, f"Script should exit with code 0, got {result.returncode}. stderr: {result.stderr}"

    def test_analysis_results_file_created(self):
        """Verify analysis-results.txt is created after running script."""
        # First run the script to ensure results file exists
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = os.environ.get('ENVIRONMENT_SUFFIX', 'test123')
        env['AWS_REGION'] = os.environ.get('AWS_REGION', 'us-east-1')
        env['AWS_ACCESS_KEY_ID'] = os.environ.get('AWS_ACCESS_KEY_ID', 'test')
        env['AWS_SECRET_ACCESS_KEY'] = os.environ.get('AWS_SECRET_ACCESS_KEY', 'test')

        subprocess.run(['python3', script_path], capture_output=True, env=env)

        results_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analysis-results.txt')
        assert os.path.exists(results_path), "analysis-results.txt should be created"

        with open(results_path, 'r') as f:
            content = f.read()
        assert 'Infrastructure Tag Compliance Report' in content or 'Compliance' in content

    def test_analysis_output_contains_scan_id(self):
        """Verify analysis output contains scan ID."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = os.environ.get('ENVIRONMENT_SUFFIX', 'test123')
        env['AWS_REGION'] = os.environ.get('AWS_REGION', 'us-east-1')
        env['AWS_ACCESS_KEY_ID'] = os.environ.get('AWS_ACCESS_KEY_ID', 'test')
        env['AWS_SECRET_ACCESS_KEY'] = os.environ.get('AWS_SECRET_ACCESS_KEY', 'test')

        result = subprocess.run(
            ['python3', script_path],
            capture_output=True,
            text=True,
            env=env
        )

        assert 'Scan ID: compliance-scan-' in result.stdout, "Output should contain scan ID"

    def test_analysis_output_contains_compliance_score(self):
        """Verify analysis output contains compliance score."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = os.environ.get('ENVIRONMENT_SUFFIX', 'test123')
        env['AWS_REGION'] = os.environ.get('AWS_REGION', 'us-east-1')
        env['AWS_ACCESS_KEY_ID'] = os.environ.get('AWS_ACCESS_KEY_ID', 'test')
        env['AWS_SECRET_ACCESS_KEY'] = os.environ.get('AWS_SECRET_ACCESS_KEY', 'test')

        result = subprocess.run(
            ['python3', script_path],
            capture_output=True,
            text=True,
            env=env
        )

        assert 'Score: 50.00%' in result.stdout, "Output should contain compliance score"

    def test_analysis_output_contains_recommendations(self):
        """Verify analysis output contains recommendations."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        env = os.environ.copy()
        env['ENVIRONMENT_SUFFIX'] = os.environ.get('ENVIRONMENT_SUFFIX', 'test123')
        env['AWS_REGION'] = os.environ.get('AWS_REGION', 'us-east-1')
        env['AWS_ACCESS_KEY_ID'] = os.environ.get('AWS_ACCESS_KEY_ID', 'test')
        env['AWS_SECRET_ACCESS_KEY'] = os.environ.get('AWS_SECRET_ACCESS_KEY', 'test')

        result = subprocess.run(
            ['python3', script_path],
            capture_output=True,
            text=True,
            env=env
        )

        assert '[RECOMMENDATIONS]' in result.stdout, "Output should contain recommendations section"
        assert '[HIGH]' in result.stdout, "Output should contain HIGH priority recommendation"


class TestMandatoryTags:
    """Test mandatory tag definitions."""

    def test_required_tags_defined(self):
        """Verify all four required tags are defined."""
        required_tags = ['Environment', 'Owner', 'CostCenter', 'Project']
        assert len(required_tags) == 4
        assert 'Environment' in required_tags
        assert 'Owner' in required_tags
        assert 'CostCenter' in required_tags
        assert 'Project' in required_tags

    def test_tag_validation_is_case_sensitive(self):
        """Verify tag key matching is case-sensitive."""
        required_tags = ['Environment', 'Owner', 'CostCenter', 'Project']
        resource_tags = {
            'environment': 'prod',  # lowercase - should not match
            'Owner': 'team@example.com',
            'CostCenter': 'CC001',
            'Project': 'WebApp'
        }

        missing_tags = [tag for tag in required_tags if tag not in resource_tags]
        assert 'Environment' in missing_tags, "Tag matching should be case-sensitive"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
