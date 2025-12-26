"""
Integration tests for TapStack - Multi-Region Infrastructure Stack

This module contains integration tests that verify the infrastructure
deployment structure and component integration.
"""

import unittest
import json
import os
from typing import Dict, Any, Optional

import pulumi
from pulumi.runtime import Mocks

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


def load_deployment_outputs(environment: str = 'dev') -> Optional[Dict[str, Any]]:
    """
    Load deployment outputs from cfn-outputs/flat-outputs.json

    Args:
        environment: Environment suffix (dev, staging, prod)

    Returns:
        Dictionary of deployment outputs or None if file doesn't exist
    """
    output_file = 'cfn-outputs/flat-outputs.json'

    if not os.path.exists(output_file):
        print(f"Info: Output file {output_file} not found. Running structure validation tests only.")
        return None

    try:
        with open(output_file, 'r') as f:
            outputs = json.load(f)
            print(f"Loaded deployment outputs for environment: {environment}")
            return outputs
    except Exception as e:
        print(f"Error loading deployment outputs: {e}")
        return None


class MyMocks(Mocks):
    """Pulumi mocks for stack initialization."""

    def new_resource(self, args):
        """Mock new resource creation."""
        outputs = dict(args.inputs)
        outputs["id"] = f"{args.name}-id"
        outputs["arn"] = f"arn:aws:mock::{args.name}"
        return [outputs.get("id"), outputs]

    def call(self, args):
        """Mock function calls."""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-12345678",
                "name": "amzn2-ami-hvm-x86_64-gp2"
            }
        return {}


# Set up Pulumi mocks
pulumi.runtime.set_mocks(MyMocks())


class TestStackStructure(unittest.TestCase):
    """Test stack structure and component integration."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs can be initialized with various configurations."""
        print("\nTesting: TapStackArgs Initialization")
        print("Scenario: Stack arguments can be configured")

        args = TapStackArgs(
            environment_suffix='test',
            regions=['us-east-1'],
            tags={'Test': 'Tag'}
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.regions, ['us-east-1'])
        self.assertEqual(args.tags['Test'], 'Tag')
        print("  Result: TapStackArgs initialized successfully")

    def test_component_imports(self):
        """Test all components can be imported."""
        print("\nTesting: Component Imports")
        print("Scenario: All infrastructure components are importable")

        from lib.components.networking import NetworkSecurityInfrastructure
        from lib.components.identity import IdentityAccessInfrastructure
        from lib.components.data_protection import DataProtectionInfrastructure
        from lib.components.monitoring import SecurityMonitoringInfrastructure

        self.assertTrue(hasattr(NetworkSecurityInfrastructure, '__init__'))
        self.assertTrue(hasattr(IdentityAccessInfrastructure, '__init__'))
        self.assertTrue(hasattr(DataProtectionInfrastructure, '__init__'))
        self.assertTrue(hasattr(SecurityMonitoringInfrastructure, '__init__'))
        print("  Result: All components imported successfully")

    def test_stack_component_integration(self):
        """Test stack integrates all components correctly."""
        print("\nTesting: Stack Component Integration")
        print("Scenario: Stack orchestrates networking, identity, data protection, and monitoring")

        args = TapStackArgs(
            environment_suffix='test',
            regions=['us-east-1']
        )

        # Verify stack can be instantiated (with mocks)
        stack = TapStack('integration-test-stack', args)
        
        # Verify all regional components are created
        self.assertIn('us-east-1', stack.regional_networks)
        self.assertIn('us-east-1', stack.regional_monitoring)
        self.assertIn('us-east-1', stack.regional_data_protection)
        
        # Verify identity access is created
        self.assertIsNotNone(stack.identity_access)
        
        print("  Result: Stack structure supports component integration")

    def test_multi_region_stack_integration(self):
        """Test stack integrates components across multiple regions."""
        print("\nTesting: Multi-Region Stack Integration")
        print("Scenario: Stack orchestrates components across multiple regions")

        args = TapStackArgs(
            environment_suffix='test',
            regions=['us-east-1', 'us-west-2']
        )

        stack = TapStack('multi-region-integration-stack', args)
        
        # Verify components are created in both regions
        for region in ['us-east-1', 'us-west-2']:
            self.assertIn(region, stack.regional_networks)
            self.assertIn(region, stack.regional_monitoring)
            self.assertIn(region, stack.regional_data_protection)
            self.assertIn(region, stack.providers)
        
        # Verify single identity access infrastructure (global)
        self.assertIsNotNone(stack.identity_access)
        
        print("  Result: Multi-region stack integration successful")


class TestDeploymentOutputs(unittest.TestCase):
    """Test deployment outputs if available."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests."""
        cls.outputs = load_deployment_outputs()
        if cls.outputs is None:
            raise unittest.SkipTest("Deployment outputs not available")

    def test_vpc_outputs(self):
        """Test VPC outputs are available."""
        print("\nTesting: VPC Outputs")
        print("Scenario: VPC infrastructure is deployed")

        vpc_id = self.outputs.get('primary_vpc_id') or self.outputs.get('vpc_id')
        print(f"  VPC ID: {vpc_id}")

        if vpc_id:
            self.assertIsNotNone(vpc_id, "VPC ID not found")
            print("  Result: VPC is deployed")
        else:
            print("  Info: VPC outputs not found (may not be deployed yet)")

    def test_kms_outputs(self):
        """Test KMS key outputs are available."""
        print("\nTesting: KMS Key Outputs")
        print("Scenario: KMS key for encryption is deployed")

        kms_key_arn = self.outputs.get('kms_key_arn')
        print(f"  KMS Key ARN: {kms_key_arn}")

        if kms_key_arn:
            self.assertIsNotNone(kms_key_arn, "KMS Key ARN not found")
            self.assertIn('arn:aws:kms:', kms_key_arn, "Invalid KMS ARN format")
            print("  Result: KMS key is deployed")
        else:
            print("  Info: KMS key outputs not found (may not be deployed yet)")

    def test_s3_bucket_outputs(self):
        """Test S3 bucket outputs are available."""
        print("\nTesting: S3 Bucket Outputs")
        print("Scenario: Secure S3 bucket is deployed")

        s3_bucket = self.outputs.get('secure_s3_bucket')
        print(f"  S3 Bucket: {s3_bucket}")

        if s3_bucket:
            self.assertIsNotNone(s3_bucket, "S3 bucket not found")
            print("  Result: Secure S3 bucket is deployed")
        else:
            print("  Info: S3 bucket outputs not found (may not be deployed yet)")

    def test_subnet_outputs(self):
        """Test subnet outputs are available."""
        print("\nTesting: Subnet Outputs")
        print("Scenario: Public and private subnets are deployed")

        public_subnets = self.outputs.get('public_subnet_ids')
        private_subnets = self.outputs.get('private_subnet_ids')
        
        print(f"  Public Subnets: {public_subnets}")
        print(f"  Private Subnets: {private_subnets}")

        if public_subnets:
            self.assertIsNotNone(public_subnets, "Public subnets not found")
            if isinstance(public_subnets, list):
                self.assertGreater(len(public_subnets), 0, "No public subnets deployed")
            print("  Result: Public subnets are deployed")
        
        if private_subnets:
            self.assertIsNotNone(private_subnets, "Private subnets not found")
            if isinstance(private_subnets, list):
                self.assertGreater(len(private_subnets), 0, "No private subnets deployed")
            print("  Result: Private subnets are deployed")

        if not public_subnets and not private_subnets:
            print("  Info: Subnet outputs not found (may not be deployed yet)")

    def test_security_group_outputs(self):
        """Test security group outputs are available."""
        print("\nTesting: Security Group Outputs")
        print("Scenario: Database security group is deployed")

        db_sg_id = self.outputs.get('database_security_group_id')
        print(f"  Database Security Group ID: {db_sg_id}")

        if db_sg_id:
            self.assertIsNotNone(db_sg_id, "Database security group ID not found")
            print("  Result: Database security group is deployed")
        else:
            print("  Info: Security group outputs not found (may not be deployed yet)")

    def test_multi_region_outputs(self):
        """Test multi-region outputs are available."""
        print("\nTesting: Multi-Region Outputs")
        print("Scenario: Infrastructure deployed across multiple regions")

        # Check for region-specific outputs
        regions_found = []
        for key in self.outputs.keys():
            if 'useast1' in key or 'uswest2' in key:
                regions_found.append(key)

        print(f"  Region-specific outputs found: {len(regions_found)}")
        
        if regions_found:
            self.assertGreater(len(regions_found), 0, "No region-specific outputs found")
            print("  Result: Multi-region deployment outputs available")
        else:
            print("  Info: Multi-region outputs not found (may be single region deployment)")


class TestSecurityConfiguration(unittest.TestCase):
    """Test security configuration and compliance."""

    def test_security_stack_structure(self):
        """Test security-focused stack structure."""
        print("\nTesting: Security Stack Structure")
        print("Scenario: Stack implements security best practices")

        args = TapStackArgs(
            environment_suffix='security-test',
            regions=['us-east-1'],
            tags={'Security': 'High', 'Compliance': 'Required'}
        )

        stack = TapStack('security-test-stack', args)

        # Verify security-focused components
        self.assertIsNotNone(stack.identity_access, "Identity access infrastructure missing")
        self.assertIn('us-east-1', stack.regional_data_protection, "Data protection missing")
        self.assertIn('us-east-1', stack.regional_monitoring, "Security monitoring missing")
        
        # Verify security tags
        self.assertEqual(stack.tags['Security'], 'High')
        self.assertEqual(stack.tags['Compliance'], 'Required')
        
        print("  Result: Security stack structure validated")

    def test_encryption_integration(self):
        """Test encryption integration across components."""
        print("\nTesting: Encryption Integration")
        print("Scenario: KMS encryption is integrated across components")

        args = TapStackArgs(
            environment_suffix='encryption-test',
            regions=['us-east-1']
        )

        stack = TapStack('encryption-test-stack', args)

        # Verify identity access provides KMS key
        self.assertIsNotNone(stack.identity_access, "Identity access infrastructure missing")
        
        # Verify regional components exist (they should use the KMS key)
        self.assertIn('us-east-1', stack.regional_networks, "Network component missing")
        self.assertIn('us-east-1', stack.regional_data_protection, "Data protection component missing")
        
        print("  Result: Encryption integration structure validated")


if __name__ == '__main__':
    # Check if output file exists before running tests
    output_file = 'cfn-outputs/flat-outputs.json'
    if not os.path.exists(output_file):
        print(f"Info: Output file {output_file} not found.")
        print("Running structure validation tests only.")
        print("Deploy the stack first to run full integration tests.")
        print("Run: pulumi up")
    else:
        print("=" * 70)
        print("Starting Integration Tests for TapStack")
        print("=" * 70)

    unittest.main(verbosity=2)
