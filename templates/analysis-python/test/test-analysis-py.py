import os
import re
import subprocess
import sys
import time

import boto3
import pytest

ENDPOINT = "http://127.0.0.1:5000"
AWS_ENV = {
    "AWS_ACCESS_KEY_ID": "test",
    "AWS_SECRET_ACCESS_KEY": "test",
    "AWS_DEFAULT_REGION": "us-east-1",
    "AWS_ENDPOINT_URL": ENDPOINT,
}


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=ENDPOINT,
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )


def setup_ebs_volumes():
    ec2 = boto_client("ec2")
    # Create 3 unused volumes
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=1)
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=2)
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=3)


def setup_security_groups():
    ec2 = boto_client("ec2")
    # Create two groups, one with public ingress
    # Ensure idempotency by checking if groups exist
    existing_sgs = ec2.describe_security_groups(Filters=[
        {'Name': 'group-name', 'Values': ['private', 'public']}
    ])['SecurityGroups']
    
    private_sg_id = next((sg['GroupId'] for sg in existing_sgs if sg['GroupName'] == 'private'), None)
    public_sg_id = next((sg['GroupId'] for sg in existing_sgs if sg['GroupName'] == 'public'), None)

    if not private_sg_id:
        private_sg_id = ec2.create_security_group(GroupName="private", Description="no public")['GroupId']
    if not public_sg_id:
        public_sg_id = ec2.create_security_group(GroupName="public", Description="has public")['GroupId']

    # Authorize ingress for the public group if not already authorized
    try:
        ec2.authorize_security_group_ingress(
            GroupId=public_sg_id,
            IpPermissions=[
                {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ]
        )
    except ec2.exceptions.ClientError as e:
        if "InvalidPermission.Duplicate" not in str(e):
            raise


def setup_log_group_and_streams():
    logs = boto_client("logs")
    ts = int(time.time() * 1000)

    # Create log group and streams
    try:
        logs.create_log_group(logGroupName="/test-group")
    except logs.exceptions.ResourceAlreadyExistsException:
        pass # Group already exists

    logs.create_log_stream(logGroupName="/test-group", logStreamName="s1")
    logs.create_log_stream(logGroupName="/test-group", logStreamName="s2")

    # Put dummy events to grow storedBytes
    logs.put_log_events(
        logGroupName="/test-group",
        logStreamName="s1",
        logEvents=[{"timestamp": ts, "message": "x" + "x" * 100}]
    )
    logs.put_log_events(
        logGroupName="/test-group",
        logStreamName="s2",
        logEvents=[{"timestamp": ts, "message": "x" + "x" * 300}]
    )


def run_analysis_script():
    """Helper to run the analysis script and return output"""
    # Updated path: from test/ directory, go up one level and into lib/ directory
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    env = {**os.environ, **AWS_ENV}

    result = subprocess.run([sys.executable, script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    return result.stdout


def test_ebs_volumes_analysis():
    # Setup EBS volumes
    setup_ebs_volumes()
    
    output = run_analysis_script()
    
    # Check EBS volumes section exists and contains volumes
    assert "Unused EBS Volumes" in output
    assert "VolumeId" in output
    assert "Size" in output
    # Should show the 3 volumes we created (sizes 1, 2, 3)
    assert "1" in output and "2" in output and "3" in output


def test_security_groups_analysis():
    # Setup security groups
    setup_security_groups()
    
    output = run_analysis_script()
    
    # Check security groups section exists
    assert "Publicly Exposed Security Groups" in output
    # Check that the public group is found
    assert "public" in output or "sg-" in output


def test_log_streams_analysis():
    # Setup log groups and streams
    setup_log_group_and_streams()
    
    output = run_analysis_script()
    
    # Check log streams section exists
    assert "Average Size of CloudWatch Log Streams" in output
    assert "Average log stream size" in output or "No log streams found" in output
    
    # Check average size is approximately correct (~200 bytes)
    if "Average log stream size" in output:
        m = re.search(r"Average log stream size in /test-group: (\d+) bytes", output)
        if m:
            avg = int(m.group(1))
            assert 195 <= avg <= 205
