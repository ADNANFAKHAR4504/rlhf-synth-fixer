"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import json
import unittest
from unittest.mock import patch, Mock, MagicMock
import pulumi

# Import the components we're testing
from lib.components.s3_bucket import SecureS3Bucket, SecureS3BucketConfig
from lib.components.sns_topic import SNSTopic, SNSTopicConfig
from lib.components.kms_key import KMSKey, KMSKeyConfig
from lib.components.iam_role import S3IAMRole, S3IAMRoleConfig
from lib.components.cloudwatch_alarm import CloudWatchAlarm, CloudWatchAlarmConfig


def create_mock_resource(name="MockResource", **attributes):
  """Create a mock object that inherits from pulumi.Resource to satisfy depends_on validation."""
  mock = MagicMock(spec=pulumi.Resource)
  mock.__class__ = type(name, (pulumi.Resource,), {})
  
  # Set common attributes that might be needed
  mock.arn = pulumi.Output.from_input(f"arn:aws:service::123456789012:resource/{name.lower()}")
  mock.name = pulumi.Output.from_input(f"{name.lower()}-name")
  mock.id = pulumi.Output.from_input(f"{name.lower()}-id")
  mock.key_id = pulumi.Output.from_input(f"{name.lower()}-key-id")
  
  # Add any additional attributes passed
  for attr, value in attributes.items():
    setattr(mock, attr, value)
  
  return mock


class TestSecureS3Bucket(unittest.TestCase):
  """Unit tests for SecureS3Bucket component."""

  def setUp(self):
    """Set up test fixtures."""
    self.kms_key_arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test-key")
    self.sns_topic_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789012:test-topic")

  @patch('pulumi.ResourceOptions')
  @patch('pulumi_aws.s3.Bucket')
  @patch('pulumi_aws.s3.BucketVersioningV2')
  @patch('pulumi_aws.s3.BucketServerSideEncryptionConfigurationV2')
  @patch('pulumi_aws.s3.BucketPublicAccessBlock')
  @patch('pulumi_aws.s3.BucketLifecycleConfigurationV2')
  @patch('pulumi_aws.s3.BucketNotification')
  def test_secure_s3_bucket_creation(self, *mocks):  # pylint: disable=too-many-positional-arguments
    """Test SecureS3Bucket creates all required resources."""
    # Unpack mocks in reverse order (since decorators are applied bottom-up)
    (mock_notification, mock_lifecycle, mock_public_access, 
     mock_encryption, mock_versioning, mock_bucket, mock_resource_options) = mocks
    
    # Mock Pulumi stack
    with patch('pulumi.get_stack', return_value='test'):
      SecureS3Bucket(
        "test-bucket",
        config=SecureS3BucketConfig(
          kms_key_id=self.kms_key_arn,
          sns_topic_arn=self.sns_topic_arn
        )
      )

    # Verify all resources are created
    mock_bucket.assert_called_once()
    mock_versioning.assert_called_once()
    mock_encryption.assert_called_once()
    mock_public_access.assert_called_once()
    mock_lifecycle.assert_called_once()
    mock_notification.assert_called_once()
    # ResourceOptions should be called multiple times
    self.assertGreater(mock_resource_options.call_count, 0)

  @patch('pulumi.ResourceOptions')
  @patch('pulumi_aws.s3.Bucket')
  @patch('pulumi_aws.s3.BucketVersioningV2')
  @patch('pulumi_aws.s3.BucketServerSideEncryptionConfigurationV2')
  @patch('pulumi_aws.s3.BucketPublicAccessBlock')
  @patch('pulumi_aws.s3.BucketLifecycleConfigurationV2')
  @patch('pulumi_aws.s3.BucketLoggingV2')
  @patch('pulumi_aws.s3.BucketNotification')
  def test_bucket_name_generation(self, *mocks):
    """Test bucket name includes stack name."""
    # Get the bucket mock (second from the end due to decorator order)
    mock_bucket = mocks[-2]
    
    with patch('pulumi.get_stack', return_value='dev'):
      SecureS3Bucket(
        "test",
        config=SecureS3BucketConfig(
          kms_key_id=self.kms_key_arn,
          sns_topic_arn=self.sns_topic_arn
        )
      )

      # Check bucket name format
      call_args = mock_bucket.call_args
      self.assertIn("test-secure-bucket-dev", str(call_args))


class TestSNSTopic(unittest.TestCase):
  """Unit tests for SNSTopic component."""

  def setUp(self):
    """Set up test fixtures."""
    self.kms_key_id = pulumi.Output.from_input("test-key-id")

  @patch('pulumi_aws.sns.Topic')
  @patch('pulumi_aws.sns.TopicPolicy')
  def test_sns_topic_creation(self, mock_policy, mock_topic):
    """Test SNSTopic creates topic and policy."""
    # Mock the topic to return a proper Resource-like object for dependencies
    mock_topic.return_value = create_mock_resource("Topic")
    
    SNSTopic(
      "test-topic",
      SNSTopicConfig(kms_key_id=self.kms_key_id)
    )

    mock_topic.assert_called_once()
    mock_policy.assert_called_once()

  @patch('pulumi_aws.sns.Topic')
  @patch('pulumi_aws.sns.TopicPolicy')
  @patch('pulumi_aws.sns.TopicSubscription')
  def test_sns_topic_with_email(self, mock_subscription, mock_policy, mock_topic):
    """Test SNSTopic creates email subscription when provided."""
    # Mock the topic to return a proper Resource-like object for dependencies
    mock_topic.return_value = create_mock_resource("Topic")
    
    SNSTopic(
      "test-topic",
      SNSTopicConfig(
        kms_key_id=self.kms_key_id,
        email_endpoint="test@example.com"
      )
    )

    mock_topic.assert_called_once()
    mock_policy.assert_called_once()
    mock_subscription.assert_called_once()


class TestKMSKey(unittest.TestCase):
  """Unit tests for KMSKey component."""

  @patch('pulumi_aws.kms.Key')
  @patch('pulumi_aws.kms.Alias')
  @patch('pulumi_aws.get_caller_identity')
  def test_kms_key_creation(self, mock_caller_id, mock_alias, mock_key):
    """Test KMSKey creates key and alias."""
    mock_caller_id.return_value = Mock(account_id="123456789012")
    # Mock the key to return a proper Resource-like object for dependencies
    mock_key.return_value = create_mock_resource("Key")

    KMSKey("test-key", KMSKeyConfig(description="Test KMS key"))

    mock_key.assert_called_once()
    mock_alias.assert_called_once()

  @patch('pulumi_aws.kms.Key')
  @patch('pulumi_aws.get_caller_identity')
  def test_kms_key_rotation_enabled(self, mock_caller_id, mock_key):
    """Test KMS key has rotation enabled."""
    mock_caller_id.return_value = Mock(account_id="123456789012")
    # Mock the key to return a proper Resource-like object for dependencies
    mock_key.return_value = create_mock_resource("Key")

    KMSKey("test-key", KMSKeyConfig())

    call_args = mock_key.call_args[1]
    self.assertTrue(call_args['enable_key_rotation'])


class TestS3IAMRole(unittest.TestCase):
  """Unit tests for S3IAMRole component."""

  def setUp(self):
    """Set up test fixtures."""
    self.bucket_arn = pulumi.Output.from_input("arn:aws:s3:::test-bucket")
    self.kms_key_arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test-key")

  @patch('pulumi_aws.iam.Role')
  @patch('pulumi_aws.iam.Policy')
  @patch('pulumi_aws.iam.RolePolicyAttachment')
  @patch('pulumi_aws.iam.InstanceProfile')
  def test_iam_role_creation(self, mock_profile, mock_attachment,
                             mock_policy, mock_role):
    """Test S3IAMRole creates all IAM resources."""
    # Mock the role to return a proper Resource-like object for dependencies
    mock_role.return_value = create_mock_resource("Role")
    
    S3IAMRole(
      "test-role",
      S3IAMRoleConfig(
        bucket_arn=self.bucket_arn,
        kms_key_arn=self.kms_key_arn
      )
    )

    mock_role.assert_called_once()
    mock_policy.assert_called_once()
    mock_attachment.assert_called_once()
    mock_profile.assert_called_once()

  @patch('pulumi_aws.iam.Role')
  def test_assume_role_policy(self, mock_role):
    """Test IAM role has correct assume role policy."""
    # Mock the role to return a proper Resource-like object for dependencies
    mock_role.return_value = create_mock_resource("Role")
    
    S3IAMRole(
      "test-role",
      S3IAMRoleConfig(
        bucket_arn=self.bucket_arn,
        kms_key_arn=self.kms_key_arn
      )
    )

    call_args = mock_role.call_args[1]
    policy = json.loads(call_args['assume_role_policy'])

    self.assertEqual(policy['Version'], '2012-10-17')
    self.assertEqual(
      policy['Statement'][0]['Principal']['Service'],
      'ec2.amazonaws.com'
    )


class TestCloudWatchAlarm(unittest.TestCase):
  """Unit tests for CloudWatchAlarm component."""

  def setUp(self):
    """Set up test fixtures."""
    self.bucket_name = pulumi.Output.from_input("test-bucket")
    self.sns_topic_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789012:test-topic")

  @patch('pulumi_aws.cloudwatch.MetricAlarm')
  def test_cloudwatch_alarm_creation(self, mock_alarm):
    """Test CloudWatchAlarm creates both alarms."""
    CloudWatchAlarm(
      "test-alarm",
      CloudWatchAlarmConfig(
        bucket_name=self.bucket_name,
        sns_topic_arn=self.sns_topic_arn
      )
    )

    # Should create two alarms (access denied and high request)
    self.assertEqual(mock_alarm.call_count, 2)

  @patch('pulumi_aws.cloudwatch.MetricAlarm')
  def test_alarm_parameters(self, mock_alarm):
    """Test CloudWatch alarms have correct parameters."""
    CloudWatchAlarm(
      "test-alarm",
      CloudWatchAlarmConfig(
        bucket_name=self.bucket_name,
        sns_topic_arn=self.sns_topic_arn
      )
    )

    # Check first alarm call (access denied)
    first_call = mock_alarm.call_args_list[0][1]
    self.assertEqual(first_call['metric_name'], '4xxErrors')
    self.assertEqual(first_call['namespace'], 'AWS/S3')
    self.assertEqual(first_call['unit'], 'Count')
    self.assertEqual(first_call['datapoints_to_alarm'], 1)

    # Check second alarm call (high requests)
    second_call = mock_alarm.call_args_list[1][1]
    self.assertEqual(second_call['metric_name'], 'AllRequests')
    self.assertEqual(second_call['datapoints_to_alarm'], 2)


if __name__ == '__main__':
  unittest.main()
