#!/usr/bin/env python3
"""
S3 Compliance Analysis Tests

This module contains comprehensive tests for the S3 compliance analysis
infrastructure, including unit tests for the analyse.py functions and
integration tests using mocked AWS services.
"""

import json
import os
import sys
import tempfile
from io import StringIO
from unittest.mock import patch, MagicMock

import boto3
import pytest
from moto import mock_aws

# Add lib to path for importing analyse module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

# Import the analyse module
import analyse


@pytest.fixture(autouse=True)
def setup_environment():
    """Set up environment variables for all tests."""
    os.environ['AWS_REGION'] = 'us-east-1'
    os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'
    yield
    # Cleanup is automatic


class TestPrintSection:
    """Tests for print_section function."""

    def test_print_section_output(self, capsys):
        """Test that print_section formats output correctly."""
        analyse.print_section("Test Section")
        captured = capsys.readouterr()
        assert "Test Section" in captured.out
        assert "=" * 70 in captured.out

    def test_print_section_with_long_title(self, capsys):
        """Test print_section with a longer title."""
        analyse.print_section("This is a very long section title for testing")
        captured = capsys.readouterr()
        assert "This is a very long section title for testing" in captured.out


class TestCheckEnvironment:
    """Tests for check_environment function."""

    def test_check_environment_outputs_variables(self, capsys):
        """Test that check_environment outputs all required variables."""
        analyse.check_environment()
        captured = capsys.readouterr()
        assert "AWS_REGION" in captured.out
        assert "AWS_ACCESS_KEY_ID" in captured.out
        assert "AWS_SECRET_ACCESS_KEY" in captured.out
        assert "ENVIRONMENT_SUFFIX" in captured.out
        assert "[PASS]" in captured.out

    def test_check_environment_masks_secrets(self, capsys):
        """Test that sensitive values are masked."""
        analyse.check_environment()
        captured = capsys.readouterr()
        # Should show *** for keys/secrets
        assert "***" in captured.out


class TestSimulateS3ComplianceScan:
    """Tests for simulate_s3_compliance_scan function."""

    def test_scan_returns_dict(self):
        """Test that scan returns a dictionary."""
        result = analyse.simulate_s3_compliance_scan()
        assert isinstance(result, dict)

    def test_scan_contains_required_keys(self):
        """Test that scan result contains all required keys."""
        result = analyse.simulate_s3_compliance_scan()
        required_keys = ['scanId', 'timestamp', 'environment', 'region',
                        'complianceChecks', 'findings', 'summary']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_scan_summary_structure(self):
        """Test that summary has correct structure."""
        result = analyse.simulate_s3_compliance_scan()
        summary = result['summary']
        assert 'totalBuckets' in summary
        assert 'compliantBuckets' in summary
        assert 'nonCompliantBuckets' in summary
        assert 'compliancePercentage' in summary
        assert 'violationsByType' in summary
        assert 'violationsBySeverity' in summary

    def test_scan_findings_structure(self):
        """Test that findings has correct structure."""
        result = analyse.simulate_s3_compliance_scan()
        findings = result['findings']
        assert 'critical' in findings
        assert 'high' in findings
        assert 'medium' in findings
        assert 'low' in findings

    def test_scan_uses_environment_suffix(self):
        """Test that scan uses environment suffix from env var."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'custom-test'
        result = analyse.simulate_s3_compliance_scan()
        assert result['environment'] == 'custom-test'


class TestGenerateReport:
    """Tests for generate_report function."""

    def test_generate_report_creates_file(self):
        """Test that generate_report creates the output file."""
        scan_results = analyse.simulate_s3_compliance_scan()

        # Use temp directory for test
        with tempfile.TemporaryDirectory() as tmpdir:
            original_cwd = os.getcwd()
            os.chdir(tmpdir)
            os.makedirs('lib', exist_ok=True)

            try:
                analyse.generate_report(scan_results)
                assert os.path.exists('lib/analysis-results.txt')
            finally:
                os.chdir(original_cwd)

    def test_generate_report_outputs_summary(self, capsys):
        """Test that generate_report outputs summary information."""
        scan_results = analyse.simulate_s3_compliance_scan()

        with tempfile.TemporaryDirectory() as tmpdir:
            original_cwd = os.getcwd()
            os.chdir(tmpdir)
            os.makedirs('lib', exist_ok=True)

            try:
                analyse.generate_report(scan_results)
                captured = capsys.readouterr()
                assert "Overall S3 Compliance Score" in captured.out
                assert "Total Buckets" in captured.out
                assert "Compliant" in captured.out
            finally:
                os.chdir(original_cwd)


class TestValidateDeployment:
    """Tests for validate_deployment function."""

    def test_validate_deployment_outputs_resources(self, capsys):
        """Test that validate_deployment lists all required resources."""
        analyse.validate_deployment()
        captured = capsys.readouterr()
        assert "SNS Topic" in captured.out
        assert "SQS Queue" in captured.out
        assert "Lambda Function" in captured.out
        assert "Step Functions" in captured.out
        assert "EventBridge" in captured.out
        assert "CloudWatch Alarm" in captured.out
        assert "[PASS]" in captured.out


class TestValidateComplianceFeatures:
    """Tests for validate_compliance_features function."""

    def test_validate_features_outputs_checks(self, capsys):
        """Test that validate_features lists all compliance checks."""
        analyse.validate_compliance_features()
        captured = capsys.readouterr()
        assert "Versioning" in captured.out
        assert "encryption" in captured.out.lower()
        assert "Lifecycle" in captured.out
        assert "Public access" in captured.out or "public access" in captured.out
        assert "CloudWatch" in captured.out
        assert "[PASS]" in captured.out


class TestValidateSecurity:
    """Tests for validate_security function."""

    def test_validate_security_outputs_checks(self, capsys):
        """Test that validate_security lists security validations."""
        analyse.validate_security()
        captured = capsys.readouterr()
        assert "IAM" in captured.out
        assert "Least Privilege" in captured.out or "least privilege" in captured.out.lower()
        assert "environmentSuffix" in captured.out
        assert "[PASS]" in captured.out


class TestValidateScalability:
    """Tests for validate_scalability function."""

    def test_validate_scalability_outputs_checks(self, capsys):
        """Test that validate_scalability lists scalability features."""
        analyse.validate_scalability()
        captured = capsys.readouterr()
        assert "Pagination" in captured.out
        assert "Retry" in captured.out
        assert "[PASS]" in captured.out


class TestMainFunction:
    """Tests for main function."""

    def test_main_returns_zero_on_success(self):
        """Test that main returns 0 on success."""
        with tempfile.TemporaryDirectory() as tmpdir:
            original_cwd = os.getcwd()
            os.chdir(tmpdir)
            os.makedirs('lib', exist_ok=True)

            try:
                result = analyse.main()
                assert result == 0
            finally:
                os.chdir(original_cwd)

    def test_main_prints_pass(self, capsys):
        """Test that main prints PASS on completion."""
        with tempfile.TemporaryDirectory() as tmpdir:
            original_cwd = os.getcwd()
            os.chdir(tmpdir)
            os.makedirs('lib', exist_ok=True)

            try:
                analyse.main()
                captured = capsys.readouterr()
                assert "[PASS]" in captured.out
            finally:
                os.chdir(original_cwd)


class TestS3ComplianceWithMoto:
    """Integration tests using moto to mock AWS S3."""

    @mock_aws
    def test_s3_bucket_creation(self, setup_environment):
        """Test that S3 buckets can be created with moto."""
        s3 = boto3.client('s3', region_name='us-east-1')
        s3.create_bucket(Bucket='test-compliance-bucket')

        response = s3.list_buckets()
        bucket_names = [b['Name'] for b in response['Buckets']]
        assert 'test-compliance-bucket' in bucket_names

    @mock_aws
    def test_s3_versioning_check(self, setup_environment):
        """Test versioning check simulation."""
        s3 = boto3.client('s3', region_name='us-east-1')
        s3.create_bucket(Bucket='versioned-bucket')

        # Enable versioning
        s3.put_bucket_versioning(
            Bucket='versioned-bucket',
            VersioningConfiguration={'Status': 'Enabled'}
        )

        response = s3.get_bucket_versioning(Bucket='versioned-bucket')
        assert response.get('Status') == 'Enabled'

    @mock_aws
    def test_s3_encryption_check(self, setup_environment):
        """Test encryption check simulation."""
        s3 = boto3.client('s3', region_name='us-east-1')
        s3.create_bucket(Bucket='encrypted-bucket')

        # Configure encryption
        s3.put_bucket_encryption(
            Bucket='encrypted-bucket',
            ServerSideEncryptionConfiguration={
                'Rules': [{
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'AES256'
                    }
                }]
            }
        )

        response = s3.get_bucket_encryption(Bucket='encrypted-bucket')
        algorithm = response['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
        assert algorithm == 'AES256'

    @mock_aws
    def test_s3_tagging(self, setup_environment):
        """Test bucket tagging for compliance status."""
        s3 = boto3.client('s3', region_name='us-east-1')
        s3.create_bucket(Bucket='tagged-bucket')

        # Add compliance tag
        s3.put_bucket_tagging(
            Bucket='tagged-bucket',
            Tagging={
                'TagSet': [
                    {'Key': 'compliance-status', 'Value': 'failed'}
                ]
            }
        )

        response = s3.get_bucket_tagging(Bucket='tagged-bucket')
        tags = {t['Key']: t['Value'] for t in response['TagSet']}
        assert tags.get('compliance-status') == 'failed'


class TestSQSIntegration:
    """Integration tests for SQS functionality."""

    @mock_aws
    def test_sqs_queue_creation(self, setup_environment):
        """Test SQS queue creation."""
        sqs = boto3.client('sqs', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        response = sqs.create_queue(
            QueueName=f's3-compliance-results-{suffix}'
        )

        assert 'QueueUrl' in response

    @mock_aws
    def test_sqs_send_message(self, setup_environment):
        """Test sending compliance report to SQS."""
        sqs = boto3.client('sqs', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        queue_url = sqs.create_queue(
            QueueName=f's3-compliance-results-{suffix}'
        )['QueueUrl']

        report = {
            'totalBuckets': 10,
            'compliantBuckets': 8,
            'nonCompliantBuckets': 2,
            'timestamp': '2025-01-01T00:00:00Z'
        }

        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(report)
        )

        response = sqs.receive_message(QueueUrl=queue_url)
        assert 'Messages' in response
        assert len(response['Messages']) == 1


class TestSNSIntegration:
    """Integration tests for SNS functionality."""

    @mock_aws
    def test_sns_topic_creation(self, setup_environment):
        """Test SNS topic creation."""
        sns = boto3.client('sns', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        response = sns.create_topic(
            Name=f's3-compliance-notifications-{suffix}'
        )

        assert 'TopicArn' in response

    @mock_aws
    def test_sns_publish_alert(self, setup_environment):
        """Test publishing compliance alert to SNS."""
        sns = boto3.client('sns', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        topic_arn = sns.create_topic(
            Name=f's3-compliance-notifications-{suffix}'
        )['TopicArn']

        response = sns.publish(
            TopicArn=topic_arn,
            Subject='High-Severity S3 Compliance Violation',
            Message=json.dumps({
                'bucketName': 'non-compliant-bucket',
                'violations': ['Versioning not enabled', 'Encryption missing']
            })
        )

        assert 'MessageId' in response


class TestCloudWatchIntegration:
    """Integration tests for CloudWatch functionality."""

    @mock_aws
    def test_cloudwatch_metric_publishing(self, setup_environment):
        """Test publishing compliance metrics to CloudWatch."""
        cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

        cloudwatch.put_metric_data(
            Namespace='S3Compliance',
            MetricData=[
                {
                    'MetricName': 'NonCompliantBuckets',
                    'Value': 3,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'TotalBuckets',
                    'Value': 20,
                    'Unit': 'Count'
                }
            ]
        )

        # Verify metrics were published (moto doesn't persist, but no error means success)
        assert True

    @mock_aws
    def test_cloudwatch_alarm_creation(self, setup_environment):
        """Test CloudWatch alarm creation."""
        cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        cloudwatch.put_metric_alarm(
            AlarmName=f's3-non-compliant-buckets-{suffix}',
            MetricName='NonCompliantBuckets',
            Namespace='S3Compliance',
            Statistic='Average',
            Period=300,
            EvaluationPeriods=1,
            Threshold=1,
            ComparisonOperator='GreaterThanThreshold'
        )

        response = cloudwatch.describe_alarms(
            AlarmNames=[f's3-non-compliant-buckets-{suffix}']
        )

        assert len(response['MetricAlarms']) == 1


class TestStepFunctionsIntegration:
    """Integration tests for Step Functions functionality."""

    @mock_aws
    def test_state_machine_creation(self, setup_environment):
        """Test Step Functions state machine creation."""
        sfn = boto3.client('stepfunctions', region_name='us-east-1')
        iam = boto3.client('iam', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        # Create IAM role
        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'states.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        })

        role = iam.create_role(
            RoleName=f's3-compliance-sfn-role-{suffix}',
            AssumeRolePolicyDocument=assume_role_policy
        )

        # Create state machine
        definition = json.dumps({
            'Comment': 'S3 Compliance Workflow',
            'StartAt': 'CheckCompliance',
            'States': {
                'CheckCompliance': {
                    'Type': 'Pass',
                    'End': True
                }
            }
        })

        response = sfn.create_state_machine(
            name=f's3-compliance-workflow-{suffix}',
            definition=definition,
            roleArn=role['Role']['Arn']
        )

        assert 'stateMachineArn' in response


class TestLambdaIntegration:
    """Integration tests for Lambda functionality."""

    @mock_aws
    def test_lambda_function_creation(self, setup_environment):
        """Test Lambda function creation."""
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        iam = boto3.client('iam', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        # Create IAM role
        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'lambda.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        })

        role = iam.create_role(
            RoleName=f's3-compliance-lambda-role-{suffix}',
            AssumeRolePolicyDocument=assume_role_policy
        )

        # Create Lambda function (using inline zip)
        import zipfile
        import io

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('index.js', 'exports.handler = async () => {};')

        response = lambda_client.create_function(
            FunctionName=f's3-compliance-checker-{suffix}',
            Runtime='nodejs18.x',
            Role=role['Role']['Arn'],
            Handler='index.handler',
            Code={'ZipFile': zip_buffer.getvalue()},
            Timeout=300,
            MemorySize=512
        )

        assert response['FunctionName'] == f's3-compliance-checker-{suffix}'


class TestComplianceCalculations:
    """Tests for compliance percentage calculations."""

    def test_compliance_percentage_calculation(self):
        """Test compliance percentage is calculated correctly."""
        result = analyse.simulate_s3_compliance_scan()
        summary = result['summary']

        expected_percentage = (summary['compliantBuckets'] / summary['totalBuckets']) * 100
        assert summary['compliancePercentage'] == expected_percentage

    def test_violations_count_matches(self):
        """Test that violation counts match findings."""
        result = analyse.simulate_s3_compliance_scan()
        summary = result['summary']
        findings = result['findings']

        total_findings = (
            len(findings['critical']) +
            len(findings['high']) +
            len(findings['medium']) +
            len(findings['low'])
        )

        assert summary['nonCompliantBuckets'] == total_findings


class TestInfrastructureValidation:
    """Tests for infrastructure validation functions."""

    def test_required_resources_count(self, capsys):
        """Test that all required resources are validated."""
        analyse.validate_deployment()
        captured = capsys.readouterr()

        # Count [OK] occurrences
        ok_count = captured.out.count('[OK]')
        assert ok_count >= 15  # At least 15 resource validations

    def test_environment_suffix_pattern(self, capsys):
        """Test that environmentSuffix pattern is mentioned."""
        analyse.validate_security()
        captured = capsys.readouterr()
        assert 'environmentSuffix' in captured.out


class TestEventBridgeIntegration:
    """Integration tests for EventBridge functionality."""

    @mock_aws
    def test_event_rule_creation(self, setup_environment):
        """Test EventBridge rule creation."""
        events = boto3.client('events', region_name='us-east-1')
        suffix = os.environ['ENVIRONMENT_SUFFIX']

        events.put_rule(
            Name=f's3-compliance-daily-check-{suffix}',
            ScheduleExpression='rate(1 day)',
            State='ENABLED'
        )

        response = events.describe_rule(
            Name=f's3-compliance-daily-check-{suffix}'
        )

        assert response['Name'] == f's3-compliance-daily-check-{suffix}'
        assert response['ScheduleExpression'] == 'rate(1 day)'
