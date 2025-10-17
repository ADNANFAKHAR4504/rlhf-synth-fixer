import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a DynamoDB table with the correct configuration")
    def test_dynamodb_table_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tap-api-data-testenv",
            "BillingMode": "PAY_PER_REQUEST",
            "SSESpecification": {"SSEEnabled": True},
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"},
                {"AttributeName": "createdAt", "KeyType": "RANGE"}
            ],
            "AttributeDefinitions": [
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "createdAt", "AttributeType": "S"}
            ]
        })

    @mark.it("creates a Lambda function with the correct configuration")
    def test_lambda_function_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tap-api-handler-testenv",
            "Runtime": "python3.11",
            "Handler": "index.lambda_handler",
            "Timeout": 30,
            "MemorySize": 256,
        })

    @mark.it("creates an API Gateway HTTP API with CORS configuration")
    def test_http_api_with_cors(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
        template.has_resource_properties("AWS::ApiGatewayV2::Api", {
            "Name": "tap-api-testenv",
            "ProtocolType": "HTTP",
            "CorsConfiguration": {
                "AllowOrigins": ["*"],
                "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "AllowHeaders": ["Content-Type", "Authorization", "X-Api-Key"],
                "MaxAge": 3600
            }
        })

    @mark.it("creates CloudWatch log groups for API Gateway and Lambda")
    def test_cloudwatch_log_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 2)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/tap-api-testenv",
            "RetentionInDays": 5
        })
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/lambda/tap-api-handler-testenv",
            "RetentionInDays": 5
        })

    @mark.it("creates IAM role for Lambda with least privilege")
    def test_lambda_iam_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"}
                    }
                ],
                "Version": "2012-10-17"
            },
            "ManagedPolicyArns": [
                {"Fn::Join": ["", ["arn:", {"Ref": "AWS::Partition"}, 
                                   ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]]}
            ]
        })

    @mark.it("creates API Gateway routes for Lambda integration")
    def test_api_gateway_routes(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="testenv"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGatewayV2::Route", 5)
        template.has_resource_properties("AWS::ApiGatewayV2::Route", {
            "RouteKey": "GET /items"
        })
        template.has_resource_properties("AWS::ApiGatewayV2::Route", {
            "RouteKey": "POST /items"
        })
        template.has_resource_properties("AWS::ApiGatewayV2::Route", {
            "RouteKey": "GET /items/{id}"
        })
        template.has_resource_properties("AWS::ApiGatewayV2::Route", {
            "RouteKey": "PUT /items/{id}"
        })
        template.has_resource_properties("AWS::ApiGatewayV2::Route", {
            "RouteKey": "DELETE /items/{id}"
        })


if __name__ == "__main__":
    unittest.main()
