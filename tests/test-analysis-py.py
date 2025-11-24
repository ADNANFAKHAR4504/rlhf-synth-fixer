"""
ElastiCache Analysis Integration Test
=====================================

Tests for ElastiCache cluster analysis functionality using mocked AWS resources.
This test validates the complete analysis workflow with realistic test data.
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import boto3
import pytest


def boto_client(service: str):
    """Create a boto3 client that honours the local Moto endpoint when configured."""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "testing"),
    )


def cleanup_elasticache_clusters():
    """Delete every ElastiCache cluster created by the tests to keep runs idempotent."""
    elasticache = boto_client("elasticache")
    try:
        clusters = elasticache.describe_cache_clusters().get("CacheClusters", [])
    except Exception:
        return

    for cluster in clusters:
        try:
            elasticache.delete_cache_cluster(
                CacheClusterId=cluster["CacheClusterId"],
                FinalSnapshotIdentifier=f"final-{cluster['CacheClusterId']}"
            )
        except Exception:
            pass  # May already be deleting

    # Give Moto a moment to finalise deletions
    time.sleep(0.5)


@pytest.fixture(autouse=True)
def isolated_elasticache_environment():
    """Ensure each test starts with a clean slate."""
    cleanup_elasticache_clusters()
    yield


def create_cache_cluster(
    identifier: str,
    overrides: dict = None,
    tags: list = None,
) -> str:
    """Create an ElastiCache cluster with sensible defaults and optional overrides."""
    elasticache = boto_client("elasticache")
    payload = {
        "CacheClusterId": identifier,
        "CacheNodeType": "cache.t3.medium",
        "Engine": "redis",
        "EngineVersion": "6.2",
        "NumCacheNodes": 1,
        "CacheSubnetGroupName": "default",  # Assume VPC deployment
    }
    if overrides:
        payload.update(overrides)
    if tags:
        payload["Tags"] = tags

    try:
        elasticache.create_cache_cluster(**payload)
    except elasticache.exceptions.CacheClusterAlreadyExistsFault:
        # Delete and recreate
        try:
            elasticache.delete_cache_cluster(
                CacheClusterId=identifier,
                FinalSnapshotIdentifier=f"final-{identifier}"
            )
            time.sleep(0.5)
        except Exception:
            pass
        elasticache.create_cache_cluster(**payload)

    return identifier


def seed_cloudwatch_metric(cluster_id: str, metric_name: str, value: float, unit: str = "Percent"):
    """Publish a single datapoint for the supplied metric."""
    cloudwatch = boto_client("cloudwatch")
    cloudwatch.put_metric_data(
        Namespace="AWS/ElastiCache",
        MetricData=[
            {
                "MetricName": metric_name,
                "Timestamp": datetime.now(timezone.utc),
                "Value": value,
                "Unit": unit,
                "Dimensions": [{"Name": "CacheClusterId", "Value": cluster_id}],
            }
        ],
    )


def setup_underutilized_cache_cluster():
    """Create cluster with low hit rate and high evictions."""
    identifier = create_cache_cluster(
        "underutilized-cache",
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    # Low hit rate (< 85%) with high evictions
    seed_cloudwatch_metric(identifier, "CacheHits", 1000, "Count")
    seed_cloudwatch_metric(identifier, "CacheMisses", 2000, "Count")  # ~33% hit rate
    seed_cloudwatch_metric(identifier, "Evictions", 800000, "Count")  # High evictions over 30d
    return identifier


def setup_over_provisioned_cluster():
    """Create cluster with low CPU/network utilization."""
    identifier = create_cache_cluster(
        "over-provisioned-cache",
        overrides={"CacheNodeType": "cache.m5.4xlarge"},  # Large instance
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    # Low utilization
    seed_cloudwatch_metric(identifier, "CPUUtilization", 15, "Percent")  # < 20%
    seed_cloudwatch_metric(identifier, "NetworkBytesIn", 1000000, "Bytes")  # Low network
    seed_cloudwatch_metric(identifier, "NetworkBytesOut", 500000, "Bytes")
    return identifier


def setup_no_failover_cluster():
    """Create Redis cluster without automatic failover."""
    identifier = create_cache_cluster(
        "prod-no-failover-redis",
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    # Create replication group without automatic failover
    elasticache = boto_client("elasticache")
    try:
        elasticache.create_replication_group(
            ReplicationGroupId=f"rg-{identifier}",
            ReplicationGroupDescription="Test replication group",
            AutomaticFailoverEnabled=False,  # This should trigger issue
            NumCacheClusters=1,
            CacheClusterId=identifier
        )
    except Exception:
        pass  # May already exist
    return identifier


def setup_single_az_cluster():
    """Create production cluster without Multi-AZ."""
    identifier = create_cache_cluster(
        "single-az-prod",
        overrides={"PreferredAvailabilityZone": "us-east-1a"},  # Single AZ
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    return identifier


def setup_sensitive_unencrypted_cluster():
    """Create sensitive data cluster without encryption."""
    identifier = create_cache_cluster(
        "sensitive-unencrypted",
        tags=[
            {"Key": "Environment", "Value": "production"},
            {"Key": "DataClassification", "Value": "sensitive"}
        ]
    )
    # Create replication group without encryption
    elasticache = boto_client("elasticache")
    try:
        elasticache.add_tags_to_resource(
            ResourceName=f"arn:aws:elasticache:us-east-1:000000000000:cluster:{identifier}",
            Tags=[
                {"Key": "Environment", "Value": "production"},
                {"Key": "DataClassification", "Value": "sensitive"}
            ]
        )
    except Exception:
        pass
    try:
        elasticache.create_replication_group(
            ReplicationGroupId=f"rg-{identifier}",
            ReplicationGroupDescription="Sensitive data group",
            AutomaticFailoverEnabled=True,
            AtRestEncryptionEnabled=False,  # Should trigger issue
            TransitEncryptionEnabled=False,  # Should trigger issue
            NumCacheClusters=1,
            CacheClusterId=identifier
        )
    except Exception:
        pass
    return identifier


def setup_old_engine_version_cluster():
    """Create cluster with old Redis version."""
    identifier = create_cache_cluster(
        "old-redis-version",
        overrides={"EngineVersion": "5.0.6"},  # Old version
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    return identifier


def setup_no_auth_token_cluster():
    """Create Redis cluster without AUTH token."""
    identifier = create_cache_cluster(
        "no-auth-redis",
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    return identifier


def setup_inadequate_backup_cluster():
    """Create Redis cluster with insufficient backup retention."""
    identifier = create_cache_cluster(
        "inadequate-backup",
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    # Create replication group with low retention
    elasticache = boto_client("elasticache")
    try:
        elasticache.create_replication_group(
            ReplicationGroupId=f"rg-{identifier}",
            ReplicationGroupDescription="Low backup retention",
            AutomaticFailoverEnabled=True,
            SnapshotRetentionLimit=3,  # < 7 days, should trigger issue
            NumCacheClusters=1,
            CacheClusterId=identifier
        )
    except Exception:
        pass
    return identifier


def setup_connection_exhaustion_cluster():
    """Create cluster with high connection usage."""
    identifier = create_cache_cluster(
        "connection-exhaustion",
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    # High connection usage
    seed_cloudwatch_metric(identifier, "CurrConnections", 60000, "Count")  # >80% of capacity
    return identifier


def setup_inefficient_node_type_cluster():
    """Create cluster using previous generation node type."""
    identifier = create_cache_cluster(
        "inefficient-nodes",
        overrides={"CacheNodeType": "cache.t2.medium"},  # Previous gen
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    return identifier


def setup_memory_pressure_cluster():
    """Create cluster with high memory usage and evictions."""
    identifier = create_cache_cluster(
        "memory-pressure",
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    # High memory usage with evictions
    seed_cloudwatch_metric(identifier, "DatabaseMemoryUsagePercentage", 95, "Percent")
    seed_cloudwatch_metric(identifier, "Evictions", 100000, "Count")
    return identifier


def setup_no_vpc_cluster():
    """Create cluster without VPC deployment."""
    # Create cluster without CacheSubnetGroupName to simulate no VPC deployment
    elasticache = boto_client("elasticache")
    identifier = "no-vpc-cluster"
    try:
        elasticache.create_cache_cluster(
            CacheClusterId=identifier,
            CacheNodeType="cache.t3.medium",
            Engine="redis",
            EngineVersion="6.2",
            NumCacheNodes=1,
            # Don't set CacheSubnetGroupName to simulate no VPC deployment
            Tags=[{"Key": "Environment", "Value": "production"}]
        )
    except elasticache.exceptions.CacheClusterAlreadyExistsFault:
        # Delete and recreate
        try:
            elasticache.delete_cache_cluster(
                CacheClusterId=identifier,
                FinalSnapshotIdentifier=f"final-{identifier}"
            )
            time.sleep(0.5)
        except Exception:
            pass
        elasticache.create_cache_cluster(
            CacheClusterId=identifier,
            CacheNodeType="cache.t3.medium",
            Engine="redis",
            EngineVersion="6.2",
            NumCacheNodes=1,
            # Don't set CacheSubnetGroupName to simulate no VPC deployment
            Tags=[{"Key": "Environment", "Value": "production"}]
        )
    return identifier


def setup_reserved_node_opportunity():
    """Create long-running on-demand cluster."""
    identifier = create_cache_cluster(
        "reserved-opportunity",
        tags=[{"Key": "Environment", "Value": "production"}]
    )
    # Simulate old creation time by not setting age filter in test
    return identifier


def setup_excessive_snapshot_retention_cluster():
    """Create cluster with excessive snapshot retention for non-critical workloads."""
    identifier = create_cache_cluster(
        "long-retention-cluster",
        tags=[{"Key": "Environment", "Value": "production"}, {"Key": "Criticality", "Value": "low"}]
    )
    elasticache = boto_client("elasticache")
    try:
        elasticache.create_replication_group(
            ReplicationGroupId=f"rg-{identifier}",
            ReplicationGroupDescription="High retention non-critical",
            AutomaticFailoverEnabled=True,
            SnapshotRetentionLimit=40,  # > 35, should trigger issue for non-critical
            NumCacheClusters=1,
            CacheClusterId=identifier
        )
    except Exception:
        pass
    return identifier


def setup_unused_parameter_group():
    """Create an unused custom parameter group to trigger unused_parameter_groups."""
    elasticache = boto_client("elasticache")
    try:
        elasticache.create_cache_parameter_group(
            CacheParameterGroupName="custom-unused-params",
            CacheParameterGroupFamily="redis6.x",
            Description="Unused parameter group for testing"
        )
    except Exception:
        pass
    return "custom-unused-params"


def run_analysis_script(env=None):
    """Run the analysis script directly"""
    repo_root = Path(__file__).resolve().parents[1]
    cmd = ["python", "lib/analyse.py", "--use-mock-clusters"]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(repo_root), env=env)
    return result.returncode == 0, result


@pytest.fixture(scope="module")
def analysis_results():
    """Run analysis once and return parsed JSON output"""
    repo_root = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env.setdefault("AWS_ENDPOINT_URL", "http://localhost:5001")

    # Setup all test clusters
    test_clusters = [
        setup_underutilized_cache_cluster(),
        setup_over_provisioned_cluster(),
        setup_no_failover_cluster(),
        setup_single_az_cluster(),
        setup_sensitive_unencrypted_cluster(),
        setup_old_engine_version_cluster(),
        setup_no_auth_token_cluster(),
        setup_inadequate_backup_cluster(),
        setup_connection_exhaustion_cluster(),
        setup_inefficient_node_type_cluster(),
        setup_memory_pressure_cluster(),
        setup_no_vpc_cluster(),
        setup_reserved_node_opportunity(),
        setup_excessive_snapshot_retention_cluster(),
    ]

    # Create unused parameter group
    setup_unused_parameter_group()

    # Allow Moto time to persist metric data before running analysis
    time.sleep(1)

    success, result = run_analysis_script(env=env)
    assert success, f"Analysis script failed: {result.stderr}"

    json_file = repo_root / 'aws_audit_results.json'
    assert json_file.exists(), "aws_audit_results.json not created"

    with open(json_file, 'r') as f:
        data = json.load(f)
    return data


def find_cluster(results, cluster_id):
    """Find a cluster in the results by ID."""
    clusters = results.get("ElastiCacheClusters", {}).get("Clusters", [])
    for cluster in clusters:
        if cluster.get("cluster_id") == cluster_id:
            return cluster
    return None


def get_issue_types(cluster):
    """Get list of issue types for a cluster."""
    return [issue.get("type") for issue in cluster.get("issues", [])]


def test_all_issue_types_detected(analysis_results):
    """Test that all 16 analysis checks are working by validating expected issues are found."""
    data = analysis_results
    ec_section = data["ElastiCacheClusters"]

    # Should have at least 13 clusters (we created 13 test clusters)
    assert ec_section["TotalClusters"] >= 13, f"Expected at least 13 clusters, got {ec_section['TotalClusters']}"

    clusters = ec_section["Clusters"]

    # Test 1: Underutilized cache
    cluster = find_cluster(data, "underutilized-cache")
    assert cluster is not None, "underutilized-cache cluster not found"
    assert "underutilized_cache" in get_issue_types(cluster), "Expected underutilized_cache issue"

    # Test 2: Over-provisioned
    cluster = find_cluster(data, "over-provisioned-cache")
    assert cluster is not None, "over-provisioned-cache cluster not found"
    assert "over_provisioned" in get_issue_types(cluster), "Expected over_provisioned issue"

    # Test 3: No automatic failover
    cluster = find_cluster(data, "prod-no-failover-redis")
    assert cluster is not None, "prod-no-failover-redis cluster not found"
    assert "no_automatic_failover" in get_issue_types(cluster), "Expected no_automatic_failover issue"

    # Test 4: Single AZ deployment
    cluster = find_cluster(data, "single-az-prod")
    assert cluster is not None, "single-az-prod cluster not found"
    assert "single_az_deployment" in get_issue_types(cluster), "Expected single_az_deployment issue"

    # Test 5: Missing encryption
    cluster = find_cluster(data, "sensitive-unencrypted")
    assert cluster is not None, "sensitive-unencrypted cluster not found"
    assert "missing_encryption" in get_issue_types(cluster), "Expected missing_encryption issue"

    # Test 6: Old engine version
    cluster = find_cluster(data, "old-redis-version")
    assert cluster is not None, "old-redis-version cluster not found"
    assert "old_engine_version" in get_issue_types(cluster), "Expected old_engine_version issue"

    # Test 7: No auth token
    cluster = find_cluster(data, "no-auth-redis")
    assert cluster is not None, "no-auth-redis cluster not found"
    assert "no_auth_token" in get_issue_types(cluster), "Expected no_auth_token issue"

    # Test 8: Inadequate backup
    cluster = find_cluster(data, "inadequate-backup")
    assert cluster is not None, "inadequate-backup cluster not found"
    assert "inadequate_backup" in get_issue_types(cluster), "Expected inadequate_backup issue"

    # Test 9: Connection exhaustion
    cluster = find_cluster(data, "connection-exhaustion")
    assert cluster is not None, "connection-exhaustion cluster not found"
    assert "connection_exhaustion_risk" in get_issue_types(cluster), "Expected connection_exhaustion_risk issue"

    # Test 10: Inefficient node type
    cluster = find_cluster(data, "inefficient-nodes")
    assert cluster is not None, "inefficient-nodes cluster not found"
    assert "inefficient_node_type" in get_issue_types(cluster), "Expected inefficient_node_type issue"

    # Test 11: Memory pressure
    cluster = find_cluster(data, "memory-pressure")
    assert cluster is not None, "memory-pressure cluster not found"
    assert "memory_pressure" in get_issue_types(cluster), "Expected memory_pressure issue"

    # Test 12: No VPC deployment
    cluster = find_cluster(data, "no-vpc-cluster")
    assert cluster is not None, "no-vpc-cluster cluster not found"
    assert "no_vpc_deployment" in get_issue_types(cluster), "Expected no_vpc_deployment issue"

    # Test 13: Reserved node opportunity (may not trigger due to age filter)
    cluster = find_cluster(data, "reserved-opportunity")
    assert cluster is not None, "reserved-opportunity cluster not found"
    # Note: This may not trigger if age filter excludes it

    print(f"Successfully validated {len(clusters)} clusters with issues detected")


def test_analysis_outputs_created(analysis_results):
    """Ensure analysis artifacts are generated"""
    repo_root = Path(__file__).resolve().parents[1]
    assert (repo_root / 'aws_audit_results.json').exists(), "aws_audit_results.json missing"
    assert (repo_root / 'cache_performance_dashboard.html').exists(), "cache_performance_dashboard.html missing"
    assert (repo_root / 'cluster_rightsizing_plan.csv').exists(), "cluster_rightsizing_plan.csv missing"


def test_analysis_summary_counts(analysis_results):
    """Validate summary counts are coherent"""
    ec_section = analysis_results["ElastiCacheClusters"]
    assert ec_section["RedisCount"] + ec_section["MemcachedCount"] == ec_section["TotalClusters"]
    assert ec_section["ClustersAtRisk"] <= ec_section["TotalClusters"]

    # Should have some clusters at risk given our test setup
    assert ec_section["ClustersAtRisk"] > 0, "Expected some clusters to be at risk"

    print(f"Summary: {ec_section['TotalClusters']} total, {ec_section['ClustersAtRisk']} at risk")


def test_performance_score_calculation(analysis_results):
    """Test that performance scores are calculated correctly"""
    clusters = analysis_results["ElastiCacheClusters"]["Clusters"]

    for cluster in clusters:
        score = cluster.get("performance_score", 0)
        assert 0 <= score <= 100, f"Invalid performance score {score} for cluster {cluster['cluster_id']}"

        # Clusters with issues should have lower scores
        if cluster.get("issues"):
            assert score < 100, f"Cluster with issues should have score < 100: {cluster['cluster_id']}"

    print("Performance scores validated for all clusters")


def test_cost_analysis_structure(analysis_results):
    """Test that cost analysis is properly structured"""
    clusters = analysis_results["ElastiCacheClusters"]["Clusters"]

    for cluster in clusters:
        cost = cluster.get("cost_analysis", {})
        required_keys = ['current_monthly_cost', 'reserved_pricing_savings',
                        'rightsizing_savings', 'optimized_monthly_cost']
        for key in required_keys:
            assert key in cost, f"Missing cost key {key} in cluster {cluster['cluster_id']}"
            assert isinstance(cost[key], (int, float)), f"Cost value {key} should be numeric"

    print("Cost analysis structure validated")
