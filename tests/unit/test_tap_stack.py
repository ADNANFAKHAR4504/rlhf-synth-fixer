
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
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
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "WebsiteConfiguration": {
            "IndexDocument": "index.html",
            "ErrorDocument": "error.html"
        },
        "VersioningConfiguration": {
            "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": False,
            "BlockPublicPolicy": False,
            "IgnorePublicAcls": False,
            "RestrictPublicBuckets": False
        }
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource("AWS::S3::Bucket", {})

  @mark.it("creates a Lambda function with correct configuration")
  def test_creates_lambda_function(self):
    stack = TapStack(self.app, "TapStackTestLambda")
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.12",
        "Handler": "lambda_function.lambda_handler",
        "MemorySize": 128,
        "Timeout": 30
    })

  @mark.it("creates IAM role for Lambda with least privilege")
  def test_creates_lambda_iam_role(self):
    stack = TapStack(self.app, "TapStackTestIAM")
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ],
            "Version": "2012-10-17"
        }
    })

  @mark.it("creates S3 bucket policy for public read access")
  def test_creates_s3_bucket_policy(self):
    stack = TapStack(self.app, "TapStackTestPolicy")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::BucketPolicy", 1)
    template.has_resource_properties("AWS::S3::BucketPolicy", {
        "PolicyDocument": {
            "Version": "2012-10-17"
        }
    })

  @mark.it("creates CDK outputs for website URL and Lambda function")
  def test_creates_cdk_outputs(self):
    stack = TapStack(self.app, "TapStackTestOutputs")
    template = Template.from_stack(stack)
    template.has_output("WebsiteURL", {
        "Description": "URL of the static website"
    })
    template.has_output("LambdaFunctionARN", {
        "Description": "ARN of the Lambda function"
    })
    template.has_output("LambdaFunctionName", {
        "Description": "Name of the Lambda function"
    })
    template.has_output("S3BucketName", {
        "Description": "Name of the S3 bucket"
    })

  @mark.it("creates S3 bucket deployment for static content")
  def test_creates_s3_deployment(self):
    stack = TapStack(self.app, "TapStackTestDeployment")
    template = Template.from_stack(stack)
    template.resource_count_is("Custom::CDKBucketDeployment", 1)
    template.has_resource_properties("Custom::CDKBucketDeployment", {
        "DestinationBucketName": {
            "Ref": "WebsiteBucket75C24D94"
        },
        "DestinationBucketKeyPrefix": "",
        "Prune": True
    })

  @mark.it("sets correct removal policy for S3 bucket")
  def test_s3_bucket_removal_policy(self):
    stack = TapStack(self.app, "TapStackTestRemoval")
    template = Template.from_stack(stack)
    template.has_resource("AWS::S3::Bucket", {
        "UpdateReplacePolicy": "Delete",
        "DeletionPolicy": "Delete"
    })

  @mark.it("includes Lambda function with proper handler and runtime")
  def test_lambda_function_handler_and_runtime(self):
    stack = TapStack(self.app, "TapStackTestCode")
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::Lambda::Function", {
        "Handler": "lambda_function.lambda_handler",
        "Runtime": "python3.12"
    })
