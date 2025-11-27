"""scanner.py
Lambda function for single-account infrastructure compliance scanning.
"""

import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
sts_client = boto3.client('sts', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)
ec2_client = boto3.client('ec2', region_name=AWS_REGION)
lambda_client = boto3.client('lambda', region_name=AWS_REGION)
sns_client = boto3.client('sns', region_name=AWS_REGION)
events_client = boto3.client('events', region_name=AWS_REGION)

AUDIT_BUCKET = os.environ['AUDIT_BUCKET']
ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def check_s3_bucket_encryption():
    """
    Check S3 buckets for encryption compliance.

    Returns:
        List of compliance check results
    """
    results = []
    try:
        buckets_response = s3_client.list_buckets()

        for bucket in buckets_response.get('Buckets', []):
            bucket_name = bucket['Name']

            try:
                # Check encryption
                encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
                is_encrypted = True
                encryption_type = encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
            except ClientError as e:
                if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                    is_encrypted = False
                    encryption_type = 'None'
                else:
                    # Skip buckets we can't access
                    continue

            results.append({
                'resource_type': 'S3Bucket',
                'resource_id': bucket_name,
                'check': 'EncryptionEnabled',
                'compliant': is_encrypted,
                'details': f'Encryption: {encryption_type}'
            })

    except ClientError as e:
        print(f"Error checking S3 buckets: {e}")

    return results


def check_vpc_flow_logs():
    """
    Check VPCs for flow logs compliance.

    Returns:
        List of compliance check results
    """
    results = []
    try:
        # Get all VPCs
        vpcs_response = ec2_client.describe_vpcs()

        for vpc in vpcs_response.get('Vpcs', []):
            vpc_id = vpc['VpcId']

            # Check for flow logs
            flow_logs_response = ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]}
                ]
            )

            has_flow_logs = len(flow_logs_response.get('FlowLogs', [])) > 0

            results.append({
                'resource_type': 'VPC',
                'resource_id': vpc_id,
                'check': 'FlowLogsEnabled',
                'compliant': has_flow_logs,
                'details': f'Flow logs: {"Enabled" if has_flow_logs else "Disabled"}'
            })

    except ClientError as e:
        print(f"Error checking VPC flow logs: {e}")

    return results


def check_lambda_settings():
    """
    Check Lambda functions for compliance settings.

    Returns:
        List of compliance check results
    """
    results = []
    try:
        # Get all Lambda functions
        paginator = lambda_client.get_paginator('list_functions')

        for page in paginator.paginate():
            for function in page.get('Functions', []):
                function_name = function['FunctionName']

                # Check X-Ray tracing
                tracing_config = function.get('TracingConfig', {})
                tracing_mode = tracing_config.get('Mode', 'PassThrough')
                tracing_enabled = tracing_mode == 'Active'

                results.append({
                    'resource_type': 'LambdaFunction',
                    'resource_id': function_name,
                    'check': 'XRayTracingEnabled',
                    'compliant': tracing_enabled,
                    'details': f'Tracing mode: {tracing_mode}'
                })

                # Check if function has reserved concurrency (optional check)
                reserved_concurrency = function.get('ReservedConcurrentExecutions')
                has_reserved_concurrency = reserved_concurrency is not None

                results.append({
                    'resource_type': 'LambdaFunction',
                    'resource_id': function_name,
                    'check': 'ReservedConcurrencySet',
                    'compliant': has_reserved_concurrency,
                    'details': f'Reserved concurrency: {reserved_concurrency if has_reserved_concurrency else "Not set"}'
                })

    except ClientError as e:
        print(f"Error checking Lambda functions: {e}")

    return results


def get_compliance_summary():
    """
    Get compliance summary by checking resources directly.

    Returns:
        Dictionary of compliance results
    """
    all_checks = []

    # Run all compliance checks
    print("Checking S3 bucket encryption...")
    all_checks.extend(check_s3_bucket_encryption())

    print("Checking VPC flow logs...")
    all_checks.extend(check_vpc_flow_logs())

    print("Checking Lambda function settings...")
    all_checks.extend(check_lambda_settings())

    # Aggregate results
    compliance_summary = {
        'compliant': sum(1 for check in all_checks if check['compliant']),
        'non_compliant': sum(1 for check in all_checks if not check['compliant']),
        'total_checks': len(all_checks),
        'checks': all_checks
    }

    return compliance_summary


def save_scan_results(scan_data):
    """
    Save scan results to S3 audit bucket.

    Args:
        scan_data: Dictionary containing scan results

    Returns:
        S3 object key
    """
    timestamp = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')
    s3_key = f"scans/{timestamp}/compliance-scan.json"

    try:
        s3_client.put_object(
            Bucket=AUDIT_BUCKET,
            Key=s3_key,
            Body=json.dumps(scan_data, indent=2),
            ContentType='application/json'
        )
        print(f"Scan results saved to s3://{AUDIT_BUCKET}/{s3_key}")
        return s3_key
    except ClientError as e:
        print(f"Error saving scan results to S3: {e}")
        return None


def send_alert(subject, message):
    """
    Send alert to SNS topic.

    Args:
        subject: Alert subject
        message: Alert message body
    """
    try:
        sns_client.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"Alert sent: {subject}")
    except ClientError as e:
        print(f"Error sending alert: {e}")


def trigger_report_generation(scan_key):
    """
    Trigger report generation via EventBridge custom event.

    Args:
        scan_key: S3 key of scan results
    """
    try:
        events_client.put_events(
            Entries=[
                {
                    'Source': 'compliance.audit',
                    'DetailType': 'Compliance Scan Complete',
                    'Detail': json.dumps({
                        'scan_key': scan_key,
                        'environment': ENVIRONMENT_SUFFIX
                    })
                }
            ]
        )
        print("Report generation triggered")
    except ClientError as e:
        print(f"Error triggering report generation: {e}")


def handler(event, context):
    """
    Main Lambda handler for compliance scanning.

    Performs single-account infrastructure compliance scanning,
    aggregates results, and triggers alerts and reports.
    """
    print(f"Starting compliance scan - Environment: {ENVIRONMENT_SUFFIX}")

    # Scan current account
    print("Scanning current account...")
    current_account_id = sts_client.get_caller_identity()['Account']

    compliance_summary = get_compliance_summary()

    scan_results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT_SUFFIX,
        'account_id': current_account_id,
        'compliance_summary': compliance_summary
    }

    # Calculate total compliance metrics
    total_compliant = compliance_summary['compliant']
    total_non_compliant = compliance_summary['non_compliant']

    # Save results
    scan_key = save_scan_results(scan_results)

    # Send alert if critical violations found
    if total_non_compliant > 0:
        alert_message = f"""
Compliance Scan Alert

Environment: {ENVIRONMENT_SUFFIX}
Total Non-Compliant Rules: {total_non_compliant}
Total Compliant Rules: {total_compliant}

Scan Results: s3://{AUDIT_BUCKET}/{scan_key}

Please review the compliance violations immediately.
        """
        send_alert("Critical Compliance Violations Detected", alert_message)

    # Trigger report generation
    if scan_key:
        trigger_report_generation(scan_key)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Compliance scan completed',
            'scan_key': scan_key,
            'total_non_compliant': total_non_compliant
        })
    }
