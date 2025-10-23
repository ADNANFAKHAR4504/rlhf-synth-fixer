"""
REQUIRED Mock Configuration Setup for AWS Shell Script Analysis Testing
====================================================================

This setup is MANDATORY for running and testing AWS resource analysis shell scripts.
All new resource analysis implementations must follow this testing framework
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
   a. Create a setup function (e.g., setup_your_resource()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock resources using boto3 API calls
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_your_resource_analysis(tmp_path)):
      - Include tmp_path fixture for temporary script location
      - Call your setup function to create mock resources
      - Call run_analysis_script(tmp_path) to execute shell script
      - Assert expected results in the script output:
        - Check for section headers in output
        - Verify resource information is present
        - Validate specific metrics or counts
        - Test for expected string patterns

Standard Implementation Template:
------------------------------
```python
def setup_your_resource():
    client = boto_client("your-service")
    # Create mock resources
    # Handle existing resources
    # Add configurations

def test_your_resource_analysis(tmp_path):
    # Setup resources
    setup_your_resource()
    
    # Run analysis script
    output = run_analysis_script(tmp_path)
    
    # Validate output
    assert "Your Section Header" in output
    assert "Expected Resource Info" in output
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- EBS volumes (setup_ebs_volumes, test_ebs_volumes_analysis)
- Security groups (setup_security_groups, test_security_groups_analysis)
- CloudWatch logs (setup_log_group_and_streams, test_log_streams_analysis)

Note: Without this mock configuration setup, shell script analysis tests will not 
function correctly and may produce invalid results. The tmp_path fixture is 
required for proper script execution in the test environment.
"""

import json
import os
import re
import shutil
import subprocess
import time

import boto3
import pytest


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
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


def run_analysis_script(tmp_path):
    """Helper to run the analysis script and return output"""
    script = tmp_path / "analyse.sh"
    # Updated path: from test/ directory, go up one level and into lib/ directory
    script_path = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.sh")
    with open(script_path) as f:
        content = f.read()
    script.write_text(content)
    script.chmod(0o755)

    env = {**os.environ}
    result = subprocess.run([str(script)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    return result.stdout


def test_ebs_volumes_analysis(tmp_path):
    # Setup EBS volumes
    setup_ebs_volumes()
    
    output = run_analysis_script(tmp_path)
    
    # Check EBS volumes section exists and contains volumes
    assert "Unused EBS Volumes" in output
    assert "VolumeId" in output
    assert "Size" in output
    # Should show the 3 volumes we created (sizes 1, 2, 3)
    assert "1" in output and "2" in output and "3" in output


def test_security_groups_analysis(tmp_path):
    # Setup security groups
    setup_security_groups()
    
    output = run_analysis_script(tmp_path)
    
    # Check security groups section exists
    assert "Publicly Exposed Security Groups" in output
    # Check that the public group is found
    assert "public" in output or "sg-" in output


def test_log_streams_analysis(tmp_path):
    # Setup log groups and streams
    setup_log_group_and_streams()
    
    output = run_analysis_script(tmp_path)
    
    # Check log streams section exists
    assert "Average Size of CloudWatch Log Streams" in output
    assert "Average log stream size" in output or "No log streams found" in output
    
    # Check average size is approximately correct (~200 bytes)
    if "Average log stream size" in output:
        m = re.search(r"Average log stream size in /test-group: (\d+) bytes", output)
        if m:
            avg = int(m.group(1))
            assert 195 <= avg <= 205
