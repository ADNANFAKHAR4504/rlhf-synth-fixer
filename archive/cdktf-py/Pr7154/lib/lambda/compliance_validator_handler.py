"""Lambda handler for post-deployment compliance validation."""

import json
import boto3
import os
from datetime import datetime, timezone
from typing import Dict, Any, List


def handler(event, context):
    """
    Lambda handler for post-deployment validation.

    Args:
        event: Lambda event (can be S3 event or scheduled event)
        context: Lambda context

    Returns:
        Response with validation results
    """
    print("Starting post-deployment compliance validation...")

    reports_bucket = os.environ.get('REPORTS_BUCKET')
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'unknown')
    # Use REGION instead of AWS_REGION (AWS_REGION is reserved by Lambda)
    aws_region = os.environ.get('REGION', os.environ.get('AWS_DEFAULT_REGION', 'us-east-1'))

    # Initialize AWS clients
    ec2_client = boto3.client('ec2', region_name=aws_region)
    iam_client = boto3.client('iam')
    s3_client = boto3.client('s3', region_name=aws_region)
    rds_client = boto3.client('rds', region_name=aws_region)

    # Run validators
    violations = []

    violations.extend(validate_security_groups(ec2_client, environment_suffix))
    violations.extend(validate_iam_policies(iam_client))
    violations.extend(validate_s3_encryption(s3_client, environment_suffix))
    violations.extend(validate_rds_encryption(rds_client, environment_suffix))
    violations.extend(validate_resource_tags(ec2_client, s3_client, rds_client, environment_suffix))

    # Generate report
    report = generate_validation_report(violations, environment_suffix)

    # Save report to S3
    if reports_bucket:
        save_report_to_s3(s3_client, reports_bucket, report, environment_suffix)

    return {
        'statusCode': 200 if report['summary']['status'] == 'PASS' else 400,
        'body': json.dumps(report)
    }


def validate_security_groups(ec2_client, environment_suffix: str) -> List[Dict[str, Any]]:
    """Validate security groups for overly permissive rules."""
    violations = []

    try:
        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Environment', 'Values': [environment_suffix]}
            ]
        )

        for sg in response.get('SecurityGroups', []):
            sg_id = sg['GroupId']
            sg_name = sg.get('GroupName', 'unknown')

            for rule in sg.get('IpPermissions', []):
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        violations.append({
                            'severity': 'HIGH',
                            'resource_type': 'AWS::EC2::SecurityGroup',
                            'resource_id': sg_id,
                            'resource_name': sg_name,
                            'violation_type': 'UNRESTRICTED_INGRESS',
                            'details': {
                                'cidr': '0.0.0.0/0',
                                'from_port': rule.get('FromPort'),
                                'to_port': rule.get('ToPort'),
                                'protocol': rule.get('IpProtocol')
                            },
                            'remediation': f'Restrict security group {sg_name} to specific IP ranges'
                        })
    except Exception as e:
        print(f"Error validating security groups: {e}")

    return violations


def validate_iam_policies(iam_client) -> List[Dict[str, Any]]:
    """Validate IAM policies for wildcard permissions."""
    violations = []

    try:
        # Check customer-managed policies
        response = iam_client.list_policies(Scope='Local', MaxItems=100)

        for policy in response.get('Policies', []):
            policy_arn = policy['Arn']
            policy_name = policy['PolicyName']

            # Get policy version
            version_response = iam_client.get_policy_version(
                PolicyArn=policy_arn,
                VersionId=policy['DefaultVersionId']
            )

            policy_document = version_response['PolicyVersion']['Document']

            for statement in policy_document.get('Statement', []):
                if statement.get('Effect') == 'Allow':
                    actions = statement.get('Action', [])
                    resources = statement.get('Resource', [])

                    if not isinstance(actions, list):
                        actions = [actions]
                    if not isinstance(resources, list):
                        resources = [resources]

                    if any('*' in a for a in actions) and '*' in resources:
                        violations.append({
                            'severity': 'CRITICAL',
                            'resource_type': 'AWS::IAM::Policy',
                            'resource_id': policy_arn,
                            'resource_name': policy_name,
                            'violation_type': 'WILDCARD_PERMISSIONS',
                            'details': {
                                'actions': [a for a in actions if '*' in a],
                                'resources': resources
                            },
                            'remediation': f'Replace wildcard permissions in {policy_name} with specific actions'
                        })
    except Exception as e:
        print(f"Error validating IAM policies: {e}")

    return violations


def validate_s3_encryption(s3_client, environment_suffix: str) -> List[Dict[str, Any]]:
    """Validate S3 bucket encryption."""
    violations = []

    try:
        response = s3_client.list_buckets()

        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']

            # Check if bucket belongs to this environment
            if environment_suffix not in bucket_name:
                continue

            try:
                s3_client.get_bucket_encryption(Bucket=bucket_name)
            except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                violations.append({
                    'severity': 'HIGH',
                    'resource_type': 'AWS::S3::Bucket',
                    'resource_id': bucket_name,
                    'resource_name': bucket_name,
                    'violation_type': 'MISSING_ENCRYPTION',
                    'details': {
                        'resource': bucket_name,
                        'encryption_status': 'disabled'
                    },
                    'remediation': f'Enable server-side encryption for S3 bucket {bucket_name}'
                })
    except Exception as e:
        print(f"Error validating S3 encryption: {e}")

    return violations


def validate_rds_encryption(rds_client, environment_suffix: str) -> List[Dict[str, Any]]:
    """Validate RDS encryption."""
    violations = []

    try:
        # Check RDS instances
        response = rds_client.describe_db_instances()

        for instance in response.get('DBInstances', []):
            instance_id = instance['DBInstanceIdentifier']

            if environment_suffix not in instance_id:
                continue

            if not instance.get('StorageEncrypted', False):
                violations.append({
                    'severity': 'HIGH',
                    'resource_type': 'AWS::RDS::DBInstance',
                    'resource_id': instance_id,
                    'resource_name': instance_id,
                    'violation_type': 'RDS_ENCRYPTION_DISABLED',
                    'details': {
                        'resource': instance_id,
                        'storage_encrypted': False
                    },
                    'remediation': f'Enable storage encryption for RDS instance {instance_id}'
                })
    except Exception as e:
        print(f"Error validating RDS encryption: {e}")

    return violations


def validate_resource_tags(ec2_client, s3_client, rds_client, environment_suffix: str) -> List[Dict[str, Any]]:
    """Validate resource tagging compliance."""
    violations = []
    required_tags = ['Environment', 'Owner', 'CostCenter']

    try:
        # Check EC2 instances
        response = ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Environment', 'Values': [environment_suffix]}
            ]
        )

        for reservation in response.get('Reservations', []):
            for instance in reservation.get('Instances', []):
                instance_id = instance['InstanceId']
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

                missing_tags = [tag for tag in required_tags if tag not in tags]

                if missing_tags:
                    violations.append({
                        'severity': 'MEDIUM',
                        'resource_type': 'AWS::EC2::Instance',
                        'resource_id': instance_id,
                        'resource_name': instance_id,
                        'violation_type': 'MISSING_REQUIRED_TAGS',
                        'details': {
                            'missing_tags': missing_tags,
                            'required_tags': required_tags
                        },
                        'remediation': f'Add missing tags to instance {instance_id}: {", ".join(missing_tags)}'
                    })
    except Exception as e:
        print(f"Error validating resource tags: {e}")

    return violations


def generate_validation_report(violations: List[Dict[str, Any]], environment_suffix: str) -> Dict[str, Any]:
    """Generate validation report."""
    total_violations = len(violations)
    critical_count = len([v for v in violations if v.get('severity') == 'CRITICAL'])
    high_count = len([v for v in violations if v.get('severity') == 'HIGH'])
    medium_count = len([v for v in violations if v.get('severity') == 'MEDIUM'])

    status = 'PASS' if total_violations == 0 else 'FAIL'
    compliance_score = max(0.0, 100.0 - (critical_count * 20) - (high_count * 10) - (medium_count * 5))

    return {
        'report_metadata': {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'environment': environment_suffix,
            'validation_type': 'post_deployment'
        },
        'summary': {
            'status': status,
            'compliance_score': compliance_score,
            'total_violations': total_violations,
            'violations_by_severity': {
                'CRITICAL': critical_count,
                'HIGH': high_count,
                'MEDIUM': medium_count
            }
        },
        'violations': violations
    }


def save_report_to_s3(s3_client, bucket: str, report: Dict[str, Any], environment_suffix: str):
    """Save validation report to S3."""
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    key = f"compliance-reports/{environment_suffix}/validation-{timestamp}.json"

    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )
        print(f"Report saved to s3://{bucket}/{key}")
    except Exception as e:
        print(f"Error saving report to S3: {e}")
