"""
Pulumi program entry point for the TAP (Test Automation Platform) project.

This module initializes the TapStack component with environment-specific configurations.
"""

import os
import pulumi
import pulumi_aws as aws
from lib.tap_stack import TapStack, TapStackArgs

# LocalStack detection
IS_LOCALSTACK = "localhost" in os.environ.get("AWS_ENDPOINT_URL", "") or \
                "4566" in os.environ.get("AWS_ENDPOINT_URL", "")

# Configure AWS provider for LocalStack if needed
if IS_LOCALSTACK:
    localstack_endpoint = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
    aws_provider = aws.Provider(
        "localstack-provider",
        region="us-east-1",
        skip_credentials_validation=True,
        skip_metadata_api_check=True,
        skip_requesting_account_id=True,
        s3_use_path_style=True,
        endpoints=[
            aws.ProviderEndpointArgs(
                s3=localstack_endpoint,
                dynamodb=localstack_endpoint,
                lambda_=localstack_endpoint,
                iam=localstack_endpoint,
                sts=localstack_endpoint,
                secretsmanager=localstack_endpoint,
                apigateway=localstack_endpoint,
                cloudwatch=localstack_endpoint,
                sns=localstack_endpoint,
                logs=localstack_endpoint,
            )
        ],
    )
else:
    aws_provider = None

# Get configuration values
config = pulumi.Config()
environment_suffix = config.get('environment_suffix') or pulumi.get_stack()
region = config.get('region') or 'us-east-1'

# Create the main stack with configuration
stack_args = TapStackArgs(
    region=region,
    environment_suffix=environment_suffix,
    tags={
        "Environment": environment_suffix,
        "ManagedBy": "Pulumi",
        "Project": pulumi.get_project()
    }
)

# Instantiate the TapStack component with LocalStack provider if configured
if aws_provider:
    tap_stack = TapStack("tap-stack", stack_args, opts=pulumi.ResourceOptions(provider=aws_provider))
else:
    tap_stack = TapStack("tap-stack", stack_args)
