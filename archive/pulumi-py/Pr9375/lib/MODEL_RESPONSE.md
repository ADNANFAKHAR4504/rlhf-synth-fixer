```python
import pulumi
import pulumi_aws as aws
import json
import base64

# Configuration
config = pulumi.Config()
region = "us-east-1"
project_name = "iac-nova-test"
tags = {
    "Project": "IaC-Nova-Test",
    "Owner": "LLM-Eval"
}

# Lambda function code embedded as a string
lambda_code = '''
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    try:
        logger.info(f"Event: {json.dumps(event)}")

        http_method = event.get('httpMethod', '')
        path_parameters = event.get('pathParameters') or {}
        body = event.get('body', '{}')

        if body:
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                body = {}

        response_headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }

        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': response_headers,
                'body': json.dumps({'message': 'CORS preflight'})
            }

        if http_method == 'GET':
            return handle_get(path_parameters, response_headers)
        elif http_method == 'POST':
            return handle_post(body, response_headers)
        elif http_method == 'PUT':
            return handle_put(path_parameters, body, response_headers)
        elif http_method == 'DELETE':
            return handle_delete(path_parameters, response_headers)
        else:
            return {
                'statusCode': 405,
                'headers': response_headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_get(path_parameters, headers):
    item_id = path_parameters.get('ItemId')
    created_at = path_parameters.get('CreatedAt')

    if item_id and created_at:
        # Get specific item
        try:
            response = table.get_item(
                Key={
                    'ItemId': item_id,
                    'CreatedAt': created_at
                }
            )

            if 'Item' in response:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(response['Item'], cls=DecimalEncoder)
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Item not found'})
                }
        except Exception as e:
            logger.error(f"Error getting item: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Failed to get item'})
            }

    elif item_id:
        # Get all items for a specific ItemId
        try:
            response = table.query(
                KeyConditionExpression='ItemId = :item_id',
                ExpressionAttributeValues={':item_id': item_id}
            )

            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'items': response['Items'],
                    'count': response['Count']
                }, cls=DecimalEncoder)
            }
        except Exception as e:
            logger.error(f"Error querying items: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Failed to query items'})
            }

    else:
        # Scan all items (limit for performance)
        try:
            response = table.scan(Limit=100)

            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'items': response['Items'],
                    'count': response['Count']
                }, cls=DecimalEncoder)
            }
        except Exception as e:
            logger.error(f"Error scanning items: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Failed to scan items'})
            }

def handle_post(body, headers):
    try:
        item_id = body.get('ItemId')
        if not item_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'ItemId is required'})
            }

        created_at = datetime.utcnow().isoformat() + 'Z'

        item = {
            'ItemId': item_id,
            'CreatedAt': created_at,
            **{k: v for k, v in body.items() if k not in ['ItemId', 'CreatedAt']}
        }

        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(item, cls=DecimalEncoder)
        }

    except Exception as e:
        logger.error(f"Error creating item: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to create item'})
        }

def handle_put(path_parameters, body, headers):
    try:
        item_id = path_parameters.get('ItemId')
        created_at = path_parameters.get('CreatedAt')

        if not item_id or not created_at:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'ItemId and CreatedAt are required in path'})
            }

        # Check if item exists
        existing_response = table.get_item(
            Key={
                'ItemId': item_id,
                'CreatedAt': created_at
            }
        )

        if 'Item' not in existing_response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Item not found'})
            }

        # Update item
        item = {
            'ItemId': item_id,
            'CreatedAt': created_at,
            **{k: v for k, v in body.items() if k not in ['ItemId', 'CreatedAt']}
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(item, cls=DecimalEncoder)
        }

    except Exception as e:
        logger.error(f"Error updating item: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to update item'})
        }

def handle_delete(path_parameters, headers):
    try:
        item_id = path_parameters.get('ItemId')
        created_at = path_parameters.get('CreatedAt')

        if not item_id or not created_at:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'ItemId and CreatedAt are required in path'})
            }

        # Check if item exists
        existing_response = table.get_item(
            Key={
                'ItemId': item_id,
                'CreatedAt': created_at
            }
        )

        if 'Item' not in existing_response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Item not found'})
            }

        # Delete item
        table.delete_item(
            Key={
                'ItemId': item_id,
                'CreatedAt': created_at
            }
        )

        return {
            'statusCode': 204,
            'headers': headers,
            'body': ''
        }

    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to delete item'})
        }
'''

# Create DynamoDB table
dynamodb_table = aws.dynamodb.Table(
    "items-table",
    name=f"{project_name}-items",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="ItemId",
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="CreatedAt",
            type="S"
        )
    ],
    hash_key="ItemId",
    range_key="CreatedAt",
    billing_mode="PAY_PER_REQUEST",
    tags=tags,
    opts=pulumi.ResourceOptions(protect=False)
)

# Create CloudWatch Log Group for Lambda
log_group = aws.cloudwatch.LogGroup(
    "lambda-log-group",
    name=pulumi.Output.concat("/aws/lambda/", f"{project_name}-lambda"),
    retention_in_days=14,
    tags=tags
)

# Create IAM role for Lambda with least privilege
lambda_role = aws.iam.Role(
    "lambda-role",
    name=f"{project_name}-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    }),
    tags=tags
)

# Create custom policy for DynamoDB access (least privilege)
dynamodb_policy = aws.iam.Policy(
    "lambda-dynamodb-policy",
    name=f"{project_name}-lambda-dynamodb-policy",
    description="Policy for Lambda to access specific DynamoDB table",
    policy=dynamodb_table.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": [
                    arn,
                    f"{arn}/index/*"
                ]
            }
        ]
    }))
)

# Attach basic Lambda execution policy
lambda_basic_execution_attachment = aws.iam.RolePolicyAttachment(
    "lambda-basic-execution-attachment",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Attach custom DynamoDB policy
lambda_dynamodb_attachment = aws.iam.RolePolicyAttachment(
    "lambda-dynamodb-attachment",
    role=lambda_role.name,
    policy_arn=dynamodb_policy.arn
)

# Create Lambda function
lambda_function = aws.lambda_.Function(
    "items-lambda",
    name=f"{project_name}-lambda",
    runtime="python3.9",
    handler="index.lambda_handler",
    role=lambda_role.arn,
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(lambda_code)
    }),
    timeout=5,  # Maximum 5 seconds as required
    memory_size=128,  # Cost-effective memory setting
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE_NAME": dynamodb_table.name
        }
    ),
    tags=tags,
    depends_on=[lambda_basic_execution_attachment, lambda_dynamodb_attachment, log_group]
)

# Configure Lambda concurrency for 1000 RPM support
lambda_concurrency = aws.lambda_.ProvisionedConcurrencyConfig(
    "lambda-concurrency",
    function_name=lambda_function.name,
    qualifier=lambda_function.version,
    provisioned_concurrency_units=20  # Sufficient for 1000 RPM with 5s timeout
)

# Create API Gateway REST API
api_gateway = aws.apigateway.RestApi(
    "items-api",
    name=f"{project_name}-api",
    description="REST API for items management",
    endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
        types="REGIONAL"
    ),
    tags=tags
)

# Create API Gateway resources and methods
# Root resource for collection operations
items_resource = aws.apigateway.Resource(
    "items-resource",
    rest_api=api_gateway.id,
    parent_id=api_gateway.root_resource_id,
    path_part="items"
)

# Resource for specific ItemId
item_id_resource = aws.apigateway.Resource(
    "item-id-resource",
    rest_api=api_gateway.id,
    parent_id=items_resource.id,
    path_part="{ItemId}"
)

# Resource for specific ItemId and CreatedAt
item_detail_resource = aws.apigateway.Resource(
    "item-detail-resource",
    rest_api=api_gateway.id,
    parent_id=item_id_resource.id,
    path_part="{CreatedAt}"
)

# Create methods for different endpoints
def create_method_and_integration(resource_name, resource_id, http_method, description):
    method = aws.apigateway.Method(
        f"{resource_name}-{http_method.lower()}-method",
        rest_api=api_gateway.id,
        resource_id=resource_id,
        http_method=http_method,
        authorization="NONE",
        request_parameters={
            "method.request.path.ItemId": True if "ItemId" in description else False,
            "method.request.path.CreatedAt": True if "CreatedAt" in description else False
        } if http_method != "POST" else {}
    )

    integration = aws.apigateway.Integration(
        f"{resource_name}-{http_method.lower()}-integration",
        rest_api=api_gateway.id,
        resource_id=resource_id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function.invoke_arn
    )

    return method, integration

# Create methods for all required endpoints
# GET /items (list all items)
items_get_method, items_get_integration = create_method_and_integration(
    "items", items_resource.id, "GET", "List all items"
)

# POST /items (create new item)
items_post_method, items_post_integration = create_method_and_integration(
    "items", items_resource.id, "POST", "Create new item"
)

# GET /items/{ItemId}/{CreatedAt} (get specific item)
item_detail_get_method, item_detail_get_integration = create_method_and_integration(
    "item-detail", item_detail_resource.id, "GET", "Get specific item by ItemId and CreatedAt"
)

# PUT /items/{ItemId}/{CreatedAt} (update specific item)
item_detail_put_method, item_detail_put_integration = create_method_and_integration(
    "item-detail", item_detail_resource.id, "PUT", "Update specific item by ItemId and CreatedAt"
)

# DELETE /items/{ItemId}/{CreatedAt} (delete specific item)
item_detail_delete_method, item_detail_delete_integration = create_method_and_integration(
    "item-detail", item_detail_resource.id, "DELETE", "Delete specific item by ItemId and CreatedAt"
)

# Add OPTIONS methods for CORS
def create_options_method(resource_name, resource_id):
    method = aws.apigateway.Method(
        f"{resource_name}-options-method",
        rest_api=api_gateway.id,
        resource_id=resource_id,
        http_method="OPTIONS",
        authorization="NONE"
    )

    integration = aws.apigateway.Integration(
        f"{resource_name}-options-integration",
        rest_api=api_gateway.id,
        resource_id=resource_id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function.invoke_arn
    )

    return method, integration

# Add OPTIONS methods for CORS support
items_options_method, items_options_integration = create_options_method("items", items_resource.id)
item_id_options_method, item_id_options_integration = create_options_method("item-id", item_id_resource.id)
item_detail_options_method, item_detail_options_integration = create_options_method("item-detail", item_detail_resource.id)

# Grant API Gateway permission to invoke Lambda
lambda_permission = aws.lambda_.Permission(
    "api-gateway-lambda-permission",
    statement_id="AllowExecutionFromAPIGateway",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api_gateway.execution_arn, "/*/*")
)

# Deploy API Gateway
deployment = aws.apigateway.Deployment(
    "api-deployment",
    rest_api=api_gateway.id,
    stage_name="prod",
    depends_on=[
        items_get_method, items_post_method, items_options_method,
        item_id_get_method, item_id_options_method,
        item_detail_get_method, item_detail_put_method, item_detail_delete_method, item_detail_options_method,
        items_get_integration, items_post_integration, items_options_integration,
        item_id_get_integration, item_id_options_integration,
        item_detail_get_integration, item_detail_put_integration, item_detail_delete_integration, item_detail_options_integration
    ]
)

# Configure API Gateway stage with throttling for 1000 RPM
api_stage = aws.apigateway.Stage(
    "api-stage",
    deployment=deployment.id,
    rest_api=api_gateway.id,
    stage_name="prod",
    throttle_settings=aws.apigateway.StageThrottleSettingsArgs(
        rate_limit=17,  # 1000 requests per minute = ~16.67 RPS, rounded up to 17
        burst_limit=50  # Allow burst capacity
    ),
    tags=tags
)

# Create SNS topic for CloudWatch alarms
sns_topic = aws.sns.Topic(
    "lambda-alerts",
    name=f"{project_name}-lambda-alerts",
    tags=tags
)

# Create CloudWatch alarms
duration_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-duration-alarm",
    name=f"{project_name}-lambda-duration-alarm",
    description="Lambda function duration alarm",
    metric_name="Duration",
    namespace="AWS/Lambda",
    statistic="Average",
    period=300,
    evaluation_periods=2,
    threshold=4000,  # 4 seconds (80% of 5 second timeout)
    comparison_operator="GreaterThanThreshold",
    dimensions={
        "FunctionName": lambda_function.name
    },
    alarm_actions=[sns_topic.arn],
    tags=tags
)

errors_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-errors-alarm",
    name=f"{project_name}-lambda-errors-alarm",
    description="Lambda function errors alarm",
    metric_name="Errors",
    namespace="AWS/Lambda",
    statistic="Sum",
    period=300,
    evaluation_periods=1,
    threshold=1,
    comparison_operator="GreaterThanOrEqualToThreshold",
    dimensions={
        "FunctionName": lambda_function.name
    },
    alarm_actions=[sns_topic.arn],
    tags=tags
)

throttles_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-throttles-alarm",
    name=f"{project_name}-lambda-throttles-alarm",
    description="Lambda function throttles alarm",
    metric_name="Throttles",
    namespace="AWS/Lambda",
    statistic="Sum",
    period=300,
    evaluation_periods=1,
    threshold=1,
    comparison_operator="GreaterThanOrEqualToThreshold",
    dimensions={
        "FunctionName": lambda_function.name
    },
    alarm_actions=[sns_topic.arn],
    tags=tags
)

# Export important values
pulumi.export("api_gateway_url", pulumi.Output.concat("https://", api_gateway.id, ".execute-api.", region, ".amazonaws.com/prod"))
pulumi.export("dynamodb_table_name", dynamodb_table.name)
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("sns_topic_arn", sns_topic.arn)
pulumi.export("api_gateway_id", api_gateway.id)

```
