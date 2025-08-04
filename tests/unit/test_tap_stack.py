# tests/unit/test_tap_stack.py

import unittest
from pulumi.runtime import test
from lib.tap_stack import TapStack, TapStackArgs


class TapStackUnitTest(unittest.TestCase):

  @test
  def test_bucket_created_with_name(self):
    args = TapStackArgs(
      environment_suffix="test",
      bucket_name="test-bucket",
      tags={"env": "test"}
    )
    stack = TapStack("unittest-stack", args)

    def check_bucket_name(name):
      self.assertEqual(name, "test-bucket")
      return True

    return stack.bucket.id.apply(check_bucket_name)

  @test
  def test_bucket_tags(self):
    args = TapStackArgs(
      bucket_name="tap-unit-bucket",
      tags={"project": "unit-test", "env": "dev"}
    )
    stack = TapStack("tap-test", args)

    def validate_tags(tags):
      self.assertIn("project", tags)
      self.assertEqual(tags["env"], "dev")
      return True

    return stack.bucket.tags.apply(validate_tags)
