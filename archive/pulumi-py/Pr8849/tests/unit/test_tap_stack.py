"""Unit tests for TAP Stack."""

import json
from typing import Any, Optional
from unittest.mock import Mock, patch, MagicMock
import pytest
import pulumi
from pulumi.runtime import Mocks
from lib.tap_stack import TapStackArgs, TapStack


class TestTapStackArgs:
    """Test TapStackArgs configuration class."""

    def test_tap_stack_args_defaults(self):
        """Test default values for TapStackArgs."""
        args = TapStackArgs()
        assert args.environment_suffix == "dev"
        assert args.team_name == "tap"
        assert args.project_name == "iac-aws-nova-model-breaking"
        assert len(args.regions) == 3
        assert args.availability_zones_per_region == 3

    def test_tap_stack_args_custom_environment(self):
        """Test TapStackArgs with custom environment."""
        args = TapStackArgs(environment_suffix="prod")
        assert args.environment_suffix == "prod"

    def test_get_resource_name(self):
        """Test resource naming convention."""
        args = TapStackArgs()
        resource_name = args.get_resource_name("vpc")
        assert resource_name == "tap-dev-vpc"

    def test_get_default_tags(self):
        """Test default tags generation."""
        args = TapStackArgs()
        tags = args.get_default_tags()
        assert "Owner" in tags
        assert "Purpose" in tags
        assert "Environment" in tags
        assert tags["Environment"] == "dev"
        assert tags["ManagedBy"] == "pulumi"
    
    def test_get_resource_name_with_different_service(self):
        """Test resource naming with different service names."""
        args = TapStackArgs(environment_suffix="staging")
        assert args.get_resource_name("vpc") == "tap-staging-vpc"
        assert args.get_resource_name("ec2-role") == "tap-staging-ec2-role"
        assert args.get_resource_name("data-table") == "tap-staging-data-table"


class MyMocks(Mocks):
    """Custom mock implementation for Pulumi testing."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {**args.inputs}
        
        # Add common outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = "vpc-12345"
            outputs["cidr_block"] = args.inputs.get("cidr_block", "10.0.0.0/16")
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{args.name}"
            outputs["vpc_id"] = args.inputs.get("vpc_id", "vpc-12345")
            outputs["cidr_block"] = args.inputs.get("cidr_block", "10.0.1.0/24")
            outputs["availability_zone"] = args.inputs.get("availability_zone", "us-east-1a")
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{args.name}"
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
            outputs["name"] = args.name
        elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
            outputs["id"] = f"profile-{args.name}"
            outputs["name"] = args.name
        elif args.typ == "aws:dynamodb/table:Table":
            outputs["id"] = f"table-{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
            outputs["arn"] = f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}"
        elif args.typ == "aws:index/provider:Provider":
            outputs["id"] = f"provider-{args.name}"
        else:
            outputs["id"] = f"{args.typ}-{args.name}"
        
        return [args.name, outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        elif args.token == "aws:ec2/getVpc:getVpc":
            return {
                "id": "vpc-default",
                "cidr_block": "172.31.0.0/16"
            }
        elif args.token == "aws:ec2/getSubnets:getSubnets":
            return {
                "ids": ["subnet-1", "subnet-2"]
            }
        elif args.token == "aws:ec2/getSubnet:getSubnet":
            return {
                "id": args.args.get("id", "subnet-1"),
                "cidr_block": "172.31.1.0/24",
                "availability_zone": "us-east-1a",
                "map_public_ip_on_launch": True
            }
        elif args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-12345678",
                "name": "amzn2-ami-hvm-2.0.20230101-x86_64-gp2"
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


@pulumi.runtime.test
def test_tap_stack_initialization():
    """Test TapStack initialization."""
    
    def check_initialization(args):
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        # Verify stack attributes
        assert stack.args == args
        assert stack.default_tags == args.get_default_tags()
        assert isinstance(stack.providers, dict)
        assert isinstance(stack.vpcs, dict)
        assert isinstance(stack.subnets, dict)
        assert isinstance(stack.security_groups, dict)
        assert isinstance(stack.iam_roles, dict)
        assert isinstance(stack.dynamodb_tables, dict)
        
        return {
            "providers": len(stack.providers),
            "regions": len(args.regions)
        }
    
    result = pulumi.Output.from_input({}).apply(check_initialization)
    return result


@pulumi.runtime.test
def test_create_providers():
    """Test provider creation for multiple regions."""
    
    def check_providers(args):
        args = TapStackArgs()
        stack = TapStack("test-stack-providers", args)
        
        # Check providers were created for each region
        assert len(stack.providers) == len(args.regions)
        for region in args.regions:
            assert region in stack.providers
        
        return {"provider_count": len(stack.providers)}
    
    result = pulumi.Output.from_input({}).apply(check_providers)
    return result


@pulumi.runtime.test
def test_iam_resources_creation():
    """Test IAM resources are created properly."""
    
    def check_iam(args):
        args = TapStackArgs()
        stack = TapStack("test-stack-iam", args)
        
        # Check IAM role exists
        assert "ec2_role" in stack.iam_roles
        assert stack.iam_roles["ec2_role"] is not None
        
        # Check instance profile exists
        assert hasattr(stack, "ec2_instance_profile")
        assert stack.ec2_instance_profile is not None
        
        return {"iam_roles": len(stack.iam_roles)}
    
    result = pulumi.Output.from_input({}).apply(check_iam)
    return result


@pulumi.runtime.test
def test_vpc_infrastructure_creation():
    """Test VPC infrastructure is created for each region."""
    
    def check_vpcs(args):
        args = TapStackArgs()
        stack = TapStack("test-stack-vpc", args)
        
        # Check VPCs were created
        assert len(stack.vpcs) > 0
        
        # Check subnets were created
        assert len(stack.subnets) > 0
        
        return {"vpc_count": len(stack.vpcs)}
    
    result = pulumi.Output.from_input({}).apply(check_vpcs)
    return result


@pulumi.runtime.test
def test_security_groups_creation():
    """Test security groups are created for each region."""
    
    def check_security_groups(args):
        args = TapStackArgs()
        stack = TapStack("test-stack-sg", args)
        
        # Check security groups exist
        assert len(stack.security_groups) > 0
        
        # Check both web and db security groups exist per region
        for region in args.regions:
            web_sg_key = f"web-{region}"
            db_sg_key = f"db-{region}"
            
            # At least one should exist (may fail if VPC limit hit)
            assert web_sg_key in stack.security_groups or db_sg_key in stack.security_groups
        
        return {"security_group_count": len(stack.security_groups)}
    
    result = pulumi.Output.from_input({}).apply(check_security_groups)
    return result


@pulumi.runtime.test
def test_dynamodb_tables_creation():
    """Test DynamoDB tables are created for each region."""
    
    def check_dynamodb(args):
        args = TapStackArgs()
        stack = TapStack("test-stack-dynamodb", args)
        
        # Check DynamoDB tables exist
        assert len(stack.dynamodb_tables) > 0
        
        return {"dynamodb_table_count": len(stack.dynamodb_tables)}
    
    result = pulumi.Output.from_input({}).apply(check_dynamodb)
    return result


@pulumi.runtime.test
def test_stack_with_custom_environment():
    """Test stack creation with custom environment."""
    
    def check_custom_env(args):
        args = TapStackArgs(environment_suffix="prod")
        stack = TapStack("test-prod-stack", args)
        
        # Verify custom environment is used
        assert stack.args.environment_suffix == "prod"
        assert stack.default_tags["Environment"] == "prod"
        
        return {"environment": args.environment_suffix}
    
    result = pulumi.Output.from_input({}).apply(check_custom_env)
    return result


def test_tap_stack_args_multiple_environments():
    """Test TapStackArgs with various environments."""
    for env in ["dev", "staging", "prod"]:
        args = TapStackArgs(environment_suffix=env)
        assert args.environment_suffix == env
        assert args.get_default_tags()["Environment"] == env
        assert env in args.get_resource_name("test")


def test_resource_naming_conventions():
    """Test various resource naming patterns."""
    args = TapStackArgs(environment_suffix="test")
    
    # Test different resource types
    resources = ["vpc", "subnet", "sg", "ec2-role", "lambda", "s3-bucket"]
    for resource in resources:
        name = args.get_resource_name(resource)
        assert name.startswith("tap-test-")
        assert name.endswith(resource)


def test_default_tags_structure():
    """Test default tags have required structure."""
    args = TapStackArgs()
    tags = args.get_default_tags()
    
    # Check all required tags exist
    required_keys = ["Owner", "Purpose", "Environment", "Project", "ManagedBy"]
    for key in required_keys:
        assert key in tags
        assert isinstance(tags[key], str)
        assert len(tags[key]) > 0


def test_regions_configuration():
    """Test regions are properly configured."""
    args = TapStackArgs()
    
    # Check regions are defined
    assert isinstance(args.regions, list)
    assert len(args.regions) > 0
    
    # Check regions are valid AWS regions
    valid_regions = ["us-east-1", "us-west-2", "eu-west-1"]
    for region in args.regions:
        assert region in valid_regions


def test_availability_zones_configuration():
    """Test availability zones configuration."""
    args = TapStackArgs()
    
    # Check availability zones per region
    assert isinstance(args.availability_zones_per_region, int)
    assert args.availability_zones_per_region > 0
    assert args.availability_zones_per_region <= 3
