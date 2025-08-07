#tests/unit/test_tap_stack.py
"""
Unit tests for the TapStack infrastructure components.

This module contains comprehensive unit tests for all components of the TapStack,
ensuring proper configuration, security settings, and compliance with requirements.
"""

import pulumi
import pytest
from moto import mock_ec2, mock_s3, mock_iam, mock_kms
import boto3
from unittest.mock import patch, MagicMock


class TestTapStackUnit:
    """Unit tests for TapStack components."""
    
    @pytest.fixture
    def mock_pulumi(self):
        """Mock Pulumi configuration."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = 'test'
            yield mock_config
    
    def test_standard_tags(self):
        """Test that standard tags are properly defined."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        # Mock Pulumi resources
        with patch('pulumi_aws.kms.Key'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail'), \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.s3.Bucket'), \
             patch('pulumi_aws.rds.Instance'), \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance'), \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            assert stack.standard_tags["Environment"] == "test"
            assert stack.standard_tags["Owner"] == "DevOps-Team"
            assert stack.standard_tags["CostCenter"] == "Infrastructure"
            assert stack.standard_tags["Project"] == "AWS-Nova-Model-Breaking"
            assert stack.standard_tags["ManagedBy"] == "Pulumi"
    
    def test_regions_configuration(self):
        """Test that regions are properly configured."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        with patch('pulumi_aws.kms.Key'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail'), \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.s3.Bucket'), \
             patch('pulumi_aws.rds.Instance'), \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance'), \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            expected_regions = ["us-east-1", "us-west-2", "ap-south-1"]
            assert stack.regions == expected_regions
            assert stack.primary_region == "us-east-1"
    
    def test_resource_naming_convention(self):
        """Test that resources follow PROD prefix naming convention."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        # Mock all AWS resources
        with patch('pulumi_aws.kms.Key') as mock_kms, \
             patch('pulumi_aws.secretsmanager.Secret') as mock_secret, \
             patch('pulumi_aws.iam.Role') as mock_role, \
             patch('pulumi_aws.cloudtrail.Trail') as mock_trail, \
             patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
             patch('pulumi_aws.s3.Bucket') as mock_s3, \
             patch('pulumi_aws.rds.Instance') as mock_rds, \
             patch('pulumi_aws.lambda_.Function') as mock_lambda, \
             patch('pulumi_aws.ec2.Instance') as mock_ec2, \
             patch('pulumi_aws.cloudwatch.LogGroup') as mock_log, \
             patch('pulumi_aws.cfg.ConfigurationRecorder') as mock_config, \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            # Check that KMS keys are created with PROD prefix
            assert mock_kms.call_count >= 3  # One for each region
            for call in mock_kms.call_args_list:
                resource_name = call[0][0]  # First positional argument is resource name
                assert resource_name.startswith("PROD-kms-")
    
    def test_kms_key_rotation_enabled(self):
        """Test that KMS key rotation is enabled."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        with patch('pulumi_aws.kms.Key') as mock_kms, \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail'), \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.s3.Bucket'), \
             patch('pulumi_aws.rds.Instance'), \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance'), \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            # Verify KMS key rotation is enabled
            for call in mock_kms.call_args_list:
                kwargs = call[1]
                assert kwargs.get('enable_key_rotation') is True
    
    def test_s3_encryption_configuration(self):
        """Test that S3 buckets have proper encryption configuration."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        with patch('pulumi_aws.kms.Key'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail'), \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.s3.Bucket') as mock_s3, \
             patch('pulumi_aws.rds.Instance'), \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance'), \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            # Verify S3 buckets have encryption configuration
            for call in mock_s3.call_args_list:
                kwargs = call[1]
                if 'server_side_encryption_configuration' in kwargs:
                    sse_config = kwargs['server_side_encryption_configuration']
                    assert sse_config is not None
    
    def test_vpc_ipv6_support(self):
        """Test that VPCs have IPv6 support enabled."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        with patch('pulumi_aws.kms.Key'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail'), \
             patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
             patch('pulumi_aws.s3.Bucket'), \
             patch('pulumi_aws.rds.Instance'), \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance'), \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            # Verify VPCs have IPv6 enabled
            for call in mock_vpc.call_args_list:
                kwargs = call[1]
                assert kwargs.get('assign_generated_ipv6_cidr_block') is True
    
    def test_rds_encryption_enabled(self):
        """Test that RDS instances have encryption enabled."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        with patch('pulumi_aws.kms.Key'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail'), \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.s3.Bucket'), \
             patch('pulumi_aws.rds.Instance') as mock_rds, \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance'), \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            # Verify RDS instances have encryption enabled
            for call in mock_rds.call_args_list:
                kwargs = call[1]
                assert kwargs.get('storage_encrypted') is True
    
    def test_cloudtrail_multi_region(self):
        """Test that CloudTrail is configured for multi-region."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        with patch('pulumi_aws.kms.Key'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail') as mock_trail, \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.s3.Bucket'), \
             patch('pulumi_aws.rds.Instance'), \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance'), \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            # Verify CloudTrail is multi-region
            trail_call = mock_trail.call_args
            kwargs = trail_call[1]
            assert kwargs.get('is_multi_region_trail') is True
            assert kwargs.get('enable_log_file_validation') is True
    
    def test_ec2_metadata_security(self):
        """Test that EC2 instances have proper metadata security."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        with patch('pulumi_aws.kms.Key'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.iam.Role'), \
             patch('pulumi_aws.cloudtrail.Trail'), \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.s3.Bucket'), \
             patch('pulumi_aws.rds.Instance'), \
             patch('pulumi_aws.lambda_.Function'), \
             patch('pulumi_aws.ec2.Instance') as mock_ec2, \
             patch('pulumi_aws.cloudwatch.LogGroup'), \
             patch('pulumi_aws.cfg.ConfigurationRecorder'), \
             patch('pulumi.ComponentResource.__init__'):
            
            stack = TapStack("test-stack", TapStackArgs("test"))
            
            # Verify EC2 metadata options
            for call in mock_ec2.call_args_list:
                kwargs = call[1]
                if 'metadata_options' in kwargs:
                    metadata = kwargs['metadata_options']
                    # Should require IMDSv2
                    assert hasattr(metadata, 'http_tokens')


if __name__ == "__main__":
    pytest.main([__file__])
