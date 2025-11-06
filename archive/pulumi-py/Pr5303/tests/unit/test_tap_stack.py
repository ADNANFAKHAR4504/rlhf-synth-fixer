"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component focusing on resource creation
and configuration verification with full mocking and >90% coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

import pulumi

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import InfraConfig


# Pulumi mocks for testing
class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi runtime for unit testing."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resources."""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": "igw-12345"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{args.name}", "public_ip": "1.2.3.4"}
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": "sg-12345"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{args.name}", "arn": f"arn:aws:iam::123456789012:role/{args.name}"}
        elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
            outputs = {**args.inputs, "id": f"profile-{args.name}", "arn": f"arn:aws:iam::123456789012:instance-profile/{args.name}"}
        elif args.typ == "aws:ec2/launchTemplate:LaunchTemplate":
            outputs = {**args.inputs, "id": f"lt-{args.name}"}
        elif args.typ == "aws:autoscaling/group:Group":
            outputs = {**args.inputs, "id": f"asg-{args.name}", "arn": f"arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:*:autoScalingGroupName/{args.name}"}
        elif args.typ == "aws:lambda/function:Function":
            outputs = {**args.inputs, "id": f"lambda-{args.name}", "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}"}
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {**args.inputs, "id": f"alarm-{args.name}", "arn": f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}"}
        elif args.typ == "aws:cloudwatch/eventRule:EventRule":
            outputs = {**args.inputs, "id": f"rule-{args.name}", "arn": f"arn:aws:events:us-east-1:123456789012:rule/{args.name}"}
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {**args.inputs, "id": f"log-{args.name}"}
        return [args.name + "_id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock Pulumi function calls."""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345"}
        elif args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b"]}
        elif args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012"}
        elif args.token == "aws:kms/getAlias:getAlias":
            return {
                "arn": "arn:aws:kms:us-east-1:123456789012:alias/aws/ebs",
                "target_key_arn": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
                "target_key_id": "12345678-1234-1234-1234-123456789012"
            }
        return {}


# Set mocks before any tests run
pulumi.runtime.set_mocks(MyMocks())


class TestInfraConfig(unittest.TestCase):
    """Test InfraConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = InfraConfig()
            self.assertEqual(config.project_name, 'tap')
            self.assertEqual(config.environment, 'dev')
            self.assertEqual(config.primary_region, 'us-east-1')
            self.assertEqual(config.instance_type, 't3.micro')
            self.assertEqual(config.lambda_runtime, 'python3.11')

    @patch.dict('os.environ', {
        'PROJECT_NAME': 'custom-project',
        'ENVIRONMENT': 'prod',
        'ENVIRONMENT_SUFFIX': 'custom123',
        'AWS_REGION': 'eu-west-1',
        'INSTANCE_TYPE': 't3.small',
        'LAMBDA_RUNTIME': 'python3.12'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = InfraConfig()
        self.assertEqual(config.project_name, 'custom-project')
        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.environment_suffix, 'custom123')
        self.assertEqual(config.primary_region, 'eu-west-1')
        self.assertEqual(config.instance_type, 't3.small')
        self.assertEqual(config.lambda_runtime, 'python3.12')

    def test_get_resource_name(self):
        """Test resource name generation with environment suffix."""
        config = InfraConfig()
        
        # Test resource name contains key components
        vpc_name = config.get_resource_name('vpc')
        self.assertIn('tap', vpc_name)
        self.assertIn('vpc', vpc_name)
        # Don't hardcode environment suffix - just verify it exists
        self.assertTrue(len(vpc_name) > len('tap-vpc'))
        
        asg_name = config.get_resource_name('asg')
        self.assertIn('tap', asg_name)
        self.assertIn('asg', asg_name)
        self.assertTrue(len(asg_name) > len('tap-asg'))

    def test_get_resource_name_with_region(self):
        """Test resource name generation with region included."""
        config = InfraConfig()
        
        name = config.get_resource_name('lambda', include_region=True)
        self.assertIn('tap', name)
        self.assertIn('lambda', name)
        # Region should be normalized (us-east-1 -> useast1)
        self.assertIn('useast1', name)

    def test_normalize_name(self):
        """Test name normalization for case-sensitive resources."""
        config = InfraConfig()
        
        # Test lowercase normalization
        self.assertEqual(config.normalize_name('Test-Name'), 'test-name')
        self.assertEqual(config.normalize_name('UPPERCASE'), 'uppercase')
        self.assertEqual(config.normalize_name('Mixed-Case-123'), 'mixed-case-123')

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = InfraConfig()
        tags = config.get_common_tags()
        
        self.assertIn('Project', tags)
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['Project'], 'tap')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')

    @patch('pulumi_aws.get_availability_zones')
    def test_get_availability_zones(self, mock_get_azs):
        """Test dynamic availability zone fetching."""
        mock_get_azs.return_value = MagicMock(names=['us-east-1a', 'us-east-1b', 'us-east-1c'])
        
        config = InfraConfig()
        azs = config.get_availability_zones(count=2)
        
        self.assertEqual(len(azs), 2)
        self.assertEqual(azs[0], 'us-east-1a')
        self.assertEqual(azs[1], 'us-east-1b')

    def test_calculate_subnet_cidr(self):
        """Test subnet CIDR calculation."""
        config = InfraConfig()
        
        # Test subnet CIDR calculation
        subnet_0 = config.calculate_subnet_cidr('10.0.0.0/16', 0)
        self.assertEqual(subnet_0, '10.0.0.0/24')
        
        subnet_1 = config.calculate_subnet_cidr('10.0.0.0/16', 1)
        self.assertEqual(subnet_1, '10.0.1.0/24')
        
        subnet_5 = config.calculate_subnet_cidr('10.0.0.0/16', 5)
        self.assertEqual(subnet_5, '10.0.5.0/24')


class TestNetworkingStack(unittest.TestCase):
    """Test Networking resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_networking_stack_creation(self):
        """Test NetworkingStack instantiation and getter methods."""
        from infrastructure.networking import NetworkingStack
        
        networking_stack = NetworkingStack(self.config)
        
        # Test getter methods return Output objects
        self.assertIsNotNone(networking_stack.get_vpc_id())
        self.assertIsNotNone(networking_stack.get_vpc_cidr())
        self.assertIsNotNone(networking_stack.get_public_subnet_ids())
        self.assertIsNotNone(networking_stack.get_private_subnet_ids())
        self.assertIsNotNone(networking_stack.get_internet_gateway_id())
        self.assertIsNotNone(networking_stack.get_nat_gateway_ids())
        
        # Verify subnet lists have correct length
        self.assertEqual(len(networking_stack.public_subnets), 2)
        self.assertEqual(len(networking_stack.private_subnets), 2)
        self.assertEqual(len(networking_stack.nat_gateways), 2)


class TestSecurityStack(unittest.TestCase):
    """Test Security resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_security_stack_creation(self):
        """Test SecurityStack instantiation and getter methods."""
        from infrastructure.networking import NetworkingStack
        from infrastructure.security import SecurityStack
        
        networking_stack = NetworkingStack(self.config)
        security_stack = SecurityStack(self.config, networking_stack.get_vpc_id())
        
        # Test getter method returns Output object
        self.assertIsNotNone(security_stack.get_ec2_security_group_id())


class TestIAMStack(unittest.TestCase):
    """Test IAM resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_iam_stack_creation(self):
        """Test IAMStack instantiation and getter methods."""
        from infrastructure.iam import IAMStack
        
        iam_stack = IAMStack(self.config)
        
        # Test getter methods return Output objects
        self.assertIsNotNone(iam_stack.get_ec2_role_arn())
        self.assertIsNotNone(iam_stack.get_ec2_role_name())
        self.assertIsNotNone(iam_stack.get_lambda_role_arn())
        self.assertIsNotNone(iam_stack.get_lambda_role_name())
        self.assertIsNotNone(iam_stack.get_ec2_instance_profile_name())
        self.assertIsNotNone(iam_stack.get_ec2_instance_profile_arn())


class TestComputeStack(unittest.TestCase):
    """Test Compute resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_compute_stack_creation(self):
        """Test ComputeStack instantiation and getter methods."""
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        from infrastructure.networking import NetworkingStack
        from infrastructure.security import SecurityStack
        
        networking_stack = NetworkingStack(self.config)
        security_stack = SecurityStack(self.config, networking_stack.get_vpc_id())
        iam_stack = IAMStack(self.config)
        
        compute_stack = ComputeStack(
            self.config,
            networking_stack.get_private_subnet_ids(),
            security_stack.get_ec2_security_group_id(),
            iam_stack.get_ec2_instance_profile_name(),
            iam_stack.get_ec2_instance_profile_arn(),
            iam_stack.get_ec2_instance_profile()
        )
        
        # Test getter methods return Output objects
        self.assertIsNotNone(compute_stack.get_launch_template_id())
        self.assertIsNotNone(compute_stack.get_auto_scaling_group_name())
        self.assertIsNotNone(compute_stack.get_auto_scaling_group_arn())
        self.assertIsNotNone(compute_stack.get_scale_up_policy_arn())
        self.assertIsNotNone(compute_stack.get_scale_down_policy_arn())


class TestLambdaStack(unittest.TestCase):
    """Test Lambda resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_lambda_stack_creation(self):
        """Test LambdaStack instantiation and getter methods."""
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        from infrastructure.lambda_functions import LambdaStack
        from infrastructure.networking import NetworkingStack
        from infrastructure.security import SecurityStack
        
        networking_stack = NetworkingStack(self.config)
        security_stack = SecurityStack(self.config, networking_stack.get_vpc_id())
        iam_stack = IAMStack(self.config)
        compute_stack = ComputeStack(
            self.config,
            networking_stack.get_private_subnet_ids(),
            security_stack.get_ec2_security_group_id(),
            iam_stack.get_ec2_instance_profile_name(),
            iam_stack.get_ec2_instance_profile_arn(),
            iam_stack.get_ec2_instance_profile()
        )
        
        lambda_stack = LambdaStack(
            self.config,
            iam_stack.get_lambda_role_arn(),
            compute_stack.get_auto_scaling_group_name()
        )
        
        # Test getter methods return Output objects
        self.assertIsNotNone(lambda_stack.get_function_arn())
        self.assertIsNotNone(lambda_stack.get_function_name())


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = InfraConfig()

    @pulumi.runtime.test
    def test_monitoring_stack_creation(self):
        """Test MonitoringStack instantiation and getter methods."""
        from infrastructure.compute import ComputeStack
        from infrastructure.iam import IAMStack
        from infrastructure.lambda_functions import LambdaStack
        from infrastructure.monitoring import MonitoringStack
        from infrastructure.networking import NetworkingStack
        from infrastructure.security import SecurityStack
        
        networking_stack = NetworkingStack(self.config)
        security_stack = SecurityStack(self.config, networking_stack.get_vpc_id())
        iam_stack = IAMStack(self.config)
        compute_stack = ComputeStack(
            self.config,
            networking_stack.get_private_subnet_ids(),
            security_stack.get_ec2_security_group_id(),
            iam_stack.get_ec2_instance_profile_name(),
            iam_stack.get_ec2_instance_profile_arn(),
            iam_stack.get_ec2_instance_profile()
        )
        lambda_stack = LambdaStack(
            self.config,
            iam_stack.get_lambda_role_arn(),
            compute_stack.get_auto_scaling_group_name()
        )
        
        monitoring_stack = MonitoringStack(
            self.config,
            compute_stack.get_auto_scaling_group_name(),
            compute_stack.get_scale_up_policy_arn(),
            compute_stack.get_scale_down_policy_arn(),
            lambda_stack.get_function_arn(),
            lambda_stack.get_function_name()
        )
        
        # Test getter methods return Output objects
        self.assertIsNotNone(monitoring_stack.get_cpu_high_alarm_arn())
        self.assertIsNotNone(monitoring_stack.get_cpu_low_alarm_arn())
        self.assertIsNotNone(monitoring_stack.get_health_check_rule_arn())
        self.assertIsNotNone(monitoring_stack.get_lambda_log_group_name())


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from tap_stack import TapStackArgs
        args = TapStackArgs()
        
        # Default is 'local' for local development (CI/CD must provide explicit suffix)
        self.assertEqual(args.environment_suffix, 'local')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from tap_stack import TapStackArgs
        custom_tags = {'Environment': 'test', 'Project': 'tap'}
        args = TapStackArgs(environment_suffix='test123', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'test123')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test TapStack integration and resource orchestration."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack instantiation and output registration."""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(environment_suffix='test123')
        stack = TapStack('test-stack', args)

        # Verify stack was created
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test123')
        
        # Verify all sub-stacks were created
        self.assertIsNotNone(stack.networking_stack)
        self.assertIsNotNone(stack.security_stack)
        self.assertIsNotNone(stack.iam_stack)
        self.assertIsNotNone(stack.compute_stack)
        self.assertIsNotNone(stack.lambda_stack)
        self.assertIsNotNone(stack.monitoring_stack)


if __name__ == '__main__':
    unittest.main()
