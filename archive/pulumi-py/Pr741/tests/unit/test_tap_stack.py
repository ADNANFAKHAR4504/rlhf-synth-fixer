"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, Mock

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()
    
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {'Environment': 'test', 'Project': 'test-proj'}
    args = TapStackArgs(environment_suffix='staging', tags=custom_tags)
    
    self.assertEqual(args.environment_suffix, 'staging')
    self.assertEqual(args.tags, custom_tags)

  def test_tap_stack_args_none_environment_suffix(self):
    """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
    args = TapStackArgs(environment_suffix=None)
    
    self.assertEqual(args.environment_suffix, 'dev')


class TestTapStackConfiguration(unittest.TestCase):
  """Test cases for TapStack configuration loading."""

  def setUp(self):
    """Set up test fixtures."""
    self.test_tags = {'Environment': 'test', 'Project': 'test-project'}
    self.test_args = TapStackArgs(environment_suffix='test', tags=self.test_tags)

  @patch('lib.tap_stack.Config')
  @patch('lib.tap_stack.aws.get_caller_identity')
  def test_load_config_with_defaults(self, mock_get_caller_identity, mock_config_class):
    """Test configuration loading with default values."""
    # Mock the Config instance
    mock_config = Mock()
    mock_config.get.side_effect = lambda key, default=None: {
      'namePrefix': 'corp',
      'aws.region': 'us-west-2',
      'aws.backendRegion': 'us-east-1',
      'github.owner': 'test-owner',
      'github.repo': 'test-repo',
      'github.branch': 'main',
      'deploy.targetBucketName': None,
      'rbac.approverArns': '[]',
      'slack.workspaceId': 'T0000000000',
      'slack.channelId': 'C0000000000',
      'build.buildspec': None
    }.get(key, default)
    
    mock_config_class.return_value = mock_config
    mock_get_caller_identity.return_value = Mock(account_id='123456789012')
    
    # Create a mock TapStack instance to test _load_config
    with patch.object(TapStack, '__init__', return_value=None):
      stack = TapStack.__new__(TapStack)
      stack.environment_suffix = 'test'
      stack.tags = self.test_tags
      
      # Call the method we're testing
      stack._load_config()  # pylint: disable=protected-access
      
      # Verify configuration was loaded correctly
      self.assertEqual(stack.name_prefix, 'corp')
      self.assertEqual(stack.resource_name_prefix, 'corp-test')
      self.assertEqual(stack.target_region, 'us-west-2')
      self.assertEqual(stack.backend_region, 'us-east-1')
      self.assertEqual(stack.github_owner, 'test-owner')
      self.assertEqual(stack.github_repo, 'test-repo')
      self.assertEqual(stack.github_branch, 'main')
      self.assertEqual(stack.deploy_target_bucket, 'corp-test-deploy-target')
      self.assertEqual(stack.rbac_approver_arns, [])
      self.assertEqual(stack.slack_workspace_id, 'T0000000000')
      self.assertEqual(stack.slack_channel_id, 'C0000000000')

  @patch('lib.tap_stack.Config')
  def test_load_config_with_invalid_json(self, mock_config_class):
    """Test configuration loading with invalid JSON in rbac.approverArns."""
    mock_config = Mock()
    mock_config.get.side_effect = lambda key, default=None: {
      'rbac.approverArns': 'invalid-json'
    }.get(key, default)
    
    mock_config_class.return_value = mock_config
    
    with patch.object(TapStack, '__init__', return_value=None):
      stack = TapStack.__new__(TapStack)
      stack.environment_suffix = 'test'
      stack.tags = self.test_tags
      
      # Mock pulumi.log.warn to capture the warning
      with patch('pulumi.log.warn') as mock_warn:
        stack._load_config()  # pylint: disable=protected-access
        
        # Verify warning was logged and fallback was used
        mock_warn.assert_called_once()
        self.assertEqual(stack.rbac_approver_arns, [])

  def test_get_default_buildspec(self):
    """Test default buildspec generation."""
    with patch.object(TapStack, '__init__', return_value=None):
      stack = TapStack.__new__(TapStack)
      
      buildspec = stack._get_default_buildspec()  # pylint: disable=protected-access
      
      # Verify buildspec contains expected phases
      self.assertIn('version: 0.2', buildspec)
      self.assertIn('phases:', buildspec)
      self.assertIn('pre_build:', buildspec)
      self.assertIn('build:', buildspec)
      self.assertIn('post_build:', buildspec)
      self.assertIn('artifacts:', buildspec)


class TestTapStackResourceCreation(unittest.TestCase):
  """Test cases for TapStack resource creation methods."""

  def setUp(self):
    """Set up test fixtures."""
    self.test_tags = {'Environment': 'test', 'Project': 'test-project'}
    
  @patch('lib.tap_stack.aws.s3.Bucket')
  @patch('lib.tap_stack.aws.s3.BucketPublicAccessBlock')
  @patch('lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2')
  @patch('lib.tap_stack.aws.s3.BucketVersioningV2')
  @patch('lib.tap_stack.ResourceOptions')
  def test_create_artifacts_bucket(self, mock_resource_options, mock_versioning,  # pylint: disable=too-many-positional-arguments
                                   mock_encryption, mock_pab, mock_bucket):
    """Test artifacts bucket creation with security configurations."""
    with patch.object(TapStack, '__init__', return_value=None):
      stack = TapStack.__new__(TapStack)
      stack.resource_name_prefix = 'corp-test'
      stack.tags = self.test_tags
      
      # Mock bucket instance with proper Pulumi-like attributes
      mock_bucket_instance = Mock(spec=['id', 'arn', 'bucket'])
      mock_bucket_instance.id = Mock()
      mock_bucket_instance.arn = Mock()
      mock_bucket_instance.bucket = Mock()
      mock_bucket.return_value = mock_bucket_instance
      
      # Mock ResourceOptions to avoid issues with depends_on
      mock_resource_options.return_value = Mock()
      
      stack._create_artifacts_bucket()  # pylint: disable=protected-access
      
      # Verify bucket was created
      mock_bucket.assert_called_once()
      self.assertEqual(stack.artifacts_bucket, mock_bucket_instance)
      
      # Verify security configurations were applied
      mock_pab.assert_called_once()
      mock_encryption.assert_called_once()
      mock_versioning.assert_called_once()

  @patch('lib.tap_stack.aws.iam.Role')
  @patch('lib.tap_stack.aws.iam.RolePolicy')
  @patch('lib.tap_stack.aws.iam.RolePolicyAttachment')
  @patch('lib.tap_stack.ResourceOptions')
  def test_create_service_roles(self, mock_resource_options, mock_attachment,
                                mock_policy, mock_role):
    """Test IAM service roles creation."""
    with patch.object(TapStack, '__init__', return_value=None):
      stack = TapStack.__new__(TapStack)
      stack.resource_name_prefix = 'corp-test'
      stack.tags = self.test_tags
      stack.target_region = 'us-west-2'
      stack.deploy_target_bucket = 'test-deploy-bucket'
      
      # Mock artifacts bucket with Pulumi Output-like behavior
      mock_bucket = Mock()
      mock_bucket_arn = Mock()
      mock_bucket_arn.apply.return_value = Mock()
      mock_bucket.arn = mock_bucket_arn
      stack.artifacts_bucket = mock_bucket
      
      # Mock role instances
      mock_role_instance = Mock()
      mock_role_instance.id = 'test-role-id'
      mock_role_instance.arn = 'arn:aws:iam::123456789012:role/test-role'
      mock_role_instance.name = 'test-role'
      mock_role.return_value = mock_role_instance
      
      # Mock ResourceOptions
      mock_resource_options.return_value = Mock()
      
      stack._create_service_roles()  # pylint: disable=protected-access
      
      # Verify roles were created (pipeline, codebuild, notifications)
      self.assertEqual(mock_role.call_count, 3)
      self.assertEqual(mock_policy.call_count, 1)  # Only CodeBuild policy in _create_service_roles
      mock_attachment.assert_called_once()  # Notifications policy attachment


class TestTapStackIntegration(unittest.TestCase):
  """Integration-style tests for TapStack without actual AWS resources."""
  
  @patch('lib.tap_stack.aws.s3.Bucket')
  @patch('lib.tap_stack.aws.iam.Role')
  @patch('lib.tap_stack.aws.codebuild.Project')
  @patch('lib.tap_stack.aws.codepipeline.Pipeline')
  @patch('lib.tap_stack.aws.sns.Topic')
  @patch('lib.tap_stack.Config')
  def test_tap_stack_initialization(self, mock_config_class, mock_topic, mock_pipeline,  # pylint: disable=too-many-positional-arguments
                                    mock_codebuild, mock_role, mock_bucket):
    """Test complete TapStack initialization."""
    # Mock configuration
    mock_config = Mock()
    mock_config.get.side_effect = lambda key, default=None: {
      'namePrefix': 'corp',
      'github.owner': 'test-owner',
      'github.repo': 'test-repo',
      'slack.workspaceId': 'T0000000000',
      'slack.channelId': 'C0000000000'
    }.get(key, default)
    mock_config_class.return_value = mock_config
    
    # Mock AWS resources with Pulumi Output-like behavior
    mock_bucket_instance = Mock(spec=['id', 'arn', 'bucket'])
    mock_bucket_instance.id = Mock()
    mock_bucket_instance.arn = Mock()
    mock_bucket_instance.arn.apply = Mock(return_value=Mock())
    mock_bucket_instance.bucket = Mock()
    mock_bucket.return_value = mock_bucket_instance
    
    mock_role_instance = Mock(spec=['id', 'arn', 'name'])
    mock_role_instance.id = Mock()
    mock_role_instance.arn = Mock()
    mock_role_instance.name = Mock()
    mock_role.return_value = mock_role_instance
    
    mock_codebuild_instance = Mock(spec=['name'])
    mock_codebuild_instance.name = Mock()
    mock_codebuild.return_value = mock_codebuild_instance
    
    mock_pipeline_instance = Mock(spec=['arn'])
    mock_pipeline_instance.arn = Mock()
    mock_pipeline_instance.arn.apply = Mock(return_value=Mock())
    mock_pipeline.return_value = mock_pipeline_instance
    
    mock_topic_instance = Mock(spec=['arn'])
    mock_topic_instance.arn = Mock()
    mock_topic_instance.arn.apply = Mock(return_value=Mock())
    mock_topic.return_value = mock_topic_instance
    
    # Mock all other AWS resources
    with patch('lib.tap_stack.aws.s3.BucketPublicAccessBlock'), \
             patch('lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2'), \
             patch('lib.tap_stack.aws.s3.BucketVersioningV2'), \
             patch('lib.tap_stack.aws.iam.RolePolicy'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'), \
             patch('lib.tap_stack.aws.codestarconnections.Connection'), \
             patch('lib.tap_stack.aws.cloudwatch.LogGroup'), \
             patch('lib.tap_stack.aws.chatbot.SlackChannelConfiguration'), \
             patch('lib.tap_stack.aws.codestarnotifications.NotificationRule'), \
             patch('lib.tap_stack.aws.sns.TopicPolicy'), \
             patch('lib.tap_stack.aws.iam.Policy'), \
             patch('lib.tap_stack.aws.iam.Group'), \
             patch('lib.tap_stack.aws.iam.GroupPolicyAttachment'), \
             patch('lib.tap_stack.aws.get_caller_identity') as mock_caller_id, \
             patch('lib.tap_stack.ResourceOptions'):
      
      mock_caller_id.return_value = Mock(account_id='123456789012')
      
      # Create TapStack
      args = TapStackArgs(environment_suffix='test')
      stack = TapStack('test-stack', args)
      
      # Verify stack was created with expected attributes
      self.assertIsNotNone(stack.artifacts_bucket)
      self.assertIsNotNone(stack.pipeline_role)
      self.assertIsNotNone(stack.codebuild_role)
      self.assertIsNotNone(stack.notifications_role)
      self.assertIsNotNone(stack.build_project)


if __name__ == '__main__':
  unittest.main()
