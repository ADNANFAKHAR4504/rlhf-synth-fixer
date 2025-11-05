"""
test_tap_stack.py
Unit tests for the CI/CD Pipeline infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

# Set Pulumi to test mode BEFORE importing pulumi
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

from infrastructure.config import CICDPipelineConfig


class TestCICDPipelineConfig(unittest.TestCase):
    """Test CICDPipelineConfig resource configuration."""

    def test_config_initialization(self):
        """Test configuration initializes with environment variables."""
        with patch.dict('os.environ', {
            'ENVIRONMENT': 'prod',
            'ENVIRONMENT_SUFFIX': 'pr1234',
            'AWS_REGION': 'us-west-2'
        }):
            config = CICDPipelineConfig()
            self.assertEqual(config.environment, 'prod')
            self.assertEqual(config.environment_suffix, 'pr1234')
            self.assertEqual(config.primary_region, 'us-west-2')

    def test_normalize_region(self):
        """Test region normalization removes hyphens."""
        config = CICDPipelineConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name_includes_components(self):
        """Test resource name generation includes all components."""
        config = CICDPipelineConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_normalize_name_lowercase(self):
        """Test name normalization converts to lowercase."""
        config = CICDPipelineConfig()
        normalized = config.normalize_name('My-Bucket-NAME')
        self.assertEqual(normalized, 'my-bucket-name')

    def test_get_common_tags(self):
        """Test common tags include required fields."""
        config = CICDPipelineConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_singleton(self, mock_provider):
        """Test provider singleton pattern."""
        from infrastructure.aws_provider import AWSProviderManager
        
        # Reset singleton
        AWSProviderManager._provider_instance = None
        
        config = CICDPipelineConfig()
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        provider1 = manager.get_provider()
        provider2 = manager.get_provider()
        
        self.assertIs(provider1, provider2)
        mock_provider.assert_called_once()


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch('infrastructure.storage.aws.s3.BucketPolicy')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.Bucket')
    @patch('infrastructure.storage.aws.kms.Alias')
    @patch('infrastructure.storage.aws.kms.Key')
    @patch('infrastructure.storage.AWSProviderManager')
    def test_storage_stack_creates_kms_and_bucket(self, mock_provider_mgr, mock_kms_key,
                                                   mock_kms_alias, mock_bucket, mock_versioning,
                                                   mock_encryption, mock_public_block, mock_lifecycle,
                                                   mock_policy):
        """Test storage stack creates KMS key and S3 bucket with configurations."""
        from infrastructure.storage import StorageStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_key = MagicMock()
        mock_key.id = MagicMock()
        mock_key.arn = MagicMock()
        mock_kms_key.return_value = mock_key
        
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        stack = StorageStack(config, mock_provider_mgr_instance)
        
        mock_kms_key.assert_called_once()
        mock_kms_alias.assert_called_once()
        mock_bucket.assert_called_once()
        mock_versioning.assert_called_once()
        mock_encryption.assert_called_once()
        mock_public_block.assert_called_once()
        mock_lifecycle.assert_called_once()


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.AWSProviderManager')
    def test_create_lambda_role(self, mock_provider_mgr, mock_role, mock_policy):
        """Test Lambda role creation with scoped permissions."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        stack = IAMStack(config, mock_provider_mgr_instance)
        
        log_group_arn = pulumi.Output.from_input('arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/test')
        sns_topic_arns = [pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test-topic')]
        
        role = stack.create_lambda_role('test-function', log_group_arn, sns_topic_arns)
        
        self.assertIsNotNone(role)
        mock_role.assert_called()

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.AWSProviderManager')
    def test_create_codebuild_role(self, mock_provider_mgr, mock_role, mock_policy):
        """Test CodeBuild role creation with S3 and KMS permissions."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        stack = IAMStack(config, mock_provider_mgr_instance)
        
        s3_arns = [pulumi.Output.from_input('arn:aws:s3:::test-bucket')]
        kms_arns = [pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')]
        
        role = stack.create_codebuild_role('test-project', s3_arns, kms_arns)
        
        self.assertIsNotNone(role)
        mock_role.assert_called()

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.AWSProviderManager')
    def test_create_codepipeline_role(self, mock_provider_mgr, mock_role, mock_policy):
        """Test CodePipeline role creation with comprehensive permissions."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        stack = IAMStack(config, mock_provider_mgr_instance)
        
        s3_arns = [pulumi.Output.from_input('arn:aws:s3:::test-bucket')]
        kms_arns = [pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')]
        codebuild_arns = [pulumi.Output.from_input('arn:aws:codebuild:us-east-1:123456789012:project/test')]
        lambda_arns = [pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test')]
        sns_arns = [pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')]
        
        role = stack.create_codepipeline_role(s3_arns, kms_arns, codebuild_arns, lambda_arns, sns_arns)
        
        self.assertIsNotNone(role)
        mock_role.assert_called()


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.TopicSubscription')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.AWSProviderManager')
    def test_monitoring_stack_creates_sns_topic(self, mock_provider_mgr, mock_topic,
                                                 mock_subscription, mock_alarm, mock_dashboard):
        """Test monitoring stack creates SNS topic."""
        from infrastructure.monitoring import MonitoringStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        stack = MonitoringStack(config, mock_provider_mgr_instance)
        
        mock_topic.assert_called_once()
        self.assertIn('pipeline-notifications', stack.sns_topics)

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.AWSProviderManager')
    def test_create_dashboard(self, mock_provider_mgr, mock_topic, mock_dashboard):
        """Test dashboard creation."""
        from infrastructure.monitoring import MonitoringStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        stack = MonitoringStack(config, mock_provider_mgr_instance)
        
        pipeline_name = pulumi.Output.from_input('test-pipeline')
        codebuild_projects = {'main': pulumi.Output.from_input('test-build')}
        lambda_functions = {'logger': pulumi.Output.from_input('test-lambda')}
        
        stack.create_dashboard(pipeline_name, codebuild_projects, lambda_functions)
        
        mock_dashboard.assert_called_once()


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.iam.RolePolicy')
    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.sqs.Queue')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.AWSProviderManager')
    def test_lambda_stack_creates_function_with_dlq(self, mock_provider_mgr, mock_log_group,
                                                     mock_queue, mock_function, mock_invoke_config,
                                                     mock_policy):
        """Test Lambda stack creates function with DLQ and event invoke config."""
        from infrastructure.lambda_functions import LambdaStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        mock_provider_mgr_instance.get_provider.return_value = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.id = MagicMock()
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_monitoring_stack = MagicMock()
        mock_monitoring_stack.get_sns_topic_arn.return_value = pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_queue_instance = MagicMock()
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        mock_function_instance = MagicMock()
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        stack = LambdaStack(config, mock_provider_mgr_instance, mock_iam_stack, mock_monitoring_stack)
        
        mock_log_group.assert_called_once()
        mock_queue.assert_called_once()
        mock_function.assert_called_once()
        mock_invoke_config.assert_called_once()


class TestCICDStack(unittest.TestCase):
    """Test CICD Stack resource creation."""

    @patch('infrastructure.cicd.aws.cloudwatch.EventTarget')
    @patch('infrastructure.cicd.aws.cloudwatch.EventRule')
    @patch('infrastructure.cicd.aws.codepipeline.Pipeline')
    @patch('infrastructure.cicd.aws.codebuild.Project')
    @patch('infrastructure.cicd.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.cicd.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.cicd.aws.s3.BucketVersioning')
    @patch('infrastructure.cicd.aws.s3.Bucket')
    @patch('infrastructure.cicd.aws.Provider')
    @patch('infrastructure.cicd.AWSProviderManager')
    def test_cicd_stack_creates_codebuild_projects(self, mock_provider_mgr, mock_secondary_provider,
                                                    mock_bucket, mock_versioning, mock_encryption,
                                                    mock_public_block, mock_codebuild, mock_pipeline,
                                                    mock_event_rule, mock_event_target):
        """Test CICD stack creates CodeBuild projects and pipeline."""
        from infrastructure.cicd import CICDStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = pulumi.Output.from_input('test-bucket')
        mock_storage_stack.get_bucket_arn.return_value = pulumi.Output.from_input('arn:aws:s3:::test-bucket')
        mock_storage_stack.get_kms_key_arn.return_value = pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')
        mock_storage_stack.get_kms_key_id.return_value = pulumi.Output.from_input('test-key-id')
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock()
        mock_role.id = MagicMock()
        mock_role.arn = MagicMock()
        mock_iam_stack.create_codebuild_role.return_value = mock_role
        mock_iam_stack.create_codepipeline_role.return_value = mock_role
        mock_iam_stack.get_role_arn.return_value = pulumi.Output.from_input('arn:aws:iam::123456789012:role/test')
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test')
        mock_lambda_stack.get_function_name.return_value = pulumi.Output.from_input('test-function')
        
        mock_monitoring_stack = MagicMock()
        mock_monitoring_stack.get_sns_topic_arn.return_value = pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')
        mock_monitoring_stack.create_codebuild_alarms = MagicMock()
        mock_monitoring_stack.create_pipeline_alarms = MagicMock()
        mock_monitoring_stack.create_lambda_alarms = MagicMock()
        mock_monitoring_stack.create_dashboard = MagicMock()
        
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        mock_codebuild_instance = MagicMock()
        mock_codebuild_instance.name = MagicMock()
        mock_codebuild_instance.arn = MagicMock()
        mock_codebuild.return_value = mock_codebuild_instance
        
        mock_pipeline_instance = MagicMock()
        mock_pipeline_instance.name = MagicMock()
        mock_pipeline_instance.arn = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        stack = CICDStack(config, mock_provider_mgr_instance, mock_storage_stack,
                         mock_iam_stack, mock_lambda_stack, mock_monitoring_stack)
        
        self.assertEqual(mock_codebuild.call_count, 2)  # main-build and security-scan
        mock_pipeline.assert_called_once()
        mock_event_rule.assert_called_once()
        mock_event_target.assert_called_once()


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration."""

    @patch('tap_stack.CICDStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.CICDPipelineConfig')
    def test_tap_stack_initializes_all_stacks(self, mock_config, mock_provider_mgr,
                                               mock_storage, mock_iam, mock_monitoring,
                                               mock_lambda, mock_cicd):
        """Test TapStack initializes all infrastructure stacks."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.project_name = 'test-project'
        mock_config_instance.environment = 'dev'
        mock_config_instance.environment_suffix = 'test'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.secondary_region = 'us-west-2'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.account_id = '123456789012'
        mock_config_instance.get_resource_name.return_value = 'test-resource'
        mock_config.return_value = mock_config_instance
        
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr.return_value = mock_provider_mgr_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_bucket_name.return_value = pulumi.Output.from_input('test-bucket')
        mock_storage_instance.get_bucket_arn.return_value = pulumi.Output.from_input('arn:aws:s3:::test-bucket')
        mock_storage_instance.get_kms_key_id.return_value = pulumi.Output.from_input('test-key')
        mock_storage_instance.get_kms_key_arn.return_value = pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')
        mock_storage.return_value = mock_storage_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_role_arn.return_value = pulumi.Output.from_input('arn:aws:iam::123456789012:role/test')
        mock_iam.return_value = mock_iam_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_sns_topic_arn.return_value = pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')
        mock_monitoring.return_value = mock_monitoring_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = pulumi.Output.from_input('test-function')
        mock_lambda_instance.get_function_arn.return_value = pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test')
        mock_lambda_instance.dlqs = {'deployment-logger': MagicMock(url=MagicMock(), arn=MagicMock())}
        mock_lambda.return_value = mock_lambda_instance
        
        mock_cicd_instance = MagicMock()
        mock_cicd_instance.get_pipeline_name.return_value = pulumi.Output.from_input('test-pipeline')
        mock_cicd_instance.get_pipeline_arn.return_value = pulumi.Output.from_input('arn:aws:codepipeline:us-east-1:123456789012:test')
        mock_cicd_instance.get_codebuild_project.return_value = MagicMock(name=MagicMock(), arn=MagicMock())
        mock_cicd_instance.secondary_artifact_bucket = MagicMock(id=MagicMock(), arn=MagicMock())
        mock_cicd.return_value = mock_cicd_instance
        
        args = TapStackArgs(environment_suffix='test-env', tags={})
        stack = TapStack('test-stack', args)
        
        mock_storage.assert_called_once()
        mock_iam.assert_called_once()
        mock_monitoring.assert_called_once()
        mock_lambda.assert_called_once()
        mock_cicd.assert_called_once()


if __name__ == '__main__':
    unittest.main()

class TestCICDPipelineConfig(unittest.TestCase):
    """Test CICDPipelineConfig resource configuration."""

    def test_config_initialization(self):
        """Test configuration initializes with environment variables."""
        with patch.dict('os.environ', {
            'ENVIRONMENT': 'prod',
            'ENVIRONMENT_SUFFIX': 'pr1234',
            'AWS_REGION': 'us-west-2'
        }):
            config = CICDPipelineConfig()
            self.assertEqual(config.environment, 'prod')
            self.assertEqual(config.environment_suffix, 'pr1234')
            self.assertEqual(config.primary_region, 'us-west-2')

    def test_normalize_region(self):
        """Test region normalization removes hyphens."""
        config = CICDPipelineConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name_includes_components(self):
        """Test resource name generation includes all components."""
        config = CICDPipelineConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_normalize_name_lowercase(self):
        """Test name normalization converts to lowercase."""
        config = CICDPipelineConfig()
        normalized = config.normalize_name('My-Bucket-NAME')
        self.assertEqual(normalized, 'my-bucket-name')

    def test_get_common_tags(self):
        """Test common tags include required fields."""
        config = CICDPipelineConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_singleton(self, mock_provider):
        """Test provider singleton pattern."""
        from infrastructure.aws_provider import AWSProviderManager
        
        # Reset singleton
        AWSProviderManager._provider_instance = None
        
        config = CICDPipelineConfig()
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        provider1 = manager.get_provider()
        provider2 = manager.get_provider()
        
        self.assertIs(provider1, provider2)
        mock_provider.assert_called_once()


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch('infrastructure.storage.aws.s3.BucketPolicy')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.Bucket')
    @patch('infrastructure.storage.aws.kms.Alias')
    @patch('infrastructure.storage.aws.kms.Key')
    @patch('infrastructure.storage.AWSProviderManager')
    def test_storage_stack_creates_kms_and_bucket(self, mock_provider_mgr, mock_kms_key,
                                                   mock_kms_alias, mock_bucket, mock_versioning,
                                                   mock_encryption, mock_public_block, mock_lifecycle,
                                                   mock_policy):
        """Test storage stack creates KMS key and S3 bucket with configurations."""
        from infrastructure.storage import StorageStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_key = MagicMock()
        mock_key.id = MagicMock()
        mock_key.arn = MagicMock()
        mock_kms_key.return_value = mock_key
        
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        stack = StorageStack(config, mock_provider_mgr_instance)
        
        mock_kms_key.assert_called_once()
        mock_kms_alias.assert_called_once()
        mock_bucket.assert_called_once()
        mock_versioning.assert_called_once()
        mock_encryption.assert_called_once()
        mock_public_block.assert_called_once()
        mock_lifecycle.assert_called_once()


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.AWSProviderManager')
    def test_create_lambda_role(self, mock_provider_mgr, mock_role, mock_policy):
        """Test Lambda role creation with scoped permissions."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        stack = IAMStack(config, mock_provider_mgr_instance)
        
        log_group_arn = pulumi.Output.from_input('arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/test')
        sns_topic_arns = [pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test-topic')]
        
        role = stack.create_lambda_role('test-function', log_group_arn, sns_topic_arns)
        
        self.assertIsNotNone(role)
        mock_role.assert_called()

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.AWSProviderManager')
    def test_create_codebuild_role(self, mock_provider_mgr, mock_role, mock_policy):
        """Test CodeBuild role creation with S3 and KMS permissions."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        stack = IAMStack(config, mock_provider_mgr_instance)
        
        s3_arns = [pulumi.Output.from_input('arn:aws:s3:::test-bucket')]
        kms_arns = [pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')]
        
        role = stack.create_codebuild_role('test-project', s3_arns, kms_arns)
        
        self.assertIsNotNone(role)
        mock_role.assert_called()

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.AWSProviderManager')
    def test_create_codepipeline_role(self, mock_provider_mgr, mock_role, mock_policy):
        """Test CodePipeline role creation with comprehensive permissions."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        stack = IAMStack(config, mock_provider_mgr_instance)
        
        s3_arns = [pulumi.Output.from_input('arn:aws:s3:::test-bucket')]
        kms_arns = [pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')]
        codebuild_arns = [pulumi.Output.from_input('arn:aws:codebuild:us-east-1:123456789012:project/test')]
        lambda_arns = [pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test')]
        sns_arns = [pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')]
        
        role = stack.create_codepipeline_role(s3_arns, kms_arns, codebuild_arns, lambda_arns, sns_arns)
        
        self.assertIsNotNone(role)
        mock_role.assert_called()


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.TopicSubscription')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.AWSProviderManager')
    def test_monitoring_stack_creates_sns_topic(self, mock_provider_mgr, mock_topic,
                                                 mock_subscription, mock_alarm, mock_dashboard):
        """Test monitoring stack creates SNS topic."""
        from infrastructure.monitoring import MonitoringStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        stack = MonitoringStack(config, mock_provider_mgr_instance)
        
        mock_topic.assert_called_once()
        self.assertIn('pipeline-notifications', stack.sns_topics)

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.AWSProviderManager')
    def test_create_dashboard(self, mock_provider_mgr, mock_topic, mock_dashboard):
        """Test dashboard creation."""
        from infrastructure.monitoring import MonitoringStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        stack = MonitoringStack(config, mock_provider_mgr_instance)
        
        pipeline_name = pulumi.Output.from_input('test-pipeline')
        codebuild_projects = {'main': pulumi.Output.from_input('test-build')}
        lambda_functions = {'logger': pulumi.Output.from_input('test-lambda')}
        
        stack.create_dashboard(pipeline_name, codebuild_projects, lambda_functions)
        
        mock_dashboard.assert_called_once()


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.iam.RolePolicy')
    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.sqs.Queue')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.AWSProviderManager')
    def test_lambda_stack_creates_function_with_dlq(self, mock_provider_mgr, mock_log_group,
                                                     mock_queue, mock_function, mock_invoke_config,
                                                     mock_policy):
        """Test Lambda stack creates function with DLQ and event invoke config."""
        from infrastructure.lambda_functions import LambdaStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        mock_provider_mgr_instance.get_provider.return_value = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.id = MagicMock()
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_monitoring_stack = MagicMock()
        mock_monitoring_stack.get_sns_topic_arn.return_value = pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_queue_instance = MagicMock()
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        mock_function_instance = MagicMock()
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        stack = LambdaStack(config, mock_provider_mgr_instance, mock_iam_stack, mock_monitoring_stack)
        
        mock_log_group.assert_called_once()
        mock_queue.assert_called_once()
        mock_function.assert_called_once()
        mock_invoke_config.assert_called_once()


class TestCICDStack(unittest.TestCase):
    """Test CICD Stack resource creation."""

    @patch('infrastructure.cicd.aws.cloudwatch.EventTarget')
    @patch('infrastructure.cicd.aws.cloudwatch.EventRule')
    @patch('infrastructure.cicd.aws.codepipeline.Pipeline')
    @patch('infrastructure.cicd.aws.codebuild.Project')
    @patch('infrastructure.cicd.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.cicd.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.cicd.aws.s3.BucketVersioning')
    @patch('infrastructure.cicd.aws.s3.Bucket')
    @patch('infrastructure.cicd.aws.Provider')
    @patch('infrastructure.cicd.AWSProviderManager')
    def test_cicd_stack_creates_codebuild_projects(self, mock_provider_mgr, mock_secondary_provider,
                                                    mock_bucket, mock_versioning, mock_encryption,
                                                    mock_public_block, mock_codebuild, mock_pipeline,
                                                    mock_event_rule, mock_event_target):
        """Test CICD stack creates CodeBuild projects and pipeline."""
        from infrastructure.cicd import CICDStack
        
        config = CICDPipelineConfig()
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr_instance.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = pulumi.Output.from_input('test-bucket')
        mock_storage_stack.get_bucket_arn.return_value = pulumi.Output.from_input('arn:aws:s3:::test-bucket')
        mock_storage_stack.get_kms_key_arn.return_value = pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')
        mock_storage_stack.get_kms_key_id.return_value = pulumi.Output.from_input('test-key-id')
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock()
        mock_role.id = MagicMock()
        mock_role.arn = MagicMock()
        mock_iam_stack.create_codebuild_role.return_value = mock_role
        mock_iam_stack.create_codepipeline_role.return_value = mock_role
        mock_iam_stack.get_role_arn.return_value = pulumi.Output.from_input('arn:aws:iam::123456789012:role/test')
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test')
        mock_lambda_stack.get_function_name.return_value = pulumi.Output.from_input('test-function')
        
        mock_monitoring_stack = MagicMock()
        mock_monitoring_stack.get_sns_topic_arn.return_value = pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')
        mock_monitoring_stack.create_codebuild_alarms = MagicMock()
        mock_monitoring_stack.create_pipeline_alarms = MagicMock()
        mock_monitoring_stack.create_lambda_alarms = MagicMock()
        mock_monitoring_stack.create_dashboard = MagicMock()
        
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        mock_codebuild_instance = MagicMock()
        mock_codebuild_instance.name = MagicMock()
        mock_codebuild_instance.arn = MagicMock()
        mock_codebuild.return_value = mock_codebuild_instance
        
        mock_pipeline_instance = MagicMock()
        mock_pipeline_instance.name = MagicMock()
        mock_pipeline_instance.arn = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        stack = CICDStack(config, mock_provider_mgr_instance, mock_storage_stack,
                         mock_iam_stack, mock_lambda_stack, mock_monitoring_stack)
        
        self.assertEqual(mock_codebuild.call_count, 2)  # main-build and security-scan
        mock_pipeline.assert_called_once()
        mock_event_rule.assert_called_once()
        mock_event_target.assert_called_once()


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration."""

    @patch('tap_stack.CICDStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.CICDPipelineConfig')
    def test_tap_stack_initializes_all_stacks(self, mock_config, mock_provider_mgr,
                                               mock_storage, mock_iam, mock_monitoring,
                                               mock_lambda, mock_cicd):
        """Test TapStack initializes all infrastructure stacks."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.project_name = 'test-project'
        mock_config_instance.environment = 'dev'
        mock_config_instance.environment_suffix = 'test'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.secondary_region = 'us-west-2'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.account_id = '123456789012'
        mock_config_instance.get_resource_name.return_value = 'test-resource'
        mock_config.return_value = mock_config_instance
        
        mock_provider_mgr_instance = MagicMock()
        mock_provider_mgr.return_value = mock_provider_mgr_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_bucket_name.return_value = pulumi.Output.from_input('test-bucket')
        mock_storage_instance.get_bucket_arn.return_value = pulumi.Output.from_input('arn:aws:s3:::test-bucket')
        mock_storage_instance.get_kms_key_id.return_value = pulumi.Output.from_input('test-key')
        mock_storage_instance.get_kms_key_arn.return_value = pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/test')
        mock_storage.return_value = mock_storage_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_role_arn.return_value = pulumi.Output.from_input('arn:aws:iam::123456789012:role/test')
        mock_iam.return_value = mock_iam_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_sns_topic_arn.return_value = pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:test')
        mock_monitoring.return_value = mock_monitoring_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = pulumi.Output.from_input('test-function')
        mock_lambda_instance.get_function_arn.return_value = pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test')
        mock_lambda_instance.dlqs = {'deployment-logger': MagicMock(url=MagicMock(), arn=MagicMock())}
        mock_lambda.return_value = mock_lambda_instance
        
        mock_cicd_instance = MagicMock()
        mock_cicd_instance.get_pipeline_name.return_value = pulumi.Output.from_input('test-pipeline')
        mock_cicd_instance.get_pipeline_arn.return_value = pulumi.Output.from_input('arn:aws:codepipeline:us-east-1:123456789012:test')
        mock_cicd_instance.get_codebuild_project.return_value = MagicMock(name=MagicMock(), arn=MagicMock())
        mock_cicd_instance.secondary_artifact_bucket = MagicMock(id=MagicMock(), arn=MagicMock())
        mock_cicd.return_value = mock_cicd_instance
        
        args = TapStackArgs(environment_suffix='test-env', tags={})
        stack = TapStack('test-stack', args)
        
        mock_storage.assert_called_once()
        mock_iam.assert_called_once()
        mock_monitoring.assert_called_once()
        mock_lambda.assert_called_once()
        mock_cicd.assert_called_once()


if __name__ == '__main__':
    unittest.main()
