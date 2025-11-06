"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
from unittest.mock import MagicMock, patch

import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create a mock resource."""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345",
                "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345",
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}",
            }
        elif args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "id": "rds-instance-1",
                "endpoint": "database.cluster-abc.us-east-1.rds.amazonaws.com:5432",
                "address": "database.cluster-abc.us-east-1.rds.amazonaws.com",
            }
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": "ecs-cluster-1",
                "arn": "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
            }
        elif args.typ == "aws:ecs/service:Service":
            outputs = {
                **args.inputs,
                "id": f"ecs-service-{args.name}",
                "name": args.inputs.get("name", f"service-{args.name}"),
            }
        else:
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:service:us-east-1:123456789012:resource/{args.name}",
            }
        return [outputs.get("id", f"{args.name}-id"), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zoneIds": ["use1-az1", "use1-az2", "use1-az3"],
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that VPC is created with correct CIDR and DNS settings."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_vpc(args):
            cidr_block, enable_dns_hostnames, enable_dns_support = args
            assert cidr_block == "10.0.0.0/16", f"Expected CIDR 10.0.0.0/16, got {cidr_block}"
            assert enable_dns_hostnames == True, "DNS hostnames should be enabled"
            assert enable_dns_support == True, "DNS support should be enabled"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.vpc.cidr_block,
            stack.vpc.enable_dns_hostnames,
            stack.vpc.enable_dns_support
        ).apply(check_vpc)

    @pulumi.runtime.test
    def test_subnet_counts(self):
        """Test that correct number of subnets are created."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack
        stack = TapStack("test", environment_suffix="test")

        assert len(stack.public_subnets) == 2, f"Expected 2 public subnets, got {len(stack.public_subnets)}"
        assert len(stack.private_subnets) == 4, f"Expected 4 private subnets, got {len(stack.private_subnets)}"
        assert len(stack.nat_gateways) == 2, f"Expected 2 NAT gateways, got {len(stack.nat_gateways)}"

    @pulumi.runtime.test
    def test_ecr_repository_configuration(self):
        """Test ECR repository has correct configuration."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_ecr(args):
            image_tag_mutability, force_delete = args
            assert image_tag_mutability == "MUTABLE", f"Expected MUTABLE, got {image_tag_mutability}"
            assert force_delete == True, "force_delete should be True"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.ecr_repository.image_tag_mutability,
            stack.ecr_repository.force_delete
        ).apply(check_ecr)

    @pulumi.runtime.test
    def test_rds_configuration(self):
        """Test that RDS instance has correct configuration."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_rds(args):
            multi_az, storage_encrypted, engine, backup_retention = args
            assert multi_az == True, "Multi-AZ should be enabled"
            assert storage_encrypted == True, "Storage encryption should be enabled"
            assert engine == "postgres", f"Expected postgres, got {engine}"
            assert backup_retention == 7, f"Expected 7-day backup retention, got {backup_retention}"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.rds_instance.multi_az,
            stack.rds_instance.storage_encrypted,
            stack.rds_instance.engine,
            stack.rds_instance.backup_retention_period
        ).apply(check_rds)

    @pulumi.runtime.test
    def test_ecs_cluster_container_insights(self):
        """Test that ECS cluster has Container Insights enabled."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_ecs(args):
            settings = args[0]
            assert len(settings) > 0, "ECS cluster should have settings"
            assert settings[0]["name"] == "containerInsights", "Container Insights should be configured"
            assert settings[0]["value"] == "enabled", "Container Insights should be enabled"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.ecs_cluster.settings
        ).apply(check_ecs)

    @pulumi.runtime.test
    def test_ecs_service_configuration(self):
        """Test that ECS service has correct configuration."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_service(args):
            desired_count, launch_type, platform_version = args
            assert desired_count == 2, f"Expected desired count of 2, got {desired_count}"
            assert launch_type == "FARGATE", f"Expected FARGATE, got {launch_type}"
            assert platform_version == "LATEST", f"Expected LATEST platform, got {platform_version}"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.ecs_service.desired_count,
            stack.ecs_service.launch_type,
            stack.ecs_service.platform_version
        ).apply(check_service)

    @pulumi.runtime.test
    def test_autoscaling_configuration(self):
        """Test that autoscaling has correct min and max capacity."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_autoscaling(args):
            min_capacity, max_capacity = args
            assert min_capacity == 2, f"Expected min capacity of 2, got {min_capacity}"
            assert max_capacity == 10, f"Expected max capacity of 10, got {max_capacity}"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.autoscaling_target.min_capacity,
            stack.autoscaling_target.max_capacity
        ).apply(check_autoscaling)

    @pulumi.runtime.test
    def test_cloudwatch_log_retention(self):
        """Test that CloudWatch log group has correct retention."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_logs(args):
            retention = args[0]
            assert retention == 7, f"Expected 7-day retention, got {retention}"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.log_group.retention_in_days
        ).apply(check_logs)

    @pulumi.runtime.test
    def test_alb_configuration(self):
        """Test that ALB has correct configuration."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_alb(args):
            internal, load_balancer_type, enable_http2, enable_deletion_protection = args
            assert internal == False, "ALB should be internet-facing"
            assert load_balancer_type == "application", f"Expected application, got {load_balancer_type}"
            assert enable_http2 == True, "HTTP/2 should be enabled"
            assert enable_deletion_protection == False, "Deletion protection should be disabled for testing"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.alb.internal,
            stack.alb.load_balancer_type,
            stack.alb.enable_http2,
            stack.alb.enable_deletion_protection
        ).apply(check_alb)

    @pulumi.runtime.test
    def test_target_group_configuration(self):
        """Test that target group has correct configuration."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_tg(args):
            target_type, port, deregistration_delay = args
            assert target_type == "ip", f"Expected ip target type, got {target_type}"
            assert port == 5000, f"Expected port 5000, got {port}"
            assert deregistration_delay == 30, f"Expected 30s deregistration delay, got {deregistration_delay}"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.target_group.target_type,
            stack.target_group.port,
            stack.target_group.deregistration_delay
        ).apply(check_tg)

    @pulumi.runtime.test
    def test_task_definition_configuration(self):
        """Test that ECS task definition has correct configuration."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack

        def check_task_def(args):
            cpu, memory, network_mode = args
            assert cpu == "256", f"Expected CPU 256, got {cpu}"
            assert memory == "512", f"Expected memory 512, got {memory}"
            assert network_mode == "awsvpc", f"Expected awsvpc, got {network_mode}"

        stack = TapStack("test", environment_suffix="test")

        return pulumi.Output.all(
            stack.task_definition.cpu,
            stack.task_definition.memory,
            stack.task_definition.network_mode
        ).apply(check_task_def)

    @pulumi.runtime.test
    def test_environment_suffix_in_resources(self):
        """Test that environment suffix is applied to resource names."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack
        stack = TapStack("test", environment_suffix="dev")

        assert stack.environment_suffix == "dev", "Environment suffix should be dev"


class TestSecurityGroups(unittest.TestCase):
    """Test security group configurations."""

    @pulumi.runtime.test
    def test_security_groups_exist(self):
        """Test that all required security groups are created."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack
        stack = TapStack("test", environment_suffix="test")

        assert hasattr(stack, 'alb_sg'), "ALB security group should exist"
        assert hasattr(stack, 'ecs_sg'), "ECS security group should exist"
        assert hasattr(stack, 'rds_sg'), "RDS security group should exist"


class TestIAMRoles(unittest.TestCase):
    """Test IAM role configurations."""

    @pulumi.runtime.test
    def test_iam_roles_exist(self):
        """Test that required IAM roles are created."""
        import sys
        sys.path.insert(0, "/var/www/turing/iac-test-automations/worktree/synth-101000836")

        from lib.tap_stack import TapStack
        stack = TapStack("test", environment_suffix="test")

        assert hasattr(stack, 'task_execution_role'), "Task execution role should exist"
        assert hasattr(stack, 'task_role'), "Task role should exist"


if __name__ == "__main__":
    unittest.main()
