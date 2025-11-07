"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
Tests infrastructure resource configuration without making actual AWS API calls.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resource creation during testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """
        Create a mock resource with appropriate outputs based on resource type.

        Args:
            args: Resource arguments including type, name, and inputs

        Returns:
            Tuple of (resource_id, outputs_dict)
        """
        outputs = dict(args.inputs)

        # Add resource-specific outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = f"vpc-{args.name}"
            outputs["cidrBlock"] = args.inputs.get("cidrBlock", "10.0.0.0/16")
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:vpc/vpc-{args.name}"

        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}"
            outputs["availabilityZone"] = args.inputs.get("availabilityZone", "us-east-1a")

        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs["id"] = f"igw-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:internet-gateway/igw-{args.name}"

        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs["id"] = f"nat-{args.name}"

        elif args.typ == "aws:ec2/eip:Eip":
            outputs["id"] = f"eipalloc-{args.name}"
            outputs["publicIp"] = "1.2.3.4"

        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:security-group/sg-{args.name}"

        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rtb-{args.name}"

        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/role-{args.name}"

        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = f"/aws/vpc/{args.name}"
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:/aws/vpc/{args.name}"

        elif args.typ == "aws:ec2/flowLog:FlowLog":
            outputs["id"] = f"fl-{args.name}"

        else:
            outputs["id"] = f"id-{args.name}"

        return [outputs["id"], outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """
        Mock AWS API calls like get_availability_zones.

        Args:
            args: Call arguments including token and inputs

        Returns:
            Dict of outputs from the mocked call
        """
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zoneIds": ["use1-az1", "use1-az2", "use1-az3"],
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs  # noqa: E402 pylint: disable=wrong-import-position


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Owner": "DevOps", "CostCenter": "Engineering"}
        args = TapStackArgs(environment_suffix='dev', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def test_vpc_configuration(self):
        """Test VPC is created with correct CIDR and DNS settings."""

        @pulumi.runtime.test
        def check_vpc():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            def check_vpc_properties(args_list):
                vpc_id, vpc_cidr, dns_hostnames, dns_support = args_list
                self.assertEqual(vpc_cidr, "10.0.0.0/16")
                self.assertTrue(dns_hostnames)
                self.assertTrue(dns_support)

            return pulumi.Output.all(
                stack.vpc.id,
                stack.vpc.cidr_block,
                stack.vpc.enable_dns_hostnames,
                stack.vpc.enable_dns_support
            ).apply(check_vpc_properties)

        check_vpc()

    def test_subnet_creation(self):
        """Test that correct number of subnets are created with proper CIDRs."""

        @pulumi.runtime.test
        def check_subnets():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Check public subnets
            self.assertEqual(len(stack.public_subnets), 3)
            # Check private subnets
            self.assertEqual(len(stack.private_subnets), 3)

            def check_public_cidrs(cidrs):
                expected_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
                self.assertEqual(sorted(cidrs), sorted(expected_cidrs))

            def check_private_cidrs(cidrs):
                expected_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
                self.assertEqual(sorted(cidrs), sorted(expected_cidrs))

            public_cidr_check = pulumi.Output.all(
                *[subnet.cidr_block for subnet in stack.public_subnets]
            ).apply(check_public_cidrs)

            private_cidr_check = pulumi.Output.all(
                *[subnet.cidr_block for subnet in stack.private_subnets]
            ).apply(check_private_cidrs)

            return pulumi.Output.all(public_cidr_check, private_cidr_check)

        check_subnets()

    def test_nat_gateway_count(self):
        """Test that 3 NAT Gateways are created (one per AZ)."""

        @pulumi.runtime.test
        def check_nat_gateways():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            self.assertEqual(len(stack.nat_gateways), 3)
            self.assertEqual(len(stack.eips), 3)

        check_nat_gateways()

    def test_security_group_rules(self):
        """Test security group allows HTTPS inbound and all outbound."""

        @pulumi.runtime.test
        def check_security_group():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            def check_ingress_rules(ingress):
                self.assertEqual(len(ingress), 1)
                rule = ingress[0]
                self.assertEqual(rule.get('protocol'), 'tcp')
                # Check both camelCase and snake_case keys
                self.assertEqual(rule.get('fromPort') or rule.get('from_port'), 443)
                self.assertEqual(rule.get('toPort') or rule.get('to_port'), 443)
                cidr_blocks = rule.get('cidrBlocks') or rule.get('cidr_blocks', [])
                self.assertIn('0.0.0.0/0', cidr_blocks)

            def check_egress_rules(egress):
                self.assertEqual(len(egress), 1)
                rule = egress[0]
                self.assertEqual(rule.get('protocol'), '-1')
                cidr_blocks = rule.get('cidrBlocks') or rule.get('cidr_blocks', [])
                self.assertIn('0.0.0.0/0', cidr_blocks)

            ingress_check = stack.security_group.ingress.apply(check_ingress_rules)
            egress_check = stack.security_group.egress.apply(check_egress_rules)

            return pulumi.Output.all(ingress_check, egress_check)

        check_security_group()

    def test_flow_log_configuration(self):
        """Test VPC Flow Log is configured with correct settings."""

        @pulumi.runtime.test
        def check_flow_log():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            def check_flow_log_properties(args_list):
                traffic_type, log_dest_type, interval = args_list
                self.assertEqual(traffic_type, "ALL")
                self.assertEqual(log_dest_type, "cloud-watch-logs")
                self.assertEqual(interval, 600)  # 10 minutes

            return pulumi.Output.all(
                stack.flow_log.traffic_type,
                stack.flow_log.log_destination_type,
                stack.flow_log.max_aggregation_interval
            ).apply(check_flow_log_properties)

        check_flow_log()

    def test_resource_tags(self):
        """Test that all resources have required tags."""

        @pulumi.runtime.test
        def check_tags():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            def check_common_tags(tags):
                self.assertEqual(tags.get('Environment'), 'Production')
                self.assertEqual(tags.get('Project'), 'PaymentGateway')

            # Check VPC tags
            vpc_tag_check = stack.vpc.tags.apply(check_common_tags)

            # Check security group tags
            sg_tag_check = stack.security_group.tags.apply(check_common_tags)

            return pulumi.Output.all(vpc_tag_check, sg_tag_check)

        check_tags()

    def test_route_table_count(self):
        """Test correct number of route tables are created."""

        @pulumi.runtime.test
        def check_route_tables():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # 1 public route table + 3 private route tables (one per AZ)
            self.assertIsNotNone(stack.public_route_table)
            self.assertEqual(len(stack.private_route_tables), 3)

        check_route_tables()

    def test_internet_gateway_creation(self):
        """Test Internet Gateway is created and attached to VPC."""

        @pulumi.runtime.test
        def check_igw():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            self.assertIsNotNone(stack.igw)

            def check_igw_vpc(vpc_id):
                self.assertIsNotNone(vpc_id)

            return stack.igw.vpc_id.apply(check_igw_vpc)

        check_igw()

    def test_route_associations(self):
        """Test route table associations for all subnets."""

        @pulumi.runtime.test
        def check_associations():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Check public subnet associations
            self.assertEqual(len(stack.public_rt_associations), 3)

            # Check private subnet associations
            self.assertEqual(len(stack.private_rt_associations), 3)

        check_associations()

    def test_iam_role_for_flow_logs(self):
        """Test IAM role is created for VPC Flow Logs."""

        @pulumi.runtime.test
        def check_iam():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            self.assertIsNotNone(stack.flow_log_role)
            self.assertIsNotNone(stack.flow_log_policy)

        check_iam()

    def test_cloudwatch_log_group(self):
        """Test CloudWatch Log Group is created for Flow Logs."""

        @pulumi.runtime.test
        def check_log_group():
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            self.assertIsNotNone(stack.log_group)

            def check_retention(retention):
                self.assertEqual(retention, 7)

            return stack.log_group.retention_in_days.apply(check_retention)

        check_log_group()


if __name__ == '__main__':
    unittest.main()
