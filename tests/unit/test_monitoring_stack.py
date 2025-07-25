# tests/unit/test_monitoring_stack.py

import pytest
from aws_cdk import App, Environment
from aws_cdk.assertions import Template
from aws_cdk import aws_ecs as ecs, aws_rds as rds

from lib.cdk.monitoring_stack import MonitoringStack


class MockCluster:
  cluster_name = "test-cluster"


class MockECSService:
  service_name = "test-service"
  cluster = MockCluster()


class MockRDSInstance:
  instance_identifier = "test-db"


@pytest.fixture
def monitoring_stack():
  app = App()
  env = Environment(account="123456789012", region="us-west-2")
  stack = MonitoringStack(
    scope=app,
    construct_id="MonitoringStack",
    ecs_service=MockECSService(),
    rds_instance=MockRDSInstance(),
    env=env
  )
  return Template.from_stack(stack)


def test_monitoring_configuration(monitoring_stack):
  """Test CloudWatch dashboard and alarm configuration."""

  # Check dashboard exists
  monitoring_stack.resource_count_is("AWS::CloudWatch::Dashboard", 1)

  # Check alarm properties
  monitoring_stack.has_resource_properties("AWS::CloudWatch::Alarm", {
    "MetricName": "HealthCheckFailed",
    "Threshold": 1
  })
