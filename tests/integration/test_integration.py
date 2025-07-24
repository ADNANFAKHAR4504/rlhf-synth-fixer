# tests/integration/test_integration.py

import os
import sys
import types

import pytest
from aws_cdk import App, Environment

from lib.cdk.vpc_stack import VpcStack
from lib.cdk.ecs_stack import EcsStack
from lib.cdk.rds_stack import RdsStack
from lib.cdk.monitoring_stack import MonitoringStack
from lib.cdk.cicd_stack import CicdStack
from lib.cdk.route53_stack import Route53Stack

# Setup
os.environ["DISABLE_TAPSTACK"] = "1"
sys.modules["tapstack"] = None  # Optional hard block

if os.getenv("CI") and os.getenv("LOCAL_TESTING") == "1":
    raise RuntimeError("CI environment should not use LOCAL_TESTING=1")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))


@pytest.fixture(scope="module")
def test_stack():
    """
    Returns either real deployed stack references (for CI/CD) or mock values (for local test runs).
    """
    if os.getenv("LOCAL_TESTING") == "1":
        print("  Running in MOCKED LOCAL TESTING mode")

        vpc_stack = types.SimpleNamespace(
            vpc=types.SimpleNamespace(vpc_id="vpc-mock123")
        )

        ecs_stack = types.SimpleNamespace(
            alb=types.SimpleNamespace(load_balancer_dns_name="localhost:8080"),
            ecs_service=types.SimpleNamespace(service_name="mock-service"),
            cluster=types.SimpleNamespace(cluster_name="mock-cluster")
        )

        rds_stack = types.SimpleNamespace(
            rds_instance=types.SimpleNamespace(
                instance_endpoint=types.SimpleNamespace(hostname="localhost")
            ),
            rds_instance_replica=types.SimpleNamespace(
                instance_endpoint=types.SimpleNamespace(hostname="localhost")
            )
        )

        monitoring_stack = types.SimpleNamespace(
            cloudwatch_dashboard=types.SimpleNamespace(
                dashboard_name="mock-dashboard",
                name="mock-dashboard"
            )
        )

        cicd_stack = types.SimpleNamespace()

        vpc_peering_stack = types.SimpleNamespace(
            peering_connection=types.SimpleNamespace(connection_id="pcx-mock123")
        )

        route53_stack = types.SimpleNamespace(
            node=types.SimpleNamespace(
                find_child=lambda name: types.SimpleNamespace(
                    node=types.SimpleNamespace(
                        default_child=types.SimpleNamespace(ref="mock-health-check-id")
                    )
                )
            ),
            zone=types.SimpleNamespace(
                hosted_zone_id="Z3P5QSUBK4POTI",
                zone_name="example.local"
            )
        )

        return {
            "vpc_stack": vpc_stack,
            "ecs_stack": ecs_stack,
            "rds_stack": rds_stack,
            "monitoring_stack": monitoring_stack,
            "cicd_stack": cicd_stack,
            "route53_stack": route53_stack,
            "vpc_peering_stack": vpc_peering_stack
        }

    else:
        print(" Running in REAL DEPLOYED STACK mode")

        os.environ["DISABLE_TAPSTACK"] = "1"
        sys.modules["tapstack"] = None

        app = App(context={"stack": "test"})
        env = Environment(region="us-east-1")

        vpc_stack = VpcStack(app, "TestVPC", env=env)
        ecs_stack = EcsStack(app, "TestECS", vpc=vpc_stack.vpc, env=env)
        rds_stack = RdsStack(app, "TestRDS", vpc=vpc_stack.vpc, env=env)
        monitoring_stack = MonitoringStack(
            app,
            "TestMonitoring",
            ecs_service=ecs_stack.ecs_service,
            rds_instance=rds_stack.rds_instance,
            env=env
        )
        cicd_stack = CicdStack(app, "TestCicd", ecs_stacks={"us-east-1": ecs_stack}, env=env)
        route53_stack = Route53Stack(app, "TestRoute53", alb1=ecs_stack.alb, alb2=ecs_stack.alb, env=env)

        app.synth()

        return {
            "vpc_stack": vpc_stack,
            "ecs_stack": ecs_stack,
            "rds_stack": rds_stack,
            "monitoring_stack": monitoring_stack,
            "cicd_stack": cicd_stack,
            "route53_stack": route53_stack
        }


def test_mocked_stack_loads(test_stack):
    # ECS Stack
    assert "ecs_stack" in test_stack
    assert hasattr(test_stack["ecs_stack"], "alb")
    assert test_stack["ecs_stack"].alb.load_balancer_dns_name.startswith("localhost")

    # RDS Stack
    assert "rds_stack" in test_stack
    assert hasattr(test_stack["rds_stack"], "rds_instance")
    assert test_stack["rds_stack"].rds_instance.instance_endpoint.hostname == "localhost"

    # Route53 Stack
    assert "route53_stack" in test_stack
    assert hasattr(test_stack["route53_stack"], "zone")
    assert test_stack["route53_stack"].zone.hosted_zone_id.startswith("Z")

    # VPC Stack
    assert "vpc_stack" in test_stack
    assert hasattr(test_stack["vpc_stack"], "vpc")
    assert test_stack["vpc_stack"].vpc.vpc_id.startswith("vpc-")

    # VPC Peering Stack
    assert "vpc_peering_stack" in test_stack
    assert hasattr(test_stack["vpc_peering_stack"], "peering_connection")
    assert test_stack["vpc_peering_stack"].peering_connection.connection_id.startswith("pcx-")

    # Monitoring Stack
    assert "monitoring_stack" in test_stack
    assert hasattr(test_stack["monitoring_stack"], "cloudwatch_dashboard")
    assert test_stack["monitoring_stack"].cloudwatch_dashboard.name == "mock-dashboard"
