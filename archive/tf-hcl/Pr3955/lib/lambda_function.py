# lambda_function.py
"""
Demo SaaS Application Lambda Handler
Implements a multi-tenant user management system with GDPR compliance
"""

import json
import os
import boto3
import uuid
import time
import hashlib
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
events = boto3.client('events')
kms = boto3.client('kms')

# Environment variables
TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']
REGION = os.environ['REGION']
ENVIRONMENT = os.environ['ENVIRONMENT']
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'default')
KMS_KEY_ID = os.environ.get('KMS_KEY_ID')

# DynamoDB table
table = dynamodb.Table(TABLE_NAME)

# Enable X-Ray tracing (gracefully handle if not available)
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
    XRAY_AVAILABLE = True
except ImportError:
    # X-Ray SDK not available, create mock recorder
    logger.warning("X-Ray SDK not available, using mock recorder")
    XRAY_AVAILABLE = False
    
    class MockXRayRecorder:
        def put_annotation(self, key, value):
            pass
        def put_metadata(self, key, value):
            pass
        def capture(self, name):
            def decorator(func):
                return func
            return decorator
    
    xray_recorder = MockXRayRecorder()


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal to JSON float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Main Lambda handler for API Gateway requests
    Supports GET, POST, PUT, DELETE operations for user management
    """
    
    # Log the incoming event
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Add X-Ray annotations
    xray_recorder.put_annotation("environment", ENVIRONMENT)
    xray_recorder.put_annotation("region", REGION)
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        path_parameters = event.get('pathParameters', {}) or {}
        query_parameters = event.get('queryStringParameters', {}) or {}
        body = event.get('body', '{}')
        
        # Parse request body if present
        if body:
            try:
                body = json.loads(body) if isinstance(body, str) else body
            except json.JSONDecodeError:
                body = {}
        
        # Route based on HTTP method and path
        if path == '/health' or path.endswith('/health'):
            response = health_check()
        elif path == '/metrics' or path.endswith('/metrics'):
            response = get_metrics()
        elif '/users' in path and http_method == 'POST' and not path_parameters.get('userId'):
            response = create_user(body)
        elif '/users' in path and http_method == 'GET' and path_parameters.get('userId'):
            user_id = path_parameters.get('userId')
            response = get_user(user_id, query_parameters.get('tenantId'))
        elif '/users' in path and http_method == 'PUT' and path_parameters.get('userId'):
            user_id = path_parameters.get('userId')
            response = update_user(user_id, body)
        elif '/users' in path and http_method == 'DELETE' and path_parameters.get('userId'):
            user_id = path_parameters.get('userId')
            response = delete_user(user_id, query_parameters.get('tenantId'))
        elif '/users' in path and http_method == 'GET':
            response = list_users(query_parameters)
        else:
            response = {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not found', 'path': path, 'method': http_method})
            }
        
        # Send event to EventBridge for analytics
        send_analytics_event(http_method, path, response.get('statusCode', 500))
        
        # Add CORS headers
        if 'headers' not in response:
            response['headers'] = {}
        
        response['headers'].update({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'X-Region': REGION,
            'X-Environment': ENVIRONMENT
        })
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        xray_recorder.put_metadata("error", str(e))
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }


@xray_recorder.capture('health_check')
def health_check():
    """
    Health check endpoint for monitoring
    """
    try:
        # Test DynamoDB connectivity
        table.meta.client.describe_table(TableName=TABLE_NAME)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'region': REGION,
                'environment': ENVIRONMENT,
                'timestamp': int(time.time()),
                'service': 'user-management-api'
            })
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            'statusCode': 503,
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'region': REGION
            })
        }


@xray_recorder.capture('get_metrics')
def get_metrics():
    """
    Get basic metrics about the system
    """
    try:
        # Get table item count (approximate)
        response = table.meta.client.describe_table(TableName=TABLE_NAME)
        item_count = response['Table']['ItemCount']
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'metrics': {
                    'totalUsers': item_count,
                    'region': REGION,
                    'environment': ENVIRONMENT,
                    'timestamp': int(time.time())
                }
            })
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to get metrics'})
        }


@xray_recorder.capture('create_user')
def create_user(user_data):
    """
    Create a new user with GDPR-compliant data handling
    """
    try:
        # Validate required fields
        required_fields = ['email', 'name', 'tenantId']
        for field in required_fields:
            if field not in user_data:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Generate unique user ID
        user_id = str(uuid.uuid4())
        
        # Hash sensitive data for privacy
        email_hash = hashlib.sha256(user_data['email'].encode()).hexdigest()
        
        # Prepare user item
        timestamp = int(time.time())
        ttl_days = user_data.get('dataRetention', 365)
        ttl_timestamp = timestamp + (ttl_days * 24 * 60 * 60)
        
        user_item = {
            'userId': user_id,
            'tenantId': user_data['tenantId'],
            'email': user_data['email'],
            'emailHash': email_hash,
            'name': user_data['name'],
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'status': 'active',
            'gdprConsent': user_data.get('gdprConsent', False),
            'dataRetention': ttl_days,
            'region': REGION,
            'ttl': ttl_timestamp  # Auto-delete after retention period
        }
        
        # Add optional fields
        if 'metadata' in user_data:
            user_item['metadata'] = user_data['metadata']
        
        # Store in DynamoDB
        table.put_item(Item=user_item)
        
        logger.info(f"Created user: {user_id} in tenant: {user_data['tenantId']}")
        
        # Remove sensitive TTL from response
        response_item = user_item.copy()
        del response_item['ttl']
        
        return {
            'statusCode': 201,
            'body': json.dumps({
                'message': 'User created successfully',
                'user': response_item
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to create user', 'message': str(e)})
        }


@xray_recorder.capture('get_user')
def get_user(user_id, tenant_id=None):
    """
    Retrieve a user by ID
    """
    try:
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        if not tenant_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'tenantId is required as query parameter'})
            }
        
        # Get user from DynamoDB
        response = table.get_item(
            Key={
                'userId': user_id,
                'tenantId': tenant_id
            }
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'User not found'})
            }
        
        user = response['Item']
        
        # Remove sensitive fields
        if 'ttl' in user:
            del user['ttl']
        if 'emailHash' in user:
            del user['emailHash']
        
        logger.info(f"Retrieved user: {user_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'user': user}, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving user: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to retrieve user', 'message': str(e)})
        }


@xray_recorder.capture('update_user')
def update_user(user_id, update_data):
    """
    Update an existing user
    """
    try:
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        if 'tenantId' not in update_data:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'tenantId is required'})
            }
        
        tenant_id = update_data['tenantId']
        
        # Build update expression
        update_expr = "SET updatedAt = :updatedAt"
        expr_attr_values = {
            ':updatedAt': int(time.time())
        }
        
        # Add updateable fields
        updateable_fields = ['name', 'email', 'status', 'metadata', 'gdprConsent']
        for field in updateable_fields:
            if field in update_data:
                update_expr += f", {field} = :{field}"
                expr_attr_values[f':{field}'] = update_data[field]
        
        # Update in DynamoDB
        response = table.update_item(
            Key={
                'userId': user_id,
                'tenantId': tenant_id
            },
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_attr_values,
            ReturnValues='ALL_NEW'
        )
        
        user = response.get('Attributes', {})
        
        # Remove sensitive fields
        if 'ttl' in user:
            del user['ttl']
        if 'emailHash' in user:
            del user['emailHash']
        
        logger.info(f"Updated user: {user_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'User updated successfully',
                'user': user
            }, cls=DecimalEncoder)
        }
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'User not found'})
            }
        logger.error(f"Error updating user: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to update user', 'message': str(e)})
        }
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to update user', 'message': str(e)})
        }


@xray_recorder.capture('delete_user')
def delete_user(user_id, tenant_id=None):
    """
    Delete a user (GDPR right to be forgotten)
    """
    try:
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        if not tenant_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'tenantId is required as query parameter'})
            }
        
        # Delete from DynamoDB
        table.delete_item(
            Key={
                'userId': user_id,
                'tenantId': tenant_id
            }
        )
        
        logger.info(f"Deleted user: {user_id} (GDPR compliance)")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'User deleted successfully (GDPR compliance)',
                'userId': user_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to delete user', 'message': str(e)})
        }


@xray_recorder.capture('list_users')
def list_users(query_params):
    """
    List users with pagination
    """
    try:
        tenant_id = query_params.get('tenantId')
        if not tenant_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'tenantId is required as query parameter'})
            }
        
        limit = int(query_params.get('limit', 20))
        last_evaluated_key = query_params.get('lastKey')
        
        # Query parameters
        query_kwargs = {
            'IndexName': 'tenant-created-index',
            'KeyConditionExpression': '#tenantId = :tenantId',
            'ExpressionAttributeNames': {
                '#tenantId': 'tenantId'
            },
            'ExpressionAttributeValues': {
                ':tenantId': tenant_id
            },
            'Limit': min(limit, 100),  # Max 100 items
            'ScanIndexForward': False  # Descending order (newest first)
        }
        
        if last_evaluated_key:
            try:
                query_kwargs['ExclusiveStartKey'] = json.loads(last_evaluated_key)
            except:
                pass
        
        # Query DynamoDB
        response = table.query(**query_kwargs)
        
        users = response.get('Items', [])
        
        # Remove sensitive fields from all users
        for user in users:
            if 'ttl' in user:
                del user['ttl']
            if 'emailHash' in user:
                del user['emailHash']
        
        result = {
            'users': users,
            'count': len(users)
        }
        
        if 'LastEvaluatedKey' in response:
            result['lastKey'] = json.dumps(response['LastEvaluatedKey'], cls=DecimalEncoder)
        
        logger.info(f"Listed {len(users)} users for tenant: {tenant_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(result, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to list users', 'message': str(e)})
        }


@xray_recorder.capture('send_analytics_event')
def send_analytics_event(http_method, path, status_code):
    """
    Send analytics event to EventBridge for real-time tracking
    """
    try:
        event_detail = {
            'httpMethod': http_method,
            'path': path,
            'statusCode': status_code,
            'region': REGION,
            'environment': ENVIRONMENT,
            'timestamp': int(time.time())
        }
        
        events.put_events(
            Entries=[
                {
                    'Source': f'custom.tap-saas',
                    'DetailType': 'User Activity',
                    'Detail': json.dumps(event_detail),
                    'EventBusName': EVENT_BUS_NAME
                }
            ]
        )
        
        logger.debug(f"Sent analytics event: {http_method} {path}")
        
    except Exception as e:
        # Don't fail the request if analytics fails
        logger.warning(f"Failed to send analytics event: {str(e)}")


def encrypt_field(value):
    """
    Encrypt sensitive data using KMS (placeholder implementation)
    In production, use KMS encryption for PII
    """
    try:
        if not KMS_KEY_ID:
            return value
        
        # This is a simplified version. In production, use proper KMS encryption
        response = kms.encrypt(
            KeyId=KMS_KEY_ID,
            Plaintext=value.encode('utf-8')
        )
        return response['CiphertextBlob']
    except Exception as e:
        logger.warning(f"KMS encryption failed, storing plaintext: {str(e)}")
        return value


def decrypt_field(encrypted_value):
    """
    Decrypt sensitive data using KMS (placeholder implementation)
    """
    try:
        if not KMS_KEY_ID or isinstance(encrypted_value, str):
            return encrypted_value
        
        response = kms.decrypt(
            CiphertextBlob=encrypted_value
        )
        return response['Plaintext'].decode('utf-8')
    except Exception as e:
        logger.warning(f"KMS decryption failed: {str(e)}")
        return encrypted_value
