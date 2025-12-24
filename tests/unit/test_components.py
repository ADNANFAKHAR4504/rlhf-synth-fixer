"""
Unit tests for individual TapStack components
"""
import unittest
from unittest.mock import Mock, patch
import pulumi
from pulumi.runtime import Mocks


class MyMocks(Mocks):
    """Pulumi mocks for testing"""

    def new_resource(self, args):
        """Mock new resource creation"""
        outputs = dict(args.inputs)
        outputs["id"] = f"{args.name}-id"
        outputs["arn"] = f"arn:aws:mock::{args.name}"
        outputs["bucket"] = f"{args.name}-bucket"
        return [outputs.get("id"), outputs]

    def call(self, args):
        """Mock function calls"""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-12345678",
                "name": "amzn2-ami-hvm-x86_64-gp2"
            }
        elif args.token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"]
            }
        return {}


# Set up Pulumi mocks
pulumi.runtime.set_mocks(MyMocks())


class TestNetworkSecurityInfrastructure(unittest.TestCase):
    """Test NetworkSecurityInfrastructure component"""

    def test_network_component_initialization(self):
        """Test NetworkSecurityInfrastructure can be initialized"""
        from lib.components.networking import NetworkSecurityInfrastructure

        # Test component can be imported and has required methods
        self.assertTrue(hasattr(NetworkSecurityInfrastructure, '__init__'))
        
        # Test component is a Pulumi ComponentResource
        self.assertTrue(issubclass(NetworkSecurityInfrastructure, pulumi.ComponentResource))

    def test_network_component_with_mocks(self):
        """Test NetworkSecurityInfrastructure initialization with mocks"""
        from lib.components.networking import NetworkSecurityInfrastructure

        # Create mock KMS key ARN
        mock_kms_arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012")

        # Initialize component with mocks
        network = NetworkSecurityInfrastructure(
            name="test-network",
            region="us-east-1",
            environment="test",
            kms_key_arn=mock_kms_arn,
            tags={"Test": "Tag"}
        )

        # Verify component attributes exist
        self.assertIsNotNone(network.vpc_id)
        self.assertIsNotNone(network.public_subnet_ids)
        self.assertIsNotNone(network.private_subnet_ids)
        self.assertIsNotNone(network.database_security_group_id)


class TestIdentityAccessInfrastructure(unittest.TestCase):
    """Test IdentityAccessInfrastructure component"""

    def test_identity_component_initialization(self):
        """Test IdentityAccessInfrastructure can be initialized"""
        from lib.components.identity import IdentityAccessInfrastructure

        # Test component can be imported and has required methods
        self.assertTrue(hasattr(IdentityAccessInfrastructure, '__init__'))
        
        # Test component is a Pulumi ComponentResource
        self.assertTrue(issubclass(IdentityAccessInfrastructure, pulumi.ComponentResource))

    def test_identity_component_with_mocks(self):
        """Test IdentityAccessInfrastructure initialization with mocks"""
        from lib.components.identity import IdentityAccessInfrastructure

        # Initialize component with mocks
        identity = IdentityAccessInfrastructure(
            name="test-identity",
            tags={"Test": "Tag"}
        )

        # Verify component attributes exist
        self.assertIsNotNone(identity.kms_key)


class TestDataProtectionInfrastructure(unittest.TestCase):
    """Test DataProtectionInfrastructure component"""

    def test_data_protection_component_initialization(self):
        """Test DataProtectionInfrastructure can be initialized"""
        from lib.components.data_protection import DataProtectionInfrastructure

        # Test component can be imported and has required methods
        self.assertTrue(hasattr(DataProtectionInfrastructure, '__init__'))
        
        # Test component is a Pulumi ComponentResource
        self.assertTrue(issubclass(DataProtectionInfrastructure, pulumi.ComponentResource))

    def test_data_protection_component_with_mocks(self):
        """Test DataProtectionInfrastructure initialization with mocks"""
        from lib.components.data_protection import DataProtectionInfrastructure

        # Create mock inputs
        mock_vpc_id = pulumi.Output.from_input("vpc-123")
        mock_subnet_ids = pulumi.Output.from_input(["subnet-1", "subnet-2"])
        mock_sg_id = pulumi.Output.from_input("sg-123")
        mock_kms_arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012")
        mock_sns_arn = pulumi.Output.from_input("arn:aws:sns:us-east-1:123456789012:test-topic")

        # Initialize component with mocks
        data_protection = DataProtectionInfrastructure(
            name="test-data-protection",
            region="us-east-1",
            vpc_id=mock_vpc_id,
            private_subnet_ids=mock_subnet_ids,
            database_security_group_id=mock_sg_id,
            kms_key_arn=mock_kms_arn,
            sns_topic_arn=mock_sns_arn,
            tags={"Test": "Tag"}
        )

        # Verify component attributes exist
        self.assertIsNotNone(data_protection.secure_s3_bucket)


class TestSecurityMonitoringInfrastructure(unittest.TestCase):
    """Test SecurityMonitoringInfrastructure component"""

    def test_monitoring_component_initialization(self):
        """Test SecurityMonitoringInfrastructure can be initialized"""
        from lib.components.monitoring import SecurityMonitoringInfrastructure

        # Test component can be imported and has required methods
        self.assertTrue(hasattr(SecurityMonitoringInfrastructure, '__init__'))
        
        # Test component is a Pulumi ComponentResource
        self.assertTrue(issubclass(SecurityMonitoringInfrastructure, pulumi.ComponentResource))

    def test_monitoring_component_with_mocks(self):
        """Test SecurityMonitoringInfrastructure initialization with mocks"""
        from lib.components.monitoring import SecurityMonitoringInfrastructure

        # Initialize component with mocks
        monitoring = SecurityMonitoringInfrastructure(
            name="test-monitoring",
            region="us-east-1",
            tags={"Test": "Tag"}
        )

        # Verify component attributes exist
        self.assertIsNotNone(monitoring.sns_topic)


class TestComponentDependencies(unittest.TestCase):
    """Test component dependency relationships"""

    def test_component_dependency_chain(self):
        """Test components can be chained with dependencies"""
        from lib.components.identity import IdentityAccessInfrastructure
        from lib.components.networking import NetworkSecurityInfrastructure
        from lib.components.monitoring import SecurityMonitoringInfrastructure
        from lib.components.data_protection import DataProtectionInfrastructure

        # Create identity component first
        identity = IdentityAccessInfrastructure(
            name="test-identity",
            tags={"Test": "Tag"}
        )

        # Create network component using identity KMS key
        network = NetworkSecurityInfrastructure(
            name="test-network",
            region="us-east-1",
            environment="test",
            kms_key_arn=identity.kms_key.arn,
            tags={"Test": "Tag"}
        )

        # Create monitoring component
        monitoring = SecurityMonitoringInfrastructure(
            name="test-monitoring",
            region="us-east-1",
            tags={"Test": "Tag"}
        )

        # Create data protection component using outputs from other components
        data_protection = DataProtectionInfrastructure(
            name="test-data-protection",
            region="us-east-1",
            vpc_id=network.vpc_id,
            private_subnet_ids=network.private_subnet_ids,
            database_security_group_id=network.database_security_group_id,
            kms_key_arn=identity.kms_key.arn,
            sns_topic_arn=monitoring.sns_topic.arn,
            tags={"Test": "Tag"}
        )

        # Verify all components are created
        self.assertIsNotNone(identity)
        self.assertIsNotNone(network)
        self.assertIsNotNone(monitoring)
        self.assertIsNotNone(data_protection)

    def test_component_tag_consistency(self):
        """Test components handle tags consistently"""
        from lib.components.identity import IdentityAccessInfrastructure
        from lib.components.networking import NetworkSecurityInfrastructure
        from lib.components.monitoring import SecurityMonitoringInfrastructure

        test_tags = {
            "Environment": "test",
            "Project": "TestProject",
            "Owner": "TestTeam"
        }

        # Create components with same tags
        identity = IdentityAccessInfrastructure(
            name="test-identity",
            tags=test_tags
        )

        network = NetworkSecurityInfrastructure(
            name="test-network",
            region="us-east-1",
            environment="test",
            kms_key_arn=identity.kms_key.arn,
            tags=test_tags
        )

        monitoring = SecurityMonitoringInfrastructure(
            name="test-monitoring",
            region="us-east-1",
            tags=test_tags
        )

        # Verify components accept tags (no exceptions thrown)
        self.assertIsNotNone(identity)
        self.assertIsNotNone(network)
        self.assertIsNotNone(monitoring)


if __name__ == '__main__':
    unittest.main()
