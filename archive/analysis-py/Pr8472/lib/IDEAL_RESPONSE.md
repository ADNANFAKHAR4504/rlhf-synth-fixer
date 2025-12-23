I'll develop a comprehensive AWS Backup audit script that performs deep forensic analysis across your AWS infrastructure. This script will evaluate all 12 critical compliance checks and generate detailed reports.

## lib/analyse.py

```python
#!/usr/bin/env python3
"""
AWS Backup Forensic Audit Tool
Performs deep compliance analysis of AWS Backup posture across multiple services
"""

import boto3
import json
import csv
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Set, Tuple
from collections import defaultdict
from dataclasses import dataclass, asdict
from enum import Enum
import sys
from botocore.exceptions import ClientError, BotoCoreError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Severity(Enum):
    """Risk severity levels"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class ComplianceStatus(Enum):
    """Compliance status types"""
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    WARNING = "WARNING"
    NOT_APPLICABLE = "NOT_APPLICABLE"


@dataclass
class Finding:
    """Represents a compliance finding"""
    check_id: str
    check_name: str
    severity: Severity
    status: ComplianceStatus
    resource_id: str
    resource_type: str
    resource_tags: Dict[str, str]
    details: str
    recommendation: str
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


@dataclass
class RecoveryPointAnalysis:
    """Analysis of recovery points for a resource"""
    resource_id: str
    resource_type: str
    last_recovery_point: Optional[str]
    recovery_point_count: int
    gaps_hours: List[float]
    max_gap_hours: float
    consecutive_failures: int
    compliance_status: str
    calculated_rpo_hours: float
    estimated_rto_hours: float


class AWSBackupAuditor:
    """Main auditor class for AWS Backup compliance analysis"""

    def __init__(self, region: str = 'us-east-1', role_arn: Optional[str] = None):
        """
        Initialize the auditor with AWS clients

        Args:
            region: AWS region to audit
            role_arn: Optional role ARN for cross-account access
        """
        self.region = region
        self.session = self._create_session(role_arn)

        # Initialize AWS service clients
        self.backup_client = self.session.client('backup', region_name=region)
        self.ec2_client = self.session.client('ec2', region_name=region)
        self.rds_client = self.session.client('rds', region_name=region)
        self.efs_client = self.session.client('efs', region_name=region)
        self.dynamodb_client = self.session.client('dynamodb', region_name=region)
        self.kms_client = self.session.client('kms', region_name=region)
        self.sns_client = self.session.client('sns', region_name=region)
        self.sts_client = self.session.client('sts', region_name=region)

        # Initialize findings and metrics
        self.findings: List[Finding] = []
        self.resources: Dict[str, Any] = {}
        self.backup_plans: Dict[str, Any] = {}
        self.backup_vaults: Dict[str, Any] = {}
        self.recovery_points: Dict[str, List[Any]] = defaultdict(list)
        self.backup_jobs: Dict[str, List[Any]] = defaultdict(list)

    def _create_session(self, role_arn: Optional[str] = None) -> boto3.Session:
        """Create boto3 session with optional role assumption"""
        if role_arn:
            try:
                sts = boto3.client('sts')
                assumed_role = sts.assume_role(
                    RoleArn=role_arn,
                    RoleSessionName='BackupAuditSession'
                )
                credentials = assumed_role['Credentials']
                return boto3.Session(
                    aws_access_key_id=credentials['AccessKeyId'],
                    aws_secret_access_key=credentials['SecretAccessKey'],
                    aws_session_token=credentials['SessionToken']
                )
            except ClientError as e:
                logger.error(f"Failed to assume role {role_arn}: {e}")
                raise
        return boto3.Session()

    def run_audit(self) -> Dict[str, Any]:
        """
        Execute the complete backup audit

        Returns:
            Dictionary containing audit results
        """
        logger.info("Starting AWS Backup forensic audit...")

        try:
            # Phase 1: Discovery
            logger.info("Phase 1: Resource discovery")
            self._discover_resources()
            self._discover_backup_infrastructure()

            # Phase 2: Compliance checks
            logger.info("Phase 2: Running compliance checks")
            self._check_unprotected_resources()  # Check 1
            self._check_missing_prod_coverage()  # Check 2
            self._check_inadequate_retention()   # Check 3
            self._check_vault_immutability()     # Check 4
            self._check_cross_region_dr()        # Check 5
            self._check_vault_encryption()       # Check 6
            self._check_recovery_point_gaps()    # Check 7
            self._check_consecutive_failures()   # Check 8
            self._check_missing_notifications()  # Check 9
            self._check_restore_testing()        # Check 10
            self._check_orphaned_points()        # Check 11
            self._check_cost_inefficiency()      # Check 12

            # Phase 3: Generate reports
            logger.info("Phase 3: Generating reports")
            audit_results = self._generate_audit_summary()
            self._save_json_report(audit_results)
            self._save_csv_report()
            self._print_console_summary(audit_results)

            return audit_results

        except Exception as e:
            logger.error(f"Audit failed: {e}", exc_info=True)
            raise

    def _discover_resources(self):
        """Discover all AWS resources that should be backed up"""
        logger.info("Discovering AWS resources...")

        # Discover EC2 instances
        try:
            paginator = self.ec2_client.get_paginator('describe_instances')
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] != 'terminated':
                            tags = self._tags_to_dict(instance.get('Tags', []))
                            if not self._should_exclude_resource(tags):
                                self.resources[instance['InstanceId']] = {
                                    'type': 'EC2',
                                    'arn': f"arn:aws:ec2:{self.region}:{self._get_account_id()}:instance/{instance['InstanceId']}",
                                    'tags': tags,
                                    'state': instance['State']['Name']
                                }
        except ClientError as e:
            logger.error(f"Failed to discover EC2 instances: {e}")

        # Discover EBS volumes
        try:
            paginator = self.ec2_client.get_paginator('describe_volumes')
            for page in paginator.paginate():
                for volume in page['Volumes']:
                    tags = self._tags_to_dict(volume.get('Tags', []))
                    if not self._should_exclude_resource(tags):
                        self.resources[volume['VolumeId']] = {
                            'type': 'EBS',
                            'arn': f"arn:aws:ec2:{self.region}:{self._get_account_id()}:volume/{volume['VolumeId']}",
                            'tags': tags,
                            'state': volume['State']
                        }
        except ClientError as e:
            logger.error(f"Failed to discover EBS volumes: {e}")

        # Discover RDS instances
        try:
            paginator = self.rds_client.get_paginator('describe_db_instances')
            for page in paginator.paginate():
                for db in page['DBInstances']:
                    tags = self._get_rds_tags(db['DBInstanceArn'])
                    if not self._should_exclude_resource(tags):
                        self.resources[db['DBInstanceIdentifier']] = {
                            'type': 'RDS',
                            'arn': db['DBInstanceArn'],
                            'tags': tags,
                            'state': db['DBInstanceStatus']
                        }
        except ClientError as e:
            logger.error(f"Failed to discover RDS instances: {e}")

        # Discover EFS file systems
        try:
            paginator = self.efs_client.get_paginator('describe_file_systems')
            for page in paginator.paginate():
                for fs in page['FileSystems']:
                    tags = self._get_efs_tags(fs['FileSystemId'])
                    if not self._should_exclude_resource(tags):
                        self.resources[fs['FileSystemId']] = {
                            'type': 'EFS',
                            'arn': fs['FileSystemArn'],
                            'tags': tags,
                            'state': fs['LifeCycleState']
                        }
        except ClientError as e:
            logger.error(f"Failed to discover EFS file systems: {e}")

        # Discover DynamoDB tables
        try:
            paginator = self.dynamodb_client.get_paginator('list_tables')
            for page in paginator.paginate():
                for table_name in page['TableNames']:
                    table = self.dynamodb_client.describe_table(TableName=table_name)['Table']
                    tags = self._get_dynamodb_tags(table['TableArn'])
                    if not self._should_exclude_resource(tags):
                        self.resources[table_name] = {
                            'type': 'DynamoDB',
                            'arn': table['TableArn'],
                            'tags': tags,
                            'state': table['TableStatus']
                        }
        except ClientError as e:
            logger.error(f"Failed to discover DynamoDB tables: {e}")

        logger.info(f"Discovered {len(self.resources)} resources")

    def _discover_backup_infrastructure(self):
        """Discover backup plans, vaults, and recovery points"""
        logger.info("Discovering backup infrastructure...")

        # Discover backup plans
        try:
            paginator = self.backup_client.get_paginator('list_backup_plans')
            for page in paginator.paginate():
                for plan in page['BackupPlansList']:
                    plan_details = self.backup_client.get_backup_plan(
                        BackupPlanId=plan['BackupPlanId']
                    )

                    # Get plan selections (protected resources)
                    selections = []
                    sel_paginator = self.backup_client.get_paginator('list_backup_selections')
                    for sel_page in sel_paginator.paginate(BackupPlanId=plan['BackupPlanId']):
                        for selection in sel_page['BackupSelectionsList']:
                            sel_details = self.backup_client.get_backup_selection(
                                BackupPlanId=plan['BackupPlanId'],
                                SelectionId=selection['SelectionId']
                            )['BackupSelection']
                            selections.append(sel_details)

                    self.backup_plans[plan['BackupPlanId']] = {
                        'name': plan['BackupPlanName'],
                        'arn': plan['BackupPlanArn'],
                        'details': plan_details['BackupPlan'],
                        'selections': selections
                    }
        except ClientError as e:
            logger.error(f"Failed to discover backup plans: {e}")

        # Discover backup vaults
        try:
            paginator = self.backup_client.get_paginator('list_backup_vaults')
            for page in paginator.paginate():
                for vault in page['BackupVaultList']:
                    # Get vault details including lock configuration
                    vault_name = vault['BackupVaultName']

                    # Check vault lock
                    vault_lock = None
                    try:
                        vault_lock = self.backup_client.describe_backup_vault(
                            BackupVaultName=vault_name
                        ).get('LockConfiguration')
                    except ClientError:
                        pass

                    # Check SNS configuration
                    sns_topic = None
                    try:
                        notifications = self.backup_client.get_backup_vault_notifications(
                            BackupVaultName=vault_name
                        )
                        sns_topic = notifications.get('SNSTopicArn')
                    except ClientError:
                        pass

                    self.backup_vaults[vault_name] = {
                        'arn': vault['BackupVaultArn'],
                        'encryption_key': vault.get('EncryptionKeyArn'),
                        'vault_lock': vault_lock,
                        'sns_topic': sns_topic,
                        'creation_date': vault['CreationDate']
                    }
        except ClientError as e:
            logger.error(f"Failed to discover backup vaults: {e}")

        # Discover recovery points
        try:
            for vault_name in self.backup_vaults:
                paginator = self.backup_client.get_paginator('list_recovery_points_by_backup_vault')
                for page in paginator.paginate(BackupVaultName=vault_name):
                    for rp in page['RecoveryPoints']:
                        resource_arn = rp.get('ResourceArn', '')
                        self.recovery_points[resource_arn].append({
                            'recovery_point_arn': rp['RecoveryPointArn'],
                            'vault_name': vault_name,
                            'creation_date': rp.get('CreationDate'),
                            'completion_date': rp.get('CompletionDate'),
                            'status': rp.get('Status'),
                            'lifecycle': rp.get('Lifecycle'),
                            'is_encrypted': rp.get('IsEncrypted', False),
                            'backup_size_bytes': rp.get('BackupSizeBytes', 0)
                        })
        except ClientError as e:
            logger.error(f"Failed to discover recovery points: {e}")

        # Discover backup jobs
        try:
            # Get jobs from last 90 days
            start_date = datetime.now(timezone.utc) - timedelta(days=90)
            paginator = self.backup_client.get_paginator('list_backup_jobs')
            for page in paginator.paginate(ByCreatedAfter=start_date):
                for job in page['BackupJobs']:
                    resource_arn = job.get('ResourceArn', '')
                    self.backup_jobs[resource_arn].append({
                        'job_id': job['BackupJobId'],
                        'vault_name': job.get('BackupVaultName'),
                        'state': job['State'],
                        'creation_date': job.get('CreationDate'),
                        'completion_date': job.get('CompletionDate'),
                        'status_message': job.get('StatusMessage', '')
                    })
        except ClientError as e:
            logger.error(f"Failed to discover backup jobs: {e}")

        logger.info(f"Discovered {len(self.backup_plans)} plans, {len(self.backup_vaults)} vaults")

    def _check_unprotected_resources(self):
        """Check 1: Identify resources tagged RequireBackup:true without backup plans"""
        logger.info("Checking for unprotected resources requiring backup...")

        protected_resources = self._get_protected_resources()

        for resource_id, resource_info in self.resources.items():
            tags = resource_info.get('tags', {})

            # Check if resource requires backup
            if tags.get('RequireBackup', '').lower() == 'true':
                resource_arn = resource_info['arn']

                if resource_arn not in protected_resources:
                    self.findings.append(Finding(
                        check_id="AWS-BACKUP-001",
                        check_name="Unprotected Resources",
                        severity=Severity.CRITICAL,
                        status=ComplianceStatus.NON_COMPLIANT,
                        resource_id=resource_id,
                        resource_type=resource_info['type'],
                        resource_tags=tags,
                        details=f"Resource tagged with RequireBackup:true has no backup plan assigned",
                        recommendation="Create and assign a backup plan to this resource immediately"
                    ))

    def _check_missing_prod_coverage(self):
        """Check 2: Flag production resources without backup coverage"""
        logger.info("Checking production resource backup coverage...")

        protected_resources = self._get_protected_resources()

        for resource_id, resource_info in self.resources.items():
            tags = resource_info.get('tags', {})

            # Check if resource is production
            if tags.get('Environment', '').lower() == 'production':
                resource_arn = resource_info['arn']

                if resource_arn not in protected_resources:
                    self.findings.append(Finding(
                        check_id="AWS-BACKUP-002",
                        check_name="Missing Production Coverage",
                        severity=Severity.CRITICAL,
                        status=ComplianceStatus.NON_COMPLIANT,
                        resource_id=resource_id,
                        resource_type=resource_info['type'],
                        resource_tags=tags,
                        details=f"Production resource has no backup coverage",
                        recommendation="Production resources must have backup plans - assign immediately"
                    ))

    def _check_inadequate_retention(self):
        """Check 3: Flag plans with retention less than 7 days for critical data"""
        logger.info("Checking backup retention policies...")

        for plan_id, plan_info in self.backup_plans.items():
            plan_details = plan_info['details']

            for rule in plan_details.get('Rules', []):
                lifecycle = rule.get('Lifecycle', {})
                delete_after_days = lifecycle.get('DeleteAfterDays')

                # Check selections for critical data
                for selection in plan_info['selections']:
                    for resource in selection.get('Resources', []):
                        # Check if any resource is tagged as critical
                        resource_info = self._get_resource_by_arn(resource)
                        if resource_info:
                            tags = resource_info.get('tags', {})
                            if tags.get('DataClassification', '').lower() == 'critical':
                                if delete_after_days and delete_after_days < 7:
                                    self.findings.append(Finding(
                                        check_id="AWS-BACKUP-003",
                                        check_name="Inadequate Retention",
                                        severity=Severity.HIGH,
                                        status=ComplianceStatus.NON_COMPLIANT,
                                        resource_id=plan_info['name'],
                                        resource_type="BackupPlan",
                                        resource_tags={},
                                        details=f"Backup plan has {delete_after_days} days retention for critical data (minimum 7 required)",
                                        recommendation="Increase retention period to at least 7 days for critical data"
                                    ))

    def _check_vault_immutability(self):
        """Check 4: Identify vaults without Vault Lock for ransomware protection"""
        logger.info("Checking vault immutability configuration...")

        for vault_name, vault_info in self.backup_vaults.items():
            if not vault_info.get('vault_lock'):
                self.findings.append(Finding(
                    check_id="AWS-BACKUP-004",
                    check_name="No Vault Immutability",
                    severity=Severity.HIGH,
                    status=ComplianceStatus.NON_COMPLIANT,
                    resource_id=vault_name,
                    resource_type="BackupVault",
                    resource_tags={},
                    details="Backup vault does not have Vault Lock (WORM) configured",
                    recommendation="Enable Vault Lock for ransomware protection and compliance"
                ))

    def _check_cross_region_dr(self):
        """Check 5: Flag vaults missing cross-region copy rules"""
        logger.info("Checking cross-region disaster recovery configuration...")

        # Check each backup plan for cross-region copy rules
        for plan_id, plan_info in self.backup_plans.items():
            has_cross_region = False

            for rule in plan_info['details'].get('Rules', []):
                copy_actions = rule.get('CopyActions', [])
                for copy_action in copy_actions:
                    destination_vault_arn = copy_action.get('DestinationBackupVaultArn', '')
                    # Check if destination is in different region
                    if ':backup-vault:' in destination_vault_arn:
                        dest_region = destination_vault_arn.split(':')[3]
                        if dest_region != self.region:
                            has_cross_region = True
                            break

            if not has_cross_region:
                self.findings.append(Finding(
                    check_id="AWS-BACKUP-005",
                    check_name="No Cross-Region DR",
                    severity=Severity.HIGH,
                    status=ComplianceStatus.NON_COMPLIANT,
                    resource_id=plan_info['name'],
                    resource_type="BackupPlan",
                    resource_tags={},
                    details="Backup plan lacks cross-region copy rules for disaster recovery",
                    recommendation="Configure cross-region backup copies for DR preparedness"
                ))

    def _check_vault_encryption(self):
        """Check 6: Flag unencrypted backup vaults"""
        logger.info("Checking vault encryption...")

        for vault_name, vault_info in self.backup_vaults.items():
            if not vault_info.get('encryption_key'):
                self.findings.append(Finding(
                    check_id="AWS-BACKUP-006",
                    check_name="Unencrypted Vault",
                    severity=Severity.HIGH,
                    status=ComplianceStatus.NON_COMPLIANT,
                    resource_id=vault_name,
                    resource_type="BackupVault",
                    resource_tags={},
                    details="Backup vault is not encrypted with a KMS key",
                    recommendation="Enable KMS encryption for backup vault security"
                ))

    def _check_recovery_point_gaps(self):
        """Check 7: Identify resources with >48 hour gaps between recovery points"""
        logger.info("Checking recovery point gaps...")

        for resource_arn, points in self.recovery_points.items():
            if len(points) < 2:
                continue

            # Sort points by creation date
            sorted_points = sorted(
                [p for p in points if p.get('creation_date') and p.get('status') == 'COMPLETED'],
                key=lambda x: x['creation_date']
            )

            if len(sorted_points) >= 2:
                # Check gaps between consecutive points
                max_gap = timedelta(0)
                for i in range(1, len(sorted_points)):
                    gap = sorted_points[i]['creation_date'] - sorted_points[i-1]['creation_date']
                    if gap > max_gap:
                        max_gap = gap

                if max_gap > timedelta(hours=48):
                    resource_info = self._get_resource_by_arn(resource_arn)
                    if resource_info:
                        self.findings.append(Finding(
                            check_id="AWS-BACKUP-007",
                            check_name="Recovery Point Gaps",
                            severity=Severity.HIGH,
                            status=ComplianceStatus.NON_COMPLIANT,
                            resource_id=resource_arn.split('/')[-1],
                            resource_type=resource_info['type'],
                            resource_tags=resource_info.get('tags', {}),
                            details=f"Resource has {max_gap.total_seconds()/3600:.1f} hour gap between recovery points",
                            recommendation="Investigate backup job failures and adjust backup frequency"
                        ))

    def _check_consecutive_failures(self):
        """Check 8: Flag jobs with 3+ consecutive failures"""
        logger.info("Checking for consecutive backup failures...")

        for resource_arn, jobs in self.backup_jobs.items():
            if not jobs:
                continue

            # Sort jobs by creation date
            sorted_jobs = sorted(jobs, key=lambda x: x.get('creation_date', datetime.min.replace(tzinfo=timezone.utc)))

            # Count consecutive failures
            consecutive_failures = 0
            max_consecutive = 0

            for job in sorted_jobs:
                if job['state'] in ['FAILED', 'EXPIRED']:
                    consecutive_failures += 1
                    max_consecutive = max(max_consecutive, consecutive_failures)
                else:
                    consecutive_failures = 0

            if max_consecutive >= 3:
                resource_info = self._get_resource_by_arn(resource_arn)
                if resource_info:
                    self.findings.append(Finding(
                        check_id="AWS-BACKUP-008",
                        check_name="Consecutive Failures",
                        severity=Severity.CRITICAL,
                        status=ComplianceStatus.NON_COMPLIANT,
                        resource_id=resource_arn.split('/')[-1],
                        resource_type=resource_info['type'],
                        resource_tags=resource_info.get('tags', {}),
                        details=f"Resource has {max_consecutive} consecutive backup failures",
                        recommendation="Investigate and resolve backup failures immediately"
                    ))

    def _check_missing_notifications(self):
        """Check 9: Flag vaults without SNS notifications"""
        logger.info("Checking vault notification configuration...")

        for vault_name, vault_info in self.backup_vaults.items():
            if not vault_info.get('sns_topic'):
                self.findings.append(Finding(
                    check_id="AWS-BACKUP-009",
                    check_name="Missing Notifications",
                    severity=Severity.MEDIUM,
                    status=ComplianceStatus.NON_COMPLIANT,
                    resource_id=vault_name,
                    resource_type="BackupVault",
                    resource_tags={},
                    details="Backup vault has no SNS topic configured for job notifications",
                    recommendation="Configure SNS notifications for immediate failure alerts"
                ))

    def _check_restore_testing(self):
        """Check 10: Flag plans without restore testing in 90 days"""
        logger.info("Checking restore testing compliance...")

        # Get restore jobs from last 90 days
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=90)
            paginator = self.backup_client.get_paginator('list_restore_jobs')

            tested_resources = set()
            for page in paginator.paginate(ByCreatedAfter=start_date):
                for job in page['RestoreJobs']:
                    if job.get('Status') == 'COMPLETED':
                        tested_resources.add(job.get('ResourceArn'))
        except ClientError as e:
            logger.error(f"Failed to get restore jobs: {e}")
            tested_resources = set()

        # Check each protected resource
        protected_resources = self._get_protected_resources()
        for resource_arn in protected_resources:
            if resource_arn not in tested_resources:
                resource_info = self._get_resource_by_arn(resource_arn)
                if resource_info:
                    self.findings.append(Finding(
                        check_id="AWS-BACKUP-010",
                        check_name="Inadequate Testing",
                        severity=Severity.MEDIUM,
                        status=ComplianceStatus.NON_COMPLIANT,
                        resource_id=resource_arn.split('/')[-1],
                        resource_type=resource_info['type'],
                        resource_tags=resource_info.get('tags', {}),
                        details="No restore testing performed in last 90 days",
                        recommendation="Perform regular restore testing to validate recovery procedures"
                    ))

    def _check_orphaned_points(self):
        """Check 11: Find recovery points for deleted resources"""
        logger.info("Checking for orphaned recovery points...")

        # Get all resource ARNs from discovered resources
        existing_arns = {info['arn'] for info in self.resources.values()}

        for resource_arn, points in self.recovery_points.items():
            if resource_arn and resource_arn not in existing_arns:
                total_size = sum(p.get('backup_size_bytes', 0) for p in points)
                total_size_gb = total_size / (1024**3)

                self.findings.append(Finding(
                    check_id="AWS-BACKUP-011",
                    check_name="Orphaned Recovery Points",
                    severity=Severity.LOW,
                    status=ComplianceStatus.WARNING,
                    resource_id=resource_arn,
                    resource_type="OrphanedResource",
                    resource_tags={},
                    details=f"Found {len(points)} recovery points ({total_size_gb:.2f} GB) for deleted resource",
                    recommendation="Review and delete unnecessary recovery points to reduce costs"
                ))

    def _check_cost_inefficiency(self):
        """Check 12: Flag plans without lifecycle transitions to cold storage"""
        logger.info("Checking cost optimization configurations...")

        for plan_id, plan_info in self.backup_plans.items():
            has_lifecycle = False

            for rule in plan_info['details'].get('Rules', []):
                lifecycle = rule.get('Lifecycle', {})
                if lifecycle.get('MoveToColdStorageAfterDays'):
                    has_lifecycle = True
                    break

            if not has_lifecycle:
                self.findings.append(Finding(
                    check_id="AWS-BACKUP-012",
                    check_name="Cost Inefficiency",
                    severity=Severity.LOW,
                    status=ComplianceStatus.WARNING,
                    resource_id=plan_info['name'],
                    resource_type="BackupPlan",
                    resource_tags={},
                    details="Backup plan lacks lifecycle rules for cold storage transition",
                    recommendation="Configure lifecycle transitions to Glacier after 30 days for cost optimization"
                ))

    def _get_protected_resources(self) -> Set[str]:
        """Get set of all resources protected by backup plans"""
        protected = set()

        for plan_info in self.backup_plans.values():
            for selection in plan_info['selections']:
                # Add explicit resources
                protected.update(selection.get('Resources', []))

                # Process tag-based selections
                if 'Conditions' in selection:
                    conditions = selection['Conditions']
                    for resource_arn, resource_info in self.resources.items():
                        if self._matches_selection_conditions(resource_info, conditions):
                            protected.add(resource_info['arn'])

        return protected

    def _matches_selection_conditions(self, resource_info: Dict, conditions: Dict) -> bool:
        """Check if resource matches backup selection conditions"""
        resource_tags = resource_info.get('tags', {})

        # Check tag conditions
        for condition in conditions.get('StringEquals', []):
            key = condition.get('ConditionKey', '')
            value = condition.get('ConditionValue', '')

            if key.startswith('aws:ResourceTag/'):
                tag_name = key.replace('aws:ResourceTag/', '')
                if resource_tags.get(tag_name) != value:
                    return False

        return True

    def _get_resource_by_arn(self, arn: str) -> Optional[Dict]:
        """Get resource info by ARN"""
        for resource_id, resource_info in self.resources.items():
            if resource_info['arn'] == arn:
                return resource_info
        return None

    def _should_exclude_resource(self, tags: Dict[str, str]) -> bool:
        """Check if resource should be excluded from audit"""
        return (
            tags.get('ExcludeFromAudit', '').lower() == 'true' or
            tags.get('Temporary', '').lower() == 'true'
        )

    def _tags_to_dict(self, tags: List[Dict]) -> Dict[str, str]:
        """Convert AWS tag list to dictionary"""
        return {tag.get('Key', ''): tag.get('Value', '') for tag in tags}

    def _get_rds_tags(self, resource_arn: str) -> Dict[str, str]:
        """Get tags for RDS resource"""
        try:
            response = self.rds_client.list_tags_for_resource(ResourceName=resource_arn)
            return self._tags_to_dict(response.get('TagList', []))
        except ClientError:
            return {}

    def _get_efs_tags(self, file_system_id: str) -> Dict[str, str]:
        """Get tags for EFS file system"""
        try:
            response = self.efs_client.describe_tags(FileSystemId=file_system_id)
            tags = response.get('Tags', [])
            return self._tags_to_dict(tags)
        except ClientError:
            return {}

    def _get_dynamodb_tags(self, resource_arn: str) -> Dict[str, str]:
        """Get tags for DynamoDB table"""
        try:
            response = self.dynamodb_client.list_tags_of_resource(ResourceArn=resource_arn)
            return self._tags_to_dict(response.get('Tags', []))
        except ClientError:
            return {}

    def _get_account_id(self) -> str:
        """Get current AWS account ID"""
        try:
            return self.sts_client.get_caller_identity()['Account']
        except ClientError:
            return 'unknown'

    def _generate_audit_summary(self) -> Dict[str, Any]:
        """Generate comprehensive audit summary"""
        summary = {
            'audit_metadata': {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'region': self.region,
                'account_id': self._get_account_id(),
                'total_resources': len(self.resources),
                'total_findings': len(self.findings)
            },
            'compliance_summary': {
                'critical_findings': len([f for f in self.findings if f.severity == Severity.CRITICAL]),
                'high_findings': len([f for f in self.findings if f.severity == Severity.HIGH]),
                'medium_findings': len([f for f in self.findings if f.severity == Severity.MEDIUM]),
                'low_findings': len([f for f in self.findings if f.severity == Severity.LOW]),
                'info_findings': len([f for f in self.findings if f.severity == Severity.INFO])
            },
            'infrastructure_summary': {
                'backup_plans': len(self.backup_plans),
                'backup_vaults': len(self.backup_vaults),
                'total_recovery_points': sum(len(points) for points in self.recovery_points.values()),
                'protected_resources': len(self._get_protected_resources())
            },
            'findings': [asdict(f) for f in self.findings],
            'recovery_analysis': self._generate_recovery_analysis()
        }

        return summary

    def _generate_recovery_analysis(self) -> List[Dict]:
        """Generate recovery point analysis for resources"""
        analyses = []

        for resource_arn, points in self.recovery_points.items():
            resource_info = self._get_resource_by_arn(resource_arn)
            if not resource_info:
                continue

            # Sort points by creation date
            sorted_points = sorted(
                [p for p in points if p.get('creation_date')],
                key=lambda x: x['creation_date']
            )

            if sorted_points:
                # Calculate gaps
                gaps = []
                for i in range(1, len(sorted_points)):
                    gap = sorted_points[i]['creation_date'] - sorted_points[i-1]['creation_date']
                    gaps.append(gap.total_seconds() / 3600)  # Convert to hours

                # Count consecutive failures
                jobs = self.backup_jobs.get(resource_arn, [])
                consecutive_failures = 0
                max_consecutive = 0
                for job in sorted(jobs, key=lambda x: x.get('creation_date', datetime.min.replace(tzinfo=timezone.utc))):
                    if job['state'] in ['FAILED', 'EXPIRED']:
                        consecutive_failures += 1
                        max_consecutive = max(max_consecutive, consecutive_failures)
                    else:
                        consecutive_failures = 0

                analysis = RecoveryPointAnalysis(
                    resource_id=resource_arn.split('/')[-1],
                    resource_type=resource_info['type'],
                    last_recovery_point=sorted_points[-1]['creation_date'].isoformat() if sorted_points else None,
                    recovery_point_count=len(sorted_points),
                    gaps_hours=gaps,
                    max_gap_hours=max(gaps) if gaps else 0,
                    consecutive_failures=max_consecutive,
                    compliance_status='COMPLIANT' if max(gaps, default=0) <= 48 else 'NON_COMPLIANT',
                    calculated_rpo_hours=sum(gaps) / len(gaps) if gaps else 0,
                    estimated_rto_hours=self._estimate_rto(resource_info['type'])
                )

                analyses.append(asdict(analysis))

        return analyses

    def _estimate_rto(self, resource_type: str) -> float:
        """Estimate Recovery Time Objective based on resource type"""
        rto_estimates = {
            'EC2': 0.5,      # 30 minutes
            'EBS': 0.25,     # 15 minutes
            'RDS': 2.0,      # 2 hours
            'EFS': 1.0,      # 1 hour
            'DynamoDB': 0.5  # 30 minutes
        }
        return rto_estimates.get(resource_type, 1.0)

    def _save_json_report(self, audit_results: Dict):
        """Save detailed JSON report"""
        filename = 'backup_compliance_audit.json'
        with open(filename, 'w') as f:
            json.dump(audit_results, f, indent=2, default=str)
        logger.info(f"JSON report saved to {filename}")

    def _save_csv_report(self):
        """Save recovery readiness CSV report"""
        filename = 'recovery_readiness_report.csv'

        with open(filename, 'w', newline='') as f:
            fieldnames = [
                'Resource ID', 'Resource Type', 'Last Recovery Point',
                'Recovery Point Count', 'Max Gap (Hours)', 'Consecutive Failures',
                'Compliance Status', 'Calculated RPO (Hours)', 'Estimated RTO (Hours)'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for resource_arn, points in self.recovery_points.items():
                resource_info = self._get_resource_by_arn(resource_arn)
                if not resource_info:
                    continue

                # Generate analysis
                sorted_points = sorted(
                    [p for p in points if p.get('creation_date')],
                    key=lambda x: x['creation_date']
                )

                gaps = []
                if len(sorted_points) > 1:
                    for i in range(1, len(sorted_points)):
                        gap = sorted_points[i]['creation_date'] - sorted_points[i-1]['creation_date']
                        gaps.append(gap.total_seconds() / 3600)

                jobs = self.backup_jobs.get(resource_arn, [])
                consecutive_failures = 0
                max_consecutive = 0
                for job in sorted(jobs, key=lambda x: x.get('creation_date', datetime.min.replace(tzinfo=timezone.utc))):
                    if job['state'] in ['FAILED', 'EXPIRED']:
                        consecutive_failures += 1
                        max_consecutive = max(max_consecutive, consecutive_failures)
                    else:
                        consecutive_failures = 0

                writer.writerow({
                    'Resource ID': resource_arn.split('/')[-1],
                    'Resource Type': resource_info['type'],
                    'Last Recovery Point': sorted_points[-1]['creation_date'].isoformat() if sorted_points else 'N/A',
                    'Recovery Point Count': len(sorted_points),
                    'Max Gap (Hours)': f"{max(gaps):.1f}" if gaps else "0",
                    'Consecutive Failures': max_consecutive,
                    'Compliance Status': 'COMPLIANT' if max(gaps, default=0) <= 48 else 'NON_COMPLIANT',
                    'Calculated RPO (Hours)': f"{sum(gaps) / len(gaps):.1f}" if gaps else "0",
                    'Estimated RTO (Hours)': f"{self._estimate_rto(resource_info['type']):.1f}"
                })

        logger.info(f"CSV report saved to {filename}")

    def _print_console_summary(self, audit_results: Dict):
        """Print formatted console summary"""
        print("\n" + "="*80)
        print("AWS BACKUP COMPLIANCE AUDIT REPORT")
        print("="*80)

        metadata = audit_results['audit_metadata']
        print(f"\nAudit Date: {metadata['timestamp']}")
        print(f"Region: {metadata['region']}")
        print(f"Account: {metadata['account_id']}")
        print(f"Total Resources Analyzed: {metadata['total_resources']}")

        print("\n" + "-"*80)
        print("COMPLIANCE SUMMARY")
        print("-"*80)

        summary = audit_results['compliance_summary']
        total_findings = metadata['total_findings']

        if total_findings == 0:
            print("\nNo compliance issues found!")
        else:
            print(f"\nTotal Findings: {total_findings}")
            print(f"   Critical: {summary['critical_findings']}")
            print(f"   High: {summary['high_findings']}")
            print(f"   Medium: {summary['medium_findings']}")
            print(f"   Low: {summary['low_findings']}")
            print(f"   Info: {summary['info_findings']}")

        print("\n" + "-"*80)
        print("INFRASTRUCTURE SUMMARY")
        print("-"*80)

        infra = audit_results['infrastructure_summary']
        print(f"\nBackup Plans: {infra['backup_plans']}")
        print(f"Backup Vaults: {infra['backup_vaults']}")
        print(f"Total Recovery Points: {infra['total_recovery_points']}")
        print(f"Protected Resources: {infra['protected_resources']}")

        # Show top critical findings
        critical_findings = [f for f in self.findings if f.severity == Severity.CRITICAL]
        if critical_findings:
            print("\n" + "-"*80)
            print("CRITICAL FINDINGS (Action Required)")
            print("-"*80)

            for i, finding in enumerate(critical_findings[:5], 1):
                print(f"\n{i}. [{finding.check_name}] {finding.resource_type}: {finding.resource_id}")
                print(f"   Issue: {finding.details}")
                print(f"   Action: {finding.recommendation}")

        print("\n" + "="*80)
        print(f"Full reports saved:")
        print(f"  - backup_compliance_audit.json")
        print(f"  - recovery_readiness_report.csv")
        print("="*80 + "\n")


def main():
    """Main execution function"""
    try:
        # Parse command line arguments
        import argparse
        parser = argparse.ArgumentParser(description='AWS Backup Compliance Auditor')
        parser.add_argument('--region', default='us-east-1', help='AWS region to audit')
        parser.add_argument('--role-arn', help='Optional IAM role ARN for cross-account access')
        parser.add_argument('--debug', action='store_true', help='Enable debug logging')

        args = parser.parse_args()

        if args.debug:
            logging.getLogger().setLevel(logging.DEBUG)

        # Run audit
        auditor = AWSBackupAuditor(region=args.region, role_arn=args.role_arn)
        auditor.run_audit()

    except KeyboardInterrupt:
        print("\n\nAudit interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Audit failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
```
