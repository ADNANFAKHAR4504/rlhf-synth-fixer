"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
from typing import Any, Dict
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resource testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs) -> tuple:
        """Mock resource creation."""
        outputs = dict(args.inputs)

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

        return (args.name, outputs)

    def call(self, args: pulumi.runtime.MockCallArgs) -> Dict[str, Any]:
        """Mock function calls."""
        return {}


# Set mocks before importing the stack
pulumi.runtime.set_mocks(MyMocks())

# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_with_custom_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args = TapStackArgs(environment_suffix='prod')

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Team': 'Platform', 'Owner': 'DevOps'}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_with_all_params(self):
        """Test TapStackArgs with all parameters."""
        custom_tags = {'Project': 'Test'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_suffix_uses_default(self):
        """Test TapStackArgs with None suffix falls back to default."""
        args = TapStackArgs(environment_suffix=None)

        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStackVPCCreation(unittest.TestCase):
    """Test cases for TapStack VPC creation."""

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
    def test_vpc_dns_settings(self):
        """Test VPC has DNS settings enabled."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_dns(values):
            hostnames, support = values
            self.assertTrue(hostnames)
            self.assertTrue(support)
            return True

        return pulumi.Output.all(
            stack.vpc.enable_dns_hostnames,
            stack.vpc.enable_dns_support
        ).apply(validate_dns)


class TestTapStackSubnets(unittest.TestCase):
    """Test cases for subnet creation."""

    @pulumi.runtime.test
    def test_public_subnet_count(self):
        """Test that 3 public subnets are created."""
        def check_subnets(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertEqual(len(stack.public_subnets), 3)
            return True

        return pulumi.Output.all().apply(check_subnets)

    @pulumi.runtime.test
    def test_private_subnet_count(self):
        """Test that 3 private subnets are created."""
        def check_subnets(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertEqual(len(stack.private_subnets), 3)
            return True

        return pulumi.Output.all().apply(check_subnets)

    @pulumi.runtime.test
    def test_public_subnets_have_public_ip(self):
        """Test public subnets have map_public_ip_on_launch enabled."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_public_ip(value):
            self.assertTrue(value)
            return True

        return stack.public_subnets[0].map_public_ip_on_launch.apply(validate_public_ip)

    @pulumi.runtime.test
    def test_private_subnets_no_public_ip(self):
        """Test private subnets have map_public_ip_on_launch disabled."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_no_public_ip(value):
            self.assertFalse(value)
            return True

        return stack.private_subnets[0].map_public_ip_on_launch.apply(validate_no_public_ip)


class TestTapStackGateways(unittest.TestCase):
    """Test cases for Internet Gateway and NAT Gateway."""

    @pulumi.runtime.test
    def test_internet_gateway_creation(self):
        """Test Internet Gateway is created."""
        def check_igw(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.igw)
            return True

        return pulumi.Output.all().apply(check_igw)

    @pulumi.runtime.test
    def test_nat_gateway_creation(self):
        """Test NAT Gateway is created."""
        def check_nat(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.nat_gateway)
            return True

        return pulumi.Output.all().apply(check_nat)

    @pulumi.runtime.test
    def test_elastic_ip_creation(self):
        """Test Elastic IP is created for NAT Gateway."""
        def check_eip(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.eip)
            return True

        return pulumi.Output.all().apply(check_eip)


class TestTapStackRouteTables(unittest.TestCase):
    """Test cases for route table creation."""

    @pulumi.runtime.test
    def test_public_route_table_creation(self):
        """Test public route table is created."""
        def check_rt(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.public_route_table)
            return True

        return pulumi.Output.all().apply(check_rt)

    @pulumi.runtime.test
    def test_private_route_table_creation(self):
        """Test private route table is created."""
        def check_rt(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.private_route_table)
            return True

        return pulumi.Output.all().apply(check_rt)

    @pulumi.runtime.test
    def test_public_route_creation(self):
        """Test public route to IGW is created."""
        def check_route(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.public_route)
            return True

        return pulumi.Output.all().apply(check_route)

    @pulumi.runtime.test
    def test_private_route_creation(self):
        """Test private route to NAT Gateway is created."""
        def check_route(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.private_route)
            return True

        return pulumi.Output.all().apply(check_route)


class TestTapStackSecurityGroups(unittest.TestCase):
    """Test cases for security group creation."""

    @pulumi.runtime.test
    def test_web_security_group_creation(self):
        """Test web server security group is created."""
        def check_sg(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.web_sg)
            return True

        return pulumi.Output.all().apply(check_sg)

    @pulumi.runtime.test
    def test_db_security_group_creation(self):
        """Test database security group is created."""
        def check_sg(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.db_sg)
            return True

        return pulumi.Output.all().apply(check_sg)

    @pulumi.runtime.test
    def test_web_sg_has_ingress_rules(self):
        """Test web security group has ingress rules."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_ingress(ingress):
            # Should have HTTPS and SSH rules
            self.assertEqual(len(ingress), 2)
            return True

        return stack.web_sg.ingress.apply(validate_ingress)

    @pulumi.runtime.test
    def test_web_sg_has_egress_rules(self):
        """Test web security group has egress rules."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_egress(egress):
            # Should have all outbound rule
            self.assertEqual(len(egress), 1)
            return True

        return stack.web_sg.egress.apply(validate_egress)


class TestTapStackFlowLogs(unittest.TestCase):
    """Test cases for VPC Flow Logs."""

    @pulumi.runtime.test
    def test_flow_logs_bucket_creation(self):
        """Test S3 bucket for flow logs is created."""
        def check_bucket(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.flow_logs_bucket)
            return True

        return pulumi.Output.all().apply(check_bucket)

    @pulumi.runtime.test
    def test_flow_logs_lifecycle_creation(self):
        """Test lifecycle policy for flow logs bucket is created."""
        def check_lifecycle(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.flow_logs_lifecycle)
            return True

        return pulumi.Output.all().apply(check_lifecycle)

    @pulumi.runtime.test
    def test_flow_logs_role_creation(self):
        """Test IAM role for flow logs is created."""
        def check_role(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.flow_logs_role)
            return True

        return pulumi.Output.all().apply(check_role)

    @pulumi.runtime.test
    def test_flow_log_creation(self):
        """Test VPC Flow Log is created."""
        def check_flow_log(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            self.assertIsNotNone(stack.flow_log)
            return True

        return pulumi.Output.all().apply(check_flow_log)

    @pulumi.runtime.test
    def test_flow_log_traffic_type(self):
        """Test flow log captures all traffic."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_traffic_type(traffic_type):
            self.assertEqual(traffic_type, "ALL")
            return True

        return stack.flow_log.traffic_type.apply(validate_traffic_type)


class TestTapStackTagging(unittest.TestCase):
    """Test cases for resource tagging."""

    @pulumi.runtime.test
    def test_vpc_has_environment_tag(self):
        """Test VPC has Environment tag."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_tags(tags):
            self.assertIn("Environment", tags)
            self.assertEqual(tags["Environment"], "production")
            return True

        return stack.vpc.tags.apply(validate_tags)

    @pulumi.runtime.test
    def test_vpc_has_managed_by_tag(self):
        """Test VPC has ManagedBy tag."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_tags(tags):
            self.assertIn("ManagedBy", tags)
            self.assertEqual(tags["ManagedBy"], "pulumi")
            return True

        return stack.vpc.tags.apply(validate_tags)

    @pulumi.runtime.test
    def test_vpc_has_name_tag_with_suffix(self):
        """Test VPC Name tag includes environment suffix."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_tags(tags):
            self.assertIn("Name", tags)
            self.assertIn("test123", tags["Name"])
            return True

        return stack.vpc.tags.apply(validate_tags)

    @pulumi.runtime.test
    def test_custom_tags_are_applied(self):
        """Test custom tags are applied to resources."""
        custom_tags = {"Team": "Platform", "CostCenter": "12345"}
        stack_args = TapStackArgs(environment_suffix="test123", tags=custom_tags)
        stack = TapStack("test-stack", stack_args)

        def validate_tags(tags):
            self.assertIn("Team", tags)
            self.assertEqual(tags["Team"], "Platform")
            self.assertIn("CostCenter", tags)
            self.assertEqual(tags["CostCenter"], "12345")
            return True

        return stack.vpc.tags.apply(validate_tags)


class TestTapStackEnvironmentSuffix(unittest.TestCase):
    """Test cases for environment suffix usage."""

    @pulumi.runtime.test
    def test_environment_suffix_stored(self):
        """Test environment suffix is stored in stack."""
        def check_suffix(args):
            stack_args = TapStackArgs(environment_suffix="prod")
            stack = TapStack("test-stack", stack_args)

            self.assertEqual(stack.environment_suffix, "prod")
            return True

        return pulumi.Output.all().apply(check_suffix)

    @pulumi.runtime.test
    def test_default_environment_suffix(self):
        """Test default environment suffix is 'dev'."""
        def check_suffix(args):
            stack_args = TapStackArgs()
            stack = TapStack("test-stack", stack_args)

            self.assertEqual(stack.environment_suffix, "dev")
            return True

        return pulumi.Output.all().apply(check_suffix)


if __name__ == "__main__":
    unittest.main()
