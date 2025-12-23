"""Unit tests for FraudDetectionStack (main.py)."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.main import FraudDetectionStack


class TestFraudDetectionStackStructure:
    """Test suite for FraudDetectionStack Structure."""

    def test_fraud_detection_stack_instantiates_successfully(self):
        """FraudDetectionStack instantiates successfully."""
        app = App()
        stack = FraudDetectionStack(app, "TestFraudStack", environment_suffix="test")

        assert stack is not None
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_fraud_detection_stack_creates_vpc(self):
        """FraudDetectionStack creates VPC with correct configuration."""
        app = App()
        stack = FraudDetectionStack(app, "TestVpcStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_vpc" in synthesized

    def test_fraud_detection_stack_creates_subnets(self):
        """FraudDetectionStack creates public and private subnets."""
        app = App()
        stack = FraudDetectionStack(app, "TestSubnetStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_subnet" in synthesized

    def test_fraud_detection_stack_creates_security_groups(self):
        """FraudDetectionStack creates security groups."""
        app = App()
        stack = FraudDetectionStack(app, "TestSgStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_security_group" in synthesized

    def test_fraud_detection_stack_creates_ecs_cluster(self):
        """FraudDetectionStack creates ECS cluster."""
        app = App()
        stack = FraudDetectionStack(app, "TestEcsStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_ecs_cluster" in synthesized

    def test_fraud_detection_stack_creates_aurora_cluster(self):
        """FraudDetectionStack creates Aurora cluster."""
        app = App()
        stack = FraudDetectionStack(app, "TestAuroraStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_rds_cluster" in synthesized

    def test_fraud_detection_stack_creates_alb(self):
        """FraudDetectionStack creates Application Load Balancer."""
        app = App()
        stack = FraudDetectionStack(app, "TestAlbStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_lb" in synthesized

    def test_fraud_detection_stack_creates_api_gateway(self):
        """FraudDetectionStack creates API Gateway."""
        app = App()
        stack = FraudDetectionStack(app, "TestApiStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_apigatewayv2_api" in synthesized

    def test_fraud_detection_stack_creates_waf(self):
        """FraudDetectionStack creates WAF."""
        app = App()
        stack = FraudDetectionStack(app, "TestWafStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_wafv2_web_acl" in synthesized

    def test_fraud_detection_stack_creates_cloudwatch_dashboard(self):
        """FraudDetectionStack creates CloudWatch dashboard."""
        app = App()
        stack = FraudDetectionStack(app, "TestDashStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_dashboard" in synthesized

    def test_fraud_detection_stack_creates_iam_roles(self):
        """FraudDetectionStack creates IAM roles."""
        app = App()
        stack = FraudDetectionStack(app, "TestIamStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_iam_role" in synthesized

    def test_fraud_detection_stack_creates_secrets(self):
        """FraudDetectionStack creates Secrets Manager secrets."""
        app = App()
        stack = FraudDetectionStack(app, "TestSecretsStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_secretsmanager_secret" in synthesized

    def test_fraud_detection_stack_creates_nat_gateway(self):
        """FraudDetectionStack creates NAT Gateway."""
        app = App()
        stack = FraudDetectionStack(app, "TestNatStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_nat_gateway" in synthesized

    def test_fraud_detection_stack_creates_flow_logs(self):
        """FraudDetectionStack creates VPC Flow Logs."""
        app = App()
        stack = FraudDetectionStack(app, "TestFlowStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_flow_log" in synthesized

    def test_fraud_detection_stack_creates_autoscaling(self):
        """FraudDetectionStack creates autoscaling configuration."""
        app = App()
        stack = FraudDetectionStack(app, "TestAutoStack", environment_suffix="test")

        synthesized = Testing.synth(stack)
        assert "aws_appautoscaling_target" in synthesized

    def test_fraud_detection_stack_with_different_env_suffix(self):
        """FraudDetectionStack works with different environment suffixes."""
        app = App()
        stack = FraudDetectionStack(app, "TestEnvStack", environment_suffix="prod")

        assert stack is not None
        synthesized = Testing.synth(stack)
        assert synthesized is not None
