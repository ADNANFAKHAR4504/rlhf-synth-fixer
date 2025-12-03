"""
Unit tests for TapStack infrastructure.

These tests verify the infrastructure code creates the expected AWS resources
with correct configurations using Pulumi's testing framework.
"""
import unittest
from typing import Any, Dict
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resource testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs) -> tuple[str, dict]:
        """Mock resource creation."""
        outputs = args.inputs

        # Generate mock IDs based on resource type
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = f"vpc-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:vpc/vpc-{args.name}"
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}"
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs["id"] = f"igw-{args.name}"
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs["id"] = f"nat-{args.name}"
        elif args.typ == "aws:ec2/eip:Eip":
            outputs["id"] = f"eip-{args.name}"
            outputs["allocation_id"] = f"eipalloc-{args.name}"
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rtb-{args.name}"
        elif args.typ == "aws:ec2/route:Route":
            outputs["id"] = f"route-{args.name}"
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs["id"] = f"rta-{args.name}"
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:security-group/sg-{args.name}"
        elif args.typ == "aws:ec2/securityGroupRule:SecurityGroupRule":
            outputs["id"] = f"sgr-{args.name}"
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs["id"] = f"bucket-{args.name}"
            outputs["arn"] = f"arn:aws:s3:::{args.name}"
            outputs["bucket"] = args.inputs.get("bucket", args.name)
        elif args.typ == "aws:s3/bucketLifecycleConfigurationV2:BucketLifecycleConfigurationV2":
            outputs["id"] = f"lifecycle-{args.name}"
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = f"policy-{args.name}"
        elif args.typ == "aws:ec2/flowLog:FlowLog":
            outputs["id"] = f"fl-{args.name}"
        else:
            outputs["id"] = f"{args.name}-id"

        return args.name, outputs

    def call(self, args: pulumi.runtime.MockCallArgs) -> Dict[str, Any]:
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack infrastructure."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that VPC is created with correct CIDR block."""
        def check_vpc(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify VPC exists
            self.assertIsNotNone(stack.vpc)
            return True

        return pulumi.Output.all().apply(check_vpc)

    @pulumi.runtime.test
    def test_vpc_cidr_block(self):
        """Test VPC has correct CIDR block."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_cidr(cidr):
            self.assertEqual(cidr, "10.0.0.0/16")
            return True

        return stack.vpc.cidr_block.apply(validate_cidr)

    @pulumi.runtime.test
    def test_subnet_creation(self):
        """Test that each VPC has 3 public and 3 private subnets."""
        def check_subnets(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertEqual(len(stack.public_subnets), 3)
            self.assertEqual(len(stack.private_subnets), 3)
            return True

        return pulumi.Output.all().apply(check_subnets)

    @pulumi.runtime.test
    def test_nat_gateway_creation(self):
        """Test that NAT Gateway is created."""
        def check_nat(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.nat_gateway)
            return True

        return pulumi.Output.all().apply(check_nat)

    @pulumi.runtime.test
    def test_internet_gateway_creation(self):
        """Test that Internet Gateway is created."""
        def check_igw(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.igw)
            return True

        return pulumi.Output.all().apply(check_igw)

    @pulumi.runtime.test
    def test_security_groups_creation(self):
        """Test that security groups are created."""
        def check_sgs(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.web_sg)
            self.assertIsNotNone(stack.db_sg)
            return True

        return pulumi.Output.all().apply(check_sgs)

    @pulumi.runtime.test
    def test_flow_logs_creation(self):
        """Test that VPC Flow Logs are created."""
        def check_flow_logs(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.flow_log)
            self.assertIsNotNone(stack.flow_logs_bucket)
            return True

        return pulumi.Output.all().apply(check_flow_logs)

    @pulumi.runtime.test
    def test_resource_tagging(self):
        """Test that resources have correct tags."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_tags(tags):
            self.assertIn("Environment", tags)
            self.assertEqual(tags["Environment"], "production")
            self.assertIn("ManagedBy", tags)
            self.assertEqual(tags["ManagedBy"], "pulumi")
            self.assertIn("Name", tags)
            self.assertIn("test123", tags["Name"])
            return True

        return stack.vpc.tags.apply(validate_tags)

    @pulumi.runtime.test
    def test_environment_suffix_in_names(self):
        """Test that resources include environment suffix."""
        def check_env_suffix(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertEqual(stack.environment_suffix, "test123")
            return True

        return pulumi.Output.all().apply(check_env_suffix)

    @pulumi.runtime.test
    def test_route_tables_creation(self):
        """Test that route tables are created."""
        def check_route_tables(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.public_route_table)
            self.assertIsNotNone(stack.private_route_table)
            return True

        return pulumi.Output.all().apply(check_route_tables)

    @pulumi.runtime.test
    def test_routes_creation(self):
        """Test that routes are created."""
        def check_routes(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.public_route)
            self.assertIsNotNone(stack.private_route)
            return True

        return pulumi.Output.all().apply(check_routes)


if __name__ == "__main__":
    unittest.main()
