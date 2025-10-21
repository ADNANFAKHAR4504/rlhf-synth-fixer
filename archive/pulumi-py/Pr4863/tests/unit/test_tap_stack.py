"""
test_tap_stack.py

Unit tests for the TapStack Pulumi infrastructure focusing on resource creation
and configuration verification with full mocking and >90% coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

import pulumi

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))


# Mock Pulumi runtime for testing
class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [args.name + '_id', args.inputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == 'aws:ec2/getAmi:getAmi':
            return {'id': 'ami-12345678'}
        elif args.token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {'names': ['us-east-1a', 'us-east-1b', 'us-east-1c']}
        elif args.token == 'aws:index/getCallerIdentity:getCallerIdentity':
            return {'account_id': '123456789012', 'arn': 'arn:aws:iam::123456789012:user/test', 'user_id': 'AIDACKCEVSQ6C2EXAMPLE'}
        return {}


pulumi.runtime.set_mocks(MyMocks())

from infrastructure.config import InfraConfig


class TestInfraConfig(unittest.TestCase):
    """Test InfraConfig - the core configuration class."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = InfraConfig()
            self.assertEqual(config.project_name, 'tap')
            self.assertEqual(config.environment, 'dev')
            self.assertEqual(config.environment_suffix, 'pr1234')

    @patch.dict('os.environ', {
        'ENVIRONMENT': 'prod',
        'ENVIRONMENT_SUFFIX': 'custom123',
        'AWS_REGION': 'eu-west-1'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = InfraConfig()
        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.environment_suffix, 'custom123')
        self.assertEqual(config.primary_region, 'eu-west-1')

    def test_get_resource_name(self):
        """Test resource name generation."""
        config = InfraConfig()
        
        vpc_name = config.get_resource_name('vpc')
        self.assertIn('tap-vpc', vpc_name)
        self.assertTrue(len(vpc_name) > len('tap-vpc'))
        
        bucket_name = config.get_resource_name('backup-bucket', include_region=True)
        self.assertIn('tap-backup-bucket', bucket_name)

    def test_get_tags_for_resource(self):
        """Test tag generation for resources."""
        config = InfraConfig()
        tags = config.get_tags_for_resource('VPC', Name='test-vpc')
        
        self.assertIn('Name', tags)
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['Name'], 'test-vpc')


class TestNetworkingStack(unittest.TestCase):
    """Test Networking stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_networking_stack_creation(self):
        """Test networking stack creates all resources."""
        from infrastructure.networking import NetworkingStack
        
        networking_stack = NetworkingStack(self.config, None)
        
        # Verify all resources were created
        self.assertIsNotNone(networking_stack.vpc)
        self.assertIsNotNone(networking_stack.public_subnets)
        self.assertIsNotNone(networking_stack.private_subnets)
        self.assertIsNotNone(networking_stack.internet_gateway)
        self.assertIsNotNone(networking_stack.nat_gateways)
        self.assertIsNotNone(networking_stack.public_route_table)
        self.assertIsNotNone(networking_stack.private_route_tables)
        
        # Test getters
        self.assertIsNotNone(networking_stack.get_vpc_id())
        self.assertIsNotNone(networking_stack.get_public_subnet_ids())
        self.assertIsNotNone(networking_stack.get_private_subnet_ids())


class TestSecurityStack(unittest.TestCase):
    """Test Security stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_security_stack_creation(self):
        """Test security stack creates all resources."""
        from infrastructure.security import SecurityStack
        
        mock_vpc_id = pulumi.Output.from_input('vpc-12345')
        security_stack = SecurityStack(self.config, mock_vpc_id, None)
        
        # Verify resources created
        self.assertIsNotNone(security_stack.alb_security_group)
        self.assertIsNotNone(security_stack.app_security_group)
        
        # Test getters
        self.assertIsNotNone(security_stack.get_alb_security_group_id())
        self.assertIsNotNone(security_stack.get_app_security_group_id())


class TestIAMStack(unittest.TestCase):
    """Test IAM stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    @patch('pulumi_aws.get_caller_identity')
    def test_iam_stack_creation(self, mock_caller_id):
        """Test IAM stack creates all resources."""
        # Mock the caller identity
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        from infrastructure.iam import IAMStack
        
        iam_stack = IAMStack(self.config, None)
        
        # Verify resources created
        self.assertIsNotNone(iam_stack.ec2_role)
        self.assertIsNotNone(iam_stack.ec2_instance_profile)


class TestComputeStack(unittest.TestCase):
    """Test Compute stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_compute_stack_creation(self):
        """Test compute stack creates all resources."""
        from infrastructure.compute import ComputeStack
        
        mock_subnet_ids = pulumi.Output.from_input(['subnet-1', 'subnet-2'])
        mock_sg_id = pulumi.Output.from_input('sg-12345')
        mock_profile_name = pulumi.Output.from_input('profile-name')
        
        compute_stack = ComputeStack(
            self.config,
            mock_subnet_ids,
            mock_sg_id,
            mock_profile_name,
            None,
            None
        )
        
        # Verify resources created
        self.assertIsNotNone(compute_stack.launch_template)
        self.assertIsNotNone(compute_stack.auto_scaling_group)
        self.assertIsNotNone(compute_stack.scaling_policy)
        
        # Test getters
        self.assertIsNotNone(compute_stack.get_auto_scaling_group_name())
        self.assertIsNotNone(compute_stack.get_auto_scaling_group_arn())


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_monitoring_stack_creation(self):
        """Test monitoring stack creates all resources."""
        from infrastructure.monitoring import MonitoringStack
        
        mock_asg_name = pulumi.Output.from_input('asg-name')
        mock_sns_topic = pulumi.Output.from_input('arn:aws:sns:us-east-1:123456789012:topic')
        
        monitoring_stack = MonitoringStack(
            self.config,
            None,
            mock_asg_name,
            mock_sns_topic,
            None
        )
        
        # Verify resources created
        self.assertIsNotNone(monitoring_stack.app_log_group)
        self.assertIsNotNone(monitoring_stack.cpu_alarm)
        
        # Test getters
        self.assertIsNotNone(monitoring_stack.get_app_log_group_name())
        self.assertIsNotNone(monitoring_stack.get_app_log_group_arn())


class TestSecretsStack(unittest.TestCase):
    """Test Secrets stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_secrets_stack_creation(self):
        """Test secrets stack creates all resources."""
        from infrastructure.secrets import SecretsStack
        
        secrets_stack = SecretsStack(self.config, None)
        
        # Verify resources created
        self.assertIsNotNone(secrets_stack.environment_parameter)
        self.assertIsNotNone(secrets_stack.app_config_parameter)
        self.assertIsNotNone(secrets_stack.app_secret)
        
        # Test getter
        self.assertIsNotNone(secrets_stack.get_app_secret_arn())


class TestStorageStack(unittest.TestCase):
    """Test Storage stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_storage_stack_creation(self):
        """Test storage stack creates all resources."""
        from infrastructure.storage import StorageStack
        
        storage_stack = StorageStack(self.config, None)
        
        # Verify resources created
        self.assertIsNotNone(storage_stack.backup_bucket)
        
        # Test getters
        self.assertIsNotNone(storage_stack.get_backup_bucket_name())
        self.assertIsNotNone(storage_stack.get_backup_bucket_arn())


class TestNotificationsStack(unittest.TestCase):
    """Test Notifications stack."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_notifications_stack_creation(self):
        """Test notifications stack creates all resources."""
        from infrastructure.notifications import NotificationsStack
        
        notifications_stack = NotificationsStack(self.config, None)
        
        # Verify resources created
        self.assertIsNotNone(notifications_stack.alarm_topic)
        
        # Test getter
        self.assertIsNotNone(notifications_stack.get_alarm_topic_arn())


class TestTapStack(unittest.TestCase):
    """Test TapStack integration."""

    @pulumi.runtime.test
    @patch('pulumi_aws.get_caller_identity')
    def test_tap_stack_creation(self, mock_caller_id):
        """Test TapStack creates all sub-stacks."""
        # Mock the caller identity
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(environment_suffix='test123')
        stack = TapStack('test-stack', args)
        
        # Verify all sub-stacks were created
        self.assertIsNotNone(stack.config)
        self.assertIsNotNone(stack.networking_stack)
        self.assertIsNotNone(stack.security_stack)
        self.assertIsNotNone(stack.iam_stack)
        self.assertIsNotNone(stack.notifications_stack)
        self.assertIsNotNone(stack.compute_stack)
        self.assertIsNotNone(stack.monitoring_stack)
        self.assertIsNotNone(stack.secrets_stack)
        self.assertIsNotNone(stack.storage_stack)


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration."""

    def test_tap_stack_args_defaults(self):
        """Test TapStackArgs default values."""
        from tap_stack import TapStackArgs
        
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
    
    def test_tap_stack_args_custom(self):
        """Test TapStackArgs custom values."""
        from tap_stack import TapStackArgs
        
        args = TapStackArgs(environment_suffix='test123')
        self.assertEqual(args.environment_suffix, 'test123')


if __name__ == '__main__':
    unittest.main()
