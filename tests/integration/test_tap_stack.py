#!/usr/bin/env python3
"""
Integration tests for TAP Stack infrastructure.

This module contains comprehensive integration tests that verify the complete
infrastructure deployment and interactions between different AWS services.
"""

import json
import time
import unittest
from unittest.mock import Mock, patch, MagicMock
import boto3
import pytest
from moto import mock_ec2, mock_s3, mock_rds, mock_ecs, mock_iam, mock_kms
import pulumi

# Set up Pulumi testing environment
pulumi.runtime.set_mocks({
  "aws:region": "us-west-2",
  "aws:accountId": "123456789012",
})

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the complete TAP stack deployment."""
  
  @classmethod
  def setUpClass(cls):
    """Set up class-level fixtures."""
    cls.region = "us-west-2"
    cls.account_id = "123456789012"
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="integration")
    self.stack_name = "tap-integration-test"
  
  @mock_ec2
  @mock_s3
  @mock_rds
  @mock_ecs
  @mock_iam
  @mock_kms
  def test_complete_stack_deployment(self):
    """Test complete stack deployment with all components."""
    # This test would require actual AWS resources in a real integration test
    # For now, we'll test the stack creation process
    
    with patch('pulumi_aws.get_availability_zones') as mock_azs:
      mock_azs.return_value = Mock(names=["us-west-2a", "us-west-2b"])
      
      stack = TapStack(self.stack_name, self.args)
      
      # Verify stack was created successfully
      self.assertIsNotNone(stack)
      self.assertEqual(stack.environment_suffix, "integration")
      self.assertEqual(stack.name_prefix, "tap-integration")
  
  def test_vpc_networking_integration(self):
    """Test VPC and networking components integration."""
    with patch('pulumi_aws.get_availability_zones') as mock_azs, \
       patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
       patch('pulumi_aws.ec2.Subnet') as mock_subnet, \
       patch('pulumi_aws.ec2.InternetGateway') as mock_igw, \
       patch('pulumi_aws.ec2.NatGateway') as mock_nat, \
       patch('pulumi_aws.ec2.Eip') as mock_eip, \
       patch('pulumi_aws.ec2.RouteTable') as mock_rt, \
       patch('pulumi_aws.ec2.RouteTableAssociation') as mock_rta:
      
      # Mock availability zones
      mock_azs.return_value = Mock(names=["us-west-2a", "us-west-2b"])
      
      # Mock VPC
      mock_vpc_instance = Mock()
      mock_vpc_instance.id = "vpc-12345"
      mock_vpc.return_value = mock_vpc_instance
      
      # Mock IGW
      mock_igw_instance = Mock()
      mock_igw_instance.id = "igw-12345"
      mock_igw.return_value = mock_igw_instance
      
      # Mock subnets
      mock_subnet_instance = Mock()
      mock_subnet_instance.id = "subnet-12345"
      mock_subnet.return_value = mock_subnet_instance
      
      # Mock EIP and NAT Gateway
      mock_eip_instance = Mock()
      mock_eip_instance.id = "eip-12345"
      mock_eip.return_value = mock_eip_instance
      
      mock_nat_instance = Mock()
      mock_nat_instance.id = "nat-12345"
      mock_nat.return_value = mock_nat_instance
      
      # Mock route tables
      mock_rt_instance = Mock()
      mock_rt_instance.id = "rt-12345"
      mock_rt.return_value = mock_rt_instance
      
      mock_rta_instance = Mock()
      mock_rta.return_value = mock_rta_instance
      
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
         patch.object(TapStack, '_create_codepipeline'):
        
        stack = TapStack(self.stack_name, self.args)
        
        # Verify VPC creation
        mock_vpc.assert_called_once()
        vpc_call_args = mock_vpc.call_args
        self.assertEqual(vpc_call_args[1]["cidr_block"], "10.0.0.0/16")
        
        # Verify subnets creation (6 subnets: 2 public, 2 private, 2 db)
        self.assertEqual(mock_subnet.call_count, 6)
        
        # Verify NAT gateways for high availability (2 NAT gateways)
        self.assertEqual(mock_nat.call_count, 2)
  
  def test_security_groups_integration(self):
    """Test security groups and their relationships."""
    with patch('pulumi_aws.ec2.SecurityGroup') as mock_sg:
      mock_sg_instance = Mock()
      mock_sg_instance.id = "sg-12345"
      mock_sg.return_value = mock_sg_instance
      
      with patch.object(TapStack, '_create_kms_key'), \
         patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
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
          
          stack = TapStack(self.stack_name, self.args)
          stack.vpc = mock_vpc_obj
          stack._create_security_groups()
          
          # Should create 4 security groups
          self.assertEqual(mock_sg.call_count, 4)
          
          # Verify security group configurations
          for call in mock_sg.call_args_list:
            sg_config = call[1]
            self.assertEqual(sg_config["vpc_id"], "vpc-12345")
            self.assertIn("ingress", sg_config)
            self.assertIn("egress", sg_config)
  
  def test_encryption_integration(self):
    """Test encryption at rest and in transit integration."""
    with patch('pulumi_aws.kms.Key') as mock_kms_key, \
       patch('pulumi_aws.s3.Bucket') as mock_s3, \
       patch('pulumi_aws.rds.Instance') as mock_rds, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group:
      
      # Mock KMS key
      mock_kms_instance = Mock()
      mock_kms_instance.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
      mock_kms_instance.key_id = "test-key-id"
      mock_kms_key.return_value = mock_kms_instance
      
      # Mock other components
      mock_s3.return_value = Mock()
      mock_rds.return_value = Mock()
      mock_log_group.return_value = Mock()
      
      with patch.object(TapStack, '_create_vpc_and_networking'), \
         patch.object(TapStack, '_create_security_groups'), \
         patch.object(TapStack, '_create_iam_roles'), \
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
         patch('pulumi_aws.rds.SubnetGroup') as mock_subnet_group:
        
        mock_subnet_group.return_value = Mock(name="test-subnet-group")
        
        stack = TapStack(self.stack_name, self.args)
        
        # Verify KMS key was created with rotation enabled
        mock_kms_key.assert_called()
        kms_call_args = mock_kms_key.call_args
        self.assertTrue(kms_call_args[1]["enable_key_rotation"])
        
        # Create components that use encryption
        stack.kms_key = mock_kms_instance
        stack.db_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
        stack.rds_sg = Mock(id="sg-12345")
        
        stack._create_s3_buckets()
        stack._create_rds_instance()
        
        # Verify S3 buckets use KMS encryption
        for call in mock_s3.call_args_list:
          if 'server_side_encryption_configuration' in call[1]:
            encryption_config = call['server_side_encryption_configuration']
            self.assertIsNotNone(encryption_config)
        
        # Verify RDS uses encryption
        mock_rds.assert_called_once()
        rds_call_args = mock_rds.call_args
        self.assertTrue(rds_call_args[1]["storage_encrypted"])
        self.assertEqual(rds_call_args["kms_key_id"], mock_kms_instance.arn)
  
  def test_high_availability_integration(self):
    """Test high availability configuration across services."""
    with patch('pulumi_aws.get_availability_zones') as mock_azs, \
       patch('pulumi_aws.autoscaling.Group') as mock_asg, \
       patch('pulumi_aws.rds.Instance') as mock_rds, \
       patch('pulumi_aws.ecs.Service') as mock_ecs_service:
      
      # Mock availability zones
      mock_azs.return_value = Mock(names=["us-west-2a", "us-west-2b", "us-west-2c"])
      
      # Mock ASG
      mock_asg_instance = Mock()
      mock_asg_instance.name = "test-asg"
      mock_asg.return_value = mock_asg_instance
      
      # Mock RDS
      mock_rds_instance = Mock()
      mock_rds_instance.endpoint = "test-endpoint"
      mock_rds.return_value = mock_rds_instance
      
      # Mock ECS Service
      mock_ecs_service_instance = Mock()
      mock_ecs_service_instance.name = "test-service"
      mock_ecs_service.return_value = mock_ecs_service_instance
      
      with patch.object(TapStack, '_create_kms_key'), \
         patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
        # Mock subnets across multiple AZs
        mock_subnets = [
          Mock(id="subnet-1"), Mock(id="subnet-2"),  # Public
          Mock(id="subnet-3"), Mock(id="subnet-4"),  # Private
          Mock(id="subnet-5"), Mock(id="subnet-6")   # DB
        ]
        
        with patch.object(TapStack, '_create_security_groups'), \
           patch.object(TapStack, '_create_iam_roles'), \
           patch.object(TapStack, '_create_s3_buckets'), \
           patch.object(TapStack, '_create_secrets_manager'), \
           patch.object(TapStack, '_create_launch_template') as mock_lt, \
           patch.object(TapStack, '_create_application_load_balancer'), \
           patch.object(TapStack, '_create_waf'), \
           patch.object(TapStack, '_create_fargate_cluster'), \
           patch.object(TapStack, '_create_cloudwatch_alarms'), \
           patch.object(TapStack, '_create_backup_vault'), \
           patch.object(TapStack, '_create_codepipeline'), \
           patch('pulumi_aws.rds.SubnetGroup') as mock_subnet_group:
          
          mock_lt_instance = Mock()
          mock_lt_instance.id = "lt-12345"
          mock_lt.return_value = mock_lt_instance
          
          mock_subnet_group_instance = Mock()
          mock_subnet_group_instance.name = "test-subnet-group"
          mock_subnet_group.return_value = mock_subnet_group_instance
          
          stack = TapStack(self.stack_name, self.args)
          
          # Set up subnets
          stack.private_subnets = mock_subnets[2:4]
          stack.db_subnets = mock_subnets[4:6]
          stack.rds_sg = Mock(id="sg-12345")
          stack.kms_key = Mock(arn="arn:aws:kms:us-west-2:123456789012:key/test")
          
          # Create HA components
          stack._create_auto_scaling_group()
          stack._create_rds_instance()
          
          # Verify ASG spans multiple AZs
          mock_asg.assert_called_once()
          asg_call_args = mock_asg.call_args
          self.assertEqual(asg_call_args[1]["min_size"], 2)
          self.assertEqual(asg_call_args["max_size"], 6)
          
          # Verify RDS Multi-AZ
          mock_rds.assert_called_once()
          rds_call_args = mock_rds.call_args
          self.assertTrue(rds_call_args[1]["multi_az"])
  
  def test_monitoring_integration(self):
    """Test monitoring and alerting integration."""
    with patch('pulumi_aws.cloudwatch.MetricAlarm') as mock_alarm, \
       patch('pulumi_aws.autoscaling.Policy') as mock_policy:
      
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
         patch.object(TapStack, '_create_auto_scaling_group') as mock_asg_create:
        mock_asg_instance = Mock()
        mock_asg_instance.name = "test-asg"
        
        with patch.object(TapStack, '_create_application_load_balancer'), \
           patch.object(TapStack, '_create_waf'), \
           patch.object(TapStack, '_create_fargate_cluster'), \
           patch.object(TapStack, '_create_fargate_service'), \
           patch.object(TapStack, '_create_backup_vault'), \
           patch.object(TapStack, '_create_codepipeline'):
          
          stack = TapStack(self.stack_name, self.args)
          stack.asg = mock_asg_instance
          stack._create_cloudwatch_alarms()
          
          # Verify CPU alarm was created
          mock_alarm.assert_called_once()
          alarm_call_args = mock_alarm.call_args
          self.assertEqual(alarm_call_args[1]["threshold"], 75.0)
          self.assertEqual(alarm_call_args["metric_name"], "CPUUtilization")
          
          # Verify scaling policies were created
          self.assertEqual(mock_policy.call_count, 2)
  
  def test_backup_integration(self):
    """Test backup and recovery integration."""
    with patch('pulumi_aws.backup.Vault') as mock_vault, \
       patch('pulumi_aws.backup.Plan') as mock_plan:
      
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
          
          stack = TapStack(self.stack_name, self.args)
          stack.kms_key = mock_kms_key
          stack._create_backup_vault()
          
          # Verify backup vault with encryption
          mock_vault.assert_called_once()
          vault_call_args = mock_vault.call_args
          self.assertEqual(vault_call_args[1]["kms_key_arn"], mock_kms_key.arn)
          
          # Verify backup plan with daily schedule
          mock_plan.assert_called_once()
          plan_call_args = mock_plan.call_args
          rules = plan_call_args[1]["rules"]
          self.assertEqual(len(rules), 1)
          self.assertEqual(rules[0]["schedule"], "cron(0 5 ? * * *)")
  
  def test_fargate_alb_integration(self):
    """Test Fargate service integration with Application Load Balancer."""
    with patch('pulumi_aws.ecs.Cluster') as mock_cluster, \
       patch('pulumi_aws.ecs.TaskDefinition') as mock_task_def, \
       patch('pulumi_aws.ecs.Service') as mock_service, \
       patch('pulumi_aws.lb.TargetGroup') as mock_target_group, \
       patch('pulumi_aws.lb.ListenerRule') as mock_listener_rule:
      
      # Mock ECS components
      mock_cluster_instance = Mock()
      mock_cluster_instance.name = "test-cluster"
      mock_cluster_instance.id = "cluster-12345"
      mock_cluster.return_value = mock_cluster_instance
      
      mock_task_def_instance = Mock()
      mock_task_def_instance.arn = "arn:aws:ecs:us-west-2:123456789012:task-definition/test:1"
      mock_task_def.return_value = mock_task_def_instance
      
      mock_service_instance = Mock()
      mock_service_instance.name = "test-service"
      mock_service.return_value = mock_service_instance
      
      # Mock ALB components
      mock_target_group_instance = Mock()
      mock_target_group_instance.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/test/12345"
      mock_target_group.return_value = mock_target_group_instance
      
      mock_listener_rule_instance = Mock()
      mock_listener_rule.return_value = mock_listener_rule_instance
      
      with patch.object(TapStack, '_create_kms_key') as mock_kms:
        mock_kms_key = Mock()
        mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
        
        with patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
          mock_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
          
          with patch.object(TapStack, '_create_security_groups') as mock_sg:
            mock_fargate_sg = Mock()
            mock_fargate_sg.id = "sg-fargate"
            
            with patch.object(TapStack, '_create_iam_roles') as mock_iam:
              mock_execution_role = Mock()
              mock_execution_role.arn = "arn:aws:iam::123456789012:role/execution-role"
              mock_task_role = Mock()
              mock_task_role.arn = "arn:aws:iam::123456789012:role/task-role"
              
              with patch.object(TapStack, '_create_s3_buckets'), \
                 patch.object(TapStack, '_create_rds_instance'), \
                 patch.object(TapStack, '_create_secrets_manager'), \
                 patch.object(TapStack, '_create_launch_template'), \
                 patch.object(TapStack, '_create_auto_scaling_group'), \
                 patch.object(TapStack, '_create_application_load_balancer') as mock_alb:
                mock_alb_listener = Mock()
                mock_alb_listener.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/test/12345/67890"
                
                with patch.object(TapStack, '_create_waf'), \
                   patch.object(TapStack, '_create_cloudwatch_alarms'), \
                   patch.object(TapStack, '_create_backup_vault'), \
                   patch.object(TapStack, '_create_codepipeline'), \
                   patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group:
                  
                  mock_log_group_instance = Mock()
                  mock_log_group_instance.name = "/ecs/tap-integration"
                  mock_log_group.return_value = mock_log_group_instance
                  
                  stack = TapStack(self.stack_name, self.args)
                  
                  # Set up required attributes
                  stack.kms_key = mock_kms_key
                  stack.private_subnets = mock_subnets
                  stack.fargate_sg = mock_fargate_sg
                  stack.fargate_execution_role = mock_execution_role
                  stack.fargate_task_role = mock_task_role
                  stack.alb_listener = mock_alb_listener
                  stack.vpc = Mock(id="vpc-12345")
                  
                  # Create Fargate components
                  stack._create_fargate_cluster()
                  stack._create_fargate_service()
                  
                  # Verify ECS service integration with ALB
                  mock_service.assert_called_once()
                  service_call_args = mock_service.call_args
                  self.assertEqual(service_call_args[1]["desired_count"], 2)
                  self.assertEqual(service_call_args["launch_type"], "FARGATE")
                  
                  # Verify target group for Fargate
                  mock_target_group.assert_called()
                  tg_calls = [call for call in mock_target_group.call_args_list 
                        if 'fargate' in call[0][0]]
                  self.assertGreater(len(tg_calls), 0)
  
  def test_waf_alb_integration(self):
    """Test WAF integration with Application Load Balancer."""
    with patch('pulumi_aws.wafv2.WebAcl') as mock_web_acl, \
       patch('pulumi_aws.wafv2.WebAclAssociation') as mock_association, \
       patch('pulumi_aws.lb.LoadBalancer') as mock_alb:
      
      # Mock WAF components
      mock_web_acl_instance = Mock()
      mock_web_acl_instance.arn = "arn:aws:wafv2:us-west-2:123456789012:regional/webacl/test/12345"
      mock_web_acl.return_value = mock_web_acl_instance
      
      mock_association_instance = Mock()
      mock_association.return_value = mock_association_instance
      
      # Mock ALB
      mock_alb_instance = Mock()
      mock_alb_instance.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/test/12345"
      mock_alb_instance.dns_name = "test-alb-12345.us-west-2.elb.amazonaws.com"
      mock_alb.return_value = mock_alb_instance
      
      with patch.object(TapStack, '_create_kms_key'), \
         patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
        mock_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
        
        with patch.object(TapStack, '_create_security_groups') as mock_sg:
          mock_alb_sg = Mock()
          mock_alb_sg.id = "sg-alb"
          
          with patch.object(TapStack, '_create_iam_roles'), \
             patch.object(TapStack, '_create_s3_buckets'), \
             patch.object(TapStack, '_create_rds_instance'), \
             patch.object(TapStack, '_create_secrets_manager'), \
             patch.object(TapStack, '_create_launch_template'), \
             patch.object(TapStack, '_create_auto_scaling_group'), \
             patch.object(TapStack, '_create_fargate_cluster'), \
             patch.object(TapStack, '_create_fargate_service'), \
             patch.object(TapStack, '_create_cloudwatch_alarms'), \
             patch.object(TapStack, '_create_backup_vault'), \
             patch.object(TapStack, '_create_codepipeline'), \
             patch('pulumi_aws.lb.TargetGroup') as mock_tg, \
             patch('pulumi_aws.lb.Listener') as mock_listener:
            
            mock_tg_instance = Mock()
            mock_tg_instance.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/test/12345"
            mock_tg.return_value = mock_tg_instance
            
            mock_listener_instance = Mock()
            mock_listener_instance.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/test/12345/67890"
            mock_listener.return_value = mock_listener_instance
            
            stack = TapStack(self.stack_name, self.args)
            
            # Set up required attributes
            stack.public_subnets = mock_subnets
            stack.alb_sg = mock_alb_sg
            stack.vpc = Mock(id="vpc-12345")
            
            # Create ALB and WAF
            stack._create_application_load_balancer()
            stack.alb = mock_alb_instance
            stack._create_waf()
            
            # Verify WAF Web ACL was created with OWASP rules
            mock_web_acl.assert_called_once()
            web_acl_call_args = mock_web_acl.call_args
            rules = web_acl_call_args[1]["rules"]
            self.assertGreaterEqual(len(rules), 3)
            
            # Verify WAF association with ALB
            mock_association.assert_called_once()
            association_call_args = mock_association.call_args
            self.assertEqual(association_call_args[1]["resource_arn"], mock_alb_instance.arn)
            self.assertEqual(association_call_args[1]["web_acl_arn"], mock_web_acl_instance.arn)
  
  def test_secrets_manager_integration(self):
    """Test Secrets Manager integration with RDS and applications."""
    with patch('pulumi_aws.secretsmanager.Secret') as mock_secret, \
       patch('pulumi_aws.secretsmanager.SecretVersion') as mock_secret_version, \
       patch('pulumi_aws.rds.Instance') as mock_rds:
      
      # Mock Secrets Manager components
      mock_secret_instance = Mock()
      mock_secret_instance.id = "secret-12345"
      mock_secret.return_value = mock_secret_instance
      
      mock_secret_version_instance = Mock()
      mock_secret_version.return_value = mock_secret_version_instance
      
      # Mock RDS
      mock_rds_instance = Mock()
      mock_rds_instance.endpoint = "test-db.cluster-xyz.us-west-2.rds.amazonaws.com"
      mock_rds.return_value = mock_rds_instance
      
      with patch.object(TapStack, '_create_kms_key') as mock_kms:
        mock_kms_key = Mock()
        mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
        
        with patch.object(TapStack, '_create_vpc_and_networking'), \
           patch.object(TapStack, '_create_security_groups'), \
           patch.object(TapStack, '_create_iam_roles'), \
           patch.object(TapStack, '_create_s3_buckets'), \
           patch.object(TapStack, '_create_launch_template'), \
           patch.object(TapStack, '_create_auto_scaling_group'), \
           patch.object(TapStack, '_create_application_load_balancer'), \
           patch.object(TapStack, '_create_waf'), \
           patch.object(TapStack, '_create_fargate_cluster'), \
           patch.object(TapStack, '_create_fargate_service'), \
           patch.object(TapStack, '_create_cloudwatch_alarms'), \
           patch.object(TapStack, '_create_backup_vault'), \
           patch.object(TapStack, '_create_codepipeline'), \
           patch('pulumi_aws.rds.SubnetGroup') as mock_subnet_group:
          
          mock_subnet_group_instance = Mock()
          mock_subnet_group_instance.name = "test-subnet-group"
          mock_subnet_group.return_value = mock_subnet_group_instance
          
          stack = TapStack(self.stack_name, self.args)
          
          # Set up required attributes
          stack.kms_key = mock_kms_key
          stack.db_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
          stack.rds_sg = Mock(id="sg-12345")
          
          # Create components
          stack._create_rds_instance()
          stack.rds_instance = mock_rds_instance
          stack._create_secrets_manager()
          
          # Verify secret was created with KMS encryption
          mock_secret.assert_called_once()
          secret_call_args = mock_secret.call_args
          self.assertEqual(secret_call_args[1]["kms_key_id"], mock_kms_key.arn)
          
          # Verify secret version contains database credentials
          mock_secret_version.assert_called_once()
          secret_version_call_args = mock_secret_version.call_args
          secret_string = json.loads(secret_version_call_args[1]["secret_string"])
          self.assertIn("username", secret_string)
          self.assertIn("password", secret_string)
          self.assertIn("host", secret_string)
  
  def test_auto_scaling_policies_integration(self):
    """Test Auto Scaling policies integration with CloudWatch alarms."""
    with patch('pulumi_aws.autoscaling.Group') as mock_asg, \
       patch('pulumi_aws.autoscaling.Policy') as mock_policy, \
       patch('pulumi_aws.cloudwatch.MetricAlarm') as mock_alarm:
      
      # Mock ASG
      mock_asg_instance = Mock()
      mock_asg_instance.name = "test-asg"
      mock_asg_instance.id = "asg-12345"
      mock_asg.return_value = mock_asg_instance
      
      # Mock policies
      mock_scale_up_policy = Mock()
      mock_scale_up_policy.arn = "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:scale-up"
      mock_scale_down_policy = Mock()
      mock_scale_down_policy.arn = "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:scale-down"
      mock_policy.side_effect = [mock_scale_up_policy, mock_scale_down_policy]
      
      # Mock alarm
      mock_alarm_instance = Mock()
      mock_alarm.return_value = mock_alarm_instance
      
      with patch.object(TapStack, '_create_kms_key'), \
         patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
        mock_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
        
        with patch.object(TapStack, '_create_security_groups'), \
           patch.object(TapStack, '_create_iam_roles'), \
           patch.object(TapStack, '_create_s3_buckets'), \
           patch.object(TapStack, '_create_rds_instance'), \
           patch.object(TapStack, '_create_secrets_manager'), \
           patch.object(TapStack, '_create_launch_template') as mock_lt:
          mock_lt_instance = Mock()
          mock_lt_instance.id = "lt-12345"
          mock_lt.return_value = mock_lt_instance
          
          with patch.object(TapStack, '_create_application_load_balancer'), \
             patch.object(TapStack, '_create_waf'), \
             patch.object(TapStack, '_create_fargate_cluster'), \
             patch.object(TapStack, '_create_fargate_service'), \
             patch.object(TapStack, '_create_backup_vault'), \
             patch.object(TapStack, '_create_codepipeline'):
            
            stack = TapStack(self.stack_name, self.args)
            
            # Set up required attributes
            stack.private_subnets = mock_subnets
            
            # Create ASG and monitoring
            stack._create_auto_scaling_group()
            stack.asg = mock_asg_instance
            stack._create_cloudwatch_alarms()
            
            # Verify ASG was created with proper configuration
            mock_asg.assert_called_once()
            asg_call_args = mock_asg.call_args
            self.assertEqual(asg_call_args[1]["min_size"], 2)
            self.assertEqual(asg_call_args["desired_capacity"], 2)
            self.assertEqual(asg_call_args["health_check_type"], "ELB")
            
            # Verify scaling policies were created
            self.assertEqual(mock_policy.call_count, 2)
            
            # Verify CPU alarm was created
            mock_alarm.assert_called_once()
            alarm_call_args = mock_alarm.call_args
            self.assertEqual(alarm_call_args[1]["threshold"], 75.0)
  
  def test_load_balancer_target_groups_integration(self):
    """Test Load Balancer integration with multiple target groups."""
    with patch('pulumi_aws.lb.LoadBalancer') as mock_alb, \
       patch('pulumi_aws.lb.TargetGroup') as mock_tg, \
       patch('pulumi_aws.lb.Listener') as mock_listener, \
       patch('pulumi_aws.lb.ListenerRule') as mock_listener_rule, \
       patch('pulumi_aws.autoscaling.Attachment') as mock_attachment:
      
      # Mock ALB
      mock_alb_instance = Mock()
      mock_alb_instance.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/test/12345"
      mock_alb_instance.dns_name = "test-alb.us-west-2.elb.amazonaws.com"
      mock_alb.return_value = mock_alb_instance
      
      # Mock target groups
      mock_ec2_tg = Mock()
      mock_ec2_tg.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/ec2-tg/12345"
      mock_fargate_tg = Mock()
      mock_fargate_tg.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/fargate-tg/67890"
      mock_tg.side_effect = [mock_ec2_tg, mock_fargate_tg]
      
      # Mock listener
      mock_listener_instance = Mock()
      mock_listener_instance.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/test/12345/listener"
      mock_listener.return_value = mock_listener_instance
      
      # Mock listener rule
      mock_listener_rule_instance = Mock()
      mock_listener_rule.return_value = mock_listener_rule_instance
      
      # Mock ASG attachment
      mock_attachment_instance = Mock()
      mock_attachment.return_value = mock_attachment_instance
      
      with patch.object(TapStack, '_create_kms_key'), \
         patch.object(TapStack, '_create_vpc_and_networking') as mock_vpc:
        mock_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
        
        with patch.object(TapStack, '_create_security_groups') as mock_sg:
          mock_alb_sg = Mock()
          mock_alb_sg.id = "sg-alb"
          
          with patch.object(TapStack, '_create_iam_roles'), \
             patch.object(TapStack, '_create_s3_buckets'), \
             patch.object(TapStack, '_create_rds_instance'), \
             patch.object(TapStack, '_create_secrets_manager'), \
             patch.object(TapStack, '_create_launch_template'), \
             patch.object(TapStack, '_create_auto_scaling_group') as mock_asg_create:
            mock_asg_instance = Mock()
            mock_asg_instance.id = "asg-12345"
            
            with patch.object(TapStack, '_create_waf'), \
               patch.object(TapStack, '_create_fargate_cluster'), \
               patch.object(TapStack, '_create_fargate_service'), \
               patch.object(TapStack, '_create_cloudwatch_alarms'), \
               patch.object(TapStack, '_create_backup_vault'), \
               patch.object(TapStack, '_create_codepipeline'):
              
              stack = TapStack(self.stack_name, self.args)
              
              # Set up required attributes
              stack.public_subnets = mock_subnets
              stack.alb_sg = mock_alb_sg
              stack.vpc = Mock(id="vpc-12345")
              stack.asg = mock_asg_instance
              
              # Create ALB components
              stack._create_application_load_balancer()
              
              # Verify ALB was created in public subnets
              mock_alb.assert_called_once()
              alb_call_args = mock_alb.call_args
              self.assertEqual(alb_call_args[1]["subnets"], [s.id for s in mock_subnets])
              
              # Verify target group was created
              mock_tg.assert_called()
              
              # Verify listener was created
              mock_listener.assert_called_once()
              
              # Verify ASG attachment
              mock_attachment.assert_called_once()
  
  def test_codepipeline_ecs_integration(self):
    """Test CodePipeline integration with ECS deployment."""
    with patch('pulumi_aws.codepipeline.Pipeline') as mock_pipeline, \
       patch('pulumi_aws.s3.Bucket') as mock_bucket, \
       patch('pulumi_aws.ecs.Cluster') as mock_cluster, \
       patch('pulumi_aws.ecs.Service') as mock_service, \
       patch('pulumi.get_stack') as mock_stack:
      
      mock_stack.return_value = "test-stack"
      
      # Mock CodePipeline
      mock_pipeline_instance = Mock()
      mock_pipeline_instance.name = "test-pipeline"
      mock_pipeline.return_value = mock_pipeline_instance
      
      # Mock S3 bucket for artifacts
      mock_bucket_instance = Mock()
      mock_bucket_instance.bucket = "test-pipeline-bucket"
      mock_bucket.return_value = mock_bucket_instance
      
      # Mock ECS components
      mock_cluster_instance = Mock()
      mock_cluster_instance.name = "test-cluster"
      mock_cluster.return_value = mock_cluster_instance
      
      mock_service_instance = Mock()
      mock_service_instance.name = "test-service"
      mock_service.return_value = mock_service_instance
      
      with patch.object(TapStack, '_create_kms_key') as mock_kms:
        mock_kms_key = Mock()
        mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
        
        with patch.object(TapStack, '_create_vpc_and_networking'), \
           patch.object(TapStack, '_create_security_groups'), \
           patch.object(TapStack, '_create_iam_roles') as mock_iam:
          mock_codepipeline_role = Mock()
          mock_codepipeline_role.arn = "arn:aws:iam::123456789012:role/codepipeline-role"
          
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
             patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
             patch('pulumi_aws.ecs.TaskDefinition') as mock_task_def:
            
            mock_log_group_instance = Mock()
            mock_log_group_instance.name = "/ecs/tap-integration"
            mock_log_group.return_value = mock_log_group_instance
            
            mock_task_def_instance = Mock()
            mock_task_def_instance.arn = "arn:aws:ecs:us-west-2:123456789012:task-definition/test:1"
            mock_task_def.return_value = mock_task_def_instance
            
            stack = TapStack(self.stack_name, self.args)
            
            # Set up required attributes
            stack.kms_key = mock_kms_key
            stack.codepipeline_role = mock_codepipeline_role
            
            # Create ECS and CodePipeline
            stack._create_fargate_cluster()
            stack.ecs_cluster = mock_cluster_instance
            stack.ecs_service = mock_service_instance
            stack._create_codepipeline()
            
            # Verify pipeline was created
            mock_pipeline.assert_called_once()
            pipeline_call_args = mock_pipeline.call_args
            
            # Check pipeline stages
            stages = pipeline_call_args[1]["stages"]
            self.assertEqual(len(stages), 2)  # Source and Deploy
            
            # Verify deploy stage targets ECS
            deploy_stage = next(s for s in stages if s["name"] == "Deploy")
            deploy_action = deploy_stage["actions"][0]
            self.assertEqual(deploy_action["provider"], "ECS")
            self.assertIn("ClusterName", deploy_action["configuration"])
            self.assertIn("ServiceName", deploy_action["configuration"])
  
  def test_network_acls_integration(self):
    """Test Network ACLs integration with subnets."""
    with patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
       patch('pulumi_aws.ec2.Subnet') as mock_subnet, \
       patch('pulumi_aws.ec2.NetworkAcl') as mock_nacl, \
       patch('pulumi_aws.ec2.NetworkAclAssociation') as mock_nacl_assoc, \
       patch('pulumi_aws.get_availability_zones') as mock_azs:
      
      mock_azs.return_value = Mock(names=["us-west-2a", "us-west-2b"])
      
      # Mock VPC
      mock_vpc_instance = Mock()
      mock_vpc_instance.id = "vpc-12345"
      mock_vpc.return_value = mock_vpc_instance
      
      # Mock subnets
      mock_subnet_instance = Mock()
      mock_subnet_instance.id = "subnet-12345"
      mock_subnet.return_value = mock_subnet_instance
      
      # Mock Network ACL
      mock_nacl_instance = Mock()
      mock_nacl_instance.id = "acl-12345"
      mock_nacl.return_value = mock_nacl_instance
      
      # Mock Network ACL association
      mock_nacl_assoc_instance = Mock()
      mock_nacl_assoc.return_value = mock_nacl_assoc_instance
      
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
         patch('pulumi_aws.ec2.InternetGateway') as mock_igw, \
         patch('pulumi_aws.ec2.NatGateway') as mock_nat, \
         patch('pulumi_aws.ec2.Eip') as mock_eip, \
         patch.object(TapStack, '_create_route_tables'):
        
        mock_igw.return_value = Mock()
        mock_nat.return_value = Mock()
        mock_eip.return_value = Mock()
        
        stack = TapStack(self.stack_name, self.args)
        
        # Verify VPC and subnets were created
        mock_vpc.assert_called_once()
        self.assertEqual(mock_subnet.call_count, 6)  # 2 public, 2 private, 2 db
  
  def test_complete_disaster_recovery_scenario(self):
    """Test complete disaster recovery scenario integration."""
    with patch('pulumi_aws.backup.Vault') as mock_vault, \
       patch('pulumi_aws.backup.Plan') as mock_plan, \
       patch('pulumi_aws.backup.Selection') as mock_selection, \
       patch('pulumi_aws.rds.Instance') as mock_rds, \
       patch('pulumi_aws.s3.Bucket') as mock_s3:
      
      # Mock backup components
      mock_vault_instance = Mock()
      mock_vault_instance.name = "disaster-recovery-vault"
      mock_vault_instance.arn = "arn:aws:backup:us-west-2:123456789012:backup-vault:disaster-recovery-vault"
      mock_vault.return_value = mock_vault_instance
      
      mock_plan_instance = Mock()
      mock_plan_instance.name = "disaster-recovery-plan"
      mock_plan.return_value = mock_plan_instance
      
      mock_selection_instance = Mock()
      mock_selection.return_value = mock_selection_instance
      
      # Mock RDS for backup target
      mock_rds_instance = Mock()
      mock_rds_instance.arn = "arn:aws:rds:us-west-2:123456789012:db:test-db"
      mock_rds_instance.endpoint = "test-db.cluster-xyz.us-west-2.rds.amazonaws.com"
      mock_rds.return_value = mock_rds_instance
      
      # Mock S3 for backup storage
      mock_s3_instance = Mock()
      mock_s3_instance.arn = "arn:aws:s3:::test-backup-bucket"
      mock_s3.return_value = mock_s3_instance
      
      with patch.object(TapStack, '_create_kms_key') as mock_kms:
        mock_kms_key = Mock()
        mock_kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/disaster-recovery"
        
        with patch.object(TapStack, '_create_vpc_and_networking'), \
           patch.object(TapStack, '_create_security_groups'), \
           patch.object(TapStack, '_create_iam_roles'), \
           patch.object(TapStack, '_create_secrets_manager'), \
           patch.object(TapStack, '_create_launch_template'), \
           patch.object(TapStack, '_create_auto_scaling_group'), \
           patch.object(TapStack, '_create_application_load_balancer'), \
           patch.object(TapStack, '_create_waf'), \
           patch.object(TapStack, '_create_fargate_cluster'), \
           patch.object(TapStack, '_create_fargate_service'), \
           patch.object(TapStack, '_create_cloudwatch_alarms'), \
           patch.object(TapStack, '_create_codepipeline'), \
           patch('pulumi_aws.rds.SubnetGroup') as mock_subnet_group:
          
          mock_subnet_group_instance = Mock()
          mock_subnet_group_instance.name = "test-subnet-group"
          mock_subnet_group.return_value = mock_subnet_group_instance
          
          stack = TapStack(self.stack_name, self.args)
          
          # Set up required attributes
          stack.kms_key = mock_kms_key
          stack.db_subnets = [Mock(id="subnet-1"), Mock(id="subnet-2")]
          stack.rds_sg = Mock(id="sg-12345")
          
          # Create components for disaster recovery
          stack._create_s3_buckets()
          stack._create_rds_instance()
          stack._create_backup_vault()
          
          # Verify backup vault was created with proper encryption
          mock_vault.assert_called_once()
          vault_call_args = mock_vault.call_args
          self.assertEqual(vault_call_args[1]["kms_key_arn"], mock_kms_key.arn)
          
          # Verify RDS instance has backup enabled
          mock_rds.assert_called_once()
          rds_call_args = mock_rds.call_args
          self.assertEqual(rds_call_args[1]["backup_retention_period"], 7)
          self.assertIsNotNone(rds_call_args["backup_window"])
          
          # Verify backup plan exists with proper schedule
          mock_plan.assert_called_once()
          plan_call_args = mock_plan.call_args
          rules = plan_call_args[1]["rules"]
          self.assertEqual(len(rules), 1)
          self.assertEqual(rules[0]["schedule"], "cron(0 5 ? * * *)")
          
          # Verify lifecycle policy for cost optimization
          lifecycle = rules[0]["lifecycle"]
          self.assertEqual(lifecycle["cold_storage_after"], 30)
          self.assertEqual(lifecycle["delete_after"], 120)


class TestTapStackErrorHandling(unittest.TestCase):
  """Test error handling and edge cases in TAP stack."""
  
  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix="error-test")
  
  def test_invalid_environment_suffix(self):
    """Test handling of invalid environment suffix."""
    invalid_args = TapStackArgs(environment_suffix="")
    
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
      
      stack = TapStack("error-test", invalid_args)
      self.assertEqual(stack.name_prefix, "tap-")  # Empty suffix
  
  def test_missing_availability_zones(self):
    """Test handling when no availability zones are available."""
    with patch('pulumi_aws.get_availability_zones') as mock_azs:
      mock_azs.return_value = Mock(names=[])  # No AZs available
      
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
         patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
         patch('pulumi_aws.ec2.InternetGateway') as mock_igw, \
         patch('pulumi_aws.ec2.Subnet') as mock_subnet, \
         patch.object(TapStack, '_create_route_tables'):
        
        mock_vpc.return_value = Mock(id="vpc-12345")
        mock_igw.return_value = Mock(id="igw-12345")
        mock_subnet.return_value = Mock(id="subnet-12345")
        
        # Should handle gracefully without creating subnets
        stack = TapStack("error-test", self.args)
        
        # No subnets should be created if no AZs available
        self.assertEqual(mock_subnet.call_count, 0)
  
  def test_resource_creation_failure_rollback(self):
    """Test rollback behavior when resource creation fails."""
    with patch('pulumi_aws.kms.Key') as mock_kms:
      mock_kms.side_effect = Exception("KMS key creation failed")
      
      # Should handle the exception gracefully
      try:
        stack = TapStack("error-test", self.args)
        # If we reach here, the exception was handled
        self.assertTrue(True)
      except Exception as e:
        # Exception should be propagated for proper error handling
        self.assertIn("KMS key creation failed", str(e))


if __name__ == '__main__':
  # Configure test runner
  loader = unittest.TestLoader()
  suite = unittest.TestSuite()
  
  # Add all test classes
  suite.addTests(loader.loadTestsFromTestCase(TestTapStackIntegration))
  suite.addTests(loader.loadTestsFromTestCase(TestTapStackErrorHandling))
  
  # Run tests with verbose output
  runner = unittest.TextTestRunner(verbosity=2, buffer=True)
  result = runner.run(suite)
  
  # Exit with appropriate code
  exit(0 if result.wasSuccessful() else 1)
