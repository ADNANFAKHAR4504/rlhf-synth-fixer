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
)
from constructs import Construct
from decimal import Decimal
import json
import os
import boto3

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
        # DynamoDB Table
        # ============================================
        table = dynamodb.Table(
            self, "ItemsTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY if environment_suffix == 'dev' else RemovalPolicy.RETAIN,
            point_in_time_recovery=True
        )

        # ============================================
        # IAM Role for Lambda
        # ============================================
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant permissions to the Lambda function to access DynamoDB
        table.grant_read_write_data(lambda_role)

        # ============================================
        # Lambda Function
        # ============================================
        lambda_code = """
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

# Helper function to convert DynamoDB items to JSON-serializable format
def decimal_to_json(obj):
    if isinstance(obj, list):
        return [decimal_to_json(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_json(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    try:
        if event['httpMethod'] == 'POST':
            body = json.loads(event['body'])
            item = {
                'id': body['id'],
                'name': body['name'],
                'description': body.get('description', ''),
                'price': Decimal(str(body.get('price', 0))),
                'status': body.get('status', 'active')
            }
            table.put_item(Item=item)
            return {
                'statusCode': 201,
                'body': json.dumps({'message': 'Item created', 'item': decimal_to_json(item)})
            }
        elif event['httpMethod'] == 'GET':
            response = table.scan()
            items = response['Items']
            return {
                'statusCode': 200,
                'body': json.dumps({'items': decimal_to_json(items)})
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
            self, "CrudLambdaFunction",
            function_name=f"crud-lambda-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": table.table_name
            }
        )

        # ============================================
        # API Gateway
        # ============================================
        api = apigateway.RestApi(
            self, "ItemsApi",
            rest_api_name=f"items-api-{environment_suffix}",
            description="API Gateway for CRUD operations",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS
            )
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(lambda_function)

        # Define API resources and methods
        items = api.root.add_resource("items")
        items.add_method("GET", lambda_integration)  # GET /items
        items.add_method("POST", lambda_integration)  # POST /items

        # ============================================
        # Outputs
        # ============================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "ApiGatewayId", value=api.rest_api_id, description="API Gateway ID")
        CfnOutput(self, "TableName", value=table.table_name, description="DynamoDB table name")
        CfnOutput(self, "TableArn", value=table.table_arn, description="DynamoDB table ARN")
        CfnOutput(self, "LambdaFunctionName", value=lambda_function.function_name, description="Lambda function name")
        CfnOutput(self, "LambdaFunctionArn", value=lambda_function.function_arn, description="Lambda function ARN")
