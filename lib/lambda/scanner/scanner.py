"""scanner.py
Lambda function for cross-account infrastructure compliance scanning.
"""

import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
sts_client = boto3.client('sts')
s3_client = boto3.client('s3')
config_client = boto3.client('config')
sns_client = boto3.client('sns')
events_client = boto3.client('events')

AUDIT_BUCKET = os.environ['AUDIT_BUCKET']
ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def assume_role(account_id, role_name):
    """
    Assume role in target account for cross-account scanning.

    Args:
        account_id: AWS account ID
        role_name: IAM role name to assume

    Returns:
        Temporary credentials
    """
    role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"

    try:
        response = sts_client.assume_role(
            RoleArn=role_arn,
            RoleSessionName=f"ComplianceScan-{ENVIRONMENT_SUFFIX}"
        )
        return response['Credentials']
    except ClientError as e:
        print(f"Error assuming role {role_arn}: {e}")
        return None


def get_compliance_summary(credentials=None):
    """
    Get compliance summary from AWS Config.

    Args:
        credentials: Optional temporary credentials for cross-account access

    Returns:
        Dictionary of compliance results
    """
    if credentials:
        config_client_cross = boto3.client(
            'config',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken']
        )
    else:
        config_client_cross = config_client

    compliance_summary = {
        'compliant': 0,
        'non_compliant': 0,
        'not_applicable': 0,
        'insufficient_data': 0,
        'rules': []
    }

    try:
        # Get all Config rules
        rules_response = config_client_cross.describe_config_rules()

        for rule in rules_response.get('ConfigRules', []):
            rule_name = rule['ConfigRuleName']

            # Get compliance details for each rule
            try:
                compliance_response = config_client_cross.describe_compliance_by_config_rule(
                    ConfigRuleNames=[rule_name]
                )

                for compliance in compliance_response.get('ComplianceByConfigRules', []):
                    status = compliance['Compliance']['ComplianceType']

                    rule_info = {
                        'rule_name': rule_name,
                        'status': status,
                        'rule_id': rule.get('ConfigRuleId', 'N/A')
                    }

                    compliance_summary['rules'].append(rule_info)

                    if status == 'COMPLIANT':
                        compliance_summary['compliant'] += 1
                    elif status == 'NON_COMPLIANT':
                        compliance_summary['non_compliant'] += 1
                    elif status == 'NOT_APPLICABLE':
                        compliance_summary['not_applicable'] += 1
                    else:
                        compliance_summary['insufficient_data'] += 1

            except ClientError as e:
                print(f"Error getting compliance for rule {rule_name}: {e}")

    except ClientError as e:
        print(f"Error describing Config rules: {e}")

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

    Performs cross-account infrastructure compliance scanning,
    aggregates results, and triggers alerts and reports.
    """
    print(f"Starting compliance scan - Environment: {ENVIRONMENT_SUFFIX}")

    scan_results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT_SUFFIX,
        'accounts': []
    }

    # Scan current account
    print("Scanning current account...")
    current_account_id = sts_client.get_caller_identity()['Account']

    compliance_summary = get_compliance_summary()

    account_result = {
        'account_id': current_account_id,
        'compliance_summary': compliance_summary
    }

    scan_results['accounts'].append(account_result)

    # Check for cross-account scan requests in event
    target_accounts = event.get('detail', {}).get('target_accounts', [])

    for account_info in target_accounts:
        account_id = account_info.get('account_id')
        role_name = account_info.get('role_name', 'ComplianceAuditRole')

        print(f"Scanning account {account_id}...")

        credentials = assume_role(account_id, role_name)
        if credentials:
            compliance_summary = get_compliance_summary(credentials)

            account_result = {
                'account_id': account_id,
                'compliance_summary': compliance_summary
            }

            scan_results['accounts'].append(account_result)

    # Calculate total compliance metrics
    total_compliant = sum(acc['compliance_summary']['compliant']
                          for acc in scan_results['accounts'])
    total_non_compliant = sum(acc['compliance_summary']['non_compliant']
                              for acc in scan_results['accounts'])

    scan_results['total_summary'] = {
        'compliant': total_compliant,
        'non_compliant': total_non_compliant,
        'total_rules': total_compliant + total_non_compliant
    }

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
