"""Unit tests for TAP Stack."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

        # Synthesize the stack
        synth_stack = Testing.synth(stack)
        assert synth_stack is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

        # Synthesize the stack
        synth_stack = Testing.synth(stack)
        assert synth_stack is not None

    def test_stack_creates_vpc_resources(self):
        """Test that stack creates VPC and related networking resources."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check VPC exists
        assert "aws_vpc" in resources
        vpc = resources["aws_vpc"]
        assert len(vpc) > 0

        # Check subnets exist
        assert "aws_subnet" in resources
        subnets = resources["aws_subnet"]
        # Should have 4 subnets (2 public, 2 private)
        assert len(subnets) >= 4

        # Check Internet Gateway exists
        assert "aws_internet_gateway" in resources

        # Check NAT Gateway exists
        assert "aws_nat_gateway" in resources

        # Check route tables exist
        assert "aws_route_table" in resources

    def test_stack_creates_ecs_cluster(self):
        """Test that stack creates ECS cluster with container insights."""
        app = App()
        stack = TapStack(
            app,
            "TestECSClusterStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check ECS cluster exists
        assert "aws_ecs_cluster" in resources
        cluster = resources["aws_ecs_cluster"]
        assert len(cluster) > 0

        # Check container insights is enabled
        cluster_resource = list(cluster.values())[0]
        assert "setting" in cluster_resource
        settings = cluster_resource["setting"]
        assert any(s.get("name") == "containerInsights" and s.get("value") == "enabled" for s in settings)

    def test_stack_creates_load_balancer(self):
        """Test that stack creates Application Load Balancer and target group."""
        app = App()
        stack = TapStack(
            app,
            "TestALBStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check ALB exists
        assert "aws_lb" in resources
        alb = resources["aws_lb"]
        assert len(alb) > 0

        alb_resource = list(alb.values())[0]
        assert alb_resource["internal"] == False
        assert alb_resource["load_balancer_type"] == "application"

        # Check target group exists
        assert "aws_lb_target_group" in resources
        target_group = resources["aws_lb_target_group"]
        assert len(target_group) > 0

        tg_resource = list(target_group.values())[0]
        assert tg_resource["port"] == 80
        assert tg_resource["protocol"] == "HTTP"
        assert tg_resource["target_type"] == "ip"

        # Check health check configuration
        assert "health_check" in tg_resource
        health_check = tg_resource["health_check"]
        assert health_check["path"] == "/health"
        assert health_check["interval"] == 30
        assert health_check["timeout"] == 5

        # Check stickiness configuration
        assert "stickiness" in tg_resource
        stickiness = tg_resource["stickiness"]
        assert stickiness["type"] == "lb_cookie"
        assert stickiness["enabled"] == True
        assert stickiness["cookie_duration"] == 3600

        # Check ALB listener exists
        assert "aws_lb_listener" in resources
        listener = resources["aws_lb_listener"]
        assert len(listener) > 0

        listener_resource = list(listener.values())[0]
        assert listener_resource["port"] == 80
        assert listener_resource["protocol"] == "HTTP"

    def test_stack_creates_security_groups(self):
        """Test that stack creates security groups for ALB and ECS."""
        app = App()
        stack = TapStack(
            app,
            "TestSGStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check security groups exist
        assert "aws_security_group" in resources
        security_groups = resources["aws_security_group"]
        # Should have at least 2 security groups (ALB and ECS)
        assert len(security_groups) >= 2

    def test_stack_creates_ecs_task_definition(self):
        """Test that stack creates ECS task definition with proper configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTaskDefStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check task definition exists
        assert "aws_ecs_task_definition" in resources
        task_def = resources["aws_ecs_task_definition"]
        assert len(task_def) > 0

        task_def_resource = list(task_def.values())[0]
        assert task_def_resource["network_mode"] == "awsvpc"
        assert "FARGATE" in task_def_resource["requires_compatibilities"]
        assert task_def_resource["cpu"] == "512"
        assert task_def_resource["memory"] == "1024"

        # Check container definitions
        container_defs = json.loads(task_def_resource["container_definitions"])
        assert len(container_defs) > 0

        container = container_defs[0]
        assert container["name"] == "customer-portal"
        assert container["cpu"] == 512
        assert container["memory"] == 1024
        assert container["essential"] == True

        # Check environment variables
        assert "environment" in container
        env_vars = container["environment"]
        env_names = [e["name"] for e in env_vars]
        assert "API_ENDPOINT" in env_names
        assert "DB_CONNECTION_STRING" in env_names
        assert "REDIS_HOST" in env_names

    def test_stack_creates_ecs_service(self):
        """Test that stack creates ECS service with proper configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestServiceStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check ECS service exists
        assert "aws_ecs_service" in resources
        service = resources["aws_ecs_service"]
        assert len(service) > 0

        service_resource = list(service.values())[0]
        assert service_resource["desired_count"] == 2
        assert service_resource["launch_type"] == "FARGATE"
        assert service_resource["platform_version"] == "1.4.0"

        # Check network configuration
        assert "network_configuration" in service_resource
        net_config = service_resource["network_configuration"]
        assert net_config["assign_public_ip"] == False

    def test_stack_creates_autoscaling(self):
        """Test that stack creates auto-scaling configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestAutoscalingStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check autoscaling target exists
        assert "aws_appautoscaling_target" in resources
        scaling_target = resources["aws_appautoscaling_target"]
        assert len(scaling_target) > 0

        scaling_target_resource = list(scaling_target.values())[0]
        assert scaling_target_resource["service_namespace"] == "ecs"
        assert scaling_target_resource["scalable_dimension"] == "ecs:service:DesiredCount"
        assert scaling_target_resource["min_capacity"] == 2
        assert scaling_target_resource["max_capacity"] == 10

        # Check autoscaling policy exists
        assert "aws_appautoscaling_policy" in resources
        scaling_policy = resources["aws_appautoscaling_policy"]
        assert len(scaling_policy) > 0

        policy_resource = list(scaling_policy.values())[0]
        assert policy_resource["policy_type"] == "TargetTrackingScaling"

        # Check target tracking configuration
        assert "target_tracking_scaling_policy_configuration" in policy_resource
        target_tracking = policy_resource["target_tracking_scaling_policy_configuration"]
        assert target_tracking["target_value"] == 70.0
        assert target_tracking["scale_in_cooldown"] == 300
        assert target_tracking["scale_out_cooldown"] == 300

    def test_stack_creates_iam_roles(self):
        """Test that stack creates IAM roles for ECS tasks."""
        app = App()
        stack = TapStack(
            app,
            "TestIAMStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check IAM roles exist
        assert "aws_iam_role" in resources
        iam_roles = resources["aws_iam_role"]
        # Should have at least 2 roles (task execution role and task role)
        assert len(iam_roles) >= 2

        # Check IAM role policy attachments exist
        assert "aws_iam_role_policy_attachment" in resources

    def test_stack_creates_cloudwatch_log_group(self):
        """Test that stack creates CloudWatch log group."""
        app = App()
        stack = TapStack(
            app,
            "TestLogsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check CloudWatch log group exists
        assert "aws_cloudwatch_log_group" in resources
        log_group = resources["aws_cloudwatch_log_group"]
        assert len(log_group) > 0

        log_group_resource = list(log_group.values())[0]
        assert log_group_resource["name"].startswith("/ecs/customer-portal-")
        assert log_group_resource["retention_in_days"] == 7

    def test_stack_applies_tags(self):
        """Test that stack applies required tags to resources."""
        app = App()
        stack = TapStack(
            app,
            "TestTagsStack",
            environment_suffix="test",
            aws_region="us-east-1",
            default_tags={"Project": "CustomerPortal"}
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check that VPC has tags (resources inherit provider default_tags)
        vpc = resources["aws_vpc"]
        vpc_resource = list(vpc.values())[0]
        assert "tags" in vpc_resource
        vpc_tags = vpc_resource["tags"]
        assert "Name" in vpc_tags  # At minimum, Name tag should be present

        # Check that ECS cluster has tags
        ecs_cluster = resources["aws_ecs_cluster"]
        cluster_resource = list(ecs_cluster.values())[0]
        assert "tags" in cluster_resource
        cluster_tags = cluster_resource["tags"]
        assert "Name" in cluster_tags

        # Check that ALB has tags
        alb = resources["aws_lb"]
        alb_resource = list(alb.values())[0]
        assert "tags" in alb_resource
        alb_tags = alb_resource["tags"]
        assert "Name" in alb_tags

    def test_stack_outputs_values(self):
        """Test that stack outputs required values."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))

        # Check outputs exist
        assert "output" in synth_stack
        outputs = synth_stack["output"]

        # Check required outputs
        assert "alb_dns_name" in outputs
        assert "vpc_id" in outputs
        assert "ecs_cluster_name" in outputs
        assert "ecs_service_name" in outputs

    def test_resource_naming_includes_environment_suffix(self):
        """Test that all resources include environment_suffix in their names."""
        app = App()
        test_suffix = "testenv123"
        stack = TapStack(
            app,
            "TestNamingStack",
            environment_suffix=test_suffix,
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check VPC naming
        vpc = resources["aws_vpc"]
        vpc_resource = list(vpc.values())[0]
        assert test_suffix in vpc_resource["tags"]["Name"]

        # Check ECS cluster naming
        ecs_cluster = resources["aws_ecs_cluster"]
        cluster_resource = list(ecs_cluster.values())[0]
        assert test_suffix in cluster_resource["name"]

        # Check ALB naming
        alb = resources["aws_lb"]
        alb_resource = list(alb.values())[0]
        assert test_suffix in alb_resource["name"]

    def test_long_environment_suffix_name_truncation(self):
        """Test that long environment_suffix values are truncated to meet AWS naming limits."""
        app = App()
        # Use a very long suffix to trigger name truncation logic
        long_suffix = "verylongenvironmentsuffixthatexceedsthirtytwocharacters"
        stack = TapStack(
            app,
            "TestLongNamingStack",
            environment_suffix=long_suffix,
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Check ALB name is truncated to <= 32 chars
        alb = resources["aws_lb"]
        alb_resource = list(alb.values())[0]
        alb_name = alb_resource["name"]
        assert len(alb_name) <= 32
        # Should use truncated version: cp-alb-{first 20 chars of suffix}
        assert alb_name.startswith("cp-alb-")

        # Check Target Group name is truncated to <= 32 chars
        tg = resources["aws_lb_target_group"]
        tg_resource = list(tg.values())[0]
        tg_name = tg_resource["name"]
        assert len(tg_name) <= 32
        # Should use truncated version: cp-tg-{first 25 chars of suffix}
        assert tg_name.startswith("cp-tg-")


# add more test suites and cases as needed
