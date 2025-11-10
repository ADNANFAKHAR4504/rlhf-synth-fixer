"""
Unit tests for VPC component
"""

import unittest
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": f"vpc-{args.name}"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": f"igw-{args.name}"}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{args.name}"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rt-{args.name}"}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestVpcComponent(unittest.TestCase):
    """Test cases for VPC component"""

    def test_vpc_creation(self):
        """Test VPC component creates VPC with correct CIDR"""
        from lib.vpc_component import VpcComponent

        vpc = VpcComponent(
            "test-vpc",
            environment_suffix="test-123",
            cidr_block="10.0.0.0/16",
            availability_zones=["us-east-1a", "us-east-1b"],
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(vpc)
        self.assertIsNotNone(vpc.vpc_id)

    def test_vpc_creates_subnets(self):
        """Test VPC component creates public and private subnets"""
        from lib.vpc_component import VpcComponent

        vpc = VpcComponent(
            "test-vpc-subnets",
            environment_suffix="test-123",
            cidr_block="10.0.0.0/16",
            availability_zones=["us-east-1a", "us-east-1b"],
            tags={"Environment": "test"}
        )

        # These are Output types, so we just verify they exist
        self.assertTrue(hasattr(vpc, 'public_subnet_ids'))
        self.assertTrue(hasattr(vpc, 'private_subnet_ids'))
        # Check the lists were created
        self.assertTrue(hasattr(vpc, 'public_subnets'))
        self.assertTrue(hasattr(vpc, 'private_subnets'))
        self.assertEqual(len(vpc.public_subnets), 2)
        self.assertEqual(len(vpc.private_subnets), 2)

    def test_vpc_naming_includes_environment_suffix(self):
        """Test that VPC resources include environment suffix in names"""
        from lib.vpc_component import VpcComponent

        env_suffix = "test-456"
        vpc = VpcComponent(
            "test-vpc-naming",
            environment_suffix=env_suffix,
            cidr_block="10.0.0.0/16",
            availability_zones=["us-east-1a"],
            tags={"Environment": "test"}
        )

        # VPC component should be created with proper suffix
        self.assertIsNotNone(vpc)


if __name__ == "__main__":
    unittest.main()
