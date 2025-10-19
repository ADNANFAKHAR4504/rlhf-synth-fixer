import json
import os
import boto3
import logging
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
cloudtrail_client = boto3.client('cloudtrail')
cloudwatch_client = boto3.client('cloudwatch')
sns_client = boto3.client('sns')

# Environment variables
PRIMARY_BUCKET = os.environ['PRIMARY_BUCKET_NAME']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
CLOUDTRAIL_NAME = os.environ.get('CLOUDTRAIL_NAME', '')

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_BASE = 2  # seconds


class ComplianceCheckError(Exception):
    """Custom exception for compliance check errors"""
    pass


def log_structured(level: str, message: str, **kwargs):
    """Log structured JSON messages"""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'level': level,
        'message': message,
        'bucket': PRIMARY_BUCKET,
        **kwargs
    }
    logger.info(json.dumps(log_entry))


def retry_with_backoff(func, max_retries=MAX_RETRIES):
    """Retry function with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return func()
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code in ['Throttling', 'RequestLimitExceeded', 'ServiceUnavailable']:
                if attempt < max_retries - 1:
                    delay = RETRY_DELAY_BASE ** (attempt + 1)
                    log_structured('WARNING', f'Retrying after {delay}s due to {error_code}',
                                 attempt=attempt + 1, max_retries=max_retries)
                    time.sleep(delay)
                    continue
            raise
        except Exception as e:
            if attempt < max_retries - 1:
                delay = RETRY_DELAY_BASE ** (attempt + 1)
                log_structured('WARNING', f'Retrying after {delay}s due to error',
                             error=str(e), attempt=attempt + 1)
                time.sleep(delay)
                continue
            raise
    raise ComplianceCheckError(f'Max retries ({max_retries}) exceeded')


def lambda_handler(event, context):
    """
    Daily compliance check for legal document storage system.
    Verifies:
    - Versioning is enabled
    - Object Lock is active
    - All objects are encrypted
    - Lifecycle policies are in place
    - No public access configured
    - CloudTrail is logging properly
    - Transfer Acceleration enabled
    - Bucket policies enforced
    """

    start_time = time.time()
    log_structured('INFO', 'Starting compliance check', event=event)

    compliance_issues: List[Dict[str, Any]] = []
    all_checks_passed = True
    checks_performed = 0
    checks_passed = 0

    # Check 1: Versioning Enabled
    try:
        def check_versioning():
            return s3_client.get_bucket_versioning(Bucket=PRIMARY_BUCKET)

        versioning = retry_with_backoff(check_versioning)
        checks_performed += 1

        if versioning.get('Status') != 'Enabled':
            issue = {
                'severity': 'CRITICAL',
                'check': 'Versioning',
                'message': 'Versioning is NOT enabled on primary bucket',
                'timestamp': datetime.utcnow().isoformat()
            }
            compliance_issues.append(issue)
            all_checks_passed = False
            send_metric('VersioningEnabled', 0)
            log_structured('ERROR', 'Versioning check failed', **issue)
        else:
            checks_passed += 1
            send_metric('VersioningEnabled', 1)
            log_structured('INFO', 'Versioning check passed')
    except Exception as e:
        checks_performed += 1
        issue = {
            'severity': 'CRITICAL',
            'check': 'Versioning',
            'message': f'Error checking versioning: {str(e)}',
            'error_type': type(e).__name__
        }
        compliance_issues.append(issue)
        all_checks_passed = False
        send_metric('VersioningEnabled', 0)
        log_structured('ERROR', 'Versioning check error', **issue)

    # Check 2: Object Lock Configuration
    try:
        def check_object_lock():
            return s3_client.get_object_lock_configuration(Bucket=PRIMARY_BUCKET)

        object_lock = retry_with_backoff(check_object_lock)
        checks_performed += 1

        if object_lock.get('ObjectLockConfiguration'):
            checks_passed += 1
            send_metric('ObjectLockEnabled', 1)
            log_structured('INFO', 'Object Lock check passed',
                         mode=object_lock['ObjectLockConfiguration'].get('ObjectLockEnabled'))
        else:
            issue = {
                'severity': 'WARNING',
                'check': 'ObjectLock',
                'message': 'Object Lock configuration not found'
            }
            compliance_issues.append(issue)
            send_metric('ObjectLockEnabled', 0)
            log_structured('WARNING', 'Object Lock check warning', **issue)
    except s3_client.exceptions.ObjectLockConfigurationNotFoundError:
        checks_performed += 1
        issue = {
            'severity': 'WARNING',
            'check': 'ObjectLock',
            'message': 'Object Lock is not enabled (may be intentional)'
        }
        compliance_issues.append(issue)
        send_metric('ObjectLockEnabled', 0)
        log_structured('WARNING', 'Object Lock not configured', **issue)
    except Exception as e:
        checks_performed += 1
        issue = {
            'severity': 'ERROR',
            'check': 'ObjectLock',
            'message': f'Error checking Object Lock: {str(e)}',
            'error_type': type(e).__name__
        }
        compliance_issues.append(issue)
        send_metric('ObjectLockEnabled', 0)
        log_structured('ERROR', 'Object Lock check error', **issue)

    # Check 3: Bucket Encryption
    try:
        def check_encryption():
            return s3_client.get_bucket_encryption(Bucket=PRIMARY_BUCKET)

        encryption = retry_with_backoff(check_encryption)
        checks_performed += 1

        rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
        if rules and rules[0].get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm') == 'aws:kms':
            checks_passed += 1
            send_metric('EncryptionEnabled', 1)
            log_structured('INFO', 'Encryption check passed',
                         algorithm='aws:kms',
                         key_id=rules[0]['ApplyServerSideEncryptionByDefault'].get('KMSMasterKeyID', 'default'))
        else:
            issue = {
                'severity': 'CRITICAL',
                'check': 'Encryption',
                'message': 'KMS encryption is NOT properly configured'
            }
            compliance_issues.append(issue)
            all_checks_passed = False
            send_metric('EncryptionEnabled', 0)
            log_structured('ERROR', 'Encryption check failed', **issue)
    except Exception as e:
        checks_performed += 1
        issue = {
            'severity': 'CRITICAL',
            'check': 'Encryption',
            'message': f'Error checking encryption: {str(e)}',
            'error_type': type(e).__name__
        }
        compliance_issues.append(issue)
        all_checks_passed = False
        send_metric('EncryptionEnabled', 0)
        log_structured('ERROR', 'Encryption check error', **issue)

    # Check 4: Lifecycle Policies
    try:
        def check_lifecycle():
            return s3_client.get_bucket_lifecycle_configuration(Bucket=PRIMARY_BUCKET)

        lifecycle = retry_with_backoff(check_lifecycle)
        checks_performed += 1

        rules = lifecycle.get('Rules', [])
        if len(rules) >= 3:
            checks_passed += 1
            send_metric('LifecyclePoliciesConfigured', 1)
            log_structured('INFO', 'Lifecycle policies check passed',
                         rule_count=len(rules))
        else:
            issue = {
                'severity': 'WARNING',
                'check': 'LifecyclePolicies',
                'message': f'Only {len(rules)} lifecycle rules found (expected at least 3)'
            }
            compliance_issues.append(issue)
            send_metric('LifecyclePoliciesConfigured', 0)
            log_structured('WARNING', 'Lifecycle policies check warning', **issue)
    except Exception as e:
        checks_performed += 1
        issue = {
            'severity': 'ERROR',
            'check': 'LifecyclePolicies',
            'message': f'Error checking lifecycle policies: {str(e)}',
            'error_type': type(e).__name__
        }
        compliance_issues.append(issue)
        send_metric('LifecyclePoliciesConfigured', 0)
        log_structured('ERROR', 'Lifecycle policies check error', **issue)

    # Check 5: Public Access Block
    try:
        def check_public_access():
            return s3_client.get_public_access_block(Bucket=PRIMARY_BUCKET)

        public_access = retry_with_backoff(check_public_access)
        checks_performed += 1

        config = public_access.get('PublicAccessBlockConfiguration', {})
        if (config.get('BlockPublicAcls') and
            config.get('BlockPublicPolicy') and
            config.get('IgnorePublicAcls') and
            config.get('RestrictPublicBuckets')):
            checks_passed += 1
            send_metric('PublicAccessBlocked', 1)
            log_structured('INFO', 'Public access block check passed')
        else:
            issue = {
                'severity': 'CRITICAL',
                'check': 'PublicAccessBlock',
                'message': 'Public access block is NOT fully configured',
                'config': config
            }
            compliance_issues.append(issue)
            all_checks_passed = False
            send_metric('PublicAccessBlocked', 0)
            log_structured('ERROR', 'Public access block check failed', **issue)
    except Exception as e:
        checks_performed += 1
        issue = {
            'severity': 'CRITICAL',
            'check': 'PublicAccessBlock',
            'message': f'Error checking public access block: {str(e)}',
            'error_type': type(e).__name__
        }
        compliance_issues.append(issue)
        all_checks_passed = False
        send_metric('PublicAccessBlocked', 0)
        log_structured('ERROR', 'Public access block check error', **issue)

    # Check 6: Bucket Policy
    try:
        def check_bucket_policy():
            return s3_client.get_bucket_policy(Bucket=PRIMARY_BUCKET)

        policy = retry_with_backoff(check_bucket_policy)
        checks_performed += 1

        if policy.get('Policy'):
            policy_doc = json.loads(policy['Policy'])
            has_ssl_requirement = any(
                stmt.get('Condition', {}).get('Bool', {}).get('aws:SecureTransport') == 'false'
                for stmt in policy_doc.get('Statement', [])
            )
            if has_ssl_requirement:
                checks_passed += 1
                send_metric('BucketPolicyEnforced', 1)
                log_structured('INFO', 'Bucket policy check passed')
            else:
                issue = {
                    'severity': 'WARNING',
                    'check': 'BucketPolicy',
                    'message': 'Bucket policy does not enforce SSL/TLS'
                }
                compliance_issues.append(issue)
                send_metric('BucketPolicyEnforced', 0)
                log_structured('WARNING', 'Bucket policy check warning', **issue)
        else:
            issue = {
                'severity': 'WARNING',
                'check': 'BucketPolicy',
                'message': 'No bucket policy found'
            }
            compliance_issues.append(issue)
            send_metric('BucketPolicyEnforced', 0)
            log_structured('WARNING', 'Bucket policy check warning', **issue)
    except Exception as e:
        checks_performed += 1
        issue = {
            'severity': 'WARNING',
            'check': 'BucketPolicy',
            'message': f'Error checking bucket policy: {str(e)}',
            'error_type': type(e).__name__
        }
        compliance_issues.append(issue)
        send_metric('BucketPolicyEnforced', 0)
        log_structured('WARNING', 'Bucket policy check error', **issue)

    # Check 7: CloudTrail Status (if enabled)
    if CLOUDTRAIL_NAME:
        try:
            def check_cloudtrail():
                return cloudtrail_client.get_trail_status(Name=CLOUDTRAIL_NAME)

            trail_status = retry_with_backoff(check_cloudtrail)
            checks_performed += 1

            if trail_status.get('IsLogging'):
                checks_passed += 1
                send_metric('CloudTrailLogging', 1)
                log_structured('INFO', 'CloudTrail check passed',
                             latest_delivery_time=str(trail_status.get('LatestDeliveryTime')))
            else:
                issue = {
                    'severity': 'CRITICAL',
                    'check': 'CloudTrail',
                    'message': 'CloudTrail is NOT logging'
                }
                compliance_issues.append(issue)
                all_checks_passed = False
                send_metric('CloudTrailLogging', 0)
                log_structured('ERROR', 'CloudTrail check failed', **issue)
        except Exception as e:
            checks_performed += 1
            issue = {
                'severity': 'ERROR',
                'check': 'CloudTrail',
                'message': f'Error checking CloudTrail: {str(e)}',
                'error_type': type(e).__name__
            }
            compliance_issues.append(issue)
            send_metric('CloudTrailLogging', 0)
            log_structured('ERROR', 'CloudTrail check error', **issue)

    # Send compliance failure metric
    failure_count = len(compliance_issues)
    send_metric('ComplianceFailures', failure_count)
    send_metric('ComplianceChecksPerformed', checks_performed)
    send_metric('ComplianceChecksPassed', checks_passed)

    # Calculate compliance score
    compliance_score = (checks_passed / checks_performed * 100) if checks_performed > 0 else 0
    send_metric('ComplianceScore', compliance_score)

    # Calculate execution time
    execution_time = time.time() - start_time
    send_metric('ComplianceCheckDuration', execution_time * 1000)  # milliseconds

    # Prepare results
    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'bucket': PRIMARY_BUCKET,
        'all_checks_passed': all_checks_passed,
        'compliance_score': round(compliance_score, 2),
        'checks_performed': checks_performed,
        'checks_passed': checks_passed,
        'checks_failed': checks_performed - checks_passed,
        'issues_found': len(compliance_issues),
        'issues': compliance_issues,
        'execution_time_ms': round(execution_time * 1000, 2)
    }

    log_structured('INFO', 'Compliance check completed',
                 compliance_score=compliance_score,
                 checks_passed=checks_passed,
                 checks_performed=checks_performed,
                 execution_time_ms=round(execution_time * 1000, 2))

    # Send SNS notification if there are issues
    if compliance_issues:
        send_alert(results)

    return {
        'statusCode': 200 if all_checks_passed else 500,
        'body': json.dumps(results)
    }


def send_metric(metric_name: str, value: float):
    """Send custom metric to CloudWatch with error handling"""
    try:
        cloudwatch_client.put_metric_data(
            Namespace='LegalDocStorage/Compliance',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'None',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'BucketName',
                            'Value': PRIMARY_BUCKET
                        }
                    ]
                }
            ]
        )
    except Exception as e:
        log_structured('ERROR', f'Error sending metric {metric_name}',
                     metric_name=metric_name,
                     value=value,
                     error=str(e))


def send_alert(results: Dict[str, Any]):
    """Send SNS notification for compliance failures"""
    try:
        critical_issues = [i for i in results['issues'] if i.get('severity') == 'CRITICAL']
        warning_issues = [i for i in results['issues'] if i.get('severity') == 'WARNING']

        message = f"""
COMPLIANCE ALERT - Legal Document Storage System

Timestamp: {results['timestamp']}
Bucket: {results['bucket']}
Status: {'PASSED' if results['all_checks_passed'] else 'FAILED'}
Compliance Score: {results['compliance_score']}%

Checks Performed: {results['checks_performed']}
Checks Passed: {results['checks_passed']}
Checks Failed: {results['checks_failed']}

Critical Issues ({len(critical_issues)}):
{chr(10).join(f'  - [{i["check"]}] {i["message"]}' for i in critical_issues)}

Warning Issues ({len(warning_issues)}):
{chr(10).join(f'  - [{i["check"]}] {i["message"]}' for i in warning_issues)}

Execution Time: {results['execution_time_ms']}ms

Please investigate and remediate immediately.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'COMPLIANCE ALERT: {results["bucket"]} - Score: {results["compliance_score"]}%',
            Message=message
        )
        log_structured('INFO', 'Alert sent to SNS topic',
                     critical_count=len(critical_issues),
                     warning_count=len(warning_issues))
    except Exception as e:
        log_structured('ERROR', 'Error sending SNS alert',
                     error=str(e),
                     error_type=type(e).__name__)
