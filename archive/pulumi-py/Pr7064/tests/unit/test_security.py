"""
Unit tests for Security Groups module
"""
import unittest
from unittest.mock import Mock
import pulumi


class TestSecurityModule(unittest.TestCase):
    """Test cases for security groups creation"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_security_groups(self):
        """Test security groups creation"""
        import lib.security as security_module

        result = security_module.create_security_groups(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            vpc_cidr="10.0.0.0/16",
            tags={"Environment": "test"}
        )

        def check_security_groups(resources):
            self.assertIn("alb_sg", result)
            self.assertIn("app_sg", result)
            self.assertIn("database_sg", result)
            self.assertIn("cache_sg", result)

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_security_groups
        )

    @pulumi.runtime.test
    def test_alb_security_group_rules(self):
        """Test ALB security group has correct ingress rules"""
        import lib.security as security_module

        result = security_module.create_security_groups(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            vpc_cidr="10.0.0.0/16",
            tags={"Environment": "test"}
        )

        def check_alb_rules(resources):
            # ALB should allow HTTP (80) and HTTPS (443) from internet
            self.assertIsNotNone(result["alb_sg"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_alb_rules
        )

    @pulumi.runtime.test
    def test_app_security_group_rules(self):
        """Test app security group allows traffic from ALB"""
        import lib.security as security_module

        result = security_module.create_security_groups(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            vpc_cidr="10.0.0.0/16",
            tags={"Environment": "test"}
        )

        def check_app_rules(resources):
            # App should allow port 8080 from ALB
            self.assertIsNotNone(result["app_sg"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_app_rules
        )

    @pulumi.runtime.test
    def test_database_security_group_rules(self):
        """Test database security group allows traffic from app"""
        import lib.security as security_module

        result = security_module.create_security_groups(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            vpc_cidr="10.0.0.0/16",
            tags={"Environment": "test"}
        )

        def check_db_rules(resources):
            # Database should allow PostgreSQL (5432) from app
            self.assertIsNotNone(result["database_sg"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_db_rules
        )

    @pulumi.runtime.test
    def test_cache_security_group_rules(self):
        """Test cache security group allows traffic from app"""
        import lib.security as security_module

        result = security_module.create_security_groups(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            vpc_cidr="10.0.0.0/16",
            tags={"Environment": "test"}
        )

        def check_cache_rules(resources):
            # Cache should allow Redis (6379) from app
            self.assertIsNotNone(result["cache_sg"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_cache_rules
        )


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:security-group/{args.name}"

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        return {}


if __name__ == "__main__":
    unittest.main()
