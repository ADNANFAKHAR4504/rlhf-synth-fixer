"""
Comprehensive Unit Tests for TapStack CDKTF Infrastructure

This module contains unit tests for the TapStack using pytest and CDKTF
testing utilities. Tests cover all infrastructure components, configurations,
security settings, and outputs following best practices from the archive.
"""

import json
import pytest
from cdktf import Testing, App

from lib.tap_stack import TapStack


class TestTapStack:
  """Unit test suite for TapStack CDKTF infrastructure."""

  @pytest.fixture
  def app(self):
    """Create a CDKTF App instance for testing."""
    return App()

  @pytest.fixture
  def stack(self, app):
    """Create a TapStack instance for testing."""
    return TapStack(
      app,
      "test-tap-stack",
      environment_suffix="test",
      aws_region="us-west-2",
      default_tags={
        "Environment": "test",
        "Owner": "test-team",
        "Project": "TAP Infrastructure Test"
      }
    )

  @pytest.fixture
  def synthesized_stack(self, stack):
    """Return the synthesized Terraform configuration as a parsed dictionary."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)

  def test_stack_initialization(self, stack):
    """Test that the stack initializes correctly."""
    assert stack is not None
    assert stack.environment_suffix == "test"
    assert stack.aws_region == "us-west-2"
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'aws_provider')

  def test_providers_configuration(self, synthesized_stack):
    """Test that AWS provider is configured correctly."""
    # Check AWS provider configuration
    aws_provider = synthesized_stack.get("provider", {}).get("aws", [])
    assert len(aws_provider) > 0

    aws_config = aws_provider[0]
    assert aws_config["region"] == "us-west-2"
    assert "default_tags" in aws_config

    # Check required providers in terraform block
    required_providers = synthesized_stack.get("terraform", {}).get("required_providers", {})
    assert "aws" in required_providers

  def test_vpc_creation(self, synthesized_stack):
    """Test VPC resource creation and configuration."""
    vpc_resources = synthesized_stack.get("resource", {}).get("aws_vpc", {})
    assert len(vpc_resources) == 1

    vpc_config = list(vpc_resources.values())[0]
    assert vpc_config["cidr_block"] == "10.0.0.0/16"
    assert vpc_config["enable_dns_hostnames"] is True
    assert vpc_config["enable_dns_support"] is True

    # Check VPC tags
    tags = vpc_config["tags"]
    assert tags["Name"] == "tap-vpc-test"
    assert tags["Environment"] == "test"
    assert tags["Component"] == "Networking"

  def test_subnets_creation(self, synthesized_stack):
    """Test that all four subnets are created with correct configurations."""
    subnet_resources = synthesized_stack.get("resource", {}).get("aws_subnet", {})
    assert len(subnet_resources) == 4

    # Expected subnet configurations
    expected_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.11.0/24", "10.0.12.0/24"]
    actual_cidrs = [config["cidr_block"] for config in subnet_resources.values()]
    
    for expected_cidr in expected_cidrs:
      assert expected_cidr in actual_cidrs

    # Check subnet tags and types
    for subnet_config in subnet_resources.values():
      tags = subnet_config["tags"]
      assert tags["Environment"] == "test"
      assert "Type" in tags
      assert tags["Type"] in ["Public", "Private"]

  def test_internet_gateway_creation(self, synthesized_stack):
    """Test Internet Gateway resource creation and configuration."""
    igw_resources = synthesized_stack.get("resource", {}).get("aws_internet_gateway", {})
    assert len(igw_resources) == 1

    igw_config = list(igw_resources.values())[0]
    assert "vpc_id" in igw_config

    # Check IGW tags
    tags = igw_config["tags"]
    assert tags["Name"] == "tap-igw-test"
    assert tags["Environment"] == "test"

  def test_nat_gateway_creation(self, synthesized_stack):
    """Test NAT Gateway and Elastic IP creation."""
    # Check Elastic IP
    eip_resources = synthesized_stack.get("resource", {}).get("aws_eip", {})
    assert len(eip_resources) == 1

    eip_config = list(eip_resources.values())[0]
    assert eip_config["domain"] == "vpc"

    # Check NAT Gateway
    nat_resources = synthesized_stack.get("resource", {}).get("aws_nat_gateway", {})
    assert len(nat_resources) == 1

    nat_config = list(nat_resources.values())[0]
    assert "allocation_id" in nat_config
    assert "subnet_id" in nat_config

    # Check NAT Gateway tags
    tags = nat_config["tags"]
    assert tags["Name"] == "tap-nat-test"
    assert tags["Environment"] == "test"

  def test_route_tables_creation(self, synthesized_stack):
    """Test route table creation and configuration."""
    route_table_resources = synthesized_stack.get("resource", {}).get("aws_route_table", {})
    assert len(route_table_resources) == 2  # Public and Private route tables

    # Check route table tags
    for rt_config in route_table_resources.values():
      tags = rt_config["tags"]
      assert tags["Environment"] == "test"

  def test_routes_creation(self, synthesized_stack):
    """Test route creation for public and private route tables."""
    route_resources = synthesized_stack.get("resource", {}).get("aws_route", {})
    assert len(route_resources) == 2  # One for IGW, one for NAT

    # All routes should target 0.0.0.0/0
    for route_config in route_resources.values():
      assert route_config["destination_cidr_block"] == "0.0.0.0/0"
      # Should have either gateway_id or nat_gateway_id
      assert "gateway_id" in route_config or "nat_gateway_id" in route_config

  def test_route_table_associations(self, synthesized_stack):
    """Test route table associations for all subnets."""
    association_resources = synthesized_stack.get("resource", {}).get(
      "aws_route_table_association", {}
    )
    assert len(association_resources) == 4  # One for each subnet

    # Each association should have subnet_id and route_table_id
    for assoc_config in association_resources.values():
      assert "subnet_id" in assoc_config
      assert "route_table_id" in assoc_config

  def test_security_groups_creation(self, synthesized_stack):
    """Test security group creation and configuration."""
    sg_resources = synthesized_stack.get("resource", {}).get("aws_security_group", {})
    assert len(sg_resources) == 2  # Web and Database security groups

    # Check for required security groups
    sg_names = []
    for sg_config in sg_resources.values():
      sg_names.append(sg_config["name"])
      
      # Check common security group properties
      assert "vpc_id" in sg_config
      assert "description" in sg_config
      
      # Check tags
      tags = sg_config["tags"]
      assert tags["Environment"] == "test"
      assert "Purpose" in tags

    # Verify we have the expected security groups
    assert any("web" in name for name in sg_names)
    assert any("db" in name for name in sg_names)

  def test_security_group_rules_creation(self, synthesized_stack):
    """Test security group rule creation and configuration."""
    sg_rule_resources = synthesized_stack.get("resource", {}).get("aws_security_group_rule", {})
    
    # Should have rules for web (HTTP ingress, HTTPS ingress, all egress) and db (MySQL ingress)
    assert len(sg_rule_resources) >= 4
    
    # Check for different types of rules
    rule_types = []
    protocols = []
    ports = []
    
    for rule_config in sg_rule_resources.values():
      assert "type" in rule_config
      assert rule_config["type"] in ["ingress", "egress"]
      assert "security_group_id" in rule_config
      assert "protocol" in rule_config
      
      rule_types.append(rule_config["type"])
      protocols.append(rule_config["protocol"])
      
      # Collect port information (may be tokens/None)
      if "from_port" in rule_config and rule_config["from_port"] is not None:
        ports.append(rule_config["from_port"])
    
    # Should have both ingress and egress rules
    assert "ingress" in rule_types
    assert "egress" in rule_types
    
    # Should have tcp protocol rules
    assert "tcp" in protocols

  def test_web_security_group_rules(self, synthesized_stack):
    """Test web security group rules are created correctly."""
    sg_rule_resources = synthesized_stack.get("resource", {}).get("aws_security_group_rule", {})
    
    # Find rules that should be for web security group (HTTP, HTTPS, all egress)
    web_related_rules = []
    for rule_name, rule_config in sg_rule_resources.items():
      if "web" in rule_name or "http" in rule_name.lower():
        web_related_rules.append(rule_config)
    
    # Should have at least 3 web-related rules (HTTP ingress, HTTPS ingress, all egress)
    assert len(web_related_rules) >= 3

  def test_database_security_group_rules(self, synthesized_stack):
    """Test database security group rules are created correctly."""
    sg_rule_resources = synthesized_stack.get("resource", {}).get("aws_security_group_rule", {})
    
    # Find rules that should be for database security group (MySQL)
    db_related_rules = []
    for rule_name, rule_config in sg_rule_resources.items():
      if "db" in rule_name or "mysql" in rule_name.lower():
        db_related_rules.append(rule_config)
    
    # Should have at least 1 database-related rule (MySQL ingress)
    assert len(db_related_rules) >= 1
    
    # Check that database rules use source_security_group_id (not cidr_blocks)
    for rule_config in db_related_rules:
      if rule_config["type"] == "ingress":
        assert "source_security_group_id" in rule_config

  def test_s3_buckets_creation(self, synthesized_stack):
    """Test S3 bucket creation and configuration."""
    s3_resources = synthesized_stack.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_resources) == 2  # App bucket and CloudTrail bucket

    for bucket_config in s3_resources.values():
      bucket_name = bucket_config["bucket"]
      assert "test" in bucket_name  # Environment suffix should be in name
      assert bucket_name.lower() == bucket_name  # Should be lowercase
      
      # Check tags
      tags = bucket_config["tags"]
      assert tags["Environment"] == "test"
      assert "Purpose" in tags

  def test_s3_bucket_encryption(self, synthesized_stack):
    """Test S3 bucket encryption configuration."""
    encryption_resources = synthesized_stack.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    assert len(encryption_resources) == 2  # One for each bucket

    for encryption_config in encryption_resources.values():
      rules = encryption_config["rule"]
      assert len(rules) == 1
      
      sse_config = rules[0]["apply_server_side_encryption_by_default"]
      assert sse_config["sse_algorithm"] == "AES256"

  def test_s3_bucket_versioning(self, synthesized_stack):
    """Test S3 bucket versioning configuration."""
    versioning_resources = synthesized_stack.get("resource", {}).get(
      "aws_s3_bucket_versioning", {}
    )
    assert len(versioning_resources) == 2  # One for each bucket

    for versioning_config in versioning_resources.values():
      assert versioning_config["versioning_configuration"]["status"] == "Enabled"

  def test_s3_bucket_public_access_block(self, synthesized_stack):
    """Test S3 bucket public access block configuration."""
    public_access_resources = synthesized_stack.get("resource", {}).get(
      "aws_s3_bucket_public_access_block", {}
    )
    assert len(public_access_resources) == 2  # One for each bucket

    for pab_config in public_access_resources.values():
      assert pab_config["block_public_acls"] is True
      assert pab_config["block_public_policy"] is True
      assert pab_config["ignore_public_acls"] is True
      assert pab_config["restrict_public_buckets"] is True

  def test_s3_bucket_policies(self, synthesized_stack):
    """Test S3 bucket policy configuration."""
    policy_resources = synthesized_stack.get("resource", {}).get(
      "aws_s3_bucket_policy", {}
    )
    assert len(policy_resources) == 2  # One for each bucket

    for policy_config in policy_resources.values():
      assert "policy" in policy_config
      # Policy should be a string containing JSON
      assert isinstance(policy_config["policy"], str)

  def test_iam_roles_creation(self, synthesized_stack):
    """Test IAM role creation and configuration."""
    iam_role_resources = synthesized_stack.get("resource", {}).get("aws_iam_role", {})
    assert len(iam_role_resources) >= 2  # App role and VPC Flow Log role

    for role_config in iam_role_resources.values():
      assert "assume_role_policy" in role_config
      assert "name" in role_config
      
      # Check tags
      tags = role_config["tags"]
      assert tags["Environment"] == "test"
      assert "Purpose" in tags

  def test_iam_policies_creation(self, synthesized_stack):
    """Test IAM policy creation and configuration."""
    iam_policy_resources = synthesized_stack.get("resource", {}).get("aws_iam_policy", {})
    assert len(iam_policy_resources) >= 2  # EC2 read-only, MFA policy, etc.

    for policy_config in iam_policy_resources.values():
      assert "policy" in policy_config
      assert "name" in policy_config
      
      # Check tags
      tags = policy_config["tags"]
      assert tags["Environment"] == "test"
      assert "Purpose" in tags

  def test_iam_user_creation(self, synthesized_stack):
    """Test IAM user creation with MFA requirements."""
    iam_user_resources = synthesized_stack.get("resource", {}).get("aws_iam_user", {})
    assert len(iam_user_resources) == 1

    user_config = list(iam_user_resources.values())[0]
    assert "name" in user_config
    
    # Check tags
    tags = user_config["tags"]
    assert tags["Environment"] == "test"
    assert tags["MFARequired"] == "true"

  def test_rds_subnet_group(self, synthesized_stack):
    """Test RDS subnet group creation."""
    subnet_group_resources = synthesized_stack.get("resource", {}).get("aws_db_subnet_group", {})
    assert len(subnet_group_resources) == 1

    subnet_group_config = list(subnet_group_resources.values())[0]
    assert "subnet_ids" in subnet_group_config
    assert len(subnet_group_config["subnet_ids"]) == 2  # Two private subnets
    
    # Check tags
    tags = subnet_group_config["tags"]
    assert tags["Environment"] == "test"
    assert tags["Purpose"] == "Database Subnet Group"

  def test_rds_instance_creation(self, synthesized_stack):
    """Test RDS instance creation and configuration."""
    rds_resources = synthesized_stack.get("resource", {}).get("aws_db_instance", {})
    assert len(rds_resources) == 1

    rds_config = list(rds_resources.values())[0]
    assert rds_config["engine"] == "mysql"
    assert rds_config["engine_version"] == "8.0"
    assert rds_config["instance_class"] == "db.t3.micro"
    assert rds_config["storage_encrypted"] is True
    assert rds_config["publicly_accessible"] is False
    assert rds_config["deletion_protection"] is True
    assert rds_config["backup_retention_period"] == 7
    
    # Check tags
    tags = rds_config["tags"]
    assert tags["Environment"] == "test"
    assert tags["Purpose"] == "Application Database"

  def test_secrets_manager_secret(self, synthesized_stack):
    """Test Secrets Manager secret creation."""
    secret_resources = synthesized_stack.get("resource", {}).get("aws_secretsmanager_secret", {})
    assert len(secret_resources) == 1

    secret_config = list(secret_resources.values())[0]
    assert "name" in secret_config
    assert "test" in secret_config["name"]  # Environment suffix
    assert secret_config["recovery_window_in_days"] == 7
    
    # Check tags
    tags = secret_config["tags"]
    assert tags["Environment"] == "test"
    assert tags["Purpose"] == "Database Credentials"

  def test_vpc_flow_logs(self, synthesized_stack):
    """Test VPC Flow Logs configuration."""
    flow_log_resources = synthesized_stack.get("resource", {}).get("aws_flow_log", {})
    assert len(flow_log_resources) == 1

    flow_log_config = list(flow_log_resources.values())[0]
    assert flow_log_config["traffic_type"] == "ALL"
    assert flow_log_config["log_destination_type"] == "cloud-watch-logs"
    assert "iam_role_arn" in flow_log_config
    assert "log_destination" in flow_log_config
    
    # Check tags
    tags = flow_log_config["tags"]
    assert tags["Environment"] == "test"
    assert tags["Purpose"] == "VPC Flow Logs"

  def test_cloudwatch_log_group(self, synthesized_stack):
    """Test CloudWatch Log Group for VPC Flow Logs."""
    log_group_resources = synthesized_stack.get("resource", {}).get("aws_cloudwatch_log_group", {})
    assert len(log_group_resources) == 1

    log_group_config = list(log_group_resources.values())[0]
    assert "/aws/vpc/flowlogs/" in log_group_config["name"]
    assert log_group_config["retention_in_days"] == 30
    
    # Check tags
    tags = log_group_config["tags"]
    assert tags["Environment"] == "test"
    assert tags["Purpose"] == "VPC Flow Logs"

  def test_cloudtrail_configuration(self, synthesized_stack):
    """Test CloudTrail configuration."""
    cloudtrail_resources = synthesized_stack.get("resource", {}).get("aws_cloudtrail", {})
    assert len(cloudtrail_resources) == 1

    cloudtrail_config = list(cloudtrail_resources.values())[0]
    assert "name" in cloudtrail_config
    assert "test" in cloudtrail_config["name"]  # Environment suffix
    assert cloudtrail_config["include_global_service_events"] is True
    assert cloudtrail_config["is_multi_region_trail"] is True
    assert cloudtrail_config["enable_logging"] is True
    assert cloudtrail_config["enable_log_file_validation"] is True
    assert cloudtrail_config["s3_key_prefix"] == "AWSLogs"
    
    # Check tags
    tags = cloudtrail_config["tags"]
    assert tags["Environment"] == "test"
    assert tags["Purpose"] == "Audit Trail"

  def test_terraform_outputs(self, synthesized_stack):
    """Test that all required Terraform outputs are defined."""
    outputs = synthesized_stack.get("output", {})
    
    required_outputs = [
      "vpc_id", "public_subnet_ids", "private_subnet_ids",
      "app_bucket_name", "cloudtrail_bucket_name", "rds_endpoint",
      "db_secret_arn", "app_role_arn", "web_security_group_id",
      "environment", "region"
    ]
    
    for required_output in required_outputs:
      assert required_output in outputs
      
      output_config = outputs[required_output]
      assert "value" in output_config
      assert "description" in output_config

  def test_resource_naming_convention(self, synthesized_stack):
    """Test that resources follow proper naming conventions."""
    # Check that most resources include the environment suffix
    for resource_type, resources in synthesized_stack.get("resource", {}).items():
      for resource_name, resource_config in resources.items():
        if "tags" in resource_config and "Name" in resource_config["tags"]:
          name_tag = resource_config["tags"]["Name"]
          assert "test" in name_tag, f"Resource {resource_name} missing environment suffix in Name tag"

  def test_tagging_strategy(self, synthesized_stack):
    """Test that all resources are properly tagged."""
    required_tag_keys = ["Environment"]
    
    for resource_type, resources in synthesized_stack.get("resource", {}).items():
      for resource_name, resource_config in resources.items():
        if "tags" in resource_config:
          tags = resource_config["tags"]
          for required_tag in required_tag_keys:
            assert required_tag in tags, f"Resource {resource_name} missing required tag {required_tag}"
          assert tags["Environment"] == "test"

  def test_region_validation(self):
    """Test that us-east-1 region is rejected."""
    app = App()
    
    with pytest.raises(ValueError, match="us-east-1 region is explicitly excluded"):
      TapStack(
        app,
        "test-invalid-region",
        environment_suffix="test",
        aws_region="us-east-1"
      )

  def test_stack_synthesis_success(self, stack):
    """Test that the stack synthesizes without errors."""
    try:
      synthesized = Testing.synth(stack)
      assert len(synthesized) > 0
      # Should be valid JSON
      json.loads(synthesized)
    except Exception as e:
      pytest.fail(f"Stack synthesis failed: {str(e)}")


class TestStackIntegration:
  """Integration tests for the complete stack configuration."""

  @pytest.fixture
  def app(self):
    """Create a CDKTF App instance for testing."""
    return App()

  @pytest.fixture
  def stack(self, app):
    """Create a TapStack instance for testing."""
    return TapStack(
      app,
      "integration-test-stack",
      environment_suffix="integration",
      aws_region="us-west-2",
      default_tags={
        "Environment": "integration",
        "Owner": "integration-test-team",
        "Project": "TAP Integration Test"
      }
    )

  def test_all_components_present(self, stack):
    """Test that all major stack components are present."""
    # VPC components
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'igw')
    assert hasattr(stack, 'public_subnet_1')
    assert hasattr(stack, 'public_subnet_2')
    assert hasattr(stack, 'private_subnet_1')
    assert hasattr(stack, 'private_subnet_2')
    assert hasattr(stack, 'nat_gateway')
    
    # Security components
    assert hasattr(stack, 'web_sg')
    assert hasattr(stack, 'db_sg')
    
    # Storage components
    assert hasattr(stack, 'app_bucket')
    assert hasattr(stack, 'cloudtrail_bucket')
    
    # Database components
    assert hasattr(stack, 'db_subnet_group')
    assert hasattr(stack, 'rds_instance')
    assert hasattr(stack, 'db_secret')
    
    # IAM components
    assert hasattr(stack, 'app_role')
    assert hasattr(stack, 'app_user')
    assert hasattr(stack, 'ec2_readonly_policy')
    
    # Monitoring components
    assert hasattr(stack, 'cloudtrail')
    assert hasattr(stack, 'vpc_flow_log_group')

  def test_component_relationships(self, stack):
    """Test that components are properly linked."""
    # VPC relationships: just check that vpc_id and id are set and are tokens/strings
    assert hasattr(stack.public_subnet_1, "vpc_id")
    assert hasattr(stack.private_subnet_1, "vpc_id")
    assert hasattr(stack.igw, "vpc_id")
    assert hasattr(stack.vpc, "id")
    # Security group relationships
    assert hasattr(stack.web_sg, "vpc_id")
    assert hasattr(stack.db_sg, "vpc_id")
    # Database relationships
    assert hasattr(stack.rds_instance, "db_subnet_group_name")
    assert hasattr(stack.db_subnet_group, "name")

  def test_multi_environment_support(self):
    """Test that the stack supports multiple environments."""
    app = App()
    
    environments = ["dev", "staging", "prod"]
    
    for env in environments:
      stack = TapStack(
        app,
        f"test-{env}-stack",
        environment_suffix=env,
        aws_region="us-west-2"
      )
      
      assert stack.environment_suffix == env
      synthesized = Testing.synth(stack)
      assert len(synthesized) > 0


# Pytest configuration
pytestmark = pytest.mark.unit
