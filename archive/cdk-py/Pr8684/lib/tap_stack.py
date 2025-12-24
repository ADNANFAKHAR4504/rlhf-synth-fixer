"""
tap_stack.py

This module defines the TapStack class, which serves as the main CDK stack for
the TAP project. It orchestrates the ServerlessStack for VPC, Lambda, DynamoDB,
API Gateway, and CloudWatch resources.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput
from constructs import Construct

from .metadata_stack import ServerlessStack


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
            deployment environment.
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack orchestrates the ServerlessStack which creates:
    - VPC with public subnets
    - Lambda function with DynamoDB integration
    - API Gateway REST API
    - CloudWatch alarm for monitoring
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        # Create the serverless stack as a nested stack
        self.serverless_stack = ServerlessStack(self, "ServerlessStack")

        # Expose outputs from the nested stack at the parent level
        CfnOutput(
            self,
            "VpcId",
            value=self.serverless_stack.vpc.vpc_id,
            description="VPC ID",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.serverless_stack.lambda_function.function_name,
            description="Lambda function name",
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.serverless_stack.lambda_function.function_arn,
            description="Lambda function ARN",
        )

        CfnOutput(
            self,
            "DynamoTableName",
            value=self.serverless_stack.table.table_name,
            description="DynamoDB table name",
        )

        CfnOutput(
            self,
            "ApiGatewayId",
            value=self.serverless_stack.api.rest_api_id,
            description="API Gateway ID",
        )

        CfnOutput(
            self,
            "ApiGatewayUrl",
            value=self.serverless_stack.api.url,
            description="API Gateway URL",
        )

        CfnOutput(
            self,
            "AlarmName",
            value=self.serverless_stack.alarm.alarm_name,
            description="CloudWatch Alarm name",
        )
