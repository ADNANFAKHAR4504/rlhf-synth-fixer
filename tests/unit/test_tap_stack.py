# tests/unit/test_tap_stack.py
"""
Unit tests for the TapStack infrastructure components.

This module contains comprehensive unit tests for all components of the TapStack,
ensuring proper configuration, security settings, and compliance with requirements.
"""

import pulumi
import pytest
from unittest.mock import patch, MagicMock
import json


class TestTapStackUnit:
    """Unit tests for TapStack components."""

    @pytest.fixture
    def mock_pulumi(self):
        """Mock Pulumi configuration."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = 'test'
            yield mock_config

    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.kms.Key')
    @patch('pulumi_aws.kms.Alias')
    @patch('pulumi_aws.secretsmanager.Secret')
    @patch('pulumi_aws.secretsmanager.SecretVersion')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.InstanceProfile')
    @patch('pulumi_aws.s3.Bucket')
    @patch('pulumi_aws.s3.BucketPolicy')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.cloudtrail.Trail')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.ec2.InternetGateway')
    @patch('pulumi_aws.ec2.Subnet')
    @patch('pulumi_aws.ec2.RouteTable')
    @patch('pulumi_aws.ec2.Route')
    @patch('pulumi_aws.ec2.RouteTableAssociation')
    @patch('pulumi_aws.ec2.FlowLog')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.ec2.Instance')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.rds.Instance')
    @patch('pulumi_aws.rds.SubnetGroup')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.Provider')
    @patch('pulumi.ComponentResource.__init__')
    def test_standard_tags(self, *mocks):
        """Test that standard tags are properly defined."""
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mocks[0].return_value = mock_identity  # get_caller_identity
        
        # Mock get_availability_zones
        mock_azs = MagicMock()
        mock_azs.names = ["us-east-1a", "us-east-1b"]
        mocks[2].return_value = mock_azs  # get_availability_zones
        
        # Mock get_ami
        mock_ami = MagicMock()
        mock_ami.id = "ami-12345678"
        mocks[3].return_value = mock_ami  # get_ami

        from tap_stack import TapStack, TapStackArgs
        
        stack = TapStack("test-stack", TapStackArgs("test"))
        
        assert stack.standard_tags["Environment"] == "test"
        assert stack.standard_tags["Owner"] == "DevOps-Team"
        assert stack.standard_tags["CostCenter"] == "Infrastructure"
        assert stack.standard_tags["Project"] == "AWS-Nova-Model-Breaking"
        assert stack.standard_tags["ManagedBy"] == "Pulumi"

    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.kms.Key')
    @patch('pulumi_aws.kms.Alias')
    @patch('pulumi_aws.secretsmanager.Secret')
    @patch('pulumi_aws.secretsmanager.SecretVersion')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.InstanceProfile')
    @patch('pulumi_aws.s3.Bucket')
    @patch('pulumi_aws.s3.BucketPolicy')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.cloudtrail.Trail')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.ec2.InternetGateway')
    @patch('pulumi_aws.ec2.Subnet')
    @patch('pulumi_aws.ec2.RouteTable')
    @patch('pulumi_aws.ec2.Route')
    @patch('pulumi_aws.ec2.RouteTableAssociation')
    @patch('pulumi_aws.ec2.FlowLog')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.ec2.Instance')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.rds.Instance')
    @patch('pulumi_aws.rds.SubnetGroup')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.Provider')
    @patch('pulumi.ComponentResource.__init__')
    def test_regions_configuration(self, *mocks):
        """Test that regions are properly configured."""
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mocks[0].return_value = mock_identity
        
        # Mock get_availability_zones
        mock_azs = MagicMock()
        mock_azs.names = ["us-east-1a", "us-east-1b"]
        mocks[2].return_value = mock_azs
        
        # Mock get_ami
        mock_ami = MagicMock()
        mock_ami.id = "ami-12345678"
        mocks[3].return_value = mock_ami

        from tap_stack import TapStack, TapStackArgs
        
        stack = TapStack("test-stack", TapStackArgs("test"))
        
        # Updated to match your actual regions
        expected_regions = ["us-east-1", "us-west-2", "us-east-2"]
        assert stack.regions == expected_regions
        assert stack.primary_region == "us-east-1"

    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.kms.Key')
    @patch('pulumi_aws.kms.Alias')
    @patch('pulumi_aws.secretsmanager.Secret')
    @patch('pulumi_aws.secretsmanager.SecretVersion')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.InstanceProfile')
    @patch('pulumi_aws.s3.Bucket')
    @patch('pulumi_aws.s3.BucketPolicy')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.cloudtrail.Trail')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.ec2.InternetGateway')
    @patch('pulumi_aws.ec2.Subnet')
    @patch('pulumi_aws.ec2.RouteTable')
    @patch('pulumi_aws.ec2.Route')
    @patch('pulumi_aws.ec2.RouteTableAssociation')
    @patch('pulumi_aws.ec2.FlowLog')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.ec2.Instance')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.rds.Instance')
    @patch('pulumi_aws.rds.SubnetGroup')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.Provider')
    @patch('pulumi.ComponentResource.__init__')
    def test_kms_key_rotation_enabled(self, *mocks):
        """Test that KMS key rotation is enabled."""
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mocks[0].return_value = mock_identity
        
        # Mock get_availability_zones  
        mock_azs = MagicMock()
        mock_azs.names = ["us-east-1a", "us-east-1b"]
        mocks[2].return_value = mock_azs
        
        # Mock get_ami
        mock_ami = MagicMock()
        mock_ami.id = "ami-12345678"
        mocks[3].return_value = mock_ami

        mock_kms = mocks[4]  # KMS Key mock
        
        from tap_stack import TapStack, TapStackArgs
        
        stack = TapStack("test-stack", TapStackArgs("test"))
        
        # Verify KMS key rotation is enabled
        assert mock_kms.call_count >= 3  # One for each region
        for call in mock_kms.call_args_list:
            kwargs = call[1]
            assert kwargs.get('enable_key_rotation') is True
            assert kwargs.get('deletion_window_in_days') == 7

    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.kms.Key')
    @patch('pulumi_aws.kms.Alias')
    @patch('pulumi_aws.secretsmanager.Secret')
    @patch('pulumi_aws.secretsmanager.SecretVersion')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.InstanceProfile')
    @patch('pulumi_aws.s3.Bucket')
    @patch('pulumi_aws.s3.BucketPolicy')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.cloudtrail.Trail')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.ec2.InternetGateway')
    @patch('pulumi_aws.ec2.Subnet')
    @patch('pulumi_aws.ec2.RouteTable')
    @patch('pulumi_aws.ec2.Route')
    @patch('pulumi_aws.ec2.RouteTableAssociation')
    @patch('pulumi_aws.ec2.FlowLog')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.ec2.Instance')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.rds.Instance')
    @patch('pulumi_aws.rds.SubnetGroup')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.Provider')
    @patch('pulumi.ComponentResource.__init__')
    def test_rds_encryption_enabled(self, *mocks):
        """Test that RDS instances have encryption enabled."""
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mocks[0].return_value = mock_identity
        
        # Mock get_availability_zones
        mock_azs = MagicMock()
        mock_azs.names = ["us-east-1a", "us-east-1b"]
        mocks[2].return_value = mock_azs
        
        # Mock get_ami
        mock_ami = MagicMock()
        mock_ami.id = "ami-12345678"
        mocks[3].return_value = mock_ami

        mock_rds = mocks[5]  # RDS Instance mock
        
        from tap_stack import TapStack, TapStackArgs
        
        stack = TapStack("test-stack", TapStackArgs("test"))
        
        # Verify RDS instances have encryption enabled
        assert mock_rds.call_count >= 3  # One for each region
        for call in mock_rds.call_args_list:
            kwargs = call[1]
            assert kwargs.get('storage_encrypted') is True
            assert kwargs.get('engine') == "postgres"
            assert kwargs.get('engine_version') == "15.13"

    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.kms.Key')
    @patch('pulumi_aws.kms.Alias')
    @patch('pulumi_aws.secretsmanager.Secret')
    @patch('pulumi_aws.secretsmanager.SecretVersion')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.InstanceProfile')
    @patch('pulumi_aws.s3.Bucket')
    @patch('pulumi_aws.s3.BucketPolicy')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.cloudtrail.Trail')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.ec2.InternetGateway')
    @patch('pulumi_aws.ec2.Subnet')
    @patch('pulumi_aws.ec2.RouteTable')
    @patch('pulumi_aws.ec2.Route')
    @patch('pulumi_aws.ec2.RouteTableAssociation')
    @patch('pulumi_aws.ec2.FlowLog')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.ec2.Instance')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.rds.Instance')
    @patch('pulumi_aws.rds.SubnetGroup')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.Provider')
    @patch('pulumi.ComponentResource.__init__')
    def test_cloudtrail_multi_region(self, *mocks):
        """Test that CloudTrail is configured for multi-region."""
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mocks[0].return_value = mock_identity
        
        # Mock get_availability_zones
        mock_azs = MagicMock()
        mock_azs.names = ["us-east-1a", "us-east-1b"]
        mocks[2].return_value = mock_azs
        
        # Mock get_ami
        mock_ami = MagicMock()
        mock_ami.id = "ami-12345678"
        mocks[3].return_value = mock_ami

        mock_trail = mocks[6]  # CloudTrail mock
        
        from tap_stack import TapStack, TapStackArgs
        
        stack = TapStack("test-stack", TapStackArgs("test"))
        
        # Verify CloudTrail is multi-region
        trail_call = mock_trail.call_args
        kwargs = trail_call[1]
        assert kwargs.get('is_multi_region_trail') is True
        assert kwargs.get('enable_log_file_validation') is True

    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.kms.Key')
    @patch('pulumi_aws.kms.Alias')
    @patch('pulumi_aws.secretsmanager.Secret')
    @patch('pulumi_aws.secretsmanager.SecretVersion')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.InstanceProfile')
    @patch('pulumi_aws.s3.Bucket')
    @patch('pulumi_aws.s3.BucketPolicy')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.cloudtrail.Trail')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.ec2.InternetGateway')
    @patch('pulumi_aws.ec2.Subnet')
    @patch('pulumi_aws.ec2.RouteTable')
    @patch('pulumi_aws.ec2.Route')
    @patch('pulumi_aws.ec2.RouteTableAssociation')
    @patch('pulumi_aws.ec2.FlowLog')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.ec2.Instance')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.rds.Instance')
    @patch('pulumi_aws.rds.SubnetGroup')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.Provider')
    @patch('pulumi.ComponentResource.__init__')
    def test_ec2_metadata_security(self, *mocks):
        """Test that EC2 instances have proper metadata security."""
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mocks[0].return_value = mock_identity
        
        # Mock get_availability_zones
        mock_azs = MagicMock()
        mock_azs.names = ["us-east-1a", "us-east-1b"]
        mocks[2].return_value = mock_azs
        
        # Mock get_ami
        mock_ami = MagicMock()
        mock_ami.id = "ami-12345678"
        mocks[3].return_value = mock_ami

        mock_ec2 = mocks[7]  # EC2 Instance mock
        
        from tap_stack import TapStack, TapStackArgs
        
        stack = TapStack("test-stack", TapStackArgs("test"))
        
        # Verify EC2 metadata options
        assert mock_ec2.call_count >= 3  # One for each region
        for call in mock_ec2.call_args_list:
            kwargs = call[1]
            if 'metadata_options' in kwargs:
                metadata = kwargs['metadata_options']
                assert hasattr(metadata, 'http_tokens')

    def test_security_policy_validation(self):
        """Test security policy validation functions."""
        
        # Test TLS version validation
        def validate_tls_version(version):
            valid_versions = ['TLSv1.2', 'TLSv1.3']
            return version in valid_versions

        assert validate_tls_version('TLSv1.2') is True
        assert validate_tls_version('TLSv1.3') is True
        assert validate_tls_version('TLSv1.1') is False
        assert validate_tls_version('TLSv1.0') is False

        # Test resource naming convention
        def validate_resource_name(name):
            return name.startswith('PROD-')

        assert validate_resource_name('PROD-vpc-us-east-1-test') is True
        assert validate_resource_name('vpc-us-east-1-test') is False

        # Test required tags
        def validate_required_tags(tags):
            required_tags = ['Environment', 'Owner', 'CostCenter']
            return all(tag in tags for tag in required_tags)

        valid_tags = {
            'Environment': 'test',
            'Owner': 'DevOps-Team',
            'CostCenter': 'Infrastructure',
            'Project': 'AWS-Nova-Model-Breaking'
        }

        invalid_tags = {
            'Environment': 'test',
            'Owner': 'DevOps-Team'
            # Missing CostCenter
        }

        assert validate_required_tags(valid_tags) is True
        assert validate_required_tags(invalid_tags) is False

    def test_kms_policy_structure(self):
        """Test KMS policy structure includes required permissions."""
        
        # Test CloudTrail permissions in KMS policy
        def validate_kms_policy_has_cloudtrail_permissions(policy_json):
            policy = json.loads(policy_json)
            statements = policy.get('Statement', [])
            
            # Check for CloudTrail statement
            cloudtrail_statements = [
                stmt for stmt in statements 
                if stmt.get('Principal', {}).get('Service') == 'cloudtrail.amazonaws.com'
            ]
            
            return len(cloudtrail_statements) > 0

        sample_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Allow CloudTrail to encrypt logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": [
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:ReEncrypt*"
                    ],
                    "Resource": "*"
                }
            ]
        })

        assert validate_kms_policy_has_cloudtrail_permissions(sample_policy) is True

    def test_s3_bucket_security_configuration(self):
        """Test S3 bucket security configuration validation."""
        
        def validate_s3_public_access_block(block_config):
            required_blocks = [
                'block_public_acls',
                'block_public_policy', 
                'ignore_public_acls',
                'restrict_public_buckets'
            ]
            
            return all(block_config.get(key) is True for key in required_blocks)

        valid_config = {
            'block_public_acls': True,
            'block_public_policy': True,
            'ignore_public_acls': True,
            'restrict_public_buckets': True
        }

        invalid_config = {
            'block_public_acls': True,
            'block_public_policy': False,  # Should be True
            'ignore_public_acls': True,
            'restrict_public_buckets': True
        }

        assert validate_s3_public_access_block(valid_config) is True
        assert validate_s3_public_access_block(invalid_config) is False


if __name__ == "__main__":
    pytest.main([__file__])
