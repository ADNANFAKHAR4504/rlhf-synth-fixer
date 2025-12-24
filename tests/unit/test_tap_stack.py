"""
Unit tests for TapStack CDKTF implementation.

These tests verify the infrastructure configuration without deploying resources.
"""

import pytest
from cdktf import Testing, TerraformStack
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

    def test_vpc_configuration(self):
        """Test VPC is created with correct CIDR and DNS settings."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find VPC resource
        vpc_resources = [
            r for r in synthesized
            if r.get("type") == "aws_vpc"
        ]
        
        assert len(vpc_resources) == 1
        vpc = vpc_resources[0]["values"]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_subnets_created(self):
        """Test that public and private subnets are created correctly."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find subnet resources
        subnet_resources = [
            r for r in synthesized
            if r.get("type") == "aws_subnet"
        ]
        
        # Should have 4 subnets (2 public + 2 private)
        assert len(subnet_resources) == 4
        
        # Check public subnets
        public_subnets = [
            s for s in subnet_resources
            if s["values"].get("map_public_ip_on_launch") is True
        ]
        assert len(public_subnets) == 2
        
        # Check private subnets
        private_subnets = [
            s for s in subnet_resources
            if s["values"].get("map_public_ip_on_launch") is False
        ]
        assert len(private_subnets) == 2

    def test_internet_gateway_exists(self):
        """Test that an Internet Gateway is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        igw_resources = [
            r for r in synthesized
            if r.get("type") == "aws_internet_gateway"
        ]
        
        assert len(igw_resources) == 1

    def test_nat_gateway_exists(self):
        """Test that a NAT Gateway is created with EIP."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Check NAT Gateway
        nat_resources = [
            r for r in synthesized
            if r.get("type") == "aws_nat_gateway"
        ]
        assert len(nat_resources) == 1
        
        # Check Elastic IP
        eip_resources = [
            r for r in synthesized
            if r.get("type") == "aws_eip"
        ]
        assert len(eip_resources) == 1
        assert eip_resources[0]["values"]["domain"] == "vpc"

    def test_route_tables_configured(self):
        """Test that route tables are created and associated correctly."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Check route tables
        route_table_resources = [
            r for r in synthesized
            if r.get("type") == "aws_route_table"
        ]
        assert len(route_table_resources) == 2  # Public and private
        
        # Check route table associations
        association_resources = [
            r for r in synthesized
            if r.get("type") == "aws_route_table_association"
        ]
        assert len(association_resources) == 4  # 2 public + 2 private subnets
        
        # Check routes
        route_resources = [
            r for r in synthesized
            if r.get("type") == "aws_route"
        ]
        assert len(route_resources) == 2  # Public and private routes

    def test_security_groups_configured(self):
        """Test that security groups are created with correct rules."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Check security groups
        sg_resources = [
            r for r in synthesized
            if r.get("type") == "aws_security_group"
        ]
        assert len(sg_resources) == 2  # Public and private
        
        # Check security group rules
        sg_rule_resources = [
            r for r in synthesized
            if r.get("type") == "aws_security_group_rule"
        ]
        assert len(sg_rule_resources) >= 4  # At least 4 rules

    def test_ssh_access_restricted(self):
        """Test that SSH access is restricted to 203.0.113.0/24."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find SSH ingress rules
        ssh_rules = [
            r for r in synthesized
            if r.get("type") == "aws_security_group_rule"
            and r["values"].get("type") == "ingress"
            and r["values"].get("from_port") == 22
            and r["values"].get("to_port") == 22
        ]
        
        # Should have at least one SSH rule
        assert len(ssh_rules) >= 1
        
        # Check that public SSH rule has correct CIDR
        public_ssh_rules = [
            r for r in ssh_rules
            if r["values"].get("cidr_blocks") is not None
        ]
        
        if public_ssh_rules:
            assert "203.0.113.0/24" in public_ssh_rules[0]["values"]["cidr_blocks"]

    def test_ec2_instances_created(self, monkeypatch):
        """Test that EC2 instances are created in correct subnets (non-LocalStack)."""
        # Ensure LocalStack env vars are NOT set
        monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
        monkeypatch.delenv("LOCALSTACK_HOSTNAME", raising=False)
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Check EC2 instances
        instance_resources = [
            r for r in synthesized
            if r.get("type") == "aws_instance"
        ]
        assert len(instance_resources) == 2  # Public and private instances
        
        # Check instance types
        for instance in instance_resources:
            assert instance["values"]["instance_type"] == "t3.micro"

    def test_tags_applied(self):
        """Test that all resources have required tags."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Check VPC tags
        vpc_resources = [
            r for r in synthesized
            if r.get("type") == "aws_vpc"
        ]
        
        if vpc_resources:
            tags = vpc_resources[0]["values"].get("tags", {})
            assert "Environment" in tags
            assert tags["Environment"] == "Development"

    def test_terraform_outputs_exist(self, monkeypatch):
        """Test that required Terraform outputs are defined."""
        # Ensure LocalStack env vars are NOT set for full outputs
        monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
        monkeypatch.delenv("LOCALSTACK_HOSTNAME", raising=False)
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find outputs
        outputs = [
            r for r in synthesized
            if r.get("type") == "output"
        ]
        
        output_names = [o.get("name") for o in outputs]
        
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
        
        # Find outputs
        outputs = [
            r for r in synthesized
            if r.get("type") == "output"
        ]
        
        output_names = [o.get("name") for o in outputs]
        
        # Check for core infrastructure outputs
        assert "vpc_id" in output_names
        assert "public_subnet_ids" in output_names
        assert "private_subnet_ids" in output_names
        assert "nat_gateway_id" in output_names
        
        # Instance outputs should not be present in LocalStack
        assert "public_instance_ip" not in output_names
        assert "private_instance_ip" not in output_names

    def test_stack_with_custom_environment(self):
        """Test stack creation with custom environment suffix."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", environment_suffix="staging")
        
        assert stack.environment_suffix == "staging"
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_stack_with_custom_region(self):
        """Test stack creation with custom AWS region."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", aws_region="us-west-2")
        
        assert stack.aws_region == "us-west-2"
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_stack_configuration_properties(self):
        """Test that stack configuration properties are accessible."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        
        # Test property accessors
        assert stack.vpc_cidr == "10.0.0.0/16"
        assert stack.aws_region == "us-east-1"
        assert stack.environment_suffix == "dev"
        assert len(stack.public_subnet_cidrs) == 2
        assert len(stack.private_subnet_cidrs) == 2
        assert stack.instance_type == "t3.micro"
        assert stack.allowed_ssh_cidr == "203.0.113.0/24"

    def test_stack_with_custom_tags(self):
        """Test stack creation with custom default tags."""
        app = Testing.app()
        custom_tags = {
            "tags": {
                "CustomTag": "CustomValue",
                "Team": "Infrastructure"
            }
        }
        stack = TapStack(app, "test-stack", default_tags=custom_tags)
        synthesized = Testing.synth(stack)
        
        assert synthesized is not None

    def test_provider_configuration(self):
        """Test AWS provider is configured correctly."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find provider configuration
        provider_resources = [
            r for r in synthesized
            if r.get("type") == "provider"
            and r.get("name") == "aws"
        ]
        
        assert len(provider_resources) == 1
        provider = provider_resources[0]["values"]
        assert provider["region"] == "us-east-1"

    def test_ami_data_source(self, monkeypatch):
        """Test that AMI data source is configured for Amazon Linux 2023 (non-LocalStack)."""
        # Ensure LocalStack env vars are NOT set
        monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
        monkeypatch.delenv("LOCALSTACK_HOSTNAME", raising=False)
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find AMI data source
        ami_resources = [
            r for r in synthesized
            if r.get("type") == "data_aws_ami"
        ]
        
        assert len(ami_resources) == 1
        ami = ami_resources[0]["values"]
        assert ami["most_recent"] is True
        assert ami["owners"] == ["amazon"]

    def test_availability_zones_data_source(self):
        """Test that availability zones data source is configured."""
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find AZ data source
        az_resources = [
            r for r in synthesized
            if r.get("type") == "data_aws_availability_zones"
        ]
        
        assert len(az_resources) == 1
        az = az_resources[0]["values"]
        assert az["state"] == "available"

    def test_localstack_provider_configuration(self, monkeypatch):
        """Test that LocalStack configuration is applied when environment variables are set."""
        # Set LocalStack environment variable
        monkeypatch.setenv("AWS_ENDPOINT_URL", "http://localhost:4566")
        
        app = Testing.app()
        stack = TapStack(app, "test-stack")
        synthesized = Testing.synth(stack)
        
        # Find provider configuration
        provider_resources = [
            r for r in synthesized
            if r.get("type") == "provider"
            and r.get("name") == "aws"
        ]
        
        assert len(provider_resources) == 1
        provider = provider_resources[0]["values"]
        
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
        
        # Check that EC2 instances were not created
        instance_resources = [
            r for r in synthesized
            if r.get("type") == "aws_instance"
        ]
        assert len(instance_resources) == 0
        
        # Verify stack attributes
        assert stack.public_instance is None
        assert stack.private_instance is None
        assert stack.amazon_linux_ami is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

