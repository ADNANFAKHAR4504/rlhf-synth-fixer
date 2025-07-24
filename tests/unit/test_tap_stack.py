import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.multi_region_stack import MultiRegionStack


@mark.describe("MultiRegionStack")
class TestMultiRegionStack(unittest.TestCase):
    """Unit tests for the MultiRegionStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.stack = MultiRegionStack(self.app, "TestMultiRegionStack", region="us-east-1")
        self.template = Template.from_stack(self.stack)

    @mark.it("creates a Lambda function with the correct handler and runtime")
    def test_lambda_function_created(self):
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "Handler": "index.handler",
            "Runtime": "python3.9"
        })

    @mark.it("creates an IAM role for Lambda execution")
    def test_lambda_execution_role_created(self):
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            })
        })

    @mark.it("creates an API Gateway REST API with the correct name")
    def test_api_gateway_created(self):
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "MultiRegionService"
        })

    @mark.it("adds a GET method to the API Gateway resource")
    def test_api_gateway_method_exists(self):
        self.template.resource_count_is("AWS::ApiGateway::Method", 1)

    @mark.it("outputs the API Gateway endpoint")
    def test_api_endpoint_output_exists(self):
        self.template.has_output("ApiEndpoint", {
            "Value": {
                "Ref": Match.any_value()
            }
        })
