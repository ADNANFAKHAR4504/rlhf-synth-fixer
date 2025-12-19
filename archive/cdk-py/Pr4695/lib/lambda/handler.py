"""Lambda handler for file upload processing"""

import json
import base64
import boto3
import logging
import os
from datetime import datetime
from typing import Dict, Any
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing file uploads.
    
    This function processes file uploads by:
    1. Validating the incoming request
    2. Decoding the base64 file content
    3. Uploading the file to S3
    4. Storing metadata in DynamoDB
    
    Args:
        event: API Gateway event containing the request body
        context: Lambda context object
        
    Returns:
        Dict containing HTTP status code and response body
    """
    try:
        # Parse the request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Validate required fields
        required_fields = ['productId', 'productName', 'price', 'fileContent']
        for field in required_fields:
            if field not in body:
                logger.warning(f"Missing required field: {field}")
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': f'Missing required field: {field}',
                        'code': 'MISSING_FIELD'
                    })
                }
        
        # Extract data from request
        product_id = body['productId']
        product_name = body['productName']
        price = float(body['price'])
        file_content = body['fileContent']
        file_name = body.get('fileName', f'upload_{product_id}_{datetime.now().isoformat()}')
        
        # Validate price
        if price < 0:
            logger.warning(f"Invalid price: {price}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Price must be non-negative',
                    'code': 'INVALID_PRICE'
                })
            }
        
        # Validate product ID and name
        if not product_id.strip() or not product_name.strip():
            logger.warning("Empty product ID or name")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Product ID and name cannot be empty',
                    'code': 'INVALID_PRODUCT_INFO'
                })
            }
        
        # Decode base64 file content
        try:
            file_data = base64.b64decode(file_content)
            if len(file_data) == 0:
                raise ValueError("Empty file content")
        except Exception as e:
            logger.error(f"Failed to decode base64 content: {str(e)}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid base64 file content',
                    'code': 'INVALID_FILE_CONTENT'
                })
            }
        
        # Get environment variables
        bucket_name = os.environ.get('BUCKET_NAME')
        table_name = os.environ.get('TABLE_NAME')
        
        if not bucket_name or not table_name:
            logger.error("Missing required environment variables")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Server configuration error',
                    'code': 'CONFIG_ERROR'
                })
            }
        
        # Upload file to S3
        s3_key = f"uploads/{product_id}/{file_name}"
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=file_data,
                ContentType='application/octet-stream'
                # Server-side encryption is handled by bucket's default encryption
            )
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
        except Exception as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to upload file',
                    'code': 'UPLOAD_ERROR'
                })
            }
        
        # Store metadata in DynamoDB
        try:
            table = dynamodb.Table(table_name)
            table.put_item(
                Item={
                    'productId': product_id,
                    'productName': product_name,
                    'price': Decimal(str(price)),
                    'fileName': file_name,
                    's3Key': s3_key,
                    'uploadTimestamp': datetime.now().isoformat(),
                    'fileSize': len(file_data)
                }
            )
            logger.info(f"Successfully stored metadata in DynamoDB for product {product_id}")
        except Exception as e:
            logger.error(f"Failed to store metadata in DynamoDB: {str(e)}")
            # Try to clean up S3 object
            try:
                s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
                logger.info(f"Cleaned up S3 object: {s3_key}")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up S3 object: {str(cleanup_error)}")
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to store metadata',
                    'code': 'METADATA_ERROR'
                })
            }
        
        logger.info(f"Successfully processed upload for product {product_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'productId': product_id,
                's3Key': s3_key,
                'fileSize': len(file_data),
                'uploadTimestamp': datetime.now().isoformat()
            })
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'code': 'INVALID_JSON'
            })
        }
    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'code': 'VALUE_ERROR'
            })
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'code': 'INTERNAL_ERROR'
            })
        }
