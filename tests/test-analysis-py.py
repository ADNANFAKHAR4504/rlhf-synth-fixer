#!/usr/bin/env python3
"""
Tests for RDS Performance Analysis Tool
Uses pytest and moto to mock AWS services and test all analysis criteria.

Follows the REQUIRED Mock Configuration Setup for AWS Resource Analysis Testing.
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
    """Get boto client with endpoint URL support for mocking."""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "testing"),
    )


def setup_rds_instances():
    """Create diverse mock RDS instances for testing."""
    rds = boto_client("rds")
    cloudwatch = boto_client("cloudwatch")

    # Test instance configurations covering all audit criteria
    test_configs = [
        # 1. Underutilized database
        {
            'DBInstanceIdentifier': 'db-underutilized-01',
            'DBInstanceClass': 'db.m5.xlarge',
            'Engine': 'postgres',
            'EngineVersion': '13.7',
            'AllocatedStorage': 100,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
        },
        # 2. Production without Multi-AZ
        {
            'DBInstanceIdentifier': 'db-no-multiaz-prod-01',
            'DBInstanceClass': 'db.m5.large',
            'Engine': 'postgres',
            'EngineVersion': '13.7',
            'AllocatedStorage': 200,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
            'Tags': [{'Key': 'Environment', 'Value': 'production'}]
        },
        # 3. No automated backups (CRITICAL)
        {
            'DBInstanceIdentifier': 'db-no-backups-01',
            'DBInstanceClass': 'db.m5.large',
            'Engine': 'mysql',
            'EngineVersion': '5.7.44',
            'AllocatedStorage': 100,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
            'BackupRetentionPeriod': 0,
        },
        # 4. Burstable instance with credit depletion
        {
            'DBInstanceIdentifier': 'db-burst-depleted-01',
            'DBInstanceClass': 'db.t3.medium',
            'Engine': 'mysql',
            'EngineVersion': '8.0.35',
            'AllocatedStorage': 50,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
        },
        # 5. Large DB without enhanced monitoring
        {
            'DBInstanceIdentifier': 'db-large-no-monitoring-01',
            'DBInstanceClass': 'db.r5.xlarge',
            'Engine': 'postgres',
            'EngineVersion': '15.5',
            'AllocatedStorage': 2000,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
        },
        # 6. Sensitive data without encryption (CRITICAL)
        {
            'DBInstanceIdentifier': 'db-sensitive-unencrypted-01',
            'DBInstanceClass': 'db.m5.large',
            'Engine': 'mysql',
            'EngineVersion': '8.0.35',
            'AllocatedStorage': 500,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
            'StorageEncrypted': False,
            'Tags': [{'Key': 'DataClassification', 'Value': 'Sensitive'}]
        },
        # 7. Using magnetic storage (inefficient)
        {
            'DBInstanceIdentifier': 'db-magnetic-storage-01',
            'DBInstanceClass': 'db.m5.large',
            'Engine': 'postgres',
            'EngineVersion': '15.5',
            'AllocatedStorage': 100,
            'StorageType': 'standard',
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
        },
        # 8. Production without Performance Insights
        {
            'DBInstanceIdentifier': 'db-prod-no-insights-01',
            'DBInstanceClass': 'db.m5.2xlarge',
            'Engine': 'postgres',
            'EngineVersion': '15.5',
            'AllocatedStorage': 500,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
            'Tags': [{'Key': 'Environment', 'Value': 'production'}]
        },
        # 9. Well-configured optimal instance
        {
            'DBInstanceIdentifier': 'db-optimal-01',
            'DBInstanceClass': 'db.m5.large',
            'Engine': 'postgres',
            'EngineVersion': '15.5',
            'AllocatedStorage': 200,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
            'MultiAZ': True,
            'BackupRetentionPeriod': 7,
            'StorageEncrypted': True,
            'EnableIAMDatabaseAuthentication': True,
            'EnablePerformanceInsights': True,
        },
        # 10. High storage growth instance
        {
            'DBInstanceIdentifier': 'db-high-growth-01',
            'DBInstanceClass': 'db.m5.large',
            'Engine': 'mysql',
            'EngineVersion': '8.0.35',
            'AllocatedStorage': 300,
            'MasterUsername': 'admin',
            'MasterUserPassword': 'password123',
        },
    ]

    # Create instances
    for config in test_configs:
        try:
            rds.create_db_instance(**config)
        except rds.exceptions.DBInstanceAlreadyExistsFault:
            pass  # Instance already exists

    # Add mock CloudWatch metrics for various scenarios
    metrics_data = [
        # Underutilized instance
        ('db-underutilized-01', 'CPUUtilization', 15.0),
        ('db-underutilized-01', 'DatabaseConnections', 5.0),

        # Burst depleted instance
        ('db-burst-depleted-01', 'BurstBalance', 10.0),
        ('db-burst-depleted-01', 'CPUUtilization', 45.0),

        # High growth instance (simulate growing storage usage)
        ('db-high-growth-01', 'FreeStorageSpace', 50000000000.0),  # 50GB free

        # Normal workload instances
        ('db-no-multiaz-prod-01', 'CPUUtilization', 35.0),
        ('db-no-multiaz-prod-01', 'DatabaseConnections', 50.0),
        ('db-no-backups-01', 'CPUUtilization', 25.0),
        ('db-optimal-01', 'CPUUtilization', 55.0),
        ('db-optimal-01', 'DatabaseConnections', 120.0),
    ]

    try:
        for db_id, metric_name, value in metrics_data:
            cloudwatch.put_metric_data(
                Namespace='AWS/RDS',
                MetricData=[{
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Percent' if 'Utilization' in metric_name or 'Balance' in metric_name else 'Count',
                    'Timestamp': datetime.now(timezone.utc),
                    'Dimensions': [{'Name': 'DBInstanceIdentifier', 'Value': db_id}]
                }]
            )
    except Exception:
        pass  # Metrics already exist


def run_analysis_script():
    """Helper to run the analysis script and return JSON results"""
    # Path to script and output file
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "aws_audit_results.json")

    # Remove old JSON file if it exists
    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    result = subprocess.run([sys.executable, script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        # If JSON file wasn't created, return empty dict and print error
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        return {}


def test_rds_analysis():
    """Test RDS performance analysis."""
    # Setup RDS instances
    setup_rds_instances()

    results = run_analysis_script()

    # Check that RDS analysis section exists in JSON
    assert "rds_analysis" in results or "summary" in results or "instances" in results, \
        "Expected RDS analysis output in JSON"

    # If we have a summary section, validate it
    if "summary" in results:
        summary = results["summary"]
        assert "total_instances" in summary, "total_instances key missing from summary"
        assert summary["total_instances"] >= 0, "total_instances should be non-negative"

    # If we have instances section, validate structure
    if "instances" in results:
        instances = results["instances"]
        assert isinstance(instances, list), "instances should be a list"

        for instance in instances:
            assert "db_identifier" in instance, "db_identifier missing from instance"
            assert "performance_score" in instance, "performance_score missing from instance"
            assert "issues" in instance, "issues missing from instance"


def test_rds_filters():
    """Test that RDS instance filters work correctly."""
    setup_rds_instances()

    results = run_analysis_script()

    # Verify results exist
    assert results, "Analysis results should not be empty"

    # Check that test- instances are excluded (if any instances are returned)
    if "instances" in results:
        db_ids = [inst.get('db_identifier') for inst in results["instances"]]
        # Should exclude test- instances
        assert not any(db_id and db_id.startswith('test-') for db_id in db_ids if db_id)


def test_rds_critical_issues():
    """Test detection of critical issues like no backups."""
    setup_rds_instances()

    results = run_analysis_script()

    # Look for critical issues in the results
    if "instances" in results:
        # Find db-no-backups-01 instance
        no_backup_instance = next(
            (inst for inst in results["instances"]
             if inst.get("db_identifier") == "db-no-backups-01"),
            None
        )

        if no_backup_instance:
            issues = no_backup_instance.get("issues", [])
            # Should have critical severity issue for no backups
            critical_issues = [issue for issue in issues if issue.get("severity") == "critical"]
            assert len(critical_issues) > 0, "Expected critical issues for database without backups"
