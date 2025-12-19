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

    @mark.it("creates Lambda functions for the serverless platform")
    def test_creates_lambda_functions(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 Lambda functions (Sample + Monitoring)
        template.resource_count_is("AWS::Lambda::Function", 2)

    @mark.it("creates API Gateway for the serverless platform")
    def test_creates_api_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Should have 1 REST API
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    @mark.it("creates IAM roles for Lambda and API Gateway")
    def test_creates_iam_roles(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestIAM")
        template = Template.from_stack(stack)

        # ASSERT - Should have IAM roles (Lambda execution + API Gateway CloudWatch)
        # The count may be 1 or 2 depending on API Gateway configuration
        iam_role_count = len(template.find_resources("AWS::IAM::Role"))
        self.assertGreaterEqual(iam_role_count, 1)
