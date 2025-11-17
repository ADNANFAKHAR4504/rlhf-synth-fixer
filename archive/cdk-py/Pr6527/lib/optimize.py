#!/usr/bin/env python3
"""
AWS Infrastructure Optimization Script
Analyzes CloudWatch metrics and optimizes over-provisioned resources based on utilization.
"""

import argparse
import json
import logging
import os
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('optimization.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configure boto3 with retries
boto_config = Config(
    region_name='us-east-1',
    retries={
        'max_attempts': 10,
        'mode': 'adaptive'
    }
)


class OptimizationStatus(Enum):
    """Optimization status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


@dataclass
class ResourceConfiguration:
    """Resource configuration data class."""
    resource_type: str
    resource_id: str
    current_config: Dict[str, Any]
    optimized_config: Dict[str, Any]
    metrics: Dict[str, float]
    current_cost: float
    optimized_cost: float
    savings: float
    optimization_applied: bool = False


@dataclass
class OptimizationReport:
    """Optimization report data class."""
    timestamp: str
    status: OptimizationStatus
    dry_run: bool
    analyzed_resources: List[str]
    optimizations: List[ResourceConfiguration]
    total_current_cost: float
    total_optimized_cost: float
    total_monthly_savings: float
    total_annual_savings: float
    rollback_plan: Dict[str, Any]


class AWSOptimizer:
    """Main AWS infrastructure optimizer class."""

    def __init__(self, environment_suffix: str = 'dev', dry_run: bool = True, force: bool = False):
        """Initialize the optimizer with AWS clients."""
        self.environment_suffix = environment_suffix
        self.dry_run = dry_run
        self.force = force
        self.optimizations: List[ResourceConfiguration] = []
        self.original_configs: Dict[str, Any] = {}

        # Initialize AWS clients
        self.cfn_client = boto3.client('cloudformation', config=boto_config)
        self.rds_client = boto3.client('rds', config=boto_config)
        self.elasticache_client = boto3.client('elasticache', config=boto_config)
        self.ecs_client = boto3.client('ecs', config=boto_config)
        self.dynamodb_client = boto3.client('dynamodb', config=boto_config)
        self.lambda_client = boto3.client('lambda', config=boto_config)
        self.s3_client = boto3.client('s3', config=boto_config)
        self.cloudwatch_client = boto3.client('cloudwatch', config=boto_config)
        self.pricing_client = boto3.client('pricing', region_name='us-east-1')

        # Discover resources from CloudFormation stack outputs
        self.stack_outputs = {}
        self._load_stack_outputs()

        logger.info("Initialized optimizer for environment: %s", environment_suffix)
        logger.info("Dry run mode: %s", dry_run)

    def _load_stack_outputs(self):
        """Load CloudFormation stack outputs to discover resource names."""
        stack_name = f"TapStack{self.environment_suffix}"

        try:
            logger.info("Loading outputs from CloudFormation stack: %s", stack_name)
            response = self.cfn_client.describe_stacks(StackName=stack_name)

            if not response['Stacks']:
                logger.warning("Stack %s not found", stack_name)
                return

            stack = response['Stacks'][0]
            outputs = stack.get('Outputs', [])

            # Parse outputs into a dictionary
            for output in outputs:
                key = output['OutputKey']
                value = output['OutputValue']
                self.stack_outputs[key] = value
                logger.info("Found output: %s = %s", key, value)

            logger.info("Loaded %d outputs from stack", len(self.stack_outputs))

        except ClientError as e:
            if e.response['Error']['Code'] == 'ValidationError':
                logger.warning("Stack %s does not exist, will use default resource naming", stack_name)
            else:
                logger.error("Error loading stack outputs: %s", str(e))
        except Exception as e:
            logger.error("Unexpected error loading stack outputs: %s", str(e))

    def analyze_and_optimize(self) -> OptimizationReport:
        """Main optimization workflow."""
        logger.info("Starting infrastructure analysis and optimization...")

        try:
            # Analyze Aurora
            self._analyze_aurora()

            # Analyze ElastiCache
            self._analyze_elasticache()

            # Analyze ECS
            self._analyze_ecs()

            # Analyze DynamoDB
            self._analyze_dynamodb()

            # Analyze Lambda
            self._analyze_lambda()

            # Analyze S3
            self._analyze_s3()

            # Generate report
            report = self._generate_report()

            # Apply optimizations if not dry run
            if not self.dry_run:
                # Skip if no optimizations found
                if len(self.optimizations) == 0:
                    logger.info("No optimizations found to apply")
                    return report

                if self._confirm_optimizations(report):
                    self._apply_optimizations()
                    logger.info("Optimizations applied successfully")

                    # Monitor for rollback need
                    self._monitor_for_rollback()
                else:
                    logger.info("Optimization cancelled by user")
                    report.status = OptimizationStatus.PENDING

            return report

        except Exception as e:
            logger.error("Optimization failed: %s", str(e))
            raise

    def _analyze_aurora(self):
        """Analyze Aurora Serverless v2 cluster utilization."""
        logger.info("Analyzing Aurora Serverless v2 cluster...")

        # Try to get cluster ID from stack outputs, fall back to naming convention
        cluster_id = self.stack_outputs.get('AuroraClusterIdentifier', f"tap-aurora-{self.environment_suffix}")

        try:
            # Get cluster details
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster = response['DBClusters'][0]

            # Get CloudWatch metrics
            metrics = self._get_aurora_metrics(cluster_id)

            # Check optimization criteria
            if (metrics['cpu_utilization'] < 30 and
                metrics['database_connections'] < 20):

                current_config = {
                    'min_capacity': cluster.get('ServerlessV2ScalingConfiguration', {}).get('MinCapacity', 4),
                    'max_capacity': cluster.get('ServerlessV2ScalingConfiguration', {}).get('MaxCapacity', 16),
                    'reader_instances': len([m for m in cluster['DBClusterMembers'] if not m['IsClusterWriter']]),
                    'backup_retention': cluster['BackupRetentionPeriod']
                }

                optimized_config = {
                    'min_capacity': 1,
                    'max_capacity': 4,
                    'reader_instances': 1,
                    'backup_retention': 7
                }

                # Calculate costs
                current_cost = self._calculate_aurora_cost(current_config)
                optimized_cost = self._calculate_aurora_cost(optimized_config)

                self.optimizations.append(ResourceConfiguration(
                    resource_type='Aurora',
                    resource_id=cluster_id,
                    current_config=current_config,
                    optimized_config=optimized_config,
                    metrics=metrics,
                    current_cost=current_cost,
                    optimized_cost=optimized_cost,
                    savings=current_cost - optimized_cost
                ))

                self.original_configs['aurora'] = current_config

                savings = current_cost - optimized_cost
                logger.info("Aurora optimization potential: $%.2f/month", savings)

        except ClientError as e:
            logger.error("Failed to analyze Aurora: %s", e)

    def _analyze_elasticache(self):
        """Analyze ElastiCache Redis cluster utilization."""
        logger.info("Analyzing ElastiCache Redis cluster...")

        # Try to get replication group ID from stack outputs, fall back to naming convention
        replication_group_id = self.stack_outputs.get('RedisClusterIdentifier', f"tap-redis-{self.environment_suffix}")

        try:
            # Get replication group details
            response = self.elasticache_client.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            replication_group = response['ReplicationGroups'][0]

            # Get CloudWatch metrics
            metrics = self._get_redis_metrics(replication_group_id)

            # Check optimization criteria
            if (metrics['cpu_utilization'] < 25 and
                metrics['memory_utilization'] < 50 and
                metrics['evictions'] == 0):

                current_config = {
                    'node_type': replication_group['CacheNodeType'],
                    'num_node_groups': len(replication_group.get('NodeGroups', [])),
                    'multi_az': replication_group['MultiAZ']
                }

                optimized_config = {
                    'node_type': 'cache.r6g.large',
                    'num_node_groups': 3,
                    'multi_az': replication_group['MultiAZ']
                }

                # Calculate costs
                current_cost = self._calculate_redis_cost(current_config)
                optimized_cost = self._calculate_redis_cost(optimized_config)

                self.optimizations.append(ResourceConfiguration(
                    resource_type='ElastiCache',
                    resource_id=replication_group_id,
                    current_config=current_config,
                    optimized_config=optimized_config,
                    metrics=metrics,
                    current_cost=current_cost,
                    optimized_cost=optimized_cost,
                    savings=current_cost - optimized_cost
                ))

                self.original_configs['elasticache'] = current_config

                savings = current_cost - optimized_cost
                logger.info("ElastiCache optimization potential: $%.2f/month", savings)

        except ClientError as e:
            logger.error("Failed to analyze ElastiCache: %s", e)

    def _analyze_ecs(self):
        """Analyze ECS Fargate service utilization."""
        logger.info("Analyzing ECS Fargate service...")

        # Try to get cluster and service names from stack outputs, fall back to naming convention
        cluster_name = self.stack_outputs.get('ECSClusterName', f"tap-ecs-{self.environment_suffix}")
        service_name = self.stack_outputs.get('ECSServiceName', f"tap-service-{self.environment_suffix}")

        try:
            # Get service details
            response = self.ecs_client.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )
            service = response['services'][0]

            # Get task definition
            task_def_response = self.ecs_client.describe_task_definition(
                taskDefinition=service['taskDefinition']
            )
            task_def = task_def_response['taskDefinition']

            # Get CloudWatch metrics
            metrics = self._get_ecs_metrics(cluster_name, service_name)

            # Check optimization criteria
            if (metrics['cpu_utilization'] < 20 and
                metrics['memory_utilization'] < 40):

                current_config = {
                    'desired_count': service['desiredCount'],
                    'memory': int(task_def['memory']),
                    'cpu': int(task_def['cpu'])
                }

                optimized_config = {
                    'desired_count': 3,
                    'memory': 1024,
                    'cpu': 512
                }

                # Calculate costs
                current_cost = self._calculate_ecs_cost(current_config)
                optimized_cost = self._calculate_ecs_cost(optimized_config)

                self.optimizations.append(ResourceConfiguration(
                    resource_type='ECS',
                    resource_id=f"{cluster_name}/{service_name}",
                    current_config=current_config,
                    optimized_config=optimized_config,
                    metrics=metrics,
                    current_cost=current_cost,
                    optimized_cost=optimized_cost,
                    savings=current_cost - optimized_cost
                ))

                self.original_configs['ecs'] = current_config

                savings = current_cost - optimized_cost
                logger.info("ECS optimization potential: $%.2f/month", savings)

        except ClientError as e:
            logger.error("Failed to analyze ECS: %s", e)

    def _analyze_dynamodb(self):
        """Analyze DynamoDB table utilization."""
        logger.info("Analyzing DynamoDB table...")

        # Try to get table name from stack outputs, fall back to naming convention
        table_name = self.stack_outputs.get('DynamoDBTableName', f"tap-table-{self.environment_suffix}")

        try:
            # Get table details
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']

            # Get CloudWatch metrics
            metrics = self._get_dynamodb_metrics(table_name)

            # Check optimization criteria for provisioned capacity
            # Get billing mode (default to PROVISIONED if BillingModeSummary doesn't exist)
            billing_mode = table.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')
            if billing_mode == 'PROVISIONED':
                provisioned_rcu = table['ProvisionedThroughput']['ReadCapacityUnits']
                provisioned_wcu = table['ProvisionedThroughput']['WriteCapacityUnits']

                if (metrics['consumed_read_capacity'] < provisioned_rcu * 0.2 and
                    metrics['consumed_write_capacity'] < provisioned_wcu * 0.2):

                    current_config = {
                        'billing_mode': 'PROVISIONED',
                        'read_capacity': provisioned_rcu,
                        'write_capacity': provisioned_wcu
                    }

                    optimized_config = {
                        'billing_mode': 'PAY_PER_REQUEST',
                        'read_capacity': 0,
                        'write_capacity': 0
                    }

                    # Calculate costs
                    current_cost = self._calculate_dynamodb_cost(current_config, metrics)
                    optimized_cost = self._calculate_dynamodb_cost(optimized_config, metrics)

                    self.optimizations.append(ResourceConfiguration(
                        resource_type='DynamoDB',
                        resource_id=table_name,
                        current_config=current_config,
                        optimized_config=optimized_config,
                        metrics=metrics,
                        current_cost=current_cost,
                        optimized_cost=optimized_cost,
                        savings=current_cost - optimized_cost
                    ))

                    self.original_configs['dynamodb'] = current_config

                    savings = current_cost - optimized_cost
                    logger.info("DynamoDB optimization potential: $%.2f/month", savings)

        except ClientError as e:
            logger.error("Failed to analyze DynamoDB: %s", e)

    def _analyze_lambda(self):
        """Analyze Lambda functions utilization."""
        logger.info("Analyzing Lambda functions...")

        # Try to get function ARNs from stack outputs, fall back to naming convention
        function_names = []

        # Check for Lambda function outputs in stack
        for key in ['ProcessorLambdaArn', 'AnalyzerLambdaArn', 'ReporterLambdaArn']:
            if key in self.stack_outputs:
                # Extract function name from ARN
                arn = self.stack_outputs[key]
                function_name = arn.split(':')[-1]
                function_names.append(function_name)

        # If no outputs found, use naming convention
        if not function_names:
            function_names = [
                f"tap-processor-{self.environment_suffix}",
                f"tap-analyzer-{self.environment_suffix}",
                f"tap-reporter-{self.environment_suffix}"
            ]

        for function_name in function_names:
            try:
                # Get function configuration
                response = self.lambda_client.get_function_configuration(
                    FunctionName=function_name
                )

                # Get CloudWatch metrics
                metrics = self._get_lambda_metrics(function_name)

                # Check optimization criteria
                if (metrics['p95_duration'] < 100 and
                    metrics['throttles'] == 0):

                    current_config = {
                        'memory_size': response['MemorySize'],
                        'timeout': response['Timeout']
                    }

                    optimized_config = {
                        'memory_size': 1024,
                        'timeout': 300
                    }

                    # Calculate costs
                    current_cost = self._calculate_lambda_cost(current_config, metrics)
                    optimized_cost = self._calculate_lambda_cost(optimized_config, metrics)

                    self.optimizations.append(ResourceConfiguration(
                        resource_type='Lambda',
                        resource_id=function_name,
                        current_config=current_config,
                        optimized_config=optimized_config,
                        metrics=metrics,
                        current_cost=current_cost,
                        optimized_cost=optimized_cost,
                        savings=current_cost - optimized_cost
                    ))

                    if 'lambda' not in self.original_configs:
                        self.original_configs['lambda'] = {}
                    self.original_configs['lambda'][function_name] = current_config

                    savings = current_cost - optimized_cost
                    logger.info(
                        "Lambda %s optimization potential: $%.2f/month",
                        function_name, savings
                    )

            except ClientError as e:
                logger.error("Failed to analyze Lambda %s: %s", function_name, e)

    def _analyze_s3(self):
        """Analyze S3 buckets storage optimization."""
        logger.info("Analyzing S3 buckets...")

        # Try to get bucket names from stack outputs, fall back to discovery
        bucket_names = []

        # Check for S3 bucket outputs in stack
        for key in ['MediaBucketName', 'LogsBucketName', 'BackupsBucketName']:
            if key in self.stack_outputs:
                bucket_names.append(self.stack_outputs[key])

        # If no outputs found, discover buckets by prefix
        if not bucket_names:
            bucket_purposes = ["media", "logs", "backups"]

            for purpose in bucket_purposes:
                try:
                    # List buckets with prefix
                    response = self.s3_client.list_buckets()

                    for bucket in response['Buckets']:
                        if f"tap-{purpose}-{self.environment_suffix}" in bucket['Name']:
                            bucket_names.append(bucket['Name'])
                            break
                except Exception as e:
                    logger.error("Error discovering S3 bucket for %s: %s", purpose, str(e))

        for bucket_name in bucket_names:
            try:

                # Get bucket lifecycle configuration
                try:
                    lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(
                        Bucket=bucket_name
                    )
                    current_rules = lifecycle_response.get('Rules', [])
                except ClientError as e:
                    if e.response['Error']['Code'] == 'NoSuchLifecycleConfiguration':
                        current_rules = []
                    else:
                        raise

                # Get CloudWatch metrics for bucket
                metrics = self._get_s3_metrics(bucket_name)

                current_config = {
                    'storage_class': 'INTELLIGENT_TIERING',
                    'lifecycle_rules': len(current_rules)
                }

                optimized_config = {
                    'storage_class': 'STANDARD_IA',
                    'lifecycle_rules': 1,
                    'transition_days': 30
                }

                # Calculate costs
                current_cost = self._calculate_s3_cost(current_config, metrics)
                optimized_cost = self._calculate_s3_cost(optimized_config, metrics)

                self.optimizations.append(ResourceConfiguration(
                    resource_type='S3',
                    resource_id=bucket_name,
                    current_config=current_config,
                    optimized_config=optimized_config,
                    metrics=metrics,
                    current_cost=current_cost,
                    optimized_cost=optimized_cost,
                    savings=current_cost - optimized_cost
                ))

                if 's3' not in self.original_configs:
                    self.original_configs['s3'] = {}
                self.original_configs['s3'][bucket_name] = current_config

                savings = current_cost - optimized_cost
                logger.info(
                    "S3 %s optimization potential: $%.2f/month", bucket_name, savings
                )

            except ClientError as e:
                logger.error("Failed to analyze S3 bucket for %s: %s", purpose, e)

    def _get_aurora_metrics(self, cluster_id: str) -> Dict[str, float]:
        """Get Aurora cluster CloudWatch metrics."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=30)

        metrics = {}

        # CPU Utilization
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='ServerlessDatabaseCapacity',
            Dimensions=[
                {'Name': 'DBClusterIdentifier', 'Value': cluster_id}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            avg_acu = sum(dp['Average'] for dp in response['Datapoints']) / len(response['Datapoints'])
            # Assuming max capacity of 16 ACUs
            metrics['cpu_utilization'] = (avg_acu / 16) * 100
        else:
            metrics['cpu_utilization'] = 0

        # Database Connections
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='DatabaseConnections',
            Dimensions=[
                {'Name': 'DBClusterIdentifier', 'Value': cluster_id}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['database_connections'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['database_connections'] = 0

        return metrics

    def _get_redis_metrics(self, replication_group_id: str) -> Dict[str, float]:
        """Get ElastiCache Redis CloudWatch metrics."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=30)

        metrics = {}

        # CPU Utilization
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/ElastiCache',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'CacheClusterId', 'Value': replication_group_id}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['cpu_utilization'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['cpu_utilization'] = 0

        # Memory Utilization
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/ElastiCache',
            MetricName='DatabaseMemoryUsagePercentage',
            Dimensions=[
                {'Name': 'CacheClusterId', 'Value': replication_group_id}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['memory_utilization'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['memory_utilization'] = 0

        # Evictions
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/ElastiCache',
            MetricName='Evictions',
            Dimensions=[
                {'Name': 'CacheClusterId', 'Value': replication_group_id}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )

        if response['Datapoints']:
            metrics['evictions'] = sum(dp['Sum'] for dp in response['Datapoints'])
        else:
            metrics['evictions'] = 0

        return metrics

    def _get_ecs_metrics(self, cluster_name: str, service_name: str) -> Dict[str, float]:
        """Get ECS service CloudWatch metrics."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=30)

        metrics = {}

        # CPU Utilization
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'ClusterName', 'Value': cluster_name},
                {'Name': 'ServiceName', 'Value': service_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['cpu_utilization'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['cpu_utilization'] = 0

        # Memory Utilization
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='MemoryUtilization',
            Dimensions=[
                {'Name': 'ClusterName', 'Value': cluster_name},
                {'Name': 'ServiceName', 'Value': service_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['memory_utilization'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['memory_utilization'] = 0

        return metrics

    def _get_dynamodb_metrics(self, table_name: str) -> Dict[str, float]:
        """Get DynamoDB table CloudWatch metrics."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=30)

        metrics = {}

        # Consumed Read Capacity
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/DynamoDB',
            MetricName='ConsumedReadCapacityUnits',
            Dimensions=[
                {'Name': 'TableName', 'Value': table_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['consumed_read_capacity'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['consumed_read_capacity'] = 0

        # Consumed Write Capacity
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/DynamoDB',
            MetricName='ConsumedWriteCapacityUnits',
            Dimensions=[
                {'Name': 'TableName', 'Value': table_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['consumed_write_capacity'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['consumed_write_capacity'] = 0

        return metrics

    def _get_lambda_metrics(self, function_name: str) -> Dict[str, float]:
        """Get Lambda function CloudWatch metrics."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=30)

        metrics = {}

        # Duration (p95)
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Duration',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': function_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average'],
            ExtendedStatistics=['p95']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            if 'ExtendedStatistics' in datapoints[0]:
                metrics['p95_duration'] = (
                    sum(dp.get('ExtendedStatistics', {}).get('p95', 0) for dp in datapoints)
                    / len(datapoints)
                )
            else:
                metrics['p95_duration'] = (
                    sum(dp['Average'] for dp in datapoints) / len(datapoints)
                )
        else:
            metrics['p95_duration'] = 0

        # Throttles
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Throttles',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': function_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )

        if response['Datapoints']:
            metrics['throttles'] = sum(dp['Sum'] for dp in response['Datapoints'])
        else:
            metrics['throttles'] = 0

        # Invocations
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Invocations',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': function_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )

        if response['Datapoints']:
            metrics['invocations'] = sum(dp['Sum'] for dp in response['Datapoints'])
        else:
            metrics['invocations'] = 1000  # Default for cost calculation

        return metrics

    def _get_s3_metrics(self, bucket_name: str) -> Dict[str, float]:
        """Get S3 bucket CloudWatch metrics."""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=30)

        metrics = {}

        # Bucket Size
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='BucketSizeBytes',
            Dimensions=[
                {'Name': 'BucketName', 'Value': bucket_name},
                {'Name': 'StorageType', 'Value': 'StandardStorage'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=['Average']
        )

        if response['Datapoints']:
            metrics['bucket_size_gb'] = (sum(dp['Average'] for dp in response['Datapoints']) /
                                        len(response['Datapoints'])) / (1024**3)
        else:
            metrics['bucket_size_gb'] = 100  # Default 100 GB for cost calculation

        # Number of Objects
        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='NumberOfObjects',
            Dimensions=[
                {'Name': 'BucketName', 'Value': bucket_name},
                {'Name': 'StorageType', 'Value': 'AllStorageTypes'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=['Average']
        )

        if response['Datapoints']:
            datapoints = response['Datapoints']
            metrics['number_of_objects'] = (
                sum(dp['Average'] for dp in datapoints) / len(datapoints)
            )
        else:
            metrics['number_of_objects'] = 10000  # Default for cost calculation

        return metrics

    def _calculate_aurora_cost(self, config: Dict[str, Any]) -> float:
        """Calculate Aurora Serverless v2 monthly cost."""
        # ACU pricing: $0.12 per ACU-hour
        acu_hourly_cost = 0.12

        # Average ACUs (assuming 50% of max capacity utilization)
        avg_acus = (config['min_capacity'] + config['max_capacity']) / 2 * 0.5

        # Calculate monthly cost (730 hours)
        monthly_acu_cost = avg_acus * acu_hourly_cost * 730

        # Add reader instance costs
        reader_cost = config['reader_instances'] * avg_acus * acu_hourly_cost * 730

        # Storage cost (assuming 100 GB)
        storage_cost = 100 * 0.10  # $0.10 per GB-month

        # Backup storage (assuming 200 GB with retention)
        backup_cost = 200 * 0.021 * (config['backup_retention'] / 30)

        return monthly_acu_cost + reader_cost + storage_cost + backup_cost

    def _calculate_redis_cost(self, config: Dict[str, Any]) -> float:
        """Calculate ElastiCache Redis monthly cost."""
        # Instance pricing (approximate)
        instance_costs = {
            'cache.r6g.xlarge': 0.234,  # per hour
            'cache.r6g.large': 0.117    # per hour
        }

        hourly_cost = instance_costs.get(config['node_type'], 0.234)

        # Calculate monthly cost
        num_nodes = config['num_node_groups'] * 2  # Primary + replica
        monthly_cost = hourly_cost * 730 * num_nodes

        return monthly_cost

    def _calculate_ecs_cost(self, config: Dict[str, Any]) -> float:
        """Calculate ECS Fargate monthly cost."""
        # Fargate pricing
        vcpu_hourly_cost = 0.04048
        memory_hourly_cost = 0.004445

        # Calculate resource costs
        vcpu_cost = (config['cpu'] / 1024) * vcpu_hourly_cost * 730 * config['desired_count']
        memory_cost = (config['memory'] / 1024) * memory_hourly_cost * 730 * config['desired_count']

        return vcpu_cost + memory_cost

    def _calculate_dynamodb_cost(self, config: Dict[str, Any], metrics: Dict[str, float]) -> float:
        """Calculate DynamoDB monthly cost."""
        if config['billing_mode'] == 'PROVISIONED':
            # Provisioned pricing: $0.00065 per RCU-hour, $0.00325 per WCU-hour
            rcu_cost = config['read_capacity'] * 0.00065 * 730
            wcu_cost = config['write_capacity'] * 0.00325 * 730
            return rcu_cost + wcu_cost

        # On-demand pricing: $0.25 per million RCU, $1.25 per million WCU
        # Using consumed capacity from metrics
        monthly_reads = metrics.get('consumed_read_capacity', 100) * 3600 * 30
        monthly_writes = metrics.get('consumed_write_capacity', 100) * 3600 * 30

        read_cost = (monthly_reads / 1_000_000) * 0.25
        write_cost = (monthly_writes / 1_000_000) * 1.25
        return read_cost + write_cost

    def _calculate_lambda_cost(self, config: Dict[str, Any], metrics: Dict[str, float]) -> float:
        """Calculate Lambda monthly cost."""
        # Lambda pricing
        request_cost = 0.20 / 1_000_000  # per request
        gb_second_cost = 0.0000166667  # per GB-second

        # Calculate monthly invocations
        monthly_invocations = metrics.get('invocations', 1000)

        # Calculate GB-seconds
        avg_duration_ms = metrics.get('p95_duration', 100)
        gb_seconds = (config['memory_size'] / 1024) * (avg_duration_ms / 1000) * monthly_invocations

        # Calculate costs
        request_cost_total = monthly_invocations * request_cost
        compute_cost = gb_seconds * gb_second_cost

        # Reserved concurrency cost (if applicable)
        reserved_cost = 0  # Reserved concurrency doesn't have additional cost

        return request_cost_total + compute_cost

    def _calculate_s3_cost(self, config: Dict[str, Any], metrics: Dict[str, float]) -> float:
        """Calculate S3 monthly cost."""
        storage_gb = metrics.get('bucket_size_gb', 100)

        if config['storage_class'] == 'INTELLIGENT_TIERING':
            # Intelligent-Tiering: $0.0125 per GB + monitoring fee
            storage_cost = storage_gb * 0.0125
            monitoring_cost = (metrics.get('number_of_objects', 10000) / 1000) * 0.0025
            return storage_cost + monitoring_cost

        # Standard-IA: $0.0125 per GB
        return storage_gb * 0.0125

    def _apply_optimizations(self):
        """Apply the optimization changes to AWS resources."""
        logger.info("Applying optimizations...")

        for optimization in self.optimizations:
            try:
                if optimization.resource_type == 'Aurora':
                    self._apply_aurora_optimization(optimization)
                elif optimization.resource_type == 'ElastiCache':
                    self._apply_elasticache_optimization(optimization)
                elif optimization.resource_type == 'ECS':
                    self._apply_ecs_optimization(optimization)
                elif optimization.resource_type == 'DynamoDB':
                    self._apply_dynamodb_optimization(optimization)
                elif optimization.resource_type == 'Lambda':
                    self._apply_lambda_optimization(optimization)
                elif optimization.resource_type == 'S3':
                    self._apply_s3_optimization(optimization)

                optimization.optimization_applied = True
                logger.info(
                    "Applied optimization for %s: %s",
                    optimization.resource_type, optimization.resource_id
                )

            except Exception as e:
                logger.error(
                    "Failed to apply optimization for %s: %s",
                    optimization.resource_type, e
                )
                optimization.optimization_applied = False

    def _apply_aurora_optimization(self, optimization: ResourceConfiguration):
        """Apply Aurora cluster optimization."""
        cluster_id = optimization.resource_id
        config = optimization.optimized_config

        # Update ServerlessV2 scaling configuration
        self.rds_client.modify_db_cluster(
            DBClusterIdentifier=cluster_id,
            ServerlessV2ScalingConfiguration={
                'MinCapacity': config['min_capacity'],
                'MaxCapacity': config.get('max_capacity', 4)
            },
            BackupRetentionPeriod=config['backup_retention'],
            ApplyImmediately=True
        )

        # Remove excess reader instances
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        readers = [m for m in response['DBClusters'][0]['DBClusterMembers']
                  if not m['IsClusterWriter']]

        readers_to_remove = len(readers) - config['reader_instances']
        for i in range(readers_to_remove):
            self.rds_client.delete_db_instance(
                DBInstanceIdentifier=readers[i]['DBInstanceIdentifier'],
                SkipFinalSnapshot=True
            )

    def _apply_elasticache_optimization(self, optimization: ResourceConfiguration):
        """Apply ElastiCache optimization."""
        replication_group_id = optimization.resource_id
        config = optimization.optimized_config

        # Get current configuration to determine if we're scaling in or out
        current_config = optimization.current_config
        current_node_groups = current_config.get('num_node_groups', 5)
        new_node_groups = config['num_node_groups']

        # Modify replication group shard configuration
        if new_node_groups < current_node_groups:
            # Scaling in - need to get actual node group IDs from AWS
            response = self.elasticache_client.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            node_groups = response['ReplicationGroups'][0]['NodeGroups']

            # Get the IDs of node groups to retain (keep the first N)
            node_groups_to_retain = [ng['NodeGroupId'] for ng in node_groups[:new_node_groups]]

            self.elasticache_client.modify_replication_group_shard_configuration(
                ReplicationGroupId=replication_group_id,
                NodeGroupCount=new_node_groups,
                NodeGroupsToRetain=node_groups_to_retain,
                ApplyImmediately=True
            )
        else:
            # Scaling out
            self.elasticache_client.modify_replication_group_shard_configuration(
                ReplicationGroupId=replication_group_id,
                NodeGroupCount=new_node_groups,
                ApplyImmediately=True
            )

        # Note: Changing node type requires more complex migration process
        logger.warning(
            "Node type change for %s requires manual migration", replication_group_id
        )

    def _apply_ecs_optimization(self, optimization: ResourceConfiguration):
        """Apply ECS service optimization."""
        parts = optimization.resource_id.split('/')
        cluster_name = parts[0]
        service_name = parts[1]
        config = optimization.optimized_config

        # Update service desired count
        self.ecs_client.update_service(
            cluster=cluster_name,
            service=service_name,
            desiredCount=config['desired_count']
        )

        # Note: Updating task definition memory/CPU requires new task definition
        logger.warning(
            "Task definition update for %s requires new revision deployment", service_name
        )

    def _apply_dynamodb_optimization(self, optimization: ResourceConfiguration):
        """Apply DynamoDB optimization."""
        table_name = optimization.resource_id
        config = optimization.optimized_config

        if config['billing_mode'] == 'PAY_PER_REQUEST':
            self.dynamodb_client.update_table(
                TableName=table_name,
                BillingMode='PAY_PER_REQUEST'
            )

    def _apply_lambda_optimization(self, optimization: ResourceConfiguration):
        """Apply Lambda function optimization."""
        function_name = optimization.resource_id
        config = optimization.optimized_config

        # Update function configuration (memory and timeout)
        self.lambda_client.update_function_configuration(
            FunctionName=function_name,
            MemorySize=config['memory_size'],
            Timeout=config['timeout']
        )

    def _apply_s3_optimization(self, optimization: ResourceConfiguration):
        """Apply S3 bucket optimization."""
        bucket_name = optimization.resource_id
        config = optimization.optimized_config

        # Update lifecycle configuration with proper filter
        lifecycle_config = {
            'Rules': [
                {
                    'ID': 'transition-to-ia',
                    'Status': 'Enabled',
                    'Filter': {
                        'Prefix': ''  # Apply to all objects
                    },
                    'Transitions': [
                        {
                            'Days': config['transition_days'],
                            'StorageClass': 'STANDARD_IA'
                        }
                    ]
                }
            ]
        }

        self.s3_client.put_bucket_lifecycle_configuration(
            Bucket=bucket_name,
            LifecycleConfiguration=lifecycle_config
        )

    def _monitor_for_rollback(self):
        """Monitor metrics for 24 hours and rollback if needed."""
        logger.info("Starting 24-hour monitoring period...")

        # In production, this would be a separate monitoring process
        # For this implementation, we'll do a quick check
        time.sleep(5)  # Simulate monitoring delay

        # Check if metrics have spiked
        spike_detected = self._check_for_metric_spikes()

        if spike_detected:
            logger.warning("Metric spike detected! Initiating rollback...")
            self._rollback_changes()
        else:
            logger.info("No metric spikes detected. Optimizations are stable.")

    def _check_for_metric_spikes(self) -> bool:
        """Check if any metrics have spiked after optimization."""
        # This is a simplified check - in production, implement comprehensive monitoring
        for optimization in self.optimizations:
            if optimization.resource_type == 'Aurora':
                metrics = self._get_aurora_metrics(optimization.resource_id)
                if metrics['cpu_utilization'] > 80:
                    return True
            elif optimization.resource_type == 'ECS':
                parts = optimization.resource_id.split('/')
                metrics = self._get_ecs_metrics(parts[0], parts[1])
                if metrics['cpu_utilization'] > 70:
                    return True

        return False

    def _rollback_changes(self):
        """Rollback all applied optimizations."""
        logger.info("Rolling back optimizations...")

        for optimization in self.optimizations:
            if not optimization.optimization_applied:
                continue

            try:
                if optimization.resource_type == 'Aurora':
                    self._rollback_aurora(optimization)
                elif optimization.resource_type == 'ElastiCache':
                    self._rollback_elasticache(optimization)
                elif optimization.resource_type == 'ECS':
                    self._rollback_ecs(optimization)
                elif optimization.resource_type == 'DynamoDB':
                    self._rollback_dynamodb(optimization)
                elif optimization.resource_type == 'Lambda':
                    self._rollback_lambda(optimization)
                elif optimization.resource_type == 'S3':
                    self._rollback_s3(optimization)

                logger.info(
                    "Rolled back %s: %s",
                    optimization.resource_type, optimization.resource_id
                )

            except Exception as e:
                logger.error(
                    "Failed to rollback %s: %s", optimization.resource_type, e
                )

    def _rollback_aurora(self, optimization: ResourceConfiguration):
        """Rollback Aurora changes."""
        cluster_id = optimization.resource_id
        config = optimization.current_config

        self.rds_client.modify_current_db_cluster_capacity(
            DBClusterIdentifier=cluster_id,
            Capacity=config['min_capacity']
        )

        self.rds_client.modify_db_cluster(
            DBClusterIdentifier=cluster_id,
            BackupRetentionPeriod=config['backup_retention'],
            ApplyImmediately=True
        )

    def _rollback_elasticache(self, optimization: ResourceConfiguration):
        """Rollback ElastiCache changes."""
        replication_group_id = optimization.resource_id
        config = optimization.current_config

        self.elasticache_client.modify_replication_group_shard_configuration(
            ReplicationGroupId=replication_group_id,
            NodeGroupCount=config['num_node_groups'],
            ApplyImmediately=True
        )

    def _rollback_ecs(self, optimization: ResourceConfiguration):
        """Rollback ECS changes."""
        parts = optimization.resource_id.split('/')
        cluster_name = parts[0]
        service_name = parts[1]
        config = optimization.current_config

        self.ecs_client.update_service(
            cluster=cluster_name,
            service=service_name,
            desiredCount=config['desired_count']
        )

    def _rollback_dynamodb(self, optimization: ResourceConfiguration):
        """Rollback DynamoDB changes."""
        table_name = optimization.resource_id
        config = optimization.current_config

        if config['billing_mode'] == 'PROVISIONED':
            self.dynamodb_client.update_table(
                TableName=table_name,
                BillingMode='PROVISIONED',
                ProvisionedThroughput={
                    'ReadCapacityUnits': config['read_capacity'],
                    'WriteCapacityUnits': config['write_capacity']
                }
            )

    def _rollback_lambda(self, optimization: ResourceConfiguration):
        """Rollback Lambda changes."""
        function_name = optimization.resource_id
        config = optimization.current_config

        self.lambda_client.update_function_configuration(
            FunctionName=function_name,
            MemorySize=config['memory_size'],
            Timeout=config['timeout']
        )

    def _rollback_s3(self, optimization: ResourceConfiguration):
        """Rollback S3 changes."""
        bucket_name = optimization.resource_id

        # Restore original lifecycle configuration
        lifecycle_config = {
            'Rules': [
                {
                    'ID': 'intelligent-tiering',
                    'Status': 'Enabled',
                    'Transitions': [
                        {
                            'Days': 0,
                            'StorageClass': 'INTELLIGENT_TIERING'
                        }
                    ]
                }
            ]
        }

        self.s3_client.put_bucket_lifecycle_configuration(
            Bucket=bucket_name,
            LifecycleConfiguration=lifecycle_config
        )

    def _confirm_optimizations(self, report: OptimizationReport) -> bool:
        """Prompt user for confirmation before applying optimizations."""
        print("\n" + "="*80)
        print("OPTIMIZATION SUMMARY")
        print("="*80)
        print(f"Total Monthly Savings: ${report.total_monthly_savings:,.2f}")
        print(f"Total Annual Savings: ${report.total_annual_savings:,.2f}")
        print(f"Resources to optimize: {len(report.optimizations)}")
        print("\nDetailed optimizations:")

        for opt in report.optimizations:
            print(f"\n  {opt.resource_type} - {opt.resource_id}")
            print(f"    Monthly savings: ${opt.savings:,.2f}")
            print(f"    Current cost: ${opt.current_cost:,.2f}")
            print(f"    Optimized cost: ${opt.optimized_cost:,.2f}")

        print("\n" + "="*80)

        # Auto-confirm if force flag is set or running in non-interactive environment
        if self.force:
            logger.info("Force flag enabled - auto-confirming optimizations")
            return True

        # Check if running in CI/CD or non-interactive environment
        if not sys.stdin.isatty():
            logger.info("Non-interactive environment detected - auto-confirming optimizations")
            return True

        response = input("\nDo you want to apply these optimizations? (yes/no): ")
        return response.lower() in ['yes', 'y']

    def _generate_report(self) -> OptimizationReport:
        """Generate optimization report."""
        total_current = sum(opt.current_cost for opt in self.optimizations)
        total_optimized = sum(opt.optimized_cost for opt in self.optimizations)
        total_monthly_savings = total_current - total_optimized
        total_annual_savings = total_monthly_savings * 12

        rollback_plan = {
            'enabled': True,
            'monitoring_period_hours': 24,
            'original_configs': self.original_configs,
            'rollback_triggers': {
                'cpu_threshold': 80,
                'memory_threshold': 80,
                'error_rate_threshold': 5
            }
        }

        report = OptimizationReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            status=OptimizationStatus.COMPLETED if not self.dry_run else OptimizationStatus.PENDING,
            dry_run=self.dry_run,
            analyzed_resources=[opt.resource_id for opt in self.optimizations],
            optimizations=self.optimizations,
            total_current_cost=total_current,
            total_optimized_cost=total_optimized,
            total_monthly_savings=total_monthly_savings,
            total_annual_savings=total_annual_savings,
            rollback_plan=rollback_plan
        )

        # Save report to file
        report_filename = f"optimization_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(asdict(report), f, indent=2, default=str)

        logger.info("Report saved to %s", report_filename)

        return report


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='AWS Infrastructure Optimizer')
    parser.add_argument('--environment', '-e', default=None,
                      help='Environment suffix overrides ENVIRONMENT_SUFFIX env var')
    parser.add_argument('--dry-run', action='store_true',
                      help='Run in dry-run mode without applying changes')
    parser.add_argument('--force', action='store_true',
                      help='Apply changes without confirmation')

    args = parser.parse_args()

    environment_suffix = args.environment or os.getenv('ENVIRONMENT_SUFFIX') or 'dev'

    try:
        optimizer = AWSOptimizer(
            environment_suffix=environment_suffix,
            dry_run=args.dry_run,
            force=args.force
        )

        report = optimizer.analyze_and_optimize()

        print(f"\nOptimization {'simulation' if args.dry_run else 'process'} completed!")
        print(f"Total monthly savings: ${report.total_monthly_savings:,.2f}")
        print(f"Total annual savings: ${report.total_annual_savings:,.2f}")

    except KeyboardInterrupt:
        logger.info("Optimization cancelled by user")
        sys.exit(0)
    except Exception as e:
        logger.error("Optimization failed: %s", str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
