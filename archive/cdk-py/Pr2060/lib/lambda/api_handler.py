import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from urllib.parse import unquote

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
METADATA_TABLE_NAME = os.environ['METADATA_TABLE_NAME']
UPLOAD_BUCKET_NAME = os.environ['UPLOAD_BUCKET_NAME']
table = dynamodb.Table(METADATA_TABLE_NAME)

def handler(event, context) -> Dict[str, Any]:
    """
    API Gateway handler for file processing status and metadata retrieval.
    Supports the following endpoints:
    - GET /files - List all processed files
    - GET /files/{fileId} - Get specific file metadata
    - GET /files/{fileId}/status - Get processing status
    """
    try:
        # Parse request
        http_method = event['httpMethod']
        path = event['path']
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        logger.info(f"Processing {http_method} request to {path}")
        
        # Route requests
        if http_method == 'GET':
            if path.endswith('/files'):
                return list_all_files(query_parameters)
            elif path.endswith('/status'):
                file_id = path_parameters.get('fileId')
                return get_file_status(file_id)
            elif '/files/' in path and not path.endswith('/status'):
                file_id = path_parameters.get('fileId')
                return get_file_metadata(file_id)
            else:
                return create_error_response(404, 'Endpoint not found')
        else:
            return create_error_response(405, 'Method not allowed')
            
    except Exception as e:
        logger.error(f"API handler error: {str(e)}")
        return create_error_response(500, 'Internal server error', str(e))

def list_all_files(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Lists all processed files with optional filtering.
    """
    try:
        # Parse query parameters
        limit = min(int(query_params.get('limit', 50)), 100)  # Max 100 items
        file_type = query_params.get('type')  # Filter by file type
        status = query_params.get('status')  # Filter by status
        
        # Scan DynamoDB table
        scan_params = {
            'Limit': limit
        }
        
        # Add filters if specified
        filter_expressions = []
        expression_values = {}
        
        if file_type:
            filter_expressions.append('fileType = :file_type')
            expression_values[':file_type'] = file_type
            
        if status:
            filter_expressions.append('#status = :status')
            expression_values[':status'] = status
            scan_params['ExpressionAttributeNames'] = {'#status': 'status'}
        
        if filter_expressions:
            scan_params['FilterExpression'] = ' AND '.join(filter_expressions)
            scan_params['ExpressionAttributeValues'] = expression_values
        
        response = table.scan(**scan_params)
        items = response.get('Items', [])
        
        # Format response
        files = []
        for item in items:
            file_info = {
                'fileId': item.get('fileId'),
                'fileName': item.get('fileName'),
                'fileType': item.get('fileType'),
                'fileSize': item.get('fileSize'),
                'status': item.get('status'),
                'uploadTime': item.get('uploadTime'),
                'processedTime': item.get('processedTime')
            }
            
            # Include presigned URL if file is processed successfully
            if item.get('status') == 'processed' and 'bucketName' in item:
                try:
                    presigned_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': item['bucketName'], 'Key': item['fileName']},
                        ExpiresIn=3600
                    )
                    file_info['downloadUrl'] = presigned_url
                except Exception as e:
                    logger.warning(f"Failed to generate presigned URL for {item.get('fileName')}: {str(e)}")
            
            files.append(file_info)
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'files': files,
                'count': len(files),
                'hasMore': 'LastEvaluatedKey' in response,
                'filters': {
                    'type': file_type,
                    'status': status,
                    'limit': limit
                }
            })
        }
        
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return create_error_response(500, 'Failed to retrieve files', str(e))

def get_file_metadata(file_id: str) -> Dict[str, Any]:
    """
    Retrieves complete metadata for a specific file.
    """
    try:
        if not file_id:
            return create_error_response(400, 'File ID is required')
        
        # URL decode the file ID
        file_id = unquote(file_id)
        
        # Get item from DynamoDB
        response = table.get_item(Key={'fileId': file_id})
        
        if 'Item' not in response:
            return create_error_response(404, 'File not found')
        
        item = response['Item']
        
        # Generate presigned URL if file exists and is processed
        download_url = None
        if item.get('status') == 'processed' and 'bucketName' in item:
            try:
                download_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': item['bucketName'], 'Key': item['fileName']},
                    ExpiresIn=3600
                )
            except Exception as e:
                logger.warning(f"Failed to generate presigned URL for {file_id}: {str(e)}")
        
        # Format response
        metadata = {
            'fileId': item.get('fileId'),
            'fileName': item.get('fileName'),
            'fileType': item.get('fileType'),
            'fileSize': item.get('fileSize'),
            'contentType': item.get('contentType'),
            'status': item.get('status'),
            'uploadTime': item.get('uploadTime'),
            'processedTime': item.get('processedTime'),
            'bucketName': item.get('bucketName')
        }
        
        # Add download URL if available
        if download_url:
            metadata['downloadUrl'] = download_url
        
        # Add type-specific information
        if 'analysis' in item:
            metadata['analysis'] = item['analysis']
        if 'textContent' in item:
            metadata['textPreview'] = item['textContent']
        if 'error' in item:
            metadata['error'] = item['error']
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'file': metadata})
        }
        
    except Exception as e:
        logger.error(f"Error retrieving file metadata for {file_id}: {str(e)}")
        return create_error_response(500, 'Failed to retrieve file metadata', str(e))

def get_file_status(file_id: str) -> Dict[str, Any]:
    """
    Retrieves processing status for a specific file.
    """
    try:
        if not file_id:
            return create_error_response(400, 'File ID is required')
        
        # URL decode the file ID
        file_id = unquote(file_id)
        
        # Get item from DynamoDB
        response = table.get_item(
            Key={'fileId': file_id},
            ProjectionExpression='fileId, fileName, #status, processedTime, uploadTime, #error',
            ExpressionAttributeNames={'#status': 'status', '#error': 'error'}
        )
        
        if 'Item' not in response:
            return create_error_response(404, 'File not found')
        
        item = response['Item']
        
        # Calculate processing duration if available
        processing_duration = None
        if item.get('processedTime') and item.get('uploadTime'):
            try:
                processed = datetime.fromisoformat(item['processedTime'].replace('Z', '+00:00'))
                uploaded = datetime.fromisoformat(item['uploadTime'].replace('Z', '+00:00'))
                processing_duration = (processed - uploaded).total_seconds()
            except Exception as e:
                logger.warning(f"Failed to calculate processing duration: {str(e)}")
        
        status_info = {
            'fileId': item.get('fileId'),
            'fileName': item.get('fileName'),
            'status': item.get('status'),
            'uploadTime': item.get('uploadTime'),
            'processedTime': item.get('processedTime'),
            'processingDurationSeconds': processing_duration
        }
        
        # Include error information if status is error
        if item.get('status') == 'error' and 'error' in item:
            status_info['error'] = item['error']
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'status': status_info})
        }
        
    except Exception as e:
        logger.error(f"Error retrieving file status for {file_id}: {str(e)}")
        return create_error_response(500, 'Failed to retrieve file status', str(e))

def create_error_response(status_code: int, message: str, details: Optional[str] = None) -> Dict[str, Any]:
    """
    Creates a standardized error response.
    """
    error_body = {
        'error': message,
        'statusCode': status_code,
        'timestamp': datetime.now().isoformat()
    }
    
    if details:
        error_body['details'] = details
    
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps(error_body)
    }

def get_cors_headers() -> Dict[str, str]:
    """
    Returns CORS headers for API responses.
    """
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token'
    }