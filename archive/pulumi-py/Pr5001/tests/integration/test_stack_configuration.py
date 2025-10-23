"""
test_stack_configuration.py

Integration tests for TapStack configuration validation.
Tests actual stack configuration without mocking.
"""

import pytest
import os
import sys
import importlib.util

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from tap_stack import TapStackArgs, TapStack


class TestTapStackConfiguration:
    """Integration tests for TapStack configuration validation."""

    def test_stack_args_initialization_with_real_values(self):
        """Test TapStackArgs with realistic production values."""
        # Test with production-like values
        production_tags = {
            'Owner': 'Platform Team',
            'CostCenter': '12345',
            'Environment': 'production',
            'DataClassification': 'Restricted',
            'BackupRequired': 'true',
            'MonitoringLevel': 'high'
        }
        
        args = TapStackArgs(
            environment_suffix='prod',
            tags=production_tags
        )
        
        # Verify initialization
        assert args.environment_suffix == 'prod'
        assert args.tags['Owner'] == 'Platform Team'
        assert args.tags['CostCenter'] == '12345'
        assert args.tags['DataClassification'] == 'Restricted'

    def test_stack_args_with_development_configuration(self):
        """Test TapStackArgs with development environment values."""
        dev_tags = {
            'Owner': 'Development Team',
            'CostCenter': 'DEV-001',
            'Environment': 'development',
            'AutoShutdown': 'true',
            'InstanceSize': 'small'
        }
        
        args = TapStackArgs(
            environment_suffix='dev',
            tags=dev_tags
        )
        
        assert args.environment_suffix == 'dev'
        assert args.tags['Owner'] == 'Development Team'
        assert args.tags['AutoShutdown'] == 'true'

    def test_stack_args_with_staging_configuration(self):
        """Test TapStackArgs with staging environment values."""
        staging_tags = {
            'Owner': 'QA Team',
            'CostCenter': 'QA-002',
            'Environment': 'staging',
            'TestingScope': 'integration',
            'DataRetention': '30days'
        }
        
        args = TapStackArgs(
            environment_suffix='staging',
            tags=staging_tags
        )
        
        assert args.environment_suffix == 'staging'
        assert args.tags['Owner'] == 'QA Team'
        assert args.tags['TestingScope'] == 'integration'

    def test_stack_args_with_minimal_configuration(self):
        """Test TapStackArgs with minimal required configuration."""
        args = TapStackArgs()
        
        # Should use default values
        assert args.environment_suffix == 'dev'
        assert isinstance(args.tags, dict)
        assert len(args.tags) == 0  # Empty by default

    def test_stack_args_with_complex_tags(self):
        """Test TapStackArgs with complex tag structures."""
        complex_tags = {
            'aws:cloudformation:stack-name': 'student-records-stack',
            'kubernetes.io/cluster-name': 'student-cluster',
            'backup:frequency': 'daily',
            'monitoring:alert-level': 'critical',
            'compliance:data-classification': 'ferpa-protected',
            'cost:allocation': 'education-department',
            'deployment:method': 'pulumi',
            'security:encryption': 'required'
        }
        
        args = TapStackArgs(
            environment_suffix='integration',
            tags=complex_tags
        )
        
        assert args.environment_suffix == 'integration'
        assert args.tags['aws:cloudformation:stack-name'] == 'student-records-stack'
        assert args.tags['kubernetes.io/cluster-name'] == 'student-cluster'
        assert args.tags['compliance:data-classification'] == 'ferpa-protected'

    def test_stack_args_validation_edge_cases(self):
        """Test TapStackArgs with edge case values."""
        # Test with empty environment suffix
        args1 = TapStackArgs(environment_suffix='', tags={})
        assert args1.environment_suffix == 'dev'  # Should default to 'dev'
        
        # Test with None environment suffix  
        args2 = TapStackArgs(environment_suffix=None, tags={})
        assert args2.environment_suffix == 'dev'  # Should default to 'dev'
        
        # Test with whitespace-only environment suffix
        args3 = TapStackArgs(environment_suffix='   ', tags={})
        assert args3.environment_suffix == 'dev'  # Should default to 'dev'

    def test_stack_args_with_numeric_and_boolean_tag_values(self):
        """Test TapStackArgs with various data types in tag values."""
        mixed_tags = {
            'string_value': 'test-string',
            'numeric_value': '12345',
            'boolean_value': 'true',
            'version_number': '1.2.3',
            'port_number': '8080',
            'percentage': '95.5'
        }
        
        args = TapStackArgs(
            environment_suffix='test',
            tags=mixed_tags
        )
        
        assert args.tags['string_value'] == 'test-string'
        assert args.tags['numeric_value'] == '12345'
        assert args.tags['boolean_value'] == 'true'
        assert args.tags['version_number'] == '1.2.3'

    def test_stack_args_immutability(self):
        """Test that TapStackArgs properties maintain their values."""
        original_tags = {'Environment': 'test', 'Project': 'student-records'}
        args = TapStackArgs(environment_suffix='test', tags=original_tags.copy())
        
        # Verify original values
        assert args.environment_suffix == 'test'
        assert args.tags['Environment'] == 'test'
        assert args.tags['Project'] == 'student-records'
        
        # Verify that args stores its own copy and doesn't share reference
        assert args.tags is not original_tags, "TapStackArgs should not share dictionary reference"

    def test_stack_args_with_large_tag_set(self):
        """Test TapStackArgs with a large number of tags."""
        large_tag_set = {}
        for i in range(50):  # AWS allows up to 50 tags per resource
            large_tag_set[f'tag-key-{i:02d}'] = f'tag-value-{i:02d}'
        
        args = TapStackArgs(
            environment_suffix='large-test',
            tags=large_tag_set
        )
        
        assert args.environment_suffix == 'large-test'
        assert len(args.tags) == 50
        assert args.tags['tag-key-00'] == 'tag-value-00'
        assert args.tags['tag-key-49'] == 'tag-value-49'

    def test_stack_configuration_environment_specific_values(self):
        """Test stack configuration with environment-specific realistic values."""
        environments = {
            'dev': {
                'suffix': 'dev',
                'tags': {
                    'Environment': 'development',
                    'InstanceType': 't3.micro',
                    'AutoShutdown': 'enabled',
                    'BackupRetention': '7days'
                }
            },
            'staging': {
                'suffix': 'staging', 
                'tags': {
                    'Environment': 'staging',
                    'InstanceType': 't3.small',
                    'AutoShutdown': 'disabled',
                    'BackupRetention': '14days'
                }
            },
            'prod': {
                'suffix': 'prod',
                'tags': {
                    'Environment': 'production',
                    'InstanceType': 't3.medium',
                    'AutoShutdown': 'disabled', 
                    'BackupRetention': '30days'
                }
            }
        }
        
        for env_name, env_config in environments.items():
            args = TapStackArgs(
                environment_suffix=env_config['suffix'],
                tags=env_config['tags']
            )
            
            assert args.environment_suffix == env_config['suffix']
            assert args.tags['Environment'] == env_config['tags']['Environment']
            assert args.tags['InstanceType'] == env_config['tags']['InstanceType']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
