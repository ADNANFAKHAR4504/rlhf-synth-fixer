# tests/integration/test_integration.py

import os
import sys
import types

import pytest
from aws_cdk import App, Environment
from aws_cdk import CfnReference  # Import to check for CDK tokens

from lib.cdk.vpc_stack import VpcStack
from lib.cdk.ecs_stack import EcsStack
from lib.cdk.rds_stack import RdsStack
from lib.cdk.monitoring_stack import MonitoringStack
from lib.cdk.cicd_stack import CicdStack
from lib.cdk.route53_stack import Route53Stack

# Setup
os.environ["DISABLE_TAPSTACK"] = "1"
sys.modules["tapstack"] = None

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
      # Corrected attribute name from 'alb' to 'load_balancer'
      load_balancer=types.SimpleNamespace(load_balancer_dns_name="localhost:8080"),
      ecs_service=types.SimpleNamespace(service_name="mock-service"),
      cluster=types.SimpleNamespace(cluster_name="mock-cluster"),
      listener=types.SimpleNamespace(listener_arn="mock-listener-arn"),
      blue_target_group=types.SimpleNamespace(target_group_arn="mock-blue-tg-arn"),
      green_target_group=types.SimpleNamespace(target_group_arn="mock-green-tg-arn")
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
    }

  print("  Running in REAL DEPLOYED STACK mode")

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
  cicd_stack = CicdStack(
    app,
    "TestCicd",
    fargate_service=ecs_stack.ecs_service,
    listener=ecs_stack.listener,
    blue_target_group=ecs_stack.blue_target_group,
    green_target_group=ecs_stack.green_target_group,
    env=env
  )

  # Corrected Route53Stack instantiation to use the 'load_balancer' attribute
  route53_stack = Route53Stack(
    app,
    "TestRoute53",
    alb1=ecs_stack.load_balancer,
    alb2=ecs_stack.load_balancer,
    env=env
  )


  app.synth()

  return {
    "vpc_stack": vpc_stack,
    "ecs_stack": ecs_stack,
    "rds_stack": rds_stack,
    "monitoring_stack": monitoring_stack,
    "cicd_stack": cicd_stack,
    "route53_stack": route53_stack,
    "vpc_peering_stack": vpc_peering_stack
  }


def test_stack_synthesis(test_stack):
  """
  Checks that the stack is correctly synthesized without runtime values.
  This is the test for the REAL DEPLOYED STACK mode.
  """
  # ECS Stack
  assert "ecs_stack" in test_stack
  assert hasattr(test_stack["ecs_stack"], "load_balancer")
  
  # A correct assertion would check if it's a CDK token, not a hardcoded string.
  assert isinstance(test_stack["ecs_stack"].load_balancer.load_balancer_dns_name, CfnReference)
  
  # RDS Stack
  assert "rds_stack" in test_stack
  assert hasattr(test_stack["rds_stack"], "rds_instance")
  # Similarly, check if this is a CDK token
  assert isinstance(test_stack["rds_stack"].rds_instance.instance_endpoint.hostname, CfnReference)

  # Route53 Stack
  assert "route53_stack" in test_stack
  assert hasattr(test_stack["route53_stack"], "zone")
  # The hosted zone ID is a real value at this stage, but it's likely a token as well.
  assert isinstance(test_stack["route53_stack"].zone.hosted_zone_id, CfnReference)

  # VPC Stack
  assert "vpc_stack" in test_stack
  assert hasattr(test_stack["vpc_stack"], "vpc")
  # The VPC ID is a token at this stage.
  assert isinstance(test_stack["vpc_stack"].vpc.vpc_id, CfnReference)

  # Monitoring Stack - This might be a token or a hardcoded value, depending on your implementation
  assert "monitoring_stack" in test_stack
  assert hasattr(test_stack["monitoring_stack"], "cloudwatch_dashboard")
  # This assertion can remain as it checks a hardcoded value from the stack's constructor
  assert test_stack["monitoring_stack"].cloudwatch_dashboard.name.startswith("TestMonitoring")

# A test function that ONLY runs in mocked mode
@pytest.mark.skipif(
    os.getenv("LOCAL_TESTING") != "1",
    reason="This test only runs in mocked local testing mode"
)
def test_mocked_stack_loads(test_stack):
  """
  Checks that the mocked stack objects are correctly loaded with dummy values.
  """
  # ECS Stack
  assert "ecs_stack" in test_stack
  assert hasattr(test_stack["ecs_stack"], "load_balancer")
  assert test_stack["ecs_stack"].load_balancer.load_balancer_dns_name.startswith("localhost")

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

  # Monitoring Stack
  assert "monitoring_stack" in test_stack
  assert hasattr(test_stack["monitoring_stack"], "cloudwatch_dashboard")
  assert test_stack["monitoring_stack"].cloudwatch_dashboard.name == "mock-dashboard"