import json
import os
import boto3
import logging
from datetime import datetime
from botocore.exceptions import ClientError, BotoCoreError
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients with retry configuration
config = boto3.session.Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

s3_client = boto3.client('s3', config=config)
dynamodb = boto3.resource('dynamodb', config=config)
sns_client = boto3.client('sns', config=config)

# Environment variables with validation
try:
    S3_BUCKET = os.environ['S3_BUCKET_NAME']
    DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE_NAME']
    SNS_TOPIC = os.environ['SNS_TOPIC_ARN']
    REGION = os.environ.get('REGION', 'us-west-2')
except KeyError as e:
    logger.error(f"Missing required environment variable: {e}")
    raise

# Constants
MAX_S3_OBJECT_SIZE = 10 * 1024 * 1024  # 10MB
MAX_BODY_SIZE = 256 * 1024  # 256KB for API Gateway
MAX_S3_OBJECTS_PER_RUN = 100

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler function that processes events from API Gateway or EventBridge.

    Args:
        event: Event data from trigger source
        context: Lambda context object

    Returns:
        Response dict with statusCode and body
    """
    request_id = context.request_id if context else 'unknown'

    try:
        logger.info(f"Processing request {request_id}", extra={
            'request_id': request_id,
            'event_type': 'api' if 'httpMethod' in event else 'scheduled'
        })

        # Validate context
        if context:
            remaining_time = context.get_remaining_time_in_millis()
            if remaining_time < 5000:  # Less than 5 seconds remaining
                logger.warning(f"Low remaining execution time: {remaining_time}ms")

        # Determine if triggered by API Gateway or EventBridge
        if 'httpMethod' in event:
            # API Gateway trigger
            response = handle_api_request(event, context)
        else:
            # EventBridge scheduled trigger
            response = handle_scheduled_task(context)

        logger.info(f"Request {request_id} completed successfully")
        return response

    except (ClientError, BotoCoreError) as e:
        error_msg = f"AWS service error in request {request_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        send_error_notification(error_msg, request_id)

        if 'httpMethod' in event:
            return create_error_response(503, 'Service temporarily unavailable')
        raise

    except ValueError as e:
        error_msg = f"Validation error in request {request_id}: {str(e)}"
        logger.error(error_msg)

        if 'httpMethod' in event:
            return create_error_response(400, str(e))
        raise

    except Exception as e:
        error_msg = f"Unexpected error in request {request_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        send_error_notification(error_msg, request_id)

        if 'httpMethod' in event:
            return create_error_response(500, 'Internal server error')
        raise

def create_error_response(status_code: int, message: str) -> Dict[str, Any]:
    """
    Create a standardized error response for API Gateway.

    Args:
        status_code: HTTP status code
        message: Error message

    Returns:
        Formatted error response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps({
            'error': message,
            'timestamp': datetime.utcnow().isoformat()
        })
    }


def validate_api_request(event: Dict[str, Any]) -> None:
    """
    Validate API Gateway request.

    Args:
        event: API Gateway event

    Raises:
        ValueError: If validation fails
    """
    # Validate HTTP method
    http_method = event.get('httpMethod', '')
    if http_method not in ['GET', 'POST', 'OPTIONS']:
        raise ValueError(f"Unsupported HTTP method: {http_method}")

    # Handle OPTIONS for CORS preflight
    if http_method == 'OPTIONS':
        return

    # Validate body size for POST requests
    if http_method == 'POST':
        body = event.get('body', '')
        if len(body) > MAX_BODY_SIZE:
            raise ValueError(f"Request body exceeds maximum size of {MAX_BODY_SIZE} bytes")


def handle_api_request(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle API Gateway requests with comprehensive validation and error handling.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    try:
        # Validate request
        validate_api_request(event)

        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                },
                'body': ''
            }

        # Parse request body
        body_str = event.get('body', '{}')
        if not body_str:
            body_str = '{}'

        try:
            body = json.loads(body_str)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request body: {e}")
            raise ValueError('Invalid JSON in request body')

        # Validate body is a dict
        if not isinstance(body, dict):
            raise ValueError('Request body must be a JSON object')

        # Process the request
        result = process_data(body)

        # Store in DynamoDB with retry logic
        store_in_dynamodb(result)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'result': result,
                'timestamp': datetime.utcnow().isoformat()
            }, default=str)
        }

    except ValueError as e:
        # Already logged in main handler
        return create_error_response(400, str(e))
    except (ClientError, BotoCoreError) as e:
        # Already logged in main handler
        return create_error_response(503, 'Service temporarily unavailable')

def handle_scheduled_task(context: Any) -> Dict[str, Any]:
    """
    Handle scheduled tasks from EventBridge with improved error handling.

    Args:
        context: Lambda context

    Returns:
        Response dict
    """
    logger.info("Starting scheduled task")

    processed_count = 0
    error_count = 0
    errors = []

    try:
        # List objects in S3 bucket with pagination
        paginator = s3_client.get_paginator('list_objects_v2')
        page_iterator = paginator.paginate(
            Bucket=S3_BUCKET,
            MaxKeys=100,
            PaginationConfig={'MaxItems': MAX_S3_OBJECTS_PER_RUN}
        )

        for page in page_iterator:
            # Check remaining execution time
            if context and context.get_remaining_time_in_millis() < 10000:
                logger.warning("Approaching timeout, stopping S3 object processing")
                break

            if 'Contents' not in page:
                logger.info("No objects found in S3 bucket")
                continue

            for obj in page['Contents']:
                try:
                    # Skip objects that are too large
                    if obj['Size'] > MAX_S3_OBJECT_SIZE:
                        logger.warning(f"Skipping large object: {obj['Key']} (size: {obj['Size']} bytes)")
                        continue

                    process_s3_object(obj['Key'])
                    processed_count += 1

                except Exception as e:
                    error_count += 1
                    error_msg = f"Failed to process {obj['Key']}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)

                    # Stop processing if too many errors
                    if error_count > 10:
                        logger.error("Too many errors, stopping scheduled task")
                        break

        result_msg = f"Scheduled task completed: {processed_count} objects processed, {error_count} errors"
        logger.info(result_msg)

        # Send notification if there were errors
        if error_count > 0:
            send_error_notification(
                f"{result_msg}\nErrors:\n" + "\n".join(errors[:5]),
                'scheduled-task'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': result_msg,
                'processed': processed_count,
                'errors': error_count
            })
        }

    except ClientError as e:
        error_msg = f"Error accessing S3: {str(e)}"
        logger.error(error_msg, exc_info=True)
        send_error_notification(error_msg, 'scheduled-task')
        raise

def process_s3_object(key: str) -> None:
    """
    Process individual S3 object with validation and error handling.

    Args:
        key: S3 object key

    Raises:
        Exception: If processing fails
    """
    logger.info(f"Processing S3 object: {key}")

    try:
        # Validate key format
        if not key or key.startswith('/'):
            raise ValueError(f"Invalid S3 key: {key}")

        # Get object from S3
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)

        # Read content with size validation
        content_length = response.get('ContentLength', 0)
        if content_length > MAX_S3_OBJECT_SIZE:
            raise ValueError(f"Object size {content_length} exceeds maximum {MAX_S3_OBJECT_SIZE}")

        content = response['Body'].read().decode('utf-8')

        # Validate content is not empty
        if not content.strip():
            logger.warning(f"Empty content in S3 object: {key}")
            return

        # Process the content
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in S3 object {key}: {e}")
            raise ValueError(f"Invalid JSON content in {key}")

        result = process_data(data)

        # Store processed data
        store_in_dynamodb(result, source='s3', source_key=key)

        logger.info(f"Successfully processed S3 object: {key}")

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        if error_code == 'NoSuchKey':
            logger.error(f"S3 object not found: {key}")
        elif error_code == 'AccessDenied':
            logger.error(f"Access denied to S3 object: {key}")
        else:
            logger.error(f"Error accessing S3 object {key}: {e}")
        raise

    except Exception as e:
        logger.error(f"Error processing S3 object {key}: {e}", exc_info=True)
        raise

def process_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process incoming data with validation.

    Args:
        data: Input data to process

    Returns:
        Processed data dict

    Raises:
        ValueError: If data is invalid
    """
    if not isinstance(data, dict):
        raise ValueError("Data must be a dictionary")

    # Sanitize and validate data
    sanitized_data = {}
    for key, value in data.items():
        # Skip internal/private keys
        if key.startswith('_'):
            continue

        # Limit string lengths to prevent abuse
        if isinstance(value, str) and len(value) > 10000:
            logger.warning(f"Truncating long string value for key: {key}")
            value = value[:10000]

        sanitized_data[key] = value

    # Add your business logic here
    processed_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'data': sanitized_data,
        'processed': True,
        'processing_region': REGION
    }

    return processed_data

def store_in_dynamodb(data: Dict[str, Any], source: str = 'api', source_key: Optional[str] = None) -> None:
    """
    Store data in DynamoDB with retry logic and validation.

    Args:
        data: Data to store
        source: Source of the data (api, s3, etc.)
        source_key: Optional key identifying the source

    Raises:
        ClientError: If DynamoDB operation fails
    """
    if not data:
        raise ValueError("Cannot store empty data")

    table = dynamodb.Table(DYNAMODB_TABLE)

    timestamp = datetime.utcnow()
    item = {
        'pk': f"{source}#{timestamp.strftime('%Y-%m-%d')}",
        'sk': f"{timestamp.isoformat()}#{source_key or 'direct'}",
        'data': json.dumps(data, default=str),
        'source': source,
        'created_at': timestamp.isoformat(),
        'ttl': int(timestamp.timestamp()) + (90 * 24 * 60 * 60)  # 90 days TTL
    }

    # Add source_key to item if provided
    if source_key:
        item['source_key'] = source_key

    try:
        # Use conditional expression to prevent overwriting
        table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)'
        )
        logger.info(f"Data stored in DynamoDB: {item['pk']}#{item['sk']}")

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')

        if error_code == 'ConditionalCheckFailedException':
            # Item already exists, this is OK
            logger.warning(f"Item already exists in DynamoDB: {item['pk']}#{item['sk']}")
            return
        elif error_code == 'ProvisionedThroughputExceededException':
            logger.error(f"DynamoDB throughput exceeded: {e}")
            send_error_notification(f"DynamoDB throughput exceeded", 'dynamodb-error')
            raise
        elif error_code == 'ResourceNotFoundException':
            logger.error(f"DynamoDB table not found: {DYNAMODB_TABLE}")
            send_error_notification(f"DynamoDB table not found: {DYNAMODB_TABLE}", 'dynamodb-error')
            raise
        else:
            logger.error(f"Error storing in DynamoDB: {e}", exc_info=True)
            send_error_notification(f"DynamoDB write error: {e}", 'dynamodb-error')
            raise

def send_error_notification(error_message: str, request_id: str = 'unknown') -> None:
    """
    Send error notification via SNS with retry logic.

    Args:
        error_message: Error message to send
        request_id: Request ID for tracking
    """
    if not error_message:
        logger.warning("Empty error message, skipping notification")
        return

    try:
        # Truncate very long error messages
        if len(error_message) > 8000:
            error_message = error_message[:8000] + "... (truncated)"

        message = {
            'error': error_message,
            'function': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
            'request_id': request_id,
            'timestamp': datetime.utcnow().isoformat(),
            'region': REGION
        }

        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject=f'Lambda Error - {request_id}',
            Message=json.dumps(message, indent=2),
            MessageAttributes={
                'error_type': {
                    'DataType': 'String',
                    'StringValue': 'lambda_error'
                },
                'severity': {
                    'DataType': 'String',
                    'StringValue': 'high'
                }
            }
        )
        logger.info(f"Error notification sent for request {request_id}")

    except ClientError as e:
        # Don't raise exception on notification failure to avoid cascading errors
        logger.error(f"Failed to send SNS notification: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Unexpected error sending notification: {e}", exc_info=True)