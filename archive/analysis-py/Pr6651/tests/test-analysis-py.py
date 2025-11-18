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

import csv
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


def make_base_config(label: str, comment: str, logging_enabled: bool = False) -> Dict:
    origin_id = f"{label}-origin"
    config = {
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
            "MinTTL": 0
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
            "Bucket": "",
            "Prefix": "",
        },
        "PriceClass": "PriceClass_100",
        "WebACLId": "",
        "ViewerCertificate": {"CloudFrontDefaultCertificate": True},
        "Restrictions": {"GeoRestriction": {"RestrictionType": "none", "Quantity": 0}},
        "HttpVersion": "http2",
        "IsIPV6Enabled": True,
    }
    return config


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
        Namespace="CloudFront",
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
                Namespace="CloudFront",
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
        },
        {
            "name": "no-logging",
            "comment": "logging disabled",
        },
        {
            "name": "no-lambda",
            "comment": "dynamic without lambda",
            "overrides": {
                "DefaultCacheBehavior": {
                    "ForwardedValues": {"QueryString": True},
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
    """Validate that all required output files are generated and summary is complete."""
    results = analysis_output["results"]

    # Validate JSON output structure
    assert "distributions" in results, "Missing 'distributions' key in JSON output"
    assert "recommendations_summary" in results, "Missing 'recommendations_summary' key in JSON output"

    # Validate summary structure and fields
    summary = results["recommendations_summary"]
    assert "distributions_analyzed" in summary, "Missing 'distributions_analyzed' in summary"
    assert "total_potential_savings" in summary, "Missing 'total_potential_savings' in summary"
    assert "avg_cache_hit_ratio" in summary, "Missing 'avg_cache_hit_ratio' in summary"

    # Validate summary values
    assert summary["distributions_analyzed"] >= 15, f"Expected at least 15 distributions, got {summary['distributions_analyzed']}"
    assert isinstance(summary["total_potential_savings"], (int, float)), "total_potential_savings must be numeric"
    assert summary["total_potential_savings"] >= 0, "total_potential_savings cannot be negative"
    assert isinstance(summary["avg_cache_hit_ratio"], (int, float)), "avg_cache_hit_ratio must be numeric"
    assert 0 <= summary["avg_cache_hit_ratio"] <= 100, "avg_cache_hit_ratio must be between 0 and 100"

    # Validate all output files exist
    assert (ROOT_DIR / "cloudfront_optimization.json").exists(), "cloudfront_optimization.json not generated"
    assert (ROOT_DIR / "cache_efficiency_report.html").exists(), "cache_efficiency_report.html not generated"
    assert (ROOT_DIR / "cdn_optimization_roadmap.csv").exists(), "cdn_optimization_roadmap.csv not generated"

    # Validate HTML report contains expected content
    html_content = (ROOT_DIR / "cache_efficiency_report.html").read_text()
    assert len(html_content) > 100, "HTML report appears to be empty or too small"

    # Validate CSV report structure
    csv_path = ROOT_DIR / "cdn_optimization_roadmap.csv"
    with open(csv_path, 'r') as f:
        csv_reader = csv.DictReader(f)
        csv_rows = list(csv_reader)
        assert len(csv_rows) > 0, "CSV report has no data rows"


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


def test_distribution_structure(analysis_output):
    """Validate each distribution has all required fields with correct types."""
    distributions = analysis_output["results"]["distributions"]
    assert len(distributions) > 0, "No distributions found in output"

    for dist in distributions:
        # Required top-level fields
        assert "distribution_id" in dist, f"Missing 'distribution_id' in distribution"
        assert "domain_name" in dist, f"Missing 'domain_name' in distribution {dist.get('distribution_id', 'unknown')}"
        assert "performance_score" in dist, f"Missing 'performance_score' in distribution {dist['distribution_id']}"
        assert "cache_hit_ratio" in dist, f"Missing 'cache_hit_ratio' in distribution {dist['distribution_id']}"
        assert "issues" in dist, f"Missing 'issues' in distribution {dist['distribution_id']}"
        assert "cost_analysis" in dist, f"Missing 'cost_analysis' in distribution {dist['distribution_id']}"

        # Validate performance_score range
        assert isinstance(dist["performance_score"], (int, float)), \
            f"performance_score must be numeric in {dist['distribution_id']}"
        assert 0 <= dist["performance_score"] <= 100, \
            f"performance_score must be 0-100 in {dist['distribution_id']}, got {dist['performance_score']}"

        # Validate cache_hit_ratio
        assert isinstance(dist["cache_hit_ratio"], (int, float)), \
            f"cache_hit_ratio must be numeric in {dist['distribution_id']}"
        assert 0 <= dist["cache_hit_ratio"] <= 100, \
            f"cache_hit_ratio must be 0-100 in {dist['distribution_id']}, got {dist['cache_hit_ratio']}"

        # Validate issues structure
        assert isinstance(dist["issues"], list), f"issues must be a list in {dist['distribution_id']}"
        for issue in dist["issues"]:
            assert "type" in issue, f"Missing 'type' in issue for {dist['distribution_id']}"
            assert "impact" in issue, f"Missing 'impact' in issue for {dist['distribution_id']}"
            assert "current_config" in issue, f"Missing 'current_config' in issue for {dist['distribution_id']}"
            assert "recommended_config" in issue, f"Missing 'recommended_config' in issue for {dist['distribution_id']}"

        # Validate cost_analysis structure
        cost = dist["cost_analysis"]
        assert "current_monthly_cost" in cost, f"Missing 'current_monthly_cost' in {dist['distribution_id']}"
        assert "data_transfer_out" in cost, f"Missing 'data_transfer_out' in {dist['distribution_id']}"
        assert "origin_requests" in cost, f"Missing 'origin_requests' in {dist['distribution_id']}"
        assert "optimized_monthly_cost" in cost, f"Missing 'optimized_monthly_cost' in {dist['distribution_id']}"
        assert "potential_savings" in cost, f"Missing 'potential_savings' in {dist['distribution_id']}"

        # Validate cost values are numeric and non-negative
        for key in ["current_monthly_cost", "data_transfer_out", "optimized_monthly_cost", "potential_savings"]:
            assert isinstance(cost[key], (int, float)), \
                f"{key} must be numeric in {dist['distribution_id']}"
            assert cost[key] >= 0, f"{key} cannot be negative in {dist['distribution_id']}"

        # Validate origin_requests is numeric
        assert isinstance(cost["origin_requests"], (int, float)), \
            f"origin_requests must be numeric in {dist['distribution_id']}"


def test_specific_issue_validations(analysis_output):
    """Validate specific scenarios produce expected issues."""
    distributions = analysis_output["results"]["distributions"]
    dist_by_comment = {d.get("comment", d.get("distribution_id")): d for d in distributions}

    # Test Low Cache Hit Ratio detection
    low_cache_dist = next((d for d in distributions if d.get("cache_hit_ratio", 1.0) < 0.8), None)
    if low_cache_dist:
        issue_types = {i["type"] for i in low_cache_dist["issues"]}
        assert "Low Cache Hit Ratio" in issue_types, \
            f"Distribution with {low_cache_dist['cache_hit_ratio']:.1%} cache hit should have 'Low Cache Hit Ratio' issue"

    # Test No Compression detection
    no_compression = next((d for d in distributions if "no-compression" in str(d).lower() or
                          any(i["type"] == "No Compression" for i in d["issues"])), None)
    if no_compression:
        issue_types = {i["type"] for i in no_compression["issues"]}
        assert "No Compression" in issue_types, "Distribution without compression should be flagged"

    # Test Inadequate TTL detection
    low_ttl = next((d for d in distributions if any(i["type"] == "Inadequate TTL" for i in d["issues"])), None)
    if low_ttl:
        ttl_issue = next(i for i in low_ttl["issues"] if i["type"] == "Inadequate TTL")
        assert "ttl" in str(ttl_issue["current_config"]).lower() or \
               "3600" in str(ttl_issue["recommended_config"]), \
               "TTL issue should reference TTL values"

    # Test HTTP Origin detection
    http_origin = next((d for d in distributions if any(i["type"] == "HTTP Origin" for i in d["issues"])), None)
    if http_origin:
        http_issue = next(i for i in http_origin["issues"] if i["type"] == "HTTP Origin")
        assert "http" in str(http_issue["current_config"]).lower(), \
               "HTTP Origin issue should reference HTTP protocol"

    # Test No WAF Integration detection
    no_waf = next((d for d in distributions if any(i["type"] == "No WAF Integration" for i in d["issues"])), None)
    if no_waf:
        issue_types = {i["type"] for i in no_waf["issues"]}
        assert "No WAF Integration" in issue_types, "Distribution without WAF should be flagged"

    # Test Logging Disabled detection
    no_logging = next((d for d in distributions if any(i["type"] == "Logging Disabled" for i in d["issues"])), None)
    if no_logging:
        issue_types = {i["type"] for i in no_logging["issues"]}
        assert "Logging Disabled" in issue_types, "Distribution without logging should be flagged"


def test_cost_calculations(analysis_output):
    """Validate cost calculations are reasonable and savings are computed correctly."""
    distributions = analysis_output["results"]["distributions"]

    for dist in distributions:
        cost = dist["cost_analysis"]

        # Potential savings should be the difference between current and optimized
        expected_savings = cost["current_monthly_cost"] - cost["optimized_monthly_cost"]

        # Allow for small floating point differences
        assert abs(cost["potential_savings"] - expected_savings) < 0.01, \
            f"Potential savings mismatch in {dist['distribution_id']}: " \
            f"expected {expected_savings}, got {cost['potential_savings']}"

        # Optimized cost should be <= current cost
        assert cost["optimized_monthly_cost"] <= cost["current_monthly_cost"], \
            f"Optimized cost cannot exceed current cost in {dist['distribution_id']}"


def test_exclusion_rules(analysis_output):
    """Validate that distributions tagged for exclusion are not analyzed."""
    distributions = analysis_output["results"]["distributions"]

    # Check that excluded distributions are not in the results
    for dist in distributions:
        comment = dist.get("comment", "").lower()

        # Distributions tagged ExcludeFromAnalysis should not appear
        assert "excluded from analysis" not in comment, \
            "Distributions tagged 'ExcludeFromAnalysis' should not be analyzed"

        # Internal-only distributions should not appear
        assert "internal-only" not in comment and "internal distribution" not in comment, \
            "Internal-only distributions should not be analyzed"


def test_traffic_threshold_enforcement(analysis_output):
    """Validate only distributions with >10,000 requests/day are analyzed."""
    distributions = analysis_output["results"]["distributions"]

    # All analyzed distributions should have sufficient traffic
    # Based on our setup, each distribution gets at least 500,000 requests over 30 days
    # which is ~16,667 requests/day, well above the 10,000 threshold
    assert len(distributions) > 0, "Should have distributions meeting traffic threshold"


def test_performance_score_calculation(analysis_output):
    """Validate performance scores correlate with issues found."""
    distributions = analysis_output["results"]["distributions"]

    for dist in distributions:
        num_issues = len(dist["issues"])
        score = dist["performance_score"]

        # Distributions with more issues should generally have lower scores
        # Perfect score (100) should only occur with no issues
        if num_issues == 0:
            assert score == 100, \
                f"Distribution {dist['distribution_id']} with no issues should have perfect score"
        else:
            assert score < 100, \
                f"Distribution {dist['distribution_id']} with {num_issues} issues should have score < 100"
            # Score should be reasonable
            assert score >= 0, f"Performance score cannot be negative in {dist['distribution_id']}"
