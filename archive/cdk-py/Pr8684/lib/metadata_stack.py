"""
metadata_stack.py

This module defines the ServerlessStack which creates:
- VPC with public subnets
- DynamoDB table
- Lambda function with VPC integration
- API Gateway REST API
- CloudWatch alarm for Lambda errors
"""

import os

import aws_cdk as cdk
from aws_cdk import (
    CfnOutput,
    Stack,
    aws_apigateway as apigateway,
    aws_cloudwatch as cloudwatch,
    aws_dynamodb as dynamodb,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as _lambda,
)
from constructs import Construct


class ServerlessStack(Stack):
    """
    ServerlessStack creates a complete serverless infrastructure including:
    - VPC with 2 AZs and public subnets
    - DynamoDB table with on-demand billing
    - Lambda function in VPC with DynamoDB access
    - API Gateway with /item GET endpoint
    - CloudWatch alarm for Lambda errors
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC creation with public subnets
        self.vpc = ec2.Vpc(
            self,
            "LambdaVPC",
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet", subnet_type=ec2.SubnetType.PUBLIC
                )
            ],
        )

        # Security Group for Lambda
        self.lambda_security_group = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda function",
            allow_all_outbound=True,
        )

        # DynamoDB Table Creation
        self.table = dynamodb.Table(
            self,
            "ItemTable",
            partition_key=dynamodb.Attribute(
                name="itemId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )

        # Lambda Execution Role
        self.lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        # Add required EC2 permissions for Lambda in a VPC
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                ],
                resources=["*"],
            )
        )

        # Add CloudWatch log permissions
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=["arn:aws:logs:*:*:*"],
            )
        )

        # Grant DynamoDB permissions
        self.table.grant_write_data(self.lambda_role)

        # Lambda Function
        # Determine lambda asset path dynamically
        lambda_asset_path = os.path.join(os.path.dirname(__file__), "lambda")
        if not os.path.exists(lambda_asset_path):
            lambda_asset_path = "lib/lambda"  # Fallback for root execution

        self.lambda_function = _lambda.Function(
            self,
            "ItemFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            code=_lambda.Code.from_asset(lambda_asset_path),
            handler="handler.handler",
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_groups=[self.lambda_security_group],
            allow_public_subnet=True,
            environment={"TABLE_NAME": self.table.table_name},
        )

        # CloudWatch Alarm for Lambda Errors
        self.alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorsAlarm",
            metric=self.lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=1,
        )

        # API Gateway
        self.api = apigateway.RestApi(
            self,
            "ItemApi",
            rest_api_name="Item Service",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
            ),
        )

        integration = apigateway.LambdaIntegration(self.lambda_function)

        items = self.api.root.add_resource("item")
        items.add_method("GET", integration)

        # Tag all resources
        cdk.Tags.of(self).add("Environment", "Production")

        # Stack Outputs
        CfnOutput(self, "VpcIdOutput", value=self.vpc.vpc_id, description="VPC ID")
        CfnOutput(
            self,
            "VpcCidrBlockOutput",
            value=self.vpc.vpc_cidr_block,
            description="VPC CIDR block",
        )
        CfnOutput(
            self,
            "LambdaSecurityGroupIdOutput",
            value=self.lambda_security_group.security_group_id,
            description="Lambda security group ID",
        )
        CfnOutput(
            self,
            "DynamoTableNameOutput",
            value=self.table.table_name,
            description="DynamoDB table name",
        )
        CfnOutput(
            self,
            "DynamoTableArnOutput",
            value=self.table.table_arn,
            description="DynamoDB table ARN",
        )
        CfnOutput(
            self,
            "LambdaRoleNameOutput",
            value=self.lambda_role.role_name,
            description="Lambda execution role name",
        )
        CfnOutput(
            self,
            "LambdaRoleArnOutput",
            value=self.lambda_role.role_arn,
            description="Lambda execution role ARN",
        )
        CfnOutput(
            self,
            "LambdaFunctionNameOutput",
            value=self.lambda_function.function_name,
            description="Lambda function name",
        )
        CfnOutput(
            self,
            "LambdaFunctionArnOutput",
            value=self.lambda_function.function_arn,
            description="Lambda function ARN",
        )
        CfnOutput(
            self,
            "AlarmNameOutput",
            value=self.alarm.alarm_name,
            description="CloudWatch Alarm name",
        )
        CfnOutput(
            self,
            "ApiGatewayIdOutput",
            value=self.api.rest_api_id,
            description="API Gateway ID",
        )
        CfnOutput(
            self,
            "ApiGatewayUrlOutput",
            value=self.api.url,
            description="API Gateway URL",
        )
