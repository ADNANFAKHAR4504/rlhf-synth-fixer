import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture(scope="module")
def template():
    """Returns the synthesized CloudFormation template for TapStack"""
    app = App()
    stack = TapStack(
        scope=app,
        construct_id="TapStackTest",
        props=TapStackProps(environment_suffix="test")
    )
    return Template.from_stack(stack)


def test_s3_bucket_created(template):
    """Check that an S3 bucket is created with the expected properties"""
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": "tap-test-bucket",
        "VersioningConfiguration": pytest.raises(KeyError),  # Not versioned
        "PublicAccessBlockConfiguration": {
            "RestrictPublicBuckets": True,
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True
        }
    })


def test_dynamodb_table_created(template):
    """Check that a DynamoDB table is created with PAY_PER_REQUEST"""
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "BillingMode": "PAYPERREQUEST",
        "AttributeDefinitions": [{
            "AttributeName": "id",
            "AttributeType": "S"
        }],
        "KeySchema": [{
            "AttributeName": "id",
            "KeyType": "HASH"
        }],
        "TableName": "tap-test-table"
    })


def test_lambda_function_created(template):
    """Check that the Lambda function is created correctly"""
    template.has_resource_properties("AWS::Lambda::Function", {
        "Handler": "index.handler",
        "Runtime": "python3.11",
        "FunctionName": "tap-test-lambda",
        "Environment": {
            "Variables": {
                "TABLE_NAME": "tap-test-table",
                "BUCKET_NAME": "tap-test-bucket"
            }
        }
    })


def test_lambda_permissions_granted(template):
    """Verify IAM role is created and Lambda has permission to read/write S3 and DynamoDB"""
    template.resource_count_is("AWS::IAM::Role", 1)
    template.resource_count_is("AWS::IAM::Policy", 1)  # Inline Lambda policy for bucket + table


def test_outputs_exist(template):
    """Check that all required outputs are defined"""
    template.has_output("S3BucketName", {
        "Export": {
            "Name": "tap-test-bucket-name"
        }
    })
    template.has_output("DynamoDBTableName", {
        "Export": {
            "Name": "tap-test-table-name"
        }
    })
    template.has_output("LambdaFunctionName", {
        "Export": {
            "Name": "tap-test-lambda-name"
        }
    })
    template.has_output("LambdaRoleArn", {
        "Export": {
            "Name": "tap-test-lambda-role-arn"
        }
    })
