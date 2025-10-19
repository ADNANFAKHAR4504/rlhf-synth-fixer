import json
import os
import boto3
from datetime import datetime

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
    """

    print(f"Starting compliance check at {datetime.utcnow().isoformat()}")

    compliance_issues = []
    all_checks_passed = True

    # Check 1: Versioning Enabled
    try:
        versioning = s3_client.get_bucket_versioning(Bucket=PRIMARY_BUCKET)
        if versioning.get('Status') != 'Enabled':
            compliance_issues.append("CRITICAL: Versioning is NOT enabled on primary bucket")
            all_checks_passed = False
            send_metric('VersioningEnabled', 0)
        else:
            print("✓ Versioning is enabled")
            send_metric('VersioningEnabled', 1)
    except Exception as e:
        compliance_issues.append(f"ERROR checking versioning: {str(e)}")
        all_checks_passed = False
        send_metric('VersioningEnabled', 0)

    # Check 2: Object Lock Configuration
    try:
        object_lock = s3_client.get_object_lock_configuration(Bucket=PRIMARY_BUCKET)
        if object_lock.get('ObjectLockConfiguration'):
            print("✓ Object Lock is configured")
            send_metric('ObjectLockEnabled', 1)
        else:
            compliance_issues.append("WARNING: Object Lock configuration not found")
            send_metric('ObjectLockEnabled', 0)
    except s3_client.exceptions.ObjectLockConfigurationNotFoundError:
        compliance_issues.append("WARNING: Object Lock is not enabled (may be intentional)")
        send_metric('ObjectLockEnabled', 0)
    except Exception as e:
        print(f"Error checking Object Lock: {str(e)}")
        send_metric('ObjectLockEnabled', 0)

    # Check 3: Bucket Encryption
    try:
        encryption = s3_client.get_bucket_encryption(Bucket=PRIMARY_BUCKET)
        rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
        if rules and rules[0].get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm') == 'aws:kms':
            print("✓ KMS encryption is enabled")
            send_metric('EncryptionEnabled', 1)
        else:
            compliance_issues.append("CRITICAL: KMS encryption is NOT properly configured")
            all_checks_passed = False
            send_metric('EncryptionEnabled', 0)
    except Exception as e:
        compliance_issues.append(f"CRITICAL: Error checking encryption: {str(e)}")
        all_checks_passed = False
        send_metric('EncryptionEnabled', 0)

    # Check 4: Lifecycle Policies
    try:
        lifecycle = s3_client.get_bucket_lifecycle_configuration(Bucket=PRIMARY_BUCKET)
        rules = lifecycle.get('Rules', [])
        if len(rules) >= 3:  # Should have multiple lifecycle rules
            print(f"✓ Lifecycle policies in place ({len(rules)} rules)")
            send_metric('LifecyclePoliciesConfigured', 1)
        else:
            compliance_issues.append(f"WARNING: Only {len(rules)} lifecycle rules found (expected at least 3)")
            send_metric('LifecyclePoliciesConfigured', 0)
    except Exception as e:
        compliance_issues.append(f"ERROR checking lifecycle policies: {str(e)}")
        send_metric('LifecyclePoliciesConfigured', 0)

    # Check 5: Public Access Block
    try:
        public_access = s3_client.get_public_access_block(Bucket=PRIMARY_BUCKET)
        config = public_access.get('PublicAccessBlockConfiguration', {})
        if (config.get('BlockPublicAcls') and
            config.get('BlockPublicPolicy') and
            config.get('IgnorePublicAcls') and
            config.get('RestrictPublicBuckets')):
            print("✓ Public access is blocked")
            send_metric('PublicAccessBlocked', 1)
        else:
            compliance_issues.append("CRITICAL: Public access block is NOT fully configured")
            all_checks_passed = False
            send_metric('PublicAccessBlocked', 0)
    except Exception as e:
        compliance_issues.append(f"CRITICAL: Error checking public access block: {str(e)}")
        all_checks_passed = False
        send_metric('PublicAccessBlocked', 0)

    # Check 6: CloudTrail Status (if enabled)
    if CLOUDTRAIL_NAME:
        try:
            trail_status = cloudtrail_client.get_trail_status(Name=CLOUDTRAIL_NAME)
            if trail_status.get('IsLogging'):
                print("✓ CloudTrail is logging")
                send_metric('CloudTrailLogging', 1)
            else:
                compliance_issues.append("CRITICAL: CloudTrail is NOT logging")
                all_checks_passed = False
                send_metric('CloudTrailLogging', 0)
        except Exception as e:
            compliance_issues.append(f"ERROR checking CloudTrail: {str(e)}")
            send_metric('CloudTrailLogging', 0)

    # Send compliance failure metric
    failure_count = len(compliance_issues)
    send_metric('ComplianceFailures', failure_count)

    # Prepare results
    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'bucket': PRIMARY_BUCKET,
        'all_checks_passed': all_checks_passed,
        'issues_found': len(compliance_issues),
        'issues': compliance_issues
    }

    print(json.dumps(results, indent=2))

    # Send SNS notification if there are issues
    if compliance_issues:
        send_alert(results)

    return {
        'statusCode': 200 if all_checks_passed else 500,
        'body': json.dumps(results)
    }

def send_metric(metric_name, value):
    """Send custom metric to CloudWatch"""
    try:
        cloudwatch_client.put_metric_data(
            Namespace='LegalDocStorage/Compliance',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'None',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Error sending metric {metric_name}: {str(e)}")

def send_alert(results):
    """Send SNS notification for compliance failures"""
    try:
        message = f"""
COMPLIANCE ALERT - Legal Document Storage System

Timestamp: {results['timestamp']}
Bucket: {results['bucket']}
Status: {'PASSED' if results['all_checks_passed'] else 'FAILED'}
Issues Found: {results['issues_found']}

Issues:
{chr(10).join(f'  - {issue}' for issue in results['issues'])}

Please investigate and remediate immediately.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject='COMPLIANCE ALERT: Legal Document Storage',
            Message=message
        )
        print("Alert sent to SNS topic")
    except Exception as e:
        print(f"Error sending SNS alert: {str(e)}")
