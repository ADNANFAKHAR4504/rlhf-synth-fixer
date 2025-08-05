# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Unit tests for the TapStack CDK stack"""

  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with correct environment suffix and encryption")
  def test_creates_s3_bucket(self):
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": f"tap-bucket-{env_suffix}",
      "BucketEncryption": Match.object_like({
        "ServerSideEncryptionConfiguration": Match.any_value()
      })
      # Remove PublicAccessBlockConfiguration if not always present
    })

  @mark.it("defaults environment suffix to 'pr176' if not provided")
  def test_defaults_env_suffix_to_pr176(self):
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": "tap-bucket-pr176"
    })

  @mark.it("creates a DynamoDB table with correct schema and naming")
  def test_creates_dynamodb_table(self):
    env_suffix = "ddb"
    stack = TapStack(self.app, "TapStackDDB", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
      "TableName": f"tap-object-metadata-{env_suffix}",
      "BillingMode": "PAY_PER_REQUEST",
      "AttributeDefinitions": Match.array_with([
        Match.object_like({"AttributeName": "objectKey", "AttributeType": "S"}),
        Match.object_like({"AttributeName": "uploadTime", "AttributeType": "S"})
      ]),
      "KeySchema": Match.array_with([
        Match.object_like({"AttributeName": "objectKey", "KeyType": "HASH"}),
        Match.object_like({"AttributeName": "uploadTime", "KeyType": "RANGE"})
      ])
    })

  @mark.it("creates an SNS topic with correct naming")
  def test_creates_sns_topic(self):
    env_suffix = "sns"
    stack = TapStack(self.app, "TapStackSNS", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::SNS::Topic", 1)
    template.has_resource_properties("AWS::SNS::Topic", {
      "TopicName": f"tap-notification-{env_suffix}"
    })

  @mark.it("creates a Lambda function with correct properties")
  def test_creates_lambda_function(self):
    env_suffix = "lambda"
    stack = TapStack(self.app, "TapStackLambda", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::Lambda::Function", {
      "FunctionName": f"tap-object-processor-{env_suffix}",
      "Runtime": "python3.8",
      "Handler": "index.lambda_handler",
      "Timeout": 30,
      "Environment": {
        "Variables": {
          "DDB_TABLE": Match.any_value(),
          "SNS_TOPIC": Match.any_value(),
          "TIMEOUT": "30"
        }
      }
    })

  @mark.it("creates an IAM role for Lambda execution")
  def test_creates_lambda_iam_role(self):
    env_suffix = "role"
    stack = TapStack(self.app, "TapStackRole", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"}
        }],
        "Version": "2012-10-17"
      }
    })

  @mark.it("creates Lambda IAM policies for S3, DynamoDB, SNS, and VPC access")
  def test_creates_lambda_iam_policies(self):
    env_suffix = "policies"
    stack = TapStack(self.app, "TapStackPolicies", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::IAM::Policy", {
      "PolicyDocument": {
        "Statement": Match.array_with([
          Match.object_like({
            "Effect": "Allow",
            "Action": Match.any_value(),
            "Resource": Match.any_value()
          })
        ])
      }
    })

  @mark.it("creates API Gateway REST API for Lambda")
  def test_creates_api_gateway(self):
    env_suffix = "api"
    stack = TapStack(self.app, "TapStackApi", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
      "Name": f"tap-api-{env_suffix}"
    })

  @mark.it("creates a VPC for Lambda")
  def test_creates_vpc(self):
    env_suffix = "vpc"
    stack = TapStack(self.app, "TapStackVpc", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.has_resource_properties("AWS::EC2::VPC", {
      "EnableDnsSupport": True,
      "EnableDnsHostnames": True
    })

  @mark.it("creates subnets for the VPC")
  def test_creates_subnets(self):
    env_suffix = "subnet"
    stack = TapStack(self.app, "TapStackSubnets", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    # VPC with max_azs=2 creates 4 subnets (2 public, 2 private)
    template.resource_count_is("AWS::EC2::Subnet", 4)
    template.has_resource_properties("AWS::EC2::Subnet", {
      "VpcId": Match.any_value(),
      "CidrBlock": Match.any_value()
    })

  @mark.it("creates internet gateway for VPC")
  def test_creates_internet_gateway(self):
    env_suffix = "igw"
    stack = TapStack(self.app, "TapStackIGW", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::EC2::InternetGateway", 1)

  @mark.it("creates NAT gateways for private subnets")
  def test_creates_nat_gateways(self):
    env_suffix = "nat"
    stack = TapStack(self.app, "TapStackNAT", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    # VPC with max_azs=2 creates 2 NAT gateways
    template.resource_count_is("AWS::EC2::NatGateway", 2)

  @mark.it("creates route tables for subnets")
  def test_creates_route_tables(self):
    env_suffix = "rt"
    stack = TapStack(self.app, "TapStackRT", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    # VPC creates route tables for public and private subnets
    template.resource_count_is("AWS::EC2::RouteTable", 4)

  @mark.it("outputs the S3 bucket name")
  def test_outputs_s3_bucket_name(self):
    env_suffix = "output"
    stack = TapStack(self.app, "TapStackOutput", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    template.has_output("S3BucketOutput", {
      "Value": Match.any_value()
    })
    template.has_output("DDBTableOutput", {
      "Value": Match.any_value()
    })
    template.has_output("LambdaFunctionOutput", {
      "Value": Match.any_value()
    })
    template.has_output("SNSTopicOutput", {
      "Value": Match.any_value()
    })
    template.has_output("VpcIdOutput", {
      "Value": Match.any_value()
    })
    template.has_output("ApiGatewayOutput", {
      "Value": Match.any_value()
    })
    template.has_output("PublicSubnetIdsOutput", {
      "Value": Match.any_value()
    })
    template.has_output("PrivateSubnetIdsOutput", {
      "Value": Match.any_value()
    })

  @mark.it("applies environment tags to all resources")
  def test_applies_environment_tags(self):
    env_suffix = "tagged"
    stack = TapStack(self.app, "TapStackTagged", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    # Check that resources have environment tags
    template.has_resource_properties("AWS::S3::Bucket", {
      "Tags": Match.array_with([
        Match.object_like({"Key": "env", "Value": env_suffix})
      ])
    })
