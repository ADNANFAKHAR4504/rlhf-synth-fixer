# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates DynamoDB table with environment suffix")
    def test_creates_dynamodb_table_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"PaymentWebhooks-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST"
        })

    @mark.it("creates Lambda functions with ARM64 architecture")
    def test_creates_lambda_with_arm64(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Should have 3 Lambda functions
        template.resource_count_is("AWS::Lambda::Function", 3)
        # All should use ARM64
        functions = template.find_resources("AWS::Lambda::Function")
        for func in functions.values():
            assert func["Properties"]["Architectures"] == ["arm64"]

    @mark.it("creates API Gateway with WAF")
    def test_creates_api_gateway_with_waf(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.resource_count_is("AWS::WAFv2::WebACL", 1)
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)
