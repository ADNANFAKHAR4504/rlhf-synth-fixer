#!/usr/bin/env python3
"""
Unit tests for Highly Available Transaction Processing System Terraform infrastructure.
Tests configuration validity, resource naming, tagging, and infrastructure constraints.
"""

import json
import os
import re
import subprocess
import unittest
from typing import Dict, List, Any


class TerraformUnitTests(unittest.TestCase):
    """Unit tests for Terraform infrastructure configuration."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment and load Terraform plan."""
        cls.lib_dir = os.path.join(os.path.dirname(__file__), '..', 'lib')
        cls.environment_suffix = "synth101912498"

        # Load terraform state for testing
        cls.tfstate_path = os.path.join(cls.lib_dir, 'terraform.tfstate')
        if os.path.exists(cls.tfstate_path):
            with open(cls.tfstate_path, 'r') as f:
                cls.tfstate = json.load(f)
        else:
            cls.tfstate = None

        # Read Terraform files
        cls.main_tf = cls._read_file(os.path.join(cls.lib_dir, 'tap_stack.tf'))
        cls.variables_tf = cls._read_file(os.path.join(cls.lib_dir, 'variables.tf'))
        cls.outputs_tf = cls._read_file(os.path.join(cls.lib_dir, 'outputs.tf'))
        cls.provider_tf = cls._read_file(os.path.join(cls.lib_dir, 'provider.tf'))

    @staticmethod
    def _read_file(filepath: str) -> str:
        """Read file contents."""
        with open(filepath, 'r') as f:
            return f.read()

    def test_terraform_files_exist(self):
        """Test that all required Terraform files exist."""
        required_files = ['tap_stack.tf', 'variables.tf', 'outputs.tf', 'provider.tf']
        for filename in required_files:
            filepath = os.path.join(self.lib_dir, filename)
            self.assertTrue(os.path.exists(filepath), f"{filename} should exist")

    def test_terraform_version_constraint(self):
        """Test that Terraform version constraint is correct."""
        self.assertIn('required_version = ">= 1.5.0"', self.provider_tf)

    def test_aws_provider_version(self):
        """Test that AWS provider version is specified correctly."""
        self.assertIn('version = "~> 5.0"', self.provider_tf)

    def test_environment_suffix_variable_exists(self):
        """Test that environment_suffix variable is defined."""
        self.assertIn('variable "environment_suffix"', self.variables_tf)

    def test_environment_suffix_validation(self):
        """Test that environment_suffix has proper validation."""
        self.assertIn('validation {', self.variables_tf)
        self.assertIn('length(var.environment_suffix)', self.variables_tf)

    def test_all_resources_use_environment_suffix(self):
        """Test that all resources include environment_suffix in their names."""
        # Check key resources have environment_suffix
        env_suffix_resources = [
            'vpc-${var.environment_suffix}',
            'alb-${var.environment_suffix}',
            'aurora-cluster-${var.environment_suffix}',
            'redis-cluster-${var.environment_suffix}',
            'ecs-cluster-${var.environment_suffix}',
            'tg-${var.environment_suffix}'
        ]
        for resource in env_suffix_resources:
            self.assertIn(resource, self.main_tf)

    def test_vpc_configuration(self):
        """Test VPC resource configuration."""
        self.assertIn('resource "aws_vpc" "main"', self.main_tf)
        self.assertIn('enable_dns_hostnames = true', self.main_tf)
        self.assertIn('enable_dns_support   = true', self.main_tf)

    def test_multi_az_configuration(self):
        """Test that infrastructure spans multiple AZs."""
        # Check for availability zones count
        self.assertIn('availability_zones_count', self.variables_tf)

        # Check subnets are created per AZ - use proper format
        self.assertIn('count             = var.availability_zones_count', self.main_tf)

        # Verify subnet types exist
        self.assertIn('resource "aws_subnet" "public"', self.main_tf)
        self.assertIn('resource "aws_subnet" "private_app"', self.main_tf)
        self.assertIn('resource "aws_subnet" "private_db"', self.main_tf)

    def test_nat_gateways_per_az(self):
        """Test that NAT gateways are created per AZ."""
        self.assertIn('resource "aws_nat_gateway" "main"', self.main_tf)
        nat_gateway_count = self.main_tf.count('resource "aws_nat_gateway" "main"')
        self.assertEqual(nat_gateway_count, 1)  # One resource block with count
        self.assertIn('count         = var.availability_zones_count', self.main_tf)

    def test_security_groups_exist(self):
        """Test that all required security groups are defined."""
        required_sgs = ['alb', 'ecs_tasks', 'aurora', 'redis']
        for sg in required_sgs:
            self.assertIn(f'resource "aws_security_group" "{sg}"', self.main_tf)

    def test_alb_configuration(self):
        """Test Application Load Balancer configuration."""
        self.assertIn('resource "aws_lb" "main"', self.main_tf)
        self.assertIn('load_balancer_type = "application"', self.main_tf)
        self.assertIn('enable_cross_zone_load_balancing = true', self.main_tf)
        self.assertIn('enable_deletion_protection       = false', self.main_tf)

    def test_aurora_cluster_configuration(self):
        """Test Aurora PostgreSQL cluster configuration."""
        self.assertIn('resource "aws_rds_cluster" "aurora"', self.main_tf)
        self.assertIn('engine                 = "aurora-postgresql"', self.main_tf)
        self.assertIn('backup_retention_period         = 7', self.main_tf)

        # Test that backtrack is NOT configured for PostgreSQL
        self.assertNotIn('backtrack_window', self.main_tf)

    def test_aurora_instances_per_az(self):
        """Test Aurora instances are created per AZ."""
        self.assertIn('resource "aws_rds_cluster_instance" "aurora"', self.main_tf)
        self.assertIn('count               = var.availability_zones_count', self.main_tf)

    def test_elasticache_redis_configuration(self):
        """Test ElastiCache Redis cluster configuration."""
        self.assertIn('resource "aws_elasticache_replication_group" "redis"', self.main_tf)
        self.assertIn('engine               = "redis"', self.main_tf)
        self.assertIn('automatic_failover_enabled = true', self.main_tf)
        self.assertIn('multi_az_enabled           = true', self.main_tf)
        self.assertIn('at_rest_encryption_enabled = true', self.main_tf)
        self.assertIn('transit_encryption_enabled = true', self.main_tf)

    def test_ecs_cluster_configuration(self):
        """Test ECS cluster configuration."""
        self.assertIn('resource "aws_ecs_cluster" "main"', self.main_tf)
        self.assertIn('containerInsights', self.main_tf)

    def test_ecs_service_configuration(self):
        """Test ECS service configuration."""
        self.assertIn('resource "aws_ecs_service" "app"', self.main_tf)
        self.assertIn('launch_type     = "FARGATE"', self.main_tf)
        # Test desired count is based on tasks per AZ
        self.assertIn('desired_count   = var.min_tasks_per_az * var.availability_zones_count', self.main_tf)

    def test_auto_scaling_configuration(self):
        """Test auto scaling configuration."""
        self.assertIn('resource "aws_appautoscaling_target" "ecs"', self.main_tf)
        self.assertIn('resource "aws_appautoscaling_policy" "ecs_cpu"', self.main_tf)
        self.assertIn('resource "aws_appautoscaling_policy" "ecs_memory"', self.main_tf)

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured."""
        required_alarms = [
            'alb_unhealthy_targets',
            'ecs_cpu_high',
            'aurora_cpu_high',
            'aurora_replication_lag',
            'redis_cpu_high'
        ]
        for alarm in required_alarms:
            self.assertIn(f'resource "aws_cloudwatch_metric_alarm" "{alarm}"', self.main_tf)

    def test_sns_topic_configuration(self):
        """Test SNS topic for alarms."""
        self.assertIn('resource "aws_sns_topic" "alarms"', self.main_tf)
        self.assertIn('resource "aws_sns_topic_subscription" "alarm_email"', self.main_tf)

    def test_required_outputs_exist(self):
        """Test that all required outputs are defined."""
        required_outputs = [
            'vpc_id',
            'alb_dns_name',
            'aurora_cluster_endpoint',
            'redis_configuration_endpoint',
            'ecs_cluster_name',
            'ecs_service_name'
        ]
        for output in required_outputs:
            self.assertIn(f'output "{output}"', self.outputs_tf)

    def test_no_hardcoded_regions(self):
        """Test that no hardcoded regions exist except in defaults."""
        # Region should only appear in variable defaults, not hardcoded
        lines = self.main_tf.split('\n')
        for line in lines:
            if 'region' in line.lower() and 'var.region' not in line:
                # Skip comments
                if line.strip().startswith('#'):
                    continue
                # This should only be in variable definitions
                self.assertNotIn('us-east-1', line)

    def test_deletion_protection_disabled(self):
        """Test that deletion protection is disabled for testing."""
        self.assertIn('deletion_protection = false', self.main_tf)

    def test_skip_final_snapshot(self):
        """Test that skip_final_snapshot is true for testing."""
        self.assertIn('skip_final_snapshot       = true', self.main_tf)

    def test_tags_configuration(self):
        """Test that default tags are configured."""
        self.assertIn('default_tags {', self.provider_tf)
        self.assertIn('tags = var.tags', self.provider_tf)

    def test_common_tags_include_environment_suffix(self):
        """Test that common tags include EnvironmentSuffix."""
        self.assertIn('EnvironmentSuffix = var.environment_suffix', self.main_tf)

    def test_route53_is_optional(self):
        """Test that Route53 resources are conditionally created."""
        self.assertIn('count = var.domain_name != "" ? 1 : 0', self.main_tf)

    def test_db_password_sensitive(self):
        """Test that db_password is marked as sensitive."""
        self.assertIn('sensitive   = true', self.variables_tf)

    def test_iam_roles_for_ecs(self):
        """Test that IAM roles are created for ECS."""
        self.assertIn('resource "aws_iam_role" "ecs_execution"', self.main_tf)
        self.assertIn('resource "aws_iam_role" "ecs_task"', self.main_tf)

    def test_cloudwatch_log_groups(self):
        """Test that CloudWatch log groups are created."""
        self.assertIn('resource "aws_cloudwatch_log_group" "ecs"', self.main_tf)
        self.assertIn('resource "aws_cloudwatch_log_group" "redis"', self.main_tf)

    def test_min_tasks_per_az_default(self):
        """Test that min_tasks_per_az has correct default."""
        self.assertIn('default     = 2', self.variables_tf)

    def test_health_check_configuration(self):
        """Test ALB target group health check configuration."""
        self.assertIn('health_check {', self.main_tf)
        self.assertIn('healthy_threshold', self.main_tf)
        self.assertIn('unhealthy_threshold', self.main_tf)

    def test_deregistration_delay(self):
        """Test connection draining configuration."""
        self.assertIn('deregistration_delay = 30', self.main_tf)

    def test_random_password_generation(self):
        """Test that random password is generated for Aurora."""
        self.assertIn('resource "random_password" "aurora"', self.main_tf)
        self.assertIn('length  = 16', self.main_tf)


if __name__ == '__main__':
    # Run tests with coverage
    unittest.main(verbosity=2)
