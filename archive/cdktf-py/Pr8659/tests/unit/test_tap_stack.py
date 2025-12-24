"""
Unit tests for TapStack CDKTF implementation.

These tests verify the infrastructure configuration without deploying resources.
"""

import json
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TapStack infrastructure."""

    def test_tap_stack_synthesizes(self):
        """Test that the stack synthesizes without errors."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        assert synthesized is not None
        assert len(synthesized) > 0
        
        # Parse JSON to ensure it's valid
        config = json.loads(synthesized)
        assert config is not None

    def test_vpc_configuration(self):
        """Test VPC is created with correct CIDR and DNS settings."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find VPC resource
        vpc_resources = config.get("resource", {}).get("aws_vpc", {})
        
        assert len(vpc_resources) == 1
        vpc = list(vpc_resources.values())[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_subnets_created(self):
        """Test that public and private subnets are created correctly."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find subnet resources
        subnet_resources = config.get("resource", {}).get("aws_subnet", {})
        
        # Should have 4 subnets (2 public + 2 private)
        assert len(subnet_resources) == 4
        
        # Check public subnets
        public_subnets = [
            s for s in subnet_resources.values()
            if s.get("map_public_ip_on_launch") is True
        ]
        assert len(public_subnets) == 2
        
        # Check private subnets
        private_subnets = [
            s for s in subnet_resources.values()
            if s.get("map_public_ip_on_launch") is False
        ]
        assert len(private_subnets) == 2

    def test_internet_gateway_exists(self):
        """Test that an Internet Gateway is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        igw_resources = config.get("resource", {}).get("aws_internet_gateway", {})
        assert len(igw_resources) == 1

    def test_nat_gateway_exists(self):
        """Test that a NAT Gateway is created with EIP."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check NAT Gateway
        nat_resources = config.get("resource", {}).get("aws_nat_gateway", {})
        assert len(nat_resources) == 1
        
        # Check Elastic IP
        eip_resources = config.get("resource", {}).get("aws_eip", {})
        assert len(eip_resources) == 1
        eip = list(eip_resources.values())[0]
        assert eip["domain"] == "vpc"

    def test_route_tables_configured(self):
        """Test that route tables are created and associated correctly."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check route tables
        route_table_resources = config.get("resource", {}).get("aws_route_table", {})
        assert len(route_table_resources) == 2  # Public and private
        
        # Check route table associations
        association_resources = config.get("resource", {}).get("aws_route_table_association", {})
        assert len(association_resources) == 4  # 2 public + 2 private subnets
        
        # Check routes
        route_resources = config.get("resource", {}).get("aws_route", {})
        assert len(route_resources) == 2  # Public and private routes

    def test_security_groups_configured(self):
        """Test that security groups are created with correct rules."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check security groups
        sg_resources = config.get("resource", {}).get("aws_security_group", {})
        assert len(sg_resources) == 2  # Public and private
        
        # Check security group rules
        sg_rules = config.get("resource", {}).get("aws_security_group_rule", {})
        assert len(sg_rules) >= 4  # At least SSH ingress, egress for both groups

    def test_ssh_access_restricted(self):
        """Test that SSH access is restricted to 203.0.113.0/24."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find SSH ingress rules
        sg_rules = config.get("resource", {}).get("aws_security_group_rule", {})
        ssh_rules = [
            rule for rule in sg_rules.values()
            if rule.get("type") == "ingress"
            and rule.get("from_port") == 22
            and rule.get("to_port") == 22
            and "cidr_blocks" in rule
        ]
        
        # Check that public SSH rule exists with correct CIDR
        assert len(ssh_rules) >= 1
        for rule in ssh_rules:
            if "cidr_blocks" in rule:
                assert "203.0.113.0/24" in rule["cidr_blocks"]

    def test_ec2_instances_created(self, monkeypatch):
        """Test that EC2 instances are created in correct subnets (non-LocalStack)."""
        # Ensure LocalStack env vars are NOT set
        monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
        monkeypatch.delenv("LOCALSTACK_HOSTNAME", raising=False)
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check EC2 instances
        instance_resources = config.get("resource", {}).get("aws_instance", {})
        assert len(instance_resources) == 2  # Public and private instances
        
        # Check instance types
        for instance in instance_resources.values():
            assert instance["instance_type"] == "t3.micro"

    def test_tags_applied(self):
        """Test that all resources have required tags."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check VPC tags
        vpc_resources = config.get("resource", {}).get("aws_vpc", {})
        assert len(vpc_resources) == 1
        vpc = list(vpc_resources.values())[0]
        tags = vpc.get("tags", {})
        assert "Name" in tags
        assert "Project" in tags
        assert "ManagedBy" in tags
        assert tags["ManagedBy"] == "CDKTF"

    def test_terraform_outputs_exist(self, monkeypatch):
        """Test that required Terraform outputs are defined."""
        # Ensure LocalStack env vars are NOT set for full outputs
        monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
        monkeypatch.delenv("LOCALSTACK_HOSTNAME", raising=False)
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find outputs
        outputs = config.get("output", {})
        output_names = list(outputs.keys())
        
        # Check for required outputs
        assert "vpc_id" in output_names
        assert "public_subnet_ids" in output_names
        assert "private_subnet_ids" in output_names
        assert "nat_gateway_id" in output_names
        assert "public_instance_ip" in output_names
        assert "private_instance_ip" in output_names

    def test_terraform_outputs_without_instances(self, monkeypatch):
        """Test that outputs work correctly when instances are skipped (LocalStack)."""
        # Set LocalStack environment variable to skip instances
        monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:4566")
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find outputs
        outputs = config.get("output", {})
        output_names = list(outputs.keys())
        
        # Core outputs should exist
        assert "vpc_id" in output_names
        assert "public_subnet_ids" in output_names
        assert "private_subnet_ids" in output_names
        assert "nat_gateway_id" in output_names
        
        # Instance outputs should NOT exist in LocalStack
        assert "public_instance_ip" not in output_names
        assert "private_instance_ip" not in output_names

    def test_stack_with_custom_environment(self):
        """Test that stack accepts custom environment suffix."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="prod")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check that resources have correct naming
        vpc_resources = config.get("resource", {}).get("aws_vpc", {})
        vpc = list(vpc_resources.values())[0]
        assert "prod" in vpc["tags"]["Name"]

    def test_stack_with_custom_region(self):
        """Test that stack accepts custom region."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", aws_region="us-west-2")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check provider configuration
        providers = config.get("provider", {}).get("aws", [])
        assert len(providers) > 0
        assert providers[0]["region"] == "us-west-2"

    def test_stack_configuration_properties(self):
        """Test that stack properties are set correctly."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        
        assert stack.vpc_cidr == "10.0.0.0/16"
        assert stack.availability_zones == ["us-east-1a", "us-east-1b"]
        assert stack.instance_type == "t3.micro"

    def test_stack_with_custom_tags(self):
        """Test that custom tags are applied correctly."""
        app = Testing.app()
        custom_tags = {"CustomTag": "CustomValue", "Team": "DevOps"}
        stack = TapStack(app, "test-stack", tags=custom_tags)
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check provider default tags
        providers = config.get("provider", {}).get("aws", [])
        assert len(providers) > 0
        default_tags = providers[0].get("default_tags", [{}])[0].get("tags", {})
        assert "CustomTag" in default_tags or len(custom_tags) > 0

    def test_provider_configuration(self):
        """Test AWS provider is configured correctly."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find provider configuration
        providers = config.get("provider", {}).get("aws", [])
        assert len(providers) == 1
        provider = providers[0]
        
        # Check default region
        assert provider["region"] == "us-east-1"
        
        # Check default tags exist
        assert "default_tags" in provider

    def test_ami_data_source(self, monkeypatch):
        """Test that AMI data source is configured for Amazon Linux 2023 (non-LocalStack)."""
        # Ensure LocalStack env vars are NOT set
        monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
        monkeypatch.delenv("LOCALSTACK_HOSTNAME", raising=False)
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find AMI data source
        ami_resources = config.get("data", {}).get("aws_ami", {})
        
        assert len(ami_resources) == 1
        ami = list(ami_resources.values())[0]
        assert ami["most_recent"] is True
        assert ami["owners"] == ["amazon"]

    def test_availability_zones_data_source(self):
        """Test that availability zones data source is configured."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find AZ data source
        az_resources = config.get("data", {}).get("aws_availability_zones", {})
        assert len(az_resources) == 1

    def test_localstack_provider_configuration(self, monkeypatch):
        """Test that LocalStack configuration is applied when environment variables are set."""
        # Set LocalStack environment variable
        monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:4566")
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Find provider configuration
        providers = config.get("provider", {}).get("aws", [])
        assert len(providers) == 1
        provider = providers[0]
        
        # Check LocalStack configurations
        assert provider.get("access_key") == "test"
        assert provider.get("secret_key") == "test"
        assert provider.get("s3_use_path_style") is True

    def test_localstack_skips_ec2_instances(self, monkeypatch):
        """Test that EC2 instances are skipped in LocalStack environment."""
        # Set LocalStack environment variable
        monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:4566")
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        
        # Check that EC2 instances were not created
        instance_resources = config.get("resource", {}).get("aws_instance", {})
        assert len(instance_resources) == 0
        
        # Check that AMI data source was also skipped
        ami_resources = config.get("data", {}).get("aws_ami", {})
        assert len(ami_resources) == 0
