"""remediation.py
Lambda function for automatic remediation of compliance violations.
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
s3_client = boto3.client('s3', region_name=AWS_REGION)
lambda_client = boto3.client('lambda', region_name=AWS_REGION)
sns_client = boto3.client('sns', region_name=AWS_REGION)

ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def enable_s3_encryption(bucket_name):
    """
    Enable default encryption on S3 bucket.

    Args:
        bucket_name: Name of S3 bucket

    Returns:
        Success status
    """
    try:
        s3_client.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                'Rules': [
                    {
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'AES256'
                        },
                        'BucketKeyEnabled': True
                    }
                ]
            }
        )
        print(f"Enabled encryption on bucket: {bucket_name}")
        return True
    except ClientError as e:
        print(f"Error enabling encryption on {bucket_name}: {e}")
        return False


def enable_s3_versioning(bucket_name):
    """
    Enable versioning on S3 bucket.

    Args:
        bucket_name: Name of S3 bucket

    Returns:
        Success status
    """
    try:
        s3_client.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={
                'Status': 'Enabled'
            }
        )
        print(f"Enabled versioning on bucket: {bucket_name}")
        return True
    except ClientError as e:
        print(f"Error enabling versioning on {bucket_name}: {e}")
        return False


def enable_lambda_tracing(function_name):
    """
    Enable X-Ray tracing on Lambda function.

    Args:
        function_name: Name of Lambda function

    Returns:
        Success status
    """
    try:
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            TracingConfig={
                'Mode': 'Active'
            }
        )
        print(f"Enabled X-Ray tracing on function: {function_name}")
        return True
    except ClientError as e:
        print(f"Error enabling tracing on {function_name}: {e}")
        return False


def send_remediation_alert(resource_type, resource_id, action, success):
    """
    Send alert about remediation action.

    Args:
        resource_type: Type of resource (S3, Lambda, etc.)
        resource_id: Resource identifier
        action: Remediation action taken
        success: Whether remediation succeeded
    """
    status = "SUCCESS" if success else "FAILED"

    message = f"""
Automatic Remediation {status}

Environment: {ENVIRONMENT_SUFFIX}
Resource Type: {resource_type}
Resource ID: {resource_id}
Action: {action}
Status: {status}

Timestamp: {boto3.client('sts').get_caller_identity()}
    """

    try:
        sns_client.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject=f"Remediation {status}: {resource_type} - {resource_id}",
            Message=message
        )
        print(f"Remediation alert sent: {status}")
    except ClientError as e:
        print(f"Error sending remediation alert: {e}")


def handler(event, context):
    """
    Main Lambda handler for automatic remediation.

    Triggered by custom events or manual invocation.
    Performs automatic remediation for specific violation types.
    """
    print(f"Starting automatic remediation - Environment: {ENVIRONMENT_SUFFIX}")

    # Parse custom remediation event
    detail = event.get('detail', {})
    resource_type = detail.get('resource_type', '')
    resource_id = detail.get('resource_id', '')
    check = detail.get('check', '')

    # Support direct invocation format as well
    if not resource_type:
        resource_type = event.get('resource_type', '')
        resource_id = event.get('resource_id', '')
        check = event.get('check', '')

    print(f"Check: {check}")
    print(f"Resource: {resource_type}/{resource_id}")

    if not resource_type or not resource_id:
        print("Missing required parameters: resource_type and resource_id")
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Missing required parameters'})
        }

    remediation_performed = False
    action = "None"
    success = False

    # S3 bucket encryption remediation
    if resource_type == 'S3Bucket' and check == 'EncryptionEnabled':
        action = "Enable S3 encryption"
        success = enable_s3_encryption(resource_id)
        remediation_performed = True

    # S3 bucket versioning remediation (if needed)
    elif resource_type == 'S3Bucket' and 'versioning' in check.lower():
        action = "Enable S3 versioning"
        success = enable_s3_versioning(resource_id)
        remediation_performed = True

    # Lambda tracing remediation
    elif resource_type == 'LambdaFunction' and check == 'XRayTracingEnabled':
        action = "Enable Lambda X-Ray tracing"
        success = enable_lambda_tracing(resource_id)
        remediation_performed = True

    # Send alert about remediation
    if remediation_performed:
        send_remediation_alert(resource_type, resource_id, action, success)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Remediation completed' if remediation_performed else 'No remediation available',
            'action': action,
            'success': success
        })
    }
