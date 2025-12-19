# tests/integration/test_tap_stack.py
import json
import os
import ssl
import unittest
from urllib import request, error
from urllib.parse import urlparse

import boto3
from botocore.exceptions import ClientError
from pytest import mark


# --------- Load CloudFormation flat outputs ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.normpath(
    os.path.join(BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json")
)

if os.path.exists(FLAT_OUTPUTS_PATH):
    with open(FLAT_OUTPUTS_PATH, "r", encoding="utf-8") as f:
        FLAT_OUTPUTS = json.loads(f.read() or "{}")
else:
    FLAT_OUTPUTS = {}


def get_output(key: str):
    """Helper to read a key from outputs (returns None if missing)."""
    return FLAT_OUTPUTS.get(key)


# --------- Global AWS SDK clients (region inferred) ----------
AWS_REGION = (
    os.environ.get("AWS_REGION")
    or os.environ.get("AWS_DEFAULT_REGION")
    or "us-west-2"  # default to the stack's region
)

session = boto3.Session(region_name=AWS_REGION)
s3 = session.client("s3")
rds = session.client("rds")
elbv2 = session.client("elbv2")
lambda_client = session.client("lambda")


def _derive_env_suffix_from_alb_dns(alb_dns: str) -> str | None:
    """
    From 'tap-alb-<env>-<hash>.region.elb.amazonaws.com' extract <env>.
    Example: tap-alb-pr2933-1088049572.us-west-2.elb.amazonaws.com -> pr2933
    """
    host = alb_dns.split(".")[0] if alb_dns else ""
    parts = host.split("-")
    try:
        idx = parts.index("alb")
    except ValueError:
        # fallback: expected prefix 'tap-alb-...'
        try:
            idx = parts.index("alb")  # just in case
        except ValueError:
            return None
    # expected: ['tap', 'alb', '<env>', '<hash>']
    if len(parts) > idx + 2:
        return parts[idx + 1]
    return None


@mark.describe("TapStack (live integration)")
class TestTapStack(unittest.TestCase):
    """Live integration tests against a deployed TapStack environment.

    Requirements:
      - AWS credentials configured (env/instance profile/OIDC).
      - 'cfn-outputs/flat-outputs.json' present with at least:
        ALBDnsName, APIEndpointURL, DatabaseEndpoint, DataBucketName, LoggingBucketName
    """

    # -------------------------
    # HTTP helpers
    # -------------------------
    def _http_get(self, url: str, timeout: int = 15) -> int:
        """Perform GET (http or https) and return the HTTP status code."""
        parsed = urlparse(url)
        if parsed.scheme == "https":
            ctx = ssl.create_default_context()
            req = request.Request(url, method="GET")
            try:
                with request.urlopen(req, timeout=timeout, context=ctx) as resp:
                    return resp.getcode()
            except error.HTTPError as e:
                return e.code
        else:
            req = request.Request(url, method="GET")
            try:
                with request.urlopen(req, timeout=timeout) as resp:
                    return resp.getcode()
            except error.HTTPError as e:
                return e.code
        # If we get here, something else went wrong
        self.fail(f"HTTP GET to {url} failed (unexpected path)")

    # -------------------------
    # API Gateway test
    # -------------------------
    @mark.it("API Gateway endpoint responds over HTTPS /api/v1/hello")
    def test_api_gateway_https_get(self):
        api_base = get_output("APIEndpointURL")
        if not api_base:
            self.skipTest("APIEndpointURL not found in cfn-outputs/flat-outputs.json")

        # Hit /api/v1/hello on the deployed stage (prod)
        url = api_base.rstrip("/") + "/api/v1/hello"
        status = self._http_get(url)
        self.assertIn(
            status,
            (200, 201, 202, 204, 301, 302, 403, 404),
            f"Unexpected status from API Gateway HTTPS GET {url}: {status}",
        )

    # -------------------------
    # ALB test (auto-detect HTTPS vs HTTP 503 fallback)
    # -------------------------
    @mark.it("ALB DNS reachable — HTTPS if 443 listener exists, otherwise HTTP returns 503 fallback")
    def test_alb_listener_and_reachability(self):
        alb_dns = get_output("ALBDnsName")
        if not alb_dns:
            self.skipTest("ALBDnsName not found in cfn-outputs/flat-outputs.json")

        # Find LB by DNS name, then detect listeners
        try:
            lbs = elbv2.describe_load_balancers()["LoadBalancers"]
            lb = next((x for x in lbs if x.get("DNSName") == alb_dns), None)
            self.assertIsNotNone(lb, f"Could not find ALB by DNS name: {alb_dns}")
            lb_arn = lb["LoadBalancerArn"]

            listeners = elbv2.describe_listeners(LoadBalancerArn=lb_arn)["Listeners"]
            ports = {(lst["Port"], lst.get("Protocol")) for lst in listeners}

            if (443, "HTTPS") in ports:
                # Expect HTTPS to be reachable at "/"
                url = f"https://{alb_dns}/"
                status = self._http_get(url)
                self.assertIn(
                    status,
                    (200, 201, 202, 204, 301, 302, 403, 404),
                    f"HTTPS GET to ALB {url} returned unexpected status {status}",
                )
            elif (80, "HTTP") in ports:
                # Your stack returns 503 fixed response if no cert is provided
                url = f"http://{alb_dns}/"
                status = self._http_get(url)
                self.assertEqual(
                    status, 503, f"Expected fixed 503 on HTTP listener fallback, got {status}"
                )
            else:
                self.fail(f"No suitable ALB listener found on {alb_dns}: {ports}")
        except ClientError as e:
            self.fail(f"ELBv2 describe failed: {e}")

    # -------------------------
    # S3 security tests
    # -------------------------
    @mark.it("Data & Logs buckets: encryption enabled and public access blocked")
    def test_s3_buckets_security(self):
        data_bucket = get_output("DataBucketName")
        logs_bucket = get_output("LoggingBucketName")
        if not data_bucket or not logs_bucket:
            self.skipTest("DataBucketName/LoggingBucketName not found in outputs")

        for bucket in (data_bucket, logs_bucket):
            # Encryption
            try:
                enc = s3.get_bucket_encryption(Bucket=bucket)
                rules = enc["ServerSideEncryptionConfiguration"]["Rules"]
                self.assertTrue(len(rules) >= 1, f"No SSE rules on bucket {bucket}")
            except ClientError as e:
                self.fail(f"get_bucket_encryption failed for {bucket}: {e}")

            # Public access block
            try:
                pab = s3.get_public_access_block(Bucket=bucket)
                cfg = pab["PublicAccessBlockConfiguration"]
                self.assertTrue(cfg.get("BlockPublicAcls", False), f"BlockPublicAcls false on {bucket}")
                self.assertTrue(cfg.get("IgnorePublicAcls", False), f"IgnorePublicAcls false on {bucket}")
                self.assertTrue(cfg.get("BlockPublicPolicy", False), f"BlockPublicPolicy false on {bucket}")
                self.assertTrue(cfg.get("RestrictPublicBuckets", False), f"RestrictPublicBuckets false on {bucket}")
            except ClientError as e:
                self.fail(f"get_public_access_block failed for {bucket}: {e}")

        # Data bucket must log to the logs bucket with the expected prefix
        try:
            logging_cfg = s3.get_bucket_logging(Bucket=data_bucket)
            enabled = logging_cfg.get("LoggingEnabled", {})
            self.assertTrue(enabled, f"Server access logging not enabled on {data_bucket}")
            self.assertEqual(
                enabled.get("TargetBucket"),
                logs_bucket,
                f"Data bucket logs not targeting {logs_bucket}",
            )
            self.assertEqual(
                enabled.get("TargetPrefix"), "data-bucket-logs/", "Unexpected log prefix on data bucket"
            )
        except ClientError as e:
            self.fail(f"get_bucket_logging failed for {data_bucket}: {e}")

        # TLS-only bucket policy: ensure Deny on aws:SecureTransport=false exists (check Data bucket policy)
        try:
            pol = s3.get_bucket_policy(Bucket=data_bucket)
            doc = json.loads(pol["Policy"])
            statements = doc.get("Statement", [])
            deny_secure = [
                s for s in statements
                if s.get("Effect") == "Deny"
                and "Condition" in s
                and "Bool" in s["Condition"]
                and s["Condition"]["Bool"].get("aws:SecureTransport") == "false"
            ]
            self.assertTrue(deny_secure, "No TLS-only deny statement found on data bucket policy")
        except ClientError as e:
            self.fail(f"get_bucket_policy failed for {data_bucket}: {e}")

    # -------------------------
    # RDS security tests
    # -------------------------
    @mark.it("RDS instance is encrypted, private, and Postgres 15.x")
    def test_rds_encrypted_and_private(self):
        endpoint = get_output("DatabaseEndpoint")
        if not endpoint:
            self.skipTest("DatabaseEndpoint not found in outputs")

        # Describe all DB instances and match the endpoint
        try:
            paginator = rds.get_paginator("describe_db_instances")
            found = None
            for page in paginator.paginate():
                for dbi in page.get("DBInstances", []):
                    ep = dbi.get("Endpoint", {}).get("Address")
                    if ep and ep.lower() == endpoint.lower():
                        found = dbi
                        break
                if found:
                    break

            self.assertIsNotNone(found, f"No DB instance matches endpoint {endpoint}")

            # Assert security properties
            self.assertTrue(found.get("StorageEncrypted", False), "RDS StorageEncrypted is False")
            self.assertFalse(found.get("PubliclyAccessible", True), "RDS is PubliclyAccessible=True")
            self.assertEqual(
                (found.get("Engine") or "").lower(),
                "postgres",
                f"Unexpected engine: {found.get('Engine')}",
            )
            eng_ver = str(found.get("EngineVersion") or "")
            self.assertTrue(eng_ver.startswith("15"), f"EngineVersion not 15.x: {eng_ver}")

        except ClientError as e:
            self.fail(f"RDS describe failed: {e}")

    # -------------------------
    # Lambda VPC test (derived function name)
    # -------------------------
    @mark.it("Lambda function exists in a VPC")
    def test_lambda_function_vpc_config(self):
        alb_dns = get_output("ALBDnsName")
        if not alb_dns:
            self.skipTest("ALBDnsName not found in outputs (needed to derive env suffix)")

        env_suffix = _derive_env_suffix_from_alb_dns(alb_dns)
        if not env_suffix:
            self.skipTest(f"Could not derive env suffix from ALB DNS: {alb_dns}")

        fn_name = f"tap-api-{env_suffix}"
        try:
            cfg = lambda_client.get_function_configuration(FunctionName=fn_name)
            vpc_cfg = cfg.get("VpcConfig") or {}
            subnet_ids = vpc_cfg.get("SubnetIds") or []
            sg_ids = vpc_cfg.get("SecurityGroupIds") or []
            self.assertTrue(subnet_ids, f"Lambda {fn_name} has no VpcConfig.SubnetIds")
            self.assertTrue(sg_ids, f"Lambda {fn_name} has no VpcConfig.SecurityGroupIds")
        except ClientError as e:
            self.fail(f"Lambda get_function_configuration failed for {fn_name}: {e}")

    # -------------------------
    # Sanity: outputs present
    # -------------------------
    @mark.it("Stack outputs are present and non-empty")
    def test_outputs_present(self):
        required = [
            "ALBDnsName",
            "APIEndpointURL",
            "DatabaseEndpoint",
            "DataBucketName",
            "LoggingBucketName",
            "VPCId",
            "PrivateSubnetIds",
        ]
        missing = [k for k in required if not get_output(k)]
        if missing:
            self.skipTest(f"Missing required outputs in flat-outputs.json: {missing}")

        # Basic URL/host sanity
        api_url = get_output("APIEndpointURL")
        alb_dns = get_output("ALBDnsName")

        self.assertTrue(api_url.startswith("https://"), "APIEndpointURL must be https")
        self.assertIn(".", alb_dns, "ALB DNS looks invalid")
        parsed = urlparse(api_url)
        self.assertEqual(parsed.scheme, "https", "API URL scheme must be https")
        self.assertTrue(parsed.netloc, "API URL missing host")
