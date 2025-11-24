I'll create a comprehensive security audit script for your AWS secrets infrastructure. This script will perform forensic analysis across Secrets Manager, Parameter Store, Lambda, and ECS to identify critical vulnerabilities.

## analyse.py

```python
#!/usr/bin/env python3
"""
AWS Secrets Security Audit Script
Performs comprehensive security analysis of AWS Secrets Manager and Parameter Store
"""

import json
import boto3
import re
import os
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from tabulate import tabulate
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from botocore.exceptions import ClientError, BotoCoreError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Sensitive data patterns for detection
SENSITIVE_PATTERNS = {
    'password': re.compile(r'(?i)(password|passwd|pwd)[\s=:]+[\S]+'),
    'api_key': re.compile(r'(?i)(api[_-]?key|apikey)[\s=:]+[\S]+'),
    'token': re.compile(r'(?i)(token|bearer|jwt)[\s=:]+[\S]+'),
    'secret': re.compile(r'(?i)(secret|private[_-]?key)[\s=:]+[\S]+'),
    'database': re.compile(r'(?i)(db[_-]?password|database[_-]?password)[\s=:]+[\S]+'),
    'aws_access': re.compile(r'(?i)(AKIA[0-9A-Z]{16})'),
    'connection_string': re.compile(r'(?i)(mongodb|mysql|postgresql|redis)://[^@]+@')
}


def boto_client(service: str, region_name: str = None):
    """Create boto3 client with optional Moto endpoint support"""
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
    return boto3.client(
        service,
        endpoint_url=endpoint_url,
        region_name=region_name or os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


class SecretsAuditor:
    def __init__(self, regions=['us-east-1'], production_accounts=None, staging_accounts=None):
        self.regions = regions
        self.production_accounts = production_accounts or []
        self.staging_accounts = staging_accounts or []
        self.findings = {
            'rotation_lifecycle': [],
            'encryption_access': [],
            'hardcoded_secrets': [],
            'summary': {}
        }

        # Initialize AWS clients using boto_client helper for Moto support
        self.sm_clients = {}
        self.ssm_clients = {}
        self.lambda_clients = {}
        self.ecs_clients = {}
        self.kms_clients = {}
        self.cloudtrail_clients = {}
        self.sts_client = boto_client('sts')

        for region in regions:
            self.sm_clients[region] = boto_client('secretsmanager', region)
            self.ssm_clients[region] = boto_client('ssm', region)
            self.lambda_clients[region] = boto_client('lambda', region)
            self.ecs_clients[region] = boto_client('ecs', region)
            self.kms_clients[region] = boto_client('kms', region)
            self.cloudtrail_clients[region] = boto_client('cloudtrail', region)

    def should_skip_resource(self, resource_name, tags=None):
        """Check if resource should be skipped based on naming or tags"""
        # Skip test- and demo- prefixes
        if resource_name.startswith(('test-', 'demo-')):
            return True

        # Skip if tagged with ExcludeFromAudit: true
        if tags:
            tag_dict = {tag['Key']: tag['Value'] for tag in tags} if isinstance(tags, list) else tags
            if tag_dict.get('ExcludeFromAudit', '').lower() == 'true':
                return True

        return False

    def get_secret_last_accessed(self, secret_arn, region):
        """Get last accessed time for a secret from CloudTrail"""
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=90)

            events = []
            paginator = self.cloudtrail_clients[region].get_paginator('lookup_events')

            for page in paginator.paginate(
                LookupAttributes=[
                    {
                        'AttributeKey': 'ResourceName',
                        'AttributeValue': secret_arn
                    }
                ],
                StartTime=start_time,
                EndTime=end_time
            ):
                for event in page.get('Events', []):
                    if event['EventName'] == 'GetSecretValue':
                        events.append(event['EventTime'])

            return max(events) if events else None

        except Exception as e:
            logger.warning(f"Failed to get CloudTrail events for {secret_arn}: {str(e)}")
            return None

    def audit_secrets_manager(self, region):
        """Audit Secrets Manager secrets"""
        logger.info(f"Auditing Secrets Manager in {region}")

        try:
            paginator = self.sm_clients[region].get_paginator('list_secrets')

            for page in paginator.paginate():
                for secret in page['SecretList']:
                    # Get full secret details
                    try:
                        secret_details = self.sm_clients[region].describe_secret(
                            SecretId=secret['ARN']
                        )
                    except Exception as e:
                        logger.error(f"Failed to describe secret {secret['Name']}: {str(e)}")
                        continue

                    # Check if should skip
                    tags = secret_details.get('Tags', [])
                    if self.should_skip_resource(secret['Name'], tags):
                        continue

                    # Get last accessed time
                    last_accessed = self.get_secret_last_accessed(secret['ARN'], region)

                    # Check rotation status (> 90 days)
                    if 'LastRotatedDate' in secret_details:
                        days_since_rotation = (datetime.now(timezone.utc) - secret_details['LastRotatedDate']).days
                        if days_since_rotation > 90:
                            self.findings['rotation_lifecycle'].append({
                                'type': 'unrotated_credential',
                                'severity': 'CRITICAL',
                                'resource': secret['Name'],
                                'arn': secret['ARN'],
                                'region': region,
                                'days_since_rotation': days_since_rotation,
                                'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                                'details': f"Secret not rotated for {days_since_rotation} days"
                            })
                    else:
                        self.findings['rotation_lifecycle'].append({
                            'type': 'never_rotated',
                            'severity': 'CRITICAL',
                            'resource': secret['Name'],
                            'arn': secret['ARN'],
                            'region': region,
                            'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                            'details': 'Secret has never been rotated'
                        })

                    # Check for rotation failures
                    if secret_details.get('RotationEnabled') and 'NextRotationDate' in secret_details:
                        if secret_details['NextRotationDate'] < datetime.now(timezone.utc):
                            self.findings['rotation_lifecycle'].append({
                                'type': 'rotation_failure',
                                'severity': 'CRITICAL',
                                'resource': secret['Name'],
                                'arn': secret['ARN'],
                                'region': region,
                                'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                                'details': 'Rotation is overdue'
                            })

                    # Check for unused credentials (not accessed in 90 days)
                    if not last_accessed or (datetime.now(timezone.utc) - last_accessed).days > 90:
                        self.findings['rotation_lifecycle'].append({
                            'type': 'unused_credential',
                            'severity': 'CLEANUP',
                            'resource': secret['Name'],
                            'arn': secret['ARN'],
                            'region': region,
                            'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                            'details': 'Secret not accessed in over 90 days'
                        })

                    # Check version count (rollback risk)
                    try:
                        versions = self.sm_clients[region].list_secret_version_ids(
                            SecretId=secret['ARN']
                        )
                        if len(versions.get('Versions', [])) <= 1:
                            self.findings['rotation_lifecycle'].append({
                                'type': 'rollback_risk',
                                'severity': 'HIGH',
                                'resource': secret['Name'],
                                'arn': secret['ARN'],
                                'region': region,
                                'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                                'details': 'Only one version available, no rollback capability'
                            })
                    except Exception as e:
                        logger.warning(f"Failed to list versions for {secret['Name']}: {str(e)}")

                    # Check deletion status
                    if secret_details.get('DeletedDate'):
                        if datetime.now(timezone.utc) > secret_details['DeletedDate']:
                            self.findings['rotation_lifecycle'].append({
                                'type': 'cleanup_failure',
                                'severity': 'HIGH',
                                'resource': secret['Name'],
                                'arn': secret['ARN'],
                                'region': region,
                                'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                                'details': 'Secret past deletion date but still accessible'
                            })

                    # Check KMS encryption
                    kms_key = secret_details.get('KmsKeyId')
                    if not kms_key or kms_key.startswith('alias/aws/'):
                        self.findings['encryption_access'].append({
                            'type': 'missing_cmk_encryption',
                            'severity': 'HIGH',
                            'resource': secret['Name'],
                            'arn': secret['ARN'],
                            'region': region,
                            'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                            'details': 'Not using customer-managed KMS key'
                        })

                    # Check resource policy
                    if 'SecretPolicy' in secret_details:
                        try:
                            policy = json.loads(secret_details['SecretPolicy'])
                            self._analyze_resource_policy(policy, secret['Name'], secret['ARN'], region, last_accessed)
                        except Exception as e:
                            logger.warning(f"Failed to parse policy for {secret['Name']}: {str(e)}")

                    # Check DR replication for critical secrets
                    tag_dict = {tag['Key']: tag['Value'] for tag in tags} if tags else {}
                    if tag_dict.get('Critical', '').lower() == 'true':
                        if not secret_details.get('ReplicationStatus'):
                            self.findings['encryption_access'].append({
                                'type': 'dr_gap',
                                'severity': 'HIGH',
                                'resource': secret['Name'],
                                'arn': secret['ARN'],
                                'region': region,
                                'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                                'details': 'Critical secret not replicated to secondary region'
                            })

                    # Check Lambda rotation function if applicable
                    if secret_details.get('RotationLambdaARN'):
                        self._check_rotation_lambda(secret_details['RotationLambdaARN'], secret['Name'], region)

        except Exception as e:
            logger.error(f"Failed to audit Secrets Manager in {region}: {str(e)}")

    def _analyze_resource_policy(self, policy, resource_name, arn, region, last_accessed):
        """Analyze resource policy for security issues"""
        for statement in policy.get('Statement', []):
            principal = statement.get('Principal', {})

            # Check for wildcard principal
            if principal == '*' or (isinstance(principal, dict) and '*' in principal.get('AWS', [])):
                self.findings['encryption_access'].append({
                    'type': 'overly_permissive_access',
                    'severity': 'CRITICAL',
                    'resource': resource_name,
                    'arn': arn,
                    'region': region,
                    'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                    'details': 'Resource policy allows principal: *'
                })

            # Check for cross-account access without ExternalId
            if isinstance(principal, dict) and 'AWS' in principal:
                aws_principals = principal['AWS'] if isinstance(principal['AWS'], list) else [principal['AWS']]
                for p in aws_principals:
                    if ':root' in p and p.split(':')[4] not in (self.production_accounts + self.staging_accounts):
                        conditions = statement.get('Condition', {})
                        if not any('ExternalId' in str(conditions).lower() for c in str(conditions)):
                            self.findings['encryption_access'].append({
                                'type': 'unsafe_cross_account',
                                'severity': 'HIGH',
                                'resource': resource_name,
                                'arn': arn,
                                'region': region,
                                'last_accessed': last_accessed.isoformat() if last_accessed else 'Never',
                                'details': 'Cross-account access without ExternalId condition'
                            })

    def _check_rotation_lambda(self, lambda_arn, secret_name, region):
        """Check Lambda rotation function for issues"""
        try:
            lambda_region = lambda_arn.split(':')[3]
            function_name = lambda_arn.split(':')[-1]

            # Get function configuration
            func_config = self.lambda_clients[lambda_region].get_function_configuration(
                FunctionName=function_name
            )

            # Check timeout
            if func_config.get('Timeout', 0) > 30:
                self.findings['rotation_lifecycle'].append({
                    'type': 'lambda_rotation_issue',
                    'severity': 'HIGH',
                    'resource': secret_name,
                    'region': region,
                    'details': f'Rotation Lambda timeout > 30s ({func_config["Timeout"]}s)'
                })

            # Check for recent errors
            try:
                response = self.cloudtrail_clients[lambda_region].lookup_events(
                    LookupAttributes=[
                        {
                            'AttributeKey': 'ResourceName',
                            'AttributeValue': lambda_arn
                        }
                    ],
                    StartTime=datetime.now(timezone.utc) - timedelta(days=7),
                    EndTime=datetime.now(timezone.utc)
                )

                for event in response.get('Events', []):
                    if 'errorCode' in event or 'errorMessage' in event:
                        self.findings['rotation_lifecycle'].append({
                            'type': 'lambda_rotation_error',
                            'severity': 'CRITICAL',
                            'resource': secret_name,
                            'region': region,
                            'details': f'Rotation Lambda has recent errors'
                        })
                        break

            except Exception as e:
                logger.warning(f"Failed to check Lambda errors: {str(e)}")

        except Exception as e:
            logger.warning(f"Failed to check rotation Lambda {lambda_arn}: {str(e)}")

    def audit_parameter_store(self, region):
        """Audit Parameter Store parameters"""
        logger.info(f"Auditing Parameter Store in {region}")

        try:
            paginator = self.ssm_clients[region].get_paginator('describe_parameters')

            for page in paginator.paginate():
                for param in page['Parameters']:
                    # Check if should skip
                    if self.should_skip_resource(param['Name']):
                        continue

                    # Get parameter details including value for plaintext check
                    try:
                        param_details = self.ssm_clients[region].get_parameter(
                            Name=param['Name'],
                            WithDecryption=True
                        )

                        # Get tags
                        tags_response = self.ssm_clients[region].list_tags_for_resource(
                            ResourceType='Parameter',
                            ResourceId=param['Name']
                        )
                        tags = tags_response.get('TagList', [])

                        if self.should_skip_resource(param['Name'], tags):
                            continue

                    except Exception as e:
                        logger.error(f"Failed to get parameter details for {param['Name']}: {str(e)}")
                        continue

                    param_value = param_details['Parameter']['Value']

                    # Check for plaintext sensitive data
                    if param['Type'] == 'String':
                        for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                            if pattern.search(param_value) or pattern.search(param['Name']):
                                self.findings['encryption_access'].append({
                                    'type': 'plaintext_sensitive_data',
                                    'severity': 'CRITICAL',
                                    'resource': param['Name'],
                                    'region': region,
                                    'pattern_matched': pattern_name,
                                    'details': f'Plaintext parameter contains {pattern_name}'
                                })
                                break

                    # Check SecureString KMS encryption
                    if param['Type'] == 'SecureString':
                        kms_key = param.get('KeyId', 'alias/aws/ssm')
                        if kms_key == 'alias/aws/ssm' or kms_key.startswith('alias/aws/'):
                            self.findings['encryption_access'].append({
                                'type': 'missing_cmk_encryption',
                                'severity': 'HIGH',
                                'resource': param['Name'],
                                'region': region,
                                'details': 'SecureString not using customer-managed KMS key'
                            })

                    # Check tier optimization
                    if param.get('Tier', 'Standard') == 'Standard':
                        if len(param_value.encode('utf-8')) < 4096:  # 4KB
                            self.findings['encryption_access'].append({
                                'type': 'tier_waste',
                                'severity': 'LOW',
                                'resource': param['Name'],
                                'region': region,
                                'size_bytes': len(param_value.encode('utf-8')),
                                'details': 'Standard tier parameter under 4KB could use free tier'
                            })

        except Exception as e:
            logger.error(f"Failed to audit Parameter Store in {region}: {str(e)}")

    def audit_lambda_environment(self, region):
        """Audit Lambda functions for hardcoded secrets"""
        logger.info(f"Auditing Lambda environment variables in {region}")

        try:
            paginator = self.lambda_clients[region].get_paginator('list_functions')

            for page in paginator.paginate():
                for function in page['Functions']:
                    # Get function configuration including env vars
                    try:
                        func_config = self.lambda_clients[region].get_function_configuration(
                            FunctionName=function['FunctionArn']
                        )

                        # Get tags
                        tags_response = self.lambda_clients[region].list_tags(
                            Resource=function['FunctionArn']
                        )
                        tags = tags_response.get('Tags', {})

                        if self.should_skip_resource(function['FunctionName'], tags):
                            continue

                        env_vars = func_config.get('Environment', {}).get('Variables', {})

                        # Check each environment variable
                        for var_name, var_value in env_vars.items():
                            for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                                if pattern.search(var_value) or pattern.search(var_name):
                                    self.findings['hardcoded_secrets'].append({
                                        'type': 'hardcoded_lambda_secret',
                                        'severity': 'CRITICAL',
                                        'resource': function['FunctionName'],
                                        'arn': function['FunctionArn'],
                                        'region': region,
                                        'variable_name': var_name,
                                        'pattern_matched': pattern_name,
                                        'details': f'Lambda environment variable contains {pattern_name}'
                                    })
                                    break

                    except Exception as e:
                        logger.error(f"Failed to check Lambda {function['FunctionName']}: {str(e)}")
                        continue

        except Exception as e:
            logger.error(f"Failed to audit Lambda functions in {region}: {str(e)}")

    def audit_ecs_task_definitions(self, region):
        """Audit ECS task definitions for hardcoded secrets"""
        logger.info(f"Auditing ECS task definitions in {region}")

        try:
            # List all task definition families
            families_paginator = self.ecs_clients[region].get_paginator('list_task_definition_families')

            for families_page in families_paginator.paginate():
                for family in families_page.get('families', []):
                    if self.should_skip_resource(family):
                        continue

                    # Get latest task definition
                    try:
                        task_def_arns = self.ecs_clients[region].list_task_definitions(
                            familyPrefix=family,
                            status='ACTIVE',
                            maxResults=1
                        )

                        if not task_def_arns.get('taskDefinitionArns'):
                            continue

                        # Describe task definition
                        task_def = self.ecs_clients[region].describe_task_definition(
                            taskDefinition=task_def_arns['taskDefinitionArns'][0]
                        )['taskDefinition']

                        # Check container definitions
                        for container in task_def.get('containerDefinitions', []):
                            # Check environment variables
                            for env_var in container.get('environment', []):
                                for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                                    if pattern.search(env_var.get('value', '')) or pattern.search(env_var.get('name', '')):
                                        self.findings['hardcoded_secrets'].append({
                                            'type': 'hardcoded_ecs_secret',
                                            'severity': 'CRITICAL',
                                            'resource': f"{family}:{task_def['revision']}",
                                            'arn': task_def['taskDefinitionArn'],
                                            'region': region,
                                            'container': container['name'],
                                            'variable_name': env_var['name'],
                                            'pattern_matched': pattern_name,
                                            'details': f'ECS task definition contains {pattern_name}'
                                        })
                                        break

                            # Check for non-secrets manager references
                            secrets = container.get('secrets', [])
                            if not secrets and container.get('environment'):
                                # Has env vars but no secrets - potential issue
                                env_names = [e['name'] for e in container.get('environment', [])]
                                for name in env_names:
                                    if any(keyword in name.lower() for keyword in ['password', 'key', 'token', 'secret']):
                                        self.findings['hardcoded_secrets'].append({
                                            'type': 'missing_secrets_reference',
                                            'severity': 'HIGH',
                                            'resource': f"{family}:{task_def['revision']}",
                                            'arn': task_def['taskDefinitionArn'],
                                            'region': region,
                                            'container': container['name'],
                                            'variable_name': name,
                                            'details': 'Sensitive variable not using Secrets Manager reference'
                                        })

                    except Exception as e:
                        logger.error(f"Failed to check ECS task definition {family}: {str(e)}")
                        continue

        except Exception as e:
            logger.error(f"Failed to audit ECS task definitions in {region}: {str(e)}")

    def run_audit(self):
        """Run the complete audit across all regions"""
        logger.info("Starting comprehensive secrets security audit...")

        # Use ThreadPoolExecutor for parallel region processing
        with ThreadPoolExecutor(max_workers=len(self.regions)) as executor:
            futures = []

            for region in self.regions:
                futures.append(executor.submit(self.audit_secrets_manager, region))
                futures.append(executor.submit(self.audit_parameter_store, region))
                futures.append(executor.submit(self.audit_lambda_environment, region))
                futures.append(executor.submit(self.audit_ecs_task_definitions, region))

            # Wait for all tasks to complete
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"Audit task failed: {str(e)}")

        # Calculate summary statistics
        self._calculate_summary()

        # Generate outputs
        self._generate_json_report()
        self._generate_console_output()

    def _calculate_summary(self):
        """Calculate summary statistics"""
        all_findings = (
            self.findings['rotation_lifecycle'] +
            self.findings['encryption_access'] +
            self.findings['hardcoded_secrets']
        )

        severity_counts = defaultdict(int)
        type_counts = defaultdict(int)

        for finding in all_findings:
            severity_counts[finding['severity']] += 1
            type_counts[finding['type']] += 1

        self.findings['summary'] = {
            'total_findings': len(all_findings),
            'severity_breakdown': dict(severity_counts),
            'type_breakdown': dict(type_counts),
            'audit_timestamp': datetime.now(timezone.utc).isoformat(),
            'regions_audited': self.regions
        }

    def _generate_json_report(self):
        """Generate JSON report file"""
        with open('secrets_audit.json', 'w') as f:
            json.dump(self.findings, f, indent=2, default=str)
        logger.info("JSON report saved to secrets_audit.json")

    def _generate_console_output(self):
        """Generate detailed console output in tabular format"""
        print("\n" + "="*120)
        print("AWS SECRETS SECURITY AUDIT REPORT")
        print("="*120)
        print(f"Audit Timestamp: {datetime.now(timezone.utc).isoformat()}")
        print(f"Regions Audited: {', '.join(self.regions)}")
        print("\n")

        # Summary
        print("EXECUTIVE SUMMARY")
        print("-"*60)
        summary_table = [
            ['Total Findings', self.findings['summary']['total_findings']],
            ['Critical Issues', self.findings['summary']['severity_breakdown'].get('CRITICAL', 0)],
            ['High Severity', self.findings['summary']['severity_breakdown'].get('HIGH', 0)],
            ['Cleanup Required', self.findings['summary']['severity_breakdown'].get('CLEANUP', 0)],
            ['Low Priority', self.findings['summary']['severity_breakdown'].get('LOW', 0)]
        ]
        print(tabulate(summary_table, headers=['Metric', 'Count'], tablefmt='grid'))
        print("\n")

        # Rotation and Lifecycle Issues
        if self.findings['rotation_lifecycle']:
            print("ROTATION AND LIFECYCLE AUDIT FINDINGS")
            print("-"*120)
            rotation_data = []
            for finding in self.findings['rotation_lifecycle']:
                rotation_data.append([
                    finding['severity'],
                    finding['type'].replace('_', ' ').title(),
                    finding['resource'][:50] + '...' if len(finding['resource']) > 50 else finding['resource'],
                    finding['region'],
                    finding.get('last_accessed', 'N/A'),
                    finding['details'][:60] + '...' if len(finding['details']) > 60 else finding['details']
                ])
            print(tabulate(rotation_data,
                          headers=['Severity', 'Issue Type', 'Resource', 'Region', 'Last Accessed', 'Details'],
                          tablefmt='grid'))
            print("\n")

        # Encryption and Access Control Issues
        if self.findings['encryption_access']:
            print("ENCRYPTION AND ACCESS CONTROL AUDIT FINDINGS")
            print("-"*120)
            encryption_data = []
            for finding in self.findings['encryption_access']:
                encryption_data.append([
                    finding['severity'],
                    finding['type'].replace('_', ' ').title(),
                    finding['resource'][:50] + '...' if len(finding['resource']) > 50 else finding['resource'],
                    finding['region'],
                    finding.get('last_accessed', 'N/A') if 'last_accessed' in finding else 'N/A',
                    finding['details'][:60] + '...' if len(finding['details']) > 60 else finding['details']
                ])
            print(tabulate(encryption_data,
                          headers=['Severity', 'Issue Type', 'Resource', 'Region', 'Last Accessed', 'Details'],
                          tablefmt='grid'))
            print("\n")

        # Hardcoded Secrets
        if self.findings['hardcoded_secrets']:
            print("CRITICAL: HARDCODED SECRETS FOUND")
            print("-"*120)
            hardcoded_data = []
            for finding in self.findings['hardcoded_secrets']:
                service = 'Lambda' if 'lambda' in finding['type'] else 'ECS'
                var_name = finding.get('variable_name', 'N/A')
                var_name_display = var_name[:30] + '...' if len(var_name) > 30 else var_name
                pattern = finding.get('pattern_matched', 'N/A')
                details = finding.get('details', 'N/A')
                details_display = details[:50] + '...' if len(details) > 50 else details
                hardcoded_data.append([
                    finding['severity'],
                    service,
                    finding['resource'][:40] + '...' if len(finding['resource']) > 40 else finding['resource'],
                    finding['region'],
                    var_name_display,
                    pattern,
                    details_display
                ])
            print(tabulate(hardcoded_data,
                          headers=['Severity', 'Service', 'Resource', 'Region', 'Variable', 'Pattern', 'Details'],
                          tablefmt='grid'))
            print("\n")

        # Top recommendations
        print("TOP SECURITY RECOMMENDATIONS")
        print("-"*60)
        recommendations = self._generate_recommendations()
        for idx, rec in enumerate(recommendations[:10], 1):
            print(f"{idx}. {rec}")
        print("\n" + "="*120)

    def _generate_recommendations(self):
        """Generate prioritized recommendations based on findings"""
        recommendations = []

        critical_count = self.findings['summary']['severity_breakdown'].get('CRITICAL', 0)
        high_count = self.findings['summary']['severity_breakdown'].get('HIGH', 0)

        if critical_count > 0:
            recommendations.append(f"IMMEDIATE ACTION: Address {critical_count} CRITICAL findings immediately")

        # Type-specific recommendations
        type_counts = self.findings['summary']['type_breakdown']

        if type_counts.get('unrotated_credential', 0) > 0:
            recommendations.append(f"Rotate {type_counts['unrotated_credential']} secrets that haven't been rotated in 90+ days")

        if type_counts.get('plaintext_sensitive_data', 0) > 0:
            recommendations.append(f"Encrypt {type_counts['plaintext_sensitive_data']} plaintext parameters containing sensitive data")

        if type_counts.get('hardcoded_lambda_secret', 0) + type_counts.get('hardcoded_ecs_secret', 0) > 0:
            recommendations.append("Migrate all hardcoded secrets to AWS Secrets Manager immediately")

        if type_counts.get('missing_cmk_encryption', 0) > 0:
            recommendations.append(f"Implement CMK encryption for {type_counts['missing_cmk_encryption']} secrets using default AWS keys")

        if type_counts.get('unused_credential', 0) > 0:
            recommendations.append(f"Review and potentially delete {type_counts['unused_credential']} unused secrets")

        if type_counts.get('overly_permissive_access', 0) > 0:
            recommendations.append("Implement least-privilege access policies for secrets with wildcard permissions")

        if type_counts.get('dr_gap', 0) > 0:
            recommendations.append("Enable cross-region replication for all critical secrets")

        if type_counts.get('rollback_risk', 0) > 0:
            recommendations.append("Ensure all secrets maintain multiple versions for rollback capability")

        recommendations.append("Implement automated rotation for all applicable secrets")
        recommendations.append("Enable AWS CloudTrail logging for all secret access events")

        return recommendations


def main():
    """Main execution function"""
    # Configure these based on your environment or use defaults
    # Support AWS_DEFAULT_REGION for Moto testing
    default_region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

    # Use single region when AWS_ENDPOINT_URL is set (Moto testing)
    if os.environ.get("AWS_ENDPOINT_URL"):
        REGIONS = [default_region]
    else:
        REGIONS = ['us-east-1', 'eu-west-1']  # Add your regions

    PRODUCTION_ACCOUNTS = []  # Add your production account IDs
    STAGING_ACCOUNTS = []  # Add your staging account IDs

    try:
        auditor = SecretsAuditor(
            regions=REGIONS,
            production_accounts=PRODUCTION_ACCOUNTS,
            staging_accounts=STAGING_ACCOUNTS
        )

        auditor.run_audit()

    except Exception as e:
        logger.error(f"Audit failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()

```
