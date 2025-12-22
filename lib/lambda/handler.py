"""Lambda handler for Item Service API."""
import json
import os
import boto3
from botocore.exceptions import ClientError

# Get DynamoDB table name from environment variable
TABLE_NAME = os.environ.get("TABLE_NAME", "")

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb")


def handler(event, context):
    """
    Lambda handler for API Gateway requests.
    
    Handles GET requests to retrieve items from DynamoDB.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with status code and body
    """
    try:
        http_method = event.get("httpMethod", "GET")
        path = event.get("path", "/")
        
        # Handle GET request for /item
        if http_method == "GET" and "/item" in path:
            return get_items(event)
        
        # Default response
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": json.dumps({
                "message": "Item Service API",
                "path": path,
                "method": http_method
            })
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": str(e)
            })
        }


def get_items(event):
    """
    Get items from DynamoDB table.
    
    Args:
        event: API Gateway event with optional query parameters
        
    Returns:
        API Gateway response with items
    """
    try:
        if not TABLE_NAME:
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "error": "TABLE_NAME environment variable not set"
                })
            }
        
        table = dynamodb.Table(TABLE_NAME)
        
        # Check for specific item ID in query parameters
        query_params = event.get("queryStringParameters") or {}
        item_id = query_params.get("itemId")
        
        if item_id:
            # Get specific item
            response = table.get_item(Key={"itemId": item_id})
            item = response.get("Item")
            
            if item:
                return {
                    "statusCode": 200,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps(item)
                }
            else:
                return {
                    "statusCode": 404,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "error": f"Item with id '{item_id}' not found"
                    })
                }
        else:
            # Scan all items (limited for demo purposes)
            response = table.scan(Limit=100)
            items = response.get("Items", [])
            
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "items": items,
                    "count": len(items)
                })
            }
            
    except ClientError as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": f"DynamoDB error: {str(e)}"
            })
        }

