"""
index.py
Infrastructure Compliance Analysis Lambda Function
Analyzes CloudFormation stacks for security and compliance violations.
"""

import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import hashlib
import time

# Initialize AWS clients
cloudformation = boto3.client('cloudformation')
s3_client = boto3.client('s3')
rds = boto3.client('rds')
ec2 = boto3.client('ec2')
iam = boto3.client('iam')
sts = boto3.client('sts')

# Cache for reducing redundant API calls
resource_cache = {}
CACHE_TTL = 300  # 5 minutes


def get_cache_key(resource_type: str, identifier: str) -> str:
    """Generate cache key for resource."""
    return hashlib.md5(f"{resource_type}:{identifier}".encode()).hexdigest()


def get_from_cache(cache_key: str) -> Optional[Any]:
    """Retrieve item from cache if not expired."""
    if cache_key in resource_cache:
        item, timestamp = resource_cache[cache_key]
        if time.time() - timestamp < CACHE_TTL:
            return item
    return None


def add_to_cache(cache_key: str, item: Any) -> None:
    """Add item to cache with timestamp."""
    resource_cache[cache_key] = (item, time.time())


def assume_role(account_id: str, role_name: str = "ComplianceAnalyzerRole") -> Optional[boto3.Session]:
    """Assume role in target account for cross-account access."""
    try:
        role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"
        response = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName="ComplianceAnalysis"
        )

        credentials = response['Credentials']
        return boto3.Session(
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken']
        )
    except Exception as e:
        print(f"Failed to assume role in account {account_id}: {str(e)}")
        return None


def list_stacks(stack_name_pattern: Optional[str] = None, account_id: Optional[str] = None) -> List[Dict]:
    """List CloudFormation stacks matching pattern."""
    try:
        session = assume_role(account_id) if account_id else boto3.Session()
        if not session:
            return []

        cf_client = session.client('cloudformation')

        paginator = cf_client.get_paginator('list_stacks')
        stacks = []

        for page in paginator.paginate(StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE']):
            for stack in page['StackSummaries']:
                if stack_name_pattern and stack_name_pattern not in stack['StackName']:
                    continue
                stacks.append({
                    'StackName': stack['StackName'],
                    'StackId': stack['StackId'],
                    'CreationTime': stack['CreationTime'].isoformat(),
                })

        return stacks
    except Exception as e:
        print(f"Error listing stacks: {str(e)}")
        return []


def get_stack_resources(stack_name: str, account_id: Optional[str] = None) -> List[Dict]:
    """Get all resources in a CloudFormation stack."""
    cache_key = get_cache_key('stack_resources', stack_name)
    cached = get_from_cache(cache_key)
    if cached:
        return cached

    try:
        session = assume_role(account_id) if account_id else boto3.Session()
        if not session:
            return []

        cf_client = session.client('cloudformation')

        paginator = cf_client.get_paginator('describe_stack_resources')
        resources = []

        for page in paginator.paginate(StackName=stack_name):
            for resource in page['StackResources']:
                resources.append({
                    'LogicalResourceId': resource['LogicalResourceId'],
                    'PhysicalResourceId': resource['PhysicalResourceId'],
                    'ResourceType': resource['ResourceType'],
                    'ResourceStatus': resource['ResourceStatus'],
                })

        add_to_cache(cache_key, resources)
        return resources
    except Exception as e:
        print(f"Error getting stack resources for {stack_name}: {str(e)}")
        return []


def check_s3_bucket_compliance(bucket_name: str, account_id: Optional[str] = None) -> Dict:
    """Check S3 bucket for encryption and public access settings."""
    cache_key = get_cache_key('s3_bucket', bucket_name)
    cached = get_from_cache(cache_key)
    if cached:
        return cached

    result = {
        'resource': bucket_name,
        'type': 'S3Bucket',
        'checks': []
    }

    try:
        session = assume_role(account_id) if account_id else boto3.Session()
        if not session:
            return result

        s3 = session.client('s3')

        # Check encryption
        try:
            encryption = s3.get_bucket_encryption(Bucket=bucket_name)
            result['checks'].append({
                'name': 'S3BucketEncryption',
                'status': 'PASS',
                'message': 'Bucket encryption is enabled',
                'severity': 'HIGH'
            })
        except s3.exceptions.ClientError as e:
            if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                result['checks'].append({
                    'name': 'S3BucketEncryption',
                    'status': 'FAIL',
                    'message': 'Bucket encryption is not enabled',
                    'severity': 'HIGH'
                })
            else:
                raise

        # Check public access block
        try:
            public_access = s3.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']

            if all([
                config.get('BlockPublicAcls', False),
                config.get('IgnorePublicAcls', False),
                config.get('BlockPublicPolicy', False),
                config.get('RestrictPublicBuckets', False)
            ]):
                result['checks'].append({
                    'name': 'S3PublicAccessBlock',
                    'status': 'PASS',
                    'message': 'Public access is blocked',
                    'severity': 'HIGH'
                })
            else:
                result['checks'].append({
                    'name': 'S3PublicAccessBlock',
                    'status': 'FAIL',
                    'message': 'Public access block is not fully configured',
                    'severity': 'HIGH'
                })
        except s3.exceptions.ClientError:
            result['checks'].append({
                'name': 'S3PublicAccessBlock',
                'status': 'FAIL',
                'message': 'Public access block is not configured',
                'severity': 'HIGH'
            })

    except Exception as e:
        result['checks'].append({
            'name': 'S3BucketAnalysis',
            'status': 'ERROR',
            'message': f'Error analyzing bucket: {str(e)}',
            'severity': 'MEDIUM'
        })

    add_to_cache(cache_key, result)
    return result


def check_rds_compliance(instance_id: str, account_id: Optional[str] = None) -> Dict:
    """Check RDS instance for encryption and backup settings."""
    cache_key = get_cache_key('rds_instance', instance_id)
    cached = get_from_cache(cache_key)
    if cached:
        return cached

    result = {
        'resource': instance_id,
        'type': 'RDSInstance',
        'checks': []
    }

    try:
        session = assume_role(account_id) if account_id else boto3.Session()
        if not session:
            return result

        rds_client = session.client('rds')

        response = rds_client.describe_db_instances(DBInstanceIdentifier=instance_id)
        instance = response['DBInstances'][0]

        # Check encryption
        if instance.get('StorageEncrypted', False):
            result['checks'].append({
                'name': 'RDSEncryption',
                'status': 'PASS',
                'message': 'Storage encryption is enabled',
                'severity': 'HIGH'
            })
        else:
            result['checks'].append({
                'name': 'RDSEncryption',
                'status': 'FAIL',
                'message': 'Storage encryption is not enabled',
                'severity': 'HIGH'
            })

        # Check automated backups
        backup_retention = instance.get('BackupRetentionPeriod', 0)
        if backup_retention > 0:
            result['checks'].append({
                'name': 'RDSBackup',
                'status': 'PASS',
                'message': f'Automated backups enabled (retention: {backup_retention} days)',
                'severity': 'MEDIUM'
            })
        else:
            result['checks'].append({
                'name': 'RDSBackup',
                'status': 'FAIL',
                'message': 'Automated backups are not enabled',
                'severity': 'MEDIUM'
            })

    except Exception as e:
        result['checks'].append({
            'name': 'RDSAnalysis',
            'status': 'ERROR',
            'message': f'Error analyzing RDS instance: {str(e)}',
            'severity': 'MEDIUM'
        })

    add_to_cache(cache_key, result)
    return result


def check_security_group_compliance(sg_id: str, account_id: Optional[str] = None) -> Dict:
    """Check security group for overly permissive rules."""
    cache_key = get_cache_key('security_group', sg_id)
    cached = get_from_cache(cache_key)
    if cached:
        return cached

    result = {
        'resource': sg_id,
        'type': 'SecurityGroup',
        'checks': []
    }

    try:
        session = assume_role(account_id) if account_id else boto3.Session()
        if not session:
            return result

        ec2_client = session.client('ec2')

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        # Check for rules allowing 0.0.0.0/0
        permissive_rules = []
        for rule in sg.get('IpPermissions', []):
            for ip_range in rule.get('IpRanges', []):
                if ip_range.get('CidrIp') == '0.0.0.0/0':
                    port_info = f"Port {rule.get('FromPort', 'All')}"
                    if rule.get('IpProtocol') == '-1':
                        port_info = 'All ports'
                    permissive_rules.append(port_info)

        if permissive_rules:
            result['checks'].append({
                'name': 'SecurityGroupPermissiveness',
                'status': 'FAIL',
                'message': f'Unrestricted inbound access detected: {", ".join(permissive_rules)}',
                'severity': 'HIGH'
            })
        else:
            result['checks'].append({
                'name': 'SecurityGroupPermissiveness',
                'status': 'PASS',
                'message': 'No unrestricted inbound access detected',
                'severity': 'HIGH'
            })

    except Exception as e:
        result['checks'].append({
            'name': 'SecurityGroupAnalysis',
            'status': 'ERROR',
            'message': f'Error analyzing security group: {str(e)}',
            'severity': 'MEDIUM'
        })

    add_to_cache(cache_key, result)
    return result


def check_resource_tags(resource_arn: str, account_id: Optional[str] = None) -> Dict:
    """Check if resource has required tags."""
    result = {
        'resource': resource_arn,
        'type': 'ResourceTags',
        'checks': []
    }

    required_tags = ['Environment', 'Owner', 'CostCenter']

    try:
        session = assume_role(account_id) if account_id else boto3.Session()
        if not session:
            return result

        # Parse resource type and get tags
        if ':s3:::' in resource_arn:
            s3 = session.client('s3')
            bucket_name = resource_arn.split(':::')[1]
            try:
                response = s3.get_bucket_tagging(Bucket=bucket_name)
                tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}
            except s3.exceptions.ClientError:
                tags = {}
        elif ':rds:' in resource_arn:
            rds_client = session.client('rds')
            response = rds_client.list_tags_for_resource(ResourceName=resource_arn)
            tags = {tag['Key']: tag['Value'] for tag in response.get('TagList', [])}
        elif ':ec2:' in resource_arn and 'security-group' in resource_arn:
            ec2_client = session.client('ec2')
            sg_id = resource_arn.split('/')[-1]
            response = ec2_client.describe_tags(
                Filters=[
                    {'Name': 'resource-id', 'Values': [sg_id]},
                    {'Name': 'resource-type', 'Values': ['security-group']}
                ]
            )
            tags = {tag['Key']: tag['Value'] for tag in response.get('Tags', [])}
        else:
            tags = {}

        missing_tags = [tag for tag in required_tags if tag not in tags]

        if missing_tags:
            result['checks'].append({
                'name': 'RequiredTags',
                'status': 'FAIL',
                'message': f'Missing required tags: {", ".join(missing_tags)}',
                'severity': 'MEDIUM'
            })
        else:
            result['checks'].append({
                'name': 'RequiredTags',
                'status': 'PASS',
                'message': 'All required tags present',
                'severity': 'MEDIUM'
            })

    except Exception as e:
        result['checks'].append({
            'name': 'TagAnalysis',
            'status': 'ERROR',
            'message': f'Error analyzing tags: {str(e)}',
            'severity': 'LOW'
        })

    return result


def check_iam_policy_compliance(policy_arn: str, account_id: Optional[str] = None) -> Dict:
    """Validate IAM policy against security baseline."""
    cache_key = get_cache_key('iam_policy', policy_arn)
    cached = get_from_cache(cache_key)
    if cached:
        return cached

    result = {
        'resource': policy_arn,
        'type': 'IAMPolicy',
        'checks': []
    }

    # Define security baseline - prohibited actions
    prohibited_actions = [
        '*:*',
        's3:*',
        'iam:*',
        'ec2:*',
        'rds:DeleteDB*',
        'dynamodb:DeleteTable'
    ]

    try:
        session = assume_role(account_id) if account_id else boto3.Session()
        if not session:
            return result

        iam_client = session.client('iam')

        # Get policy document
        try:
            response = iam_client.get_policy(PolicyArn=policy_arn)
            version_id = response['Policy']['DefaultVersionId']

            version_response = iam_client.get_policy_version(
                PolicyArn=policy_arn,
                VersionId=version_id
            )
            policy_document = version_response['PolicyVersion']['Document']
        except:
            # Cannot retrieve policy
            return result

        # Check for overly permissive actions
        violations = []
        for statement in policy_document.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]

                for action in actions:
                    for prohibited in prohibited_actions:
                        if action == prohibited or (prohibited.endswith('*') and action.startswith(prohibited[:-1])):
                            violations.append(action)

        if violations:
            result['checks'].append({
                'name': 'IAMPolicyBaseline',
                'status': 'FAIL',
                'message': f'Overly permissive actions detected: {", ".join(set(violations))}',
                'severity': 'HIGH'
            })
        else:
            result['checks'].append({
                'name': 'IAMPolicyBaseline',
                'status': 'PASS',
                'message': 'Policy complies with security baseline',
                'severity': 'HIGH'
            })

    except Exception as e:
        result['checks'].append({
            'name': 'IAMPolicyAnalysis',
            'status': 'ERROR',
            'message': f'Error analyzing IAM policy: {str(e)}',
            'severity': 'MEDIUM'
        })

    add_to_cache(cache_key, result)
    return result


def calculate_risk_score(check_results: List[Dict]) -> int:
    """Calculate risk score (1-10) based on violations."""
    total_checks = 0
    failed_checks = 0
    severity_weights = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}
    weighted_failures = 0

    for resource_result in check_results:
        for check in resource_result.get('checks', []):
            total_checks += 1
            if check['status'] == 'FAIL':
                failed_checks += 1
                weighted_failures += severity_weights.get(check.get('severity', 'MEDIUM'), 2)

    if total_checks == 0:
        return 1

    # Calculate risk score based on failure rate and severity
    failure_rate = failed_checks / total_checks
    avg_severity = weighted_failures / max(failed_checks, 1)

    risk_score = int((failure_rate * avg_severity) * 3.33) + 1
    return min(max(risk_score, 1), 10)


def analyze_stack(stack_name: str, account_id: Optional[str] = None, dry_run: bool = True) -> Dict:
    """Analyze a single CloudFormation stack for compliance."""
    print(f"Analyzing stack: {stack_name}")

    check_results = []

    # Get stack resources
    resources = get_stack_resources(stack_name, account_id)

    for resource in resources:
        resource_type = resource['ResourceType']
        physical_id = resource['PhysicalResourceId']

        # Analyze based on resource type
        if resource_type == 'AWS::S3::Bucket':
            result = check_s3_bucket_compliance(physical_id, account_id)
            check_results.append(result)

            # Check tags
            arn = f"arn:aws:s3:::{physical_id}"
            tag_result = check_resource_tags(arn, account_id)
            check_results.append(tag_result)

        elif resource_type == 'AWS::RDS::DBInstance':
            result = check_rds_compliance(physical_id, account_id)
            check_results.append(result)

            # Check tags
            region = os.environ.get('AWS_REGION', 'us-east-1')
            account = account_id or boto3.client('sts').get_caller_identity()['Account']
            arn = f"arn:aws:rds:{region}:{account}:db:{physical_id}"
            tag_result = check_resource_tags(arn, account_id)
            check_results.append(tag_result)

        elif resource_type == 'AWS::EC2::SecurityGroup':
            result = check_security_group_compliance(physical_id, account_id)
            check_results.append(result)

            # Check tags
            region = os.environ.get('AWS_REGION', 'us-east-1')
            account = account_id or boto3.client('sts').get_caller_identity()['Account']
            arn = f"arn:aws:ec2:{region}:{account}:security-group/{physical_id}"
            tag_result = check_resource_tags(arn, account_id)
            check_results.append(tag_result)

        elif resource_type == 'AWS::IAM::Policy':
            arn = physical_id
            result = check_iam_policy_compliance(arn, account_id)
            check_results.append(result)

    # Calculate risk score
    risk_score = calculate_risk_score(check_results)

    # Summarize violations
    violations_summary = {
        'total_checks': sum(len(r.get('checks', [])) for r in check_results),
        'passed': sum(1 for r in check_results for c in r.get('checks', []) if c['status'] == 'PASS'),
        'failed': sum(1 for r in check_results for c in r.get('checks', []) if c['status'] == 'FAIL'),
        'errors': sum(1 for r in check_results for c in r.get('checks', []) if c['status'] == 'ERROR'),
    }

    account = account_id or boto3.client('sts').get_caller_identity()['Account']
    region = os.environ.get('AWS_REGION', 'us-east-1')

    return {
        'stack_name': stack_name,
        'account_id': account,
        'region': region,
        'timestamp': datetime.utcnow().isoformat(),
        'dry_run': dry_run,
        'risk_score': risk_score,
        'check_results': check_results,
        'violations_summary': violations_summary,
    }


def handler(event, context):
    """Lambda handler for compliance analysis."""
    print(f"Event: {json.dumps(event)}")

    # Extract parameters
    stack_name_pattern = event.get('stack_name_pattern')
    account_id = event.get('account_id')
    dry_run = event.get('dry_run', True)

    # List stacks
    stacks = list_stacks(stack_name_pattern, account_id)
    print(f"Found {len(stacks)} stacks to analyze")

    # Analyze each stack (limit to 50)
    results = []
    for stack in stacks[:50]:
        try:
            result = analyze_stack(stack['StackName'], account_id, dry_run)
            results.append(result)
        except Exception as e:
            print(f"Error analyzing stack {stack['StackName']}: {str(e)}")
            results.append({
                'stack_name': stack['StackName'],
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat(),
            })

    # Generate compliance report
    report = {
        'analysis_timestamp': datetime.utcnow().isoformat(),
        'total_stacks_analyzed': len(results),
        'stack_reports': results,
        'overall_summary': {
            'total_violations': sum(r.get('violations_summary', {}).get('failed', 0) for r in results),
            'average_risk_score': sum(r.get('risk_score', 0) for r in results) / max(len(results), 1),
            'stacks_analyzed': len(results),
        }
    }

    # Save report to S3
    try:
        reports_bucket = os.environ.get('REPORTS_BUCKET')
        if reports_bucket:
            report_key = f"compliance-reports/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}-report.json"
            s3_client.put_object(
                Bucket=reports_bucket,
                Key=report_key,
                Body=json.dumps(report, indent=2),
                ContentType='application/json'
            )
            print(f"Report saved to s3://{reports_bucket}/{report_key}")
    except Exception as e:
        print(f"Error saving report to S3: {str(e)}")

    return {
        'statusCode': 200,
        'body': json.dumps(report)
    }
