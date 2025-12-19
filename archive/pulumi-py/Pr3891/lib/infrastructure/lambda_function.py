"""
Lambda function module for the serverless infrastructure.

This module creates Lambda functions with proper packaging, event triggers,
and integration with other AWS services.
"""

import json
from typing import Any, Dict, Optional

from pulumi import AssetArchive, FileArchive, ResourceOptions, StringAsset
from pulumi_aws import lambda_ as lambda_aws

from .config import InfrastructureConfig


class LambdaStack:
    """
    Lambda stack for managing serverless functions.
    
    Creates Lambda functions with proper packaging, environment variables,
    and integration with API Gateway, DynamoDB, and S3.
    """
    
    def __init__(self, config: InfrastructureConfig, iam_outputs: Dict[str, Any], provider: Optional[Any] = None):
        """
        Initialize Lambda stack.
        
        Args:
            config: Infrastructure configuration
            iam_outputs: IAM stack outputs for role ARNs
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self.iam_outputs = iam_outputs
        
        # Create Lambda function code
        self._create_lambda_code()
        
        # Create main Lambda function
        self._create_main_lambda()
        
        # Create Lambda function for S3 event processing
        self._create_s3_processor_lambda()
    
    def _create_lambda_code(self):
        """Create Lambda function code with proper error handling and logging."""
        lambda_code = '''
import json
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for API Gateway requests.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Route requests based on method and path
        if http_method == 'GET' and path == '/health':
            return _handle_health_check()
        elif http_method == 'GET' and path.startswith('/items'):
            return _handle_get_items(event)
        elif http_method == 'POST' and path == '/items':
            return _handle_create_item(event)
        elif http_method == 'PUT' and path.startswith('/items/'):
            return _handle_update_item(event)
        elif http_method == 'DELETE' and path.startswith('/items/'):
            return _handle_delete_item(event)
        else:
            return _create_response(404, {"error": "Not Found"})
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return _create_response(500, {"error": "Internal Server Error"})

def _handle_health_check() -> Dict[str, Any]:
    """Handle health check endpoint."""
    return _create_response(200, {"status": "healthy", "service": "serverless-api"})

def _handle_get_items(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GET /items endpoint."""
    try:
        table_name = event.get('pathParameters', {}).get('table', 'main')
        table = dynamodb.Table(table_name)
        
        # Scan table (in production, use Query with proper indexes)
        response = table.scan()
        items = response.get('Items', [])
        
        return _create_response(200, {"items": items})
    except Exception as e:
        logger.error(f"Error getting items: {str(e)}")
        return _create_response(500, {"error": "Failed to retrieve items"})

def _handle_create_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle POST /items endpoint."""
    try:
        body = json.loads(event.get('body', '{}'))
        table_name = body.get('table', 'main')
        table = dynamodb.Table(table_name)
        
        # Generate item ID
        import uuid
        item_id = str(uuid.uuid4())
        body['id'] = item_id
        
        # Put item in DynamoDB
        table.put_item(Item=body)
        
        return _create_response(201, {"id": item_id, "item": body})
    except Exception as e:
        logger.error(f"Error creating item: {str(e)}")
        return _create_response(500, {"error": "Failed to create item"})

def _handle_update_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle PUT /items/{id} endpoint."""
    try:
        item_id = event.get('pathParameters', {}).get('id')
        if not item_id:
            return _create_response(400, {"error": "Item ID required"})
        
        body = json.loads(event.get('body', '{}'))
        table_name = body.get('table', 'main')
        table = dynamodb.Table(table_name)
        
        # Update item in DynamoDB
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression='SET #data = :data, #updated_at = :updated_at',
            ExpressionAttributeNames={
                '#data': 'data',
                '#updated_at': 'updated_at'
            },
            ExpressionAttributeValues={
                ':data': body.get('data', {}),
                ':updated_at': str(int(time.time()))
            },
            ReturnValues='ALL_NEW'
        )
        
        return _create_response(200, {"item": response.get('Attributes')})
    except Exception as e:
        logger.error(f"Error updating item: {str(e)}")
        return _create_response(500, {"error": "Failed to update item"})

def _handle_delete_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle DELETE /items/{id} endpoint."""
    try:
        item_id = event.get('pathParameters', {}).get('id')
        if not item_id:
            return _create_response(400, {"error": "Item ID required"})
        
        table_name = event.get('queryStringParameters', {}).get('table', 'main')
        table = dynamodb.Table(table_name)
        
        # Delete item from DynamoDB
        table.delete_item(Key={'id': item_id})
        
        return _create_response(200, {"message": "Item deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        return _create_response(500, {"error": "Failed to delete item"})

def _create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body)
    }
'''
        
        # Create deployment package using inline code
        self.lambda_code_archive = AssetArchive({
            'lambda_function.py': StringAsset(lambda_code),
            'requirements.txt': StringAsset('boto3>=1.26.0\nbotocore>=1.29.0\n')
        })
    
    def _create_main_lambda(self):
        """Create main Lambda function for API Gateway."""
        lambda_config = self.config.get_lambda_config('main')
        
        self.main_lambda = lambda_aws.Function(
            lambda_config['function_name'],
            name=lambda_config['function_name'],
            runtime=lambda_config['runtime'],
            handler=lambda_config['handler'],
            code=self.lambda_code_archive,
            role=self.iam_outputs['lambda_execution_role_arn'],
            timeout=lambda_config['timeout'],
            memory_size=lambda_config['memory_size'],
            environment={
                'variables': {
                    'DYNAMODB_TABLE_NAME': self.config.get_naming_convention('dynamodb', 'main'),
                    'S3_BUCKET_NAME': self.config.get_naming_convention('s3', 'static-assets'),
                    'LOG_LEVEL': 'INFO'
                }
            },
            tags=lambda_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_s3_processor_lambda(self):
        """Create Lambda function for S3 event processing."""
        s3_processor_code = '''
import json
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    S3 event processor Lambda handler.
    
    Processes S3 events and updates DynamoDB with file metadata.
    
    Args:
        event: S3 event
        context: Lambda context
        
    Returns:
        Processing result
    """
    try:
        logger.info(f"Processing S3 event: {json.dumps(event)}")
        
        # Process each record in the event
        for record in event.get('Records', []):
            if record.get('eventName', '').startswith('ObjectCreated'):
                _process_object_created(record)
            elif record.get('eventName', '').startswith('ObjectRemoved'):
                _process_object_removed(record)
        
        return {"statusCode": 200, "message": "Processing completed"}
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        raise e

def _process_object_created(record: Dict[str, Any]):
    """Process object created event with metadata extraction."""
    try:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']
        
        # Get file metadata
        response = s3_client.head_object(Bucket=bucket, Key=key)
        content_type = response.get('ContentType', 'application/octet-stream')
        last_modified = response.get('LastModified', '').isoformat()
        
        # For image files, create a copy in the processed bucket
        if content_type.startswith('image/'):
            # Copy image to destination bucket for processing
            destination_bucket = bucket.replace('static-assets', 'processed-images')
            destination_key = f"processed/{key.replace('uploads/', '')}"
            
            # Copy object to destination bucket
            s3_client.copy_object(
                Bucket=destination_bucket,
                CopySource={'Bucket': bucket, 'Key': key},
                Key=destination_key,
                MetadataDirective='COPY'
            )
            
            logger.info(f"Copied image to processed bucket: {destination_key}")
            
            # Store metadata with processing info
            table = dynamodb.Table('file-metadata')
            table.put_item(Item={
                'file_key': key,
                'bucket': bucket,
                'size': size,
                'content_type': content_type,
                'last_modified': last_modified,
                'status': 'processed',
                'processed_key': destination_key,
                'processed_bucket': destination_bucket
            })
        else:
            # Store metadata for non-image files
            table = dynamodb.Table('file-metadata')
            table.put_item(Item={
                'file_key': key,
                'bucket': bucket,
                'size': size,
                'content_type': content_type,
                'last_modified': last_modified,
                'status': 'processed'
            })
        
        logger.info(f"Processed file: {key}")
        
    except Exception as e:
        logger.error(f"Error processing object created: {str(e)}")
        raise e

def _process_object_removed(record: Dict[str, Any]):
    """Process object removed event."""
    try:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Remove metadata from DynamoDB
        table = dynamodb.Table('file-metadata')
        table.delete_item(Key={'file_key': key})
        
        logger.info(f"Removed file metadata: {key}")
        
    except Exception as e:
        logger.error(f"Error processing object removed: {str(e)}")
        raise e
'''
        
        # Create S3 processor deployment package using inline code
        # Note: For production, consider using Lambda Layers for heavy dependencies like Pillow
        s3_processor_archive = AssetArchive({
            'lambda_function.py': StringAsset(s3_processor_code)
        })
        
        # Create S3 processor Lambda function
        self.s3_processor_lambda = lambda_aws.Function(
            self.config.get_naming_convention('lambda', 's3-processor'),
            name=self.config.get_naming_convention('lambda', 's3-processor'),
            runtime='python3.9',
            handler='lambda_function.lambda_handler',
            code=s3_processor_archive,
            role=self.iam_outputs['lambda_execution_role_arn'],
            timeout=30,
            memory_size=128,
            environment={
                'variables': {
                    'DYNAMODB_TABLE_NAME': self.config.get_naming_convention('dynamodb', 'file-metadata'),
                    'S3_BUCKET_NAME': self.config.get_naming_convention('s3', 'static-assets'),
                    'LOG_LEVEL': 'INFO'
                }
            },
            tags=self.config.get_tags({
                'FunctionName': 's3-processor',
                'Purpose': 'S3 event processing'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def get_outputs(self) -> Dict[str, Any]:
        """
        Get Lambda stack outputs.
        
        Returns:
            Dictionary containing Lambda function outputs
        """
        return {
            "main_lambda_function_name": self.main_lambda.name,
            "main_lambda_function_arn": self.main_lambda.arn,
            "main_lambda_function_invoke_arn": self.main_lambda.invoke_arn,
            "s3_processor_lambda_function_name": self.s3_processor_lambda.name,
            "s3_processor_lambda_function_arn": self.s3_processor_lambda.arn,
            "s3_processor_lambda_function_invoke_arn": self.s3_processor_lambda.invoke_arn
        }
