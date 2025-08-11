"""Unit tests for lib.tap_stack.TapStack single-file CDKTF stack."""

# pylint: disable=bad-indentation,wrong-import-position,unused-import,duplicate-code,import-error,line-too-long

import json
import os
import sys

from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib.tap_stack import TapStack


class TestTapStackSynthesis:
    def test_stack_synthesizes(self):
        app = App()
        stack = TapStack(app, "TapStackUnit")
        synth_str = Testing.synth(stack)
        assert synth_str

    def test_provider_and_backend_remote_configured(self):
        app = App()
        stack = TapStack(app, "TapStackBackend")
        synth = json.loads(Testing.synth(stack))
        # Provider region
        assert synth.get("provider", {}).get("aws", [{}])[0]["region"] == "us-east-1"
        # Remote backend settings
        backend = synth.get("terraform", {}).get("backend", {}).get("remote", {})
        assert backend.get("hostname") == "app.terraform.io"
        assert backend.get("organization") == os.getenv("TF_CLOUD_ORG", "your-org")
        workspaces = backend.get("workspaces", {})
        assert workspaces.get("name") == os.getenv("TF_WORKSPACE", "production")


class TestNetworking:
    def test_vpc_and_subnets_created(self):
        app = App()
        stack = TapStack(app, "TapStackNet")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        assert "aws_vpc" in resources
        # Expect at least 4 subnets (2 public + 2 private)
        assert len(resources.get("aws_subnet", {})) >= 4
        # IGW and NAT gateways present
        assert "aws_internet_gateway" in resources
        assert len(resources.get("aws_nat_gateway", {})) >= 2
        # Route tables and associations
        assert len(resources.get("aws_route_table", {})) >= 3
        assert len(resources.get("aws_route_table_association", {})) >= 3


class TestSecurityAndIAM:
    def test_security_groups_and_rules(self):
        app = App()
        stack = TapStack(app, "TapStackSec")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        sgs = resources.get("aws_security_group", {})
        sg_rules = resources.get("aws_security_group_rule", {})
        assert len(sgs) >= 3  # alb, fargate, rds
        # Check one ALB HTTP ingress rule
        found_http = any(
            r.get("from_port") == 80
            and r.get("to_port") == 80
            and r.get("type") == "ingress"
            for r in sg_rules.values()
        )
        assert found_http

    def test_iam_roles_and_policies(self):
        app = App()
        stack = TapStack(app, "TapStackIAM")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        roles = resources.get("aws_iam_role", {})
        role_names = [r.get("name", "") for r in roles.values()]
        assert any("production-ecs-execution-role" in n for n in role_names)
        assert any("production-ecs-task-role" in n for n in role_names)
        # policy and attachment exist
        assert len(resources.get("aws_iam_policy", {})) >= 1
        assert len(resources.get("aws_iam_role_policy_attachment", {})) >= 2


class TestSecretsAndCompute:
    def test_secrets_manager_resources(self):
        app = App()
        stack = TapStack(app, "TapStackSecrets")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        assert len(resources.get("aws_secretsmanager_secret", {})) >= 2
        assert len(resources.get("aws_secretsmanager_secret_version", {})) >= 2

    def test_ecs_and_alb_resources(self):
        app = App()
        stack = TapStack(app, "TapStackECS")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        assert "aws_ecs_cluster" in resources
        assert "aws_ecs_service" in resources
        td = list(resources.get("aws_ecs_task_definition", {}).values())[0]
        assert "FARGATE" in td.get("requires_compatibilities", [])
        # Load balancer components
        assert "aws_lb" in resources
        assert "aws_lb_target_group" in resources
        assert "aws_lb_listener" in resources
        # CloudWatch log group for ECS
        assert "aws_cloudwatch_log_group" in resources


class TestMonitoring:
    def test_sns_and_alarms_present(self):
        app = App()
        stack = TapStack(app, "TapStackMon")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        assert "aws_sns_topic" in resources
        assert "aws_sns_topic_subscription" in resources
        alarms = resources.get("aws_cloudwatch_metric_alarm", {})
        assert len(alarms) >= 3  # ECS CPU, ECS Mem, ALB at minimum


class TestOutputsAndDBToggle:
    def test_outputs_present_without_db(self, monkeypatch):
        # Ensure DB is disabled
        monkeypatch.delenv("ENABLE_DATABASE", raising=False)
        app = App()
        stack = TapStack(app, "TapStackOutNoDB")
        synth = json.loads(Testing.synth(stack))
        outputs = synth.get("output", {})
        # Core outputs
        assert "vpc_id" in outputs
        assert "alb_dns_name" in outputs
        assert "target_group_arn" in outputs
        assert "ecs_cluster_name" in outputs
        assert "ecs_service_name" in outputs
        # Secrets outputs
        assert "db_secret_arn" in outputs
        assert "app_secret_arn" in outputs
        # No DB outputs
        assert "rds_identifier" not in outputs
        assert "rds_endpoint" not in outputs

    def test_db_enabled_via_env_creates_rds_and_outputs(self, monkeypatch):
        monkeypatch.setenv("ENABLE_DATABASE", "true")
        app = App()
        stack = TapStack(app, "TapStackDB")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        # RDS exists
        assert "aws_db_instance" in resources
        # Outputs include DB details
        outputs = synth.get("output", {})
        assert "rds_identifier" in outputs
        assert "rds_endpoint" in outputs
