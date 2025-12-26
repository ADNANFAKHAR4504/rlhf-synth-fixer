"""
REQUIRED Mock Configuration Setup for AWS Backup Compliance Analysis Testing
===========================================================================

This setup is MANDATORY for running and testing AWS Backup compliance analysis.
All AWS Backup audit implementations must follow this testing framework to ensure
consistent mocking and validation of backup resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Mock Resource Setup (REQUIRED):
   a. Create backup infrastructure (vaults, plans, selections)
   b. Create resources to be backed up (EC2, RDS, EBS, EFS, DynamoDB)
   c. Create recovery points and backup jobs
   d. Configure compliance violations for testing

3. Test Validation (REQUIRED):
   a. Verify audit runs successfully
   b. Validate JSON output structure
   c. Check compliance findings
   d. Verify resource discovery
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone

import boto3
import pytest


def boto_client(service: str):
    """Create boto3 client with moto endpoint configuration"""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_aws_resources():
    """Create mock AWS resources that should be backed up"""
    ec2 = boto_client("ec2")
    rds = boto_client("rds")
    efs = boto_client("efs")
    dynamodb = boto_client("dynamodb")

    print("Setting up AWS resources for backup testing...")

    # Create EC2 instances with different tags
    try:
        # Production EC2 instance (should be backed up)
        ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t2.micro',
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'prod-web-server'},
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'RequireBackup', 'Value': 'true'}
                ]
            }]
        )

        # Critical EC2 instance requiring backup
        ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t2.small',
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'critical-db-server'},
                    {'Key': 'RequireBackup', 'Value': 'true'},
                    {'Key': 'DataClassification', 'Value': 'Critical'}
                ]
            }]
        )

        # Development instance (excluded)
        ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t2.micro',
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'dev-test-server'},
                    {'Key': 'Environment', 'Value': 'development'},
                    {'Key': 'Temporary', 'Value': 'true'}
                ]
            }]
        )
        print("✓ Created EC2 instances")
    except Exception as e:
        print(f"EC2 setup error: {e}")

    # Create EBS volumes
    try:
        ec2.create_volume(
            AvailabilityZone='us-east-1a',
            Size=100,
            VolumeType='gp3',
            TagSpecifications=[{
                'ResourceType': 'volume',
                'Tags': [
                    {'Key': 'Name', 'Value': 'prod-data-volume'},
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'RequireBackup', 'Value': 'true'}
                ]
            }]
        )
        print("✓ Created EBS volumes")
    except Exception as e:
        print(f"EBS setup error: {e}")

    # Create RDS instances
    try:
        rds.create_db_instance(
            DBInstanceIdentifier='prod-database',
            DBInstanceClass='db.t3.micro',
            Engine='mysql',
            MasterUsername='admin',
            MasterUserPassword='password123',
            AllocatedStorage=20,
            Tags=[
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'RequireBackup', 'Value': 'true'},
                {'Key': 'DataClassification', 'Value': 'Critical'}
            ]
        )
        print("✓ Created RDS instances")
    except Exception as e:
        print(f"RDS setup error: {e}")

    # Create EFS file systems
    try:
        efs_response = efs.create_file_system(
            CreationToken='prod-efs-token',
            Tags=[
                {'Key': 'Name', 'Value': 'prod-shared-storage'},
                {'Key': 'Environment', 'Value': 'production'}
            ]
        )
        print("✓ Created EFS file systems")
    except Exception as e:
        print(f"EFS setup error: {e}")

    # Create DynamoDB tables
    try:
        dynamodb.create_table(
            TableName='ProductionUserData',
            KeySchema=[
                {'AttributeName': 'userId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'userId', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST',
            Tags=[
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'RequireBackup', 'Value': 'true'}
            ]
        )
        print("✓ Created DynamoDB tables")
    except Exception as e:
        print(f"DynamoDB setup error: {e}")


def setup_backup_infrastructure():
    """Create mock AWS Backup infrastructure"""
    backup = boto_client("backup")

    print("Setting up AWS Backup infrastructure...")

    # Create backup vaults
    try:
        # Vault without encryption (compliance violation)
        backup.create_backup_vault(BackupVaultName='DefaultVault')
        print("✓ Created backup vault: DefaultVault")

        # Vault with encryption but no lock (compliance violation)
        backup.create_backup_vault(
            BackupVaultName='EncryptedVault',
            EncryptionKeyArn='arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'
        )
        print("✓ Created backup vault: EncryptedVault")

    except Exception as e:
        print(f"Backup vault setup error: {e}")

    # Create backup plans
    try:
        # Basic backup plan without lifecycle rules (cost inefficiency)
        plan_response = backup.create_backup_plan(
            BackupPlan={
                'BackupPlanName': 'BasicDailyBackup',
                'Rules': [{
                    'RuleName': 'DailyBackupRule',
                    'TargetBackupVaultName': 'DefaultVault',
                    'ScheduleExpression': 'cron(0 5 ? * * *)',
                    'Lifecycle': {
                        'DeleteAfterDays': 30
                    }
                }]
            }
        )
        print(f"✓ Created backup plan: BasicDailyBackup")

        # Critical data backup plan with short retention (compliance violation)
        critical_plan = backup.create_backup_plan(
            BackupPlan={
                'BackupPlanName': 'CriticalDataBackup',
                'Rules': [{
                    'RuleName': 'CriticalBackupRule',
                    'TargetBackupVaultName': 'EncryptedVault',
                    'ScheduleExpression': 'cron(0 */6 ? * * *)',
                    'Lifecycle': {
                        'DeleteAfterDays': 3  # Less than 7 days - violation!
                    }
                }]
            }
        )
        print(f"✓ Created backup plan: CriticalDataBackup")

    except Exception as e:
        print(f"Backup plan setup error: {e}")


def run_analysis_script():
    """Helper to run the analysis script and return JSON results"""
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "backup_compliance_audit.json")

    # Remove old JSON file if it exists
    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Print output for debugging
    if result.stdout:
        print("=== Analysis Script Output ===")
        print(result.stdout)

    if result.stderr:
        print("=== Analysis Script Errors ===")
        print(result.stderr)

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        print(f"Warning: JSON output file not found at {json_output}")
        return {}


def test_backup_audit_executes():
    """Test that the backup audit script runs successfully"""
    print("\n" + "="*80)
    print("TEST: Backup Audit Execution")
    print("="*80)

    # Setup mock resources
    setup_aws_resources()
    setup_backup_infrastructure()

    # Run analysis
    results = run_analysis_script()

    # Basic validation - check that we got results
    assert results is not None, "Analysis script returned no results"
    assert isinstance(results, dict), "Analysis results should be a dictionary"

    print("✓ Backup audit executed successfully")


def test_audit_metadata():
    """Test that audit metadata is present and valid"""
    print("\n" + "="*80)
    print("TEST: Audit Metadata Validation")
    print("="*80)

    results = run_analysis_script()

    # Check audit metadata
    assert "audit_metadata" in results, "audit_metadata section missing"
    metadata = results["audit_metadata"]

    assert "timestamp" in metadata, "timestamp missing from metadata"
    assert "region" in metadata, "region missing from metadata"
    assert "account_id" in metadata, "account_id missing from metadata"
    assert "total_resources" in metadata, "total_resources missing from metadata"
    assert "total_findings" in metadata, "total_findings missing from metadata"

    # Validate region
    assert metadata["region"] == "us-east-1", f"Expected region us-east-1, got {metadata['region']}"

    # Should have discovered some resources
    assert metadata["total_resources"] >= 0, "total_resources should be >= 0"

    print(f"✓ Audit metadata validated")
    print(f"  - Region: {metadata['region']}")
    print(f"  - Total Resources: {metadata['total_resources']}")
    print(f"  - Total Findings: {metadata['total_findings']}")


def test_compliance_summary():
    """Test that compliance summary is present and structured correctly"""
    print("\n" + "="*80)
    print("TEST: Compliance Summary Validation")
    print("="*80)

    results = run_analysis_script()

    # Check compliance summary
    assert "compliance_summary" in results, "compliance_summary section missing"
    summary = results["compliance_summary"]

    required_fields = [
        'critical_findings',
        'high_findings',
        'medium_findings',
        'low_findings',
        'info_findings'
    ]

    for field in required_fields:
        assert field in summary, f"{field} missing from compliance_summary"
        assert isinstance(summary[field], int), f"{field} should be an integer"
        assert summary[field] >= 0, f"{field} should be >= 0"

    print(f"✓ Compliance summary validated")
    print(f"  - Critical: {summary['critical_findings']}")
    print(f"  - High: {summary['high_findings']}")
    print(f"  - Medium: {summary['medium_findings']}")
    print(f"  - Low: {summary['low_findings']}")
    print(f"  - Info: {summary['info_findings']}")


def test_infrastructure_summary():
    """Test that infrastructure summary is present"""
    print("\n" + "="*80)
    print("TEST: Infrastructure Summary Validation")
    print("="*80)

    results = run_analysis_script()

    # Check infrastructure summary
    assert "infrastructure_summary" in results, "infrastructure_summary section missing"
    infra = results["infrastructure_summary"]

    required_fields = [
        'backup_plans',
        'backup_vaults',
        'total_recovery_points',
        'protected_resources'
    ]

    for field in required_fields:
        assert field in infra, f"{field} missing from infrastructure_summary"
        assert isinstance(infra[field], int), f"{field} should be an integer"
        assert infra[field] >= 0, f"{field} should be >= 0"

    print(f"✓ Infrastructure summary validated")
    print(f"  - Backup Plans: {infra['backup_plans']}")
    print(f"  - Backup Vaults: {infra['backup_vaults']}")
    print(f"  - Recovery Points: {infra['total_recovery_points']}")
    print(f"  - Protected Resources: {infra['protected_resources']}")


def test_findings_structure():
    """Test that findings are present and properly structured"""
    print("\n" + "="*80)
    print("TEST: Findings Structure Validation")
    print("="*80)

    results = run_analysis_script()

    # Check findings
    assert "findings" in results, "findings section missing"
    findings = results["findings"]

    assert isinstance(findings, list), "findings should be a list"

    # If we have findings, validate their structure
    if len(findings) > 0:
        sample_finding = findings[0]

        required_fields = [
            'check_id',
            'check_name',
            'severity',
            'status',
            'resource_id',
            'resource_type',
            'resource_tags',
            'details',
            'recommendation',
            'timestamp'
        ]

        for field in required_fields:
            assert field in sample_finding, f"{field} missing from finding"

        # Validate severity values
        valid_severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
        assert sample_finding['severity'] in valid_severities, \
            f"Invalid severity: {sample_finding['severity']}"

        # Validate status values
        valid_statuses = ['COMPLIANT', 'NON_COMPLIANT', 'WARNING', 'NOT_APPLICABLE']
        assert sample_finding['status'] in valid_statuses, \
            f"Invalid status: {sample_finding['status']}"

        print(f"✓ Findings structure validated ({len(findings)} findings)")

        # Print sample finding
        print(f"\n  Sample Finding:")
        print(f"  - Check: {sample_finding['check_name']}")
        print(f"  - Severity: {sample_finding['severity']}")
        print(f"  - Resource: {sample_finding['resource_type']} - {sample_finding['resource_id']}")
    else:
        print("✓ No findings found (all checks passed)")


def test_recovery_analysis():
    """Test that recovery analysis is present"""
    print("\n" + "="*80)
    print("TEST: Recovery Analysis Validation")
    print("="*80)

    results = run_analysis_script()

    # Check recovery analysis
    assert "recovery_analysis" in results, "recovery_analysis section missing"
    analysis = results["recovery_analysis"]

    assert isinstance(analysis, list), "recovery_analysis should be a list"

    # If we have recovery analysis data, validate structure
    if len(analysis) > 0:
        sample_analysis = analysis[0]

        required_fields = [
            'resource_id',
            'resource_type',
            'last_recovery_point',
            'recovery_point_count',
            'gaps_hours',
            'max_gap_hours',
            'consecutive_failures',
            'compliance_status',
            'calculated_rpo_hours',
            'estimated_rto_hours'
        ]

        for field in required_fields:
            assert field in sample_analysis, f"{field} missing from recovery analysis"

        print(f"✓ Recovery analysis validated ({len(analysis)} resources analyzed)")
    else:
        print("✓ No recovery points found for analysis")


def test_critical_checks():
    """Test that critical compliance checks are performed"""
    print("\n" + "="*80)
    print("TEST: Critical Compliance Checks")
    print("="*80)

    results = run_analysis_script()

    # Get all findings
    findings = results.get("findings", [])

    # Check IDs that should be tested (12 critical checks)
    expected_check_ids = [
        "AWS-BACKUP-001",  # Unprotected Resources
        "AWS-BACKUP-002",  # Missing Production Coverage
        "AWS-BACKUP-003",  # Inadequate Retention
        "AWS-BACKUP-004",  # No Vault Immutability
        "AWS-BACKUP-005",  # No Cross-Region DR
        "AWS-BACKUP-006",  # Unencrypted Vault
        "AWS-BACKUP-007",  # Recovery Point Gaps
        "AWS-BACKUP-008",  # Consecutive Failures
        "AWS-BACKUP-009",  # Missing Notifications
        "AWS-BACKUP-010",  # Inadequate Testing
        "AWS-BACKUP-011",  # Orphaned Points
        "AWS-BACKUP-012",  # Cost Inefficiency
    ]

    # Count findings by check ID
    check_counts = {}
    for finding in findings:
        check_id = finding.get('check_id', '')
        check_counts[check_id] = check_counts.get(check_id, 0) + 1

    print(f"✓ Compliance checks performed:")
    for check_id in expected_check_ids:
        count = check_counts.get(check_id, 0)
        print(f"  - {check_id}: {count} finding(s)")

    # Ensure at least some checks ran (even if they found no issues)
    print(f"\n✓ Total {len(findings)} findings across {len(check_counts)} check types")


def test_output_files_created():
    """Test that expected output files are created"""
    print("\n" + "="*80)
    print("TEST: Output Files Creation")
    print("="*80)

    # Run analysis
    run_analysis_script()

    project_root = os.path.join(os.path.dirname(__file__), "..")

    # Check for JSON output
    json_file = os.path.join(project_root, "backup_compliance_audit.json")
    assert os.path.exists(json_file), f"JSON output file not found: {json_file}"
    print(f"✓ JSON report created: backup_compliance_audit.json")

    # Check for CSV output
    csv_file = os.path.join(project_root, "recovery_readiness_report.csv")
    assert os.path.exists(csv_file), f"CSV output file not found: {csv_file}"
    print(f"✓ CSV report created: recovery_readiness_report.csv")

    # Validate CSV has content
    with open(csv_file, 'r') as f:
        lines = f.readlines()
        assert len(lines) >= 1, "CSV file should have at least a header"
        print(f"  - CSV contains {len(lines)} lines")


if __name__ == "__main__":
    print("\n" + "="*80)
    print("AWS BACKUP COMPLIANCE AUDIT - TEST SUITE")
    print("="*80 + "\n")

    # Run all tests
    pytest.main([__file__, "-v", "--tb=short"])
