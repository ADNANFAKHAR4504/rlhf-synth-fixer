"""
Unit tests for VPC module
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi


class TestVPCModule(unittest.TestCase):
    """Test cases for VPC creation module"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_vpc_basic(self):
        """Test VPC creation with basic configuration"""
        import lib.vpc as vpc_module

        result = vpc_module.create_vpc(
            environment_suffix="test",
            vpc_cidr="10.0.0.0/16",
            enable_multi_az=False,
            tags={"Environment": "test"}
        )

        def check_vpc(resources):
            vpc_resources = [r for r in resources if r[0].startswith("payment-vpc-")]
            self.assertEqual(len(vpc_resources), 1)
            self.assertIn("vpc", result)
            self.assertIn("igw", result)
            self.assertIn("public_subnets", result)
            self.assertIn("private_subnets", result)
            self.assertIn("public_subnet_ids", result)
            self.assertIn("private_subnet_ids", result)

        return pulumi.Output.all(*result.values()).apply(lambda _: check_vpc)

    @pulumi.runtime.test
    def test_create_vpc_multi_az(self):
        """Test VPC creation with multi-AZ enabled"""
        import lib.vpc as vpc_module

        result = vpc_module.create_vpc(
            environment_suffix="test-multi",
            vpc_cidr="10.1.0.0/16",
            enable_multi_az=True,
            tags={"Environment": "test"}
        )

        def check_multi_az(resources):
            self.assertIn("vpc", result)
            self.assertIsNotNone(result["vpc"])
            self.assertIn("public_subnets", result)
            self.assertIn("private_subnets", result)

        return pulumi.Output.all(*result.values()).apply(lambda _: check_multi_az)

    @pulumi.runtime.test
    def test_vpc_subnet_count(self):
        """Test correct number of subnets created"""
        import lib.vpc as vpc_module

        result = vpc_module.create_vpc(
            environment_suffix="test",
            vpc_cidr="10.0.0.0/16",
            enable_multi_az=False,
            tags={"Environment": "test"}
        )

        def check_subnets(resources):
            # 2 AZs when multi_az=False
            self.assertEqual(len(result["public_subnets"]), 2)
            self.assertEqual(len(result["private_subnets"]), 2)

        return pulumi.Output.all(*result.values()).apply(lambda _: check_subnets)

    @pulumi.runtime.test
    def test_vpc_endpoints(self):
        """Test VPC endpoints are created"""
        import lib.vpc as vpc_module

        result = vpc_module.create_vpc(
            environment_suffix="test",
            vpc_cidr="10.0.0.0/16",
            enable_multi_az=False,
            tags={"Environment": "test"}
        )

        def check_endpoints(resources):
            self.assertIn("s3_endpoint", result)
            self.assertIsNotNone(result["s3_endpoint"])

        return pulumi.Output.all(*result.values()).apply(lambda _: check_endpoints)


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = "vpc-12345"
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs["id"] = "igw-12345"
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{args.name}"
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rtb-{args.name}"
        elif args.typ == "aws:ec2/vpcEndpoint:VpcEndpoint":
            outputs["id"] = f"vpce-{args.name}"
        elif args.typ == "aws:getAvailabilityZones:getAvailabilityZones":
            outputs["names"] = ["us-east-1a", "us-east-1b", "us-east-1c"]

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        return {}


if __name__ == "__main__":
    unittest.main()
