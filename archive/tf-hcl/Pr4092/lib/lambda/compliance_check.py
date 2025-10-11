"""
HIPAA Compliance Check Lambda Function

This function performs automated compliance validation checks for healthcare infrastructure:
1. Validates security group configurations (no dangerous open ports to internet)
2. Checks S3 bucket encryption status
3. Verifies CloudTrail is active and properly configured
4. Validates VPC Flow Logs are enabled and collecting data
5. Publishes results to SNS and CloudWatch metrics
"""

import boto3
import os
import json
from datetime import datetime
from typing import Dict, List, Any

# Initialize AWS clients
ec2 = boto3.client('ec2')
s3 = boto3.client('s3')
cloudtrail = boto3.client('cloudtrail')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
CLOUDTRAIL_NAME = os.environ.get('CLOUDTRAIL_NAME')
VPC_ID = os.environ.get('VPC_ID')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'production')
APPLICATION = os.environ.get('APPLICATION', 'healthcare-system')

# Dangerous ports that should not be open to the internet
DANGEROUS_PORTS = [22, 3389, 3306, 5432, 1433, 5984, 6379, 9200, 9300, 27017]


def lambda_handler(event, context):
    """
    Main Lambda handler for compliance checks
    """
    print(f"Starting compliance check for {APPLICATION} in {ENVIRONMENT} environment")

    compliance_results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT,
        'application': APPLICATION,
        'checks': {},
        'overall_status': 'PASS',
        'violations': []
    }

    try:
        # Run all compliance checks
        check_security_groups(compliance_results)
        check_s3_encryption(compliance_results)
        check_cloudtrail_status(compliance_results)
        check_vpc_flow_logs(compliance_results)

        # Determine overall compliance status
        if compliance_results['violations']:
            compliance_results['overall_status'] = 'FAIL'

        # Publish results
        publish_results(compliance_results)
        publish_metrics(compliance_results)

        print(f"Compliance check completed. Status: {compliance_results['overall_status']}")

        return {
            'statusCode': 200,
            'body': json.dumps(compliance_results)
        }

    except Exception as e:
        error_message = f"Error during compliance check: {str(e)}"
        print(error_message)

        # Send error notification
        if SNS_TOPIC_ARN:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"[{ENVIRONMENT}] Compliance Check Error",
                Message=error_message
            )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_message})
        }


def check_security_groups(results: Dict[str, Any]) -> None:
    """
    Check for security groups with dangerous ports open to the internet
    HIPAA Requirement: Network isolation and access controls
    """
    print("Checking security groups for dangerous open ports...")

    violations = []

    try:
        # Get all security groups
        response = ec2.describe_security_groups()

        for sg in response['SecurityGroups']:
            sg_id = sg['GroupId']
            sg_name = sg['GroupName']

            # Check ingress rules
            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort', 0)
                to_port = rule.get('ToPort', 65535)

                # Check if any dangerous port is in the range
                for dangerous_port in DANGEROUS_PORTS:
                    if from_port <= dangerous_port <= to_port:
                        # Check if rule allows access from internet (0.0.0.0/0)
                        for ip_range in rule.get('IpRanges', []):
                            if ip_range.get('CidrIp') == '0.0.0.0/0':
                                violation = {
                                    'type': 'SECURITY_GROUP',
                                    'resource': sg_id,
                                    'name': sg_name,
                                    'issue': f"Port {dangerous_port} open to internet (0.0.0.0/0)",
                                    'severity': 'HIGH'
                                }
                                violations.append(violation)
                                print(f"VIOLATION: {sg_name} ({sg_id}) has port {dangerous_port} open to internet")

        results['checks']['security_groups'] = {
            'status': 'PASS' if not violations else 'FAIL',
            'violations_count': len(violations),
            'message': f"Checked security groups, found {len(violations)} violations"
        }

        results['violations'].extend(violations)

    except Exception as e:
        print(f"Error checking security groups: {str(e)}")
        results['checks']['security_groups'] = {
            'status': 'ERROR',
            'error': str(e)
        }


def check_s3_encryption(results: Dict[str, Any]) -> None:
    """
    Check that all S3 buckets have encryption enabled
    HIPAA Requirement: Encryption at rest for all PHI data
    """
    print("Checking S3 bucket encryption...")

    violations = []

    try:
        # List all buckets
        response = s3.list_buckets()

        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']

            try:
                # Check encryption configuration
                s3.get_bucket_encryption(Bucket=bucket_name)
                # If we get here, encryption is enabled

            except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                # No encryption configured
                violation = {
                    'type': 'S3_ENCRYPTION',
                    'resource': bucket_name,
                    'issue': 'S3 bucket does not have encryption enabled',
                    'severity': 'CRITICAL'
                }
                violations.append(violation)
                print(f"VIOLATION: Bucket {bucket_name} does not have encryption enabled")

            except Exception as e:
                # Access denied or other error - log but don't fail
                print(f"Warning: Could not check encryption for bucket {bucket_name}: {str(e)}")

        results['checks']['s3_encryption'] = {
            'status': 'PASS' if not violations else 'FAIL',
            'violations_count': len(violations),
            'message': f"Checked S3 buckets, found {len(violations)} without encryption"
        }

        results['violations'].extend(violations)

    except Exception as e:
        print(f"Error checking S3 encryption: {str(e)}")
        results['checks']['s3_encryption'] = {
            'status': 'ERROR',
            'error': str(e)
        }


def check_cloudtrail_status(results: Dict[str, Any]) -> None:
    """
    Verify CloudTrail is active and logging
    HIPAA Requirement: Audit controls and activity logging
    """
    print("Checking CloudTrail status...")

    violations = []

    try:
        # Describe the CloudTrail
        trails_response = cloudtrail.describe_trails(
            trailNameList=[CLOUDTRAIL_NAME] if CLOUDTRAIL_NAME else []
        )

        if not trails_response.get('trailList'):
            violation = {
                'type': 'CLOUDTRAIL',
                'resource': CLOUDTRAIL_NAME or 'default',
                'issue': 'CloudTrail trail not found',
                'severity': 'CRITICAL'
            }
            violations.append(violation)
            print(f"VIOLATION: CloudTrail {CLOUDTRAIL_NAME} not found")
        else:
            # Check if trail is logging
            for trail in trails_response['trailList']:
                trail_arn = trail['TrailARN']

                status_response = cloudtrail.get_trail_status(Name=trail_arn)

                if not status_response.get('IsLogging'):
                    violation = {
                        'type': 'CLOUDTRAIL',
                        'resource': trail['Name'],
                        'issue': 'CloudTrail is not actively logging',
                        'severity': 'CRITICAL'
                    }
                    violations.append(violation)
                    print(f"VIOLATION: CloudTrail {trail['Name']} is not logging")

                # Check if log file validation is enabled
                if not trail.get('LogFileValidationEnabled'):
                    violation = {
                        'type': 'CLOUDTRAIL',
                        'resource': trail['Name'],
                        'issue': 'CloudTrail log file validation is not enabled',
                        'severity': 'HIGH'
                    }
                    violations.append(violation)
                    print(f"VIOLATION: CloudTrail {trail['Name']} does not have log file validation")

        results['checks']['cloudtrail'] = {
            'status': 'PASS' if not violations else 'FAIL',
            'violations_count': len(violations),
            'message': f"Checked CloudTrail, found {len(violations)} violations"
        }

        results['violations'].extend(violations)

    except Exception as e:
        print(f"Error checking CloudTrail: {str(e)}")
        results['checks']['cloudtrail'] = {
            'status': 'ERROR',
            'error': str(e)
        }


def check_vpc_flow_logs(results: Dict[str, Any]) -> None:
    """
    Verify VPC Flow Logs are enabled and active
    HIPAA Requirement: Network monitoring and audit trails
    """
    print("Checking VPC Flow Logs...")

    violations = []

    try:
        # Get flow logs for the VPC
        response = ec2.describe_flow_logs(
            Filters=[
                {
                    'Name': 'resource-id',
                    'Values': [VPC_ID]
                }
            ]
        )

        flow_logs = response.get('FlowLogs', [])

        if not flow_logs:
            violation = {
                'type': 'VPC_FLOW_LOGS',
                'resource': VPC_ID,
                'issue': 'VPC Flow Logs are not enabled',
                'severity': 'HIGH'
            }
            violations.append(violation)
            print(f"VIOLATION: VPC {VPC_ID} does not have Flow Logs enabled")
        else:
            # Check if any flow log is in failed state
            for flow_log in flow_logs:
                if flow_log.get('FlowLogStatus') != 'ACTIVE':
                    violation = {
                        'type': 'VPC_FLOW_LOGS',
                        'resource': flow_log['FlowLogId'],
                        'issue': f"VPC Flow Log is in {flow_log.get('FlowLogStatus')} state",
                        'severity': 'MEDIUM'
                    }
                    violations.append(violation)
                    print(f"VIOLATION: Flow Log {flow_log['FlowLogId']} is not active")

        results['checks']['vpc_flow_logs'] = {
            'status': 'PASS' if not violations else 'FAIL',
            'violations_count': len(violations),
            'message': f"Checked VPC Flow Logs, found {len(violations)} violations"
        }

        results['violations'].extend(violations)

    except Exception as e:
        print(f"Error checking VPC Flow Logs: {str(e)}")
        results['checks']['vpc_flow_logs'] = {
            'status': 'ERROR',
            'error': str(e)
        }


def publish_results(results: Dict[str, Any]) -> None:
    """
    Publish compliance check results to SNS
    """
    if not SNS_TOPIC_ARN:
        print("SNS Topic ARN not configured, skipping notification")
        return

    try:
        # Format the message
        subject = f"[{ENVIRONMENT}] Compliance Check {results['overall_status']}"

        message_lines = [
            f"HIPAA Compliance Check Results",
            f"",
            f"Environment: {ENVIRONMENT}",
            f"Application: {APPLICATION}",
            f"Timestamp: {results['timestamp']}",
            f"Overall Status: {results['overall_status']}",
            f"",
            f"Check Results:"
        ]

        for check_name, check_result in results['checks'].items():
            status = check_result.get('status', 'UNKNOWN')
            message = check_result.get('message', 'No details')
            message_lines.append(f"  • {check_name}: {status} - {message}")

        if results['violations']:
            message_lines.append(f"")
            message_lines.append(f"Violations Found: {len(results['violations'])}")
            message_lines.append(f"")

            for i, violation in enumerate(results['violations'][:10], 1):  # Limit to first 10
                message_lines.append(
                    f"{i}. [{violation['severity']}] {violation['type']}: "
                    f"{violation['issue']} (Resource: {violation.get('resource', 'N/A')})"
                )

            if len(results['violations']) > 10:
                message_lines.append(f"... and {len(results['violations']) - 10} more violations")

        message = "\n".join(message_lines)

        # Publish to SNS
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        print(f"Published compliance results to SNS: {subject}")

    except Exception as e:
        print(f"Error publishing to SNS: {str(e)}")


def publish_metrics(results: Dict[str, Any]) -> None:
    """
    Publish compliance metrics to CloudWatch
    """
    try:
        namespace = f"{APPLICATION}/Compliance"

        # Overall compliance metric
        cloudwatch.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': 'ComplianceStatus',
                    'Value': 1 if results['overall_status'] == 'PASS' else 0,
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'TotalViolations',
                    'Value': len(results['violations']),
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )

        # Individual check metrics
        for check_name, check_result in results['checks'].items():
            status_value = 1 if check_result.get('status') == 'PASS' else 0
            violations_count = check_result.get('violations_count', 0)

            cloudwatch.put_metric_data(
                Namespace=namespace,
                MetricData=[
                    {
                        'MetricName': f'{check_name}_Status',
                        'Value': status_value,
                        'Unit': 'None',
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': ENVIRONMENT},
                            {'Name': 'CheckType', 'Value': check_name}
                        ]
                    },
                    {
                        'MetricName': f'{check_name}_Violations',
                        'Value': violations_count,
                        'Unit': 'Count',
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': ENVIRONMENT},
                            {'Name': 'CheckType', 'Value': check_name}
                        ]
                    }
                ]
            )

        print(f"Published compliance metrics to CloudWatch namespace: {namespace}")

    except Exception as e:
        print(f"Error publishing metrics: {str(e)}")
