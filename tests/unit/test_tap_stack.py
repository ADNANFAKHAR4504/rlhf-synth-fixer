import unittest
from typing import Any
from unittest import mock
import os
import pulumi
from pulumi import Output
from pulumi.runtime import mocks

from lib.tap_stack import TapStack, TapStackArgs


class TapMocks(mocks.Mocks):
  def new_resource(self, args: mocks.MockResourceArgs) -> tuple[str, dict[str, Any]]:
    outputs = {
      **args.inputs,
      "arn": f"arn:aws:mock:{args.name}",
      "id": f"{args.name}-id"
    }
    if args.typ == "aws:kms/ciphertext:Ciphertext":
      outputs["ciphertext_blob"] = "mock-ciphertext"
    if args.typ == "aws:ec2/securityGroup:SecurityGroup":
      outputs["id"] = f"sg-{args.name}"
    if args.typ == "aws:ec2/vpcEndpoint:VpcEndpoint":
      outputs["id"] = f"vpce-{args.name}"
    return f"{args.name}-id", outputs

  def call(self, args: mocks.MockCallArgs) -> dict[str, Any]:
    if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
      return {
        "account_id": "123456789012",
        "user_id": "mock-user",
        "arn": "arn:aws:iam::123456789012:user/mock"
      }
    if args.token == "aws:ec2/getPrefixList:getPrefixList":
      return {
        "id": "pl-abcdef123",
        "name": args.args["name"]
      }
    if args.token == "aws:ec2/getVpc:getVpc":
      return {
        "id": "vpc-123456",
        "default": True
      }
    if args.token == "aws:kms/getCiphertext:getCiphertext":
      return {
        "ciphertext_blob": "mock-ciphertext"
      }
    return args.args


class TapStackUnitTest(unittest.TestCase):
  """Unit tests for TapStack using Pulumi mocks."""

  @classmethod
  def setUpClass(cls):
    os.environ["SKIP_PREFIX_LIST_RULE"] = "1"
    mocks.set_mocks(TapMocks())
    cls._require_secret_patch = mock.patch.object(
      pulumi.Config, "require_secret", return_value=Output.secret("mock-secret")
    )
    cls._require_secret_patch.start()

  @classmethod
  def tearDownClass(cls):
    cls._require_secret_patch.stop()


  def test_tap_stack_constructs(self):
    """Test key output attributes exist and are Outputs."""
    os.environ["SKIP_PREFIX_LIST_RULE"] = "1"
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)

    expected_outputs = [
      "vpc_id",
      "security_group_id",
      "iam_user_arn",
      "kms_key_id",
      "kms_alias"
    ]

    for attr in expected_outputs:
      self.assertTrue(hasattr(stack, attr), f"Missing output: {attr}")
      val = getattr(stack, attr)
      self.assertIsInstance(val, Output)

  @mock.patch("pulumi.Config.require_secret", return_value=Output.secret("mock-secret"))
  def test_encrypted_secret_value(self, _):
    """Ensure encrypted secret is an Output and not plain."""
    args = TapStackArgs(environment_suffix="test")
    stack = TapStack("test-stack", args)

    self.assertTrue(hasattr(stack, "encrypted_app_secret"))
    self.assertIsInstance(stack.encrypted_app_secret, Output)

  def test_default_args(self):
    """Check TapStackArgs defaults."""
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")
    self.assertEqual(args.tags, {})
    self.assertIsInstance(args.tags, dict)


if __name__ == "__main__":
  unittest.main()
