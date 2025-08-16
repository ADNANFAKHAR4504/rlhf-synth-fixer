# pylint: disable=C0111
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack (integration-style, local synth only)")
class TestTapStackIntegration(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  @mark.it("brings up the end-to-end wiring for logging to a central destination")
  def test_end_to_end_logging_wiring(self):
    # Use dummy ARNs/accounts; we only synth locally.
    stack = TapStack(
      self.app,
      "TapStackInt",
      TapStackProps(environment_suffix="stage"),
      central_destination_arn=
      "arn:aws:logs:us-east-1:444444444444:destination:central-security-destination",
      env=cdk.Environment(account="222222222222", region="us-east-1"),
    )
    t = Template.from_stack(stack)

    # CloudTrail present
    t.resource_count_is("AWS::CloudTrail::Trail", 1)

    # LogGroup present (for publishing CloudTrail logs)
    t.resource_count_is("AWS::Logs::LogGroup", 1)

    # Subscription filter to central destination present
    t.resource_count_is("AWS::Logs::SubscriptionFilter", 1)

    # Config rule present for S3 SSE
    t.resource_count_is("AWS::Config::ConfigRule", 1)
