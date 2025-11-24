"""report_generator.py
Lambda function for generating compliance reports in JSON and CSV formats.
"""

import json
import csv
import io
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')

AUDIT_BUCKET = os.environ['AUDIT_BUCKET']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def load_scan_results(scan_key):
    """
    Load scan results from S3.

    Args:
        scan_key: S3 key of scan results

    Returns:
        Dictionary of scan results
    """
    try:
        response = s3_client.get_object(
            Bucket=AUDIT_BUCKET,
            Key=scan_key
        )
        scan_data = json.loads(response['Body'].read().decode('utf-8'))
        return scan_data
    except ClientError as e:
        print(f"Error loading scan results: {e}")
        return None


def generate_json_report(scan_data):
    """
    Generate detailed JSON compliance report.

    Args:
        scan_data: Scan results dictionary

    Returns:
        JSON string
    """
    report = {
        'report_generated': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT_SUFFIX,
        'scan_timestamp': scan_data.get('timestamp'),
        'executive_summary': {
            'total_accounts': len(scan_data.get('accounts', [])),
            'total_compliant': scan_data.get('total_summary', {}).get('compliant', 0),
            'total_non_compliant': scan_data.get('total_summary', {}).get('non_compliant', 0),
            'compliance_percentage': 0
        },
        'account_details': []
    }

    # Calculate compliance percentage
    total_rules = report['executive_summary']['total_compliant'] + \
                  report['executive_summary']['total_non_compliant']

    if total_rules > 0:
        report['executive_summary']['compliance_percentage'] = round(
            (report['executive_summary']['total_compliant'] / total_rules) * 100, 2
        )

    # Add account details
    for account in scan_data.get('accounts', []):
        account_detail = {
            'account_id': account.get('account_id'),
            'compliance_summary': account.get('compliance_summary'),
            'violations': []
        }

        # Extract non-compliant rules
        for rule in account.get('compliance_summary', {}).get('rules', []):
            if rule.get('status') == 'NON_COMPLIANT':
                account_detail['violations'].append({
                    'rule_name': rule.get('rule_name'),
                    'rule_id': rule.get('rule_id'),
                    'status': rule.get('status')
                })

        report['account_details'].append(account_detail)

    return json.dumps(report, indent=2)


def generate_csv_report(scan_data):
    """
    Generate CSV compliance report.

    Args:
        scan_data: Scan results dictionary

    Returns:
        CSV string
    """
    output = io.StringIO()
    csv_writer = csv.writer(output)

    # Header
    csv_writer.writerow([
        'Account ID',
        'Rule Name',
        'Rule ID',
        'Compliance Status',
        'Scan Timestamp'
    ])

    # Data rows
    for account in scan_data.get('accounts', []):
        account_id = account.get('account_id')

        for rule in account.get('compliance_summary', {}).get('rules', []):
            csv_writer.writerow([
                account_id,
                rule.get('rule_name'),
                rule.get('rule_id'),
                rule.get('status'),
                scan_data.get('timestamp')
            ])

    return output.getvalue()


def save_report(report_content, report_type, timestamp):
    """
    Save report to S3.

    Args:
        report_content: Report content (JSON or CSV)
        report_type: 'json' or 'csv'
        timestamp: Report timestamp

    Returns:
        S3 key
    """
    s3_key = f"reports/{timestamp}/compliance-report.{report_type}"

    try:
        s3_client.put_object(
            Bucket=AUDIT_BUCKET,
            Key=s3_key,
            Body=report_content,
            ContentType='application/json' if report_type == 'json' else 'text/csv'
        )
        print(f"Report saved to s3://{AUDIT_BUCKET}/{s3_key}")
        return s3_key
    except ClientError as e:
        print(f"Error saving report to S3: {e}")
        return None


def handler(event, context):
    """
    Main Lambda handler for report generation.

    Generates compliance reports in JSON and CSV formats
    from scan results.
    """
    print(f"Starting report generation - Environment: {ENVIRONMENT_SUFFIX}")

    # Extract scan key from event
    detail = event.get('detail', {})
    scan_key = detail.get('scan_key')

    if not scan_key:
        print("No scan_key found in event")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'scan_key required'})
        }

    # Load scan results
    scan_data = load_scan_results(scan_key)
    if not scan_data:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Scan results not found'})
        }

    timestamp = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')

    # Generate JSON report
    json_report = generate_json_report(scan_data)
    json_key = save_report(json_report, 'json', timestamp)

    # Generate CSV report
    csv_report = generate_csv_report(scan_data)
    csv_key = save_report(csv_report, 'csv', timestamp)

    print(f"Reports generated successfully")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Reports generated successfully',
            'json_report': json_key,
            'csv_report': csv_key
        })
    }
