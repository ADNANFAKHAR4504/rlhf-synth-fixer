"""
test_tap_stack.py
Unit tests for the observability infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

# Set Pulumi to test mode
os.environ['PULUMI_TEST_MODE'] = 'true'

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

import pulumi

# Mock Pulumi runtime
pulumi.runtime.settings.configure(
    pulumi.runtime.Settings(
        project='test-project',
        stack='test-stack',
        parallel=1,
        dry_run=True,
        monitor='',
        engine='',
    )
)

from infrastructure.config import ObservabilityConfig


class TestObservabilityConfig(unittest.TestCase):
    """Test ObservabilityConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        config = ObservabilityConfig()
        self.assertIsInstance(config.project_name, str)
        self.assertIsInstance(config.environment, str)
        self.assertIsInstance(config.primary_region, str)
        self.assertEqual(config.log_retention_days, 90)
        self.assertIn('PaymentSystem', config.metric_namespace)

    def test_normalize_region(self):
        """Test region normalization removes hyphens."""
        config = ObservabilityConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name(self):
        """Test resource name generation includes region and suffix."""
        config = ObservabilityConfig()
        name = config.get_resource_name('dashboard')
        self.assertIn('dashboard', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_get_tags_for_resource(self):
        """Test resource-specific tags generation."""
        config = ObservabilityConfig()
        tags = config.get_tags_for_resource('CloudWatch', Purpose='Monitoring')
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertIn('ResourceType', tags)
        self.assertIn('Purpose', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')
        self.assertEqual(tags['ResourceType'], 'CloudWatch')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider is created with correct region."""
        from infrastructure.aws_provider import AWSProviderManager
        config = ObservabilityConfig()
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        provider = manager.get_provider()
        
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_get_resource_options(self, mock_provider):
        """Test resource options include provider."""
        from infrastructure.aws_provider import AWSProviderManager
        config = ObservabilityConfig()
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        opts = manager.get_resource_options()
        
        self.assertIsInstance(opts, pulumi.ResourceOptions)


class TestLogGroupsStack(unittest.TestCase):
    """Test Log Groups Stack resource creation."""

    @patch('infrastructure.log_groups.aws.get_caller_identity')
    @patch('infrastructure.log_groups.aws.cloudwatch.QueryDefinition')
    @patch('infrastructure.log_groups.aws.kms.Alias')
    @patch('infrastructure.log_groups.aws.kms.Key')
    @patch('infrastructure.log_groups.aws.cloudwatch.LogGroup')
    def test_log_groups_created_with_kms_encryption(self, mock_log_group, mock_kms_key, 
                                                     mock_kms_alias, mock_query, mock_caller):
        """Test log groups created with KMS encryption and 90-day retention."""
        from infrastructure.log_groups import LogGroupsStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        # Mock caller identity
        mock_caller.return_value = MagicMock(account_id='123456789012')
        
        # Mock KMS key
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.id = MagicMock()
        mock_key_instance.arn = MagicMock()
        mock_kms_key.return_value = mock_key_instance
        
        # Mock log group
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.name = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        # Mock alias
        mock_alias_instance = MagicMock(spec=pulumi.Resource)
        mock_kms_alias.return_value = mock_alias_instance
        
        # Mock query definition
        mock_query_instance = MagicMock(spec=pulumi.Resource)
        mock_query.return_value = mock_query_instance
        
        log_stack = LogGroupsStack(config, mock_provider_manager)
        
        # Verify log groups created (3 log groups)
        self.assertEqual(mock_log_group.call_count, 3)
        
        # Verify KMS key created
        mock_kms_key.assert_called_once()
        
        # Verify retention days
        for call in mock_log_group.call_args_list:
            call_kwargs = call[1]
            self.assertEqual(call_kwargs['retention_in_days'], 90)


class TestSNSTopicsStack(unittest.TestCase):
    """Test SNS Topics Stack resource creation."""

    @patch('infrastructure.sns_topics.aws.sns.Topic')
    def test_sns_topics_created(self, mock_topic):
        """Test SNS topics created for critical, warning, and info alerts."""
        from infrastructure.sns_topics import SNSTopicsStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        sns_stack = SNSTopicsStack(config, mock_provider_manager)
        
        # Verify 3 topics created (critical, warning, info)
        self.assertEqual(mock_topic.call_count, 3)
        
        # Verify topic names are properly formatted
        for call in mock_topic.call_args_list:
            call_args = call[0]
            topic_name = call_args[0]
            self.assertIn('sns-topic', topic_name)


class TestMetricFiltersStack(unittest.TestCase):
    """Test Metric Filters Stack resource creation."""

    @patch('infrastructure.metric_filters.aws.cloudwatch.LogMetricFilter')
    def test_metric_filters_created(self, mock_filter):
        """Test metric filters created for all log groups."""
        from infrastructure.metric_filters import MetricFiltersStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_log_groups_stack = MagicMock()
        mock_log_groups_stack.get_log_group_name.return_value = MagicMock()
        
        mock_filter_instance = MagicMock(spec=pulumi.Resource)
        mock_filter.return_value = mock_filter_instance
        
        metric_stack = MetricFiltersStack(config, mock_provider_manager, mock_log_groups_stack)
        
        # Verify metric filters created (8 filters)
        self.assertGreaterEqual(mock_filter.call_count, 8)
        
        # Verify metric namespace is correct
        for call in mock_filter.call_args_list:
            call_kwargs = call[1]
            metric_transformation = call_kwargs['metric_transformation']
            self.assertIn('PaymentSystem', metric_transformation.namespace)


class TestAlarmsStack(unittest.TestCase):
    """Test Alarms Stack resource creation."""

    @patch('infrastructure.alarms.aws.cloudwatch.CompositeAlarm')
    @patch('infrastructure.alarms.aws.cloudwatch.MetricAlarm')
    def test_alarms_created_with_metric_math(self, mock_alarm, mock_composite):
        """Test alarms created with proper metric math for error rates."""
        from infrastructure.alarms import AlarmsStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_sns_stack = MagicMock()
        mock_sns_stack.get_topic_arn.return_value = MagicMock()
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm_instance.name = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        mock_composite_instance = MagicMock(spec=pulumi.Resource)
        mock_composite.return_value = mock_composite_instance
        
        alarms_stack = AlarmsStack(config, mock_provider_manager, mock_sns_stack)
        
        # Verify metric alarms created (4 alarms)
        self.assertEqual(mock_alarm.call_count, 4)
        
        # Verify error rate alarm uses metric math
        error_rate_call = None
        for call in mock_alarm.call_args_list:
            call_args = call[0]
            if 'error-rate' in call_args[0]:
                error_rate_call = call
                break
        
        if error_rate_call:
            call_kwargs = error_rate_call[1]
            # Error rate alarm should use metric_queries, not metrics
            self.assertIn('metric_queries', call_kwargs)


class TestDashboardStack(unittest.TestCase):
    """Test Dashboard Stack resource creation."""

    @patch('infrastructure.dashboard.aws.cloudwatch.Dashboard')
    def test_dashboard_created_with_widgets(self, mock_dashboard):
        """Test dashboard created with proper widget configuration."""
        from infrastructure.dashboard import DashboardStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_dashboard_instance = MagicMock(spec=pulumi.Resource)
        mock_dashboard_instance.name = MagicMock()
        mock_dashboard.return_value = mock_dashboard_instance
        
        dashboard_stack = DashboardStack(config, mock_provider_manager)
        
        # Verify dashboard created
        mock_dashboard.assert_called_once()
        
        # Verify dashboard name is properly formatted
        call_args = mock_dashboard.call_args[0]
        dashboard_name = call_args[0]
        self.assertIn('dashboard', dashboard_name)


class TestXRayConfigStack(unittest.TestCase):
    """Test X-Ray Configuration Stack resource creation."""

    @patch('infrastructure.xray_config.aws.kms.Alias')
    @patch('infrastructure.xray_config.aws.kms.Key')
    @patch('infrastructure.xray_config.aws.xray.EncryptionConfig')
    @patch('infrastructure.xray_config.aws.xray.Group')
    @patch('infrastructure.xray_config.aws.xray.SamplingRule')
    def test_xray_sampling_rules_created(self, mock_rule, mock_group, mock_encryption, 
                                         mock_key, mock_alias):
        """Test X-Ray sampling rules created with proper configuration."""
        from infrastructure.xray_config import XRayConfigStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        # Mock KMS key
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.id = MagicMock()
        mock_key_instance.arn = MagicMock()
        mock_key.return_value = mock_key_instance
        
        # Mock sampling rule
        mock_rule_instance = MagicMock(spec=pulumi.Resource)
        mock_rule.return_value = mock_rule_instance
        
        # Mock group
        mock_group_instance = MagicMock(spec=pulumi.Resource)
        mock_group.return_value = mock_group_instance
        
        # Mock encryption config
        mock_encryption_instance = MagicMock(spec=pulumi.Resource)
        mock_encryption.return_value = mock_encryption_instance
        
        # Mock alias
        mock_alias_instance = MagicMock(spec=pulumi.Resource)
        mock_alias.return_value = mock_alias_instance
        
        xray_stack = XRayConfigStack(config, mock_provider_manager)
        
        # Verify sampling rules created (3 rules)
        self.assertEqual(mock_rule.call_count, 3)
        
        # Verify group created
        mock_group.assert_called_once()
        
        # Verify encryption config created
        mock_encryption.assert_called_once()
        
        # Verify rule names are within 32 character limit
        for call in mock_rule.call_args_list:
            call_kwargs = call[1]
            rule_name = call_kwargs['rule_name']
            self.assertLessEqual(len(rule_name), 32)


class TestEventBridgeRulesStack(unittest.TestCase):
    """Test EventBridge Rules Stack resource creation."""

    @patch('infrastructure.eventbridge_rules.aws.iam.RolePolicy')
    @patch('infrastructure.eventbridge_rules.aws.iam.Role')
    @patch('infrastructure.eventbridge_rules.aws.cloudwatch.EventTarget')
    @patch('infrastructure.eventbridge_rules.aws.cloudwatch.EventRule')
    @patch('infrastructure.eventbridge_rules.aws.cloudwatch.LogGroup')
    @patch('infrastructure.eventbridge_rules.aws.s3.BucketPolicy')
    @patch('infrastructure.eventbridge_rules.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.eventbridge_rules.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.eventbridge_rules.aws.s3.BucketVersioning')
    @patch('infrastructure.eventbridge_rules.aws.s3.Bucket')
    @patch('infrastructure.eventbridge_rules.aws.cloudtrail.Trail')
    def test_cloudtrail_and_eventbridge_created(self, mock_trail, mock_bucket, mock_versioning,
                                                 mock_encryption, mock_lifecycle, mock_policy,
                                                 mock_log_group, mock_rule, mock_target, 
                                                 mock_role, mock_role_policy):
        """Test CloudTrail and EventBridge rules created for compliance monitoring."""
        from infrastructure.eventbridge_rules import EventBridgeRulesStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        # Mock S3 bucket
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        # Mock CloudTrail
        mock_trail_instance = MagicMock(spec=pulumi.Resource)
        mock_trail.return_value = mock_trail_instance
        
        # Mock EventBridge rule
        mock_rule_instance = MagicMock(spec=pulumi.Resource)
        mock_rule_instance.name = MagicMock()
        mock_rule.return_value = mock_rule_instance
        
        # Mock log group
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        # Mock role
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        # Mock other resources
        mock_versioning.return_value = MagicMock(spec=pulumi.Resource)
        mock_encryption.return_value = MagicMock(spec=pulumi.Resource)
        mock_lifecycle.return_value = MagicMock(spec=pulumi.Resource)
        mock_policy.return_value = MagicMock(spec=pulumi.Resource)
        mock_target.return_value = MagicMock(spec=pulumi.Resource)
        mock_role_policy.return_value = MagicMock(spec=pulumi.Resource)
        
        eventbridge_stack = EventBridgeRulesStack(config, mock_provider_manager)
        
        # Verify CloudTrail created
        mock_trail.assert_called_once()
        
        # Verify S3 bucket created
        mock_bucket.assert_called_once()
        
        # Verify EventBridge rules created (3 rules)
        self.assertEqual(mock_rule.call_count, 3)
        
        # Verify EventBridge targets created (3 targets)
        self.assertEqual(mock_target.call_count, 3)
        
        # Verify rule names are within 64 character limit
        for call in mock_rule.call_args_list:
            call_args = call[0]
            rule_name = call_args[0]
            self.assertLessEqual(len(rule_name), 64)


class TestSNSTopicsStackGetters(unittest.TestCase):
    """Test SNS Topics Stack getter methods."""

    @patch('infrastructure.sns_topics.aws.sns.Topic')
    def test_get_topic_arn(self, mock_topic):
        """Test get_topic_arn returns correct ARN."""
        from infrastructure.sns_topics import SNSTopicsStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        sns_stack = SNSTopicsStack(config, mock_provider_manager)
        
        # Test getting critical topic ARN
        critical_arn = sns_stack.get_topic_arn('critical')
        self.assertIsNotNone(critical_arn)
        
        # Test getting warning topic ARN
        warning_arn = sns_stack.get_topic_arn('warning')
        self.assertIsNotNone(warning_arn)


class TestDashboardStackGetters(unittest.TestCase):
    """Test Dashboard Stack getter methods."""

    @patch('infrastructure.dashboard.aws.cloudwatch.Dashboard')
    def test_get_dashboard_url(self, mock_dashboard):
        """Test get_dashboard_url returns properly formatted URL."""
        from infrastructure.dashboard import DashboardStack
        
        config = ObservabilityConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_dashboard_instance = MagicMock(spec=pulumi.Resource)
        mock_dashboard_instance.name = MagicMock()
        mock_dashboard_instance.dashboard_name = MagicMock()
        mock_dashboard.return_value = mock_dashboard_instance
        
        dashboard_stack = DashboardStack(config, mock_provider_manager)
        
        # Test getting dashboard URL
        url = dashboard_stack.get_dashboard_url()
        self.assertIsNotNone(url)


class TestTapStack(unittest.TestCase):
    """Test main TapStack orchestration."""

    @patch('tap_stack.EventBridgeRulesStack')
    @patch('tap_stack.XRayConfigStack')
    @patch('tap_stack.DashboardStack')
    @patch('tap_stack.AlarmsStack')
    @patch('tap_stack.MetricFiltersStack')
    @patch('tap_stack.SNSTopicsStack')
    @patch('tap_stack.LogGroupsStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.ObservabilityConfig')
    def test_tap_stack_creates_all_components(self, mock_config, mock_provider_manager,
                                              mock_log_groups, mock_sns, mock_metric_filters,
                                              mock_alarms, mock_dashboard, mock_xray,
                                              mock_eventbridge):
        """Test TapStack creates all infrastructure components."""
        from tap_stack import TapStack
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config_instance.environment = 'dev'
        mock_config_instance.environment_suffix = 'dev'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.metric_namespace = 'PaymentSystem/dev'
        mock_config.return_value = mock_config_instance
        
        # Mock provider manager
        mock_provider_instance = MagicMock()
        mock_provider_manager.return_value = mock_provider_instance
        
        # Mock all stacks
        mock_log_groups_instance = MagicMock()
        mock_log_groups_instance.get_log_group_name.return_value = MagicMock()
        mock_log_groups_instance.get_kms_key_id.return_value = MagicMock()
        mock_log_groups_instance.get_kms_key_arn.return_value = MagicMock()
        mock_log_groups.return_value = mock_log_groups_instance
        
        mock_sns_instance = MagicMock()
        mock_sns_instance.get_topic_arn.return_value = MagicMock()
        mock_sns.return_value = mock_sns_instance
        
        mock_alarms_instance = MagicMock()
        mock_alarms_instance.get_alarm_name.return_value = MagicMock()
        mock_alarms.return_value = mock_alarms_instance
        
        mock_dashboard_instance = MagicMock()
        mock_dashboard_instance.get_dashboard_name.return_value = MagicMock()
        mock_dashboard_instance.get_dashboard_url.return_value = MagicMock()
        mock_dashboard.return_value = mock_dashboard_instance
        
        mock_eventbridge_instance = MagicMock()
        mock_eventbridge_instance.get_trail_bucket_name.return_value = MagicMock()
        mock_eventbridge_instance.get_eventbridge_log_group_name.return_value = MagicMock()
        mock_eventbridge.return_value = mock_eventbridge_instance
        
        mock_metric_filters.return_value = MagicMock()
        mock_xray.return_value = MagicMock()
        
        # Create TapStack
        tap_stack = TapStack('observability-stack')
        
        # Verify all stacks were created
        mock_config.assert_called_once()
        mock_provider_manager.assert_called_once()
        mock_log_groups.assert_called_once()
        mock_sns.assert_called_once()
        mock_metric_filters.assert_called_once()
        mock_alarms.assert_called_once()
        mock_dashboard.assert_called_once()
        mock_xray.assert_called_once()
        mock_eventbridge.assert_called_once()

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.EventBridgeRulesStack')
    @patch('tap_stack.XRayConfigStack')
    @patch('tap_stack.DashboardStack')
    @patch('tap_stack.AlarmsStack')
    @patch('tap_stack.MetricFiltersStack')
    @patch('tap_stack.SNSTopicsStack')
    @patch('tap_stack.LogGroupsStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.ObservabilityConfig')
    def test_tap_stack_exports_outputs(self, mock_config, mock_provider_manager,
                                       mock_log_groups, mock_sns, mock_metric_filters,
                                       mock_alarms, mock_dashboard, mock_xray,
                                       mock_eventbridge, mock_export):
        """Test TapStack exports all required outputs."""
        from tap_stack import TapStack
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config_instance.environment = 'dev'
        mock_config_instance.environment_suffix = 'dev'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.metric_namespace = 'PaymentSystem/dev'
        mock_config.return_value = mock_config_instance
        
        # Mock provider manager
        mock_provider_instance = MagicMock()
        mock_provider_manager.return_value = mock_provider_instance
        
        # Mock all stacks with proper return values
        mock_log_groups_instance = MagicMock()
        mock_log_groups_instance.get_log_group_name.return_value = 'log-group-name'
        mock_log_groups_instance.get_kms_key_id.return_value = 'kms-key-id'
        mock_log_groups_instance.get_kms_key_arn.return_value = 'kms-key-arn'
        mock_log_groups.return_value = mock_log_groups_instance
        
        mock_sns_instance = MagicMock()
        mock_sns_instance.get_topic_arn.return_value = 'topic-arn'
        mock_sns.return_value = mock_sns_instance
        
        mock_alarms_instance = MagicMock()
        mock_alarms_instance.get_alarm_name.return_value = 'alarm-name'
        mock_alarms.return_value = mock_alarms_instance
        
        mock_dashboard_instance = MagicMock()
        mock_dashboard_instance.get_dashboard_name.return_value = 'dashboard-name'
        mock_dashboard_instance.get_dashboard_url.return_value = 'dashboard-url'
        mock_dashboard.return_value = mock_dashboard_instance
        
        mock_eventbridge_instance = MagicMock()
        mock_eventbridge_instance.get_trail_bucket_name.return_value = 'bucket-name'
        mock_eventbridge_instance.get_eventbridge_log_group_name.return_value = 'log-group-name'
        mock_eventbridge.return_value = mock_eventbridge_instance
        
        mock_metric_filters.return_value = MagicMock()
        mock_xray.return_value = MagicMock()
        
        # Create TapStack
        tap_stack = TapStack('observability-stack')
        
        # Verify pulumi.export was called multiple times for outputs
        self.assertGreater(mock_export.call_count, 10)


if __name__ == '__main__':
    unittest.main()
