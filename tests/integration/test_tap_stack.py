# tests/integration/test_tap_stack.py

"""
Integration test for TapStack.
Uses Pulumi Automation API to deploy the stack and verify output.
"""

import os
import json
import tempfile
import pulumi.automation as auto
import unittest


class TapStackIntegrationTest(unittest.TestCase):

  def test_stack_deploys_and_outputs_bucket(self):
    project_name = "tap-project"
    stack_name = "tap-integration"
    program_dir = os.path.abspath(".")

    def pulumi_program():
      from lib.tap_stack import TapStack, TapStackArgs
      TapStack("tap-stack", TapStackArgs(
        environment_suffix="integration",
        bucket_name="tap-stack-integration-bucket",
        tags={"env": "integration"}
      ))

    stack = auto.create_or_select_stack(
      stack_name=stack_name,
      project_name=project_name,
      program=pulumi_program
    )

    stack.set_config("aws:region", auto.ConfigValue(value="us-west-1"))
    up_res = stack.up()

    self.assertIn("bucket_name", up_res.outputs)
    self.assertTrue(up_res.outputs["bucket_name"].value.startswith("tap"))

    stack.destroy()
    stack.workspace.remove_stack(stack_name)
