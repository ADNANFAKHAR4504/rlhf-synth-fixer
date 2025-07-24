import os
import sys
import importlib
from unittest.mock import patch, MagicMock

import pytest

# Add root directory to sys.path so lib can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

# Dummy classes for keyword-only params expected by CicdStack (if needed elsewhere)
class DummyFargateService:
  pass

class DummyListener:
  pass

class DummyTargetGroup:
  pass


@pytest.fixture(scope="module")
def patched_tap_stack():
  with patch("lib.tap_stack.CicdStack.__init__", return_value=None) as mock_cicd_init, \
       patch("lib.cdk.vpc_stack.VpcStack") as mock_vpc, \
       patch("lib.tap_stack.EcsStack") as mock_ecs, \
       patch("lib.tap_stack.RdsStack") as mock_rds, \
       patch("lib.tap_stack.MonitoringStack") as mock_monitoring, \
       patch("lib.tap_stack.VpcPeeringStack") as mock_peering, \
       patch("lib.tap_stack.Route53Stack") as mock_route53, \
       patch("aws_cdk.App") as mock_app:

    mock_ecs.return_value.ecs_service = MagicMock()
    mock_ecs.return_value.alb = MagicMock()
    mock_rds.return_value.rds_instance = MagicMock()
    fake_app = MagicMock()
    mock_app.return_value = fake_app
    fake_app.node.try_get_context.return_value = "test"

    from lib import tap_stack
    importlib.reload(tap_stack)

    yield {
      "tap_stack": tap_stack,
      "mocks": {
        "vpc": mock_vpc,
        "ecs": mock_ecs,
        "rds": mock_rds,
        "monitoring": mock_monitoring,
        "peering": mock_peering,
        "cicd_init": mock_cicd_init,
        "route53": mock_route53,
      }
    }


def test_tap_stack_initializes_stacks(patched_tap_stack):
  mocks = patched_tap_stack["mocks"]

  assert mocks["vpc"].call_count == 1
  assert mocks["ecs"].call_count == 2
  assert mocks["rds"].call_count == 2
  assert mocks["monitoring"].call_count == 2

  mocks["peering"].assert_called_once()
  mocks["cicd_init"].assert_called_once()
  mocks["route53"].assert_called_once()
