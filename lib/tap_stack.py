"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct
from .serverless_stack import ServerlessStack


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
      environment_suffix (Optional[str]): An optional suffix to identify the
      deployment environment (e.g., 'dev', 'prod').
      **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
      environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
      CDK context, or defaults to 'dev'.
    Note:
      - Do NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create the serverless infrastructure as a nested stack
        class NestedServerlessStack(NestedStack):
            def __init__(
                    self,
                    scope,
                    stack_id,
                    environment_suffix="",
                    **kwargs):
                super().__init__(scope, stack_id, **kwargs)
                # Create the serverless stack
                self.serverless_stack = ServerlessStack(
                    self,
                    "ServerlessResources",
                    environment_suffix=environment_suffix
                )

                # Expose important resources
                self.api_url = self.serverless_stack.api.url
                self.bucket_name = self.serverless_stack.bucket.bucket_name

        # Create the nested serverless stack
        self.serverless_nested_stack = NestedServerlessStack(
            self,
            f"ServerlessStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create stack-level outputs for important resources
        cdk.CfnOutput(
            self, "ApiGatewayUrl",
            value=self.serverless_nested_stack.api_url,
            description="API Gateway URL for the serverless application"
        )

        cdk.CfnOutput(
            self, "S3BucketName",
            value=self.serverless_nested_stack.bucket_name,
            description="S3 Bucket Name for file uploads"
        )
