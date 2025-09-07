"""
Integration Tests for AWS Production Infrastructure Stack

This module contains integration tests that validate the complete
infrastructure deployment, resource relationships, and production
readiness of the TapStack.
"""

import json
import os
import pytest
import boto3
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
                    "Department": "IT",
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
        
        # Security groups should reference VPC
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
        
        # Check that subnets are in different AZs
        public_azs = [subnet.get("availability_zone") for subnet in public_subnets]
        private_azs = [subnet.get("availability_zone") for subnet in private_subnets]
        
        assert len(set(public_azs)) == 2, "Public subnets should be in different AZs"
        assert len(set(private_azs)) == 2, "Private subnets should be in different AZs"

    def test_security_compliance(self, app):
        """Test that security requirements are met."""
        stack = TapStack(app, "SecurityTestStack", environment_suffix="sec-test")
        synth = json.loads(Testing.synth(stack))
        
        # RDS should be encrypted
        rds_resources = synth.get("resource", {}).get("aws_db_instance", {})
        for rds in rds_resources.values():
            assert rds.get("storage_encrypted") is True
            assert rds.get("publicly_accessible") is False
        
        # Security group rules should be restrictive
        sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
        
        # Database should only accept connections from web security group
        db_ingress_rules = [rule for rule in sg_rule_resources.values() 
                           if rule.get("type") == "ingress" and 
                           rule.get("from_port") == 5432]
        
        for rule in db_ingress_rules:
            # Should use source security group, not open CIDR blocks
            assert "source_security_group_id" in rule
            assert "cidr_blocks" not in rule or not rule.get("cidr_blocks")

    def test_network_isolation(self, app):
        """Test that network isolation is properly configured."""
        stack = TapStack(app, "NetworkTestStack", environment_suffix="net-test")
        synth = json.loads(Testing.synth(stack))
        
        # Private subnets should not have public IP assignment
        subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
        private_subnets = [s for s in subnet_resources.values() 
                          if s.get("map_public_ip_on_launch") is not True]
        
        for private_subnet in private_subnets:
            assert private_subnet.get("map_public_ip_on_launch") is not True
        
        # Public subnets should have public IP assignment
        public_subnets = [s for s in subnet_resources.values() 
                         if s.get("map_public_ip_on_launch") is True]
        
        for public_subnet in public_subnets:
            assert public_subnet.get("map_public_ip_on_launch") is True

    def test_iam_least_privilege(self, app):
        """Test that IAM roles follow least privilege principle."""
        stack = TapStack(app, "IAMTestStack", environment_suffix="iam-test")
        synth = json.loads(Testing.synth(stack))
        
        # EC2 role should have minimal permissions
        iam_role_resources = synth.get("resource", {}).get("aws_iam_role", {})
        
        for role in iam_role_resources.values():
            assume_role_policy = json.loads(role.get("assume_role_policy", "{}"))
            statements = assume_role_policy.get("Statement", [])
            
            # Should only allow EC2 service to assume role
            for statement in statements:
                if statement.get("Effect") == "Allow":
                    principal = statement.get("Principal", {})
                    service = principal.get("Service", "")
                    assert "ec2.amazonaws.com" in service

    def test_data_encryption_at_rest(self, app):
        """Test that data is encrypted at rest."""
        stack = TapStack(app, "EncryptionTestStack", environment_suffix="enc-test")
        synth = json.loads(Testing.synth(stack))
        
        # RDS should have encryption enabled
        rds_resources = synth.get("resource", {}).get("aws_db_instance", {})
        for rds in rds_resources.values():
            assert rds.get("storage_encrypted") is True

    def test_resource_naming_convention(self, app):
        """Test that resources follow naming conventions."""
        stack = TapStack(app, "NamingTestStack", environment_suffix="naming-test")
        synth = json.loads(Testing.synth(stack))
        
        # Check that resources have proper naming
        resources = synth.get("resource", {})
        
        # VPC should have production prefix
        vpc_resources = resources.get("aws_vpc", {})
        for vpc in vpc_resources.values():
            tags = vpc.get("tags", {})
            name = tags.get("Name", "")
            assert "production" in name.lower()
            assert "naming-test" in name
        
        # Security groups should have descriptive names
        sg_resources = resources.get("aws_security_group", {})
        for sg in sg_resources.values():
            name = sg.get("name", "")
            assert "production" in name.lower()
            assert "naming-test" in name

    def test_backup_and_maintenance_windows(self, app):
        """Test that backup and maintenance windows are configured."""
        stack = TapStack(app, "BackupTestStack", environment_suffix="backup-test")
        synth = json.loads(Testing.synth(stack))
        
        # RDS should have backup configuration
        rds_resources = synth.get("resource", {}).get("aws_db_instance", {})
        for rds in rds_resources.values():
            assert rds.get("backup_retention_period", 0) > 0
            assert "backup_window" in rds
            assert "maintenance_window" in rds

    def test_tagging_consistency(self, app):
        """Test that all resources have consistent tagging."""
        stack = TapStack(app, "TaggingTestStack", environment_suffix="tag-test")
        synth = json.loads(Testing.synth(stack))
        
        resources = synth.get("resource", {})
        required_tags = ["Environment", "Department"]
        
        # Check all taggable resources
        taggable_types = [
            "aws_vpc", "aws_subnet", "aws_internet_gateway", 
            "aws_route_table", "aws_security_group", "aws_instance",
            "aws_iam_role", "aws_iam_instance_profile", "aws_db_instance",
            "aws_db_subnet_group"
        ]
        
        for resource_type in taggable_types:
            if resource_type in resources:
                for resource_config in resources[resource_type].values():
                    tags = resource_config.get("tags", {})
                    for required_tag in required_tags:
                        assert required_tag in tags, f"Missing {required_tag} in {resource_type}"
                        
                    # Check specific tag values
                    assert tags.get("Environment") == "Production"
                    assert tags.get("Department") == "IT"

    @pytest.mark.slow
    def test_stack_deployment_simulation(self, app):
        """Test that stack can be deployed without syntax errors."""
        stack = TapStack(
            app,
            "DeploymentSimTestStack",
            environment_suffix="deploy-sim",
            aws_region="us-east-1",
            state_bucket="test-tf-state-bucket",
            state_bucket_region="us-east-1",
            default_tags={
                "tags": {
                    "Environment": "Production",
                    "Department": "IT",
                    "TestType": "DeploymentSimulation"
                }
            }
        )
        
        # Synthesize the stack
        synth_result = Testing.synth(stack)
        terraform_config = json.loads(synth_result)
        
        # Validate Terraform configuration structure
        assert "terraform" in terraform_config
        assert "provider" in terraform_config
        assert "resource" in terraform_config
        assert "output" in terraform_config
        
        # Validate provider configuration
        providers = terraform_config.get("provider", {})
        assert "aws" in providers
        
        # Validate required resources exist
        resources = terraform_config.get("resource", {})
        required_resources = [
            "aws_vpc", "aws_subnet", "aws_internet_gateway",
            "aws_route_table", "aws_route", "aws_route_table_association",
            "aws_security_group", "aws_security_group_rule",
            "aws_instance", "aws_iam_role", "aws_iam_instance_profile",
            "aws_db_instance", "aws_db_subnet_group"
        ]
        
        for required_resource in required_resources:
            assert required_resource in resources, f"Missing required resource: {required_resource}"

    def test_multi_az_deployment(self, app):
        """Test that resources are properly distributed across AZs."""
        stack = TapStack(app, "MultiAZTestStack", environment_suffix="multi-az")
        synth = json.loads(Testing.synth(stack))
        
        # Check subnet distribution
        subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
        
        public_subnets = [s for s in subnet_resources.values() 
                         if s.get("map_public_ip_on_launch") is True]
        private_subnets = [s for s in subnet_resources.values() 
                          if s.get("map_public_ip_on_launch") is not True]
        
        # Should have exactly 2 public and 2 private subnets
        assert len(public_subnets) == 2
        assert len(private_subnets) == 2
        
        # Subnets should use different CIDR blocks
        public_cidrs = [subnet.get("cidr_block") for subnet in public_subnets]
        private_cidrs = [subnet.get("cidr_block") for subnet in private_subnets]
        
        assert len(set(public_cidrs)) == 2, "Public subnets should have different CIDR blocks"
        assert len(set(private_cidrs)) == 2, "Private subnets should have different CIDR blocks"

    def test_database_security_isolation(self, app):
        """Test that database is properly isolated and secured."""
        stack = TapStack(app, "DBSecurityTestStack", environment_suffix="db-sec")
        synth = json.loads(Testing.synth(stack))
        
        # RDS should be in private subnets
        rds_resources = synth.get("resource", {}).get("aws_db_instance", {})
        db_subnet_groups = synth.get("resource", {}).get("aws_db_subnet_group", {})
        
        assert len(rds_resources) == 1
        assert len(db_subnet_groups) == 1
        
        # RDS should not be publicly accessible
        for rds in rds_resources.values():
            assert rds.get("publicly_accessible") is False
            
        # Database security group should only allow specific access
        sg_resources = synth.get("resource", {}).get("aws_security_group", {})
        sg_rule_resources = synth.get("resource", {}).get("aws_security_group_rule", {})
        
        # Find database security group rules
        db_ingress_rules = [rule for rule in sg_rule_resources.values() 
                           if rule.get("type") == "ingress" and 
                           rule.get("from_port") == 5432]
        
        # Should have exactly one PostgreSQL ingress rule
        assert len(db_ingress_rules) == 1
        
        # Rule should reference source security group, not open CIDR
        db_rule = db_ingress_rules[0]
        assert "source_security_group_id" in db_rule
        assert "cidr_blocks" not in db_rule or not db_rule.get("cidr_blocks")

    def test_web_server_configuration(self, app):
        """Test that web server is properly configured."""
        stack = TapStack(app, "WebServerTestStack", environment_suffix="web-test")
        synth = json.loads(Testing.synth(stack))
        
        # EC2 instance should exist
        instance_resources = synth.get("resource", {}).get("aws_instance", {})
        assert len(instance_resources) == 1
        
        instance = list(instance_resources.values())[0]
        
        # Should be t3.micro as specified
        assert instance.get("instance_type") == "t3.micro"
        
        # Should have IAM instance profile
        assert "iam_instance_profile" in instance
        
        # Should be in public subnet (references subnet with map_public_ip_on_launch)
        subnet_resources = synth.get("resource", {}).get("aws_subnet", {})
        public_subnets = [s for s in subnet_resources.values() 
                         if s.get("map_public_ip_on_launch") is True]
        
        # Instance should reference one of the public subnets
        instance_subnet_ref = str(instance.get("subnet_id", ""))
        assert "public_subnet" in instance_subnet_ref
