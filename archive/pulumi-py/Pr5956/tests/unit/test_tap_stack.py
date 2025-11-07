"""
test_tap_stack.py
Unit tests for the CI/CD pipeline infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import CICDConfig


class TestConfig(unittest.TestCase):
    """Test CICDConfig class."""

    def test_config_initialization(self):
        """Test config initializes with correct defaults."""
        config = CICDConfig()
        
        # Get actual environment suffix from environment variable
        expected_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        self.assertEqual(config.environment, 'Production')
        self.assertEqual(config.environment_suffix, expected_suffix)
        self.assertEqual(config.project_name, 'cicd-lambda')
        self.assertEqual(config.primary_region, 'us-east-1')
        self.assertEqual(config.lambda_runtime, 'python3.8')
        self.assertTrue(config.enable_xray_tracing)

    def test_normalize_region(self):
        """Test region normalization removes hyphens."""
        config = CICDConfig()
        
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name(self):
        """Test resource name generation includes all components."""
        config = CICDConfig()
        
        # Get actual environment suffix from environment variable
        expected_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        name = config.get_resource_name('lambda')
        self.assertIn('cicd-lambda', name)
        self.assertIn('useast1', name)
        self.assertIn(expected_suffix, name)

    def test_get_normalized_resource_name(self):
        """Test normalized names are lowercase."""
        config = CICDConfig()
        
        name = config.get_normalized_resource_name('bucket')
        self.assertEqual(name, name.lower())
        self.assertNotIn(' ', name)


class TestKMSStack(unittest.TestCase):
    """Test KMS Stack resource creation."""

    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    @patch('infrastructure.kms.aws.get_caller_identity')
    def test_kms_keys_created(self, mock_caller_id, mock_key, mock_alias):
        """Test KMS keys created for lambda, s3, and sns."""
        import pulumi
        from infrastructure.kms import KMSStack
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.id = MagicMock()
        mock_key_instance.arn = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        self.assertEqual(mock_key.call_count, 3)
        self.assertEqual(mock_alias.call_count, 3)
        self.assertIn('lambda', kms_stack.keys)
        self.assertIn('s3', kms_stack.keys)
        self.assertIn('sns', kms_stack.keys)


class TestS3Stack(unittest.TestCase):
    """Test S3 Stack resource creation."""

    @patch('infrastructure.s3.aws.s3.BucketNotification')
    @patch('infrastructure.s3.aws.s3.BucketPolicy')
    @patch('infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketVersioning')
    @patch('infrastructure.s3.aws.s3.Bucket')
    def test_s3_buckets_created_with_kms(self, mock_bucket, mock_versioning, 
                                         mock_encryption, mock_lifecycle, 
                                         mock_policy, mock_notification):
        """Test S3 buckets created with KMS encryption and versioning."""
        import pulumi
        from infrastructure.s3 import S3Stack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_key = MagicMock(spec=pulumi.Resource)
        mock_kms_key.arn = MagicMock()
        mock_kms_stack.get_key.return_value = mock_kms_key
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        s3_stack = S3Stack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertEqual(mock_bucket.call_count, 2)
        self.assertEqual(mock_versioning.call_count, 2)
        self.assertEqual(mock_encryption.call_count, 2)
        self.assertIn('source', s3_stack.buckets)
        self.assertIn('artifacts', s3_stack.buckets)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_created(self, mock_role, mock_policy):
        """Test Lambda IAM role created with correct policies."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        log_group_arn = MagicMock()
        kms_key_arn = MagicMock()
        
        role = iam_stack.create_lambda_role('test-function', log_group_arn, kms_key_arn)
        
        self.assertEqual(mock_role.call_count, 1)
        self.assertEqual(mock_policy.call_count, 1)
        self.assertIsNotNone(role)

    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_codedeploy_role_created(self, mock_role, mock_attachment):
        """Test CodeDeploy role created with managed policy."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_codedeploy_role('test-app')
        
        self.assertEqual(mock_role.call_count, 1)
        self.assertEqual(mock_attachment.call_count, 1)
        
        call_kwargs = mock_attachment.call_args[1]
        self.assertIn('AWSCodeDeployRoleForLambda', call_kwargs['policy_arn'])


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.Alias')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_lambda_function_created_with_xray(self, mock_log_group, mock_function, mock_alias):
        """Test Lambda function created with X-Ray tracing."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_kms_stack = MagicMock()
        mock_key = MagicMock(spec=pulumi.Resource)
        mock_key.arn = MagicMock()
        mock_kms_stack.get_key.return_value = mock_key
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function_instance.version = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(config, mock_provider_manager, mock_iam_stack, mock_kms_stack)
        
        self.assertEqual(mock_function.call_count, 1)
        self.assertEqual(mock_alias.call_count, 1)
        
        call_kwargs = mock_function.call_args[1]
        self.assertIn('tracing_config', call_kwargs)
        self.assertEqual(call_kwargs['runtime'], 'python3.8')


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.sns.TopicPolicy')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.aws.get_caller_identity')
    def test_sns_topic_created_with_kms(self, mock_caller_id, mock_topic, mock_policy):
        """Test SNS topic created with KMS encryption."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_key = MagicMock(spec=pulumi.Resource)
        mock_key.id = MagicMock()
        mock_key.arn = MagicMock()
        mock_kms_stack.get_key.return_value = mock_key
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertEqual(mock_topic.call_count, 1)
        self.assertIn('notifications', monitoring_stack.sns_topics)

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    def test_lambda_alarm_created_with_metric_math(self, mock_alarm):
        """Test CloudWatch alarm created with metric math for error rate."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_key = MagicMock(spec=pulumi.Resource)
        mock_key.id = MagicMock()
        mock_kms_stack.get_key.return_value = mock_key
        
        mock_topic = MagicMock(spec=pulumi.Resource)
        mock_topic.arn = MagicMock()
        
        with patch('infrastructure.monitoring.aws.sns.Topic', return_value=mock_topic):
            with patch('infrastructure.monitoring.aws.sns.TopicPolicy'):
                with patch('infrastructure.monitoring.aws.get_caller_identity', 
                          return_value=MagicMock(account_id='123456789012')):
                    monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_kms_stack)
                    
                    lambda_name = MagicMock()
                    monitoring_stack.create_lambda_alarm('test-function', lambda_name)
                    
                    self.assertEqual(mock_alarm.call_count, 1)
                    call_kwargs = mock_alarm.call_args[1]
                    self.assertIn('metric_queries', call_kwargs)


class TestCodeBuildStack(unittest.TestCase):
    """Test CodeBuild Stack resource creation."""

    @patch('infrastructure.codebuild.aws.codebuild.Project')
    def test_codebuild_projects_created(self, mock_project):
        """Test CodeBuild build and test projects created."""
        import pulumi
        from infrastructure.codebuild import CodeBuildStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_codebuild_role.return_value = mock_role
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_project_instance = MagicMock(spec=pulumi.Resource)
        mock_project_instance.name = MagicMock()
        mock_project_instance.arn = MagicMock()
        mock_project.return_value = mock_project_instance
        
        codebuild_stack = CodeBuildStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_s3_stack, mock_lambda_stack, mock_kms_stack
        )
        
        self.assertEqual(mock_project.call_count, 2)
        self.assertIn('build', codebuild_stack.projects)
        self.assertIn('test', codebuild_stack.projects)


class TestCodeDeployStack(unittest.TestCase):
    """Test CodeDeploy Stack resource creation."""

    @patch('infrastructure.codedeploy.aws.codedeploy.DeploymentGroup')
    @patch('infrastructure.codedeploy.aws.codedeploy.Application')
    def test_codedeploy_application_created(self, mock_app, mock_group):
        """Test CodeDeploy application and deployment group created."""
        import pulumi
        from infrastructure.codedeploy import CodeDeployStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_codedeploy_role.return_value = mock_role
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_alias = MagicMock(spec=pulumi.Resource)
        mock_lambda_stack.get_function.return_value = mock_function
        mock_lambda_stack.get_alias.return_value = mock_alias
        
        mock_monitoring_stack = MagicMock()
        
        mock_app_instance = MagicMock(spec=pulumi.Resource)
        mock_app_instance.name = MagicMock()
        mock_app_instance.arn = MagicMock()
        mock_app.return_value = mock_app_instance
        
        codedeploy_stack = CodeDeployStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_lambda_stack, mock_monitoring_stack
        )
        
        self.assertEqual(mock_app.call_count, 1)
        self.assertEqual(mock_group.call_count, 1)
        
        call_kwargs = mock_app.call_args[1]
        self.assertEqual(call_kwargs['compute_platform'], 'Lambda')


class TestCodePipelineStack(unittest.TestCase):
    """Test CodePipeline Stack resource creation."""

    @patch('infrastructure.codepipeline.aws.codepipeline.Pipeline')
    def test_pipeline_created_with_four_stages(self, mock_pipeline):
        """Test CodePipeline created with Source, Build, Test, Deploy stages."""
        import pulumi
        from infrastructure.codepipeline import CodePipelineStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_codepipeline_role.return_value = mock_role
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_name.return_value = MagicMock()
        mock_s3_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_codebuild_stack = MagicMock()
        mock_codebuild_stack.get_project_name.return_value = MagicMock()
        mock_codebuild_stack.get_project_arn.return_value = MagicMock()
        
        mock_codedeploy_stack = MagicMock()
        mock_codedeploy_stack.get_application_name.return_value = MagicMock()
        mock_codedeploy_stack.get_application_arn.return_value = MagicMock()
        mock_codedeploy_stack.get_deployment_group_name.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        mock_kms_stack.get_key_id.return_value = MagicMock()
        
        mock_pipeline_instance = MagicMock(spec=pulumi.Resource)
        mock_pipeline_instance.name = MagicMock()
        mock_pipeline_instance.arn = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        pipeline_stack = CodePipelineStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_s3_stack, mock_codebuild_stack, mock_codedeploy_stack, mock_kms_stack
        )
        
        self.assertEqual(mock_pipeline.call_count, 1)
        call_kwargs = mock_pipeline.call_args[1]
        self.assertIn('stages', call_kwargs)
        self.assertEqual(len(call_kwargs['stages']), 4)


class TestEventBridgeStack(unittest.TestCase):
    """Test EventBridge Stack resource creation."""

    @patch('infrastructure.eventbridge.aws.cloudwatch.EventTarget')
    @patch('infrastructure.eventbridge.aws.cloudwatch.EventRule')
    def test_eventbridge_rule_created(self, mock_rule, mock_target):
        """Test EventBridge rule created for S3 to Pipeline trigger."""
        import pulumi
        from infrastructure.eventbridge import EventBridgeStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_name.return_value = MagicMock()
        
        mock_rule_instance = MagicMock(spec=pulumi.Resource)
        mock_rule_instance.name = MagicMock()
        mock_rule.return_value = mock_rule_instance
        
        eventbridge_stack = EventBridgeStack(config, mock_provider_manager, mock_s3_stack)
        
        pipeline_arn = MagicMock()
        pipeline_role_arn = MagicMock()
        
        eventbridge_stack.create_s3_trigger_rule(pipeline_arn, pipeline_role_arn)
        
        self.assertEqual(mock_rule.call_count, 1)
        self.assertEqual(mock_target.call_count, 1)


class TestIAMStackAdditional(unittest.TestCase):
    """Additional IAM Stack tests for coverage."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_codebuild_role_with_resources(self, mock_role, mock_policy):
        """Test CodeBuild role created with resource ARNs."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        source_arn = MagicMock()
        artifacts_arn = MagicMock()
        lambda_arn = MagicMock()
        kms_arns = [MagicMock(), MagicMock()]
        
        role = iam_stack.create_codebuild_role(
            'build', source_arn, artifacts_arn, lambda_arn, kms_arns
        )
        
        self.assertIsNotNone(role)
        self.assertEqual(mock_policy.call_count, 1)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_codepipeline_role_created(self, mock_role, mock_policy):
        """Test CodePipeline role created with permissions."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        role = iam_stack.create_codepipeline_role(
            'main', MagicMock(), MagicMock(), MagicMock(), MagicMock(), [MagicMock()]
        )
        
        self.assertIsNotNone(role)


class TestLambdaStackGetters(unittest.TestCase):
    """Test Lambda Stack getter methods."""

    @patch('infrastructure.lambda_functions.aws.lambda_.Alias')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_lambda_getters(self, mock_log_group, mock_function, mock_alias):
        """Test Lambda stack getter methods."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_kms_stack = MagicMock()
        mock_key = MagicMock(spec=pulumi.Resource)
        mock_key.arn = MagicMock()
        mock_kms_stack.get_key.return_value = mock_key
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_instance.name = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function_instance.version = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_alias_instance = MagicMock(spec=pulumi.Resource)
        mock_alias.return_value = mock_alias_instance
        
        lambda_stack = LambdaStack(config, mock_provider_manager, mock_iam_stack, mock_kms_stack)
        
        self.assertIsNotNone(lambda_stack.get_function('deployment'))
        self.assertIsNotNone(lambda_stack.get_function_name('deployment'))
        self.assertIsNotNone(lambda_stack.get_function_arn('deployment'))
        self.assertIsNotNone(lambda_stack.get_alias('deployment'))
        self.assertIsNotNone(lambda_stack.get_log_group_name('deployment'))


class TestMonitoringStackGetters(unittest.TestCase):
    """Test Monitoring Stack getter methods."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.TopicPolicy')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.aws.get_caller_identity')
    def test_pipeline_alarm_created(self, mock_caller_id, mock_topic, mock_policy, mock_alarm):
        """Test pipeline failure alarm created."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        config = CICDConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_key = MagicMock(spec=pulumi.Resource)
        mock_key.id = MagicMock()
        mock_key.arn = MagicMock()
        mock_kms_stack.get_key.return_value = mock_key
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_kms_stack)
        
        pipeline_name = MagicMock()
        monitoring_stack.create_pipeline_alarm(pipeline_name)
        
        self.assertEqual(mock_alarm.call_count, 1)
        self.assertIsNotNone(monitoring_stack.get_sns_topic('notifications'))
        self.assertIsNotNone(monitoring_stack.get_sns_topic_arn('notifications'))


class TestStackGetters(unittest.TestCase):
    """Test stack getter methods for coverage."""

    def test_kms_stack_getters(self):
        """Test KMS stack getter methods."""
        import pulumi
        from infrastructure.kms import KMSStack
        
        with patch('infrastructure.kms.aws.kms.Key') as mock_key:
            with patch('infrastructure.kms.aws.kms.Alias'):
                with patch('infrastructure.kms.aws.get_caller_identity', 
                          return_value=MagicMock(account_id='123456789012')):
                    config = CICDConfig()
                    mock_provider_manager = MagicMock()
                    mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
                    
                    mock_key_instance = MagicMock(spec=pulumi.Resource)
                    mock_key_instance.id = MagicMock()
                    mock_key_instance.arn = MagicMock()
                    mock_key.return_value = mock_key_instance
                    
                    kms_stack = KMSStack(config, mock_provider_manager)
                    
                    self.assertIsNotNone(kms_stack.get_key('lambda'))
                    self.assertIsNotNone(kms_stack.get_key_arn('lambda'))
                    self.assertIsNotNone(kms_stack.get_key_id('lambda'))

    def test_s3_stack_getters(self):
        """Test S3 stack getter methods."""
        import pulumi
        from infrastructure.s3 import S3Stack
        
        with patch('infrastructure.s3.aws.s3.Bucket') as mock_bucket:
            with patch('infrastructure.s3.aws.s3.BucketVersioning'):
                with patch('infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration'):
                    with patch('infrastructure.s3.aws.s3.BucketLifecycleConfiguration'):
                        with patch('infrastructure.s3.aws.s3.BucketPolicy'):
                            config = CICDConfig()
                            mock_provider_manager = MagicMock()
                            mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
                            
                            mock_kms_stack = MagicMock()
                            mock_key = MagicMock(spec=pulumi.Resource)
                            mock_key.arn = MagicMock()
                            mock_kms_stack.get_key.return_value = mock_key
                            
                            mock_bucket_instance = MagicMock(spec=pulumi.Resource)
                            mock_bucket_instance.id = MagicMock()
                            mock_bucket_instance.arn = MagicMock()
                            mock_bucket_instance.bucket = MagicMock()
                            mock_bucket.return_value = mock_bucket_instance
                            
                            s3_stack = S3Stack(config, mock_provider_manager, mock_kms_stack)
                            
                            self.assertIsNotNone(s3_stack.get_bucket('source'))
                            self.assertIsNotNone(s3_stack.get_bucket_name('source'))
                            self.assertIsNotNone(s3_stack.get_bucket_arn('source'))

    def test_codebuild_stack_getters(self):
        """Test CodeBuild stack getter methods."""
        import pulumi
        from infrastructure.codebuild import CodeBuildStack
        
        with patch('infrastructure.codebuild.aws.codebuild.Project') as mock_project:
            config = CICDConfig()
            mock_provider_manager = MagicMock()
            mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
            
            mock_iam_stack = MagicMock()
            mock_role = MagicMock(spec=pulumi.Resource)
            mock_role.arn = MagicMock()
            mock_iam_stack.create_codebuild_role.return_value = mock_role
            
            mock_s3_stack = MagicMock()
            mock_s3_stack.get_bucket_arn.return_value = MagicMock()
            
            mock_lambda_stack = MagicMock()
            mock_lambda_stack.get_function_arn.return_value = MagicMock()
            mock_lambda_stack.get_function_name.return_value = MagicMock()
            
            mock_kms_stack = MagicMock()
            mock_kms_stack.get_key_arn.return_value = MagicMock()
            
            mock_project_instance = MagicMock(spec=pulumi.Resource)
            mock_project_instance.name = MagicMock()
            mock_project_instance.arn = MagicMock()
            mock_project.return_value = mock_project_instance
            
            codebuild_stack = CodeBuildStack(
                config, mock_provider_manager, mock_iam_stack,
                mock_s3_stack, mock_lambda_stack, mock_kms_stack
            )
            
            self.assertIsNotNone(codebuild_stack.get_project('build'))
            self.assertIsNotNone(codebuild_stack.get_project_name('build'))
            self.assertIsNotNone(codebuild_stack.get_project_arn('build'))

    def test_codedeploy_stack_getters(self):
        """Test CodeDeploy stack getter methods."""
        import pulumi
        from infrastructure.codedeploy import CodeDeployStack
        
        with patch('infrastructure.codedeploy.aws.codedeploy.DeploymentGroup') as mock_group:
            with patch('infrastructure.codedeploy.aws.codedeploy.Application') as mock_app:
                config = CICDConfig()
                mock_provider_manager = MagicMock()
                mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
                
                mock_iam_stack = MagicMock()
                mock_role = MagicMock(spec=pulumi.Resource)
                mock_role.arn = MagicMock()
                mock_iam_stack.create_codedeploy_role.return_value = mock_role
                
                mock_lambda_stack = MagicMock()
                mock_function = MagicMock(spec=pulumi.Resource)
                mock_alias = MagicMock(spec=pulumi.Resource)
                mock_lambda_stack.get_function.return_value = mock_function
                mock_lambda_stack.get_alias.return_value = mock_alias
                
                mock_monitoring_stack = MagicMock()
                
                mock_app_instance = MagicMock(spec=pulumi.Resource)
                mock_app_instance.name = MagicMock()
                mock_app_instance.arn = MagicMock()
                mock_app.return_value = mock_app_instance
                
                mock_group_instance = MagicMock(spec=pulumi.Resource)
                mock_group_instance.deployment_group_name = MagicMock()
                mock_group.return_value = mock_group_instance
                
                codedeploy_stack = CodeDeployStack(
                    config, mock_provider_manager, mock_iam_stack,
                    mock_lambda_stack, mock_monitoring_stack
                )
                
                self.assertIsNotNone(codedeploy_stack.get_application_name('lambda-deploy'))
                self.assertIsNotNone(codedeploy_stack.get_application_arn('lambda-deploy'))
                self.assertIsNotNone(codedeploy_stack.get_deployment_group_name('lambda-deploy'))

    def test_codepipeline_stack_getters(self):
        """Test CodePipeline stack getter methods."""
        import pulumi
        from infrastructure.codepipeline import CodePipelineStack
        
        with patch('infrastructure.codepipeline.aws.codepipeline.Pipeline') as mock_pipeline:
            config = CICDConfig()
            mock_provider_manager = MagicMock()
            mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
            
            mock_iam_stack = MagicMock()
            mock_role = MagicMock(spec=pulumi.Resource)
            mock_role.arn = MagicMock()
            mock_iam_stack.create_codepipeline_role.return_value = mock_role
            
            mock_s3_stack = MagicMock()
            mock_s3_stack.get_bucket_name.return_value = MagicMock()
            mock_s3_stack.get_bucket_arn.return_value = MagicMock()
            
            mock_codebuild_stack = MagicMock()
            mock_codebuild_stack.get_project_name.return_value = MagicMock()
            mock_codebuild_stack.get_project_arn.return_value = MagicMock()
            
            mock_codedeploy_stack = MagicMock()
            mock_codedeploy_stack.get_application_name.return_value = MagicMock()
            mock_codedeploy_stack.get_application_arn.return_value = MagicMock()
            mock_codedeploy_stack.get_deployment_group_name.return_value = MagicMock()
            
            mock_kms_stack = MagicMock()
            mock_kms_stack.get_key_arn.return_value = MagicMock()
            mock_kms_stack.get_key_id.return_value = MagicMock()
            
            mock_pipeline_instance = MagicMock(spec=pulumi.Resource)
            mock_pipeline_instance.name = MagicMock()
            mock_pipeline_instance.arn = MagicMock()
            mock_pipeline.return_value = mock_pipeline_instance
            
            pipeline_stack = CodePipelineStack(
                config, mock_provider_manager, mock_iam_stack,
                mock_s3_stack, mock_codebuild_stack, mock_codedeploy_stack, mock_kms_stack
            )
            
            self.assertIsNotNone(pipeline_stack.get_pipeline_name('main'))
            self.assertIsNotNone(pipeline_stack.get_pipeline_arn('main'))


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration."""

    @patch('lib.tap_stack.pulumi.export')
    @patch('lib.tap_stack.EventBridgeStack')
    @patch('lib.tap_stack.CodePipelineStack')
    @patch('lib.tap_stack.CodeDeployStack')
    @patch('lib.tap_stack.CodeBuildStack')
    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.KMSStack')
    @patch('lib.tap_stack.AWSProviderManager')
    def test_tap_stack_creates_all_components(self, mock_provider, mock_kms, mock_s3,
                                              mock_iam, mock_lambda, mock_monitoring,
                                              mock_codebuild, mock_codedeploy,
                                              mock_codepipeline, mock_eventbridge,
                                              mock_export):
        """Test TapStack creates all infrastructure components."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        mock_kms_instance = MagicMock()
        mock_kms_instance.get_key_id.return_value = MagicMock()
        mock_kms_instance.get_key_arn.return_value = MagicMock()
        mock_kms.return_value = mock_kms_instance
        
        mock_s3_instance = MagicMock()
        mock_s3_instance.get_bucket_name.return_value = MagicMock()
        mock_s3_instance.get_bucket_arn.return_value = MagicMock()
        mock_s3_instance.enable_eventbridge_notifications = MagicMock()
        mock_s3.return_value = mock_s3_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_role.return_value = MagicMock(arn=MagicMock())
        mock_iam.return_value = mock_iam_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_alias.return_value = MagicMock(name=MagicMock())
        mock_lambda_instance.get_log_group_name.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_sns_topic_arn.return_value = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        mock_codebuild_instance = MagicMock()
        mock_codebuild_instance.get_project_name.return_value = MagicMock()
        mock_codebuild_instance.get_project_arn.return_value = MagicMock()
        mock_codebuild.return_value = mock_codebuild_instance
        
        mock_codedeploy_instance = MagicMock()
        mock_codedeploy_instance.get_application_name.return_value = MagicMock()
        mock_codedeploy_instance.get_application_arn.return_value = MagicMock()
        mock_codedeploy_instance.get_deployment_group_name.return_value = MagicMock()
        mock_codedeploy.return_value = mock_codedeploy_instance
        
        mock_codepipeline_instance = MagicMock()
        mock_codepipeline_instance.get_pipeline_name.return_value = MagicMock()
        mock_codepipeline_instance.get_pipeline_arn.return_value = MagicMock()
        mock_codepipeline.return_value = mock_codepipeline_instance
        
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test'))
        
        self.assertEqual(mock_kms.call_count, 1)
        self.assertEqual(mock_s3.call_count, 1)
        self.assertEqual(mock_iam.call_count, 1)
        self.assertEqual(mock_lambda.call_count, 1)
        self.assertEqual(mock_monitoring.call_count, 1)
        self.assertEqual(mock_codebuild.call_count, 1)
        self.assertEqual(mock_codedeploy.call_count, 1)
        self.assertEqual(mock_codepipeline.call_count, 1)
        self.assertEqual(mock_eventbridge.call_count, 1)
        self.assertGreater(mock_export.call_count, 20)


if __name__ == '__main__':
    unittest.main()
