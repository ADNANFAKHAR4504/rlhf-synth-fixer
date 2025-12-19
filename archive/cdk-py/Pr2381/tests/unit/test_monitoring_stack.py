# tests/unit/test_monitoring_stack.py

import pytest
from aws_cdk import App, Environment
from aws_cdk.assertions import Template
# Removed unused imports from aws_cdk.aws_ecs and aws_cdk.aws_rds if they are not directly used in the test logic,
# but kept the Mock classes for them.
# from aws_cdk import aws_ecs as ecs, aws_rds as rds 

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
        app, # scope
        "MonitoringStack", # <--- CORRECTED: This is now the positional 'construct_id'
        ecs_service=MockECSService(),
        rds_instance=MockRDSInstance(),
        env=env
    )
    return Template.from_stack(stack)


def test_monitoring_configuration(monitoring_stack):
    """Test CloudWatch dashboard and alarm configuration."""

    # Check dashboard exists
    monitoring_stack.resource_count_is("AWS::CloudWatch::Dashboard", 1)
    monitoring_stack.has_resource_properties("AWS::CloudWatch::Dashboard", {
        "DashboardName": "app-MonitoringStack" # Adjusted dashboard name to match stack ID
    })

    # Check alarm properties
    monitoring_stack.resource_count_is("AWS::CloudWatch::Alarm", 1) # Assuming one alarm is created
    monitoring_stack.has_resource_properties("AWS::CloudWatch::Alarm", {
        "MetricName": "HealthCheckFailed",
        "Threshold": 1,
        "AlarmName": "app-ecs-failure-MonitoringStack" # Adjusted alarm name to match stack ID
    })
    