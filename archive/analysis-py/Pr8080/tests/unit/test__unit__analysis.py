"""
Unit Tests for AWS Infrastructure Analysis Script
Tests InfrastructureAnalyzer class in isolation.
"""

import json
import os
import sys
from datetime import datetime, timezone
from unittest.mock import MagicMock, call, patch

import pytest
from botocore.exceptions import ClientError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "lib"))
from analyse import InfrastructureAnalyzer  # noqa: E402


def _build_infrastructure_analyzer(mock_boto):
    """Helper to build InfrastructureAnalyzer with mocked clients."""
    mock_boto.return_value = MagicMock()
    return InfrastructureAnalyzer(region="us-east-1")


class TestInfrastructureAnalyzer:
    """Test suite for InfrastructureAnalyzer class."""

    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://localhost:5000"})
    @patch("analyse.boto_client")
    def test_initialization_invokes_all_clients(self, mock_boto):
        """Test that analyzer initializes with all required AWS clients."""
        _ = InfrastructureAnalyzer(region="us-east-1")
        call_names = [c.args[0] for c in mock_boto.call_args_list]
        assert call_names == ["config", "s3", "dynamodb", "sns", "ssm", "sts", "cloudwatch"]

    @patch("analyse.boto_client")
    def test_load_baseline_from_ssm_success(self, mock_boto):
        """Test loading baseline configuration from SSM Parameter Store."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        baseline_data = {
            'source': 'ssm_parameter',
            'timestamp': '2024-01-01T00:00:00Z',
            'resources': {'resource-1': {'type': 'AWS::S3::Bucket'}}
        }
        
        analyzer.clients['ssm'].get_parameter.return_value = {
            'Parameter': {'Value': json.dumps(baseline_data)}
        }
        
        result = analyzer.load_baseline_from_ssm('/config/baseline')
        
        assert result == baseline_data
        assert result['source'] == 'ssm_parameter'
        assert 'resource-1' in result['resources']

    @patch("analyse.boto_client")
    def test_load_baseline_from_ssm_not_found(self, mock_boto):
        """Test handling of missing SSM parameter."""
        from botocore.exceptions import ClientError
        
        analyzer = _build_infrastructure_analyzer(mock_boto)
        analyzer.clients['ssm'].get_parameter.side_effect = ClientError(
            {'Error': {'Code': 'ParameterNotFound', 'Message': 'Not found'}},
            'GetParameter'
        )
        
        result = analyzer.load_baseline_from_ssm('/config/baseline')
        
        assert result is None

    @patch("analyse.boto_client")
    def test_fetch_current_configurations(self, mock_boto):
        """Test fetching current resource configurations from AWS Config."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        analyzer.clients['config'].list_discovered_resources.return_value = {
            'resourceIdentifiers': [
                {'resourceId': 'bucket-1', 'resourceType': 'AWS::S3::Bucket'}
            ]
        }
        
        analyzer.clients['config'].batch_get_resource_config.return_value = {
            'baseConfigurationItems': [
                {
                    'resourceId': 'bucket-1',
                    'configuration': '{"BucketName": "test-bucket"}',
                    'configurationItemCaptureTime': datetime.now(timezone.utc),
                    'configurationStateId': 'state-1',
                    'arn': 'arn:aws:s3:::test-bucket',
                    'resourceCreationTime': datetime.now(timezone.utc)
                }
            ]
        }
        
        result = analyzer.fetch_current_configurations(['AWS::S3::Bucket'])
        
        assert 'bucket-1' in result
        assert result['bucket-1']['type'] == 'AWS::S3::Bucket'

    @patch("analyse.boto_client")
    def test_calculate_configuration_drift(self, mock_boto):
        """Test drift calculation between baseline and current configurations."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        baseline = {
            'resources': {
                'resource-1': {
                    'type': 'AWS::S3::Bucket',
                    'configuration': {'Versioning': 'Disabled'}
                }
            }
        }
        
        current = {
            'resource-1': {
                'type': 'AWS::S3::Bucket',
                'configuration': {'Versioning': 'Enabled'}
            }
        }
        
        result = analyzer.calculate_configuration_drift(baseline, current)
        
        assert result['total_resources'] == 1
        assert len(result['changed_resources']) == 1
        assert 'resource-1' in result['changed_resources']
        assert result['drift_percentage'] > 0

    @patch("analyse.boto_client")
    def test_evaluate_compliance_s3_versioning(self, mock_boto):
        """Test S3 bucket versioning compliance check."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        configs = {
            'bucket-1': {
                'type': 'AWS::S3::Bucket',
                'configuration': {
                    'BucketVersioningConfiguration': {'Status': 'Enabled'}
                }
            }
        }
        
        result = analyzer.evaluate_compliance(configs)
        
        assert result['total_checks'] > 0
        s3_findings = [f for f in result['findings'] if f['resource_id'] == 'bucket-1']
        versioning_check = [f for f in s3_findings if f['check_name'] == 'S3_VERSIONING_ENABLED']
        assert len(versioning_check) > 0
        assert versioning_check[0]['status'] == 'PASS'

    @patch("analyse.boto_client")
    def test_evaluate_compliance_dynamodb_billing(self, mock_boto):
        """Test DynamoDB on-demand billing compliance check."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        configs = {
            'table-1': {
                'type': 'AWS::DynamoDB::Table',
                'configuration': {
                    'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'}
                }
            }
        }
        
        result = analyzer.evaluate_compliance(configs)
        
        dynamodb_findings = [f for f in result['findings'] if f['resource_type'] == 'DYNAMODB_TABLE']
        assert len(dynamodb_findings) > 0
        assert dynamodb_findings[0]['status'] == 'PASS'

    @patch("analyse.boto_client")
    def test_evaluate_compliance_lambda_memory(self, mock_boto):
        """Test Lambda function memory compliance check."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        configs = {
            'analysis-function': {
                'type': 'AWS::Lambda::Function',
                'configuration': {
                    'MemorySize': 3072,
                    'Timeout': 300
                }
            }
        }
        
        result = analyzer.evaluate_compliance(configs)
        
        lambda_findings = [f for f in result['findings'] if 'analysis' in f['resource_id'].lower()]
        memory_check = [f for f in lambda_findings if 'MEMORY' in f['check_name']]
        assert len(memory_check) > 0
        assert memory_check[0]['status'] == 'PASS'

    @patch("analyse.boto_client")
    def test_generate_analysis_report(self, mock_boto):
        """Test generation of comprehensive analysis report."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        drift_analysis = {
            'total_resources': 10,
            'baseline_resources': 8,
            'changed_resources': ['res-1', 'res-2'],
            'added_resources': ['res-3'],
            'removed_resources': [],
            'drift_details': {},
            'drift_percentage': 20.0
        }
        
        compliance_results = {
            'total_checks': 20,
            'passed_checks': 18,
            'failed_checks': 2,
            'checks_performed': ['S3_VERSIONING_ENABLED'],
            'findings': []
        }
        
        caller_identity = {'Arn': 'arn:aws:sts::123456789012:assumed-role/test', 'Account': '123456789012'}
        
        report = analyzer.generate_analysis_report(
            'run-123', drift_analysis, compliance_results, 'ssm_parameter', caller_identity
        )
        
        assert report['metadata']['run_id'] == 'run-123'
        assert report['drift_analysis']['summary']['drift_percentage'] == 20.0
        assert report['compliance']['summary']['total_checks'] == 20
        assert report['compliance']['summary']['compliance_percentage'] == 90.0

    @patch("analyse.boto_client")
    def test_write_report_to_s3(self, mock_boto):
        """Test writing analysis report to S3."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        report = {
            'metadata': {'run_id': 'run-123'},
            'drift_analysis': {'summary': {'drift_percentage': 15.0}},
            'compliance': {'summary': {'compliance_percentage': 85.0}}
        }
        
        analyzer.clients['s3'].put_object.return_value = {'ETag': 'etag-123'}
        
        result = analyzer.write_report_to_s3('test-bucket', report)
        
        assert result is not None
        assert 'run-123' in result
        analyzer.clients['s3'].put_object.assert_called_once()

    @patch("analyse.boto_client")
    def test_derive_baseline_from_config(self, mock_boto):
        """Test deriving baseline from Config history when SSM is unavailable."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        analyzer.clients['config'].list_discovered_resources.return_value = {
            'resourceIdentifiers': [
                {'resourceId': 'bucket-1', 'resourceType': 'AWS::S3::Bucket'}
            ]
        }
        
        analyzer.clients['config'].get_resource_config_history.return_value = {
            'configurationItems': [
                {
                    'configuration': '{"BucketName": "test-bucket"}',
                    'configurationItemCaptureTime': datetime.now(timezone.utc)
                }
            ]
        }
        
        result = analyzer.derive_baseline_from_config(['AWS::S3::Bucket'])
        
        assert 'bucket-1' in result['resources']
        assert result['source'] == 'config_history'

    @patch("analyse.boto_client")
    def test_write_drift_to_dynamodb(self, mock_boto):
        """Test writing drift records to DynamoDB."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        report = {
            'metadata': {
                'run_id': 'run-123',
                'timestamp': '2024-01-01T00:00:00Z'
            },
            'drift_analysis': {
                'changed_resources': ['res-1', 'res-2'],
                'summary': {
                    'drift_percentage': 25.0,
                    'total_resources': 10,
                    'changed_resources_count': 2
                },
                'detailed_changes': {
                    'res-1': {'type': 'S3', 'changes': []},
                    'res-2': {'type': 'EC2', 'changes': []}
                }
            },
            'compliance': {
                'summary': {
                    'compliance_percentage': 80.0
                }
            }
        }
        
        analyzer.clients['dynamodb'].batch_write_item.return_value = {}
        
        # Method doesn't return value, just verify it was called
        analyzer.write_drift_to_dynamodb('test-table', report)
        analyzer.clients['dynamodb'].batch_write_item.assert_called()

    @patch("analyse.boto_client")
    def test_send_drift_alert(self, mock_boto):
        """Test sending SNS alert when drift exceeds threshold."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        report = {
            'metadata': {'run_id': 'run-123', 'timestamp': '2024-01-01T00:00:00Z'},
            'drift_analysis': {
                'changed_resources': ['res-1', 'res-2', 'res-3', 'res-4', 'res-5'],
                'summary': {
                    'drift_percentage': 20.0,
                    'changed_resources_count': 5,
                    'total_resources': 10,
                    'added_resources_count': 2,
                    'removed_resources_count': 1
                }
            },
            'compliance': {
                'summary': {
                    'passed': 8,
                    'total_checks': 10,
                    'compliance_percentage': 80.0
                }
            }
        }
        
        analyzer.clients['sns'].publish.return_value = {'MessageId': 'msg-123'}
        
        result = analyzer.send_drift_alert('arn:aws:sns:us-east-1:123456789012:alerts', report, 'compliance-reports/key')
        
        assert result is True
        analyzer.clients['sns'].publish.assert_called_once()

    @patch("analyse.boto_client")
    def test_evaluate_s3_lifecycle_compliance(self, mock_boto):
        """Test S3 lifecycle rule compliance check."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        analyzer.clients['s3'].get_bucket_lifecycle_configuration.return_value = {
            'Rules': [{'Status': 'Enabled'}]
        }
        
        configs = {
            'bucket-1': {
                'type': 'AWS::S3::Bucket',
                'configuration': {'BucketName': 'test-bucket'}
            }
        }
        
        result = analyzer.evaluate_compliance(configs)
        
        lifecycle_findings = [f for f in result['findings'] if 'LIFECYCLE' in f['check_name']]
        assert len(lifecycle_findings) > 0

    @patch("analyse.boto_client")
    def test_calculate_drift_with_added_resources(self, mock_boto):
        """Test drift calculation when new resources are added."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        baseline = {'resources': {}}
        current = {
            'new-resource': {
                'type': 'AWS::S3::Bucket',
                'configuration': {'BucketName': 'new-bucket'}
            }
        }
        
        result = analyzer.calculate_configuration_drift(baseline, current)
        
        assert len(result['added_resources']) == 1
        assert 'new-resource' in result['added_resources']

    @patch("analyse.boto_client")
    def test_calculate_drift_with_removed_resources(self, mock_boto):
        """Test drift calculation when resources are removed."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        baseline = {
            'resources': {
                'old-resource': {
                    'type': 'AWS::S3::Bucket',
                    'configuration': {'BucketName': 'old-bucket'}
                }
            }
        }
        current = {}
        
        result = analyzer.calculate_configuration_drift(baseline, current)
        
        assert len(result['removed_resources']) == 1
        assert 'old-resource' in result['removed_resources']

    @patch("analyse.boto_client")
    def test_s3_write_with_error_handling(self, mock_boto):
        """Test S3 write error handling."""
        from botocore.exceptions import ClientError
        
        analyzer = _build_infrastructure_analyzer(mock_boto)
        analyzer.clients['s3'].put_object.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'PutObject'
        )
        
        report = {'metadata': {'run_id': 'run-123'}}
        result = analyzer.write_report_to_s3('test-bucket', report)
        
        assert result is None

    @patch("analyse.boto_client")
    def test_dynamodb_write_with_error_handling(self, mock_boto):
        """Test DynamoDB write error handling."""
        from botocore.exceptions import ClientError
        
        analyzer = _build_infrastructure_analyzer(mock_boto)
        analyzer.clients['dynamodb'].batch_write_item.side_effect = ClientError(
            {'Error': {'Code': 'ProvisionedThroughputExceededException'}},
            'BatchWriteItem'
        )
        
        report = {
            'metadata': {
                'run_id': 'run-123',
                'timestamp': '2024-01-01T00:00:00Z'
            },
            'drift_analysis': {
                'changed_resources': ['res-1'],
                'summary': {
                    'drift_percentage': 10.0,
                    'total_resources': 10,
                    'changed_resources_count': 1
                },
                'detailed_changes': {}
            },
            'compliance': {
                'summary': {
                    'compliance_percentage': 90.0
                }
            }
        }
        
        # Should raise the ClientError
        with pytest.raises(ClientError):
            analyzer.write_drift_to_dynamodb('test-table', report)

    @patch("analyse.boto_client")
    def test_sns_alert_with_error_handling(self, mock_boto):
        """Test SNS alert error handling."""
        from botocore.exceptions import ClientError
        
        analyzer = _build_infrastructure_analyzer(mock_boto)
        analyzer.clients['sns'].publish.side_effect = ClientError(
            {'Error': {'Code': 'NotFound'}},
            'Publish'
        )
        
        report = {'metadata': {'run_id': 'run-123'}, 'drift_analysis': {'summary': {}}}
        result = analyzer.send_drift_alert('arn:topic', report, 's3://key')
        
        assert result is False

    @patch("analyse.boto_client")
    def test_fetch_configurations_with_multiple_resources(self, mock_boto):
        """Test fetching configurations with multiple resources."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        # Mock response with multiple resources
        analyzer.clients['config'].list_discovered_resources.return_value = {
            'resourceIdentifiers': [
                {'resourceId': 'res-1', 'resourceType': 'AWS::S3::Bucket'},
                {'resourceId': 'res-2', 'resourceType': 'AWS::S3::Bucket'}
            ]
        }
        
        analyzer.clients['config'].batch_get_resource_config.return_value = {
            'baseConfigurationItems': [
                {
                    'resourceId': 'res-1',
                    'configuration': '{"BucketName": "bucket-1"}',
                    'configurationItemCaptureTime': datetime.now(timezone.utc),
                    'configurationStateId': 'state-1',
                    'arn': 'arn:aws:s3:::bucket-1',
                    'resourceCreationTime': datetime.now(timezone.utc)
                },
                {
                    'resourceId': 'res-2',
                    'configuration': '{"BucketName": "bucket-2"}',
                    'configurationItemCaptureTime': datetime.now(timezone.utc),
                    'configurationStateId': 'state-2',
                    'arn': 'arn:aws:s3:::bucket-2',
                    'resourceCreationTime': datetime.now(timezone.utc)
                }
            ]
        }
        
        result = analyzer.fetch_current_configurations(['AWS::S3::Bucket'])
        
        assert 'res-1' in result
        assert 'res-2' in result

    @patch("analyse.boto_client")
    def test_evaluate_eventbridge_compliance(self, mock_boto):
        """Test EventBridge rule compliance check."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        analyzer.clients['cloudwatch'].describe_rule.return_value = {
            'ScheduleExpression': 'rate(6 hours)',
            'State': 'ENABLED'
        }
        
        configs = {
            'analysis-rule': {
                'type': 'AWS::Events::Rule',
                'configuration': {
                    'Name': 'analysis-schedule',
                    'ScheduleExpression': 'rate(6 hours)'
                }
            }
        }
        
        result = analyzer.evaluate_compliance(configs)
        assert 'findings' in result

    @patch("analyse.boto_client")
    def test_evaluate_sns_subscriptions(self, mock_boto):
        """Test SNS topic subscription compliance check."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        analyzer.clients['sns'].list_subscriptions_by_topic.return_value = {
            'Subscriptions': [
                {'Endpoint': 'email@example.com', 'Protocol': 'email'}
            ]
        }
        
        configs = {
            'alerts-topic': {
                'type': 'AWS::SNS::Topic',
                'configuration': {
                    'TopicArn': 'arn:aws:sns:us-east-1:123456789012:alerts'
                }
            }
        }
        
        result = analyzer.evaluate_compliance(configs)
        assert 'findings' in result

    @patch("analyse.boto_client")
    def test_derive_baseline_with_error(self, mock_boto):
        """Test derive_baseline_from_config with errors."""
        from botocore.exceptions import ClientError
        
        analyzer = _build_infrastructure_analyzer(mock_boto)
        analyzer.clients['config'].list_discovered_resources.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'ListDiscoveredResources'
        )
        
        result = analyzer.derive_baseline_from_config(['AWS::S3::Bucket'])
        
        # Should return empty baseline on error
        assert result['source'] == 'config_history'
        assert len(result['resources']) == 0

    @patch("analyse.boto_client")
    def test_fetch_configurations_with_error(self, mock_boto):
        """Test fetch_current_configurations handles errors gracefully."""
        from botocore.exceptions import ClientError
        
        analyzer = _build_infrastructure_analyzer(mock_boto)
        analyzer.clients['config'].list_discovered_resources.side_effect = ClientError(
            {'Error': {'Code': 'ThrottlingException'}},
            'ListDiscoveredResources'
        )
        
        result = analyzer.fetch_current_configurations(['AWS::S3::Bucket'])
        
        # Should return empty dict on error
        assert result == {}

    @patch("analyse.boto_client")
    def test_compare_configurations_type_change(self, mock_boto):
        """Test _compare_configurations with type changes."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        baseline = {"key": "value"}
        current = {"key": 123}
        
        diffs = analyzer._compare_configurations(baseline, current)
        
        # Should detect type change at root level
        assert len(diffs) > 0
        assert any(d.get('type') == 'type_change' for d in diffs)

    @patch("analyse.boto_client")
    def test_compare_configurations_list_size_change(self, mock_boto):
        """Test _compare_configurations with list size changes."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        baseline = [1, 2, 3]
        current = [1, 2]
        
        diffs = analyzer._compare_configurations(baseline, current, path="items")
        
        # Should detect list size change
        assert len(diffs) > 0
        assert any(d.get('type') == 'list_size_change' for d in diffs)

    @patch("analyse.boto_client")
    def test_compare_configurations_list_same_size(self, mock_boto):
        """Test _compare_configurations with same size lists but different values."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        baseline = [{"id": "1", "value": "a"}, {"id": "2", "value": "b"}]
        current = [{"id": "1", "value": "x"}, {"id": "2", "value": "y"}]
        
        diffs = analyzer._compare_configurations(baseline, current, path="items")
        
        # Should detect value changes in list items
        assert len(diffs) > 0
        assert any('value_change' in d.get('type', '') for d in diffs)

    @patch("analyse.boto_client")
    def test_evaluate_sns_email_subscription_warning(self, mock_boto):
        """Test SNS compliance when subscriptions exist but no email."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        current_configs = {
            'sns-topic-1': {
                'type': 'AWS::SNS::Topic',
                'arn': 'arn:aws:sns:us-east-1:123456789012:topic1'
            }
        }
        
        # Mock SNS subscriptions without email
        analyzer.clients['sns'].list_subscriptions_by_topic.return_value = {
            'Subscriptions': [
                {'Protocol': 'sms', 'Endpoint': '+1234567890'},
                {'Protocol': 'lambda', 'Endpoint': 'arn:aws:lambda:...'}
            ]
        }
        
        result = analyzer.evaluate_compliance(current_configs)
        
        # Should have warning about no email subscriptions
        assert 'findings' in result
        warnings = [f for f in result['findings'] if f.get('status') == 'WARNING']
        assert len(warnings) > 0
        assert any('email' in f.get('message', '').lower() for f in warnings)

    @patch("analyse.boto_client")
    def test_evaluate_sns_subscription_error(self, mock_boto):
        """Test SNS compliance check with API error."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        current_configs = {
            'sns-topic-1': {
                'type': 'AWS::SNS::Topic',
                'arn': 'arn:aws:sns:us-east-1:123456789012:topic1'
            }
        }
        
        # Mock SNS API error
        analyzer.clients['sns'].list_subscriptions_by_topic.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Not authorized'}},
            'list_subscriptions_by_topic'
        )
        
        result = analyzer.evaluate_compliance(current_configs)
        
        # Should have error finding
        assert 'findings' in result
        errors = [f for f in result['findings'] if f.get('status') == 'ERROR']
        assert len(errors) > 0


class TestInfrastructureAnalyzerEndToEnd:
    """End-to-end unit tests with fully mocked clients."""

    @patch("analyse.boto_client")
    def test_perform_analysis_complete_workflow(self, mock_boto):
        """Test complete perform_analysis workflow with mocked services."""
        # Create mock clients
        config_client = MagicMock()
        s3_client = MagicMock()
        dynamodb_client = MagicMock()
        sns_client = MagicMock()
        ssm_client = MagicMock()
        sts_client = MagicMock()
        cloudwatch_client = MagicMock()
        
        sts_client.get_caller_identity.return_value = {
            'Arn': 'arn:aws:sts::123456789012:assumed-role/test',
            'Account': '123456789012'
        }
        
        # Mock SSM baseline (not found, will fall back to Config)
        from botocore.exceptions import ClientError
        ssm_client.get_parameter.side_effect = ClientError(
            {'Error': {'Code': 'ParameterNotFound'}}, 'GetParameter'
        )
        
        # Mock Config resources
        config_client.list_discovered_resources.return_value = {'resourceIdentifiers': []}
        config_client.batch_get_resource_config.return_value = {'baseConfigurationItems': []}
        
        # Mock S3 put
        s3_client.put_object.return_value = {'ETag': 'etag-123'}
        
        def boto_side_effect(service, region):
            return {
                'config': config_client,
                's3': s3_client,
                'dynamodb': dynamodb_client,
                'sns': sns_client,
                'ssm': ssm_client,
                'sts': sts_client,
                'cloudwatch': cloudwatch_client
            }[service]
        
        mock_boto.side_effect = boto_side_effect
        
        analyzer = InfrastructureAnalyzer(region="us-east-1")
        result = analyzer.perform_analysis()
        
        assert result['metadata']['account_id'] == '123456789012'
        assert 'drift_analysis' in result
        assert 'compliance' in result
        assert 's3_report_location' in result['metadata'] or 'errors' in result

    @patch("analyse.boto_client")
    def test_perform_analysis_with_drift_alert(self, mock_boto):
        """Test perform_analysis triggers alert when drift exceeds threshold."""
        from botocore.exceptions import ClientError

        # Create mock clients
        config_client = MagicMock()
        s3_client = MagicMock()
        dynamodb_client = MagicMock()
        sns_client = MagicMock()
        ssm_client = MagicMock()
        sts_client = MagicMock()
        cloudwatch_client = MagicMock()
        
        sts_client.get_caller_identity.return_value = {
            'Arn': 'arn:aws:sts::123456789012:user/test',
            'Account': '123456789012'
        }
        
        # Mock SSM with baseline
        ssm_client.get_parameter.return_value = {
            'Parameter': {
                'Value': json.dumps({
                    'source': 'ssm',
                    'resources': {}
                })
            }
        }
        
        # Mock Config with resources (will trigger high drift)
        config_client.list_discovered_resources.return_value = {
            'resourceIdentifiers': [
                {'resourceId': 'bucket-1', 'resourceType': 'AWS::S3::Bucket'}
            ]
        }
        
        config_client.batch_get_resource_config.return_value = {
            'baseConfigurationItems': [
                {
                    'resourceId': 'bucket-1',
                    'configuration': '{"BucketName": "test"}',
                    'configurationItemCaptureTime': datetime.now(timezone.utc),
                    'configurationStateId': 'state-1',
                    'arn': 'arn:aws:s3:::test',
                    'resourceCreationTime': datetime.now(timezone.utc)
                }
            ]
        }
        
        s3_client.put_object.return_value = {'ETag': 'etag-123'}
        s3_client.get_bucket_versioning.return_value = {'Status': 'Enabled'}
        s3_client.get_bucket_lifecycle_configuration.return_value = {'Rules': []}
        dynamodb_client.batch_write_item.return_value = {}
        sns_client.publish.return_value = {'MessageId': 'msg-123'}
        
        def boto_side_effect(service, region):
            return {
                'config': config_client,
                's3': s3_client,
                'dynamodb': dynamodb_client,
                'sns': sns_client,
                'ssm': ssm_client,
                'sts': sts_client,
                'cloudwatch': cloudwatch_client
            }[service]
        
        mock_boto.side_effect = boto_side_effect
        
        with patch.dict(os.environ, {'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:alerts'}):
            analyzer = InfrastructureAnalyzer(region="us-east-1")
            result = analyzer.perform_analysis()
        
        assert 'drift_analysis' in result
        # High drift percentage should trigger alert
        assert result['drift_analysis']['summary']['drift_percentage'] > 0

    @patch("analyse.boto_client")
    @patch("builtins.print")
    def test_run_full_analysis_success(self, mock_print, mock_boto):
        """Test run_full_analysis complete execution."""
        from botocore.exceptions import ClientError

        # Create mock clients
        config_client = MagicMock()
        s3_client = MagicMock()
        dynamodb_client = MagicMock()
        sns_client = MagicMock()
        ssm_client = MagicMock()
        sts_client = MagicMock()
        cloudwatch_client = MagicMock()
        
        sts_client.get_caller_identity.return_value = {
            'Arn': 'arn:aws:sts::123456789012:user/test',
            'Account': '123456789012'
        }
        
        ssm_client.get_parameter.side_effect = ClientError(
            {'Error': {'Code': 'ParameterNotFound'}}, 'GetParameter'
        )
        
        config_client.list_discovered_resources.return_value = {'resourceIdentifiers': []}
        config_client.batch_get_resource_config.return_value = {'baseConfigurationItems': []}
        s3_client.put_object.return_value = {'ETag': 'etag-123'}
        
        def boto_side_effect(service, region):
            return {
                'config': config_client,
                's3': s3_client,
                'dynamodb': dynamodb_client,
                'sns': sns_client,
                'ssm': ssm_client,
                'sts': sts_client,
                'cloudwatch': cloudwatch_client
            }[service]
        
        mock_boto.side_effect = boto_side_effect
        
        analyzer = InfrastructureAnalyzer(region="us-east-1")
        result = analyzer.run_full_analysis()
        
        assert result == 0

    @patch("analyse.boto_client")
    def test_run_full_analysis_keyboard_interrupt(self, mock_boto):
        """Test run_full_analysis handles keyboard interrupt."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        with patch.object(analyzer, 'perform_analysis', side_effect=KeyboardInterrupt()):
            result = analyzer.run_full_analysis()
        
        assert result == 1

    @patch("analyse.boto_client")
    def test_run_full_analysis_exception(self, mock_boto):
        """Test run_full_analysis handles exceptions."""
        analyzer = _build_infrastructure_analyzer(mock_boto)
        
        with patch.object(analyzer, 'perform_analysis', side_effect=Exception("Test error")):
            result = analyzer.run_full_analysis()
        
        assert result == 1

    @patch("analyse.boto_client")
    def test_main_entry_point(self, mock_boto):
        """Test main() entry point function."""
        from analyse import main

        # Mock InfrastructureAnalyzer
        with patch("analyse.InfrastructureAnalyzer") as mock_analyzer_class:
            mock_analyzer = MagicMock()
            mock_analyzer_class.return_value = mock_analyzer
            mock_analyzer.run_full_analysis.return_value = 0
            
            result = main()
            
            # Should create analyzer and call run_full_analysis
            assert mock_analyzer_class.called
            assert mock_analyzer.run_full_analysis.called
            assert result == 0
