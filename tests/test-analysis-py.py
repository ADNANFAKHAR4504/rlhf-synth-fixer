"""
REQUIRED Mock Configuration Setup for AWS Resource Analysis Testing
================================================================

This setup is MANDATORY for running and testing AWS resource analysis tasks.
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
   a. Define test function (e.g., test_your_resource_analysis())
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
def setup_your_resource():
    client = boto_client("your-service")
    # Create mock resources
    # Handle existing resources
    # Add configurations

def test_your_resource_analysis():
    # Setup resources
    setup_your_resource()
    
    # Run analysis
    results = run_analysis_script()
    
    # Validate results
    assert "YourSection" in results
    assert "ExpectedField" in results["YourSection"]
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- EBS volumes (setup_ebs_volumes)
- Security groups (setup_security_groups)
- CloudWatch logs (setup_log_group_and_streams)

Note: Without this mock configuration setup, resource analysis tests will not 
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
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


def setup_iam_resources():
    iam = boto_client("iam")
    # Create a test user with access key
    try:
        iam.create_user(UserName='test-user')
        iam.create_access_key(UserName='test-user')
    except iam.exceptions.EntityAlreadyExistsException:
        pass  # User already exists
    
    # Create a test role
    try:
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        iam.create_role(
            RoleName='test-role',
            AssumeRolePolicyDocument=json.dumps(assume_role_policy)
        )
    except iam.exceptions.EntityAlreadyExistsException:
        pass  # Role already exists


def run_analysis_script(auditor='resources'):
    """Helper to run the analysis script and return JSON results"""
    # Path to script and output file
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "aws_audit_results.json")
    iam_json_output = os.path.join(os.path.dirname(__file__), "..", "iam_security_audit.json")
    
    # Remove old JSON files if they exist
    for output_file in [json_output, iam_json_output]:
        if os.path.exists(output_file):
            os.remove(output_file)
    
    env = {**os.environ}
    cmd = [sys.executable, script, '--auditor', auditor]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    
    # Read and parse the JSON output file based on auditor
    if auditor == 'resources' and os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    elif auditor == 'iam' and os.path.exists(iam_json_output):
        with open(iam_json_output, 'r') as f:
            return json.load(f)
    else:
        # If JSON file wasn't created, return empty dict and print error
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        return {}


def test_ebs_volumes_analysis():
    # Setup EBS volumes
    setup_ebs_volumes()
    
    results = run_analysis_script()
    
    # Check that UnusedEBSVolumes section exists in JSON
    assert "UnusedEBSVolumes" in results, "UnusedEBSVolumes key missing from JSON"
    
    # Check structure
    ebs_section = results["UnusedEBSVolumes"]
    assert "Count" in ebs_section, "Count key missing from UnusedEBSVolumes"
    assert "TotalSize" in ebs_section, "TotalSize key missing from UnusedEBSVolumes"
    assert "Volumes" in ebs_section, "Volumes key missing from UnusedEBSVolumes"
    
    # Should have 3 volumes (sizes 1, 2, 3)
    assert ebs_section["Count"] == 3, f"Expected 3 volumes, got {ebs_section['Count']}"
    assert ebs_section["TotalSize"] == 6, f"Expected total size of 6 GiB, got {ebs_section['TotalSize']}"
    
    # Validate volume structure
    volumes = ebs_section["Volumes"]
    assert len(volumes) == 3, f"Expected 3 volumes in list, got {len(volumes)}"
    
    # Check that each volume has required fields
    for vol in volumes:
        assert "VolumeId" in vol
        assert "Size" in vol
        assert "VolumeType" in vol
    
    # Check sizes
    sizes = sorted([vol["Size"] for vol in volumes])
    assert sizes == [1, 2, 3], f"Expected sizes [1, 2, 3], got {sizes}"


def test_security_groups_analysis():
    # Setup security groups
    setup_security_groups()
    
    results = run_analysis_script()
    
    # Check that PublicSecurityGroups section exists in JSON
    assert "PublicSecurityGroups" in results, "PublicSecurityGroups key missing from JSON"
    
    # Check structure
    sg_section = results["PublicSecurityGroups"]
    assert "Count" in sg_section, "Count key missing from PublicSecurityGroups"
    assert "SecurityGroups" in sg_section, "SecurityGroups key missing from PublicSecurityGroups"
    
    # Should have at least 1 public security group
    assert sg_section["Count"] >= 1, f"Expected at least 1 public security group, got {sg_section['Count']}"
    
    # Validate security group structure
    security_groups = sg_section["SecurityGroups"]
    assert len(security_groups) >= 1, f"Expected at least 1 security group in list, got {len(security_groups)}"
    
    # Find the public security group we created
    public_sg = next((sg for sg in security_groups if sg["GroupName"] == "public"), None)
    assert public_sg is not None, "Public security group not found in results"
    
    # Validate the public security group has required fields
    assert "GroupId" in public_sg
    assert "GroupName" in public_sg
    assert "PublicIngressRules" in public_sg
    
    # Check that it has the public ingress rule we created
    assert len(public_sg["PublicIngressRules"]) >= 1, "Expected at least 1 public ingress rule"
    
    # Verify the rule allows SSH (port 22) from 0.0.0.0/0
    ssh_rule = next((rule for rule in public_sg["PublicIngressRules"] 
                     if rule.get("FromPort") == 22 and rule.get("Source") == "0.0.0.0/0"), None)
    assert ssh_rule is not None, "SSH rule from 0.0.0.0/0 not found"


def test_iam_analysis():
    # Setup IAM resources
    setup_iam_resources()
    
    results = run_analysis_script('iam')
    
    # Check that basic structure exists
    assert "audit_timestamp" in results, "audit_timestamp key missing from IAM JSON"
    assert "total_findings" in results, "total_findings key missing from IAM JSON"
    assert "findings" in results, "findings key missing from IAM JSON"
    
    # Since we created a user with access key, there should be some findings
    # At minimum, it should run without error and produce some output
    assert isinstance(results["findings"], list), "findings should be a list"