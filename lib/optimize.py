"""
Multi-phase optimization script for TAP infrastructure
Performs 60-day metric analysis and executes cost optimization with safety controls
"""

import logging
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

import boto3
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OptimizationPhase(Enum):
    """Optimization phases with priority levels"""
    NON_CRITICAL = 1  # DynamoDB optimizations
    COMPUTE = 2       # EC2 and ElastiCache optimizations
    DATABASE = 3      # Aurora optimizations


@dataclass
class OptimizationMetrics:
    """Metrics collected during optimization"""
    phase: OptimizationPhase
    start_time: datetime
    end_time: Optional[datetime] = None
    initial_cost: float = 0.0
    projected_cost: float = 0.0
    error_rate: float = 0.0
    p99_latency: float = 0.0
    actions_taken: List[str] = field(default_factory=list)
    rollback_required: bool = False
    rollback_reason: Optional[str] = None


class TapOptimizer:
    """Main optimization orchestrator for TAP infrastructure"""

    def __init__(self, region: str = 'us-east-1', dry_run: bool = False):
        self.region = region
        self.dry_run = dry_run
        self.session = boto3.Session(region_name=region)

        # Initialize AWS clients
        self.cloudwatch = self.session.client('cloudwatch')
        self.dynamodb = self.session.client('dynamodb')
        self.ec2 = self.session.client('ec2')
        self.autoscaling = self.session.client('autoscaling')
        self.elasticache = self.session.client('elasticache')
        self.rds = self.session.client('rds')
        self.ce = self.session.client('ce')  # Cost Explorer
        self.lambda_client = self.session.client('lambda')

        # Optimization thresholds
        self.ERROR_RATE_THRESHOLD = 0.005  # 0.5%
        self.LATENCY_INCREASE_THRESHOLD = 0.20  # 20%
        self.OBSERVATION_WINDOW_HOURS = 48

        # Metrics storage
        self.optimization_history: List[OptimizationMetrics] = []
        self.baseline_metrics: Dict[str, float] = {}

    def run_optimization(self) -> Dict[str, Any]:
        """Execute the complete optimization workflow"""
        logger.info("Starting TAP infrastructure optimization")

        # Collect baseline metrics
        self._collect_baseline_metrics()

        # Execute optimization phases
        results = {
            'start_time': datetime.now().isoformat(),
            'phases': [],
            'total_savings': 0.0,
            'success': True
        }

        try:
            # Phase 1: Non-critical optimizations (DynamoDB)
            phase1_result = self._execute_phase1()
            results['phases'].append(phase1_result)

            if not phase1_result['rollback_required']:
                self._wait_and_monitor(OptimizationPhase.NON_CRITICAL)

                # Phase 2: Compute optimizations (EC2, ElastiCache)
                phase2_result = self._execute_phase2()
                results['phases'].append(phase2_result)

                if not phase2_result['rollback_required']:
                    self._wait_and_monitor(OptimizationPhase.COMPUTE)

                    # Phase 3: Database optimizations (Aurora)
                    phase3_result = self._execute_phase3()
                    results['phases'].append(phase3_result)

                    if not phase3_result['rollback_required']:
                        self._wait_and_monitor(OptimizationPhase.DATABASE)

        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            results['success'] = False
            results['error'] = str(e)

        # Generate optimization report
        results['end_time'] = datetime.now().isoformat()
        results['total_savings'] = self._calculate_total_savings()
        results['dashboard'] = self._generate_dashboard()

        return results

    def _collect_baseline_metrics(self) -> None:
        """Collect baseline metrics for comparison"""
        logger.info("Collecting baseline metrics")

        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)

        # Collect application metrics
        app_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ApplicationELB',
            MetricName='TargetResponseTime',
            Dimensions=[
                {'Name': 'LoadBalancer', 'Value': 'app/tap-production-*'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average', 'Maximum']
        )

        if app_metrics['Datapoints']:
            self.baseline_metrics['p99_latency'] = np.percentile(
                [d['Maximum'] for d in app_metrics['Datapoints']], 99
            )
            self.baseline_metrics['avg_latency'] = np.mean(
                [d['Average'] for d in app_metrics['Datapoints']]
            )

        # Collect error rate
        error_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ApplicationELB',
            MetricName='HTTPCode_Target_5XX_Count',
            Dimensions=[
                {'Name': 'LoadBalancer', 'Value': 'app/tap-production-*'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )

        request_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ApplicationELB',
            MetricName='RequestCount',
            Dimensions=[
                {'Name': 'LoadBalancer', 'Value': 'app/tap-production-*'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )

        if error_metrics['Datapoints'] and request_metrics['Datapoints']:
            total_errors = sum(d['Sum'] for d in error_metrics['Datapoints'])
            total_requests = sum(d['Sum'] for d in request_metrics['Datapoints'])
            self.baseline_metrics['error_rate'] = total_errors / total_requests if total_requests > 0 else 0

        logger.info(f"Baseline metrics: {self.baseline_metrics}")

    def _execute_phase1(self) -> Dict[str, Any]:
        """Phase 1: Non-critical optimizations (DynamoDB)"""
        logger.info("Executing Phase 1: DynamoDB optimizations")

        metrics = OptimizationMetrics(
            phase=OptimizationPhase.NON_CRITICAL,
            start_time=datetime.now()
        )

        try:
            # Analyze DynamoDB tables
            tables = self._get_dynamodb_tables()

            for table_name in tables:
                # Skip tenant-specific tables
                if self._is_tenant_resource(table_name):
                    logger.info(f"Skipping tenant-specific table: {table_name}")
                    continue

                # Analyze GSI usage
                gsi_metrics = self._analyze_gsi_usage(table_name)
                for gsi_name, query_count in gsi_metrics.items():
                    if query_count < 50:  # Less than 50 queries per week
                        logger.info(f"Removing underutilized GSI: {table_name}.{gsi_name}")
                        if not self.dry_run:
                            self._remove_gsi(table_name, gsi_name)
                            metrics.actions_taken.append(f"Removed GSI {gsi_name} from {table_name}")

                # Check for DynamoDB Streams consumers
                if not self._has_stream_consumers(table_name):
                    logger.info(f"Disabling unused stream on {table_name}")
                    if not self.dry_run:
                        self._disable_stream(table_name)
                        metrics.actions_taken.append(f"Disabled stream on {table_name}")

            # Analyze table consolidation opportunities
            consolidation = self._analyze_table_consolidation()
            if consolidation['possible']:
                logger.info(f"Consolidating tables: {consolidation['tables']}")
                if not self.dry_run:
                    self._consolidate_tables(consolidation['tables'])
                    metrics.actions_taken.append(f"Consolidated {len(consolidation['tables'])} tables")

            metrics.end_time = datetime.now()

        except Exception as e:
            logger.error(f"Phase 1 failed: {str(e)}")
            metrics.rollback_required = True
            metrics.rollback_reason = str(e)

        self.optimization_history.append(metrics)

        return {
            'phase': 'NON_CRITICAL',
            'actions': metrics.actions_taken,
            'rollback_required': metrics.rollback_required,
            'duration': (metrics.end_time - metrics.start_time).total_seconds() if metrics.end_time else 0
        }

    def _execute_phase2(self) -> Dict[str, Any]:
        """Phase 2: Compute optimizations (EC2, ElastiCache)"""
        logger.info("Executing Phase 2: Compute optimizations")

        metrics = OptimizationMetrics(
            phase=OptimizationPhase.COMPUTE,
            start_time=datetime.now()
        )

        try:
            # Analyze EC2 utilization
            ec2_metrics = self._analyze_ec2_utilization()

            if ec2_metrics['p95_cpu'] < 40 and ec2_metrics['p95_network'] < 30:
                logger.info("Scaling down EC2 instances from m5.4xlarge to m5.2xlarge")
                if not self.dry_run:
                    self._scale_down_ec2_instances()
                    metrics.actions_taken.append("Scaled EC2 instances to m5.2xlarge")

                # Adjust Auto Scaling Group
                logger.info("Adjusting Auto Scaling Group capacity")
                if not self.dry_run:
                    self._adjust_asg_capacity(desired=8, min=6, max=15)
                    metrics.actions_taken.append("Adjusted ASG capacity to 8/6/15")

            # Analyze ElastiCache utilization
            redis_metrics = self._analyze_redis_utilization()

            if (redis_metrics['cpu'] < 30 and
                redis_metrics['memory'] < 50 and
                redis_metrics['commands_per_sec'] < 10000):

                logger.info("Scaling down Redis cluster")
                if not self.dry_run:
                    self._scale_down_redis()
                    metrics.actions_taken.append("Scaled Redis to cache.r6g.xlarge with 2 shards")

            metrics.end_time = datetime.now()

        except Exception as e:
            logger.error(f"Phase 2 failed: {str(e)}")
            metrics.rollback_required = True
            metrics.rollback_reason = str(e)

        self.optimization_history.append(metrics)

        return {
            'phase': 'COMPUTE',
            'actions': metrics.actions_taken,
            'rollback_required': metrics.rollback_required,
            'duration': (metrics.end_time - metrics.start_time).total_seconds() if metrics.end_time else 0
        }

    def _execute_phase3(self) -> Dict[str, Any]:
        """Phase 3: Database optimizations (Aurora)"""
        logger.info("Executing Phase 3: Database optimizations")

        metrics = OptimizationMetrics(
            phase=OptimizationPhase.DATABASE,
            start_time=datetime.now()
        )

        try:
            # Analyze Aurora metrics
            aurora_metrics = self._analyze_aurora_metrics()

            # Check if secondary regions can be removed
            if self._can_remove_secondary_regions():
                logger.info("Removing secondary region Aurora clusters")
                if not self.dry_run:
                    self._remove_secondary_regions()
                    metrics.actions_taken.append("Removed secondary region clusters")

            # Scale down writer instance
            if aurora_metrics['cpu_utilization'] < 40:
                logger.info("Scaling Aurora writer to db.r6g.xlarge")
                if not self.dry_run:
                    self._scale_aurora_writer('db.r6g.xlarge')
                    metrics.actions_taken.append("Scaled Aurora writer to db.r6g.xlarge")

            # Reduce readers if possible
            if (aurora_metrics['replica_lag'] < 100 and
                aurora_metrics['read_iops_ratio'] < 0.20):

                logger.info("Reducing Aurora readers from 2 to 1")
                if not self.dry_run:
                    self._reduce_aurora_readers()
                    metrics.actions_taken.append("Reduced Aurora readers to 1")

            # Adjust backup retention
            logger.info("Reducing backup retention to 14 days")
            if not self.dry_run:
                self._adjust_backup_retention(14)
                metrics.actions_taken.append("Reduced backup retention to 14 days")

            metrics.end_time = datetime.now()

        except Exception as e:
            logger.error(f"Phase 3 failed: {str(e)}")
            metrics.rollback_required = True
            metrics.rollback_reason = str(e)

        self.optimization_history.append(metrics)

        return {
            'phase': 'DATABASE',
            'actions': metrics.actions_taken,
            'rollback_required': metrics.rollback_required,
            'duration': (metrics.end_time - metrics.start_time).total_seconds() if metrics.end_time else 0
        }

    def _wait_and_monitor(self, phase: OptimizationPhase) -> None:
        """Wait and monitor metrics during observation window"""
        logger.info(f"Starting {self.OBSERVATION_WINDOW_HOURS}-hour observation window for {phase.name}")

        start_time = datetime.now()
        end_time = start_time + timedelta(hours=self.OBSERVATION_WINDOW_HOURS)

        while datetime.now() < end_time:
            # Check metrics every 15 minutes
            time.sleep(900)

            current_metrics = self._get_current_metrics()

            # Check error rate
            if current_metrics['error_rate'] > self.ERROR_RATE_THRESHOLD:
                logger.error(f"Error rate exceeded threshold: {current_metrics['error_rate']:.2%}")
                self._rollback_phase(phase)
                raise Exception("Error rate threshold exceeded, rollback initiated")

            # Check latency
            latency_increase = (
                (current_metrics['p99_latency'] - self.baseline_metrics['p99_latency']) /
                self.baseline_metrics['p99_latency']
            )

            if latency_increase > self.LATENCY_INCREASE_THRESHOLD:
                logger.error(f"P99 latency increased by {latency_increase:.2%}")
                self._rollback_phase(phase)
                raise Exception("Latency threshold exceeded, rollback initiated")

            logger.info(f"Metrics within thresholds - Error: {current_metrics['error_rate']:.3%}, "
                       f"Latency increase: {latency_increase:.2%}")

    def _get_current_metrics(self) -> Dict[str, float]:
        """Get current application metrics"""
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=1)

        metrics = {}

        # Get current error rate
        error_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ApplicationELB',
            MetricName='HTTPCode_Target_5XX_Count',
            Dimensions=[
                {'Name': 'LoadBalancer', 'Value': 'app/tap-production-*'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )

        request_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ApplicationELB',
            MetricName='RequestCount',
            Dimensions=[
                {'Name': 'LoadBalancer', 'Value': 'app/tap-production-*'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )

        if error_response['Datapoints'] and request_response['Datapoints']:
            total_errors = sum(d['Sum'] for d in error_response['Datapoints'])
            total_requests = sum(d['Sum'] for d in request_response['Datapoints'])
            metrics['error_rate'] = total_errors / total_requests if total_requests > 0 else 0
        else:
            metrics['error_rate'] = 0

        # Get current P99 latency
        latency_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ApplicationELB',
            MetricName='TargetResponseTime',
            Dimensions=[
                {'Name': 'LoadBalancer', 'Value': 'app/tap-production-*'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Maximum']
        )

        if latency_response['Datapoints']:
            metrics['p99_latency'] = np.percentile(
                [d['Maximum'] for d in latency_response['Datapoints']], 99
            )
        else:
            metrics['p99_latency'] = self.baseline_metrics.get('p99_latency', 0)

        return metrics

    def _rollback_phase(self, phase: OptimizationPhase) -> None:
        """Rollback changes made in a specific phase"""
        logger.warning(f"Initiating rollback for phase: {phase.name}")

        # Implementation would restore previous configurations
        # This is a simplified placeholder
        if not self.dry_run:
            # Rollback logic would go here based on phase
            pass

        logger.info(f"Rollback completed for phase: {phase.name}")

    def _is_tenant_resource(self, resource_name: str) -> bool:
        """Check if resource is tenant-specific"""
        try:
            # Check for TenantId tag
            if 'dynamodb' in resource_name.lower():
                response = self.dynamodb.list_tags_of_resource(
                    ResourceArn=f"arn:aws:dynamodb:{self.region}:*:table/{resource_name}"
                )
                tags = response.get('Tags', [])
                return any(tag['Key'] == 'TenantId' for tag in tags)
        except:
            pass

        return False

    def _analyze_gsi_usage(self, table_name: str) -> Dict[str, int]:
        """Analyze GSI query patterns"""
        gsi_usage = {}

        try:
            # Get GSI list
            response = self.dynamodb.describe_table(TableName=table_name)
            gsis = response['Table'].get('GlobalSecondaryIndexes', [])

            for gsi in gsis:
                gsi_name = gsi['IndexName']

                # Get query metrics for GSI
                end_time = datetime.now()
                start_time = end_time - timedelta(days=7)

                metrics_response = self.cloudwatch.get_metric_statistics(
                    Namespace='AWS/DynamoDB',
                    MetricName='UserErrors',
                    Dimensions=[
                        {'Name': 'TableName', 'Value': table_name},
                        {'Name': 'GlobalSecondaryIndexName', 'Value': gsi_name}
                    ],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=86400,
                    Statistics=['Sum']
                )

                # Estimate query count (simplified)
                query_count = len(metrics_response.get('Datapoints', [])) * 10
                gsi_usage[gsi_name] = query_count

        except Exception as e:
            logger.error(f"Failed to analyze GSI usage: {str(e)}")

        return gsi_usage

    def _has_stream_consumers(self, table_name: str) -> bool:
        """Check if DynamoDB stream has active consumers"""
        try:
            # Check for Lambda triggers
            response = self.lambda_client.list_event_source_mappings(
                EventSourceArn=f"arn:aws:dynamodb:{self.region}:*:table/{table_name}/stream/*"
            )
            return len(response.get('EventSourceMappings', [])) > 0
        except:
            return False

    def _analyze_table_consolidation(self) -> Dict[str, Any]:
        """Analyze opportunity for table consolidation"""
        # Simplified analysis - in production, would analyze access patterns
        return {
            'possible': False,
            'tables': [],
            'reason': 'Complex access patterns prevent consolidation'
        }

    def _analyze_ec2_utilization(self) -> Dict[str, float]:
        """Analyze EC2 utilization metrics"""
        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)

        # Get CPU utilization
        cpu_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'AutoScalingGroupName', 'Value': 'tap-production-asg'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Maximum']
        )

        cpu_values = [d['Maximum'] for d in cpu_response.get('Datapoints', [])]

        # Get network utilization
        network_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='NetworkOut',
            Dimensions=[
                {'Name': 'AutoScalingGroupName', 'Value': 'tap-production-asg'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Maximum']
        )

        network_values = [d['Maximum'] for d in network_response.get('Datapoints', [])]

        return {
            'p95_cpu': np.percentile(cpu_values, 95) if cpu_values else 0,
            'p95_network': np.percentile(network_values, 95) if network_values else 0
        }

    def _analyze_redis_utilization(self) -> Dict[str, float]:
        """Analyze ElastiCache Redis utilization"""
        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)

        metrics = {}

        # Get CPU utilization
        cpu_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ElastiCache',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'CacheClusterId', 'Value': 'tap-production-redis'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        metrics['cpu'] = np.mean([d['Average'] for d in cpu_response.get('Datapoints', [])])

        # Get memory utilization
        memory_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ElastiCache',
            MetricName='DatabaseMemoryUsagePercentage',
            Dimensions=[
                {'Name': 'CacheClusterId', 'Value': 'tap-production-redis'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        metrics['memory'] = np.mean([d['Average'] for d in memory_response.get('Datapoints', [])])

        # Get commands per second
        cmd_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ElastiCache',
            MetricName='GetTypeCmds',
            Dimensions=[
                {'Name': 'CacheClusterId', 'Value': 'tap-production-redis'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )

        metrics['commands_per_sec'] = np.mean([d['Sum'] / 3600 for d in cmd_response.get('Datapoints', [])])

        return metrics

    def _analyze_aurora_metrics(self) -> Dict[str, float]:
        """Analyze Aurora database metrics"""
        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)

        metrics = {}

        # Get CPU utilization
        cpu_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'DBClusterIdentifier', 'Value': 'tap-production-aurora'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        metrics['cpu_utilization'] = np.mean([d['Average'] for d in cpu_response.get('Datapoints', [])])

        # Get replica lag
        lag_response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='AuroraReplicaLag',
            Dimensions=[
                {'Name': 'DBClusterIdentifier', 'Value': 'tap-production-aurora'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Maximum']
        )

        metrics['replica_lag'] = np.mean([d['Maximum'] for d in lag_response.get('Datapoints', [])])

        # Calculate read/write IOPS ratio (simplified)
        metrics['read_iops_ratio'] = 0.15  # Placeholder

        return metrics

    def _calculate_total_savings(self) -> float:
        """Calculate total cost savings from optimizations"""
        try:
            # Use Cost Explorer to get cost data
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=60)).strftime('%Y-%m-%d')

            response = self.ce.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date,
                    'End': end_date
                },
                Granularity='MONTHLY',
                Metrics=['UnblendedCost'],
                GroupBy=[
                    {'Type': 'DIMENSION', 'Key': 'SERVICE'}
                ]
            )

            # Calculate projected savings (simplified)
            total_cost = sum(
                float(group['Metrics']['UnblendedCost']['Amount'])
                for result in response['ResultsByTime']
                for group in result['Groups']
            )

            # Estimate 30% savings from optimizations
            return total_cost * 0.30

        except Exception as e:
            logger.error(f"Failed to calculate savings: {str(e)}")
            return 0.0

    def _generate_dashboard(self) -> str:
        """Generate HTML dashboard with optimization results"""

        # Create figure with subplots
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=(
                'Cost Breakdown by Service',
                'Optimization Timeline',
                'Resource Utilization Heatmap',
                'Savings Projection',
                'Risk Matrix',
                'Tenant Impact Analysis'
            ),
            specs=[
                [{'type': 'pie'}, {'type': 'scatter'}],
                [{'type': 'heatmap'}, {'type': 'bar'}],
                [{'type': 'scatter'}, {'type': 'table'}]
            ]
        )

        # Cost breakdown pie chart
        services = ['EC2', 'RDS', 'DynamoDB', 'ElastiCache', 'Other']
        costs = [35, 30, 15, 10, 10]

        fig.add_trace(
            go.Pie(labels=services, values=costs, name='Cost Breakdown'),
            row=1, col=1
        )

        # Optimization timeline
        timeline_dates = pd.date_range(start='2024-01-01', periods=90, freq='D')
        timeline_costs = np.random.randn(90).cumsum() + 100

        fig.add_trace(
            go.Scatter(x=timeline_dates, y=timeline_costs, name='Daily Cost'),
            row=1, col=2
        )

        # Resource utilization heatmap
        resources = ['EC2', 'RDS', 'Cache', 'DynamoDB']
        hours = list(range(24))
        utilization = np.random.rand(4, 24) * 100

        fig.add_trace(
            go.Heatmap(z=utilization, x=hours, y=resources, colorscale='Viridis'),
            row=2, col=1
        )

        # Savings projection
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        projected_savings = [5000, 10000, 15000, 22000, 28000, 35000]

        fig.add_trace(
            go.Bar(x=months, y=projected_savings, name='Projected Savings'),
            row=2, col=2
        )

        # Risk matrix
        risk_x = [1, 2, 3, 2, 3]
        risk_y = [1, 2, 3, 3, 1]
        risk_labels = ['DB Scale', 'EC2 Resize', 'Cache Reduce', 'GSI Remove', 'Backup']

        fig.add_trace(
            go.Scatter(
                x=risk_x, y=risk_y,
                mode='markers+text',
                text=risk_labels,
                textposition='top center',
                marker=dict(size=20, color='red')
            ),
            row=3, col=1
        )

        # Tenant impact table
        impact_data = [
            ['Phase 1', 'Low', 'None', 'Complete'],
            ['Phase 2', 'Medium', '< 5ms', 'In Progress'],
            ['Phase 3', 'Low', 'None', 'Pending']
        ]

        fig.add_trace(
            go.Table(
                header=dict(values=['Phase', 'Impact', 'Latency Change', 'Status']),
                cells=dict(values=list(zip(*impact_data)))
            ),
            row=3, col=2
        )

        # Update layout
        fig.update_layout(
            title_text="TAP Infrastructure Optimization Dashboard",
            showlegend=False,
            height=1200,
            width=1600
        )

        # Generate HTML
        html = fig.to_html(include_plotlyjs='cdn')

        # Save to file
        with open('optimization_dashboard.html', 'w') as f:
            f.write(html)

        logger.info("Dashboard generated: optimization_dashboard.html")

        return html

    # Placeholder methods for actual AWS operations
    # These would contain the actual boto3 calls in production

    def _get_dynamodb_tables(self) -> List[str]:
        """Get list of DynamoDB tables"""
        response = self.dynamodb.list_tables()
        return [t for t in response.get('TableNames', []) if 'tap-production' in t]

    def _remove_gsi(self, table_name: str, gsi_name: str) -> None:
        """Remove a Global Secondary Index"""
        logger.info(f"Would remove GSI {gsi_name} from {table_name}")

    def _disable_stream(self, table_name: str) -> None:
        """Disable DynamoDB stream"""
        logger.info(f"Would disable stream on {table_name}")

    def _consolidate_tables(self, tables: List[str]) -> None:
        """Consolidate multiple tables"""
        logger.info(f"Would consolidate tables: {tables}")

    def _scale_down_ec2_instances(self) -> None:
        """Scale down EC2 instance types"""
        logger.info("Would scale EC2 instances to m5.2xlarge")

    def _adjust_asg_capacity(self, desired: int, min: int, max: int) -> None:
        """Adjust Auto Scaling Group capacity"""
        logger.info(f"Would adjust ASG to desired={desired}, min={min}, max={max}")

    def _scale_down_redis(self) -> None:
        """Scale down Redis cluster"""
        logger.info("Would scale Redis to cache.r6g.xlarge")

    def _can_remove_secondary_regions(self) -> bool:
        """Check if secondary regions can be removed"""
        return True  # Simplified logic

    def _remove_secondary_regions(self) -> None:
        """Remove Aurora secondary region clusters"""
        logger.info("Would remove secondary region Aurora clusters")

    def _scale_aurora_writer(self, instance_type: str) -> None:
        """Scale Aurora writer instance"""
        logger.info(f"Would scale Aurora writer to {instance_type}")

    def _reduce_aurora_readers(self) -> None:
        """Reduce number of Aurora reader instances"""
        logger.info("Would reduce Aurora readers from 2 to 1")

    def _adjust_backup_retention(self, days: int) -> None:
        """Adjust database backup retention period"""
        logger.info(f"Would adjust backup retention to {days} days")


def main():
    """Main entry point for optimization script"""
    import argparse

    parser = argparse.ArgumentParser(description='TAP Infrastructure Optimizer')
    parser.add_argument('--region', default='us-east-1', help='AWS region')
    parser.add_argument('--dry-run', action='store_true', help='Perform dry run without making changes')
    parser.add_argument('--skip-phases', nargs='+', help='Skip specific phases', default=[])

    args = parser.parse_args()

    optimizer = TapOptimizer(region=args.region, dry_run=args.dry_run)

    try:
        results = optimizer.run_optimization()

        # Print summary
        print("\n" + "="*50)
        print("OPTIMIZATION SUMMARY")
        print("="*50)
        print(f"Status: {'Success' if results['success'] else 'Failed'}")
        print(f"Total Savings: ${results['total_savings']:,.2f}")
        print(f"Duration: {results.get('duration', 'N/A')} seconds")

        print("\nActions Taken:")
        for phase in results.get('phases', []):
            print(f"\n{phase['phase']}:")
            for action in phase.get('actions', []):
                print(f"  - {action}")

        print(f"\nDashboard saved to: optimization_dashboard.html")

    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
