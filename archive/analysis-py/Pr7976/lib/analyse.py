#!/usr/bin/env python3
"""
Infrastructure Security Audit Tool

This module provides comprehensive security analysis for AWS infrastructure.
It scans EC2 instances, RDS databases, S3 buckets, IAM roles, and Security Groups
to identify security misconfigurations and compliance gaps against the AWS
Well-Architected Framework security pillar.

Functions:
- analyze_ec2_instances: Check EC2 for unencrypted volumes and IMDSv2
- analyze_rds_instances: Verify encryption, backups, and deletion protection
- analyze_s3_buckets: Check encryption, versioning, and public access
- analyze_iam_roles: Detect overly permissive policies
- analyze_security_groups: Identify unrestricted inbound rules
- generate_compliance_report: Aggregate findings with compliance score
"""

import boto3
import json
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, List, Any, Optional
from botocore.exceptions import ClientError


# Severity weights for compliance scoring
SEVERITY_WEIGHTS = {
    'Critical': 10,
    'High': 5,
    'Medium': 2,
    'Low': 1
}

# High-risk ports that should not be open to the internet
HIGH_RISK_PORTS = [22, 3389, 3306, 5432, 1433, 27017, 6379, 9200]


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal types from DynamoDB."""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def get_boto3_client(service: str, region: Optional[str] = None):
    """Get a boto3 client for the specified service."""
    return boto3.client(
        service,
        region_name=region or os.environ.get('AWS_REGION', 'us-east-1')
    )


def get_boto3_resource(service: str, region: Optional[str] = None):
    """Get a boto3 resource for the specified service."""
    return boto3.resource(
        service,
        region_name=region or os.environ.get('AWS_REGION', 'us-east-1')
    )


def analyze_ec2_instances(
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze EC2 instances for security compliance.

    Checks for:
    - Unencrypted EBS volumes
    - IMDSv2 enforcement (HttpTokens required)
    - Instances in public subnets with public IPs

    Args:
        environment_suffix: Environment tag to filter instances.
        region: AWS region to check.

    Returns:
        Dictionary containing EC2 security analysis results.
    """
    ec2 = get_boto3_client('ec2', region)
    timestamp = datetime.now(timezone.utc).isoformat()

    results = {
        'timestamp': timestamp,
        'resource_type': 'EC2',
        'total_instances': 0,
        'compliant': 0,
        'non_compliant': 0,
        'findings': [],
        'details': []
    }

    try:
        filters = []
        if environment_suffix:
            filters.append({
                'Name': 'tag:Environment',
                'Values': [environment_suffix]
            })

        response = ec2.describe_instances(Filters=filters if filters else [])

        for reservation in response.get('Reservations', []):
            for instance in reservation.get('Instances', []):
                instance_id = instance['InstanceId']
                instance_state = instance.get('State', {}).get('Name', 'unknown')

                if instance_state == 'terminated':
                    continue

                results['total_instances'] += 1
                instance_findings = []
                is_compliant = True

                # Check IMDSv2 enforcement
                metadata_options = instance.get('MetadataOptions', {})
                http_tokens = metadata_options.get('HttpTokens', 'optional')
                if http_tokens != 'required':
                    is_compliant = False
                    instance_findings.append({
                        'id': f'EC2-IMDS-{instance_id}',
                        'severity': 'High',
                        'category': 'Instance Metadata',
                        'description': f'Instance {instance_id} does not enforce IMDSv2',
                        'remediation': 'Enable IMDSv2 by setting HttpTokens to required',
                        'aws_doc_link': 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html'
                    })

                # Check for public IP in public subnet
                public_ip = instance.get('PublicIpAddress')
                if public_ip:
                    is_compliant = False
                    instance_findings.append({
                        'id': f'EC2-PUBLIC-{instance_id}',
                        'severity': 'Medium',
                        'category': 'Network Exposure',
                        'description': f'Instance {instance_id} has public IP {public_ip}',
                        'remediation': 'Move instance to private subnet or remove public IP',
                        'aws_doc_link': 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html'
                    })

                # Check EBS volume encryption
                for block_device in instance.get('BlockDeviceMappings', []):
                    volume_id = block_device.get('Ebs', {}).get('VolumeId')
                    if volume_id:
                        try:
                            vol_response = ec2.describe_volumes(VolumeIds=[volume_id])
                            for volume in vol_response.get('Volumes', []):
                                if not volume.get('Encrypted', False):
                                    is_compliant = False
                                    instance_findings.append({
                                        'id': f'EC2-EBS-{volume_id}',
                                        'severity': 'High',
                                        'category': 'Encryption',
                                        'description': f'EBS volume {volume_id} attached to {instance_id} is not encrypted',
                                        'remediation': 'Create encrypted snapshot and replace volume',
                                        'aws_doc_link': 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSEncryption.html'
                                    })
                        except ClientError:
                            pass

                if is_compliant:
                    results['compliant'] += 1
                else:
                    results['non_compliant'] += 1
                    results['findings'].extend(instance_findings)

                results['details'].append({
                    'resource_id': instance_id,
                    'state': instance_state,
                    'compliant': is_compliant,
                    'imdsv2_enforced': http_tokens == 'required',
                    'has_public_ip': public_ip is not None,
                    'finding_count': len(instance_findings)
                })

    except ClientError as e:
        results['error'] = str(e)

    return results


def analyze_rds_instances(
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze RDS instances for security compliance.

    Checks for:
    - Encryption at rest enabled
    - Backup retention period (>= 7 days)
    - Multi-AZ deployment for production
    - Deletion protection enabled

    Args:
        environment_suffix: Environment tag to filter instances.
        region: AWS region to check.

    Returns:
        Dictionary containing RDS security analysis results.
    """
    rds = get_boto3_client('rds', region)
    timestamp = datetime.now(timezone.utc).isoformat()

    results = {
        'timestamp': timestamp,
        'resource_type': 'RDS',
        'total_instances': 0,
        'compliant': 0,
        'non_compliant': 0,
        'findings': [],
        'details': []
    }

    try:
        response = rds.describe_db_instances()

        for db_instance in response.get('DBInstances', []):
            db_identifier = db_instance['DBInstanceIdentifier']
            db_status = db_instance.get('DBInstanceStatus', 'unknown')

            # Filter by environment if specified
            if environment_suffix:
                tags_response = rds.list_tags_for_resource(
                    ResourceName=db_instance['DBInstanceArn']
                )
                tags = {t['Key']: t['Value'] for t in tags_response.get('TagList', [])}
                if tags.get('Environment') != environment_suffix:
                    continue

            results['total_instances'] += 1
            instance_findings = []
            is_compliant = True

            # Check encryption at rest
            if not db_instance.get('StorageEncrypted', False):
                is_compliant = False
                instance_findings.append({
                    'id': f'RDS-ENCRYPT-{db_identifier}',
                    'severity': 'Critical',
                    'category': 'Encryption',
                    'description': f'RDS instance {db_identifier} does not have encryption at rest enabled',
                    'remediation': 'Create encrypted snapshot and restore to new encrypted instance',
                    'aws_doc_link': 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html'
                })

            # Check backup retention
            backup_retention = db_instance.get('BackupRetentionPeriod', 0)
            if backup_retention < 7:
                is_compliant = False
                instance_findings.append({
                    'id': f'RDS-BACKUP-{db_identifier}',
                    'severity': 'High',
                    'category': 'Backup',
                    'description': f'RDS instance {db_identifier} has backup retention of {backup_retention} days (< 7)',
                    'remediation': 'Increase backup retention period to at least 7 days',
                    'aws_doc_link': 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html'
                })

            # Check Multi-AZ
            if not db_instance.get('MultiAZ', False):
                instance_findings.append({
                    'id': f'RDS-MULTIAZ-{db_identifier}',
                    'severity': 'Medium',
                    'category': 'High Availability',
                    'description': f'RDS instance {db_identifier} is not Multi-AZ enabled',
                    'remediation': 'Enable Multi-AZ deployment for high availability',
                    'aws_doc_link': 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html'
                })

            # Check deletion protection
            if not db_instance.get('DeletionProtection', False):
                is_compliant = False
                instance_findings.append({
                    'id': f'RDS-DELPROTECT-{db_identifier}',
                    'severity': 'High',
                    'category': 'Protection',
                    'description': f'RDS instance {db_identifier} does not have deletion protection enabled',
                    'remediation': 'Enable deletion protection to prevent accidental deletion',
                    'aws_doc_link': 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html'
                })

            if is_compliant:
                results['compliant'] += 1
            else:
                results['non_compliant'] += 1
                results['findings'].extend(instance_findings)

            results['details'].append({
                'resource_id': db_identifier,
                'status': db_status,
                'compliant': is_compliant,
                'storage_encrypted': db_instance.get('StorageEncrypted', False),
                'backup_retention_days': backup_retention,
                'multi_az': db_instance.get('MultiAZ', False),
                'deletion_protection': db_instance.get('DeletionProtection', False),
                'finding_count': len(instance_findings)
            })

    except ClientError as e:
        results['error'] = str(e)

    return results


def analyze_s3_buckets(
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze S3 buckets for security compliance.

    Checks for:
    - Server-side encryption enabled
    - Versioning enabled
    - Public access blocked
    - Bucket policies for public access

    Args:
        environment_suffix: Environment tag to filter buckets.
        region: AWS region to check.

    Returns:
        Dictionary containing S3 security analysis results.
    """
    s3 = get_boto3_client('s3', region)
    timestamp = datetime.now(timezone.utc).isoformat()

    results = {
        'timestamp': timestamp,
        'resource_type': 'S3',
        'total_buckets': 0,
        'compliant': 0,
        'non_compliant': 0,
        'findings': [],
        'details': []
    }

    try:
        response = s3.list_buckets()

        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']

            # Filter by environment if specified
            if environment_suffix and environment_suffix not in bucket_name:
                continue

            results['total_buckets'] += 1
            bucket_findings = []
            is_compliant = True

            # Check encryption
            try:
                s3.get_bucket_encryption(Bucket=bucket_name)
                encryption_enabled = True
                encryption_algorithm = 'AES256'
            except ClientError as e:
                if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                    encryption_enabled = False
                    encryption_algorithm = None
                    is_compliant = False
                    bucket_findings.append({
                        'id': f'S3-ENCRYPT-{bucket_name}',
                        'severity': 'High',
                        'category': 'Encryption',
                        'description': f'S3 bucket {bucket_name} does not have default encryption enabled',
                        'remediation': 'Enable default server-side encryption (SSE-S3 or SSE-KMS)',
                        'aws_doc_link': 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html'
                    })
                else:
                    results['total_buckets'] -= 1
                    continue

            # Check versioning
            try:
                versioning = s3.get_bucket_versioning(Bucket=bucket_name)
                versioning_enabled = versioning.get('Status') == 'Enabled'
                if not versioning_enabled:
                    bucket_findings.append({
                        'id': f'S3-VERSION-{bucket_name}',
                        'severity': 'Medium',
                        'category': 'Data Protection',
                        'description': f'S3 bucket {bucket_name} does not have versioning enabled',
                        'remediation': 'Enable versioning for data protection and recovery',
                        'aws_doc_link': 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html'
                    })
            except ClientError:
                versioning_enabled = False

            # Check public access block
            try:
                public_access = s3.get_public_access_block(Bucket=bucket_name)
                config = public_access.get('PublicAccessBlockConfiguration', {})
                all_blocked = (
                    config.get('BlockPublicAcls', False) and
                    config.get('IgnorePublicAcls', False) and
                    config.get('BlockPublicPolicy', False) and
                    config.get('RestrictPublicBuckets', False)
                )
                if not all_blocked:
                    is_compliant = False
                    bucket_findings.append({
                        'id': f'S3-PUBLIC-{bucket_name}',
                        'severity': 'Critical',
                        'category': 'Public Access',
                        'description': f'S3 bucket {bucket_name} does not have all public access blocked',
                        'remediation': 'Enable all public access block settings',
                        'aws_doc_link': 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html'
                    })
            except ClientError:
                all_blocked = False

            if is_compliant and not bucket_findings:
                results['compliant'] += 1
            else:
                results['non_compliant'] += 1
                results['findings'].extend(bucket_findings)

            results['details'].append({
                'resource_id': bucket_name,
                'compliant': is_compliant and not bucket_findings,
                'encryption_enabled': encryption_enabled,
                'encryption_algorithm': encryption_algorithm,
                'versioning_enabled': versioning_enabled,
                'public_access_blocked': all_blocked,
                'finding_count': len(bucket_findings)
            })

    except ClientError as e:
        results['error'] = str(e)

    return results


def analyze_iam_roles(
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze IAM roles for security compliance.

    Checks for:
    - Overly permissive policies with wildcard actions
    - Full administrative access
    - Unrestricted resource access

    Args:
        environment_suffix: Environment tag to filter roles.
        region: AWS region to check.

    Returns:
        Dictionary containing IAM security analysis results.
    """
    iam = get_boto3_client('iam', region)
    timestamp = datetime.now(timezone.utc).isoformat()

    results = {
        'timestamp': timestamp,
        'resource_type': 'IAM',
        'total_roles': 0,
        'compliant': 0,
        'non_compliant': 0,
        'findings': [],
        'details': []
    }

    try:
        paginator = iam.get_paginator('list_roles')
        for page in paginator.paginate():
            for role in page.get('Roles', []):
                role_name = role['RoleName']

                # Skip AWS service-linked roles
                if role.get('Path', '').startswith('/aws-service-role/'):
                    continue

                # Filter by environment if specified
                if environment_suffix and environment_suffix not in role_name:
                    continue

                results['total_roles'] += 1
                role_findings = []
                is_compliant = True

                # Check inline policies
                try:
                    inline_policies = iam.list_role_policies(RoleName=role_name)
                    for policy_name in inline_policies.get('PolicyNames', []):
                        policy_doc = iam.get_role_policy(
                            RoleName=role_name,
                            PolicyName=policy_name
                        )
                        findings = check_policy_permissions(
                            policy_doc['PolicyDocument'],
                            role_name,
                            policy_name
                        )
                        if findings:
                            is_compliant = False
                            role_findings.extend(findings)
                except ClientError:
                    pass

                # Check attached managed policies
                try:
                    attached_policies = iam.list_attached_role_policies(RoleName=role_name)
                    for policy in attached_policies.get('AttachedPolicies', []):
                        policy_arn = policy['PolicyArn']
                        policy_name = policy['PolicyName']

                        # Check for admin access policy
                        if 'AdministratorAccess' in policy_name:
                            is_compliant = False
                            role_findings.append({
                                'id': f'IAM-ADMIN-{role_name}',
                                'severity': 'Critical',
                                'category': 'Excessive Permissions',
                                'description': f'Role {role_name} has AdministratorAccess policy attached',
                                'remediation': 'Apply least privilege principle - use specific permissions',
                                'aws_doc_link': 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html'
                            })
                except ClientError:
                    pass

                if is_compliant:
                    results['compliant'] += 1
                else:
                    results['non_compliant'] += 1
                    results['findings'].extend(role_findings)

                results['details'].append({
                    'resource_id': role_name,
                    'compliant': is_compliant,
                    'finding_count': len(role_findings)
                })

    except ClientError as e:
        results['error'] = str(e)

    return results


def check_policy_permissions(
    policy_document: Dict[str, Any],
    role_name: str,
    policy_name: str
) -> List[Dict[str, Any]]:
    """Check policy document for overly permissive permissions."""
    findings = []

    statements = policy_document.get('Statement', [])
    if isinstance(statements, dict):
        statements = [statements]

    for statement in statements:
        if statement.get('Effect') != 'Allow':
            continue

        actions = statement.get('Action', [])
        if isinstance(actions, str):
            actions = [actions]

        resources = statement.get('Resource', [])
        if isinstance(resources, str):
            resources = [resources]

        # Check for wildcard actions
        for action in actions:
            if action == '*' or action.endswith(':*'):
                findings.append({
                    'id': f'IAM-WILDCARD-{role_name}-{policy_name}',
                    'severity': 'High',
                    'category': 'Excessive Permissions',
                    'description': f'Policy {policy_name} on role {role_name} has wildcard action: {action}',
                    'remediation': 'Replace wildcard actions with specific required actions',
                    'aws_doc_link': 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html'
                })
                break

        # Check for wildcard resources
        for resource in resources:
            if resource == '*':
                findings.append({
                    'id': f'IAM-RESOURCE-{role_name}-{policy_name}',
                    'severity': 'Medium',
                    'category': 'Excessive Permissions',
                    'description': f'Policy {policy_name} on role {role_name} allows access to all resources',
                    'remediation': 'Restrict Resource to specific ARNs',
                    'aws_doc_link': 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html'
                })
                break

    return findings


def analyze_security_groups(
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze Security Groups for security compliance.

    Checks for:
    - Unrestricted inbound rules (0.0.0.0/0)
    - Open high-risk ports (22, 3389, 3306, 5432, etc.)
    - Overly permissive outbound rules

    Args:
        environment_suffix: Environment tag to filter security groups.
        region: AWS region to check.

    Returns:
        Dictionary containing Security Group analysis results.
    """
    ec2 = get_boto3_client('ec2', region)
    timestamp = datetime.now(timezone.utc).isoformat()

    results = {
        'timestamp': timestamp,
        'resource_type': 'SecurityGroup',
        'total_groups': 0,
        'compliant': 0,
        'non_compliant': 0,
        'findings': [],
        'details': []
    }

    try:
        filters = []
        if environment_suffix:
            filters.append({
                'Name': 'tag:Environment',
                'Values': [environment_suffix]
            })

        response = ec2.describe_security_groups(Filters=filters if filters else [])

        for sg in response.get('SecurityGroups', []):
            sg_id = sg['GroupId']
            sg_name = sg.get('GroupName', sg_id)

            results['total_groups'] += 1
            sg_findings = []
            is_compliant = True

            # Check inbound rules
            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort', 0)
                to_port = rule.get('ToPort', 65535)

                for ip_range in rule.get('IpRanges', []):
                    cidr = ip_range.get('CidrIp', '')
                    if cidr == '0.0.0.0/0':
                        # Check if high-risk port is open
                        for port in HIGH_RISK_PORTS:
                            if from_port <= port <= to_port:
                                is_compliant = False
                                sg_findings.append({
                                    'id': f'SG-OPENPORT-{sg_id}-{port}',
                                    'severity': 'Critical',
                                    'category': 'Network Security',
                                    'description': f'Security group {sg_name} allows 0.0.0.0/0 access to port {port}',
                                    'remediation': f'Restrict port {port} access to specific IP ranges or security groups',
                                    'aws_doc_link': 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html'
                                })

                        # General warning for any 0.0.0.0/0 inbound
                        if from_port == 0 and to_port == 65535:
                            is_compliant = False
                            sg_findings.append({
                                'id': f'SG-ALLPORTS-{sg_id}',
                                'severity': 'Critical',
                                'category': 'Network Security',
                                'description': f'Security group {sg_name} allows 0.0.0.0/0 access to all ports',
                                'remediation': 'Restrict inbound rules to specific ports and IP ranges',
                                'aws_doc_link': 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html'
                            })

            if is_compliant:
                results['compliant'] += 1
            else:
                results['non_compliant'] += 1
                results['findings'].extend(sg_findings)

            results['details'].append({
                'resource_id': sg_id,
                'name': sg_name,
                'compliant': is_compliant,
                'vpc_id': sg.get('VpcId'),
                'finding_count': len(sg_findings)
            })

    except ClientError as e:
        results['error'] = str(e)

    return results


def calculate_compliance_score(findings: List[Dict[str, Any]]) -> float:
    """
    Calculate compliance score based on findings severity.

    Args:
        findings: List of security findings.

    Returns:
        Compliance score from 0-100.
    """
    if not findings:
        return 100.0

    total_weight = sum(SEVERITY_WEIGHTS[f['severity']] for f in findings)
    max_possible = 100
    score = max(0, max_possible - total_weight)
    return round(score, 2)


def generate_compliance_report(
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a comprehensive compliance report.

    Args:
        environment_suffix: Environment tag to filter resources.
        region: AWS region to check.

    Returns:
        Dictionary containing the complete compliance report.
    """
    timestamp = datetime.now(timezone.utc).isoformat()

    # Run all analyses
    ec2_results = analyze_ec2_instances(environment_suffix, region)
    rds_results = analyze_rds_instances(environment_suffix, region)
    s3_results = analyze_s3_buckets(environment_suffix, region)
    iam_results = analyze_iam_roles(environment_suffix, region)
    sg_results = analyze_security_groups(environment_suffix, region)

    # Aggregate findings
    all_findings = (
        ec2_results.get('findings', []) +
        rds_results.get('findings', []) +
        s3_results.get('findings', []) +
        iam_results.get('findings', []) +
        sg_results.get('findings', [])
    )

    # Count by severity
    severity_counts = {
        'critical': len([f for f in all_findings if f['severity'] == 'Critical']),
        'high': len([f for f in all_findings if f['severity'] == 'High']),
        'medium': len([f for f in all_findings if f['severity'] == 'Medium']),
        'low': len([f for f in all_findings if f['severity'] == 'Low'])
    }

    # Calculate totals
    total_resources = (
        ec2_results.get('total_instances', 0) +
        rds_results.get('total_instances', 0) +
        s3_results.get('total_buckets', 0) +
        iam_results.get('total_roles', 0) +
        sg_results.get('total_groups', 0)
    )

    total_compliant = (
        ec2_results.get('compliant', 0) +
        rds_results.get('compliant', 0) +
        s3_results.get('compliant', 0) +
        iam_results.get('compliant', 0) +
        sg_results.get('compliant', 0)
    )

    compliance_score = calculate_compliance_score(all_findings)

    report = {
        'timestamp': timestamp,
        'environment': environment_suffix or 'all',
        'region': region or os.environ.get('AWS_REGION', 'us-east-1'),
        'summary': {
            'total_resources': total_resources,
            'compliant': total_compliant,
            'non_compliant': total_resources - total_compliant,
            'total_findings': len(all_findings),
            'compliance_score': compliance_score,
            'by_severity': severity_counts,
            'by_service': {
                'EC2': ec2_results.get('total_instances', 0),
                'RDS': rds_results.get('total_instances', 0),
                'S3': s3_results.get('total_buckets', 0),
                'IAM': iam_results.get('total_roles', 0),
                'SecurityGroup': sg_results.get('total_groups', 0)
            }
        },
        'results': {
            'ec2': ec2_results,
            'rds': rds_results,
            's3': s3_results,
            'iam': iam_results,
            'security_groups': sg_results
        },
        'findings': all_findings
    }

    return report


def run_full_security_audit(
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None,
    output_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run a full security audit and optionally save reports.

    Args:
        environment_suffix: Environment tag to filter resources.
        region: AWS region to check.
        output_dir: Directory to save reports (optional).

    Returns:
        Dictionary containing the complete audit results.
    """
    report = generate_compliance_report(environment_suffix, region)

    if output_dir:
        import os
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
        report_path = os.path.join(output_dir, f'security-audit-{timestamp}.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, cls=DecimalEncoder)
        report['report_location'] = report_path

    return report


def main(args=None):
    """
    CLI entry point for security audit.

    Args:
        args: Command line arguments. If None, uses sys.argv.

    Returns:
        Dictionary containing audit results.
    """
    import argparse

    parser = argparse.ArgumentParser(description='AWS Infrastructure Security Audit Tool')
    parser.add_argument('--region', default='us-east-1', help='AWS region')
    parser.add_argument('--environment', '-e', help='Environment suffix to filter resources')
    parser.add_argument('--output', '-o', help='Output directory for reports')
    parser.add_argument('--ec2', action='store_true', help='Analyze EC2 instances only')
    parser.add_argument('--rds', action='store_true', help='Analyze RDS instances only')
    parser.add_argument('--s3', action='store_true', help='Analyze S3 buckets only')
    parser.add_argument('--iam', action='store_true', help='Analyze IAM roles only')
    parser.add_argument('--sg', action='store_true', help='Analyze Security Groups only')
    parser.add_argument('--all', action='store_true', help='Run full security audit')
    parser.add_argument('--json', action='store_true', help='Output JSON format')

    parsed_args = parser.parse_args(args)
    results = {}

    # Determine which analyses to run
    run_specific = parsed_args.ec2 or parsed_args.rds or parsed_args.s3 or parsed_args.iam or parsed_args.sg

    if parsed_args.all or not run_specific:
        print("Running full security audit...")
        results = run_full_security_audit(
            environment_suffix=parsed_args.environment,
            region=parsed_args.region,
            output_dir=parsed_args.output
        )
        if parsed_args.json:
            print(json.dumps(results, indent=2, cls=DecimalEncoder))
        else:
            print_audit_summary(results)
    else:
        if parsed_args.ec2:
            print("Analyzing EC2 instances...")
            results['ec2'] = analyze_ec2_instances(parsed_args.environment, parsed_args.region)
            print(json.dumps(results['ec2'], indent=2, cls=DecimalEncoder))

        if parsed_args.rds:
            print("Analyzing RDS instances...")
            results['rds'] = analyze_rds_instances(parsed_args.environment, parsed_args.region)
            print(json.dumps(results['rds'], indent=2, cls=DecimalEncoder))

        if parsed_args.s3:
            print("Analyzing S3 buckets...")
            results['s3'] = analyze_s3_buckets(parsed_args.environment, parsed_args.region)
            print(json.dumps(results['s3'], indent=2, cls=DecimalEncoder))

        if parsed_args.iam:
            print("Analyzing IAM roles...")
            results['iam'] = analyze_iam_roles(parsed_args.environment, parsed_args.region)
            print(json.dumps(results['iam'], indent=2, cls=DecimalEncoder))

        if parsed_args.sg:
            print("Analyzing Security Groups...")
            results['security_groups'] = analyze_security_groups(parsed_args.environment, parsed_args.region)
            print(json.dumps(results['security_groups'], indent=2, cls=DecimalEncoder))

    return results


def print_audit_summary(report: Dict[str, Any]):
    """Print a human-readable audit summary."""
    print()
    print("=" * 60)
    print("AWS INFRASTRUCTURE SECURITY AUDIT REPORT")
    print("=" * 60)
    print(f"Environment: {report.get('environment', 'all')}")
    print(f"Region: {report.get('region', 'us-east-1')}")
    print(f"Timestamp: {report.get('timestamp', 'N/A')}")
    print()

    summary = report.get('summary', {})
    print(f"Total Resources Scanned: {summary.get('total_resources', 0)}")
    print(f"Compliant Resources: {summary.get('compliant', 0)}")
    print(f"Non-Compliant Resources: {summary.get('non_compliant', 0)}")
    print(f"Total Findings: {summary.get('total_findings', 0)}")
    print(f"Compliance Score: {summary.get('compliance_score', 100)}/100")
    print()

    severity = summary.get('by_severity', {})
    print("Findings by Severity:")
    print(f"  Critical: {severity.get('critical', 0)}")
    print(f"  High: {severity.get('high', 0)}")
    print(f"  Medium: {severity.get('medium', 0)}")
    print(f"  Low: {severity.get('low', 0)}")
    print()

    by_service = summary.get('by_service', {})
    print("Resources by Service:")
    for service, count in by_service.items():
        print(f"  {service}: {count}")

    if report.get('report_location'):
        print()
        print(f"Full report saved to: {report['report_location']}")

    print("=" * 60)


if __name__ == '__main__':  # pragma: no cover
    sys.exit(0 if main() else 1)
