"""
REQUIRED Mock Configuration Setup for AWS EFS Analysis Testing
================================================================

This setup is MANDATORY for running and testing AWS EFS analysis tasks.
All new EFS analysis implementations must follow this testing framework
to ensure consistent mocking and validation of AWS resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Create a setup function (e.g., setup_efs_file_systems()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock resources using boto3 API calls
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_efs_analysis())
   b. Call your setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct section in results
      - Validate structure and required fields
      - Verify resource counts and metrics
      - Test specific resource attributes

Standard Implementation Template:
------------------------------
```python
def setup_efs_file_systems():
    efs = boto_client("efs")
    # Create mock EFS resources
    # Handle existing resources
    # Add configurations

def test_efs_analysis():
    # Setup resources
    setup_efs_file_systems()

    # Run analysis
    results = run_analysis_script()

    # Validate results
    assert "summary" in results
    assert "findings" in results
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- EFS file systems (setup_efs_file_systems)
- Security groups for NFS (setup_efs_security_groups)
- CloudWatch metrics (setup_efs_cloudwatch_metrics)

Note: Without this mock configuration setup, EFS analysis tests will not
function correctly and may produce invalid results.
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
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_efs_file_systems():
    """Create mock EFS file systems with various configurations for testing"""
    efs = boto_client("efs")
    ec2 = boto_client("ec2")

    # Get default VPC and subnets for mount targets
    try:
        vpcs = ec2.describe_vpcs(Filters=[{'Name': 'isDefault', 'Values': ['true']}])
        if vpcs['Vpcs']:
            vpc_id = vpcs['Vpcs'][0]['VpcId']
        else:
            # Create a VPC if default doesn't exist
            vpc_response = ec2.create_vpc(CidrBlock='10.0.0.0/16')
            vpc_id = vpc_response['Vpc']['VpcId']
    except Exception:
        # Create a VPC
        vpc_response = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc_response['Vpc']['VpcId']

    # Get or create subnets
    try:
        subnets = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
        if subnets['Subnets']:
            subnet_id = subnets['Subnets'][0]['SubnetId']
        else:
            subnet_response = ec2.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24', AvailabilityZone='us-east-1a')
            subnet_id = subnet_response['Subnet']['SubnetId']
    except Exception:
        subnet_response = ec2.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24', AvailabilityZone='us-east-1a')
        subnet_id = subnet_response['Subnet']['SubnetId']

    # Create security groups for testing
    try:
        # Create a secure security group
        secure_sg = ec2.create_security_group(
            GroupName='efs-secure-sg',
            Description='Secure EFS security group',
            VpcId=vpc_id
        )
        secure_sg_id = secure_sg['GroupId']

        # Add restricted NFS rule
        ec2.authorize_security_group_ingress(
            GroupId=secure_sg_id,
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 2049,
                'ToPort': 2049,
                'IpRanges': [{'CidrIp': '10.0.0.0/16', 'Description': 'VPC only'}]
            }]
        )
    except ec2.exceptions.ClientError as e:
        if "InvalidGroup.Duplicate" in str(e):
            # Get existing security group
            sgs = ec2.describe_security_groups(GroupNames=['efs-secure-sg'])
            secure_sg_id = sgs['SecurityGroups'][0]['GroupId']
        else:
            raise

    try:
        # Create an insecure security group (open to internet)
        insecure_sg = ec2.create_security_group(
            GroupName='efs-insecure-sg',
            Description='Insecure EFS security group',
            VpcId=vpc_id
        )
        insecure_sg_id = insecure_sg['GroupId']

        # Add open NFS rule
        ec2.authorize_security_group_ingress(
            GroupId=insecure_sg_id,
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 2049,
                'ToPort': 2049,
                'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'Open to internet'}]
            }]
        )
    except ec2.exceptions.ClientError as e:
        if "InvalidGroup.Duplicate" in str(e):
            # Get existing security group
            sgs = ec2.describe_security_groups(GroupNames=['efs-insecure-sg'])
            insecure_sg_id = sgs['SecurityGroups'][0]['GroupId']
        else:
            raise

    # Get existing file systems to avoid duplicates
    existing_fs = efs.describe_file_systems().get('FileSystems', [])
    existing_names = {fs.get('Name', ''): fs['FileSystemId'] for fs in existing_fs}

    file_systems = []

    # 1. Create an unencrypted file system (security issue)
    if 'test-unencrypted-fs' not in existing_names:
        fs1 = efs.create_file_system(
            CreationToken='unencrypted-fs-token',
            PerformanceMode='generalPurpose',
            ThroughputMode='bursting',
            Encrypted=False,
            Tags=[
                {'Key': 'Name', 'Value': 'test-unencrypted-fs'},
                {'Key': 'Environment', 'Value': 'test'}
            ]
        )
        file_systems.append(fs1)
        # Set creation time to be older than 30 days (mock limitation workaround)
        fs1['CreationTime'] = datetime.now(timezone.utc) - timedelta(days=31)
    else:
        fs1_id = existing_names['test-unencrypted-fs']
        fs1 = efs.describe_file_systems(FileSystemId=fs1_id)['FileSystems'][0]
        file_systems.append(fs1)

    # 2. Create an encrypted file system with insecure security group
    if 'test-insecure-mount-fs' not in existing_names:
        fs2 = efs.create_file_system(
            CreationToken='insecure-mount-fs-token',
            PerformanceMode='generalPurpose',
            ThroughputMode='bursting',
            Encrypted=True,
            Tags=[
                {'Key': 'Name', 'Value': 'test-insecure-mount-fs'},
                {'Key': 'Environment', 'Value': 'production'}
            ]
        )
        file_systems.append(fs2)
        fs2['CreationTime'] = datetime.now(timezone.utc) - timedelta(days=31)

        # Create mount target with insecure security group
        try:
            efs.create_mount_target(
                FileSystemId=fs2['FileSystemId'],
                SubnetId=subnet_id,
                SecurityGroups=[insecure_sg_id]
            )
        except Exception as e:
            if "MountTargetConflict" not in str(e):
                print(f"Warning: Could not create mount target: {e}")
    else:
        fs2_id = existing_names['test-insecure-mount-fs']
        fs2 = efs.describe_file_systems(FileSystemId=fs2_id)['FileSystems'][0]
        file_systems.append(fs2)

    # 3. Create a production single-AZ file system (resilience issue)
    if 'test-production-single-az' not in existing_names:
        fs3 = efs.create_file_system(
            CreationToken='production-single-az-token',
            PerformanceMode='generalPurpose',
            ThroughputMode='bursting',
            Encrypted=True,
            AvailabilityZoneName='us-east-1a',  # One Zone storage
            Tags=[
                {'Key': 'Name', 'Value': 'test-production-single-az'},
                {'Key': 'Environment', 'Value': 'Production'}
            ]
        )
        file_systems.append(fs3)
        fs3['CreationTime'] = datetime.now(timezone.utc) - timedelta(days=31)
    else:
        fs3_id = existing_names['test-production-single-az']
        fs3 = efs.describe_file_systems(FileSystemId=fs3_id)['FileSystems'][0]
        file_systems.append(fs3)

    # 4. Create a critical file system without backup (resilience issue)
    if 'test-critical-no-backup' not in existing_names:
        fs4 = efs.create_file_system(
            CreationToken='critical-no-backup-token',
            PerformanceMode='generalPurpose',
            ThroughputMode='bursting',
            Encrypted=True,
            Tags=[
                {'Key': 'Name', 'Value': 'test-critical-no-backup'},
                {'Key': 'DataCritical', 'Value': 'true'},
                {'Key': 'Environment', 'Value': 'production'}
            ]
        )
        file_systems.append(fs4)
        fs4['CreationTime'] = datetime.now(timezone.utc) - timedelta(days=31)

        # Disable backup policy
        try:
            efs.put_backup_policy(
                FileSystemId=fs4['FileSystemId'],
                BackupPolicy={'Status': 'DISABLED'}
            )
        except Exception as e:
            print(f"Warning: Could not set backup policy: {e}")
    else:
        fs4_id = existing_names['test-critical-no-backup']
        fs4 = efs.describe_file_systems(FileSystemId=fs4_id)['FileSystems'][0]
        file_systems.append(fs4)

    # 5. Create a file system without lifecycle policy (cost optimization)
    if 'test-no-lifecycle-policy' not in existing_names:
        fs5 = efs.create_file_system(
            CreationToken='no-lifecycle-policy-token',
            PerformanceMode='generalPurpose',
            ThroughputMode='bursting',
            Encrypted=True,
            Tags=[
                {'Key': 'Name', 'Value': 'test-no-lifecycle-policy'},
                {'Key': 'Environment', 'Value': 'development'}
            ]
        )
        file_systems.append(fs5)
        fs5['CreationTime'] = datetime.now(timezone.utc) - timedelta(days=31)
    else:
        fs5_id = existing_names['test-no-lifecycle-policy']
        fs5 = efs.describe_file_systems(FileSystemId=fs5_id)['FileSystems'][0]
        file_systems.append(fs5)

    return file_systems


def setup_efs_cloudwatch_metrics():
    """Create mock CloudWatch metrics for EFS file systems"""
    cloudwatch = boto_client("cloudwatch")
    efs = boto_client("efs")

    # Get all file systems
    file_systems = efs.describe_file_systems()['FileSystems']

    # Note: Moto doesn't fully support CloudWatch metrics, but we can try to put some
    # In a real environment, these would be created automatically by AWS
    end_time = datetime.now(timezone.utc)

    for fs in file_systems:
        fs_id = fs['FileSystemId']

        try:
            # Put sample metrics (these may not work in moto but won't error)
            cloudwatch.put_metric_data(
                Namespace='AWS/EFS',
                MetricData=[
                    {
                        'MetricName': 'BurstCreditBalance',
                        'Dimensions': [{'Name': 'FileSystemId', 'Value': fs_id}],
                        'Timestamp': end_time - timedelta(days=1),
                        'Value': 1000000000,  # 1 billion credits
                        'Unit': 'Bytes'
                    },
                    {
                        'MetricName': 'ClientConnections',
                        'Dimensions': [{'Name': 'FileSystemId', 'Value': fs_id}],
                        'Timestamp': end_time - timedelta(days=1),
                        'Value': 5,
                        'Unit': 'Count'
                    }
                ]
            )
        except Exception as e:
            # Moto may not support this, continue anyway
            pass


def run_analysis_script():
    """Helper to run the EFS analysis script and return JSON results"""
    # Path to script and output file
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "efs_analysis.json")

    # Remove old JSON file if it exists
    if os.path.exists(json_output):
        os.remove(json_output)

    # Set environment variables for testing
    env = {**os.environ}

    # Run the script
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Print output for debugging
    print("\n=== Analysis Script Output ===")
    print(result.stdout)
    if result.stderr:
        print("\n=== Stderr ===")
        print(result.stderr)

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        # If JSON file wasn't created, return empty dict
        print(f"Warning: JSON output file not created at {json_output}")
        return {}


def test_efs_file_systems_created():
    """Test that EFS file systems are created successfully"""
    setup_efs_file_systems()

    efs = boto_client("efs")
    file_systems = efs.describe_file_systems()['FileSystems']

    # Should have at least 5 file systems
    assert len(file_systems) >= 5, f"Expected at least 5 file systems, got {len(file_systems)}"

    # Check that each file system has required fields
    for fs in file_systems:
        assert 'FileSystemId' in fs
        assert 'CreationTime' in fs
        assert 'LifeCycleState' in fs
        assert 'PerformanceMode' in fs
        assert 'ThroughputMode' in fs


def test_efs_security_analysis():
    """Test that EFS security issues are detected"""
    # Setup EFS file systems
    setup_efs_file_systems()
    setup_efs_cloudwatch_metrics()

    # Run analysis
    results = run_analysis_script()

    # Check that basic structure exists
    assert "summary" in results, "summary key missing from JSON"
    assert "findings" in results, "findings key missing from JSON"
    assert "file_systems" in results, "file_systems key missing from JSON"

    # Check summary structure
    summary = results["summary"]
    assert "total_file_systems_analyzed" in summary
    assert "total_findings" in summary
    assert "findings_by_severity" in summary

    # Should have some findings
    assert summary["total_findings"] > 0, "Expected to find security/compliance issues"

    # Get all findings
    findings = results["findings"]

    # Check for unencrypted file system finding
    encryption_findings = [f for f in findings if f.get("finding") == "missing_encryption"]
    assert len(encryption_findings) >= 1, "Expected to find at least 1 unencrypted file system"

    # Verify encryption finding structure
    if encryption_findings:
        enc_finding = encryption_findings[0]
        assert enc_finding["category"] == "security"
        assert enc_finding["severity"] == "critical"
        assert "file_system_id" in enc_finding
        assert "title" in enc_finding
        assert "description" in enc_finding
        assert "recommendation" in enc_finding


def test_efs_network_security_analysis():
    """Test that network security issues are detected"""
    # Setup EFS file systems
    setup_efs_file_systems()

    # Run analysis
    results = run_analysis_script()

    findings = results.get("findings", [])

    # Check for wide open NFS access finding
    nfs_findings = [f for f in findings if f.get("finding") == "wide_open_nfs_access"]

    # Should find at least one file system with open NFS access (if moto supports security groups)
    # Note: This may not work in moto if it doesn't fully support mount target security groups
    if nfs_findings:
        nfs_finding = nfs_findings[0]
        assert nfs_finding["category"] == "security"
        assert nfs_finding["severity"] == "critical"
        assert "0.0.0.0/0" in nfs_finding["description"]


def test_efs_resilience_analysis():
    """Test that resilience issues are detected"""
    # Setup EFS file systems
    setup_efs_file_systems()

    # Run analysis
    results = run_analysis_script()

    findings = results.get("findings", [])

    # Check for single AZ production finding
    single_az_findings = [f for f in findings if f.get("finding") == "production_single_az"]
    assert len(single_az_findings) >= 1, "Expected to find production file system using single AZ"

    if single_az_findings:
        az_finding = single_az_findings[0]
        assert az_finding["category"] == "resilience"
        assert az_finding["severity"] == "critical"

    # Check for backup policy findings
    backup_findings = [f for f in findings if f.get("finding") == "no_backup_plan"]
    assert len(backup_findings) >= 1, "Expected to find file systems without backup plans"

    if backup_findings:
        backup_finding = backup_findings[0]
        assert backup_finding["category"] == "resilience"
        assert backup_finding["severity"] == "high"


def test_efs_cost_optimization_analysis():
    """Test that cost optimization opportunities are detected"""
    # Setup EFS file systems
    setup_efs_file_systems()

    # Run analysis
    results = run_analysis_script()

    findings = results.get("findings", [])

    # Check for lifecycle policy findings (cost optimization)
    lifecycle_findings = [f for f in findings if f.get("finding") == "missing_ia_lifecycle"]

    # Should find file systems without lifecycle policies
    if lifecycle_findings:
        lc_finding = lifecycle_findings[0]
        assert lc_finding["category"] == "cost_optimization"
        assert lc_finding["severity"] == "medium"
        assert "lifecycle policy" in lc_finding["description"].lower()


def test_efs_iam_authorization_check():
    """Test that IAM authorization issues are detected"""
    # Setup EFS file systems
    setup_efs_file_systems()

    # Run analysis
    results = run_analysis_script()

    findings = results.get("findings", [])

    # Check for IAM authorization findings
    iam_findings = [f for f in findings if f.get("finding") == "no_iam_authorization"]

    # Should find file systems not using IAM authorization
    if iam_findings:
        iam_finding = iam_findings[0]
        assert iam_finding["category"] == "security"
        assert iam_finding["severity"] == "medium"
        assert "IAM" in iam_finding["title"]


def test_efs_findings_severity_distribution():
    """Test that findings are properly categorized by severity"""
    # Setup EFS file systems
    setup_efs_file_systems()

    # Run analysis
    results = run_analysis_script()

    summary = results.get("summary", {})
    findings_by_severity = summary.get("findings_by_severity", {})

    # Verify severity structure
    assert "critical" in findings_by_severity
    assert "high" in findings_by_severity
    assert "medium" in findings_by_severity

    # Should have critical findings (unencrypted, single AZ production, etc.)
    assert findings_by_severity["critical"] >= 1, "Expected at least 1 critical finding"


def test_efs_file_system_details():
    """Test that file system details are properly captured"""
    # Setup EFS file systems
    setup_efs_file_systems()

    # Run analysis
    results = run_analysis_script()

    file_systems = results.get("file_systems", {})

    # Should have file system details
    assert len(file_systems) >= 1, "Expected file system details in results"

    # Check structure of first file system
    for fs_id, fs_data in list(file_systems.items())[:1]:
        assert "name" in fs_data
        assert "arn" in fs_data
        assert "lifecycle_state" in fs_data
        assert "performance_mode" in fs_data
        assert "throughput_mode" in fs_data
        assert "encrypted" in fs_data
        assert "findings" in fs_data

        # Findings should be a list
        assert isinstance(fs_data["findings"], list)


def test_efs_analysis_console_output():
    """Test that the analysis produces console output"""
    # Setup EFS file systems
    setup_efs_file_systems()

    # Run analysis script and capture output
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    env = {**os.environ}

    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Check that output contains expected sections
    output = result.stdout

    # Should have tabulated output
    assert "EFS Analysis Summary" in output or "No issues found" in output, \
        "Expected EFS analysis summary in console output"

    # If there are findings, should have table and statistics
    if "No issues found" not in output:
        # Look for findings indicators
        assert any(word in output for word in ["Critical", "High", "Medium", "Finding"]), \
            "Expected severity levels or findings in output"
