"""
Live integration tests validating deployed AWS resources using boto3.
The tests read stack outputs from cfn-outputs/flat-outputs.json (searching
relative paths) and assert that key infrastructure components exist.
"""

from __future__ import annotations

import json
import os
import unittest
from typing import Dict, List

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError, PartialCredentialsError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Use boto3 to interrogate live infrastructure defined by TapStack."""

    outputs: Dict[str, any] = {}
    region: str | None = None

    @classmethod
    def setUpClass(cls):
        cls.outputs = cls._load_outputs()
        if not cls.outputs:
            raise unittest.SkipTest("flat-outputs.json not present or empty; skipping live tests")

        cls.region = cls.outputs.get("region") or os.environ.get("AWS_REGION")
        if not cls.region:
            raise unittest.SkipTest("Region not supplied by outputs or environment")

        try:
            cls.ec2 = boto3.client("ec2", region_name=cls.region)
            cls.kinesis = boto3.client("kinesis", region_name=cls.region)
            cls.rds = boto3.client("rds", region_name=cls.region)
            cls.elasticache = boto3.client("elasticache", region_name=cls.region)
            cls.secretsmanager = boto3.client("secretsmanager", region_name=cls.region)
            cls.iam = boto3.client("iam")
        except (NoCredentialsError, PartialCredentialsError) as err:
            raise unittest.SkipTest(f"AWS credentials unavailable: {err}") from err

    @staticmethod
    def _load_outputs() -> Dict[str, any]:
        candidates = [
            "cfn-outputs/flat-outputs.json",
            os.path.join("..", "cfn-outputs", "flat-outputs.json"),
            os.path.join("..", "..", "cfn-outputs", "flat-outputs.json"),
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

    def _require(self, key: str):
        value = self.outputs.get(key)
        self.assertIsNotNone(value, f"Output '{key}' missing from flat-outputs.json")
        if isinstance(value, dict):
            for candidate in ('value', 'Value', 'output', 'Output'):
                if candidate in value:
                    value = value[candidate]
                    break
        return value

    def _require_list(self, key: str) -> List[str]:
        value = self._require(key)
        if isinstance(value, str):
            return [value]
        if isinstance(value, list):
            return value
        if isinstance(value, (tuple, set)):
            return list(value)
        raise AssertionError(f"Output '{key}' is not a list-like value")

    def test_vpc_exists(self):
        vpc_id = self._require("vpc_id")
        resp = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(resp["Vpcs"]), 1)
        vpc = resp["Vpcs"][0]
        self.assertFalse(vpc.get("IsDefault", True), "Stack VPC should not be default")

    def test_nat_gateway_available(self):
        nat_gateway_id = self._require("nat_gateway_id")
        resp = self.ec2.describe_nat_gateways(NatGatewayIds=[nat_gateway_id])
        self.assertEqual(len(resp["NatGateways"]), 1)
        self.assertEqual(resp["NatGateways"][0]["State"], "available")

    def test_route_tables(self):
        public_rt = self._require("public_route_table_id")
        private_rt = self._require("private_route_table_id")
        resp = self.ec2.describe_route_tables(RouteTableIds=[public_rt, private_rt])
        self.assertEqual(len(resp["RouteTables"]), 2)

    def test_security_groups_exist(self):
        rds_sg = self._require("rds_security_group_id")
        redis_sg = self._require("redis_security_group_id")
        resp = self.ec2.describe_security_groups(GroupIds=[rds_sg, redis_sg])
        self.assertEqual(len(resp["SecurityGroups"]), 2)

    def test_kinesis_stream_configuration(self):
        stream_name = self._require("kinesis_stream_name")
        resp = self.kinesis.describe_stream(StreamName=stream_name)
        desc = resp["StreamDescription"]
        self.assertEqual(desc["StreamStatus"], "ACTIVE")
        self.assertEqual(desc["EncryptionType"], "KMS")

    def test_rds_instance_configuration(self):
        identifier = self._require("rds_instance_identifier")
        resp = self.rds.describe_db_instances(DBInstanceIdentifier=identifier)
        self.assertEqual(len(resp["DBInstances"]), 1)
        instance = resp["DBInstances"][0]
        self.assertTrue(instance["StorageEncrypted"])
        self.assertTrue(instance["MultiAZ"])

    def test_secrets_manager_entries(self):
        rds_secret_arn = self._require("rds_secret_arn")
        redis_secret_arn = self._require("redis_secret_arn")
        self.secretsmanager.describe_secret(SecretId=rds_secret_arn)
        self.secretsmanager.describe_secret(SecretId=redis_secret_arn)

    def test_iam_roles_exist(self):
        producer_role = self._require("kinesis_producer_role_arn")
        reader_role = self._require("secrets_reader_role_arn")
        for role in (producer_role, reader_role):
            role_name = role.split("/")[-1]
            try:
                self.iam.get_role(RoleName=role_name)
            except (ClientError, BotoCoreError) as err:
                self.fail(f"IAM role {role_name} missing: {err}")


if __name__ == "__main__":
    unittest.main()
