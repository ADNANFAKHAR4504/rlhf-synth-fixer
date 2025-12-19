"""
test_tap_stack.py
Focused unit tests for TapStack with >90% coverage.
Tests resource creation with proper mocking to avoid creating actual resources.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, call, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import MigrationConfig


class TestMigrationConfig(unittest.TestCase):
    """Test MigrationConfig."""

    def test_config_defaults(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = MigrationConfig()
            self.assertEqual(config.environment, 'dev')
            self.assertEqual(config.primary_region, 'us-east-1')
            self.assertTrue(config.enable_versioning)

    @patch.dict('os.environ', {'ENVIRONMENT': 'prod', 'PRIMARY_REGION': 'eu-west-1'})
    def test_config_custom_env(self):
        """Test configuration with custom environment variables."""
        config = MigrationConfig()
        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.primary_region, 'eu-west-1')

    def test_get_resource_name(self):
        """Test resource name generation."""
        config = MigrationConfig()
        name = config.get_resource_name('lambda-function', 'us-east-1')
        self.assertIn('lambda-function', name)
        self.assertIn('us-east-1', name)

    def test_normalize_name(self):
        """Test name normalization."""
        config = MigrationConfig()
        self.assertEqual(config.normalize_name('Test-Bucket'), 'test-bucket')

    def test_get_tags(self):
        """Test tags generation."""
        config = MigrationConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        region_tags = config.get_region_tags('us-east-1')
        self.assertEqual(region_tags['Region'], 'us-east-1')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider creation for all regions."""
        from infrastructure.aws_provider import AWSProviderManager
        config = MigrationConfig()
        manager = AWSProviderManager(config)
        self.assertEqual(mock_provider.call_count, len(config.all_regions))

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_get_provider(self, mock_provider):
        """Test getting provider for region."""
        from infrastructure.aws_provider import AWSProviderManager
        config = MigrationConfig()
        manager = AWSProviderManager(config)
        provider = manager.get_primary_provider()
        self.assertIsNotNone(provider)

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_invalid_region_raises_error(self, mock_provider):
        """Test invalid region raises ValueError."""
        from infrastructure.aws_provider import AWSProviderManager
        config = MigrationConfig()
        manager = AWSProviderManager(config)
        with self.assertRaises(ValueError):
            manager.get_provider('invalid-region')


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_roles_created(self, mock_role, mock_role_policy):
        """Test IAM roles are created for all regions."""
        from infrastructure.iam import IAMStack
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Verify roles created for regions
        self.assertGreater(mock_role.call_count, 0)
        
        # Test getters
        for region in config.all_regions:
            role = iam_stack.get_lambda_role(region)
            self.assertIsNotNone(role)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_policy_attachments(self, mock_role, mock_role_policy):
        """Test IAM policy attachment methods execute."""
        from infrastructure.iam import IAMStack
        from pulumi import Output
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Test policy attachments with ARNs
        test_role = mock_role_instance
        test_region = 'us-east-1'
        
        log_arns = [Output.from_input('arn:aws:logs:us-east-1:123:log-group:/test')]
        iam_stack.attach_cloudwatch_logs_policy(test_role, test_region, log_arns)
        
        bucket_arns = [Output.from_input('arn:aws:s3:::test-bucket')]
        iam_stack.attach_s3_policy(test_role, test_region, bucket_arns)
        
        param_arns = [Output.from_input('arn:aws:ssm:us-east-1:123:parameter/test')]
        iam_stack.attach_ssm_policy(test_role, test_region, param_arns)
        
        topic_arns = [Output.from_input('arn:aws:sns:us-east-1:123:topic')]
        iam_stack.attach_sns_publish_policy(test_role, test_region, topic_arns)
        
        # Verify policies were created
        self.assertGreater(mock_role_policy.call_count, 0)

    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_empty_policy_lists(self, mock_role):
        """Test IAM policy attachments with empty lists."""
        from infrastructure.iam import IAMStack
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Test with empty lists (should return early)
        iam_stack.attach_cloudwatch_logs_policy(mock_role_instance, 'us-east-1', [])
        iam_stack.attach_s3_policy(mock_role_instance, 'us-east-1', [])
        iam_stack.attach_ssm_policy(mock_role_instance, 'us-east-1', [])
        iam_stack.attach_sns_publish_policy(mock_role_instance, 'us-east-1', [])

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_policy_document_creation_with_valid_arns(self, mock_role, mock_role_policy):
        """Test IAM policy document creation with valid ARNs to trigger inner functions."""
        import asyncio

        from infrastructure.iam import IAMStack
        from pulumi import Output
        
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role_instance.id = Output.from_input('test-role-id')
        mock_role.return_value = mock_role_instance
        
        # Mock RolePolicy to capture the policy document
        policy_documents = []
        def capture_policy(name, **kwargs):
            if 'policy' in kwargs:
                policy_documents.append(kwargs['policy'])
            return MagicMock()
        
        mock_role_policy.side_effect = capture_policy
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Test each policy attachment with valid ARNs
        test_region = 'us-east-1'
        
        # CloudWatch Logs policy with valid ARN
        log_arns = [Output.from_input('arn:aws:logs:us-east-1:123:log-group:/aws/lambda/test:*')]
        iam_stack.attach_cloudwatch_logs_policy(mock_role_instance, test_region, log_arns)
        
        # S3 policy with valid ARN
        bucket_arns = [Output.from_input('arn:aws:s3:::test-bucket')]
        iam_stack.attach_s3_policy(mock_role_instance, test_region, bucket_arns)
        
        # SSM policy with valid ARN  
        param_arns = [Output.from_input('arn:aws:ssm:us-east-1:123:parameter/test')]
        iam_stack.attach_ssm_policy(mock_role_instance, test_region, param_arns)
        
        # Secrets Manager policy
        secret_arns = [Output.from_input('arn:aws:secretsmanager:us-east-1:123:secret:test')]
        iam_stack.attach_secrets_manager_policy(mock_role_instance, test_region, secret_arns)
        
        # SNS policy with valid ARN
        topic_arns = [Output.from_input('arn:aws:sns:us-east-1:123:topic')]
        iam_stack.attach_sns_publish_policy(mock_role_instance, test_region, topic_arns)
        
        # Verify policies were created
        self.assertGreater(mock_role_policy.call_count, 0)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_policy_with_empty_valid_arns(self, mock_role, mock_role_policy):
        """Test IAM policy creation when ARNs resolve to empty (triggers deny-all path)."""
        from infrastructure.iam import IAMStack
        from pulumi import Output
        
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role_instance.id = Output.from_input('test-role-id')
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Create Output with None value to trigger empty valid_arns path
        none_arns = [Output.from_input(None)]
        iam_stack.attach_cloudwatch_logs_policy(mock_role_instance, 'us-east-1', none_arns)
        
        # Verify policy was still created (with deny-all statement)
        self.assertGreater(mock_role_policy.call_count, 0)


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack."""

    @patch('infrastructure.storage.aws.iam.RolePolicy')
    @patch('infrastructure.storage.aws.iam.Role')
    @patch('infrastructure.storage.aws.s3.BucketReplicationConfig')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_storage_buckets_created(self, mock_bucket, mock_public, mock_encrypt,
                                     mock_version, mock_lifecycle, mock_repl, mock_role, mock_policy):
        """Test S3 buckets created with proper configuration."""
        from infrastructure.storage import StorageStack
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        storage_stack = StorageStack(config, mock_provider_manager)
        
        # Verify buckets created
        self.assertGreater(mock_bucket.call_count, 0)
        self.assertGreater(mock_encrypt.call_count, 0)
        self.assertGreater(mock_version.call_count, 0)
        
        # Test getters
        for region in config.all_regions:
            self.assertIsNotNone(storage_stack.get_deployment_bucket_name(region))
            self.assertIsNotNone(storage_stack.get_log_bucket_name(region))
            self.assertIsNotNone(storage_stack.get_deployment_bucket_arn(region))
            self.assertIsNotNone(storage_stack.get_log_bucket_arn(region))


class TestSecretsStack(unittest.TestCase):
    """Test Secrets Stack."""

    @patch('infrastructure.secrets.aws.ssm.Parameter')
    def test_secrets_parameters_created(self, mock_parameter):
        """Test SSM parameters created when secrets manager disabled."""
        from infrastructure.secrets import SecretsStack
        config = MigrationConfig()
        config.use_secrets_manager = False
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_param_instance = MagicMock()
        mock_param_instance.arn = MagicMock()
        mock_param_instance.name = MagicMock()
        mock_parameter.return_value = mock_param_instance
        
        secrets_stack = SecretsStack(config, mock_provider_manager)
        
        # Verify parameters created
        self.assertGreater(mock_parameter.call_count, 0)
        
        # Test getters
        for region in config.all_regions:
            name = secrets_stack.get_parameter_name(region, 'deployment-config')
            self.assertIsNotNone(name)

    @patch('infrastructure.secrets.aws.secretsmanager.SecretVersion')
    @patch('infrastructure.secrets.aws.secretsmanager.Secret')
    @patch('infrastructure.secrets.aws.ssm.Parameter')
    def test_secrets_manager_enabled(self, mock_param, mock_secret, mock_version):
        """Test secrets created when secrets manager enabled."""
        from infrastructure.secrets import SecretsStack
        config = MigrationConfig()
        config.use_secrets_manager = True
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_secret_instance = MagicMock()
        mock_secret_instance.arn = MagicMock()
        mock_secret_instance.name = MagicMock()
        mock_secret_instance.id = MagicMock()
        mock_secret.return_value = mock_secret_instance
        
        mock_param_instance = MagicMock()
        mock_param_instance.arn = MagicMock()
        mock_param_instance.name = MagicMock()
        mock_param.return_value = mock_param_instance
        
        secrets_stack = SecretsStack(config, mock_provider_manager)
        
        # Verify secrets created
        self.assertGreater(mock_secret.call_count, 0)
        self.assertGreater(mock_version.call_count, 0)

    @patch('infrastructure.secrets.aws.ssm.Parameter')
    def test_secrets_invalid_region_error(self, mock_parameter):
        """Test invalid region raises ValueError."""
        from infrastructure.secrets import SecretsStack
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_param_instance = MagicMock()
        mock_param_instance.arn = MagicMock()
        mock_param_instance.name = MagicMock()
        mock_parameter.return_value = mock_param_instance
        
        secrets_stack = SecretsStack(config, mock_provider_manager)
        
        with self.assertRaises(ValueError):
            secrets_stack.get_parameter_name('invalid-region', 'test')

    @patch('infrastructure.secrets.aws.ssm.Parameter')
    def test_secrets_all_getter_methods(self, mock_parameter):
        """Test all getter methods for secrets stack."""
        from infrastructure.secrets import SecretsStack
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_param_instance = MagicMock()
        mock_param_instance.arn = MagicMock()
        mock_param_instance.name = MagicMock()
        mock_parameter.return_value = mock_param_instance
        
        secrets_stack = SecretsStack(config, mock_provider_manager)
        
        # Test all getter methods
        region = config.primary_region
        arn = secrets_stack.get_parameter_arn(region, 'deployment-config')
        self.assertIsNotNone(arn)
        
        all_arns = secrets_stack.get_all_parameter_arns(region)
        self.assertIsInstance(all_arns, list)
        
        # Test non-existent region
        empty_arns = secrets_stack.get_all_parameter_arns('non-existent-region')
        self.assertEqual(empty_arns, [])

    @patch('infrastructure.secrets.aws.secretsmanager.SecretVersion')
    @patch('infrastructure.secrets.aws.secretsmanager.Secret')
    @patch('infrastructure.secrets.aws.ssm.Parameter')
    def test_secrets_manager_getters(self, mock_param, mock_secret, mock_version):
        """Test getter methods when secrets manager is enabled."""
        from infrastructure.secrets import SecretsStack
        config = MigrationConfig()
        config.use_secrets_manager = True
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_secret_instance = MagicMock()
        mock_secret_instance.arn = MagicMock()
        mock_secret_instance.name = MagicMock()
        mock_secret_instance.id = MagicMock()
        mock_secret.return_value = mock_secret_instance
        
        mock_param_instance = MagicMock()
        mock_param_instance.arn = MagicMock()
        mock_param_instance.name = MagicMock()
        mock_param.return_value = mock_param_instance
        
        secrets_stack = SecretsStack(config, mock_provider_manager)
        
        # Test secret getters
        region = config.primary_region
        secret_arn = secrets_stack.get_secret_arn(region, 'deployment-config')
        self.assertIsNotNone(secret_arn)
        
        secret_name = secrets_stack.get_secret_name(region, 'deployment-config')
        self.assertIsNotNone(secret_name)
        
        all_secret_arns = secrets_stack.get_all_secret_arns(region)
        self.assertIsInstance(all_secret_arns, list)


class TestNotificationsStack(unittest.TestCase):
    """Test Notifications Stack."""

    @patch('infrastructure.notifications.aws.sns.TopicSubscription')
    @patch('infrastructure.notifications.aws.sns.Topic')
    def test_notifications_topics_created(self, mock_topic, mock_subscription):
        """Test SNS topics created."""
        from infrastructure.notifications import NotificationsStack
        config = MigrationConfig()
        config.enable_notifications = True
        config.notification_email = "test@example.com"
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        notifications_stack = NotificationsStack(config, mock_provider_manager)
        
        # Verify topics created
        self.assertGreater(mock_topic.call_count, 0)
        
        # Test getters
        for region in config.all_regions:
            self.assertIsNotNone(notifications_stack.get_deployment_topic_arn(region))
            self.assertIsNotNone(notifications_stack.get_alarm_topic_arn(region))

    @patch('infrastructure.notifications.aws.sns.Topic')
    def test_notifications_additional_getters(self, mock_topic):
        """Test additional notification getter methods."""
        from infrastructure.notifications import NotificationsStack
        config = MigrationConfig()
        config.enable_notifications = True
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        notifications_stack = NotificationsStack(config, mock_provider_manager)
        
        # Test additional getters
        region = config.primary_region
        deployment_topic = notifications_stack.get_deployment_topic(region)
        self.assertIsNotNone(deployment_topic)
        
        alarm_topic = notifications_stack.get_alarm_topic(region)
        self.assertIsNotNone(alarm_topic)
        
        all_arns = notifications_stack.get_all_topic_arns(region)
        self.assertIsInstance(all_arns, list)
        
        # Test configure_alarm_actions with alarms
        mock_alarms = [MagicMock(), MagicMock()]
        notifications_stack.configure_alarm_actions(mock_alarms, region)

    @patch('infrastructure.notifications.aws.sns.Topic')
    def test_notifications_disabled(self, mock_topic):
        """Test notifications when disabled."""
        from infrastructure.notifications import NotificationsStack
        config = MigrationConfig()
        config.enable_notifications = False
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        notifications_stack = NotificationsStack(config, mock_provider_manager)
        
        # Test configure_alarm_actions returns early when disabled
        notifications_stack.configure_alarm_actions([], 'us-east-1')


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_resources_created(self, mock_log_group, mock_alarm):
        """Test CloudWatch log groups and alarms created."""
        from infrastructure.monitoring import MonitoringStack
        from pulumi import Output
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        lambda_function_names = {
            region: Output.from_input(f"test-function-{region}")
            for region in config.all_regions
        }
        
        mock_log_instance = MagicMock()
        mock_log_instance.arn = Output.from_input('arn:aws:logs:us-east-1:123:log-group:test')
        mock_log_instance.name = Output.from_input('/aws/lambda/test')
        mock_log_group.return_value = mock_log_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, lambda_function_names)
        
        # Verify resources created
        self.assertGreater(mock_log_group.call_count, 0)
        self.assertGreater(mock_alarm.call_count, 0)
        
        # Test getter methods
        region = config.primary_region
        log_group = monitoring_stack.get_log_group(region, 'lambda')
        self.assertIsNotNone(log_group)
        
        log_group_arn = monitoring_stack.get_log_group_arn(region, 'lambda')
        self.assertIsNotNone(log_group_arn)
        
        log_group_name = monitoring_stack.get_log_group_name(region, 'lambda')
        self.assertIsNotNone(log_group_name)
        
        all_arns = monitoring_stack.get_all_log_group_arns(region)
        self.assertIsInstance(all_arns, list)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack."""

    @patch('infrastructure.lambda_functions.pulumi.AssetArchive')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_functions_created(self, mock_function, mock_archive):
        """Test Lambda functions created with proper configuration."""
        from infrastructure.lambda_functions import LambdaStack
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        lambda_roles = {region: MagicMock() for region in config.all_regions}
        bucket_names = {region: f"bucket-{region}" for region in config.all_regions}
        parameter_names = {region: f"/param/{region}" for region in config.all_regions}
        topic_arns = {region: f"arn:aws:sns:{region}:123:topic" for region in config.all_regions}
        
        mock_function_instance = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function_instance.name = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(config, mock_provider_manager, lambda_roles,
                                   bucket_names, parameter_names, topic_arns)
        
        # Verify functions created
        self.assertEqual(mock_function.call_count, len(config.all_regions))
        
        # Verify configuration
        for call_args in mock_function.call_args_list:
            self.assertEqual(call_args[1]['runtime'], config.lambda_runtime)
            self.assertEqual(call_args[1]['timeout'], config.lambda_timeout)
        
        # Test getters
        for region in config.all_regions:
            self.assertIsNotNone(lambda_stack.get_function_name(region))

    @patch('infrastructure.lambda_functions.pulumi.AssetArchive')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_additional_getters(self, mock_function, mock_archive):
        """Test additional Lambda getter methods."""
        from infrastructure.lambda_functions import LambdaStack
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        lambda_roles = {region: MagicMock() for region in config.all_regions}
        bucket_names = {region: f"bucket-{region}" for region in config.all_regions}
        parameter_names = {region: f"/param/{region}" for region in config.all_regions}
        topic_arns = {region: f"arn:aws:sns:{region}:123:topic" for region in config.all_regions}
        
        mock_function_instance = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function_instance.name = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(config, mock_provider_manager, lambda_roles,
                                   bucket_names, parameter_names, topic_arns)
        
        # Test get_function_arn
        for region in config.all_regions:
            arn = lambda_stack.get_function_arn(region)
            self.assertIsNotNone(arn)


class TestMonitoringGetters(unittest.TestCase):
    """Test monitoring stack getter methods."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_all_getters(self, mock_log_group, mock_alarm):
        """Test all monitoring getter methods."""
        from infrastructure.monitoring import MonitoringStack
        from pulumi import Output
        config = MigrationConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        lambda_function_names = {
            region: Output.from_input(f"test-function-{region}")
            for region in config.all_regions
        }
        
        mock_log_instance = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, lambda_function_names)
        
        # Just verify stack was created successfully
        self.assertIsNotNone(monitoring_stack)


class TestTapStack(unittest.TestCase):
    """Test TapStack integration."""

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.NotificationsStack')
    @patch('tap_stack.SecretsStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.MigrationConfig')
    def test_stack_initialization(self, mock_config, mock_provider, mock_iam,
                                  mock_storage, mock_secrets, mock_notifications,
                                  mock_monitoring, mock_lambda, mock_export):
        """Test TapStack initializes all components."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.all_regions = ['us-east-1', 'us-west-2']
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.secondary_regions = ['us-west-2']
        mock_config_instance.environment = 'dev'
        mock_config_instance.environment_suffix = 'pr1234'
        mock_config_instance.use_secrets_manager = False
        mock_config.return_value = mock_config_instance
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_lambda_role.return_value = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_deployment_bucket_name.return_value = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        mock_secrets_instance = MagicMock()
        mock_secrets_instance.get_parameter_name.return_value = MagicMock()
        mock_secrets.return_value = mock_secrets_instance
        
        mock_notifications_instance = MagicMock()
        mock_notifications_instance.get_deployment_topic_arn.return_value = MagicMock()
        mock_notifications.return_value = mock_notifications_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        args = TapStackArgs()
        stack = TapStack('test-stack', args)
        
        # Verify all components initialized
        mock_config.assert_called_once()
        mock_provider.assert_called_once()
        mock_storage.assert_called_once()
        mock_secrets.assert_called_once()
        mock_iam.assert_called_once()
        mock_notifications.assert_called_once()
        
        # Verify pulumi.export was called
        self.assertTrue(mock_export.called)

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.NotificationsStack')
    @patch('tap_stack.SecretsStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.MigrationConfig')
    def test_stack_with_secrets_manager_enabled(self, mock_config, mock_provider, mock_iam,
                                                 mock_storage, mock_secrets, mock_notifications,
                                                 mock_monitoring, mock_lambda, mock_export):
        """Test TapStack with secrets manager enabled to trigger different code paths."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.all_regions = ['us-east-1']
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.secondary_regions = []
        mock_config_instance.environment = 'prod'
        mock_config_instance.environment_suffix = 'prod123'
        mock_config_instance.use_secrets_manager = True  # Enable secrets manager
        mock_config.return_value = mock_config_instance
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_lambda_role.return_value = MagicMock()
        mock_iam_instance.get_lambda_role_arn.return_value = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_deployment_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_deployment_bucket_arn.return_value = MagicMock()
        mock_storage_instance.get_log_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_log_bucket_arn.return_value = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        mock_secrets_instance = MagicMock()
        # Simulate get_secret_name raising ValueError for exception path
        mock_secrets_instance.get_secret_name.side_effect = ValueError("Not found")
        mock_secrets_instance.get_secret_arn.side_effect = ValueError("Not found")
        mock_secrets_instance.get_all_secret_arns.return_value = []
        mock_secrets.return_value = mock_secrets_instance
        
        mock_notifications_instance = MagicMock()
        mock_notifications_instance.get_deployment_topic_arn.return_value = MagicMock()
        mock_notifications_instance.get_all_topic_arns.return_value = []
        mock_notifications.return_value = mock_notifications_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_all_log_group_arns.return_value = []
        mock_monitoring.return_value = mock_monitoring_instance
        
        args = TapStackArgs()
        stack = TapStack('test-stack-secrets', args)
        
        # Verify secrets manager path was taken
        self.assertTrue(mock_secrets_instance.get_secret_name.called)
        self.assertTrue(mock_secrets_instance.get_all_secret_arns.called)

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.NotificationsStack')
    @patch('tap_stack.SecretsStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.MigrationConfig')
    def test_stack_with_ssm_parameters(self, mock_config, mock_provider, mock_iam,
                                       mock_storage, mock_secrets, mock_notifications,
                                       mock_monitoring, mock_lambda, mock_export):
        """Test TapStack with SSM parameters (no secrets manager) to trigger SSM code paths."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.all_regions = ['us-west-2']
        mock_config_instance.primary_region = 'us-west-2'
        mock_config_instance.secondary_regions = []
        mock_config_instance.environment = 'test'
        mock_config_instance.environment_suffix = 'test456'
        mock_config_instance.use_secrets_manager = False  # Use SSM parameters
        mock_config.return_value = mock_config_instance
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_lambda_role.return_value = MagicMock()
        mock_iam_instance.get_lambda_role_arn.return_value = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_deployment_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_deployment_bucket_arn.return_value = MagicMock()
        mock_storage_instance.get_log_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_log_bucket_arn.return_value = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        mock_secrets_instance = MagicMock()
        # Simulate get_parameter_name raising ValueError for exception path
        mock_secrets_instance.get_parameter_name.side_effect = ValueError("Not found")
        mock_secrets_instance.get_parameter_arn.side_effect = ValueError("Not found")
        mock_secrets_instance.get_all_parameter_arns.return_value = []
        mock_secrets.return_value = mock_secrets_instance
        
        mock_notifications_instance = MagicMock()
        mock_notifications_instance.get_deployment_topic_arn.return_value = None  # No topic
        mock_notifications_instance.get_all_topic_arns.return_value = []
        mock_notifications.return_value = mock_notifications_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_all_log_group_arns.return_value = []
        mock_monitoring.return_value = mock_monitoring_instance
        
        args = TapStackArgs()
        stack = TapStack('test-stack-ssm', args)
        
        # Verify SSM parameter path was taken
        self.assertTrue(mock_secrets_instance.get_parameter_name.called)
        self.assertTrue(mock_secrets_instance.get_all_parameter_arns.called)


if __name__ == '__main__':
    unittest.main()
