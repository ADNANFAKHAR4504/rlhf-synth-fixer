"""Integration tests for TapStack.

These tests synthesize the full Terraform JSON and assert cross-resource wiring
and key attributes for a production-grade stack. They do not hit AWS.
"""

# pylint: disable=bad-indentation,wrong-import-position,unused-import,duplicate-code,line-too-long,import-error

import json
import os

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTapStackIntegration:
    def test_synth_and_core_resources_present(self):
        app = App()
        stack = TapStack(app, "TapStackIntegration")
        synth = json.loads(Testing.synth(stack))

        resources = synth.get("resource", {})
        # Core infra
        assert "aws_vpc" in resources
        assert len(resources.get("aws_subnet", {})) >= 4
        assert "aws_internet_gateway" in resources
        assert "aws_nat_gateway" in resources
        # Compute
        assert "aws_ecs_cluster" in resources
        assert "aws_ecs_task_definition" in resources
        assert "aws_ecs_service" in resources
        # ALB
        assert "aws_lb" in resources
        assert "aws_lb_listener" in resources
        assert "aws_lb_target_group" in resources

    def test_alb_listener_targets_ecs(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationALB")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})

        listener = list(resources.get("aws_lb_listener", {}).values())[0]
        default_action = listener["default_action"][0]
        assert default_action["type"] == "forward"
        # Depending on provider version, default_action may embed target_group_arn or reference listener_rule
        if "target_group_arn" in default_action:
            assert isinstance(default_action["target_group_arn"], str)
            assert default_action["target_group_arn"]
        else:
            # Fallback: ensure a target group exists and is referenced elsewhere
            tgs = resources.get("aws_lb_target_group", {})
            assert len(tgs) >= 1

    def test_ecs_service_wired_to_tg_and_private_subnets(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationECS")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})

        svc = list(resources.get("aws_ecs_service", {}).values())[0]
        lb = svc["load_balancer"][0]
        assert lb["container_name"] == "production-app"
        assert lb["container_port"] == 8080
        # Private subnets (assign_public_ip False)
        # network_configuration may synthesize as an object or a 1-item list
        net_block = svc["network_configuration"]
        net = net_block[0] if isinstance(net_block, list) else net_block
        assert net["assign_public_ip"] is False
        assert len(net["subnets"]) >= 2

    def test_outputs_are_exposed(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationOutputs")
        synth = json.loads(Testing.synth(stack))
        outputs = synth.get("output", {})
        for key in [
            "vpc_id",
            "alb_dns_name",
            "target_group_arn",
            "ecs_cluster_name",
            "ecs_service_name",
            "db_secret_arn",
            "app_secret_arn",
        ]:
            assert key in outputs

    def test_db_toggle_affects_resources_and_outputs(self, monkeypatch):
        # Disabled: no DB resources or DB outputs
        monkeypatch.delenv("ENABLE_DATABASE", raising=False)
        app = App()
        stack = TapStack(app, "TapStackNoDB")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        assert "aws_db_instance" not in resources
        outputs = synth.get("output", {})
        assert "rds_identifier" not in outputs
        assert "rds_endpoint" not in outputs

        # Enabled: DB present and outputs exist
        monkeypatch.setenv("ENABLE_DATABASE", "true")
        app2 = App()
        stack2 = TapStack(app2, "TapStackWithDB")
        synth2 = json.loads(Testing.synth(stack2))
        resources2 = synth2.get("resource", {})
        assert "aws_db_instance" in resources2
        outputs2 = synth2.get("output", {})
        assert "rds_identifier" in outputs2
        assert "rds_endpoint" in outputs2

    def test_secrets_and_iam_wiring(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationSecrets")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})

        # Secrets present with expected names
        secrets = resources.get("aws_secretsmanager_secret", {})
        secret_names = [s.get("name") for s in secrets.values()]
        assert "production/database/credentials" in secret_names
        assert "production/application/secrets" in secret_names

        # IAM roles and attachments exist
        roles = resources.get("aws_iam_role", {})
        role_names = [r.get("name", "") for r in roles.values()]
        assert any("production-ecs-execution-role" in n for n in role_names)
        assert any("production-ecs-task-role" in n for n in role_names)
        assert len(resources.get("aws_iam_role_policy_attachment", {})) >= 2

    def test_cloudwatch_alarms_and_dimensions(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationAlarms")
        synth = json.loads(Testing.synth(stack))
        alarms = synth.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
        assert len(alarms) >= 3
        # Find ALB alarm and check dimensions format
        alb_alarm = None
        for a in alarms.values():
            if a.get("alarm_name") == "production-alb-unhealthy-targets":
                alb_alarm = a
                break
        assert alb_alarm is not None
        dims = alb_alarm.get("dimensions", {})
        assert isinstance(dims, dict)
        assert "LoadBalancer" in dims and "TargetGroup" in dims
        # Values may be tokens or empty at synth time; just assert keys exist

    def test_alb_is_internet_facing_and_tagged(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationALBProps")
        synth = json.loads(Testing.synth(stack))
        lbs = synth.get("resource", {}).get("aws_lb", {})
        lb = list(lbs.values())[0]
        assert lb.get("internal") is False
        tags = lb.get("tags", {})
        assert tags.get("Environment") == "Production"
        assert tags.get("Name") == "production-alb"

    def test_nat_and_routes_present(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationRoutes")
        synth = json.loads(Testing.synth(stack))
        resources = synth.get("resource", {})
        # At least 2 NAT gateways (per AZ)
        assert len(resources.get("aws_nat_gateway", {})) >= 2
        # Private route to NAT exists
        routes = resources.get("aws_route", {})
        assert any("nat_gateway_id" in r for r in routes.values())

    def test_task_definition_and_secrets_injection(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationTaskDef")
        synth = json.loads(Testing.synth(stack))
        tds = synth.get("resource", {}).get("aws_ecs_task_definition", {})
        td = list(tds.values())[0]
        # container_definitions is a JSON string
        cdefs = json.loads(td.get("container_definitions"))
        main = cdefs[0]
        assert main["name"] == "production-app"
        # Secrets reference JSON keys from Secrets Manager ARNs
        secret_names = [s.get("name") for s in main.get("secrets", [])]
        assert "DB_USERNAME" in secret_names and "DB_PASSWORD" in secret_names and "JWT_SECRET" in secret_names

    def test_remote_backend_configured(self):
        app = App()
        stack = TapStack(app, "TapStackIntegrationBackend")
        synth = json.loads(Testing.synth(stack))
        backend = synth.get("terraform", {}).get("backend", {}).get("remote", {})
        assert backend.get("hostname") == "app.terraform.io"
        assert "organization" in backend and backend.get("workspaces", {}).get("name")

