"""
Live infrastructure verification tests.

These tests connect to AWS using boto3 and validate that the resources exported
by the Pulumi stack actually exist and are configured as expected. They rely on
the `cfn-outputs/flat-outputs.json` file that Pulumi writes during deployment.

Set AWS credentials (for example via environment variables or a profile) before
running these tests.
"""

import json
import os
import unittest
from typing import Dict, Optional

import boto3
from botocore.exceptions import (
    BotoCoreError,
    ClientError,
    NoCredentialsError,
    PartialCredentialsError,
)


class TestTapStackLiveInfrastructure(unittest.TestCase):
    """Validate live AWS resources using stack outputs and boto3."""

    outputs: Dict[str, str] = {}
    region: str = os.getenv("AWS_REGION")

    @classmethod
    def setUpClass(cls):
        cls.outputs = cls._load_outputs()
        if not cls.outputs:
            raise unittest.SkipTest("No stack outputs found for live verification.")

        cls.region = cls.outputs.get("region") or os.environ.get("AWS_REGION")
        if not cls.region:
            raise unittest.SkipTest("Region is not specified in outputs or environment.")

        try:
            cls.ec2 = boto3.client("ec2", region_name=cls.region)
            cls.ecs = boto3.client("ecs", region_name=cls.region)
            cls.rds = boto3.client("rds", region_name=cls.region)
            cls.elasticache = boto3.client("elasticache", region_name=cls.region)
            cls.logs = boto3.client("logs", region_name=cls.region)
            cls.kms = boto3.client("kms", region_name=cls.region)
            cls.secretsmanager = boto3.client("secretsmanager", region_name=cls.region)
            cls.sns = boto3.client("sns", region_name=cls.region)
        except (NoCredentialsError, PartialCredentialsError) as exc:
            raise unittest.SkipTest(f"AWS credentials not available: {exc}") from exc

    @staticmethod
    def _load_outputs() -> Dict[str, str]:
        """Try several relative paths to locate the flat outputs JSON file."""
        candidates = [
            "cfn-outputs/flat-outputs.json",
            os.path.join("..", "cfn-outputs", "flat-outputs.json"),
            os.path.join("..", "..", "cfn-outputs", "flat-outputs.json"),
            os.path.join("tests", "cfn-outputs", "flat-outputs.json"),
        ]
        for path in candidates:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as fp:
                        data = json.load(fp)
                        if isinstance(data, dict) and data:
                            return data
                except json.JSONDecodeError:
                    continue
        return {}

    def _require_output(self, key: str) -> str:
        value = self.outputs.get(key)
        self.assertIsNotNone(value, f"Output '{key}' missing from flat-outputs.json")
        if isinstance(value, str):
            self.assertTrue(value.strip(), f"Output '{key}' should not be empty.")
        return value

    def test_vpc_exists(self):
        vpc_id = self._require_output("vpc_id")
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1, "VPC should exist.")
        self.assertTrue(
            response["Vpcs"][0]["IsDefault"] is False,
            "VPC should not be the default VPC.",
        )

    def test_security_groups_exist(self):
        sg_ids = [
            self._require_output("ecs_security_group_id"),
            self._require_output("rds_security_group_id"),
            self._require_output("elasticache_security_group_id"),
        ]
        response = self.ec2.describe_security_groups(GroupIds=sg_ids)
        self.assertEqual(len(response["SecurityGroups"]), len(sg_ids))

    def test_nat_and_routes(self):
        nat_id = self._require_output("nat_gateway_id")
        nat_response = self.ec2.describe_nat_gateways(NatGatewayIds=[nat_id])
        self.assertEqual(len(nat_response["NatGateways"]), 1)
        self.assertEqual(nat_response["NatGateways"][0]["State"], "available")

        public_rt = self._require_output("public_route_table_id")
        private_rt = self._require_output("private_route_table_id")
        rt_response = self.ec2.describe_route_tables(RouteTableIds=[public_rt, private_rt])
        self.assertEqual(len(rt_response["RouteTables"]), 2)

    def test_ecs_cluster_and_service(self):
        cluster_name = self._require_output("ecs_cluster_name")
        service_name = self._require_output("ecs_service_name")

        cluster_response = self.ecs.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(cluster_response["clusters"]), 1)
        cluster = cluster_response["clusters"][0]
        self.assertEqual(cluster["status"], "ACTIVE")

        service_response = self.ecs.describe_services(cluster=cluster_name, services=[service_name])
        self.assertEqual(len(service_response["services"]), 1)
        service = service_response["services"][0]
        self.assertEqual(service["status"], "ACTIVE")
        self.assertEqual(service["launchType"], "FARGATE")
        self.assertGreaterEqual(service["desiredCount"], 1)

    def test_kms_key_rotation_enabled(self):
        key_id = self._require_output("kms_key_id")
        metadata = self.kms.describe_key(KeyId=key_id)["KeyMetadata"]
        self.assertEqual(metadata["KeyState"], "Enabled")
        rotation = self.kms.get_key_rotation_status(KeyId=key_id)
        self.assertTrue(rotation["KeyRotationEnabled"])

    def test_cloudwatch_log_group_exists(self):
        log_group = self._require_output("ecs_log_group_name")
        response = self.logs.describe_log_groups(logGroupNamePrefix=log_group)
        groups = [g for g in response.get("logGroups", []) if g["logGroupName"] == log_group]
        self.assertTrue(groups, f"CloudWatch log group {log_group} should exist.")

    def test_rds_cluster_configuration(self):
        cluster_arn = self._require_output("db_cluster_arn")
        cluster_identifier = cluster_arn.split(":cluster:")[-1]
        response = self.rds.describe_db_clusters(DBClusterIdentifier=cluster_identifier)
        self.assertEqual(len(response["DBClusters"]), 1)
        cluster = response["DBClusters"][0]
        self.assertTrue(cluster["StorageEncrypted"])

    def test_database_secret_encrypted(self):
        secret_arn = self._require_output("db_secret_arn")
        secret = self.secretsmanager.describe_secret(SecretId=secret_arn)
        self.assertIn("KmsKeyId", secret)



if __name__ == "__main__":
    unittest.main()
