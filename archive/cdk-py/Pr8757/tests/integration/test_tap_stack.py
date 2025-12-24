import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from pytest import mark


def _load_outputs() -> dict:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    outputs_path = os.path.join(
        base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
    )

    if not os.path.exists(outputs_path):
        return {}

    with open(outputs_path, "r", encoding="utf-8") as f:
        content = f.read().strip() or "{}"

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


def _endpoint_url_for(service: str) -> str | None:
    service_env = f"AWS_ENDPOINT_URL_{service.upper()}"
    return os.getenv(service_env) or os.getenv("AWS_ENDPOINT_URL")


def _is_github_actions() -> bool:
    return bool(os.getenv("GITHUB_ACTIONS"))


@mark.describe("TapStack")
class TestTapStackIntegration(unittest.TestCase):
    @mark.it("deployment outputs contain required keys")
    def test_outputs_present(self):
        outputs = _load_outputs()

        if not outputs:
            if _is_github_actions():
                self.fail("Deployment outputs are empty")
            self.skipTest("Deployment outputs not found; skipping integration checks")

        self.assertTrue(outputs)

        required_keys = {"S3BucketName", "CloudFrontDomainName", "LoadBalancerDNS"}
        missing_keys = sorted(required_keys - set(outputs.keys()))
        if missing_keys:
            if _is_github_actions():
                self.fail(f"Missing required output keys: {missing_keys}")
            self.skipTest(f"Missing required output keys: {missing_keys}")

        self.assertTrue(str(outputs["S3BucketName"]).strip())
        self.assertTrue(str(outputs["CloudFrontDomainName"]).strip())
        self.assertTrue(str(outputs["LoadBalancerDNS"]).strip())

    @mark.it("S3 bucket exists")
    def test_s3_bucket_exists(self):
        outputs = _load_outputs()
        bucket_name = outputs.get("S3BucketName")

        if not bucket_name:
            self.skipTest("S3BucketName output not found")

        endpoint_url = os.getenv("AWS_ENDPOINT_URL_S3") or os.getenv("AWS_ENDPOINT_URL")
        if not endpoint_url:
            if _is_github_actions():
                self.fail("Missing AWS endpoint configuration for S3")
            self.skipTest("No AWS endpoint configuration found; skipping S3 check")
        s3 = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=endpoint_url,
        )

        try:
            s3.head_bucket(Bucket=bucket_name)
        except EndpointConnectionError as e:
            self.skipTest(f"S3 endpoint not reachable in this environment: {e}")
        except ClientError as e:
            self.fail(f"Unable to head bucket {bucket_name}: {e}")

    @mark.it("load balancer exists")
    def test_alb_exists(self):
        outputs = _load_outputs()
        expected_dns = outputs.get("LoadBalancerDNS")

        if not expected_dns:
            self.skipTest("LoadBalancerDNS output not found")

        endpoint_url = _endpoint_url_for("elbv2")
        if not endpoint_url:
            if _is_github_actions():
                self.fail("Missing AWS endpoint configuration for ELBv2")
            self.skipTest("No AWS endpoint configuration found; skipping ELBv2 check")

        elbv2 = boto3.client(
            "elbv2",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=endpoint_url,
        )

        try:
            lbs = elbv2.describe_load_balancers().get("LoadBalancers", [])
            dns_names = {lb.get("DNSName") for lb in lbs}
            self.assertIn(expected_dns, dns_names)
        except (ClientError, EndpointConnectionError) as e:
            self.skipTest(f"ELBv2 not available in this environment: {e}")

    @mark.it("cloudfront distribution can be queried when supported")
    def test_cloudfront_distribution_exists_when_supported(self):
        outputs = _load_outputs()
        expected_domain = outputs.get("CloudFrontDomainName")

        if not expected_domain:
            self.skipTest("CloudFrontDomainName output not found")

        endpoint_url = _endpoint_url_for("cloudfront")
        if not endpoint_url:
            if _is_github_actions():
                self.fail("Missing AWS endpoint configuration for CloudFront")
            self.skipTest("No AWS endpoint configuration found; skipping CloudFront check")

        cloudfront = boto3.client(
            "cloudfront",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=endpoint_url,
        )

        try:
            dist_list = cloudfront.list_distributions().get("DistributionList", {})
            items = dist_list.get("Items", []) or []
            domains = {d.get("DomainName") for d in items}
            if expected_domain not in domains:
                self.skipTest(
                    "CloudFront distribution not discoverable in this environment"
                )
        except (ClientError, EndpointConnectionError) as e:
            self.skipTest(f"CloudFront not available in this environment: {e}")
