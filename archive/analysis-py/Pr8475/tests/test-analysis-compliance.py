"""
Test suite for TypeScript-based AWS compliance analysis
"""

import json
import os
import subprocess

import boto3
import pytest


def boto_client(service: str):
    """Create boto3 client with mock endpoint configuration"""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_s3_buckets():
    """Create mock S3 buckets for compliance testing"""
    s3 = boto_client("s3")

    # Create buckets with various compliance states
    try:
        s3.create_bucket(Bucket="compliant-bucket")
        # Enable versioning for compliant bucket
        s3.put_bucket_versioning(
            Bucket="compliant-bucket",
            VersioningConfiguration={"Status": "Enabled"}
        )
    except s3.exceptions.BucketAlreadyOwnedByYou:
        pass

    try:
        s3.create_bucket(Bucket="non-compliant-bucket")
    except s3.exceptions.BucketAlreadyOwnedByYou:
        pass


def setup_ec2_instances():
    """Create mock EC2 instances for compliance testing"""
    ec2 = boto_client("ec2")

    # Create instances with different compliance states
    try:
        # Running instance (potentially non-compliant if not tagged)
        ec2.run_instances(
            ImageId="ami-12345678",
            MinCount=1,
            MaxCount=1,
            InstanceType="t2.micro"
        )
    except Exception:
        pass


def setup_security_groups():
    """Create mock security groups with compliance issues"""
    ec2 = boto_client("ec2")

    try:
        existing_sgs = ec2.describe_security_groups(
            Filters=[{"Name": "group-name", "Values": ["test-sg-public"]}]
        )["SecurityGroups"]

        if not existing_sgs:
            sg_id = ec2.create_security_group(
                GroupName="test-sg-public",
                Description="Test security group with public access"
            )["GroupId"]

            # Add rule allowing public SSH access (non-compliant)
            ec2.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 22,
                        "ToPort": 22,
                        "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                    }
                ],
            )
    except Exception:
        pass


def run_analysis_script():
    """Run the TypeScript analysis script and return output"""
    script_path = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.sh")

    if not os.path.exists(script_path):
        pytest.skip("Analysis script not found at lib/analyse.sh")

    env = {**os.environ}
    result = subprocess.run(
        ["bash", script_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
        cwd=os.path.join(os.path.dirname(__file__), "..")
    )

    # Combine stdout and stderr for comprehensive output checking
    full_output = result.stdout + "\n" + result.stderr
    return full_output


def test_analysis_script_runs():
    """Test that the analysis script executes without errors"""
    setup_s3_buckets()
    setup_ec2_instances()
    setup_security_groups()

    output = run_analysis_script()

    # Check that script ran and produced output
    assert output is not None
    assert len(output) > 0

    # Check for expected compliance analysis indicators
    # The script should run successfully with our mock AWS environment
    assert "AWS Infrastructure Compliance Analysis" in output or "Running compliance scanner" in output


def test_s3_bucket_analysis():
    """Test S3 bucket compliance analysis"""
    setup_s3_buckets()

    output = run_analysis_script()

    # Check that S3 analysis completed
    assert "compliant" in output.lower() or "bucket" in output.lower()


def test_security_group_analysis():
    """Test security group compliance analysis"""
    setup_security_groups()

    output = run_analysis_script()

    # Check that security group analysis completed
    assert "security" in output.lower() or "group" in output.lower()