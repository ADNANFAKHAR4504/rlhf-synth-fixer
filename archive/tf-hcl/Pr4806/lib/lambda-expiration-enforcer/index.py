import json
import os
import boto3
import logging
import time
from datetime import datetime
from typing import Dict, Any, List
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
ACCESS_CONTROL_TABLE = os.environ['ACCESS_CONTROL_TABLE']
PRIMARY_BUCKET = os.environ['PRIMARY_BUCKET']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_BASE = 2


class ExpirationEnforcerError(Exception):
    """Custom exception for expiration enforcer errors"""
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
    raise ExpirationEnforcerError(f'Max retries ({max_retries}) exceeded')


def query_expired_permissions() -> List[Dict[str, Any]]:
    """Query DynamoDB for expired access permissions using GSI"""
    table = dynamodb.Table(ACCESS_CONTROL_TABLE)
    expired_permissions = []

    try:
        current_date = datetime.utcnow().isoformat()

        def query_index():
            return table.query(
                IndexName='expiration-index',
                KeyConditionExpression='expiration_date < :current_date',
                ExpressionAttributeValues={
                    ':current_date': current_date
                }
            )

        # Note: This is a simplified approach. In production, you'd scan the table
        # and filter for expired entries since GSI queries need equality on hash key.
        # For this implementation, we'll scan with filter expression.

        def scan_expired():
            return table.scan(
                FilterExpression='expiration_date < :current_date',
                ExpressionAttributeValues={
                    ':current_date': current_date
                }
            )

        response = retry_with_backoff(scan_expired)
        expired_permissions = response.get('Items', [])

        # Handle pagination
        while 'LastEvaluatedKey' in response:
            def scan_next():
                return table.scan(
                    FilterExpression='expiration_date < :current_date',
                    ExpressionAttributeValues={
                        ':current_date': current_date
                    },
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )

            response = retry_with_backoff(scan_next)
            expired_permissions.extend(response.get('Items', []))

        log_structured('INFO', 'Queried expired permissions',
                     count=len(expired_permissions))

        return expired_permissions

    except Exception as e:
        log_structured('ERROR', 'Failed to query expired permissions',
                     error=str(e))
        raise ExpirationEnforcerError(f"Failed to query expired permissions: {str(e)}")


def revoke_access_permission(account_id: str, prefix: str) -> bool:
    """Delete expired permission from DynamoDB access control table"""
    table = dynamodb.Table(ACCESS_CONTROL_TABLE)

    try:
        def delete_item():
            return table.delete_item(
                Key={
                    'account_id': account_id,
                    'prefix': prefix
                }
            )

        retry_with_backoff(delete_item)

        log_structured('INFO', 'Revoked access permission',
                     account_id=account_id, prefix=prefix)

        return True

    except Exception as e:
        log_structured('ERROR', 'Failed to revoke access permission',
                     account_id=account_id, prefix=prefix, error=str(e))
        return False


def update_bucket_policy_remove_account(account_id: str, prefix: str):
    """
    Update S3 bucket policy to remove expired account access

    Note: This is a simplified implementation. In production, you would:
    1. Get current bucket policy
    2. Parse JSON
    3. Remove specific statement for this account/prefix
    4. Put updated policy back

    For this implementation, we're logging the action as the bucket policy
    is managed by Terraform and would be updated on next deployment.
    """
    log_structured('INFO', 'Bucket policy update recommended',
                 account_id=account_id, prefix=prefix,
                 message='Manual bucket policy update or Terraform re-apply recommended')

    # In a production system, you would implement bucket policy modification here
    # However, since bucket policy is managed by Terraform, we'll just log
    return True


def send_revocation_notification(revoked_permissions: List[Dict[str, Any]]):
    """Send SNS notification about revoked permissions"""
    try:
        revocation_summary = {
            'timestamp': datetime.utcnow().isoformat(),
            'total_revoked': len(revoked_permissions),
            'revocations': [
                {
                    'account_id': perm['account_id'],
                    'prefix': perm['prefix'],
                    'access_level': perm.get('access_level', 'unknown'),
                    'expiration_date': perm.get('expiration_date'),
                    'created_by': perm.get('created_by', 'unknown')
                }
                for perm in revoked_permissions
            ]
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Access Revoked: {len(revoked_permissions)} Expired Permissions",
            Message=json.dumps(revocation_summary, indent=2)
        )

        log_structured('INFO', 'Revocation notification sent',
                     count=len(revoked_permissions))

    except Exception as e:
        log_structured('ERROR', 'Failed to send revocation notification',
                     error=str(e))


def send_metrics(expired_count: int, revoked_count: int, execution_time: float):
    """Send custom CloudWatch metrics for expiration enforcement"""
    try:
        metric_data = [
            {
                'MetricName': 'ExpiredPermissionsFound',
                'Value': expired_count,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'PermissionsRevoked',
                'Value': revoked_count,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'ExpirationEnforcerDuration',
                'Value': execution_time * 1000,
                'Unit': 'Milliseconds',
                'Timestamp': datetime.utcnow()
            }
        ]

        cloudwatch.put_metric_data(
            Namespace='CrossAccountS3Sharing/Expiration',
            MetricData=metric_data
        )

        log_structured('INFO', 'Expiration metrics sent to CloudWatch',
                     expired_count=expired_count, revoked_count=revoked_count)

    except Exception as e:
        log_structured('ERROR', 'Failed to send expiration metrics',
                     error=str(e))


def lambda_handler(event, context):
    """
    Expiration enforcer Lambda function

    Runs hourly to:
    1. Query DynamoDB for permissions past expiration_date
    2. Revoke access by deleting from access control table
    3. Log revocation events
    4. Send notifications to account owners
    5. Publish metrics to CloudWatch

    Note: Bucket policy is managed by Terraform, so this function
    marks permissions as revoked. Terraform should be re-applied
    to update the actual bucket policy.
    """
    start_time = time.time()

    log_structured('INFO', 'Expiration enforcement started',
                 request_id=context.request_id)

    try:
        # Query for expired permissions
        expired_permissions = query_expired_permissions()

        if not expired_permissions:
            log_structured('INFO', 'No expired permissions found')

            # Send metrics
            execution_time = time.time() - start_time
            send_metrics(0, 0, execution_time)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No expired permissions to revoke',
                    'expired_count': 0,
                    'revoked_count': 0,
                    'execution_time_ms': round(execution_time * 1000, 2)
                })
            }

        # Revoke each expired permission
        revoked_permissions = []
        failed_revocations = []

        for permission in expired_permissions:
            account_id = permission['account_id']
            prefix = permission['prefix']

            log_structured('INFO', 'Processing expired permission',
                         account_id=account_id, prefix=prefix,
                         expiration_date=permission.get('expiration_date'))

            # Revoke from DynamoDB
            if revoke_access_permission(account_id, prefix):
                revoked_permissions.append(permission)

                # Update bucket policy (logged recommendation)
                update_bucket_policy_remove_account(account_id, prefix)
            else:
                failed_revocations.append(permission)

        # Send notification about revocations
        if revoked_permissions:
            send_revocation_notification(revoked_permissions)

        # Calculate execution time
        execution_time = time.time() - start_time

        # Send metrics
        send_metrics(len(expired_permissions), len(revoked_permissions), execution_time)

        log_structured('INFO', 'Expiration enforcement completed',
                     expired_count=len(expired_permissions),
                     revoked_count=len(revoked_permissions),
                     failed_count=len(failed_revocations),
                     execution_time_ms=execution_time * 1000)

        return {
            'statusCode': 200 if not failed_revocations else 207,
            'body': json.dumps({
                'message': 'Expiration enforcement completed',
                'expired_count': len(expired_permissions),
                'revoked_count': len(revoked_permissions),
                'failed_count': len(failed_revocations),
                'revoked_permissions': [
                    {
                        'account_id': p['account_id'],
                        'prefix': p['prefix']
                    }
                    for p in revoked_permissions
                ],
                'execution_time_ms': round(execution_time * 1000, 2),
                'note': 'Bucket policy managed by Terraform - re-apply recommended'
            })
        }

    except ExpirationEnforcerError as e:
        log_structured('ERROR', 'Expiration enforcement error',
                     error=str(e), request_id=context.request_id)

        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'EnforcerError',
                'message': str(e)
            })
        }

    except Exception as e:
        log_structured('ERROR', 'Unexpected error during expiration enforcement',
                     error=str(e), error_type=type(e).__name__,
                     request_id=context.request_id)

        # Send alert for unexpected errors
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="Expiration Enforcer Lambda Error",
                Message=json.dumps({
                    'timestamp': datetime.utcnow().isoformat(),
                    'error': str(e),
                    'error_type': type(e).__name__,
                    'request_id': context.request_id
                }, indent=2)
            )
        except Exception:
            pass

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'InternalError',
                'message': 'Expiration enforcement failed due to internal error'
            })
        }
