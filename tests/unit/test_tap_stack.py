#!/usr/bin/env python3
"""
Unit tests for the TAP Stack infrastructure components.

This module contains comprehensive unit tests for the TapStack class, covering
all components, edge cases, error conditions, and various configuration scenarios.
Tests are designed to validate infrastructure components without requiring actual
AWS resources to be created.
"""

import pytest
import unittest
from unittest.mock import Mock, patch, MagicMock, call
from dataclasses import dataclass
import pulumi
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs:
    """Test cases for TapStackArgs dataclass."""

    def test_default_initialization(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs(environment_suffix="test")
        
        assert args.environment_suffix == "test"
        assert args.vpc_cidr == "10.0.0.0/16"
        assert args.availability_zones == ["us-east-1a", "us-east-1b"]
        assert args.enable_flow_logs is True
        assert args.enable_cross_region_replication is True
        assert args.backup_region == "us-west-2"
        assert args.tags == {}

    def test_custom_initialization(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Team": "DevOps", "Cost-Center": "Engineering"}
        args = TapStackArgs(
            environment_suffix="prod",
            vpc_cidr="172.16.0.0/16",
            availability_zones=["us-east-1a", "us-east-1b", "us-east-1c"],
            enable_flow_logs=False,
            enable_cross_region_replication=False,
            backup_region="eu-west-1",
            tags=custom_tags
        )
        
        assert args.environment_suffix == "prod"
        assert args.vpc_cidr == "172.16.0.0/16"
        assert args.availability_zones == ["us-east-1a", "us-east-1b", "us-east-1c"]
        assert args.enable_flow_logs is False
        assert args.enable_cross_region_replication is False
        assert args.backup_region == "eu-west-1"
        assert args.tags == custom_tags

    def test_empty_environment_suffix_error(self):
        """Test that empty environment_suffix raises appropriate error."""
        with pytest.raises(TypeError):
            TapStackArgs()

    def test_none_values_handling(self):
        """Test handling of None values in initialization."""
        args = TapStackArgs(
            environment_suffix="dev",
            availability_zones=None,
            tags=None
        )
        
        assert args.availability_zones == ["us-east-1a", "us-east-1b"]
        assert args.tags == {}


class TestTapStackInitialization:
    """Test cases for TapStack initialization and basic properties."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_basic_initialization(self, mock_get_stack, mock_aws):
        """Test basic TapStack initialization."""
        args = TapStackArgs(environment_suffix="dev")
        
        # Mock AWS resources
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()
        
        stack = TapStack("TestStack", args)
        
        assert stack.environment == "dev"
        assert "Environment" in stack.base_tags
        assert "Project" in stack.base_tags
        assert "ManagedBy" in stack.base_tags
        assert stack.base_tags["Environment"] == "environment:dev"

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_custom_tags_integration(self, mock_get_stack, mock_aws):
        """Test that custom tags are properly integrated with base tags."""
        custom_tags = {"Team": "Platform", "Owner": "DevOps"}
        args = TapStackArgs(environment_suffix="staging", tags=custom_tags)
        
        # Mock AWS resources
        self._mock_all_aws_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        assert "Team" in stack.base_tags
        assert "Owner" in stack.base_tags
        assert stack.base_tags["Team"] == "Platform"
        assert stack.base_tags["Owner"] == "DevOps"

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_environment_suffix_validation(self, mock_get_stack, mock_aws):
        """Test various environment suffix values."""
        test_environments = ["dev", "staging", "prod", "test", "demo"]
        
        self._mock_all_aws_resources(mock_aws)
        
        for env in test_environments:
            args = TapStackArgs(environment_suffix=env)
            stack = TapStack(f"TestStack-{env}", args)
            assert stack.environment == env

    def _mock_all_aws_resources(self, mock_aws):
        """Helper method to mock all AWS resources."""
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


class TestTapStackVPCCreation:
    """Test cases for VPC creation and configuration."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_vpc_creation_with_default_cidr(self, mock_get_stack, mock_aws):
        """Test VPC creation with default CIDR block."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        self._mock_all_aws_resources_except_vpc(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        mock_aws.ec2.Vpc.assert_called_once()
        call_args = mock_aws.ec2.Vpc.call_args
        assert call_args[1]['cidr_block'] == "10.0.0.0/16"
        assert call_args[1]['enable_dns_hostnames'] is True
        assert call_args[1]['enable_dns_support'] is True

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_vpc_creation_with_custom_cidr(self, mock_get_stack, mock_aws):
        """Test VPC creation with custom CIDR block."""
        args = TapStackArgs(environment_suffix="dev", vpc_cidr="172.16.0.0/16")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-67890"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        self._mock_all_aws_resources_except_vpc(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        mock_aws.ec2.Vpc.assert_called_once()
        call_args = mock_aws.ec2.Vpc.call_args
        assert call_args[1]['cidr_block'] == "172.16.0.0/16"

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_vpc_tags_application(self, mock_get_stack, mock_aws):
        """Test that proper tags are applied to VPC."""
        args = TapStackArgs(environment_suffix="prod")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-prod123"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        self._mock_all_aws_resources_except_vpc(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        call_args = mock_aws.ec2.Vpc.call_args
        tags = call_args[1]['tags']
        assert "Name" in tags
        assert "Component" in tags
        assert tags["Component"] == "networking"
        assert "Environment" in tags

    def _mock_all_aws_resources_except_vpc(self, mock_aws):
        """Helper method to mock all AWS resources except VPC."""
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


class TestTapStackSubnetCreation:
    """Test cases for subnet creation across availability zones."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_default_subnet_creation(self, mock_get_stack, mock_aws):
        """Test creation of subnets in default availability zones."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_subnet = Mock()
        mock_subnet.id = "subnet-12345"
        mock_aws.ec2.Subnet.return_value = mock_subnet
        
        self._mock_non_subnet_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Should create 2 public + 2 private = 4 subnets
        assert mock_aws.ec2.Subnet.call_count == 4

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_custom_availability_zones_subnet_creation(self, mock_get_stack, mock_aws):
        """Test subnet creation with custom availability zones."""
        custom_azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        args = TapStackArgs(environment_suffix="dev", availability_zones=custom_azs)
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_subnet = Mock()
        mock_subnet.id = "subnet-12345"
        mock_aws.ec2.Subnet.return_value = mock_subnet
        
        self._mock_non_subnet_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Should create 3 public + 3 private = 6 subnets
        assert mock_aws.ec2.Subnet.call_count == 6

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_public_subnet_configuration(self, mock_get_stack, mock_aws):
        """Test public subnet specific configuration."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_subnet = Mock()
        mock_subnet.id = "subnet-public"
        mock_aws.ec2.Subnet.return_value = mock_subnet
        
        self._mock_non_subnet_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Check public subnet calls
        public_calls = [call for call in mock_aws.ec2.Subnet.call_args_list 
                       if 'public' in str(call)]
        
        for call in public_calls:
            assert call[1]['map_public_ip_on_launch'] is True
            assert call[1]['cidr_block'] in ["10.0.1.0/24", "10.0.2.0/24"]

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_private_subnet_configuration(self, mock_get_stack, mock_aws):
        """Test private subnet specific configuration."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_subnet = Mock()
        mock_subnet.id = "subnet-private"
        mock_aws.ec2.Subnet.return_value = mock_subnet
        
        self._mock_non_subnet_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Check private subnet calls
        private_calls = [call for call in mock_aws.ec2.Subnet.call_args_list 
                        if 'private' in str(call)]
        
        for call in private_calls:
            # Private subnets should not have map_public_ip_on_launch set to True
            assert call[1].get('map_public_ip_on_launch') != True
            assert call[1]['cidr_block'] in ["10.0.11.0/24", "10.0.12.0/24"]

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_single_availability_zone(self, mock_get_stack, mock_aws):
        """Test subnet creation with single availability zone."""
        args = TapStackArgs(environment_suffix="dev", availability_zones=["us-east-1a"])
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_subnet = Mock()
        mock_subnet.id = "subnet-12345"
        mock_aws.ec2.Subnet.return_value = mock_subnet
        
        self._mock_non_subnet_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Should create 1 public + 1 private = 2 subnets
        assert mock_aws.ec2.Subnet.call_count == 2

    def _mock_non_subnet_resources(self, mock_aws):
        """Helper method to mock all AWS resources except Subnet."""
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


class TestTapStackSecurityGroups:
    """Test cases for security group creation and configuration."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_security_group_creation_count(self, mock_get_stack, mock_aws):
        """Test that all required security groups are created."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_sg = Mock()
        mock_sg.id = "sg-12345"
        mock_aws.ec2.SecurityGroup.return_value = mock_sg
        
        self._mock_non_security_group_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Should create 3 security groups: web, app, db
        assert mock_aws.ec2.SecurityGroup.call_count == 3

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_web_security_group_rules(self, mock_get_stack, mock_aws):
        """Test web security group ingress and egress rules."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_sg = Mock()
        mock_sg.id = "sg-web"
        mock_aws.ec2.SecurityGroup.return_value = mock_sg
        
        self._mock_non_security_group_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Find web security group call
        web_sg_call = None
        for call in mock_aws.ec2.SecurityGroup.call_args_list:
            if 'web' in str(call):
                web_sg_call = call
                break
        
        assert web_sg_call is not None
        ingress_rules = web_sg_call[1]['ingress']
        
        # Should have HTTP and HTTPS ingress rules
        ports = [rule.from_port for rule in ingress_rules]
        assert 80 in ports
        assert 443 in ports

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_app_security_group_rules(self, mock_get_stack, mock_aws):
        """Test application security group rules."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_sg = Mock()
        mock_sg.id = "sg-app"
        mock_aws.ec2.SecurityGroup.return_value = mock_sg
        
        self._mock_non_security_group_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Find app security group call
        app_sg_call = None
        for call in mock_aws.ec2.SecurityGroup.call_args_list:
            if 'app' in str(call):
                app_sg_call = call
                break
        
        assert app_sg_call is not None
        ingress_rules = app_sg_call[1]['ingress']
        
        # Should have port 8080 ingress rule
        assert len(ingress_rules) == 1
        assert ingress_rules[0].from_port == 8080

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_db_security_group_rules(self, mock_get_stack, mock_aws):
        """Test database security group rules."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-12345"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        mock_sg = Mock()
        mock_sg.id = "sg-db"
        mock_aws.ec2.SecurityGroup.return_value = mock_sg
        
        self._mock_non_security_group_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Find db security group call
        db_sg_call = None
        for call in mock_aws.ec2.SecurityGroup.call_args_list:
            if 'db' in str(call):
                db_sg_call = call
                break
        
        assert db_sg_call is not None
        ingress_rules = db_sg_call[1]['ingress']
        
        # Should have MySQL (3306) and PostgreSQL (5432) ingress rules
        ports = [rule.from_port for rule in ingress_rules]
        assert 3306 in ports
        assert 5432 in ports

    def _mock_non_security_group_resources(self, mock_aws):
        """Helper method to mock all AWS resources except SecurityGroup."""
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


class TestTapStackS3Buckets:
    """Test cases for S3 bucket creation and configuration."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_s3_bucket_creation_without_replication(self, mock_get_stack, mock_aws):
        """Test S3 bucket creation when cross-region replication is disabled."""
        args = TapStackArgs(environment_suffix="dev", enable_cross_region_replication=False)
        
        self._mock_all_non_s3_resources(mock_aws)
        
        mock_bucket = Mock()
        mock_bucket.bucket = "test-bucket"
        mock_aws.s3.Bucket.return_value = mock_bucket
        
        stack = TapStack("TestStack", args)
        
        # Should create 2 buckets: app and logs (no backup bucket)
        assert mock_aws.s3.Bucket.call_count == 2

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_s3_bucket_creation_with_replication(self, mock_get_stack, mock_aws):
        """Test S3 bucket creation when cross-region replication is enabled."""
        args = TapStackArgs(environment_suffix="dev", enable_cross_region_replication=True)
        
        self._mock_all_non_s3_resources(mock_aws)
        
        mock_bucket = Mock()
        mock_bucket.bucket = "test-bucket"
        mock_aws.s3.Bucket.return_value = mock_bucket
        
        mock_provider = Mock()
        mock_aws.Provider.return_value = mock_provider
        
        stack = TapStack("TestStack", args)
        
        # Should create 3 buckets: app, logs, and backup
        assert mock_aws.s3.Bucket.call_count == 3

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_s3_bucket_encryption_configuration(self, mock_get_stack, mock_aws):
        """Test S3 bucket encryption configuration."""
        args = TapStackArgs(environment_suffix="dev")
        
        self._mock_all_non_s3_resources(mock_aws)
        
        mock_bucket = Mock()
        mock_bucket.bucket = "test-bucket"
        mock_aws.s3.Bucket.return_value = mock_bucket
        
        stack = TapStack("TestStack", args)
        
        # Check encryption configuration in bucket calls
        for call in mock_aws.s3.Bucket.call_args_list:
            encryption_config = call[1].get('server_side_encryption_configuration')
            if encryption_config:
                assert encryption_config.rule.apply_server_side_encryption_by_default.sse_algorithm == "AES256"

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_logs_bucket_lifecycle_policy(self, mock_get_stack, mock_aws):
        """Test logs bucket lifecycle policy configuration."""
        args = TapStackArgs(environment_suffix="dev")
        
        self._mock_all_non_s3_resources(mock_aws)
        
        mock_bucket = Mock()
        mock_bucket.bucket = "test-logs-bucket"
        mock_aws.s3.Bucket.return_value = mock_bucket
        
        stack = TapStack("TestStack", args)
        
        # Find logs bucket call
        logs_bucket_call = None
        for call in mock_aws.s3.Bucket.call_args_list:
            if 'logs' in str(call):
                logs_bucket_call = call
                break
        
        assert logs_bucket_call is not None
        lifecycle_config = logs_bucket_call[1].get('lifecycle_configuration')
        if lifecycle_config:
            rules = lifecycle_config.rules
            assert len(rules) == 1
            assert rules[0].expiration.days == 90

    def _mock_all_non_s3_resources(self, mock_aws):
        """Helper method to mock all AWS resources except S3."""
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


class TestTapStackMonitoring:
    """Test cases for CloudWatch monitoring and logging configuration."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_cloudwatch_log_groups_creation(self, mock_get_stack, mock_aws):
        """Test CloudWatch log groups creation."""
        args = TapStackArgs(environment_suffix="dev")
        
        self._mock_all_non_cloudwatch_resources(mock_aws)
        
        mock_log_group = Mock()
        mock_log_group.name = "test-log-group"
        mock_aws.cloudwatch.LogGroup.return_value = mock_log_group
        
        mock_alarm = Mock()
        mock_aws.cloudwatch.MetricAlarm.return_value = mock_alarm
        
        stack = TapStack("TestStack", args)
        
        # Should create 2 log groups: application and infrastructure
        assert mock_aws.cloudwatch.LogGroup.call_count == 2

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_cloudwatch_alarms_creation(self, mock_get_stack, mock_aws):
        """Test CloudWatch alarms creation."""
        args = TapStackArgs(environment_suffix="dev")
        
        self._mock_all_non_cloudwatch_resources(mock_aws)
        
        mock_log_group = Mock()
        mock_log_group.name = "test-log-group"
        mock_aws.cloudwatch.LogGroup.return_value = mock_log_group
        
        mock_alarm = Mock()
        mock_aws.cloudwatch.MetricAlarm.return_value = mock_alarm
        
        stack = TapStack("TestStack", args)
        
        # Should create at least 1 alarm (high CPU)
        assert mock_aws.cloudwatch.MetricAlarm.call_count >= 1

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_log_group_retention_policy(self, mock_get_stack, mock_aws):
        """Test log group retention policy."""
        args = TapStackArgs(environment_suffix="dev")
        
        self._mock_all_non_cloudwatch_resources(mock_aws)
        
        mock_log_group = Mock()
        mock_log_group.name = "test-log-group"
        mock_aws.cloudwatch.LogGroup.return_value = mock_log_group
        
        mock_alarm = Mock()
        mock_aws.cloudwatch.MetricAlarm.return_value = mock_alarm
        
        stack = TapStack("TestStack", args)
        
        # Check retention policy in log group calls
        for call in mock_aws.cloudwatch.LogGroup.call_args_list:
            assert call[1].get('retention_in_days') == 30

    def _mock_all_non_cloudwatch_resources(self, mock_aws):
        """Helper method to mock all AWS resources except CloudWatch."""
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


class TestTapStackFlowLogs:
    """Test cases for VPC Flow Logs configuration."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_flow_logs_enabled_by_default(self, mock_get_stack, mock_aws):
        """Test that VPC Flow Logs are enabled by default."""
        args = TapStackArgs(environment_suffix="dev")
        
        self._mock_all_non_flow_log_resources(mock_aws)
        
        mock_flow_log = Mock()
        mock_aws.ec2.FlowLog.return_value = mock_flow_log
        
        stack = TapStack("TestStack", args)
        
        # Should create 1 flow log
        mock_aws.ec2.FlowLog.assert_called_once()

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_flow_logs_disabled(self, mock_get_stack, mock_aws):
        """Test VPC Flow Logs when disabled."""
        args = TapStackArgs(environment_suffix="dev", enable_flow_logs=False)
        
        self._mock_all_non_flow_log_resources(mock_aws)
        
        mock_flow_log = Mock()
        mock_aws.ec2.FlowLog.return_value = mock_flow_log
        
        stack = TapStack("TestStack", args)
        
        # Should not create flow log
        mock_aws.ec2.FlowLog.assert_not_called()

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_flow_logs_configuration(self, mock_get_stack, mock_aws):
        """Test VPC Flow Logs configuration parameters."""
        args = TapStackArgs(environment_suffix="dev")
        
        self._mock_all_non_flow_log_resources(mock_aws)
        
        mock_flow_log = Mock()
        mock_aws.ec2.FlowLog.return_value = mock_flow_log
        
        stack = TapStack("TestStack", args)
        
        call_args = mock_aws.ec2.FlowLog.call_args
        assert call_args[1]['log_destination_type'] == "cloud-watch-logs"
        assert call_args[1]['resource_type'] == "VPC"
        assert call_args[1]['traffic_type'] == "ALL"

    def _mock_all_non_flow_log_resources(self, mock_aws):
        """Helper method to mock all AWS resources except FlowLog."""
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.Provider = Mock()


class TestTapStackOutputs:
    """Test cases for stack outputs and properties."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_stack_outputs_structure(self, mock_get_stack, mock_aws):
        """Test the structure of stack outputs."""
        args = TapStackArgs(environment_suffix="dev")
        
        # Mock all AWS resources
        self._mock_all_aws_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        outputs = stack.outputs
        
        # Check that all expected output keys are present
        expected_keys = [
            "vpc_id",
            "public_subnet_ids", 
            "private_subnet_ids",
            "security_group_ids",
            "s3_bucket_names",
            "cloudwatch_log_groups"
        ]
        
        for key in expected_keys:
            assert key in outputs

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_security_group_ids_structure(self, mock_get_stack, mock_aws):
        """Test the structure of security group IDs in outputs."""
        args = TapStackArgs(environment_suffix="dev")
        
        mock_sg = Mock()
        mock_sg.id = "sg-12345"
        mock_aws.ec2.SecurityGroup.return_value = mock_sg
        
        self._mock_all_non_sg_aws_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        security_group_ids = stack.security_group_ids
        expected_sg_keys = ["web", "app", "db"]
        
        for key in expected_sg_keys:
            assert key in security_group_ids

    def _mock_all_aws_resources(self, mock_aws):
        """Helper method to mock all AWS resources."""
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()

    def _mock_all_non_sg_aws_resources(self, mock_aws):
        """Helper method to mock all AWS resources except SecurityGroup."""
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


class TestTapStackErrorHandling:
    """Test cases for error handling and edge cases."""

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_empty_availability_zones_list(self, mock_get_stack, mock_aws):
        """Test handling of empty availability zones list."""
        args = TapStackArgs(environment_suffix="dev", availability_zones=[])
        
        self._mock_all_aws_resources(mock_aws)
        
        stack = TapStack("TestStack", args)
        
        # Should not create any subnets
        mock_aws.ec2.Subnet.assert_not_called()

    @patch('lib.tap_stack.aws')
    @patch('pulumi.get_stack', return_value='test-stack')
    def test_invalid_cidr_handling(self, mock_get_stack, mock_aws):
        """Test stack creation with invalid CIDR (should still pass through)."""
        args = TapStackArgs(environment_suffix="dev", vpc_cidr="invalid-cidr")
        
        mock_vpc = Mock()
        mock_vpc.id = "vpc-invalid"
        mock_aws.ec2.Vpc.return_value = mock_vpc
        
        self._mock_all_non_vpc_aws_resources(mock_aws)
        
        # This should not raise an exception (validation happens at AWS level)
        stack = TapStack("TestStack", args)
        
        call_args = mock_aws.ec2.Vpc.call_args
        assert call_args[1]['cidr_block'] == "invalid-cidr"

    def _mock_all_aws_resources(self, mock_aws):
        """Helper method to mock all AWS resources."""
        mock_aws.ec2.Vpc = Mock()
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()

    def _mock_all_non_vpc_aws_resources(self, mock_aws):
        """Helper method to mock all AWS resources except VPC."""
        mock_aws.ec2.Subnet = Mock()
        mock_aws.ec2.InternetGateway = Mock()
        mock_aws.ec2.Eip = Mock()
        mock_aws.ec2.NatGateway = Mock()
        mock_aws.ec2.RouteTable = Mock()
        mock_aws.ec2.Route = Mock()
        mock_aws.ec2.RouteTableAssociation = Mock()
        mock_aws.ec2.SecurityGroup = Mock()
        mock_aws.s3.Bucket = Mock()
        mock_aws.iam.Role = Mock()
        mock_aws.iam.RolePolicy = Mock()
        mock_aws.cloudwatch.LogGroup = Mock()
        mock_aws.cloudwatch.MetricAlarm = Mock()
        mock_aws.ec2.FlowLog = Mock()
        mock_aws.Provider = Mock()


if __name__ == '__main__':
    pytest.main([__file__])
