```python

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
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct
import json


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
            table_name=f"items-table-{environment_suffix}",
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
        # Lambda Function with Full CRUD Operations
        # ============================================
        lambda_code = """
import json
import boto3
import os
import logging
from decimal import Decimal
from botocore.config import Config

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configure boto3 with retry logic
boto3_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

dynamodb = boto3.resource('dynamodb', config=boto3_config)
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

def validate_item_data(data, required_fields=None):
    if required_fields is None:
        required_fields = ['id', 'name']
    
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

def lambda_handler(event, context):
    logger.info(json.dumps({
        "event": "lambda_invocation",
        "method": event.get('httpMethod'),
        "path": event.get('path'),
        "request_id": context.aws_request_id
    }))
    
    try:
        method = event['httpMethod']
        path = event['path']
        
        if method == 'POST' and path == '/items':
            # CREATE operation
            body = json.loads(event['body'])
            validate_item_data(body)
            
            item = {
                'id': body['id'],
                'name': body['name'],
                'description': body.get('description', ''),
                'price': Decimal(str(body.get('price', 0))),
                'status': body.get('status', 'active')
            }
            table.put_item(Item=item)
            
            logger.info(json.dumps({
                "event": "item_created",
                "item_id": item['id'],
                "request_id": context.aws_request_id
            }))
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Item created', 'item': decimal_to_json(item)})
            }
            
        elif method == 'GET' and path == '/items':
            # READ ALL operation
            response = table.scan()
            items = response['Items']
            
            logger.info(json.dumps({
                "event": "items_retrieved",
                "count": len(items),
                "request_id": context.aws_request_id
            }))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'items': decimal_to_json(items)})
            }
            
        elif method == 'GET' and '/items/' in path:
            # READ SINGLE operation
            item_id = path.split('/items/')[-1]
            
            response = table.get_item(Key={'id': item_id})
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'message': 'Item not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'item': decimal_to_json(response['Item'])})
            }
            
        elif method == 'PUT' and '/items/' in path:
            # UPDATE operation
            item_id = path.split('/items/')[-1]
            body = json.loads(event['body'])
            
            update_expression = "SET "
            expression_attribute_values = {}
            expression_parts = []
            
            for key, value in body.items():
                if key != 'id':  # Don't update the partition key
                    expression_parts.append(f"#{key} = :{key}")
                    expression_attribute_values[f":{key}"] = Decimal(str(value)) if isinstance(value, (int, float)) else value
            
            if not expression_parts:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'message': 'No valid fields to update'})
                }
            
            update_expression += ", ".join(expression_parts)
            expression_attribute_names = {f"#{key}": key for key in body.keys() if key != 'id'}
            
            table.update_item(
                Key={'id': item_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ExpressionAttributeNames=expression_attribute_names
            )
            
            logger.info(json.dumps({
                "event": "item_updated",
                "item_id": item_id,
                "request_id": context.aws_request_id
            }))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Item updated successfully'})
            }
            
        elif method == 'DELETE' and '/items/' in path:
            # DELETE operation
            item_id = path.split('/items/')[-1]
            
            table.delete_item(Key={'id': item_id})
            
            logger.info(json.dumps({
                "event": "item_deleted",
                "item_id": item_id,
                "request_id": context.aws_request_id
            }))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Item deleted successfully'})
            }
            
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Method not allowed'})
            }
            
    except ValueError as e:
        logger.error(json.dumps({
            "event": "validation_error",
            "error": str(e),
            "request_id": context.aws_request_id
        }))
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Validation error', 'error': str(e)})
        }
    except Exception as e:
        logger.error(json.dumps({
            "event": "internal_error",
            "error": str(e),
            "request_id": context.aws_request_id
        }))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
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
        # API Gateway with Full CRUD Routes
        # ============================================
        api = apigateway.RestApi(
            self, "ItemsApi",
            rest_api_name=f"items-api-{environment_suffix}",
            description="API Gateway for CRUD operations",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(lambda_function)

        # Define API resources and methods
        items = api.root.add_resource("items")
        items.add_method("GET", lambda_integration)  # GET /items (list all)
        items.add_method("POST", lambda_integration)  # POST /items (create)

        # Individual item operations
        item = items.add_resource("{id}")
        item.add_method("GET", lambda_integration)  # GET /items/{id} (get one)
        item.add_method("PUT", lambda_integration)  # PUT /items/{id} (update)
        item.add_method("DELETE", lambda_integration)  # DELETE /items/{id} (delete)

        # ============================================
        # CloudWatch Alarms for Monitoring
        # ============================================
        lambda_error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            metric=lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Lambda function errors"
        )

        api_4xx_alarm = cloudwatch.Alarm(
            self, "Api4xxErrorAlarm",
            metric=api.metric_client_error(),
            threshold=5,
            evaluation_periods=2,
            alarm_description="API Gateway 4xx errors"
        )

        api_5xx_alarm = cloudwatch.Alarm(
            self, "Api5xxErrorAlarm",
            metric=api.metric_server_error(),
            threshold=1,
            evaluation_periods=1,
            alarm_description="API Gateway 5xx errors"
        )

        # ============================================
        # Outputs
        # ============================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "ApiGatewayId", value=api.rest_api_id, description="API Gateway ID")
        CfnOutput(self, "TableName", value=table.table_name, description="DynamoDB table name")
        CfnOutput(self, "TableArn", value=table.table_arn, description="DynamoDB table ARN")
        CfnOutput(self, "LambdaFunctionName", value=lambda_function.function_name, description="Lambda function name")
        CfnOutput(self, "LambdaFunctionArn", value=lambda_function.function_arn, description="Lambda function ARN")

```