"""
Unit tests for LambdaStack.
Tests Lambda functions, IAM roles, and VPC configuration.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from aws_cdk import aws_ec2 as ec2
from pytest import mark

from lib.lambda_stack import LambdaStack


@mark.describe("LambdaStack")
class TestLambdaStack(unittest.TestCase):
    """Test cases for the LambdaStack"""

    def setUp(self):
        """Set up a fresh CDK app and VPC for each test"""
        self.app = cdk.App()
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(self.vpc_stack, "TestVPC")

    @mark.it("creates Lambda execution role")
    def test_lambda_role(self):
        """Test that Lambda execution role is created."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify IAM role exists
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumedBy": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        )

    @mark.it("creates payment validation Lambda function")
    def test_payment_validation_function(self):
        """Test that payment validation function is created."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify at least one Lambda function exists
        template.resource_count_is("AWS::Lambda::Function", 3)

    @mark.it("configures Lambda with Python 3.11 runtime")
    def test_lambda_runtime(self):
        """Test that Lambda functions use Python 3.11."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify runtime
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.11"
            }
        )

    @mark.it("configures Lambda with environment variables")
    def test_lambda_environment(self):
        """Test that Lambda functions have environment variables."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify environment variables
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Environment": {
                    "Variables": Match.object_like({
                        "ENVIRONMENT_SUFFIX": "test",
                        "DR_ROLE": "primary"
                    })
                }
            }
        )

    @mark.it("places Lambda in private subnets")
    def test_lambda_vpc_config(self):
        """Test that Lambda functions are in VPC private subnets."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify VPC configuration exists
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "VpcConfig": Match.object_like({
                    "SubnetIds": Match.any_value()
                })
            }
        )

    @mark.it("configures Lambda timeout")
    def test_lambda_timeout(self):
        """Test that Lambda functions have proper timeout."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify timeout is 30 seconds
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Timeout": 30
            }
        )

    @mark.it("configures Lambda memory size")
    def test_lambda_memory(self):
        """Test that Lambda functions have proper memory allocation."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify memory is 256 MB
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "MemorySize": 256
            }
        )

    @mark.it("grants DynamoDB permissions to Lambda")
    def test_dynamodb_permissions(self):
        """Test that Lambda has DynamoDB permissions."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify IAM policy includes DynamoDB actions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Action": Match.array_with([
                                "dynamodb:PutItem",
                                "dynamodb:GetItem"
                            ])
                        })
                    ])
                }
            }
        )

    @mark.it("grants SNS permissions to Lambda")
    def test_sns_permissions(self):
        """Test that Lambda has SNS permissions."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify IAM policy includes SNS publish
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Action": "sns:Publish"
                        })
                    ])
                }
            }
        )

    @mark.it("tags Lambda functions with DR role")
    def test_lambda_tags(self):
        """Test that Lambda functions are tagged."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify DR-Role tag exists
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Tags": Match.array_with([
                    {"Key": "DR-Role", "Value": "primary"}
                ])
            }
        )

    @mark.it("exports Lambda function ARNs")
    def test_lambda_outputs(self):
        """Test that Lambda ARNs are exported."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)

        # Verify outputs exist
        outputs = template.to_json().get('Outputs', {})
        lambda_outputs = [k for k in outputs.keys() if 'Lambda' in k or 'Function' in k]
        assert len(lambda_outputs) >= 3
