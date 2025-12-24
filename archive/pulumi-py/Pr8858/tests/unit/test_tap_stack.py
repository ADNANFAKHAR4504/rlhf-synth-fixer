"""
Unit tests for TapStack component
"""
import os
import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
from pulumi.runtime import Mocks


class MyMocks(Mocks):
    """Pulumi mocks for testing"""

    def new_resource(self, args):
        """Mock new resource creation"""
        outputs = dict(args.inputs)
        outputs["id"] = f"{args.name}-id"
        outputs["arn"] = f"arn:aws:mock::{args.name}"
        return [outputs.get("id"), outputs]

    def call(self, args):
        """Mock function calls"""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-12345678",
                "name": "amzn2-ami-hvm-x86_64-gp2"
            }
        return {}


# Set up Pulumi mocks
pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs class"""

    def test_default_initialization(self):
        """Test TapStackArgs with default values"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.regions, ['us-east-1', 'us-west-2'])
        self.assertIn('Project', args.tags)
        self.assertEqual(args.tags['Project'], 'Pulumi-Tap-Stack')
        self.assertEqual(args.tags['ManagedBy'], 'Pulumi')

    def test_custom_initialization(self):
        """Test TapStackArgs with custom values"""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Custom': 'Tag'}
        args = TapStackArgs(
            environment_suffix='test',
            regions=['us-west-1'],
            tags=custom_tags
        )
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.regions, ['us-west-1'])
        self.assertEqual(args.tags['Custom'], 'Tag')

    def test_partial_initialization(self):
        """Test TapStackArgs with partial values"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='staging')
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.regions, ['us-east-1', 'us-west-2'])
        self.assertIn('Project', args.tags)


class TestTapStack(unittest.TestCase):
    """Test TapStack component"""

    def test_tap_stack_class_exists(self):
        """Test TapStack class exists and can be imported"""
        from lib.tap_stack import TapStack, TapStackArgs

        # Verify classes exist
        self.assertTrue(hasattr(TapStack, '__init__'))
        self.assertTrue(hasattr(TapStackArgs, '__init__'))

        # Test basic initialization without Pulumi runtime
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(len(args.regions), 2)
        self.assertIn('us-east-1', args.regions)


class TestNetworkingInfrastructure(unittest.TestCase):
    """Test NetworkingInfrastructure component"""

    def test_networking_class_exists(self):
        """Test NetworkingInfrastructure class exists"""
        from lib.components.networking import NetworkingInfrastructure

        self.assertTrue(hasattr(NetworkingInfrastructure, '__init__'))
        self.assertTrue(callable(NetworkingInfrastructure.__init__))

    def test_networking_class_attributes(self):
        """Test NetworkingInfrastructure has expected attributes"""
        from lib.components.networking import NetworkingInfrastructure

        # Check class docstring
        self.assertIsNotNone(NetworkingInfrastructure.__doc__)
        self.assertIn('VPC', NetworkingInfrastructure.__doc__)


class TestSecurityInfrastructure(unittest.TestCase):
    """Test SecurityInfrastructure component"""

    def test_security_class_exists(self):
        """Test SecurityInfrastructure class exists"""
        from lib.components.security import SecurityInfrastructure

        self.assertTrue(hasattr(SecurityInfrastructure, '__init__'))
        self.assertTrue(callable(SecurityInfrastructure.__init__))

    def test_security_class_attributes(self):
        """Test SecurityInfrastructure has expected attributes"""
        from lib.components.security import SecurityInfrastructure

        # Check class docstring
        self.assertIsNotNone(SecurityInfrastructure.__doc__)
        self.assertIn('security', SecurityInfrastructure.__doc__.lower())


class TestComputeInfrastructure(unittest.TestCase):
    """Test ComputeInfrastructure component"""

    def test_compute_class_exists(self):
        """Test ComputeInfrastructure class exists"""
        from lib.components.compute import ComputeInfrastructure

        self.assertTrue(hasattr(ComputeInfrastructure, '__init__'))
        self.assertTrue(callable(ComputeInfrastructure.__init__))

    def test_compute_class_attributes(self):
        """Test ComputeInfrastructure has expected attributes"""
        from lib.components.compute import ComputeInfrastructure

        # Check class docstring
        self.assertIsNotNone(ComputeInfrastructure.__doc__)
        self.assertIn('EC2', ComputeInfrastructure.__doc__)


class TestMonitoringInfrastructure(unittest.TestCase):
    """Test MonitoringInfrastructure component"""

    def test_monitoring_class_exists(self):
        """Test MonitoringInfrastructure class exists"""
        from lib.components.monitoring import MonitoringInfrastructure

        self.assertTrue(hasattr(MonitoringInfrastructure, '__init__'))
        self.assertTrue(callable(MonitoringInfrastructure.__init__))

    def test_monitoring_class_attributes(self):
        """Test MonitoringInfrastructure has expected attributes"""
        from lib.components.monitoring import MonitoringInfrastructure

        # Check class docstring
        self.assertIsNotNone(MonitoringInfrastructure.__doc__)
        self.assertIn('CloudWatch', MonitoringInfrastructure.__doc__)


class TestComponentIntegration(unittest.TestCase):
    """Test component integration"""

    def test_all_components_importable(self):
        """Test all components can be imported together"""
        from lib.tap_stack import TapStack, TapStackArgs
        from lib.components.networking import NetworkingInfrastructure
        from lib.components.compute import ComputeInfrastructure
        from lib.components.security import SecurityInfrastructure
        from lib.components.monitoring import MonitoringInfrastructure

        # Verify all classes are importable
        self.assertTrue(TapStack)
        self.assertTrue(TapStackArgs)
        self.assertTrue(NetworkingInfrastructure)
        self.assertTrue(ComputeInfrastructure)
        self.assertTrue(SecurityInfrastructure)
        self.assertTrue(MonitoringInfrastructure)

    def test_component_dependencies(self):
        """Test component dependency structure"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()
        # Verify args structure supports component dependencies
        self.assertIsNotNone(args.regions)
        self.assertIsNotNone(args.tags)
        self.assertIsNotNone(args.environment_suffix)


class TestComputeInfrastructureLocalStack(unittest.TestCase):
    """Test ComputeInfrastructure LocalStack skip logic"""

    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://localhost:4566"})
    def test_compute_skips_ec2_in_localstack(self):
        """Test ComputeInfrastructure skips EC2 creation in LocalStack"""
        from lib.components.compute import ComputeInfrastructure
        import pulumi

        # Mock outputs
        mock_vpc_id = pulumi.Output.from_input("vpc-123")
        mock_subnet_ids = pulumi.Output.from_input(["subnet-1", "subnet-2"])
        mock_sg_id = pulumi.Output.from_input("sg-123")

        # Create compute infrastructure (should skip EC2)
        compute = ComputeInfrastructure(
            name="test-compute",
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnet_ids,
            security_group_id=mock_sg_id,
            environment="test",
            region="us-east-1",
            tags={"Test": "Tag"}
        )

        # Verify mock instance IDs are set
        self.assertIsNotNone(compute.instance_ids)
        self.assertIsNone(compute.launch_template)

    @patch.dict(os.environ, {}, clear=True)
    def test_compute_creates_ec2_when_not_localstack(self):
        """Test ComputeInfrastructure creates EC2 instances when not in LocalStack"""
        from lib.components.compute import ComputeInfrastructure
        import pulumi

        # Mock outputs
        mock_vpc_id = pulumi.Output.from_input("vpc-123")
        mock_subnet_ids = pulumi.Output.from_input(["subnet-1", "subnet-2"])
        mock_sg_id = pulumi.Output.from_input("sg-123")

        # Create compute infrastructure (should create EC2)
        compute = ComputeInfrastructure(
            name="test-compute",
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnet_ids,
            security_group_id=mock_sg_id,
            environment="test",
            region="us-east-1",
            tags={"Test": "Tag"}
        )

        # Verify EC2 resources are created
        self.assertIsNotNone(compute.instance_ids)
        self.assertIsNotNone(compute.launch_template)


class TestMonitoringInfrastructure(unittest.TestCase):
    """Test MonitoringInfrastructure component with different scenarios"""

    def test_monitoring_with_empty_instance_ids(self):
        """Test MonitoringInfrastructure handles empty instance IDs"""
        from lib.components.monitoring import MonitoringInfrastructure
        import pulumi

        # Mock empty instance IDs
        mock_instance_ids = pulumi.Output.from_input([])

        # Create monitoring infrastructure
        monitoring = MonitoringInfrastructure(
            name="test-monitoring",
            instance_ids=mock_instance_ids,
            environment="test",
            region="us-east-1",
            tags={"Test": "Tag"}
        )

        # Verify dashboard is created
        self.assertIsNotNone(monitoring.dashboard)
        self.assertIsNotNone(monitoring.dashboard_name)

    def test_monitoring_with_instance_ids(self):
        """Test MonitoringInfrastructure with instance IDs"""
        from lib.components.monitoring import MonitoringInfrastructure
        import pulumi

        # Mock instance IDs
        mock_instance_ids = pulumi.Output.from_input(["i-123", "i-456"])

        # Create monitoring infrastructure
        monitoring = MonitoringInfrastructure(
            name="test-monitoring",
            instance_ids=mock_instance_ids,
            environment="test",
            region="us-east-1",
            tags={"Test": "Tag"}
        )

        # Verify dashboard is created
        self.assertIsNotNone(monitoring.dashboard)
        self.assertIsNotNone(monitoring.dashboard_name)


class TestTapStackWithMocks(unittest.TestCase):
    """Test TapStack initialization with Pulumi mocks"""

    def test_tap_stack_initialization_single_region(self):
        """Test TapStack initialization with single region"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='test',
            regions=['us-east-1']
        )

        # Initialize stack with mocks
        stack = TapStack('test-stack', args)

        # Verify stack attributes
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertEqual(stack.regions, ['us-east-1'])
        self.assertIn('Project', stack.tags)
        self.assertIn('us-east-1', stack.regional_networks)
        self.assertIn('us-east-1', stack.regional_security)
        self.assertIn('us-east-1', stack.regional_compute)
        self.assertIn('us-east-1', stack.regional_monitoring)

    def test_tap_stack_initialization_multi_region(self):
        """Test TapStack initialization with multiple regions"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='prod',
            regions=['us-east-1', 'us-west-2']
        )

        # Initialize stack with mocks
        stack = TapStack('multi-region-stack', args)

        # Verify stack attributes
        self.assertEqual(stack.environment_suffix, 'prod')
        self.assertEqual(len(stack.regions), 2)
        self.assertIn('us-east-1', stack.regional_networks)
        self.assertIn('us-west-2', stack.regional_networks)
        self.assertEqual(stack.regions[0], 'us-east-1')  # Primary region

    def test_tap_stack_provider_creation(self):
        """Test AWS provider creation for each region"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(regions=['us-east-1', 'us-west-2'])
        stack = TapStack('provider-test-stack', args)

        # Verify providers are created for each region
        self.assertIn('us-east-1', stack.providers)
        self.assertIn('us-west-2', stack.providers)
        self.assertEqual(len(stack.providers), 2)

    def test_tap_stack_regional_resources(self):
        """Test regional resource creation"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(regions=['us-east-1'])
        stack = TapStack('regional-resources-stack', args)

        # Verify regional resources exist
        self.assertIn('us-east-1', stack.regional_networks)
        self.assertIn('us-east-1', stack.regional_security)
        self.assertIn('us-east-1', stack.regional_compute)
        self.assertIn('us-east-1', stack.regional_monitoring)

        # Verify resources have expected attributes
        network = stack.regional_networks['us-east-1']
        self.assertIsNotNone(network.vpc_id)

        security = stack.regional_security['us-east-1']
        self.assertIsNotNone(security.web_server_sg_id)

        compute = stack.regional_compute['us-east-1']
        self.assertIsNotNone(compute.instance_ids)

        monitoring = stack.regional_monitoring['us-east-1']
        self.assertIsNotNone(monitoring.dashboard_name)


if __name__ == '__main__':
    unittest.main()
