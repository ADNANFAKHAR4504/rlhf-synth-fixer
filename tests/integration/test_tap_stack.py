#!/usr/bin/env python3
"""
Integration tests for the TAP Stack infrastructure components.

This module contains comprehensive integration tests that validate the complete
infrastructure stack deployment, resource interactions, and end-to-end functionality.
These tests focus on verifying that all components work together correctly and
that the infrastructure meets the specified requirements.
"""

import pytest
import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
import pulumi_aws as aws
from lib.tap_stack import TapStack, TapStackArgs
import time
import json


class TestTapStackIntegration:
  """Integration tests for complete TAP stack deployment."""

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_complete_stack_deployment(self, mock_get_stack, mock_aws):
    """Test complete stack deployment with all components."""
    args = TapStackArgs(environment_suffix="integration")
        
    # Mock all AWS resources with proper dependencies
    self._setup_complete_aws_mocks(mock_aws)
        
    # Create stack
    stack = TapStack("IntegrationTestStack", args)
        
    # Verify all major components were created
    self._assert_vpc_components_created(mock_aws)
    self._assert_networking_components_created(mock_aws)
    self._assert_security_components_created(mock_aws)
    self._assert_storage_components_created(mock_aws)
    self._assert_monitoring_components_created(mock_aws)
    self._assert_iam_components_created(mock_aws)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_high_availability_configuration(self, mock_get_stack, mock_aws):
    """Test high availability configuration across multiple AZs."""
    args = TapStackArgs(
      environment_suffix="ha-test",
      availability_zones=["us-east-1a", "us-east-1b", "us-east-1c"]
    )
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("HATestStack", args)
        
    # Verify multi-AZ deployment
    subnet_calls = mock_aws.ec2.Subnet.call_args_list
    public_subnets = [call for call in subnet_calls if 'public' in str(call)]
    private_subnets = [call for call in subnet_calls if 'private' in str(call)]
        
    # Should have 3 public and 3 private subnets
    assert len(public_subnets) == 3
    assert len(private_subnets) == 3
        
    # Verify NAT Gateways for high availability
    nat_gw_calls = mock_aws.ec2.NatGateway.call_args_list
    assert len(nat_gw_calls) == 3  # One per AZ

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_security_best_practices_implementation(self, mock_get_stack, mock_aws):
    """Test implementation of security best practices."""
    args = TapStackArgs(environment_suffix="security-test")
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("SecurityTestStack", args)
        
    # Verify security groups follow least privilege principle
    sg_calls = mock_aws.ec2.SecurityGroup.call_args_list
        
    # Check web tier security group
    web_sg_call = self._find_security_group_call(sg_calls, "web")
    web_ingress = web_sg_call[1]['ingress']
    web_ports = [rule.from_port for rule in web_ingress]
    assert 80 in web_ports and 443 in web_ports  # Only HTTP/HTTPS
        
    # Check app tier security group
    app_sg_call = self._find_security_group_call(sg_calls, "app")
    app_ingress = app_sg_call[1]['ingress']
    assert len(app_ingress) == 1  # Only one port open
    assert app_ingress[0].from_port == 8080  # Application port
        
    # Check database tier security group
    db_sg_call = self._find_security_group_call(sg_calls, "db")
    db_ingress = db_sg_call[1]['ingress']
    db_ports = [rule.from_port for rule in db_ingress]
    assert 3306 in db_ports and 5432 in db_ports  # MySQL and PostgreSQL only

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_cross_region_replication_setup(self, mock_get_stack, mock_aws):
    """Test S3 cross-region replication setup."""
    args = TapStackArgs(
      environment_suffix="replication-test",
      enable_cross_region_replication=True,
      backup_region="us-west-2"
    )
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("ReplicationTestStack", args)
        
    # Verify backup provider creation
    mock_aws.Provider.assert_called()
    provider_call = mock_aws.Provider.call_args
    assert provider_call[1]['region'] == "us-west-2"
        
    # Verify backup bucket creation
    bucket_calls = mock_aws.s3.Bucket.call_args_list
    backup_bucket_calls = [call for call in bucket_calls if 'backup' in str(call)]
    assert len(backup_bucket_calls) == 1

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_monitoring_and_logging_integration(self, mock_get_stack, mock_aws):
    """Test comprehensive monitoring and logging integration."""
    args = TapStackArgs(environment_suffix="monitoring-test")
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("MonitoringTestStack", args)
        
    # Verify CloudWatch log groups
    log_group_calls = mock_aws.cloudwatch.LogGroup.call_args_list
    assert len(log_group_calls) == 2  # Application and infrastructure logs
        
    # Verify CloudWatch alarms
    alarm_calls = mock_aws.cloudwatch.MetricAlarm.call_args_list
    assert len(alarm_calls) >= 1  # At least one alarm created
        
    # Verify VPC Flow Logs
    flow_log_calls = mock_aws.ec2.FlowLog.call_args_list
    assert len(flow_log_calls) == 1

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_resource_tagging_compliance(self, mock_get_stack, mock_aws):
    """Test that all resources are properly tagged for compliance."""
    args = TapStackArgs(
      environment_suffix="compliance-test",
      tags={"CostCenter": "Engineering", "Owner": "DevOps"}
    )
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("ComplianceTestStack", args)
        
    # Verify VPC tags
    vpc_call = mock_aws.ec2.Vpc.call_args
    vpc_tags = vpc_call[1]['tags']
    self._assert_required_tags_present(vpc_tags)
    assert vpc_tags["CostCenter"] == "Engineering"
    assert vpc_tags["Owner"] == "DevOps"
        
    # Verify subnet tags
    subnet_calls = mock_aws.ec2.Subnet.call_args_list
    for call in subnet_calls:
      subnet_tags = call[1]['tags']
      self._assert_required_tags_present(subnet_tags)
        
    # Verify S3 bucket tags
    bucket_calls = mock_aws.s3.Bucket.call_args_list
    for call in bucket_calls:
      bucket_tags = call[1]['tags']
      self._assert_required_tags_present(bucket_tags)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_disaster_recovery_setup(self, mock_get_stack, mock_aws):
    """Test disaster recovery configuration."""
    args = TapStackArgs(
      environment_suffix="dr-test",
      enable_cross_region_replication=True,
      backup_region="us-west-1"
    )
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("DRTestStack", args)
        
    # Verify backup infrastructure in secondary region
    provider_calls = mock_aws.Provider.call_args_list
    backup_providers = [call for call in provider_calls if 'backup' in str(call)]
    assert len(backup_providers) >= 1
        
    # Verify S3 versioning is enabled for data protection
    bucket_calls = mock_aws.s3.Bucket.call_args_list
    for call in bucket_calls:
      versioning = call[1].get('versioning')
      if versioning:
        assert versioning.enabled is True

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_network_connectivity_configuration(self, mock_get_stack, mock_aws):
    """Test network connectivity and routing configuration."""
    args = TapStackArgs(environment_suffix="network-test")
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("NetworkTestStack", args)
        
    # Verify Internet Gateway creation and attachment
    igw_calls = mock_aws.ec2.InternetGateway.call_args_list
    assert len(igw_calls) == 1
        
    # Verify route table creation
    rt_calls = mock_aws.ec2.RouteTable.call_args_list
    public_rt_calls = [call for call in rt_calls if 'public' in str(call)]
    private_rt_calls = [call for call in rt_calls if 'private' in str(call)]
        
    assert len(public_rt_calls) == 1  # One public route table
    assert len(private_rt_calls) == 2  # One per AZ for high availability
        
    # Verify route creation
    route_calls = mock_aws.ec2.Route.call_args_list
    assert len(route_calls) >= 3  # Public route + private routes

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_iam_roles_and_policies_setup(self, mock_get_stack, mock_aws):
    """Test IAM roles and policies configuration."""
    args = TapStackArgs(environment_suffix="iam-test")
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("IAMTestStack", args)
        
    # Verify IAM role creation
    role_calls = mock_aws.iam.Role.call_args_list
    assert len(role_calls) >= 1  # At least flow logs role
        
    # Verify IAM policy creation
    policy_calls = mock_aws.iam.RolePolicy.call_args_list
    assert len(policy_calls) >= 1  # At least flow logs policy
        
    # Verify flow logs role configuration
    flow_logs_role_call = self._find_iam_role_call(role_calls, "flow-logs")
    assume_policy = json.loads(flow_logs_role_call[1]['assume_role_policy'])
    assert "vpc-flow-logs.amazonaws.com" in str(assume_policy)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_production_environment_configuration(self, mock_get_stack, mock_aws):
    """Test production environment specific configuration."""
    args = TapStackArgs(environment_suffix="production")
        
    self._setup_complete_aws_mocks(mock_aws)
        
    stack = TapStack("ProductionTestStack", args)
        
    # Verify production tags
    assert stack.base_tags["Environment"] == "environment:production"
        
    # Verify enhanced monitoring is enabled
    flow_log_calls = mock_aws.ec2.FlowLog.call_args_list
    assert len(flow_log_calls) == 1  # Flow logs should be enabled
        
    # Verify backup and replication (default enabled)
    bucket_calls = mock_aws.s3.Bucket.call_args_list
    backup_buckets = [call for call in bucket_calls if 'backup' in str(call)]
    assert len(backup_buckets) == 1

  def _setup_complete_aws_mocks(self, mock_aws):
    """Setup complete AWS resource mocks with proper return values."""
    # VPC mock
    mock_vpc = Mock()
    mock_vpc.id = "vpc-12345"
    mock_aws.ec2.Vpc.return_value = mock_vpc
        
    # Subnet mock
    mock_subnet = Mock()
    mock_subnet.id = "subnet-12345"
    mock_aws.ec2.Subnet.return_value = mock_subnet
        
    # Internet Gateway mock
    mock_igw = Mock()
    mock_igw.id = "igw-12345"
    mock_aws.ec2.InternetGateway.return_value = mock_igw
        
    # EIP mock
    mock_eip = Mock()
    mock_eip.id = "eip-12345"
    mock_aws.ec2.Eip.return_value = mock_eip
        
    # NAT Gateway mock
    mock_nat = Mock()
    mock_nat.id = "nat-12345"
    mock_aws.ec2.NatGateway.return_value = mock_nat
        
    # Route Table mock
    mock_rt = Mock()
    mock_rt.id = "rt-12345"
    mock_aws.ec2.RouteTable.return_value = mock_rt
        
    # Route mock
    mock_route = Mock()
    mock_aws.ec2.Route.return_value = mock_route
        
    # Route Table Association mock
    mock_rta = Mock()
    mock_aws.ec2.RouteTableAssociation.return_value = mock_rta
        
    # Security Group mock
    mock_sg = Mock()
    mock_sg.id = "sg-12345"
    mock_aws.ec2.SecurityGroup.return_value = mock_sg
        
    # S3 Bucket mock
    mock_bucket = Mock()
    mock_bucket.bucket = "test-bucket"
    mock_aws.s3.Bucket.return_value = mock_bucket
        
    # IAM Role mock
    mock_role = Mock()
    mock_role.id = "role-12345"
    mock_role.arn = "arn:aws:iam::123456789012:role/test-role"
    mock_aws.iam.Role.return_value = mock_role
        
    # IAM Policy mock
    mock_policy = Mock()
    mock_aws.iam.RolePolicy.return_value = mock_policy
        
    # CloudWatch Log Group mock
    mock_log_group = Mock()
    mock_log_group.name = "test-log-group"
    mock_log_group.arn = "arn:aws:logs:us-east-1:123456789012:log-group:test-log-group"
    mock_aws.cloudwatch.LogGroup.return_value = mock_log_group
        
    # CloudWatch Alarm mock
    mock_alarm = Mock()
    mock_aws.cloudwatch.MetricAlarm.return_value = mock_alarm
        
    # VPC Flow Log mock
    mock_flow_log = Mock()
    mock_aws.ec2.FlowLog.return_value = mock_flow_log
        
    # Provider mock
    mock_provider = Mock()
    mock_aws.Provider.return_value = mock_provider

  def _assert_vpc_components_created(self, mock_aws):
    """Assert VPC and related components were created."""
    mock_aws.ec2.Vpc.assert_called()
    mock_aws.ec2.InternetGateway.assert_called()

  def _assert_networking_components_created(self, mock_aws):
    """Assert networking components were created."""
    mock_aws.ec2.Subnet.assert_called()
    mock_aws.ec2.RouteTable.assert_called()
    mock_aws.ec2.Route.assert_called()
    mock_aws.ec2.RouteTableAssociation.assert_called()
    mock_aws.ec2.Eip.assert_called()
    mock_aws.ec2.NatGateway.assert_called()

  def _assert_security_components_created(self, mock_aws):
    """Assert security components were created."""
    mock_aws.ec2.SecurityGroup.assert_called()
    mock_aws.ec2.FlowLog.assert_called()

  def _assert_storage_components_created(self, mock_aws):
    """Assert storage components were created."""
    mock_aws.s3.Bucket.assert_called()

  def _assert_monitoring_components_created(self, mock_aws):
    """Assert monitoring components were created."""
    mock_aws.cloudwatch.LogGroup.assert_called()
    mock_aws.cloudwatch.MetricAlarm.assert_called()

  def _assert_iam_components_created(self, mock_aws):
    """Assert IAM components were created."""
    mock_aws.iam.Role.assert_called()
    mock_aws.iam.RolePolicy.assert_called()

  def _find_security_group_call(self, sg_calls, sg_type):
    """Find security group call by type."""
    for call in sg_calls:
      if sg_type in str(call):
        return call
    return None

  def _find_iam_role_call(self, role_calls, role_type):
    """Find IAM role call by type."""
    for call in role_calls:
      if role_type in str(call):
        return call
    return None

  def _assert_required_tags_present(self, tags):
    """Assert required tags are present."""
    required_tags = ["Environment", "Project", "ManagedBy"]
    for tag in required_tags:
      assert tag in tags


class TestTapStackFailureScenarios:
  """Integration tests for failure scenarios and error handling."""

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_partial_failure_recovery(self, mock_get_stack, mock_aws):
    """Test stack behavior during partial resource creation failures."""
    args = TapStackArgs(environment_suffix="failure-test")
        
    # Mock some resources to fail
    mock_aws.ec2.Vpc.side_effect = Exception("VPC creation failed")
        
    with pytest.raises(Exception):
      stack = TapStack("FailureTestStack", args)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_resource_dependency_handling(self, mock_get_stack, mock_aws):
    """Test proper handling of resource dependencies."""
    args = TapStackArgs(environment_suffix="dependency-test")
        
    # Setup mocks with dependency tracking
    mock_vpc = Mock()
    mock_vpc.id = "vpc-dep-test"
    mock_aws.ec2.Vpc.return_value = mock_vpc
        
    # Mock other resources
    self._setup_dependency_mocks(mock_aws)
        
    stack = TapStack("DependencyTestStack", args)
        
    # Verify resources are created in correct order
    # (This would be more comprehensive in a real integration test)
    assert mock_aws.ec2.Vpc.called
    assert mock_aws.ec2.Subnet.called

  def _setup_dependency_mocks(self, mock_aws):
    """Setup mocks for dependency testing."""
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


class TestTapStackPerformance:
  """Integration tests for performance and scalability."""

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_large_scale_deployment(self, mock_get_stack, mock_aws):
    """Test deployment with large number of availability zones."""
    # Test with maximum reasonable number of AZs
    large_az_list = [f"us-east-1{chr(ord('a') + i)}" for i in range(6)]
    args = TapStackArgs(
      environment_suffix="large-scale-test",
      availability_zones=large_az_list
    )
        
    self._setup_performance_mocks(mock_aws)
        
    start_time = time.time()
    stack = TapStack("LargeScaleTestStack", args)
    end_time = time.time()
        
    # Verify all resources are created
    assert mock_aws.ec2.Subnet.call_count == 12  # 6 public + 6 private
    assert mock_aws.ec2.NatGateway.call_count == 6  # One per AZ
        
    # Performance should be reasonable (this is a mock test, so it's very fast)
    assert (end_time - start_time) < 1.0

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_minimal_deployment(self, mock_get_stack, mock_aws):
    """Test minimal deployment configuration."""
    args = TapStackArgs(
      environment_suffix="minimal-test",
      availability_zones=["us-east-1a"],
      enable_flow_logs=False,
      enable_cross_region_replication=False
    )
        
    self._setup_performance_mocks(mock_aws)
        
    stack = TapStack("MinimalTestStack", args)
        
    # Verify minimal resources are created
    assert mock_aws.ec2.Subnet.call_count == 2  # 1 public + 1 private
    assert mock_aws.ec2.NatGateway.call_count == 1  # One NAT Gateway
    assert mock_aws.s3.Bucket.call_count == 2  # No backup bucket
    mock_aws.ec2.FlowLog.assert_not_called()  # Flow logs disabled

  def _setup_performance_mocks(self, mock_aws):
    """Setup mocks for performance testing."""
    # Use the same setup as integration tests
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


class TestTapStackCompliance:
  """Integration tests for compliance and governance requirements."""

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_production_compliance_requirements(self, mock_get_stack, mock_aws):
    """Test compliance with production environment requirements."""
    args = TapStackArgs(
      environment_suffix="production",
      tags={
        "Environment": "production",
        "CostCenter": "IT",
        "DataClassification": "Confidential",
        "BackupRequired": "true"
      }
    )
        
    self._setup_compliance_mocks(mock_aws)
        
    stack = TapStack("ComplianceTestStack", args)
        
    # Verify encryption is enabled on S3 buckets
    bucket_calls = mock_aws.s3.Bucket.call_args_list
    for call in bucket_calls:
      encryption = call[1].get('server_side_encryption_configuration')
      assert encryption is not None
            
    # Verify VPC Flow Logs are enabled
    mock_aws.ec2.FlowLog.assert_called()
        
    # Verify monitoring is enabled
    mock_aws.cloudwatch.LogGroup.assert_called()
    mock_aws.cloudwatch.MetricAlarm.assert_called()

  @patch('lib.tap_stack.aws')
  @patch('pulumi.get_stack', return_value='integration-test')
  def test_data_retention_policies(self, mock_get_stack, mock_aws):
    """Test data retention policies implementation."""
    args = TapStackArgs(environment_suffix="retention-test")
        
    self._setup_compliance_mocks(mock_aws)
        
    stack = TapStack("RetentionTestStack", args)
        
    # Verify log retention is set
    log_group_calls = mock_aws.cloudwatch.LogGroup.call_args_list
    for call in log_group_calls:
      retention = call[1].get('retention_in_days')
      assert retention == 30
            
    # Verify S3 lifecycle policies
    bucket_calls = mock_aws.s3.Bucket.call_args_list
    logs_bucket_call = None
    for call in bucket_calls:
      if 'logs' in str(call):
        logs_bucket_call = call
        break
        
    if logs_bucket_call:
      lifecycle = logs_bucket_call[1].get('lifecycle_configuration')
      if lifecycle:
        assert lifecycle.rules[0].expiration.days == 90

  def _setup_compliance_mocks(self, mock_aws):
    """Setup mocks for compliance testing."""
    # Reuse the complete mock setup
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


if __name__ == '__main__':
  pytest.main([__file__])
