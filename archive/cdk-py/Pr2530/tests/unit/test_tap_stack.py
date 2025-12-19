import aws_cdk as core
import aws_cdk.assertions as assertions

from lib.tap_stack import TapStack


def test_s3_bucket_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test S3 bucket is created with correct properties
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        },
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [{
                "ServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }
    })


def test_lambda_function_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test Lambda function is created
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.9",
        "Handler": "upload_handler.lambda_handler",
        "Timeout": 3
    })


def test_api_gateway_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test API Gateway is created
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": "TAP File Upload API"
    })


def test_secrets_manager_created():
    app = core.App()
    stack = TapStack(app, "tap-test")
    template = assertions.Template.from_stack(stack)

    # Test Secrets Manager secret is created
    template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Description": "Configuration secrets for TAP upload service"
    })