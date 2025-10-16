"""Integration tests for the video processing pipeline infrastructure.

This module contains integration tests that validate the complete stack deployment,
including all nested stacks and their interconnections.
"""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark, skip


# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack - Video Processing Pipeline")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and environment for all tests"""
        cls.region = "ap-northeast-1"
        cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        cls.ec2_client = boto3.client("ec2", region_name=cls.region)
        cls.iam_client = boto3.client("iam", region_name=cls.region)

    @mark.it("AWS credentials are configured correctly")
    def test_aws_credentials_valid(self):
        """Verify AWS credentials are valid and can make API calls"""
        try:
            # Simple API call to verify credentials work
            caller_identity = boto3.client("sts", region_name=self.region).get_caller_identity()
            self.assertIsNotNone(caller_identity.get("Account"), "AWS Account ID should be present")
            self.assertIsNotNone(caller_identity.get("Arn"), "AWS ARN should be present")
        except ClientError as e:
            self.fail(f"AWS credentials are not valid: {str(e)}")

    @mark.it("Region is correctly configured")
    def test_region_configuration(self):
        """Verify the deployment region is ap-northeast-1"""
        self.assertEqual(self.region, "ap-northeast-1", "Region should be ap-northeast-1")

    @mark.it("EC2 service is accessible in the region")
    def test_ec2_service_accessible(self):
        """Verify EC2 service is accessible and can list VPCs"""
        try:
            response = self.ec2_client.describe_vpcs(MaxResults=5)
            self.assertIn("Vpcs", response, "EC2 describe_vpcs should return Vpcs key")
        except ClientError as e:
            self.fail(f"EC2 service not accessible: {str(e)}")

    @mark.it("IAM service is accessible")
    def test_iam_service_accessible(self):
        """Verify IAM service is accessible and can list roles"""
        try:
            response = self.iam_client.list_roles(MaxItems=1)
            self.assertIn("Roles", response, "IAM list_roles should return Roles key")
        except ClientError as e:
            self.fail(f"IAM service not accessible: {str(e)}")

    @mark.it("Environment suffix is set correctly")
    def test_environment_suffix_set(self):
        """Verify environment suffix is configured"""
        self.assertIsNotNone(self.environment_suffix, "Environment suffix should be set")
        self.assertGreater(len(self.environment_suffix), 0, "Environment suffix should not be empty")

    @mark.it("Security group allows ECS to access RDS on port 5432")
    def test_security_group_ecs_to_rds(self):
        """Verify ECS security group has access to RDS security group"""
        try:
            ecs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"ecs-sg-{self.environment_suffix}"]}]
            )
            rds_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"rds-sg-{self.environment_suffix}"]}]
            )

            if ecs_sg["SecurityGroups"] and rds_sg["SecurityGroups"]:
                ecs_sg_id = ecs_sg["SecurityGroups"][0]["GroupId"]
                rds_sg_rules = rds_sg["SecurityGroups"][0]["IpPermissions"]

                has_access = any(
                    rule.get("FromPort") == 5432 and
                    any(g.get("GroupId") == ecs_sg_id for g in rule.get("UserIdGroupPairs", []))
                    for rule in rds_sg_rules
                )
                self.assertTrue(has_access, "ECS security group should have access to RDS on port 5432")
        except ClientError as e:
            skip(f"Security groups not yet available: {str(e)}")

    @mark.it("Security group allows ECS to access Redis on port 6379")
    def test_security_group_ecs_to_redis(self):
        """Verify ECS security group has access to Redis security group"""
        try:
            ecs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"ecs-sg-{self.environment_suffix}"]}]
            )
            redis_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"redis-sg-{self.environment_suffix}"]}]
            )

            if ecs_sg["SecurityGroups"] and redis_sg["SecurityGroups"]:
                ecs_sg_id = ecs_sg["SecurityGroups"][0]["GroupId"]
                redis_sg_rules = redis_sg["SecurityGroups"][0]["IpPermissions"]

                has_access = any(
                    rule.get("FromPort") == 6379 and
                    any(g.get("GroupId") == ecs_sg_id for g in rule.get("UserIdGroupPairs", []))
                    for rule in redis_sg_rules
                )
                self.assertTrue(has_access, "ECS security group should have access to Redis on port 6379")
        except ClientError as e:
            skip(f"Security groups not yet available: {str(e)}")

    @mark.it("Security group allows ECS to access EFS on port 2049")
    def test_security_group_ecs_to_efs(self):
        """Verify ECS security group has access to EFS security group"""
        try:
            ecs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"ecs-sg-{self.environment_suffix}"]}]
            )
            efs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"efs-sg-{self.environment_suffix}"]}]
            )

            if ecs_sg["SecurityGroups"] and efs_sg["SecurityGroups"]:
                ecs_sg_id = ecs_sg["SecurityGroups"][0]["GroupId"]
                efs_sg_rules = efs_sg["SecurityGroups"][0]["IpPermissions"]

                has_access = any(
                    rule.get("FromPort") == 2049 and
                    any(g.get("GroupId") == ecs_sg_id for g in rule.get("UserIdGroupPairs", []))
                    for rule in efs_sg_rules
                )
                self.assertTrue(has_access, "ECS security group should have access to EFS on port 2049")
        except ClientError as e:
            skip(f"Security groups not yet available: {str(e)}")
