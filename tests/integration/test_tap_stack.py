import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import pytest
from unittest.mock import patch, MagicMock
from importlib import reload

# Ensure lib is treated as a package
lib_path = os.path.join(os.path.dirname(__file__), "../../lib")
init_file = os.path.join(lib_path, "__init__.py")
if not os.path.exists(init_file):
  open(init_file, "a").close()


import lib.tap_stack


@pytest.mark.describe("Integration Test: TapStack CDK App")
class TestTapStackCDK:

  @pytest.mark.it("should synthesize the full CDK app without errors from lib.tap_stack")
  def test_synth_tap_stack(self):
    # Mocking all dependent stacks to prevent actual resource creation
    mock_ecs_stack = MagicMock()
    mock_ecs_stack.ecs_service = MagicMock()
    mock_ecs_stack.listener = MagicMock()
    mock_ecs_stack.blue_target_group = MagicMock()
    mock_ecs_stack.green_target_group = MagicMock()

    with patch("lib.tap_stack.VpcStack"), \
         patch("lib.tap_stack.EcsStack", return_value=mock_ecs_stack), \
         patch("lib.tap_stack.RdsStack"), \
         patch("lib.tap_stack.MonitoringStack"), \
         patch("lib.tap_stack.VpcPeeringStack"), \
         patch("lib.tap_stack.CicdStack"), \
         patch("lib.tap_stack.Route53Stack"):
      # Reload the module to ensure it runs with mocks
      reload(lib.tap_stack)
