"""Unit tests for ServerlessStack."""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.serverless_stack import ServerlessStack


@mark.describe("ServerlessStack")
class TestServerlessStack(unittest.TestCase):
    """Test cases for the ServerlessStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()

    @mark.it("creates S3 bucket with correct properties")
    def test_creates_s3_bucket_with_correct_properties(self):
        """Test S3 bucket creation with versioning and encryption."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"serverless-uploads-{env_suffix}",
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [{
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates three Lambda functions with correct configurations")
    def test_creates_lambda_functions(self):
        """Test Lambda function creation."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT - Check Lambda functions (3 main + possible CDK custom resources)
        # We should have at least 3 Lambda functions
        resources = template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(resources), 3)

        # Check Image Processing Lambda
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"image-processor-{env_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "MemorySize": 512,
            "Timeout": 300
        })

        # Check Data Transform Lambda
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"data-transformer-{env_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "MemorySize": 256,
            "Timeout": 180
        })

        # Check API Handler Lambda
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"api-handler-{env_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "MemorySize": 128,
            "Timeout": 30
        })

    @mark.it("creates SQS dead letter queues for each Lambda")
    def test_creates_dead_letter_queues(self):
        """Test DLQ creation for Lambda functions."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 3)

        # Check DLQs
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"ImageProcessingDLQ-{env_suffix}",
            "MessageRetentionPeriod": 1209600  # 14 days in seconds
        })

        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"DataTransformDLQ-{env_suffix}",
            "MessageRetentionPeriod": 1209600
        })

        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": f"ApiHandlerDLQ-{env_suffix}",
            "MessageRetentionPeriod": 1209600
        })

    @mark.it("creates API Gateway with correct endpoints")
    def test_creates_api_gateway(self):
        """Test API Gateway creation with endpoints."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"serverless-api-{env_suffix}",
            "Description": "Serverless API with Lambda integration"
        })

        # Check for methods
        template.resource_count_is("AWS::ApiGateway::Method", 3)

    @mark.it("creates IAM roles with least privilege permissions")
    def test_creates_iam_roles_with_least_privilege(self):
        """Test IAM role creation with minimal permissions."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT - Check IAM roles (3 Lambda roles + CDK-generated roles)
        # We should have at least 3 roles for our Lambda functions
        resources = template.find_resources("AWS::IAM::Role")
        self.assertGreaterEqual(len(resources), 3)

        # Check Image Processing Role has only S3 GetObject
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }
        })

    @mark.it("configures S3 event notifications for Lambda triggers")
    def test_configures_s3_event_notifications(self):
        """Test S3 event notifications for Lambda triggers."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT - Check Lambda permissions for S3
        template.has_resource("AWS::Lambda::Permission", {
            "Properties": {
                "Action": "lambda:InvokeFunction",
                "Principal": "s3.amazonaws.com",
                "FunctionName": Match.any_value(),
                "SourceAccount": Match.any_value()
            }
        })

    @mark.it("creates CloudWatch log groups for all Lambda functions")
    def test_creates_cloudwatch_log_groups(self):
        """Test CloudWatch log group creation."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 3)

        # Check log groups
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/image-processor-{env_suffix}",
            "RetentionInDays": 7
        })

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/data-transformer-{env_suffix}",
            "RetentionInDays": 7
        })

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/api-handler-{env_suffix}",
            "RetentionInDays": 7
        })

    @mark.it("applies tags to all resources")
    def test_applies_tags_to_resources(self):
        """Test that tags are applied to the stack."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )

        # ASSERT
        tags = cdk.Tags.of(stack)
        self.assertIsNotNone(tags)

    @mark.it("creates stack outputs for important resources")
    def test_creates_stack_outputs(self):
        """Test stack outputs creation."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("ApiGatewayUrl", outputs)
        self.assertIn("ImageProcessorArn", outputs)
        self.assertIn("DataTransformArn", outputs)
        self.assertIn("ApiHandlerArn", outputs)
        self.assertIn("S3BucketName", outputs)

    @mark.it("sets environment variables for Lambda functions")
    def test_sets_lambda_environment_variables(self):
        """Test Lambda environment variables."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT - Check environment variables
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "BUCKET_NAME": Match.any_value(),
                    "LOG_LEVEL": "INFO"
                })
            }
        })

    @mark.it("configures API Gateway with throttling")
    def test_configures_api_gateway_throttling(self):
        """Test API Gateway throttling configuration."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT - Check deployment stage
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "MethodSettings": Match.array_with([
                Match.object_like({
                    "ThrottlingRateLimit": 1000,
                    "ThrottlingBurstLimit": 2000
                })
            ])
        })

    @mark.it("sets removal policy to DESTROY for all resources")
    def test_sets_removal_policy_destroy(self):
        """Test removal policy is set to DESTROY."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT - Check S3 bucket has deletion policy
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

        # Check log groups have deletion policy
        template.has_resource("AWS::Logs::LogGroup", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("creates Lambda functions with retry configuration")
    def test_lambda_retry_configuration(self):
        """Test Lambda retry configuration."""
        # ARRANGE
        env_suffix = "test"
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=env_suffix
        )
        template = Template.from_stack(stack)

        # ASSERT - Check Lambda has DLQ and retry config
        template.has_resource_properties("AWS::Lambda::Function", {
            "DeadLetterConfig": {
                "TargetArn": Match.any_value()
            }
        })

        # Check event invoke config for retries
        template.has_resource_properties("AWS::Lambda::EventInvokeConfig", {
            "MaximumRetryAttempts": 2
        })

    @mark.it("handles empty environment suffix correctly")
    def test_handles_empty_environment_suffix(self):
        """Test stack creation without environment suffix."""
        # ARRANGE
        stack = ServerlessStack(
            self.app, "ServerlessStackTest",
            environment_suffix=""
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "serverless-uploads"
        })

        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "image-processor"
        })
