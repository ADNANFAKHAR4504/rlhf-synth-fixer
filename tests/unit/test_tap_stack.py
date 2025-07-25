import os
import sys
from unittest.mock import patch, MagicMock

import pytest

from aws_cdk import App, Environment
from lib.tap_stack import TapStack, TapStackProps

# Note: This line ensures your module can be imported correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))


@pytest.fixture
def patched_tap_stack():
    """
    A fixture to mock the nested stacks to prevent side effects and
    to verify that the TapStack calls them correctly.
    """
    with (
        # Patch the Nested Stack classes, not the base stack classes
        patch("lib.tap_stack.NestedVpcStack") as mock_nested_vpc,
        patch("lib.tap_stack.NestedEcsStack") as mock_nested_ecs,
        patch("lib.tap_stack.NestedRdsStack") as mock_nested_rds,
        patch("lib.tap_stack.NestedMonitoringStack") as mock_nested_monitoring,
        patch("lib.tap_stack.NestedCicdStack") as mock_nested_cicd,
        patch("lib.tap_stack.NestedRoute53Stack") as mock_nested_route53,
    ):
        # We need to mock the return values of the nested stacks
        # to have the attributes that the parent stack expects.
        mock_nested_vpc.return_value.vpc = MagicMock()
        mock_nested_ecs.return_value.ecs_service = MagicMock()
        mock_nested_ecs.return_value.listener = MagicMock()
        mock_nested_ecs.return_value.blue_target_group = MagicMock()
        mock_nested_ecs.return_value.green_target_group = MagicMock()
        mock_nested_ecs.return_value.load_balancer = MagicMock()
        mock_nested_rds.return_value.rds_instance = MagicMock()

        yield {
            "mocks": {
                "vpc": mock_nested_vpc,
                "ecs": mock_nested_ecs,
                "rds": mock_nested_rds,
                "monitoring": mock_nested_monitoring,
                "cicd": mock_nested_cicd,
                "route53": mock_nested_route53,
            }
        }


def test_tap_stack_initializes_stacks(patched_tap_stack):
    """
    Tests that the TapStack initializes the correct nested stacks.
    """
    app = App()
    props = TapStackProps(
        environment_suffix="dev",
        env=Environment(account="123456789012", region="us-east-1"),
    )
    TapStack(app, "TapStack", props)

    mocks = patched_tap_stack["mocks"]

    # Assert that nested stacks were called for each of the two regions.
    assert mocks["vpc"].call_count == 2
    assert mocks["ecs"].call_count == 2
    assert mocks["rds"].call_count == 2
    assert mocks["monitoring"].call_count == 2

    # Assert that the CICD and Route53 stacks were called once.
    assert mocks["cicd"].call_count == 1
    assert mocks["route53"].call_count == 1