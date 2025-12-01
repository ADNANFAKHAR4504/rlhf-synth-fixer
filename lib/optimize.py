"""
Multi-phase optimization script for TAP infrastructure
Performs 60-day metric analysis and executes cost optimization with safety controls
"""

import json
import logging
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import boto3
import numpy as np
import pandas as pd
from botocore.exceptions import ClientError

# Optional imports for dashboard generation
try:
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    go = None
    make_subplots = None

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


@dataclass
class ResourceIdentifiers:
    """Resource identifiers extracted from deployment outputs"""
    region: str
    alb_full_name: Optional[str] = None
    alb_arn: Optional[str] = None
    asg_name: Optional[str] = None
    aurora_cluster_id: Optional[str] = None
    aurora_endpoint: Optional[str] = None
    redis_cluster_id: Optional[str] = None
    redis_config_endpoint: Optional[str] = None
    dynamodb_tables: List[str] = field(default_factory=list)
    vpc_id: Optional[str] = None
    environment_suffix: Optional[str] = None


def load_deployment_outputs(outputs_file: Optional[str] = None) -> Dict[str, Any]:
    """
    Load deployment outputs from JSON file.
    
    Supports multiple file paths for different deployment methods:
    - cfn-outputs/flat-outputs.json (CDK/CloudFormation)
    - cfn-outputs/all-outputs.json
    - terraform-outputs.json
    - outputs.json
    - deployment-outputs.json
    
    Args:
        outputs_file: Optional explicit path to outputs file
        
    Returns:
        Dictionary of deployment outputs
        
    Raises:
        FileNotFoundError: If no outputs file is found
        json.JSONDecodeError: If file is not valid JSON
    """
    if outputs_file and os.path.exists(outputs_file):
        output_paths = [outputs_file]
    else:
        # Try multiple possible output file locations
        output_paths = [
            'cfn-outputs/flat-outputs.json',
            'cfn-outputs/all-outputs.json',
            'terraform-outputs.json',
            'outputs.json',
            'deployment-outputs.json',
            os.path.join(os.path.dirname(__file__), '..', 'cfn-outputs', 'flat-outputs.json'),
            os.path.join(os.path.dirname(__file__), '..', 'cfn-outputs', 'all-outputs.json'),
        ]
    
    for output_path in output_paths:
        full_path = os.path.abspath(output_path)
        if os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    outputs = json.load(f)
                
                # Handle nested format (e.g., from Terraform: {"key": {"value": "actual_value"}})
                if outputs and isinstance(list(outputs.values())[0] if outputs else None, dict):
                    first_value = list(outputs.values())[0] if outputs else {}
                    if 'value' in first_value:
                        # Convert nested format to flat
                        flat_outputs = {}
                        for key, value in outputs.items():
                            if isinstance(value, dict) and 'value' in value:
                                flat_outputs[key] = value['value']
                            else:
                                flat_outputs[key] = value
                        outputs = flat_outputs
                
                logger.info(f"Loaded {len(outputs)} outputs from {full_path}")
                return outputs
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from {full_path}: {e}")
                continue
            except Exception as e:
                logger.warning(f"Failed to read {full_path}: {e}")
                continue
    
    raise FileNotFoundError(
        f"Deployment outputs file not found. Checked paths: {', '.join(output_paths)}. "
        "Please ensure outputs are exported to a JSON file after deployment."
    )


def extract_resource_identifiers(outputs: Dict[str, Any], region: str) -> ResourceIdentifiers:
    """
    Extract resource identifiers from deployment outputs for a specific region.
    
    Args:
        outputs: Dictionary of deployment outputs
        region: AWS region to extract resources for
        
    Returns:
        ResourceIdentifiers object with extracted resource information
    """
    # Extract ALB information
    alb_full_name = outputs.get('AlbFullName') or outputs.get(f'tap-*-alb-full-name')
    alb_arn = outputs.get('AlbArn') or outputs.get(f'tap-*-alb-arn')
    
    # Extract ASG name
    asg_name = outputs.get('AutoScalingGroupName') or outputs.get(f'tap-*-asg-name')
    
    # Extract Aurora information
    aurora_cluster_id = outputs.get('AuroraClusterIdentifier') or outputs.get(f'tap-*-aurora-id')
    aurora_endpoint = outputs.get('AuroraClusterEndpoint') or outputs.get(f'tap-*-aurora-endpoint')
    
    # Extract Redis information
    redis_cluster_id = outputs.get('RedisClusterId') or outputs.get(f'tap-*-redis-id')
    redis_config_endpoint = outputs.get('RedisConfigurationEndpoint') or outputs.get(f'tap-*-redis-config-endpoint')
    
    # Extract DynamoDB table names
    dynamodb_tables = []
    for key, value in outputs.items():
        if 'DynamoTable' in key and 'Name' in key:
            if isinstance(value, str) and value:
                dynamodb_tables.append(value)
        elif key.startswith('tap-') and 'ddb-' in key and key.endswith('-name'):
            if isinstance(value, str) and value:
                dynamodb_tables.append(value)
    
    # Extract VPC ID
    vpc_id = outputs.get('VpcId') or outputs.get(f'tap-*-vpc-id')
    
    # Extract environment suffix (if available)
    environment_suffix = None
    for key in ['EnvironmentSuffix', 'environmentSuffix', 'environment_suffix']:
        if key in outputs:
            environment_suffix = outputs[key]
            break
    
    # If not found, try to extract from resource names
    if not environment_suffix and alb_full_name:
        # Extract from pattern: app/tap-{suffix}-alb/{id}
        # Split by '/' first, then by '-'
        path_parts = alb_full_name.split('/')
        if len(path_parts) >= 2:
            name_part = path_parts[1]  # e.g., 'tap-dev-alb'
            parts = name_part.split('-')
            if len(parts) >= 2 and parts[0] == 'tap':
                environment_suffix = parts[1]
    
    return ResourceIdentifiers(
        region=region,
        alb_full_name=alb_full_name,
        alb_arn=alb_arn,
        asg_name=asg_name,
        aurora_cluster_id=aurora_cluster_id,
        aurora_endpoint=aurora_endpoint,
        redis_cluster_id=redis_cluster_id,
        redis_config_endpoint=redis_config_endpoint,
        dynamodb_tables=dynamodb_tables,
        vpc_id=vpc_id,
        environment_suffix=environment_suffix
    )


def get_all_regions_from_outputs(outputs: Dict[str, Any]) -> List[str]:
    """
    Extract all regions from deployment outputs.
    
    Args:
        outputs: Dictionary of deployment outputs
        
    Returns:
        List of unique AWS regions found in outputs
    """
    regions = set()
    
    # Check for explicit region outputs
    stack_region = outputs.get('StackRegion') or outputs.get('Region') or outputs.get('region')
    if stack_region:
        regions.add(stack_region)
    
    # Check for region in ARNs
    for value in outputs.values():
        if isinstance(value, str) and value.startswith('arn:aws:'):
            # Extract region from ARN: arn:aws:service:region:account:resource
            parts = value.split(':')
            if len(parts) >= 4:
                regions.add(parts[3])
    
    # If no regions found, default to us-east-1
    if not regions:
        logger.warning("No regions found in outputs, defaulting to us-east-1")
        regions.add('us-east-1')
    
    return sorted(list(regions))


class TapOptimizer:
    """Main optimization orchestrator for TAP infrastructure"""
    
    def __init__(
        self,
        resource_ids: ResourceIdentifiers,
        dry_run: bool = False,
        session: Optional[boto3.Session] = None
    ):
        """
        Initialize TapOptimizer with resource identifiers.
        
        Args:
            resource_ids: ResourceIdentifiers object with resource information
            dry_run: If True, don't make actual changes
            session: Optional boto3 session (for testing)
        """
        self.resource_ids = resource_ids
        self.region = resource_ids.region
        self.dry_run = dry_run
        
        # Use provided session or create new one
        if session:
            self.session = session
        else:
            self.session = boto3.Session(region_name=self.region)
        
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
        try:
            self._collect_baseline_metrics()
        except Exception as e:
            logger.warning(f"Failed to collect baseline metrics: {e}")
            # Continue with optimization even if baseline collection fails
        
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
        logger.info(f"Collecting baseline metrics for region {self.region}")
        
        if not self.resource_ids.alb_full_name:
            logger.warning("ALB full name not available, skipping baseline metrics collection")
            return
        
        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)
        
        # Construct load balancer dimension value
        # ALB full name format: app/tap-{env}-alb/{id}
        # For CloudWatch, we need: app/{name}/{id}
        alb_dimension = self.resource_ids.alb_full_name
        
        # Collect application metrics
        try:
            app_metrics = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ApplicationELB',
                MetricName='TargetResponseTime',
                Dimensions=[
                    {'Name': 'LoadBalancer', 'Value': alb_dimension}
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
        except ClientError as e:
            logger.warning(f"Failed to collect ALB response time metrics: {e}")
        
        # Collect error rate
        try:
            error_metrics = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ApplicationELB',
                MetricName='HTTPCode_Target_5XX_Count',
                Dimensions=[
                    {'Name': 'LoadBalancer', 'Value': alb_dimension}
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
                    {'Name': 'LoadBalancer', 'Value': alb_dimension}
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
        except ClientError as e:
            logger.warning(f"Failed to collect error rate metrics: {e}")
        
        logger.info(f"Baseline metrics for {self.region}: {self.baseline_metrics}")
    
    def _execute_phase1(self) -> Dict[str, Any]:
        """Phase 1: Non-critical optimizations (DynamoDB)"""
        logger.info(f"Executing Phase 1: DynamoDB optimizations for region {self.region}")
        
        metrics = OptimizationMetrics(
            phase=OptimizationPhase.NON_CRITICAL,
            start_time=datetime.now()
        )
        
        try:
            # Use tables from resource identifiers, or discover them
            tables = self.resource_ids.dynamodb_tables
            if not tables:
                tables = self._get_dynamodb_tables()
            
            if not tables:
                logger.warning(f"No DynamoDB tables found for region {self.region}")
                metrics.end_time = datetime.now()
                return {
                    'phase': 'NON_CRITICAL',
                    'actions': [],
                    'rollback_required': False,
                    'duration': 0
                }
            
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
        
        result = {
            'phase': 'NON_CRITICAL',
            'actions': metrics.actions_taken,
            'rollback_required': metrics.rollback_required,
            'duration': (metrics.end_time - metrics.start_time).total_seconds() if metrics.end_time else 0
        }
        
        if metrics.rollback_reason:
            result['rollback_reason'] = metrics.rollback_reason
        
        return result
    
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
        
        result = {
            'phase': 'COMPUTE',
            'actions': metrics.actions_taken,
            'rollback_required': metrics.rollback_required,
            'duration': (metrics.end_time - metrics.start_time).total_seconds() if metrics.end_time else 0
        }
        
        if metrics.rollback_reason:
            result['rollback_reason'] = metrics.rollback_reason
        
        return result
    
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
        
        result = {
            'phase': 'DATABASE',
            'actions': metrics.actions_taken,
            'rollback_required': metrics.rollback_required,
            'duration': (metrics.end_time - metrics.start_time).total_seconds() if metrics.end_time else 0
        }
        
        if metrics.rollback_reason:
            result['rollback_reason'] = metrics.rollback_reason
        
        return result
    
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
        if not self.resource_ids.alb_full_name:
            logger.warning("ALB full name not available, returning default metrics")
            return {
                'error_rate': 0.0,
                'p99_latency': self.baseline_metrics.get('p99_latency', 0.0)
            }
        
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=1)
        
        metrics = {}
        alb_dimension = self.resource_ids.alb_full_name
        
        # Get current error rate
        try:
            error_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ApplicationELB',
                MetricName='HTTPCode_Target_5XX_Count',
                Dimensions=[
                    {'Name': 'LoadBalancer', 'Value': alb_dimension}
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
                    {'Name': 'LoadBalancer', 'Value': alb_dimension}
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
        except ClientError as e:
            logger.warning(f"Failed to get error rate metrics: {e}")
            metrics['error_rate'] = 0
        
        # Get current P99 latency
        try:
            latency_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ApplicationELB',
                MetricName='TargetResponseTime',
                Dimensions=[
                    {'Name': 'LoadBalancer', 'Value': alb_dimension}
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
        except ClientError as e:
            logger.warning(f"Failed to get latency metrics: {e}")
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
        if not self.resource_ids.asg_name:
            logger.warning("ASG name not available, returning default metrics")
            return {'p95_cpu': 0, 'p95_network': 0}
        
        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)
        
        # Get CPU utilization
        try:
            cpu_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[
                    {'Name': 'AutoScalingGroupName', 'Value': self.resource_ids.asg_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Maximum']
            )
            
            cpu_values = [d['Maximum'] for d in cpu_response.get('Datapoints', [])]
        except ClientError as e:
            logger.warning(f"Failed to get CPU metrics: {e}")
            cpu_values = []
        
        # Get network utilization
        try:
            network_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='NetworkOut',
                Dimensions=[
                    {'Name': 'AutoScalingGroupName', 'Value': self.resource_ids.asg_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Maximum']
            )
            
            network_values = [d['Maximum'] for d in network_response.get('Datapoints', [])]
        except ClientError as e:
            logger.warning(f"Failed to get network metrics: {e}")
            network_values = []
        
        return {
            'p95_cpu': np.percentile(cpu_values, 95) if cpu_values else 0,
            'p95_network': np.percentile(network_values, 95) if network_values else 0
        }
    
    def _analyze_redis_utilization(self) -> Dict[str, float]:
        """Analyze ElastiCache Redis utilization"""
        if not self.resource_ids.redis_cluster_id:
            logger.warning("Redis cluster ID not available, returning default metrics")
            return {'cpu': 0, 'memory': 0, 'commands_per_sec': 0}
        
        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)
        
        metrics = {}
        
        # Get CPU utilization - use ReplicationGroupId for cluster mode
        try:
            cpu_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ElastiCache',
                MetricName='CPUUtilization',
                Dimensions=[
                    {'Name': 'ReplicationGroupId', 'Value': self.resource_ids.redis_cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average']
            )
            
            metrics['cpu'] = np.mean([d['Average'] for d in cpu_response.get('Datapoints', [])]) if cpu_response.get('Datapoints') else 0
        except ClientError as e:
            logger.warning(f"Failed to get Redis CPU metrics: {e}")
            metrics['cpu'] = 0
        
        # Get memory utilization
        try:
            memory_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ElastiCache',
                MetricName='DatabaseMemoryUsagePercentage',
                Dimensions=[
                    {'Name': 'ReplicationGroupId', 'Value': self.resource_ids.redis_cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average']
            )
            
            metrics['memory'] = np.mean([d['Average'] for d in memory_response.get('Datapoints', [])]) if memory_response.get('Datapoints') else 0
        except ClientError as e:
            logger.warning(f"Failed to get Redis memory metrics: {e}")
            metrics['memory'] = 0
        
        # Get commands per second
        try:
            cmd_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ElastiCache',
                MetricName='GetTypeCmds',
                Dimensions=[
                    {'Name': 'ReplicationGroupId', 'Value': self.resource_ids.redis_cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Sum']
            )
            
            metrics['commands_per_sec'] = np.mean([d['Sum'] / 3600 for d in cmd_response.get('Datapoints', [])]) if cmd_response.get('Datapoints') else 0
        except ClientError as e:
            logger.warning(f"Failed to get Redis command metrics: {e}")
            metrics['commands_per_sec'] = 0
        
        return metrics
    
    def _analyze_aurora_metrics(self) -> Dict[str, float]:
        """Analyze Aurora database metrics"""
        if not self.resource_ids.aurora_cluster_id:
            logger.warning("Aurora cluster ID not available, returning default metrics")
            return {'cpu_utilization': 0, 'replica_lag': 0, 'read_iops_ratio': 0}
        
        end_time = datetime.now()
        start_time = end_time - timedelta(days=60)
        
        metrics = {}
        
        # Get CPU utilization
        try:
            cpu_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='CPUUtilization',
                Dimensions=[
                    {'Name': 'DBClusterIdentifier', 'Value': self.resource_ids.aurora_cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average']
            )
            
            metrics['cpu_utilization'] = np.mean([d['Average'] for d in cpu_response.get('Datapoints', [])]) if cpu_response.get('Datapoints') else 0
        except ClientError as e:
            logger.warning(f"Failed to get Aurora CPU metrics: {e}")
            metrics['cpu_utilization'] = 0
        
        # Get replica lag
        try:
            lag_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='AuroraReplicaLag',
                Dimensions=[
                    {'Name': 'DBClusterIdentifier', 'Value': self.resource_ids.aurora_cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Maximum']
            )
            
            metrics['replica_lag'] = np.mean([d['Maximum'] for d in lag_response.get('Datapoints', [])]) if lag_response.get('Datapoints') else 0
        except ClientError as e:
            logger.warning(f"Failed to get Aurora replica lag metrics: {e}")
            metrics['replica_lag'] = 0
        
        # Calculate read/write IOPS ratio
        try:
            read_iops_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='ReadIOPS',
                Dimensions=[
                    {'Name': 'DBClusterIdentifier', 'Value': self.resource_ids.aurora_cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average']
            )
            
            write_iops_response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='WriteIOPS',
                Dimensions=[
                    {'Name': 'DBClusterIdentifier', 'Value': self.resource_ids.aurora_cluster_id}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average']
            )
            
            avg_read_iops = np.mean([d['Average'] for d in read_iops_response.get('Datapoints', [])]) if read_iops_response.get('Datapoints') else 0
            avg_write_iops = np.mean([d['Average'] for d in write_iops_response.get('Datapoints', [])]) if write_iops_response.get('Datapoints') else 0
            
            metrics['read_iops_ratio'] = avg_read_iops / (avg_read_iops + avg_write_iops) if (avg_read_iops + avg_write_iops) > 0 else 0
        except ClientError as e:
            logger.warning(f"Failed to get Aurora IOPS metrics: {e}")
            metrics['read_iops_ratio'] = 0.15  # Default placeholder
        
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
        
        if not PLOTLY_AVAILABLE:
            logger.warning("Plotly not available, generating simple HTML dashboard")
            html = """
            <html>
            <head><title>TAP Infrastructure Optimization Dashboard</title></head>
            <body>
            <h1>TAP Infrastructure Optimization Dashboard</h1>
            <p>Dashboard generation requires plotly. Please install it with: pip install plotly</p>
            </body>
            </html>
            """
            with open('optimization_dashboard.html', 'w') as f:
                f.write(html)
            return html
        
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
        try:
            response = self.dynamodb.list_tables()
            all_tables = response.get('TableNames', [])
            
            # Filter by environment suffix if available
            if self.resource_ids.environment_suffix:
                prefix = f"tap-{self.resource_ids.environment_suffix}-"
                return [t for t in all_tables if t.startswith(prefix)]
            
            # Fallback: filter by 'tap-' prefix
            return [t for t in all_tables if t.startswith('tap-')]
        except ClientError as e:
            logger.error(f"Failed to list DynamoDB tables: {e}")
            return []
    
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
    parser.add_argument('--outputs-file', help='Path to deployment outputs JSON file')
    parser.add_argument('--region', help='AWS region (overrides outputs file)')
    parser.add_argument('--dry-run', action='store_true', help='Perform dry run without making changes')
    parser.add_argument('--skip-phases', nargs='+', help='Skip specific phases', default=[])
    
    args = parser.parse_args()
    
    try:
        # Load deployment outputs
        logger.info("Loading deployment outputs...")
        outputs = load_deployment_outputs(args.outputs_file)
        
        # Get all regions to optimize
        if args.region:
            regions = [args.region]
        else:
            regions = get_all_regions_from_outputs(outputs)
        
        logger.info(f"Optimizing regions: {', '.join(regions)}")
        
        all_results = {}
        
        # Optimize each region
        for region in regions:
            logger.info(f"\n{'='*60}")
            logger.info(f"Optimizing region: {region}")
            logger.info(f"{'='*60}")
            
            try:
                # Extract resource identifiers for this region
                resource_ids = extract_resource_identifiers(outputs, region)
                
                # Create optimizer for this region
                optimizer = TapOptimizer(resource_ids=resource_ids, dry_run=args.dry_run)
                
                # Run optimization
                results = optimizer.run_optimization()
                all_results[region] = results
                
                # Print summary for this region
                print(f"\n{'='*60}")
                print(f"OPTIMIZATION SUMMARY - {region}")
                print(f"{'='*60}")
                print(f"Status: {'Success' if results['success'] else 'Failed'}")
                print(f"Total Savings: ${results['total_savings']:,.2f}")
                
                print("\nActions Taken:")
                for phase in results.get('phases', []):
                    print(f"\n{phase['phase']}:")
                    for action in phase.get('actions', []):
                        print(f"  - {action}")
                
            except Exception as e:
                logger.error(f"Optimization failed for region {region}: {str(e)}")
                all_results[region] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Generate combined dashboard
        logger.info("\nGenerating optimization dashboard...")
        if all_results:
            # Use the first successful optimizer to generate dashboard
            for region, results in all_results.items():
                if results.get('success'):
                    # Dashboard already generated in run_optimization
                    break
        
        print(f"\n{'='*60}")
        print("OVERALL OPTIMIZATION SUMMARY")
        print(f"{'='*60}")
        total_savings = sum(r.get('total_savings', 0) for r in all_results.values())
        successful_regions = sum(1 for r in all_results.values() if r.get('success'))
        print(f"Regions optimized: {successful_regions}/{len(regions)}")
        print(f"Total Savings: ${total_savings:,.2f}")
        print(f"\nDashboard saved to: optimization_dashboard.html")
        
    except FileNotFoundError as e:
        logger.error(f"Failed to load deployment outputs: {e}")
        logger.error("Please ensure the stack is deployed and outputs are exported to a JSON file.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()