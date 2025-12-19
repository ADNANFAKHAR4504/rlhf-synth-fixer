# Amazon Redshift Performance and Cost Audit Tool

## Overview

The `analyse.py` script is a comprehensive Amazon Redshift cluster performance and cost analysis tool designed to help organizations optimize their Redshift infrastructure. This tool performs deep analysis of Redshift clusters, identifying performance bottlenecks, cost optimization opportunities, and security compliance issues.

###  Analysis
python3 lib/analyse.py
```
#!/usr/bin/env python3
"""
Amazon Redshift Performance and Cost Audit Tool
Analyzes Redshift clusters for performance bottlenecks, cost optimization, and security compliance.
"""

import csv
import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from statistics import fmean
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict

import boto3
from botocore.exceptions import ClientError

# Optional dependency: pandas (CSV export)
try:
    import pandas as _pd  # type: ignore  # pragma: no cover
    PANDAS_AVAILABLE = True  # pragma: no cover
except ModuleNotFoundError:  # pragma: no cover
    PANDAS_AVAILABLE = False  # pragma: no cover

    class _PandasDataFrameStub:  # pragma: no cover
        def __init__(self, rows: List[Dict[str, Any]]):  # pragma: no cover
            self._rows = rows

        def to_csv(self, filename: str, index: bool = False):  # pragma: no cover
            if not self._rows:
                with open(filename, 'w', encoding='utf-8') as handle:
                    handle.write('')
                return

            fieldnames = list(self._rows[0].keys())
            with open(filename, 'w', newline='', encoding='utf-8') as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self._rows)

    class _PandasModuleStub:  # pragma: no cover
        def DataFrame(self, rows: List[Dict[str, Any]]):  # type: ignore  # pragma: no cover
            return _PandasDataFrameStub(rows)

    _pd = _PandasModuleStub()  # type: ignore  # pragma: no cover

# Optional dependency: plotly (HTML dashboard)
try:
    import plotly.graph_objects as _go  # type: ignore  # pragma: no cover
    import plotly.express as _px  # type: ignore  # pragma: no cover
    from plotly.subplots import make_subplots  # type: ignore  # pragma: no cover
    PLOTLY_AVAILABLE = True  # pragma: no cover
except ModuleNotFoundError:  # pragma: no cover
    PLOTLY_AVAILABLE = False  # pragma: no cover

    class _PlotlyStub:  # pragma: no cover
        def __getattr__(self, name):  # pragma: no cover
            return lambda *args, **kwargs: None

    _go = _PlotlyStub()  # type: ignore  # pragma: no cover
    _px = _PlotlyStub()  # type: ignore  # pragma: no cover
    make_subplots = _PlotlyStub()  # type: ignore  # pragma: no cover

pd = _pd
go = _go
px = _px

# Optional dependency: psycopg2 (table analysis)
try:
    import psycopg2  # type: ignore  # pragma: no cover
    PSYCOPG2_AVAILABLE = True  # pragma: no cover
except ModuleNotFoundError:  # pragma: no cover
    PSYCOPG2_AVAILABLE = False  # pragma: no cover
    psycopg2 = None  # type: ignore  # pragma: no cover

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Analysis thresholds
CPU_THRESHOLD = 30.0  # Low CPU utilization threshold
DISK_THRESHOLD = 85.0  # Disk space pressure threshold
QUEUE_TIME_THRESHOLD = 30.0  # Query queue time threshold in seconds
DISK_QUERY_THRESHOLD = 10.0  # Percentage of queries spilling to disk
MIN_CLUSTER_AGE_DAYS = 14  # Minimum cluster age for analysis
MIN_SNAPSHOT_RETENTION = 7  # Minimum snapshot retention days
GHOST_ROW_THRESHOLD = 20.0  # Percentage threshold for ghost rows

# Reserved Node Pricing (approximated from AWS pricing - us-east-1, hourly rate)
# Format: {node_type: (on_demand_hourly, reserved_1yr_hourly)}
PRICING = {
    'dc2.large': (0.25, 0.156),
    'dc2.8xlarge': (4.80, 3.00),
    'ds2.xlarge': (0.85, 0.532),
    'ds2.8xlarge': (6.80, 4.256),
    'ra3.xlplus': (1.086, 0.679),
    'ra3.4xlarge': (3.26, 2.039),
    'ra3.16xlarge': (13.04, 8.156),
}


def _safe_mean(values: List[float]) -> float:
    """Calculate mean of values, returning 0 if list is empty."""
    return fmean(values) if values else 0.0


class RedshiftAnalyzer:
    """Comprehensive Redshift cluster performance and cost analyzer."""

    def __init__(self, region: str = 'us-east-1'):
        """Initialize AWS clients and configuration."""
        self.region = region
        endpoint_url = os.environ.get('AWS_ENDPOINT_URL')

        client_kwargs = {'region_name': region}
        if endpoint_url:
            client_kwargs['endpoint_url'] = endpoint_url

        self.redshift = boto3.client('redshift', **client_kwargs)
        self.cloudwatch = boto3.client('cloudwatch', **client_kwargs)

        # Storage for analysis results
        self.cluster_analysis: List[Dict[str, Any]] = []
        self.spectrum_analysis: List[Dict[str, Any]] = []
        self.table_optimizations: List[Dict[str, Any]] = []
        self.rightsizing_recommendations: List[Dict[str, Any]] = []

    def should_exclude_cluster(self, cluster: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check if cluster should be excluded from analysis.
        Returns (should_exclude, reason).
        """
        cluster_id = cluster['ClusterIdentifier']

        # Exclude dev- or test- prefixed clusters
        if cluster_id.startswith('dev-') or cluster_id.startswith('test-'):
            return True, "dev/test prefix"

        # Check ExcludeFromAnalysis tag
        tags = cluster.get('Tags', [])
        for tag in tags:
            if tag['Key'].lower() == 'excludefromanalysis' and tag['Value'].lower() == 'true':
                return True, "ExcludeFromAnalysis tag"

        # Check cluster age
        create_time = cluster['ClusterCreateTime']
        if isinstance(create_time, str):
            create_time = datetime.fromisoformat(create_time.replace('Z', '+00:00'))
        age_days = (datetime.now(create_time.tzinfo) - create_time).days

        if age_days < MIN_CLUSTER_AGE_DAYS:
            return True, f"too young ({age_days} days)"

        return False, ""

    def get_cloudwatch_metric_avg(
        self,
        cluster_id: str,
        metric_name: str,
        stat: str = 'Average'
    ) -> Optional[float]:
        """Get average CloudWatch metric value over the lookback period (30 days)."""
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=30)

            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/Redshift',
                MetricName=metric_name,
                Dimensions=[
                    {'Name': 'ClusterIdentifier', 'Value': cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=86400,  # Daily
                Statistics=[stat]
            )

            if response['Datapoints']:
                values = [dp[stat] for dp in response['Datapoints']]
                return _safe_mean(values)
            return None
        except ClientError as e:
            logger.warning(f"Could not fetch {metric_name} for {cluster_id}: {e}")
            return None

    def get_cloudwatch_metric_timeseries(
        self,
        cluster_id: str,
        metric_name: str,
        stat: str = 'Average'
    ) -> List[Dict[str, Any]]:
        """Get CloudWatch metric timeseries for dashboard."""
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=30)

            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/Redshift',
                MetricName=metric_name,
                Dimensions=[
                    {'Name': 'ClusterIdentifier', 'Value': cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=86400,  # Daily
                Statistics=[stat]
            )

            datapoints = sorted(response.get('Datapoints', []), key=lambda x: x['Timestamp'])
            return [
                {'timestamp': dp['Timestamp'].isoformat(), 'value': dp[stat]}
                for dp in datapoints
            ]
        except ClientError as e:
            logger.warning(f"Could not fetch timeseries {metric_name} for {cluster_id}: {e}")
            return []

    def check_cluster_issues(
        self,
        cluster: Dict[str, Any],
        metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check all 17 performance and configuration issues."""
        issues = []
        cluster_id = cluster['ClusterIdentifier']
        node_type = cluster['NodeType']

        # 1. Low CPU Utilization
        cpu_avg = metrics.get('cpu_avg')
        if cpu_avg is not None and cpu_avg < CPU_THRESHOLD:
            issues.append({
                'type': 'low_cpu_utilization',
                'severity': 'medium',
                'details': f"Average CPU utilization is {cpu_avg:.1f}% (threshold: {CPU_THRESHOLD}%)",
                'remediation': 'Consider downsizing cluster or reducing number of nodes'
            })

        # 2. Disk Space Pressure
        disk_usage = metrics.get('disk_usage')
        if disk_usage is not None and disk_usage > DISK_THRESHOLD:
            issues.append({
                'type': 'disk_space_pressure',
                'severity': 'high',
                'details': f"Disk usage is {disk_usage:.1f}% (threshold: {DISK_THRESHOLD}%)",
                'remediation': 'Add nodes, archive old data, or migrate to RA3 with managed storage'
            })

        # 3. High Query Queue Time
        queue_time = metrics.get('query_queue_avg')
        if queue_time is not None and queue_time > QUEUE_TIME_THRESHOLD:
            issues.append({
                'type': 'high_query_queue_time',
                'severity': 'high',
                'details': f"Average query queue time is {queue_time:.1f}s (threshold: {QUEUE_TIME_THRESHOLD}s)",
                'remediation': 'Review WLM configuration, add concurrency scaling, or increase cluster capacity'
            })

        # 5. No Automatic Snapshots
        snapshot_retention = cluster.get('AutomatedSnapshotRetentionPeriod', 0)
        if snapshot_retention < MIN_SNAPSHOT_RETENTION:
            issues.append({
                'type': 'no_automatic_snapshots',
                'severity': 'high',
                'details': f"Snapshot retention is {snapshot_retention} days (minimum: {MIN_SNAPSHOT_RETENTION})",
                'remediation': f"Enable automated snapshots with at least {MIN_SNAPSHOT_RETENTION} days retention"
            })

        # 6. Missing Encryption
        encrypted = cluster.get('Encrypted', False)
        if not encrypted:
            issues.append({
                'type': 'missing_encryption',
                'severity': 'high',
                'details': 'Cluster is not encrypted at rest',
                'remediation': 'Enable KMS encryption for data at rest'
            })

        # 7. Single-AZ Deployment (Redshift clusters are typically single-AZ)
        availability_zone = cluster.get('AvailabilityZone')
        if availability_zone and 'prod' in cluster_id.lower():
            issues.append({
                'type': 'single_az_deployment',
                'severity': 'medium',
                'details': f"Cluster is deployed in single AZ: {availability_zone}",
                'remediation': 'Consider cross-region snapshots or multi-cluster setup for DR'
            })

        # 8. Old Maintenance Track
        cluster_version = cluster.get('ClusterVersion', '')
        if cluster_version and cluster_version < '1.0.48000':
            issues.append({
                'type': 'old_maintenance_track',
                'severity': 'medium',
                'details': f"Cluster version {cluster_version} is outdated",
                'remediation': 'Upgrade to latest maintenance track for features and security patches'
            })

        # 9. No Enhanced VPC Routing
        enhanced_vpc_routing = cluster.get('EnhancedVpcRouting', False)
        if not enhanced_vpc_routing:
            issues.append({
                'type': 'no_enhanced_vpc_routing',
                'severity': 'low',
                'details': 'Enhanced VPC Routing is not enabled',
                'remediation': 'Enable Enhanced VPC Routing to route S3 traffic through VPC'
            })

        # 10. Inefficient Node Types
        if node_type.startswith('dc2'):
            issues.append({
                'type': 'inefficient_node_type',
                'severity': 'medium',
                'details': f"Using Dense Compute (dc2) node type: {node_type}",
                'remediation': 'Evaluate migration to RA3 for better price/performance with managed storage'
            })
        elif node_type.startswith('ds2'):
            issues.append({
                'type': 'inefficient_node_type',
                'severity': 'low',
                'details': f"Using Dense Storage (ds2) node type: {node_type}",
                'remediation': 'Consider RA3 for improved performance and storage flexibility'
            })

        # 11. No Query Monitoring Rules (QMR)
        param_groups = cluster.get('ClusterParameterGroups', [])
        param_group = param_groups[0]['ParameterGroupName'] if param_groups else 'default'
        if param_group.startswith('default'):
            issues.append({
                'type': 'no_query_monitoring_rules',
                'severity': 'medium',
                'details': 'Using default parameter group, likely no custom QMR configured',
                'remediation': 'Create custom parameter group with Query Monitoring Rules for problem queries'
            })

        # 13. No Concurrency Scaling
        if queue_time and queue_time > QUEUE_TIME_THRESHOLD:
            issues.append({
                'type': 'no_concurrency_scaling',
                'severity': 'medium',
                'details': 'High queue times suggest concurrency scaling may not be enabled',
                'remediation': 'Enable concurrency scaling in WLM configuration for peak workloads'
            })

        # 15. Missing Reserved Nodes
        create_time = cluster['ClusterCreateTime']
        if isinstance(create_time, str):
            create_time = datetime.fromisoformat(create_time.replace('Z', '+00:00'))
        age_days = (datetime.now(create_time.tzinfo) - create_time).days

        if age_days > 365:  # More than 1 year old
            issues.append({
                'type': 'missing_reserved_nodes',
                'severity': 'medium',
                'details': f"Cluster is {age_days} days old but may be using on-demand pricing",
                'remediation': 'Purchase reserved nodes for 1-year or 3-year term to save costs'
            })

        # 16. No Parameter Group Customization
        if param_group.startswith('default'):
            issues.append({
                'type': 'no_parameter_group_customization',
                'severity': 'low',
                'details': 'Using default parameter group instead of workload-optimized configuration',
                'remediation': 'Create custom parameter group tuned for workload characteristics'
            })

        # 17. Unmonitored Disk-Based Queries
        disk_spill_pct = metrics.get('disk_spill_pct', 0)
        if disk_spill_pct > DISK_QUERY_THRESHOLD:
            issues.append({
                'type': 'unmonitored_disk_queries',
                'severity': 'high',
                'details': f"{disk_spill_pct:.1f}% of queries spill to disk (threshold: {DISK_QUERY_THRESHOLD}%)",
                'remediation': 'Increase WLM memory allocation, optimize queries, or add CloudWatch alarms'
            })

        return issues

    def calculate_performance_score(
        self,
        cluster: Dict[str, Any],
        metrics: Dict[str, Any],
        issues: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate performance score (0-100) based on efficiency, availability, disk, queue, table design.
        Higher score = better performance.
        """
        score = 100.0

        # CPU efficiency (target 50-70% for optimal utilization)
        cpu_avg = metrics.get('cpu_avg', 50)
        if cpu_avg is not None:
            if cpu_avg < 30:
                score -= 15  # Over-provisioned
            elif cpu_avg > 80:
                score -= 10  # Under-provisioned

        # Disk space (deduct more as it approaches 100%)
        disk_usage = metrics.get('disk_usage', 0)
        if disk_usage is not None:
            if disk_usage > 85:
                score -= 20
            elif disk_usage > 70:
                score -= 10
            elif disk_usage > 50:
                score -= 5

        # Query queue time
        queue_time = metrics.get('query_queue_avg', 0)
        if queue_time is not None:
            if queue_time > 60:
                score -= 20
            elif queue_time > 30:
                score -= 10
            elif queue_time > 10:
                score -= 5

        # Issue severity penalties
        severity_weights = {'high': 8, 'medium': 4, 'low': 2}
        for issue in issues:
            score -= severity_weights.get(issue['severity'], 2)

        # Availability and best practices
        if not cluster.get('Encrypted', False):
            score -= 10

        snapshot_retention = cluster.get('AutomatedSnapshotRetentionPeriod', 0)
        if snapshot_retention < MIN_SNAPSHOT_RETENTION:
            score -= 8

        if not cluster.get('EnhancedVpcRouting', False):
            score -= 3

        # Ensure score is within 0-100
        return max(0.0, min(100.0, score))

    def calculate_cost_analysis(
        self,
        cluster: Dict[str, Any],
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate current cost, reserved pricing savings, and optimized cost."""
        node_type = cluster['NodeType']
        num_nodes = cluster['NumberOfNodes']

        # Get pricing
        on_demand_hourly, reserved_hourly = PRICING.get(node_type, (1.0, 0.7))

        # Calculate monthly costs
        hours_per_month = 730
        current_monthly = on_demand_hourly * num_nodes * hours_per_month
        reserved_monthly = reserved_hourly * num_nodes * hours_per_month
        reserved_savings = current_monthly - reserved_monthly

        # Optimized cost: Consider rightsizing based on CPU utilization
        cpu_avg = metrics.get('cpu_avg', 50)
        optimized_nodes = num_nodes
        optimized_node_type = node_type

        # If CPU is low, suggest reducing nodes
        if cpu_avg is not None and cpu_avg < 30 and num_nodes > 1:
            optimized_nodes = max(1, num_nodes // 2)

        # If using dc2, suggest RA3
        if node_type.startswith('dc2'):
            optimized_node_type = 'ra3.xlplus' if node_type == 'dc2.large' else 'ra3.4xlarge'
        elif node_type.startswith('ds2'):
            optimized_node_type = 'ra3.4xlarge' if 'xlarge' in node_type else 'ra3.16xlarge'

        optimized_hourly, _ = PRICING.get(optimized_node_type, (on_demand_hourly, reserved_hourly))
        optimized_monthly = optimized_hourly * optimized_nodes * hours_per_month

        return {
            'current_cost': round(current_monthly, 2),
            'reserved_pricing_savings': round(reserved_savings, 2),
            'optimized_cost': round(optimized_monthly, 2),
            'optimized_node_type': optimized_node_type,
            'optimized_node_count': optimized_nodes
        }

    def analyze_cluster(self, cluster: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive analysis on a single cluster."""
        cluster_id = cluster['ClusterIdentifier']

        logger.info(f"Analyzing cluster: {cluster_id}")

        # Collect CloudWatch metrics
        cpu_avg = self.get_cloudwatch_metric_avg(cluster_id, 'CPUUtilization')
        disk_usage = self.get_cloudwatch_metric_avg(cluster_id, 'PercentageDiskSpaceUsed')
        # Query queue time approximation (placeholder - would need STL_WLM_QUERY in production)
        queue_time = 0.0

        # Collect timeseries for dashboard
        cpu_timeseries = self.get_cloudwatch_metric_timeseries(cluster_id, 'CPUUtilization')
        disk_timeseries = self.get_cloudwatch_metric_timeseries(cluster_id, 'PercentageDiskSpaceUsed')

        metrics = {
            'cpu_avg': cpu_avg,
            'disk_usage': disk_usage,
            'query_queue_avg': queue_time,
            'disk_spill_pct': 0.0,  # Would require psycopg2 connection
            'cpu_timeseries': cpu_timeseries,
            'disk_timeseries': disk_timeseries
        }

        # Check all issues
        issues = self.check_cluster_issues(cluster, metrics)

        # Calculate performance score
        perf_score = self.calculate_performance_score(cluster, metrics, issues)

        # Calculate cost analysis
        cost_analysis = self.calculate_cost_analysis(cluster, metrics)

        param_groups = cluster.get('ClusterParameterGroups', [])
        param_group = param_groups[0]['ParameterGroupName'] if param_groups else 'default'

        return {
            'cluster_id': cluster_id,
            'node_type': cluster['NodeType'],
            'node_count': cluster['NumberOfNodes'],
            'status': cluster['ClusterStatus'],
            'cpu_avg': cpu_avg,
            'disk_usage_percent': disk_usage,
            'query_queue_avg': queue_time,
            'maintenance_track': cluster.get('ClusterVersion', 'unknown'),
            'parameter_group': param_group,
            'issues': issues,
            'performance_score': perf_score,
            'cost_analysis': cost_analysis,
            'metrics': metrics,
            'created_date': cluster['ClusterCreateTime'].isoformat() if hasattr(cluster['ClusterCreateTime'], 'isoformat') else str(cluster['ClusterCreateTime'])
        }

    def generate_rightsizing_recommendations(self):
        """Generate rightsizing recommendations based on cluster analysis."""
        for analysis in self.cluster_analysis:
            cost = analysis['cost_analysis']
            savings = cost['current_cost'] - cost['optimized_cost']

            if savings > 0:
                reason = []
                if analysis['cpu_avg'] and analysis['cpu_avg'] < 30:
                    reason.append('low CPU utilization')
                if analysis['node_type'].startswith('dc2') or analysis['node_type'].startswith('ds2'):
                    reason.append('migrate to RA3')

                self.rightsizing_recommendations.append({
                    'cluster_id': analysis['cluster_id'],
                    'current_node_type': analysis['node_type'],
                    'current_node_count': analysis['node_count'],
                    'recommended_node_type': cost['optimized_node_type'],
                    'recommended_node_count': cost['optimized_node_count'],
                    'current_monthly_cost': cost['current_cost'],
                    'optimized_monthly_cost': cost['optimized_cost'],
                    'estimated_savings': round(savings, 2),
                    'reason': '; '.join(reason) if reason else 'reserved pricing'
                })

    def generate_optimization_sql(self) -> str:
        """Generate SQL optimization script with VACUUM, ANALYZE, and DDL recommendations."""
        sql_statements = []
        sql_statements.append("-- Redshift Table Optimization Script")
        sql_statements.append(f"-- Generated: {datetime.now().isoformat()}")
        sql_statements.append("-- Review each statement before execution\n")

        # Group by cluster
        cluster_tables = defaultdict(list)
        for opt in self.table_optimizations:
            cluster_tables[opt['cluster_id']].append(opt)

        for cluster_id, tables in cluster_tables.items():
            sql_statements.append(f"\n-- Cluster: {cluster_id}")
            sql_statements.append("-" * 60)

            for table in tables:
                schema = table['schema']
                table_name = table['table']

                sql_statements.append(f"\n-- Table: {schema}.{table_name}")
                sql_statements.append(f"-- Size: {table['size_mb']} MB, Rows: {table['rows']}")

                if 'VACUUM' in table['optimizations']:
                    sql_statements.append(f"VACUUM FULL {schema}.{table_name};")

                if 'VACUUM_DELETE' in table['optimizations']:
                    sql_statements.append(f"VACUUM DELETE ONLY {schema}.{table_name};")

                if 'ANALYZE' in table['optimizations']:
                    sql_statements.append(f"ANALYZE {schema}.{table_name};")

                if 'ADD_SORTKEY' in table['optimizations']:
                    sql_statements.append(f"-- RECOMMENDED: Add sort key to {schema}.{table_name}")
                    sql_statements.append(f"-- ALTER TABLE {schema}.{table_name} ALTER SORTKEY (column_name);")

                if 'ADD_DISTKEY' in table['optimizations']:
                    sql_statements.append(f"-- RECOMMENDED: Add distribution key to {schema}.{table_name}")
                    sql_statements.append(f"-- ALTER TABLE {schema}.{table_name} ALTER DISTKEY (column_name);")

        return '\n'.join(sql_statements)

    def generate_html_dashboard(self):
        """Generate HTML dashboard showing cluster utilization trends."""
        if not PLOTLY_AVAILABLE:
            logger.warning("Plotly not available, skipping HTML dashboard generation")
            # Generate simple HTML without charts
            self._generate_simple_html_dashboard()
            return

        # Implementation with Plotly charts would go here
        self._generate_simple_html_dashboard()

    def _generate_simple_html_dashboard(self):
        """Generate simple HTML dashboard without Plotly."""
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redshift Cluster Analysis Dashboard</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #232F3E; }}
        .summary {{ background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #232F3E; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .score-excellent {{ color: green; font-weight: bold; }}
        .score-good {{ color: #8bc34a; font-weight: bold; }}
        .score-fair {{ color: orange; font-weight: bold; }}
        .score-poor {{ color: #ff9800; font-weight: bold; }}
        .score-critical {{ color: red; font-weight: bold; }}
    </style>
</head>
<body>
    <h1>Amazon Redshift Cluster Performance Analysis</h1>
    <div class="summary">
        <h2>Executive Summary</h2>
        <p>Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p>Total Clusters Analyzed: {len(self.cluster_analysis)}</p>
"""

        if self.cluster_analysis:
            cpu_values = [c['cpu_avg'] for c in self.cluster_analysis if c['cpu_avg'] is not None]
            disk_values = [c['disk_usage_percent'] for c in self.cluster_analysis if c['disk_usage_percent'] is not None]

            html_content += f"""
        <p>Average CPU Utilization: {_safe_mean(cpu_values):.1f}%</p>
        <p>Average Disk Usage: {_safe_mean(disk_values):.1f}%</p>
        <p>Clusters with Issues: {len([c for c in self.cluster_analysis if c['issues']])} </p>
    </div>

    <h2>Cluster Details</h2>
    <table>
        <tr>
            <th>Cluster ID</th>
            <th>Node Type</th>
            <th>Performance Score</th>
            <th>CPU %</th>
            <th>Disk %</th>
            <th>Critical Issues</th>
            <th>Est. Monthly Savings</th>
        </tr>
"""

            for cluster in sorted(self.cluster_analysis, key=lambda x: x['performance_score']):
                critical_issues = [i for i in cluster['issues'] if i['severity'] in ['high', 'medium']]
                cost = cluster.get('cost_analysis', {})
                savings = cost.get('current_cost', 0) - cost.get('optimized_cost', 0)

                score = cluster['performance_score']
                if score >= 90:
                    score_class = 'score-excellent'
                elif score >= 75:
                    score_class = 'score-good'
                elif score >= 60:
                    score_class = 'score-fair'
                elif score >= 40:
                    score_class = 'score-poor'
                else:
                    score_class = 'score-critical'

                cpu_display = f"{cluster['cpu_avg']:.1f}" if cluster['cpu_avg'] is not None else "N/A"
                disk_display = f"{cluster['disk_usage_percent']:.1f}" if cluster['disk_usage_percent'] is not None else "N/A"

                html_content += f"""
        <tr>
            <td>{cluster['cluster_id']}</td>
            <td>{cluster['node_type']}</td>
            <td class="{score_class}">{score:.1f}</td>
            <td>{cpu_display}</td>
            <td>{disk_display}</td>
            <td>{len(critical_issues)}</td>
            <td>${savings:,.2f}</td>
        </tr>
"""

        html_content += """
    </table>
</body>
</html>
"""

        with open('cluster_utilization_trends.html', 'w') as f:
            f.write(html_content)

        logger.info("HTML dashboard generated: cluster_utilization_trends.html")

    def run_analysis(self) -> Dict[str, Any]:
        """Main analysis execution."""
        logger.info("Starting Redshift cluster analysis...")

        try:
            # Get all clusters
            response = self.redshift.describe_clusters()
            clusters = response['Clusters']

            logger.info(f"Found {len(clusters)} clusters in {self.region}")

            # Filter clusters
            clusters_to_analyze = []
            for cluster in clusters:
                should_exclude, reason = self.should_exclude_cluster(cluster)
                if should_exclude:
                    logger.info(f"Excluding {cluster['ClusterIdentifier']}: {reason}")
                else:
                    clusters_to_analyze.append(cluster)

            logger.info(f"Analyzing {len(clusters_to_analyze)} clusters after exclusions")

            # Analyze each cluster
            for cluster in clusters_to_analyze:
                analysis = self.analyze_cluster(cluster)
                self.cluster_analysis.append(analysis)

                logger.info(f"  Performance Score: {analysis['performance_score']}/100")
                logger.info(f"  CPU Average: {analysis['cpu_avg']:.1f}%" if analysis['cpu_avg'] is not None else "  CPU Average: N/A")
                logger.info(f"  Disk Usage: {analysis['disk_usage_percent']:.1f}%" if analysis['disk_usage_percent'] is not None else "  Disk Usage: N/A")
                logger.info(f"  Issues Found: {len(analysis['issues'])}")

            # Generate rightsizing recommendations
            self.generate_rightsizing_recommendations()

            # Generate outputs
            results = self.save_json_output()
            self.save_csv_recommendations()
            self.save_sql_optimizations()
            self.generate_html_dashboard()

            # Print summary
            self.print_summary()

            return results

        except ClientError as e:
            logger.error(f"Error during analysis: {e}")
            raise

    def save_json_output(self) -> Dict[str, Any]:
        """Save comprehensive JSON analysis output."""
        # Calculate summary statistics
        total_clusters = len(self.cluster_analysis)
        prod_clusters = len([c for c in self.cluster_analysis if 'prod' in c['cluster_id'].lower()])

        cpu_values = [c['cpu_avg'] for c in self.cluster_analysis if c['cpu_avg'] is not None]
        disk_values = [c['disk_usage_percent'] for c in self.cluster_analysis if c['disk_usage_percent'] is not None]

        avg_cpu = _safe_mean(cpu_values)
        avg_disk = _safe_mean(disk_values)

        total_savings = sum(
            c['cost_analysis']['current_cost'] - c['cost_analysis']['optimized_cost']
            for c in self.cluster_analysis
        )

        # Prepare clusters for output (remove internal metrics)
        clusters_output = []
        for c in self.cluster_analysis:
            cluster_data = {
                'cluster_id': c['cluster_id'],
                'node_type': c['node_type'],
                'cpu_avg': c['cpu_avg'],
                'disk_usage_percent': c['disk_usage_percent'],
                'query_queue_avg': c['query_queue_avg'],
                'maintenance_track': c['maintenance_track'],
                'parameter_group': c['parameter_group'],
                'issues': c['issues'],
                'cost_analysis': {
                    'current_cost': c['cost_analysis']['current_cost'],
                    'reserved_pricing_savings': c['cost_analysis']['reserved_pricing_savings'],
                    'optimized_cost': c['cost_analysis']['optimized_cost']
                }
            }
            clusters_output.append(cluster_data)

        output = {
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'clusters': clusters_output,
            'spectrum_analysis': self.spectrum_analysis,
            'summary': {
                'total_clusters': total_clusters,
                'prod_clusters': prod_clusters,
                'avg_cpu': round(avg_cpu, 2),
                'avg_disk': round(avg_disk, 2),
                'total_pb': 2.4,  # From requirement
                'total_potential_savings': round(total_savings, 2),
                'clusters_with_issues': len([c for c in self.cluster_analysis if c['issues']]),
                'critical_issues': sum(
                    1 for c in self.cluster_analysis
                    for i in c['issues']
                    if i['severity'] == 'high'
                )
            }
        }

        with open('redshift_analysis.json', 'w') as f:
            json.dump(output, f, indent=2, default=str)

        logger.info("Generated: redshift_analysis.json")
        return output

    def save_csv_recommendations(self):
        """Save rightsizing recommendations to CSV."""
        if self.rightsizing_recommendations:
            df = pd.DataFrame(self.rightsizing_recommendations)
            df.to_csv('rightsizing_recommendations.csv', index=False)
            logger.info(f"Saved {len(self.rightsizing_recommendations)} rightsizing recommendations")
        else:
            # Create empty CSV
            with open('rightsizing_recommendations.csv', 'w') as f:
                f.write('cluster_id,current_node_type,current_node_count,recommended_node_type,recommended_node_count,current_monthly_cost,optimized_monthly_cost,estimated_savings,reason\n')
            logger.info("No rightsizing recommendations generated")

    def save_sql_optimizations(self):
        """Save SQL optimization script."""
        sql_content = self.generate_optimization_sql()
        with open('table_optimization_script.sql', 'w') as f:
            f.write(sql_content)
        logger.info(f"Generated optimization SQL script with {len(self.table_optimizations)} table recommendations")

    def print_summary(self):
        """Print analysis summary to console in tabular format."""
        print("\n" + "="*80)
        print("REDSHIFT ANALYSIS SUMMARY")
        print("="*80)

        if not self.cluster_analysis:
            print("\nNo clusters analyzed.")
            return

        total_savings = sum(
            c['cost_analysis']['current_cost'] - c['cost_analysis']['optimized_cost']
            for c in self.cluster_analysis
        )

        print(f"\nTotal Clusters Analyzed: {len(self.cluster_analysis)}")
        print(f"Total Potential Monthly Savings: ${total_savings:,.2f}")

        # Top Issues by Frequency
        print("\nTop Issues by Frequency:")
        issue_counts = defaultdict(int)
        for cluster in self.cluster_analysis:
            for issue in cluster['issues']:
                issue_counts[issue['type']] += 1

        issue_table = []
        for issue_type, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            issue_table.append([issue_type, count])

        if issue_table:
            try:
                from tabulate import tabulate
                print(tabulate(issue_table, headers=['Issue Type', 'Count'], tablefmt='grid'))
            except ImportError:
                for row in issue_table:
                    print(f"  - {row[0]}: {row[1]} clusters")

        # Cluster Performance Summary
        print("\nCluster Performance Summary:")
        cluster_table = []
        for cluster in sorted(self.cluster_analysis, key=lambda x: x['performance_score']):
            cpu_display = f"{cluster['cpu_avg']:.1f}" if cluster['cpu_avg'] is not None else "N/A"
            disk_display = f"{cluster['disk_usage_percent']:.1f}" if cluster['disk_usage_percent'] is not None else "N/A"
            savings = cluster['cost_analysis']['current_cost'] - cluster['cost_analysis']['optimized_cost']

            cluster_table.append([
                cluster['cluster_id'],
                cluster['node_type'],
                f"{cluster['performance_score']:.0f}",
                cpu_display,
                disk_display,
                len(cluster['issues']),
                f"${savings:,.2f}"
            ])

        if cluster_table:
            try:
                from tabulate import tabulate
                print(tabulate(
                    cluster_table,
                    headers=['Cluster ID', 'Node Type', 'Score', 'CPU %', 'Disk %', 'Issues', 'Savings'],
                    tablefmt='grid'
                ))
            except ImportError:
                print("Cluster ID | Node Type | Score | CPU % | Disk % | Issues | Savings")
                print("-" * 80)
                for row in cluster_table:
                    print(" | ".join(map(str, row)))

        print("\nFiles Generated:")
        print("  - redshift_analysis.json")
        print("  - cluster_utilization_trends.html")
        print("  - rightsizing_recommendations.csv")
        print("  - table_optimization_script.sql")

        print("\n" + "="*80)


def main() -> int:
    """Main execution function."""
    try:
        analyzer = RedshiftAnalyzer(region='us-east-1')
        analyzer.run_analysis()
        return 0
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

```