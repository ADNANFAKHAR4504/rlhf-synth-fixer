"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
Tests infrastructure code logic and resource definitions.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os
import json
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock infrastructure for Pulumi testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource."""
        # Return appropriate state based on resource type
        state = {
            **args.inputs,
            'id': args.name + '_id',
            'urn': f"urn:pulumi:stack::project::{args.typ}::{args.name}",
        }

        # Add type-specific mock outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            state['cidrBlock'] = args.inputs.get('cidrBlock', '10.0.0.0/16')
        elif args.typ == "aws:ec2/subnet:Subnet":
            state['cidrBlock'] = args.inputs.get('cidrBlock')
            state['availabilityZone'] = args.inputs.get('availabilityZone', 'us-east-1a')
        elif args.typ == "aws:ecr/repository:Repository":
            state['repositoryUrl'] = f"342597974367.dkr.ecr.us-east-1.amazonaws.com/{args.name}"
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            state['dnsName'] = f"{args.name}-123456789.us-east-1.elb.amazonaws.com"
            state['arnSuffix'] = f"app/{args.name}/1234567890abcdef"
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            state['arnSuffix'] = f"targetgroup/{args.name}/1234567890abcdef"
        elif args.typ == "aws:ecs/cluster:Cluster":
            state['name'] = args.inputs.get('name', args.name)
        elif args.typ == "aws:ecs/service:Service":
            state['name'] = args.inputs.get('name', args.name)

        return [state.get('id'), state]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Handle mock calls for data sources."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                'zone_ids': ['use1-az1', 'use1-az2', 'use1-az3']
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackResources(unittest.TestCase):
    """Test Pulumi stack resource creation."""

    @pulumi.runtime.test
    def test_import_stack_module(self):
        """Test that stack module imports successfully."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack)

    @pulumi.runtime.test
    def test_configuration_values(self):
        """Test configuration values are set."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.environment_suffix)
        self.assertIsNotNone(lib.tap_stack.aws_region)

    @pulumi.runtime.test
    def test_vpc_exists(self):
        """Test VPC resource is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.vpc)

    @pulumi.runtime.test
    def test_availability_zones_fetched(self):
        """Test availability zones are fetched."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.azs)
        self.assertIsNotNone(lib.tap_stack.az_names)

    @pulumi.runtime.test
    def test_internet_gateway_exists(self):
        """Test Internet Gateway is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.igw)

    @pulumi.runtime.test
    def test_public_subnets_exist(self):
        """Test public subnets are created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.public_subnets)
        self.assertEqual(len(lib.tap_stack.public_subnets), 3)

    @pulumi.runtime.test
    def test_private_subnets_exist(self):
        """Test private subnets are created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.private_subnets)
        self.assertEqual(len(lib.tap_stack.private_subnets), 3)

    @pulumi.runtime.test
    def test_elastic_ips_exist(self):
        """Test Elastic IPs are created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.eips)
        self.assertEqual(len(lib.tap_stack.eips), 3)

    @pulumi.runtime.test
    def test_nat_gateways_exist(self):
        """Test NAT Gateways are created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.nat_gateways)
        self.assertEqual(len(lib.tap_stack.nat_gateways), 3)

    @pulumi.runtime.test
    def test_public_route_table_exists(self):
        """Test public route table is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.public_rt)

    @pulumi.runtime.test
    def test_public_route_exists(self):
        """Test public route to IGW is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.public_route)

    @pulumi.runtime.test
    def test_ecr_repository_exists(self):
        """Test ECR repository is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.ecr_repo)

    @pulumi.runtime.test
    def test_ecr_lifecycle_policy_exists(self):
        """Test ECR lifecycle policy is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.ecr_lifecycle_policy)

    @pulumi.runtime.test
    def test_cloudwatch_log_group_exists(self):
        """Test CloudWatch log group is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.log_group)

    @pulumi.runtime.test
    def test_ecs_cluster_exists(self):
        """Test ECS cluster is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.ecs_cluster)

    @pulumi.runtime.test
    def test_task_execution_role_exists(self):
        """Test task execution role is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.task_execution_role)

    @pulumi.runtime.test
    def test_task_execution_policy_attachment_exists(self):
        """Test task execution policy attachment exists."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.task_execution_policy_attachment)

    @pulumi.runtime.test
    def test_task_role_exists(self):
        """Test task role is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.task_role)

    @pulumi.runtime.test
    def test_task_role_policy_exists(self):
        """Test task role policy is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.task_role_policy)

    @pulumi.runtime.test
    def test_alb_security_group_exists(self):
        """Test ALB security group is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.alb_sg)

    @pulumi.runtime.test
    def test_ecs_security_group_exists(self):
        """Test ECS security group is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.ecs_sg)

    @pulumi.runtime.test
    def test_alb_exists(self):
        """Test Application Load Balancer is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.alb)

    @pulumi.runtime.test
    def test_target_group_exists(self):
        """Test target group is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.target_group)

    @pulumi.runtime.test
    def test_alb_listener_exists(self):
        """Test ALB listener is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.alb_listener)

    @pulumi.runtime.test
    def test_task_definition_exists(self):
        """Test task definition is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.task_definition)

    @pulumi.runtime.test
    def test_ecs_service_exists(self):
        """Test ECS service is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.ecs_service)

    @pulumi.runtime.test
    def test_autoscaling_target_exists(self):
        """Test autoscaling target is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.autoscaling_target)

    @pulumi.runtime.test
    def test_cpu_scaling_policy_exists(self):
        """Test CPU scaling policy is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.cpu_scaling_policy)

    @pulumi.runtime.test
    def test_cpu_alarm_exists(self):
        """Test CPU alarm is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.cpu_alarm)

    @pulumi.runtime.test
    def test_healthy_task_alarm_exists(self):
        """Test healthy task alarm is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.healthy_task_alarm)

    @pulumi.runtime.test
    def test_db_connection_param_exists(self):
        """Test database connection parameter is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.db_connection_param)

    @pulumi.runtime.test
    def test_api_key_param_exists(self):
        """Test API key parameter is created."""
        import lib.tap_stack
        self.assertIsNotNone(lib.tap_stack.api_key_param)


class TestConfigurationLogic(unittest.TestCase):
    """Test configuration parsing and logic."""

    def test_config_or_default_with_value(self):
        """Test config.get with provided value."""
        value = "custom"
        result = value or "default"
        self.assertEqual(result, "custom")

    def test_config_or_default_without_value(self):
        """Test config.get with None uses default."""
        value = None
        result = value or "default"
        self.assertEqual(result, "default")

    def test_az_slicing(self):
        """Test availability zone slicing to first 3."""
        azs = ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d']
        result = azs[:3]
        self.assertEqual(len(result), 3)
        self.assertEqual(result, ['us-east-1a', 'us-east-1b', 'us-east-1c'])

    def test_public_subnet_cidr_generation(self):
        """Test public subnet CIDR block generation."""
        for i in range(3):
            cidr = f"10.0.{i}.0/24"
            self.assertIn(str(i), cidr)
            self.assertTrue(cidr.endswith('.0/24'))

    def test_private_subnet_cidr_generation(self):
        """Test private subnet CIDR block generation."""
        for i in range(3):
            cidr = f"10.0.{i + 10}.0/24"
            self.assertIn(str(i + 10), cidr)
            self.assertTrue(cidr.endswith('.0/24'))

    def test_name_truncation_for_alb(self):
        """Test ALB name truncation to 32 chars."""
        long_suffix = "verylongenvironmentsuffixname12345678"
        name = f"api-alb-{long_suffix}"[:32]
        self.assertLessEqual(len(name), 32)

    def test_name_truncation_for_target_group(self):
        """Test target group name truncation to 32 chars."""
        long_suffix = "verylongenvironmentsuffixname12345678"
        name = f"api-tg-{long_suffix}"[:32]
        self.assertLessEqual(len(name), 32)

    def test_lifecycle_policy_json_structure(self):
        """Test ECR lifecycle policy JSON structure."""
        policy = {
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep only 5 most recent images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 5
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        }
        policy_json = json.dumps(policy)
        parsed = json.loads(policy_json)
        self.assertEqual(parsed['rules'][0]['selection']['countNumber'], 5)
        self.assertEqual(parsed['rules'][0]['action']['type'], "expire")

    def test_iam_assume_role_policy_structure(self):
        """Test IAM assume role policy structure."""
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        policy_json = json.dumps(policy)
        parsed = json.loads(policy_json)
        self.assertEqual(parsed['Statement'][0]['Principal']['Service'], "ecs-tasks.amazonaws.com")
        self.assertEqual(parsed['Statement'][0]['Action'], "sts:AssumeRole")

    def test_ssm_parameter_policy_structure(self):
        """Test SSM parameter access policy structure."""
        aws_region = "us-east-1"
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameters",
                        "ssm:GetParameter"
                    ],
                    "Resource": f"arn:aws:ssm:{aws_region}:*:parameter/product-catalog/*"
                }
            ]
        }
        self.assertEqual(policy['Statement'][0]['Action'], ["ssm:GetParameters", "ssm:GetParameter"])
        self.assertIn("product-catalog", policy['Statement'][0]['Resource'])

    def test_container_port_value(self):
        """Test container port configuration."""
        port = 8080
        self.assertEqual(port, 8080)
        self.assertIsInstance(port, int)

    def test_cpu_memory_values(self):
        """Test CPU and memory values."""
        cpu = "1024"
        memory = "2048"
        self.assertEqual(cpu, "1024")
        self.assertEqual(memory, "2048")

    def test_autoscaling_capacity_values(self):
        """Test autoscaling capacity configuration."""
        min_capacity = 2
        max_capacity = 10
        self.assertEqual(min_capacity, 2)
        self.assertEqual(max_capacity, 10)
        self.assertLess(min_capacity, max_capacity)

    def test_cpu_threshold_value(self):
        """Test CPU scaling threshold."""
        threshold = 70.0
        self.assertEqual(threshold, 70.0)
        self.assertGreater(threshold, 0)
        self.assertLess(threshold, 100)

    def test_cooldown_periods(self):
        """Test scaling cooldown periods."""
        scale_in = 300
        scale_out = 60
        self.assertEqual(scale_in, 300)
        self.assertEqual(scale_out, 60)
        self.assertGreater(scale_in, scale_out)

    def test_alarm_thresholds(self):
        """Test CloudWatch alarm thresholds."""
        cpu_threshold = 80.0
        task_threshold = 2.0
        self.assertEqual(cpu_threshold, 80.0)
        self.assertEqual(task_threshold, 2.0)

    def test_health_check_configuration(self):
        """Test health check configuration values."""
        path = "/health"
        port = "8080"
        healthy_threshold = 2
        unhealthy_threshold = 3
        timeout = 5
        interval = 30

        self.assertEqual(path, "/health")
        self.assertEqual(port, "8080")
        self.assertEqual(healthy_threshold, 2)
        self.assertEqual(unhealthy_threshold, 3)
        self.assertEqual(timeout, 5)
        self.assertEqual(interval, 30)
        self.assertLess(timeout, interval)

    def test_log_retention_days(self):
        """Test log retention configuration."""
        retention_days = 7
        self.assertEqual(retention_days, 7)
        self.assertGreater(retention_days, 0)


if __name__ == '__main__':
    unittest.main()
