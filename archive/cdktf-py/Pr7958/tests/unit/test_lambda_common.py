"""Unit tests for Lambda common utilities."""
import pytest
from unittest.mock import Mock, patch, MagicMock
import os
import importlib


class TestLambdaCommon:
    """Test cases for Lambda common utilities."""

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
        # Clean up environment variables
        for key in ['ENVIRONMENT_SUFFIX', 'PRIMARY_REGION', 'SECONDARY_REGION',
                    'PRIMARY_ALB_ARN', 'SECONDARY_ALB_ARN', 'SNS_TOPIC_ARN']:
            os.environ.pop(key, None)

    @patch('boto3.client')
    def test_get_target_group_arn_primary(self, mock_boto_client):
        """Test getting target group ARN from primary region ALB."""
        lambda_common = importlib.import_module('lib.lambda.common')
        get_target_group_arn = lambda_common.get_target_group_arn
        PRIMARY_REGION = lambda_common.PRIMARY_REGION

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{
                'DefaultActions': [{
                    'TargetGroupArn': 'arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/test-tg/123'
                }]
            }]
        }
        mock_boto_client.return_value = mock_elb

        # Patch the module-level client
        with patch.object(lambda_common, 'primary_elb_client', mock_elb):
            result = get_target_group_arn('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/123', PRIMARY_REGION)

        assert result == 'arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/test-tg/123'

    @patch('boto3.client')
    def test_get_target_group_arn_secondary(self, mock_boto_client):
        """Test getting target group ARN from secondary region ALB."""
        lambda_common = importlib.import_module('lib.lambda.common')
        get_target_group_arn = lambda_common.get_target_group_arn
        SECONDARY_REGION = lambda_common.SECONDARY_REGION

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {
            'Listeners': [{
                'DefaultActions': [{
                    'TargetGroupArn': 'arn:aws:elasticloadbalancing:us-east-2:123:targetgroup/test-tg/456'
                }]
            }]
        }
        mock_boto_client.return_value = mock_elb

        with patch.object(lambda_common, 'secondary_elb_client', mock_elb):
            result = get_target_group_arn('arn:aws:elasticloadbalancing:us-east-2:123:loadbalancer/app/test/123', SECONDARY_REGION)

        assert result == 'arn:aws:elasticloadbalancing:us-east-2:123:targetgroup/test-tg/456'

    @patch('boto3.client')
    def test_get_target_group_arn_no_listeners(self, mock_boto_client):
        """Test error when no listeners found."""
        lambda_common = importlib.import_module('lib.lambda.common')
        get_target_group_arn = lambda_common.get_target_group_arn
        PRIMARY_REGION = lambda_common.PRIMARY_REGION

        mock_elb = MagicMock()
        mock_elb.describe_listeners.return_value = {'Listeners': []}
        mock_boto_client.return_value = mock_elb

        with patch.object(lambda_common, 'primary_elb_client', mock_elb):
            with pytest.raises(RuntimeError, match="No target group found"):
                get_target_group_arn('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test/123', PRIMARY_REGION)

    @patch('boto3.client')
    def test_send_sns_notification_success(self, mock_boto_client):
        """Test successful SNS notification."""
        lambda_common = importlib.import_module('lib.lambda.common')
        send_sns_notification = lambda_common.send_sns_notification

        mock_sns = MagicMock()
        mock_boto_client.return_value = mock_sns

        with patch.object(lambda_common, 'sns_client', mock_sns):
            send_sns_notification("Test Subject", "Test Message")

        mock_sns.publish.assert_called_once()

    @patch('boto3.client')
    def test_send_sns_notification_error(self, mock_boto_client):
        """Test SNS notification error handling."""
        lambda_common = importlib.import_module('lib.lambda.common')
        send_sns_notification = lambda_common.send_sns_notification

        mock_sns = MagicMock()
        mock_sns.publish.side_effect = RuntimeError("SNS Error")
        mock_boto_client.return_value = mock_sns

        with patch.object(lambda_common, 'sns_client', mock_sns):
            # Should not raise exception, just print error
            send_sns_notification("Test Subject", "Test Message")

    def test_get_current_timestamp(self):
        """Test getting current timestamp."""
        lambda_common = importlib.import_module('lib.lambda.common')
        get_current_timestamp = lambda_common.get_current_timestamp

        result = get_current_timestamp()
        assert result is not None
        assert isinstance(result, str)
        # Check it's in ISO format
        assert 'T' in result
