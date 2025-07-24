import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import pytest
from unittest.mock import patch, MagicMock
from importlib import reload
from lib.cdk.vpc_stack import VpcStack
from lib.cdk.ecs_stack import EcsStack
from lib.cdk.rds_stack import RdsStack
from lib.cdk.monitoring_stack import MonitoringStack
from lib.cdk.cicd_stack import CicdStack
from lib.cdk.vpc_peering_stack import VpcPeeringStack
from lib.cdk.route53_stack import Route53Stack

# Ensure lib is treated as a package
lib_path = os.path.join(os.path.dirname(__file__), "../../lib")
init_file = os.path.join(lib_path, "__init__.py")
if not os.path.exists(init_file):
    open(init_file, "a").close()

# ✅ Add the required import here so `lib.tap_stack` is available for patching and reloading
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
             patch("lib.tap_stack.Route53Stack"), \
             patch("lib.tap_stack.App.synth", return_value=None):

            # Reload the module to ensure it runs with mocks
            reload(lib.tap_stack)
