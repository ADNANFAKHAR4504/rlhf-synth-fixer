"""test_lambda_scanner_unit.py
Unit tests for scanner Lambda function.
"""

import json
import os
import pytest
from unittest.mock import patch, MagicMock, ANY
from botocore.exceptions import ClientError

# Set environment variables before importing the module
os.environ['AUDIT_BUCKET'] = 'test-audit-bucket'
os.environ['ALERT_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
os.environ['ENVIRONMENT_SUFFIX'] = 'test'

# Import after setting environment variables
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda/scanner'))
import scanner


class TestScannerLambda:
    """Unit tests for scanner Lambda function."""

    @patch('scanner.sts_client')
    def test_assume_role_success(self, mock_sts):
        """Test successful role assumption."""
        mock_sts.assume_role.return_value = {
            'Credentials': {
                'AccessKeyId': 'AKIA...',
                'SecretAccessKey': 'secret',
                'SessionToken': 'token'
            }
        }

        result = scanner.assume_role('123456789012', 'TestRole')

        assert result is not None
        assert 'AccessKeyId' in result
        mock_sts.assume_role.assert_called_once()

    @patch('scanner.sts_client')
    def test_assume_role_failure(self, mock_sts):
        """Test role assumption failure."""
        mock_sts.assume_role.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'AssumeRole'
        )

        result = scanner.assume_role('123456789012', 'TestRole')

        assert result is None

    @patch('scanner.config_client')
    def test_get_compliance_summary_no_credentials(self, mock_config):
        """Test getting compliance summary without cross-account credentials."""
        mock_config.describe_config_rules.return_value = {
            'ConfigRules': [
                {'ConfigRuleName': 'test-rule', 'ConfigRuleId': 'rule-123'}
            ]
        }
        mock_config.describe_compliance_by_config_rule.return_value = {
            'ComplianceByConfigRules': [
                {
                    'Compliance': {
                        'ComplianceType': 'COMPLIANT'
                    }
                }
            ]
        }

        result = scanner.get_compliance_summary()

        assert result['compliant'] == 1
        assert result['non_compliant'] == 0
        assert len(result['rules']) == 1

    @patch('scanner.config_client')
    def test_get_compliance_summary_with_credentials(self, mock_config):
        """Test getting compliance summary with cross-account credentials."""
        credentials = {
            'AccessKeyId': 'AKIA...',
            'SecretAccessKey': 'secret',
            'SessionToken': 'token'
        }

        with patch('scanner.boto3.client') as mock_boto3_client:
            mock_cross_config = MagicMock()
            mock_boto3_client.return_value = mock_cross_config

            mock_cross_config.describe_config_rules.return_value = {
                'ConfigRules': [
                    {'ConfigRuleName': 'test-rule', 'ConfigRuleId': 'rule-123'}
                ]
            }
            mock_cross_config.describe_compliance_by_config_rule.return_value = {
                'ComplianceByConfigRules': [
                    {
                        'Compliance': {
                            'ComplianceType': 'NON_COMPLIANT'
                        }
                    }
                ]
            }

            result = scanner.get_compliance_summary(credentials)

            assert result['non_compliant'] == 1
            assert result['compliant'] == 0

    @patch('scanner.config_client')
    def test_get_compliance_summary_mixed_statuses(self, mock_config):
        """Test compliance summary with mixed compliance statuses."""
        mock_config.describe_config_rules.return_value = {
            'ConfigRules': [
                {'ConfigRuleName': 'rule-1', 'ConfigRuleId': 'id-1'},
                {'ConfigRuleName': 'rule-2', 'ConfigRuleId': 'id-2'},
                {'ConfigRuleName': 'rule-3', 'ConfigRuleId': 'id-3'},
                {'ConfigRuleName': 'rule-4', 'ConfigRuleId': 'id-4'}
            ]
        }

        compliance_responses = [
            {'ComplianceByConfigRules': [{'Compliance': {'ComplianceType': 'COMPLIANT'}}]},
            {'ComplianceByConfigRules': [{'Compliance': {'ComplianceType': 'NON_COMPLIANT'}}]},
            {'ComplianceByConfigRules': [{'Compliance': {'ComplianceType': 'NOT_APPLICABLE'}}]},
            {'ComplianceByConfigRules': [{'Compliance': {'ComplianceType': 'INSUFFICIENT_DATA'}}]}
        ]

        mock_config.describe_compliance_by_config_rule.side_effect = compliance_responses

        result = scanner.get_compliance_summary()

        assert result['compliant'] == 1
        assert result['non_compliant'] == 1
        assert result['not_applicable'] == 1
        assert result['insufficient_data'] == 1
        assert len(result['rules']) == 4

    @patch('scanner.config_client')
    def test_get_compliance_summary_api_error(self, mock_config):
        """Test compliance summary with API error."""
        mock_config.describe_config_rules.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'DescribeConfigRules'
        )

        result = scanner.get_compliance_summary()

        assert result['compliant'] == 0
        assert result['non_compliant'] == 0
        assert len(result['rules']) == 0

    @patch('scanner.s3_client')
    def test_save_scan_results_success(self, mock_s3):
        """Test successful save of scan results to S3."""
        scan_data = {'test': 'data'}

        result = scanner.save_scan_results(scan_data)

        assert result is not None
        assert result.startswith('scans/')
        mock_s3.put_object.assert_called_once()

    @patch('scanner.s3_client')
    def test_save_scan_results_failure(self, mock_s3):
        """Test failed save of scan results to S3."""
        mock_s3.put_object.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'PutObject'
        )

        scan_data = {'test': 'data'}
        result = scanner.save_scan_results(scan_data)

        assert result is None

    @patch('scanner.sns_client')
    def test_send_alert_success(self, mock_sns):
        """Test successful alert sending."""
        scanner.send_alert('Test Subject', 'Test Message')

        mock_sns.publish.assert_called_once_with(
            TopicArn=os.environ['ALERT_TOPIC_ARN'],
            Subject='Test Subject',
            Message='Test Message'
        )

    @patch('scanner.sns_client')
    def test_send_alert_failure(self, mock_sns):
        """Test alert sending failure."""
        mock_sns.publish.side_effect = ClientError(
            {'Error': {'Code': 'NotFound', 'Message': 'Topic not found'}},
            'Publish'
        )

        # Should not raise exception
        scanner.send_alert('Test Subject', 'Test Message')

    @patch('scanner.events_client')
    def test_trigger_report_generation_success(self, mock_events):
        """Test successful report generation trigger."""
        scanner.trigger_report_generation('scans/2024-01-01/scan.json')

        mock_events.put_events.assert_called_once()
        call_args = mock_events.put_events.call_args
        assert call_args[1]['Entries'][0]['Source'] == 'compliance.audit'
        assert call_args[1]['Entries'][0]['DetailType'] == 'Compliance Scan Complete'

    @patch('scanner.events_client')
    def test_trigger_report_generation_failure(self, mock_events):
        """Test report generation trigger failure."""
        mock_events.put_events.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Invalid event'}},
            'PutEvents'
        )

        # Should not raise exception
        scanner.trigger_report_generation('scans/2024-01-01/scan.json')

    @patch('scanner.trigger_report_generation')
    @patch('scanner.send_alert')
    @patch('scanner.save_scan_results')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_single_account_compliant(
        self, mock_sts, mock_get_compliance, mock_save, mock_send_alert, mock_trigger
    ):
        """Test handler with single compliant account."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_get_compliance.return_value = {
            'compliant': 10,
            'non_compliant': 0,
            'not_applicable': 0,
            'insufficient_data': 0,
            'rules': []
        }
        mock_save.return_value = 'scans/2024-01-01/scan.json'

        event = {}
        context = {}

        result = scanner.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['total_non_compliant'] == 0
        mock_send_alert.assert_not_called()
        mock_trigger.assert_called_once()

    @patch('scanner.trigger_report_generation')
    @patch('scanner.send_alert')
    @patch('scanner.save_scan_results')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_single_account_non_compliant(
        self, mock_sts, mock_get_compliance, mock_save, mock_send_alert, mock_trigger
    ):
        """Test handler with single non-compliant account."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_get_compliance.return_value = {
            'compliant': 5,
            'non_compliant': 3,
            'not_applicable': 0,
            'insufficient_data': 0,
            'rules': []
        }
        mock_save.return_value = 'scans/2024-01-01/scan.json'

        event = {}
        context = {}

        result = scanner.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['total_non_compliant'] == 3
        mock_send_alert.assert_called_once()
        mock_trigger.assert_called_once()

    @patch('scanner.trigger_report_generation')
    @patch('scanner.send_alert')
    @patch('scanner.save_scan_results')
    @patch('scanner.assume_role')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_cross_account_scan(
        self, mock_sts, mock_get_compliance, mock_assume_role,
        mock_save, mock_send_alert, mock_trigger
    ):
        """Test handler with cross-account scanning."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}

        # First call for current account, second for target account
        mock_get_compliance.side_effect = [
            {
                'compliant': 10,
                'non_compliant': 0,
                'not_applicable': 0,
                'insufficient_data': 0,
                'rules': []
            },
            {
                'compliant': 8,
                'non_compliant': 2,
                'not_applicable': 0,
                'insufficient_data': 0,
                'rules': []
            }
        ]

        mock_assume_role.return_value = {
            'AccessKeyId': 'AKIA...',
            'SecretAccessKey': 'secret',
            'SessionToken': 'token'
        }

        mock_save.return_value = 'scans/2024-01-01/scan.json'

        event = {
            'detail': {
                'target_accounts': [
                    {'account_id': '999888777666', 'role_name': 'ComplianceAuditRole'}
                ]
            }
        }
        context = {}

        result = scanner.handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['total_non_compliant'] == 2
        mock_assume_role.assert_called_once()
        mock_send_alert.assert_called_once()

    @patch('scanner.save_scan_results')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_save_failure_no_report_trigger(
        self, mock_sts, mock_get_compliance, mock_save
    ):
        """Test handler when save fails, report is not triggered."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
        mock_get_compliance.return_value = {
            'compliant': 10,
            'non_compliant': 0,
            'not_applicable': 0,
            'insufficient_data': 0,
            'rules': []
        }
        mock_save.return_value = None

        with patch('scanner.trigger_report_generation') as mock_trigger:
            event = {}
            context = {}

            result = scanner.handler(event, context)

            assert result['statusCode'] == 200
            mock_trigger.assert_not_called()

    @patch('scanner.config_client')
    def test_get_compliance_summary_with_exception_handling(self, mock_config):
        """Test compliance summary with exception in rule-specific query."""
        mock_config.describe_config_rules.return_value = {
            'ConfigRules': [
                {'ConfigRuleName': 'rule-1', 'ConfigRuleId': 'id-1'},
                {'ConfigRuleName': 'rule-2', 'ConfigRuleId': 'id-2'}
            ]
        }

        # First call succeeds, second call fails
        mock_config.describe_compliance_by_config_rule.side_effect = [
            {
                'ComplianceByConfigRules': [
                    {'Compliance': {'ComplianceType': 'COMPLIANT'}}
                ]
            },
            ClientError(
                {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
                'DescribeComplianceByConfigRule'
            )
        ]

        result = scanner.get_compliance_summary()

        # Should have partial results from first rule
        assert result['compliant'] == 1
        assert len(result['rules']) == 1

    @patch('scanner.trigger_report_generation')
    @patch('scanner.send_alert')
    @patch('scanner.save_scan_results')
    @patch('scanner.assume_role')
    @patch('scanner.get_compliance_summary')
    @patch('scanner.sts_client')
    def test_handler_cross_account_assume_role_failure(
        self, mock_sts, mock_get_compliance, mock_assume_role,
        mock_save, mock_send_alert, mock_trigger
    ):
        """Test handler when cross-account assume role fails."""
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}

        # Only current account scan succeeds
        mock_get_compliance.return_value = {
            'compliant': 10,
            'non_compliant': 0,
            'not_applicable': 0,
            'insufficient_data': 0,
            'rules': []
        }

        # Assume role fails
        mock_assume_role.return_value = None

        mock_save.return_value = 'scans/2024-01-01/scan.json'

        event = {
            'detail': {
                'target_accounts': [
                    {'account_id': '999888777666', 'role_name': 'ComplianceAuditRole'}
                ]
            }
        }
        context = {}

        result = scanner.handler(event, context)

        # Should still succeed with only current account
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['total_non_compliant'] == 0
        mock_assume_role.assert_called_once()
        # get_compliance_summary should only be called once (for current account)
        assert mock_get_compliance.call_count == 1
