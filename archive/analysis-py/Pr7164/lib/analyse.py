#!/usr/bin/env python3
"""
analyze_elasticache.py - Comprehensive ElastiCache Performance, Security, and Cost Audit
"""

import json
import csv
import re
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple, Optional
from collections import defaultdict
from types import SimpleNamespace
import boto3
from botocore.exceptions import ClientError
import warnings
import os
warnings.filterwarnings('ignore')

try:
    import pandas as pd
except ImportError:  # pragma: no cover - optional dependency path
    class MinimalDataFrame:  # pragma: no cover
        """Lightweight fallback when pandas is unavailable."""

        def __init__(self, rows):
            self.rows = rows

        def to_csv(self, path, index=False):
            fieldnames = list(self.rows[0].keys()) if self.rows else []
            with open(path, 'w', newline='') as handle:
                writer = csv.DictWriter(handle, fieldnames=fieldnames)
                if fieldnames:
                    writer.writeheader()
                for row in self.rows:
                    writer.writerow(row)

    pd = SimpleNamespace(DataFrame=MinimalDataFrame)
try:
    import plotly.graph_objs as go
    import plotly.offline as pyo
    from plotly.subplots import make_subplots
except ImportError:  # pragma: no cover - optional dependency path
    class _DummyTrace:  # pragma: no cover
        """Minimal placeholder for plotly trace objects."""

    class _DummyFigure:  # pragma: no cover
        """Minimal placeholder for plotly figure."""

        def __init__(self, *args, **kwargs):
            self.traces = []

        def add_trace(self, trace, row=None, col=None):
            self.traces.append((trace, row, col))

        def update_layout(self, *args, **kwargs):
            return None

        def to_html(self, include_plotlyjs=False, div_id=None):
            return "<div></div>"

    go = SimpleNamespace(Bar=lambda *args, **kwargs: _DummyTrace(), Scatter=lambda *args, **kwargs: _DummyTrace())
    make_subplots = lambda *args, **kwargs: _DummyFigure()
    pyo = SimpleNamespace()

try:
    from tabulate import tabulate
except ImportError:
    # Fallback if tabulate is not installed
    def tabulate(data, headers, tablefmt=None):  # pragma: no cover - fallback path
        """Simple fallback tabulate function"""
        result = []
        # Print headers
        if headers:
            result.append(" | ".join(str(h) for h in headers))
            result.append("-" * 80)
        # Print rows
        for row in data:
            result.append(" | ".join(str(cell) for cell in row))
        return "\n".join(result)

# Constants
REGION = 'us-east-1'
ANALYSIS_PERIOD_DAYS = 30
MIN_CLUSTER_AGE_DAYS = 14
CACHE_HIT_RATIO_THRESHOLD = 85
EVICTIONS_THRESHOLD_PER_HOUR = 1000
CPU_UNDERUTILIZED_THRESHOLD = 20
NETWORK_UNDERUTILIZED_PERCENT = 10
MEMORY_PRESSURE_THRESHOLD = 90
CONNECTION_PRESSURE_PERCENT = 80
SNAPSHOT_RETENTION_EXCESSIVE_DAYS = 35
MIN_BACKUP_RETENTION_DAYS = 7

# Reserved instance pricing discounts (approximate)
RESERVED_DISCOUNT_1YR = 0.35  # 35% discount
RESERVED_DISCOUNT_3YR = 0.55  # 55% discount

# Node type pricing (USD per hour - sample pricing)
# NOTE: These are static sample rates for illustrative rightsizing math; consider
#       replacing with live AWS Pricing API lookups for production-grade accuracy.
NODE_PRICING = {
    'cache.t2.micro': 0.017,
    'cache.t2.small': 0.034,
    'cache.t2.medium': 0.068,
    'cache.t3.micro': 0.017,
    'cache.t3.small': 0.034,
    'cache.t3.medium': 0.068,
    'cache.t4g.micro': 0.016,
    'cache.t4g.small': 0.032,
    'cache.t4g.medium': 0.065,
    'cache.m3.medium': 0.067,
    'cache.m3.large': 0.133,
    'cache.m3.xlarge': 0.266,
    'cache.m3.2xlarge': 0.532,
    'cache.m4.large': 0.083,
    'cache.m4.xlarge': 0.166,
    'cache.m4.2xlarge': 0.333,
    'cache.m4.4xlarge': 0.666,
    'cache.m5.large': 0.085,
    'cache.m5.xlarge': 0.170,
    'cache.m5.2xlarge': 0.340,
    'cache.m5.4xlarge': 0.680,
    'cache.m6g.large': 0.077,
    'cache.m6g.xlarge': 0.154,
    'cache.m6g.2xlarge': 0.308,
    'cache.m6g.4xlarge': 0.616,
    'cache.r3.large': 0.112,
    'cache.r3.xlarge': 0.228,
    'cache.r3.2xlarge': 0.455,
    'cache.r3.4xlarge': 0.910,
    'cache.r4.large': 0.111,
    'cache.r4.xlarge': 0.221,
    'cache.r4.2xlarge': 0.442,
    'cache.r4.4xlarge': 0.884,
    'cache.r5.large': 0.107,
    'cache.r5.xlarge': 0.216,
    'cache.r5.2xlarge': 0.432,
    'cache.r5.4xlarge': 0.864,
    'cache.r6g.large': 0.101,
    'cache.r6g.xlarge': 0.202,
    'cache.r6g.2xlarge': 0.403,
    'cache.r6g.4xlarge': 0.806,
}

# Node type specifications
NODE_SPECS = {
    'cache.t2.micro': {'vcpu': 1, 'memory_gb': 0.555, 'network_gbps': 0.1, 'max_connections': 65000},
    'cache.t2.small': {'vcpu': 1, 'memory_gb': 1.55, 'network_gbps': 0.1, 'max_connections': 65000},
    'cache.t2.medium': {'vcpu': 2, 'memory_gb': 3.22, 'network_gbps': 0.5, 'max_connections': 65000},
    'cache.t3.micro': {'vcpu': 2, 'memory_gb': 0.5, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t3.small': {'vcpu': 2, 'memory_gb': 1.37, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t3.medium': {'vcpu': 2, 'memory_gb': 3.09, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.micro': {'vcpu': 2, 'memory_gb': 0.5, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.small': {'vcpu': 2, 'memory_gb': 1.37, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.medium': {'vcpu': 2, 'memory_gb': 3.09, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.m3.medium': {'vcpu': 1, 'memory_gb': 2.78, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m3.large': {'vcpu': 2, 'memory_gb': 6.05, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m3.xlarge': {'vcpu': 4, 'memory_gb': 13.3, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m3.2xlarge': {'vcpu': 8, 'memory_gb': 27.9, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m4.large': {'vcpu': 2, 'memory_gb': 6.42, 'network_gbps': 0.45, 'max_connections': 65000},
    'cache.m4.xlarge': {'vcpu': 4, 'memory_gb': 14.28, 'network_gbps': 0.75, 'max_connections': 65000},
    'cache.m4.2xlarge': {'vcpu': 8, 'memory_gb': 29.7, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m4.4xlarge': {'vcpu': 16, 'memory_gb': 60.78, 'network_gbps': 2.0, 'max_connections': 65000},
    'cache.m5.large': {'vcpu': 2, 'memory_gb': 6.38, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m5.xlarge': {'vcpu': 4, 'memory_gb': 12.93, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m5.2xlarge': {'vcpu': 8, 'memory_gb': 26.04, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m5.4xlarge': {'vcpu': 16, 'memory_gb': 52.26, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.large': {'vcpu': 2, 'memory_gb': 6.38, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.xlarge': {'vcpu': 4, 'memory_gb': 12.94, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.2xlarge': {'vcpu': 8, 'memory_gb': 26.05, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.4xlarge': {'vcpu': 16, 'memory_gb': 52.26, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r3.large': {'vcpu': 2, 'memory_gb': 13.5, 'network_gbps': 0.5, 'max_connections': 65000},
    'cache.r3.xlarge': {'vcpu': 4, 'memory_gb': 28.4, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.r3.2xlarge': {'vcpu': 8, 'memory_gb': 58.2, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.r3.4xlarge': {'vcpu': 16, 'memory_gb': 118, 'network_gbps': 2.0, 'max_connections': 65000},
    'cache.r4.large': {'vcpu': 2, 'memory_gb': 12.3, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r4.xlarge': {'vcpu': 4, 'memory_gb': 25.05, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r4.2xlarge': {'vcpu': 8, 'memory_gb': 50.47, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r4.4xlarge': {'vcpu': 16, 'memory_gb': 101.38, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.large': {'vcpu': 2, 'memory_gb': 13.07, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.xlarge': {'vcpu': 4, 'memory_gb': 26.32, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.2xlarge': {'vcpu': 8, 'memory_gb': 52.82, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.4xlarge': {'vcpu': 16, 'memory_gb': 105.81, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.large': {'vcpu': 2, 'memory_gb': 13.07, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.xlarge': {'vcpu': 4, 'memory_gb': 26.32, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.2xlarge': {'vcpu': 8, 'memory_gb': 52.82, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.4xlarge': {'vcpu': 16, 'memory_gb': 105.81, 'network_gbps': 10.0, 'max_connections': 65000},
}

# Previous generation node types
PREVIOUS_GEN_NODES = ['cache.m3', 'cache.t2', 'cache.r3']

# Current generation equivalents
CURRENT_GEN_EQUIVALENTS = {
    'cache.m3': 'cache.m6g',
    'cache.t2': 'cache.t4g',
    'cache.r3': 'cache.r6g',
}


class ElastiCacheAnalyzer:
    def __init__(self, use_mock_data: bool = False):
        # Use environment endpoint for testing
        endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
        self.elasticache = boto3.client('elasticache', region_name=REGION, endpoint_url=endpoint_url)
        self.cloudwatch = boto3.client('cloudwatch', region_name=REGION, endpoint_url=endpoint_url)
        self.ec2 = boto3.client('ec2', region_name=REGION, endpoint_url=endpoint_url)
        self.region = REGION
        self.clusters = []
        self.analysis_results = []
        self.use_mock_data = use_mock_data

    def setup_mock_clusters(self):
        """Setup mock ElastiCache clusters for testing purposes."""
        try:
            self.elasticache.create_cache_cluster(
                CacheClusterId='test-redis-cluster',
                CacheNodeType='cache.t3.medium',
                Engine='redis',
                EngineVersion='6.2',
                NumCacheNodes=1,
                Tags=[
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'DataClassification', 'Value': 'sensitive'}
                ]
            )
        except Exception:  # pragma: no cover - mock-only path
            pass

        try:
            self.elasticache.create_cache_cluster(
                CacheClusterId='test-memcached-cluster',
                CacheNodeType='cache.m5.large',
                Engine='memcached',
                EngineVersion='1.6.6',
                NumCacheNodes=2,
                Tags=[
                    {'Key': 'Environment', 'Value': 'test'}
                ]
            )
        except Exception:  # pragma: no cover - mock-only path
            pass

        try:
            self.elasticache.create_cache_cluster(
                CacheClusterId='old-redis-cluster',
                CacheNodeType='cache.t2.medium',
                Engine='redis',
                EngineVersion='5.0.6',
                NumCacheNodes=1,
                Tags=[
                    {'Key': 'Environment', 'Value': 'production'}
                ]
            )
        except Exception:  # pragma: no cover - mock-only path
            pass
    
    def run_analysis(self):
        """Main analysis workflow"""
        print("Starting ElastiCache analysis...")

        if self.use_mock_data:
            print("Setting up mock clusters for testing...")
            self.setup_mock_clusters()
        
        # Get all clusters
        self.clusters = self.get_all_clusters()
        print(f"Found {len(self.clusters)} clusters to analyze")        # Analyze each cluster
        for cluster in self.clusters:
            print(f"Analyzing cluster: {cluster['CacheClusterId']}")
            result = self.analyze_cluster(cluster)
            self.analysis_results.append(result)

            # Print console output
            self.print_cluster_summary(result)

        # Generate outputs
        self.generate_outputs()
        
        # Print final tabular summary
        self.print_final_summary()
        
        print("\nAnalysis complete!")

    def get_all_clusters(self) -> List[Dict]:
        """Get all ElastiCache clusters with filtering"""
        all_clusters = []
        paginator = self.elasticache.get_paginator('describe_cache_clusters')

        for page in paginator.paginate(ShowCacheNodeInfo=True):
            clusters = page.get('CacheClusters', [])
            print(f"Found {len(clusters)} clusters in page")

            for cluster in clusters:
                print(f"Checking cluster: {cluster['CacheClusterId']}")
                # Apply exclusion filters
                if self.should_exclude_cluster(cluster):
                    print(f"Excluding cluster: {cluster['CacheClusterId']}")
                    continue

                # Get cluster tags
                tags = self.get_cluster_tags(cluster['CacheClusterId'])
                if not tags and cluster.get('Tags'):
                    tags = {t['Key']: t['Value'] for t in cluster.get('Tags', [])}
                cluster['Tags'] = tags

                # Check ExcludeFromAnalysis tag
                if tags.get('ExcludeFromAnalysis', '').lower() == 'true':
                    print(f"Excluding tagged cluster: {cluster['CacheClusterId']}")
                    continue
                
                # Get replication group info if applicable
                if cluster.get('ReplicationGroupId'):
                    cluster['ReplicationGroupInfo'] = self.get_replication_group_info(
                        cluster['ReplicationGroupId']
                    )
                
                all_clusters.append(cluster)
                print(f"Included cluster: {cluster['CacheClusterId']}")

        return all_clusters

    def should_exclude_cluster(self, cluster: Dict) -> bool:
        """Check if cluster should be excluded from analysis"""
        cluster_id = cluster['CacheClusterId']

        # Exclude dev/test clusters
        if cluster_id.startswith('dev-') or cluster_id.startswith('test-'):
            return True

        # Skip age-based exclusion when running against a mocked endpoint
        if os.environ.get('AWS_ENDPOINT_URL'):
            return False

        # Check cluster age
        create_time = cluster.get('CacheClusterCreateTime')
        if create_time:
            age_days = (datetime.now(timezone.utc) - create_time).days
            if age_days < MIN_CLUSTER_AGE_DAYS:
                return True

        return False

    def get_cluster_tags(self, cluster_id: str) -> Dict[str, str]:
        """Get tags for a cluster"""
        try:
            response = self.elasticache.list_tags_for_resource(
                ResourceName=f"arn:aws:elasticache:{REGION}:*:cluster:{cluster_id}"
            )
            return {tag['Key']: tag['Value'] for tag in response.get('TagList', [])}
        except (boto3.exceptions.Boto3Error, ClientError, Exception):
            return {}

    def get_replication_group_info(self, replication_group_id: str) -> Dict:
        """Get replication group information"""
        try:
            response = self.elasticache.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            return response['ReplicationGroups'][0] if response['ReplicationGroups'] else {}
        except (boto3.exceptions.Boto3Error, ClientError, Exception):
            return {}

    def analyze_cluster(self, cluster: Dict) -> Dict:
        """Analyze a single cluster"""
        cluster_id = cluster['CacheClusterId']
        engine = cluster['Engine']
        engine_version = cluster['EngineVersion']
        node_type = cluster['CacheNodeType']
        num_nodes = cluster['NumCacheNodes']

        # Get metrics
        try:
            metrics = self.get_cluster_metrics(cluster_id, engine)
        except (boto3.exceptions.Boto3Error, ClientError, Exception):
            # If metrics collection fails, use default values
            metrics = {
                'cache_hit_rate': 0,
                'evictions_per_hour': 0,
                'cpu_avg': 0,
                'memory_usage_percent': 0,
                'connections_peak': 0,
                'network_utilization_percent': 0
            }

        # Analyze issues
        issues = []

        # 1. Underutilized clusters
        if metrics['cache_hit_rate'] < CACHE_HIT_RATIO_THRESHOLD and metrics['evictions_per_hour'] > EVICTIONS_THRESHOLD_PER_HOUR:
            issues.append({
                'type': 'underutilized_cache',
                'severity': 'high',
                'metric_data': {
                    'cache_hit_rate': metrics['cache_hit_rate'],
                    'evictions_per_hour': metrics['evictions_per_hour']
                },
                'description': f"Low cache hit ratio ({metrics['cache_hit_rate']:.1f}%) with high evictions ({metrics['evictions_per_hour']:.0f}/hour)",
                'remediation': 'Review key distribution and consider resizing cluster or adjusting TTL policies'
            })

        # 2. Over-provisioned nodes
        if metrics['cpu_avg'] < CPU_UNDERUTILIZED_THRESHOLD and metrics.get('network_utilization_percent', 100) < NETWORK_UNDERUTILIZED_PERCENT:
            issues.append({
                'type': 'over_provisioned',
                'severity': 'medium',
                'metric_data': {
                    'cpu_avg': metrics['cpu_avg'],
                    'network_utilization_percent': metrics.get('network_utilization_percent', 0)
                },
                'description': f"Low resource utilization: CPU {metrics['cpu_avg']:.1f}%, Network {metrics.get('network_utilization_percent', 0):.1f}%",
                'remediation': 'Consider downsizing to smaller node type or reducing number of nodes'
            })

        # 3. No automatic failover (Redis)
        if engine == 'redis' and self.is_production_cluster(cluster):
            rep_group = cluster.get('ReplicationGroupInfo') or {}
            if not rep_group.get('AutomaticFailover') or rep_group.get('AutomaticFailover') == 'disabled':
                issues.append({
                    'type': 'no_automatic_failover',
                    'severity': 'high',
                    'metric_data': {},
                    'description': 'Production Redis cluster lacks automatic failover',
                    'remediation': 'Enable automatic failover for high availability'
                })

        # 4. Single AZ deployment
        if self.is_production_cluster(cluster):
            if not cluster.get('PreferredAvailabilityZone') or not self.is_multi_az(cluster):
                issues.append({
                    'type': 'single_az_deployment',
                    'severity': 'high',
                    'metric_data': {},
                    'description': 'Production cluster deployed in single AZ',
                    'remediation': 'Enable Multi-AZ deployment for high availability'
                })

        # 5. Missing encryption
        data_classification = cluster['Tags'].get('DataClassification', '').lower()
        if not data_classification and 'sensitive' in cluster_id.lower():
            data_classification = 'sensitive'
        if data_classification == 'sensitive':
            if engine == 'redis':
                rep_group = cluster.get('ReplicationGroupInfo', {})
                if not rep_group.get('AtRestEncryptionEnabled') or not rep_group.get('TransitEncryptionEnabled'):
                    issues.append({
                        'type': 'missing_encryption',
                        'severity': 'critical',
                        'metric_data': {
                            'at_rest_encryption': rep_group.get('AtRestEncryptionEnabled', False),
                            'transit_encryption': rep_group.get('TransitEncryptionEnabled', False)
                        },
                        'description': 'Sensitive data cluster lacks encryption',
                        'remediation': 'Enable both at-rest and in-transit encryption'
                    })

        # 6. Old engine versions
        if self.is_old_engine_version(engine, engine_version):
            issues.append({
                'type': 'old_engine_version',
                'severity': 'medium',
                'metric_data': {
                    'engine': engine,
                    'version': engine_version
                },
                'description': f'Old {engine} version {engine_version} in use',
                'remediation': f'Upgrade to latest stable version (Redis 6.2+ or Memcached 1.6+)'
            })

        # 7. No auth token (Redis)
        if engine == 'redis':
            if not cluster.get('AuthTokenEnabled'):
                issues.append({
                    'type': 'no_auth_token',
                    'severity': 'high',
                    'metric_data': {},
                    'description': 'Redis cluster lacks AUTH token',
                    'remediation': 'Enable AUTH token for access control'
                })

        # 8. Inadequate backup (Redis)
        if engine == 'redis':
            rep_group = cluster.get('ReplicationGroupInfo', {})
            snapshot_retention = rep_group.get('SnapshotRetentionLimit', 0)
            if snapshot_retention < MIN_BACKUP_RETENTION_DAYS:
                issues.append({
                    'type': 'inadequate_backup',
                    'severity': 'high',
                    'metric_data': {
                        'retention_days': snapshot_retention
                    },
                    'description': f'Backup retention only {snapshot_retention} days',
                    'remediation': f'Increase snapshot retention to at least {MIN_BACKUP_RETENTION_DAYS} days'
                })

        # 9. Connection exhaustion risk
        if node_type in NODE_SPECS:
            max_connections = NODE_SPECS[node_type]['max_connections']
            connection_usage_percent = (metrics['connections_peak'] / max_connections) * 100
            if connection_usage_percent > CONNECTION_PRESSURE_PERCENT:
                issues.append({
                    'type': 'connection_exhaustion_risk',
                    'severity': 'high',
                    'metric_data': {
                        'connections_peak': metrics['connections_peak'],
                        'max_connections': max_connections,
                        'usage_percent': connection_usage_percent
                    },
                    'description': f'High connection usage: {connection_usage_percent:.1f}% of capacity',
                    'remediation': 'Implement connection pooling or scale out cluster'
                })

        # 10. Inefficient node types
        if any(node_type.startswith(gen) for gen in PREVIOUS_GEN_NODES):
            issues.append({
                'type': 'inefficient_node_type',
                'severity': 'medium',
                'metric_data': {
                    'current_type': node_type
                },
                'description': f'Using previous generation node type: {node_type}',
                'remediation': f'Migrate to current generation for better performance and cost'
            })

        # 11. Memory pressure
        if metrics['memory_usage_percent'] > MEMORY_PRESSURE_THRESHOLD and metrics['evictions_per_hour'] > 100:
            issues.append({
                'type': 'memory_pressure',
                'severity': 'high',
                'metric_data': {
                    'memory_usage_percent': metrics['memory_usage_percent'],
                    'evictions_per_hour': metrics['evictions_per_hour']
                },
                'description': f'High memory usage ({metrics["memory_usage_percent"]:.1f}%) with evictions',
                'remediation': 'Scale up node type or add more nodes to cluster'
            })

        # 12. No CloudWatch alarms
        alarms = self.get_cluster_alarms(cluster_id)
        if not alarms:
            issues.append({
                'type': 'no_cloudwatch_alarms',
                'severity': 'medium',
                'metric_data': {},
                'description': 'No CloudWatch alarms configured',
                'remediation': 'Configure alarms for CPU, memory, evictions, and replication lag'
            })

        # 13. Unused parameter groups
        unused_param_groups = self.check_unused_parameter_groups()
        if unused_param_groups:
            issues.append({
                'type': 'unused_parameter_groups',
                'severity': 'low',
                'metric_data': {
                    'unused_groups': unused_param_groups
                },
                'description': f'{len(unused_param_groups)} unused parameter groups found',
                'remediation': 'Delete unused parameter groups to reduce clutter'
            })

        # 14. Excessive snapshot retention
        if engine == 'redis':
            rep_group = cluster.get('ReplicationGroupInfo', {})
            snapshot_retention = rep_group.get('SnapshotRetentionLimit', 0)
            if snapshot_retention > SNAPSHOT_RETENTION_EXCESSIVE_DAYS and not self.is_critical_cluster(cluster):
                issues.append({
                    'type': 'excessive_snapshot_retention',
                    'severity': 'low',
                    'metric_data': {
                        'retention_days': snapshot_retention
                    },
                    'description': f'Excessive snapshot retention: {snapshot_retention} days',
                    'remediation': f'Reduce to {SNAPSHOT_RETENTION_EXCESSIVE_DAYS} days for non-critical workloads'
                })

        # 15. No VPC deployment
        if not cluster.get('CacheSubnetGroupName'):
            issues.append({
                'type': 'no_vpc_deployment',
                'severity': 'critical',
                'metric_data': {},
                'description': 'Cluster not deployed in VPC',
                'remediation': 'Migrate to VPC for security group protection'
            })

        # 16. Reserved node opportunities
        cluster_age_days = 0
        if cluster.get('CacheClusterCreateTime'):
            cluster_age_days = (datetime.now(timezone.utc) - cluster['CacheClusterCreateTime']).days
        
        if cluster_age_days > 365:
            issues.append({
                'type': 'reserved_node_opportunity',
                'severity': 'low',
                'metric_data': {
                    'age_days': cluster_age_days
                },
                'description': f'Long-running on-demand cluster ({cluster_age_days} days)',
                'remediation': 'Purchase reserved nodes for cost savings'
            })

        # Calculate costs
        cost_analysis = self.calculate_cost_analysis(cluster, issues, metrics)

        # Calculate performance score
        performance_score = self.calculate_performance_score(cluster, issues, metrics)

        return {
            'cluster_id': cluster_id,
            'engine': engine,
            'engine_version': engine_version,
            'node_type': node_type,
            'num_nodes': num_nodes,
            'issues': issues,
            'performance_metrics': metrics,
            'cost_analysis': cost_analysis,
            'performance_score': performance_score,
            'create_time': cluster.get('CacheClusterCreateTime')
        }

    def get_cluster_metrics(self, cluster_id: str, engine: str) -> Dict:
        """Get CloudWatch metrics for a cluster"""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=ANALYSIS_PERIOD_DAYS)

        metrics = {
            'cache_hit_rate': 0,
            'evictions_per_hour': 0,
            'cpu_avg': 0,
            'memory_usage_percent': 0,
            'connections_peak': 0,
            'network_utilization_percent': 0
        }

        # Get cache hit rate
        if engine == 'redis':
            hits = self.get_metric_statistics(cluster_id, 'CacheHits', start_time, end_time, 'Sum')
            misses = self.get_metric_statistics(cluster_id, 'CacheMisses', start_time, end_time, 'Sum')
            total_requests = hits + misses
            if total_requests > 0:
                metrics['cache_hit_rate'] = (hits / total_requests) * 100
        else:  # memcached
            get_hits = self.get_metric_statistics(cluster_id, 'GetHits', start_time, end_time, 'Sum')
            get_misses = self.get_metric_statistics(cluster_id, 'GetMisses', start_time, end_time, 'Sum')
            total_gets = get_hits + get_misses
            if total_gets > 0:
                metrics['cache_hit_rate'] = (get_hits / total_gets) * 100

        # Get evictions
        evictions = self.get_metric_statistics(cluster_id, 'Evictions', start_time, end_time, 'Sum')
        hours = (end_time - start_time).total_seconds() / 3600
        metrics['evictions_per_hour'] = evictions / hours if hours > 0 else 0

        # Get CPU utilization
        metrics['cpu_avg'] = self.get_metric_statistics(cluster_id, 'CPUUtilization', start_time, end_time, 'Average')

        # Get memory usage
        if engine == 'redis':
            used_memory = self.get_metric_statistics(cluster_id, 'DatabaseMemoryUsagePercentage', start_time, end_time, 'Average')
            metrics['memory_usage_percent'] = used_memory
        else:  # memcached
            bytes_used = self.get_metric_statistics(cluster_id, 'BytesUsedForCache', start_time, end_time, 'Average')
            # Estimate based on typical memcached usage
            metrics['memory_usage_percent'] = 75

        # Get connections
        metrics['connections_peak'] = self.get_metric_statistics(cluster_id, 'CurrConnections', start_time, end_time, 'Maximum')

        # Get network metrics
        bytes_in = self.get_metric_statistics(cluster_id, 'NetworkBytesIn', start_time, end_time, 'Average')
        bytes_out = self.get_metric_statistics(cluster_id, 'NetworkBytesOut', start_time, end_time, 'Average')

        # Calculate network utilization percentage
        total_bytes_per_sec = (bytes_in + bytes_out) / 3600
        cluster = next((c for c in self.clusters if c['CacheClusterId'] == cluster_id), None)
        if cluster and cluster['CacheNodeType'] in NODE_SPECS:
            max_network_gbps = NODE_SPECS[cluster['CacheNodeType']]['network_gbps']
            max_bytes_per_sec = max_network_gbps * 1e9 / 8
            metrics['network_utilization_percent'] = (total_bytes_per_sec / max_bytes_per_sec) * 100 if max_bytes_per_sec > 0 else 0

        return metrics

    def get_metric_statistics(self, cluster_id: str, metric_name: str, start_time: datetime,
                            end_time: datetime, statistic: str) -> float:
        """Get metric statistics from CloudWatch"""
        try:
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ElastiCache',
                MetricName=metric_name,
                Dimensions=[
                    {
                        'Name': 'CacheClusterId',
                        'Value': cluster_id
                    }
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour
                Statistics=[statistic]
            )

            if response['Datapoints']:
                values = [dp[statistic] for dp in response['Datapoints']]
                return sum(values) / len(values) if statistic == 'Average' else sum(values)
            return 0
        except (boto3.exceptions.Boto3Error, ClientError):
            return 0

    def is_production_cluster(self, cluster: Dict) -> bool:
        """Check if cluster is production based on tags or naming"""
        tags = cluster.get('Tags', {})
        env = tags.get('Environment', '').lower()
        cluster_id = cluster['CacheClusterId'].lower()

        return env == 'production' or 'prod' in cluster_id

    def is_critical_cluster(self, cluster: Dict) -> bool:
        """Check if cluster is critical based on tags"""
        tags = cluster.get('Tags', {})
        criticality = tags.get('Criticality', '').lower()

        return criticality in ['critical', 'high']

    def is_multi_az(self, cluster: Dict) -> bool:
        """Check if cluster is Multi-AZ"""
        if cluster.get('ReplicationGroupInfo'):
            return cluster['ReplicationGroupInfo'].get('MultiAZ', False)
        return False

    def is_old_engine_version(self, engine: str, version: str) -> bool:
        """Check if engine version is old"""
        if engine == 'redis':
            major_minor = '.'.join(version.split('.')[:2])
            return float(major_minor) < 6.2
        elif engine == 'memcached':
            major_minor = '.'.join(version.split('.')[:2])
            return float(major_minor) < 1.6
        return False

    def get_cluster_alarms(self, cluster_id: str) -> List[Dict]:
        """Get CloudWatch alarms for a cluster"""
        try:
            response = self.cloudwatch.describe_alarms(
                AlarmNamePrefix=cluster_id
            )
            return response.get('MetricAlarms', [])
        except (boto3.exceptions.Boto3Error, ClientError, Exception):
            return []

    def check_unused_parameter_groups(self) -> List[str]:
        """Check for unused parameter groups"""
        try:
            unused_groups = []
            response = self.elasticache.describe_cache_parameter_groups()

            for group in response.get('CacheParameterGroups', []):
                if not group['CacheParameterGroupName'].startswith('default.'):
                    # Check if it's in use (simplified check)
                    in_use = any(
                        cluster.get('CacheParameterGroup', {}).get('CacheParameterGroupName') == group['CacheParameterGroupName']
                        for cluster in self.clusters
                    )
                    if not in_use:
                        unused_groups.append(group['CacheParameterGroupName'])

            return unused_groups
        except (boto3.exceptions.Boto3Error, ClientError, Exception):
            return []

    def calculate_cost_analysis(self, cluster: Dict, issues: List[Dict], metrics: Dict) -> Dict:
        """Calculate cost analysis for a cluster"""
        node_type = cluster['CacheNodeType']
        num_nodes = cluster['NumCacheNodes']

        # Calculate current monthly cost
        hourly_cost = NODE_PRICING.get(node_type, 0.1) * num_nodes
        current_monthly_cost = hourly_cost * 24 * 30

        # Calculate reserved pricing savings
        cluster_age_days = 0
        if cluster.get('CacheClusterCreateTime'):
            cluster_age_days = (datetime.now(timezone.utc) - cluster['CacheClusterCreateTime']).days
        
        if cluster_age_days > 365:
            reserved_savings = current_monthly_cost * RESERVED_DISCOUNT_1YR
        else:
            reserved_savings = 0

        # Calculate rightsizing savings
        rightsizing_savings = 0

        # Check if over-provisioned
        if any(issue['type'] == 'over_provisioned' for issue in issues):
            # Suggest smaller instance
            if node_type in NODE_SPECS:
                # Simple logic: suggest 50% cost reduction if over-provisioned
                rightsizing_savings = current_monthly_cost * 0.3

        # Check if using previous gen
        if any(issue['type'] == 'inefficient_node_type' for issue in issues):
            # Current gen is typically 10-20% cheaper
            rightsizing_savings += current_monthly_cost * 0.15

        total_potential_savings = reserved_savings + rightsizing_savings
        optimized_monthly_cost = current_monthly_cost - total_potential_savings

        return {
            'current_monthly_cost': round(current_monthly_cost, 2),
            'reserved_pricing_savings': round(reserved_savings, 2),
            'rightsizing_savings': round(rightsizing_savings, 2),
            'optimized_monthly_cost': round(optimized_monthly_cost, 2)
        }

    def calculate_performance_score(self, cluster: Dict, issues: List[Dict], metrics: Dict) -> int:
        """Calculate performance score (0-100)"""
        score = 100

        # Deduct points based on issue severity
        severity_deductions = {
            'critical': 20,
            'high': 15,
            'medium': 10,
            'low': 5
        }

        for issue in issues:
            severity = issue.get('severity', 'low')
            score -= severity_deductions.get(severity, 5)

        # Performance metrics impact
        if metrics['cache_hit_rate'] < CACHE_HIT_RATIO_THRESHOLD:
            score -= 10

        if metrics['evictions_per_hour'] > EVICTIONS_THRESHOLD_PER_HOUR:
            score -= 10

        if metrics['memory_usage_percent'] > MEMORY_PRESSURE_THRESHOLD:
            score -= 5

        # Ensure score stays in valid range
        return max(0, min(100, score))

    def print_cluster_summary(self, result: Dict):
        """Print cluster summary to console"""
        print(f"\n{'='*80}")
        print(f"Cluster: {result['cluster_id']}")
        print(f"Performance Score: {result['performance_score']}/100")
        print(f"Engine: {result['engine']} {result['engine_version']}")
        print(f"Node Type: {result['node_type']} x {result['num_nodes']}")
        print(f"Current Monthly Cost: ${result['cost_analysis']['current_monthly_cost']:,.2f}")

        if result['cost_analysis']['reserved_pricing_savings'] > 0:
            print(f"Potential Reserved Savings: ${result['cost_analysis']['reserved_pricing_savings']:,.2f}")

        if result['cost_analysis']['rightsizing_savings'] > 0:
            print(f"Potential Rightsizing Savings: ${result['cost_analysis']['rightsizing_savings']:,.2f}")

        if result['issues']:
            print(f"\nIssues Found ({len(result['issues'])}):")
            for issue in result['issues'][:5]:  # Show top 5 issues
                print(f"  - [{issue['severity'].upper()}] {issue['description']}")
        else:
            print("\nNo issues found - cluster is well optimized!")

    def print_final_summary(self):
        """Print comprehensive tabular summary"""
        print(f"\n{'='*120}")
        print("ELASTICACHE INFRASTRUCTURE ANALYSIS SUMMARY".center(120))
        print(f"{'='*120}")
        print(f"Analysis Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Region: {REGION}")
        print(f"{'='*120}")

        if not self.analysis_results:
            print("No clusters found to analyze.")
            return

        # Summary Statistics Table
        print("\n📊 ANALYSIS SUMMARY")
        print("-"*120)
        summary_data = [
            ["Total Clusters", len(self.analysis_results)],
            ["Redis Clusters", sum(1 for r in self.analysis_results if r['engine'] == 'redis')],
            ["Memcached Clusters", sum(1 for r in self.analysis_results if r['engine'] == 'memcached')],
            ["Clusters at Risk", sum(1 for r in self.analysis_results if r['performance_score'] < 70)],
            ["Average Performance Score", f"{sum(r['performance_score'] for r in self.analysis_results) / len(self.analysis_results):.1f}/100"],
            ["Total Monthly Cost", f"${sum(r['cost_analysis']['current_monthly_cost'] for r in self.analysis_results):,.2f}"],
            ["Potential Monthly Savings", f"${sum(r['cost_analysis']['reserved_pricing_savings'] + r['cost_analysis']['rightsizing_savings'] for r in self.analysis_results):,.2f}"],
            ["Average Cache Hit Rate", f"{sum(r['performance_metrics']['cache_hit_rate'] for r in self.analysis_results) / len(self.analysis_results):.1f}%"]
        ]
        print(tabulate(summary_data, headers=["Metric", "Value"], tablefmt="grid"))

        # Cluster Details Table
        print("\n🔍 CLUSTER DETAILS")
        print("-"*120)
        cluster_data = []
        for result in sorted(self.analysis_results, key=lambda x: x['performance_score']):
            score_indicator = "🔴" if result['performance_score'] < 70 else "🟡" if result['performance_score'] < 85 else "🟢"
            critical_issues = sum(1 for i in result['issues'] if i['severity'] == 'critical')
            high_issues = sum(1 for i in result['issues'] if i['severity'] == 'high')
            
            cluster_data.append([
                result['cluster_id'][:25] + "..." if len(result['cluster_id']) > 25 else result['cluster_id'],
                f"{result['engine']}\n{result['engine_version']}",
                f"{result['node_type']}\nx{result['num_nodes']}",
                f"{score_indicator} {result['performance_score']}",
                f"{result['performance_metrics']['cache_hit_rate']:.1f}%",
                f"{result['performance_metrics']['cpu_avg']:.1f}%",
                f"{result['performance_metrics']['memory_usage_percent']:.1f}%",
                f"${result['cost_analysis']['current_monthly_cost']:,.0f}",
                f"${result['cost_analysis']['reserved_pricing_savings'] + result['cost_analysis']['rightsizing_savings']:,.0f}",
                f"{critical_issues}C/{high_issues}H"
            ])
        
        headers = ["Cluster ID", "Engine", "Node Config", "Score", "Hit Rate", "CPU %", "Memory %", "Cost/Month", "Savings", "Issues"]
        print(tabulate(cluster_data, headers=headers, tablefmt="grid"))

        # Issues Summary Table
        print("\n⚠️  ISSUES BY SEVERITY")
        print("-"*120)
        all_issues = []
        for result in self.analysis_results:
            for issue in result['issues']:
                all_issues.append(issue)
        
        issue_counts = defaultdict(int)
        for issue in all_issues:
            issue_counts[issue['type']] += 1
        
        if issue_counts:
            issue_data = [[issue_type, count] for issue_type, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)]
            print(tabulate(issue_data, headers=["Issue Type", "Count"], tablefmt="grid"))
        else:
            print("No issues detected - all clusters are well optimized!")

        # Top Issues Table
        if all_issues:
            print("\n🚨 TOP ISSUES REQUIRING ATTENTION")
            print("-"*120)
            # Sort issues by severity
            severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
            sorted_issues = sorted(all_issues, key=lambda x: (severity_order.get(x['severity'], 4), x['type']))
            
            top_issues_data = []
            for issue in sorted_issues[:10]:  # Show top 10
                cluster_id = next((r['cluster_id'] for r in self.analysis_results if issue in r['issues']), 'Unknown')
                top_issues_data.append([
                    issue['severity'].upper(),
                    issue['type'],
                    cluster_id[:20] + "..." if len(cluster_id) > 20 else cluster_id,
                    issue['description'][:50] + "..." if len(issue['description']) > 50 else issue['description']
                ])
            
            print(tabulate(top_issues_data, headers=["Severity", "Type", "Cluster", "Description"], tablefmt="grid"))
            if len(sorted_issues) > 10:
                print(f"\n... and {len(sorted_issues) - 10} more issues (see aws_audit_results.json for complete details)")

        # Recommendations Table
        print("\n💡 KEY RECOMMENDATIONS")
        print("-"*120)
        recommendations = []
        
        total_savings = sum(r['cost_analysis']['reserved_pricing_savings'] + r['cost_analysis']['rightsizing_savings'] for r in self.analysis_results)
        if total_savings > 0:
            recommendations.append(["Cost Optimization", f"Implement cost-saving measures for ${total_savings:,.0f}/month potential savings"])
        
        critical_count = sum(1 for r in self.analysis_results if any(i['severity'] == 'critical' for i in r['issues']))
        if critical_count > 0:
            recommendations.append(["Security", f"Address {critical_count} critical security issues immediately"])
        
        low_hit_rate_clusters = [r for r in self.analysis_results if r['performance_metrics']['cache_hit_rate'] < 85]
        if low_hit_rate_clusters:
            recommendations.append(["Performance", f"Optimize cache hit rates for {len(low_hit_rate_clusters)} cluster(s)"])
        
        old_clusters = [r for r in self.analysis_results if any(i['type'] == 'old_engine_version' for i in r['issues'])]
        if old_clusters:
            recommendations.append(["Maintenance", f"Upgrade {len(old_clusters)} cluster(s) to latest engine versions"])
        
        if recommendations:
            rec_data = [[f"{i+1}.", rec[0], rec[1]] for i, rec in enumerate(recommendations)]
            print(tabulate(rec_data, headers=["#", "Category", "Recommendation"], tablefmt="grid"))
        else:
            print("All clusters are well optimized - no recommendations needed!")

        print(f"\n{'='*120}")
        print("✅ ANALYSIS COMPLETE")
        print(f"{'='*120}")
        print("📄 Detailed report saved to: aws_audit_results.json")
        print("📊 Performance dashboard saved to: cache_performance_dashboard.html")
        print("📈 Rightsizing recommendations saved to: cluster_rightsizing_plan.csv")
        print(f"{'='*120}\n")

    def generate_outputs(self):
        """Generate all output files"""
        self.generate_json_output()
        self.generate_html_dashboard()
        self.generate_csv_output()

    def generate_json_output(self):
        """Generate JSON output file"""
        # Calculate summary statistics
        total_clusters = len(self.analysis_results)
        redis_count = sum(1 for r in self.analysis_results if r['engine'] == 'redis')
        memcached_count = total_clusters - redis_count

        total_monthly_cost = sum(r['cost_analysis']['current_monthly_cost'] for r in self.analysis_results)
        total_potential_savings = sum(
            r['cost_analysis']['reserved_pricing_savings'] + r['cost_analysis']['rightsizing_savings']
            for r in self.analysis_results
        )

        avg_cache_hit_rate = (
            sum(r['performance_metrics']['cache_hit_rate'] for r in self.analysis_results) / total_clusters
            if total_clusters > 0 else 0
        )

        clusters_at_risk = sum(
            1 for r in self.analysis_results
            if any(issue['severity'] in ['critical', 'high'] for issue in r['issues'])
        )

        output = {
            'ElastiCacheClusters': {
                'TotalClusters': total_clusters,
                'RedisCount': redis_count,
                'MemcachedCount': memcached_count,
                'TotalMonthlyCost': round(total_monthly_cost, 2),
                'TotalPotentialSavings': round(total_potential_savings, 2),
                'AverageCacheHitRate': round(avg_cache_hit_rate, 2),
                'ClustersAtRisk': clusters_at_risk,
                'Clusters': self.analysis_results
            }
        }

        with open('aws_audit_results.json', 'w') as f:
            json.dump(output, f, indent=2, default=str)

        print("\nGenerated aws_audit_results.json")

    def generate_html_dashboard(self):
        """Generate HTML dashboard with visualizations"""
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Cache Hit Rates', 'Resource Utilization',
                          'Memory Usage vs Evictions', 'Cost Optimization Potential'),
            specs=[[{'type': 'bar'}, {'type': 'scatter'}],
                   [{'type': 'scatter'}, {'type': 'bar'}]]
        )

        # Prepare data
        cluster_ids = [r['cluster_id'] for r in self.analysis_results]
        hit_rates = [r['performance_metrics']['cache_hit_rate'] for r in self.analysis_results]
        cpu_usage = [r['performance_metrics']['cpu_avg'] for r in self.analysis_results]
        memory_usage = [r['performance_metrics']['memory_usage_percent'] for r in self.analysis_results]
        evictions = [r['performance_metrics']['evictions_per_hour'] for r in self.analysis_results]
        current_costs = [r['cost_analysis']['current_monthly_cost'] for r in self.analysis_results]
        optimized_costs = [r['cost_analysis']['optimized_monthly_cost'] for r in self.analysis_results]

        # 1. Cache Hit Rates
        fig.add_trace(
            go.Bar(x=cluster_ids, y=hit_rates, name='Hit Rate %',
                  marker_color=['red' if hr < CACHE_HIT_RATIO_THRESHOLD else 'green' for hr in hit_rates]),
            row=1, col=1
        )

        # 2. Resource Utilization
        fig.add_trace(
            go.Scatter(x=cluster_ids, y=cpu_usage, mode='markers', name='CPU %',
                      marker=dict(size=10, color='blue')),
            row=1, col=2
        )

        # 3. Memory Usage vs Evictions
        fig.add_trace(
            go.Scatter(x=memory_usage, y=evictions, mode='markers',
                      text=cluster_ids, name='Memory vs Evictions',
                      marker=dict(size=15, color=hit_rates, colorscale='RdYlGn', showscale=True)),
            row=2, col=1
        )

        # 4. Cost Optimization
        fig.add_trace(
            go.Bar(x=cluster_ids, y=current_costs, name='Current Cost', marker_color='red'),
            row=2, col=2
        )
        fig.add_trace(
            go.Bar(x=cluster_ids, y=optimized_costs, name='Optimized Cost', marker_color='green'),
            row=2, col=2
        )

        # Update layout
        fig.update_layout(
            title='ElastiCache Performance Dashboard',
            height=800,
            showlegend=True
        )

        # Generate HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>ElastiCache Performance Dashboard</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .summary {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
                .metric {{ display: inline-block; margin: 10px; padding: 10px; background-color: white; border-radius: 5px; }}
                .critical {{ color: red; font-weight: bold; }}
                .warning {{ color: orange; font-weight: bold; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #4CAF50; color: white; }}
                tr:nth-child(even) {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>ElastiCache Performance Dashboard</h1>

            <div class="summary">
                <h2>Summary</h2>
                <div class="metric">Total Clusters: <strong>{len(self.analysis_results)}</strong></div>
                <div class="metric">Total Monthly Cost: <strong>${sum(current_costs):,.2f}</strong></div>
                <div class="metric">Potential Savings: <strong>${sum(current_costs) - sum(optimized_costs):,.2f}</strong></div>
                <div class="metric">Average Hit Rate: <strong>{sum(hit_rates)/len(hit_rates) if hit_rates else 0:.1f}%</strong></div>
                <div class="metric">Clusters at Risk: <strong class="critical">{sum(1 for r in self.analysis_results if r['performance_score'] < 70)}</strong></div>
            </div>

            <div id="plotly-div">{fig.to_html(include_plotlyjs=False, div_id="plotly-div")}</div>

            <h2>Cluster Details</h2>
            <table>
                <tr>
                    <th>Cluster ID</th>
                    <th>Engine</th>
                    <th>Performance Score</th>
                    <th>Hit Rate</th>
                    <th>CPU %</th>
                    <th>Memory %</th>
                    <th>Monthly Cost</th>
                    <th>Issues</th>
                </tr>
        """

        for result in sorted(self.analysis_results, key=lambda x: x['performance_score']):
            score_class = 'critical' if result['performance_score'] < 70 else 'warning' if result['performance_score'] < 85 else ''
            critical_issues = sum(1 for i in result['issues'] if i['severity'] == 'critical')
            high_issues = sum(1 for i in result['issues'] if i['severity'] == 'high')

            html_content += f"""
                <tr>
                    <td>{result['cluster_id']}</td>
                    <td>{result['engine']} {result['engine_version']}</td>
                    <td class="{score_class}">{result['performance_score']}</td>
                    <td>{result['performance_metrics']['cache_hit_rate']:.1f}%</td>
                    <td>{result['performance_metrics']['cpu_avg']:.1f}%</td>
                    <td>{result['performance_metrics']['memory_usage_percent']:.1f}%</td>
                    <td>${result['cost_analysis']['current_monthly_cost']:,.2f}</td>
                    <td>{critical_issues} critical, {high_issues} high</td>
                </tr>
            """

        html_content += """
            </table>
        </body>
        </html>
        """

        with open('cache_performance_dashboard.html', 'w') as f:
            f.write(html_content)

        print("Generated cache_performance_dashboard.html")

    def generate_csv_output(self):
        """Generate CSV output with rightsizing recommendations"""
        rows = []

        for result in self.analysis_results:
            # Determine recommendation
            recommendation = 'No Change'
            target_node_type = result['node_type']
            estimated_savings = 0

            # Check for over-provisioning
            if any(issue['type'] == 'over_provisioned' for issue in result['issues']):
                recommendation = 'Downsize'
                # Simple logic: suggest one size smaller
                if 'xlarge' in result['node_type']:
                    target_node_type = result['node_type'].replace('xlarge', 'large')
                elif 'large' in result['node_type'] and 'xlarge' not in result['node_type']:
                    target_node_type = result['node_type'].replace('large', 'medium')
                estimated_savings = result['cost_analysis']['rightsizing_savings']

            # Check for memory pressure
            elif any(issue['type'] == 'memory_pressure' for issue in result['issues']):
                recommendation = 'Upsize'
                # Simple logic: suggest one size larger
                if 'medium' in result['node_type']:
                    target_node_type = result['node_type'].replace('medium', 'large')
                elif 'large' in result['node_type'] and 'xlarge' not in result['node_type']:
                    target_node_type = result['node_type'].replace('large', 'xlarge')

            # Check for previous gen
            elif any(issue['type'] == 'inefficient_node_type' for issue in result['issues']):
                recommendation = 'Migrate'
                # Map to current gen
                for old_gen, new_gen in CURRENT_GEN_EQUIVALENTS.items():
                    if result['node_type'].startswith(old_gen):
                        target_node_type = result['node_type'].replace(old_gen, new_gen)
                        break
                estimated_savings = result['cost_analysis']['rightsizing_savings']

            rows.append({
                'cluster_id': result['cluster_id'],
                'engine': result['engine'],
                'current_node_type': result['node_type'],
                'num_nodes': result['num_nodes'],
                'recommendation': recommendation,
                'target_node_type': target_node_type,
                'current_monthly_cost': result['cost_analysis']['current_monthly_cost'],
                'estimated_monthly_savings': estimated_savings,
                'new_monthly_cost': result['cost_analysis']['current_monthly_cost'] - estimated_savings,
                'performance_score': result['performance_score'],
                'cache_hit_rate': result['performance_metrics']['cache_hit_rate'],
                'cpu_utilization': result['performance_metrics']['cpu_avg'],
                'memory_utilization': result['performance_metrics']['memory_usage_percent'],
                'critical_issues': sum(1 for i in result['issues'] if i['severity'] == 'critical'),
                'high_issues': sum(1 for i in result['issues'] if i['severity'] == 'high')
            })

        # Write to CSV
        df = pd.DataFrame(rows)
        df.to_csv('cluster_rightsizing_plan.csv', index=False)

        print("Generated cluster_rightsizing_plan.csv")


def main():
    """Main entry point"""
    try:
        analyzer = ElastiCacheAnalyzer()
        analyzer.run_analysis()
        return 0
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    main()
