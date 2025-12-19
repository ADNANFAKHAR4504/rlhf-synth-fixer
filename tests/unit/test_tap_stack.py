"""
Unit tests for TapStack infrastructure components.
"""
import os
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps


def test_tap_stack_creates_expected_resources():
    """Test that TapStack creates all expected infrastructure resources."""
    app = cdk.App()

    # Set up environment
    os.environ['CDK_DEFAULT_ACCOUNT'] = '123456789012'
    os.environ['CDK_DEFAULT_REGION'] = 'us-east-1'

    # Create the parent stack
    parent_stack = TapStack(app, "TestStack", environment_suffix="test")

    # Create a standalone nested stack for testing
    nested_stack = TapStackProps(
        app, "TestNestedStack", environment_suffix="test"
    )

    # Get template from nested stack (where resources are defined)
    template = Template.from_stack(nested_stack)

    # Verify S3 bucket is created
    template.resource_count_is("AWS::S3::Bucket", 1)

    # Verify IAM role is created
    template.resource_count_is("AWS::IAM::Role", 1)

    # Verify VPC is created
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Verify security group is created
    template.resource_count_is("AWS::EC2::SecurityGroup", 1)

    # Verify Auto Scaling Group is created
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)

    # Verify Application Load Balancer is created
    template.resource_count_is(
        "AWS::ElasticLoadBalancingV2::LoadBalancer", 1
    )

    # Verify parent stack has outputs
    parent_template = Template.from_stack(parent_stack)
    parent_template.has_output(
        "LogBucketName", {"Description": "Name of the S3 bucket for application logs."}
    )


def test_s3_bucket_has_encryption():
    """Test that S3 bucket has encryption enabled."""
    app = cdk.App()

    os.environ['CDK_DEFAULT_ACCOUNT'] = '123456789012'
    os.environ['CDK_DEFAULT_REGION'] = 'us-east-1'

    # Create nested stack for testing
    nested_stack = TapStackProps(
        app, "TestNestedStack", environment_suffix="test"
    )
    template = Template.from_stack(nested_stack)

    # Verify S3 bucket encryption
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }
        }
    )


def test_s3_bucket_has_versioning():
    """Test that S3 bucket has versioning enabled."""
    app = cdk.App()

    os.environ['CDK_DEFAULT_ACCOUNT'] = '123456789012'
    os.environ['CDK_DEFAULT_REGION'] = 'us-east-1'

    # Create nested stack for testing
    nested_stack = TapStackProps(
        app, "TestNestedStack", environment_suffix="test"
    )
    template = Template.from_stack(nested_stack)

    # Verify S3 bucket versioning
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        }
    )
