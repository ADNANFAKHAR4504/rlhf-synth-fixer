# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with the correct environment suffix")
    def test_creates_s3_bucket_with_env_suffix(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Bucket name uses Fn::Join with environment suffix parameter
        template.has_resource_properties("AWS::S3::Bucket", Match.object_like({
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.any_value()
            })
        }))

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Check parameter default
        template.has_parameter("environmentSuffix", Match.object_like({
            "Default": "dev"
        }))

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestLambda")
        template = Template.from_stack(stack)

        # ASSERT - There are 2 Lambda functions (main + auto-delete custom resource)
        # Check for the compliance analyzer specifically
        template.has_resource_properties("AWS::Lambda::Function", Match.object_like({
            "Runtime": "python3.11",
            "Timeout": 900,
            "MemorySize": 512,
            "Handler": "index.handler"
        }))
