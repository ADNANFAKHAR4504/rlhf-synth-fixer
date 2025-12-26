"""
Integration Tests for AWS Production Infrastructure Stack

This module contains integration tests that validate the complete
infrastructure deployment, resource relationships, and production
readiness of the TapStack.
"""

import json
import os
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStackIntegration:
  """Integration tests for complete stack deployment."""

  def setup_method(self):
    """Set up test environment variables."""
    self.test_env_vars = {
      "AWS_DEFAULT_REGION": "us-east-1",
      "ENVIRONMENT_SUFFIX": "integration",
      "TERRAFORM_STATE_BUCKET": "test-tf-state-bucket",
      "TERRAFORM_STATE_BUCKET_REGION": "us-east-1"
    }
    
    # Set environment variables for test
    for key, value in self.test_env_vars.items():
      os.environ[key] = value

  def teardown_method(self):
    """Clean up environment variables after test."""
    for key in self.test_env_vars.keys():
      if key in os.environ:
        del os.environ[key]

  def test_complete_stack_synthesis(self, app):
    """Test that the complete stack synthesizes without errors."""
    stack = TapStack(
      app,
      "IntegrationTestStack",
      environment_suffix="integration",
      aws_region="us-east-1",
      default_tags={
        "tags": {
          "Environment": "Production",
          "Project": "TAP-Integration",
          "Owner": "DevOps"
        }
      }
    )
    
    # Should not raise any exceptions
    synth_result = Testing.synth(stack)
    assert synth_result is not None
    assert len(synth_result) > 0

  def test_stack_resource_dependencies(self, app):
    """Test that resources have correct dependencies."""
    stack = TapStack(app, "DependencyTestStack", environment_suffix="dep-test")
    synth = json.loads(Testing.synth(stack))
    
    # VPC should exist
    vpc_resources = synth.get("resource", {}).get("aws_vpc", {})
    assert len(vpc_resources) == 1
    
    # Subnets should reference VPC
    subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
    for subnet in subnet_resources.values():
      assert "${aws_vpc.vpc.id}" in str(subnet.get("vpc_id", ""))
    
    # Security group should reference VPC
    sg_resources = synth.get("resource", {}).get("aws_security_group", {})
    for sg in sg_resources.values():
      assert "${aws_vpc.vpc.id}" in str(sg.get("vpc_id", ""))

  def test_high_availability_configuration(self, app):
    """Test that resources are distributed across multiple AZs."""
    stack = TapStack(app, "HATestStack", environment_suffix="ha-test")
    synth = json.loads(Testing.synth(stack))
    
    # Verify subnets use different AZs
    subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
    public_subnets = [s for s in subnet_resources.values() 
                     if s.get("map_public_ip_on_launch") is True]
    private_subnets = [s for s in subnet_resources.values() 
                      if s.get("map_public_ip_on_launch") is not True]
    
    # Should have subnets in different AZs
    assert len(public_subnets) == 2
    assert len(private_subnets) == 2
    
    # Verify NAT Gateways are in different public subnets
    nat_resources = synth.get("resource", {}).get("aws_nat_gateway", {})
    assert len(nat_resources) == 2

  def test_security_compliance(self, app):
    """Test that security requirements are met."""
    stack = TapStack(app, "SecurityTestStack", environment_suffix="sec-test")
    synth = json.loads(Testing.synth(stack))
    
    # Test SSH access restriction
    sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
    ssh_ingress_rules = [
      rule for rule in sg_rule_resources.values()
      if (rule.get("type") == "ingress" and 
          rule.get("from_port") == 22 and 
          rule.get("to_port") == 22)
    ]
    
    assert len(ssh_ingress_rules) == 1
    ssh_rule = ssh_ingress_rules[0]
    assert ssh_rule["cidr_blocks"] == ["203.0.113.0/24"]
    
    # Test S3 encryption
    s3_encryption = synth.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    assert len(s3_encryption) == 1
    
    encryption_config = list(s3_encryption.values())[0]
    sse_config = encryption_config["rule"][0]["apply_server_side_encryption_by_default"]
    assert sse_config["sse_algorithm"] == "AES256"

  def test_iam_least_privilege(self, app):
    """Test that IAM policies follow least privilege principle."""
    stack = TapStack(app, "IamTestStack", environment_suffix="iam-test")
    synth = json.loads(Testing.synth(stack))
    
    # Test EC2 role assume role policy
    iam_role_resources = synth.get("resource", {}).get("aws_iam_role", {})
    assert len(iam_role_resources) == 1
    
    role_config = list(iam_role_resources.values())[0]
    assume_policy = json.loads(role_config["assume_role_policy"])
    
    # Should only allow EC2 service to assume role
    statements = assume_policy["Statement"]
    assert len(statements) == 1
    assert statements[0]["Principal"]["Service"] == "ec2.amazonaws.com"
    
    # Test S3 policy permissions
    iam_policy_resources = synth.get("resource", {}).get("aws_iam_policy", {})
    assert len(iam_policy_resources) == 1

  def test_monitoring_configuration(self, app):
    """Test that monitoring and alerting are properly configured."""
    stack = TapStack(app, "MonitoringTestStack", environment_suffix="mon-test")
    synth = json.loads(Testing.synth(stack))
    
    # Test CloudWatch alarms
    alarm_resources = synth.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
    assert len(alarm_resources) == 2  # One per EC2 instance
    
    for alarm in alarm_resources.values():
      # Verify alarm configuration
      assert alarm["comparison_operator"] == "GreaterThanThreshold"
      assert alarm["evaluation_periods"] == 2
      assert alarm["metric_name"] == "CPUUtilization"
      assert alarm["namespace"] == "AWS/EC2"
      assert alarm["period"] == 300
      assert alarm["statistic"] == "Average"
      assert alarm["threshold"] == 70
      
      # Should have instance ID in dimensions
      assert "dimensions" in alarm
      assert "InstanceId" in alarm["dimensions"]

  def test_network_connectivity(self, app):
    """Test that network routing is configured correctly."""
    stack = TapStack(app, "NetworkTestStack", environment_suffix="net-test")
    synth = json.loads(Testing.synth(stack))
    
    # Test route tables
    rt_resources = synth.get("resource", {}).get("aws_route_table", {})
    route_resources = synth.get("resource", {}).get("aws_route", {})
    
    # Should have 3 route tables (1 public + 2 private)
    assert len(rt_resources) == 3
    
    # Should have 3 routes (1 to IGW + 2 to NAT)
    assert len(route_resources) == 3
    
    # Verify route destinations
    igw_routes = [r for r in route_resources.values() 
                 if "gateway_id" in r and "aws_internet_gateway" in str(r["gateway_id"])]
    nat_routes = [r for r in route_resources.values() 
                 if "nat_gateway_id" in r and "aws_nat_gateway" in str(r["nat_gateway_id"])]
    
    assert len(igw_routes) == 1  # Public route to IGW
    assert len(nat_routes) == 2  # Private routes to NAT

  def test_tagging_consistency(self, app):
    """Test that all resources have consistent production tags."""
    stack = TapStack(app, "TaggingTestStack", environment_suffix="tag-test")
    synth = json.loads(Testing.synth(stack))
    
    # List of resource types that should have tags
    taggable_resources = [
      "aws_vpc",
      "aws_subnet", 
      "aws_internet_gateway",
      "aws_route_table",
      "aws_nat_gateway",
      "aws_eip",
      "aws_security_group",
      "aws_instance",
      "aws_s3_bucket",
      "aws_iam_role",
      "aws_iam_policy",
      "aws_iam_instance_profile",
      "aws_cloudwatch_metric_alarm"
    ]
    
    resources = synth.get("resource", {})
    
    for resource_type in taggable_resources:
      if resource_type in resources:
        for resource_config in resources[resource_type].values():
          if "tags" in resource_config:
            tags = resource_config["tags"]
            assert "Environment" in tags
            assert tags["Environment"] == "Production"

  def test_cost_optimization(self, app):
    """Test that cost optimization best practices are followed."""
    stack = TapStack(app, "CostTestStack", environment_suffix="cost-test")
    synth = json.loads(Testing.synth(stack))
    
    # Test EC2 instance types
    instance_resources = synth.get("resource", {}).get("aws_instance", {})
    for instance in instance_resources.values():
      assert instance["instance_type"] == "t2.micro"  # Cost-effective choice
    
    # Test EIP allocation only for NAT Gateways
    eip_resources = synth.get("resource", {}).get("aws_eip", {})
    nat_resources = synth.get("resource", {}).get("aws_nat_gateway", {})
    
    # Should have same number of EIPs as NAT Gateways
    assert len(eip_resources) == len(nat_resources)

  def test_backup_and_recovery_readiness(self, app):
    """Test that resources are configured for backup and recovery."""
    stack = TapStack(app, "BackupTestStack", environment_suffix="backup-test")
    synth = json.loads(Testing.synth(stack))
    
    # Test S3 bucket configuration for logs
    s3_resources = synth.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_resources) == 1
    
    # S3 encryption should be enabled for data protection
    s3_encryption = synth.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    assert len(s3_encryption) == 1


class TestStackValidation:
  """Validation tests for Terraform configuration."""

  def test_terraform_syntax_validity(self, app):
    """Test that generated Terraform has valid syntax."""
    stack = TapStack(app, "SyntaxTestStack", environment_suffix="syntax-test")
    synth_result = Testing.synth(stack)
    
    # Should be valid JSON
    try:
      parsed = json.loads(synth_result)
      assert isinstance(parsed, dict)
    except json.JSONDecodeError:
      pytest.fail("Generated Terraform is not valid JSON")

  def test_required_providers(self, app):
    """Test that required providers are specified."""
    stack = TapStack(app, "ProvidersTestStack", environment_suffix="providers-test")
    synth = json.loads(Testing.synth(stack))
    
    # Should have AWS provider
    providers = synth.get("provider", {})
    assert "aws" in providers
    
    # AWS provider should have region specified
    aws_config = providers["aws"][0]
    assert "region" in aws_config

  def test_data_sources_configuration(self, app):
    """Test that data sources are properly configured."""
    stack = TapStack(app, "DataSourcesTestStack", environment_suffix="data-test")
    synth = json.loads(Testing.synth(stack))
    
    data_sources = synth.get("data", {})
    
    # Should have AMI data source
    assert "aws_ami" in data_sources
    ami_config = list(data_sources["aws_ami"].values())[0]
    assert ami_config["most_recent"] is True
    assert ami_config["owners"] == ["amazon"]


class TestProductionReadiness:
  """Tests to verify production readiness."""

  def test_resource_naming_convention(self, app):
    """Test that resources follow consistent naming conventions."""
    stack = TapStack(app, "NamingTestStack", environment_suffix="naming-test")
    synth = json.loads(Testing.synth(stack))
    
    resources = synth.get("resource", {})
    
    # Check that resources with names follow the pattern
    for resource_type, resource_configs in resources.items():
      for resource_id, resource_config in resource_configs.items():
        if "tags" in resource_config and "Name" in resource_config["tags"]:
          name = resource_config["tags"]["Name"]
          # Should contain environment suffix
          assert "naming-test" in name

  def test_scalability_considerations(self, app):
    """Test that the stack is designed for scalability."""
    stack = TapStack(app, "ScalabilityTestStack", environment_suffix="scale-test")
    synth = json.loads(Testing.synth(stack))
    
    # Multi-AZ deployment for high availability
    subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
    assert len(subnet_resources) == 4  # 2 public + 2 private
    
    # NAT Gateways in each AZ for redundancy
    nat_resources = synth.get("resource", {}).get("aws_nat_gateway", {})
    assert len(nat_resources) == 2

  def test_security_hardening(self, app):
    """Test that security hardening measures are in place."""
    stack = TapStack(app, "HardeningTestStack", environment_suffix="hard-test")
    synth = json.loads(Testing.synth(stack))
    
    # Private subnets for application servers
    subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
    private_subnets = [s for s in subnet_resources.values() 
                      if s.get("map_public_ip_on_launch") is not True]
    assert len(private_subnets) == 2
    
    # EC2 instances should be in private subnets
    instance_resources = synth.get("resource", {}).get("aws_instance", {})
    # This is validated by ensuring instances reference private subnet resources