import aws_cdk as core
import aws_cdk.assertions as assertions

from lib.tap_stack import TapStack


def test_dynamodb_table_created():
    """Test that DynamoDB table is created"""
    app = core.App()
    stack = TapStack(
        app, 
        "tap-serverless-test",
        project_name="test-project",
        environment_suffix="test"
    )
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties("AWS::DynamoDB::Table", {
        "BillingMode": "PAY_PER_REQUEST"
    })


def test_lambda_functions_created():
    """Test that Lambda functions are created"""
    app = core.App()
    stack = TapStack(
        app, 
        "tap-serverless-test",
        project_name="test-project",
        environment_suffix="test"
    )
    template = assertions.Template.from_stack(stack)

    # Should have 4 Lambda functions (3 main functions + 1 log retention function)
    template.resource_count_is("AWS::Lambda::Function", 4)


def test_api_gateway_created():
    """Test that API Gateway is created"""
    app = core.App()
    stack = TapStack(
        app, 
        "tap-serverless-test",
        project_name="test-project",
        environment_suffix="test"
    )
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": "test-project-test-api"
    })


def test_s3_buckets_created():
    """Test that S3 buckets are created"""
    app = core.App()
    stack = TapStack(
        app, 
        "tap-serverless-test",
        project_name="test-project",
        environment_suffix="test"
    )
    template = assertions.Template.from_stack(stack)

    # Should have 2 S3 buckets (data and logs)
    template.resource_count_is("AWS::S3::Bucket", 2)