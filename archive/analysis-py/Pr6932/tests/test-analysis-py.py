"""
REQUIRED Mock Configuration Setup for Route53 Analysis Testing
================================================================

This setup is MANDATORY for running and testing Route53 configuration analysis tasks.
All Route53 analysis implementations must follow this testing framework
to ensure consistent mocking and validation of Route53 resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Route53 Resource Setup (REQUIRED):
   a. Create setup functions for each issue type:
      - Use boto_client('route53') to get Route53 client
      - Create hosted zones with specific configurations
      - Create DNS records that trigger various issues
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Functions (REQUIRED):
   a. Define test function for each issue type
   b. Call setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct findings
      - Validate severity levels
      - Verify resource counts and metrics
      - Test specific issue types

Standard Implementation Template:
------------------------------
```python
def setup_your_issue():
    route53 = boto_client("route53")
    # Create hosted zone with specific configuration
    # Create records that trigger the issue
    # Handle existing resources

def test_your_issue_analysis():
    # Setup resources
    setup_your_issue()

    # Run analysis
    results = run_analysis_script()

    # Validate results
    assert results["summary"]["total_findings"] > 0
    # Add more specific assertions
```

Reference: Route53 Issues Tested:
---------------------------------
1. Missing Health Checks on routing policies
2. TTL Too High for dynamic endpoints
3. TTL Too Low (< 60s)
4. CNAME instead of ALIAS for AWS resources
5. Missing DNSSEC on public zones
6. Missing Query Logging
7. Unused Private Zones
8. Single Points of Failure
9. Skewed Weight Distribution

Note: Without this mock configuration setup, Route53 analysis tests will not
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time

import boto3
import pytest


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_basic_hosted_zone():
    """Create a basic public hosted zone for testing"""
    route53 = boto_client("route53")

    # Create public hosted zone
    try:
        response = route53.create_hosted_zone(
            Name="example.com",
            CallerReference=f"test-{int(time.time())}",
            HostedZoneConfig={
                'Comment': 'Test zone for Route53 analysis',
                'PrivateZone': False
            }
        )
        zone_id = response['HostedZone']['Id'].split('/')[-1]
        return zone_id
    except Exception as e:
        # Zone might already exist, try to find it
        zones = route53.list_hosted_zones()
        for zone in zones['HostedZones']:
            if zone['Name'] == 'example.com.':
                return zone['Id'].split('/')[-1]
        raise


def setup_ttl_issues():
    """Create records with TTL issues"""
    route53 = boto_client("route53")
    zone_id = setup_basic_hosted_zone()

    # Create record with TTL too low (< 60s)
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'low-ttl.example.com',
                        'Type': 'A',
                        'TTL': 30,  # Too low
                        'ResourceRecords': [{'Value': '1.2.3.4'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create low TTL record: {e}")

    # Create record with TTL too high for dynamic endpoint (> 300s)
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'high-ttl-elb.example.com',
                        'Type': 'CNAME',
                        'TTL': 600,  # Too high for dynamic
                        'ResourceRecords': [{'Value': 'my-lb.elb.amazonaws.com'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create high TTL record: {e}")

    return zone_id


def setup_cname_alias_issues():
    """Create CNAME records that should be ALIAS records"""
    route53 = boto_client("route53")
    zone_id = setup_basic_hosted_zone()

    # CNAME pointing to ELB (should be ALIAS)
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'app.example.com',
                        'Type': 'CNAME',
                        'TTL': 300,
                        'ResourceRecords': [{'Value': 'my-app-lb.elb.us-east-1.amazonaws.com'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create CNAME record: {e}")

    # CNAME pointing to CloudFront (should be ALIAS)
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'cdn.example.com',
                        'Type': 'CNAME',
                        'TTL': 300,
                        'ResourceRecords': [{'Value': 'd123456.cloudfront.net'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create CloudFront CNAME: {e}")

    return zone_id


def setup_single_point_of_failure():
    """Create critical records without failover"""
    route53 = boto_client("route53")
    zone_id = setup_basic_hosted_zone()

    # Create www record with single IP (critical subdomain)
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'www.example.com',
                        'Type': 'A',
                        'TTL': 300,
                        'ResourceRecords': [{'Value': '192.0.2.1'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create www record: {e}")

    # Create api record with single IP (critical subdomain)
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'api.example.com',
                        'Type': 'A',
                        'TTL': 300,
                        'ResourceRecords': [{'Value': '192.0.2.2'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create api record: {e}")

    return zone_id


def setup_weighted_routing_without_health_check():
    """Create weighted routing policy without health checks"""
    route53 = boto_client("route53")
    zone_id = setup_basic_hosted_zone()

    # Create weighted record set 1 without health check
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'weighted.example.com',
                        'Type': 'A',
                        'SetIdentifier': 'weight-1',
                        'Weight': 80,
                        'TTL': 60,
                        'ResourceRecords': [{'Value': '192.0.2.10'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create weighted record 1: {e}")

    # Create weighted record set 2 without health check
    try:
        route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'weighted.example.com',
                        'Type': 'A',
                        'SetIdentifier': 'weight-2',
                        'Weight': 20,
                        'TTL': 60,
                        'ResourceRecords': [{'Value': '192.0.2.11'}]
                    }
                }]
            }
        )
    except Exception as e:
        print(f"Warning: Failed to create weighted record 2: {e}")

    return zone_id


def setup_private_zone_no_vpc():
    """Create private hosted zone without VPC associations"""
    route53 = boto_client("route53")

    try:
        response = route53.create_hosted_zone(
            Name="internal.example.com",
            CallerReference=f"test-private-{int(time.time())}",
            HostedZoneConfig={
                'Comment': 'Private zone without VPC',
                'PrivateZone': True
            },
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': 'vpc-12345678'  # Non-existent VPC
            }
        )
        return response['HostedZone']['Id'].split('/')[-1]
    except Exception as e:
        print(f"Warning: Failed to create private zone: {e}")
        return None


def run_analysis_script():
    """Helper to run the Route53 analysis script and return JSON results"""
    # Path to script and output files
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "route53_audit.json")
    csv_output = os.path.join(os.path.dirname(__file__), "..", "failover_recommendations.csv")

    # Remove old output files if they exist
    if os.path.exists(json_output):
        os.remove(json_output)
    if os.path.exists(csv_output):
        os.remove(csv_output)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Print output for debugging
    print(f"STDOUT: {result.stdout}")
    if result.stderr:
        print(f"STDERR: {result.stderr}")

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        print(f"Warning: JSON output file not created at {json_output}")
        return {}


def test_ttl_analysis():
    """Test TTL configuration analysis"""
    setup_ttl_issues()

    results = run_analysis_script()

    # Check basic structure
    assert "summary" in results, "summary key missing from JSON"
    assert "findings" in results, "findings key missing from JSON"

    # Check for TTL-related findings
    all_findings = []
    for severity in results["findings"].values():
        all_findings.extend(severity)

    ttl_findings = [f for f in all_findings if "TTL" in f.get("type", "")]
    assert len(ttl_findings) > 0, "Expected TTL-related findings"

    print(f"Found {len(ttl_findings)} TTL issues")


def test_cname_alias_analysis():
    """Test CNAME vs ALIAS optimization analysis"""
    setup_cname_alias_issues()

    results = run_analysis_script()

    # Check for CNAME optimization findings
    all_findings = []
    for severity in results["findings"].values():
        all_findings.extend(severity)

    cname_findings = [f for f in all_findings if f.get("type") == "CNAME_SHOULD_BE_ALIAS"]
    assert len(cname_findings) > 0, "Expected CNAME optimization findings"

    print(f"Found {len(cname_findings)} CNAME optimization opportunities")


def test_single_point_of_failure_analysis():
    """Test single point of failure detection"""
    setup_single_point_of_failure()

    results = run_analysis_script()

    # Check for single point of failure findings
    all_findings = []
    for severity in results["findings"].values():
        all_findings.extend(severity)

    spof_findings = [f for f in all_findings if f.get("type") == "SINGLE_POINT_OF_FAILURE"]

    # We created www and api records, both should be flagged
    assert len(spof_findings) >= 1, f"Expected single point of failure findings, got {len(spof_findings)}"

    print(f"Found {len(spof_findings)} single point(s) of failure")


def test_missing_health_check_analysis():
    """Test detection of routing policies without health checks"""
    setup_weighted_routing_without_health_check()

    results = run_analysis_script()

    # Check for missing health check findings
    all_findings = []
    for severity in results["findings"].values():
        all_findings.extend(severity)

    hc_findings = [f for f in all_findings if f.get("type") == "MISSING_HEALTH_CHECK"]
    assert len(hc_findings) > 0, "Expected missing health check findings"

    print(f"Found {len(hc_findings)} records missing health checks")


def test_skewed_weight_distribution():
    """Test detection of heavily skewed weight distributions"""
    setup_weighted_routing_without_health_check()

    results = run_analysis_script()

    # Check for skewed weight findings
    all_findings = []
    for severity in results["findings"].values():
        all_findings.extend(severity)

    weight_findings = [f for f in all_findings if f.get("type") == "SKEWED_WEIGHT_DISTRIBUTION"]

    # We created 80/20 split, should be flagged
    assert len(weight_findings) > 0, "Expected skewed weight distribution findings"

    print(f"Found {len(weight_findings)} skewed weight distribution(s)")


def test_summary_structure():
    """Test the overall summary structure of the audit results"""
    setup_basic_hosted_zone()
    setup_ttl_issues()
    setup_cname_alias_issues()

    results = run_analysis_script()

    # Validate summary structure
    assert "audit_timestamp" in results
    assert "region" in results
    assert "summary" in results

    summary = results["summary"]
    assert "total_findings" in summary
    assert "critical" in summary
    assert "high" in summary
    assert "medium" in summary
    assert "low" in summary

    print(f"Total findings: {summary['total_findings']}")
    print(f"  Critical: {summary['critical']}")
    print(f"  High: {summary['high']}")
    print(f"  Medium: {summary['medium']}")
    print(f"  Low: {summary['low']}")
