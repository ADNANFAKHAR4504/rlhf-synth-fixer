"""
inventory_serverless.py

This module defines the InventoryServerlessStack class for creating a complete
serverless e-commerce inventory management system using Pulumi and AWS.

The stack includes:
- API Gateway REST API for CRUD operations
- Lambda function for business logic
- DynamoDB tables for inventory and audit data
- SNS topic for inventory alerts
- IAM roles and policies with least privilege
- CloudWatch logging for monitoring
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class InventoryServerlessStackArgs:
    """
    InventoryServerlessStackArgs defines the input arguments for the InventoryServerlessStack.

    Args:
        environment_suffix (Optional[str]): Environment suffix for resource naming (e.g., 'dev', 'prod')
        tags (Optional[dict]): Optional default tags to apply to resources
        notification_email (str): Email address for SNS notifications
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        notification_email: str = "admin@example.com",
    ):
        self.environment_suffix = environment_suffix or "dev"
        self.tags = tags or {}

        # Configuration validation
        if not notification_email or "@" not in notification_email:
            raise ValueError("Valid notification_email is required")
        self.notification_email = notification_email


class InventoryServerlessStack(pulumi.ComponentResource):
    """
    Represents the serverless inventory management system Pulumi component.

    This component creates a complete serverless e-commerce inventory management system
    with CRUD operations, audit logging, and inventory monitoring capabilities.
    """

    def __init__(self, name: str, args: InventoryServerlessStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("inventory:stack:InventoryServerlessStack", name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.notification_email = args.notification_email

        # Configuration based on environment
        config = pulumi.Config()
        dynamodb_billing_mode = config.get("dynamodb_billing_mode") or (
            "PROVISIONED" if self.environment_suffix == "production" else "PAY_PER_REQUEST"
        )
        lambda_memory_size = int(
            config.get("lambda_memory_size") or (512 if self.environment_suffix == "production" else 128)
        )

        # Resource naming helper
        def get_resource_name(resource_type: str) -> str:
            return f"inventory-{resource_type}-{self.environment_suffix}"

        # DynamoDB Table 1: Primary inventory items table
        self.inventory_items_table = aws.dynamodb.Table(
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
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(enabled=True),
            tags={
                **self.tags,
                "Environment": self.environment_suffix,
                "Project": "inventory-management",
                "Purpose": "primary-inventory-storage",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # DynamoDB Table 2: Audit trail table for compliance
        self.inventory_audit_table = aws.dynamodb.Table(
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
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(enabled=True),
            tags={
                **self.tags,
                "Environment": self.environment_suffix,
                "Project": "inventory-management",
                "Purpose": "audit-trail-storage",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # SNS Topic for inventory alerts (low stock notifications)
        self.inventory_alerts_topic = aws.sns.Topic(
            get_resource_name("alerts-topic"),
            name=get_resource_name("alerts"),
            kms_master_key_id="alias/aws/sns",
            tags={
                **self.tags,
                "Environment": self.environment_suffix,
                "Project": "inventory-management",
                "Purpose": "inventory-alerts",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # SNS Topic subscription for email notifications
        self.inventory_alerts_subscription = aws.sns.TopicSubscription(
            get_resource_name("alerts-subscription"),
            topic=self.inventory_alerts_topic.arn,
            protocol="email",
            endpoint=self.notification_email,
            opts=pulumi.ResourceOptions(parent=self),
        )

        # IAM Role for Lambda function with least privilege permissions
        self.lambda_role = aws.iam.Role(
            get_resource_name("lambda-role"),
            name=get_resource_name("lambda-role"),
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                        }
                    ],
                }
            ),
            tags={
                **self.tags,
                "Environment": self.environment_suffix,
                "Project": "inventory-management",
                "Purpose": "lambda-execution-role",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # IAM Policy for Lambda function with minimal required permissions
        self.lambda_policy = aws.iam.RolePolicy(
            get_resource_name("lambda-policy"),
            role=self.lambda_role.id,
            policy=pulumi.Output.all(
                self.inventory_items_table.arn, self.inventory_audit_table.arn, self.inventory_alerts_topic.arn
            ).apply(
                lambda args: json.dumps(
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                                "Resource": [
                                    f"arn:aws:logs:us-east-1:*:log-group:/aws/lambda/{get_resource_name('api-lambda')}",
                                    f"arn:aws:logs:us-east-1:*:log-group:/aws/lambda/{get_resource_name('api-lambda')}:*",
                                ],
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:PutItem",
                                    "dynamodb:GetItem",
                                    "dynamodb:UpdateItem",
                                    "dynamodb:DeleteItem",
                                    "dynamodb:Query",
                                    "dynamodb:Scan",
                                ],
                                "Resource": [
                                    args[0],  # inventory_items_table.arn
                                    f"{args[0]}/index/*",  # GSI permissions
                                ],
                            },
                            {
                                "Effect": "Allow",
                                "Action": ["dynamodb:PutItem"],
                                "Resource": args[1],  # inventory_audit_table.arn
                            },
                            {
                                "Effect": "Allow",
                                "Action": ["sns:Publish"],
                                "Resource": args[2],  # inventory_alerts_topic.arn
                            },
                        ],
                    }
                )
            ),
            opts=pulumi.ResourceOptions(parent=self),
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
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def log_audit_event(operation, item_id, user_id="system", old_value=None, new_value=None):
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
    try:
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
            'status': 'in-stock'
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
    try:
        response = items_table.query(
            KeyConditionExpression='itemId = :itemId',
            ExpressionAttributeValues={{':itemId': item_id}},
            ScanIndexForward=False,
            Limit=1
        )

        if not response['Items']:
            return {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Item not found'}})
            }}

        item = response['Items'][0]
        
        # Check if item is out of stock
        if item.get('status') == 'out-of-stock':
            return {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Item not available - inventory is out of stock'}})
            }}
        
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
    try:
        response = items_table.scan(
            FilterExpression='#status = :in_stock_status',
            ExpressionAttributeNames={{
                '#status': 'status'
            }},
            ExpressionAttributeValues={{
                ':in_stock_status': 'in-stock'
            }}
        )
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
    try:
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
        
        # Check if item is out of stock
        if current_item.get('status') == 'out-of-stock':
            return {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Item not available - inventory is out of stock'}})
            }}
        
        current_version = current_item['version']

        # Build the update expression dynamically
        update_expression_parts = []
        expression_attribute_names = {{}}
        expression_attribute_values = {{}}
        
        # Always update lastUpdated
        update_expression_parts.append('#lastUpdated = :lastUpdated')
        expression_attribute_names['#lastUpdated'] = 'lastUpdated'
        expression_attribute_values[':lastUpdated'] = datetime.utcnow().isoformat()
        
        # Update fields from request body
        updatable_fields = ['name', 'description', 'quantity', 'price', 'category']
        for field in updatable_fields:
            if field in event_body:
                update_expression_parts.append('#' + field + ' = :' + field)
                expression_attribute_names['#' + field] = field
                
                if field == 'quantity':
                    expression_attribute_values[':' + field] = int(event_body[field])
                elif field == 'price':
                    expression_attribute_values[':' + field] = Decimal(str(event_body[field]))
                else:
                    expression_attribute_values[':' + field] = event_body[field]

        # Use update_item instead of put_item to avoid duplicates
        update_response = items_table.update_item(
            Key={{
                'itemId': item_id,
                'version': current_version
            }},
            UpdateExpression='SET ' + ', '.join(update_expression_parts),
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues='ALL_NEW'
        )
        
        updated_item = update_response['Attributes']
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
    try:
        # Get ALL versions of this item  
        all_versions_response = items_table.query(
            KeyConditionExpression='itemId = :itemId',
            ExpressionAttributeValues={{':itemId': item_id}}
        )
        
        logger.info("Query found " + str(len(all_versions_response.get('Items', []))) + " versions for item " + item_id)

        if not all_versions_response['Items']:
            return {{
                'statusCode': 404,
                'body': json.dumps({{'error': 'Item not found'}})
            }}

        # Delete all versions of this item
        items_to_delete = all_versions_response['Items']
        
        deleted_count = 0
        for item in items_to_delete:
            try:
                # Debug: Log the exact key being used
                delete_key = {{
                    'itemId': item_id,
                    'version': int(item['version'])
                }}
                logger.info("Attempting to delete with key: itemId=" + str(item_id) + ", version=" + str(item['version']) + " (type: " + str(type(item['version'])) + ")")
                
                delete_response = items_table.delete_item(
                    Key=delete_key,
                    ReturnValues='ALL_OLD'
                )
                
                logger.info("Delete response received: " + str('Attributes' in delete_response))
                
                if 'Attributes' in delete_response:
                    deleted_count += 1
                    logger.info("Successfully deleted version " + str(item['version']) + " of item " + item_id)
                else:
                    logger.warning("Delete operation completed but no item was found for version " + str(item['version']) + " of item " + item_id)
                    
            except Exception as delete_error:
                logger.error("Error deleting version " + str(item['version']) + " of item " + item_id + ": " + str(delete_error))
                # Continue deleting other versions even if one fails
        
        # Log audit event for the deletion
        log_audit_event('DELETE_ALL_VERSIONS', item_id, old_value={{'versions_deleted': len(items_to_delete)}}, new_value=None)

        return {{
            'statusCode': 200,
            'body': json.dumps({{
                'message': 'Item permanently deleted from inventory (' + str(deleted_count) + ' of ' + str(len(items_to_delete)) + ' versions removed)'
            }})
        }}
    except Exception as e:
        logger.error(f"Error deleting item {{item_id}}: {{str(e)}}")
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': 'Internal server error'}})
        }}

def patch_item_status(item_id, event_body):
    try:
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
        current_version = current_item['version']
        
        # Get the new status from request body
        new_status = event_body.get('status')
        if new_status not in ['in-stock', 'out-of-stock']:
            return {{
                'statusCode': 400,
                'body': json.dumps({{'error': 'Status must be either "in-stock" or "out-of-stock"'}})
            }}

        # Update only the status field
        update_response = items_table.update_item(
            Key={{
                'itemId': item_id,
                'version': current_version
            }},
            UpdateExpression='SET #status = :new_status, lastUpdated = :timestamp',
            ExpressionAttributeNames={{
                '#status': 'status'
            }},
            ExpressionAttributeValues={{
                ':new_status': new_status,
                ':timestamp': datetime.utcnow().isoformat()
            }},
            ReturnValues='ALL_NEW'
        )
        
        updated_item = update_response['Attributes']
        log_audit_event('PATCH_STATUS', item_id, old_value=current_item, new_value=updated_item)

        return {{
            'statusCode': 200,
            'body': json.dumps(updated_item, cls=DecimalEncoder)
        }}
    except Exception as e:
        logger.error(f"Error updating item status {{item_id}}: {{str(e)}}")
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': 'Internal server error'}})
        }}

def lambda_handler(event, context):
    logger.info(f"Received event: {{json.dumps(event)}}")

    try:
        http_method = event['httpMethod']
        path = event['path']
        path_parameters = event.get('pathParameters') or {{}}

        body = {{}}
        if event.get('body'):
            body = json.loads(event['body'])

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
        elif http_method == 'PATCH' and path.startswith('/items/'):
            item_id = path_parameters.get('itemId')
            if not item_id:
                response = {{'statusCode': 400, 'body': json.dumps({{'error': 'Missing itemId'}})}}
            else:
                response = patch_item_status(item_id, body)
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

        response['headers'] = {{
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
        self.inventory_api_lambda = aws.lambda_.Function(
            get_resource_name("api-lambda"),
            name=get_resource_name("api-lambda"),
            runtime="python3.11",
            code=pulumi.Output.all(
                self.inventory_items_table.name, self.inventory_audit_table.name, self.inventory_alerts_topic.arn
            ).apply(
                lambda args: pulumi.AssetArchive(
                    {
                        "lambda_function.py": pulumi.StringAsset(
                            lambda_code.format(
                                items_table_name=args[0], audit_table_name=args[1], sns_topic_arn=args[2]
                            )
                        )
                    }
                )
            ),
            handler="lambda_function.lambda_handler",
            role=self.lambda_role.arn,
            memory_size=lambda_memory_size,
            timeout=30,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment_suffix,
                    "ITEMS_TABLE_NAME": self.inventory_items_table.name,
                    "AUDIT_TABLE_NAME": self.inventory_audit_table.name,
                    "SNS_TOPIC_ARN": self.inventory_alerts_topic.arn,
                }
            ),
            tags={
                **self.tags,
                "Environment": self.environment_suffix,
                "Project": "inventory-management",
                "Purpose": "api-handler",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # API Gateway REST API for inventory management
        self.inventory_api = aws.apigateway.RestApi(
            get_resource_name("api"),
            name=get_resource_name("api"),
            description=f"Inventory Management API - {self.environment_suffix}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(types="REGIONAL"),
            tags={
                **self.tags,
                "Environment": self.environment_suffix,
                "Project": "inventory-management",
                "Purpose": "rest-api",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # API Gateway resource for /items
        self.items_resource = aws.apigateway.Resource(
            get_resource_name("items-resource"),
            rest_api=self.inventory_api.id,
            parent_id=self.inventory_api.root_resource_id,
            path_part="items",
            opts=pulumi.ResourceOptions(parent=self),
        )

        # API Gateway resource for /items/{itemId}
        self.item_resource = aws.apigateway.Resource(
            get_resource_name("item-resource"),
            rest_api=self.inventory_api.id,
            parent_id=self.items_resource.id,
            path_part="{itemId}",
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Lambda permission for API Gateway
        self.lambda_permission = aws.lambda_.Permission(
            get_resource_name("api-lambda-permission"),
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function=self.inventory_api_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=self.inventory_api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Helper function to create method and integration
        def create_method_integration(resource_id, http_method, resource_name_suffix):
            method = aws.apigateway.Method(
                f"{get_resource_name('method')}-{http_method.lower()}-{resource_name_suffix}",
                rest_api=self.inventory_api.id,
                resource_id=resource_id,
                http_method=http_method,
                authorization="NONE",
                request_parameters={
                    "method.request.path.itemId": True if "{itemId}" in resource_name_suffix else False
                },
                opts=pulumi.ResourceOptions(parent=self),
            )

            integration = aws.apigateway.Integration(
                f"{get_resource_name('integration')}-{http_method.lower()}-{resource_name_suffix}",
                rest_api=self.inventory_api.id,
                resource_id=resource_id,
                http_method=method.http_method,
                integration_http_method="POST",
                type="AWS_PROXY",
                uri=self.inventory_api_lambda.invoke_arn,
                opts=pulumi.ResourceOptions(parent=self),
            )

            return method, integration

        # Create all CRUD methods
        self.post_method, self.post_integration = create_method_integration(self.items_resource.id, "POST", "items")
        self.get_all_method, self.get_all_integration = create_method_integration(
            self.items_resource.id, "GET", "items"
        )
        self.get_method, self.get_integration = create_method_integration(self.item_resource.id, "GET", "item-{itemId}")
        self.put_method, self.put_integration = create_method_integration(self.item_resource.id, "PUT", "item-{itemId}")
        self.patch_method, self.patch_integration = create_method_integration(
            self.item_resource.id, "PATCH", "item-{itemId}"
        )
        self.delete_method, self.delete_integration = create_method_integration(
            self.item_resource.id, "DELETE", "item-{itemId}"
        )

        # CORS OPTIONS methods
        self.options_items_method = aws.apigateway.Method(
            get_resource_name("options-items-method"),
            rest_api=self.inventory_api.id,
            resource_id=self.items_resource.id,
            http_method="OPTIONS",
            authorization="NONE",
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.options_items_integration = aws.apigateway.Integration(
            get_resource_name("options-items-integration"),
            rest_api=self.inventory_api.id,
            resource_id=self.items_resource.id,
            http_method=self.options_items_method.http_method,
            type="MOCK",
            request_templates={"application/json": '{"statusCode": 200}'},
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.options_items_method_response = aws.apigateway.MethodResponse(
            get_resource_name("options-items-method-response"),
            rest_api=self.inventory_api.id,
            resource_id=self.items_resource.id,
            http_method=self.options_items_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": True,
                "method.response.header.Access-Control-Allow-Methods": True,
                "method.response.header.Access-Control-Allow-Origin": True,
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.options_items_integration_response = aws.apigateway.IntegrationResponse(
            get_resource_name("options-items-integration-response"),
            rest_api=self.inventory_api.id,
            resource_id=self.items_resource.id,
            http_method=self.options_items_method.http_method,
            status_code=self.options_items_method_response.status_code,
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # CORS OPTIONS methods for individual item resource /items/{itemId}
        self.options_item_method = aws.apigateway.Method(
            get_resource_name("options-item-method"),
            rest_api=self.inventory_api.id,
            resource_id=self.item_resource.id,
            http_method="OPTIONS",
            authorization="NONE",
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.options_item_integration = aws.apigateway.Integration(
            get_resource_name("options-item-integration"),
            rest_api=self.inventory_api.id,
            resource_id=self.item_resource.id,
            http_method=self.options_item_method.http_method,
            type="MOCK",
            request_templates={"application/json": '{"statusCode": 200}'},
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.options_item_method_response = aws.apigateway.MethodResponse(
            get_resource_name("options-item-method-response"),
            rest_api=self.inventory_api.id,
            resource_id=self.item_resource.id,
            http_method=self.options_item_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": True,
                "method.response.header.Access-Control-Allow-Methods": True,
                "method.response.header.Access-Control-Allow-Origin": True,
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.options_item_integration_response = aws.apigateway.IntegrationResponse(
            get_resource_name("options-item-integration-response"),
            rest_api=self.inventory_api.id,
            resource_id=self.item_resource.id,
            http_method=self.options_item_method.http_method,
            status_code=self.options_item_method_response.status_code,
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,PUT,PATCH,DELETE,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # API Gateway deployment
        self.api_deployment = aws.apigateway.Deployment(
            get_resource_name("api-deployment"),
            rest_api=self.inventory_api.id,
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[
                    self.post_method,
                    self.post_integration,
                    self.get_all_method,
                    self.get_all_integration,
                    self.get_method,
                    self.get_integration,
                    self.put_method,
                    self.put_integration,
                    self.patch_method,
                    self.patch_integration,
                    self.delete_method,
                    self.delete_integration,
                    self.options_items_method,
                    self.options_items_integration,
                    self.options_items_method_response,
                    self.options_items_integration_response,
                    self.options_item_method,
                    self.options_item_integration,
                    self.options_item_method_response,
                    self.options_item_integration_response,
                ],
            ),
        )

        # API Gateway Stage
        self.api_stage = aws.apigateway.Stage(
            get_resource_name("api-stage"),
            rest_api=self.inventory_api.id,
            deployment=self.api_deployment.id,
            stage_name=self.environment_suffix,
            opts=pulumi.ResourceOptions(parent=self),
        )

        # CloudWatch Log Group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            get_resource_name("api-logs"),
            name=f"/aws/apigateway/{get_resource_name('api')}",
            retention_in_days=14 if self.environment_suffix == "development" else 30,
            tags={
                **self.tags,
                "Environment": self.environment_suffix,
                "Project": "inventory-management",
                "Purpose": "api-gateway-logs",
            },
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Register outputs
        self.register_outputs(
            {
                "api_gateway_url": self.api_stage.invoke_url,
                "inventory_items_table_name": self.inventory_items_table.name,
                "inventory_audit_table_name": self.inventory_audit_table.name,
                "sns_topic_arn": self.inventory_alerts_topic.arn,
                "lambda_function_name": self.inventory_api_lambda.name,
                "environment": self.environment_suffix,
                "api_endpoints": {
                    "create_item": self.api_stage.invoke_url.apply(lambda url: f"{url}/items"),
                    "get_all_items": self.api_stage.invoke_url.apply(lambda url: f"{url}/items"),
                    "get_item": self.api_stage.invoke_url.apply(lambda url: f"{url}/items/{{itemId}}"),
                    "update_item": self.api_stage.invoke_url.apply(lambda url: f"{url}/items/{{itemId}}"),
                    "delete_item": self.api_stage.invoke_url.apply(lambda url: f"{url}/items/{{itemId}}"),
                },
                "resource_arns": {
                    "inventory_items_table": self.inventory_items_table.arn,
                    "inventory_audit_table": self.inventory_audit_table.arn,
                    "lambda_function": self.inventory_api_lambda.arn,
                    "api_gateway": self.inventory_api.arn,
                    "sns_topic": self.inventory_alerts_topic.arn,
                },
            }
        )
