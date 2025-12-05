"""Unit tests for Lambda failover function."""
import pytest
from unittest.mock import Mock, patch, MagicMock
import os
import json
import importlib


class TestLambdaFailover:
    """Test cases for Lambda failover function."""

    @pytest.fixture(autouse=True)
    def setup_env(self):
        """Set up environment variables for tests."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        os.environ['PRIMARY_REGION'] = 'us-east-1'
        os.environ['SECONDARY_REGION'] = 'us-east-2'
        os.environ['PRIMARY_ALB_ARN'] = 'arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/test-alb/1234567890'
        os.environ['SECONDARY_ALB_ARN'] = 'arn:aws:elasticloadbalancing:us-east-2:123456789:loadbalancer/app/test-alb-secondary/1234567890'
        os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789:test-topic'
        yield
        for key in ['ENVIRONMENT_SUFFIX', 'PRIMARY_REGION', 'SECONDARY_REGION',
                    'PRIMARY_ALB_ARN', 'SECONDARY_ALB_ARN', 'SNS_TOPIC_ARN']:
            os.environ.pop(key, None)

    @patch('boto3.client')
    def test_lambda_handler_success(self, mock_boto):
        """Test successful failover."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_sns = MagicMock()
        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }
        mock_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'healthy'}},
                {'TargetHealth': {'State': 'healthy'}}
            ]
        }
        mock_boto.return_value = mock_elb

        with patch.object(failover, 'sns_client', mock_sns), \
             patch.object(failover, 'validate_secondary_health', return_value=True), \
             patch.object(failover, 'promote_secondary_database'), \
             patch.object(failover, 'update_dns_records'):
            result = failover.lambda_handler({'trigger': 'manual'}, {})

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Failover completed successfully'
        mock_sns.publish.assert_called_once()

    @patch('boto3.client')
    def test_lambda_handler_secondary_unhealthy(self, mock_boto):
        """Test failover fails when secondary is unhealthy."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_sns = MagicMock()

        with patch.object(failover, 'sns_client', mock_sns), \
             patch.object(failover, 'validate_secondary_health', return_value=False):
            result = failover.lambda_handler({'trigger': 'manual'}, {})

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
        mock_sns.publish.assert_called()

    @patch('boto3.client')
    def test_lambda_handler_exception(self, mock_boto):
        """Test failover exception handling."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_sns = MagicMock()

        with patch.object(failover, 'sns_client', mock_sns), \
             patch.object(failover, 'validate_secondary_health', side_effect=Exception("Test error")):
            result = failover.lambda_handler({'trigger': 'manual'}, {})

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body

    @patch('boto3.client')
    def test_validate_secondary_health_healthy(self, mock_boto):
        """Test validate_secondary_health with healthy targets."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }
        mock_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'healthy'}},
                {'TargetHealth': {'State': 'healthy'}}
            ]
        }
        mock_boto.return_value = mock_elb

        result = failover.validate_secondary_health()
        assert result is True

    @patch('boto3.client')
    def test_validate_secondary_health_no_healthy_targets(self, mock_boto):
        """Test validate_secondary_health with no healthy targets."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }
        mock_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'unhealthy'}}
            ]
        }
        mock_boto.return_value = mock_elb

        result = failover.validate_secondary_health()
        assert result is False

    @patch('boto3.client')
    def test_validate_secondary_health_exception(self, mock_boto):
        """Test validate_secondary_health exception handling."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.side_effect = Exception("Test error")
        mock_boto.return_value = mock_elb

        result = failover.validate_secondary_health()
        assert result is False

    def test_promote_secondary_database(self):
        """Test promote_secondary_database."""
        failover = importlib.import_module('lib.lambda.failover')

        # Should not raise exception
        failover.promote_secondary_database()

    def test_update_dns_records(self):
        """Test update_dns_records."""
        failover = importlib.import_module('lib.lambda.failover')

        # Should not raise exception
        failover.update_dns_records()

    @patch('boto3.client')
    def test_get_target_group_from_alb(self, mock_boto):
        """Test get_target_group_from_alb."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }
        mock_boto.return_value = mock_elb

        result = failover.get_target_group_from_alb('arn:aws:alb:test', 'us-east-2')
        assert result == 'arn:aws:tg:test'

    @patch('boto3.client')
    def test_get_target_group_from_alb_no_listeners(self, mock_boto):
        """Test get_target_group_from_alb with no listeners."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {'Listeners': []}
        mock_boto.return_value = mock_elb

        with pytest.raises(RuntimeError, match="No target group found"):
            failover.get_target_group_from_alb('arn:aws:alb:test', 'us-east-2')

    @patch('boto3.client')
    def test_get_target_group_from_alb_exception(self, mock_boto):
        """Test get_target_group_from_alb exception handling."""
        failover = importlib.import_module('lib.lambda.failover')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.side_effect = Exception("Test error")
        mock_boto.return_value = mock_elb

        with pytest.raises(Exception):
            failover.get_target_group_from_alb('arn:aws:alb:test', 'us-east-2')
