import pytest
import pulumi
from typing import Dict
from lib.monitoring_stack import MonitoringStack

def test_monitoring_stack():
    name = "test-monitoring-stack"
    environment_suffix = "test"
    distribution_id = pulumi.Output.from_input("test-distribution")
    lambda_function_names = [pulumi.Output.from_input("test-lambda-1")]
    tags: Dict[str, str] = {"environment": "test"}

    monitoring_stack = MonitoringStack(
        name,
        environment_suffix,
        distribution_id,
        lambda_function_names,
        tags
    )

    assert monitoring_stack is not None