import os
import sys
from unittest.mock import patch, MagicMock

import pytest

from aws_cdk import App, Environment, Stack
from lib.tap_stack import (
    TapStack,
    TapStackProps,
    NestedVpcStack,
    NestedEcsStack,
    NestedRdsStack,
    NestedMonitoringStack,
    NestedCicdStack,
    NestedRoute53Stack,
)

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
        mock_nested_ecs.return_value.codedeploy_app = MagicMock()
        mock_nested_ecs.return_value.deployment_group = MagicMock()
        mock_nested_ecs.return_value.codedeploy_role = MagicMock()
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


# New tests to cover the nested stack __init__ methods


@patch("lib.tap_stack.VpcStack")
def test_nested_vpc_stack_initialization(mock_vpc_stack):
    """Test NestedVpcStack initialization to cover lines 51-53."""
    app = App()
    stack = Stack(app, "TestStack")
    env = Environment(account="123456789012", region="us-east-1")
    
    mock_vpc_stack.return_value.vpc = MagicMock()
    
    nested_vpc = NestedVpcStack(stack, "TestNestedVpc", env=env)
    
    assert nested_vpc.vpc_stack is not None
    assert nested_vpc.vpc is not None
    mock_vpc_stack.assert_called_once()


@patch("lib.tap_stack.EcsStack")
def test_nested_ecs_stack_initialization(mock_ecs_stack):
    """Test NestedEcsStack initialization to cover lines 67-79."""
    app = App()
    stack = Stack(app, "TestStack")
    env = Environment(account="123456789012", region="us-east-1")
    mock_vpc = MagicMock()
    
    mock_ecs_instance = MagicMock()
    mock_ecs_instance.ecs_service = MagicMock()
    mock_ecs_instance.listener = MagicMock()
    mock_ecs_instance.blue_target_group = MagicMock()
    mock_ecs_instance.green_target_group = MagicMock()
    mock_ecs_instance.load_balancer = MagicMock()
    mock_ecs_instance.codedeploy_app = MagicMock()
    mock_ecs_instance.deployment_group = MagicMock()
    mock_ecs_instance.codedeploy_role = MagicMock()
    mock_ecs_stack.return_value = mock_ecs_instance
    
    nested_ecs = NestedEcsStack(
        stack,
        "TestNestedEcs",
        vpc=mock_vpc,
        env=env,
        task_image_options=None
    )
    
    assert nested_ecs.ecs_stack is not None
    assert nested_ecs.ecs_service is not None
    assert nested_ecs.listener is not None
    assert nested_ecs.blue_target_group is not None
    assert nested_ecs.green_target_group is not None
    assert nested_ecs.load_balancer is not None
    assert nested_ecs.codedeploy_app is not None
    assert nested_ecs.deployment_group is not None
    assert nested_ecs.codedeploy_role is not None
    mock_ecs_stack.assert_called_once()


@patch("lib.tap_stack.RdsStack")
def test_nested_rds_stack_initialization(mock_rds_stack):
    """Test NestedRdsStack initialization to cover lines 84-86."""
    app = App()
    stack = Stack(app, "TestStack")
    env = Environment(account="123456789012", region="us-east-1")
    mock_vpc = MagicMock()
    
    mock_rds_instance = MagicMock()
    mock_rds_instance.rds_instance = MagicMock()
    mock_rds_stack.return_value = mock_rds_instance
    
    nested_rds = NestedRdsStack(
        stack,
        "TestNestedRds",
        vpc=mock_vpc,
        env=env
    )
    
    assert nested_rds.rds_stack is not None
    assert nested_rds.rds_instance is not None
    mock_rds_stack.assert_called_once()


@patch("lib.tap_stack.MonitoringStack")
def test_nested_monitoring_stack_initialization(mock_monitoring_stack):
    """Test NestedMonitoringStack initialization to cover lines 100-101."""
    app = App()
    stack = Stack(app, "TestStack")
    env = Environment(account="123456789012", region="us-east-1")
    mock_ecs_service = MagicMock()
    mock_rds_instance = MagicMock()
    
    nested_monitoring = NestedMonitoringStack(
        stack,
        "TestNestedMonitoring",
        env=env,
        ecs_service=mock_ecs_service,
        rds_instance=mock_rds_instance
    )
    
    assert nested_monitoring.monitoring_stack is not None
    mock_monitoring_stack.assert_called_once()


@patch("lib.tap_stack.CicdStack")
def test_nested_cicd_stack_initialization(mock_cicd_stack):
    """Test NestedCicdStack initialization to cover lines 123-124."""
    app = App()
    stack = Stack(app, "TestStack")
    env = Environment(account="123456789012", region="us-east-1")
    
    nested_cicd = NestedCicdStack(
        stack,
        "TestNestedCicd",
        env=env,
        fargate_service=MagicMock(),
        listener=MagicMock(),
        blue_target_group=MagicMock(),
        green_target_group=MagicMock(),
        codedeploy_app=MagicMock(),
        deployment_group=MagicMock(),
    )
    
    assert nested_cicd.cicd_stack is not None
    mock_cicd_stack.assert_called_once()


@patch("lib.tap_stack.Route53Stack")
def test_nested_route53_stack_initialization(mock_route53_stack):
    """Test NestedRoute53Stack initialization to cover lines 146-147."""
    app = App()
    stack = Stack(app, "TestStack")
    env = Environment(account="123456789012", region="us-east-1")
    
    nested_route53 = NestedRoute53Stack(
        stack,
        "TestNestedRoute53",
        alb1=MagicMock(),
        alb2=MagicMock(),
        env=env
    )
    
    assert nested_route53.route53_stack is not None
    mock_route53_stack.assert_called_once()