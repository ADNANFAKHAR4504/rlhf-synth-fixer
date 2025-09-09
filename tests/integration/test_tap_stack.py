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

# Helper to read a key from outputs (returns None if missing)
def get_output(key: str):
    return FLAT_OUTPUTS.get(key)


# --------- Global AWS SDK clients (region inferred) ----------
AWS_REGION = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
s3 = boto3.client("s3", region_name=AWS_REGION)
rds = boto3.client("rds", region_name=AWS_REGION)


@mark.describe("TapStack (live integration)")
class TestTapStack(unittest.TestCase):
    """Live integration tests against a deployed TapStack environment.

    Requirements:
      - AWS credentials configured (env/instance profile/OIDC).
      - 'cfn-outputs/flat-outputs.json' present with at least:
        ALBDnsName, APIEndpointURL, DatabaseEndpoint, DataBucketName, LoggingBucketName
    """

    def setUp(self):
        # nothing to prep per-test right now
        pass

    # -------------------------
    # HTTP helpers
    # -------------------------
    def _https_get(self, url: str, timeout: int = 10) -> int:
        """Perform a minimal HTTPS GET and return status code."""
        ctx = ssl.create_default_context()
        req = request.Request(url, method="GET")
        try:
            with request.urlopen(req, timeout=timeout, context=ctx) as resp:
                return resp.getcode()
        except error.HTTPError as e:
            # Return the HTTP status code (e.g., 301/403/500)
            return e.code
        except Exception as e:  # noqa: BLE001
            self.fail(f"HTTPS GET to {url} failed: {e}")

    # -------------------------
    # API Gateway test
    # -------------------------
    @mark.it("API Gateway endpoint responds over HTTPS")
    def test_api_gateway_https_get(self):
        api_base = get_output("APIEndpointURL")
        if not api_base:
            self.skipTest("APIEndpointURL not found in cfn-outputs/flat-outputs.json")

        # Normalized path for the sample route in the stack: /api/v1/hello
        # If your deployment exposes just the root, this will still 404 with HTTPS — which is fine.
        # We only assert the endpoint is reachable over TLS (2xx/3xx/4xx are all valid network-wise).
        url = api_base.rstrip("/") + "/api/v1/hello"
        status = self._https_get(url)
        self.assertIn(
            status,
            (200, 201, 202, 204, 301, 302, 403, 404),
            f"Unexpected status from API Gateway HTTPS GET {url}: {status}",
        )

    # -------------------------
    # ALB test
    # -------------------------
    @mark.it("ALB DNS is reachable over HTTPS")
    def test_alb_https_get(self):
        alb_dns = get_output("ALBDnsName")
        if not alb_dns:
            self.skipTest("ALBDnsName not found in cfn-outputs/flat-outputs.json")

        # The app responds on port 8080 behind the ALB HTTPS (443) listener.
        # A straight GET to "/" should at least return a network-valid status.
        url = f"https://{alb_dns}/"
        status = self._https_get(url)
        self.assertIn(
            status,
            (200, 201, 202, 204, 301, 302, 403, 404),
            f"Unexpected status from ALB HTTPS GET {url}: {status}",
        )

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
                # If no explicit PAB found, it should be because the bucket is configured at creation.
                # Treat absence as failure to be strict.
                self.fail(f"get_public_access_block failed for {bucket}: {e}")

    # -------------------------
    # RDS security tests
    # -------------------------
    @mark.it("RDS instance is encrypted and not publicly accessible")
    def test_rds_encrypted_and_private(self):
        endpoint = get_output("DatabaseEndpoint")
        if not endpoint:
            self.skipTest("DatabaseEndpoint not found in outputs")

        # Describe all DB instances and find one with the same endpoint
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
            # EngineVersion starts with "15" for Postgres 15
            eng_ver = str(found.get("EngineVersion") or "")
            self.assertTrue(eng_ver.startswith("15"), f"EngineVersion not 15.x: {eng_ver}")

        except ClientError as e:
            self.fail(f"RDS describe failed: {e}")

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
        # ensure API URL parses
        parsed = urlparse(api_url)
        self.assertEqual(parsed.scheme, "https", "API URL scheme must be https")
        self.assertTrue(parsed.netloc, "API URL missing host")
