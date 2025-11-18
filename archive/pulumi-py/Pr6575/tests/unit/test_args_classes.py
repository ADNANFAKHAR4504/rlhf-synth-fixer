"""
test_args_classes.py

Comprehensive unit tests for Args classes to increase coverage.
"""

import unittest
from unittest.mock import Mock


class TestPrimaryRegionArgs(unittest.TestCase):
    """Test cases for PrimaryRegionArgs class."""
    
    def test_primary_region_args_with_all_params(self):
        """Test PrimaryRegionArgs with all parameters."""
        from lib.primary_region import PrimaryRegionArgs
        
        tags = {'Environment': 'Production', 'Team': 'DevOps'}
        args = PrimaryRegionArgs(
            environment_suffix='prod',
            region='us-west-2',
            tags=tags
        )
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.region, 'us-west-2')
        self.assertEqual(args.tags, tags)
    
    def test_primary_region_args_minimal(self):
        """Test PrimaryRegionArgs with minimal parameters."""
        from lib.primary_region import PrimaryRegionArgs
        
        args = PrimaryRegionArgs(
            environment_suffix='dev',
            region='us-east-1'
        )
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.region, 'us-east-1')
        self.assertIsInstance(args.tags, dict)
        self.assertEqual(len(args.tags), 0)


class TestDRRegionArgs(unittest.TestCase):
    """Test cases for DRRegionArgs class."""
    
    def test_dr_region_args_with_all_params(self):
        """Test DRRegionArgs with all parameters."""
        from lib.dr_region import DRRegionArgs
        
        tags = {'Environment': 'Production', 'Team': 'DevOps'}
        args = DRRegionArgs(
            environment_suffix='prod',
            region='us-west-2',
            primary_cluster_arn='arn:aws:rds:us-east-1:123456789012:cluster:primary',
            replication_source_bucket='source-bucket-prod',
            replication_role_arn='arn:aws:iam::123456789012:role/replication',
            tags=tags
        )
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.region, 'us-west-2')
        self.assertEqual(args.primary_cluster_arn, 'arn:aws:rds:us-east-1:123456789012:cluster:primary')
        self.assertEqual(args.replication_source_bucket, 'source-bucket-prod')
        self.assertEqual(args.replication_role_arn, 'arn:aws:iam::123456789012:role/replication')
        self.assertEqual(args.tags, tags)
    
    def test_dr_region_args_minimal(self):
        """Test DRRegionArgs with minimal parameters."""
        from lib.dr_region import DRRegionArgs
        
        args = DRRegionArgs(
            environment_suffix='test',
            region='us-east-2',
            primary_cluster_arn='arn:aws:rds:us-east-1:123456789012:cluster:test',
            replication_source_bucket='test-bucket',
            replication_role_arn='arn:aws:iam::123456789012:role/test'
        )
        
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.region, 'us-east-2')
        self.assertIsInstance(args.tags, dict)
        self.assertEqual(len(args.tags), 0)


class TestGlobalResourcesArgs(unittest.TestCase):
    """Test cases for GlobalResourcesArgs class."""
    
    def test_global_resources_args_with_all_params(self):
        """Test GlobalResourcesArgs with all parameters."""
        from lib.global_resources import GlobalResourcesArgs
        
        tags = {'Environment': 'Production', 'Team': 'DevOps'}
        args = GlobalResourcesArgs(
            environment_suffix='prod',
            primary_api_endpoint='https://api1.example.com',
            dr_api_endpoint='https://api2.example.com',
            primary_region='us-east-1',
            dr_region='us-west-2',
            tags=tags
        )
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.primary_api_endpoint, 'https://api1.example.com')
        self.assertEqual(args.dr_api_endpoint, 'https://api2.example.com')
        self.assertEqual(args.primary_region, 'us-east-1')
        self.assertEqual(args.dr_region, 'us-west-2')
        self.assertEqual(args.tags, tags)
    
    def test_global_resources_args_minimal(self):
        """Test GlobalResourcesArgs with minimal parameters."""
        from lib.global_resources import GlobalResourcesArgs
        
        args = GlobalResourcesArgs(
            environment_suffix='test',
            primary_api_endpoint='https://primary.test.com',
            dr_api_endpoint='https://dr.test.com',
            primary_region='us-east-1',
            dr_region='us-east-2'
        )
        
        self.assertEqual(args.environment_suffix, 'test')
        self.assertIsInstance(args.tags, dict)
        self.assertEqual(len(args.tags), 0)
    
    def test_global_resources_args_with_pulumi_output(self):
        """Test GlobalResourcesArgs can accept Pulumi Outputs as endpoints."""
        from lib.global_resources import GlobalResourcesArgs
        import pulumi
        
        # Simulate Pulumi Output objects
        primary_output = pulumi.Output.from_input('https://api1.aws.com')
        dr_output = pulumi.Output.from_input('https://api2.aws.com')
        
        args = GlobalResourcesArgs(
            environment_suffix='staging',
            primary_api_endpoint=primary_output,
            dr_api_endpoint=dr_output,
            primary_region='eu-west-1',
            dr_region='eu-west-2'
        )
        
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.primary_region, 'eu-west-1')
        self.assertEqual(args.dr_region, 'eu-west-2')


class TestModuleImports(unittest.TestCase):
    """Test that all modules can be imported."""
    
    def test_import_primary_region(self):
        """Test that primary_region module can be imported."""
        from lib import primary_region
        self.assertIsNotNone(primary_region)
        self.assertTrue(hasattr(primary_region, 'PrimaryRegion'))
        self.assertTrue(hasattr(primary_region, 'PrimaryRegionArgs'))
    
    def test_import_dr_region(self):
        """Test that dr_region module can be imported."""
        from lib import dr_region
        self.assertIsNotNone(dr_region)
        self.assertTrue(hasattr(dr_region, 'DRRegion'))
        self.assertTrue(hasattr(dr_region, 'DRRegionArgs'))
    
    def test_import_global_resources(self):
        """Test that global_resources module can be imported."""
        from lib import global_resources
        self.assertIsNotNone(global_resources)
        self.assertTrue(hasattr(global_resources, 'GlobalResources'))
        self.assertTrue(hasattr(global_resources, 'GlobalResourcesArgs'))
    
    def test_import_tap_stack(self):
        """Test that tap_stack module can be imported."""
        from lib import tap_stack
        self.assertIsNotNone(tap_stack)
        # This tests tap_stack which uses CDKTF


if __name__ == '__main__':
    unittest.main()

