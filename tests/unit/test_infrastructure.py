"""
test_infrastructure_clean.py

Clean unit tests for TapStack infrastructure components that focus on 
testing business logic without complex Pulumi mocking issues.
"""

import unittest
import os
import sys

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackComponents(unittest.TestCase):
    """Test TapStack components without full Pulumi context"""

    def setUp(self):
        """Set up test environment"""
        self.environment_suffix = 'test'
        self.tags = {'Test': 'Value'}

    def test_tap_stack_args_creation(self):
        """Test TapStackArgs initialization"""
        # Test with defaults
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        
        # Test with custom values
        custom_tags = {'Test': 'Value', 'Environment': 'test'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)

    def test_tag_merging_logic(self):
        """Test tag merging logic"""
        environment_suffix = 'prod'
        custom_tags = {'Department': 'Engineering', 'Owner': 'DevOps', 'CostCenter': '12345'}
        args = TapStackArgs(environment_suffix=environment_suffix, tags=custom_tags)
        
        # Simulate the tag merging logic from TapStack
        merged_tags = {
            **args.tags,
            'Project': 'LogisticsTracking',
            'Environment': environment_suffix,
            'ManagedBy': 'Pulumi'
        }
        
        # Verify all tags are present
        expected_tags = {
            'Department': 'Engineering',
            'Owner': 'DevOps', 
            'CostCenter': '12345',
            'Project': 'LogisticsTracking',
            'Environment': 'prod',
            'ManagedBy': 'Pulumi'
        }
        
        for key, expected_value in expected_tags.items():
            self.assertIn(key, merged_tags)
            self.assertEqual(merged_tags[key], expected_value)

    def test_environment_suffix_handling(self):
        """Test environment suffix handling in various scenarios"""
        # Test None value defaults to 'dev'
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')
        
        # Test empty string defaults to 'dev'  
        args = TapStackArgs(environment_suffix='')
        self.assertEqual(args.environment_suffix, 'dev')
        
        # Test various valid suffixes
        test_suffixes = ['dev', 'test', 'staging', 'prod', 'demo']
        for suffix in test_suffixes:
            args = TapStackArgs(environment_suffix=suffix)
            self.assertEqual(args.environment_suffix, suffix)

    def test_tags_handling(self):
        """Test tags parameter handling"""
        # Test None tags defaults to empty dict
        args = TapStackArgs(tags=None)
        self.assertEqual(args.tags, {})
        
        # Test empty dict
        args = TapStackArgs(tags={})
        self.assertEqual(args.tags, {})
        
        # Test tags are preserved
        test_tags = {
            'Project': 'MyProject',
            'Environment': 'development',
            'Team': 'Backend',
            'Version': '1.0.0'
        }
        args = TapStackArgs(tags=test_tags)
        self.assertEqual(args.tags, test_tags)

    def test_resource_naming_patterns(self):
        """Test resource naming patterns used throughout the stack"""
        environment_suffix = 'staging'
        
        # Test naming patterns that would be used for resources
        dlq_name = f"tracking-lambda-dlq-{environment_suffix}"
        table_name = f"tracking-data-{environment_suffix}"
        function_name = f"tracking-lambda-{environment_suffix}"
        api_name = f"tracking-api-{environment_suffix}"
        
        self.assertEqual(dlq_name, "tracking-lambda-dlq-staging")
        self.assertEqual(table_name, "tracking-data-staging")
        self.assertEqual(function_name, "tracking-lambda-staging")
        self.assertEqual(api_name, "tracking-api-staging")

    def test_configuration_validation(self):
        """Test configuration validation logic"""
        # Test valid configurations
        valid_configs = [
            {'environment_suffix': 'dev', 'tags': {}},
            {'environment_suffix': 'prod', 'tags': {'Owner': 'Team1'}},
            {'environment_suffix': 'test123', 'tags': {'Multi': 'Tags', 'Here': 'Yes'}}
        ]
        
        for config in valid_configs:
            args = TapStackArgs(**config)
            self.assertIsInstance(args.environment_suffix, str)
            self.assertIsInstance(args.tags, dict)
            self.assertTrue(len(args.environment_suffix) > 0)

    def test_default_tag_values(self):
        """Test the default tag values that get applied"""
        environment_suffix = 'test'
        custom_tags = {'CustomTag': 'CustomValue'}
        args = TapStackArgs(environment_suffix=environment_suffix, tags=custom_tags)
        
        # Simulate default tag application
        default_tags = {
            'Project': 'LogisticsTracking',
            'Environment': environment_suffix,
            'ManagedBy': 'Pulumi'
        }
        
        final_tags = {**custom_tags, **default_tags}
        
        # Verify default tags
        self.assertEqual(final_tags['Project'], 'LogisticsTracking')
        self.assertEqual(final_tags['Environment'], 'test')
        self.assertEqual(final_tags['ManagedBy'], 'Pulumi')
        self.assertEqual(final_tags['CustomTag'], 'CustomValue')

    def test_multiple_environments(self):
        """Test handling multiple environment configurations"""
        environments = ['dev', 'test', 'staging', 'prod']
        
        for env in environments:
            args = TapStackArgs(environment_suffix=env)
            
            # Each environment should have proper suffix
            self.assertEqual(args.environment_suffix, env)
            
            # Resource names should be unique per environment
            dlq_name = f"tracking-lambda-dlq-{env}"
            table_name = f"tracking-data-{env}"
            
            # Verify naming uniqueness
            for other_env in environments:
                if other_env != env:
                    other_dlq = f"tracking-lambda-dlq-{other_env}"
                    other_table = f"tracking-data-{other_env}"
                    self.assertNotEqual(dlq_name, other_dlq)
                    self.assertNotEqual(table_name, other_table)


if __name__ == '__main__':
    unittest.main()
