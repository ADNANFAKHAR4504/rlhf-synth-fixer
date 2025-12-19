"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
from pulumi import ResourceOptions


class MockStack:
    """Mock class to capture Pulumi stack operations."""

    def __init__(self):
        self.resources = []
        self.outputs = {}

    def register_output(self, name, value):
        self.outputs[name] = value


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi runtime."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        # Return basic mock outputs based on resource type
        outputs = args.inputs

        # Add type-specific outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = "vpc-12345"
            outputs["cidr_block"] = "10.0.0.0/16"
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{args.name}"
            outputs["vpc_id"] = "vpc-12345"
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs["id"] = "igw-12345"
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs["id"] = "nat-12345"
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{args.name}"
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs["id"] = "alb-12345"
            outputs["arn"] = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb/12345"
            outputs["dns_name"] = "alb-12345.us-east-1.elb.amazonaws.com"
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs["id"] = "tg-12345"
            outputs["arn"] = "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg/12345"
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs["id"] = "cluster-12345"
            outputs["name"] = args.inputs.get("name", "test-cluster")
            outputs["arn"] = "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster"
        elif args.typ == "aws:ecs/service:Service":
            outputs["id"] = "service-12345"
            outputs["name"] = args.inputs.get("name", "test-service")
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = "log-group-12345"
            outputs["name"] = args.inputs.get("name", "/ecs/test")
        elif args.typ == "aws:cloudwatch/dashboard:Dashboard":
            outputs["id"] = "dashboard-12345"
            outputs["dashboard_name"] = args.inputs.get("dashboard_name", "test-dashboard")
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = "role-12345"
            outputs["arn"] = "arn:aws:iam::123456789012:role/test-role"
        elif args.typ == "aws:ecs/taskDefinition:TaskDefinition":
            outputs["id"] = "task-def-12345"
            outputs["arn"] = "arn:aws:ecs:us-east-1:123456789012:task-definition/test:1"
        else:
            outputs["id"] = f"{args.typ}-12345"

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b"]}
        return {}


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.task_cpu, 256)
        self.assertEqual(args.task_memory, 512)
        self.assertEqual(args.desired_count, 2)
        self.assertTrue(args.use_spot)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Project": "Test"}
        args = TapStackArgs(
            environment_suffix="prod",
            tags=custom_tags,
            task_cpu=512,
            task_memory=1024,
            desired_count=3,
            use_spot=False
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.task_cpu, 512)
        self.assertEqual(args.task_memory, 1024)
        self.assertEqual(args.desired_count, 3)
        self.assertFalse(args.use_spot)

    def test_tap_stack_args_none_suffix_defaults_to_dev(self):
        """Test that None suffix defaults to 'dev'."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack creates all required child stacks."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_stacks(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test"),
                opts=ResourceOptions()
            )

            # Verify child stacks are created
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.alb)
            self.assertIsNotNone(stack.ecs)
            self.assertIsNotNone(stack.monitoring)

            # Verify environment suffix is stored
            self.assertEqual(stack.environment_suffix, "test")

            return True

        return pulumi.Output.all().apply(lambda _: check_stacks([]))


class TestVpcStack(unittest.TestCase):
    """Test cases for VpcStack component."""

    @pulumi.runtime.test
    def test_vpc_stack_creates_resources(self):
        """Test VPC stack creates VPC, subnets, and NAT gateway."""
        from lib.vpc_stack import VpcStack

        def check_vpc(args):
            vpc = VpcStack("test-vpc", "test", opts=ResourceOptions())

            # Verify VPC is created
            self.assertIsNotNone(vpc.vpc)

            # Verify subnets
            self.assertEqual(len(vpc.public_subnets), 2)
            self.assertEqual(len(vpc.private_subnets), 2)
            self.assertEqual(len(vpc.public_subnet_ids), 2)
            self.assertEqual(len(vpc.private_subnet_ids), 2)

            # Verify networking components
            self.assertIsNotNone(vpc.igw)
            self.assertIsNotNone(vpc.nat_gateway)
            self.assertIsNotNone(vpc.eip)
            self.assertIsNotNone(vpc.public_rt)
            self.assertIsNotNone(vpc.private_rt)

            return True

        return pulumi.Output.all().apply(lambda _: check_vpc([]))


class TestAlbStack(unittest.TestCase):
    """Test cases for AlbStack component."""

    @pulumi.runtime.test
    def test_alb_stack_creates_resources(self):
        """Test ALB stack creates load balancer and target group."""
        from lib.alb_stack import AlbStack

        def check_alb(args):
            alb = AlbStack(
                "test-alb",
                vpc_id=pulumi.Output.from_input("vpc-12345"),
                public_subnet_ids=[
                    pulumi.Output.from_input("subnet-1"),
                    pulumi.Output.from_input("subnet-2")
                ],
                environment_suffix="test",
                opts=ResourceOptions()
            )

            # Verify ALB components
            self.assertIsNotNone(alb.alb_security_group)
            self.assertIsNotNone(alb.alb)
            self.assertIsNotNone(alb.target_group)
            self.assertIsNotNone(alb.listener)

            return True

        return pulumi.Output.all().apply(lambda _: check_alb([]))


class TestEcsStack(unittest.TestCase):
    """Test cases for EcsStack component."""

    @pulumi.runtime.test
    def test_ecs_stack_creates_resources(self):
        """Test ECS stack creates cluster, service, and task definition."""
        from lib.ecs_stack import EcsStack

        def check_ecs(args):
            ecs = EcsStack(
                "test-ecs",
                vpc_id=pulumi.Output.from_input("vpc-12345"),
                private_subnet_ids=[
                    pulumi.Output.from_input("subnet-1"),
                    pulumi.Output.from_input("subnet-2")
                ],
                alb_target_group_arn=pulumi.Output.from_input("arn:aws:tg"),
                alb_security_group_id=pulumi.Output.from_input("sg-12345"),
                environment_suffix="test",
                task_cpu=256,
                task_memory=512,
                desired_count=2,
                use_spot=True,
                opts=ResourceOptions()
            )

            # Verify ECS components
            self.assertIsNotNone(ecs.cluster)
            self.assertIsNotNone(ecs.log_group)
            self.assertIsNotNone(ecs.task_execution_role)
            self.assertIsNotNone(ecs.task_role)
            self.assertIsNotNone(ecs.task_definition)
            self.assertIsNotNone(ecs.ecs_security_group)
            self.assertIsNotNone(ecs.service)
            self.assertIsNotNone(ecs.scaling_target)
            self.assertIsNotNone(ecs.scaling_policy_cpu)
            self.assertIsNotNone(ecs.scaling_policy_memory)

            return True

        return pulumi.Output.all().apply(lambda _: check_ecs([]))

    @pulumi.runtime.test
    def test_ecs_stack_without_spot(self):
        """Test ECS stack with use_spot=False."""
        from lib.ecs_stack import EcsStack

        def check_ecs_no_spot(args):
            ecs = EcsStack(
                "test-ecs-no-spot",
                vpc_id=pulumi.Output.from_input("vpc-12345"),
                private_subnet_ids=[
                    pulumi.Output.from_input("subnet-1"),
                    pulumi.Output.from_input("subnet-2")
                ],
                alb_target_group_arn=pulumi.Output.from_input("arn:aws:tg"),
                alb_security_group_id=pulumi.Output.from_input("sg-12345"),
                environment_suffix="test",
                task_cpu=512,
                task_memory=1024,
                desired_count=1,
                use_spot=False,
                opts=ResourceOptions()
            )

            # Verify ECS components created correctly
            self.assertIsNotNone(ecs.cluster)
            self.assertIsNotNone(ecs.service)

            return True

        return pulumi.Output.all().apply(lambda _: check_ecs_no_spot([]))


class TestMonitoringStack(unittest.TestCase):
    """Test cases for MonitoringStack component."""

    @pulumi.runtime.test
    def test_monitoring_stack_creates_resources(self):
        """Test monitoring stack creates alarms and dashboard."""
        from lib.monitoring_stack import MonitoringStack

        def check_monitoring(args):
            monitoring = MonitoringStack(
                "test-monitoring",
                cluster_name=pulumi.Output.from_input("test-cluster"),
                service_name=pulumi.Output.from_input("test-service"),
                alb_arn=pulumi.Output.from_input("arn:aws:alb"),
                target_group_arn=pulumi.Output.from_input("arn:aws:tg"),
                environment_suffix="test",
                opts=ResourceOptions()
            )

            # Verify monitoring components
            self.assertIsNotNone(monitoring.alarm_topic)
            self.assertIsNotNone(monitoring.cpu_alarm)
            self.assertIsNotNone(monitoring.memory_alarm)
            self.assertIsNotNone(monitoring.unhealthy_target_alarm)
            self.assertIsNotNone(monitoring.response_time_alarm)
            self.assertIsNotNone(monitoring.dashboard)

            return True

        return pulumi.Output.all().apply(lambda _: check_monitoring([]))


# Set Pulumi to use mocks
pulumi.runtime.set_mocks(PulumiMocks())


if __name__ == "__main__":
    unittest.main()
