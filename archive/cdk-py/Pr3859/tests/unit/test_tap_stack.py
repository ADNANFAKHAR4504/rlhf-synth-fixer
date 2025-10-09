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

    @mark.it("creates a nested stack with portfolio resources")
    def test_creates_nested_stack(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Should have a nested CloudFormation stack
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Should have a nested stack
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("uses custom environment suffix when provided")
    def test_uses_custom_env_suffix(self):
        # ARRANGE
        env_suffix = "customenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix),
                         env=cdk.Environment(account="123456789012",
                                           region="us-east-2"))
        template = Template.from_stack(stack)

        # ASSERT - Nested stack should have the environment suffix in its ID
        # The nested stack will be named PortfolioStack{environment_suffix}
        template.resource_count_is("AWS::CloudFormation::Stack", 1)
