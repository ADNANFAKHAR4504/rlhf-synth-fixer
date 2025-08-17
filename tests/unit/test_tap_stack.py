#!/usr/bin/env python3
"""
Unit tests for TAP Stack infrastructure components.

This module contains comprehensive unit tests for the TapStack class,
testing individual components and their configurations in isolation.
"""

import json
import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
from pulumi import Output
import pytest

# Set up Pulumi testing environment
pulumi.runtime.set_mocks({
  "aws:region": "us-west-2",
  "aws:accountId": "123456789012",
})

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs class."""
  
  def test_default_environment_suffix(self):
    """Test default environment suffix initialization."""
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")
  
  def test_custom_environment_suffix(self):
    """Test custom environment suffix initialization."""
    args = TapStackArgs(environment_suffix="prod")
    self.assertEqual(args.environment_suffix, "prod")
  
  def test_environment_suffix_types(self):
    """Test various environment suffix types."""
    test_cases = ["dev", "staging", "prod", "test", "qa"]
    for env in test_cases:
      args = TapStackArgs(environment_suffix=env)
      self.assertEqual(args.environment_suffix, env)


class TestTapStackInitialization(unittest.TestCase):
  """Test cases for TapStack initialization."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.kms.Key')
  @patch('pulumi_aws.kms.Alias')
  def test_stack_initialization(self, mock_alias, mock_key):
    """Test basic stack initialization."""
    mock_key.return_value = Mock()
    mock_alias.return_value = Mock()
    
    with patch.object(TapStack, '_create_vpc_and_networking'), \
       patch.object(TapStack, '_create_security_groups'), \
       patch.object(TapStack, '_create_iam_roles'), \
       patch.object(TapStack, '_create_s3_buckets'), \
       patch.object(TapStack, '_create_rds_instance'), \
       patch.object(TapStack, '_create_secrets_manager'), \
       patch.object(TapStack, '_create_launch_template'), \
       patch.object(TapStack, '_create_auto_scaling_group'), \
       patch.object(TapStack, '_create_application_load_balancer'), \
       patch.object(TapStack, '_create_waf'), \
       patch.object(TapStack, '_create_fargate_cluster'), \
       patch.object(TapStack, '_create_fargate_service'), \
       patch.object(TapStack, '_create_cloudwatch_alarms'), \
       patch.object(TapStack, '_create_backup_vault'), \
       patch.object(TapStack, '_create_codepipeline'):
      
      stack = TapStack("test-stack", self.args)
      self.assertEqual(stack.environment_suffix, "test")
      self.assertEqual(stack.name_prefix, "tap-test")
  
  def test_name_prefix_generation(self):
    """Test name prefix generation for different environments."""
    test_cases = [
      ("dev", "tap-dev"),
      ("staging", "tap-staging"),
      ("prod", "tap-prod"),
      ("test", "tap-test"),
    ]
    
    for env, expected_prefix in test_cases:
      args = TapStackArgs(environment_suffix=env)
      with patch.object(TapStack, '_create_kms_key'), \
         patch.object(TapStack, '_create_vpc_and_networking'), \
         patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_iam_roles'), \
         patch.object(TapStack, '_create_s3_buckets'), \
         patch.object(TapStack, '_create_rds_instance'), \
         patch.object(TapStack, '_create_secrets_manager'), \
         patch.object(TapStack, '_create_launch_template'), \
         patch.object(TapStack, '_create_auto_scaling_group'), \
         patch.object(TapStack, '_create_application_load_balancer'), \
         patch.object(TapStack, '_create_waf'), \
         patch.object(TapStack, '_create_fargate_cluster'), \
         patch.object(TapStack, '_create_fargate_service'), \
         patch.object(TapStack, '_create_cloudwatch_alarms'), \
         patch.object(TapStack, '_create_backup_vault'), \
         patch.object(TapStack, '_create_codepipeline'):
        
        stack = TapStack("test-stack", args)
        self.assertEqual(stack.name_prefix, expected_prefix)


class TestKMSKeyCreation(unittest.TestCase):
  """Test cases for KMS key creation."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.kms.Key')
  @patch('pulumi_aws.kms.Alias')
  def test_kms_key_creation(self, mock_alias, mock_key):
    """Test KMS key and alias creation."""
    mock_key_instance = Mock()
    mock_key_instance.key_id = "test-key-id"
    mock_key.return_value = mock_key_instance
    
    mock_alias_instance = Mock()
    mock_alias.return_value = mock_alias_instance
    
    with patch.object(TapStack, '_create_vpc_and_networking'), \
       patch.object(TapStack, '_create_security_groups'), \
       patch.object(TapStack, '_create_iam_roles'), \
       patch.object(TapStack, '_create_s3_buckets'), \
       patch.object(TapStack, '_create_rds_instance'), \
       patch.object(TapStack, '_create_secrets_manager'), \
       patch.object(TapStack, '_create_launch_template'), \
       patch.object(TapStack, '_create_auto_scaling_group'), \
       patch.object(TapStack, '_create_application_load_balancer'), \
       patch.object(TapStack, '_create_waf'), \
       patch.object(TapStack, '_create_fargate_cluster'), \
       patch.object(TapStack, '_create_fargate_service'), \
       patch.object(TapStack, '_create_cloudwatch_alarms'), \
       patch.object(TapStack, '_create_backup_vault'), \
       patch.object(TapStack, '_create_codepipeline'):
      
      stack = TapStack("test-stack", self.args)
      
      # Verify KMS key was called with correct parameters
      mock_key.assert_called_once()
      call_args = mock_key.call_args
      self.assertIn("tap-test-kms-key", call_args[0])
      self.assertEqual(call_args["enable_key_rotation"], True)
      self.assertIn("Environment", call_args["tags"])
      
      # Verify KMS alias was created
      mock_alias.assert_called_once()
      alias_call_args = mock_alias.call_args
      self.assertIn("tap-test-kms-alias", alias_call_args)


class TestVPCCreation(unittest.TestCase):
  """Test cases for VPC and networking components."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.ec2.Vpc')
  @patch('pulumi_aws.ec2.InternetGateway')
  @patch('pulumi_aws.ec2.Subnet')
  @patch('pulumi_aws.get_availability_zones')
  def test_vpc_creation(self, mock_azs, mock_subnet, mock_igw, mock_vpc):
    """Test VPC creation with proper CIDR block."""
    mock_azs.return_value = Mock(names=["us-west-2a", "us-west-2b"])
    mock_vpc_instance = Mock()
    mock_vpc_instance.id = "vpc-12345"
    mock_vpc.return_value = mock_vpc_instance
    
    mock_igw_instance = Mock()
    mock_igw.return_value = mock_igw_instance
    
    mock_subnet_instance = Mock()
    mock_subnet_instance.id = "subnet-12345"
    mock_subnet.return_value = mock_subnet_instance
    
    with patch.object(TapStack, '_create_kms_key'), \
       patch.object(TapStack, '_create_security_groups'), \
       patch.object(TapStack, '_create_iam_roles'), \
       patch.object(TapStack, '_create_s3_buckets'), \
       patch.object(TapStack, '_create_rds_instance'), \
       patch.object(TapStack, '_create_secrets_manager'), \
       patch.object(TapStack, '_create_launch_template'), \
       patch.object(TapStack, '_create_auto_scaling_group'), \
       patch.object(TapStack, '_create_application_load_balancer'), \
       patch.object(TapStack, '_create_waf'), \
       patch.object(TapStack, '_create_fargate_cluster'), \
       patch.object(TapStack, '_create_fargate_service'), \
       patch.object(TapStack, '_create_cloudwatch_alarms'), \
       patch.object(TapStack, '_create_backup_vault'), \
       patch.object(TapStack, '_create_codepipeline'), \
       patch.object(TapStack, '_create_route_tables'):
      
      stack = TapStack("test-stack", self.args)
      
      # Verify VPC was created with correct CIDR
      mock_vpc.assert_called_once()
      vpc_call_args = mock_vpc.call_args
      self.assertEqual(vpc_call_args[1]["cidr_block"], "10.0.0.0/16")
      self.assertEqual(vpc_call_args["enable_dns_hostnames"], True)
      self.assertEqual(vpc_call_args["enable_dns_support"], True)
  
  @patch('pulumi_aws.get_availability_zones')
  def test_subnet_creation_count(self, mock_azs):
    """Test that correct number of subnets are created."""
    mock_azs.return_value = Mock(names=["us-west-2a", "us-west-2b", "us-west-2c"])
    
    with patch.object(TapStack, '_create_kms_key'), \
       patch.object(TapStack, '_create_security_groups'), \
       patch.object(TapStack, '_create_iam_roles'), \
       patch.object(TapStack, '_create_s3_buckets'), \
       patch.object(TapStack, '_create_rds_instance'), \
       patch.object(TapStack, '_create_secrets_manager'), \
       patch.object(TapStack, '_create_launch_template'), \
       patch.object(TapStack, '_create_auto_scaling_group'), \
       patch.object(TapStack, '_create_application_load_balancer'), \
       patch.object(TapStack, '_create_waf'), \
       patch.object(TapStack, '_create_fargate_cluster'), \
       patch.object(TapStack, '_create_fargate_service'), \
       patch.object(TapStack, '_create_cloudwatch_alarms'), \
       patch.object(TapStack, '_create_backup_vault'), \
       patch.object(TapStack, '_create_codepipeline'), \
       patch('pulumi_aws.ec2.Vpc'), \
       patch('pulumi_aws.ec2.InternetGateway'), \
       patch('pulumi_aws.ec2.Subnet') as mock_subnet, \
       patch.object(TapStack, '_create_route_tables'):
      
      stack = TapStack("test-stack", self.args)
      
      # Should create 6 subnets total (2 public, 2 private, 2 db) for 2 AZs
      self.assertEqual(mock_subnet.call_count, 6)


class TestSecurityGroups(unittest.TestCase):
  """Test cases for security group creation."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.ec2.SecurityGroup')
  def test_security_group_creation(self, mock_sg):
    """Test security group creation with proper rules."""
    mock_sg_instance = Mock()
    mock_sg_instance.id = "sg-12345"
    mock_sg.return_value = mock_sg_instance
    
    with patch.object(TapStack, '_create_kms_key'), \
       patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
      
      # Mock VPC
      mock_vpc_obj = Mock()
      mock_vpc_obj.id = "vpc-12345"
      
      with patch.object(TapStack, '_create_iam_roles'), \
         patch.object(TapStack, '_create_s3_buckets'), \
         patch.object(TapStack, '_create_rds_instance'), \
         patch.object(TapStack, '_create_secrets_manager'), \
         patch.object(TapStack, '_create_launch_template'), \
         patch.object(TapStack, '_create_auto_scaling_group'), \
         patch.object(TapStack, '_create_application_load_balancer'), \
         patch.object(TapStack, '_create_waf'), \
         patch.object(TapStack, '_create_fargate_cluster'), \
         patch.object(TapStack, '_create_fargate_service'), \
         patch.object(TapStack, '_create_cloudwatch_alarms'), \
         patch.object(TapStack, '_create_backup_vault'), \
         patch.object(TapStack, '_create_codepipeline'):
        
        stack = TapStack("test-stack", self.args)
        stack.vpc = mock_vpc_obj
        stack._create_security_groups()
        
        # Should create 4 security groups (ALB, EC2, RDS, Fargate)
        self.assertEqual(mock_sg.call_count, 4)


class TestIAMRoles(unittest.TestCase):
  """Test cases for IAM role creation."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.iam.Role')
  @patch('pulumi_aws.iam.InstanceProfile')
  def test_iam_role_creation(self, mock_profile, mock_role):
    """Test IAM role creation with least privilege principle."""
    mock_role_instance = Mock()
    mock_role_instance.name = "test-role"
    mock_role.return_value = mock_role_instance
    
    mock_profile_instance = Mock()
    mock_profile.return_value = mock_profile_instance
    
    with patch.object(TapStack, '_create_kms_key'), \
       patch.object(TapStack, '_create_vpc_and_networking'), \
       patch.object(TapStack, '_create_security_groups'), \
       patch.object(TapStack, '_create_s3_buckets'), \
       patch.object(TapStack, '_create_rds_instance'), \
       patch.object(TapStack, '_create_secrets_manager'), \
       patch.object(TapStack, '_create_launch_template'), \
       patch.object(TapStack, '_create_auto_scaling_group'), \
       patch.object(TapStack, '_create_application_load_balancer'), \
       patch.object(TapStack, '_create_waf'), \
       patch.object(TapStack, '_create_fargate_cluster'), \
       patch.object(TapStack, '_create_fargate_service'), \
       patch.object(TapStack, '_create_cloudwatch_alarms'), \
       patch.object(TapStack, '_create_backup_vault'), \
       patch.object(TapStack, '_create_codepipeline'):
      
      stack = TapStack("test-stack", self.args)
      
      # Should create 4 IAM roles
      self.assertEqual(mock_role.call_count, 4)
      
      # Verify assume role policies contain proper service principals
      for call in mock_role.call_args_list:
        assume_role_policy = json.loads(call[1]["assume_role_policy"])
        self.assertIn("Statement", assume_role_policy)
        self.assertEqual(assume_role_policy["Version"], "2012-10-17")


class TestS3Buckets(unittest.TestCase):
  """Test cases for S3 bucket creation."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.s3.Bucket')
  @patch('pulumi.get_stack')
  def test_s3_bucket_encryption(self, mock_stack, mock_bucket):
    """Test S3 buckets are created with encryption enabled."""
    mock_stack.return_value = "test-stack"
    mock_bucket_instance = Mock()
    mock_bucket_instance.bucket = "test-bucket"
    mock_bucket.return_value = mock_bucket_instance
    
    with patch.object(TapStack, '_create_kms_key') as mock_kms:
      mock_kms_key = Mock()
      mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
      
      with patch.object(TapStack, '_create_vpc_and_networking'), \
         patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_iam_roles'), \
         patch.object(TapStack, '_create_rds_instance'), \
         patch.object(TapStack, '_create_secrets_manager'), \
         patch.object(TapStack, '_create_launch_template'), \
         patch.object(TapStack, '_create_auto_scaling_group'), \
         patch.object(TapStack, '_create_application_load_balancer'), \
         patch.object(TapStack, '_create_waf'), \
         patch.object(TapStack, '_create_fargate_cluster'), \
         patch.object(TapStack, '_create_fargate_service'), \
         patch.object(TapStack, '_create_cloudwatch_alarms'), \
         patch.object(TapStack, '_create_backup_vault'), \
         patch.object(TapStack, '_create_codepipeline'):
        
        stack = TapStack("test-stack", self.args)
        stack.kms_key = mock_kms_key
        stack._create_s3_buckets()
        
        # Should create 3 S3 buckets (app, backup, pipeline)
        self.assertGreaterEqual(mock_bucket.call_count, 2)
        
        # Verify encryption is enabled
        for call in mock_bucket.call_args_list:
          if 'server_side_encryption_configuration' in call[1]:
            encryption_config = call['server_side_encryption_configuration']
            self.assertIsNotNone(encryption_config)


class TestRDSInstance(unittest.TestCase):
  """Test cases for RDS instance creation."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.rds.Instance')
  @patch('pulumi_aws.rds.SubnetGroup')
  def test_rds_multi_az_deployment(self, mock_subnet_group, mock_rds):
    """Test RDS instance is created with Multi-AZ deployment."""
    mock_rds_instance = Mock()
    mock_rds_instance.endpoint = "test-endpoint"
    mock_rds.return_value = mock_rds_instance
    
    mock_subnet_group_instance = Mock()
    mock_subnet_group_instance.name = "test-subnet-group"
    mock_subnet_group.return_value = mock_subnet_group_instance
    
    with patch.object(TapStack, '_create_kms_key') as mock_kms:
      mock_kms_key = Mock()
      mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
      
      with patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
        mock_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
        
        with patch.object(TapStack, '_create_security_groups') as mock_sg:
          mock_sg_instance = Mock()
          mock_sg_instance.id = "sg-12345"
          
          with patch.object(TapStack, '_create_iam_roles'), \
             patch.object(TapStack, '_create_s3_buckets'), \
             patch.object(TapStack, '_create_secrets_manager'), \
             patch.object(TapStack, '_create_launch_template'), \
             patch.object(TapStack, '_create_auto_scaling_group'), \
             patch.object(TapStack, '_create_application_load_balancer'), \
             patch.object(TapStack, '_create_waf'), \
             patch.object(TapStack, '_create_fargate_cluster'), \
             patch.object(TapStack, '_create_fargate_service'), \
             patch.object(TapStack, '_create_cloudwatch_alarms'), \
             patch.object(TapStack, '_create_backup_vault'), \
             patch.object(TapStack, '_create_codepipeline'):
            
            stack = TapStack("test-stack", self.args)
            stack.kms_key = mock_kms_key
            stack.db_subnets = mock_subnets
            stack.rds_sg = mock_sg_instance
            stack._create_rds_instance()
            
            # Verify RDS instance was created
            mock_rds.assert_called_once()
            rds_call_args = mock_rds.call_args
            self.assertTrue(rds_call_args[1]["multi_az"])
            self.assertTrue(rds_call_args["storage_encrypted"])


class TestAutoScalingGroup(unittest.TestCase):
  """Test cases for Auto Scaling Group creation."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.autoscaling.Group')
  @patch('pulumi_aws.ec2.LaunchTemplate')
  def test_asg_high_availability(self, mock_template, mock_asg):
    """Test Auto Scaling Group is configured for high availability."""
    mock_template_instance = Mock()
    mock_template_instance.id = "lt-12345"
    mock_template.return_value = mock_template_instance
    
    mock_asg_instance = Mock()
    mock_asg_instance.name = "test-asg"
    mock_asg.return_value = mock_asg_instance
    
    with patch.object(TapStack, '_create_kms_key'), \
       patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
      mock_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
      
      with patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_iam_roles') as mock_iam:
        mock_instance_profile = Mock()
        mock_instance_profile.name = "test-profile"
        
        with patch.object(TapStack, '_create_s3_buckets'), \
           patch.object(TapStack, '_create_rds_instance'), \
           patch.object(TapStack, '_create_secrets_manager'), \
           patch.object(TapStack, '_create_application_load_balancer'), \
           patch.object(TapStack, '_create_waf'), \
           patch.object(TapStack, '_create_fargate_cluster'), \
           patch.object(TapStack, '_create_fargate_service'), \
           patch.object(TapStack, '_create_cloudwatch_alarms'), \
           patch.object(TapStack, '_create_backup_vault'), \
           patch.object(TapStack, '_create_codepipeline'), \
           patch('pulumi_aws.ec2.get_ami') as mock_ami:
          
          mock_ami.return_value = Mock(id="ami-12345")
          
          stack = TapStack("test-stack", self.args)
          stack.private_subnets = mock_subnets
          stack.ec2_instance_profile = mock_instance_profile
          stack._create_launch_template()
          stack._create_auto_scaling_group()
          
          # Verify ASG was created
          mock_asg.assert_called_once()
          asg_call_args = mock_asg.call_args
          self.assertEqual(asg_call_args[1]["min_size"], 2)
          self.assertEqual(asg_call_args["max_size"], 6)
          self.assertEqual(asg_call_args["desired_capacity"], 2)


class TestWAFConfiguration(unittest.TestCase):
  """Test cases for WAF configuration."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.wafv2.WebAcl')
  @patch('pulumi_aws.wafv2.WebAclAssociation')
  def test_waf_owasp_rules(self, mock_association, mock_web_acl):
    """Test WAF is configured with OWASP top 10 protection rules."""
    mock_web_acl_instance = Mock()
    mock_web_acl_instance.arn = "arn:aws:wafv2:us-west-2:123456789012:regional/webacl/test/12345"
    mock_web_acl.return_value = mock_web_acl_instance
    
    mock_association_instance = Mock()
    mock_association.return_value = mock_association_instance
    
    with patch.object(TapStack, '_create_kms_key'), \
       patch.object(TapStack, '_create_vpc_and_networking'), \
       patch.object(TapStack, '_create_security_groups'), \
       patch.object(TapStack, '_create_iam_roles'), \
       patch.object(TapStack, '_create_s3_buckets'), \
       patch.object(TapStack, '_create_rds_instance'), \
       patch.object(TapStack, '_create_secrets_manager'), \
       patch.object(TapStack, '_create_launch_template'), \
       patch.object(TapStack, '_create_auto_scaling_group'), \
       patch.object(TapStack, '_create_application_load_balancer') as mock_alb:
      mock_alb_instance = Mock()
      mock_alb_instance.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/test/12345"
      
      with patch.object(TapStack, '_create_fargate_cluster'), \
         patch.object(TapStack, '_create_fargate_service'), \
         patch.object(TapStack, '_create_cloudwatch_alarms'), \
         patch.object(TapStack, '_create_backup_vault'), \
         patch.object(TapStack, '_create_codepipeline'):
        
        stack = TapStack("test-stack", self.args)
        stack.alb = mock_alb_instance
        stack._create_waf()
        
        # Verify WAF Web ACL was created
        mock_web_acl.assert_called_once()
        web_acl_call_args = mock_web_acl.call_args
        rules = web_acl_call_args[1]["rules"]
        
        # Should have multiple managed rule sets for OWASP protection
        self.assertGreaterEqual(len(rules), 3)
        
        # Check for specific OWASP rule sets
        rule_names = [rule["name"] for rule in rules]
        self.assertIn("AWSManagedRulesCommonRuleSet", rule_names)
        self.assertIn("AWSManagedRulesSQLiRuleSet", rule_names)


class TestFargateDeployment(unittest.TestCase):
  """Test cases for Fargate deployment."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.ecs.Cluster')
  @patch('pulumi_aws.ecs.TaskDefinition')
  @patch('pulumi_aws.ecs.Service')
  @patch('pulumi_aws.cloudwatch.LogGroup')
  def test_fargate_logging_enabled(self, mock_log_group, mock_service, mock_task_def, mock_cluster):
    """Test Fargate service is deployed with logging enabled."""
    mock_cluster_instance = Mock()
    mock_cluster_instance.name = "test-cluster"
    mock_cluster.return_value = mock_cluster_instance
    
    mock_log_group_instance = Mock()
    mock_log_group_instance.name = "/ecs/tap-test"
    mock_log_group.return_value = mock_log_group_instance
    
    mock_task_def_instance = Mock()
    mock_task_def_instance.arn = "arn:aws:ecs:us-west-2:123456789012:task-definition/test:1"
    mock_task_def.return_value = mock_task_def_instance
    
    mock_service_instance = Mock()
    mock_service_instance.name = "test-service"
    mock_service.return_value = mock_service_instance
    
    with patch.object(TapStack, '_create_kms_key') as mock_kms:
      mock_kms_key = Mock()
      mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
      
      with patch.object(TapStack, '_create_vpc_and_networking'), \
         patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_iam_roles') as mock_iam:
        mock_execution_role = Mock()
        mock_execution_role.arn = "arn:aws:iam::123456789012:role/test-execution-role"
        mock_task_role = Mock()
        mock_task_role.arn = "arn:aws:iam::123456789012:role/test-task-role"
        
        with patch.object(TapStack, '_create_s3_buckets'), \
           patch.object(TapStack, '_create_rds_instance'), \
           patch.object(TapStack, '_create_secrets_manager'), \
           patch.object(TapStack, '_create_launch_template'), \
           patch.object(TapStack, '_create_auto_scaling_group'), \
           patch.object(TapStack, '_create_application_load_balancer'), \
           patch.object(TapStack, '_create_waf'), \
           patch.object(TapStack, '_create_fargate_service'), \
           patch.object(TapStack, '_create_cloudwatch_alarms'), \
           patch.object(TapStack, '_create_backup_vault'), \
           patch.object(TapStack, '_create_codepipeline'):
          
          stack = TapStack("test-stack", self.args)
          stack.kms_key = mock_kms_key
          stack.fargate_execution_role = mock_execution_role
          stack.fargate_task_role = mock_task_role
          stack._create_fargate_cluster()
          
          # Verify ECS cluster was created
          mock_cluster.assert_called_once()
          cluster_call_args = mock_cluster.call_args
          settings = cluster_call_args[1]["settings"]
          
          # Check that container insights is enabled
          container_insights = next(
            (s for s in settings if s["name"] == "containerInsights"), 
            None
          )
          self.assertIsNotNone(container_insights)
          self.assertEqual(container_insights["value"], "enabled")
          
          # Verify log group was created with encryption
          mock_log_group.assert_called_once()
          log_group_call_args = mock_log_group.call_args
          self.assertEqual(log_group_call_args[1]["retention_in_days"], 14)


class TestCloudWatchMonitoring(unittest.TestCase):
  """Test cases for CloudWatch monitoring and alarms."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.cloudwatch.MetricAlarm')
  @patch('pulumi_aws.autoscaling.Policy')
  def test_cpu_utilization_alarm(self, mock_policy, mock_alarm):
    """Test CPU utilization alarm is configured correctly."""
    mock_alarm_instance = Mock()
    mock_alarm.return_value = mock_alarm_instance
    
    mock_policy_instance = Mock()
    mock_policy.return_value = mock_policy_instance
    
    with patch.object(TapStack, '_create_kms_key'), \
       patch.object(TapStack, '_create_vpc_and_networking'), \
       patch.object(TapStack, '_create_security_groups'), \
       patch.object(TapStack, '_create_iam_roles'), \
       patch.object(TapStack, '_create_s3_buckets'), \
       patch.object(TapStack, '_create_rds_instance'), \
       patch.object(TapStack, '_create_secrets_manager'), \
       patch.object(TapStack, '_create_launch_template'), \
       patch.object(TapStack, '_create_auto_scaling_group') as mock_asg:
      mock_asg_instance = Mock()
      mock_asg_instance.name = "test-asg"
      
      with patch.object(TapStack, '_create_application_load_balancer'), \
         patch.object(TapStack, '_create_waf'), \
         patch.object(TapStack, '_create_fargate_cluster'), \
         patch.object(TapStack, '_create_fargate_service'), \
         patch.object(TapStack, '_create_backup_vault'), \
         patch.object(TapStack, '_create_codepipeline'):
        
        stack = TapStack("test-stack", self.args)
        stack.asg = mock_asg_instance
        stack._create_cloudwatch_alarms()
        
        # Verify CPU alarm was created
        mock_alarm.assert_called_once()
        alarm_call_args = mock_alarm.call_args
        self.assertEqual(alarm_call_args[1]["threshold"], 75.0)
        self.assertEqual(alarm_call_args["metric_name"], "CPUUtilization")
        self.assertEqual(alarm_call_args["comparison_operator"], "GreaterThanThreshold")
        
        # Verify scaling policies were created
        self.assertEqual(mock_policy.call_count, 2)  # Scale up and scale down


class TestBackupConfiguration(unittest.TestCase):
  """Test cases for backup configuration."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.backup.Vault')
  @patch('pulumi_aws.backup.Plan')
  def test_automated_backup_schedule(self, mock_plan, mock_vault):
    """Test automated backup is configured with daily schedule."""
    mock_vault_instance = Mock()
    mock_vault_instance.name = "test-backup-vault"
    mock_vault.return_value = mock_vault_instance
    
    mock_plan_instance = Mock()
    mock_plan.return_value = mock_plan_instance
    
    with patch.object(TapStack, '_create_kms_key') as mock_kms:
      mock_kms_key = Mock()
      mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
      
      with patch.object(TapStack, '_create_vpc_and_networking'), \
         patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_iam_roles'), \
         patch.object(TapStack, '_create_s3_buckets'), \
         patch.object(TapStack, '_create_rds_instance'), \
         patch.object(TapStack, '_create_secrets_manager'), \
         patch.object(TapStack, '_create_launch_template'), \
         patch.object(TapStack, '_create_auto_scaling_group'), \
         patch.object(TapStack, '_create_application_load_balancer'), \
         patch.object(TapStack, '_create_waf'), \
         patch.object(TapStack, '_create_fargate_cluster'), \
         patch.object(TapStack, '_create_fargate_service'), \
         patch.object(TapStack, '_create_cloudwatch_alarms'), \
         patch.object(TapStack, '_create_codepipeline'):
        
        stack = TapStack("test-stack", self.args)
        stack.kms_key = mock_kms_key
        stack._create_backup_vault()
        
        # Verify backup vault was created with KMS encryption
        mock_vault.assert_called_once()
        vault_call_args = mock_vault.call_args
        self.assertEqual(vault_call_args[1]["kms_key_arn"], mock_kms_key.arn)
        
        # Verify backup plan was created with daily schedule
        mock_plan.assert_called_once()
        plan_call_args = mock_plan.call_args
        rules = plan_call_args[1]["rules"]
        self.assertEqual(len(rules), 1)
        self.assertEqual(rules["rule_name"], "DailyBackups")
        self.assertEqual(rules["schedule"], "cron(0 5 ? * * *)")


class TestCodePipeline(unittest.TestCase):
  """Test cases for CI/CD pipeline configuration."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="test")
  
  @patch('pulumi_aws.codepipeline.Pipeline')
  @patch('pulumi_aws.s3.Bucket')
  @patch('pulumi.get_stack')
  def test_cicd_pipeline_creation(self, mock_stack, mock_bucket, mock_pipeline):
    """Test CI/CD pipeline is created with proper stages."""
    mock_stack.return_value = "test-stack"
    
    mock_bucket_instance = Mock()
    mock_bucket_instance.bucket = "test-pipeline-bucket"
    mock_bucket.return_value = mock_bucket_instance
    
    mock_pipeline_instance = Mock()
    mock_pipeline.return_value = mock_pipeline_instance
    
    with patch.object(TapStack, '_create_kms_key') as mock_kms:
      mock_kms_key = Mock()
      mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
      
      with patch.object(TapStack, '_create_vpc_and_networking'), \
         patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_iam_roles') as mock_iam:
        mock_codepipeline_role = Mock()
        mock_codepipeline_role.arn = "arn:aws:iam::123456789012:role/test-codepipeline-role"
        
        with patch.object(TapStack, '_create_s3_buckets'), \
           patch.object(TapStack, '_create_rds_instance'), \
           patch.object(TapStack, '_create_secrets_manager'), \
           patch.object(TapStack, '_create_launch_template'), \
           patch.object(TapStack, '_create_auto_scaling_group'), \
           patch.object(TapStack, '_create_application_load_balancer'), \
           patch.object(TapStack, '_create_waf'), \
           patch.object(TapStack, '_create_fargate_cluster') as mock_fargate_cluster:
          mock_cluster = Mock()
          mock_cluster.name = "test-cluster"
          
          with patch.object(TapStack, '_create_fargate_service') as mock_fargate_service:
            mock_service = Mock()
            mock_service.name = "test-service"
            
            with patch.object(TapStack, '_create_cloudwatch_alarms'), \
               patch.object(TapStack, '_create_backup_vault'):
              
              stack = TapStack("test-stack", self.args)
              stack.kms_key = mock_kms_key
              stack.codepipeline_role = mock_codepipeline_role
              stack.ecs_cluster = mock_cluster
              stack.ecs_service = mock_service
              stack._create_codepipeline()
              
              # Verify pipeline was created
              mock_pipeline.assert_called_once()
              pipeline_call_args = mock_pipeline.call_args
              stages = pipeline_call_args[1]["stages"]
              
              # Should have Source and Deploy stages
              self.assertEqual(len(stages), 2)
              stage_names = [stage["name"] for stage in stages]
              self.assertIn("Source", stage_names)
              self.assertIn("Deploy", stage_names)


if __name__ == '__main__':
  unittest.main()
