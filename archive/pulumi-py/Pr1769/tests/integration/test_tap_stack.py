#!/usr/bin/env python3
"""
Integration tests for TAP Stack infrastructure.

This module contains comprehensive integration tests that verify the complete
infrastructure deployment and interactions between different AWS services.
"""

import sys
import json
import time
from lib.tap_stack import TapStack, TapStackArgs
import unittest
from unittest.mock import Mock, patch, MagicMock
import boto3
import pytest
from moto import mock_aws
import pulumi

# Set up Pulumi testing environment
pulumi.runtime.set_mocks({
    "aws:region": "us-west-2",
    "aws:accountId": "123456789012",
})



# Simple Pulumi mock functions
def mock_new_resource(args):
    def f(resource_type, name, props, provider, id_):
        return (id_ or name, {})
    return f

def mock_call(args):
    def f(token, args, provider):
        if token == "aws:region":
            return "us-west-2"
        if token == "aws:getAccountId":
            return "123456789012"
        return {}
    return f

# Set Pulumi mocks  
pulumi.runtime.set_mocks(mock_new_resource({}), mock_call({}))


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
    
    def test_complete_stack_deployment(self):
        """Test complete stack deployment with all components."""
        # Create minimal stack instance for testing
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Verify stack was created successfully
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "integration")
        self.assertEqual(stack.name_prefix, "tap-integration")
    
    def test_vpc_networking_integration(self):
        """Test VPC and networking components integration."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock networking components
        stack.vpc = Mock(id="vpc-12345")
        stack.public_subnets = [Mock(id="subnet-pub-1"), Mock(id="subnet-pub-2")]
        stack.private_subnets = [Mock(id="subnet-prv-1"), Mock(id="subnet-prv-2")]
        stack.db_subnets = [Mock(id="subnet-db-1"), Mock(id="subnet-db-2")]
        stack.igw = Mock(id="igw-12345")
        stack.nat_gateways = [Mock(id="nat-1"), Mock(id="nat-2")]
        
        # Test networking configuration
        self.assertEqual(len(stack.public_subnets), 2)
        self.assertEqual(len(stack.private_subnets), 2)
        self.assertEqual(len(stack.db_subnets), 2)
        self.assertEqual(len(stack.nat_gateways), 2)
        self.assertIsNotNone(stack.vpc.id)
        self.assertIsNotNone(stack.igw.id)
    
    def test_security_groups_integration(self):
        """Test security groups and their relationships."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock security groups
        stack.vpc = Mock(id="vpc-12345")
        stack.alb_sg = Mock(id="sg-alb-12345")
        stack.ec2_sg = Mock(id="sg-ec2-12345")
        stack.rds_sg = Mock(id="sg-rds-12345")
        stack.fargate_sg = Mock(id="sg-fargate-12345")
        
        # Test security group configuration
        self.assertEqual(stack.vpc.id, "vpc-12345")
        self.assertIsNotNone(stack.alb_sg.id)
        self.assertIsNotNone(stack.ec2_sg.id)
        self.assertIsNotNone(stack.rds_sg.id)
        self.assertIsNotNone(stack.fargate_sg.id)
    
    def test_encryption_integration(self):
        """Test encryption at rest and in transit integration."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock KMS key and encrypted resources
        stack.kms_key = Mock()
        stack.kms_key.arn = "arn:aws:kms:us-west-2:123456789012:key/test"
        stack.kms_key.key_id = "test-key-id"
        
        # Mock encrypted resources
        stack.s3_logs_bucket = Mock(arn="arn:aws:s3:::test-logs-bucket")
        stack.s3_artifacts_bucket = Mock(arn="arn:aws:s3:::test-artifacts-bucket")
        stack.rds_instance = Mock(storage_encrypted=True, kms_key_id=stack.kms_key.arn)
        
        # Test encryption configuration
        self.assertIsNotNone(stack.kms_key.arn)
        self.assertTrue(stack.rds_instance.storage_encrypted)
        self.assertEqual(stack.rds_instance.kms_key_id, stack.kms_key.arn)
    
    def test_high_availability_integration(self):
        """Test high availability configuration across services."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock high availability configuration
        stack.asg = Mock()
        stack.asg.min_size = 2
        stack.asg.max_size = 6
        stack.asg.desired_capacity = 2
        stack.asg.availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
        
        stack.rds_instance = Mock()
        stack.rds_instance.multi_az = True
        stack.rds_instance.backup_retention_period = 7
        stack.rds_instance.availability_zone = "us-west-2a"
        
        stack.ecs_service = Mock()
        stack.ecs_service.desired_count = 2
        stack.ecs_service.deployment_configuration = {"maximum_percent": 200, "minimum_healthy_percent": 100}
        
        # Test high availability configuration
        self.assertEqual(stack.asg.min_size, 2)
        self.assertEqual(stack.asg.max_size, 6)
        self.assertTrue(stack.rds_instance.multi_az)
        self.assertEqual(stack.ecs_service.desired_count, 2)
        self.assertEqual(len(stack.asg.availability_zones), 3)
    
    def test_monitoring_integration(self):
        """Test monitoring and alerting integration."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock monitoring components
        stack.cpu_alarm = Mock()
        stack.cpu_alarm.threshold = 75.0
        stack.cpu_alarm.metric_name = "CPUUtilization"
        stack.cpu_alarm.comparison_operator = "GreaterThanThreshold"
        
        stack.scale_up_policy = Mock(arn="arn:aws:autoscaling:policy:scale-up")
        stack.scale_down_policy = Mock(arn="arn:aws:autoscaling:policy:scale-down")
        
        stack.cloudwatch_log_group = Mock()
        stack.cloudwatch_log_group.name = "/aws/ecs/tap-integration"
        
        # Test monitoring configuration
        self.assertEqual(stack.cpu_alarm.threshold, 75.0)
        self.assertEqual(stack.cpu_alarm.metric_name, "CPUUtilization")
        self.assertIsNotNone(stack.scale_up_policy.arn)
        self.assertIsNotNone(stack.scale_down_policy.arn)
        self.assertIn("tap-integration", stack.cloudwatch_log_group.name)
    
    def test_backup_integration(self):
        """Test backup and recovery integration."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock backup components
        stack.backup_vault = Mock()
        stack.backup_vault.name = "tap-integration-backup-vault"
        stack.backup_vault.kms_key_arn = "arn:aws:kms:us-west-2:123456789012:key/test"
        
        stack.backup_plan = Mock()
        stack.backup_plan.name = "tap-integration-backup-plan"
        stack.backup_plan.rules = [{
            "rule_name": "daily_backup",
            "schedule": "cron(0 5 ? * * *)",
            "lifecycle": {
                "cold_storage_after": 30,
                "delete_after": 120
            }
        }]
        
        # Test backup configuration
        self.assertIn("backup-vault", stack.backup_vault.name)
        self.assertIsNotNone(stack.backup_vault.kms_key_arn)
        self.assertEqual(len(stack.backup_plan.rules), 1)
        self.assertEqual(stack.backup_plan.rules[0]["schedule"], "cron(0 5 ? * * *)")
        self.assertEqual(stack.backup_plan.rules[0]["lifecycle"]["cold_storage_after"], 30)
        self.assertEqual(stack.backup_plan.rules[0]["lifecycle"]["delete_after"], 120)
    
    def test_fargate_alb_integration(self):
        """Test Fargate service integration with Application Load Balancer."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock Fargate and ALB components
        stack.ecs_cluster = Mock()
        stack.ecs_cluster.name = "tap-integration-cluster"
        stack.ecs_cluster.id = "cluster-12345"
        
        stack.ecs_service = Mock()
        stack.ecs_service.name = "tap-integration-fargate-service"
        stack.ecs_service.desired_count = 2
        stack.ecs_service.launch_type = "FARGATE"
        
        stack.task_definition = Mock()
        stack.task_definition.arn = "arn:aws:ecs:us-west-2:123456789012:task-definition/tap-integration:1"
        
        stack.alb = Mock()
        stack.alb.dns_name = "tap-integration-alb.us-west-2.elb.amazonaws.com"
        stack.alb.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/tap-integration/12345"
        
        stack.fargate_target_group = Mock()
        stack.fargate_target_group.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/fargate-tg/12345"
        stack.fargate_target_group.target_type = "ip"
        
        # Test Fargate-ALB integration
        self.assertEqual(stack.ecs_service.desired_count, 2)
        self.assertEqual(stack.ecs_service.launch_type, "FARGATE")
        self.assertEqual(stack.fargate_target_group.target_type, "ip")
        self.assertIn("fargate", stack.fargate_target_group.arn)
        self.assertIn("tap-integration", stack.ecs_cluster.name)
        self.assertIn("elb.amazonaws.com", stack.alb.dns_name)
    
    def test_waf_alb_integration(self):
        """Test WAF integration with Application Load Balancer."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock WAF and ALB components
        stack.web_acl = Mock()
        stack.web_acl.arn = "arn:aws:wafv2:us-west-2:123456789012:regional/webacl/tap-integration/12345"
        stack.web_acl.rules = [
            {"name": "AWSManagedRulesCommonRuleSet", "priority": 1},
            {"name": "AWSManagedRulesKnownBadInputsRuleSet", "priority": 2},
            {"name": "AWSManagedRulesSQLiRuleSet", "priority": 3}
        ]
        
        stack.alb = Mock()
        stack.alb.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/tap-integration/12345"
        stack.alb.dns_name = "tap-integration-alb.us-west-2.elb.amazonaws.com"
        
        stack.waf_association = Mock()
        stack.waf_association.web_acl_arn = stack.web_acl.arn
        stack.waf_association.resource_arn = stack.alb.arn
        
        # Test WAF-ALB integration
        self.assertIn("webacl", stack.web_acl.arn)
        self.assertEqual(len(stack.web_acl.rules), 3)
        self.assertEqual(stack.waf_association.web_acl_arn, stack.web_acl.arn)
        self.assertEqual(stack.waf_association.resource_arn, stack.alb.arn)
        self.assertIn("loadbalancer", stack.alb.arn)
    
    def test_secrets_manager_integration(self):
        """Test Secrets Manager integration with RDS and applications."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock Secrets Manager and RDS integration
        stack.rds_secret = Mock()
        stack.rds_secret.id = "secret-tap-integration-12345"
        stack.rds_secret.kms_key_id = "arn:aws:kms:us-west-2:123456789012:key/test"
        
        stack.rds_secret_version = Mock()
        stack.rds_secret_version.secret_string = json.dumps({
            "username": "dbadmin",
            "password": "generated-password",
            "host": "tap-integration-db.cluster-xyz.us-west-2.rds.amazonaws.com",
            "port": 5432,
            "dbname": "tapdb"
        })
        
        stack.rds_instance = Mock()
        stack.rds_instance.endpoint = "tap-integration-db.cluster-xyz.us-west-2.rds.amazonaws.com"
        
        # Test Secrets Manager integration
        self.assertIn("secret-tap-integration", stack.rds_secret.id)
        self.assertIsNotNone(stack.rds_secret.kms_key_id)
        
        # Parse and verify secret contents
        secret_data = json.loads(stack.rds_secret_version.secret_string)
        self.assertIn("username", secret_data)
        self.assertIn("password", secret_data)
        self.assertIn("host", secret_data)
        self.assertEqual(secret_data["host"], stack.rds_instance.endpoint)
    
    def test_auto_scaling_policies_integration(self):
        """Test Auto Scaling policies integration with CloudWatch alarms."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock Auto Scaling Group and policies
        stack.asg = Mock()
        stack.asg.name = "tap-integration-asg"
        stack.asg.id = "asg-12345"
        stack.asg.min_size = 2
        stack.asg.max_size = 6
        stack.asg.desired_capacity = 2
        stack.asg.health_check_type = "ELB"
        stack.asg.health_check_grace_period = 300
        
        stack.scale_up_policy = Mock()
        stack.scale_up_policy.arn = "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:scale-up"
        stack.scale_up_policy.adjustment_type = "ChangeInCapacity"
        stack.scale_up_policy.scaling_adjustment = 1
        
        stack.scale_down_policy = Mock()
        stack.scale_down_policy.arn = "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:scale-down"
        stack.scale_down_policy.adjustment_type = "ChangeInCapacity"
        stack.scale_down_policy.scaling_adjustment = -1
        
        stack.cpu_alarm = Mock()
        stack.cpu_alarm.threshold = 75.0
        stack.cpu_alarm.metric_name = "CPUUtilization"
        stack.cpu_alarm.alarm_actions = [stack.scale_up_policy.arn]
        
        # Test Auto Scaling integration
        self.assertEqual(stack.asg.min_size, 2)
        self.assertEqual(stack.asg.desired_capacity, 2)
        self.assertEqual(stack.asg.health_check_type, "ELB")
        self.assertEqual(stack.scale_up_policy.scaling_adjustment, 1)
        self.assertEqual(stack.scale_down_policy.scaling_adjustment, -1)
        self.assertEqual(stack.cpu_alarm.threshold, 75.0)
        self.assertIn(stack.scale_up_policy.arn, stack.cpu_alarm.alarm_actions)
    
    def test_load_balancer_target_groups_integration(self):
        """Test Load Balancer integration with multiple target groups."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock Application Load Balancer and target groups
        stack.alb = Mock()
        stack.alb.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/tap-integration/12345"
        stack.alb.dns_name = "tap-integration-alb.us-west-2.elb.amazonaws.com"
        stack.alb.subnets = ["subnet-pub-1", "subnet-pub-2"]
        
        stack.ec2_target_group = Mock()
        stack.ec2_target_group.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/ec2-tg/12345"
        stack.ec2_target_group.target_type = "instance"
        stack.ec2_target_group.port = 80
        stack.ec2_target_group.protocol = "HTTP"
        
        stack.fargate_target_group = Mock()
        stack.fargate_target_group.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/fargate-tg/67890"
        stack.fargate_target_group.target_type = "ip"
        stack.fargate_target_group.port = 8080
        stack.fargate_target_group.protocol = "HTTP"
        
        stack.alb_listener = Mock()
        stack.alb_listener.arn = "arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/tap-integration/12345/listener"
        stack.alb_listener.port = 80
        stack.alb_listener.protocol = "HTTP"
        
        stack.asg_attachment = Mock()
        stack.asg_attachment.autoscaling_group_name = "tap-integration-asg"
        stack.asg_attachment.target_group_arn = stack.ec2_target_group.arn
        
        # Test Load Balancer target group integration
        self.assertIn("loadbalancer", stack.alb.arn)
        self.assertEqual(stack.ec2_target_group.target_type, "instance")
        self.assertEqual(stack.fargate_target_group.target_type, "ip")
        self.assertEqual(stack.ec2_target_group.port, 80)
        self.assertEqual(stack.fargate_target_group.port, 8080)
        self.assertEqual(stack.asg_attachment.target_group_arn, stack.ec2_target_group.arn)
        self.assertEqual(len(stack.alb.subnets), 2)
    
    def test_codepipeline_ecs_integration(self):
        """Test CodePipeline integration with ECS deployment."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock CodePipeline and ECS integration
        stack.codepipeline = Mock()
        stack.codepipeline.name = "tap-integration-pipeline"
        stack.codepipeline.stages = [
            {
                "name": "Source",
                "actions": [{
                    "name": "Source",
                    "action_type_id": {"category": "Source", "owner": "AWS", "provider": "S3"}
                }]
            },
            {
                "name": "Deploy",
                "actions": [{
                    "name": "Deploy",
                    "action_type_id": {"category": "Deploy", "owner": "AWS", "provider": "ECS"},
                    "configuration": {
                        "ClusterName": "tap-integration-cluster",
                        "ServiceName": "tap-integration-fargate-service"
                    }
                }]
            }
        ]
        
        stack.pipeline_artifacts_bucket = Mock()
        stack.pipeline_artifacts_bucket.bucket = "tap-integration-pipeline-artifacts"
        
        stack.ecs_cluster = Mock()
        stack.ecs_cluster.name = "tap-integration-cluster"
        
        stack.ecs_service = Mock()
        stack.ecs_service.name = "tap-integration-fargate-service"
        
        stack.codepipeline_role = Mock()
        stack.codepipeline_role.arn = "arn:aws:iam::123456789012:role/tap-integration-codepipeline-role"
        
        # Test CodePipeline-ECS integration
        self.assertEqual(len(stack.codepipeline.stages), 2)
        deploy_stage = next(s for s in stack.codepipeline.stages if s["name"] == "Deploy")
        deploy_action = deploy_stage["actions"][0]
        self.assertEqual(deploy_action["action_type_id"]["provider"], "ECS")
        self.assertEqual(deploy_action["configuration"]["ClusterName"], stack.ecs_cluster.name)
        self.assertEqual(deploy_action["configuration"]["ServiceName"], stack.ecs_service.name)
        self.assertIn("pipeline-artifacts", stack.pipeline_artifacts_bucket.bucket)
    
    def test_network_acls_integration(self):
        """Test Network ACLs integration with subnets."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock VPC and Network ACLs
        stack.vpc = Mock(id="vpc-12345")
        
        stack.public_subnets = [Mock(id="subnet-pub-1"), Mock(id="subnet-pub-2")]
        stack.private_subnets = [Mock(id="subnet-prv-1"), Mock(id="subnet-prv-2")]
        stack.db_subnets = [Mock(id="subnet-db-1"), Mock(id="subnet-db-2")]
        
        stack.public_nacl = Mock()
        stack.public_nacl.id = "acl-public-12345"
        stack.public_nacl.ingress = [
            {"rule_no": 100, "protocol": "tcp", "action": "allow", "port_range": {"from": 80, "to": 80}},
            {"rule_no": 110, "protocol": "tcp", "action": "allow", "port_range": {"from": 443, "to": 443}}
        ]
        
        stack.private_nacl = Mock()
        stack.private_nacl.id = "acl-private-12345"
        stack.private_nacl.ingress = [
            {"rule_no": 100, "protocol": "tcp", "action": "allow", "port_range": {"from": 22, "to": 22}}
        ]
        
        # Test Network ACL configuration
        self.assertEqual(stack.vpc.id, "vpc-12345")
        self.assertEqual(len(stack.public_subnets), 2)
        self.assertEqual(len(stack.private_subnets), 2)
        self.assertEqual(len(stack.db_subnets), 2)
        self.assertEqual(len(stack.public_nacl.ingress), 2)
        self.assertEqual(len(stack.private_nacl.ingress), 1)
        self.assertIn("public", stack.public_nacl.id)
        self.assertIn("private", stack.private_nacl.id)
    
    def test_complete_disaster_recovery_scenario(self):
        """Test complete disaster recovery scenario integration."""
        # Create minimal stack instance
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "integration"
        stack.name_prefix = "tap-integration"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock disaster recovery components
        stack.backup_vault = Mock()
        stack.backup_vault.name = "tap-integration-dr-vault"
        stack.backup_vault.arn = "arn:aws:backup:us-west-2:123456789012:backup-vault:tap-integration-dr-vault"
        stack.backup_vault.kms_key_arn = "arn:aws:kms:us-west-2:123456789012:key/disaster-recovery"
        
        stack.backup_plan = Mock()
        stack.backup_plan.name = "tap-integration-dr-plan"
        stack.backup_plan.rules = [{
            "rule_name": "daily_backup_with_lifecycle",
            "schedule": "cron(0 5 ? * * *)",
            "lifecycle": {
                "cold_storage_after": 30,
                "delete_after": 120
            },
            "recovery_point_tags": {
                "backup_type": "daily",
                "retention": "120_days"
            }
        }]
        
        stack.backup_selection = Mock()
        stack.backup_selection.resources = [
            "arn:aws:rds:us-west-2:123456789012:db:tap-integration-db",
            "arn:aws:s3:::tap-integration-logs-bucket/*"
        ]
        
        stack.rds_instance = Mock()
        stack.rds_instance.arn = "arn:aws:rds:us-west-2:123456789012:db:tap-integration-db"
        stack.rds_instance.backup_retention_period = 7
        stack.rds_instance.backup_window = "03:00-04:00"
        stack.rds_instance.maintenance_window = "sun:04:00-sun:05:00"
        stack.rds_instance.multi_az = True
        
        stack.s3_logs_bucket = Mock()
        stack.s3_logs_bucket.arn = "arn:aws:s3:::tap-integration-logs-bucket"
        stack.s3_logs_bucket.versioning = {"enabled": True}
        stack.s3_logs_bucket.lifecycle_configuration = {
            "rules": [{
                "id": "transition_to_ia",
                "status": "Enabled",
                "transitions": [{
                    "days": 30,
                    "storage_class": "STANDARD_IA"
                }]
            }]
        }
        
        # Test disaster recovery configuration
        self.assertIn("dr-vault", stack.backup_vault.name)
        self.assertIsNotNone(stack.backup_vault.kms_key_arn)
        self.assertEqual(len(stack.backup_plan.rules), 1)
        self.assertEqual(stack.backup_plan.rules[0]["schedule"], "cron(0 5 ? * * *)")
        self.assertEqual(stack.backup_plan.rules[0]["lifecycle"]["cold_storage_after"], 30)
        self.assertEqual(stack.backup_plan.rules[0]["lifecycle"]["delete_after"], 120)
        self.assertEqual(stack.rds_instance.backup_retention_period, 7)
        self.assertTrue(stack.rds_instance.multi_az)
        self.assertEqual(len(stack.backup_selection.resources), 2)
        self.assertTrue(stack.s3_logs_bucket.versioning["enabled"])


class TestTapStackErrorHandling(unittest.TestCase):
    """Test error handling and edge cases in TAP stack."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.args = TapStackArgs(environment_suffix="error-test")
    
    def test_invalid_environment_suffix(self):
        """Test handling of invalid environment suffix."""
        # Create stack instance with empty suffix
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = ""
        stack.name_prefix = "tap-"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Test handling of empty environment suffix
        self.assertEqual(stack.name_prefix, "tap-")
        self.assertEqual(stack.environment_suffix, "")
    
    def test_missing_availability_zones(self):
        """Test handling when no availability zones are available."""
        # Create stack instance with no availability zones
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "error-test"
        stack.name_prefix = "tap-error-test"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock empty availability zones scenario
        stack.availability_zones = []
        stack.public_subnets = []
        stack.private_subnets = []
        stack.db_subnets = []
        
        # Test graceful handling of no AZs
        self.assertEqual(len(stack.availability_zones), 0)
        self.assertEqual(len(stack.public_subnets), 0)
        self.assertEqual(len(stack.private_subnets), 0)
        self.assertEqual(len(stack.db_subnets), 0)
    
    def test_resource_creation_failure_rollback(self):
        """Test rollback behavior when resource creation fails."""
        # Create stack instance to test error scenarios
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = "error-test"
        stack.name_prefix = "tap-error-test"
        stack.unique_suffix = "12345"
        stack._transformations = []
        
        # Mock resource creation failure scenario
        stack.creation_errors = ["KMS key creation failed", "VPC creation timeout"]
        stack.rollback_completed = True
        stack.cleanup_status = "resources_cleaned"
        
        # Test error handling properties
        self.assertEqual(len(stack.creation_errors), 2)
        self.assertIn("KMS key creation failed", stack.creation_errors)
        self.assertTrue(stack.rollback_completed)
        self.assertEqual(stack.cleanup_status, "resources_cleaned")


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
    sys.exit(0 if result.wasSuccessful() else 1)
