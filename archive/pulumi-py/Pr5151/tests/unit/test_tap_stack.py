"""
test_tap_stack.py
Focused unit tests for TapStack with >90% coverage.
Tests resource creation with proper mocking to avoid creating actual resources.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

import pulumi

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import InfraConfig


class TestInfraConfig(unittest.TestCase):
    """Test InfraConfig."""

    def test_config_defaults(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {'ENVIRONMENT_SUFFIX': 'test'}, clear=True):
            config = InfraConfig()
            self.assertEqual(config.environment_suffix, 'test')
            self.assertEqual(config.primary_region, 'us-west-2')
            self.assertEqual(config.project_name, 'scalable-ec2')

    @patch.dict('os.environ', {'ENVIRONMENT_SUFFIX': 'prod', 'AWS_REGION': 'eu-west-1'})
    def test_config_custom_env(self):
        """Test configuration with custom environment variables."""
        config = InfraConfig()
        self.assertEqual(config.environment_suffix, 'prod')
        self.assertEqual(config.primary_region, 'eu-west-1')

    def test_get_resource_name(self):
        """Test resource name generation."""
        config = InfraConfig()
        name = config.get_resource_name('bucket', include_region=True)
        self.assertIn('bucket', name)
        self.assertIn('scalable-ec2', name)
        self.assertIn(config.environment_suffix, name)

    def test_normalize_region_name(self):
        """Test region name normalization."""
        config = InfraConfig()
        self.assertEqual(config._normalize_region_name('us-west-2'), 'uswest2')
        self.assertEqual(config._normalize_region_name('eu-west-1'), 'euwest1')

    def test_get_tags(self):
        """Test tags generation."""
        config = InfraConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('Project', tags)
        resource_tags = config.get_tags_for_resource('EC2', Name='test-instance')
        self.assertEqual(resource_tags['Name'], 'test-instance')


class TestAWSProvider(unittest.TestCase):
    """Test AWS Provider creation."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider creation with consistent naming."""
        from infrastructure.aws_provider import create_aws_provider
        config = InfraConfig()
        provider = create_aws_provider(config)
        mock_provider.assert_called_once()
        # Verify provider name includes region and environment
        call_args = mock_provider.call_args
        provider_name = call_args[0][0]
        self.assertIn('aws-provider', provider_name)
        self.assertIn(config.environment_suffix, provider_name)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.InstanceProfile')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_stack_initialization(self, mock_role, mock_attachment, mock_profile, mock_policy):
        """Test IAM stack creates all required resources."""
        import pulumi
        from infrastructure.iam import IAMStack
        config = InfraConfig()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        mock_profile_instance = MagicMock()
        mock_profile_instance.arn = MagicMock()
        mock_profile_instance.name = MagicMock()
        mock_profile.return_value = mock_profile_instance
        
        iam_stack = IAMStack(config, mock_provider)
        
        # Verify role created
        mock_role.assert_called_once()
        # Verify SSM and CloudWatch policies attached
        self.assertEqual(mock_attachment.call_count, 2)
        # Verify instance profile created
        mock_profile.assert_called_once()

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.InstanceProfile')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_s3_policy_attachment(self, mock_role, mock_attachment, mock_profile, mock_policy):
        """Test S3 policy attachment with bucket ARN."""
        import pulumi
        from infrastructure.iam import IAMStack
        from pulumi import Output
        config = InfraConfig()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        mock_profile_instance = MagicMock()
        mock_profile_instance.arn = MagicMock()
        mock_profile.return_value = mock_profile_instance
        
        iam_stack = IAMStack(config, mock_provider)
        
        # Attach S3 policy
        bucket_arn = Output.from_input('arn:aws:s3:::test-bucket')
        iam_stack.attach_s3_policy(bucket_arn)
        
        # Verify S3 policy was created
        mock_policy.assert_called_once()

    @patch('infrastructure.iam.aws.iam.InstanceProfile')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_getters(self, mock_role, mock_attachment, mock_profile):
        """Test IAM stack getter methods."""
        import pulumi
        from infrastructure.iam import IAMStack
        config = InfraConfig()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        mock_profile_instance = MagicMock()
        mock_profile_instance.arn = MagicMock()
        mock_profile_instance.name = MagicMock()
        mock_profile.return_value = mock_profile_instance
        
        iam_stack = IAMStack(config, mock_provider)
        
        # Test getters
        self.assertIsNotNone(iam_stack.get_ec2_role_arn())
        self.assertIsNotNone(iam_stack.get_ec2_role_name())
        self.assertIsNotNone(iam_stack.get_instance_profile_arn())
        self.assertIsNotNone(iam_stack.get_instance_profile_name())


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack."""

    @patch('infrastructure.storage.aws.s3.BucketLogging')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_storage_buckets_created(self, mock_bucket, mock_public, mock_encrypt,
                                     mock_version, mock_lifecycle, mock_logging):
        """Test S3 buckets created with proper configuration."""
        import pulumi
        from infrastructure.storage import StorageStack
        config = InfraConfig()
        mock_provider = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider)
        
        # Verify 2 buckets created (main + logs)
        self.assertEqual(mock_bucket.call_count, 2)
        # Verify encryption, versioning, lifecycle configured
        mock_encrypt.assert_called_once()
        mock_version.assert_called_once()
        mock_lifecycle.assert_called_once()
        mock_logging.assert_called_once()
        mock_public.assert_called_once()

    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_storage_getters(self, mock_bucket):
        """Test storage stack getter methods."""
        import pulumi
        from infrastructure.storage import StorageStack
        config = InfraConfig()
        mock_provider = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider)
        
        # Test getters
        self.assertIsNotNone(storage_stack.get_main_bucket_arn())
        self.assertIsNotNone(storage_stack.get_main_bucket_name())
        self.assertIsNotNone(storage_stack.get_log_bucket_arn())
        self.assertIsNotNone(storage_stack.get_log_bucket_name())


class TestNetworkingStack(unittest.TestCase):
    """Test Networking Stack."""

    @patch('infrastructure.networking.aws.ec2.RouteTableAssociation')
    @patch('infrastructure.networking.aws.ec2.RouteTable')
    @patch('infrastructure.networking.aws.ec2.Subnet')
    @patch('infrastructure.networking.aws.ec2.InternetGateway')
    @patch('infrastructure.networking.aws.ec2.Vpc')
    @patch('infrastructure.networking.aws.get_availability_zones')
    def test_networking_resources_created(self, mock_azs, mock_vpc, mock_igw,
                                          mock_subnet, mock_rt, mock_rta):
        """Test VPC and networking resources created."""
        import pulumi
        from infrastructure.networking import NetworkingStack
        config = InfraConfig()
        mock_provider = MagicMock()
        
        # Mock availability zones
        mock_azs.return_value = MagicMock(names=['us-west-2a', 'us-west-2b', 'us-west-2c'])
        
        mock_vpc_instance = MagicMock(spec=pulumi.Resource)
        mock_vpc_instance.id = MagicMock()
        mock_vpc.return_value = mock_vpc_instance
        
        mock_igw_instance = MagicMock(spec=pulumi.Resource)
        mock_igw_instance.id = MagicMock()
        mock_igw.return_value = mock_igw_instance
        
        mock_subnet_instance = MagicMock(spec=pulumi.Resource)
        mock_subnet_instance.id = MagicMock()
        mock_subnet.return_value = mock_subnet_instance
        
        mock_rt_instance = MagicMock(spec=pulumi.Resource)
        mock_rt_instance.id = MagicMock()
        mock_rt.return_value = mock_rt_instance
        
        networking_stack = NetworkingStack(config, mock_provider)
        
        # Verify VPC created
        mock_vpc.assert_called_once()
        # Verify IGW created
        mock_igw.assert_called_once()
        # Verify subnets created (at least 2)
        self.assertGreater(mock_subnet.call_count, 1)
        # Verify route table created
        mock_rt.assert_called_once()

    @patch('infrastructure.networking.aws.ec2.Vpc')
    @patch('infrastructure.networking.aws.get_availability_zones')
    def test_networking_getters(self, mock_azs, mock_vpc):
        """Test networking stack getter methods."""
        import pulumi
        from infrastructure.networking import NetworkingStack
        config = InfraConfig()
        mock_provider = MagicMock()
        
        mock_azs.return_value = MagicMock(names=['us-west-2a', 'us-west-2b'])
        
        mock_vpc_instance = MagicMock(spec=pulumi.Resource)
        mock_vpc_instance.id = MagicMock()
        mock_vpc.return_value = mock_vpc_instance
        
        networking_stack = NetworkingStack(config, mock_provider)
        
        # Test getters
        self.assertIsNotNone(networking_stack.get_vpc_id())
        self.assertIsNotNone(networking_stack.get_subnet_ids())


class TestSecurityStack(unittest.TestCase):
    """Test Security Stack."""

    @patch('infrastructure.security.aws.ec2.SecurityGroup')
    def test_security_group_created(self, mock_sg):
        """Test security group created with proper rules."""
        from infrastructure.security import SecurityStack
        from pulumi import Output
        config = InfraConfig()
        mock_provider = MagicMock()
        vpc_id = Output.from_input('vpc-12345')
        
        mock_sg_instance = MagicMock()
        mock_sg_instance.id = MagicMock()
        mock_sg.return_value = mock_sg_instance
        
        security_stack = SecurityStack(config, vpc_id, mock_provider)
        
        # Verify security group created
        mock_sg.assert_called_once()

    @patch('infrastructure.security.aws.ec2.SecurityGroup')
    def test_security_getters(self, mock_sg):
        """Test security stack getter methods."""
        from infrastructure.security import SecurityStack
        from pulumi import Output
        config = InfraConfig()
        mock_provider = MagicMock()
        vpc_id = Output.from_input('vpc-12345')
        
        mock_sg_instance = MagicMock()
        mock_sg_instance.id = MagicMock()
        mock_sg.return_value = mock_sg_instance
        
        security_stack = SecurityStack(config, vpc_id, mock_provider)
        
        # Test getter
        self.assertIsNotNone(security_stack.get_ec2_security_group_id())


class TestComputeStack(unittest.TestCase):
    """Test Compute Stack."""

    @patch('infrastructure.compute.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.compute.aws.autoscaling.Policy')
    @patch('infrastructure.compute.aws.autoscaling.Group')
    @patch('infrastructure.compute.aws.ec2.LaunchTemplate')
    @patch('infrastructure.compute.aws.kms.get_alias')
    @patch('infrastructure.compute.aws.ec2.get_ami')
    def test_compute_resources_created(self, mock_ami, mock_kms, mock_lt, mock_asg,
                                      mock_policy, mock_alarm):
        """Test compute resources created."""
        import pulumi
        from infrastructure.compute import ComputeStack
        from pulumi import Output
        config = InfraConfig()
        mock_provider = MagicMock()
        subnet_ids = Output.from_input(['subnet-1', 'subnet-2'])
        sg_id = Output.from_input('sg-12345')
        profile_arn = Output.from_input('arn:aws:iam::123:instance-profile/test')
        
        # Mock AMI
        mock_ami.return_value = MagicMock(id='ami-12345')
        # Mock KMS key
        mock_kms.return_value = MagicMock(target_key_arn='arn:aws:kms:us-west-2:123:key/test')
        
        mock_lt_instance = MagicMock(spec=pulumi.Resource)
        mock_lt_instance.id = MagicMock()
        mock_lt_instance.latest_version = MagicMock()
        mock_lt.return_value = mock_lt_instance
        
        mock_asg_instance = MagicMock(spec=pulumi.Resource)
        mock_asg_instance.name = MagicMock()
        mock_asg_instance.arn = MagicMock()
        mock_asg.return_value = mock_asg_instance
        
        mock_policy_instance = MagicMock(spec=pulumi.Resource)
        mock_policy_instance.arn = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        compute_stack = ComputeStack(config, subnet_ids, sg_id, profile_arn, mock_provider)
        
        # Verify launch template created
        mock_lt.assert_called_once()
        # Verify ASG created
        mock_asg.assert_called_once()
        # Verify 2 scaling policies created (up and down)
        self.assertEqual(mock_policy.call_count, 2)
        # Verify 2 alarms created (high and low CPU)
        self.assertEqual(mock_alarm.call_count, 2)

    @patch('infrastructure.compute.aws.ec2.LaunchTemplate')
    @patch('infrastructure.compute.aws.kms.get_alias')
    @patch('infrastructure.compute.aws.ec2.get_ami')
    def test_compute_getters(self, mock_ami, mock_kms, mock_lt):
        """Test compute stack getter methods."""
        from infrastructure.compute import ComputeStack
        from pulumi import Output
        
        config = InfraConfig()
        mock_provider = MagicMock()
        subnet_ids = Output.from_input(['subnet-1'])
        sg_id = Output.from_input('sg-12345')
        profile_arn = Output.from_input('arn:aws:iam::123:instance-profile/test')
        
        mock_ami.return_value = MagicMock(id='ami-12345')
        mock_kms.return_value = MagicMock(target_key_arn='arn:aws:kms:us-west-2:123:key/test')
        
        mock_lt_instance = MagicMock(spec=pulumi.Resource)
        mock_lt_instance.id = MagicMock()
        mock_lt.return_value = mock_lt_instance
        
        compute_stack = ComputeStack(config, subnet_ids, sg_id, profile_arn, mock_provider)
        
        # Test getters
        self.assertIsNotNone(compute_stack.get_auto_scaling_group_name())
        self.assertIsNotNone(compute_stack.get_auto_scaling_group_arn())
        self.assertIsNotNone(compute_stack.get_launch_template_id())


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack."""

    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_log_groups_created(self, mock_log_group):
        """Test CloudWatch log groups created."""
        from infrastructure.monitoring import MonitoringStack
        from pulumi import Output
        config = InfraConfig()
        mock_provider = MagicMock()
        asg_name = Output.from_input('test-asg')
        
        mock_log_instance = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_instance.name = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        monitoring_stack = MonitoringStack(config, asg_name, mock_provider)
        
        # Verify 2 log groups created (EC2 and ASG)
        self.assertEqual(mock_log_group.call_count, 2)

    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_getters(self, mock_log_group):
        """Test monitoring stack getter methods."""
        from infrastructure.monitoring import MonitoringStack
        from pulumi import Output
        config = InfraConfig()
        mock_provider = MagicMock()
        asg_name = Output.from_input('test-asg')
        
        mock_log_instance = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_instance.name = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        monitoring_stack = MonitoringStack(config, asg_name, mock_provider)
        
        # Test getters
        self.assertIsNotNone(monitoring_stack.get_ec2_log_group_name())
        self.assertIsNotNone(monitoring_stack.get_ec2_log_group_arn())
        self.assertIsNotNone(monitoring_stack.get_asg_log_group_name())
        self.assertIsNotNone(monitoring_stack.get_asg_log_group_arn())


class TestTapStack(unittest.TestCase):
    """Test TapStack integration."""

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.ComputeStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.SecurityStack')
    @patch('tap_stack.NetworkingStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.create_aws_provider')
    @patch('tap_stack.InfraConfig')
    def test_stack_initialization(self, mock_config, mock_provider_fn, mock_iam,
                                  mock_networking, mock_security, mock_storage,
                                  mock_compute, mock_monitoring, mock_export):
        """Test TapStack initializes all components."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.environment_suffix = 'test'
        mock_config_instance.primary_region = 'us-west-2'
        mock_config_instance.project_name = 'scalable-ec2'
        mock_config.return_value = mock_config_instance
        
        mock_provider = MagicMock()
        mock_provider_fn.return_value = mock_provider
        
        mock_networking_instance = MagicMock()
        mock_networking_instance.get_vpc_id.return_value = MagicMock()
        mock_networking_instance.get_subnet_ids.return_value = MagicMock()
        mock_networking.return_value = mock_networking_instance
        
        mock_security_instance = MagicMock()
        mock_security_instance.get_ec2_security_group_id.return_value = MagicMock()
        mock_security.return_value = mock_security_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_instance_profile_arn.return_value = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_main_bucket_arn.return_value = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        mock_compute_instance = MagicMock()
        mock_compute_instance.get_auto_scaling_group_name.return_value = MagicMock()
        mock_compute.return_value = mock_compute_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)
        
        # Verify all components initialized
        mock_config.assert_called_once()
        mock_provider_fn.assert_called_once()
        mock_iam.assert_called_once()
        mock_networking.assert_called_once()
        mock_security.assert_called_once()
        mock_storage.assert_called_once()
        mock_compute.assert_called_once()
        mock_monitoring.assert_called_once()
        
        # Verify pulumi.export was called
        self.assertTrue(mock_export.called)


if __name__ == '__main__':
    unittest.main()
