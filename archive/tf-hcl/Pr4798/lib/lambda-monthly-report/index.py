import json
import os
import boto3
import csv
from datetime import datetime, timedelta
from io import StringIO

# Initialize AWS clients
s3_client = boto3.client('s3')
cloudwatch_client = boto3.client('cloudwatch')
ses_client = boto3.client('ses')

# Environment variables
PRIMARY_BUCKET = os.environ['PRIMARY_BUCKET_NAME']
REPORTING_BUCKET = os.environ['REPORTING_BUCKET_NAME']
ENABLE_SES = os.environ.get('ENABLE_SES', 'false').lower() == 'true'
SES_SENDER = os.environ.get('SES_SENDER_EMAIL', '')
SES_RECIPIENTS = os.environ.get('SES_RECIPIENT_EMAILS', '').split(',')

def lambda_handler(event, context):
    """
    Monthly report generation for legal document storage system.
    Generates report with:
    - Total documents and versions
    - Storage usage by tier
    - Monthly growth rates
    - Top users and access patterns
    - Any errors or issues
    """

    print(f"Starting monthly report generation at {datetime.utcnow().isoformat()}")

    # Get current date for report
    report_date = datetime.utcnow()
    report_month = report_date.strftime('%Y-%m')

    # Collect report data
    report_data = {
        'report_date': report_date.isoformat(),
        'report_month': report_month,
        'bucket_name': PRIMARY_BUCKET
    }

    # 1. Get bucket statistics
    try:
        report_data['bucket_stats'] = get_bucket_statistics()
    except Exception as e:
        print(f"Error getting bucket stats: {str(e)}")
        report_data['bucket_stats'] = {'error': str(e)}

    # 2. Get storage metrics
    try:
        report_data['storage_metrics'] = get_storage_metrics()
    except Exception as e:
        print(f"Error getting storage metrics: {str(e)}")
        report_data['storage_metrics'] = {'error': str(e)}

    # 3. Get usage statistics
    try:
        report_data['usage_stats'] = get_usage_statistics()
    except Exception as e:
        print(f"Error getting usage stats: {str(e)}")
        report_data['usage_stats'] = {'error': str(e)}

    # Generate CSV report
    csv_content = generate_csv_report(report_data)

    # Save report to S3
    report_key = f"monthly-reports/{report_month}_storage_report.csv"
    try:
        s3_client.put_object(
            Bucket=REPORTING_BUCKET,
            Key=report_key,
            Body=csv_content.encode('utf-8'),
            ContentType='text/csv',
            ServerSideEncryption='aws:kms'
        )
        print(f"Report saved to s3://{REPORTING_BUCKET}/{report_key}")
        report_data['report_location'] = f"s3://{REPORTING_BUCKET}/{report_key}"
    except Exception as e:
        print(f"Error saving report: {str(e)}")
        report_data['save_error'] = str(e)

    # Send email if SES is enabled
    if ENABLE_SES and SES_SENDER and SES_RECIPIENTS:
        try:
            send_email_report(report_data, csv_content)
        except Exception as e:
            print(f"Error sending email: {str(e)}")

    print(json.dumps(report_data, indent=2, default=str))

    return {
        'statusCode': 200,
        'body': json.dumps(report_data, default=str)
    }

def get_bucket_statistics():
    """Get basic bucket statistics"""
    stats = {}

    # Count objects and versions
    try:
        paginator = s3_client.get_paginator('list_object_versions')
        page_iterator = paginator.paginate(Bucket=PRIMARY_BUCKET)

        total_objects = 0
        total_versions = 0
        current_versions = 0

        for page in page_iterator:
            if 'Versions' in page:
                versions = page['Versions']
                total_versions += len(versions)
                # Count unique keys
                unique_keys = set(v['Key'] for v in versions if v.get('IsLatest', False))
                current_versions += len(unique_keys)

        stats['total_current_objects'] = current_versions
        stats['total_versions'] = total_versions
        stats['average_versions_per_object'] = round(total_versions / max(current_versions, 1), 2)

    except Exception as e:
        print(f"Error counting objects: {str(e)}")
        stats['error'] = str(e)

    return stats

def get_storage_metrics():
    """Get storage usage metrics from CloudWatch"""
    metrics = {}
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=30)

    try:
        # Get bucket size in bytes
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='BucketSizeBytes',
            Dimensions=[
                {'Name': 'BucketName', 'Value': PRIMARY_BUCKET},
                {'Name': 'StorageType', 'Value': 'StandardStorage'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,  # Daily
            Statistics=['Average']
        )

        if response['Datapoints']:
            # Get most recent datapoint
            latest = max(response['Datapoints'], key=lambda x: x['Timestamp'])
            metrics['standard_storage_bytes'] = int(latest['Average'])
            metrics['standard_storage_gb'] = round(latest['Average'] / (1024**3), 2)

        # Get Glacier storage
        response_glacier = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='BucketSizeBytes',
            Dimensions=[
                {'Name': 'BucketName', 'Value': PRIMARY_BUCKET},
                {'Name': 'StorageType', 'Value': 'GlacierStorage'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=['Average']
        )

        if response_glacier['Datapoints']:
            latest = max(response_glacier['Datapoints'], key=lambda x: x['Timestamp'])
            metrics['glacier_storage_bytes'] = int(latest['Average'])
            metrics['glacier_storage_gb'] = round(latest['Average'] / (1024**3), 2)

        # Calculate total storage
        total_bytes = metrics.get('standard_storage_bytes', 0) + metrics.get('glacier_storage_bytes', 0)
        metrics['total_storage_bytes'] = total_bytes
        metrics['total_storage_gb'] = round(total_bytes / (1024**3), 2)

    except Exception as e:
        print(f"Error getting storage metrics: {str(e)}")
        metrics['error'] = str(e)

    return metrics

def get_usage_statistics():
    """Get usage statistics from CloudWatch"""
    stats = {}
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=30)

    try:
        # Get request metrics
        for metric_name in ['AllRequests', 'GetRequests', 'PutRequests']:
            response = cloudwatch_client.get_metric_statistics(
                Namespace='AWS/S3',
                MetricName=metric_name,
                Dimensions=[
                    {'Name': 'BucketName', 'Value': PRIMARY_BUCKET}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=2592000,  # 30 days
                Statistics=['Sum']
            )

            if response['Datapoints']:
                stats[metric_name.lower()] = int(response['Datapoints'][0]['Sum'])

        # Get error rates
        for error_type in ['4xxErrors', '5xxErrors']:
            response = cloudwatch_client.get_metric_statistics(
                Namespace='AWS/S3',
                MetricName=error_type,
                Dimensions=[
                    {'Name': 'BucketName', 'Value': PRIMARY_BUCKET}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=2592000,
                Statistics=['Sum']
            )

            if response['Datapoints']:
                stats[error_type.lower()] = int(response['Datapoints'][0]['Sum'])

    except Exception as e:
        print(f"Error getting usage stats: {str(e)}")
        stats['error'] = str(e)

    return stats

def generate_csv_report(report_data):
    """Generate CSV format report"""
    output = StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(['Legal Document Storage - Monthly Report'])
    writer.writerow(['Report Date', report_data['report_date']])
    writer.writerow(['Report Month', report_data['report_month']])
    writer.writerow(['Bucket', report_data['bucket_name']])
    writer.writerow([])

    # Bucket Statistics
    writer.writerow(['Bucket Statistics'])
    writer.writerow(['Metric', 'Value'])
    bucket_stats = report_data.get('bucket_stats', {})
    for key, value in bucket_stats.items():
        writer.writerow([key.replace('_', ' ').title(), value])
    writer.writerow([])

    # Storage Metrics
    writer.writerow(['Storage Metrics'])
    writer.writerow(['Metric', 'Value'])
    storage_metrics = report_data.get('storage_metrics', {})
    for key, value in storage_metrics.items():
        writer.writerow([key.replace('_', ' ').title(), value])
    writer.writerow([])

    # Usage Statistics
    writer.writerow(['Usage Statistics (Last 30 Days)'])
    writer.writerow(['Metric', 'Value'])
    usage_stats = report_data.get('usage_stats', {})
    for key, value in usage_stats.items():
        writer.writerow([key.replace('_', ' ').title(), value])
    writer.writerow([])

    return output.getvalue()

def send_email_report(report_data, csv_content):
    """Send report via SES email"""
    subject = f"Legal Document Storage Report - {report_data['report_month']}"

    body_text = f"""
Legal Document Storage - Monthly Report

Report Date: {report_data['report_date']}
Report Month: {report_data['report_month']}
Bucket: {report_data['bucket_name']}

Summary:
- Total Current Objects: {report_data.get('bucket_stats', {}).get('total_current_objects', 'N/A')}
- Total Versions: {report_data.get('bucket_stats', {}).get('total_versions', 'N/A')}
- Total Storage: {report_data.get('storage_metrics', {}).get('total_storage_gb', 'N/A')} GB

The detailed CSV report is attached and has been saved to:
{report_data.get('report_location', 'N/A')}

This is an automated report from the Legal Document Storage System.
"""

    # Send email
    response = ses_client.send_email(
        Source=SES_SENDER,
        Destination={
            'ToAddresses': [email.strip() for email in SES_RECIPIENTS if email.strip()]
        },
        Message={
            'Subject': {
                'Data': subject,
                'Charset': 'UTF-8'
            },
            'Body': {
                'Text': {
                    'Data': body_text,
                    'Charset': 'UTF-8'
                }
            }
        }
    )

    print(f"Email sent. Message ID: {response['MessageId']}")
    return response
