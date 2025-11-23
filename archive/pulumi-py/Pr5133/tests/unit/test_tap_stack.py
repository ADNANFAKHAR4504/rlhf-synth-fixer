"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
import os
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


def get_current_aws_region():
    """Get the current AWS region from environment or Pulumi config."""
    # First try environment variable
    region = os.getenv("AWS_REGION")
    if region:
        return region
    
    # Try to get from Pulumi config
    try:
        import subprocess
        result = subprocess.run(
            ["pulumi", "config", "get", "aws:region"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    
    # Default fallback
    return "eu-west-1"


class TestPulumiMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource operations for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs.copy()
        
        # Get dynamic AWS region
        aws_region = get_current_aws_region()
        
        # Add specific mock outputs for different resource types
        if args.typ == "aws:rds/instance:Instance":
            outputs.update({
                "endpoint": f"healthcare-db-test.abcdef123456.{aws_region}.rds.amazonaws.com:5432",
                "address": f"healthcare-db-test.abcdef123456.{aws_region}.rds.amazonaws.com",
                "port": 5432,
                "arn": f"arn:aws:rds:{aws_region}:123456789012:db:{args.inputs.get('identifier', 'test-db')}"
            })
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs.update({
                "configuration_endpoint_address": "healthcare-redis-test.abcdef.0001.cache.amazonaws.com",
                "port": 6379,
                "arn": f"arn:aws:elasticache:{aws_region}:123456789012:cluster:healthcare-redis-test"
            })
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs.update({
                "root_resource_id": "abcdef1234",
                "id": "abc123xyz"
            })
        elif args.typ == "aws:kms/key:Key":
            outputs.update({
                "key_id": "12345678-1234-1234-1234-123456789012",
                "arn": f"arn:aws:kms:{aws_region}:123456789012:key/12345678-1234-1234-1234-123456789012"
            })
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs.update({"id": "vpc-12345678"})
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs.update({"id": f"subnet-{args.name}"})
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs.update({"id": "igw-12345678"})
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs.update({"id": "nat-12345678"})
        elif args.typ == "aws:ec2/eip:Eip":
            outputs.update({"id": "eip-12345678", "allocation_id": "eipalloc-12345678"})
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs.update({"id": f"rtb-{args.name}"})
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs.update({"id": f"sg-{args.name}"})
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs.update({
                "arn": f"arn:aws:secretsmanager:{aws_region}:123456789012:secret:{args.name}",
                "id": f"secret-{args.name}"
            })
        elif args.typ == "aws:elasticache/subnetGroup:SubnetGroup":
            outputs.update({"name": args.inputs.get("name", f"subnet-group-{args.name}")})
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs.update({"name": args.inputs.get("name", f"db-subnet-group-{args.name}")})
        elif args.typ == "aws:apigateway/resource:Resource":
            outputs.update({"id": f"resource-{args.name}"})
        elif args.typ == "aws:apigateway/method:Method":
            outputs.update({"id": f"method-{args.name}"})
        elif args.typ == "aws:apigateway/integration:Integration":
            outputs.update({"id": f"integration-{args.name}"})
        elif args.typ == "aws:apigateway/deployment:Deployment":
            outputs.update({"id": f"deployment-{args.name}", "invoke_url": f"https://test-api.execute-api.{aws_region}.amazonaws.com/"})
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs.update({"id": f"stage-{args.name}", "invoke_url": f"https://test-api.execute-api.{aws_region}.amazonaws.com/test"})
        else:
            outputs.update({"id": f"mock-{args.name}"})

        return [outputs.get("id", f"mock-{args.name}"), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initialization with environment suffix."""
        args = TapStackArgs(environment_suffix="test")
        
        self.assertEqual(args.environment_suffix, "test")

    def test_tap_stack_args_different_environments(self):
        """Test TapStackArgs with different environment suffixes."""
        dev_args = TapStackArgs(environment_suffix="dev")
        prod_args = TapStackArgs(environment_suffix="prod")
        
        self.assertEqual(dev_args.environment_suffix, "dev")
        self.assertEqual(prod_args.environment_suffix, "prod")


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack infrastructure class."""

    def setUp(self):
        """Set up test fixtures."""
        pulumi.runtime.set_mocks(TestPulumiMocks())

    def tearDown(self):
        """Clean up after tests."""
        pulumi.runtime.set_mocks(None)

    @patch('pulumi.Config')
    def test_tap_stack_initialization(self, mock_config):
        """Test TapStack initialization with default region."""
        # Mock Pulumi config
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        # Create stack
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify initialization
        self.assertEqual(stack.name, "test-stack")
        self.assertEqual(stack.args, args)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertEqual(stack.region, "eu-south-1")

    @patch('pulumi.Config')
    def test_tap_stack_with_custom_region(self, mock_config):
        """Test TapStack initialization with custom region."""
        # Mock Pulumi config to return custom region
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "us-east-1"
        mock_config.return_value = mock_config_instance
        
        # Create stack
        args = TapStackArgs(environment_suffix="prod")
        stack = TapStack("prod-stack", args)
        
        # Verify custom region
        self.assertEqual(stack.region, "us-east-1")
        self.assertEqual(stack.environment_suffix, "prod")

    @patch('pulumi.Config')
    def test_tap_stack_with_no_region_config(self, mock_config):
        """Test TapStack initialization with no region config (should use default)."""
        # Mock Pulumi config to return None (no region set)
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = None
        mock_config.return_value = mock_config_instance
        
        # Create stack
        args = TapStackArgs(environment_suffix="dev")
        stack = TapStack("dev-stack", args)
        
        # Verify default region is used
        self.assertEqual(stack.region, "eu-west-1")

    @patch('pulumi.Config')
    def test_kms_key_creation(self, mock_config):
        """Test KMS key creation with proper configuration."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify KMS key exists
        self.assertIsNotNone(stack.kms_key)

    @patch('pulumi.Config')
    def test_vpc_creation(self, mock_config):
        """Test VPC creation with proper configuration."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify VPC and networking components exist
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.public_subnet_1)
        self.assertIsNotNone(stack.public_subnet_2)
        self.assertIsNotNone(stack.private_subnet_1)
        self.assertIsNotNone(stack.private_subnet_2)
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.nat_gateway)

    @patch('pulumi.Config')
    def test_security_groups_creation(self, mock_config):
        """Test security groups creation."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify security groups exist
        self.assertIsNotNone(stack.api_sg)
        self.assertIsNotNone(stack.redis_sg)
        self.assertIsNotNone(stack.rds_sg)

    @patch('pulumi.Config')
    def test_database_components_creation(self, mock_config):
        """Test database and Redis components creation."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify database components exist
        self.assertIsNotNone(stack.db_credentials)
        self.assertIsNotNone(stack.redis_subnet_group)
        self.assertIsNotNone(stack.redis_cluster)
        self.assertIsNotNone(stack.rds_subnet_group)
        self.assertIsNotNone(stack.rds_instance)

    @patch('pulumi.Config')
    def test_api_gateway_creation(self, mock_config):
        """Test API Gateway components creation."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify API Gateway components exist
        self.assertIsNotNone(stack.api_gateway)
        self.assertIsNotNone(stack.api_resource)
        self.assertIsNotNone(stack.api_method)
        self.assertIsNotNone(stack.api_integration)
        self.assertIsNotNone(stack.api_deployment)
        self.assertIsNotNone(stack.api_stage)

    @patch('pulumi.Config')
    def test_stack_with_different_environment_suffixes(self, mock_config):
        """Test stack creation with different environment suffixes."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        # Test different environments
        environments = ["dev", "staging", "prod", "test"]
        
        for env in environments:
            args = TapStackArgs(environment_suffix=env)
            stack = TapStack(f"{env}-stack", args)
            
            self.assertEqual(stack.environment_suffix, env)
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.kms_key)

    @patch('pulumi.Config')
    def test_complete_stack_integration(self, mock_config):
        """Test complete stack creation and verify all components are connected."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)
        
        # Verify all major components exist
        components = [
            stack.kms_key, stack.vpc, stack.public_subnet_1, stack.public_subnet_2,
            stack.private_subnet_1, stack.private_subnet_2, stack.igw, stack.nat_gateway,
            stack.api_sg, stack.redis_sg, stack.rds_sg, stack.db_credentials,
            stack.redis_subnet_group, stack.redis_cluster, stack.rds_subnet_group,
            stack.rds_instance, stack.api_gateway, stack.api_resource, stack.api_method,
            stack.api_integration, stack.api_deployment, stack.api_stage
        ]
        
        for component in components:
            self.assertIsNotNone(component, f"Component {component} should not be None")

    @patch('pulumi.Config')
    def test_stack_name_and_args_assignment(self, mock_config):
        """Test that stack properly assigns name and args during initialization."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        stack_name = "custom-healthcare-stack"
        args = TapStackArgs(environment_suffix="custom")
        stack = TapStack(stack_name, args)
        
        self.assertEqual(stack.name, stack_name)
        self.assertEqual(stack.args, args)
        self.assertIs(stack.args, args)  # Verify it's the same object reference

    @patch('pulumi.Config')
    def test_stack_creation_with_edge_case_names(self, mock_config):
        """Test stack creation with various edge case environment names."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = "eu-south-1"
        mock_config.return_value = mock_config_instance
        
        edge_cases = ["dev1", "test-env", "prod_final", "staging123", "temp"]
        
        for env in edge_cases:
            args = TapStackArgs(environment_suffix=env)
            stack = TapStack(f"stack-{env}", args)
            
            self.assertEqual(stack.environment_suffix, env)
            # Verify stack creation doesn't fail with edge case names
            self.assertIsNotNone(stack.vpc)

    @patch('pulumi.Config')
    def test_region_configuration_variations(self, mock_config):
        """Test stack behavior with different AWS region configurations."""
        regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", None]
        
        for region in regions:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = region
            mock_config.return_value = mock_config_instance
            
            args = TapStackArgs(environment_suffix="region-test")
            stack = TapStack("region-test-stack", args)
            
            expected_region = region if region is not None else "eu-west-1"
            self.assertEqual(stack.region, expected_region)


if __name__ == '__main__':
    unittest.main()
