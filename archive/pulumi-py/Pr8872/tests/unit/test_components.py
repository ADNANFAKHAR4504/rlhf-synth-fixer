"""
Unit tests for individual TapStack components
"""
import unittest
from unittest.mock import Mock, patch
import pulumi
from pulumi.runtime import Mocks
import uuid
import random
import string


def generate_aws_resource_id(resource_type: str, length: int = 17) -> str:
    """Generate realistic AWS resource ID"""
    prefix_map = {
        'vpc': 'vpc-',
        'subnet': 'subnet-',
        'sg': 'sg-',
        'igw': 'igw-',
        'nat': 'nat-',
        'rtb': 'rtb-',
        'ami': 'ami-',
        'i': 'i-',
        'vol': 'vol-',
        'eni': 'eni-'
    }
    prefix = prefix_map.get(resource_type, f'{resource_type}-')
    suffix_length = length - len(prefix)
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=suffix_length))
    return f"{prefix}{suffix}"


def generate_aws_arn(service: str, resource_type: str, resource_name: str = None, 
                    account_id: str = None, region: str = "us-east-1") -> str:
    """Generate realistic AWS ARN"""
    account_id = account_id or str(random.randint(100000000000, 999999999999))
    resource_name = resource_name or str(uuid.uuid4())
    
    if service == "kms":
        return f"arn:aws:kms:{region}:{account_id}:key/{resource_name}"
    elif service == "sns":
        return f"arn:aws:sns:{region}:{account_id}:{resource_name}"
    elif service == "s3":
        return f"arn:aws:s3:::{resource_name}"
    elif service == "iam":
        return f"arn:aws:iam::{account_id}:{resource_type}/{resource_name}"
    else:
        return f"arn:aws:{service}:{region}:{account_id}:{resource_type}/{resource_name}"


class MockDataFactory:
    """Factory for generating consistent mock data across tests"""
    
    def __init__(self):
        self.account_id = str(random.randint(100000000000, 999999999999))
        self.region = "us-east-1"
        self._resource_counter = 0
    
    def get_vpc_id(self) -> str:
        return generate_aws_resource_id('vpc')
    
    def get_subnet_ids(self, count: int = 2) -> list:
        return [generate_aws_resource_id('subnet') for _ in range(count)]
    
    def get_security_group_id(self) -> str:
        return generate_aws_resource_id('sg')
    
    def get_kms_arn(self) -> str:
        key_id = str(uuid.uuid4())
        return generate_aws_arn('kms', 'key', key_id, self.account_id, self.region)
    
    def get_sns_arn(self, topic_name: str = None) -> str:
        topic_name = topic_name or f"test-topic-{self._next_counter()}"
        return generate_aws_arn('sns', 'topic', topic_name, self.account_id, self.region)
    
    def _next_counter(self) -> int:
        self._resource_counter += 1
        return self._resource_counter


class MyMocks(Mocks):
    """Enhanced Pulumi mocks for testing with realistic AWS resource IDs"""

    def __init__(self):
        self.mock_factory = MockDataFactory()

    def new_resource(self, args):
        """Mock new resource creation with realistic IDs"""
        outputs = dict(args.inputs)
        
        # Generate realistic resource IDs based on resource type
        resource_type = args.type_.lower()
        
        if 'vpc' in resource_type:
            outputs["id"] = self.mock_factory.get_vpc_id()
        elif 'subnet' in resource_type:
            outputs["id"] = generate_aws_resource_id('subnet')
        elif 'securitygroup' in resource_type:
            outputs["id"] = self.mock_factory.get_security_group_id()
        elif 'kms' in resource_type or 'key' in resource_type:
            key_id = str(uuid.uuid4())
            outputs["id"] = key_id
            outputs["arn"] = self.mock_factory.get_kms_arn()
        elif 'sns' in resource_type or 'topic' in resource_type:
            outputs["id"] = generate_aws_resource_id('sns')
            outputs["arn"] = self.mock_factory.get_sns_arn()
        elif 's3' in resource_type or 'bucket' in resource_type:
            bucket_name = f"test-bucket-{uuid.uuid4().hex[:8]}"
            outputs["id"] = bucket_name
            outputs["bucket"] = bucket_name
            outputs["arn"] = generate_aws_arn('s3', 'bucket', bucket_name)
        else:
            # Default fallback
            outputs["id"] = f"{args.name}-{uuid.uuid4().hex[:8]}"
            outputs["arn"] = f"arn:aws:mock::{args.name}-{uuid.uuid4().hex[:8]}"
        
        return [outputs.get("id"), outputs]

    def call(self, args):
        """Mock function calls with realistic data"""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": generate_aws_resource_id('ami'),
                "name": "amzn2-ami-hvm-x86_64-gp2"
            }
        elif args.token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"]
            }
        elif args.token == "aws:caller-identity/getCallerIdentity:getCallerIdentity":
            return {
                "account_id": self.mock_factory.account_id,
                "arn": f"arn:aws:iam::{self.mock_factory.account_id}:user/test-user",
                "user_id": "AIDACKCEVSQ6C2EXAMPLE"
            }
        return {}


# Set up Pulumi mocks
mock_instance = MyMocks()
pulumi.runtime.set_mocks(mock_instance)


class BaseTestCase(unittest.TestCase):
    """Base test case with helper methods for mock data"""
    
    @property
    def mock_factory(self):
        """Get the mock data factory"""
        return mock_instance.mock_factory
    
    def create_mock_outputs(self, **kwargs):
        """Create mock Pulumi outputs with dynamic values"""
        outputs = {}
        for key, value_type in kwargs.items():
            if value_type == 'vpc_id':
                outputs[key] = pulumi.Output.from_input(self.mock_factory.get_vpc_id())
            elif value_type == 'subnet_ids':
                outputs[key] = pulumi.Output.from_input(self.mock_factory.get_subnet_ids())
            elif value_type == 'security_group_id':
                outputs[key] = pulumi.Output.from_input(self.mock_factory.get_security_group_id())
            elif value_type == 'kms_arn':
                outputs[key] = pulumi.Output.from_input(self.mock_factory.get_kms_arn())
            elif value_type == 'sns_arn':
                outputs[key] = pulumi.Output.from_input(self.mock_factory.get_sns_arn())
            else:
                outputs[key] = pulumi.Output.from_input(value_type)
        return outputs


class TestNetworkSecurityInfrastructure(BaseTestCase):
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

        # Create dynamic mock KMS key ARN using helper method
        mock_outputs = self.create_mock_outputs(kms_key_arn='kms_arn')
        mock_kms_arn = mock_outputs['kms_key_arn']

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


class TestIdentityAccessInfrastructure(BaseTestCase):
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


class TestDataProtectionInfrastructure(BaseTestCase):
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

        # Create dynamic mock inputs using helper method
        mock_outputs = self.create_mock_outputs(
            vpc_id='vpc_id',
            private_subnet_ids='subnet_ids',
            database_security_group_id='security_group_id',
            kms_key_arn='kms_arn',
            sns_topic_arn='sns_arn'
        )

        # Initialize component with mocks
        data_protection = DataProtectionInfrastructure(
            name="test-data-protection",
            region="us-east-1",
            vpc_id=mock_outputs['vpc_id'],
            private_subnet_ids=mock_outputs['private_subnet_ids'],
            database_security_group_id=mock_outputs['database_security_group_id'],
            kms_key_arn=mock_outputs['kms_key_arn'],
            sns_topic_arn=mock_outputs['sns_topic_arn'],
            tags={"Test": "Tag"}
        )

        # Verify component attributes exist
        self.assertIsNotNone(data_protection.secure_s3_bucket)


class TestSecurityMonitoringInfrastructure(BaseTestCase):
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


class TestComponentDependencies(BaseTestCase):
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

    def test_mock_data_uniqueness(self):
        """Test that mock data factory generates unique values"""
        factory = self.mock_factory
        
        # Generate multiple resources and verify they're unique
        vpc_ids = [factory.get_vpc_id() for _ in range(3)]
        kms_arns = [factory.get_kms_arn() for _ in range(3)]
        sns_arns = [factory.get_sns_arn() for _ in range(3)]
        
        # Verify uniqueness
        self.assertEqual(len(set(vpc_ids)), 3, "VPC IDs should be unique")
        self.assertEqual(len(set(kms_arns)), 3, "KMS ARNs should be unique")
        self.assertEqual(len(set(sns_arns)), 3, "SNS ARNs should be unique")
        
        # Verify format correctness
        for vpc_id in vpc_ids:
            self.assertTrue(vpc_id.startswith('vpc-'), f"VPC ID {vpc_id} should start with 'vpc-'")
        
        for kms_arn in kms_arns:
            self.assertTrue(kms_arn.startswith('arn:aws:kms:'), f"KMS ARN {kms_arn} should start with 'arn:aws:kms:'")
            self.assertIn('us-east-1', kms_arn, f"KMS ARN {kms_arn} should contain region")
        
        for sns_arn in sns_arns:
            self.assertTrue(sns_arn.startswith('arn:aws:sns:'), f"SNS ARN {sns_arn} should start with 'arn:aws:sns:'")
            self.assertIn('us-east-1', sns_arn, f"SNS ARN {sns_arn} should contain region")

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
