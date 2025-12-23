"""
test_tap_stack.py

Integration tests for the TapStack Pulumi component.
Tests against live AWS resources.
"""

import os
import unittest
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)

    def test_s3_bucket_exists(self):
        """Test that the S3 bucket exists."""
        bucket_name = f"tapstack-{self.environment_suffix}-bucket"

        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} does not exist: {e}")

    def test_s3_bucket_encryption(self):
        """Test that S3 bucket has encryption enabled."""
        bucket_name = f"tapstack-{self.environment_suffix}-bucket"

        try:
            response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('Rules', response)
            self.assertTrue(len(response['Rules']) > 0)
        except ClientError as e:
            self.fail(f"Failed to get bucket encryption for {bucket_name}: {e}")

    def test_vpc_exists(self):
        """Test that the VPC exists."""
        try:
            response = self.ec2_client.describe_vpcs(
                Filters=[
                    {'Name': 'tag:Name', 'Values': [f'TapStack-vpc-{self.environment_suffix}']}
                ]
            )
            self.assertTrue(len(response['Vpcs']) > 0, "VPC not found")
        except ClientError as e:
            self.fail(f"Failed to describe VPCs: {e}")


if __name__ == '__main__':
    unittest.main()
