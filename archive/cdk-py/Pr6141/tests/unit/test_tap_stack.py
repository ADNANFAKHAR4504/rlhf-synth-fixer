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

    @mark.it("creates compliance system resources with environment suffix")
    def test_creates_compliance_resources_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 2)  # Critical and warning topics
        template.resource_count_is("AWS::DynamoDB::Table", 1)  # Compliance results table
        template.resource_count_is("AWS::S3::Bucket", 1)  # Compliance reports bucket
        template.resource_count_is("AWS::Lambda::Function", 1)  # Compliance scanner
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"compliance-critical-violations-{env_suffix}",
            "DisplayName": "Compliance Critical Violations"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 2)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "compliance-critical-violations-dev",
            "DisplayName": "Compliance Critical Violations"
        })

    @mark.it("creates Lambda function with correct environment variables")
    def test_creates_lambda_with_correct_environment(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"compliance-scanner-{env_suffix}",
            "Runtime": "python3.9",
            "Handler": "index.lambda_handler",
            "MemorySize": 256,
            "Timeout": 300
        })
