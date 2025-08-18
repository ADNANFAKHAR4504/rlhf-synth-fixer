"""
Utility functions for infrastructure deployment
"""
import ipaddress
import boto3
from typing import List
from botocore.exceptions import ClientError


def validate_cidr_block(cidr: str) -> bool:
  """
  Validate if a CIDR block is valid

  Args:
      cidr: CIDR block string (e.g., "10.0.0.0/16")

  Returns:
      bool: True if valid, False otherwise
  """
  try:
    ipaddress.IPv4Network(cidr, strict=False)
    return True
  except (ipaddress.AddressValueError, ValueError):
    return False


def get_availability_zones(region: str) -> List[str]:
  """
  Get availability zones for a region

  Args:
      region: AWS region name

  Returns:
      List of availability zone names
  """
  try:
    ec2_client = boto3.client('ec2', region_name=region)
    response = ec2_client.describe_availability_zones()
    return [az['ZoneName'] for az in response['AvailabilityZones']]
  except ClientError:
    # Fallback to common AZ patterns
    return [f"{region}a", f"{region}b", f"{region}c"]


def generate_resource_name(resource_type: str, region: str, environment: str) -> str:
  """
  Generate consistent resource names

  Args:
      resource_type: Type of resource (vpc, sg, etc.)
      region: AWS region
      environment: Environment name

  Returns:
      Formatted resource name
  """
  region_short = region.replace('-', '')
  return f"{resource_type}-{environment}-{region_short}"


def validate_tags(tags: dict, required_tags: List[str]) -> bool:
  """
  Validate that all required tags are present

  Args:
      tags: Dictionary of tags
      required_tags: List of required tag keys

  Returns:
      bool: True if all required tags present, False otherwise
  """
  return all(tag in tags for tag in required_tags)
