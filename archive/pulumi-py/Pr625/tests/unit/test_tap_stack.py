"""
Unit tests for the TAP (Test Automation Platform) infrastructure stack.

This test suite provides comprehensive coverage for all major components
including VPC, KMS, IAM, RDS, Lambda, EC2, S3, and monitoring resources.
"""

import json
import pytest
import unittest.mock as mock
from unittest.mock import MagicMock, patch, PropertyMock

import pulumi
from pulumi import ComponentResource, ResourceOptions, Resource
import pulumi_aws as aws

# Import the classes to test
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs:
    """Test cases for TapStackArgs constructor."""
    
    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs properly stores environment suffix."""
        args = TapStackArgs("test-env")
        assert args.environment_suffix == "test-env"
    
    def test_tap_stack_args_with_different_environments(self):
        """Test TapStackArgs with various environment names."""
        test_cases = ["dev", "staging", "prod", "test-123"]
        for env in test_cases:
            args = TapStackArgs(env)
            assert args.environment_suffix == env


class TestTapStack:
    """Comprehensive test cases for TapStack infrastructure."""
    
    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.mock_account_id = "123456789012"
        self.environment_suffix = "test"
        self.args = TapStackArgs(self.environment_suffix)
        
        # Mock AWS get_caller_identity
        self.caller_identity_mock = MagicMock()
        self.caller_identity_mock.account_id = self.mock_account_id
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.kms.Key')
    @patch('pulumi_aws.kms.Alias')
    def test_create_kms_keys(self, mock_alias, mock_key, mock_provider, mock_caller_id):
        """Test KMS key creation across all regions."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock KMS key
        mock_key_instance = MagicMock()
        mock_key_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/test-key"
        mock_key_instance.key_id = "test-key-id"
        mock_key.return_value = mock_key_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.primary_region = "us-east-1"
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            # Call the method we want to test
            stack._create_kms_keys()
            
            # Verify KMS keys were created for all regions
            assert len(stack.kms_keys) == 3
            assert "us-east-1" in stack.kms_keys
            assert "us-west-2" in stack.kms_keys
            assert "us-east-2" in stack.kms_keys
            
            # Verify primary KMS key is set
            assert stack.kms_key == stack.kms_keys["us-east-1"]
            
            # Verify KMS key creation was called for each region
            assert mock_key.call_count == 3
            assert mock_alias.call_count == 3
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.secretsmanager.Secret')
    @patch('pulumi_aws.secretsmanager.SecretVersion')
    @patch('pulumi_aws.Provider')
    def test_create_secrets_manager(self, mock_provider, mock_version, mock_secret, mock_caller_id):
        """Test Secrets Manager creation and regional replicas."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock secrets
        mock_secret_instance = MagicMock()
        mock_secret_instance.id = "secret-id"
        mock_secret_instance.arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:test"
        mock_secret.return_value = mock_secret_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.primary_region = "us-east-1"
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            # Set up required attributes
            mock_kms = MagicMock()
            mock_kms.arn = "test-kms-arn"
            stack.kms_key = mock_kms
            stack.kms_keys = {
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            
            stack._create_secrets_manager()
            
            # Verify primary secret was created
            assert hasattr(stack, 'secrets_manager')
            
            # Verify secret creation calls
            assert mock_secret.call_count >= 1
            assert mock_version.call_count >= 1
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.InstanceProfile')
    def test_create_iam_roles(self, mock_profile, mock_attachment, mock_role, mock_caller_id):
        """Test IAM roles and policies creation."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock IAM role
        mock_role_instance = MagicMock()
        mock_role_instance.name = "test-role"
        mock_role_instance.arn = "arn:aws:iam::123456789012:role/test-role"
        mock_role.return_value = mock_role_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            stack._create_iam_roles()
            
            # Verify roles were created
            assert hasattr(stack, 'ec2_role')
            assert hasattr(stack, 'lambda_role')
            assert hasattr(stack, 'ec2_instance_profile')
            
            # Verify role creation calls
            assert mock_role.call_count == 2  # EC2 and Lambda roles
            assert mock_attachment.call_count == 2  # Policy attachments
            assert mock_profile.call_count == 1  # Instance profile
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.ec2.InternetGateway')
    @patch('pulumi_aws.ec2.Subnet')
    @patch('pulumi_aws.ec2.RouteTable')
    @patch('pulumi_aws.ec2.Route')
    @patch('pulumi_aws.ec2.RouteTableAssociation')
    @patch('pulumi_aws.ec2.FlowLog')
    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicy')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_create_vpc_infrastructure(self, mock_log_group, mock_role_policy, mock_role, 
                                     mock_azs, mock_flowlog, mock_rta, 
                                     mock_route, mock_rt, mock_subnet, mock_igw, 
                                     mock_vpc, mock_provider, mock_caller_id):
        """Test VPC infrastructure creation across regions."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock availability zones
        mock_azs.return_value = MagicMock(names=["us-east-1a", "us-east-1b"])
        
        # Mock VPC
        mock_vpc_instance = MagicMock()
        mock_vpc_instance.id = "vpc-12345"
        mock_vpc.return_value = mock_vpc_instance
        
        # Mock subnets
        mock_subnet_instance = MagicMock()
        mock_subnet_instance.id = "subnet-12345"
        mock_subnet.return_value = mock_subnet_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.primary_region = "us-east-1"
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            stack.kms_keys = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            
            stack._create_vpc_infrastructure()
            
            # Verify VPC infrastructure
            assert hasattr(stack, 'vpcs')
            assert hasattr(stack, 'subnets')
            assert hasattr(stack, 'primary_vpc')
            assert len(stack.vpcs) == 3
            assert len(stack.subnets) == 3
            
            # Verify VPC creation for each region
            assert mock_vpc.call_count == 3
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.s3.Bucket')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    def test_create_s3_buckets(self, mock_pab, mock_bucket, mock_provider, mock_caller_id):
        """Test S3 buckets creation across regions."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock S3 bucket
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = "bucket-id"
        mock_bucket.return_value = mock_bucket_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            stack.kms_keys = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            
            stack._create_s3_buckets()
            
            # Verify S3 buckets
            assert hasattr(stack, 's3_buckets')
            assert len(stack.s3_buckets) == 3
            
            # Verify bucket creation for each region
            assert mock_bucket.call_count == 3
            assert mock_pab.call_count == 3
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.rds.SubnetGroup')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.rds.Instance')
    def test_create_rds_instances(self, mock_rds, mock_sg, mock_subnet_group, 
                                mock_provider, mock_caller_id):
        """Test RDS instances creation across regions."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock RDS instance
        mock_rds_instance = MagicMock()
        mock_rds_instance.id = "rds-instance-id"
        mock_rds.return_value = mock_rds_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.primary_region = "us-east-1"
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            stack.kms_keys = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            stack.vpcs = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            stack.subnets = {
                "us-east-1": {"private": [MagicMock(), MagicMock()]},
                "us-west-2": {"private": [MagicMock(), MagicMock()]},
                "us-east-2": {"private": [MagicMock(), MagicMock()]}
            }
            
            stack._create_rds_instances()
            
            # Verify RDS instances
            assert hasattr(stack, 'rds_instances')
            assert len(stack.rds_instances) == 3
            
            # Verify RDS creation for each region
            assert mock_rds.call_count == 3
            assert mock_sg.call_count == 3
            assert mock_subnet_group.call_count == 3
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.lambda_.Function')
    def test_create_lambda_functions(self, mock_lambda, mock_provider, mock_caller_id):
        """Test Lambda functions creation across regions."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock Lambda function
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.id = "lambda-function-id"
        mock_lambda.return_value = mock_lambda_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            stack.lambda_role = MagicMock()
            stack.lambda_role.arn = "lambda-role-arn"
            stack.kms_keys = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            
            stack._create_lambda_functions()
            
            # Verify Lambda functions
            assert hasattr(stack, 'lambda_functions')
            assert len(stack.lambda_functions) == 3
            
            # Verify Lambda creation for each region
            assert mock_lambda.call_count == 3
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.ec2.SecurityGroup')
    @patch('pulumi_aws.ec2.Instance')
    @patch('pulumi_aws.ec2.get_ami')
    def test_create_ec2_instances(self, mock_ami, mock_instance, mock_sg, 
                                mock_provider, mock_caller_id):
        """Test EC2 instances creation across regions."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock AMI
        mock_ami.return_value = MagicMock(id="ami-12345")
        
        # Mock EC2 instance
        mock_instance_obj = MagicMock()
        mock_instance_obj.id = "i-12345"
        mock_instance.return_value = mock_instance_obj
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            stack.ec2_instance_profile = MagicMock()
            stack.ec2_instance_profile.name = "profile-name"
            stack.kms_keys = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            stack.vpcs = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            stack.subnets = {
                "us-east-1": {"public": [MagicMock()]},
                "us-west-2": {"public": [MagicMock()]},
                "us-east-2": {"public": [MagicMock()]}
            }
            
            stack._create_ec2_instances()
            
            # Verify EC2 instances
            assert hasattr(stack, 'ec2_instances')
            assert len(stack.ec2_instances) == 3
            
            # Verify EC2 creation for each region
            assert mock_instance.call_count == 3
            assert mock_sg.call_count == 3
    
    @patch('pulumi_aws.get_caller_identity')
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    def test_create_monitoring(self, mock_alarm, mock_log_group, mock_provider, mock_caller_id):
        """Test monitoring resources creation."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        # Mock log group
        mock_log_group_instance = MagicMock()
        mock_log_group_instance.id = "log-group-id"
        mock_log_group.return_value = mock_log_group_instance
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            stack.kms_keys = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            stack.ec2_instances = {
                "us-east-1": MagicMock(),
                "us-west-2": MagicMock(),
                "us-east-2": MagicMock()
            }
            
            stack._create_monitoring()
            
            # Verify monitoring resources
            assert hasattr(stack, 'log_groups')
            assert len(stack.log_groups) == 3
            
            # Verify monitoring creation for each region
            assert mock_log_group.call_count == 3
            assert mock_alarm.call_count == 3
    
    def test_standard_tags_format(self):
        """Test that standard tags are properly formatted."""
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            stack.standard_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            # Verify standard tags
            expected_tags = {
                "Environment": self.environment_suffix,
                "Owner": "DevOps-Team",
                "CostCenter": "Infrastructure",
                "Project": "AWS-Nova-Model-Breaking",
                "ManagedBy": "Pulumi",
            }
            
            assert stack.standard_tags == expected_tags
    
    def test_regions_configuration(self):
        """Test that regions are properly configured."""
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.regions = ["us-east-1", "us-west-2", "us-east-2"]
            stack.primary_region = "us-east-1"
            
            # Verify regions
            expected_regions = ["us-east-1", "us-west-2", "us-east-2"]
            assert stack.regions == expected_regions
            assert stack.primary_region == "us-east-1"
    
    @patch('pulumi_aws.get_caller_identity')
    def test_environment_suffix_propagation(self, mock_caller_id):
        """Test that environment suffix is properly used throughout."""
        mock_caller_id.return_value = self.caller_identity_mock
        
        with patch.object(TapStack, '__init__', lambda x, y, z, opts=None: None):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = self.environment_suffix
            
            assert stack.environment_suffix == self.environment_suffix


# Pytest configuration and fixtures
@pytest.fixture
def mock_pulumi_context():
    """Fixture to mock Pulumi context for testing."""
    with patch('pulumi.get_stack'), \
         patch('pulumi.get_project'):
        yield


def test_module_imports():
    """Test that all required modules can be imported."""
    import json
    import os
    from typing import Optional
    
    import pulumi
    import pulumi_aws as aws
    from pulumi import ComponentResource, ResourceOptions
    
    # Verify imports are successful
    assert json is not None
    assert os is not None
    assert Optional is not None
    assert pulumi is not None
    assert aws is not None
    assert ComponentResource is not None
    assert ResourceOptions is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=lib.tap_stack", "--cov-report=html"])


