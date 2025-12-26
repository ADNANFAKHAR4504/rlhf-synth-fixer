"""
Compliance Analysis Module for Infrastructure QA and Management

This module provides standalone compliance analysis functions that can be:
1. Used by Lambda functions for real-time compliance checks
2. Run locally for testing and validation
3. Integrated into CI/CD pipelines for infrastructure validation

Functions:
- analyse_ec2_tags: Check EC2 instances for required tags
- analyse_s3_encryption: Validate S3 bucket encryption configuration
- analyse_rds_backups: Verify RDS automated backup settings
- generate_compliance_report: Aggregate compliance data into reports
"""

import boto3
import json
import os
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional
from botocore.exceptions import ClientError


# Required tags for compliance
REQUIRED_TAGS = ['Environment', 'Compliance', 'ManagedBy']


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal types from DynamoDB."""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def get_boto3_client(service: str, region: Optional[str] = None):
    """Get a boto3 client for the specified service."""
    return boto3.client(service, region_name=region or os.environ.get('AWS_REGION', 'us-east-1'))


def get_boto3_resource(service: str, region: Optional[str] = None):
    """Get a boto3 resource for the specified service."""
    return boto3.resource(service, region_name=region or os.environ.get('AWS_REGION', 'us-east-1'))


def analyse_ec2_tags(
    required_tags: Optional[List[str]] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyse EC2 instances for required tag compliance.

    Args:
        required_tags: List of required tag keys. Defaults to REQUIRED_TAGS.
        region: AWS region to check. Defaults to environment variable or us-east-1.

    Returns:
        Dictionary containing compliance analysis results.
    """
    if required_tags is None:
        required_tags = REQUIRED_TAGS

    ec2 = get_boto3_client('ec2', region)
    timestamp = datetime.utcnow().isoformat()

    response = ec2.describe_instances()

    results = {
        'timestamp': timestamp,
        'resource_type': 'EC2',
        'total_instances': 0,
        'compliant': 0,
        'non_compliant': 0,
        'details': []
    }

    for reservation in response.get('Reservations', []):
        for instance in reservation.get('Instances', []):
            instance_id = instance['InstanceId']
            instance_state = instance.get('State', {}).get('Name', 'unknown')

            # Skip terminated instances
            if instance_state == 'terminated':
                continue

            results['total_instances'] += 1
            tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
            missing_tags = [tag for tag in required_tags if tag not in tags]
            is_compliant = len(missing_tags) == 0

            if is_compliant:
                results['compliant'] += 1
            else:
                results['non_compliant'] += 1

            results['details'].append({
                'resource_id': instance_id,
                'state': instance_state,
                'compliant': is_compliant,
                'missing_tags': missing_tags,
                'existing_tags': list(tags.keys())
            })

    return results


def analyse_s3_encryption(region: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyse S3 buckets for encryption compliance.

    Args:
        region: AWS region to check. Defaults to environment variable or us-east-1.

    Returns:
        Dictionary containing encryption compliance analysis results.
    """
    s3 = get_boto3_client('s3', region)
    timestamp = datetime.utcnow().isoformat()

    response = s3.list_buckets()

    results = {
        'timestamp': timestamp,
        'resource_type': 'S3',
        'total_buckets': 0,
        'compliant': 0,
        'non_compliant': 0,
        'details': []
    }

    for bucket in response.get('Buckets', []):
        bucket_name = bucket['Name']
        results['total_buckets'] += 1

        try:
            encryption = s3.get_bucket_encryption(Bucket=bucket_name)
            encryption_config = encryption.get('ServerSideEncryptionConfiguration', {})
            rules = encryption_config.get('Rules', [])

            is_compliant = len(rules) > 0
            encryption_algorithm = None

            if rules:
                default_encryption = rules[0].get('ApplyServerSideEncryptionByDefault', {})
                encryption_algorithm = default_encryption.get('SSEAlgorithm')

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'ServerSideEncryptionConfigurationNotFoundError':
                is_compliant = False
                encryption_algorithm = None
            else:
                # Skip buckets we cannot access
                results['total_buckets'] -= 1
                continue

        if is_compliant:
            results['compliant'] += 1
        else:
            results['non_compliant'] += 1

        results['details'].append({
            'resource_id': bucket_name,
            'compliant': is_compliant,
            'encryption_enabled': is_compliant,
            'encryption_algorithm': encryption_algorithm
        })

    return results


def analyse_rds_backups(
    min_retention_days: int = 1,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyse RDS instances for backup compliance.

    Args:
        min_retention_days: Minimum required backup retention period in days.
        region: AWS region to check. Defaults to environment variable or us-east-1.

    Returns:
        Dictionary containing backup compliance analysis results.
    """
    rds = get_boto3_client('rds', region)
    timestamp = datetime.utcnow().isoformat()

    response = rds.describe_db_instances()

    results = {
        'timestamp': timestamp,
        'resource_type': 'RDS',
        'total_instances': 0,
        'compliant': 0,
        'non_compliant': 0,
        'details': []
    }

    for db_instance in response.get('DBInstances', []):
        db_identifier = db_instance['DBInstanceIdentifier']
        backup_retention = db_instance.get('BackupRetentionPeriod', 0)
        db_status = db_instance.get('DBInstanceStatus', 'unknown')

        results['total_instances'] += 1
        is_compliant = backup_retention >= min_retention_days

        if is_compliant:
            results['compliant'] += 1
        else:
            results['non_compliant'] += 1

        results['details'].append({
            'resource_id': db_identifier,
            'status': db_status,
            'compliant': is_compliant,
            'backup_retention_days': backup_retention,
            'automated_backups_enabled': backup_retention > 0
        })

    return results


def store_compliance_result(
    table_name: str,
    resource_id: str,
    resource_type: str,
    compliant: bool,
    details: Dict[str, Any],
    region: Optional[str] = None
) -> bool:
    """
    Store a compliance evaluation result in DynamoDB.

    Args:
        table_name: DynamoDB table name.
        resource_id: Resource identifier.
        resource_type: Type of resource (EC2, S3, RDS).
        compliant: Whether the resource is compliant.
        details: Additional details about the evaluation.
        region: AWS region. Defaults to environment variable or us-east-1.

    Returns:
        True if storage was successful, False otherwise.
    """
    dynamodb = get_boto3_resource('dynamodb', region)
    table = dynamodb.Table(table_name)
    timestamp = datetime.utcnow().isoformat()

    try:
        table.put_item(Item={
            'resource_id': resource_id,
            'evaluation_timestamp': timestamp,
            'resource_type': resource_type,
            'compliant': compliant,
            'details': json.dumps(details)
        })
        return True
    except ClientError as e:
        print(f"Error storing compliance result: {e}")
        return False


def send_compliance_alert(
    topic_arn: str,
    subject: str,
    message: str,
    region: Optional[str] = None
) -> bool:
    """
    Send a compliance alert via SNS.

    Args:
        topic_arn: SNS topic ARN.
        subject: Alert subject.
        message: Alert message body.
        region: AWS region. Defaults to environment variable or us-east-1.

    Returns:
        True if alert was sent successfully, False otherwise.
    """
    sns = get_boto3_client('sns', region)

    try:
        sns.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
        return True
    except ClientError as e:
        print(f"Error sending compliance alert: {e}")
        return False


def generate_compliance_report(
    table_name: str,
    hours: int = 24,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a compliance report from DynamoDB data.

    Args:
        table_name: DynamoDB table name containing compliance history.
        hours: Number of hours to include in the report.
        region: AWS region. Defaults to environment variable or us-east-1.

    Returns:
        Dictionary containing the compliance report.
    """
    dynamodb = get_boto3_resource('dynamodb', region)
    table = dynamodb.Table(table_name)

    cutoff_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()

    # Scan for all records
    response = table.scan()
    items = response.get('Items', [])

    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))

    # Filter recent items
    recent_items = [
        item for item in items
        if item.get('evaluation_timestamp', '') >= cutoff_time
    ]

    # Aggregate by resource type
    by_type: Dict[str, Dict[str, int]] = {}
    for item in recent_items:
        resource_type = item.get('resource_type', 'Unknown')
        if resource_type not in by_type:
            by_type[resource_type] = {'total': 0, 'compliant': 0, 'non_compliant': 0}

        by_type[resource_type]['total'] += 1
        if item.get('compliant', False):
            by_type[resource_type]['compliant'] += 1
        else:
            by_type[resource_type]['non_compliant'] += 1

    # Calculate overall compliance score
    total_resources = sum(rt['total'] for rt in by_type.values())
    total_compliant = sum(rt['compliant'] for rt in by_type.values())
    compliance_score = (total_compliant / total_resources * 100) if total_resources > 0 else 100.0

    report = {
        'report_timestamp': datetime.utcnow().isoformat(),
        'evaluation_period': f'{hours} hours',
        'compliance_score': round(compliance_score, 2),
        'summary': {
            'total_resources': total_resources,
            'compliant': total_compliant,
            'non_compliant': total_resources - total_compliant
        },
        'by_resource_type': by_type,
        'recent_evaluations': len(recent_items)
    }

    return report


def upload_report_to_s3(
    bucket_name: str,
    report: Dict[str, Any],
    prefix: str = 'reports',
    region: Optional[str] = None
) -> str:
    """
    Upload a compliance report to S3.

    Args:
        bucket_name: S3 bucket name.
        report: Report dictionary to upload.
        prefix: S3 key prefix for the report.
        region: AWS region. Defaults to environment variable or us-east-1.

    Returns:
        S3 URI of the uploaded report.
    """
    s3 = get_boto3_client('s3', region)

    timestamp = datetime.utcnow()
    date_path = timestamp.strftime('%Y/%m/%d')
    report_name = f"compliance-report-{timestamp.strftime('%Y%m%d-%H%M%S')}.json"
    report_key = f"{prefix}/{date_path}/{report_name}"

    s3.put_object(
        Bucket=bucket_name,
        Key=report_key,
        Body=json.dumps(report, indent=2, cls=DecimalEncoder),
        ContentType='application/json'
    )

    return f"s3://{bucket_name}/{report_key}"


def run_full_compliance_check(
    dynamodb_table: Optional[str] = None,
    sns_topic_arn: Optional[str] = None,
    reports_bucket: Optional[str] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run a full compliance check across EC2, S3, and RDS resources.

    Args:
        dynamodb_table: Optional DynamoDB table name to store results.
        sns_topic_arn: Optional SNS topic ARN to send alerts.
        reports_bucket: Optional S3 bucket name to upload reports.
        region: AWS region. Defaults to environment variable or us-east-1.

    Returns:
        Dictionary containing all compliance check results.
    """
    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'ec2': analyse_ec2_tags(region=region),
        's3': analyse_s3_encryption(region=region),
        'rds': analyse_rds_backups(region=region)
    }

    # Calculate overall statistics
    total = sum([
        results['ec2']['total_instances'],
        results['s3']['total_buckets'],
        results['rds']['total_instances']
    ])

    compliant = sum([
        results['ec2']['compliant'],
        results['s3']['compliant'],
        results['rds']['compliant']
    ])

    results['summary'] = {
        'total_resources': total,
        'compliant': compliant,
        'non_compliant': total - compliant,
        'compliance_score': round((compliant / total * 100) if total > 0 else 100.0, 2)
    }

    # Store results in DynamoDB if table provided
    if dynamodb_table:
        for check_type in ['ec2', 's3', 'rds']:
            for detail in results[check_type].get('details', []):
                store_compliance_result(
                    table_name=dynamodb_table,
                    resource_id=detail['resource_id'],
                    resource_type=results[check_type]['resource_type'],
                    compliant=detail['compliant'],
                    details=detail,
                    region=region
                )

    # Send alerts for non-compliant resources
    if sns_topic_arn and results['summary']['non_compliant'] > 0:
        message = f"Compliance Alert - {results['summary']['non_compliant']} non-compliant resources found\n\n"
        message += f"EC2: {results['ec2']['non_compliant']} non-compliant\n"
        message += f"S3: {results['s3']['non_compliant']} non-compliant\n"
        message += f"RDS: {results['rds']['non_compliant']} non-compliant\n"
        message += f"\nOverall Compliance Score: {results['summary']['compliance_score']}%"

        send_compliance_alert(
            topic_arn=sns_topic_arn,
            subject='Infrastructure Compliance Alert',
            message=message,
            region=region
        )

    # Upload report to S3 if bucket provided
    if reports_bucket:
        report_uri = upload_report_to_s3(
            bucket_name=reports_bucket,
            report=results,
            region=region
        )
        results['report_location'] = report_uri

    return results


def main(args=None):
    """
    CLI entry point for compliance analysis.

    Args:
        args: Command line arguments. If None, uses sys.argv.

    Returns:
        Dictionary containing compliance check results.
    """
    import argparse

    parser = argparse.ArgumentParser(description='Run compliance analysis')
    parser.add_argument('--region', default='us-east-1', help='AWS region')
    parser.add_argument('--ec2', action='store_true',
                        help='Check EC2 tag compliance')
    parser.add_argument('--s3', action='store_true',
                        help='Check S3 encryption compliance')
    parser.add_argument('--rds', action='store_true',
                        help='Check RDS backup compliance')
    parser.add_argument('--all', action='store_true',
                        help='Run all compliance checks')

    parsed_args = parser.parse_args(args)
    results = {}

    if parsed_args.all or (not parsed_args.ec2 and not parsed_args.s3
                           and not parsed_args.rds):
        print("Running full compliance check...")
        results = run_full_compliance_check(region=parsed_args.region)
        print(json.dumps(results, indent=2, cls=DecimalEncoder))
    else:
        if parsed_args.ec2:
            print("Checking EC2 tag compliance...")
            results['ec2'] = analyse_ec2_tags(region=parsed_args.region)
            print(json.dumps(results['ec2'], indent=2))

        if parsed_args.s3:
            print("Checking S3 encryption compliance...")
            results['s3'] = analyse_s3_encryption(region=parsed_args.region)
            print(json.dumps(results['s3'], indent=2))

        if parsed_args.rds:
            print("Checking RDS backup compliance...")
            results['rds'] = analyse_rds_backups(region=parsed_args.region)
            print(json.dumps(results['rds'], indent=2))

    return results


if __name__ == '__main__':  # pragma: no cover
    main()
