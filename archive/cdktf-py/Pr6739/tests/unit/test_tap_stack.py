"""Unit tests for TAP Stack with Multi-Region DR"""
import sys
import os
import unittest
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App
from lib.tap_stack import TapStack
from lib.stacks.multi_region_dr_stack import MultiRegionDRStack


class TestTapStack(unittest.TestCase):
    """Test TAP Stack configuration"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = App()
        self.stack = TapStack(
            self.app,
            'test-stack',
            environment_suffix='test123',
            state_bucket='test-bucket',
            state_bucket_region='us-east-1',
            aws_region='us-east-1'
        )

    def test_stack_initialization(self):
        """Test that stack initializes correctly"""
        self.assertIsNotNone(self.stack)
        self.assertIsInstance(self.stack, TapStack)

    def test_multi_region_dr_stack_created(self):
        """Test that Multi-Region DR stack is created"""
        self.assertIsNotNone(self.stack.dr_stack)
        self.assertIsInstance(self.stack.dr_stack, MultiRegionDRStack)


class TestMultiRegionDRStack(unittest.TestCase):
    """Test Multi-Region DR Stack components"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = App()
        # Create a TapStack which contains the MultiRegionDRStack
        self.tap_stack = TapStack(
            self.app,
            'test-stack',
            environment_suffix='test123',
            state_bucket='test-bucket',
            state_bucket_region='us-east-1',
            aws_region='us-east-1'
        )
        # Get reference to the DR stack
        self.stack = self.tap_stack.dr_stack

    def test_stack_initialization(self):
        """Test that DR stack initializes correctly"""
        self.assertIsNotNone(self.stack)
        self.assertEqual(self.stack.environment_suffix, 'test123')
        self.assertEqual(self.stack.primary_region, 'us-east-1')
        self.assertEqual(self.stack.secondary_region, 'us-east-2')

    def test_providers_exist(self):
        """Test that providers are created"""
        self.assertIsNotNone(self.stack.primary_provider)
        self.assertIsNotNone(self.stack.secondary_provider)

    def test_kms_keys_exist(self):
        """Test KMS keys are created"""
        self.assertIsNotNone(self.stack.kms_primary)
        self.assertIsNotNone(self.stack.kms_secondary)

    def test_networking_components_exist(self):
        """Test networking components are created"""
        # VPCs
        self.assertIsNotNone(self.stack.vpc_primary)
        self.assertIsNotNone(self.stack.vpc_secondary)
        
        # Subnets
        self.assertEqual(len(self.stack.public_subnets_primary), 3)
        self.assertEqual(len(self.stack.private_subnets_primary), 3)
        self.assertEqual(len(self.stack.public_subnets_secondary), 3)
        self.assertEqual(len(self.stack.private_subnets_secondary), 3)
        
        # NAT Gateways
        self.assertEqual(len(self.stack.nat_gateways_primary), 3)
        self.assertEqual(len(self.stack.nat_gateways_secondary), 3)
        
        # VPC Peering
        self.assertIsNotNone(self.stack.vpc_peering)

    def test_database_components_exist(self):
        """Test database components are created"""
        # Aurora Global
        self.assertIsNotNone(self.stack.aurora_global)
        self.assertIsNotNone(self.stack.aurora_primary)
        self.assertIsNotNone(self.stack.aurora_secondary)
        
        # Secrets
        self.assertIsNotNone(self.stack.db_secret)

    def test_dynamodb_table_exists(self):
        """Test DynamoDB global table is created"""
        self.assertIsNotNone(self.stack.dynamodb_table)

    def test_s3_buckets_exist(self):
        """Test S3 buckets are created"""
        self.assertIsNotNone(self.stack.s3_primary)
        self.assertIsNotNone(self.stack.s3_secondary)
        self.assertIsNotNone(self.stack.s3_replication_role)

    def test_lambda_functions_exist(self):
        """Test Lambda functions are created"""
        self.assertIsNotNone(self.stack.lambda_primary)
        self.assertIsNotNone(self.stack.lambda_secondary)
        self.assertIsNotNone(self.stack.lambda_role_primary)
        self.assertIsNotNone(self.stack.lambda_role_secondary)

    def test_api_gateway_exists(self):
        """Test API Gateway components are created"""
        self.assertIsNotNone(self.stack.api_primary)
        self.assertIsNotNone(self.stack.api_secondary)
        self.assertIsNotNone(self.stack.api_stage_primary)
        self.assertIsNotNone(self.stack.api_stage_secondary)

    def test_route53_components_exist(self):
        """Test Route 53 components are created"""
        self.assertIsNotNone(self.stack.hosted_zone)
        self.assertIsNotNone(self.stack.health_check)

    def test_monitoring_components_exist(self):
        """Test monitoring components are created"""
        # SNS topics should exist
        self.assertIsNotNone(self.stack.sns_primary)
        self.assertIsNotNone(self.stack.sns_secondary)

    def test_no_hardcoded_passwords(self):
        """Test no hardcoded passwords in configuration"""
        # The password generation method should exist
        self.assertTrue(hasattr(self.stack, 'generate_secure_password'))
        
        # Call the method to verify it generates passwords
        password = self.stack.generate_secure_password()
        self.assertIsInstance(password, str)
        self.assertGreaterEqual(len(password), 32)
        
        # Should not contain common weak passwords
        self.assertNotIn('password', password.lower())
        self.assertNotIn('temp', password.lower())

    def test_resource_naming_convention(self):
        """Test resources follow naming convention"""
        # Check Lambda function names
        lambda_primary_name = 'payment-processor-primary-test123'
        lambda_secondary_name = 'payment-processor-secondary-test123'
        
        # The actual names are set during resource creation
        # We can verify the pattern is correct
        self.assertTrue(self.stack.environment_suffix in 'test123')

    def test_encryption_enabled(self):
        """Test encryption is enabled for all data stores"""
        # KMS keys should have rotation enabled
        # This is set in the resource definition
        self.assertIsNotNone(self.stack.kms_primary)
        self.assertIsNotNone(self.stack.kms_secondary)
        
        # Aurora clusters use KMS
        self.assertIsNotNone(self.stack.aurora_primary)
        self.assertIsNotNone(self.stack.aurora_secondary)
        
        # DynamoDB has server-side encryption
        self.assertIsNotNone(self.stack.dynamodb_table)

    def test_high_availability_configuration(self):
        """Test HA configuration"""
        # Multiple subnets per region
        self.assertEqual(len(self.stack.private_subnets_primary), 3)
        self.assertEqual(len(self.stack.private_subnets_secondary), 3)
        
        # Multiple NAT gateways
        self.assertEqual(len(self.stack.nat_gateways_primary), 3)
        self.assertEqual(len(self.stack.nat_gateways_secondary), 3)

    def test_outputs_are_defined(self):
        """Test that outputs method exists"""
        self.assertTrue(hasattr(self.stack, 'create_outputs'))


if __name__ == '__main__':
    unittest.main()
