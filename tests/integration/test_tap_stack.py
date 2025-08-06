"""
Light-weight *integration* checks that run against the **deployed** stack.

These tests:
  • obtain stack outputs via `pulumi stack output`,
  • use `boto3` (and standard libraries) to validate live AWS resources.

Prerequisites
-------------
1. The Pulumi stack must already be *deployed* and selected ( `pulumi stack select`).
2. Your AWS credentials (env-vars or profile) must point to the account where
   the resources were created.
3. `boto3` must be installed ( `pip install boto3`).

Run with:

    pytest -q tests/integration/test_tap_stack.py
"""
from __future__ import annotations

import json
import socket
import subprocess
import time
from typing import Any, Dict

import boto3
import pytest


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #
def _pulumi_output(key: str) -> Any:
    """Return a single Pulumi stack output value (decoded from JSON)."""
    raw: bytes = subprocess.check_output(
        ["pulumi", "stack", "output", key, "--json"], text=False
    )
    return json.loads(raw)


def _wait_until(condition_fn, timeout: int = 120, interval: int = 5) -> None:
    """Utility: wait until *condition_fn* returns truthy or raise TimeoutError."""
    end = time.time() + timeout
    while time.time() < end:
        if condition_fn():
            return
        time.sleep(interval)
    raise TimeoutError(f"Condition not satisfied within {timeout}s.")


# --------------------------------------------------------------------------- #
# Fixtures                                                                    #
# --------------------------------------------------------------------------- #
@pytest.fixture(scope="session")
def stack_outputs() -> Dict[str, Any]:
    """All stack outputs used by the tests (evaluated once per session)."""
    keys = ["alb_dns", "s3_primary_bucket", "rds_primary_endpoint"]
    return {k: _pulumi_output(k) for k in keys}


@pytest.fixture(scope="session")
def aws_clients() -> Dict[str, Any]:
    """Boto3 clients shared by all tests."""
    return {
        "s3": boto3.client("s3"),
        "elbv2": boto3.client("elbv2"),
        "rds": boto3.client("rds"),
    }


# --------------------------------------------------------------------------- #
# Test-cases                                                                  #
# --------------------------------------------------------------------------- #
class TestTapStackIntegration:
    """Validate that live resources satisfy the high-level requirements."""

    # -----------------------  networking / ALB  -------------------------- #
    def test_alb_dns_resolves(self, stack_outputs):
        """Application Load Balancer DNS name must resolve to at least one IP."""
        alb_dns = stack_outputs["alb_dns"]
        ip_addr = socket.gethostbyname(alb_dns)
        assert ip_addr, "ALB DNS does not resolve to an IP address."

    # -----------------------  storage / S3  ------------------------------ #
    def test_bucket_has_versioning(self, stack_outputs, aws_clients):
        """Primary S3 bucket must have versioning enabled."""
        bucket = stack_outputs["s3_primary_bucket"].split(":::")[-1]
        versioning = aws_clients["s3"].get_bucket_versioning(Bucket=bucket)
        assert versioning.get("Status") == "Enabled", "Bucket versioning not enabled."

    # -----------------------  database / RDS  ---------------------------- #
    def test_rds_endpoint_responds(self, stack_outputs):
        """
        RDS endpoint must start accepting TCP connections on port 5432
        within a reasonable time-out.
        """
        host = stack_outputs["rds_primary_endpoint"].split(":")[0]
        port = 5432

        def _can_connect() -> bool:
            try:
                sock = socket.create_connection((host, port), timeout=3)
                sock.close()
                return True
            except OSError:
                return False

        _wait_until(_can_connect, timeout=300, interval=15)

    # -----------------------  compliance / S3 TLS enforcement ------------ #
    def test_bucket_rejects_insecure_transport(self, stack_outputs):
        """
        The bucket policy must deny non-TLS requests.  We try an *http* presigned
        URL and expect it to fail with *AccessDenied*.
        """
        import requests
        bucket = stack_outputs["s3_primary_bucket"].split(":::")[-1]

        # Generate a presigned URL **without** https (forced scheme change).
        s3 = boto3.client("s3")
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": "nonexistent"},
            ExpiresIn=60,
        ).replace("https://", "http://")

        resp = requests.get(url, allow_redirects=False)
        assert resp.status_code in (403, 400), "Insecure request unexpectedly succeeded."
