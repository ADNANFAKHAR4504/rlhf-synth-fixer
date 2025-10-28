"""
API Handler Lambda function.

Processes requests from API Gateway and interacts with DynamoDB and SNS.
"""

import json
import os
import time
from decimal import Decimal
from typing import Any, Dict

import boto3
from botocore.config import Config

# Configure boto3 with retries
boto_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', config=boto_config)
sns_client = boto3.client('sns', config=boto_config)

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for API Gateway requests.
    
    Supports:
    - POST /items: Create new item
    - GET /items: List items by status
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Parse request
        http_method = event.get('httpMethod', 'POST')
        path = event.get('path', '/items')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Route request
        if http_method == 'POST' and path == '/items':
            return create_item(body)
        elif http_method == 'GET' and path == '/items':
            query_params = event.get('queryStringParameters') or {}
            return list_items(query_params)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Not found'})
            }
            
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        
        # Send error notification
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="API Handler Error",
                Message=f"Error processing API request: {str(e)}"
            )
        except Exception as sns_error:
            print(f"Error sending SNS notification: {str(sns_error)}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }


def create_item(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new item in DynamoDB.
    
    Args:
        body: Request body with item data
        
    Returns:
        API Gateway response
    """
    # Generate item data
    item_id = body.get('item_id') or f"item-{int(time.time() * 1000)}"
    timestamp = Decimal(str(time.time()))
    
    item = {
        'item_id': item_id,
        'timestamp': timestamp,
        'status': body.get('status', 'pending'),
        'data': body.get('data', {}),
        'created_at': timestamp
    }
    
    # Store in DynamoDB
    table.put_item(Item=item)
    print(f"Created item: {item_id}")
    
    # Send success notification
    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Item Created",
            Message=f"Successfully created item: {item_id}"
        )
    except Exception as e:
        print(f"Error sending SNS notification: {str(e)}")
    
    # Convert Decimal to float for JSON serialization
    item['timestamp'] = float(item['timestamp'])
    item['created_at'] = float(item['created_at'])
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': 'Item created successfully',
            'item': item
        })
    }


def list_items(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List items from DynamoDB.
    
    Args:
        query_params: Query parameters (status filter)
        
    Returns:
        API Gateway response
    """
    status = query_params.get('status')
    
    if status:
        # Query by status using GSI
        response = table.query(
            IndexName='status-timestamp-index',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': status},
            Limit=100
        )
    else:
        # Scan all items (limited)
        response = table.scan(Limit=100)
    
    items = response.get('Items', [])
    
    # Convert Decimal to float for JSON serialization
    for item in items:
        if 'timestamp' in item:
            item['timestamp'] = float(item['timestamp'])
        if 'created_at' in item:
            item['created_at'] = float(item['created_at'])
    
    print(f"Retrieved {len(items)} items")
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'count': len(items),
            'items': items
        })
    }

