"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
    aws_ssm as ssm,
)
from constructs import Construct


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

    This stack creates a serverless architecture with DynamoDB, Lambda, and API Gateway.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ============================================
        # AWS Systems Manager Parameter Store
        # ============================================
        table_name_param = ssm.StringParameter(
            self,
            "TableNameParameter",
            parameter_name=f"/{environment_suffix}/tap-app/table-name",
            string_value=f"users-table-{environment_suffix}",
            description="DynamoDB table name for the TAP application",
            tier=ssm.ParameterTier.STANDARD,
        )

        lambda_name_param = ssm.StringParameter(
            self,
            "LambdaNameParameter",
            parameter_name=f"/{environment_suffix}/tap-app/lambda-name",
            string_value=f"tap-handler-{environment_suffix}",
            description="Lambda function name for the TAP application",
            tier=ssm.ParameterTier.STANDARD,
        )

        # ============================================
        # KMS Encryption Key
        # ============================================
        encryption_key = kms.Key(
            self,
            "DynamoDBEncryptionKey",
            description=f"KMS key for DynamoDB table encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY if environment_suffix == "dev" else RemovalPolicy.RETAIN,
            alias=f"alias/dynamodb-{environment_suffix}",
        )

        # ============================================
        # DynamoDB Table
        # ============================================
        users_table = dynamodb.Table(
            self,
            "UsersTable",
            table_name=table_name_param.string_value,
            partition_key=dynamodb.Attribute(
                name="UserId",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=encryption_key,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY if environment_suffix == "dev" else RemovalPolicy.RETAIN,
        )

        # ============================================
        # Lambda Function
        # ============================================
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for TAP Lambda function",
        )

        # Add permissions for DynamoDB, KMS, and CloudWatch Logs
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                resources=[users_table.table_arn],
            )
        )
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:GenerateDataKey",
                ],
                resources=[encryption_key.key_arn],
            )
        )
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=["arn:aws:logs:*:*:*"],
            )
        )

        lambda_code = """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    try:
        if event['httpMethod'] == 'POST':
            body = json.loads(event['body'])
            item = {
                'UserId': body['UserId'],
                'Name': body['Name'],
                'CreatedAt': datetime.utcnow().isoformat(),
            }
            table.put_item(Item=item)
            return {
                'statusCode': 201,
                'body': json.dumps({'message': 'Item created', 'item': item})
            }
        elif event['httpMethod'] == 'GET':
            response = table.scan()
            return {
                'statusCode': 200,
                'body': json.dumps({'items': response['Items']})
            }
        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'message': 'Method not allowed'})
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error', 'error': str(e)})
        }
"""
        lambda_function = lambda_.Function(
            self,
            "TapHandler",
            function_name=lambda_name_param.string_value,
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            reserved_concurrent_executions=5,
            environment={
                "TABLE_NAME": users_table.table_name,
            },
        )

        # ============================================
        # API Gateway
        # ============================================
        api = apigateway.RestApi(
            self,
            "TapApi",
            rest_api_name=f"tap-api-{environment_suffix}",
            description="API Gateway for TAP application",
        )

        lambda_integration = apigateway.LambdaIntegration(lambda_function)

        items = api.root.add_resource("users")
        items.add_method("GET", lambda_integration)
        items.add_method("POST", lambda_integration)

        # ============================================
        # Outputs
        # ============================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "TableName", value=users_table.table_name, description="DynamoDB table name")
        CfnOutput(self, "LambdaFunctionName", value=lambda_function.function_name, description="Lambda function name")
        CfnOutput(self, "KMSKeyId", value=encryption_key.key_id, description="KMS encryption key ID")
