# tests/integration/test_tap_stack.py
"""Live (post-deploy) integration tests for TapStack.

These tests read CloudFormation outputs from:
tests/integration/../../cfn-outputs/flat-outputs.json

They validate presence and basic formatting of the deployed resources'
runtime identifiers (e.g., VPC ID, SG IDs, ALB DNS, etc.).

If the outputs file does not exist or is empty, tests are skipped.
"""

from __future__ import annotations

import json
import os
import re
import unittest

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json")

if os.path.exists(FLAT_OUTPUTS_PATH):
    with open(FLAT_OUTPUTS_PATH, "r", encoding="utf-8") as f:
        _raw = f.read()
else:
    _raw = "{}"

FLAT_OUTPUTS = json.loads(_raw)
SKIP_LIVE = not bool(FLAT_OUTPUTS)  # skip when file missing or empty


def _require_key(dct: dict, key: str) -> str:
    """Helper to fetch a required key from the outputs with a clear error."""
    if key not in dct:
        raise AssertionError(f"Missing output key: {key}")
    val = dct[key]
    if not isinstance(val, str) or not val.strip():
        raise AssertionError(f"Output {key} is empty or not a string: {val!r}")
    return val


@mark.describe("TapStack (integration)")
@unittest.skipIf(SKIP_LIVE, "No cfn-outputs/flat-outputs.json found or empty; skipping live tests.")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests that assert live outputs exist and look correct."""

    # -------------------------
    # Presence of critical outputs
    # -------------------------

    @mark.it("has all required outputs present and non-empty")
    def test_required_outputs_present(self) -> None:
        required = [
            "VpcId",
            "AlbDnsName",
            "AppSecurityGroupId",
            "AlbSecurityGroupId",
            "PrivateSubnetIds",
            "PublicSubnetIds",
            "AppBucketName",
            "DynamoTableName",
            "SecretArn",
            "ParamPath",
            "TrailName",
            "AlarmName",
        ]
        for key in required:
            _ = _require_key(FLAT_OUTPUTS, key)

    # -------------------------
    # Format validations
    # -------------------------

    @mark.it("VpcId looks like a real VPC ID")
    def test_vpc_id_format(self) -> None:
        vpc_id = _require_key(FLAT_OUTPUTS, "VpcId")
        self.assertTrue(vpc_id.startswith("vpc-"), f"Unexpected VPC ID: {vpc_id}")

    @mark.it("SecurityGroup IDs look correct")
    def test_security_group_ids(self) -> None:
        app_sg = _require_key(FLAT_OUTPUTS, "AppSecurityGroupId")
        alb_sg = _require_key(FLAT_OUTPUTS, "AlbSecurityGroupId")
        for sg in (app_sg, alb_sg):
            self.assertTrue(sg.startswith("sg-"), f"Unexpected SG ID: {sg}")

    @mark.it("Subnet ID lists contain at least two subnets each and look valid")
    def test_subnet_ids(self) -> None:
        priv = _require_key(FLAT_OUTPUTS, "PrivateSubnetIds")
        pub = _require_key(FLAT_OUTPUTS, "PublicSubnetIds")

        def _check_list(csv: str) -> None:
            parts = [p.strip() for p in csv.split(",") if p.strip()]
            self.assertGreaterEqual(len(parts), 2, f"Expected >=2 subnet IDs, got: {parts}")
            for sid in parts:
                self.assertTrue(sid.startswith("subnet-"), f"Bad subnet id: {sid}")

        _check_list(priv)
        _check_list(pub)

    @mark.it("ALB DNS name looks like an AWS ELB DNS")
    def test_alb_dns_format(self) -> None:
      dns = _require_key(FLAT_OUTPUTS, "AlbDnsName")
      # Typical patterns include 'elb.amazonaws.com' and region-specific hostnames
      self.assertIn(".elb.", dns, f"ALB DNS missing '.elb.': {dns}")
      self.assertIn("amazonaws.com", dns, f"ALB DNS missing 'amazonaws.com': {dns}")
      # Accept mixed-case hostnames (some stacks emit mixed-case prefixes)
      pattern = re.compile(r"^[a-z0-9\-\.]+$", re.IGNORECASE)
      self.assertRegex(dns, pattern)


    @mark.it("S3 App bucket name is valid (DNS-compliant)")
    def test_app_bucket_name(self) -> None:
        bucket = _require_key(FLAT_OUTPUTS, "AppBucketName")
        # S3 bucket name rules: 3-63 chars, lowercase, digits, dots, hyphens
        self.assertRegex(bucket, r"^[a-z0-9][a-z0-9\.-]{1,61}[a-z0-9]$")

    @mark.it("DynamoDB table name is non-empty")
    def test_dynamo_table_name(self) -> None:
        table = _require_key(FLAT_OUTPUTS, "DynamoTableName")
        self.assertGreaterEqual(len(table), 3)

    @mark.it("Secret ARN looks like a Secrets Manager ARN")
    def test_secret_arn(self) -> None:
        arn = _require_key(FLAT_OUTPUTS, "SecretArn")
        self.assertTrue(
            arn.startswith("arn:aws:secretsmanager:") or arn.startswith("arn:aws-us-gov:secretsmanager:"),
            f"Unexpected Secrets Manager ARN: {arn}",
        )
        self.assertIn(":secret:", arn, f"Secrets ARN missing ':secret:' segment: {arn}")

    @mark.it("ParamPath follows the /nova/<env>/app/ convention")
    def test_param_path(self) -> None:
        path = _require_key(FLAT_OUTPUTS, "ParamPath")
        self.assertTrue(path.startswith("/nova/"), f"ParamPath should start with /nova/: {path}")
        self.assertIn("/app/", path, f"ParamPath should include /app/: {path}")

    @mark.it("CloudTrail trail name follows nova-*-trail pattern")
    def test_trail_name(self) -> None:
        trail = _require_key(FLAT_OUTPUTS, "TrailName")
        self.assertTrue(trail.startswith("nova-"), f"TrailName should start with 'nova-': {trail}")
        self.assertTrue(trail.endswith("-trail"), f"TrailName should end with '-trail': {trail}")

    @mark.it("AlarmName is the expected constant")
    def test_alarm_name(self) -> None:
        alarm = _require_key(FLAT_OUTPUTS, "AlarmName")
        self.assertEqual(alarm, "NovaEc2CpuHigh")

    @mark.it("RDS endpoint (if present) looks like an RDS hostname")
    def test_optional_rds_endpoint(self) -> None:
        # This output is only present when enableRds=true
        if "RdsEndpoint" not in FLAT_OUTPUTS:
            self.skipTest("RdsEndpoint not present; RDS likely disabled in this environment.")
        endpoint = _require_key(FLAT_OUTPUTS, "RdsEndpoint")
        # RDS endpoints typically look like: <id>.<hash>.<region>.rds.amazonaws.com
        self.assertRegex(endpoint, r"^[a-z0-9\-\.]+$")
        self.assertTrue(
            endpoint.endswith(".rds.amazonaws.com") or ".rds." in endpoint,
            f"Unexpected RDS endpoint format: {endpoint}",
        )


if __name__ == "__main__":
    unittest.main()
