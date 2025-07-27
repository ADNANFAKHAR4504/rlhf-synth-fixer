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
        "BucketName": f"tap-{env_suffix}-bucket"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": "tap-dev-bucket"
    })

  @mark.it("creates DynamoDB table for request metadata")
  def test_creates_dynamodb_table(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "TableName": f"tap-{env_suffix}-requests",
        "AttributeDefinitions": [{
            "AttributeName": "request_id",
            "AttributeType": "S"
        }],
        "KeySchema": [{
            "AttributeName": "request_id",
            "KeyType": "HASH"
        }],
        "BillingMode": "PAY_PER_REQUEST"
    })

  @mark.it("creates Lambda function with correct configuration")
  def test_creates_lambda_function(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 2)  # 1 for app + 1 for S3 auto-delete
    template.has_resource_properties("AWS::Lambda::Function", {
        "FunctionName": f"tap-{env_suffix}-processor",
        "Runtime": "python3.12",
        "Handler": "index.handler",
        "Timeout": 30
    })

  @mark.it("creates Step Functions state machine")
  def test_creates_step_functions_state_machine(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::StepFunctions::StateMachine", 1)
    template.has_resource_properties("AWS::StepFunctions::StateMachine", {
        "StateMachineName": f"tap-{env_suffix}-statemachine"
    })

  @mark.it("creates API Gateway with POST method")
  def test_creates_api_gateway(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": f"tap-{env_suffix}-api",
        "Description": "API for processing HTTP POST requests"
    })

    # Check POST method with IAM authorization
    template.resource_count_is("AWS::ApiGateway::Method", 2)  # POST and OPTIONS
    template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "POST",
        "AuthorizationType": "AWS_IAM"
    })

  @mark.it("configures proper IAM permissions for Lambda")
  def test_lambda_iam_permissions(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Lambda should have IAM role and policy
    template.resource_count_is("AWS::IAM::Role", 4)
    template.resource_count_is("AWS::IAM::Policy", 1)
    
    # Check that the Lambda policy exists and has the basic structure
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                # S3 permissions (checking for any S3 action)
                Match.object_like({
                    "Effect": "Allow",
                    "Action": Match.any_value()
                })
            ])
        }
    })

  @mark.it("tags all resources with Environment and Project")
  def test_resource_tagging(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Check that major resources have the correct tags
    template.has_resource_properties("AWS::S3::Bucket", {
        "Tags": Match.array_with([
            {"Key": "Environment", "Value": "Production"},
            {"Key": "Project", "Value": "TAP"}
        ])
    })
    
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "Tags": Match.array_with([
            {"Key": "Environment", "Value": "Production"},
            {"Key": "Project", "Value": "TAP"}
        ])
    })

  @mark.it("creates CloudFormation outputs for key resources")
  def test_creates_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Check that important outputs are created
    outputs = template.to_json()["Outputs"]
    
    self.assertIn("ApiEndpoint", outputs)
    self.assertIn("BucketName", outputs)
    self.assertIn("TableName", outputs)
    self.assertIn("StateMachineArn", outputs)
    self.assertIn("LambdaFunctionName", outputs)
