import boto3
import pytest
import aws_cdk as core
from lib.tap_stack import TapStack


@pytest.fixture
def stack():
    app = core.App()
    return TapStack(app, "tap-integration-test")


def test_stack_synthesis(stack):
    # Test that the stack can be synthesized without errors
    app = stack.node.root
    cloud_assembly = app.synth()
    assert cloud_assembly is not None


def test_stack_resources_count(stack):
    template = core.assertions.Template.from_stack(stack)
    
    # Verify expected number of resources
    resources = template.to_json()["Resources"]
    
    # Should have at least: S3 bucket, Lambda function, API Gateway, IAM roles, etc.
    assert len(resources) >= 10


def test_iam_roles_have_policies(stack):
    template = core.assertions.Template.from_stack(stack)
    
    # Test that IAM roles have appropriate policies
    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }
    })