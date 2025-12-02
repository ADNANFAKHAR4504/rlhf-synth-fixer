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

        return args.name, outputs

    def call(self, args: pulumi.runtime.MockCallArgs) -> Dict[str, Any]:
        """Mock function calls (e.g., get_ami)."""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-0c55b159cbfafe1f0",
                "architecture": "x86_64",
                "name": "amzn2-ami-hvm-2.0.20230404.0-x86_64-gp2"
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack infrastructure."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that both VPCs are created with correct CIDR blocks."""
        def check_vpcs(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Collect all outputs to resolve
            dev_vpc_cidr = stack.dev_vpc["vpc"].cidr_block
            prod_vpc_cidr = stack.prod_vpc["vpc"].cidr_block

            def validate_cidrs(values):
                dev_cidr, prod_cidr = values
                assert dev_cidr == "10.1.0.0/16", f"Dev VPC CIDR should be 10.1.0.0/16, got {dev_cidr}"
                assert prod_cidr == "10.2.0.0/16", f"Prod VPC CIDR should be 10.2.0.0/16, got {prod_cidr}"
                return True

            return pulumi.Output.all(dev_vpc_cidr, prod_vpc_cidr).apply(validate_cidrs)

        return pulumi.Output.all().apply(check_vpcs)

    @pulumi.runtime.test
    def test_subnet_creation(self):
        """Test that each VPC has 3 public and 3 private subnets."""
        def check_subnets(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify dev VPC subnets - these are lists, not Outputs
            assert len(stack.dev_vpc["public_subnets"]) == 3, "Dev VPC should have 3 public subnets"
            assert len(stack.dev_vpc["private_subnets"]) == 3, "Dev VPC should have 3 private subnets"

            # Verify prod VPC subnets
            assert len(stack.prod_vpc["public_subnets"]) == 3, "Prod VPC should have 3 public subnets"
            assert len(stack.prod_vpc["private_subnets"]) == 3, "Prod VPC should have 3 private subnets"

            return True

        return pulumi.Output.all().apply(check_subnets)

    @pulumi.runtime.test
    def test_vpc_peering_creation(self):
        """Test that VPC Peering connection is created."""
        def check_peering(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify VPC Peering exists
            assert stack.vpc_peering is not None, "VPC Peering connection should exist"

            return True

        return pulumi.Output.all().apply(check_peering)

    @pulumi.runtime.test
    def test_nat_instance_creation(self):
        """Test that NAT instances are created with correct configuration for each VPC."""
        def check_nat(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify NAT instances exist for both VPCs
            assert stack.dev_nat_instance is not None, "Dev NAT instance should exist"
            assert stack.prod_nat_instance is not None, "Prod NAT instance should exist"

            # Verify instance type and source_dest_check using apply
            dev_instance_type = stack.dev_nat_instance.instance_type
            dev_source_dest_check = stack.dev_nat_instance.source_dest_check
            prod_instance_type = stack.prod_nat_instance.instance_type
            prod_source_dest_check = stack.prod_nat_instance.source_dest_check

            def validate_nat(values):
                dev_type, dev_src_dst, prod_type, prod_src_dst = values
                assert dev_type == "t3.micro", f"Dev instance type should be t3.micro, got {dev_type}"
                assert dev_src_dst is False, f"Dev source_dest_check should be False, got {dev_src_dst}"
                assert prod_type == "t3.micro", f"Prod instance type should be t3.micro, got {prod_type}"
                assert prod_src_dst is False, f"Prod source_dest_check should be False, got {prod_src_dst}"
                return True

            return pulumi.Output.all(dev_instance_type, dev_source_dest_check, prod_instance_type, prod_source_dest_check).apply(validate_nat)

        return pulumi.Output.all().apply(check_nat)

    @pulumi.runtime.test
    def test_security_groups_creation(self):
        """Test that security groups are created for both VPCs."""
        def check_sgs(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify security groups exist
            assert "dev" in stack.security_groups, "Dev security group should exist"
            assert "prod" in stack.security_groups, "Prod security group should exist"

            # Verify dev SG has correct ingress rules
            dev_sg = stack.security_groups["dev"]
            dev_ingress = dev_sg.ingress

            # Verify prod SG has correct ingress rules
            prod_sg = stack.security_groups["prod"]
            prod_ingress = prod_sg.ingress

            def validate_sgs(values):
                dev_ing, prod_ing = values
                assert len(dev_ing) == 2, f"Dev SG should have 2 ingress rules (HTTPS and SSH), got {len(dev_ing)}"
                assert len(prod_ing) == 3, f"Prod SG should have 3 ingress rules (HTTPS, SSH, PostgreSQL), got {len(prod_ing)}"
                return True

            return pulumi.Output.all(dev_ingress, prod_ingress).apply(validate_sgs)

        return pulumi.Output.all().apply(check_sgs)

    @pulumi.runtime.test
    def test_flow_logs_creation(self):
        """Test that VPC Flow Logs are created with CloudWatch integration."""
        def check_flow_logs(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify flow logs exist
            assert stack.flow_logs["dev_flow_log"] is not None, "Dev flow log should exist"
            assert stack.flow_logs["prod_flow_log"] is not None, "Prod flow log should exist"

            # Verify CloudWatch log groups exist
            assert stack.flow_logs["dev_log_group"] is not None, "Dev log group should exist"
            assert stack.flow_logs["prod_log_group"] is not None, "Prod log group should exist"

            # Verify log retention
            dev_retention = stack.flow_logs["dev_log_group"].retention_in_days
            prod_retention = stack.flow_logs["prod_log_group"].retention_in_days

            def validate_retention(values):
                dev_ret, prod_ret = values
                assert dev_ret == 7, f"Dev log retention should be 7 days, got {dev_ret}"
                assert prod_ret == 7, f"Prod log retention should be 7 days, got {prod_ret}"
                return True

            return pulumi.Output.all(dev_retention, prod_retention).apply(validate_retention)

        return pulumi.Output.all().apply(check_flow_logs)

    @pulumi.runtime.test
    def test_resource_tagging(self):
        """Test that resources have correct tags including environmentSuffix."""
        def check_tags(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify dev VPC tags
            dev_vpc_tags = stack.dev_vpc["vpc"].tags

            # Verify prod VPC tags
            prod_vpc_tags = stack.prod_vpc["vpc"].tags

            def validate_tags(values):
                dev_tags, prod_tags = values

                # Check dev tags
                assert "Project" in dev_tags, "Dev VPC should have Project tag"
                assert dev_tags["Project"] == "payment-platform", f"Project tag should be payment-platform"
                assert "Environment" in dev_tags, "Dev VPC should have Environment tag"
                assert dev_tags["Environment"] == "dev", f"Environment tag should be dev"
                assert "Name" in dev_tags, "Dev VPC should have Name tag"
                assert "test123" in dev_tags["Name"], f"Name should include test123, got {dev_tags['Name']}"

                # Check prod tags
                assert "Project" in prod_tags, "Prod VPC should have Project tag"
                assert prod_tags["Project"] == "payment-platform", f"Project tag should be payment-platform"
                assert "Environment" in prod_tags, "Prod VPC should have Environment tag"
                assert prod_tags["Environment"] == "prod", f"Environment tag should be prod"

                return True

            return pulumi.Output.all(dev_vpc_tags, prod_vpc_tags).apply(validate_tags)

        return pulumi.Output.all().apply(check_tags)

    @pulumi.runtime.test
    def test_environment_suffix_in_names(self):
        """Test that all named resources include environmentSuffix."""
        def check_env_suffix(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Check VPC names
            dev_vpc_name = stack.dev_vpc["vpc"].tags["Name"]
            prod_vpc_name = stack.prod_vpc["vpc"].tags["Name"]

            # Check subnet names (first public and private of each)
            dev_pub_subnet_name = stack.dev_vpc["public_subnets"][0].tags["Name"]
            prod_priv_subnet_name = stack.prod_vpc["private_subnets"][0].tags["Name"]

            # Check security group names
            dev_sg_name = stack.security_groups["dev"].tags["Name"]

            # Check NAT instance names
            dev_nat_name = stack.dev_nat_instance.tags["Name"]
            prod_nat_name = stack.prod_nat_instance.tags["Name"]

            def validate_names(values):
                dev_vpc, prod_vpc, dev_pub_sub, prod_priv_sub, dev_sg, dev_nat, prod_nat = values

                assert "test123" in dev_vpc, f"Dev VPC name should include test123, got {dev_vpc}"
                assert "test123" in prod_vpc, f"Prod VPC name should include test123, got {prod_vpc}"
                assert "test123" in dev_pub_sub, f"Dev public subnet name should include test123, got {dev_pub_sub}"
                assert "test123" in prod_priv_sub, f"Prod private subnet name should include test123, got {prod_priv_sub}"
                assert "test123" in dev_sg, f"Dev SG name should include test123, got {dev_sg}"
                assert "test123" in dev_nat, f"Dev NAT instance name should include test123, got {dev_nat}"
                assert "test123" in prod_nat, f"Prod NAT instance name should include test123, got {prod_nat}"

                return True

            return pulumi.Output.all(
                dev_vpc_name, prod_vpc_name, dev_pub_subnet_name,
                prod_priv_subnet_name, dev_sg_name, dev_nat_name, prod_nat_name
            ).apply(validate_names)

        return pulumi.Output.all().apply(check_env_suffix)

    @pulumi.runtime.test
    def test_vpc_peering_connectivity(self):
        """Test that VPC Peering is configured for inter-VPC connectivity."""
        def check_peering(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify VPC Peering connection exists
            assert stack.vpc_peering is not None, "VPC Peering should exist"

            # Verify auto_accept is enabled
            auto_accept = stack.vpc_peering.auto_accept

            def validate_peering(values):
                auto_acc = values[0]
                assert auto_acc is True, f"VPC Peering auto_accept should be True, got {auto_acc}"
                return True

            return pulumi.Output.all(auto_accept).apply(validate_peering)

        return pulumi.Output.all().apply(check_peering)

    @pulumi.runtime.test
    def test_iam_role_for_flow_logs(self):
        """Test that IAM role is created for VPC Flow Logs with correct trust policy."""
        def check_iam(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify IAM role exists
            role = stack.flow_logs["role"]
            assert role is not None, "IAM role for flow logs should exist"

            # Verify assume role policy contains vpc-flow-logs service principal
            assume_policy = role.assume_role_policy

            def validate_policy(policy_str):
                assert "vpc-flow-logs.amazonaws.com" in policy_str, \
                    f"Assume role policy should contain vpc-flow-logs.amazonaws.com, got {policy_str}"
                return True

            return pulumi.Output.all(assume_policy).apply(lambda vals: validate_policy(vals[0]))

        return pulumi.Output.all().apply(check_iam)


if __name__ == "__main__":
    unittest.main()
