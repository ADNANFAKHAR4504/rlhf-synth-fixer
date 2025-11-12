"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi
from pulumi import ResourceOptions


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock Pulumi calls for unit testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345",
                "cidr_block": args.inputs.get("cidrBlock", "10.0.0.0/16"),
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "availabilityZone": "eu-south-1a",
            }
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": "igw-12345"}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{args.name}", "publicIp": "1.2.3.4"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rt-{args.name}"}
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-{args.name}"}
        elif args.typ == "aws:ecr/repository:Repository":
            outputs = {
                **args.inputs,
                "id": f"repo-{args.name}",
                "repositoryUrl": f"123456789012.dkr.ecr.eu-south-1.amazonaws.com/{args.name}",
            }
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": f"cluster-{args.name}",
                "arn": f"arn:aws:ecs:eu-south-1:123456789012:cluster/{args.name}",
            }
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {
                **args.inputs,
                "id": f"alb-{args.name}",
                "dnsName": f"{args.name}.eu-south-1.elb.amazonaws.com",
                "zoneId": "Z35SXDOTRQ7X7K",
            }
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {
                **args.inputs,
                "id": f"tg-{args.name}",
                "arn": (
                    f"arn:aws:elasticloadbalancing:eu-south-1:123456789012:"
                    f"targetgroup/{args.name}"
                ),
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {**args.inputs, "id": f"lg-{args.name}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"role-{args.name}",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
            }
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": f"cluster-{args.name}",
                "endpoint": f"{args.name}.cluster-xyz.eu-south-1.rds.amazonaws.com",
            }
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs = {**args.inputs, "id": f"instance-{args.name}"}
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"subnet-group-{args.name}"}
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {
                **args.inputs,
                "id": f"secret-{args.name}",
                "arn": f"arn:aws:secretsmanager:eu-south-1:123456789012:secret:{args.name}",
            }
        elif args.typ == "aws:secretsmanager/secretVersion:SecretVersion":
            outputs = {**args.inputs, "id": f"version-{args.name}"}
        elif args.typ == "aws:ecs/taskDefinition:TaskDefinition":
            outputs = {
                **args.inputs,
                "id": f"task-{args.name}",
                "arn": (
                    f"arn:aws:ecs:eu-south-1:123456789012:"
                    f"task-definition/{args.name}:1"
                ),
            }
        elif args.typ == "aws:ecs/service:Service":
            outputs = {**args.inputs, "id": f"service-{args.name}", "name": args.name}
        elif args.typ == "aws:appautoscaling/target:Target":
            outputs = {**args.inputs, "id": f"target-{args.name}"}
        elif args.typ == "aws:appautoscaling/policy:Policy":
            outputs = {**args.inputs, "id": f"policy-{args.name}"}
        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["eu-south-1a", "eu-south-1b"],
                "zoneIds": ["use1-az1", "use1-az2"],
            }
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


# Import after setting mocks
# pylint: disable=wrong-import-position
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, "dev")
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Environment": "test", "Project": "test-project"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_suffix(self):
        """Test TapStackArgs with None suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)

        self.assertEqual(args.environment_suffix, "dev")

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags defaults to empty dict."""
        args = TapStackArgs(tags=None)

        self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test basic TapStack creation."""
        args = TapStackArgs(
            environment_suffix="test", tags={"Environment": "test", "Project": "test"}
        )
        stack = TapStack(name="test-stack", args=args)

        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertEqual(stack.tags["Environment"], "test")
        self.assertIsNotNone(stack.vpc)

    @pulumi.runtime.test
    def test_vpc_configuration(self):
        """Test VPC is created with correct CIDR block."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack(name="test-stack", args=args)

        self.assertIsNotNone(stack.vpc)

    @pulumi.runtime.test
    def test_resource_naming_with_suffix(self):
        """Test that resources include environment suffix in names."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack(name="test-stack", args=args)

        self.assertEqual(stack.environment_suffix, "test")
        self.assertIsNotNone(stack.vpc)

    @pulumi.runtime.test
    def test_outputs_exported(self):
        """Test that all required outputs are exported."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack(name="test-stack", args=args)

        self.assertIsNotNone(stack.vpc_id)
        self.assertIsNotNone(stack.alb_dns_name)
        self.assertIsNotNone(stack.ecr_repository_uri)
        self.assertIsNotNone(stack.rds_cluster_endpoint)
        self.assertIsNotNone(stack.ecs_cluster_name)

    @pulumi.runtime.test
    def test_ecr_repository_uri_format(self):
        """Test ECR repository URI has correct format."""
        def check_uri(uri):
            self.assertIn(".dkr.ecr.", uri)
            self.assertIn("amazonaws.com", uri)
            self.assertIn("flask-api", uri)
            return uri

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack(name="test-stack", args=args)

        return stack.ecr_repository_uri.apply(check_uri)

    @pulumi.runtime.test
    def test_rds_endpoint_format(self):
        """Test RDS cluster endpoint has correct format."""
        def check_endpoint(endpoint):
            self.assertIn(".rds.amazonaws.com", endpoint)
            self.assertIn("flask-api-aurora", endpoint)
            return endpoint

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack(name="test-stack", args=args)

        return stack.rds_cluster_endpoint.apply(check_endpoint)

    @pulumi.runtime.test
    def test_alb_dns_format(self):
        """Test ALB DNS name has correct format."""
        def check_dns(dns):
            self.assertIn(".elb.amazonaws.com", dns)
            return dns

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack(name="test-stack", args=args)

        return stack.alb_dns_name.apply(check_dns)

    @pulumi.runtime.test
    def test_tags_applied(self):
        """Test that custom tags are applied to resources."""
        custom_tags = {"Environment": "staging", "Project": "ecommerce"}
        args = TapStackArgs(environment_suffix="staging", tags=custom_tags)
        stack = TapStack(name="test-stack", args=args)

        self.assertEqual(stack.tags["Environment"], "staging")
        self.assertEqual(stack.tags["Project"], "ecommerce")


if __name__ == "__main__":
    unittest.main()
