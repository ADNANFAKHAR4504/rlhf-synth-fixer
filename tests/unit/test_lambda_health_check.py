"""Unit tests for Lambda health check function."""
import pytest
from unittest.mock import Mock, patch, MagicMock
import os
import json
import importlib


class TestLambdaHealthCheck:
    """Test cases for Lambda health check function."""

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
    def test_lambda_handler_both_healthy(self, mock_boto):
        """Test handler when both regions are healthy."""
        health_check = importlib.import_module('lib.lambda.health_check')

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

        mock_sns = MagicMock()
        mock_lambda = MagicMock()

        with patch.object(health_check, 'elb_primary_client', mock_elb), \
             patch.object(health_check, 'elb_secondary_client', mock_elb), \
             patch.object(health_check, 'sns_client', mock_sns), \
             patch.object(health_check, 'lambda_client', mock_lambda):
            result = health_check.lambda_handler({}, {})

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['primary_healthy'] is True
        assert body['secondary_healthy'] is True

    @patch('boto3.client')
    def test_lambda_handler_primary_unhealthy_triggers_failover(self, mock_boto):
        """Test handler triggers failover when primary is unhealthy."""
        health_check = importlib.import_module('lib.lambda.health_check')

        mock_primary_elb = MagicMock()
        mock_primary_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:primary'}]}]
        }
        mock_primary_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'unhealthy'}},
                {'TargetHealth': {'State': 'unhealthy'}}
            ]
        }

        mock_secondary_elb = MagicMock()
        mock_secondary_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:secondary'}]}]
        }
        mock_secondary_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'healthy'}},
                {'TargetHealth': {'State': 'healthy'}}
            ]
        }

        mock_sns = MagicMock()
        mock_lambda = MagicMock()

        with patch.object(health_check, 'elb_primary_client', mock_primary_elb), \
             patch.object(health_check, 'elb_secondary_client', mock_secondary_elb), \
             patch.object(health_check, 'sns_client', mock_sns), \
             patch.object(health_check, 'lambda_client', mock_lambda):
            result = health_check.lambda_handler({}, {})

        assert result['statusCode'] == 200
        mock_lambda.invoke.assert_called_once()
        mock_sns.publish.assert_called_once()

    @patch('boto3.client')
    def test_lambda_handler_both_unhealthy_critical_alert(self, mock_boto):
        """Test handler sends critical alert when both regions unhealthy."""
        health_check = importlib.import_module('lib.lambda.health_check')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }
        mock_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'unhealthy'}}
            ]
        }

        mock_sns = MagicMock()
        mock_lambda = MagicMock()

        with patch.object(health_check, 'elb_primary_client', mock_elb), \
             patch.object(health_check, 'elb_secondary_client', mock_elb), \
             patch.object(health_check, 'sns_client', mock_sns), \
             patch.object(health_check, 'lambda_client', mock_lambda):
            result = health_check.lambda_handler({}, {})

        assert result['statusCode'] == 200
        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        assert 'CRITICAL' in call_args[1]['Subject']

    def test_check_region_health_healthy(self):
        """Test check_region_health with healthy targets."""
        health_check = importlib.import_module('lib.lambda.health_check')

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

        result = health_check.check_region_health('arn:aws:alb:test', 'us-east-1', mock_elb)
        assert result is True

    def test_check_region_health_unhealthy(self):
        """Test check_region_health with unhealthy targets."""
        health_check = importlib.import_module('lib.lambda.health_check')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }
        mock_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': [
                {'TargetHealth': {'State': 'unhealthy'}},
                {'TargetHealth': {'State': 'unhealthy'}}
            ]
        }

        result = health_check.check_region_health('arn:aws:alb:test', 'us-east-1', mock_elb)
        assert result is False

    def test_check_region_health_no_targets(self):
        """Test check_region_health with no targets."""
        health_check = importlib.import_module('lib.lambda.health_check')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }
        mock_elb.describe_target_health.return_value = {
            'TargetHealthDescriptions': []
        }

        result = health_check.check_region_health('arn:aws:alb:test', 'us-east-1', mock_elb)
        assert result is False

    def test_check_region_health_exception(self):
        """Test check_region_health exception handling."""
        health_check = importlib.import_module('lib.lambda.health_check')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.side_effect = Exception("Test error")

        result = health_check.check_region_health('arn:aws:alb:test', 'us-east-1', mock_elb)
        assert result is False

    def test_get_target_group_from_alb(self):
        """Test get_target_group_from_alb."""
        health_check = importlib.import_module('lib.lambda.health_check')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{'DefaultActions': [{'TargetGroupArn': 'arn:aws:tg:test'}]}]
        }

        result = health_check.get_target_group_from_alb('arn:aws:alb:test', 'us-east-1', mock_elb)
        assert result == 'arn:aws:tg:test'

    def test_get_target_group_from_alb_no_listeners(self):
        """Test get_target_group_from_alb with no listeners."""
        health_check = importlib.import_module('lib.lambda.health_check')

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {'Listeners': []}

        with pytest.raises(RuntimeError, match="No target group found"):
            health_check.get_target_group_from_alb('arn:aws:alb:test', 'us-east-1', mock_elb)
