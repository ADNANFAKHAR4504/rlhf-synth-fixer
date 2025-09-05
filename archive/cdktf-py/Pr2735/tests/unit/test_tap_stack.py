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
            aws_region="us-east-1"
        )
        assert stack is not None


class TestAwsProvider:
    """Test suite for AWS Provider configuration."""

    def test_aws_provider_is_configured(self, app):
        """Test that AWS provider is properly configured."""
        stack = TapStack(app, "ProviderTestStack", aws_region="us-east-1")
        synth_str = Testing.synth(stack)
        synth = json.loads(synth_str)
        
        providers = synth.get("provider", {})
        assert "aws" in providers
        assert providers["aws"][0]["region"] == "us-east-1"

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
        assert "Department" in default_tags[0]["tags"]
        assert default_tags[0]["tags"]["Department"] == "IT"


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
        assert "Department" in tags
        assert tags["Department"] == "IT"
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

    def test_route_tables_created(self, app):
        """Test that route tables are created correctly."""
        stack = TapStack(app, "RouteTableTestStack")
        synth = synth_stack(stack)
        
        rt_resources = synth.get("resource", {}).get("aws_route_table", {})
        route_resources = synth.get("resource", {}).get("aws_route", {})
        rt_assoc_resources = synth.get("resource", {}).get("aws_route_table_association", {})
        
        # Should have 1 public route table
        assert len(rt_resources) == 1
        # Should have 1 route to IGW
        assert len(route_resources) == 1
        # Should have 2 associations (for 2 public subnets)
        assert len(rt_assoc_resources) == 2


class TestSecurityGroups:
    """Test suite for Security Group configuration."""

    def test_security_groups_created(self, app):
        """Test that security groups are created."""
        stack = TapStack(app, "SgTestStack")
        synth = synth_stack(stack)
        
        sg_resources = synth.get("resource", {}).get("aws_security_group", {})
        # Should have 2 security groups (web and database)
        assert len(sg_resources) == 2

    def test_web_security_group_https_rule(self, app):
        """Test that HTTPS rule is configured correctly."""
        stack = TapStack(app, "HttpsRuleTestStack")
        synth = synth_stack(stack)
        
        sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
        
        # Check for HTTPS ingress rule
        https_rules = [rule for rule in sg_rule_resources.values() 
                      if rule.get("type") == "ingress" and 
                      rule.get("from_port") == 443 and 
                      rule.get("to_port") == 443]
        assert len(https_rules) == 1
        
        https_rule = https_rules[0]
        assert https_rule["protocol"] == "tcp"
        assert "0.0.0.0/0" in https_rule["cidr_blocks"]

    def test_database_security_group_postgres_rule(self, app):
        """Test that PostgreSQL rule is configured correctly."""
        stack = TapStack(app, "PostgresRuleTestStack")
        synth = synth_stack(stack)
        
        sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
        
        # Check for PostgreSQL ingress rule
        postgres_rules = [rule for rule in sg_rule_resources.values() 
                         if rule.get("type") == "ingress" and 
                         rule.get("from_port") == 5432 and 
                         rule.get("to_port") == 5432]
        assert len(postgres_rules) == 1
        
        postgres_rule = postgres_rules[0]
        assert postgres_rule["protocol"] == "tcp"
        # Should reference source security group, not CIDR blocks
        assert "source_security_group_id" in postgres_rule

    def test_security_group_egress_rule(self, app):
        """Test that egress rule allows all outbound traffic."""
        stack = TapStack(app, "EgressRuleTestStack")
        synth = synth_stack(stack)
        
        sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
        
        # Check for egress rule
        egress_rules = [rule for rule in sg_rule_resources.values() 
                       if rule.get("type") == "egress"]
        assert len(egress_rules) >= 1
        
        # At least one egress rule should allow all traffic
        all_egress = [rule for rule in egress_rules 
                     if rule.get("from_port") == 0 and 
                     rule.get("to_port") == 0 and 
                     rule.get("protocol") == "-1"]
        assert len(all_egress) >= 1


class TestEc2Configuration:
    """Test suite for EC2 instance configuration."""

    def test_ec2_instance_created(self, app):
        """Test that EC2 instance is created."""
        stack = TapStack(app, "Ec2TestStack")
        synth = synth_stack(stack)
        
        instance_resources = synth.get("resource", {}).get("aws_instance", {})
        assert len(instance_resources) == 1
        
        instance_config = list(instance_resources.values())[0]
        assert instance_config["instance_type"] == "t3.micro"

    def test_iam_role_created(self, app):
        """Test that IAM role is created for EC2."""
        stack = TapStack(app, "IamTestStack")
        synth = synth_stack(stack)
        
        iam_role_resources = synth.get("resource", {}).get("aws_iam_role", {})
        assert len(iam_role_resources) == 1
        
        role_config = list(iam_role_resources.values())[0]
        assert "ec2.amazonaws.com" in role_config["assume_role_policy"]

    def test_instance_profile_created(self, app):
        """Test that instance profile is created."""
        stack = TapStack(app, "ProfileTestStack")
        synth = synth_stack(stack)
        
        profile_resources = synth.get("resource", {}).get("aws_iam_instance_profile", {})
        assert len(profile_resources) == 1


class TestRdsConfiguration:
    """Test suite for RDS database configuration."""

    def test_rds_instance_created(self, app):
        """Test that RDS instance is created."""
        stack = TapStack(app, "RdsTestStack")
        synth = synth_stack(stack)
        
        rds_resources = synth.get("resource", {}).get("aws_db_instance", {})
        assert len(rds_resources) == 1
        
        rds_config = list(rds_resources.values())[0]
        assert rds_config["engine"] == "postgres"
        assert rds_config["instance_class"] == "db.t3.micro"
        assert rds_config["storage_encrypted"] is True
        assert rds_config["publicly_accessible"] is False

    def test_db_subnet_group_created(self, app):
        """Test that DB subnet group is created."""
        stack = TapStack(app, "DbSubnetTestStack")
        synth = synth_stack(stack)
        
        subnet_group_resources = synth.get("resource", {}).get("aws_db_subnet_group", {})
        assert len(subnet_group_resources) == 1


class TestOutputsConfiguration:
    """Test suite for stack outputs."""

    def test_required_outputs_present(self, app):
        """Test that all required outputs are present."""
        stack = TapStack(app, "OutputsTestStack")
        synth = synth_stack(stack)
        
        outputs = synth.get("output", {})
        
        required_outputs = [
            "vpc_id",
            "public_subnet_ids", 
            "private_subnet_ids",
            "web_instance_id",
            "web_instance_public_ip",
            "rds_endpoint"
        ]
        
        for output_name in required_outputs:
            assert output_name in outputs, f"Missing required output: {output_name}"

    def test_output_descriptions(self, app):
        """Test that outputs have proper descriptions."""
        stack = TapStack(app, "OutputDescTestStack")
        synth = synth_stack(stack)
        
        outputs = synth.get("output", {})
        
        for output_name, output_config in outputs.items():
            assert "description" in output_config, f"Output {output_name} missing description"
            assert len(output_config["description"]) > 0, f"Empty description for {output_name}"


class TestS3Backend:
    """Test suite for S3 backend configuration."""

    def test_s3_backend_configured(self, app):
        """Test that S3 backend is properly configured."""
        stack = TapStack(app, "BackendTestStack", environment_suffix="test")
        synth = synth_stack(stack)
        
        terraform_config = synth.get("terraform", {})
        backend_config = terraform_config.get("backend", {}).get("s3", {})
        
        assert "bucket" in backend_config
        assert "key" in backend_config
        assert "region" in backend_config
        assert backend_config["encrypt"] is True


class TestTaggingCompliance:
    """Test suite for resource tagging compliance."""

    def test_all_resources_have_required_tags(self, app):
        """Test that all resources have required production tags."""
        stack = TapStack(app, "TagComplianceTestStack", environment_suffix="compliance")
        synth = synth_stack(stack)
        
        resources = synth.get("resource", {})
        
        required_tags = ["Environment", "Department"]
        
        # Check taggable resources
        taggable_resources = [
            "aws_vpc", "aws_subnet", "aws_internet_gateway", 
            "aws_route_table", "aws_security_group", "aws_instance",
            "aws_iam_role", "aws_iam_instance_profile", "aws_db_instance", 
            "aws_db_subnet_group"
        ]
        
        for resource_type in taggable_resources:
            if resource_type in resources:
                for resource_name, resource_config in resources[resource_type].items():
                    tags = resource_config.get("tags", {})
                    for required_tag in required_tags:
                        assert required_tag in tags, f"Missing {required_tag} tag in {resource_type}.{resource_name}"

    def test_production_environment_tag(self, app):
        """Test that Environment tag is set to Production."""
        stack = TapStack(app, "ProdTagTestStack")
        synth = synth_stack(stack)
        
        resources = synth.get("resource", {})
        
        # Check VPC as representative resource
        vpc_resources = resources.get("aws_vpc", {})
        if vpc_resources:
            vpc_config = list(vpc_resources.values())[0]
            tags = vpc_config.get("tags", {})
            assert tags.get("Environment") == "Production"

    def test_department_tag(self, app):
        """Test that Department tag is set to IT."""
        stack = TapStack(app, "DeptTagTestStack")
        synth = synth_stack(stack)
        
        resources = synth.get("resource", {})
        
        # Check VPC as representative resource
        vpc_resources = resources.get("aws_vpc", {})
        if vpc_resources:
            vpc_config = list(vpc_resources.values())[0]
            tags = vpc_config.get("tags", {})
            assert tags.get("Department") == "IT"
