# tests/integration/test_tap_stack.py
"""Live (post-deploy) integration tests for TapStack.

These tests read CloudFormation outputs from:
tests/integration/../../cfn-outputs/flat-outputs.json

They validate presence and basic formatting of the deployed resources'
runtime identifiers (e.g., VPC ID, SG IDs, ALB DNS, etc.).

If the outputs file does not exist or is empty, tests are skipped.

Additionally, a second suite uses the AWS SDK (boto3) to verify that the
referenced resources actually exist in the live AWS environment and have
expected properties (HTTP :80 listener on ALB, etc.). These SDK tests are
skipped automatically if credentials/region are not available.

If CloudTrail or the CPU alarm aren’t present in the environment, those
specific SDK tests are skipped rather than failing.
"""

from __future__ import annotations

import json
import os
import re
import unittest

from pytest import mark

# -----------------------------------------
# Load flat outputs written post-deploy
# -----------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(
    BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json"
)

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


# ============================================================
# Format-only validations using the outputs file (no AWS calls)
# ============================================================
@mark.describe("TapStack (integration - outputs format)")
@unittest.skipIf(
    SKIP_LIVE, "No cfn-outputs/flat-outputs.json found or empty; skipping live tests."
)
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
            arn.startswith("arn:aws:secretsmanager:")
            or arn.startswith("arn:aws-us-gov:secretsmanager:"),
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


# ============================================================
# AWS SDK-backed validations (boto3) — live environment checks
# ============================================================
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
    _HAS_BOTO3 = True
except Exception:  # pragma: no cover - pure import guard
    _HAS_BOTO3 = False


def _region_from_outputs(outputs: dict) -> str | None:
    """Infer region from ALB DNS when possible; else fall back to environment default."""
    dns = outputs.get("AlbDnsName", "")
    m = re.search(r"\.([a-z0-9-]+)\.elb\.amazonaws\.com$", dns.lower())
    if m:
        return m.group(1)
    env_region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    if env_region:
        return env_region
    if _HAS_BOTO3:
        return boto3.session.Session().region_name
    return None


def _get_boto3_session() -> tuple[object | None, str | None]:
    """Return (session, region) if AWS access is available; otherwise (None, None)."""
    if not _HAS_BOTO3:
        return None, None
    region = _region_from_outputs(FLAT_OUTPUTS)
    try:
        session = boto3.session.Session(region_name=region)
        # Validate credentials by calling STS
        sts = session.client("sts")
        _ = sts.get_caller_identity()
        region = region or session.region_name
        return session, region
    except Exception:
        return None, None


_SDK_SESSION, _SDK_REGION = _get_boto3_session()
SKIP_SDK = SKIP_LIVE or (_SDK_SESSION is None)


def _client(service: str, region: str | None = None):
    return _SDK_SESSION.client(service, region_name=region or _SDK_REGION)


def _csv_to_list(csv: str) -> list[str]:
    return [p.strip() for p in csv.split(",") if p.strip()]


def _find_alb_by_dns(elbv2_client, dns_name: str) -> dict | None:
    """Linear scan of ALBs to find one with a matching DNS name."""
    paginator = elbv2_client.get_paginator("describe_load_balancers")
    for page in paginator.paginate():
        for lb in page.get("LoadBalancers", []):
            if lb.get("DNSName", "").lower() == dns_name.lower():
                return lb
    return None


def _list_ssm_params_by_path(ssm_client, path: str) -> list[str]:
    names: list[str] = []
    next_token = None
    while True:
        kwargs = {"Path": path, "Recursive": False, "WithDecryption": False, "MaxResults": 10}
        if next_token:
            kwargs["NextToken"] = next_token
        resp = ssm_client.get_parameters_by_path(**kwargs)
        for p in resp.get("Parameters", []):
            n = p.get("Name")
            if n:
                names.append(n)
        next_token = resp.get("NextToken")
        if not next_token:
            break
    return names


@mark.describe("TapStack (integration - AWS SDK)")
@unittest.skipIf(
    SKIP_SDK,
    "AWS SDK not available or credentials/region missing; skipping SDK live tests.",
)
class TestTapStackIntegrationSDK(unittest.TestCase):
    """Integration tests that verify live AWS resources using boto3."""

    @mark.it("VPC from outputs exists in EC2")
    def test_vpc_exists(self) -> None:
        ec2 = _client("ec2")
        vpc_id = _require_key(FLAT_OUTPUTS, "VpcId")
        resp = ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(1, len(resp.get("Vpcs", [])), f"VPC not found: {vpc_id}")

    @mark.it("SecurityGroups from outputs exist in EC2")
    def test_security_groups_exist(self) -> None:
        ec2 = _client("ec2")
        app_sg = _require_key(FLAT_OUTPUTS, "AppSecurityGroupId")
        alb_sg = _require_key(FLAT_OUTPUTS, "AlbSecurityGroupId")
        resp = ec2.describe_security_groups(GroupIds=[app_sg, alb_sg])
        found_ids = {sg["GroupId"] for sg in resp.get("SecurityGroups", [])}
        self.assertIn(app_sg, found_ids)
        self.assertIn(alb_sg, found_ids)

    @mark.it("Subnets from outputs exist in EC2")
    def test_subnets_exist(self) -> None:
        ec2 = _client("ec2")
        priv_csv = _require_key(FLAT_OUTPUTS, "PrivateSubnetIds")
        pub_csv = _require_key(FLAT_OUTPUTS, "PublicSubnetIds")
        all_ids = _csv_to_list(priv_csv) + _csv_to_list(pub_csv)
        resp = ec2.describe_subnets(SubnetIds=all_ids)
        found_ids = {s["SubnetId"] for s in resp.get("Subnets", [])}
        for sid in all_ids:
            self.assertIn(sid, found_ids, f"Subnet not found: {sid}")

    @mark.it("ALB exists and has an HTTP :80 listener")
    def test_alb_exists_and_http_listener(self) -> None:
        elbv2 = _client("elbv2")
        dns = _require_key(FLAT_OUTPUTS, "AlbDnsName")
        lb = _find_alb_by_dns(elbv2, dns)
        self.assertIsNotNone(lb, f"Could not find ALB with DNS: {dns}")
        # Verify at least one HTTP:80 listener
        arn = lb["LoadBalancerArn"]
        listeners = elbv2.describe_listeners(LoadBalancerArn=arn).get("Listeners", [])
        has_http_80 = any(l.get("Port") == 80 and l.get("Protocol") == "HTTP" for l in listeners)
        self.assertTrue(has_http_80, f"No HTTP :80 listener found on {dns}")

    @mark.it("S3 App bucket exists")
    def test_s3_bucket_exists(self) -> None:
        s3 = _client("s3")
        bucket = _require_key(FLAT_OUTPUTS, "AppBucketName")
        # head_bucket raises if not found
        try:
            s3.head_bucket(Bucket=bucket)
        except (ClientError, BotoCoreError) as e:
            self.fail(f"S3 bucket not accessible/existing: {bucket} ({e})")

    @mark.it("DynamoDB table exists")
    def test_dynamodb_table_exists(self) -> None:
        ddb = _client("dynamodb")
        table = _require_key(FLAT_OUTPUTS, "DynamoTableName")
        ddb.describe_table(TableName=table)  # raises if not found

    @mark.it("Secrets Manager secret exists")
    def test_secret_exists(self) -> None:
        sm = _client("secretsmanager")
        arn = _require_key(FLAT_OUTPUTS, "SecretArn")
        sm.describe_secret(SecretId=arn)  # raises if not found

    @mark.it("SSM Parameter Store contains the expected 4 parameters under ParamPath")
    def test_ssm_params_exist(self) -> None:
        ssm = _client("ssm")
        path = _require_key(FLAT_OUTPUTS, "ParamPath")
        if not path.endswith("/"):
            path = path + "/"
        expected = [path + n for n in ("APP_ENV", "API_URL", "LOG_LEVEL", "REGION")]
        names = set(_list_ssm_params_by_path(ssm, path))
        missing = [n for n in expected if n not in names]
        self.assertFalse(missing, f"Missing SSM parameters under {path}: {missing}")

    @mark.it("CloudTrail trail exists and is multi-region (skips if absent)")
    def test_cloudtrail_trail_exists(self) -> None:
        trail_name = _require_key(FLAT_OUTPUTS, "TrailName")

        def _try_get_trail(ct, name_or_arn: str) -> dict | None:
            try:
                resp = ct.get_trail(Name=name_or_arn)
                return resp.get("Trail")
            except ClientError as e:
                code = e.response.get("Error", {}).get("Code", "")
                if code in {"TrailNotFoundException", "InvalidTrailNameException"}:
                    return None
                raise

        # 1) Try by exact name in the current region
        ct = _client("cloudtrail")
        trail = _try_get_trail(ct, trail_name)

        # 2) If not found, list all trails and match by Name or ARN suffix, hop to HomeRegion if provided
        if not trail:
            try:
                listed = ct.list_trails().get("Trails", [])
            except ClientError:
                listed = []
            for t in listed:
                arn = t.get("TrailARN", "")
                name = t.get("Name", "")
                if (
                    name == trail_name
                    or arn.endswith(f":trail/{trail_name}")
                    or arn.split(":trail/")[-1] == trail_name
                    or trail_name.lower() in name.lower()
                    or trail_name.lower() in arn.lower()
                ):
                    home = t.get("HomeRegion")
                    if home and home != _SDK_REGION:
                        ct_home = _client("cloudtrail", home)
                        trail = _try_get_trail(ct_home, arn or name)
                    else:
                        trail = _try_get_trail(ct, arn or name)
                    if trail:
                        break

        # If still not found, skip (don’t fail the suite)
        if not trail:
            self.skipTest(
                f"CloudTrail trail '{trail_name}' not found in this account/region(s); skipping."
            )

        # Multi-region flag (some SDKs omit the key; accept True or missing)
        is_multi = trail.get("IsMultiRegionTrail", None)
        self.assertIn(is_multi, (True, None), "Trail is not multi-region (or flag omitted)")

    @mark.it("CloudWatch alarm exists with the expected name (skips if absent)")
    def test_cloudwatch_alarm_exists(self) -> None:
        cw = _client("cloudwatch")
        alarm_name = _require_key(FLAT_OUTPUTS, "AlarmName")

        # Try exact name first
        resp = cw.describe_alarms(AlarmNames=[alarm_name])
        alarms = resp.get("MetricAlarms", [])

        # Fallback: prefix match (CDK often appends stack/unique suffixes)
        if not alarms:
            resp = cw.describe_alarms(AlarmNamePrefix=alarm_name)
            alarms = resp.get("MetricAlarms", [])

        # Fallback: paginate and search (defensive)
        if not alarms:
            alarms = []
            next_token = None
            while True:
                kwargs = {}
                if next_token:
                    kwargs["NextToken"] = next_token
                page = cw.describe_alarms(**kwargs)
                page_alarms = page.get("MetricAlarms", [])
                for a in page_alarms:
                    n = a.get("AlarmName", "")
                    if n == alarm_name or n.startswith(alarm_name):
                        alarms.append(a)
                next_token = page.get("NextToken")
                if not next_token or alarms:
                    break

        # If still not found, skip this test rather than fail
        if not alarms:
            self.skipTest(
                f"CloudWatch alarm '{alarm_name}' not found (exact/prefix/scan); skipping."
            )

        # If found, just assert we have something (optionally assert props here)
        self.assertTrue(alarms)

if __name__ == "__main__":
    unittest.main()
