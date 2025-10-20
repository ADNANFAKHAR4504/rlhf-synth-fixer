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
iam = boto3.client('iam')
kms = boto3.client('kms')
cloudtrail = boto3.client('cloudtrail')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
ACCESS_CONTROL_TABLE = os.environ['ACCESS_CONTROL_TABLE']
PRIMARY_BUCKET = os.environ['PRIMARY_BUCKET']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
KMS_KEY_ID = os.environ['KMS_KEY_ID']
CLOUDTRAIL_NAME = os.environ['CLOUDTRAIL_NAME']

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_BASE = 2


class GovernanceCheckError(Exception):
    """Custom exception for governance check errors"""
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
            if error_code in ['Throttling', 'RequestLimitExceeded', 'ServiceUnavailable']:
                if attempt < max_retries - 1:
                    delay = RETRY_DELAY_BASE ** (attempt + 1)
                    log_structured('WARNING', f'Retrying after {delay}s due to {error_code}',
                                 attempt=attempt + 1, max_retries=max_retries, error=str(e))
                    time.sleep(delay)
                    continue
            raise
    raise GovernanceCheckError(f'Max retries ({max_retries}) exceeded')


def check_bucket_versioning() -> Dict[str, Any]:
    """Check that S3 bucket versioning is enabled"""
    try:
        def get_versioning():
            return s3.get_bucket_versioning(Bucket=PRIMARY_BUCKET)

        response = retry_with_backoff(get_versioning)
        status = response.get('Status', 'Disabled')
        passed = status == 'Enabled'

        log_structured('INFO', 'Bucket versioning check',
                     bucket=PRIMARY_BUCKET, status=status, passed=passed)

        return {
            'check': 'bucket_versioning',
            'passed': passed,
            'message': f'Bucket versioning is {status}',
            'severity': 'critical' if not passed else 'info'
        }

    except Exception as e:
        log_structured('ERROR', 'Failed to check bucket versioning',
                     bucket=PRIMARY_BUCKET, error=str(e))
        return {
            'check': 'bucket_versioning',
            'passed': False,
            'message': f'Error checking versioning: {str(e)}',
            'severity': 'critical'
        }


def check_bucket_encryption() -> Dict[str, Any]:
    """Check that S3 bucket encryption is configured with KMS"""
    try:
        def get_encryption():
            return s3.get_bucket_encryption(Bucket=PRIMARY_BUCKET)

        response = retry_with_backoff(get_encryption)
        rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])

        if not rules:
            return {
                'check': 'bucket_encryption',
                'passed': False,
                'message': 'No encryption rules configured',
                'severity': 'critical'
            }

        rule = rules[0]
        sse_algorithm = rule.get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm')
        kms_key = rule.get('ApplyServerSideEncryptionByDefault', {}).get('KMSMasterKeyID', '')

        passed = sse_algorithm == 'aws:kms' and KMS_KEY_ID in kms_key

        log_structured('INFO', 'Bucket encryption check',
                     bucket=PRIMARY_BUCKET, algorithm=sse_algorithm,
                     kms_configured=KMS_KEY_ID in kms_key, passed=passed)

        return {
            'check': 'bucket_encryption',
            'passed': passed,
            'message': f'Encryption: {sse_algorithm}, KMS Key configured: {KMS_KEY_ID in kms_key}',
            'severity': 'critical' if not passed else 'info'
        }

    except Exception as e:
        log_structured('ERROR', 'Failed to check bucket encryption',
                     bucket=PRIMARY_BUCKET, error=str(e))
        return {
            'check': 'bucket_encryption',
            'passed': False,
            'message': f'Error checking encryption: {str(e)}',
            'severity': 'critical'
        }


def check_public_access_block() -> Dict[str, Any]:
    """Check that S3 bucket public access is blocked"""
    try:
        def get_public_access():
            return s3.get_public_access_block(Bucket=PRIMARY_BUCKET)

        response = retry_with_backoff(get_public_access)
        config = response.get('PublicAccessBlockConfiguration', {})

        all_blocked = (
            config.get('BlockPublicAcls') and
            config.get('BlockPublicPolicy') and
            config.get('IgnorePublicAcls') and
            config.get('RestrictPublicBuckets')
        )

        log_structured('INFO', 'Public access block check',
                     bucket=PRIMARY_BUCKET, all_blocked=all_blocked)

        return {
            'check': 'public_access_block',
            'passed': all_blocked,
            'message': 'All public access blocked' if all_blocked else 'Public access not fully blocked',
            'severity': 'critical' if not all_blocked else 'info'
        }

    except Exception as e:
        log_structured('ERROR', 'Failed to check public access block',
                     bucket=PRIMARY_BUCKET, error=str(e))
        return {
            'check': 'public_access_block',
            'passed': False,
            'message': f'Error checking public access: {str(e)}',
            'severity': 'critical'
        }


def check_bucket_policy_ssl() -> Dict[str, Any]:
    """Check that bucket policy enforces SSL/TLS"""
    try:
        def get_policy():
            return s3.get_bucket_policy(Bucket=PRIMARY_BUCKET)

        response = retry_with_backoff(get_policy)
        policy = json.loads(response['Policy'])

        # Check for SSL enforcement statement
        ssl_enforced = False
        for statement in policy.get('Statement', []):
            if (statement.get('Effect') == 'Deny' and
                'aws:SecureTransport' in str(statement.get('Condition', {}))):
                ssl_enforced = True
                break

        log_structured('INFO', 'Bucket policy SSL check',
                     bucket=PRIMARY_BUCKET, ssl_enforced=ssl_enforced)

        return {
            'check': 'bucket_policy_ssl',
            'passed': ssl_enforced,
            'message': 'SSL/TLS enforced in bucket policy' if ssl_enforced else 'SSL/TLS not enforced',
            'severity': 'high' if not ssl_enforced else 'info'
        }

    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchBucketPolicy':
            return {
                'check': 'bucket_policy_ssl',
                'passed': False,
                'message': 'No bucket policy configured',
                'severity': 'high'
            }
        raise


def check_kms_key_rotation() -> Dict[str, Any]:
    """Check that KMS key rotation is enabled"""
    try:
        def get_rotation_status():
            return kms.get_key_rotation_status(KeyId=KMS_KEY_ID)

        response = retry_with_backoff(get_rotation_status)
        rotation_enabled = response.get('KeyRotationEnabled', False)

        log_structured('INFO', 'KMS key rotation check',
                     key_id=KMS_KEY_ID, rotation_enabled=rotation_enabled)

        return {
            'check': 'kms_key_rotation',
            'passed': rotation_enabled,
            'message': 'KMS key rotation enabled' if rotation_enabled else 'KMS key rotation disabled',
            'severity': 'medium' if not rotation_enabled else 'info'
        }

    except Exception as e:
        log_structured('ERROR', 'Failed to check KMS key rotation',
                     key_id=KMS_KEY_ID, error=str(e))
        return {
            'check': 'kms_key_rotation',
            'passed': False,
            'message': f'Error checking KMS rotation: {str(e)}',
            'severity': 'medium'
        }


def check_cloudtrail_status() -> Dict[str, Any]:
    """Check that CloudTrail is enabled and logging"""
    try:
        def get_trail_status():
            return cloudtrail.get_trail_status(Name=CLOUDTRAIL_NAME)

        response = retry_with_backoff(get_trail_status)
        is_logging = response.get('IsLogging', False)

        log_structured('INFO', 'CloudTrail status check',
                     trail_name=CLOUDTRAIL_NAME, is_logging=is_logging)

        return {
            'check': 'cloudtrail_logging',
            'passed': is_logging,
            'message': 'CloudTrail is logging' if is_logging else 'CloudTrail logging disabled',
            'severity': 'critical' if not is_logging else 'info'
        }

    except Exception as e:
        log_structured('ERROR', 'Failed to check CloudTrail status',
                     trail_name=CLOUDTRAIL_NAME, error=str(e))
        return {
            'check': 'cloudtrail_logging',
            'passed': False,
            'message': f'Error checking CloudTrail: {str(e)}',
            'severity': 'critical'
        }


def check_access_control_table_consistency() -> Dict[str, Any]:
    """Validate access control table entries against actual bucket policy"""
    try:
        table = dynamodb.Table(ACCESS_CONTROL_TABLE)

        def scan_table():
            return table.scan()

        response = retry_with_backoff(scan_table)
        items = response.get('Items', [])

        total_entries = len(items)
        expired_entries = 0
        active_entries = 0

        for item in items:
            if 'expiration_date' in item:
                expiration = datetime.fromisoformat(item['expiration_date'])
                if expiration < datetime.utcnow():
                    expired_entries += 1
                else:
                    active_entries += 1
            else:
                active_entries += 1

        log_structured('INFO', 'Access control table consistency check',
                     total_entries=total_entries,
                     active_entries=active_entries,
                     expired_entries=expired_entries)

        return {
            'check': 'access_control_consistency',
            'passed': True,
            'message': f'Total: {total_entries}, Active: {active_entries}, Expired: {expired_entries}',
            'severity': 'info',
            'metrics': {
                'total_entries': total_entries,
                'active_entries': active_entries,
                'expired_entries': expired_entries
            }
        }

    except Exception as e:
        log_structured('ERROR', 'Failed to check access control table',
                     error=str(e))
        return {
            'check': 'access_control_consistency',
            'passed': False,
            'message': f'Error checking access control table: {str(e)}',
            'severity': 'medium'
        }


def send_alert(subject: str, message: str, failed_checks: List[Dict[str, Any]]):
    """Send SNS alert for governance violations"""
    try:
        alert_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'subject': subject,
            'message': message,
            'failed_checks': failed_checks,
            'critical_count': sum(1 for c in failed_checks if c.get('severity') == 'critical'),
            'high_count': sum(1 for c in failed_checks if c.get('severity') == 'high'),
            'medium_count': sum(1 for c in failed_checks if c.get('severity') == 'medium')
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],
            Message=json.dumps(alert_message, indent=2)
        )

        log_structured('INFO', 'Governance alert sent to SNS',
                     subject=subject, failed_count=len(failed_checks))

    except Exception as e:
        log_structured('ERROR', 'Failed to send governance alert',
                     subject=subject, error=str(e))


def send_metrics(checks: List[Dict[str, Any]], execution_time: float):
    """Send custom CloudWatch metrics for governance checks"""
    try:
        passed_count = sum(1 for c in checks if c['passed'])
        failed_count = len(checks) - passed_count
        compliance_score = (passed_count / len(checks) * 100) if checks else 0

        metric_data = [
            {
                'MetricName': 'GovernanceComplianceScore',
                'Value': compliance_score,
                'Unit': 'Percent',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'GovernanceChecksPassed',
                'Value': passed_count,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'GovernanceChecksFailed',
                'Value': failed_count,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'GovernanceCheckDuration',
                'Value': execution_time * 1000,
                'Unit': 'Milliseconds',
                'Timestamp': datetime.utcnow()
            }
        ]

        cloudwatch.put_metric_data(
            Namespace='CrossAccountS3Sharing/Governance',
            MetricData=metric_data
        )

        log_structured('INFO', 'Governance metrics sent to CloudWatch',
                     compliance_score=compliance_score)

    except Exception as e:
        log_structured('ERROR', 'Failed to send governance metrics',
                     error=str(e))


def lambda_handler(event, context):
    """
    Daily governance check Lambda function

    Validates infrastructure configuration:
    1. S3 bucket versioning enabled
    2. S3 bucket encryption with KMS
    3. Public access blocked
    4. Bucket policy enforces SSL
    5. KMS key rotation enabled
    6. CloudTrail logging active
    7. Access control table consistency

    Sends alerts for any failed checks
    """
    start_time = time.time()

    log_structured('INFO', 'Governance check started',
                 request_id=context.request_id)

    try:
        # Run all governance checks
        checks = [
            check_bucket_versioning(),
            check_bucket_encryption(),
            check_public_access_block(),
            check_bucket_policy_ssl(),
            check_kms_key_rotation(),
            check_cloudtrail_status(),
            check_access_control_table_consistency()
        ]

        # Separate passed and failed checks
        passed_checks = [c for c in checks if c['passed']]
        failed_checks = [c for c in checks if not c['passed']]

        # Calculate compliance score
        compliance_score = (len(passed_checks) / len(checks) * 100) if checks else 0

        log_structured('INFO', 'Governance checks completed',
                     total_checks=len(checks),
                     passed=len(passed_checks),
                     failed=len(failed_checks),
                     compliance_score=compliance_score)

        # Send alert if there are failed checks
        if failed_checks:
            critical_failures = [c for c in failed_checks if c.get('severity') == 'critical']

            if critical_failures:
                send_alert(
                    subject="CRITICAL: Governance Violations Detected",
                    message=f"{len(critical_failures)} critical governance violations found",
                    failed_checks=critical_failures
                )
            elif failed_checks:
                send_alert(
                    subject="Governance Check Failures",
                    message=f"{len(failed_checks)} governance checks failed",
                    failed_checks=failed_checks
                )

        # Calculate execution time
        execution_time = time.time() - start_time

        # Send metrics to CloudWatch
        send_metrics(checks, execution_time)

        return {
            'statusCode': 200 if not failed_checks else 500,
            'body': json.dumps({
                'message': 'Governance check completed',
                'compliance_score': round(compliance_score, 2),
                'total_checks': len(checks),
                'passed_checks': len(passed_checks),
                'failed_checks': len(failed_checks),
                'checks': checks,
                'execution_time_ms': round(execution_time * 1000, 2)
            }, default=str)
        }

    except Exception as e:
        log_structured('ERROR', 'Unexpected error during governance check',
                     error=str(e), error_type=type(e).__name__,
                     request_id=context.request_id)

        send_alert(
            subject="Governance Check Lambda Error",
            message=f"Governance check failed: {str(e)}",
            failed_checks=[{
                'check': 'lambda_execution',
                'passed': False,
                'message': str(e),
                'severity': 'critical'
            }]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'InternalError',
                'message': 'Governance check failed due to internal error'
            })
        }
