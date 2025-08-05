import unittest
from typing import Any, Dict
from unittest import mock

import pulumi
from pulumi import Output
from pulumi.runtime import mocks

from lib.tap_stack import TapStack, TapStackArgs


class TapMocks(mocks.Mocks):
  def new_resource(self, args: mocks.MockResourceArgs) -> tuple[str, dict[str, Any]]:
    return f"{args.name}-id", {
      **args.inputs,
      "arn": f"arn:aws:mock:{args.name}",
      "name": args.name
    }

  def call(self, args: mocks.MockCallArgs) -> dict[str, Any]:
    return args.args


class TapStackUnitTest(unittest.TestCase):
  """Unit test case for TapStack using Pulumi mocks."""

  @classmethod
  def setUpClass(cls):
    mocks.set_mocks(TapMocks())

  def test_default_args(self):
    """Test TapStackArgs default values."""
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")
    self.assertIsInstance(args.tags, dict)
    self.assertEqual(args.tags, {})

  @mock.patch("pulumi.Config.require_secret", return_value=Output.secret("mock-db-password"))
  def test_tap_stack_outputs(self, _):
    """Test expected outputs from TapStack."""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)

    expected_attrs = [
      "vpc_id",
      "security_group_id",
      "iam_user_arn",
      "access_key_id",
      "kms_key_id",
      "kms_alias",
    ]

    for attr in expected_attrs:
      self.assertTrue(hasattr(stack, attr), f"Missing attribute: {attr}")
      val = getattr(stack, attr)
      self.assertIsInstance(val, pulumi.Output)


if __name__ == '__main__':
  unittest.main()
