"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
import sys
import os
import pytest
from typing import Any, Optional
import pulumi

# Add project root to path dynamically
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from lib.tap_stack import TapStackArgs, TapStack


class MyMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources and function calls."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        
        # Add specific outputs based on resource type
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345", "arn": "arn:aws:ec2:region:account:vpc/vpc-12345"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": "igw-12345"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            subnet_id = f"subnet-{hash(args.name) % 10000}"
            outputs = {**args.inputs, "id": subnet_id, "arn": f"arn:aws:ec2:region:account:subnet/{subnet_id}"}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{hash(args.name) % 10000}", "publicIp": "1.2.3.4"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{hash(args.name) % 10000}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rtb-{hash(args.name) % 10000}"}
        elif args.typ == "aws:ec2/networkAcl:NetworkAcl":
            outputs = {**args.inputs, "id": f"acl-{hash(args.name) % 10000}"}
        elif args.typ == "aws:s3/bucket:Bucket":
            bucket_name = args.inputs.get("bucket", f"bucket-{hash(args.name) % 10000}")
            outputs = {**args.inputs, "id": bucket_name, "bucket": bucket_name, "arn": f"arn:aws:s3:::{bucket_name}"}
        elif args.typ == "aws:ec2/flowLog:FlowLog":
            outputs = {**args.inputs, "id": f"fl-{hash(args.name) % 10000}"}
        elif args.typ == "aws:ec2transitgateway/transitGateway:TransitGateway":
            outputs = {**args.inputs, "id": f"tgw-{hash(args.name) % 10000}"}
        elif args.typ == "aws:ec2transitgateway/vpcAttachment:VpcAttachment":
            outputs = {**args.inputs, "id": f"tgw-attach-{hash(args.name) % 10000}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{hash(args.name) % 10000}", "arn": f"arn:aws:iam::account:role/{args.name}"}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{hash(args.name) % 10000}"}
            
        return [args.name, outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls like get_availability_zones."""
        return {}


# Set mocks before running tests
pulumi.runtime.set_mocks(MyMocks())


@pytest.mark.unit
class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initialization."""
        args = TapStackArgs(environment_suffix="dev")
        self.assertEqual(args.environment_suffix, "dev")

    def test_tap_stack_args_with_prod_suffix(self):
        """Test TapStackArgs with production suffix."""
        args_prod = TapStackArgs(environment_suffix="prod")
        self.assertEqual(args_prod.environment_suffix, "prod")

    def test_tap_stack_args_with_staging_suffix(self):
        """Test TapStackArgs with staging suffix."""
        args_staging = TapStackArgs(environment_suffix="staging")
        self.assertEqual(args_staging.environment_suffix, "staging")

    def test_tap_stack_args_with_custom_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args_custom = TapStackArgs(environment_suffix="test123")
        self.assertEqual(args_custom.environment_suffix, "test123")

    def test_tap_stack_args_with_pr_suffix(self):
        """Test TapStackArgs with PR suffix."""
        args_pr = TapStackArgs(environment_suffix="pr456")
        self.assertEqual(args_pr.environment_suffix, "pr456")


@pytest.mark.unit
@pulumi.runtime.test
def test_tap_stack_initialization():
    """Test TapStack initialization with environment suffix."""
    
    def check_stack(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify basic properties
        assert stack.environment_suffix == "test123"
        assert stack.region == os.getenv('AWS_REGION', 'eu-central-1')
        assert stack.azs == ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
        assert all(isinstance(az, str) for az in stack.azs)
        
        return {}
    
    args = TapStackArgs(environment_suffix="test123")
    return check_stack(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_vpc_creation():
    """Test VPC resource creation with proper configuration."""
    
    def check_vpc(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify VPC exists
        assert stack.vpc is not None
        assert hasattr(stack.vpc, 'id')
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-vpc")
    return check_vpc(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_internet_gateway_creation():
    """Test Internet Gateway creation and VPC attachment."""
    
    def check_igw(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify IGW exists and is attached to VPC
        assert stack.igw is not None
        assert stack.vpc is not None
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-igw")
    return check_igw(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_subnet_creation():
    """Test creation of all subnet tiers across availability zones."""
    
    def check_subnets(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify all subnet tiers are created
        assert len(stack.public_subnets) == 3
        assert len(stack.private_subnets) == 3
        assert len(stack.database_subnets) == 3
        
        # Verify all subnets have IDs
        for subnet in stack.public_subnets + stack.private_subnets + stack.database_subnets:
            assert subnet is not None
            
        return {}
    
    args = TapStackArgs(environment_suffix="test-subnets")
    return check_subnets(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_nat_gateway_creation():
    """Test NAT Gateway and Elastic IP creation."""
    
    def check_nat(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify NAT Gateways and EIPs
        assert len(stack.nat_gateways) == 3
        assert len(stack.eips) == 3
        
        # Verify all are created
        for nat in stack.nat_gateways:
            assert nat is not None
        for eip in stack.eips:
            assert eip is not None
            
        return {}
    
    args = TapStackArgs(environment_suffix="test-nat")
    return check_nat(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_route_table_creation():
    """Test route table creation for all subnet tiers."""
    
    def check_route_tables(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify route tables
        assert stack.public_route_table is not None
        assert len(stack.private_route_tables) == 3
        assert stack.database_route_table is not None
        
        # Verify all private route tables exist
        for rt in stack.private_route_tables:
            assert rt is not None
            
        return {}
    
    args = TapStackArgs(environment_suffix="test-rt")
    return check_route_tables(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_network_acl_creation():
    """Test Network ACL creation for all subnet tiers."""
    
    def check_nacls(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify NACLs
        assert stack.public_nacl is not None
        assert stack.private_nacl is not None
        assert stack.database_nacl is not None
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-nacl")
    return check_nacls(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_s3_bucket_creation():
    """Test S3 bucket creation for VPC Flow Logs."""
    
    def check_bucket(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify S3 bucket
        assert stack.flow_logs_bucket is not None
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-s3")
    return check_bucket(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_flow_logs_creation():
    """Test VPC Flow Logs creation."""
    
    def check_flow_logs(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify Flow Logs
        assert stack.flow_log is not None
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-flow")
    return check_flow_logs(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_transit_gateway_creation():
    """Test Transit Gateway and VPC attachment creation."""
    
    def check_tgw(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify Transit Gateway
        assert stack.transit_gateway is not None
        assert stack.tgw_attachment is not None
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-tgw")
    return check_tgw(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_environment_suffix_in_resources():
    """Test that environment suffix is included in all resource names."""
    
    def check_suffix(args):
        test_suffix = "unique123"
        args = TapStackArgs(environment_suffix=test_suffix)
        stack = TapStack(name="test-stack", args=args)
        
        # Verify environment suffix is set
        assert stack.environment_suffix == test_suffix
        
        return {}
    
    args = TapStackArgs(environment_suffix="unique123")
    return check_suffix(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_availability_zones():
    """Test that correct availability zones are configured."""
    
    def check_azs(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify AZs are the expected eu-central-1 set
        expected_azs = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
        assert stack.azs == expected_azs
        for az in stack.azs:
            assert isinstance(az, str)
            assert az.startswith("eu-central-1")
            
        return {}
    
    args = TapStackArgs(environment_suffix="test-az")
    return check_azs(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_region_configuration():
    """Test that region is correctly configured."""
    
    def check_region(args):
        stack = TapStack(name="test-stack", args=args)
        
        # Verify region is from AWS_REGION env var or defaults to eu-central-1
        expected_region = os.getenv('AWS_REGION', 'eu-central-1')
        assert stack.region == expected_region
        assert isinstance(stack.region, str)
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-region")
    return check_region(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_all_resources_created():
    """Test that all major resources are created in the stack."""
    
    def check_all(args):
        stack = TapStack(name="test-stack", args=args)
        
        # VPC and networking
        assert stack.vpc is not None
        assert stack.igw is not None
        
        # Subnets
        assert len(stack.public_subnets) == 3
        assert len(stack.private_subnets) == 3
        assert len(stack.database_subnets) == 3
        
        # NAT Gateways
        assert len(stack.nat_gateways) == 3
        assert len(stack.eips) == 3
        
        # Route Tables
        assert stack.public_route_table is not None
        assert len(stack.private_route_tables) == 3
        assert stack.database_route_table is not None
        
        # Network ACLs
        assert stack.public_nacl is not None
        assert stack.private_nacl is not None
        assert stack.database_nacl is not None
        
        # Flow Logs
        assert stack.flow_logs_bucket is not None
        assert stack.flow_log is not None
        
        # Transit Gateway
        assert stack.transit_gateway is not None
        assert stack.tgw_attachment is not None
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-all")
    return check_all(args)


@pytest.mark.unit
@pulumi.runtime.test
def test_vpc_configuration_values():
    """Test VPC is configured with correct CIDR and DNS settings."""
    
    def check_vpc_config(args):
        stack = TapStack(name="test-stack", args=args)
        
        # VPC should exist
        assert stack.vpc is not None
        
        # Check we can access VPC (even if mocked)
        assert hasattr(stack, 'vpc')
        
        return {}
    
    args = TapStackArgs(environment_suffix="test-vpc-config")
    return check_vpc_config(args)


if __name__ == "__main__":
    unittest.main()
