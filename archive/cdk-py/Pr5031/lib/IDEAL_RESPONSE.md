## Ideal response

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

    This stack creates a production-grade serverless REST API with Lambda, API Gateway, 
    DynamoDB, IAM roles, and CloudWatch monitoring.

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
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ============================================================
        # DYNAMODB TABLE
        # ============================================================
        
        # Create DynamoDB table with on-demand billing
        self.items_table = dynamodb.Table(
            self,
            "ItemsTable",
            table_name=f"serverless-api-items-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test. Use RETAIN for production
            point_in_time_recovery=True,  # Enable PITR for production data protection
            encryption=dynamodb.TableEncryption.AWS_MANAGED,  # Encryption at rest
        )

        # ============================================================
        # CLOUDWATCH LOG GROUP
        # ============================================================
        
        # Create CloudWatch Log Group for Lambda with retention policy
        self.log_group = logs.LogGroup(
            self,
            "ApiLambdaLogGroup",
            log_group_name=f"/aws/lambda/aws-serverless-infra-api-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,  # Adjust based on requirements
            removal_policy=RemovalPolicy.DESTROY
        )

        # ============================================================
        # IAM ROLE FOR LAMBDA
        # ============================================================
        
        # Create IAM role for Lambda with least privilege principle
        self.lambda_role = iam.Role(
            self,
            "ApiLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for Serverless API Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific DynamoDB permissions (least privilege)
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:UpdateItem"
                ],
                resources=[self.items_table.table_arn]
            )
        )

        # Add CloudWatch Logs permissions
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[self.log_group.log_group_arn]
            )
        )

        # ============================================================
        # LAMBDA FUNCTION
        # ============================================================
        
        # Create Lambda function with inline code
        self.api_handler = lambda_.Function(
            self,
            "ApiHandler",
            function_name=f"serverless-api-handler-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_inline("""
import json
import os
import uuid
import logging
from datetime import datetime
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION', 'us-west-2'))
table_name = os.environ.get('TABLE_NAME', 'serverless-api-items')
table = dynamodb.Table(table_name)


class DecimalEncoder(json.JSONEncoder):
    \"\"\"Helper class to convert DynamoDB Decimal types to JSON\"\"\"
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def create_response(status_code, body, headers=None):
    \"\"\"Create standardized API response\"\"\"
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
        },
        'body': json.dumps(body, cls=DecimalEncoder) if body is not None else ''
    }
    
    if headers:
        response['headers'].update(headers)
    
    return response


def get_all_items():
    \"\"\"Retrieve all items from DynamoDB\"\"\"
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        logger.info(f"Retrieved {len(items)} items")
        return create_response(200, {'items': items, 'count': len(items)})
    
    except ClientError as e:
        logger.error(f"Error retrieving items: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve items'})


def get_item(item_id):
    \"\"\"Retrieve a specific item by ID\"\"\"
    try:
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' in response:
            logger.info(f"Retrieved item: {item_id}")
            return create_response(200, response['Item'])
        else:
            logger.warning(f"Item not found: {item_id}")
            return create_response(404, {'error': f'Item {item_id} not found'})
    
    except ClientError as e:
        logger.error(f"Error retrieving item {item_id}: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve item'})


def create_item(body):
    \"\"\"Create a new item in DynamoDB\"\"\"
    try:
        # Validate request body
        if not body:
            return create_response(400, {'error': 'Request body is required'})
        
        item_data = json.loads(body) if isinstance(body, str) else body
        
        # Generate unique ID if not provided
        if 'id' not in item_data:
            item_data['id'] = str(uuid.uuid4())
        
        # Add metadata
        item_data['created_at'] = datetime.utcnow().isoformat()
        item_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Store in DynamoDB
        table.put_item(Item=item_data)
        
        logger.info(f"Created item: {item_data['id']}")
        return create_response(201, item_data)
    
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_response(400, {'error': 'Invalid JSON format'})
    except ClientError as e:
        logger.error(f"Error creating item: {str(e)}")
        return create_response(500, {'error': 'Failed to create item'})


def delete_item(item_id):
    \"\"\"Delete an item from DynamoDB\"\"\"
    try:
        # Check if item exists first
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' not in response:
            logger.warning(f"Item not found for deletion: {item_id}")
            return create_response(404, {'error': f'Item {item_id} not found'})
        
        # Delete the item
        table.delete_item(Key={'id': item_id})
        
        logger.info(f"Deleted item: {item_id}")
        return create_response(204, None)
    
    except ClientError as e:
        logger.error(f"Error deleting item {item_id}: {str(e)}")
        return create_response(500, {'error': 'Failed to delete item'})


def lambda_handler(event, context):
    \"\"\"Main Lambda handler function\"\"\"
    
    # Log the incoming event for debugging
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract HTTP method and path
    http_method = event.get('httpMethod', '').upper()
    path = event.get('path', '')
    path_parameters = event.get('pathParameters', {})
    body = event.get('body', '')
    
    try:
        # Route to appropriate handler based on method and path
        if path == '/items':
            if http_method == 'GET':
                return get_all_items()
            elif http_method == 'POST':
                return create_item(body)
            else:
                return create_response(405, {'error': 'Method not allowed'})
        
        elif path.startswith('/items/') and path_parameters:
            item_id = path_parameters.get('id')
            
            if not item_id:
                return create_response(400, {'error': 'Item ID is required'})
            
            if http_method == 'GET':
                return get_item(item_id)
            elif http_method == 'DELETE':
                return delete_item(item_id)
            else:
                return create_response(405, {'error': 'Method not allowed'})
        
        else:
            return create_response(404, {'error': 'Resource not found'})
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})
            """),
            handler="index.lambda_handler",
            role=self.lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": self.items_table.table_name,
                "REGION": "us-west-2",
                "LOG_LEVEL": "INFO",
                "ENVIRONMENT": environment_suffix
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            retry_attempts=2,
            description=f"Handles REST API requests for serverless application - {environment_suffix}"
        )

        # ============================================================
        # API GATEWAY
        # ============================================================
        
        # Create API Gateway REST API
        self.api = apigateway.RestApi(
            self,
            "ServerlessApi",
            rest_api_name=f"serverless-rest-api-{environment_suffix}",
            description=f"Production-grade serverless REST API - {environment_suffix}",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.api_handler,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )

        # Define API resources and methods
        items_resource = self.api.root.add_resource("items")
        
        # GET /items - List all items
        items_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Content-Type": True
                    }
                )
            ]
        )

        # POST /items - Create new item
        items_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="201"),
                apigateway.MethodResponse(status_code="400")
            ]
        )

        # Single item resource
        item_resource = items_resource.add_resource("{id}")
        
        # GET /items/{id} - Get specific item
        item_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="200"),
                apigateway.MethodResponse(status_code="404")
            ]
        )

        # DELETE /items/{id} - Delete item
        item_resource.add_method(
            "DELETE",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="204"),
                apigateway.MethodResponse(status_code="404")
            ]
        )

        # ============================================================
        # CLOUDWATCH MONITORING
        # ============================================================
        
        # Add CloudWatch alarms for monitoring
        self.lambda_errors_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorsAlarm",
            metric=self.api_handler.metric_errors(),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Alert when Lambda function errors exceed threshold"
        )

        self.lambda_throttles_alarm = cloudwatch.Alarm(
            self,
            "LambdaThrottlesAlarm",
            metric=self.api_handler.metric_throttles(),
            threshold=10,
            evaluation_periods=1,
            alarm_description="Alert when Lambda function is throttled"
        )

        # ============================================================
        # CLOUDFORMATION OUTPUTS
        # ============================================================
        
        # Output important values
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"{self.stack_name}-ApiEndpoint"
        )

        CfnOutput(
            self,
            "TableName",
            value=self.items_table.table_name,
            description="DynamoDB table name",
            export_name=f"{self.stack_name}-TableName"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.api_handler.function_name,
            description="Lambda function name",
            export_name=f"{self.stack_name}-LambdaFunctionName"
        )

        CfnOutput(
            self,
            "LambdaRoleArn",
            value=self.lambda_role.role_arn,
            description="Lambda execution role ARN",
            export_name=f"{self.stack_name}-LambdaRoleArn"
        )

        CfnOutput(
            self,
            "Environment",
            value=environment_suffix,
            description="Environment suffix used for resource naming",
            export_name=f"{self.stack_name}-Environment"
        )


```