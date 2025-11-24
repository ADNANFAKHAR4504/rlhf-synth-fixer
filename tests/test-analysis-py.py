"""
ElastiCache Analysis Test
========================

Tests for ElastiCache cluster analysis functionality.
"""

import json
import subprocess


def run_analysis_script():
    """Run the analysis script directly"""
    cmd = ["python", "lib/analyse.py"]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd="/root/iac-test-automations")
    return result.returncode == 0


def test_elasticache_analysis():
    """Test ElastiCache cluster analysis"""
    # Mock clusters are set up by the analysis script itself when TEST_MODE is set
    
    # Run analysis
    success = run_analysis_script()
    assert success, "Analysis script failed"
    
    # Parse the JSON output
    with open('aws_audit_results.json', 'r') as f:
        data = json.load(f)
    
    # Check that ElastiCacheClusters section exists in JSON
    assert "ElastiCacheClusters" in data, "ElastiCacheClusters key missing from JSON"
    
    # Check structure
    ec_section = data["ElastiCacheClusters"]
    required_keys = ['TotalClusters', 'RedisCount', 'MemcachedCount', 'TotalMonthlyCost', 
                    'TotalPotentialSavings', 'AverageCacheHitRate', 'ClustersAtRisk', 'Clusters']
    
    for key in required_keys:
        assert key in ec_section, f"{key} key missing from ElastiCacheClusters"
    
    # Should have at least 1 cluster (old-redis-cluster should be included)
    assert ec_section["TotalClusters"] >= 1, f"Expected at least 1 cluster, got {ec_section['TotalClusters']}"
    
    # Should have Redis count
    assert ec_section["RedisCount"] >= 1, f"Expected at least 1 Redis cluster, got {ec_section['RedisCount']}"
    
    # Validate cluster details
    clusters = ec_section["Clusters"]
    assert len(clusters) >= 1, f"Expected at least 1 cluster in list, got {len(clusters)}"
    
    # Check each cluster has required fields
    for cluster in clusters:
        required_cluster_keys = ['cluster_id', 'engine', 'engine_version', 'node_type', 
                               'num_nodes', 'issues', 'performance_metrics', 'cost_analysis', 'performance_score']
        for key in required_cluster_keys:
            assert key in cluster, f"{key} missing from cluster {cluster.get('cluster_id', 'unknown')}"
        
        # Check performance metrics
        metrics = cluster['performance_metrics']
        required_metrics = ['cache_hit_rate', 'evictions_per_hour', 'cpu_avg', 
                          'memory_usage_percent', 'connections_peak']
        for metric in required_metrics:
            assert metric in metrics, f"{metric} missing from performance_metrics"
        
        # Check cost analysis
        cost = cluster['cost_analysis']
        required_cost_keys = ['current_monthly_cost', 'reserved_pricing_savings', 
                            'rightsizing_savings', 'optimized_monthly_cost']
        for key in required_cost_keys:
            assert key in cost, f"{key} missing from cost_analysis"
    
    # Check old Redis cluster
    old_redis = next((c for c in clusters if c['cluster_id'] == 'old-redis-cluster'), None)
    assert old_redis is not None, "old-redis-cluster not found in results"
    
    # Should have old engine version issue
    issues = old_redis['issues']
    version_issues = [i for i in issues if i['type'] == 'old_engine_version']
    assert len(version_issues) > 0, "Old Redis cluster should have version issues"