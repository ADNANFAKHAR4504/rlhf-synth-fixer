"""
Main entry point for the Pulumi TAP Stack.
"""
import os
import pulumi
import pulumi_aws as aws
from lib.tap_stack import TapStack, TapStackArgs

# Configure AWS provider for LocalStack if needed
aws_endpoint = os.getenv("AWS_ENDPOINT_URL", "")
if aws_endpoint and ("localhost" in aws_endpoint or "4566" in aws_endpoint):
    # Configure Pulumi AWS provider to use LocalStack
    aws.Provider(
        "aws-localstack",
        region=os.getenv("AWS_REGION", "us-west-2"),
        skip_credentials_validation=True,
        skip_metadata_api_check=True,
        skip_requesting_account_id=True,
        s3_use_path_style=True,
        endpoints=[
            aws.ProviderEndpointArgs(
                ec2=aws_endpoint,
                iam=aws_endpoint,
                kms=aws_endpoint,
                s3=aws_endpoint,
                sts=aws_endpoint,
            )
        ]
    )

# Create stack args
args = TapStackArgs(
    environment_suffix=pulumi.get_stack(),
    tags={
        "Project": "TAP",
        "ManagedBy": "Pulumi",
        "Environment": pulumi.get_stack()
    }
)

# Create the stack
stack = TapStack("tap-stack", args)

# Export stack outputs
pulumi.export("stack_name", "tap-stack")
pulumi.export("environment", pulumi.get_stack())
