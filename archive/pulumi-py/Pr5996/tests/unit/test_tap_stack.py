"""
test_tap_stack.py

Unit tests for the VPC infrastructure focusing on resource creation
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
            return {'id': 'ami-12345678', 'architecture': 'x86_64'}
        elif args.token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {'names': ['us-east-1a', 'us-east-1b']}
        elif args.token == 'aws:index/getCallerIdentity:getCallerIdentity':
            return {'account_id': '123456789012', 'arn': 'arn:aws:iam::123456789012:user/test', 'user_id': 'AIDACKCEVSQ6C2EXAMPLE'}
        return {}


pulumi.runtime.set_mocks(MyMocks())

from infrastructure.config import InfraConfig
from infrastructure.aws_provider import AWSProviderManager


class TestInfraConfig(unittest.TestCase):
    """Test InfraConfig - the core configuration class."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        config = InfraConfig()
        self.assertEqual(config.project_name, 'infra001')
        self.assertEqual(config.environment, os.getenv('ENVIRONMENT', 'Production'))
        self.assertEqual(config.environment_suffix, os.getenv('ENVIRONMENT_SUFFIX', 'dev'))

    @patch.dict('os.environ', {
        'ENVIRONMENT': 'Staging',
        'ENVIRONMENT_SUFFIX': 'test123',
        'AWS_REGION': 'eu-west-1'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = InfraConfig()
        self.assertEqual(config.environment, 'Staging')
        self.assertEqual(config.environment_suffix, 'test123')
        self.assertEqual(config.primary_region, 'eu-west-1')

    def test_get_resource_name(self):
        """Test resource name generation includes all components."""
        config = InfraConfig()
        
        # Get actual environment suffix from environment
        expected_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        vpc_name = config.get_resource_name('vpc')
        self.assertIn('infra001', vpc_name)
        self.assertIn('vpc', vpc_name)
        self.assertIn(expected_suffix, vpc_name)
        
        # Test with additional suffix
        subnet_name = config.get_resource_name('subnet', '0')
        self.assertIn('infra001', subnet_name)
        self.assertIn('subnet', subnet_name)
        self.assertIn('0', subnet_name)

    def test_region_normalization(self):
        """Test region name normalization for resource names."""
        config = InfraConfig()
        normalized = config._normalize_region_name('us-east-1')
        self.assertEqual(normalized, 'useast1')
        
        normalized = config._normalize_region_name('eu-west-2')
        self.assertEqual(normalized, 'euwest2')

    def test_get_tags_for_resource(self):
        """Test tag generation for resources."""
        config = InfraConfig()
        tags = config.get_tags_for_resource('VPC', Name='test-vpc')
        
        self.assertIn('Name', tags)
        self.assertIn('ProjectName', tags)
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertIn('ResourceType', tags)
        self.assertEqual(tags['Name'], 'test-vpc')
        self.assertEqual(tags['ProjectName'], 'infra001')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')

    def test_get_subnet_cidrs_for_azs(self):
        """Test subnet CIDR allocation."""
        config = InfraConfig()
        
        public_cidrs = config.get_subnet_cidrs_for_azs(2, 'public')
        self.assertEqual(len(public_cidrs), 2)
        self.assertEqual(public_cidrs[0], '10.0.1.0/24')
        
        private_cidrs = config.get_subnet_cidrs_for_azs(2, 'private')
        self.assertEqual(len(private_cidrs), 2)
        self.assertEqual(private_cidrs[0], '10.0.11.0/24')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    def test_provider_creation(self):
        """Test AWS provider is created with correct configuration."""
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        self.assertIsNotNone(provider_manager.provider)
        self.assertEqual(provider_manager.config, config)

    def test_get_provider(self):
        """Test get_provider returns provider instance."""
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        provider = provider_manager.get_provider()
        self.assertIsNotNone(provider)

    def test_get_resource_options(self):
        """Test resource options generation."""
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        opts = provider_manager.get_resource_options()
        self.assertIsNotNone(opts)
        self.assertIsNotNone(opts.provider)


class TestNetworkingStack(unittest.TestCase):
    """Test Networking stack resource creation."""

    @pulumi.runtime.test
    def test_networking_stack_creates_vpc(self):
        """Test VPC is created."""
        from infrastructure.networking import NetworkingStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        networking_stack = NetworkingStack(config, provider_manager)
        
        self.assertIsNotNone(networking_stack.vpc)

    @pulumi.runtime.test
    def test_networking_stack_creates_subnets(self):
        """Test public and private subnets are created."""
        from infrastructure.networking import NetworkingStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        networking_stack = NetworkingStack(config, provider_manager)
        
        self.assertIsNotNone(networking_stack.public_subnets)
        self.assertIsNotNone(networking_stack.private_subnets)
        self.assertEqual(len(networking_stack.public_subnets), 2)
        self.assertEqual(len(networking_stack.private_subnets), 2)

    @pulumi.runtime.test
    def test_networking_stack_creates_nat_gateways(self):
        """Test NAT Gateways are created (one per AZ for HA)."""
        from infrastructure.networking import NetworkingStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        networking_stack = NetworkingStack(config, provider_manager)
        
        self.assertIsNotNone(networking_stack.nat_gateways)
        self.assertEqual(len(networking_stack.nat_gateways), 2)

    @pulumi.runtime.test
    def test_networking_stack_creates_flow_logs(self):
        """Test VPC Flow Logs with KMS encryption are created."""
        from infrastructure.networking import NetworkingStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        networking_stack = NetworkingStack(config, provider_manager)
        
        self.assertIsNotNone(networking_stack.kms_key)
        self.assertIsNotNone(networking_stack.flow_logs_log_group)
        self.assertIsNotNone(networking_stack.flow_logs)


class TestSecurityStack(unittest.TestCase):
    """Test Security stack resource creation."""

    @pulumi.runtime.test
    def test_security_stack_creates_security_group(self):
        """Test EC2 security group is created."""
        from infrastructure.security import SecurityStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        mock_vpc_id = pulumi.Output.from_input('vpc-12345')
        
        security_stack = SecurityStack(config, provider_manager, mock_vpc_id)
        
        self.assertIsNotNone(security_stack.ec2_security_group)


class TestIAMStack(unittest.TestCase):
    """Test IAM stack resource creation."""

    @pulumi.runtime.test
    def test_iam_stack_creates_ec2_role(self):
        """Test EC2 IAM role is created."""
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        iam_stack = IAMStack(config, provider_manager)
        
        self.assertIsNotNone(iam_stack.ec2_role)

    @pulumi.runtime.test
    def test_iam_stack_creates_cloudwatch_policy(self):
        """Test CloudWatch policy is created."""
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        iam_stack = IAMStack(config, provider_manager)
        
        self.assertIsNotNone(iam_stack.cloudwatch_policy)

    @pulumi.runtime.test
    def test_iam_stack_creates_instance_profile(self):
        """Test instance profile is created."""
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        iam_stack = IAMStack(config, provider_manager)
        
        self.assertIsNotNone(iam_stack.instance_profile)


class TestStorageStack(unittest.TestCase):
    """Test Storage stack resource creation."""

    @pulumi.runtime.test
    def test_storage_stack_creates_kms_key(self):
        """Test KMS key for S3 encryption is created."""
        from infrastructure.storage import StorageStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        storage_stack = StorageStack(config, provider_manager)
        
        self.assertIsNotNone(storage_stack.kms_key)

    @pulumi.runtime.test
    def test_storage_stack_creates_data_bucket(self):
        """Test data bucket is created."""
        from infrastructure.storage import StorageStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        storage_stack = StorageStack(config, provider_manager)
        
        self.assertIsNotNone(storage_stack.data_bucket)

    @pulumi.runtime.test
    def test_storage_stack_creates_logs_bucket(self):
        """Test logs bucket is created."""
        from infrastructure.storage import StorageStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        storage_stack = StorageStack(config, provider_manager)
        
        self.assertIsNotNone(storage_stack.logs_bucket)


class TestComputeStack(unittest.TestCase):
    """Test Compute stack resource creation."""

    @pulumi.runtime.test
    def test_compute_stack_creates_instances(self):
        """Test EC2 instances are created."""
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        # Create actual IAM stack to get real instance profile
        iam_stack = IAMStack(config, provider_manager)
        
        mock_subnet_ids = [pulumi.Output.from_input('subnet-1'), pulumi.Output.from_input('subnet-2')]
        mock_sg_id = pulumi.Output.from_input('sg-12345')
        
        compute_stack = ComputeStack(
            config, 
            provider_manager,
            mock_subnet_ids,
            mock_sg_id,
            iam_stack.get_instance_profile_name(),
            iam_stack.instance_profile
        )
        
        self.assertIsNotNone(compute_stack.instances)
        self.assertEqual(len(compute_stack.instances), 2)


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring stack resource creation."""

    @pulumi.runtime.test
    def test_monitoring_stack_creates_sns_topic(self):
        """Test SNS topic is created."""
        from infrastructure.monitoring import MonitoringStack
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        # Create actual compute stack to get real instances
        iam_stack = IAMStack(config, provider_manager)
        mock_subnet_ids = [pulumi.Output.from_input('subnet-1'), pulumi.Output.from_input('subnet-2')]
        mock_sg_id = pulumi.Output.from_input('sg-12345')
        compute_stack = ComputeStack(config, provider_manager, mock_subnet_ids, mock_sg_id, iam_stack.get_instance_profile_name(), iam_stack.instance_profile)
        
        mock_nat_ids = [pulumi.Output.from_input('nat-1'), pulumi.Output.from_input('nat-2')]
        
        monitoring_stack = MonitoringStack(config, provider_manager, compute_stack.instances, mock_nat_ids)
        
        self.assertIsNotNone(monitoring_stack.sns_topic)

    @pulumi.runtime.test
    def test_monitoring_stack_creates_ec2_alarms(self):
        """Test CloudWatch alarms for EC2 are created."""
        from infrastructure.monitoring import MonitoringStack
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        # Create actual compute stack to get real instances
        iam_stack = IAMStack(config, provider_manager)
        mock_subnet_ids = [pulumi.Output.from_input('subnet-1'), pulumi.Output.from_input('subnet-2')]
        mock_sg_id = pulumi.Output.from_input('sg-12345')
        compute_stack = ComputeStack(config, provider_manager, mock_subnet_ids, mock_sg_id, iam_stack.get_instance_profile_name(), iam_stack.instance_profile)
        
        mock_nat_ids = [pulumi.Output.from_input('nat-1'), pulumi.Output.from_input('nat-2')]
        
        monitoring_stack = MonitoringStack(config, provider_manager, compute_stack.instances, mock_nat_ids)
        
        self.assertIsNotNone(monitoring_stack.ec2_alarms)
        # 2 instances * 2 alarms each (CPU + Status)
        self.assertEqual(len(monitoring_stack.ec2_alarms), 4)

    @pulumi.runtime.test
    def test_monitoring_stack_creates_nat_gateway_alarms(self):
        """Test CloudWatch alarms for NAT Gateways are created."""
        from infrastructure.monitoring import MonitoringStack
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        # Create actual compute stack to get real instances
        iam_stack = IAMStack(config, provider_manager)
        mock_subnet_ids = [pulumi.Output.from_input('subnet-1'), pulumi.Output.from_input('subnet-2')]
        mock_sg_id = pulumi.Output.from_input('sg-12345')
        compute_stack = ComputeStack(config, provider_manager, mock_subnet_ids, mock_sg_id, iam_stack.get_instance_profile_name(), iam_stack.instance_profile)
        
        mock_nat_ids = [pulumi.Output.from_input('nat-1'), pulumi.Output.from_input('nat-2')]
        
        monitoring_stack = MonitoringStack(config, provider_manager, compute_stack.instances, mock_nat_ids)
        
        self.assertIsNotNone(monitoring_stack.nat_gateway_alarms)
        # 2 NAT gateways * 2 alarms each (PacketDrops + Errors)
        self.assertEqual(len(monitoring_stack.nat_gateway_alarms), 4)


class TestTapStack(unittest.TestCase):
    """Test main TapStack integration."""

    @pulumi.runtime.test
    def test_tap_stack_creates_all_components(self):
        """Test TapStack creates all infrastructure components."""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(environment_suffix=os.getenv('ENVIRONMENT_SUFFIX', 'dev'))
        stack = TapStack('test-stack', args)
        
        self.assertIsNotNone(stack.config)
        self.assertIsNotNone(stack.provider_manager)
        self.assertIsNotNone(stack.networking_stack)
        self.assertIsNotNone(stack.security_stack)
        self.assertIsNotNone(stack.iam_stack)
        self.assertIsNotNone(stack.storage_stack)
        self.assertIsNotNone(stack.compute_stack)
        self.assertIsNotNone(stack.monitoring_stack)


if __name__ == '__main__':
    unittest.main()
