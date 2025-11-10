"""
Unit tests for Route53Stack using template synthesis approach.
Tests Route 53 configuration through synthesized CloudFormation templates.
"""
import os
import sys
import pytest
from aws_cdk import App, Environment

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Import after path is set
from lib.tap_stack import TapStack
from lib.route53_stack import Route53Stack
from aws_cdk import assertions


class TestRoute53StackWithRealStacks:
    """Test Route53Stack using real TapStacks"""

    def test_full_stack_synthesis(self):
        """Test that all stacks can be synthesized together"""
        app = App()
        env = Environment(account="123456789012", region="us-east-1")
        environment_suffix = "test-r53"

        # Create source and target stacks
        source_stack = TapStack(
            app,
            f"TestSourceStack-{environment_suffix}",
            environment_suffix=f"source-{environment_suffix}",
            env=env,
        )

        target_stack = TapStack(
            app,
            f"TestTargetStack-{environment_suffix}",
            environment_suffix=f"target-{environment_suffix}",
            env=env,
        )

        # Create Route53 stack
        route53_stack = Route53Stack(
            app,
            f"TestRoute53Stack-{environment_suffix}",
            source_alb=source_stack.alb,
            target_alb=target_stack.alb,
            environment_suffix=environment_suffix,
            env=env,
        )

        # Test synthesis completes
        assert route53_stack is not None

    def test_route53_hosted_zone_created(self):
        """Test hosted zone is created"""
        app = App()
        env = Environment(account="123456789012", region="us-east-1")
        environment_suffix = "test-hz"

        source_stack = TapStack(
            app,
            f"SourceStack-{environment_suffix}",
            environment_suffix=f"source-{environment_suffix}",
            env=env,
        )

        target_stack = TapStack(
            app,
            f"TargetStack-{environment_suffix}",
            environment_suffix=f"target-{environment_suffix}",
            env=env,
        )

        route53_stack = Route53Stack(
            app,
            f"Route53Stack-{environment_suffix}",
            source_alb=source_stack.alb,
            target_alb=target_stack.alb,
            environment_suffix=environment_suffix,
            env=env,
        )

        template = assertions.Template.from_stack(route53_stack)
        template.resource_count_is("AWS::Route53::HostedZone", 1)

    def test_route53_health_checks_created(self):
        """Test health checks are created"""
        app = App()
        env = Environment(account="123456789012", region="us-east-1")
        environment_suffix = "test-hc"

        source_stack = TapStack(
            app,
            f"SourceStack-{environment_suffix}",
            environment_suffix=f"source-{environment_suffix}",
            env=env,
        )

        target_stack = TapStack(
            app,
            f"TargetStack-{environment_suffix}",
            environment_suffix=f"target-{environment_suffix}",
            env=env,
        )

        route53_stack = Route53Stack(
            app,
            f"Route53Stack-{environment_suffix}",
            source_alb=source_stack.alb,
            target_alb=target_stack.alb,
            environment_suffix=environment_suffix,
            env=env,
        )

        template = assertions.Template.from_stack(route53_stack)
        # Should have 2 health checks (source and target)
        template.resource_count_is("AWS::Route53::HealthCheck", 2)

    def test_route53_a_records_created(self):
        """Test A records are created"""
        app = App()
        env = Environment(account="123456789012", region="us-east-1")
        environment_suffix = "test-records"

        source_stack = TapStack(
            app,
            f"SourceStack-{environment_suffix}",
            environment_suffix=f"source-{environment_suffix}",
            env=env,
        )

        target_stack = TapStack(
            app,
            f"TargetStack-{environment_suffix}",
            environment_suffix=f"target-{environment_suffix}",
            env=env,
        )

        route53_stack = Route53Stack(
            app,
            f"Route53Stack-{environment_suffix}",
            source_alb=source_stack.alb,
            target_alb=target_stack.alb,
            environment_suffix=environment_suffix,
            env=env,
        )

        template = assertions.Template.from_stack(route53_stack)
        # Should have 2 A records (source and target)
        template.resource_count_is("AWS::Route53::RecordSet", 2)

    def test_route53_outputs_created(self):
        """Test CloudFormation outputs are created"""
        app = App()
        env = Environment(account="123456789012", region="us-east-1")
        environment_suffix = "test-outputs"

        source_stack = TapStack(
            app,
            f"SourceStack-{environment_suffix}",
            environment_suffix=f"source-{environment_suffix}",
            env=env,
        )

        target_stack = TapStack(
            app,
            f"TargetStack-{environment_suffix}",
            environment_suffix=f"target-{environment_suffix}",
            env=env,
        )

        route53_stack = Route53Stack(
            app,
            f"Route53Stack-{environment_suffix}",
            source_alb=source_stack.alb,
            target_alb=target_stack.alb,
            environment_suffix=environment_suffix,
            env=env,
        )

        template = assertions.Template.from_stack(route53_stack)
        outputs = template.find_outputs("*")
        # Should have at least one output
        assert len(outputs) >= 1
