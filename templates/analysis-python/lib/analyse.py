#!/usr/bin/env python3

import os
import sys
from typing import Optional

import boto3
from botocore.config import Config


def get_boto3_client(service_name: str) -> any:
    """Get a boto3 client with proper configuration for Moto or AWS"""
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
    aws_region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    
    session = boto3.session.Session(
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=aws_region,
    )
    return session.client(
        service_name, 
        endpoint_url=endpoint_url, 
        config=Config(retries={"max_attempts": 3})
    )


def print_unused_ebs_volumes() -> None:
    """Analyze and print unused EBS volumes"""
    ec2 = get_boto3_client("ec2")
    resp = ec2.describe_volumes(Filters=[{"Name": "status", "Values": ["available"]}])
    print("=== Unused EBS Volumes ===")
    print("-----------------------------------")
    print("|         DescribeVolumes         |")
    print("+------+--------------------------+")
    print("| Size |        VolumeId          |")
    print("+------+--------------------------+")
    for vol in resp.get("Volumes", []):
        size = vol.get("Size", 0)
        vid = vol.get("VolumeId", "-")
        print(f"|  {size:<3} |  {vid:^24}   |")
    print("+------+--------------------------+")


def print_public_security_groups() -> None:
    """Analyze and print publicly exposed security groups"""
    ec2 = get_boto3_client("ec2")
    resp = ec2.describe_security_groups()
    
    def has_public_ingress(sg: dict) -> bool:
        for perm in sg.get("IpPermissions", []):
            for rng in perm.get("IpRanges", []):
                if rng.get("CidrIp") == "0.0.0.0/0":
                    return True
        return False

    print("=== Publicly Exposed Security Groups ===")
    print("------------------------------------")
    print("|      DescribeSecurityGroups      |")
    print("+-----------------------+----------+")
    public_groups = []
    for sg in resp.get("SecurityGroups", []):
        if has_public_ingress(sg):
            public_groups.append((sg.get("GroupId", "-"), sg.get("GroupName", "-")))
    
    for gid, name in public_groups:
        print(f"|  {gid:<21} |  {name:<6}  |")
    print("+-----------------------+----------+")


def print_average_log_stream_size(group_name: str) -> None:
    """Analyze and print average CloudWatch log stream size"""
    logs = get_boto3_client("logs")
    print("=== Average Size of CloudWatch Log Streams ===")
    
    try:
        streams = []
        paginator = logs.get_paginator("describe_log_streams")
        for page in paginator.paginate(logGroupName=group_name):
            streams.extend(page.get("logStreams", []))
        
        if not streams:
            print(f"No log streams found in {group_name}")
            return
        
        bytes_values = [int(s.get("storedBytes", 0)) for s in streams]
        avg_size = sum(bytes_values) / len(bytes_values)
        # Round to nearest integer to match bash/jq integer math
        print(f"Average log stream size in {group_name}: {int(round(avg_size))} bytes")
    
    except Exception as e:
        print(f"Error analyzing log group {group_name}: {e}")


def main() -> None:
    """Main analysis function"""
    group_name = "/test-group"
    if len(sys.argv) > 1 and sys.argv[1]:
        group_name = sys.argv[1]

    print_unused_ebs_volumes()
    print()
    print_public_security_groups()
    print()
    print_average_log_stream_size(group_name)


if __name__ == "__main__":
    main()