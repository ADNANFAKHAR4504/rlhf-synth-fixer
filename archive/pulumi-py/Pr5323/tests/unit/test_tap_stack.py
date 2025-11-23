"""
test_tap_stack.py

Unit tests for the TapStack Pulumi infrastructure focusing on resource creation
and configuration verification with full mocking and >=90% coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

import pulumi

# Add lib to path for imports
lib_path = os.path.join(os.path.dirname(__file__), '..', '..', 'lib')
sys.path.insert(0, lib_path)


# Mock Pulumi runtime for testing
class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi runtime for unit testing."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        return [args.name + '_id', args.inputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock Pulumi function calls."""
        token = args.token
        if token == 'aws:ec2/getAmi:getAmi':
            return {
                'id': 'ami-12345678',
                'architecture': 'x86_64',
                'image_id': 'ami-12345678'
            }
        if token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {
                'names': ['us-east-1a', 'us-east-1b'],
                'zone_ids': ['use1-az2', 'use1-az2']
            }
        if token == 'aws:kms/getAlias:getAlias':
            return {
                'target_key_arn': 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
                'arn': 'arn:aws:kms:us-east-1:123456789012:alias/aws/ebs'
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())

from infrastructure.config import InfraConfig


class TestInfraConfig(unittest.TestCase):
    """Test InfraConfig - the core configuration class."""

    @patch.dict('os.environ', {'ENVIRONMENT': 'test', 'ENVIRONMENT_SUFFIX': 'test123', 'AWS_REGION': 'us-west-2'})
    def test_config_initialization_with_env_vars(self):
        """Test configuration initialization with environment variables."""
        config = InfraConfig()
        self.assertEqual(config.environment, 'test')
        self.assertEqual(config.environment_suffix, 'test123')
        self.assertEqual(config.primary_region, 'us-west-2')
        self.assertEqual(config.project_name, 'tap')

    @patch.dict('os.environ', {}, clear=True)
    def test_config_default_values(self):
        """Test configuration with default values when no env vars set."""
        config = InfraConfig()
        self.assertEqual(config.environment, 'dev')
        self.assertEqual(config.environment_suffix, 'local')
        self.assertEqual(config.primary_region, 'us-east-1')

    def test_normalize_region_name(self):
        """Test region name normalization."""
        config = InfraConfig()
        self.assertEqual(config._normalize_region_name('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region_name('eu-west-2'), 'euwest2')
        self.assertEqual(config._normalize_region_name('ap-southeast-1'), 'apsoutheast1')

    def test_get_resource_name_basic(self):
        """Test resource name generation without suffix."""
        config = InfraConfig()
        vpc_name = config.get_resource_name('vpc')
        self.assertIn('tap', vpc_name)
        self.assertIn('vpc', vpc_name)
        self.assertIn(config.region_normalized, vpc_name)
        self.assertIn(config.environment_suffix, vpc_name)

    def test_get_resource_name_with_suffix(self):
        """Test resource name generation with suffix."""
        config = InfraConfig()
        subnet_name = config.get_resource_name('subnet', suffix='1')
        self.assertIn('tap', subnet_name)
        self.assertIn('subnet', subnet_name)
        self.assertIn('1', subnet_name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = InfraConfig()
        tags = config.get_common_tags()
        
        self.assertIn('Project', tags)
        self.assertIn('Environment', tags)
        self.assertIn('EnvironmentSuffix', tags)
        self.assertIn('ManagedBy', tags)
        self.assertIn('Region', tags)
        self.assertEqual(tags['Project'], 'tap')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')

    def test_get_tags_for_resource(self):
        """Test resource-specific tag generation."""
        config = InfraConfig()
        tags = config.get_tags_for_resource('VPC', Name='test-vpc')
        
        self.assertIn('ResourceType', tags)
        self.assertIn('Name', tags)
        self.assertEqual(tags['ResourceType'], 'VPC')
        self.assertEqual(tags['Name'], 'test-vpc')

    def test_set_availability_zones(self):
        """Test setting availability zones."""
        config = InfraConfig()
        azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']
        config.set_availability_zones(azs)
        self.assertEqual(config.availability_zones, azs)

    def test_get_subnet_cidrs_for_azs_public(self):
        """Test getting public subnet CIDRs."""
        config = InfraConfig()
        cidrs = config.get_subnet_cidrs_for_azs(2, 'public')
        self.assertEqual(len(cidrs), 2)
        self.assertEqual(cidrs[0], '10.0.1.0/24')
        self.assertEqual(cidrs[1], '10.0.2.0/24')

    def test_get_subnet_cidrs_for_azs_private(self):
        """Test getting private subnet CIDRs."""
        config = InfraConfig()
        cidrs = config.get_subnet_cidrs_for_azs(2, 'private')
        self.assertEqual(len(cidrs), 2)
        self.assertEqual(cidrs[0], '10.0.11.0/24')
        self.assertEqual(cidrs[1], '10.0.12.0/24')


class TestNetworkingStack(unittest.TestCase):
    """Test Networking stack resource creation."""

    @pulumi.runtime.test
    def test_networking_stack_creates_vpc(self):
        """Test networking stack creates VPC."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.networking import NetworkingStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        networking = NetworkingStack(config, provider_manager, None)
        
        self.assertIsNotNone(networking.vpc)
        self.assertIsNotNone(networking.get_vpc_id())

    @pulumi.runtime.test
    def test_networking_stack_creates_subnets(self):
        """Test networking stack creates public and private subnets."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.networking import NetworkingStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        networking = NetworkingStack(config, provider_manager, None)
        
        self.assertIsNotNone(networking.public_subnets)
        self.assertIsNotNone(networking.private_subnets)
        self.assertTrue(len(networking.public_subnets) >= 2)
        self.assertTrue(len(networking.private_subnets) >= 2)

    @pulumi.runtime.test
    def test_networking_stack_creates_gateways(self):
        """Test networking stack creates internet and NAT gateways."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.networking import NetworkingStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        networking = NetworkingStack(config, provider_manager, None)
        
        self.assertIsNotNone(networking.internet_gateway)
        self.assertIsNotNone(networking.nat_gateways)
        self.assertTrue(len(networking.nat_gateways) >= 1)


class TestSecurityStack(unittest.TestCase):
    """Test Security stack resource creation."""

    @pulumi.runtime.test
    def test_security_stack_creates_ec2_security_group(self):
        """Test security stack creates EC2 security group."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.security import SecurityStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        mock_vpc_id = pulumi.Output.from_input('vpc-12345')
        
        security = SecurityStack(config, provider_manager, mock_vpc_id, None)
        
        self.assertIsNotNone(security.ec2_security_group)
        self.assertIsNotNone(security.get_ec2_security_group_id())


class TestIAMStack(unittest.TestCase):
    """Test IAM stack resource creation."""

    @pulumi.runtime.test
    def test_iam_stack_creates_ec2_role(self):
        """Test IAM stack creates EC2 role."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        iam = IAMStack(config, provider_manager, None)
        
        self.assertIsNotNone(iam.ec2_role)
        self.assertIsNotNone(iam.get_ec2_role_arn())

    @pulumi.runtime.test
    def test_iam_stack_creates_instance_profile(self):
        """Test IAM stack creates instance profile."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        iam = IAMStack(config, provider_manager, None)
        
        self.assertIsNotNone(iam.instance_profile)
        self.assertIsNotNone(iam.get_ec2_instance_profile_arn())


class TestStorageStack(unittest.TestCase):
    """Test Storage stack resource creation."""

    @pulumi.runtime.test
    def test_storage_stack_creates_logs_bucket(self):
        """Test storage stack creates logs bucket."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.storage import StorageStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        storage = StorageStack(config, provider_manager, None)
        
        self.assertIsNotNone(storage.logs_bucket)
        self.assertIsNotNone(storage.get_logs_bucket_name())

    @pulumi.runtime.test
    def test_storage_stack_creates_data_bucket(self):
        """Test storage stack creates data bucket."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.storage import StorageStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        storage = StorageStack(config, provider_manager, None)
        
        self.assertIsNotNone(storage.data_bucket)
        self.assertIsNotNone(storage.get_data_bucket_name())


class TestComputeStack(unittest.TestCase):
    """Test Compute stack resource creation."""

    @pulumi.runtime.test
    def test_compute_stack_creates_launch_template(self):
        """Test compute stack creates launch template."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        # Create IAM stack to get real instance profile resource
        iam = IAMStack(config, provider_manager, None)
        
        mock_subnet_ids = pulumi.Output.from_input(['subnet-1', 'subnet-2'])
        mock_sg_id = pulumi.Output.from_input('sg-12345')
        
        compute = ComputeStack(
            config, provider_manager, mock_subnet_ids, mock_sg_id,
            iam.get_ec2_instance_profile_name(), iam.get_ec2_instance_profile_arn(),
            iam.instance_profile, None
        )
        
        self.assertIsNotNone(compute.launch_template)
        self.assertIsNotNone(compute.get_launch_template_id())

    @pulumi.runtime.test
    def test_compute_stack_creates_auto_scaling_group(self):
        """Test compute stack creates auto scaling group."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        
        # Create IAM stack to get real instance profile resource
        iam = IAMStack(config, provider_manager, None)
        
        mock_subnet_ids = pulumi.Output.from_input(['subnet-1', 'subnet-2'])
        mock_sg_id = pulumi.Output.from_input('sg-12345')
        
        compute = ComputeStack(
            config, provider_manager, mock_subnet_ids, mock_sg_id,
            iam.get_ec2_instance_profile_name(), iam.get_ec2_instance_profile_arn(),
            iam.instance_profile, None
        )
        
        self.assertIsNotNone(compute.auto_scaling_group)
        self.assertIsNotNone(compute.get_auto_scaling_group_name())


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring stack resource creation."""

    @pulumi.runtime.test
    def test_monitoring_stack_creates_sns_topic(self):
        """Test monitoring stack creates SNS topic."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.monitoring import MonitoringStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        mock_asg_name = pulumi.Output.from_input('asg-name')
        mock_scale_up_arn = pulumi.Output.from_input(
            'arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:test:'
            'autoScalingGroupName/test:policyName/scale-up'
        )
        mock_scale_down_arn = pulumi.Output.from_input(
            'arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:test:'
            'autoScalingGroupName/test:policyName/scale-down'
        )
        
        monitoring = MonitoringStack(config, provider_manager, mock_asg_name, 
                                     mock_scale_up_arn, mock_scale_down_arn, None)
        
        self.assertIsNotNone(monitoring.alarm_topic)
        self.assertIsNotNone(monitoring.get_alarm_topic_arn())

    @pulumi.runtime.test
    def test_monitoring_stack_creates_log_group(self):
        """Test monitoring stack creates CloudWatch log group."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.monitoring import MonitoringStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        mock_asg_name = pulumi.Output.from_input('asg-name')
        mock_scale_up_arn = pulumi.Output.from_input(
            'arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:test:'
            'autoScalingGroupName/test:policyName/scale-up'
        )
        mock_scale_down_arn = pulumi.Output.from_input(
            'arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:test:'
            'autoScalingGroupName/test:policyName/scale-down'
        )
        
        monitoring = MonitoringStack(config, provider_manager, mock_asg_name, 
                                     mock_scale_up_arn, mock_scale_down_arn, None)
        
        self.assertIsNotNone(monitoring.log_group)
        self.assertIsNotNone(monitoring.get_log_group_name())

    @pulumi.runtime.test
    def test_monitoring_stack_creates_alarms(self):
        """Test monitoring stack creates CloudWatch alarms."""
        from infrastructure.aws_provider import AWSProviderManager
        from infrastructure.monitoring import MonitoringStack
        
        config = InfraConfig()
        provider_manager = AWSProviderManager(config)
        mock_asg_name = pulumi.Output.from_input('asg-name')
        mock_scale_up_arn = pulumi.Output.from_input(
            'arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:test:'
            'autoScalingGroupName/test:policyName/scale-up'
        )
        mock_scale_down_arn = pulumi.Output.from_input(
            'arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:test:'
            'autoScalingGroupName/test:policyName/scale-down'
        )
        
        monitoring = MonitoringStack(config, provider_manager, mock_asg_name, 
                                     mock_scale_up_arn, mock_scale_down_arn, None)
        
        self.assertIsNotNone(monitoring.cpu_high_alarm)
        self.assertIsNotNone(monitoring.cpu_low_alarm)


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration."""

    def test_tap_stack_args_defaults(self):
        """Test TapStackArgs default values."""
        from tap_stack import TapStackArgs
        
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'local')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from tap_stack import TapStackArgs
        
        custom_tags = {'CustomTag': 'CustomValue'}
        args = TapStackArgs(environment_suffix='prod123', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'prod123')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test TapStack integration."""

    @pulumi.runtime.test
    def test_tap_stack_creates_all_components(self):
        """Test TapStack creates all infrastructure components."""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)
        
        # Verify all components are created
        self.assertIsNotNone(stack.config)
        self.assertIsNotNone(stack.provider_manager)
        self.assertIsNotNone(stack.networking_stack)
        self.assertIsNotNone(stack.security_stack)
        self.assertIsNotNone(stack.iam_stack)
        self.assertIsNotNone(stack.storage_stack)
        self.assertIsNotNone(stack.compute_stack)
        self.assertIsNotNone(stack.monitoring_stack)

    @pulumi.runtime.test
    def test_tap_stack_environment_suffix_propagation(self):
        """Test environment suffix is properly propagated."""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(environment_suffix='staging')
        stack = TapStack('test-stack', args)
        
        self.assertEqual(stack.environment_suffix, 'staging')
        self.assertEqual(stack.config.environment_suffix, 'staging')


if __name__ == '__main__':
    unittest.main()
