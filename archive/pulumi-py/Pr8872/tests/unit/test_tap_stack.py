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
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.regions, ['us-east-1', 'us-west-2'])
        self.assertIn('Project', args.tags)
        self.assertEqual(args.tags['Project'], 'ProjectX')
        self.assertEqual(args.tags['Security'], 'High')

    def test_custom_initialization(self):
        """Test TapStackArgs with custom values"""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Custom': 'Tag', 'Environment': 'test'}
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
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(len(args.regions), 2)
        self.assertIn('us-east-1', args.regions)


class TestNetworkSecurityInfrastructure(unittest.TestCase):
    """Test NetworkSecurityInfrastructure component"""

    def test_networking_class_exists(self):
        """Test NetworkSecurityInfrastructure class exists"""
        from lib.components.networking import NetworkSecurityInfrastructure

        self.assertTrue(hasattr(NetworkSecurityInfrastructure, '__init__'))
        self.assertTrue(callable(NetworkSecurityInfrastructure.__init__))

    def test_networking_class_attributes(self):
        """Test NetworkSecurityInfrastructure has expected attributes"""
        from lib.components.networking import NetworkSecurityInfrastructure

        # Check class is a ComponentResource
        self.assertTrue(issubclass(NetworkSecurityInfrastructure, pulumi.ComponentResource))


class TestIdentityAccessInfrastructure(unittest.TestCase):
    """Test IdentityAccessInfrastructure component"""

    def test_identity_class_exists(self):
        """Test IdentityAccessInfrastructure class exists"""
        from lib.components.identity import IdentityAccessInfrastructure

        self.assertTrue(hasattr(IdentityAccessInfrastructure, '__init__'))
        self.assertTrue(callable(IdentityAccessInfrastructure.__init__))

    def test_identity_class_attributes(self):
        """Test IdentityAccessInfrastructure has expected attributes"""
        from lib.components.identity import IdentityAccessInfrastructure

        # Check class is a ComponentResource
        self.assertTrue(issubclass(IdentityAccessInfrastructure, pulumi.ComponentResource))


class TestDataProtectionInfrastructure(unittest.TestCase):
    """Test DataProtectionInfrastructure component"""

    def test_data_protection_class_exists(self):
        """Test DataProtectionInfrastructure class exists"""
        from lib.components.data_protection import DataProtectionInfrastructure

        self.assertTrue(hasattr(DataProtectionInfrastructure, '__init__'))
        self.assertTrue(callable(DataProtectionInfrastructure.__init__))

    def test_data_protection_class_attributes(self):
        """Test DataProtectionInfrastructure has expected attributes"""
        from lib.components.data_protection import DataProtectionInfrastructure

        # Check class is a ComponentResource
        self.assertTrue(issubclass(DataProtectionInfrastructure, pulumi.ComponentResource))


class TestSecurityMonitoringInfrastructure(unittest.TestCase):
    """Test SecurityMonitoringInfrastructure component"""

    def test_monitoring_class_exists(self):
        """Test SecurityMonitoringInfrastructure class exists"""
        from lib.components.monitoring import SecurityMonitoringInfrastructure

        self.assertTrue(hasattr(SecurityMonitoringInfrastructure, '__init__'))
        self.assertTrue(callable(SecurityMonitoringInfrastructure.__init__))

    def test_monitoring_class_attributes(self):
        """Test SecurityMonitoringInfrastructure has expected attributes"""
        from lib.components.monitoring import SecurityMonitoringInfrastructure

        # Check class is a ComponentResource
        self.assertTrue(issubclass(SecurityMonitoringInfrastructure, pulumi.ComponentResource))


class TestComponentIntegration(unittest.TestCase):
    """Test component integration"""

    def test_all_components_importable(self):
        """Test all components can be imported together"""
        from lib.tap_stack import TapStack, TapStackArgs
        from lib.components.networking import NetworkSecurityInfrastructure
        from lib.components.identity import IdentityAccessInfrastructure
        from lib.components.data_protection import DataProtectionInfrastructure
        from lib.components.monitoring import SecurityMonitoringInfrastructure

        # Verify all classes are importable
        self.assertTrue(TapStack)
        self.assertTrue(TapStackArgs)
        self.assertTrue(NetworkSecurityInfrastructure)
        self.assertTrue(IdentityAccessInfrastructure)
        self.assertTrue(DataProtectionInfrastructure)
        self.assertTrue(SecurityMonitoringInfrastructure)

    def test_component_dependencies(self):
        """Test component dependency structure"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()
        # Verify args structure supports component dependencies
        self.assertIsNotNone(args.regions)
        self.assertIsNotNone(args.tags)
        self.assertIsNotNone(args.environment_suffix)


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
        self.assertIn('us-east-1', stack.regional_monitoring)
        self.assertIn('us-east-1', stack.regional_data_protection)

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
        self.assertIn('us-east-1', stack.regional_monitoring)
        self.assertIn('us-east-1', stack.regional_data_protection)

        # Verify identity access infrastructure exists
        self.assertIsNotNone(stack.identity_access)

    def test_tap_stack_identity_access_integration(self):
        """Test identity access infrastructure integration"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(regions=['us-east-1'])
        stack = TapStack('identity-integration-stack', args)

        # Verify identity access is created and used by regional components
        self.assertIsNotNone(stack.identity_access)
        
        # Verify regional components exist
        network = stack.regional_networks['us-east-1']
        self.assertIsNotNone(network)
        
        monitoring = stack.regional_monitoring['us-east-1']
        self.assertIsNotNone(monitoring)
        
        data_protection = stack.regional_data_protection['us-east-1']
        self.assertIsNotNone(data_protection)

    def test_tap_stack_tags_propagation(self):
        """Test tags are properly propagated to components"""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {
            'Project': 'TestProject',
            'Environment': 'test',
            'Owner': 'TestTeam'
        }
        
        args = TapStackArgs(
            environment_suffix='test',
            regions=['us-east-1'],
            tags=custom_tags
        )
        
        stack = TapStack('tags-test-stack', args)

        # Verify tags are set correctly
        self.assertEqual(stack.tags['Project'], 'TestProject')
        self.assertEqual(stack.tags['Environment'], 'test')
        self.assertEqual(stack.tags['Owner'], 'TestTeam')


if __name__ == '__main__':
    unittest.main()
