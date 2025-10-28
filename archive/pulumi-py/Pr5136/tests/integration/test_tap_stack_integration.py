"""
Integration tests for deployed TapStack infrastructure.
Tests actual AWS resources using cfn-outputs/flat-outputs.json.
"""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load outputs from deployment."""
        outputs_file = "cfn-outputs/flat-outputs.json"
        with open(outputs_file, "r", encoding="utf-8") as f:
            cls.outputs = json.load(f)

        cls.region = cls.outputs["region"]
        cls.kinesis_client = boto3.client("kinesis", region_name=cls.region)
        cls.rds_client = boto3.client("rds", region_name=cls.region)
        cls.elasticache_client = boto3.client("elasticache", region_name=cls.region)
        cls.kms_client = boto3.client("kms", region_name=cls.region)
        cls.logs_client = boto3.client("logs", region_name=cls.region)
        cls.iam_client = boto3.client("iam", region_name=cls.region)
        cls.ec2_client = boto3.client("ec2", region_name=cls.region)

    def test_vpc_exists(self):
        """Test that VPC is created and accessible."""
        vpc_id = self.outputs["vpc_id"]
        self.assertIsNotNone(vpc_id)

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["VpcId"], vpc_id)
        self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")

        # Check DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsHostnames"
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsSupport"
        )
        self.assertTrue(dns_hostnames["EnableDnsHostnames"]["Value"])
        self.assertTrue(dns_support["EnableDnsSupport"]["Value"])

    def test_kms_key_exists_and_configured(self):
        """Test that KMS key exists and is properly configured."""
        kms_key_id = self.outputs["kms_key_id"]
        kms_key_arn = self.outputs["kms_key_arn"]

        # Describe the key
        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key_metadata = response["KeyMetadata"]

        self.assertEqual(key_metadata["KeyId"], kms_key_id)
        self.assertEqual(key_metadata["Arn"], kms_key_arn)
        self.assertTrue(key_metadata["Enabled"])
        self.assertEqual(key_metadata["KeyState"], "Enabled")
        self.assertTrue(key_metadata["KeySpec"], "SYMMETRIC_DEFAULT")

        # Check key rotation is enabled
        rotation = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
        self.assertTrue(rotation["KeyRotationEnabled"])

    def test_kinesis_stream_exists_and_configured(self):
        """Test that Kinesis stream exists with correct configuration."""
        stream_name = self.outputs["kinesis_stream_name"]
        stream_arn = self.outputs["kinesis_stream_arn"]

        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream_desc = response["StreamDescription"]

        self.assertEqual(stream_desc["StreamName"], stream_name)
        self.assertEqual(stream_desc["StreamARN"], stream_arn)
        self.assertEqual(stream_desc["StreamStatus"], "ACTIVE")
        self.assertEqual(stream_desc["RetentionPeriodHours"], 24)

        # Check shard count
        shards = stream_desc["Shards"]
        self.assertEqual(len(shards), 2)

        # Check encryption
        self.assertEqual(stream_desc["EncryptionType"], "KMS")
        self.assertIn(self.outputs["kms_key_id"], stream_desc["KeyId"])

    def test_kinesis_stream_can_receive_records(self):
        """Test that data can be written to Kinesis stream."""
        stream_name = self.outputs["kinesis_stream_name"]

        # Put a test record
        test_data = json.dumps({
            "transaction_id": "test-123",
            "amount": 100.50,
            "timestamp": "2025-10-27T10:00:00Z"
        })

        response = self.kinesis_client.put_record(
            StreamName=stream_name,
            Data=test_data,
            PartitionKey="test-partition"
        )

        self.assertIn("ShardId", response)
        self.assertIn("SequenceNumber", response)

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists with encryption."""
        log_group_name = self.outputs["log_group_name"]
        kms_key_arn = self.outputs["kms_key_arn"]

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        log_groups = response["logGroups"]

        # Find our log group
        log_group = None
        for lg in log_groups:
            if lg["logGroupName"] == log_group_name:
                log_group = lg
                break

        self.assertIsNotNone(log_group, f"Log group {log_group_name} not found")
        self.assertEqual(log_group["retentionInDays"], 7)
        self.assertEqual(log_group.get("kmsKeyId"), kms_key_arn)

    def test_iam_role_exists_with_kinesis_permissions(self):
        """Test that IAM role exists with correct permissions."""
        kinesis_role_arn = self.outputs["kinesis_role_arn"]
        role_name = kinesis_role_arn.split("/")[-1]

        # Get role
        response = self.iam_client.get_role(RoleName=role_name)
        role = response["Role"]
        self.assertEqual(role["RoleName"], role_name)
        self.assertEqual(role["Arn"], kinesis_role_arn)

        # Check inline policies
        policies_response = self.iam_client.list_role_policies(RoleName=role_name)
        self.assertGreater(len(policies_response["PolicyNames"]), 0)

        # Check attached policies
        attached_response = self.iam_client.list_attached_role_policies(
            RoleName=role_name
        )
        self.assertGreater(len(attached_response["AttachedPolicies"]), 0)

    def test_security_groups_configured(self):
        """Test that security groups are properly configured."""
        vpc_id = self.outputs["vpc_id"]

        # Get security groups in VPC
        response = self.ec2_client.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        security_groups = response["SecurityGroups"]

        # Should have at least RDS and Redis security groups
        sg_names = [sg["GroupName"] for sg in security_groups]
        env_suffix = self.outputs["environment_suffix"]

        rds_sg_found = any(f"rds-sg-{env_suffix}" in name for name in sg_names)
        redis_sg_found = any(f"redis-sg-{env_suffix}" in name for name in sg_names)

        self.assertTrue(rds_sg_found, "RDS security group not found")
        self.assertTrue(redis_sg_found, "Redis security group not found")

    def test_resources_in_correct_region(self):
        """Test that all resources are deployed in the correct region."""
        expected_region = self.outputs["region"]
        self.assertEqual(expected_region, "ap-northeast-1")

        # Verify region in ARNs
        self.assertIn(expected_region, self.outputs["kinesis_stream_arn"])
        self.assertIn(expected_region, self.outputs["kms_key_arn"])


if __name__ == "__main__":
    unittest.main()
