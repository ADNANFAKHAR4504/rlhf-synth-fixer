"""
Unit tests for ALB component
"""

import unittest
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-{args.name}"}
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {**args.inputs, "id": f"lb-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/abc123", "dns_name": f"{args.name}.elb.amazonaws.com"}
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {**args.inputs, "id": f"tg-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}/abc123"}
        elif args.typ == "aws:lb/listener:Listener":
            outputs = {**args.inputs, "id": f"listener-{args.name}"}
        elif args.typ == "aws:wafv2/webAcl:WebAcl":
            outputs = {**args.inputs, "id": f"waf-{args.name}", "arn": f"arn:aws:wafv2:us-east-1:123456789012:regional/webacl/{args.name}/abc123"}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestAlbComponent(unittest.TestCase):
    """Test cases for ALB component"""

    @pulumi.runtime.test
    def test_alb_creation(self):
        """Test ALB component creates load balancer"""
        from lib.alb_component import AlbComponent

        alb = AlbComponent(
            "test-alb",
            environment_suffix="test-123",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[pulumi.Output.from_input("subnet-1"), pulumi.Output.from_input("subnet-2")],
            enable_waf=False,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(alb)
        self.assertIsNotNone(alb.alb_arn)
        self.assertIsNotNone(alb.alb_dns_name)

    @pulumi.runtime.test
    def test_alb_with_waf_enabled(self):
        """Test ALB component with WAF enabled"""
        from lib.alb_component import AlbComponent

        alb = AlbComponent(
            "test-alb-waf",
            environment_suffix="prod-123",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            enable_waf=True,
            tags={"Environment": "prod"}
        )

        self.assertIsNotNone(alb)
        # WAF should be created when enabled
        self.assertIsNotNone(alb.waf_acl)

    @pulumi.runtime.test
    def test_alb_without_waf(self):
        """Test ALB component without WAF"""
        from lib.alb_component import AlbComponent

        alb = AlbComponent(
            "test-alb-no-waf",
            environment_suffix="dev-123",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            enable_waf=False,
            tags={"Environment": "dev"}
        )

        self.assertIsNotNone(alb)
        # WAF should be None when disabled
        self.assertIsNone(alb.waf_acl)


if __name__ == "__main__":
    unittest.main()
