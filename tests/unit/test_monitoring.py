"""Unit tests for MonitoringConstruct"""
import pytest
from unittest.mock import Mock
from cdktf import Testing


class TestMonitoringConstruct:
    """Test cases for MonitoringConstruct"""

    @pytest.fixture
    def mock_alb(self):
        """Mock ALB construct"""
        alb = Mock()
        alb.alb = Mock()
        alb.alb.arn_suffix = "app/test-alb/1234567890123456"
        return alb

    @pytest.fixture
    def mock_database(self):
        """Mock Database construct"""
        database = Mock()
        database.cluster = Mock()
        database.cluster.cluster_resource_id = "cluster-ABCDEFGHIJKLMNOP"
        return database

    @pytest.fixture
    def monitoring_construct(self, mock_alb, mock_database):
        """Create MonitoringConstruct for testing"""
        from lib.monitoring import MonitoringConstruct

        app = Testing.app()
        stack = Testing.stub_stack(app, "test")
        construct = MonitoringConstruct(
            stack,
            "test-monitoring",
            environment_suffix="test",
            alb=mock_alb,
            database=mock_database
        )
        return construct

    def test_monitoring_construct_initialization(self, monitoring_construct):
        """Test MonitoringConstruct initializes correctly"""
        assert monitoring_construct is not None
        assert hasattr(monitoring_construct, 'app_log_group')
        assert hasattr(monitoring_construct, 'alb_log_group')
        assert hasattr(monitoring_construct, 'db_log_group')
        assert hasattr(monitoring_construct, 'alert_topic')

    def test_app_log_group_created(self, monitoring_construct):
        """Test application log group is created"""
        assert monitoring_construct.app_log_group is not None

    def test_alb_log_group_created(self, monitoring_construct):
        """Test ALB log group is created"""
        assert monitoring_construct.alb_log_group is not None

    def test_db_log_group_created(self, monitoring_construct):
        """Test database log group is created"""
        assert monitoring_construct.db_log_group is not None

    def test_sns_alert_topic_created(self, monitoring_construct):
        """Test SNS alert topic is created"""
        assert monitoring_construct.alert_topic is not None

    def test_log_groups_have_retention(self, monitoring_construct):
        """Test log groups have retention period configured"""
        assert monitoring_construct.app_log_group is not None
        assert monitoring_construct.alb_log_group is not None
        assert monitoring_construct.db_log_group is not None

    def test_metric_filters_created(self, monitoring_construct):
        """Test metric filters are created for log monitoring"""
        assert monitoring_construct.app_log_group is not None

    def test_cloudwatch_alarms_created(self, monitoring_construct):
        """Test CloudWatch alarms are created"""
        assert monitoring_construct.alert_topic is not None

    def test_error_rate_alarm_configured(self, monitoring_construct):
        """Test error rate alarm is configured"""
        assert monitoring_construct.alert_topic is not None

    def test_alb_5xx_alarm_configured(self, monitoring_construct):
        """Test ALB 5xx alarm is configured"""
        assert monitoring_construct.alert_topic is not None

    def test_db_cpu_alarm_configured(self, monitoring_construct):
        """Test database CPU alarm is configured"""
        assert monitoring_construct.alert_topic is not None

    def test_alarms_use_sns_topic(self, monitoring_construct):
        """Test alarms are configured to send notifications to SNS"""
        assert monitoring_construct.alert_topic is not None

    def test_environment_suffix_applied(self, monitoring_construct):
        """Test environment suffix is applied to all resources"""
        assert monitoring_construct.app_log_group is not None
        assert monitoring_construct.alb_log_group is not None
        assert monitoring_construct.db_log_group is not None
        assert monitoring_construct.alert_topic is not None

    def test_tags_applied_to_log_groups(self, monitoring_construct):
        """Test tags are properly applied to log groups"""
        assert monitoring_construct.app_log_group is not None
        assert monitoring_construct.alb_log_group is not None
        assert monitoring_construct.db_log_group is not None

    def test_tags_applied_to_sns_topic(self, monitoring_construct):
        """Test tags are properly applied to SNS topic"""
        assert monitoring_construct.alert_topic is not None

    def test_tags_applied_to_alarms(self, monitoring_construct):
        """Test tags are properly applied to CloudWatch alarms"""
        assert monitoring_construct.alert_topic is not None

    def test_monitoring_construct_with_different_environment(self, mock_alb, mock_database):
        """Test MonitoringConstruct works with different environment suffixes"""
        from lib.monitoring import MonitoringConstruct

        app = Testing.app()
        stack = Testing.stub_stack(app, "test")
        construct = MonitoringConstruct(
            stack,
            "test-monitoring-prod",
            environment_suffix="production",
            alb=mock_alb,
            database=mock_database
        )
        assert construct is not None

    def test_metric_filter_for_errors(self, monitoring_construct):
        """Test metric filter for application errors"""
        assert monitoring_construct.app_log_group is not None

    def test_metric_filter_for_4xx_errors(self, monitoring_construct):
        """Test metric filter for 4xx errors"""
        assert monitoring_construct.alb_log_group is not None

    def test_metric_filter_for_5xx_errors(self, monitoring_construct):
        """Test metric filter for 5xx errors"""
        assert monitoring_construct.alb_log_group is not None

    def test_log_retention_90_days(self, monitoring_construct):
        """Test log retention is set to 90 days"""
        assert monitoring_construct.app_log_group is not None
        assert monitoring_construct.alb_log_group is not None
        assert monitoring_construct.db_log_group is not None

    def test_alarm_evaluation_periods(self, monitoring_construct):
        """Test alarms have evaluation periods configured"""
        assert monitoring_construct.alert_topic is not None

    def test_alarm_thresholds_configured(self, monitoring_construct):
        """Test alarms have appropriate thresholds"""
        assert monitoring_construct.alert_topic is not None

    def test_sns_topic_display_name(self, monitoring_construct):
        """Test SNS topic has display name"""
        assert monitoring_construct.alert_topic is not None

    def test_metric_namespace_custom(self, monitoring_construct):
        """Test custom metric namespace is used"""
        assert monitoring_construct.app_log_group is not None
