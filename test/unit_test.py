#!/usr/bin/env python3
"""
Unit tests for Lambda compliance checker function
Tests the business logic without requiring AWS resources
"""

import sys
import os
import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

# Import the Lambda function
import lambda_function


@pytest.fixture
def mock_aws_clients():
    """Mock AWS service clients"""
    with patch('lambda_function.config_client') as mock_config, \
         patch('lambda_function.sns_client') as mock_sns, \
         patch('lambda_function.s3_client') as mock_s3:
        yield {
            'config': mock_config,
            'sns': mock_sns,
            's3': mock_s3
        }


@pytest.fixture
def mock_env_vars():
    """Set up mock environment variables"""
    with patch.dict(os.environ, {
        'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:test-topic',
        'CONFIG_BUCKET': 'test-config-bucket',
        'ENVIRONMENT_SUFFIX': 'test',
        'LOG_LEVEL': 'INFO'
    }):
        yield


class TestLambdaHandler:
    """Test main Lambda handler function"""

    def test_handler_config_compliance_event(self, mock_aws_clients, mock_env_vars):
        """Test handler with Config compliance change event"""
        event = {
            'source': 'aws.config',
            'detail-type': 'Config Rules Compliance Change',
            'detail': {
                'configRuleName': 'test-rule',
                'newEvaluationResult': {
                    'complianceType': 'NON_COMPLIANT',
                    'evaluationResultIdentifier': {
                        'evaluationResultQualifier': {
                            'resourceType': 'AWS::S3::Bucket',
                            'resourceId': 'test-bucket'
                        }
                    },
                    'annotation': 'Test violation'
                },
                'resultRecordedTime': '2023-01-01T00:00:00Z'
            }
        }

        mock_aws_clients['sns'].publish.return_value = {'MessageId': 'test-message-id'}

        result = lambda_function.lambda_handler(event, None)

        assert result['statusCode'] == 200
        assert 'successfully' in result['body']
        mock_aws_clients['sns'].publish.assert_called_once()

    def test_handler_periodic_check_event(self, mock_aws_clients, mock_env_vars):
        """Test handler with periodic check event"""
        event = {
            'source': 'aws.events'
        }

        mock_aws_clients['config'].get_paginator.return_value.paginate.return_value = []

        result = lambda_function.lambda_handler(event, None)

        assert result['statusCode'] == 200

    def test_handler_direct_invocation(self, mock_aws_clients, mock_env_vars):
        """Test handler with direct invocation"""
        event = {}

        mock_aws_clients['config'].get_paginator.return_value.paginate.return_value = []

        result = lambda_function.lambda_handler(event, None)

        assert result['statusCode'] == 200

    def test_handler_error_handling(self, mock_aws_clients, mock_env_vars):
        """Test handler error handling"""
        event = {
            'source': 'aws.config',
            'detail': {}  # Invalid detail
        }

        # Force an exception during processing
        with patch('lambda_function.process_compliance_event', side_effect=Exception('Processing error')):
            result = lambda_function.lambda_handler(event, None)

        assert result['statusCode'] == 500


    def test_handler_exception_in_periodic_check(self, mock_aws_clients, mock_env_vars):
        """Test exception during periodic check"""
        event = {}

        with patch('lambda_function.perform_periodic_compliance_check', side_effect=Exception('Check failed')):
            result = lambda_function.lambda_handler(event, None)

        assert result['statusCode'] == 500


class TestProcessComplianceEvent:
    """Test compliance event processing"""

    def test_process_non_compliant_event(self, mock_aws_clients, mock_env_vars):
        """Test processing non-compliant resource"""
        event = {
            'detail': {
                'configRuleName': 'test-rule',
                'newEvaluationResult': {
                    'complianceType': 'NON_COMPLIANT',
                    'evaluationResultIdentifier': {
                        'evaluationResultQualifier': {
                            'resourceType': 'AWS::S3::Bucket',
                            'resourceId': 'test-bucket'
                        }
                    },
                    'annotation': 'Bucket not encrypted'
                },
                'resultRecordedTime': '2023-01-01T00:00:00Z'
            }
        }

        mock_aws_clients['sns'].publish.return_value = {'MessageId': 'test-id'}

        lambda_function.process_compliance_event(event)

        mock_aws_clients['sns'].publish.assert_called_once()
        call_args = mock_aws_clients['sns'].publish.call_args
        assert 'NON_COMPLIANT' in call_args[1]['Message']

    def test_process_compliant_event(self, mock_aws_clients, mock_env_vars):
        """Test processing compliant resource"""
        event = {
            'detail': {
                'configRuleName': 'test-rule',
                'newEvaluationResult': {
                    'complianceType': 'COMPLIANT',
                    'evaluationResultIdentifier': {
                        'evaluationResultQualifier': {
                            'resourceType': 'AWS::S3::Bucket',
                            'resourceId': 'test-bucket'
                        }
                    }
                }
            }
        }

        lambda_function.process_compliance_event(event)

        # Should not send notification for compliant resources
        mock_aws_clients['sns'].publish.assert_not_called()


class TestPeriodicComplianceCheck:
    """Test periodic compliance checks"""

    def test_periodic_check_exception(self, mock_aws_clients, mock_env_vars):
        """Test exception during periodic check"""
        mock_aws_clients['config'].get_paginator.side_effect = Exception('Config error')

        with pytest.raises(Exception):
            lambda_function.perform_periodic_compliance_check()

    def test_periodic_check_no_violations(self, mock_aws_clients, mock_env_vars):
        """Test periodic check with no violations"""
        # Mock get_all_config_rules
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [
            {'ConfigRules': [{'ConfigRuleName': 'test-rule'}]}
        ]
        mock_aws_clients['config'].get_paginator.return_value = mock_paginator

        # Mock check_rule_compliance - no violations
        with patch('lambda_function.check_rule_compliance', return_value=[]):
            lambda_function.perform_periodic_compliance_check()

        # Should not send summary notification
        mock_aws_clients['sns'].publish.assert_not_called()

    def test_periodic_check_with_violations(self, mock_aws_clients, mock_env_vars):
        """Test periodic check with violations"""
        # Mock get_all_config_rules
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [
            {'ConfigRules': [{'ConfigRuleName': 'test-rule'}]}
        ]
        mock_aws_clients['config'].get_paginator.return_value = mock_paginator

        violations = [{
            'rule_name': 'test-rule',
            'resource_type': 'AWS::S3::Bucket',
            'resource_id': 'test-bucket',
            'compliance_type': 'NON_COMPLIANT',
            'annotation': 'Test violation',
            'config_rule_invoked_time': '2023-01-01 00:00:00',
            'result_recorded_time': '2023-01-01 00:00:00'
        }]

        mock_aws_clients['sns'].publish.return_value = {'MessageId': 'test-id'}

        with patch('lambda_function.check_rule_compliance', return_value=violations):
            lambda_function.perform_periodic_compliance_check()

        # Should send summary notification
        mock_aws_clients['sns'].publish.assert_called_once()


class TestGetAllConfigRules:
    """Test retrieving Config rules"""

    def test_get_all_rules_exception(self, mock_aws_clients, mock_env_vars):
        """Test exception when retrieving rules"""
        mock_aws_clients['config'].get_paginator.side_effect = Exception('API error')

        with pytest.raises(Exception):
            lambda_function.get_all_config_rules()

    def test_get_all_rules_success(self, mock_aws_clients, mock_env_vars):
        """Test retrieving all Config rules"""
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [
            {'ConfigRules': [
                {'ConfigRuleName': 'rule1'},
                {'ConfigRuleName': 'rule2'}
            ]},
            {'ConfigRules': [
                {'ConfigRuleName': 'rule3'}
            ]}
        ]
        mock_aws_clients['config'].get_paginator.return_value = mock_paginator

        rules = lambda_function.get_all_config_rules()

        assert len(rules) == 3
        assert rules[0]['ConfigRuleName'] == 'rule1'


class TestCheckRuleCompliance:
    """Test checking rule compliance"""

    def test_check_rule_exception(self, mock_aws_clients, mock_env_vars):
        """Test exception when checking rule compliance"""
        mock_aws_clients['config'].get_paginator.side_effect = Exception('API error')

        violations = lambda_function.check_rule_compliance('test-rule')

        # Should return empty list on error
        assert len(violations) == 0

    def test_check_rule_with_violations(self, mock_aws_clients, mock_env_vars):
        """Test checking rule that has violations"""
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [
            {'EvaluationResults': [
                {
                    'EvaluationResultIdentifier': {
                        'EvaluationResultQualifier': {
                            'ResourceId': 'bucket-1',
                            'ResourceType': 'AWS::S3::Bucket'
                        }
                    },
                    'ComplianceType': 'NON_COMPLIANT',
                    'Annotation': 'Not encrypted',
                    'ConfigRuleInvokedTime': datetime(2023, 1, 1),
                    'ResultRecordedTime': datetime(2023, 1, 1)
                }
            ]}
        ]
        mock_aws_clients['config'].get_paginator.return_value = mock_paginator

        violations = lambda_function.check_rule_compliance('test-rule')

        assert len(violations) == 1
        assert violations[0]['resource_id'] == 'bucket-1'
        assert violations[0]['compliance_type'] == 'NON_COMPLIANT'

    def test_check_rule_no_violations(self, mock_aws_clients, mock_env_vars):
        """Test checking rule with no violations"""
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [
            {'EvaluationResults': []}
        ]
        mock_aws_clients['config'].get_paginator.return_value = mock_paginator

        violations = lambda_function.check_rule_compliance('test-rule')

        assert len(violations) == 0


class TestSendNotifications:
    """Test notification sending functions"""

    def test_send_compliance_notification_error(self, mock_aws_clients, mock_env_vars):
        """Test error handling in compliance notification"""
        violation = {
            'rule_name': 'test-rule',
            'resource_type': 'AWS::S3::Bucket',
            'resource_id': 'test-bucket',
            'compliance_type': 'NON_COMPLIANT',
            'timestamp': '2023-01-01T00:00:00Z',
            'annotation': 'Not encrypted'
        }

        mock_aws_clients['sns'].publish.side_effect = Exception('SNS error')

        # Should not raise exception
        lambda_function.send_compliance_notification(violation)

    def test_send_summary_notification_error(self, mock_aws_clients, mock_env_vars):
        """Test error handling in summary notification"""
        violations = [{
            'rule_name': 'rule1',
            'resource_type': 'AWS::S3::Bucket',
            'resource_id': 'bucket1',
            'compliance_type': 'NON_COMPLIANT',
            'annotation': 'Test',
            'config_rule_invoked_time': '2023-01-01 00:00:00',
            'result_recorded_time': '2023-01-01 00:00:00'
        }]

        mock_aws_clients['sns'].publish.side_effect = Exception('SNS error')

        # Should not raise exception
        lambda_function.send_summary_notification(violations)

    def test_send_error_notification_error(self, mock_aws_clients, mock_env_vars):
        """Test error handling in error notification"""
        mock_aws_clients['sns'].publish.side_effect = Exception('SNS error')

        # Should not raise exception
        lambda_function.send_error_notification('Test error')

    def test_send_compliance_notification(self, mock_aws_clients, mock_env_vars):
        """Test sending single violation notification"""
        violation = {
            'rule_name': 'test-rule',
            'resource_type': 'AWS::S3::Bucket',
            'resource_id': 'test-bucket',
            'compliance_type': 'NON_COMPLIANT',
            'timestamp': '2023-01-01T00:00:00Z',
            'annotation': 'Not encrypted'
        }

        mock_aws_clients['sns'].publish.return_value = {'MessageId': 'test-id'}

        lambda_function.send_compliance_notification(violation)

        mock_aws_clients['sns'].publish.assert_called_once()
        call_args = mock_aws_clients['sns'].publish.call_args
        assert 'test-rule' in call_args[1]['Message']
        assert 'test-bucket' in call_args[1]['Message']

    def test_send_summary_notification(self, mock_aws_clients, mock_env_vars):
        """Test sending summary notification"""
        violations = [
            {
                'rule_name': 'rule1',
                'resource_type': 'AWS::S3::Bucket',
                'resource_id': 'bucket1',
                'compliance_type': 'NON_COMPLIANT',
                'annotation': 'Test1',
                'config_rule_invoked_time': '2023-01-01 00:00:00',
                'result_recorded_time': '2023-01-01 00:00:00'
            },
            {
                'rule_name': 'rule2',
                'resource_type': 'AWS::RDS::DBInstance',
                'resource_id': 'db1',
                'compliance_type': 'NON_COMPLIANT',
                'annotation': 'Test2',
                'config_rule_invoked_time': '2023-01-01 00:00:00',
                'result_recorded_time': '2023-01-01 00:00:00'
            }
        ]

        mock_aws_clients['sns'].publish.return_value = {'MessageId': 'test-id'}

        lambda_function.send_summary_notification(violations)

        mock_aws_clients['sns'].publish.assert_called_once()
        call_args = mock_aws_clients['sns'].publish.call_args
        assert '2 Violations' in call_args[1]['Subject']

    def test_send_error_notification(self, mock_aws_clients, mock_env_vars):
        """Test sending error notification"""
        mock_aws_clients['sns'].publish.return_value = {'MessageId': 'test-id'}

        lambda_function.send_error_notification('Test error message')

        mock_aws_clients['sns'].publish.assert_called_once()
        call_args = mock_aws_clients['sns'].publish.call_args
        assert 'Test error message' in call_args[1]['Message']


class TestAnalyzeConfigSnapshot:
    """Test Config snapshot analysis"""

    def test_analyze_snapshot_success(self, mock_aws_clients, mock_env_vars):
        """Test analyzing Config snapshot"""
        mock_aws_clients['s3'].list_objects_v2.return_value = {
            'Contents': [
                {
                    'Key': 'AWSLogs/123/Config/snapshot.json',
                    'LastModified': datetime(2023, 1, 1),
                    'Size': 1024
                }
            ]
        }

        result = lambda_function.analyze_config_snapshot()

        assert result['status'] == 'success'
        assert 'latest_snapshot' in result

    def test_analyze_snapshot_no_snapshots(self, mock_aws_clients, mock_env_vars):
        """Test analyzing when no snapshots exist"""
        mock_aws_clients['s3'].list_objects_v2.return_value = {}

        result = lambda_function.analyze_config_snapshot()

        assert result['status'] == 'no_snapshots'

    def test_analyze_snapshot_error(self, mock_aws_clients, mock_env_vars):
        """Test snapshot analysis error handling"""
        mock_aws_clients['s3'].list_objects_v2.side_effect = Exception('S3 error')

        result = lambda_function.analyze_config_snapshot()

        assert result['status'] == 'error'


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=lib/lambda_function', '--cov-report=term-missing'])
