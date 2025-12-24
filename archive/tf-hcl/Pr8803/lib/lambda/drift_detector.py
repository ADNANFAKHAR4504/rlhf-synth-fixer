"""
Drift Detection Lambda Function

This Lambda function performs infrastructure drift detection by:
1. Querying AWS Config for resource configuration changes
2. Analyzing differences between current and expected state
3. Generating structured JSON reports with drift details
4. Publishing notifications for critical drift events
5. Storing reports in S3 with timestamps
"""

import json
import boto3
import os
from datetime import datetime, timezone
from typing import Dict, List, Any

# Initialize AWS clients
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
config_client = boto3.client('config')
cloudwatch_client = boto3.client('cloudwatch')

# Environment variables
DRIFT_REPORTS_BUCKET = os.environ['DRIFT_REPORTS_BUCKET']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
STATE_LOCK_TABLE = os.environ['STATE_LOCK_TABLE']


def lambda_handler(event, context):
    """
    Main Lambda handler for drift detection

    Args:
        event: EventBridge scheduled event
        context: Lambda context object

    Returns:
        dict: Response with status code and execution summary
    """
    try:
        print(f"Starting drift detection for environment: {ENVIRONMENT_SUFFIX}")

        # Query AWS Config for resource changes
        drift_results = detect_drift()

        # Generate drift report
        report = generate_drift_report(drift_results)

        # Store report in S3
        report_key = store_report(report)

        # Publish metrics to CloudWatch
        publish_metrics(drift_results)

        # Send notifications if critical drift detected
        if report['summary']['critical_drift_count'] > 0:
            send_notification(report, report_key)

        print(f"Drift detection completed. Report stored at: {report_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Drift detection completed successfully',
                'report_key': report_key,
                'drift_count': report['summary']['total_drift_count'],
                'critical_count': report['summary']['critical_drift_count']
            })
        }

    except Exception as e:
        print(f"ERROR: Drift detection failed - {str(e)}")

        # Send error notification
        send_error_notification(str(e))

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Drift detection failed',
                'error': str(e)
            })
        }


def detect_drift() -> List[Dict[str, Any]]:
    """
    Detect infrastructure drift by querying AWS Config

    Returns:
        List of drift events with resource details
    """
    drift_results = []

    # Resource types to monitor
    resource_types = [
        'AWS::EC2::Instance',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket'
    ]

    for resource_type in resource_types:
        try:
            # List resources of this type
            response = config_client.list_discovered_resources(
                resourceType=resource_type,
                limit=100
            )

            for resource in response.get('resourceIdentifiers', []):
                resource_id = resource['resourceId']

                # Get configuration history
                config_history = config_client.get_resource_config_history(
                    resourceType=resource_type,
                    resourceId=resource_id,
                    limit=2  # Get current and previous configuration
                )

                config_items = config_history.get('configurationItems', [])

                if len(config_items) >= 2:
                    current_config = config_items[0]
                    previous_config = config_items[1]

                    # Detect configuration changes
                    if current_config['configuration'] != previous_config['configuration']:
                        drift_event = analyze_drift(
                            resource_type,
                            resource_id,
                            current_config,
                            previous_config
                        )
                        drift_results.append(drift_event)

        except Exception as e:
            print(f"Warning: Failed to check {resource_type} - {str(e)}")
            continue

    return drift_results


def analyze_drift(resource_type: str, resource_id: str,
                 current_config: Dict, previous_config: Dict) -> Dict[str, Any]:
    """
    Analyze drift between current and previous configuration

    Args:
        resource_type: AWS resource type
        resource_id: Resource identifier
        current_config: Current configuration from AWS Config
        previous_config: Previous configuration from AWS Config

    Returns:
        Drift event details with severity and remediation
    """
    # Determine drift severity based on resource type and changes
    severity = determine_severity(resource_type, current_config, previous_config)

    # Generate remediation suggestions
    remediation = generate_remediation(resource_type, current_config, previous_config)

    drift_event = {
        'resource_type': resource_type,
        'resource_id': resource_id,
        'resource_arn': current_config.get('arn', 'N/A'),
        'drift_detected_at': datetime.now(timezone.utc).isoformat(),
        'severity': severity,
        'changes': {
            'current': json.loads(current_config.get('configuration', '{}')),
            'previous': json.loads(previous_config.get('configuration', '{}'))
        },
        'configuration_change_time': current_config.get('configurationItemCaptureTime', 'N/A'),
        'remediation': remediation
    }

    return drift_event


def determine_severity(resource_type: str, current_config: Dict,
                       previous_config: Dict) -> str:
    """
    Determine drift severity based on resource type and change type

    Returns:
        Severity level: CRITICAL, HIGH, MEDIUM, or LOW
    """
    current = json.loads(current_config.get('configuration', '{}'))
    previous = json.loads(previous_config.get('configuration', '{}'))

    # Security group changes are typically critical
    if resource_type == 'AWS::EC2::SecurityGroup':
        if 'ipPermissions' in current or 'ipPermissionsEgress' in current:
            return 'CRITICAL'

    # RDS encryption changes are critical
    if resource_type == 'AWS::RDS::DBInstance':
        if current.get('storageEncrypted') != previous.get('storageEncrypted'):
            return 'CRITICAL'

    # S3 public access changes are critical
    if resource_type == 'AWS::S3::Bucket':
        if 'publicAccessBlockConfiguration' in str(current):
            return 'CRITICAL'

    # Default to HIGH for detected drift
    return 'HIGH'


def generate_remediation(resource_type: str, current_config: Dict,
                        previous_config: Dict) -> str:
    """
    Generate remediation suggestions based on drift type

    Returns:
        Remediation suggestion string
    """
    remediation_map = {
        'AWS::EC2::Instance': 'Review instance configuration changes. Consider using terraform refresh and terraform plan to reconcile state.',
        'AWS::EC2::SecurityGroup': 'CRITICAL: Security group rules have changed. Immediately review ingress/egress rules and update Terraform configuration to match desired state.',
        'AWS::RDS::DBInstance': 'Database configuration drift detected. Review parameter changes and update Terraform code. Consider using terraform import if resource was modified outside Terraform.',
        'AWS::S3::Bucket': 'S3 bucket configuration has drifted. Review bucket policies, versioning, and encryption settings. Update Terraform configuration accordingly.'
    }

    return remediation_map.get(resource_type, 'Review configuration changes and update Terraform code to match desired state.')


def generate_drift_report(drift_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate structured JSON drift report

    Args:
        drift_results: List of drift events

    Returns:
        Complete drift report with summary and details
    """
    # Count drift by severity
    severity_counts = {
        'CRITICAL': 0,
        'HIGH': 0,
        'MEDIUM': 0,
        'LOW': 0
    }

    for drift in drift_results:
        severity = drift.get('severity', 'MEDIUM')
        severity_counts[severity] = severity_counts.get(severity, 0) + 1

    report = {
        'report_metadata': {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'environment': ENVIRONMENT_SUFFIX,
            'report_version': '1.0',
            'detection_method': 'aws_config_analysis'
        },
        'summary': {
            'total_drift_count': len(drift_results),
            'critical_drift_count': severity_counts['CRITICAL'],
            'high_drift_count': severity_counts['HIGH'],
            'medium_drift_count': severity_counts['MEDIUM'],
            'low_drift_count': severity_counts['LOW']
        },
        'drift_events': drift_results,
        'recommendations': [
            'Review all CRITICAL severity drift immediately',
            'Update Terraform configuration files to reflect desired state',
            'Run terraform plan to identify required changes',
            'Consider implementing AWS Config rules for automatic remediation',
            'Review IAM policies to prevent unauthorized configuration changes'
        ]
    }

    return report


def store_report(report: Dict[str, Any]) -> str:
    """
    Store drift report in S3 bucket

    Args:
        report: Drift report dictionary

    Returns:
        S3 object key where report was stored
    """
    timestamp = datetime.now(timezone.utc).strftime('%Y/%m/%d/%H%M%S')
    report_key = f"drift-reports/{ENVIRONMENT_SUFFIX}/{timestamp}/drift-report.json"

    s3_client.put_object(
        Bucket=DRIFT_REPORTS_BUCKET,
        Key=report_key,
        Body=json.dumps(report, indent=2),
        ContentType='application/json',
        ServerSideEncryption='AES256'
    )

    print(f"Report stored: s3://{DRIFT_REPORTS_BUCKET}/{report_key}")

    return report_key


def publish_metrics(drift_results: List[Dict[str, Any]]) -> None:
    """
    Publish drift metrics to CloudWatch

    Args:
        drift_results: List of drift events
    """
    # Count critical drift
    critical_count = sum(1 for d in drift_results if d.get('severity') == 'CRITICAL')

    # Publish metrics
    cloudwatch_client.put_metric_data(
        Namespace='DriftDetection',
        MetricData=[
            {
                'MetricName': 'DriftDetected',
                'Value': len(drift_results),
                'Unit': 'Count',
                'Timestamp': datetime.now(timezone.utc),
                'Dimensions': [
                    {
                        'Name': 'Environment',
                        'Value': ENVIRONMENT_SUFFIX
                    }
                ]
            },
            {
                'MetricName': 'CriticalDrift',
                'Value': critical_count,
                'Unit': 'Count',
                'Timestamp': datetime.now(timezone.utc),
                'Dimensions': [
                    {
                        'Name': 'Environment',
                        'Value': ENVIRONMENT_SUFFIX
                    }
                ]
            }
        ]
    )

    print(f"Metrics published: {len(drift_results)} total drift, {critical_count} critical")


def send_notification(report: Dict[str, Any], report_key: str) -> None:
    """
    Send SNS notification for critical drift

    Args:
        report: Drift report
        report_key: S3 key where report is stored
    """
    summary = report['summary']

    message = f"""
CRITICAL INFRASTRUCTURE DRIFT DETECTED

Environment: {ENVIRONMENT_SUFFIX}
Detection Time: {report['report_metadata']['generated_at']}

SUMMARY:
- Total Drift Events: {summary['total_drift_count']}
- Critical: {summary['critical_drift_count']}
- High: {summary['high_drift_count']}
- Medium: {summary['medium_drift_count']}
- Low: {summary['low_drift_count']}

CRITICAL RESOURCES:
"""

    # Add critical resource details
    critical_drifts = [d for d in report['drift_events'] if d.get('severity') == 'CRITICAL']
    for drift in critical_drifts[:5]:  # Limit to 5 in notification
        message += f"\n- {drift['resource_type']}: {drift['resource_id']}"
        message += f"\n  Remediation: {drift['remediation'][:100]}..."

    message += f"\n\nFull Report: s3://{DRIFT_REPORTS_BUCKET}/{report_key}"
    message += "\n\nACTION REQUIRED: Review and remediate critical drift immediately."

    sns_client.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject=f"[ALERT] Infrastructure Drift Detected - {ENVIRONMENT_SUFFIX}",
        Message=message
    )

    print("Critical drift notification sent")


def send_error_notification(error_message: str) -> None:
    """
    Send SNS notification for drift detection errors

    Args:
        error_message: Error description
    """
    try:
        message = f"""
DRIFT DETECTION FAILURE

Environment: {ENVIRONMENT_SUFFIX}
Time: {datetime.now(timezone.utc).isoformat()}

ERROR:
{error_message}

ACTION REQUIRED: Investigate drift detection system failure.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"[ERROR] Drift Detection Failed - {ENVIRONMENT_SUFFIX}",
            Message=message
        )

    except Exception as e:
        print(f"Failed to send error notification: {str(e)}")
