``````python
import pulumi
import pulumi_aws as aws
import json

# Configuration management for multi-environment support
config = pulumi.Config()
environment = config.require("environment")  # dev/test/prod
dynamodb_billing_mode = config.get("dynamodb_billing_mode") or ("PROVISIONED" if environment == "production" else "PAY_PER_REQUEST")
lambda_memory_size = int(config.get("lambda_memory_size") or (512 if environment == "production" else 128))
notification_email = config.require("notification_email")

# Resource naming convention: inventory-{resource-type}-{environment}
def get_resource_name(resource_type: str) -> str:
    return f"inventory-{resource_type}-{environment}"

# DynamoDB Table 1: Primary inventory items table
inventory_items_table = aws.dynamodb.Table(
    get_resource_name("items-table"),
    name=get_resource_name("items"),
    billing_mode=dynamodb_billing_mode,
    hash_key="itemId",
    range_key="version",
    attributes=[
        aws.dynamodb.TableAttributeArgs(name="itemId", type="S"),
        aws.dynamodb.TableAttributeArgs(name="version", type="N"),
        aws.dynamodb.TableAttributeArgs(name="category", type="S"),
    ],
    global_secondary_indexes=[
        aws.dynamodb.TableGlobalSecondaryIndexArgs(
            name="category-index",
            hash_key="category",
            projection_type="ALL",
            read_capacity=5 if dynamodb_billing_mode == "PROVISIONED" else None,
            write_capacity=5 if dynamodb_billing_mode == "PROVISIONED" else None,
        )
    ],
    read_capacity=10 if dynamodb_billing_mode == "PROVISIONED" else None,
    write_capacity=10 if dynamodb_billing_mode == "PROVISIONED" else None,
    server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
        enabled=True,
        kms_key_id="alias/aws/dynamodb"
    ),
    tags={
        "Environment": environment,
        "Project": "inventory-management",
        "Purpose": "primary-inventory-storage"
    }
)

# DynamoDB Table 2: Audit trail table for compliance
inventory_audit_table = aws.dynamodb.Table(
    get_resource_name("audit-table"),
    name=get_resource_name("audit"),
    billing_mode=dynamodb_billing_mode,
    hash_key="auditId",
    range_key="timestamp",
    attributes=[
        aws.dynamodb.TableAttributeArgs(name="auditId", type="S"),
        aws.dynamodb.TableAttributeArgs(name="timestamp", type="S"),
    ],
    read_capacity=5 if dynamodb_billing_mode == "PROVISIONED" else None,
    write_capacity=5 if dynamodb_billing_mode == "PROVISIONED" else None,
    server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
        enabled=True,
        kms_key_id="alias/aws/dynamodb"
    ),
    tags={
        "Environment": environment,
        "Project": "inventory-management",
        "Purpose": "audit-trail-storage"
    }
)

# SNS Topic for inventory alerts (low stock notifications)
inventory_alerts_topic = aws.sns.Topic(
    get_resource_name("alerts-topic"),
    name=get_resource_name("alerts"),
    kms_master_key_id="alias/aws/sns",
    tags={
        "Environment": environment,
        "Project": "inventory-management",
        "Purpose": "inventory-alerts"
    }
)

# SNS Topic subscription for email notifications
inventory_alerts_subscription = aws.sns.TopicSubscription(
    get_resource_name("alerts-subscription"),
    topic_arn=inventory_alerts_topic.arn,
    protocol="email",
    endpoint=notification_email
)

# IAM Role for Lambda function with least privilege permissions
lambda_role = aws.iam.Role(
    get_resource_name("lambda-role"),
    name=get_resource_name("lambda-role"),
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
    tags={
        "Environment": environment,
        "Project": "inventory-management",
        "Purpose": "lambda-execution-role"
    }
)

# IAM Policy for Lambda function with minimal required permissions
lambda_policy = aws.iam.RolePolicy(
    get_resource_name("lambda-policy"),
    role=lambda_role.id,
    policy=pulumi.Output.all(
        inventory_items_table.arn,
        inventory_audit_table.arn,
        inventory_alerts_topic.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": [
                    args[0],  # inventory_items_table.arn
                    f"{args[0]}/index/*"  # GSI permissions
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem"
                ],
                "Resource": args[1]  # inventory_audit_table.arn
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": args[2]  # inventory_alerts_topic.arn
            }
        ]
    }))
)

# Lambda function code for complete CRUD operations
lambda_code = """
import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
ITEMS_TABLE_NAME = '{items_table_name}'
AUDIT_TABLE_NAME = '{audit_table_name}'
SNS_TOPIC_ARN = '{sns_topic_arn}'
LOW_STOCK_THRESHOLD = 10

# DynamoDB table references
items_table = dynamodb.Table(ITEMS_TABLE_NAME)
audit_table = dynamodb.Table(AUDIT_TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    \"\"\"Helper class to handle Decimal serialization\"\"\"
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def log_audit_event(operation, item_id, user_id="system", old_value=None, new_value=None):
    \"\"\"Log all operations to audit table for compliance\"\"\"
    try:
        audit_record = {{
            'auditId': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat(),
            'operation': operation,
            'itemId': item_id,
            'userId': user_id,
            'oldValue': json.dumps(old_value, cls=DecimalEncoder) if old_value else None,
            'newValue': json.dumps(new_value, cls=DecimalEncoder) if new_value else None
        }}
        audit_table.put_item(Item=audit_record)
        logger.info(f"Audit logged: {{operation}} for item {{item_id}}")
    except Exception as e:
        logger.error(f"Failed to log audit event: {{str(e)}}")

def check_low_inventory(item_data):
    \"\"\"Check if inventory is below threshold and send SNS notification\"\"\"
    try:
        quantity = int(item_data.get('quantity', 0))
        if quantity <= LOW_STOCK_THRESHOLD:
            message = {{
                'itemId': item_data['itemId'],
                'name': item_data.get('name', 'Unknown'),
                'currentQuantity': quantity,
                'threshold': LOW_STOCK_THRESHOLD,
                'timestamp': datetime.utcnow().isoformat()
            }}

            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"Low Inventory Alert - {{item_data.get('name', 'Unknown')}}",
                Message=json.dumps(message, indent=2)
            )
            logger.info(f"Low inventory alert sent for item {{item_data['itemId']}}")
    except Exception as e:
        logger.error(f"Failed to send low inventory alert: {{str(e)}}")

def create_item(event_body):
    \"\"\"Create a new inventory item\"\"\"
    try:
        # Validate required fields
        required_fields = ['name', 'quantity', 'price', 'category']
        for field in required_fields:
            if field not in event_body:
                return {{
                    'statusCode': 400,
                    'body': json.dumps({{'error': f'Missing required field: {{field}}'}})
                }}

        item_id = str(uuid.uuid4())
        item_data = {{
            'itemId': item_id,
            'version': 1,
            'name': event_body['name'],
            'description': event_body.get('description', ''),
            'quantity': int(event_body['quantity']),
            'price': Decimal(str(event_body['price'])),
            'category': event_body['category'],
            'lastUpdated': datetime.utcnow().isoformat(),
            'status': 'active'
        }}

        items_table.put_item(Item=item_data)
        log_audit_event('CREATE', item_id, new_value=item_data)
        check_low_inventory(item_data)

        return {{
            'statusCode': 201,
            'body': json.dumps(item_data, cls=DecimalEncoder)
        }}
    except Exception as e:
        logger.error(f"Error creating item: {{str(e)}}")
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': 'Internal server error'}})
        }}

def get_item(item_id):
    \"\"\"Retrieve an inventory item by ID\"\"\"
    try:
        response = items_table.query(
            KeyConditionExpression='itemId = :itemId',
            ExpressionAttributeValues={{':itemId': item_id}},
            ScanIndexForward=False,  # Get latest version
            Limit=1
        )

        if not response['Items']:
            return {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Item not found'}})
            }}

        item = response['Items'][0]
        return {{
            'statusCode': 200,
            'body': json.dumps(item, cls=DecimalEncoder)
        }}
    except Exception as e:
        logger.error(f"Error retrieving item {{item_id}}: {{str(e)}}")
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': 'Internal server error'}})
        }}

def get_all_items():
    \"\"\"Retrieve all inventory items\"\"\"
    try:
        response = items_table.scan()
        items = response['Items']

        return {{
            'statusCode': 200,
            'body': json.dumps({{
                'items': items,
                'count': len(items)
            }}, cls=DecimalEncoder)
        }}
    except Exception as e:
        logger.error(f"Error retrieving all items: {{str(e)}}")
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': 'Internal server error'}})
        }}

def update_item(item_id, event_body):
    \"\"\"Update an existing inventory item\"\"\"
    try:
        # Get current item for audit trail
        current_response = items_table.query(
            KeyConditionExpression='itemId = :itemId',
            ExpressionAttributeValues={{':itemId': item_id}},
            ScanIndexForward=False,
            Limit=1
        )

        if not current_response['Items']:
            return {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Item not found'}})
            }}

        current_item = current_response['Items'][0]
        new_version = current_item['version'] + 1

        # Update item with new version
        updated_item = current_item.copy()
        updated_item.update({{
            'version': new_version,
            'lastUpdated': datetime.utcnow().isoformat()
        }})

        # Apply updates from request body
        updatable_fields = ['name', 'description', 'quantity', 'price', 'category', 'status']
        for field in updatable_fields:
            if field in event_body:
                if field == 'quantity':
                    updated_item[field] = int(event_body[field])
                elif field == 'price':
                    updated_item[field] = Decimal(str(event_body[field]))
                else:
                    updated_item[field] = event_body[field]

        items_table.put_item(Item=updated_item)
        log_audit_event('UPDATE', item_id, old_value=current_item, new_value=updated_item)
        check_low_inventory(updated_item)

        return {{
            'statusCode': 200,
            'body': json.dumps(updated_item, cls=DecimalEncoder)
        }}
    except Exception as e:
        logger.error(f"Error updating item {{item_id}}: {{str(e)}}")
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': 'Internal server error'}})
        }}

def delete_item(item_id):
    \"\"\"Delete an inventory item (soft delete by setting status to 'deleted')\"\"\"
    try:
        # Get current item for audit trail
        current_response = items_table.query(
            KeyConditionExpression='itemId = :itemId',
            ExpressionAttributeValues={{':itemId': item_id}},
            ScanIndexForward=False,
            Limit=1
        )

        if not current_response['Items']:
            return {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Item not found'}})
            }}

        current_item = current_response['Items'][0]
        new_version = current_item['version'] + 1

        # Soft delete by updating status
        deleted_item = current_item.copy()
        deleted_item.update({{
            'version': new_version,
            'status': 'deleted',
            'lastUpdated': datetime.utcnow().isoformat()
        }})

        items_table.put_item(Item=deleted_item)
        log_audit_event('DELETE', item_id, old_value=current_item, new_value=deleted_item)

        return {{
            'statusCode': 200,
            'body': json.dumps({{'message': 'Item deleted successfully'}})
        }}
    except Exception as e:
        logger.error(f"Error deleting item {{item_id}}: {{str(e)}}")
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': 'Internal server error'}})
        }}

def lambda_handler(event, context):
    \"\"\"Main Lambda handler for all CRUD operations\"\"\"
    logger.info(f"Received event: {{json.dumps(event)}}")

    try:
        http_method = event['httpMethod']
        path = event['path']
        path_parameters = event.get('pathParameters') or {{}}

        # Parse request body if present
        body = {{}}
        if event.get('body'):
            body = json.loads(event['body'])

        # Route based on HTTP method and path
        if http_method == 'POST' and path == '/items':
            response = create_item(body)
        elif http_method == 'GET' and path == '/items':
            response = get_all_items()
        elif http_method == 'GET' and path.startswith('/items/'):
            item_id = path_parameters.get('itemId')
            if not item_id:
                response = {{'statusCode': 400, 'body': json.dumps({{'error': 'Missing itemId'}})}}
            else:
                response = get_item(item_id)
        elif http_method == 'PUT' and path.startswith('/items/'):
            item_id = path_parameters.get('itemId')
            if not item_id:
                response = {{'statusCode': 400, 'body': json.dumps({{'error': 'Missing itemId'}})}}
            else:
                response = update_item(item_id, body)
        elif http_method == 'DELETE' and path.startswith('/items/'):
            item_id = path_parameters.get('itemId')
            if not item_id:
                response = {{'statusCode': 400, 'body': json.dumps({{'error': 'Missing itemId'}})}}
            else:
                response = delete_item(item_id)
        else:
            response = {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Endpoint not found'}})
            }}

        # Add CORS headers
        response['headers'] = {{
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }}

        return response

    except Exception as e:
        logger.error(f"Unhandled error: {{str(e)}}")
        return {{
            'statusCode': 500,
            'headers': {{
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }},
            'body': json.dumps({{'error': 'Internal server error'}})
        }}
"""

# Lambda function for inventory API with complete CRUD operations
inventory_api_lambda = aws.lambda_.Function(
    get_resource_name("api-lambda"),
    name=get_resource_name("api-lambda"),
    runtime="python3.9",
    code=pulumi.Output.all(
        inventory_items_table.name,
        inventory_audit_table.name,
        inventory_alerts_topic.arn
    ).apply(lambda args: pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(
            lambda_code.format(
                items_table_name=args[0],
                audit_table_name=args[1],
                sns_topic_arn=args[2]
            )
        )
    })),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    memory_size=lambda_memory_size,
    timeout=30,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "ENVIRONMENT": environment,
            "ITEMS_TABLE_NAME": inventory_items_table.name,
            "AUDIT_TABLE_NAME": inventory_audit_table.name,
            "SNS_TOPIC_ARN": inventory_alerts_topic.arn
        }
    ),
    tags={
        "Environment": environment,
        "Project": "inventory-management",
        "Purpose": "api-handler"
    }
)

# API Gateway REST API for inventory management
inventory_api = aws.apigateway.RestApi(
    get_resource_name("api"),
    name=get_resource_name("api"),
    description=f"Inventory Management API - {environment}",
    endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
        types="REGIONAL"
    ),
    tags={
        "Environment": environment,
        "Project": "inventory-management",
        "Purpose": "rest-api"
    }
)

# API Gateway resource for /items
items_resource = aws.apigateway.Resource(
    get_resource_name("items-resource"),
    rest_api=inventory_api.id,
    parent_id=inventory_api.root_resource_id,
    path_part="items"
)

# API Gateway resource for /items/{itemId}
item_resource = aws.apigateway.Resource(
    get_resource_name("item-resource"),
    rest_api=inventory_api.id,
    parent_id=items_resource.id,
    path_part="{itemId}"
)

# Lambda permission for API Gateway
lambda_permission = aws.lambda_.Permission(
    get_resource_name("api-lambda-permission"),
    statement_id="AllowAPIGatewayInvoke",
    action="lambda:InvokeFunction",
    function=inventory_api_lambda.name,
    principal="apigateway.amazonaws.com",
    source_arn=inventory_api.execution_arn.apply(lambda arn: f"{arn}/*/*")
)

# API Gateway methods and integrations
methods_and_integrations = []

# Helper function to create method and integration
def create_method_integration(resource_id, http_method, description):
    method = aws.apigateway.Method(
        f"{get_resource_name('method')}-{http_method.lower()}-{resource_id}",
        rest_api=inventory_api.id,
        resource_id=resource_id,
        http_method=http_method,
        authorization="NONE",
        request_parameters={
            "method.request.path.itemId": True if "{itemId}" in description else False
        }
    )

    integration = aws.apigateway.Integration(
        f"{get_resource_name('integration')}-{http_method.lower()}-{resource_id}",
        rest_api=inventory_api.id,
        resource_id=resource_id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=inventory_api_lambda.invoke_arn
    )

    return method, integration

# Create all CRUD methods
# POST /items (Create)
post_method, post_integration = create_method_integration(items_resource.id, "POST", "Create item")

# GET /items (Read all)
get_all_method, get_all_integration = create_method_integration(items_resource.id, "GET", "Get all items")

# GET /items/{itemId} (Read one)
get_method, get_integration = create_method_integration(item_resource.id, "GET", "Get item by ID")

# PUT /items/{itemId} (Update)
put_method, put_integration = create_method_integration(item_resource.id, "PUT", "Update item")

# DELETE /items/{itemId} (Delete)
delete_method, delete_integration = create_method_integration(item_resource.id, "DELETE", "Delete item")

# CORS OPTIONS methods
options_items_method = aws.apigateway.Method(
    get_resource_name("options-items-method"),
    rest_api=inventory_api.id,
    resource_id=items_resource.id,
    http_method="OPTIONS",
    authorization="NONE"
)

options_items_integration = aws.apigateway.Integration(
    get_resource_name("options-items-integration"),
    rest_api=inventory_api.id,
    resource_id=items_resource.id,
    http_method=options_items_method.http_method,
    type="MOCK",
    request_templates={
        "application/json": '{"statusCode": 200}'
    }
)

options_items_method_response = aws.apigateway.MethodResponse(
    get_resource_name("options-items-method-response"),
    rest_api=inventory_api.id,
    resource_id=items_resource.id,
    http_method=options_items_method.http_method,
    status_code="200",
    response_parameters={
        "method.response.header.Access-Control-Allow-Headers": True,
        "method.response.header.Access-Control-Allow-Methods": True,
        "method.response.header.Access-Control-Allow-Origin": True
    }
)

options_items_integration_response = aws.apigateway.IntegrationResponse(
    get_resource_name("options-items-integration-response"),
    rest_api=inventory_api.id,
    resource_id=items_resource.id,
    http_method=options_items_method.http_method,
    status_code=options_items_method_response.status_code,
    response_parameters={
        "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        "method.response.header.Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
        "method.response.header.Access-Control-Allow-Origin": "'*'"
    }
)

# API Gateway deployment
api_deployment = aws.apigateway.Deployment(
    get_resource_name("api-deployment"),
    depends_on=[
        post_method, post_integration,
        get_all_method, get_all_integration,
        get_method, get_integration,
        put_method, put_integration,
        delete_method, delete_integration,
        options_items_method, options_items_integration,
        options_items_method_response, options_items_integration_response
    ],
    rest_api=inventory_api.id,
    stage_name=environment
)

# CloudWatch Log Group for API Gateway
api_log_group = aws.cloudwatch.LogGroup(
    get_resource_name("api-logs"),
    name=f"/aws/apigateway/{get_resource_name('api')}",
    retention_in_days=14 if environment == "development" else 30,
    tags={
        "Environment": environment,
        "Project": "inventory-management",
        "Purpose": "api-gateway-logs"
    }
)

# Export critical resource identifiers for operations and testing
pulumi.export("api_gateway_url", api_deployment.invoke_url)
pulumi.export("inventory_items_table_name", inventory_items_table.name)
pulumi.export("inventory_audit_table_name", inventory_audit_table.name)
pulumi.export("sns_topic_arn", inventory_alerts_topic.arn)
pulumi.export("lambda_function_name", inventory_api_lambda.name)
pulumi.export("environment", environment)

# Export API endpoints for testing
pulumi.export("api_endpoints", {
    "create_item": api_deployment.invoke_url.apply(lambda url: f"{url}/items"),
    "get_all_items": api_deployment.invoke_url.apply(lambda url: f"{url}/items"),
    "get_item": api_deployment.invoke_url.apply(lambda url: f"{url}/items/{{itemId}}"),
    "update_item": api_deployment.invoke_url.apply(lambda url: f"{url}/items/{{itemId}}"),
    "delete_item": api_deployment.invoke_url.apply(lambda url: f"{url}/items/{{itemId}}")
})

# Export resource ARNs for monitoring and operations
pulumi.export("resource_arns", {
    "inventory_items_table": inventory_items_table.arn,
    "inventory_audit_table": inventory_audit_table.arn,
    "lambda_function": inventory_api_lambda.arn,
    "api_gateway": inventory_api.arn,
    "sns_topic": inventory_alerts_topic.arn
})
```
