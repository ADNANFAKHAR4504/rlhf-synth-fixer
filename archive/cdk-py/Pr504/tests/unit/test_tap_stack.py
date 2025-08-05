# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with the correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
      TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": f"tap-bucket-{env_suffix}"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": "tap-bucket-dev"
    })

  @mark.it("creates a DynamoDB table with correct naming and schema")
  def test_creates_dynamodb_table(self):
    # ARRANGE
    env_suffix = "unit"
    stack = TapStack(self.app, "TapStackDDB",
      TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
      "TableName": f"tap-object-metadata-{env_suffix}",
      "BillingMode": "PAY_PER_REQUEST",
      "AttributeDefinitions": [
        {"AttributeName": "objectKey", "AttributeType": "S"},
        {"AttributeName": "uploadTime", "AttributeType": "S"}
      ],
      "KeySchema": [
        {"AttributeName": "objectKey", "KeyType": "HASH"},
        {"AttributeName": "uploadTime", "KeyType": "RANGE"}
      ]
    })

  @mark.it("creates an SNS topic with correct naming")
  def test_creates_sns_topic(self):
    # ARRANGE
    env_suffix = "notify"
    stack = TapStack(self.app, "TapStackSNS",
      TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SNS::Topic", 1)
    template.has_resource_properties("AWS::SNS::Topic", {
      "TopicName": f"tap-notification-{env_suffix}"
    })

  @mark.it("creates S3 notification configuration for Lambda")
  def test_creates_s3_notification(self):
    env_suffix = "s3notify"
    stack = TapStack(self.app, "TapStackS3Notify",
      TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::Lambda::Permission", {
      "Action": "lambda:InvokeFunction",
      "Principal": "s3.amazonaws.com",
      "SourceAccount": Match.any_value()
    })

  @mark.it("creates all required resources")
  def test_creates_all_required_resources(self):
    env_suffix = "all"
    stack = TapStack(self.app, "TapStackAll",
      TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.resource_count_is("AWS::SNS::Topic", 1)
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
      "FunctionName": f"tap-object-processor-{env_suffix}"
    })
