import json
import os
import boto3
from botocore.exceptions import ClientError

# Shared DynamoDB initialization
dynamodb = boto3.resource("dynamodb", region_name=os.getenv("REGION"))

# Table reference will differ per Lambda deployment via environment variables
table_name = os.getenv("TABLE_NAME")
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """Generic CRUD Lambda handler for table operations."""
    http_method = event.get("httpMethod")
    path_params = event.get("pathParameters") or {}
    body = event.get("body")

    try:
        if http_method == "GET":
            if path_params:
                return get_item(path_params)
            return list_items()
        elif http_method == "POST":
            return create_item(json.loads(body or "{}"))
        elif http_method == "DELETE":
            return delete_item(path_params)
        else:
            return response(405, {"error": "Method not allowed"})
    except Exception as e:
        return response(500, {"error": str(e)})

def get_item(keys):
    try:
        result = table.get_item(Key=keys)
        if "Item" not in result:
            return response(404, {"error": "Item not found"})
        return response(200, result["Item"])
    except ClientError as e:
        return response(500, {"error": e.response["Error"]["Message"]})

def list_items():
    items = table.scan().get("Items", [])
    return response(200, {"items": items})

def create_item(item_data):
    if not item_data:
        return response(400, {"error": "No item data provided"})
    table.put_item(Item=item_data)
    return response(201, {"message": "Item created"})

def delete_item(keys):
    if not keys:
        return response(400, {"error": "No key provided"})
    table.delete_item(Key=keys)
    return response(200, {"message": "Item deleted"})

def response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }
