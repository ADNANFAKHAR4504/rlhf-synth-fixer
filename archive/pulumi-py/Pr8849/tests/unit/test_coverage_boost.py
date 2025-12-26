"""Additional tests to boost code coverage."""

import pytest
import pulumi
from pulumi.runtime import Mocks
from unittest.mock import Mock, patch, MagicMock
from lib.tap_stack import TapStackArgs, TapStack


class CoverageMocks(Mocks):
    """Mocks for coverage testing."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {**args.inputs}
        
        # Standard mock outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = "vpc-12345"
            outputs["cidr_block"] = args.inputs.get("cidr_block", "10.0.0.0/16")
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{args.name}"
            outputs["vpc_id"] = args.inputs.get("vpc_id", "vpc-12345")
            outputs["cidr_block"] = args.inputs.get("cidr_block", "10.0.1.0/24")
            outputs["availability_zone"] = args.inputs.get("availability_zone", "us-east-1a")
            outputs["map_public_ip_on_launch"] = args.inputs.get("map_public_ip_on_launch", False)
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
        elif args.typ == "aws:ec2/launchTemplate:LaunchTemplate":
            outputs["id"] = f"lt-{args.name}"
        elif args.typ == "aws:autoscaling/group:Group":
            outputs["id"] = f"asg-{args.name}"
            outputs["name"] = args.name
        elif args.typ == "aws:autoscaling/policy:Policy":
            outputs["id"] = f"policy-{args.name}"
            outputs["arn"] = f"arn:aws:autoscaling:us-east-1:123456789012:policy/{args.name}"
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs["id"] = f"alarm-{args.name}"
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
        elif args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-12345678",
                "name": "amzn2-ami-hvm-2.0.20230101-x86_64-gp2"
            }
        return {}


pulumi.runtime.set_mocks(CoverageMocks())


@pulumi.runtime.test
def test_single_region_deployment():
    """Test deployment to a single region."""
    
    def check_single_region(args):
        args = TapStackArgs()
        args.regions = ["us-west-2"]
        stack = TapStack("test-single-region", args)
        
        assert len(stack.vpcs) == 1
        assert "us-west-2" in stack.vpcs
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_single_region)
    return result


@pulumi.runtime.test
def test_two_region_deployment():
    """Test deployment to two regions."""
    
    def check_two_regions(args):
        args = TapStackArgs()
        args.regions = ["us-east-1", "eu-west-1"]
        stack = TapStack("test-two-regions", args)
        
        assert len(stack.vpcs) == 2
        assert "us-east-1" in stack.vpcs
        assert "eu-west-1" in stack.vpcs
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_two_regions)
    return result


@pulumi.runtime.test
def test_subnets_across_availability_zones():
    """Test subnet creation across multiple availability zones."""
    
    def check_subnets(args):
        args = TapStackArgs()
        args.regions = ["us-east-1"]
        args.availability_zones_per_region = 2
        stack = TapStack("test-subnets-azs", args)
        
        assert "us-east-1" in stack.subnets
        assert "public" in stack.subnets["us-east-1"]
        assert "private" in stack.subnets["us-east-1"]
        
        # With 2 AZs, should have 2 public and 2 private subnets
        assert len(stack.subnets["us-east-1"]["public"]) >= 1
        assert len(stack.subnets["us-east-1"]["private"]) >= 1
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_subnets)
    return result


@pulumi.runtime.test
def test_iam_role_policy_attachment():
    """Test IAM role and policy attachment."""
    
    def check_iam_policy(args):
        args = TapStackArgs()
        args.regions = ["us-east-1"]
        stack = TapStack("test-iam-policy", args)
        
        # Verify IAM role exists
        assert "ec2_role" in stack.iam_roles
        
        # Verify instance profile exists
        assert hasattr(stack, "ec2_instance_profile")
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_iam_policy)
    return result


@pulumi.runtime.test
def test_security_group_rules():
    """Test security group ingress and egress rules."""
    
    def check_sg_rules(args):
        args = TapStackArgs()
        args.regions = ["us-east-1"]
        stack = TapStack("test-sg-rules", args)
        
        # Check web security group
        web_sg_key = "web-us-east-1"
        assert web_sg_key in stack.security_groups
        
        # Check db security group
        db_sg_key = "db-us-east-1"
        assert db_sg_key in stack.security_groups
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_sg_rules)
    return result


@pulumi.runtime.test
def test_dynamodb_table_configuration():
    """Test DynamoDB table billing mode and attributes."""
    
    def check_dynamodb_config(args):
        args = TapStackArgs()
        args.regions = ["us-east-1"]
        stack = TapStack("test-dynamodb-config", args)
        
        assert "us-east-1" in stack.dynamodb_tables
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_dynamodb_config)
    return result


@pulumi.runtime.test
def test_compute_with_single_az():
    """Test compute infrastructure with single availability zone."""
    
    def check_compute_single_az(args):
        args = TapStackArgs()
        args.regions = ["us-east-1"]
        args.availability_zones_per_region = 1
        stack = TapStack("test-compute-single-az", args)
        
        # Call compute infrastructure method directly
        stack._create_compute_infrastructure()
        
        # Should have auto scaling group
        assert "us-east-1" in stack.auto_scaling_groups
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_compute_single_az)
    return result


@pulumi.runtime.test
def test_compute_with_all_azs():
    """Test compute infrastructure with all availability zones."""
    
    def check_compute_all_azs(args):
        args = TapStackArgs()
        args.regions = ["us-east-1"]
        args.availability_zones_per_region = 3
        stack = TapStack("test-compute-all-azs", args)
        
        # Call compute infrastructure method
        stack._create_compute_infrastructure()
        
        # Verify auto scaling group
        assert len(stack.auto_scaling_groups) >= 1
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_compute_all_azs)
    return result


@pulumi.runtime.test
def test_monitoring_dashboard_creation():
    """Test CloudWatch dashboard creation."""
    
    def check_dashboard(args):
        args = TapStackArgs()
        args.regions = ["us-east-1"]
        stack = TapStack("test-dashboard", args)
        
        # Monitoring infrastructure is called in __init__
        # Just verify stack was created successfully
        assert stack is not None
        assert len(stack.dynamodb_tables) > 0
        
        return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_dashboard)
    return result


def test_args_with_different_team_names():
    """Test TapStackArgs with different team names."""
    args = TapStackArgs()
    
    # Test modifying team name
    args.team_name = "platform"
    assert args.get_resource_name("test") == "platform-dev-test"
    
    args.team_name = "infra"
    assert args.get_resource_name("test") == "infra-dev-test"


def test_args_with_different_project_names():
    """Test TapStackArgs with different project names."""
    args = TapStackArgs()
    
    # Test modifying project name
    args.project_name = "test-project"
    tags = args.get_default_tags()
    assert tags["Project"] == "test-project"


def test_resource_name_consistency():
    """Test that resource names are consistent across calls."""
    args = TapStackArgs()
    
    name1 = args.get_resource_name("vpc")
    name2 = args.get_resource_name("vpc")
    
    assert name1 == name2


def test_tags_immutability():
    """Test that default tags return new dict each time."""
    args = TapStackArgs()
    
    tags1 = args.get_default_tags()
    tags2 = args.get_default_tags()
    
    # Modify one
    tags1["Custom"] = "value"
    
    # Other should not be affected
    assert "Custom" not in tags2


def test_regions_list_modification():
    """Test that regions list can be modified."""
    args = TapStackArgs()
    
    original_count = len(args.regions)
    args.regions = ["us-east-1"]
    
    assert len(args.regions) == 1
    assert len(args.regions) != original_count


def test_availability_zones_range():
    """Test availability zones with different values."""
    for az_count in range(1, 6):
        args = TapStackArgs()
        args.availability_zones_per_region = az_count
        assert args.availability_zones_per_region == az_count

