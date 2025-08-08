import unittest
import pulumi
from pulumi.runtime import set_mocks
from lib.tap_stack import TapStack, TapStackArgs
from tests.unit.mocks import MyMocks

class TapStackTestCase(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    set_mocks(MyMocks())

  def test_tap_stack_initialization_default_args(self):
    def pulumi_test():
      stack = TapStack("test", TapStackArgs())
      self.assertEqual(stack.environment_suffix, "prod")
      self.assertEqual(stack.regions, ["us-gov-west-1", "us-gov-east-1"])
    pulumi.runtime.run_in_stack(pulumi_test)

  def test_networking_created_per_region(self):
    def pulumi_test():
      stack = TapStack("test", TapStackArgs())
      for region in stack.regions:
        self.assertIn(region, stack.regional_networks)
        self.assertIsNotNone(stack.regional_networks[region].vpc_id)
    pulumi.runtime.run_in_stack(pulumi_test)

  def test_monitoring_created_per_region(self):
    def pulumi_test():
      stack = TapStack("test", TapStackArgs())
      for region in stack.regions:
        self.assertIn(region, stack.regional_monitoring)
        self.assertIsNotNone(stack.regional_monitoring[region].dashboard_name)
    pulumi.runtime.run_in_stack(pulumi_test)

  def test_elastic_beanstalk_created_per_region(self):
    def pulumi_test():
      stack = TapStack("test", TapStackArgs())
      for region in stack.regions:
        eb = stack.regional_elastic_beanstalk[region]
        self.assertIsNotNone(eb.application_name)
        self.assertIsNotNone(eb.environment_url)
    pulumi.runtime.run_in_stack(pulumi_test)

  def test_identity_created_once(self):
    def pulumi_test():
      stack = TapStack("test", TapStackArgs())
      self.assertIsNotNone(stack.identity.eb_service_role.arn)
      self.assertIsNotNone(stack.identity.eb_instance_profile.name)
    pulumi.runtime.run_in_stack(pulumi_test)

  def test_exports_called(self):
    def pulumi_test():
      stack = TapStack("test", TapStackArgs())
      self.assertEqual(stack.regions[0], "us-gov-west-1")
      self.assertEqual(stack.environment_suffix, "prod")
    pulumi.runtime.run_in_stack(pulumi_test)
