import json
import os
import boto3
import logging
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
AUDIT_LOGS_TABLE = os.environ['AUDIT_LOGS_TABLE']
TTL_DAYS = int(os.environ.get('TTL_DAYS', '365'))

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_BASE = 2


class AccessLoggerError(Exception):
    """Custom exception for access logging errors"""
    pass


def log_structured(level: str, message: str, **kwargs):
    """Log structured JSON messages for better observability"""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'level': level,
        'message': message,
        **kwargs
    }
    logger.info(json.dumps(log_entry))


def retry_with_backoff(func, max_retries=MAX_RETRIES):
    """Execute function with exponential backoff retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code in ['Throttling', 'RequestLimitExceeded', 'ServiceUnavailable', 'ProvisionedThroughputExceededException']:
                if attempt < max_retries - 1:
                    delay = RETRY_DELAY_BASE ** (attempt + 1)
                    log_structured('WARNING', f'Retrying after {delay}s due to {error_code}',
                                 attempt=attempt + 1, max_retries=max_retries, error=str(e))
                    time.sleep(delay)
                    continue
            raise
    raise AccessLoggerError(f'Max retries ({max_retries}) exceeded')


def extract_account_id(principal_arn: str) -> str:
    """Extract account ID from principal ARN"""
    try:
        # ARN format: arn:aws:iam::123456789012:role/role-name
        parts = principal_arn.split(':')
        if len(parts) >= 5:
            return parts[4]
        return 'unknown'
    except Exception:
        return 'unknown'


def calculate_bytes_transferred(event_detail: Dict[str, Any]) -> int:
    """Calculate bytes transferred from event details"""
    try:
        # For S3 GetObject events
        if 'responseElements' in event_detail:
            content_length = event_detail.get('responseElements', {}).get('x-amz-content-length')
            if content_length:
                return int(content_length)

        # For S3 PutObject events
        if 'requestParameters' in event_detail:
            content_length = event_detail.get('requestParameters', {}).get('Content-Length')
            if content_length:
                return int(content_length)

        return 0
    except Exception:
        return 0


def write_audit_log(audit_record: Dict[str, Any]):
    """Write audit record to DynamoDB with TTL"""
    table = dynamodb.Table(AUDIT_LOGS_TABLE)

    # Calculate TTL (current time + TTL_DAYS)
    ttl_timestamp = int((datetime.utcnow() + timedelta(days=TTL_DAYS)).timestamp())

    # Add TTL to record
    audit_record['ttl'] = ttl_timestamp

    def put_item():
        return table.put_item(Item=audit_record)

    try:
        retry_with_backoff(put_item)
        log_structured('INFO', 'Audit log written to DynamoDB',
                     request_id=audit_record.get('request_id'),
                     account_id=audit_record.get('account_id'))

    except ClientError as e:
        log_structured('ERROR', 'Failed to write audit log to DynamoDB',
                     request_id=audit_record.get('request_id'),
                     error=str(e), error_code=e.response['Error']['Code'])
        raise AccessLoggerError(f"Failed to write audit log: {str(e)}")


def send_custom_metrics(account_id: str, action: str, bytes_transferred: int, success: bool):
    """Send custom CloudWatch metrics for access tracking"""
    try:
        metric_data = [
            {
                'MetricName': 'AccessCount',
                'Dimensions': [
                    {'Name': 'AccountId', 'Value': account_id},
                    {'Name': 'Action', 'Value': action}
                ],
                'Value': 1,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'BytesTransferred',
                'Dimensions': [
                    {'Name': 'AccountId', 'Value': account_id},
                    {'Name': 'Action', 'Value': action}
                ],
                'Value': bytes_transferred,
                'Unit': 'Bytes',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'SuccessRate',
                'Dimensions': [
                    {'Name': 'AccountId', 'Value': account_id}
                ],
                'Value': 1 if success else 0,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            }
        ]

        cloudwatch.put_metric_data(
            Namespace='CrossAccountS3Sharing',
            MetricData=metric_data
        )

        log_structured('INFO', 'Custom metrics sent to CloudWatch',
                     account_id=account_id, action=action)

    except Exception as e:
        # Don't fail the function if metrics fail
        log_structured('ERROR', 'Failed to send custom metrics',
                     account_id=account_id, error=str(e))


def lambda_handler(event, context):
    """
    Access logger Lambda function

    Processes CloudTrail S3 access events and writes detailed audit logs to DynamoDB
    Also publishes custom CloudWatch metrics for access tracking

    Triggered by EventBridge from CloudTrail events
    """
    start_time = time.time()

    log_structured('INFO', 'Access logging started',
                 request_id=context.request_id)

    try:
        # Extract CloudTrail event details
        if 'detail' not in event:
            raise AccessLoggerError("Invalid event format: missing 'detail' field")

        detail = event['detail']

        # Extract event information
        event_time = detail.get('eventTime', datetime.utcnow().isoformat())
        event_name = detail.get('eventName', 'unknown')
        request_id = detail.get('requestID', hashlib.md5(json.dumps(detail).encode()).hexdigest())
        source_ip = detail.get('sourceIPAddress', 'unknown')
        user_agent = detail.get('userAgent', 'unknown')

        # Extract principal information
        user_identity = detail.get('userIdentity', {})
        principal_arn = user_identity.get('arn', 'unknown')
        principal_type = user_identity.get('type', 'unknown')
        account_id = user_identity.get('accountId') or extract_account_id(principal_arn)

        # Extract S3 object information
        request_parameters = detail.get('requestParameters', {})
        bucket_name = request_parameters.get('bucketName', 'unknown')
        object_key = request_parameters.get('key', 'unknown')

        # Calculate bytes transferred
        bytes_transferred = calculate_bytes_transferred(detail)

        # Determine success status
        error_code = detail.get('errorCode')
        error_message = detail.get('errorMessage')
        success = error_code is None

        # Build audit record
        audit_record = {
            'timestamp': event_time,
            'request_id': request_id,
            'account_id': account_id,
            'principal_arn': principal_arn,
            'principal_type': principal_type,
            'action': event_name,
            'bucket_name': bucket_name,
            'object_key': object_key,
            'bytes_transferred': bytes_transferred,
            'source_ip': source_ip,
            'user_agent': user_agent,
            'success': success,
            'error_code': error_code or 'none',
            'error_message': error_message or 'none',
            'event_source': detail.get('eventSource', 's3.amazonaws.com'),
            'aws_region': detail.get('awsRegion', 'unknown'),
            'logged_at': datetime.utcnow().isoformat()
        }

        # Write to DynamoDB
        write_audit_log(audit_record)

        # Send custom CloudWatch metrics
        send_custom_metrics(
            account_id=account_id,
            action=event_name,
            bytes_transferred=bytes_transferred,
            success=success
        )

        # Calculate execution time
        execution_time = (time.time() - start_time) * 1000

        log_structured('INFO', 'Access logging completed',
                     request_id=request_id, account_id=account_id,
                     action=event_name, success=success,
                     execution_time_ms=execution_time)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Access log recorded successfully',
                'request_id': request_id,
                'account_id': account_id,
                'action': event_name,
                'success': success,
                'execution_time_ms': round(execution_time, 2)
            })
        }

    except AccessLoggerError as e:
        log_structured('ERROR', 'Access logging error',
                     error=str(e), request_id=context.request_id)

        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'LoggerError',
                'message': str(e)
            })
        }

    except Exception as e:
        log_structured('ERROR', 'Unexpected error during access logging',
                     error=str(e), error_type=type(e).__name__,
                     request_id=context.request_id)

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'InternalError',
                'message': 'Access logging failed due to internal error'
            })
        }
