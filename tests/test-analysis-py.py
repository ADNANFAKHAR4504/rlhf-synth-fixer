"""
CloudFront Infrastructure Analysis Test Suite
============================================

This suite provisions mock CloudFront distributions using moto and validates
that lib/analyse.py performs the end-to-end optimization workflow.

Required steps for every analysis implementation:
1. Ensure boto3 clients use AWS_ENDPOINT_URL, AWS_DEFAULT_REGION,
   AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY from the environment.
2. Provision mock resources with boto_client(service_name) helpers.
3. Use run_analysis_script() to execute lib/analyse.py and parse the generated
   cloudfront_optimization.json output.
4. Validate findings, summaries, and console output as shown in these tests.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import boto3
import pytest

REQUIRED_ISSUES = {
    "Low Cache Hit Ratio",
    "No Origin Shield",
    "No Compression",
    "Inadequate TTL",
    "Missing Security Headers",
    "HTTP Origin",
    "No Origin Failover",
    "Inefficient Price Class",
    "No WAF Integration",
    "Logging Disabled",
    "No Lambda@Edge",
    "Insecure Viewer Protocol Policy",
    "Forward All Cookies",
    "No Custom Error Pages",
}

ROOT_DIR = Path(__file__).resolve().parents[1]


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def custom_origin(origin_id: str, domain: str, protocol: str = "https-only") -> Dict:
    return {
        "Id": origin_id,
        "DomainName": domain,
        "OriginPath": "",
        "CustomOriginConfig": {
            "HTTPPort": 80,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": protocol,
            "OriginSslProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]},
            "OriginReadTimeout": 30,
            "OriginKeepaliveTimeout": 5,
        },
        "ConnectionAttempts": 3,
        "ConnectionTimeout": 10,
        "OriginShield": {"Enabled": False},
    }


def make_base_config(label: str, comment: str, logging_enabled: bool = True) -> Dict:
    origin_id = f"{label}-origin"
    return {
        "CallerReference": f"{label}-{uuid.uuid4().hex}",
        "Comment": comment,
        "Enabled": True,
        "Aliases": {"Quantity": 0, "Items": []},
        "DefaultRootObject": "",
        "Origins": {
            "Quantity": 1,
            "Items": [custom_origin(origin_id, f"{label}.example.com")],
        },
        "OriginGroups": {"Quantity": 0, "Items": []},
        "DefaultCacheBehavior": {
            "TargetOriginId": origin_id,
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"],
                "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
            },
            "TrustedSigners": {"Enabled": False, "Quantity": 0},
            "TrustedKeyGroups": {"Enabled": False, "Quantity": 0},
            "ForwardedValues": {
                "QueryString": False,
                "Cookies": {
                    "Forward": "none",
                    "WhitelistedNames": {"Quantity": 0, "Items": []},
                },
                "Headers": {"Quantity": 0, "Items": []},
                "QueryStringCacheKeys": {"Quantity": 0, "Items": []},
            },
            "Compress": True,
            "DefaultTTL": 86400,
            "MinTTL": 0,
            "FieldLevelEncryptionId": "",
            "RealtimeLogConfigArn": "",
            "CachePolicyId": "",
            "OriginRequestPolicyId": "",
            "ResponseHeadersPolicyId": "secure-policy",
            "LambdaFunctionAssociations": {
                "Quantity": 1,
                "Items": [
                    {
                        "LambdaFunctionARN": "arn:aws:lambda:us-east-1:123456789012:function:edge-logic",
                        "EventType": "viewer-request",
                        "IncludeBody": False,
                    }
                ],
            },
            "FunctionAssociations": {"Quantity": 0, "Items": []},
        },
        "CacheBehaviors": {"Quantity": 0, "Items": []},
        "CustomErrorResponses": {
            "Quantity": 1,
            "Items": [
                {
                    "ErrorCode": 404,
                    "ResponsePagePath": "/404.html",
                    "ResponseCode": "404",
                    "ErrorCachingMinTTL": 60,
                }
            ],
        },
        "Logging": {
            "Enabled": logging_enabled,
            "IncludeCookies": False,
            "Bucket": "cf-logs.s3.amazonaws.com",
            "Prefix": f"{label}/",
        },
        "PriceClass": "PriceClass_100",
        "WebACLId": "arn:aws:wafv2:us-east-1:123456789012:global/webacl/test/abc123",
        "ViewerCertificate": {"CloudFrontDefaultCertificate": True},
        "Restrictions": {"GeoRestriction": {"RestrictionType": "none", "Quantity": 0}},
        "HttpVersion": "http2",
        "IsIPV6Enabled": True,
    }


def deep_update(target: Dict, overrides: Dict) -> Dict:
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            deep_update(target[key], value)
        else:
            target[key] = value
    return target


def normalize_distribution_config(config: Dict) -> None:
    if "Origins" in config and isinstance(config["Origins"].get("Items"), list):
        config["Origins"]["Quantity"] = len(config["Origins"]["Items"])
    if "CacheBehaviors" in config and isinstance(config["CacheBehaviors"].get("Items"), list):
        config["CacheBehaviors"]["Quantity"] = len(config["CacheBehaviors"]["Items"])
    if "CustomErrorResponses" in config and isinstance(config["CustomErrorResponses"].get("Items"), list):
        config["CustomErrorResponses"]["Quantity"] = len(config["CustomErrorResponses"]["Items"])
    default_behavior = config.get("DefaultCacheBehavior", {})
    lfa = default_behavior.get("LambdaFunctionAssociations")
    if isinstance(lfa, dict) and isinstance(lfa.get("Items"), list):
        lfa["Quantity"] = len(lfa["Items"])


def publish_metrics(
    cloudwatch,
    distribution_id: str,
    *,
    cache_hit: float,
    requests: int,
    origin_requests: int,
    data_transfer_gb: float,
    regional_requests: Optional[Dict[str, int]] = None,
) -> None:
    timestamp = datetime.now(timezone.utc)
    bytes_downloaded = data_transfer_gb * (1024 ** 3)
    base_dimensions = [
        {"Name": "DistributionId", "Value": distribution_id},
        {"Name": "Region", "Value": "Global"},
    ]
    cloudwatch.put_metric_data(
        Namespace="AWS/CloudFront",
        MetricData=[
            {
                "MetricName": "CacheHitRate",
                "Dimensions": base_dimensions,
                "Timestamp": timestamp,
                "Value": cache_hit,
                "Unit": "Percent",
            },
            {
                "MetricName": "Requests",
                "Dimensions": base_dimensions,
                "Timestamp": timestamp,
                "Value": requests,
                "Unit": "Count",
            },
            {
                "MetricName": "OriginRequests",
                "Dimensions": base_dimensions,
                "Timestamp": timestamp,
                "Value": origin_requests,
                "Unit": "Count",
            },
            {
                "MetricName": "BytesDownloaded",
                "Dimensions": base_dimensions,
                "Timestamp": timestamp,
                "Value": bytes_downloaded,
                "Unit": "Bytes",
            },
        ],
    )
    if regional_requests:
        for region, value in regional_requests.items():
            cloudwatch.put_metric_data(
                Namespace="AWS/CloudFront",
                MetricData=[
                    {
                        "MetricName": "Requests",
                        "Dimensions": [
                            {"Name": "DistributionId", "Value": distribution_id},
                            {"Name": "Region", "Value": region},
                        ],
                        "Timestamp": timestamp,
                        "Value": value,
                        "Unit": "Count",
                    }
                ],
            )


def setup_cloudfront_environment() -> None:
    cloudfront = boto_client("cloudfront")
    cloudwatch = boto_client("cloudwatch")
    scenarios: List[Dict] = [
        {
            "name": "healthy",
            "comment": "baseline production",
            "cache_hit": 92,
            "requests": 950_000,
            "origin_requests": 80_000,
            "bytes_gb": 320,
            "tags": [{"Key": "Environment", "Value": "prod"}],
        },
        {
            "name": "low-cache",
            "comment": "cache tuning",
            "cache_hit": 60,
            "requests": 500_000,
            "origin_requests": 200_000,
            "bytes_gb": 180,
        },
        {
            "name": "origin-shield-needed",
            "comment": "multi origin",
            "cache_hit": 78,
            "overrides": {
                "Origins": {
                    "Items": [
                        custom_origin("multi-primary", "primary.multi.example.com"),
                        custom_origin("multi-secondary", "secondary.multi.example.com"),
                    ]
                },
                "DefaultCacheBehavior": {"TargetOriginId": "multi-primary"},
            },
        },
        {
            "name": "no-compression",
            "comment": "compression disabled",
            "overrides": {"DefaultCacheBehavior": {"Compress": False}},
        },
        {
            "name": "low-ttl",
            "comment": "ttl too low",
            "overrides": {"DefaultCacheBehavior": {"DefaultTTL": 600}},
        },
        {
            "name": "missing-headers",
            "comment": "security headers missing",
            "overrides": {"DefaultCacheBehavior": {"ResponseHeadersPolicyId": ""}},
        },
        {
            "name": "http-origin",
            "comment": "legacy http origin",
            "overrides": {
                "Origins": {
                    "Items": [custom_origin("http-primary", "legacy-http.example.com", "http-only")]
                },
                "DefaultCacheBehavior": {"TargetOriginId": "http-primary"},
            },
        },
        {
            "name": "price-class-global",
            "comment": "global price class",
            "overrides": {"PriceClass": "PriceClass_All"},
            "regional_requests": {"NA": 720_000, "EU": 150_000, "AP": 5_000},
        },
        {
            "name": "no-waf",
            "comment": "missing waf",
            "overrides": {"WebACLId": ""},
        },
        {
            "name": "no-logging",
            "comment": "logging disabled",
            "logging_enabled": False,
        },
        {
            "name": "no-lambda",
            "comment": "dynamic without lambda",
            "overrides": {
                "DefaultCacheBehavior": {
                    "ForwardedValues": {"QueryString": True},
                    "LambdaFunctionAssociations": {"Items": []},
                }
            },
        },
        {
            "name": "insecure-viewer",
            "comment": "http allowed",
            "overrides": {"DefaultCacheBehavior": {"ViewerProtocolPolicy": "allow-all"}},
        },
        {
            "name": "forward-cookies",
            "comment": "forward all cookies",
            "overrides": {
                "DefaultCacheBehavior": {
                    "ForwardedValues": {
                        "Cookies": {
                            "Forward": "all",
                            "WhitelistedNames": {"Quantity": 0, "Items": []},
                        }
                    }
                }
            },
        },
        {
            "name": "no-custom-errors",
            "comment": "defaults error pages",
            "overrides": {"CustomErrorResponses": {"Items": []}},
        },
        {
            "name": "excluded",
            "comment": "excluded from analysis",
            "tags": [{"Key": "ExcludeFromAnalysis", "Value": "true"}],
        },
        {
            "name": "internal",
            "comment": "internal distribution",
            "tags": [{"Key": "Type", "Value": "internal-only"}],
        },
        {
            "name": "single-origin",
            "comment": "no failover",
        },
    ]

    for scenario in scenarios:
        config = make_base_config(
            scenario["name"],
            scenario.get("comment", scenario["name"]),
            logging_enabled=scenario.get("logging_enabled", True),
        )
        overrides = scenario.get("overrides")
        if overrides:
            deep_update(config, overrides)
        normalize_distribution_config(config)
        tags = scenario.get("tags")
        if tags:
            response = cloudfront.create_distribution_with_tags(
                DistributionConfigWithTags={
                    "DistributionConfig": config,
                    "Tags": {"Items": tags},
                }
            )
        else:
            response = cloudfront.create_distribution(DistributionConfig=config)
        dist_id = response["Distribution"]["Id"]
        publish_metrics(
            cloudwatch,
            dist_id,
            cache_hit=scenario.get("cache_hit", 85),
            requests=scenario.get("requests", 650_000),
            origin_requests=scenario.get("origin_requests", 150_000),
            data_transfer_gb=scenario.get("bytes_gb", 250),
            regional_requests=scenario.get("regional_requests"),
        )


def run_analysis_script():
    script = ROOT_DIR / "lib" / "analyse.py"
    json_path = ROOT_DIR / "cloudfront_optimization.json"
    html_path = ROOT_DIR / "cache_efficiency_report.html"
    csv_path = ROOT_DIR / "cdn_optimization_roadmap.csv"
    for path in (json_path, html_path, csv_path):
        if path.exists():
            path.unlink()
    env = os.environ.copy()
    env.setdefault("AWS_DEFAULT_REGION", "us-east-1")

    # Run with coverage if available
    cmd = [sys.executable]
    if os.environ.get("COVERAGE_RUN"):
        cmd.extend(["-m", "coverage", "run", "--source=lib", "--parallel-mode"])
    cmd.append(str(script))

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(f"analysis script failed: {result.stderr}\n{result.stdout}")
    data = json.loads(json_path.read_text()) if json_path.exists() else {}
    return data, result.stdout


@pytest.fixture(scope="module")
def analysis_output():
    setup_cloudfront_environment()
    results, stdout = run_analysis_script()
    assert results, "cloudfront_optimization.json was not created"
    return {"results": results, "stdout": stdout}


def test_reports_and_summary(analysis_output):
    results = analysis_output["results"]
    summary = results["recommendations_summary"]
    assert summary["distributions_analyzed"] == 15
    assert summary["total_potential_savings"] >= 0
    assert (ROOT_DIR / "cloudfront_optimization.json").exists()
    assert (ROOT_DIR / "cache_efficiency_report.html").exists()
    assert (ROOT_DIR / "cdn_optimization_roadmap.csv").exists()


def test_issue_coverage(analysis_output):
    distributions = analysis_output["results"]["distributions"]
    issue_types = {issue["type"] for dist in distributions for issue in dist["issues"]}
    missing = REQUIRED_ISSUES - issue_types
    assert not missing, f"Missing issue coverage for: {sorted(missing)}"


def test_console_output_tabular(analysis_output):
    stdout = analysis_output["stdout"]
    assert "CloudFront Optimization Summary" in stdout
    assert "| Distribution   | Domain" in stdout
    assert "Total Potential Savings" in stdout
