"""ssm_stack.py
This module defines SSM Parameter Store parameters for configuration.
"""

from typing import Optional
from constructs import Construct
from aws_cdk import aws_ssm as ssm, CfnOutput


class SSMStackProps:
    """Properties for SSMStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        table_arn: str = None,
        function_arn: str = None,
        api_id: str = None,
    ):
        self.environment_suffix = environment_suffix
        self.table_arn = table_arn
        self.function_arn = function_arn
        self.api_id = api_id


class SSMStack(Construct):
    """Stack for SSM Parameter Store configuration."""

    def __init__(
        self, scope: Construct, construct_id: str, props: SSMStackProps = None
    ):
        super().__init__(scope, construct_id)

        suffix = props.environment_suffix if props else "dev"

        # Store API throttle limits
        api_throttle_param = ssm.StringParameter(
            self,
            f"ApiThrottleLimit{suffix}",
            parameter_name=f"/productreviews/{suffix}/api/throttle-limit",
            string_value="10",
            description="API throttle limit (requests per second)",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Store DynamoDB table ARN
        if props and props.table_arn:
            table_arn_param = ssm.StringParameter(
                self,
                f"TableArnParam{suffix}",
                parameter_name=f"/productreviews/{suffix}/dynamodb/table-arn",
                string_value=props.table_arn,
                description="DynamoDB table ARN",
                tier=ssm.ParameterTier.STANDARD,
            )

        # Store Lambda function ARN
        if props and props.function_arn:
            function_arn_param = ssm.StringParameter(
                self,
                f"FunctionArnParam{suffix}",
                parameter_name=f"/productreviews/{suffix}/lambda/function-arn",
                string_value=props.function_arn,
                description="Lambda function ARN",
                tier=ssm.ParameterTier.STANDARD,
            )

        # Store API Gateway ID
        if props and props.api_id:
            api_id_param = ssm.StringParameter(
                self,
                f"ApiIdParam{suffix}",
                parameter_name=f"/productreviews/{suffix}/api/gateway-id",
                string_value=props.api_id,
                description="API Gateway ID",
                tier=ssm.ParameterTier.STANDARD,
            )

        CfnOutput(
            self,
            "ParameterPrefix",
            value=f"/productreviews/{suffix}/",
            description="SSM Parameter prefix for this environment",
        )
