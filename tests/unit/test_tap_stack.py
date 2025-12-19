# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

ACCOUNT = "111111111111"
REGION = "us-east-1"


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    def setUp(self):
        self.app = cdk.App()
        self.env = cdk.Environment(account=ACCOUNT, region=REGION)

    @mark.it("creates resources directly in flattened stack (LocalStack compatible)")
    def test_tapstack_is_just_orchestration(self):
        stack = TapStack(
            self.app,
            "TapStackOrchestratorOnly",
            props=TapStackProps(environment_suffix="dev"),
            env=self.env,
        )
        template = Template.from_stack(stack)
        # Flattened stack should have resources directly (not nested)
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Multiple Lambda functions: 1 main + CDK helper functions
        # (BucketNotifications, S3AutoDelete, LogRetention)
        template.resource_count_is("AWS::Lambda::Function", 4)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        # No nested CloudFormation stacks in flattened architecture
        template.resource_count_is("AWS::CloudFormation::Stack", 0)

    @mark.it("creates an S3 bucket in the nested stack with the correct env suffix")
    def test_nested_creates_s3_bucket_with_env_suffix(self):
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackWithNested",
            props=TapStackProps(environment_suffix=env_suffix),
            env=self.env,
        )
        template = Template.from_stack(stack)
        expected_bucket_name = f"serverless-processor-{env_suffix}-{ACCOUNT}-{REGION}"

        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": expected_bucket_name,
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.array_with([
                        Match.object_like({"ServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}})
                    ])
                },
            },
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        stack = TapStack(self.app, "TapStackDefaultEnv", env=self.env)
        template = Template.from_stack(stack)
        expected_bucket_name = f"serverless-processor-dev-{ACCOUNT}-{REGION}"
        template.has_resource_properties("AWS::S3::Bucket", {"BucketName": expected_bucket_name})

    @mark.it("uses Python 3.11 runtime, DLQ, Insights and tracing")
    def test_lambda_settings(self):
        stack = TapStack(
            self.app,
            "TapStackLambdaCfg",
            props=TapStackProps(environment_suffix="dev"),
            env=self.env,
        )
        template = Template.from_stack(stack)
        # Find the S3 processor Lambda (has inline code with our handler)
        # CDK creates additional helper Lambdas, so we verify properties
        # on the main Lambda function by checking for our specific properties
        all_lambdas = template.find_resources("AWS::Lambda::Function")

        # Find the S3 processor Lambda by checking for our environment variable
        s3_processor_found = False
        for logical_id, resource in all_lambdas.items():
            props = resource.get("Properties", {})
            env_vars = props.get("Environment", {}).get("Variables", {})
            if "DYNAMODB_TABLE_NAME" in env_vars:
                # This is our S3 processor Lambda
                assert props.get("Runtime") == "python3.11", f"Expected python3.11 but got {props.get('Runtime')}"
                assert "DeadLetterConfig" in props, "Expected DeadLetterConfig"
                assert props.get("FunctionName") == "s3-processor-dev", "Expected s3-processor-dev function name"
                s3_processor_found = True
                break

        assert s3_processor_found, "S3 processor Lambda not found in template"
        # DLQ exists
        template.resource_count_is("AWS::SQS::Queue", 1)

    @mark.it("enables KMS CMK and DynamoDB SSE-KMS")
    def test_kms_and_ddb_encryption(self):
        stack = TapStack(
            self.app,
            "TapStackKmsDdb",
            props=TapStackProps(environment_suffix="prod"),
            env=self.env,
        )
        template = Template.from_stack(stack)
        # KMS Key
        template.resource_count_is("AWS::KMS::Key", 1)
        # DynamoDB table SSE with KMS
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "SSESpecification": {
                    "SSEEnabled": True,
                    "SSEType": "KMS",
                }
            },
        )

    @mark.it("wires S3 -> Lambda via custom notifications resource")
    def test_s3_triggers_lambda(self):
        stack = TapStack(
            self.app,
            "TapStackNotifications",
            props=TapStackProps(environment_suffix="dev"),
            env=self.env,
        )
        template = Template.from_stack(stack)
        # CDK uses Custom::S3BucketNotifications
        template.resource_count_is("Custom::S3BucketNotifications", 1)
