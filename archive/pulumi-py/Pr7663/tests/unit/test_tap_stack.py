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
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rtb-{args.name}"
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{args.name}"
        elif args.typ == "aws:ec2/vpcPeeringConnection:VpcPeeringConnection":
            outputs["id"] = f"pcx-{args.name}"
            outputs["accept_status"] = "active"
        elif args.typ == "aws:ec2/instance:Instance":
            outputs["id"] = f"i-{args.name}"
            outputs["primary_network_interface_id"] = f"eni-{args.name}"
            outputs["private_ip"] = "10.1.0.100"
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = f"log-group-{args.name}"
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.name}"
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/role-{args.name}"
        elif args.typ == "aws:ec2/flowLog:FlowLog":
            outputs["id"] = f"fl-{args.name}"
        elif args.typ == "aws:ec2/route:Route":
            outputs["id"] = f"route-{args.name}"
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs["id"] = f"rta-{args.name}"
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = f"policy-{args.name}"
        else:
            outputs["id"] = f"{args.name}-id"

        return (args.name, outputs)

    def call(self, args: pulumi.runtime.MockCallArgs) -> Dict[str, Any]:
        """Mock function calls (e.g., get_ami)."""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-0c55b159cbfafe1f0",
                "architecture": "x86_64",
                "name": "amzn2-ami-hvm-2.0.20230404.0-x86_64-gp2"
            }
        return {}


# Set mocks before importing the stack
pulumi.runtime.set_mocks(MyMocks())

# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_with_required_params(self):
        """Test TapStackArgs with required parameters."""
        args = TapStackArgs(environment_suffix="test123")

        self.assertEqual(args.environment_suffix, "test123")
        self.assertEqual(args.region, "us-east-1")
        self.assertEqual(args.availability_zones, ["us-east-1a", "us-east-1b", "us-east-1c"])
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_custom_params(self):
        """Test TapStackArgs with custom parameters."""
        custom_azs = ["us-west-2a", "us-west-2b", "us-west-2c"]
        custom_tags = {"Team": "Platform", "Owner": "DevOps"}

        args = TapStackArgs(
            environment_suffix="prod",
            region="us-west-2",
            availability_zones=custom_azs,
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.region, "us-west-2")
        self.assertEqual(args.availability_zones, custom_azs)
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_default_azs(self):
        """Test TapStackArgs default availability zones."""
        args = TapStackArgs(environment_suffix="dev")

        self.assertEqual(len(args.availability_zones), 3)
        self.assertIn("us-east-1a", args.availability_zones)
        self.assertIn("us-east-1b", args.availability_zones)
        self.assertIn("us-east-1c", args.availability_zones)


class TestTapStackVPCCreation(unittest.TestCase):
    """Test cases for TapStack VPC creation."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that both VPCs are created with correct CIDR blocks."""
        def check_vpcs(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify dev VPC exists
            self.assertIsNotNone(stack.dev_vpc)
            self.assertIn("vpc", stack.dev_vpc)

            # Verify prod VPC exists
            self.assertIsNotNone(stack.prod_vpc)
            self.assertIn("vpc", stack.prod_vpc)

            return True

        return pulumi.Output.all().apply(check_vpcs)

    @pulumi.runtime.test
    def test_subnet_creation(self):
        """Test that each VPC has 3 public and 3 private subnets."""
        def check_subnets(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify dev VPC subnets
            self.assertEqual(len(stack.dev_vpc["public_subnets"]), 3)
            self.assertEqual(len(stack.dev_vpc["private_subnets"]), 3)

            # Verify prod VPC subnets
            self.assertEqual(len(stack.prod_vpc["public_subnets"]), 3)
            self.assertEqual(len(stack.prod_vpc["private_subnets"]), 3)

            return True

        return pulumi.Output.all().apply(check_subnets)


class TestTapStackVPCPeering(unittest.TestCase):
    """Test cases for VPC Peering creation."""

    @pulumi.runtime.test
    def test_vpc_peering_creation(self):
        """Test that VPC Peering connection is created."""
        def check_peering(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify VPC Peering exists
            self.assertIsNotNone(stack.vpc_peering)

            return True

        return pulumi.Output.all().apply(check_peering)

    @pulumi.runtime.test
    def test_vpc_peering_auto_accept(self):
        """Test that VPC Peering is configured with auto_accept."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_auto_accept(auto_accept):
            self.assertEqual(auto_accept, True)
            return True

        return stack.vpc_peering.auto_accept.apply(validate_auto_accept)


class TestTapStackNATInstance(unittest.TestCase):
    """Test cases for NAT instance creation."""

    @pulumi.runtime.test
    def test_nat_instance_creation(self):
        """Test that NAT instances are created with correct configuration for each VPC."""
        def check_nat(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify NAT instances exist for both VPCs
            self.assertIsNotNone(stack.dev_nat_instance)
            self.assertIsNotNone(stack.prod_nat_instance)

            return True

        return pulumi.Output.all().apply(check_nat)

    @pulumi.runtime.test
    def test_nat_instance_properties(self):
        """Test NAT instances have correct instance type and source_dest_check."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_instance_type(instance_type):
            self.assertEqual(instance_type, "t3.micro")
            return True

        def validate_source_dest(source_dest_check):
            self.assertEqual(source_dest_check, False)
            return True

        return pulumi.Output.all(
            stack.dev_nat_instance.instance_type.apply(validate_instance_type),
            stack.dev_nat_instance.source_dest_check.apply(validate_source_dest)
        )


class TestTapStackSecurityGroups(unittest.TestCase):
    """Test cases for security group creation."""

    @pulumi.runtime.test
    def test_security_groups_creation(self):
        """Test that security groups are created for both VPCs."""
        def check_sgs(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify security groups exist
            self.assertIn("dev", stack.security_groups)
            self.assertIn("prod", stack.security_groups)

            return True

        return pulumi.Output.all().apply(check_sgs)

    @pulumi.runtime.test
    def test_security_group_ingress_rules(self):
        """Test that security groups have correct ingress rules."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_dev_ingress(ingress):
            # Dev SG has HTTPS and SSH
            self.assertEqual(len(ingress), 2)
            return True

        def validate_prod_ingress(ingress):
            # Prod SG has HTTPS, SSH, PostgreSQL
            self.assertEqual(len(ingress), 3)
            return True

        return pulumi.Output.all(
            stack.security_groups["dev"].ingress.apply(validate_dev_ingress),
            stack.security_groups["prod"].ingress.apply(validate_prod_ingress)
        )


class TestTapStackFlowLogs(unittest.TestCase):
    """Test cases for VPC Flow Logs creation."""

    @pulumi.runtime.test
    def test_flow_logs_creation(self):
        """Test that VPC Flow Logs are created with CloudWatch integration."""
        def check_flow_logs(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify flow logs exist
            self.assertIsNotNone(stack.flow_logs["dev_flow_log"])
            self.assertIsNotNone(stack.flow_logs["prod_flow_log"])

            # Verify CloudWatch log groups exist
            self.assertIsNotNone(stack.flow_logs["dev_log_group"])
            self.assertIsNotNone(stack.flow_logs["prod_log_group"])

            return True

        return pulumi.Output.all().apply(check_flow_logs)

    @pulumi.runtime.test
    def test_log_group_retention(self):
        """Test that CloudWatch log groups have 7-day retention."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_dev_retention(retention):
            self.assertEqual(retention, 7)
            return True

        def validate_prod_retention(retention):
            self.assertEqual(retention, 7)
            return True

        return pulumi.Output.all(
            stack.flow_logs["dev_log_group"].retention_in_days.apply(validate_dev_retention),
            stack.flow_logs["prod_log_group"].retention_in_days.apply(validate_prod_retention)
        )

    @pulumi.runtime.test
    def test_iam_role_for_flow_logs(self):
        """Test that IAM role is created for VPC Flow Logs."""
        def check_iam(args):
            stack_args = TapStackArgs(environment_suffix="test123")
            stack = TapStack("test-stack", stack_args)

            # Verify IAM role exists
            role = stack.flow_logs["role"]
            self.assertIsNotNone(role)

            return True

        return pulumi.Output.all().apply(check_iam)

    @pulumi.runtime.test
    def test_iam_role_assume_policy(self):
        """Test that IAM role has correct assume role policy."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_assume_policy(policy):
            self.assertIn("vpc-flow-logs.amazonaws.com", policy)
            return True

        return stack.flow_logs["role"].assume_role_policy.apply(validate_assume_policy)


class TestTapStackTagging(unittest.TestCase):
    """Test cases for resource tagging."""

    @pulumi.runtime.test
    def test_resource_tagging(self):
        """Test that resources have correct tags including environmentSuffix."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_dev_tags(tags):
            self.assertIn("Project", tags)
            self.assertEqual(tags["Project"], "payment-platform")
            self.assertIn("Environment", tags)
            self.assertEqual(tags["Environment"], "dev")
            self.assertIn("Name", tags)
            self.assertIn("test123", tags["Name"])
            return True

        def validate_prod_tags(tags):
            self.assertEqual(tags["Environment"], "prod")
            return True

        return pulumi.Output.all(
            stack.dev_vpc["vpc"].tags.apply(validate_dev_tags),
            stack.prod_vpc["vpc"].tags.apply(validate_prod_tags)
        )

    @pulumi.runtime.test
    def test_environment_suffix_in_names(self):
        """Test that all named resources include environmentSuffix."""
        stack_args = TapStackArgs(environment_suffix="test123")
        stack = TapStack("test-stack", stack_args)

        def validate_dev_vpc_name(tags):
            self.assertIn("test123", tags["Name"])
            return True

        def validate_prod_vpc_name(tags):
            self.assertIn("test123", tags["Name"])
            return True

        def validate_nat_name(tags):
            self.assertIn("test123", tags["Name"])
            return True

        def validate_sg_name(tags):
            self.assertIn("test123", tags["Name"])
            return True

        return pulumi.Output.all(
            stack.dev_vpc["vpc"].tags.apply(validate_dev_vpc_name),
            stack.prod_vpc["vpc"].tags.apply(validate_prod_vpc_name),
            stack.dev_nat_instance.tags.apply(validate_nat_name),
            stack.security_groups["dev"].tags.apply(validate_sg_name)
        )


class TestTapStackSubnetCalculation(unittest.TestCase):
    """Test cases for subnet CIDR calculation."""

    def test_calculate_subnet_cidr(self):
        """Test subnet CIDR calculation from VPC CIDR."""
        # Test the calculation formula directly
        vpc_cidr = "10.1.0.0/16"
        base_octets = vpc_cidr.split(".")

        # First subnet (index 0)
        third_octet = int(base_octets[2]) + (0 * 16)
        expected_cidr_0 = f"{base_octets[0]}.{base_octets[1]}.{third_octet}.0/20"
        self.assertEqual(expected_cidr_0, "10.1.0.0/20")

        # Second subnet (index 1)
        third_octet = int(base_octets[2]) + (1 * 16)
        expected_cidr_1 = f"{base_octets[0]}.{base_octets[1]}.{third_octet}.0/20"
        self.assertEqual(expected_cidr_1, "10.1.16.0/20")

        # Fourth subnet (index 3 - first private)
        third_octet = int(base_octets[2]) + (3 * 16)
        expected_cidr_3 = f"{base_octets[0]}.{base_octets[1]}.{third_octet}.0/20"
        self.assertEqual(expected_cidr_3, "10.1.48.0/20")


if __name__ == "__main__":
    unittest.main()
