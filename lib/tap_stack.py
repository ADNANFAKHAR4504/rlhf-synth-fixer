from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput
from constructs import Construct

from .metadata_stack import ServerlessStack


class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        self.serverless_stack = ServerlessStack(self, "ServerlessStack")

        # Expose outputs from nested ServerlessStack in parent TapStack
        CfnOutput(
            self, "VpcId", value=self.serverless_stack.vpc.vpc_id, description="VPC ID"
        )
        CfnOutput(
            self,
            "VpcCidrBlock",
            value=self.serverless_stack.vpc.vpc_cidr_block,
            description="VPC CIDR Block",
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
            "LambdaRoleName",
            value=self.serverless_stack.lambda_role.role_name,
            description="Lambda execution role name",
        )
        CfnOutput(
            self,
            "LambdaRoleArn",
            value=self.serverless_stack.lambda_role.role_arn,
            description="Lambda execution role ARN",
        )
        CfnOutput(
            self,
            "DynamoTableName",
            value=self.serverless_stack.table.table_name,
            description="DynamoDB table name",
        )
        CfnOutput(
            self,
            "DynamoTableArn",
            value=self.serverless_stack.table.table_arn,
            description="DynamoDB table ARN",
        )
        CfnOutput(
            self,
            "ApiGatewayId",
            value=self.serverless_stack.api.rest_api_id,
            description="API Gateway REST API ID",
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
        CfnOutput(
            self,
            "LambdaSecurityGroupId",
            value=self.serverless_stack.lambda_security_group.security_group_id,
            description="Lambda security group ID",
        )
        CfnOutput(
            self,
            "LambdaLogGroupName",
            value=self.serverless_stack.log_group_name,
            description="Lambda CloudWatch log group name",
        )
