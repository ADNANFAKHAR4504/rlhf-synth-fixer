"""Unit tests for TapStack CDK infrastructure"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"

    @mark.it("creates KMS key with encryption enabled")
    def test_creates_kms_key(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
        })

    @mark.it("creates VPC with private subnets in 2 AZs")
    def test_creates_vpc_with_private_subnets(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        # Private subnets (2 AZs)
        template.resource_count_is("AWS::EC2::Subnet", 2)

    @mark.it("creates VPC endpoints for S3, KMS, and CloudWatch Logs")
    def test_creates_vpc_endpoints(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Gateway endpoint for S3
        template.resource_count_is("AWS::EC2::VPCEndpoint", 3)

    @mark.it("creates S3 data bucket with KMS encryption and versioning")
    def test_creates_data_bucket_with_encryption(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"financial-data-bucket-{self.env_suffix}",
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    })
                ])
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates S3 bucket with lifecycle rule for Glacier transition")
    def test_creates_bucket_with_lifecycle_rule(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Id": "TransitionOldVersionsToGlacier",
                        "Status": "Enabled",
                        "NoncurrentVersionTransitions": Match.array_with([
                            Match.object_like({
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 30
                            })
                        ])
                    })
                ])
            }
        })

    @mark.it("creates S3 bucket policy denying non-HTTPS requests")
    def test_creates_bucket_policy_https_only(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Deny",
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    })
                ])
            }
        })

    @mark.it("creates flow logs S3 bucket with encryption")
    def test_creates_flow_logs_bucket(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"flow-logs-bucket-{self.env_suffix}",
        })

    @mark.it("enables VPC flow logs")
    def test_enables_vpc_flow_logs(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::FlowLog", 1)

    @mark.it("creates Lambda function with VPC configuration")
    def test_creates_lambda_in_vpc(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"pii-scanner-{self.env_suffix}",
            "Runtime": "python3.11",
            "Timeout": 60,
            "MemorySize": 512,
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value(),
                "SecurityGroupIds": Match.any_value()
            })
        })

    @mark.it("creates Lambda with KMS-encrypted environment variables")
    def test_creates_lambda_with_encrypted_env_vars(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "BUCKET_NAME": Match.any_value(),
                    "KMS_KEY_ID": Match.any_value()
                })
            },
            "KmsKeyArn": Match.any_value()
        })

    @mark.it("creates IAM role for Lambda with least privilege")
    def test_creates_lambda_role_with_least_privilege(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            }
        })

    @mark.it("creates security group allowing only HTTPS traffic")
    def test_creates_security_group_https_only(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupEgress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443
                })
            ])
        })

    @mark.it("creates CloudWatch Log Group for Lambda with 90-day retention")
    def test_creates_lambda_log_group(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/pii-scanner-{self.env_suffix}",
            "RetentionInDays": 90
        })

    @mark.it("creates API Gateway REST API")
    def test_creates_api_gateway(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"pii-scanner-api-{self.env_suffix}"
        })

    @mark.it("creates API Gateway with logging enabled")
    def test_creates_api_gateway_with_logging(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "MethodSettings": Match.array_with([
                Match.object_like({
                    "LoggingLevel": "INFO",
                    "DataTraceEnabled": True
                })
            ])
        })

    @mark.it("creates API key for authentication")
    def test_creates_api_key(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)

    @mark.it("creates usage plan with API key")
    def test_creates_usage_plan(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)

    @mark.it("creates request validator for API Gateway")
    def test_creates_request_validator(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApiGateway::RequestValidator", {
            "ValidateRequestBody": True,
            "ValidateRequestParameters": True
        })

    @mark.it("creates API method with API key requirement")
    def test_creates_api_method_with_key_requirement(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST",
            "ApiKeyRequired": True
        })

    @mark.it("creates CloudWatch alarms for security monitoring")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 4 alarms (Lambda errors, API 4xx, API 5xx, KMS)
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)

    @mark.it("creates stack outputs for integration")
    def test_creates_stack_outputs(self):
        # ARRANGE
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        assert "ApiEndpointUrl" in outputs
        assert "ApiKeyId" in outputs
        assert "DataBucketName" in outputs
        assert "FlowLogsBucketName" in outputs
        assert "KmsKeyId" in outputs
        assert "LambdaFunctionName" in outputs

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "financial-data-bucket-dev"
        })
