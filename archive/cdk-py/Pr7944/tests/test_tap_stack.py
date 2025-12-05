"""Unit tests for TapStack CDK stack."""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest
from lib.tap_stack import TapStack


def test_stack_creates_s3_bucket():
    """Test that stack creates S3 bucket with correct configuration."""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    template = Template.from_stack(stack)

    # Check S3 bucket exists
    template.resource_count_is("AWS::S3::Bucket", 1)

    # Check encryption
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [
                {
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }
    })

    # Check public access block
    template.has_resource_properties("AWS::S3::Bucket", {
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        }
    })


def test_stack_creates_lambda_function():
    """Test that stack creates Lambda function with correct configuration."""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    template = Template.from_stack(stack)

    # Check Lambda function exists with correct configuration
    # Note: CDK may create additional Lambda functions (e.g., custom resources for S3 auto-delete)
    # So we use Match.object_like() instead of exact count
    template.has_resource_properties("AWS::Lambda::Function", Match.object_like({
        "Runtime": "python3.11",
        "Timeout": 900,  # 15 minutes
        "MemorySize": 512,
        "Handler": "index.handler"
    }))


def test_lambda_has_required_permissions():
    """Test that Lambda role has required permissions."""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    template = Template.from_stack(stack)

    # Check Lambda IAM role exists
    # Note: CDK may create additional IAM roles (e.g., for custom resources)
    # So we check for the Lambda service principal instead of exact count
    template.has_resource_properties("AWS::IAM::Role", Match.object_like({
        "AssumeRolePolicyDocument": Match.object_like({
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": Match.object_like({
                        "Service": Match.string_like_regexp("lambda.amazonaws.com")
                    })
                })
            ])
        })
    }))

    # Check inline policy has required permissions
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": {
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": Match.array_with([
                        "cloudformation:DescribeStacks",
                        "cloudformation:ListStacks",
                        "s3:GetBucketEncryption",
                        "rds:DescribeDBInstances",
                        "ec2:DescribeSecurityGroups",
                        "iam:GetPolicy",
                        "sts:AssumeRole"
                    ]),
                    "Effect": "Allow"
                })
            ])
        }
    })


def test_resources_have_removal_policy_destroy():
    """Test that resources can be destroyed."""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    template = Template.from_stack(stack)

    # S3 bucket should have deletion policy
    template.has_resource("AWS::S3::Bucket", {
        "DeletionPolicy": "Delete",
        "UpdateReplacePolicy": "Delete"
    })

    # Log group should have deletion policy
    template.has_resource("AWS::Logs::LogGroup", {
        "DeletionPolicy": "Delete",
        "UpdateReplacePolicy": "Delete"
    })


def test_environment_suffix_parameter():
    """Test that environmentSuffix parameter exists."""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    template = Template.from_stack(stack)

    # Check parameter exists
    template.has_parameter("environmentSuffix", {
        "Type": "String",
        "Default": "dev"
    })


def test_cloudwatch_logs_configured():
    """Test that CloudWatch Logs are configured."""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    template = Template.from_stack(stack)

    # Check log group exists
    template.resource_count_is("AWS::Logs::LogGroup", 1)

    # Check retention
    template.has_resource_properties("AWS::Logs::LogGroup", {
        "RetentionInDays": 7
    })
