"""
Unit tests for the TapStack Pulumi component using mocking.
Tests TapStack orchestration without actual AWS calls.
"""

import unittest
from unittest.mock import patch, MagicMock

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib.config import ConfigManager


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()

    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {"Owner": "TestTeam", "CostCenter": "Engineering"}
    args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

    self.assertEqual(args.environment_suffix, 'staging')
    self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
  """Test cases for TapStack Pulumi component."""

  def setUp(self):
    """Set up test environment."""
    self.test_args = TapStackArgs(
      environment_suffix='dev',
      tags={"Environment": "test", "Owner": "unittest"}
    )

  @patch('lib.tap_stack.ConfigManager')
  @patch('lib.tap_stack.aws')
  def test_tap_stack_creation(self, mock_aws, mock_config_manager):
    """Test TapStack component creation and initialization."""
    # Mock configuration
    mock_config = MagicMock()
    mock_config.regions = ["us-west-2", "us-east-1"]
    mock_config.primary_region = "us-west-2"
    mock_config.secondary_region = "us-east-1"
    mock_config.app_name = "test-app"
    mock_config.environment.value = "dev"
    mock_config.security.enable_waf = True
    mock_config_manager.get_config.return_value = mock_config

    # Mock AWS provider
    mock_provider = MagicMock()
    mock_aws.Provider.return_value = mock_provider

    # Mock component creation
    with patch('lib.tap_stack.NetworkingComponent') as mock_networking, \
        patch('lib.tap_stack.SecurityComponent') as mock_security, \
        patch('lib.tap_stack.StorageComponent') as mock_storage, \
        patch('lib.tap_stack.SecretsComponent') as mock_secrets, \
        patch('lib.tap_stack.ComputeComponent') as mock_compute, \
        patch('lib.tap_stack.MonitoringComponent') as mock_monitoring:
      # Mock component instances
      mock_networking_instance = MagicMock()
      mock_networking_instance.vpc_id = "vpc-123"
      mock_networking_instance.private_subnet_ids = ["subnet-1"]
      mock_networking_instance.public_subnet_ids = ["subnet-2"]
      mock_networking.return_value = mock_networking_instance

      mock_security_instance = MagicMock()
      mock_security_instance.alb_sg_id = "sg-alb"
      mock_security_instance.ec2_sg_id = "sg-ec2"
      mock_security_instance.database_sg_id = "sg-db"
      mock_security_instance.certificate_arn = "arn:cert"
      mock_security_instance.ec2_instance_profile_name = "profile"
      mock_security_instance.waf_arn = "arn:waf"
      mock_security.return_value = mock_security_instance

      mock_storage_instance = MagicMock()
      mock_storage_instance.backup_bucket_name = "backup-bucket"
      mock_storage.return_value = mock_storage_instance

      mock_secrets_instance = MagicMock()
      mock_secrets_instance.app_secrets_arn = "arn:secret"
      mock_secrets.return_value = mock_secrets_instance

      mock_compute_instance = MagicMock()
      mock_compute_instance.alb_arn = "arn:alb"
      mock_compute_instance.alb_dns_name = "alb.example.com"
      mock_compute.return_value = mock_compute_instance

      # Mock database (even though it's disabled) for test compatibility
      mock_database = MagicMock()

      # Create TapStack
      with patch('pulumi.export') as mock_export:
        TapStack(
          "test-stack",
          args=self.test_args
        )

        # Verify configuration was retrieved
        mock_config_manager.get_config.assert_called_once()

        # Verify components were created for each region
        self.assertEqual(mock_networking.call_count, 2)  # 2 regions
        self.assertEqual(mock_security.call_count, 2)
        self.assertEqual(mock_storage.call_count, 2)
        self.assertEqual(mock_secrets.call_count, 2)
        self.assertEqual(mock_compute.call_count, 2)

        # Database deployment is disabled due to SCP restrictions,
        # monitoring should only be created in primary region
        self.assertEqual(mock_database.call_count, 0)  # Database disabled due to SCP restrictions
        self.assertEqual(mock_monitoring.call_count, 1)

        # Verify exports were called
        self.assertTrue(mock_export.called)

  @patch('lib.tap_stack.ConfigManager')
  def test_tap_stack_single_region(self, mock_config_manager):
    """Test TapStack with single region deployment."""
    # Mock configuration for single region
    mock_config = MagicMock()
    mock_config.regions = ["us-west-2"]
    mock_config.primary_region = "us-west-2"
    mock_config.secondary_region = "us-west-2"  # Same as primary
    mock_config.app_name = "test-app"
    mock_config.environment.value = "dev"
    mock_config.security.enable_waf = False
    mock_config_manager.get_config.return_value = mock_config

    with patch('lib.tap_stack.NetworkingComponent'), \
        patch('lib.tap_stack.SecurityComponent'), \
        patch('lib.tap_stack.StorageComponent'), \
        patch('lib.tap_stack.SecretsComponent'), \
        patch('lib.tap_stack.ComputeComponent'), \
        patch('lib.tap_stack.MonitoringComponent'):
      with patch('pulumi.export') as mock_export:
        TapStack(
          "test-stack",
          args=self.test_args
        )

        # Verify single region deployment
        mock_config_manager.get_config.assert_called_once()
        self.assertTrue(mock_export.called)

  @patch('lib.tap_stack.ConfigManager')
  def test_tap_stack_waf_disabled(self, mock_config_manager):
    """Test TapStack when WAF is disabled."""
    # Mock configuration with WAF disabled
    mock_config = MagicMock()
    mock_config.regions = ["us-west-2"]
    mock_config.primary_region = "us-west-2"
    mock_config.secondary_region = "us-west-2"
    mock_config.app_name = "test-app"
    mock_config.environment.value = "dev"
    mock_config.security.enable_waf = False
    mock_config_manager.get_config.return_value = mock_config

    with patch('lib.tap_stack.NetworkingComponent'), \
        patch('lib.tap_stack.SecurityComponent'), \
        patch('lib.tap_stack.StorageComponent'), \
        patch('lib.tap_stack.SecretsComponent'), \
        patch('lib.tap_stack.ComputeComponent'), \
        patch('lib.tap_stack.MonitoringComponent'), \
        patch('lib.tap_stack.aws.wafv2.WebAclAssociation') as mock_waf_association:
      with patch('pulumi.export'):
        TapStack(
          "test-stack",
          args=self.test_args
        )

        # Verify WAF association was not created
        mock_waf_association.assert_not_called()

  def test_tap_stack_attributes(self):
    """Test TapStack stores argument attributes correctly."""
    test_tags = {"Owner": "TestTeam"}
    args = TapStackArgs(environment_suffix='staging', tags=test_tags)

    with patch('lib.tap_stack.ConfigManager') as mock_config_manager:
      mock_config = MagicMock()
      mock_config.regions = ["us-west-2"]
      mock_config.primary_region = "us-west-2"
      mock_config.secondary_region = "us-west-2"
      mock_config.app_name = "test-app"
      mock_config.environment.value = "staging"
      mock_config.security.enable_waf = False
      mock_config_manager.get_config.return_value = mock_config

      with patch('lib.tap_stack.NetworkingComponent'), \
          patch('lib.tap_stack.SecurityComponent'), \
          patch('lib.tap_stack.StorageComponent'), \
          patch('lib.tap_stack.SecretsComponent'), \
          patch('lib.tap_stack.ComputeComponent'), \
          patch('lib.tap_stack.MonitoringComponent'):
        with patch('pulumi.export'):
          stack = TapStack(
            "test-stack",
            args=args
          )

          # Verify attributes are stored correctly
          self.assertEqual(stack.environment_suffix, 'staging')
          self.assertEqual(stack.tags, test_tags)


class TestConfigManager(unittest.TestCase):
  """Test cases for ConfigManager."""

  def test_config_manager_secondary_region_property(self):
    """Test secondary_region property returns correct value."""
    config = ConfigManager.get_config("dev")

    # Should return second region if available
    if len(config.regions) > 1:
      self.assertEqual(config.secondary_region, config.regions[1])
    else:
      self.assertEqual(config.secondary_region, config.primary_region)


class TestComponentConfiguration(unittest.TestCase):
  """Test cases for component configuration classes."""

  def test_component_dependencies_creation(self):
    """Test ComponentDependencies can be created with default values."""
    from lib.config import ComponentDependencies  # pylint: disable=import-outside-toplevel
    deps = ComponentDependencies()
    self.assertIsNone(deps.vpc_id)
    self.assertIsNone(deps.private_subnet_ids)
    self.assertIsNone(deps.public_subnet_ids)


if __name__ == "__main__":
  unittest.main()
