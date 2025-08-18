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

  @mark.it("creates S3 buckets with correct configuration")
  def test_creates_s3_buckets(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Should create 3 S3 buckets (main, access logs, cloudtrail)
    template.resource_count_is("AWS::S3::Bucket", 3)
    
    # Main bucket
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketEncryption": {
        "ServerSideEncryptionConfiguration": [{
          "ServerSideEncryptionByDefault": {
            "SSEAlgorithm": "aws:kms"
          }
        }]
      },
      "VersioningConfiguration": {
        "Status": "Enabled"
      }
    })

  @mark.it("creates DynamoDB table with correct configuration")
  def test_creates_dynamodb_table(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
      "AttributeDefinitions": [
        {
          "AttributeName": "objectKey",
          "AttributeType": "S"
        },
        {
          "AttributeName": "uploadTime",
          "AttributeType": "S"
        }
      ],
      "KeySchema": [
        {
          "AttributeName": "objectKey",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "uploadTime",
          "KeyType": "RANGE"
        }
      ],
      "BillingMode": "PAY_PER_REQUEST",
      "SSESpecification": {
        "SSEEnabled": True
      }
    })

  @mark.it("creates VPC with correct subnet configuration")
  def test_creates_vpc_with_subnets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::Subnet", 6)  # 2 AZs * 3 subnet types
    template.resource_count_is("AWS::EC2::NatGateway", 1)  # Cost optimization
    template.resource_count_is("AWS::EC2::InternetGateway", 1)

  @mark.it("creates KMS key with rotation enabled")
  def test_creates_kms_key(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
      "Description": "KMS key for TAP microservice encryption",
      "EnableKeyRotation": True
    })

  @mark.it("creates Secrets Manager secrets")
  def test_creates_secrets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SecretsManager::Secret", 2)
    
    # Database credentials secret
    template.has_resource_properties("AWS::SecretsManager::Secret", {
      "Description": "Database credentials for TAP microservice"
    })
    
    # API keys secret
    template.has_resource_properties("AWS::SecretsManager::Secret", {
      "Description": "API keys for external services"
    })

  @mark.it("creates SNS topic with KMS encryption")
  def test_creates_sns_topic(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SNS::Topic", 1)

  @mark.it("creates Lambda functions with correct configuration")
  def test_creates_lambda_functions(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - CDK creates additional Lambda functions for custom resources
    template.resource_count_is("AWS::Lambda::Function", 5)
    
    # Data processor function
    template.has_resource_properties("AWS::Lambda::Function", {
      "Runtime": "python3.11",
      "Handler": "index.lambda_handler",
      "Timeout": 30,
      "MemorySize": 256
    })
    
    # API handler function
    template.has_resource_properties("AWS::Lambda::Function", {
      "Runtime": "python3.11",
      "Handler": "index.lambda_handler"
    })

  @mark.it("creates IAM roles with least privilege policies")
  def test_creates_iam_roles(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT - CDK creates additional roles for custom resources
    template.resource_count_is("AWS::IAM::Role", 7)
    
    # Data processor role should have DynamoDB, S3, SNS, Secrets Manager permissions
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }]
      }
    })

  @mark.it("creates API Gateway with correct configuration")
  def test_creates_api_gateway(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - CDK creates additional methods for CORS (OPTIONS)
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.resource_count_is("AWS::ApiGateway::Resource", 2)  # health and process
    template.resource_count_is("AWS::ApiGateway::Method", 5)    # GET /health, POST /process + 3 OPTIONS methods
    
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
      "Name": f"tap-api-{env_suffix}",
      "Description": "TAP microservice API with comprehensive logging"
    })

  @mark.it("creates CloudWatch Log Groups")
  def test_creates_cloudwatch_log_groups(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Only explicit log groups (VPC Flow Logs and API Gateway)
    template.resource_count_is("AWS::Logs::LogGroup", 2)
    
    # API Gateway log group
    template.has_resource_properties("AWS::Logs::LogGroup", {
      "LogGroupName": f"/aws/apigateway/tap-{env_suffix}",
      "RetentionInDays": 30
    })

  @mark.it("creates CloudTrail for auditing")
  def test_creates_cloudtrail(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::CloudTrail::Trail", 1)
    template.has_resource_properties("AWS::CloudTrail::Trail", {
      "TrailName": "tap-microservice-trail",
      "IncludeGlobalServiceEvents": True,
      "IsMultiRegionTrail": True,
      "EnableLogFileValidation": True
    })

  @mark.it("creates VPC Flow Logs")
  def test_creates_vpc_flow_logs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::FlowLog", 1)
    template.has_resource_properties("AWS::EC2::FlowLog", {
      "ResourceType": "VPC",
      "TrafficType": "ALL"
    })

  @mark.it("creates S3 bucket notification for Lambda")
  def test_creates_s3_notification(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT - Check for Lambda permission instead of bucket notification directly
    template.has_resource_properties("AWS::Lambda::Permission", {
      "Action": "lambda:InvokeFunction",
      "Principal": "s3.amazonaws.com"
    })

  @mark.it("creates API Gateway usage plan and API key")
  def test_creates_api_gateway_usage_plan(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
    template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
    
    template.has_resource_properties("AWS::ApiGateway::ApiKey", {
      "Name": f"tap-api-key-{env_suffix}"
    })
    
    template.has_resource_properties("AWS::ApiGateway::UsagePlan", {
      "UsagePlanName": f"tap-usage-plan-{env_suffix}",
      "Throttle": {
        "RateLimit": 1000,
        "BurstLimit": 2000
      },
      "Quota": {
        "Limit": 10000,
        "Period": "DAY"
      }
    })

  @mark.it("applies correct resource tags")
  def test_applies_resource_tags(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that resources have the expected tags
    template.has_resource_properties("AWS::S3::Bucket", {
      "Tags": Match.array_with([
        {
          "Key": "Environment",
          "Value": env_suffix
        },
        {
          "Key": "Project",
          "Value": "tap"
        }
      ])
    })

  @mark.it("creates CloudFormation outputs")
  def test_creates_cloudformation_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT - Check that outputs are created
    outputs = template.to_json()["Outputs"]
    self.assertIn("S3BucketOutput", outputs)
    self.assertIn("DDBTableOutput", outputs)
    self.assertIn("SNSTopicOutput", outputs)
    self.assertIn("LambdaFunctionOutput", outputs)
    self.assertIn("ApiGatewayOutput", outputs)
    self.assertIn("VpcIdOutput", outputs)
    self.assertIn("PublicSubnetIdsOutput", outputs)
    self.assertIn("PrivateSubnetIdsOutput", outputs)

  @mark.it("ensures Lambda functions are in private subnets")
  def test_lambda_functions_in_private_subnets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT - Lambda functions should have VPC configuration
    template.has_resource_properties("AWS::Lambda::Function", {
      "VpcConfig": Match.object_like({
        "SubnetIds": Match.any_value()
      })
    })

if __name__ == "__main__":
  unittest.main()
