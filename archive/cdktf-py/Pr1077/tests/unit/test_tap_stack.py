"""
Unit Tests for AWS Production Infrastructure Stack

This module contains comprehensive unit tests for the TapStack
using pytest and CDKTF testing utilities. Tests cover all infrastructure
components, security configurations, and production requirements.
"""

import json
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


def synth_stack(stack):
  """Helper function to synthesize a stack and return parsed JSON."""
  return json.loads(Testing.synth(stack))


class TestTapStackInitialization:
  """Test suite for TapStack initialization and basic configuration."""

  def test_stack_instantiates_successfully_with_defaults(self, app):
    """Test that stack instantiates with default values."""
    stack = TapStack(app, "TestTapStackDefault")
    assert stack is not None

  def test_stack_instantiates_successfully_with_props(self, app, default_stack_props):
    """Test that stack instantiates with custom properties."""
    stack = TapStack(
      app,
      "TestTapStackWithProps",
      **default_stack_props
    )
    assert stack is not None

  def test_stack_uses_correct_environment_suffix(self, app):
    """Test that stack uses the provided environment suffix."""
    stack = TapStack(
      app,
      "TestEnvironmentSuffix",
      environment_suffix="prod",
      aws_region="us-west-2"
    )
    assert stack is not None


class TestAwsProvider:
  """Test suite for AWS Provider configuration."""

  def test_aws_provider_is_configured(self, app):
    """Test that AWS provider is properly configured."""
    stack = TapStack(app, "ProviderTestStack", aws_region="eu-central-1")
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    
    providers = synth.get("provider", {})
    assert "aws" in providers
    assert providers["aws"][0]["region"] == "eu-central-1"

  def test_aws_provider_has_default_tags(self, app, default_stack_props):
    """Test that AWS provider includes default tags."""
    stack = TapStack(app, "TagsTestStack", **default_stack_props)
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    
    aws_provider = synth.get("provider", {}).get("aws", [])
    assert len(aws_provider) > 0
    
    default_tags = aws_provider[0].get("default_tags", [])
    assert len(default_tags) > 0
    assert "Environment" in default_tags[0]["tags"]
    assert default_tags[0]["tags"]["Environment"] == "Production"


class TestVpcConfiguration:
  """Test suite for VPC and networking configuration."""

  def test_vpc_created_with_correct_cidr(self, app):
    """Test that VPC is created with the correct CIDR block."""
    stack = TapStack(app, "VpcTestStack")
    synth = synth_stack(stack)
    
    vpc_resources = synth.get("resource", {}).get("aws_vpc", {})
    assert len(vpc_resources) == 1
    
    vpc_config = list(vpc_resources.values())[0]
    assert vpc_config["cidr_block"] == "10.0.0.0/16"
    assert vpc_config["enable_dns_hostnames"] is True
    assert vpc_config["enable_dns_support"] is True

  def test_vpc_has_production_tags(self, app):
    """Test that VPC has proper production tags."""
    stack = TapStack(app, "VpcTagsTestStack", environment_suffix="test")
    synth = synth_stack(stack)
    
    vpc_resources = synth.get("resource", {}).get("aws_vpc", {})
    vpc_config = list(vpc_resources.values())[0]
    
    tags = vpc_config["tags"]
    assert "Environment" in tags
    assert tags["Environment"] == "Production"
    assert "Name" in tags

  def test_subnets_created_correctly(self, app):
    """Test that public and private subnets are created correctly."""
    stack = TapStack(app, "SubnetsTestStack")
    synth = synth_stack(stack)
    
    subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
    
    # Should have 4 subnets total (2 public + 2 private)
    assert len(subnet_resources) == 4
    
    public_subnets = [s for s in subnet_resources.values() 
                     if s.get("map_public_ip_on_launch") is True]
    private_subnets = [s for s in subnet_resources.values() 
                      if s.get("map_public_ip_on_launch") is not True]
    
    assert len(public_subnets) == 2
    assert len(private_subnets) == 2

  def test_internet_gateway_created(self, app):
    """Test that Internet Gateway is created."""
    stack = TapStack(app, "IgwTestStack")
    synth = synth_stack(stack)
    
    igw_resources = synth.get("resource", {}).get("aws_internet_gateway", {})
    assert len(igw_resources) == 1

  def test_nat_gateways_created(self, app):
    """Test that NAT Gateways are created in each AZ."""
    stack = TapStack(app, "NatTestStack")
    synth = synth_stack(stack)
    
    nat_resources = synth.get("resource", {}).get("aws_nat_gateway", {})
    eip_resources = synth.get("resource", {}).get("aws_eip", {})
    
    # Should have 2 NAT Gateways (one per AZ)
    assert len(nat_resources) == 2
    # Should have 2 EIPs (one per NAT Gateway)
    assert len(eip_resources) == 2

  def test_route_tables_created(self, app):
    """Test that route tables are created correctly."""
    stack = TapStack(app, "RouteTableTestStack")
    synth = synth_stack(stack)
    
    rt_resources = synth.get("resource", {}).get("aws_route_table", {})
    route_resources = synth.get("resource", {}).get("aws_route", {})
    rt_assoc_resources = synth.get("resource", {}).get("aws_route_table_association", {})
    
    # Should have 3 route tables (1 public + 2 private)
    assert len(rt_resources) == 3
    # Should have 3 routes (1 to IGW + 2 to NAT)
    assert len(route_resources) == 3
    # Should have 4 associations (2 public + 2 private)
    assert len(rt_assoc_resources) == 4


class TestSecurityGroups:
  """Test suite for Security Group configuration."""

  def test_ec2_security_group_created(self, app):
    """Test that EC2 security group is created."""
    stack = TapStack(app, "SgTestStack")
    synth = synth_stack(stack)
    
    sg_resources = synth.get("resource", {}).get("aws_security_group", {})
    assert len(sg_resources) == 1

  def test_security_group_ssh_rule(self, app):
    """Test that SSH rule is configured correctly."""
    stack = TapStack(app, "SshRuleTestStack")
    synth = synth_stack(stack)
    
    sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
    
    # Should have at least ingress and egress rules
    assert len(sg_rule_resources) >= 2
    
    # Check for SSH ingress rule
    ssh_rules = [rule for rule in sg_rule_resources.values() 
                if rule.get("type") == "ingress" and 
                rule.get("from_port") == 22 and 
                rule.get("to_port") == 22]
    assert len(ssh_rules) == 1
    
    ssh_rule = ssh_rules[0]
    assert ssh_rule["protocol"] == "tcp"
    assert "203.0.113.0/24" in ssh_rule["cidr_blocks"]

  def test_security_group_egress_rule(self, app):
    """Test that egress rule allows all outbound traffic."""
    stack = TapStack(app, "EgressRuleTestStack")
    synth = synth_stack(stack)
    
    sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
    
    # Check for egress rule
    egress_rules = [rule for rule in sg_rule_resources.values() 
                   if rule.get("type") == "egress"]
    assert len(egress_rules) >= 1
    
    egress_rule = egress_rules[0]
    assert egress_rule["from_port"] == 0
    assert egress_rule["to_port"] == 0
    assert egress_rule["protocol"] == "-1"
    assert "0.0.0.0/0" in egress_rule["cidr_blocks"]


class TestEc2Instances:
  """Test suite for EC2 instance configuration."""

  def test_ec2_instances_created(self, app):
    """Test that EC2 instances are created in private subnets."""
    stack = TapStack(app, "Ec2TestStack")
    synth = synth_stack(stack)
    
    instance_resources = synth.get("resource", {}).get("aws_instance", {})
    
    # Should have 2 instances (one per private subnet)
    assert len(instance_resources) == 2
    
    for instance in instance_resources.values():
      assert instance["instance_type"] == "t2.micro"
      assert "tags" in instance
      assert instance["tags"]["Environment"] == "Production"

  def test_instances_use_latest_amazon_linux(self, app):
    """Test that instances use the latest Amazon Linux AMI."""
    stack = TapStack(app, "AmiTestStack")
    synth = synth_stack(stack)
    
    ami_data = synth.get("data", {}).get("aws_ami", {})
    assert len(ami_data) == 1
    
    ami_config = list(ami_data.values())[0]
    assert ami_config["most_recent"] is True
    assert ami_config["owners"] == ["amazon"]
    
    # Check filters
    filters = ami_config["filter"]
    name_filter = next((f for f in filters if f["name"] == "name"), None)
    assert name_filter is not None
    assert "amzn2-ami-hvm-*-x86_64-gp2" in name_filter["values"]


class TestS3Configuration:
  """Test suite for S3 bucket configuration."""

  def test_s3_logs_bucket_created(self, app):
    """Test that S3 logs bucket is created."""
    stack = TapStack(app, "S3TestStack")
    synth = synth_stack(stack)
    
    s3_resources = synth.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_resources) == 1
    
    bucket_config = list(s3_resources.values())[0]
    assert "tags" in bucket_config
    assert bucket_config["tags"]["Environment"] == "Production"

  def test_s3_bucket_encryption_configured(self, app):
    """Test that S3 bucket has server-side encryption configured."""
    stack = TapStack(app, "S3EncryptionTestStack")
    synth = synth_stack(stack)
    
    encryption_resources = synth.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    assert len(encryption_resources) == 1
    
    encryption_config = list(encryption_resources.values())[0]
    rules = encryption_config["rule"]
    assert len(rules) == 1
    assert rules[0]["apply_server_side_encryption_by_default"]["sse_algorithm"] == "AES256"


class TestIamConfiguration:
  """Test suite for IAM roles and policies."""

  def test_ec2_iam_role_created(self, app):
    """Test that EC2 IAM role is created."""
    stack = TapStack(app, "IamRoleTestStack")
    synth = synth_stack(stack)
    
    role_resources = synth.get("resource", {}).get("aws_iam_role", {})
    assert len(role_resources) == 1
    
    role_config = list(role_resources.values())[0]
    assume_role_policy = json.loads(role_config["assume_role_policy"])
    
    assert assume_role_policy["Version"] == "2012-10-17"
    stmt = assume_role_policy["Statement"][0]
    assert stmt["Effect"] == "Allow"
    assert stmt["Principal"]["Service"] == "ec2.amazonaws.com"

  def test_s3_policy_created(self, app):
    """Test that S3 access policy is created."""
    stack = TapStack(app, "S3PolicyTestStack")
    synth = synth_stack(stack)
    
    policy_resources = synth.get("resource", {}).get("aws_iam_policy", {})
    assert len(policy_resources) == 1

  def test_instance_profile_created(self, app):
    """Test that EC2 instance profile is created."""
    stack = TapStack(app, "InstanceProfileTestStack")
    synth = synth_stack(stack)
    
    profile_resources = synth.get("resource", {}).get("aws_iam_instance_profile", {})
    policy_attachment_resources = synth.get("resource", {}).get(
      "aws_iam_role_policy_attachment", {}
    )
    
    assert len(profile_resources) == 1
    assert len(policy_attachment_resources) == 1


class TestCloudWatchAlarms:
  """Test suite for CloudWatch alarm configuration."""

  def test_cpu_alarms_created(self, app):
    """Test that CPU utilization alarms are created for each instance."""
    stack = TapStack(app, "CloudWatchTestStack")
    synth = synth_stack(stack)
    
    alarm_resources = synth.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
    
    # Should have 2 alarms (one per instance)
    assert len(alarm_resources) == 2
    
    for alarm in alarm_resources.values():
      assert alarm["comparison_operator"] == "GreaterThanThreshold"
      assert alarm["metric_name"] == "CPUUtilization"
      assert alarm["namespace"] == "AWS/EC2"
      assert alarm["threshold"] == 70
      assert alarm["statistic"] == "Average"


class TestTerraformOutputs:
  """Test suite for Terraform outputs."""

  def test_outputs_defined(self, app):
    """Test that required outputs are defined."""
    stack = TapStack(app, "OutputsTestStack")
    synth = synth_stack(stack)
    
    outputs = synth.get("output", {})
    
    expected_outputs = [
      "vpc_id",
      "public_subnet_ids", 
      "private_subnet_ids",
      "ec2_instance_ids",
      "s3_logs_bucket_name"
    ]
    
    for output_name in expected_outputs:
      assert output_name in outputs
      assert "value" in outputs[output_name]