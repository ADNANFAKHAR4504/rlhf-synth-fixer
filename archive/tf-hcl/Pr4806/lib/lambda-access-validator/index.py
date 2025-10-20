import json
import os
import boto3
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')

# Environment variables
ACCESS_CONTROL_TABLE = os.environ['ACCESS_CONTROL_TABLE']
PRIMARY_BUCKET = os.environ['PRIMARY_BUCKET']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_BASE = 2


class AccessValidationError(Exception):
    """Custom exception for access validation errors"""
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
    raise AccessValidationError(f'Max retries ({max_retries}) exceeded')


def check_access_permission(account_id: str, prefix: str, access_level: str) -> Dict[str, Any]:
    """
    Check if account has permission to access specified prefix

    Returns dict with 'allowed', 'expiration_date', and 'reason' fields
    """
    table = dynamodb.Table(ACCESS_CONTROL_TABLE)

    def query_access():
        return table.get_item(
            Key={
                'account_id': account_id,
                'prefix': prefix
            }
        )

    try:
        response = retry_with_backoff(query_access)

        if 'Item' not in response:
            log_structured('WARNING', 'Access denied - no permission record found',
                         account_id=account_id, prefix=prefix, access_level=access_level)
            return {
                'allowed': False,
                'reason': 'No permission record found',
                'expiration_date': None
            }

        item = response['Item']

        # Check if access has expired
        if 'expiration_date' in item:
            expiration = datetime.fromisoformat(item['expiration_date'])
            if expiration < datetime.utcnow():
                log_structured('WARNING', 'Access denied - permission expired',
                             account_id=account_id, prefix=prefix,
                             expiration_date=item['expiration_date'])
                return {
                    'allowed': False,
                    'reason': 'Permission expired',
                    'expiration_date': item['expiration_date']
                }

        # Check access level matches
        if item.get('access_level') != access_level and access_level == 'write':
            # If requesting write but only have read, deny
            if item.get('access_level') == 'read':
                log_structured('WARNING', 'Access denied - insufficient permissions',
                             account_id=account_id, prefix=prefix,
                             requested=access_level, granted=item.get('access_level'))
                return {
                    'allowed': False,
                    'reason': 'Insufficient permissions (read-only)',
                    'expiration_date': item.get('expiration_date')
                }

        log_structured('INFO', 'Access granted',
                     account_id=account_id, prefix=prefix, access_level=access_level)
        return {
            'allowed': True,
            'reason': 'Permission granted',
            'expiration_date': item.get('expiration_date'),
            'created_by': item.get('created_by'),
            'created_at': item.get('created_at')
        }

    except ClientError as e:
        log_structured('ERROR', 'DynamoDB query error',
                     account_id=account_id, prefix=prefix,
                     error=str(e), error_code=e.response['Error']['Code'])
        raise AccessValidationError(f"Failed to query access control table: {str(e)}")


def send_alert(subject: str, message: str, **kwargs):
    """Send SNS alert for security events"""
    try:
        alert_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'subject': subject,
            'message': message,
            'details': kwargs
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],  # SNS subject max 100 chars
            Message=json.dumps(alert_message, indent=2)
        )

        log_structured('INFO', 'Alert sent to SNS', subject=subject)

    except Exception as e:
        log_structured('ERROR', 'Failed to send SNS alert',
                     subject=subject, error=str(e))


def lambda_handler(event, context):
    """
    Access validator Lambda function

    Validates access requests against DynamoDB access control table
    Sends alerts for denied access attempts

    Event format:
    {
        "account_id": "123456789012",
        "prefix": "data/account-a/",
        "access_level": "read" or "write",
        "principal_arn": "arn:aws:iam::123456789012:role/consumer-role"
    }
    """
    start_time = time.time()

    log_structured('INFO', 'Access validation started',
                 event=event, request_id=context.request_id)

    try:
        # Extract and validate input parameters
        account_id = event.get('account_id')
        prefix = event.get('prefix')
        access_level = event.get('access_level', 'read')
        principal_arn = event.get('principal_arn', 'unknown')

        if not account_id or not prefix:
            raise AccessValidationError("Missing required parameters: account_id and prefix")

        if access_level not in ['read', 'write']:
            raise AccessValidationError(f"Invalid access_level: {access_level}")

        # Check permissions
        result = check_access_permission(account_id, prefix, access_level)

        # Send alert if access denied
        if not result['allowed']:
            send_alert(
                subject=f"Access Denied: {account_id}",
                message=f"Access denied for account {account_id} to prefix {prefix}",
                account_id=account_id,
                prefix=prefix,
                access_level=access_level,
                principal_arn=principal_arn,
                reason=result['reason']
            )

        # Calculate execution time
        execution_time = (time.time() - start_time) * 1000

        log_structured('INFO', 'Access validation completed',
                     account_id=account_id, prefix=prefix,
                     allowed=result['allowed'], execution_time_ms=execution_time)

        return {
            'statusCode': 200 if result['allowed'] else 403,
            'body': json.dumps({
                'allowed': result['allowed'],
                'reason': result['reason'],
                'account_id': account_id,
                'prefix': prefix,
                'access_level': access_level,
                'expiration_date': result.get('expiration_date'),
                'execution_time_ms': round(execution_time, 2)
            })
        }

    except AccessValidationError as e:
        log_structured('ERROR', 'Access validation error',
                     error=str(e), request_id=context.request_id)

        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'ValidationError',
                'message': str(e)
            })
        }

    except Exception as e:
        log_structured('ERROR', 'Unexpected error during access validation',
                     error=str(e), error_type=type(e).__name__,
                     request_id=context.request_id)

        # Send alert for unexpected errors
        send_alert(
            subject="Access Validator Lambda Error",
            message=f"Unexpected error in access validator: {str(e)}",
            error=str(e),
            error_type=type(e).__name__,
            request_id=context.request_id
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'InternalError',
                'message': 'Access validation failed due to internal error'
            })
        }
