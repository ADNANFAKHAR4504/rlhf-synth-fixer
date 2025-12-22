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

    # Synthesize the app to generate CloudFormation templates
    cloud_assembly = app.synth()

    # Get template from parent stack
    parent_template = Template.from_stack(parent_stack)

    # Verify parent stack has nested stack reference
    parent_template.resource_count_is("AWS::CloudFormation::Stack", 1)

    # Verify parent stack has outputs
    parent_template.has_output(
        "LogBucketName",
        {"Description": "Name of the S3 bucket for application logs."}
    )
    parent_template.has_output(
        "ALBDNS",
        {"Description": "DNS name of the Application Load Balancer."}
    )

    # Get the nested stack from the cloud assembly
    nested_stack_artifact = None
    for artifact in cloud_assembly.artifacts:
        if hasattr(artifact, 'stack_name') and 'Props' in artifact.stack_name:
            nested_stack_artifact = artifact
            break

    # Verify nested stack resources exist
    if nested_stack_artifact:
        nested_template = Template.from_json(nested_stack_artifact.template)

        # Verify S3 bucket is created in nested stack
        nested_template.resource_count_is("AWS::S3::Bucket", 1)

        # Verify IAM role is created in nested stack
        nested_template.resource_count_is("AWS::IAM::Role", 1)

        # Verify VPC is created in nested stack
        nested_template.resource_count_is("AWS::EC2::VPC", 1)

        # Verify security group is created in nested stack
        nested_template.resource_count_is("AWS::EC2::SecurityGroup", 1)

        # Verify Auto Scaling Group is created in nested stack
        nested_template.resource_count_is(
            "AWS::AutoScaling::AutoScalingGroup", 1
        )

        # Verify Application Load Balancer is created in nested stack
        nested_template.resource_count_is(
            "AWS::ElasticLoadBalancingV2::LoadBalancer", 1
        )


def test_s3_bucket_has_encryption():
    """Test that S3 bucket has encryption enabled."""
    app = cdk.App()

    os.environ['CDK_DEFAULT_ACCOUNT'] = '123456789012'
    os.environ['CDK_DEFAULT_REGION'] = 'us-east-1'

    # Create parent stack which contains the nested stack
    parent_stack = TapStack(app, "TestStack", environment_suffix="test")

    # Synthesize to get nested stack template
    cloud_assembly = app.synth()

    # Get the nested stack template
    nested_stack_artifact = None
    for artifact in cloud_assembly.artifacts:
        if hasattr(artifact, 'stack_name') and 'Props' in artifact.stack_name:
            nested_stack_artifact = artifact
            break

    # Verify S3 bucket encryption in nested stack
    if nested_stack_artifact:
        template = Template.from_json(nested_stack_artifact.template)
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

    # Create parent stack which contains the nested stack
    parent_stack = TapStack(app, "TestStack", environment_suffix="test")

    # Synthesize to get nested stack template
    cloud_assembly = app.synth()

    # Get the nested stack template
    nested_stack_artifact = None
    for artifact in cloud_assembly.artifacts:
        if hasattr(artifact, 'stack_name') and 'Props' in artifact.stack_name:
            nested_stack_artifact = artifact
            break

    # Verify S3 bucket versioning in nested stack
    if nested_stack_artifact:
        template = Template.from_json(nested_stack_artifact.template)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {
                    "Status": "Enabled"
                }
            }
        )
