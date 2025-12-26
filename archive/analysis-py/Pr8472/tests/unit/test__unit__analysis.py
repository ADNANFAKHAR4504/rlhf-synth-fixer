"""
Unit Tests for AWS Backup Compliance Audit Script

==============================================================================
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).
Tests individual methods and workflows in isolation with mocked AWS responses.
==============================================================================
"""

import sys
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, mock_open, call
from botocore.exceptions import ClientError

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import (
    AWSBackupAuditor,
    Finding,
    RecoveryPointAnalysis,
    Severity,
    ComplianceStatus
)


class TestAWSBackupAuditor:
    """
    Test suite for AWSBackupAuditor class
    Tests backup compliance checking and resource discovery logic
    """

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    @patch.dict(os.environ, {}, clear=True)
    def test_initialization_creates_aws_clients(self, mock_session):
        """Test that auditor initializes with correct AWS clients"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        assert auditor.region == 'us-east-1'

        # Verify all required clients are created
        assert mock_session_instance.client.call_count == 8

        # Check that each service client was created
        service_names = [call[0][0] for call in mock_session_instance.client.call_args_list]
        assert 'backup' in service_names
        assert 'ec2' in service_names
        assert 'rds' in service_names
        assert 'efs' in service_names
        assert 'dynamodb' in service_names
        assert 'kms' in service_names
        assert 'sns' in service_names
        assert 'sts' in service_names

    @patch('analyse.boto3.Session')
    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    def test_initialization_uses_endpoint_from_environment(self, mock_session):
        """Test auditor uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Verify endpoint_url was passed to boto3 clients
        calls = mock_session_instance.client.call_args_list
        for call_item in calls:
            assert call_item[1].get('endpoint_url') == 'http://localhost:5000'

    @patch('analyse.boto3.Session')
    def test_initialization_with_role_arn(self, mock_session):
        """Test initialization with cross-account role assumption"""
        with patch('analyse.boto3.client') as mock_boto_client:
            mock_sts = MagicMock()
            mock_boto_client.return_value = mock_sts
            mock_sts.assume_role.return_value = {
                'Credentials': {
                    'AccessKeyId': 'test-key',
                    'SecretAccessKey': 'test-secret',
                    'SessionToken': 'test-token'
                }
            }

            auditor = AWSBackupAuditor(
                region='us-east-1',
                role_arn='arn:aws:iam::123456789012:role/TestRole'
            )

            mock_sts.assume_role.assert_called_once()

    # =========================================================================
    # RESOURCE DISCOVERY TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_discover_ec2_instances(self, mock_session):
        """Test EC2 instance discovery with tag filtering"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_ec2 = MagicMock()
        mock_session_instance.client.return_value = mock_ec2

        # Mock different paginators for different resource types
        mock_instances_paginator = MagicMock()
        mock_volumes_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'describe_instances':
                return mock_instances_paginator
            elif operation == 'describe_volumes':
                return mock_volumes_paginator
            return MagicMock()

        mock_ec2.get_paginator.side_effect = get_paginator_side_effect

        # Mock EC2 instances response
        mock_instances_paginator.paginate.return_value = [
            {
                'Reservations': [
                    {
                        'Instances': [
                            {
                                'InstanceId': 'i-123456',
                                'State': {'Name': 'running'},
                                'Tags': [
                                    {'Key': 'Environment', 'Value': 'production'},
                                    {'Key': 'RequireBackup', 'Value': 'true'}
                                ]
                            },
                            {
                                'InstanceId': 'i-789012',
                                'State': {'Name': 'terminated'},
                                'Tags': []
                            }
                        ]
                    }
                ]
            }
        ]

        # Mock empty responses for other resources
        mock_volumes_paginator.paginate.return_value = [{'Volumes': []}]

        # Mock STS for account ID
        mock_sts = MagicMock()
        mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}

        auditor = AWSBackupAuditor(region='us-east-1')
        auditor.sts_client = mock_sts
        auditor._discover_resources()

        # Should discover only running instance
        assert 'i-123456' in auditor.resources
        assert 'i-789012' not in auditor.resources  # Terminated instances excluded
        assert auditor.resources['i-123456']['type'] == 'EC2'
        assert auditor.resources['i-123456']['tags']['Environment'] == 'production'

    @patch('analyse.boto3.Session')
    def test_discover_resources_excludes_temporary_tags(self, mock_session):
        """Test that resources with Temporary:true tag are excluded"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_ec2 = MagicMock()
        mock_session_instance.client.return_value = mock_ec2

        # Mock different paginators
        mock_instances_paginator = MagicMock()
        mock_volumes_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'describe_instances':
                return mock_instances_paginator
            elif operation == 'describe_volumes':
                return mock_volumes_paginator
            return MagicMock()

        mock_ec2.get_paginator.side_effect = get_paginator_side_effect

        mock_instances_paginator.paginate.return_value = [
            {
                'Reservations': [
                    {
                        'Instances': [
                            {
                                'InstanceId': 'i-temp-123',
                                'State': {'Name': 'running'},
                                'Tags': [
                                    {'Key': 'Temporary', 'Value': 'true'}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]

        mock_volumes_paginator.paginate.return_value = [{'Volumes': []}]

        auditor = AWSBackupAuditor(region='us-east-1')
        auditor._discover_resources()

        # Temporary resources should be excluded
        assert 'i-temp-123' not in auditor.resources

    @patch('analyse.boto3.Session')
    def test_discover_rds_instances(self, mock_session):
        """Test RDS instance discovery"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        # Create mocks for different clients
        clients = {}

        def get_client(service, **kwargs):
            if service not in clients:
                clients[service] = MagicMock()
            return clients[service]

        mock_session_instance.client.side_effect = get_client

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock RDS paginator
        mock_rds_paginator = MagicMock()
        clients['rds'].get_paginator.return_value = mock_rds_paginator
        mock_rds_paginator.paginate.return_value = [
            {
                'DBInstances': [
                    {
                        'DBInstanceIdentifier': 'prod-db',
                        'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:prod-db',
                        'DBInstanceStatus': 'available'
                    }
                ]
            }
        ]

        # Mock RDS tags
        clients['rds'].list_tags_for_resource.return_value = {
            'TagList': [{'Key': 'Environment', 'Value': 'production'}]
        }

        # Mock EC2 with side_effect for multiple operations
        mock_ec2_instances_paginator = MagicMock()
        mock_ec2_volumes_paginator = MagicMock()
        mock_ec2_instances_paginator.paginate.return_value = [{'Reservations': []}]
        mock_ec2_volumes_paginator.paginate.return_value = [{'Volumes': []}]

        def ec2_get_paginator(operation):
            if operation == 'describe_instances':
                return mock_ec2_instances_paginator
            else:
                return mock_ec2_volumes_paginator

        clients['ec2'].get_paginator.side_effect = ec2_get_paginator

        # Mock other empty paginators
        for service in ['efs', 'dynamodb']:
            mock_paginator = MagicMock()
            clients[service].get_paginator.return_value = mock_paginator
            if service == 'efs':
                mock_paginator.paginate.return_value = [{'FileSystems': []}]
            elif service == 'dynamodb':
                mock_paginator.paginate.return_value = [{'TableNames': []}]

        auditor._discover_resources()

        assert 'prod-db' in auditor.resources
        assert auditor.resources['prod-db']['type'] == 'RDS'

    @patch('analyse.boto3.Session')
    def test_discover_efs_file_systems(self, mock_session):
        """Test EFS file system discovery"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        clients = {}

        def get_client(service, **kwargs):
            if service not in clients:
                clients[service] = MagicMock()
            return clients[service]

        mock_session_instance.client.side_effect = get_client

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock EFS paginator
        mock_efs_paginator = MagicMock()
        clients['efs'].get_paginator.return_value = mock_efs_paginator
        mock_efs_paginator.paginate.return_value = [
            {
                'FileSystems': [
                    {
                        'FileSystemId': 'fs-12345',
                        'FileSystemArn': 'arn:aws:elasticfilesystem:us-east-1:123456789012:file-system/fs-12345',
                        'LifeCycleState': 'available'
                    }
                ]
            }
        ]

        # Mock EFS tags
        clients['efs'].describe_tags.return_value = {
            'Tags': [{'Key': 'Application', 'Value': 'WebApp'}]
        }

        # Mock EC2 with side_effect for multiple operations
        mock_ec2_instances_paginator = MagicMock()
        mock_ec2_volumes_paginator = MagicMock()
        mock_ec2_instances_paginator.paginate.return_value = [{'Reservations': []}]
        mock_ec2_volumes_paginator.paginate.return_value = [{'Volumes': []}]

        def ec2_get_paginator(operation):
            if operation == 'describe_instances':
                return mock_ec2_instances_paginator
            else:
                return mock_ec2_volumes_paginator

        clients['ec2'].get_paginator.side_effect = ec2_get_paginator

        # Mock other empty paginators
        for service in ['rds', 'dynamodb']:
            mock_paginator = MagicMock()
            clients[service].get_paginator.return_value = mock_paginator
            if service == 'rds':
                mock_paginator.paginate.return_value = [{'DBInstances': []}]
            elif service == 'dynamodb':
                mock_paginator.paginate.return_value = [{'TableNames': []}]

        auditor._discover_resources()

        assert 'fs-12345' in auditor.resources
        assert auditor.resources['fs-12345']['type'] == 'EFS'

    @patch('analyse.boto3.Session')
    def test_discover_dynamodb_tables(self, mock_session):
        """Test DynamoDB table discovery"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        clients = {}

        def get_client(service, **kwargs):
            if service not in clients:
                clients[service] = MagicMock()
            return clients[service]

        mock_session_instance.client.side_effect = get_client

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock DynamoDB paginator
        mock_dynamodb_paginator = MagicMock()
        clients['dynamodb'].get_paginator.return_value = mock_dynamodb_paginator
        mock_dynamodb_paginator.paginate.return_value = [
            {'TableNames': ['Users', 'Products']}
        ]

        # Mock DynamoDB describe_table
        def describe_table_side_effect(TableName):
            return {
                'Table': {
                    'TableName': TableName,
                    'TableArn': f'arn:aws:dynamodb:us-east-1:123456789012:table/{TableName}',
                    'TableStatus': 'ACTIVE'
                }
            }

        clients['dynamodb'].describe_table.side_effect = describe_table_side_effect

        # Mock DynamoDB tags
        clients['dynamodb'].list_tags_of_resource.return_value = {
            'Tags': [{'Key': 'Purpose', 'Value': 'UserData'}]
        }

        # Mock EC2 with side_effect for multiple operations
        mock_ec2_instances_paginator = MagicMock()
        mock_ec2_volumes_paginator = MagicMock()
        mock_ec2_instances_paginator.paginate.return_value = [{'Reservations': []}]
        mock_ec2_volumes_paginator.paginate.return_value = [{'Volumes': []}]

        def ec2_get_paginator(operation):
            if operation == 'describe_instances':
                return mock_ec2_instances_paginator
            else:
                return mock_ec2_volumes_paginator

        clients['ec2'].get_paginator.side_effect = ec2_get_paginator

        # Mock other empty paginators
        for service in ['rds', 'efs']:
            mock_paginator = MagicMock()
            clients[service].get_paginator.return_value = mock_paginator
            if service == 'rds':
                mock_paginator.paginate.return_value = [{'DBInstances': []}]
            elif service == 'efs':
                mock_paginator.paginate.return_value = [{'FileSystems': []}]

        auditor._discover_resources()

        assert 'Users' in auditor.resources
        assert 'Products' in auditor.resources
        assert auditor.resources['Users']['type'] == 'DynamoDB'

    # =========================================================================
    # BACKUP INFRASTRUCTURE DISCOVERY TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_discover_backup_vaults(self, mock_session):
        """Test backup vault discovery with encryption and lock configuration"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_backup = MagicMock()
        mock_session_instance.client.return_value = mock_backup

        # Mock different paginators
        mock_plans_paginator = MagicMock()
        mock_vaults_paginator = MagicMock()
        mock_recovery_paginator = MagicMock()
        mock_jobs_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_backup_plans':
                return mock_plans_paginator
            elif operation == 'list_backup_vaults':
                return mock_vaults_paginator
            elif operation == 'list_recovery_points_by_backup_vault':
                return mock_recovery_paginator
            elif operation == 'list_backup_jobs':
                return mock_jobs_paginator
            return MagicMock()

        mock_backup.get_paginator.side_effect = get_paginator_side_effect

        # Mock empty plans
        mock_plans_paginator.paginate.return_value = [{'BackupPlansList': []}]

        # Mock vault list
        mock_vaults_paginator.paginate.return_value = [
            {
                'BackupVaultList': [
                    {
                        'BackupVaultName': 'SecureVault',
                        'BackupVaultArn': 'arn:aws:backup:us-east-1:123456789012:vault:SecureVault',
                        'EncryptionKeyArn': 'arn:aws:kms:us-east-1:123456789012:key/test-key',
                        'CreationDate': datetime.now(timezone.utc)
                    }
                ]
            }
        ]

        # Mock recovery points and jobs as empty
        mock_recovery_paginator.paginate.return_value = [{'RecoveryPoints': []}]
        mock_jobs_paginator.paginate.return_value = [{'BackupJobs': []}]

        # Mock vault lock configuration
        mock_backup.describe_backup_vault.return_value = {
            'LockConfiguration': {
                'MinRetentionDays': 30,
                'MaxRetentionDays': 365
            }
        }

        # Mock SNS configuration
        mock_backup.get_backup_vault_notifications.return_value = {
            'SNSTopicArn': 'arn:aws:sns:us-east-1:123456789012:backup-alerts'
        }

        auditor = AWSBackupAuditor(region='us-east-1')
        auditor._discover_backup_infrastructure()

        assert 'SecureVault' in auditor.backup_vaults
        assert auditor.backup_vaults['SecureVault']['encryption_key'] is not None
        assert auditor.backup_vaults['SecureVault']['vault_lock'] is not None
        assert auditor.backup_vaults['SecureVault']['sns_topic'] is not None

    @patch('analyse.boto3.Session')
    def test_discover_backup_plans_with_selections(self, mock_session):
        """Test backup plan discovery including resource selections"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_backup = MagicMock()
        mock_session_instance.client.return_value = mock_backup

        # Mock different paginators
        mock_plans_paginator = MagicMock()
        mock_selections_paginator = MagicMock()
        mock_vaults_paginator = MagicMock()
        mock_recovery_paginator = MagicMock()
        mock_jobs_paginator = MagicMock()

        paginator_call_count = [0]

        def get_paginator_side_effect(operation):
            if operation == 'list_backup_plans':
                return mock_plans_paginator
            elif operation == 'list_backup_selections':
                return mock_selections_paginator
            elif operation == 'list_backup_vaults':
                return mock_vaults_paginator
            elif operation == 'list_recovery_points_by_backup_vault':
                return mock_recovery_paginator
            elif operation == 'list_backup_jobs':
                return mock_jobs_paginator
            return MagicMock()

        mock_backup.get_paginator.side_effect = get_paginator_side_effect

        # Mock backup plans
        mock_plans_paginator.paginate.return_value = [
            {
                'BackupPlansList': [
                    {
                        'BackupPlanId': 'plan-123',
                        'BackupPlanName': 'DailyBackup',
                        'BackupPlanArn': 'arn:aws:backup:us-east-1:123456789012:plan:plan-123'
                    }
                ]
            }
        ]

        # Mock selections
        mock_selections_paginator.paginate.return_value = [{'BackupSelectionsList': []}]

        # Mock empty vaults, recovery points, and jobs
        mock_vaults_paginator.paginate.return_value = [{'BackupVaultList': []}]
        mock_recovery_paginator.paginate.return_value = [{'RecoveryPoints': []}]
        mock_jobs_paginator.paginate.return_value = [{'BackupJobs': []}]

        # Mock plan details
        mock_backup.get_backup_plan.return_value = {
            'BackupPlan': {
                'BackupPlanName': 'DailyBackup',
                'Rules': [
                    {
                        'RuleName': 'DailyRule',
                        'TargetBackupVaultName': 'DefaultVault',
                        'ScheduleExpression': 'cron(0 5 ? * * *)',
                        'Lifecycle': {
                            'DeleteAfterDays': 30,
                            'MoveToColdStorageAfterDays': 7
                        }
                    }
                ]
            }
        }

        auditor = AWSBackupAuditor(region='us-east-1')
        auditor._discover_backup_infrastructure()

        assert 'plan-123' in auditor.backup_plans
        assert auditor.backup_plans['plan-123']['name'] == 'DailyBackup'

    # =========================================================================
    # COMPLIANCE CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_check_unprotected_resources(self, mock_session):
        """Test identification of resources requiring backup without plans"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add resource requiring backup
        auditor.resources = {
            'i-unprotected': {
                'type': 'EC2',
                'arn': 'arn:aws:ec2:us-east-1:123456789012:instance/i-unprotected',
                'tags': {'RequireBackup': 'true', 'Environment': 'production'},
                'state': 'running'
            }
        }

        # No backup plans protecting this resource
        auditor.backup_plans = {}

        auditor._check_unprotected_resources()

        # Should find one critical finding
        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.CRITICAL
        assert auditor.findings[0].check_id == 'AWS-BACKUP-001'
        assert auditor.findings[0].resource_id == 'i-unprotected'

    @patch('analyse.boto3.Session')
    def test_check_missing_prod_coverage(self, mock_session):
        """Test identification of production resources without backup"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add production resource without backup
        auditor.resources = {
            'vol-prod': {
                'type': 'EBS',
                'arn': 'arn:aws:ec2:us-east-1:123456789012:volume/vol-prod',
                'tags': {'Environment': 'production'},
                'state': 'available'
            }
        }

        auditor.backup_plans = {}

        auditor._check_missing_prod_coverage()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.CRITICAL
        assert auditor.findings[0].check_id == 'AWS-BACKUP-002'

    @patch('analyse.boto3.Session')
    def test_check_inadequate_retention(self, mock_session):
        """Test identification of backup plans with inadequate retention for critical data"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add critical resource
        auditor.resources = {
            'db-critical': {
                'type': 'RDS',
                'arn': 'arn:aws:rds:us-east-1:123456789012:db:db-critical',
                'tags': {'DataClassification': 'Critical'},
                'state': 'available'
            }
        }

        # Add backup plan with short retention
        auditor.backup_plans = {
            'plan-123': {
                'name': 'ShortRetentionPlan',
                'details': {
                    'Rules': [
                        {
                            'RuleName': 'ShortRetention',
                            'Lifecycle': {
                                'DeleteAfterDays': 3  # Less than 7 days
                            }
                        }
                    ]
                },
                'selections': [
                    {
                        'Resources': ['arn:aws:rds:us-east-1:123456789012:db:db-critical']
                    }
                ]
            }
        }

        auditor._check_inadequate_retention()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.HIGH
        assert auditor.findings[0].check_id == 'AWS-BACKUP-003'

    @patch('analyse.boto3.Session')
    def test_check_vault_immutability(self, mock_session):
        """Test identification of vaults without WORM lock"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add vault without lock
        auditor.backup_vaults = {
            'UnlockedVault': {
                'arn': 'arn:aws:backup:us-east-1:123456789012:vault:UnlockedVault',
                'encryption_key': 'arn:aws:kms:us-east-1:123456789012:key/test',
                'vault_lock': None,  # No lock configured
                'sns_topic': None,
                'creation_date': datetime.now(timezone.utc)
            }
        }

        auditor._check_vault_immutability()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.HIGH
        assert auditor.findings[0].check_id == 'AWS-BACKUP-004'

    @patch('analyse.boto3.Session')
    def test_check_cross_region_dr(self, mock_session):
        """Test identification of plans without cross-region disaster recovery"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add plan without cross-region copy
        auditor.backup_plans = {
            'plan-local': {
                'name': 'LocalOnlyPlan',
                'details': {
                    'Rules': [
                        {
                            'RuleName': 'LocalRule',
                            'CopyActions': []  # No cross-region copies
                        }
                    ]
                },
                'selections': []
            }
        }

        auditor._check_cross_region_dr()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.HIGH
        assert auditor.findings[0].check_id == 'AWS-BACKUP-005'

    @patch('analyse.boto3.Session')
    def test_check_vault_encryption(self, mock_session):
        """Test identification of unencrypted backup vaults"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add unencrypted vault
        auditor.backup_vaults = {
            'UnencryptedVault': {
                'arn': 'arn:aws:backup:us-east-1:123456789012:vault:UnencryptedVault',
                'encryption_key': None,  # No encryption
                'vault_lock': None,
                'sns_topic': None,
                'creation_date': datetime.now(timezone.utc)
            }
        }

        auditor._check_vault_encryption()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.HIGH
        assert auditor.findings[0].check_id == 'AWS-BACKUP-006'

    @patch('analyse.boto3.Session')
    def test_check_recovery_point_gaps(self, mock_session):
        """Test identification of resources with large gaps between recovery points"""
        from datetime import timedelta

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add resource
        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123'
        auditor.resources = {
            'vol-123': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {},
                'state': 'available'
            }
        }

        # Add recovery points with large gap
        now = datetime.now(timezone.utc)
        auditor.recovery_points = {
            resource_arn: [
                {
                    'creation_date': now - timedelta(hours=100),
                    'status': 'COMPLETED'
                },
                {
                    'creation_date': now,
                    'status': 'COMPLETED'
                }
            ]
        }

        auditor._check_recovery_point_gaps()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.HIGH
        assert auditor.findings[0].check_id == 'AWS-BACKUP-007'

    @patch('analyse.boto3.Session')
    def test_check_consecutive_failures(self, mock_session):
        """Test identification of resources with consecutive backup failures"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:instance/i-123'
        auditor.resources = {
            'i-123': {
                'type': 'EC2',
                'arn': resource_arn,
                'tags': {},
                'state': 'running'
            }
        }

        # Add consecutive failed jobs
        now = datetime.now(timezone.utc)
        auditor.backup_jobs = {
            resource_arn: [
                {'state': 'FAILED', 'creation_date': now},
                {'state': 'FAILED', 'creation_date': now},
                {'state': 'FAILED', 'creation_date': now}
            ]
        }

        auditor._check_consecutive_failures()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.CRITICAL
        assert auditor.findings[0].check_id == 'AWS-BACKUP-008'

    @patch('analyse.boto3.Session')
    def test_check_missing_notifications(self, mock_session):
        """Test identification of vaults without SNS notifications"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        auditor.backup_vaults = {
            'SilentVault': {
                'arn': 'arn:aws:backup:us-east-1:123456789012:vault:SilentVault',
                'encryption_key': None,
                'vault_lock': None,
                'sns_topic': None,  # No SNS notifications
                'creation_date': datetime.now(timezone.utc)
            }
        }

        auditor._check_missing_notifications()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.MEDIUM
        assert auditor.findings[0].check_id == 'AWS-BACKUP-009'

    @patch('analyse.boto3.Session')
    def test_check_cost_inefficiency(self, mock_session):
        """Test identification of plans without lifecycle policies"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add plan without cold storage lifecycle
        auditor.backup_plans = {
            'plan-no-lifecycle': {
                'name': 'NoLifecyclePlan',
                'details': {
                    'Rules': [
                        {
                            'RuleName': 'NoLifecycle',
                            'Lifecycle': {
                                'DeleteAfterDays': 365
                                # No MoveToColdStorageAfterDays
                            }
                        }
                    ]
                },
                'selections': []
            }
        }

        auditor._check_cost_inefficiency()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].severity == Severity.LOW
        assert auditor.findings[0].check_id == 'AWS-BACKUP-012'

    # =========================================================================
    # HELPER METHOD TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_tags_to_dict_conversion(self, mock_session):
        """Test conversion of AWS tag list to dictionary"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        tags_list = [
            {'Key': 'Environment', 'Value': 'production'},
            {'Key': 'Owner', 'Value': 'DevOps'},
            {'Key': 'RequireBackup', 'Value': 'true'}
        ]

        result = auditor._tags_to_dict(tags_list)

        assert result == {
            'Environment': 'production',
            'Owner': 'DevOps',
            'RequireBackup': 'true'
        }

    @patch('analyse.boto3.Session')
    def test_should_exclude_resource_logic(self, mock_session):
        """Test resource exclusion logic for temporary and audit-excluded resources"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Test exclusion scenarios
        assert auditor._should_exclude_resource({'Temporary': 'true'}) is True
        assert auditor._should_exclude_resource({'ExcludeFromAudit': 'true'}) is True
        assert auditor._should_exclude_resource({'Environment': 'production'}) is False
        assert auditor._should_exclude_resource({'Temporary': 'false'}) is False

    @patch('analyse.boto3.Session')
    def test_get_protected_resources(self, mock_session):
        """Test identification of resources protected by backup plans"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add resources
        auditor.resources = {
            'vol-123': {
                'type': 'EBS',
                'arn': 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123',
                'tags': {'RequireBackup': 'true'}
            }
        }

        # Add backup plan with selections
        auditor.backup_plans = {
            'plan-123': {
                'selections': [
                    {
                        'Resources': ['arn:aws:ec2:us-east-1:123456789012:volume/vol-123']
                    }
                ]
            }
        }

        protected = auditor._get_protected_resources()

        assert 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123' in protected

    @patch('analyse.boto3.Session')
    def test_estimate_rto_by_resource_type(self, mock_session):
        """Test RTO estimation based on resource type"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        assert auditor._estimate_rto('EC2') == 0.5
        assert auditor._estimate_rto('EBS') == 0.25
        assert auditor._estimate_rto('RDS') == 2.0
        assert auditor._estimate_rto('EFS') == 1.0
        assert auditor._estimate_rto('DynamoDB') == 0.5
        assert auditor._estimate_rto('Unknown') == 1.0  # Default

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_serialize_finding_converts_enums(self, mock_session):
        """Test that findings are serialized with enum values converted to strings"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        finding = Finding(
            check_id='TEST-001',
            check_name='Test Check',
            severity=Severity.CRITICAL,
            status=ComplianceStatus.NON_COMPLIANT,
            resource_id='test-resource',
            resource_type='Test',
            resource_tags={},
            details='Test details',
            recommendation='Test recommendation'
        )

        result = auditor._serialize_finding(finding)

        # Verify enum values are converted to strings
        assert result['severity'] == 'CRITICAL'
        assert result['status'] == 'NON_COMPLIANT'
        assert isinstance(result['severity'], str)
        assert isinstance(result['status'], str)

    @patch('analyse.boto3.Session')
    def test_generate_audit_summary_structure(self, mock_session):
        """Test audit summary generation with correct structure"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add some test findings
        auditor.findings = [
            Finding(
                check_id='TEST-001',
                check_name='Test',
                severity=Severity.CRITICAL,
                status=ComplianceStatus.NON_COMPLIANT,
                resource_id='resource-1',
                resource_type='EC2',
                resource_tags={},
                details='Test',
                recommendation='Test'
            ),
            Finding(
                check_id='TEST-002',
                check_name='Test',
                severity=Severity.HIGH,
                status=ComplianceStatus.NON_COMPLIANT,
                resource_id='resource-2',
                resource_type='RDS',
                resource_tags={},
                details='Test',
                recommendation='Test'
            )
        ]

        auditor.resources = {'resource-1': {}, 'resource-2': {}}
        auditor.backup_plans = {}
        auditor.backup_vaults = {}

        summary = auditor._generate_audit_summary()

        # Verify structure
        assert 'audit_metadata' in summary
        assert 'compliance_summary' in summary
        assert 'infrastructure_summary' in summary
        assert 'findings' in summary
        assert 'recovery_analysis' in summary

        # Verify metadata
        assert summary['audit_metadata']['region'] == 'us-east-1'
        assert summary['audit_metadata']['total_resources'] == 2
        assert summary['audit_metadata']['total_findings'] == 2

        # Verify compliance summary
        assert summary['compliance_summary']['critical_findings'] == 1
        assert summary['compliance_summary']['high_findings'] == 1

    @patch('analyse.boto3.Session')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_save_json_report_creates_file(self, mock_json_dump, mock_file_open, mock_session):
        """Test JSON report is saved correctly"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        test_results = {
            'audit_metadata': {'timestamp': '2023-01-01'},
            'findings': []
        }

        auditor._save_json_report(test_results)

        # Verify file was opened
        mock_file_open.assert_called_once_with('backup_compliance_audit.json', 'w')
        # Verify JSON dump was called
        assert mock_json_dump.called

    @patch('analyse.boto3.Session')
    @patch('builtins.open', new_callable=mock_open)
    @patch('csv.DictWriter')
    def test_save_csv_report_creates_file(self, mock_csv_writer, mock_file_open, mock_session):
        """Test CSV report is saved correctly"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')
        auditor.recovery_points = {}
        auditor.backup_jobs = {}

        auditor._save_csv_report()

        # Verify file was opened
        mock_file_open.assert_called_once_with('recovery_readiness_report.csv', 'w', newline='')

    @patch('analyse.boto3.Session')
    @patch('builtins.open', new_callable=mock_open)
    def test_save_csv_report_with_recovery_data(self, mock_file_open, mock_session):
        """Test CSV report generation with actual recovery data"""
        from datetime import timedelta

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add resource
        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123'
        auditor.resources = {
            'vol-123': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {}
            }
        }

        # Add recovery points with gaps
        now = datetime.now(timezone.utc)
        auditor.recovery_points = {
            resource_arn: [
                {
                    'creation_date': now - timedelta(hours=48),
                    'status': 'COMPLETED'
                },
                {
                    'creation_date': now,
                    'status': 'COMPLETED'
                }
            ]
        }

        # Add backup jobs
        auditor.backup_jobs = {
            resource_arn: [
                {'state': 'COMPLETED', 'creation_date': now - timedelta(hours=24)},
                {'state': 'COMPLETED', 'creation_date': now}
            ]
        }

        auditor._save_csv_report()

        # Verify file was opened
        mock_file_open.assert_called_once_with('recovery_readiness_report.csv', 'w', newline='')

    @patch('analyse.boto3.Session')
    def test_check_restore_testing(self, mock_session):
        """Test identification of resources without restore testing"""
        from datetime import timedelta

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123'
        auditor.resources = {
            'vol-123': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {},
                'state': 'available'
            }
        }

        # Mock restore jobs call to return empty
        auditor.backup_client.get_paginator = MagicMock()
        mock_paginator = MagicMock()
        auditor.backup_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'RestoreJobs': []}]

        # Add resource to protected resources
        auditor.backup_plans = {
            'plan-123': {
                'selections': [{'Resources': [resource_arn]}]
            }
        }

        auditor._check_restore_testing()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].check_id == 'AWS-BACKUP-010'

    @patch('analyse.boto3.Session')
    def test_check_orphaned_points(self, mock_session):
        """Test identification of orphaned recovery points"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # No resources
        auditor.resources = {}

        # Recovery points for non-existent resource
        deleted_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-deleted'
        auditor.recovery_points = {
            deleted_arn: [
                {
                    'backup_size_bytes': 1073741824,  # 1 GB
                    'creation_date': datetime.now(timezone.utc)
                }
            ]
        }

        auditor._check_orphaned_points()

        assert len(auditor.findings) == 1
        assert auditor.findings[0].check_id == 'AWS-BACKUP-011'
        assert auditor.findings[0].severity == Severity.LOW

    @patch('analyse.boto3.Session')
    def test_get_resource_by_arn(self, mock_session):
        """Test get_resource_by_arn helper method"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        test_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123'
        auditor.resources = {
            'vol-123': {
                'type': 'EBS',
                'arn': test_arn,
                'tags': {}
            }
        }

        result = auditor._get_resource_by_arn(test_arn)
        assert result is not None
        assert result['type'] == 'EBS'

        # Test non-existent ARN
        result = auditor._get_resource_by_arn('arn:aws:ec2:us-east-1:123456789012:volume/vol-nonexistent')
        assert result is None

    @patch('analyse.boto3.Session')
    def test_get_rds_tags(self, mock_session):
        """Test RDS tag retrieval"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock RDS client
        auditor.rds_client.list_tags_for_resource.return_value = {
            'TagList': [
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'Owner', 'Value': 'DBA'}
            ]
        }

        tags = auditor._get_rds_tags('arn:aws:rds:us-east-1:123456789012:db:test-db')
        assert tags == {'Environment': 'production', 'Owner': 'DBA'}

        # Test error handling
        auditor.rds_client.list_tags_for_resource.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}}, 'ListTagsForResource'
        )
        tags = auditor._get_rds_tags('arn:aws:rds:us-east-1:123456789012:db:test-db')
        assert tags == {}

    @patch('analyse.boto3.Session')
    def test_get_efs_tags(self, mock_session):
        """Test EFS tag retrieval"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock EFS client
        auditor.efs_client.describe_tags.return_value = {
            'Tags': [
                {'Key': 'Application', 'Value': 'WebApp'}
            ]
        }

        tags = auditor._get_efs_tags('fs-12345')
        assert tags == {'Application': 'WebApp'}

    @patch('analyse.boto3.Session')
    def test_get_dynamodb_tags(self, mock_session):
        """Test DynamoDB tag retrieval"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock DynamoDB client
        auditor.dynamodb_client.list_tags_of_resource.return_value = {
            'Tags': [
                {'Key': 'Purpose', 'Value': 'UserData'}
            ]
        }

        tags = auditor._get_dynamodb_tags('arn:aws:dynamodb:us-east-1:123456789012:table/Users')
        assert tags == {'Purpose': 'UserData'}

    @patch('analyse.boto3.Session')
    def test_get_account_id(self, mock_session):
        """Test account ID retrieval"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock STS
        auditor.sts_client.get_caller_identity.return_value = {'Account': '123456789012'}

        account_id = auditor._get_account_id()
        assert account_id == '123456789012'

        # Test error handling
        auditor.sts_client.get_caller_identity.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}}, 'GetCallerIdentity'
        )
        account_id = auditor._get_account_id()
        assert account_id == 'unknown'

    @patch('analyse.boto3.Session')
    def test_generate_recovery_analysis(self, mock_session):
        """Test recovery point analysis generation"""
        from datetime import timedelta

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123'
        auditor.resources = {
            'vol-123': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {}
            }
        }

        # Add recovery points
        now = datetime.now(timezone.utc)
        auditor.recovery_points = {
            resource_arn: [
                {
                    'creation_date': now - timedelta(hours=24),
                    'status': 'COMPLETED'
                },
                {
                    'creation_date': now,
                    'status': 'COMPLETED'
                }
            ]
        }

        # Add backup jobs
        auditor.backup_jobs = {
            resource_arn: [
                {'state': 'COMPLETED', 'creation_date': now}
            ]
        }

        analysis = auditor._generate_recovery_analysis()

        assert len(analysis) == 1
        assert analysis[0]['resource_type'] == 'EBS'
        assert analysis[0]['recovery_point_count'] == 2
        assert analysis[0]['calculated_rpo_hours'] == 24.0

    @patch('analyse.boto3.Session')
    @patch('builtins.print')
    def test_print_console_summary(self, mock_print, mock_session):
        """Test console summary printing"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add test findings
        auditor.findings = [
            Finding(
                check_id='TEST-001',
                check_name='Test',
                severity=Severity.CRITICAL,
                status=ComplianceStatus.NON_COMPLIANT,
                resource_id='resource-1',
                resource_type='EC2',
                resource_tags={},
                details='Test',
                recommendation='Test'
            )
        ]

        audit_results = {
            'audit_metadata': {
                'timestamp': '2023-01-01',
                'region': 'us-east-1',
                'account_id': '123456789012',
                'total_resources': 10,
                'total_findings': 1
            },
            'compliance_summary': {
                'critical_findings': 1,
                'high_findings': 0,
                'medium_findings': 0,
                'low_findings': 0,
                'info_findings': 0
            },
            'infrastructure_summary': {
                'backup_plans': 2,
                'backup_vaults': 3,
                'total_recovery_points': 50,
                'protected_resources': 8
            }
        }

        auditor._print_console_summary(audit_results)

        # Verify print was called
        assert mock_print.called

    @patch('analyse.boto3.Session')
    @patch('builtins.print')
    def test_print_findings_table(self, mock_print, mock_session):
        """Test findings table printing"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add various findings
        auditor.findings = [
            Finding(
                check_id='TEST-001',
                check_name='Test CRITICAL',
                severity=Severity.CRITICAL,
                status=ComplianceStatus.NON_COMPLIANT,
                resource_id='resource-1',
                resource_type='EC2',
                resource_tags={},
                details='Test',
                recommendation='Test'
            ),
            Finding(
                check_id='TEST-002',
                check_name='Test HIGH',
                severity=Severity.HIGH,
                status=ComplianceStatus.NON_COMPLIANT,
                resource_id='resource-2-with-very-long-id-that-needs-truncation',
                resource_type='RDS',
                resource_tags={},
                details='Test',
                recommendation='Test'
            )
        ]

        auditor._print_findings_table()

        # Verify print was called
        assert mock_print.called

    @patch('analyse.boto3.Session')
    def test_matches_selection_conditions(self, mock_session):
        """Test selection condition matching"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_info = {
            'tags': {
                'Environment': 'production',
                'RequireBackup': 'true'
            }
        }

        # Test matching condition
        conditions = {
            'StringEquals': [
                {
                    'ConditionKey': 'aws:ResourceTag/Environment',
                    'ConditionValue': 'production'
                }
            ]
        }

        assert auditor._matches_selection_conditions(resource_info, conditions) is True

        # Test non-matching condition
        conditions = {
            'StringEquals': [
                {
                    'ConditionKey': 'aws:ResourceTag/Environment',
                    'ConditionValue': 'development'
                }
            ]
        }

        assert auditor._matches_selection_conditions(resource_info, conditions) is False

    # =========================================================================
    # ERROR HANDLING TESTS
    # =========================================================================

    @patch('analyse.boto3.Session')
    def test_discover_resources_handles_client_error(self, mock_session):
        """Test resource discovery handles AWS ClientError gracefully"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_ec2 = MagicMock()
        mock_session_instance.client.return_value = mock_ec2

        # Make get_paginator raise ClientError
        mock_ec2.get_paginator.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeInstances'
        )

        auditor = AWSBackupAuditor(region='us-east-1')

        # Should not raise exception
        try:
            auditor._discover_resources()
        except ClientError:
            pytest.fail("Should handle ClientError gracefully")

        # Resources should be empty due to error
        assert len(auditor.resources) == 0

    @patch('analyse.boto3.Session')
    def test_run_audit_handles_exceptions(self, mock_session):
        """Test run_audit handles exceptions and logs errors"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Make _discover_resources raise exception
        with patch.object(auditor, '_discover_resources', side_effect=Exception("Test error")):
            with pytest.raises(Exception):
                auditor.run_audit()

    @patch('analyse.boto3.Session')
    def test_run_audit_complete_workflow(self, mock_session):
        """Test complete audit workflow"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock all methods
        with patch.object(auditor, '_discover_resources'):
            with patch.object(auditor, '_discover_backup_infrastructure'):
                with patch.object(auditor, '_generate_audit_summary', return_value={'test': 'data'}):
                    with patch.object(auditor, '_save_json_report'):
                        with patch.object(auditor, '_save_csv_report'):
                            with patch.object(auditor, '_print_console_summary'):
                                result = auditor.run_audit()

        assert result is not None
        assert 'test' in result


    @patch('analyse.boto3.Session')
    def test_discover_backup_infrastructure_with_recovery_points(self, mock_session):
        """Test backup infrastructure discovery including recovery points and jobs"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance
        mock_backup = MagicMock()
        mock_session_instance.client.return_value = mock_backup

        # Mock paginators
        mock_plans_paginator = MagicMock()
        mock_vaults_paginator = MagicMock()
        mock_recovery_paginator = MagicMock()
        mock_jobs_paginator = MagicMock()
        mock_selections_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_backup_plans':
                return mock_plans_paginator
            elif operation == 'list_backup_vaults':
                return mock_vaults_paginator
            elif operation == 'list_recovery_points_by_backup_vault':
                return mock_recovery_paginator
            elif operation == 'list_backup_jobs':
                return mock_jobs_paginator
            elif operation == 'list_backup_selections':
                return mock_selections_paginator
            return MagicMock()

        mock_backup.get_paginator.side_effect = get_paginator_side_effect

        # Mock backup plans with selections
        mock_plans_paginator.paginate.return_value = [
            {
                'BackupPlansList': [
                    {
                        'BackupPlanId': 'plan-123',
                        'BackupPlanName': 'TestPlan',
                        'BackupPlanArn': 'arn:aws:backup:us-east-1:123456789012:plan:plan-123'
                    }
                ]
            }
        ]

        mock_backup.get_backup_plan.return_value = {
            'BackupPlan': {
                'BackupPlanName': 'TestPlan',
                'Rules': [
                    {
                        'RuleName': 'TestRule',
                        'TargetBackupVaultName': 'TestVault',
                        'Lifecycle': {'DeleteAfterDays': 30}
                    }
                ]
            }
        }

        # Mock selections
        mock_selections_paginator.paginate.return_value = [
            {
                'BackupSelectionsList': [
                    {
                        'SelectionId': 'sel-123',
                        'SelectionName': 'TestSelection'
                    }
                ]
            }
        ]

        mock_backup.get_backup_selection.return_value = {
            'BackupSelection': {
                'SelectionName': 'TestSelection',
                'Resources': ['arn:aws:ec2:us-east-1:123456789012:volume/vol-123']
            }
        }

        # Mock vaults
        mock_vaults_paginator.paginate.return_value = [
            {
                'BackupVaultList': [
                    {
                        'BackupVaultName': 'TestVault',
                        'BackupVaultArn': 'arn:aws:backup:us-east-1:123456789012:vault:TestVault',
                        'CreationDate': datetime.now(timezone.utc)
                    }
                ]
            }
        ]

        # Mock recovery points
        mock_recovery_paginator.paginate.return_value = [
            {
                'RecoveryPoints': [
                    {
                        'RecoveryPointArn': 'arn:aws:backup:us-east-1:123456789012:recovery-point:rp-123',
                        'ResourceArn': 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123',
                        'CreationDate': datetime.now(timezone.utc),
                        'CompletionDate': datetime.now(timezone.utc),
                        'Status': 'COMPLETED',
                        'IsEncrypted': True,
                        'BackupSizeBytes': 1000000
                    }
                ]
            }
        ]

        # Mock backup jobs
        mock_jobs_paginator.paginate.return_value = [
            {
                'BackupJobs': [
                    {
                        'BackupJobId': 'job-123',
                        'ResourceArn': 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123',
                        'State': 'COMPLETED',
                        'CreationDate': datetime.now(timezone.utc),
                        'CompletionDate': datetime.now(timezone.utc),
                        'BackupVaultName': 'TestVault'
                    }
                ]
            }
        ]

        # Mock vault details
        mock_backup.describe_backup_vault.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException'}}, 'DescribeBackupVault'
        )
        mock_backup.get_backup_vault_notifications.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException'}}, 'GetBackupVaultNotifications'
        )

        auditor = AWSBackupAuditor(region='us-east-1')
        auditor._discover_backup_infrastructure()

        assert 'plan-123' in auditor.backup_plans
        assert 'TestVault' in auditor.backup_vaults
        assert len(auditor.recovery_points) > 0
        assert len(auditor.backup_jobs) > 0

    @patch('analyse.boto3.Session')
    def test_check_inadequate_retention_with_matching_resource(self, mock_session):
        """Test inadequate retention check with matching critical resource"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add critical resource
        resource_arn = 'arn:aws:rds:us-east-1:123456789012:db:critical-db'
        auditor.resources = {
            'critical-db': {
                'type': 'RDS',
                'arn': resource_arn,
                'tags': {'DataClassification': 'Critical'},
                'state': 'available'
            }
        }

        # Add backup plan with short retention covering this resource
        auditor.backup_plans = {
            'plan-short': {
                'name': 'ShortRetentionPlan',
                'details': {
                    'Rules': [
                        {
                            'RuleName': 'ShortRule',
                            'Lifecycle': {
                                'DeleteAfterDays': 5  # Less than 7 days
                            }
                        }
                    ]
                },
                'selections': [
                    {
                        'Resources': [resource_arn],
                        'Conditions': {}
                    }
                ]
            }
        }

        auditor._check_inadequate_retention()

        # Should find violation for critical data with short retention
        critical_findings = [f for f in auditor.findings if f.check_id == 'AWS-BACKUP-003']
        assert len(critical_findings) > 0

    @patch('analyse.boto3.Session')
    def test_cross_region_copy_detection(self, mock_session):
        """Test cross-region DR check with copy rules"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Plan with cross-region copy
        auditor.backup_plans = {
            'plan-with-dr': {
                'name': 'DRPlan',
                'details': {
                    'Rules': [
                        {
                            'RuleName': 'DRRule',
                            'CopyActions': [
                                {
                                    'DestinationBackupVaultArn': 'arn:aws:backup:us-west-2:123456789012:backup-vault:VaultWest',
                                    'Lifecycle': {'DeleteAfterDays': 90}
                                }
                            ]
                        }
                    ]
                },
                'selections': []
            }
        }

        auditor._check_cross_region_dr()

        # Should NOT find violations since there's cross-region copy
        dr_findings = [f for f in auditor.findings if f.check_id == 'AWS-BACKUP-005']
        assert len(dr_findings) == 0

    @patch('analyse.boto3.Session')
    def test_recovery_analysis_with_no_points(self, mock_session):
        """Test recovery analysis generation with no recovery points"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Resources but no recovery points
        auditor.resources = {
            'vol-123': {
                'type': 'EBS',
                'arn': 'arn:aws:ec2:us-east-1:123456789012:volume/vol-123',
                'tags': {}
            }
        }
        auditor.recovery_points = {}
        auditor.backup_jobs = {}

        analysis = auditor._generate_recovery_analysis()

        # Should return empty analysis
        assert isinstance(analysis, list)
        assert len(analysis) == 0

    @patch('analyse.boto3.Session')
    def test_matches_selection_conditions_with_empty_conditions(self, mock_session):
        """Test selection condition matching with empty conditions"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_info = {
            'tags': {'Environment': 'production'}
        }

        # Empty conditions should match
        conditions = {}
        assert auditor._matches_selection_conditions(resource_info, conditions) is True

        # Conditions with empty StringEquals
        conditions = {'StringEquals': []}
        assert auditor._matches_selection_conditions(resource_info, conditions) is True

    @patch('analyse.boto3.Session')
    def test_get_client_config_without_endpoint(self, mock_session):
        """Test client config without endpoint URL"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        with patch.dict(os.environ, {}, clear=True):
            auditor = AWSBackupAuditor(region='us-east-1')
            config = auditor._get_client_config()

            # Should return empty dict when no endpoint URL
            assert config == {}

    @patch('analyse.boto3.Session')
    def test_generate_recovery_analysis_with_single_point(self, mock_session):
        """Test recovery analysis with only one recovery point"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:instance/i-123'
        auditor.resources = {
            'i-123': {
                'type': 'EC2',
                'arn': resource_arn,
                'tags': {}
            }
        }

        # Single recovery point (no gaps to calculate)
        now = datetime.now(timezone.utc)
        auditor.recovery_points = {
            resource_arn: [
                {
                    'creation_date': now,
                    'status': 'COMPLETED'
                }
            ]
        }

        auditor.backup_jobs = {}

        analysis = auditor._generate_recovery_analysis()

        assert len(analysis) == 1
        assert analysis[0]['recovery_point_count'] == 1
        assert analysis[0]['gaps_hours'] == []
        assert analysis[0]['max_gap_hours'] == 0

    @patch('analyse.boto3.Session')
    def test_check_restore_testing_with_completed_restore(self, mock_session):
        """Test restore testing check with completed restore jobs"""
        from datetime import timedelta

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-tested'
        auditor.resources = {
            'vol-tested': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {},
                'state': 'available'
            }
        }

        # Mock restore jobs with completed test
        start_date = datetime.now(timezone.utc) - timedelta(days=90)
        auditor.backup_client.get_paginator = MagicMock()
        mock_paginator = MagicMock()
        auditor.backup_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'RestoreJobs': [
                    {
                        'RestoreJobId': 'restore-123',
                        'ResourceArn': resource_arn,
                        'Status': 'COMPLETED',
                        'CreationDate': datetime.now(timezone.utc) - timedelta(days=30)
                    }
                ]
            }
        ]

        # Add resource to protected resources
        auditor.backup_plans = {
            'plan-123': {
                'selections': [{'Resources': [resource_arn]}]
            }
        }

        auditor._check_restore_testing()

        # Should NOT find violations since restore was tested
        restore_findings = [f for f in auditor.findings if f.check_id == 'AWS-BACKUP-010']
        assert len(restore_findings) == 0

    @patch('analyse.boto3.Session')
    def test_protected_resources_with_conditions(self, mock_session):
        """Test get_protected_resources with tag-based conditions"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add resources with tags
        auditor.resources = {
            'vol-prod': {
                'type': 'EBS',
                'arn': 'arn:aws:ec2:us-east-1:123456789012:volume/vol-prod',
                'tags': {'Environment': 'production', 'BackupEnabled': 'true'}
            },
            'vol-dev': {
                'type': 'EBS',
                'arn': 'arn:aws:ec2:us-east-1:123456789012:volume/vol-dev',
                'tags': {'Environment': 'development'}
            }
        }

        # Add backup plan with tag-based selection
        auditor.backup_plans = {
            'plan-tag-based': {
                'selections': [
                    {
                        'Resources': [],
                        'Conditions': {
                            'StringEquals': [
                                {
                                    'ConditionKey': 'aws:ResourceTag/Environment',
                                    'ConditionValue': 'production'
                                }
                            ]
                        }
                    }
                ]
            }
        }

        protected = auditor._get_protected_resources()

        # Should include vol-prod but not vol-dev
        assert 'arn:aws:ec2:us-east-1:123456789012:volume/vol-prod' in protected
        assert 'arn:aws:ec2:us-east-1:123456789012:volume/vol-dev' not in protected

    @patch('analyse.boto3.Session')
    def test_recovery_analysis_with_failed_jobs(self, mock_session):
        """Test recovery analysis with failed backup jobs"""
        from datetime import timedelta

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-fail'
        auditor.resources = {
            'vol-fail': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {}
            }
        }

        # Add recovery points
        now = datetime.now(timezone.utc)
        auditor.recovery_points = {
            resource_arn: [
                {
                    'creation_date': now - timedelta(hours=24),
                    'status': 'COMPLETED'
                },
                {
                    'creation_date': now,
                    'status': 'COMPLETED'
                }
            ]
        }

        # Add backup jobs with failures
        auditor.backup_jobs = {
            resource_arn: [
                {'state': 'FAILED', 'creation_date': now - timedelta(hours=48)},
                {'state': 'FAILED', 'creation_date': now - timedelta(hours=36)},
                {'state': 'COMPLETED', 'creation_date': now - timedelta(hours=24)},
                {'state': 'COMPLETED', 'creation_date': now}
            ]
        }

        analysis = auditor._generate_recovery_analysis()

        assert len(analysis) == 1
        assert analysis[0]['consecutive_failures'] == 2
        assert analysis[0]['recovery_point_count'] == 2

    @patch('analyse.boto3.Session')
    @patch('builtins.open', new_callable=mock_open)
    def test_save_csv_with_multiple_resources(self, mock_file_open, mock_session):
        """Test CSV report generation with multiple resources and complete data"""
        from datetime import timedelta
        import csv

        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Add multiple resources
        now = datetime.now(timezone.utc)
        resource1_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-1'
        resource2_arn = 'arn:aws:ec2:us-east-1:123456789012:instance/i-1'

        auditor.resources = {
            'vol-1': {
                'type': 'EBS',
                'arn': resource1_arn,
                'tags': {}
            },
            'i-1': {
                'type': 'EC2',
                'arn': resource2_arn,
                'tags': {}
            }
        }

        # Add recovery points for both
        auditor.recovery_points = {
            resource1_arn: [
                {'creation_date': now - timedelta(hours=24), 'status': 'COMPLETED'},
                {'creation_date': now, 'status': 'COMPLETED'}
            ],
            resource2_arn: [
                {'creation_date': now - timedelta(hours=48), 'status': 'COMPLETED'},
                {'creation_date': now - timedelta(hours=24), 'status': 'COMPLETED'},
                {'creation_date': now, 'status': 'COMPLETED'}
            ]
        }

        # Add backup jobs
        auditor.backup_jobs = {
            resource1_arn: [
                {'state': 'COMPLETED', 'creation_date': now - timedelta(hours=24)},
                {'state': 'COMPLETED', 'creation_date': now}
            ],
            resource2_arn: [
                {'state': 'COMPLETED', 'creation_date': now - timedelta(hours=48)},
                {'state': 'COMPLETED', 'creation_date': now - timedelta(hours=24)},
                {'state': 'COMPLETED', 'creation_date': now}
            ]
        }

        auditor._save_csv_report()

        # Verify file operations
        assert mock_file_open.called

    @patch('analyse.boto3.Session')
    def test_inadequate_retention_edge_case(self, mock_session):
        """Test inadequate retention with no lifecycle"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-critical'
        auditor.resources = {
            'vol-critical': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {'DataClassification': 'Critical'}
            }
        }

        # Plan with rule that has NO lifecycle at all
        auditor.backup_plans = {
            'plan-no-lifecycle': {
                'name': 'NoLifecyclePlan',
                'details': {
                    'Rules': [
                        {
                            'RuleName': 'NoLifecycleRule'
                            # No Lifecycle key at all
                        }
                    ]
                },
                'selections': [
                    {
                        'Resources': [resource_arn]
                    }
                ]
            }
        }

        auditor._check_inadequate_retention()

        # Should not crash with missing Lifecycle

    @patch('analyse.boto3.Session')
    def test_discovery_with_missing_tags(self, mock_session):
        """Test resource discovery with missing tag data"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Mock RDS with missing tags (ClientError)
        auditor.rds_client.list_tags_for_resource.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}}, 'ListTagsForResource'
        )

        tags = auditor._get_rds_tags('arn:aws:rds:us-east-1:123456789012:db:test')
        assert tags == {}

        # Mock EFS with missing tags
        auditor.efs_client.describe_tags.side_effect = ClientError(
            {'Error': {'Code': 'FileSystemNotFound'}}, 'DescribeTags'
        )

        tags = auditor._get_efs_tags('fs-12345')
        assert tags == {}

        # Mock DynamoDB with missing tags
        auditor.dynamodb_client.list_tags_of_resource.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException'}}, 'ListTagsOfResource'
        )

        tags = auditor._get_dynamodb_tags('arn:aws:dynamodb:us-east-1:123456789012:table/Test')
        assert tags == {}

    @patch('analyse.boto3.Session')
    def test_recovery_point_with_missing_creation_date(self, mock_session):
        """Test recovery point analysis with missing creation dates"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        resource_arn = 'arn:aws:ec2:us-east-1:123456789012:volume/vol-incomplete'
        auditor.resources = {
            'vol-incomplete': {
                'type': 'EBS',
                'arn': resource_arn,
                'tags': {}
            }
        }

        # Recovery points with missing creation_date
        auditor.recovery_points = {
            resource_arn: [
                {'status': 'COMPLETED'},  # Missing creation_date
                {'creation_date': datetime.now(timezone.utc), 'status': 'COMPLETED'}
            ]
        }

        auditor.backup_jobs = {}

        analysis = auditor._generate_recovery_analysis()

        # Should handle missing dates gracefully
        assert len(analysis) == 1

    @patch('analyse.boto3.Session')
    def test_cost_efficiency_with_lifecycle(self, mock_session):
        """Test cost efficiency check with proper lifecycle"""
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        auditor = AWSBackupAuditor(region='us-east-1')

        # Plan WITH lifecycle cold storage
        auditor.backup_plans = {
            'plan-with-lifecycle': {
                'name': 'EfficientPlan',
                'details': {
                    'Rules': [
                        {
                            'RuleName': 'EfficientRule',
                            'Lifecycle': {
                                'DeleteAfterDays': 365,
                                'MoveToColdStorageAfterDays': 30
                            }
                        }
                    ]
                },
                'selections': []
            }
        }

        auditor._check_cost_inefficiency()

        # Should NOT find violations
        cost_findings = [f for f in auditor.findings if f.check_id == 'AWS-BACKUP-012']
        assert len(cost_findings) == 0

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('sys.argv', ['analyse.py', '--region', 'us-east-1'])
    @patch('analyse.AWSBackupAuditor')
    def test_main_function_success(self, mock_auditor_class):
        """Test main function executes successfully"""
        from analyse import main

        # Mock auditor
        mock_auditor_instance = MagicMock()
        mock_auditor_class.return_value = mock_auditor_instance
        mock_auditor_instance.run_audit.return_value = {'test': 'data'}

        # Run main
        main()

        # Verify auditor was created and run
        mock_auditor_class.assert_called_once()
        mock_auditor_instance.run_audit.assert_called_once()

    @patch('sys.argv', ['analyse.py'])
    @patch('analyse.AWSBackupAuditor')
    def test_main_function_handles_keyboard_interrupt(self, mock_auditor_class):
        """Test main function handles KeyboardInterrupt"""
        from analyse import main

        # Mock auditor to raise KeyboardInterrupt
        mock_auditor_instance = MagicMock()
        mock_auditor_class.return_value = mock_auditor_instance
        mock_auditor_instance.run_audit.side_effect = KeyboardInterrupt()

        # Run main - should exit with code 1
        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('sys.argv', ['analyse.py'])
    @patch('analyse.AWSBackupAuditor')
    def test_main_function_handles_exception(self, mock_auditor_class):
        """Test main function handles general exceptions"""
        from analyse import main

        # Mock auditor to raise exception
        mock_auditor_instance = MagicMock()
        mock_auditor_class.return_value = mock_auditor_instance
        mock_auditor_instance.run_audit.side_effect = Exception("Test error")

        # Run main - should exit with code 1
        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1


if __name__ == "__main__":
    print("\n" + "="*80)
    print("AWS BACKUP COMPLIANCE AUDIT - UNIT TEST SUITE")
    print("="*80 + "\n")

    # Run all tests
    pytest.main([__file__, "-v", "--tb=short"])
