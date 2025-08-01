import json
import boto3
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
s3 = boto3.client('s3', region_name=os.environ['REGION'])

# Get environment variables
CONTENT_TABLE = os.environ['CONTENT_TABLE']
CONTENT_BUCKET = os.environ['CONTENT_BUCKET']

def lambda_handler(event, context):
    """
    Main Lambda handler for CMS content management operations
    Supports GET, POST, PUT, DELETE operations for content
    """
    try:
        http_method = event['httpMethod']
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {}) or {}
        body = event.get('body')
        
        # Parse request body if present
        if body:
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return create_response(400, {'error': 'Invalid JSON in request body'})
        
        # Route based on HTTP method
        if http_method == 'GET':
            return handle_get_content(path_parameters, query_parameters)
        elif http_method == 'POST':
            return handle_create_content(body)
        elif http_method == 'PUT':
            return handle_update_content(path_parameters, body)
        elif http_method == 'DELETE':
            return handle_delete_content(path_parameters)
        else:
            return create_response(405, {'error': 'Method not allowed'})
            
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_content(path_parameters, query_parameters):
    """Handle GET requests for content retrieval"""
    table = dynamodb.Table(CONTENT_TABLE)
    
    # If contentId is provided, get specific content
    if path_parameters and 'contentId' in path_parameters:
        content_id = path_parameters['contentId']
        try:
            response = table.get_item(Key={'contentId': content_id})
            if 'Item' in response:
                return create_response(200, response['Item'])
            else:
                return create_response(404, {'error': 'Content not found'})
        except ClientError as e:
            print(f"Error getting content: {str(e)}")
            return create_response(500, {'error': 'Failed to retrieve content'})
    
    # Otherwise, list content with optional filtering
    try:
        content_type = query_parameters.get('contentType')
        if content_type:
            # Query by content type using GSI
            response = table.query(
                IndexName='ContentTypeIndex',
                KeyConditionExpression='contentType = :ct',
                ExpressionAttributeValues={':ct': content_type},
                ScanIndexForward=False  # Sort by createdAt descending
            )
        else:
            # Scan all content
            response = table.scan()
        
        return create_response(200, {
            'items': response.get('Items', []),
            'count': response.get('Count', 0)
        })
    except ClientError as e:
        print(f"Error listing content: {str(e)}")
        return create_response(500, {'error': 'Failed to list content'})

def handle_create_content(body):
    """Handle POST requests for content creation"""
    if not body:
        return create_response(400, {'error': 'Request body is required'})
    
    # Validate required fields
    required_fields = ['title', 'contentType', 'content']
    for field in required_fields:
        if field not in body:
            return create_response(400, {'error': f'Missing required field: {field}'})
    
    table = dynamodb.Table(CONTENT_TABLE)
    content_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    # Prepare content item
    content_item = {
        'contentId': content_id,
        'title': body['title'],
        'contentType': body['contentType'],
        'content': body['content'],
        'createdAt': timestamp,
        'updatedAt': timestamp,
        'status': body.get('status', 'draft'),
        'author': body.get('author', 'anonymous'),
        'tags': body.get('tags', [])
    }
    
    try:
        # Store metadata in DynamoDB
        table.put_item(Item=content_item)
        
        # If there are file attachments, store them in S3
        if 'files' in body:
            for file_info in body['files']:
                s3_key = f"content/{content_id}/{file_info['filename']}"
                # In a real implementation, you'd handle file upload differently
                # This is a simplified example
                content_item['files'] = content_item.get('files', [])
                content_item['files'].append({
                    'filename': file_info['filename'],
                    's3Key': s3_key,
                    'contentType': file_info.get('contentType', 'application/octet-stream')
                })
        
        return create_response(201, content_item)
    except ClientError as e:
        print(f"Error creating content: {str(e)}")
        return create_response(500, {'error': 'Failed to create content'})

def handle_update_content(path_parameters, body):
    """Handle PUT requests for content updates"""
    if not path_parameters or 'contentId' not in path_parameters:
        return create_response(400, {'error': 'contentId is required'})
    
    if not body:
        return create_response(400, {'error': 'Request body is required'})
    
    content_id = path_parameters['contentId']
    table = dynamodb.Table(CONTENT_TABLE)
    
    try:
        # Check if content exists
        response = table.get_item(Key={'contentId': content_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Content not found'})
        
        existing_item = response['Item']
        timestamp = datetime.utcnow().isoformat()
        
        # Update fields
        update_expression = "SET updatedAt = :timestamp"
        expression_values = {':timestamp': timestamp}
        
        updatable_fields = ['title', 'content', 'status', 'author', 'tags']
        for field in updatable_fields:
            if field in body:
                update_expression += f", {field} = :{field}"
                expression_values[f":{field}"] = body[field]
        
        # Perform update
        table.update_item(
            Key={'contentId': content_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Get updated item
        response = table.get_item(Key={'contentId': content_id})
        return create_response(200, response['Item'])
        
    except ClientError as e:
        print(f"Error updating content: {str(e)}")
        return create_response(500, {'error': 'Failed to update content'})

def handle_delete_content(path_parameters):
    """Handle DELETE requests for content removal"""
    if not path_parameters or 'contentId' not in path_parameters:
        return create_response(400, {'error': 'contentId is required'})
    
    content_id = path_parameters['contentId']
    table = dynamodb.Table(CONTENT_TABLE)
    
    try:
        # Check if content exists and get associated files
        response = table.get_item(Key={'contentId': content_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Content not found'})
        
        content_item = response['Item']
        
        # Delete associated files from S3
        if 'files' in content_item:
            for file_info in content_item['files']:
                try:
                    s3.delete_object(Bucket=CONTENT_BUCKET, Key=file_info['s3Key'])
                except ClientError as s3_error:
                    print(f"Error deleting S3 object: {str(s3_error)}")
        
        # Delete content metadata from DynamoDB
        table.delete_item(Key={'contentId': content_id})
        
        return create_response(200, {'message': 'Content deleted successfully'})
        
    except ClientError as e:
        print(f"Error deleting content: {str(e)}")
        return create_response(500, {'error': 'Failed to delete content'})

def create_response(status_code, body):
    """Create standardized HTTP response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body, default=str)
    }