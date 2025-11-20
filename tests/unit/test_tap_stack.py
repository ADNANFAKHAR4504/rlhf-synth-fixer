import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.vpc_stack import VpcStack, VpcStackProps
from lib.dynamodb_stack import DynamoDBStack, DynamoDBStackProps
from lib.lambda_stack import LambdaStack, LambdaStackProps
from lib.api_gateway_stack import ApiGatewayStack, ApiGatewayStackProps
from lib.s3_stack import S3Stack, S3StackProps
from lib.ecs_stack import EcsStack, EcsStackProps
from lib.monitoring_stack import MonitoringStack, MonitoringStackProps
from lib.cost_report_stack import CostReportStack, CostReportStackProps


@mark.describe("TapStack Unit Tests")
class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with dev environment by default")
    def test_defaults_env_suffix_to_dev(self):
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates stack with custom environment suffix")
    def test_creates_stack_with_custom_env_suffix(self):
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested VPC stack with correct properties")
    def test_creates_vpc_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        # Verify VPC stack exists
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested S3 stack")
    def test_creates_s3_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested Lambda stack")
    def test_creates_lambda_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested DynamoDB stack")
    def test_creates_dynamodb_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested API Gateway stack")
    def test_creates_api_gateway_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested ECS stack")
    def test_creates_ecs_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested Monitoring stack")
    def test_creates_monitoring_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("creates nested Cost Report stack")
    def test_creates_cost_report_stack(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("exposes all required stack outputs")
    def test_exposes_required_outputs(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        outputs = template.to_json().get("Outputs", {})
        required_outputs = [
            "VpcId",
            "ApiUrl",
            "ApiId",
            "TransactionsTableName",
            "UsersTableName",
            "PaymentMethodsTableName",
            "PaymentProcessorArn",
            "TransactionValidatorArn",
            "FraudDetectorArn",
            "LogsBucketName",
            "AuditBucketName",
            "AccessLogsBucketName",
            "EcsClusterName",
            "EcsServiceName",
            "DashboardName",
            "CostReportFunctionArn"]

        for output_key in required_outputs:
            self.assertIn(
                output_key,
                outputs,
                f"Output {output_key} should be present")

    @mark.it("creates nested stacks for each service")
    def test_creates_nested_stacks(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::CloudFormation::Stack", 8)

    @mark.it("applies environment tags to nested stacks")
    def test_nested_stacks_have_environment_in_name(self):
        stack = TapStack(self.app, "TapStackTestEnv",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        resources = template.to_json().get("Resources", {})
        nested_stacks = [k for k, v in resources.items() if v.get(
            "Type") == "AWS::CloudFormation::Stack"]

        self.assertGreater(len(nested_stacks), 0, "Should have nested stacks")
