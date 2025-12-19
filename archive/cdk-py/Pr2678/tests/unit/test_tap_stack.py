import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.lambda_func_stack import LambdaFuncStack, LambdaFuncStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.test_region = "us-east-1"
        self.test_account = "123456789012"

    @mark.it("creates a VPC with correct configuration")
    def test_creates_vpc_with_correct_configuration(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, 
            "TapStackTest",
            props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table_with_correct_config(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, 
            "TapStackTest",
            props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"serverless-data-processing-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [
                {"AttributeName": "pk", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"}
            ]
        })

    @mark.it("creates S3 bucket with lifecycle rules")
    def test_creates_s3_bucket_with_lifecycle_rules(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, 
            "TapStackTest",
            props=TapStackProps(
                environment_suffix=env_suffix,
                env=cdk.Environment(account=self.test_account, region=self.test_region)
            )
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Check bucket properties without the dynamically generated name
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Id": "LogRetentionRule",
                        "Status": "Enabled"
                    })
                ])
            }
        })

    @mark.it("creates VPC endpoints for S3 and DynamoDB")
    def test_creates_vpc_endpoints(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, 
            "TapStackTest",
            props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for VPC endpoints
        vpc_endpoints = template.find_resources("AWS::EC2::VPCEndpoint")
        self.assertEqual(len(vpc_endpoints), 2, "Should create 2 VPC endpoints (S3 and DynamoDB)")

    @mark.it("creates SSM parameters for configuration")
    def test_creates_ssm_parameters(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, 
            "TapStackTest",
            props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": f"/serverless/config/api-settings-{env_suffix}",
            "Type": "String",
            "Tier": "Standard"
        })

    @mark.it("exports required outputs for cross-stack references")
    def test_exports_required_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, 
            "TapStackTest",
            props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template_outputs = template.to_json()["Outputs"]
        actual_exports = []
        for output in template_outputs.values():
            if "Export" in output and "Name" in output["Export"]:
                actual_exports.append(output["Export"]["Name"])
        
        expected_exports = [
            f"VPCId-{env_suffix}",
            f"DynamoDBTableName-{env_suffix}",
            f"S3BucketName-{env_suffix}"
        ]
        
        for expected_export in expected_exports:
            self.assertIn(expected_export, actual_exports, 
                         f"Export {expected_export} not found in stack outputs")

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "serverless-data-processing-dev"
        })


@mark.describe("LambdaFuncStack")
class TestLambdaFuncStack(unittest.TestCase):
    """Test cases for the LambdaFuncStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.test_region = "us-east-1"
        self.test_account = "123456789012"
        self.env_suffix = "test"
        
        # Create the base TapStack first
        self.tap_stack = TapStack(
            self.app, 
            f"TapStack{self.env_suffix}",
            props=TapStackProps(
                environment_suffix=self.env_suffix,
                env=cdk.Environment(account=self.test_account, region=self.test_region)
            )
        )

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function_with_correct_config(self):
        # ARRANGE
        stack = LambdaFuncStack(
            self.app, 
            "LambdaFuncStackTest",
            props=LambdaFuncStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"serverless-data-processor-{self.env_suffix}",
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
            "MemorySize": 512,
            "Timeout": 30
        })

    @mark.it("creates Lambda execution role with correct policies")
    def test_creates_lambda_execution_role(self):
        # ARRANGE
        stack = LambdaFuncStack(
            self.app, 
            "LambdaFuncStackTest",
            props=LambdaFuncStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 1)
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
                ]
            }
        })

    @mark.it("attaches DynamoDB permissions to Lambda role")
    def test_attaches_dynamodb_permissions(self):
        # ARRANGE
        stack = LambdaFuncStack(
            self.app, 
            "LambdaFuncStackTest",
            props=LambdaFuncStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Effect": "Allow"
                    })
                ])
            }
        })

    @mark.it("configures Lambda with environment variables")
    def test_lambda_environment_variables(self):
        # ARRANGE
        stack = LambdaFuncStack(
            self.app, 
            "LambdaFuncStackTest",
            props=LambdaFuncStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "CONFIG_PARAMETER_NAME": f"/serverless/config/api-settings-{self.env_suffix}",
                    "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1"
                })
            }
        })

    @mark.it("exports Lambda function name and ARN")
    def test_exports_lambda_outputs(self):
        # ARRANGE
        stack = LambdaFuncStack(
            self.app, 
            "LambdaFuncStackTest",
            props=LambdaFuncStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template_outputs = template.to_json()["Outputs"]
        
        expected_exports = [
            f"LambdaFunctionName-{self.env_suffix}",
            f"LambdaFunctionArn-{self.env_suffix}"
        ]
        
        actual_exports = []
        for output in template_outputs.values():
            if "Export" in output and "Name" in output["Export"]:
                actual_exports.append(output["Export"]["Name"])
        
        for expected_export in expected_exports:
            self.assertIn(expected_export, actual_exports, 
                         f"Export {expected_export} not found in stack outputs")

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_lambda_defaults_env_suffix_to_dev(self):
        # ARRANGE
        # Create a tap stack with default env
        tap_stack = TapStack(self.app, "TapStackDefault")
        
        stack = LambdaFuncStack(self.app, "LambdaFuncStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "serverless-data-processor-dev"
        })