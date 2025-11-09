# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates CloudWatch log groups with the correct environment suffix")
    def test_creates_cloudwatch_log_groups_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 3)  # API Gateway, Lambda, and App logs
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/apigateway/payment-api-{env_suffix}",
            "RetentionInDays": 30
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 3)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/payment-api-dev",
            "RetentionInDays": 30
        })

    @mark.it("creates SNS topics for different alert priorities")
    def test_creates_sns_topics_for_alerts(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 3)  # Critical, Warning, and Info topics
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"payment-critical-alerts-{env_suffix}",
            "DisplayName": "Payment Critical Alerts"
        })
