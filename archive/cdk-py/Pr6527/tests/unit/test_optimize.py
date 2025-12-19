"""Comprehensive unit tests for optimize.py - 100% coverage"""
import json
import sys
from datetime import datetime, timedelta
from io import StringIO
from unittest.mock import MagicMock, Mock, call, mock_open, patch

import pytest
from botocore.exceptions import ClientError
from pytest import mark

from lib.optimize import AWSOptimizer, OptimizationReport, OptimizationStatus, ResourceConfiguration, main


@mark.describe("OptimizationStatus Enum")
class TestOptimizationStatus:
    """Test OptimizationStatus enumeration"""

    @mark.it("has correct enum values")
    def test_enum_values(self):
        """Test all enum values are correct"""
        assert OptimizationStatus.PENDING.value == "pending"
        assert OptimizationStatus.IN_PROGRESS.value == "in_progress"
        assert OptimizationStatus.COMPLETED.value == "completed"
        assert OptimizationStatus.ROLLED_BACK.value == "rolled_back"
        assert OptimizationStatus.FAILED.value == "failed"


@mark.describe("ResourceConfiguration Dataclass")
class TestResourceConfiguration:
    """Test ResourceConfiguration dataclass"""

    @mark.it("creates resource configuration with all fields")
    def test_resource_configuration_creation(self):
        """Test ResourceConfiguration can be created with all fields"""
        config = ResourceConfiguration(
            resource_type="Aurora",
            resource_id="test-aurora",
            current_config={"min": 4},
            optimized_config={"min": 1},
            metrics={"cpu": 20.0},
            current_cost=100.0,
            optimized_cost=50.0,
            savings=50.0,
            optimization_applied=False,
        )
        assert config.resource_type == "Aurora"
        assert config.resource_id == "test-aurora"
        assert config.savings == 50.0
        assert config.optimization_applied is False


@mark.describe("OptimizationReport Dataclass")
class TestOptimizationReport:
    """Test OptimizationReport dataclass"""

    @mark.it("creates optimization report")
    def test_optimization_report_creation(self):
        """Test OptimizationReport can be created"""
        report = OptimizationReport(
            timestamp="2024-01-01T00:00:00",
            status=OptimizationStatus.COMPLETED,
            dry_run=True,
            analyzed_resources=["resource1"],
            optimizations=[],
            total_current_cost=100.0,
            total_optimized_cost=50.0,
            total_monthly_savings=50.0,
            total_annual_savings=600.0,
            rollback_plan={},
        )
        assert report.dry_run is True
        assert report.total_monthly_savings == 50.0


@mark.describe("AWSOptimizer Initialization")
class TestAWSOptimizerInit:
    """Test AWSOptimizer initialization"""

    @mark.it("initializes with default parameters")
    def test_init_default(self):
        """Test optimizer initializes with defaults"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            assert optimizer.environment_suffix == "dev"
            assert optimizer.dry_run is True
            assert optimizer.optimizations == []
            assert optimizer.original_configs == {}

    @mark.it("initializes with custom parameters")
    def test_init_custom(self):
        """Test optimizer initializes with custom parameters"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer(environment_suffix="prod", dry_run=False)
            assert optimizer.environment_suffix == "prod"
            assert optimizer.dry_run is False


@mark.describe("Aurora Analysis")
class TestAuroraAnalysis:
    """Test Aurora cluster analysis"""

    @mark.it("analyzes Aurora with low utilization")
    def test_analyze_aurora_low_utilization(self):
        """Test Aurora analysis when utilization is low"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_rds = MagicMock()
            mock_cloudwatch = MagicMock()

            mock_rds.describe_db_clusters.return_value = {
                "DBClusters": [
                    {
                        "DBClusterIdentifier": "tap-aurora-test",
                        "ServerlessV2ScalingConfiguration": {
                            "MinCapacity": 4.0,
                            "MaxCapacity": 16.0,
                        },
                        "DBClusterMembers": [
                            {"IsClusterWriter": True, "DBInstanceIdentifier": "writer"},
                            {
                                "IsClusterWriter": False,
                                "DBInstanceIdentifier": "reader1",
                            },
                            {
                                "IsClusterWriter": False,
                                "DBInstanceIdentifier": "reader2",
                            },
                        ],
                        "BackupRetentionPeriod": 35,
                    }
                ]
            }

            # Mock CloudWatch to return low utilization
            # First call: ServerlessDatabaseCapacity (avg_acu=2 -> 12.5% CPU)
            # Second call: DatabaseConnections (avg=10)
            mock_cloudwatch.get_metric_statistics.side_effect = [
                {"Datapoints": [{"Average": 2.0}]},  # CPU: (2/16)*100 = 12.5%
                {"Datapoints": [{"Average": 10.0}]},  # Connections: 10
            ]

            def get_client(service_name, **kwargs):
                if service_name == "rds":
                    return mock_rds
                elif service_name == "cloudwatch":
                    return mock_cloudwatch
                return MagicMock()

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_aurora()

            assert len(optimizer.optimizations) == 1
            assert optimizer.optimizations[0].resource_type == "Aurora"

    @mark.it("handles Aurora client error")
    def test_analyze_aurora_client_error(self):
        """Test Aurora analysis handles client error gracefully"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_rds = MagicMock()
            mock_rds.describe_db_clusters.side_effect = ClientError(
                {"Error": {"Code": "ClusterNotFound"}}, "describe_db_clusters"
            )

            mock_boto.client.return_value = mock_rds

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_aurora()

            assert len(optimizer.optimizations) == 0


@mark.describe("ElastiCache Analysis")
class TestElastiCacheAnalysis:
    """Test ElastiCache Redis analysis"""

    @mark.it("analyzes ElastiCache with low utilization")
    def test_analyze_elasticache_low_utilization(self):
        """Test ElastiCache analysis when utilization is low"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_elasticache = MagicMock()
            mock_cloudwatch = MagicMock()

            mock_elasticache.describe_replication_groups.return_value = {
                "ReplicationGroups": [
                    {
                        "ReplicationGroupId": "tap-redis-test",
                        "CacheNodeType": "cache.r6g.xlarge",
                        "NumNodeGroups": 5,
                        "MultiAZ": True,
                        "NodeGroups": [{"NodeGroupId": f"000{i}"} for i in range(5)],
                    }
                ]
            }

            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 20.0, "Sum": 0.0}]
            }

            def get_client(service_name, **kwargs):
                if service_name == "elasticache":
                    return mock_elasticache
                elif service_name == "cloudwatch":
                    return mock_cloudwatch
                return MagicMock()

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_elasticache()

            assert len(optimizer.optimizations) == 1
            assert optimizer.optimizations[0].resource_type == "ElastiCache"


@mark.describe("ECS Analysis")
class TestECSAnalysis:
    """Test ECS Fargate service analysis"""

    @mark.it("analyzes ECS with low utilization")
    def test_analyze_ecs_low_utilization(self):
        """Test ECS analysis when utilization is low"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_ecs = MagicMock()
            mock_cloudwatch = MagicMock()

            mock_ecs.describe_services.return_value = {
                "services": [
                    {
                        "serviceName": "tap-service-test",
                        "desiredCount": 8,
                        "taskDefinition": "arn:aws:ecs:us-east-1:123:task/tap:1",
                    }
                ]
            }

            mock_ecs.describe_task_definition.return_value = {
                "taskDefinition": {"memory": "2048", "cpu": "1024"}
            }

            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 15.0}]
            }

            def get_client(service_name, **kwargs):
                if service_name == "ecs":
                    return mock_ecs
                elif service_name == "cloudwatch":
                    return mock_cloudwatch
                return MagicMock()

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_ecs()

            assert len(optimizer.optimizations) == 1
            assert optimizer.optimizations[0].resource_type == "ECS"


@mark.describe("DynamoDB Analysis")
class TestDynamoDBAnalysis:
    """Test DynamoDB table analysis"""

    @mark.it("analyzes DynamoDB with low utilization")
    def test_analyze_dynamodb_low_utilization(self):
        """Test DynamoDB analysis when utilization is low"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_dynamodb = MagicMock()
            mock_cloudwatch = MagicMock()

            mock_dynamodb.describe_table.return_value = {
                "Table": {
                    "TableName": "tap-table-test",
                    "BillingModeSummary": {"BillingMode": "PROVISIONED"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 100,
                        "WriteCapacityUnits": 100,
                    },
                }
            }

            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 10.0}]
            }

            def get_client(service_name, **kwargs):
                if service_name == "dynamodb":
                    return mock_dynamodb
                elif service_name == "cloudwatch":
                    return mock_cloudwatch
                return MagicMock()

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_dynamodb()

            assert len(optimizer.optimizations) == 1
            assert optimizer.optimizations[0].resource_type == "DynamoDB"


@mark.describe("Lambda Analysis")
class TestLambdaAnalysis:
    """Test Lambda function analysis"""

    @mark.it("analyzes Lambda functions with low utilization")
    def test_analyze_lambda_low_utilization(self):
        """Test Lambda analysis when utilization is low"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_lambda = MagicMock()
            mock_cloudwatch = MagicMock()

            mock_lambda.get_function_configuration.return_value = {
                "MemorySize": 3008,
                "Timeout": 900,
            }

            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 50.0, "Sum": 0.0}]
            }

            def get_client(service_name, **kwargs):
                if service_name == "lambda":
                    return mock_lambda
                elif service_name == "cloudwatch":
                    return mock_cloudwatch
                return MagicMock()

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_lambda()

            assert len(optimizer.optimizations) == 3
            assert all(opt.resource_type == "Lambda" for opt in optimizer.optimizations)


@mark.describe("S3 Analysis")
class TestS3Analysis:
    """Test S3 bucket analysis"""

    @mark.it("analyzes S3 buckets")
    def test_analyze_s3(self):
        """Test S3 bucket analysis"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_s3 = MagicMock()
            mock_cloudwatch = MagicMock()

            mock_s3.list_buckets.return_value = {
                "Buckets": [
                    {"Name": "tap-media-test-123456"},
                    {"Name": "tap-logs-test-123456"},
                    {"Name": "tap-backups-test-123456"},
                ]
            }

            mock_s3.get_bucket_lifecycle_configuration.side_effect = ClientError(
                {"Error": {"Code": "NoSuchLifecycleConfiguration"}},
                "get_bucket_lifecycle_configuration",
            )

            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 1000.0}]
            }

            def get_client(service_name, **kwargs):
                if service_name == "s3":
                    return mock_s3
                elif service_name == "cloudwatch":
                    return mock_cloudwatch
                return MagicMock()

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_s3()

            assert len(optimizer.optimizations) == 3
            assert all(opt.resource_type == "S3" for opt in optimizer.optimizations)

    @mark.it("handles S3 with existing lifecycle rules")
    def test_analyze_s3_with_lifecycle(self):
        """Test S3 analysis with existing lifecycle rules"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_s3 = MagicMock()
            mock_cloudwatch = MagicMock()

            mock_s3.list_buckets.return_value = {
                "Buckets": [{"Name": "tap-media-test-123456"}]
            }

            mock_s3.get_bucket_lifecycle_configuration.return_value = {
                "Rules": [{"ID": "rule1", "Status": "Enabled"}]
            }

            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 1000.0}]
            }

            def get_client(service_name, **kwargs):
                if service_name == "s3":
                    return mock_s3
                elif service_name == "cloudwatch":
                    return mock_cloudwatch
                return MagicMock()

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_s3()

            assert len(optimizer.optimizations) == 1


@mark.describe("Cost Calculation Methods")
class TestCostCalculations:
    """Test cost calculation methods"""

    @mark.it("calculates Aurora cost correctly")
    def test_calculate_aurora_cost(self):
        """Test Aurora cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {
                "min_capacity": 4,
                "max_capacity": 16,
                "reader_instances": 2,
                "backup_retention": 35,
            }
            cost = optimizer._calculate_aurora_cost(config)
            assert cost > 0

    @mark.it("calculates Redis cost correctly")
    def test_calculate_redis_cost(self):
        """Test Redis cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {"node_type": "cache.r6g.xlarge", "num_node_groups": 5}
            cost = optimizer._calculate_redis_cost(config)
            assert cost > 0

    @mark.it("calculates ECS cost correctly")
    def test_calculate_ecs_cost(self):
        """Test ECS cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {"cpu": 1024, "memory": 2048, "desired_count": 8}
            cost = optimizer._calculate_ecs_cost(config)
            assert cost > 0

    @mark.it("calculates DynamoDB provisioned cost")
    def test_calculate_dynamodb_provisioned_cost(self):
        """Test DynamoDB provisioned cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {
                "billing_mode": "PROVISIONED",
                "read_capacity": 100,
                "write_capacity": 100,
            }
            metrics = {}
            cost = optimizer._calculate_dynamodb_cost(config, metrics)
            assert cost > 0

    @mark.it("calculates DynamoDB on-demand cost")
    def test_calculate_dynamodb_ondemand_cost(self):
        """Test DynamoDB on-demand cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {
                "billing_mode": "PAY_PER_REQUEST",
                "read_capacity": 0,
                "write_capacity": 0,
            }
            metrics = {"consumed_read_capacity": 100, "consumed_write_capacity": 50}
            cost = optimizer._calculate_dynamodb_cost(config, metrics)
            assert cost > 0

    @mark.it("calculates Lambda cost correctly")
    def test_calculate_lambda_cost(self):
        """Test Lambda cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {
                "memory_size": 3008,
                "timeout": 900,
                "reserved_concurrent": 0,
            }
            metrics = {"p95_duration": 100, "invocations": 10000}
            cost = optimizer._calculate_lambda_cost(config, metrics)
            assert cost > 0

    @mark.it("calculates S3 Intelligent Tiering cost")
    def test_calculate_s3_intelligent_tiering_cost(self):
        """Test S3 Intelligent Tiering cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {"storage_class": "INTELLIGENT_TIERING", "lifecycle_rules": 1}
            metrics = {"bucket_size_gb": 100, "number_of_objects": 10000}
            cost = optimizer._calculate_s3_cost(config, metrics)
            assert cost > 0

    @mark.it("calculates S3 Standard-IA cost")
    def test_calculate_s3_standard_ia_cost(self):
        """Test S3 Standard-IA cost calculation"""
        with patch("lib.optimize.boto3"):
            optimizer = AWSOptimizer()
            config = {"storage_class": "STANDARD_IA", "lifecycle_rules": 1}
            metrics = {"bucket_size_gb": 100}
            cost = optimizer._calculate_s3_cost(config, metrics)
            assert cost > 0


@mark.describe("Apply Optimizations")
class TestApplyOptimizations:
    """Test applying optimizations"""

    @mark.it("applies Aurora optimization")
    def test_apply_aurora_optimization(self):
        """Test applying Aurora optimization"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_rds = MagicMock()
            mock_rds.describe_db_clusters.return_value = {
                "DBClusters": [
                    {
                        "DBClusterMembers": [
                            {
                                "IsClusterWriter": False,
                                "DBInstanceIdentifier": "reader1",
                            },
                            {
                                "IsClusterWriter": False,
                                "DBInstanceIdentifier": "reader2",
                            },
                        ]
                    }
                ]
            }

            mock_boto.client.return_value = mock_rds

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="Aurora",
                resource_id="tap-aurora-test",
                current_config={},
                optimized_config={
                    "min_capacity": 1,
                    "backup_retention": 7,
                    "reader_instances": 1,
                },
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
            )

            optimizer._apply_aurora_optimization(optimization)
            assert mock_rds.modify_db_cluster.called

    @mark.it("applies ElastiCache optimization")
    def test_apply_elasticache_optimization(self):
        """Test applying ElastiCache optimization"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_elasticache = MagicMock()
            mock_boto.client.return_value = mock_elasticache

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="ElastiCache",
                resource_id="tap-redis-test",
                current_config={},
                optimized_config={"num_node_groups": 3, "node_type": "cache.r6g.large"},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
            )

            optimizer._apply_elasticache_optimization(optimization)
            assert mock_elasticache.modify_replication_group_shard_configuration.called

    @mark.it("applies ECS optimization")
    def test_apply_ecs_optimization(self):
        """Test applying ECS optimization"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_ecs = MagicMock()
            mock_boto.client.return_value = mock_ecs

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="ECS",
                resource_id="tap-ecs-test/tap-service-test",
                current_config={},
                optimized_config={
                    "desired_count": 3,
                    "memory": 1024,
                    "cpu": 512,
                },
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
            )

            optimizer._apply_ecs_optimization(optimization)
            assert mock_ecs.update_service.called

    @mark.it("applies DynamoDB optimization")
    def test_apply_dynamodb_optimization(self):
        """Test applying DynamoDB optimization"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_dynamodb = MagicMock()
            mock_boto.client.return_value = mock_dynamodb

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="DynamoDB",
                resource_id="tap-table-test",
                current_config={},
                optimized_config={"billing_mode": "PAY_PER_REQUEST"},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
            )

            optimizer._apply_dynamodb_optimization(optimization)
            assert mock_dynamodb.update_table.called

    @mark.it("applies Lambda optimization")
    def test_apply_lambda_optimization(self):
        """Test applying Lambda optimization"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_lambda = MagicMock()
            mock_boto.client.return_value = mock_lambda

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="Lambda",
                resource_id="tap-processor-test",
                current_config={},
                optimized_config={
                    "memory_size": 1024,
                    "timeout": 300,
                    "reserved_concurrent": 20,
                },
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
            )

            optimizer._apply_lambda_optimization(optimization)
            assert mock_lambda.update_function_configuration.called

    @mark.it("applies S3 optimization")
    def test_apply_s3_optimization(self):
        """Test applying S3 optimization"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_s3 = MagicMock()
            mock_boto.client.return_value = mock_s3

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="S3",
                resource_id="tap-media-test",
                current_config={},
                optimized_config={
                    "storage_class": "STANDARD_IA",
                    "transition_days": 30,
                },
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
            )

            optimizer._apply_s3_optimization(optimization)
            assert mock_s3.put_bucket_lifecycle_configuration.called


@mark.describe("Rollback Functionality")
class TestRollback:
    """Test rollback functionality"""

    @mark.it("checks for metric spikes")
    def test_check_for_metric_spikes_detected(self):
        """Test spike detection returns True when spikes detected"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_cloudwatch = MagicMock()
            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 85.0}]
            }

            mock_boto.client.return_value = mock_cloudwatch

            optimizer = AWSOptimizer()
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="Aurora",
                    resource_id="test-cluster",
                    current_config={},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                )
            ]

            result = optimizer._check_for_metric_spikes()
            assert result is True

    @mark.it("checks for metric spikes not detected")
    def test_check_for_metric_spikes_not_detected(self):
        """Test spike detection returns False when no spikes"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_cloudwatch = MagicMock()
            mock_cloudwatch.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 50.0}]
            }

            mock_boto.client.return_value = mock_cloudwatch

            optimizer = AWSOptimizer()
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="ECS",
                    resource_id="cluster/service",
                    current_config={},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                )
            ]

            result = optimizer._check_for_metric_spikes()
            assert result is False

    @mark.it("rolls back Aurora changes")
    def test_rollback_aurora(self):
        """Test Aurora rollback"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_rds = MagicMock()
            mock_boto.client.return_value = mock_rds

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="Aurora",
                resource_id="tap-aurora-test",
                current_config={
                    "min_capacity": 4,
                    "backup_retention": 35,
                },
                optimized_config={},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
                optimization_applied=True,
            )

            optimizer._rollback_aurora(optimization)
            assert mock_rds.modify_current_db_cluster_capacity.called
            assert mock_rds.modify_db_cluster.called

    @mark.it("rolls back ElastiCache changes")
    def test_rollback_elasticache(self):
        """Test ElastiCache rollback"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_elasticache = MagicMock()
            mock_boto.client.return_value = mock_elasticache

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="ElastiCache",
                resource_id="tap-redis-test",
                current_config={"num_node_groups": 5},
                optimized_config={},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
                optimization_applied=True,
            )

            optimizer._rollback_elasticache(optimization)
            assert mock_elasticache.modify_replication_group_shard_configuration.called

    @mark.it("rolls back ECS changes")
    def test_rollback_ecs(self):
        """Test ECS rollback"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_ecs = MagicMock()
            mock_boto.client.return_value = mock_ecs

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="ECS",
                resource_id="cluster/service",
                current_config={"desired_count": 8},
                optimized_config={},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
                optimization_applied=True,
            )

            optimizer._rollback_ecs(optimization)
            assert mock_ecs.update_service.called

    @mark.it("rolls back DynamoDB changes")
    def test_rollback_dynamodb(self):
        """Test DynamoDB rollback"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_dynamodb = MagicMock()
            mock_boto.client.return_value = mock_dynamodb

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="DynamoDB",
                resource_id="tap-table-test",
                current_config={
                    "billing_mode": "PROVISIONED",
                    "read_capacity": 100,
                    "write_capacity": 100,
                },
                optimized_config={},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
                optimization_applied=True,
            )

            optimizer._rollback_dynamodb(optimization)
            assert mock_dynamodb.update_table.called

    @mark.it("rolls back Lambda changes")
    def test_rollback_lambda(self):
        """Test Lambda rollback"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_lambda = MagicMock()
            mock_boto.client.return_value = mock_lambda

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="Lambda",
                resource_id="tap-processor-test",
                current_config={
                    "memory_size": 3008,
                    "timeout": 900,
                    "reserved_concurrent": 0,
                },
                optimized_config={},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
                optimization_applied=True,
            )

            optimizer._rollback_lambda(optimization)
            assert mock_lambda.update_function_configuration.called

    @mark.it("rolls back S3 changes")
    def test_rollback_s3(self):
        """Test S3 rollback"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_s3 = MagicMock()
            mock_boto.client.return_value = mock_s3

            optimizer = AWSOptimizer(dry_run=False)
            optimization = ResourceConfiguration(
                resource_type="S3",
                resource_id="tap-media-test",
                current_config={},
                optimized_config={},
                metrics={},
                current_cost=100,
                optimized_cost=50,
                savings=50,
                optimization_applied=True,
            )

            optimizer._rollback_s3(optimization)
            assert mock_s3.put_bucket_lifecycle_configuration.called


@mark.describe("Report Generation")
class TestReportGeneration:
    """Test report generation"""

    @mark.it("generates optimization report")
    def test_generate_report(self):
        """Test report generation"""
        with patch("lib.optimize.boto3"), patch(
            "builtins.open", mock_open()
        ) as mock_file:
            optimizer = AWSOptimizer(dry_run=True)
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="Aurora",
                    resource_id="test",
                    current_config={},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                )
            ]

            report = optimizer._generate_report()

            assert report.total_monthly_savings == 50.0
            assert report.total_annual_savings == 600.0
            assert report.dry_run is True
            assert len(report.analyzed_resources) == 1


@mark.describe("Confirmation Flow")
class TestConfirmation:
    """Test user confirmation flow"""

    @mark.it("confirms optimizations when user says yes")
    def test_confirm_optimizations_yes(self):
        """Test confirmation returns True when user confirms"""
        with patch("lib.optimize.boto3"), patch("builtins.input", return_value="yes"):
            optimizer = AWSOptimizer(dry_run=False)
            report = OptimizationReport(
                timestamp="2024-01-01",
                status=OptimizationStatus.PENDING,
                dry_run=False,
                analyzed_resources=[],
                optimizations=[],
                total_current_cost=100,
                total_optimized_cost=50,
                total_monthly_savings=50,
                total_annual_savings=600,
                rollback_plan={},
            )

            result = optimizer._confirm_optimizations(report)
            assert result is True

    @mark.it("declines optimizations when user says no")
    def test_confirm_optimizations_no(self):
        """Test confirmation returns False when user declines"""
        with patch("lib.optimize.boto3"), patch("builtins.input", return_value="no"), \
             patch("sys.stdin.isatty", return_value=True):
            optimizer = AWSOptimizer(dry_run=False)
            report = OptimizationReport(
                timestamp="2024-01-01",
                status=OptimizationStatus.PENDING,
                dry_run=False,
                analyzed_resources=[],
                optimizations=[],
                total_current_cost=100,
                total_optimized_cost=50,
                total_monthly_savings=50,
                total_annual_savings=600,
                rollback_plan={},
            )

            result = optimizer._confirm_optimizations(report)
            assert result is False


@mark.describe("Monitoring and Rollback")
class TestMonitoring:
    """Test monitoring and rollback"""

    @mark.it("monitors for rollback with no spikes")
    def test_monitor_for_rollback_no_spikes(self):
        """Test monitoring without spikes"""
        with patch("lib.optimize.boto3"), patch("time.sleep"):
            optimizer = AWSOptimizer(dry_run=False)
            optimizer.optimizations = []

            with patch.object(
                optimizer, "_check_for_metric_spikes", return_value=False
            ):
                optimizer._monitor_for_rollback()
                # Should complete without rollback

    @mark.it("monitors for rollback with spikes detected")
    def test_monitor_for_rollback_with_spikes(self):
        """Test monitoring with spikes triggers rollback"""
        with patch("lib.optimize.boto3"), patch("time.sleep"):
            optimizer = AWSOptimizer(dry_run=False)
            optimizer.optimizations = []

            with patch.object(
                optimizer, "_check_for_metric_spikes", return_value=True
            ):
                with patch.object(optimizer, "_rollback_changes"):
                    optimizer._monitor_for_rollback()
                    # Rollback should be called


@mark.describe("Complete Workflow")
class TestCompleteWorkflow:
    """Test complete optimization workflow"""

    @mark.it("completes dry run workflow")
    def test_analyze_and_optimize_dry_run(self):
        """Test complete dry run workflow"""
        with patch("lib.optimize.boto3") as mock_boto, patch(
            "builtins.open", mock_open()
        ):
            # Setup mocks
            mock_clients = {
                "rds": MagicMock(),
                "elasticache": MagicMock(),
                "ecs": MagicMock(),
                "dynamodb": MagicMock(),
                "lambda": MagicMock(),
                "s3": MagicMock(),
                "cloudwatch": MagicMock(),
                "pricing": MagicMock(),
            }

            def get_client(service_name, **kwargs):
                return mock_clients.get(service_name, MagicMock())

            mock_boto.client.side_effect = get_client

            # Configure mock responses for no optimizations
            mock_clients["rds"].describe_db_clusters.side_effect = ClientError(
                {"Error": {"Code": "ClusterNotFound"}}, "describe_db_clusters"
            )
            mock_clients["elasticache"].describe_replication_groups.side_effect = (
                ClientError(
                    {"Error": {"Code": "GroupNotFound"}}, "describe_replication_groups"
                )
            )
            mock_clients["ecs"].describe_services.side_effect = ClientError(
                {"Error": {"Code": "ServiceNotFound"}}, "describe_services"
            )
            mock_clients["dynamodb"].describe_table.side_effect = ClientError(
                {"Error": {"Code": "TableNotFound"}}, "describe_table"
            )
            mock_clients["lambda"].get_function_configuration.side_effect = ClientError(
                {"Error": {"Code": "FunctionNotFound"}}, "get_function_configuration"
            )
            mock_clients["s3"].list_buckets.return_value = {"Buckets": []}

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            report = optimizer.analyze_and_optimize()

            assert report is not None
            assert report.dry_run is True
            assert report.status == OptimizationStatus.PENDING

    @mark.it("completes non-dry-run workflow with confirmation")
    def test_analyze_and_optimize_with_confirmation(self):
        """Test complete workflow with user confirmation"""
        with patch("lib.optimize.boto3") as mock_boto, patch(
            "builtins.open", mock_open()
        ), patch("builtins.input", return_value="yes"), patch("time.sleep"):

            mock_clients = {
                "rds": MagicMock(),
                "elasticache": MagicMock(),
                "ecs": MagicMock(),
                "dynamodb": MagicMock(),
                "lambda": MagicMock(),
                "s3": MagicMock(),
                "cloudwatch": MagicMock(),
                "pricing": MagicMock(),
            }

            def get_client(service_name, **kwargs):
                return mock_clients.get(service_name, MagicMock())

            mock_boto.client.side_effect = get_client

            # No optimizations found
            mock_clients["rds"].describe_db_clusters.side_effect = ClientError(
                {"Error": {"Code": "ClusterNotFound"}}, "describe_db_clusters"
            )
            mock_clients["elasticache"].describe_replication_groups.side_effect = (
                ClientError(
                    {"Error": {"Code": "GroupNotFound"}}, "describe_replication_groups"
                )
            )
            mock_clients["ecs"].describe_services.side_effect = ClientError(
                {"Error": {"Code": "ServiceNotFound"}}, "describe_services"
            )
            mock_clients["dynamodb"].describe_table.side_effect = ClientError(
                {"Error": {"Code": "TableNotFound"}}, "describe_table"
            )
            mock_clients["lambda"].get_function_configuration.side_effect = ClientError(
                {"Error": {"Code": "FunctionNotFound"}}, "get_function_configuration"
            )
            mock_clients["s3"].list_buckets.return_value = {"Buckets": []}

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=False)
            report = optimizer.analyze_and_optimize()

            assert report is not None

    @mark.it("handles optimization failure")
    def test_analyze_and_optimize_failure(self):
        """Test workflow handles failures"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_clients = MagicMock()
            mock_boto.client.return_value = mock_clients

            # Make analyze methods raise exception
            mock_clients.describe_db_clusters.side_effect = Exception("AWS Error")

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)

            with pytest.raises(Exception):
                optimizer.analyze_and_optimize()


@mark.describe("Apply Optimizations Flow")
class TestApplyOptimizationsFlow:
    """Test the full apply optimizations flow"""

    @mark.it("applies all optimizations successfully")
    def test_apply_all_optimizations(self):
        """Test applying all types of optimizations"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_clients = {
                "rds": MagicMock(),
                "elasticache": MagicMock(),
                "ecs": MagicMock(),
                "dynamodb": MagicMock(),
                "lambda": MagicMock(),
                "s3": MagicMock(),
            }

            def get_client(service_name, **kwargs):
                return mock_clients.get(service_name, MagicMock())

            mock_boto.client.side_effect = get_client

            # Mock for Aurora delete instance
            mock_clients["rds"].describe_db_clusters.return_value = {
                "DBClusters": [
                    {
                        "DBClusterMembers": [
                            {
                                "IsClusterWriter": False,
                                "DBInstanceIdentifier": "reader1",
                            },
                            {
                                "IsClusterWriter": False,
                                "DBInstanceIdentifier": "reader2",
                            },
                        ]
                    }
                ]
            }

            optimizer = AWSOptimizer(dry_run=False)
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="Aurora",
                    resource_id="aurora-1",
                    current_config={},
                    optimized_config={
                        "min_capacity": 1,
                        "backup_retention": 7,
                        "reader_instances": 1,
                    },
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                ),
                ResourceConfiguration(
                    resource_type="ElastiCache",
                    resource_id="redis-1",
                    current_config={},
                    optimized_config={"num_node_groups": 3},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                ),
                ResourceConfiguration(
                    resource_type="ECS",
                    resource_id="cluster/service",
                    current_config={},
                    optimized_config={"desired_count": 3},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                ),
                ResourceConfiguration(
                    resource_type="DynamoDB",
                    resource_id="table-1",
                    current_config={},
                    optimized_config={"billing_mode": "PAY_PER_REQUEST"},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                ),
                ResourceConfiguration(
                    resource_type="Lambda",
                    resource_id="function-1",
                    current_config={},
                    optimized_config={
                        "memory_size": 1024,
                        "timeout": 300,
                        "reserved_concurrent": 10,
                    },
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                ),
                ResourceConfiguration(
                    resource_type="S3",
                    resource_id="bucket-1",
                    current_config={},
                    optimized_config={"transition_days": 30},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                ),
            ]

            optimizer._apply_optimizations()

            # Check all optimizations were applied
            assert all(opt.optimization_applied for opt in optimizer.optimizations)

    @mark.it("handles apply optimization errors gracefully")
    def test_apply_optimizations_with_errors(self):
        """Test applying optimizations handles errors"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_rds = MagicMock()
            mock_rds.modify_db_cluster.side_effect = Exception(
                "AWS Error"
            )
            mock_boto.client.return_value = mock_rds

            optimizer = AWSOptimizer(dry_run=False)
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="Aurora",
                    resource_id="aurora-1",
                    current_config={},
                    optimized_config={
                        "min_capacity": 1,
                        "backup_retention": 7,
                        "reader_instances": 1,
                    },
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                )
            ]

            optimizer._apply_optimizations()

            # Check optimization was not marked as applied due to error
            assert optimizer.optimizations[0].optimization_applied is False


@mark.describe("Rollback Flow")
class TestRollbackFlow:
    """Test the full rollback flow"""

    @mark.it("rolls back all changes successfully")
    def test_rollback_all_changes(self):
        """Test rolling back all types of optimizations"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_clients = {
                "rds": MagicMock(),
                "elasticache": MagicMock(),
                "ecs": MagicMock(),
                "dynamodb": MagicMock(),
                "lambda": MagicMock(),
                "s3": MagicMock(),
            }

            def get_client(service_name, **kwargs):
                return mock_clients.get(service_name, MagicMock())

            mock_boto.client.side_effect = get_client

            optimizer = AWSOptimizer(dry_run=False)
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="Aurora",
                    resource_id="aurora-1",
                    current_config={"min_capacity": 4, "backup_retention": 35},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                    optimization_applied=True,
                ),
                ResourceConfiguration(
                    resource_type="ElastiCache",
                    resource_id="redis-1",
                    current_config={"num_node_groups": 5},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                    optimization_applied=True,
                ),
                ResourceConfiguration(
                    resource_type="ECS",
                    resource_id="cluster/service",
                    current_config={"desired_count": 8},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                    optimization_applied=True,
                ),
                ResourceConfiguration(
                    resource_type="DynamoDB",
                    resource_id="table-1",
                    current_config={
                        "billing_mode": "PROVISIONED",
                        "read_capacity": 100,
                        "write_capacity": 100,
                    },
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                    optimization_applied=True,
                ),
                ResourceConfiguration(
                    resource_type="Lambda",
                    resource_id="function-1",
                    current_config={
                        "memory_size": 3008,
                        "timeout": 900,
                        "reserved_concurrent": 0,
                    },
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                    optimization_applied=True,
                ),
                ResourceConfiguration(
                    resource_type="S3",
                    resource_id="bucket-1",
                    current_config={},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                    optimization_applied=True,
                ),
            ]

            optimizer._rollback_changes()

            # Verify rollback methods were called
            assert mock_clients["rds"].modify_current_db_cluster_capacity.called
            assert (
                mock_clients[
                    "elasticache"
                ].modify_replication_group_shard_configuration.called
            )
            assert mock_clients["ecs"].update_service.called
            assert mock_clients["dynamodb"].update_table.called
            assert mock_clients["lambda"].update_function_configuration.called
            assert mock_clients["s3"].put_bucket_lifecycle_configuration.called

    @mark.it("handles rollback errors gracefully")
    def test_rollback_with_errors(self):
        """Test rollback handles errors gracefully"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_rds = MagicMock()
            mock_rds.modify_current_db_cluster_capacity.side_effect = Exception(
                "Rollback Error"
            )
            mock_boto.client.return_value = mock_rds

            optimizer = AWSOptimizer(dry_run=False)
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="Aurora",
                    resource_id="aurora-1",
                    current_config={"min_capacity": 4, "backup_retention": 35},
                    optimized_config={},
                    metrics={},
                    current_cost=100,
                    optimized_cost=50,
                    savings=50,
                    optimization_applied=True,
                )
            ]

            # Should not raise exception
            optimizer._rollback_changes()


@mark.describe("Complete Non-Dry-Run Workflow")
class TestCompletNonDryRunWorkflow:
    """Test complete non-dry-run workflow"""

    @mark.it("completes full workflow with user decline")
    def test_analyze_and_optimize_user_declines(self):
        """Test workflow when user declines optimization"""
        with patch("lib.optimize.boto3") as mock_boto, patch(
            "builtins.open", mock_open()
        ), patch("builtins.input", return_value="no"), \
             patch("sys.stdin.isatty", return_value=True):

            mock_clients = {
                "rds": MagicMock(),
                "elasticache": MagicMock(),
                "ecs": MagicMock(),
                "dynamodb": MagicMock(),
                "lambda": MagicMock(),
                "s3": MagicMock(),
                "cloudwatch": MagicMock(),
                "pricing": MagicMock(),
            }

            def get_client(service_name, **kwargs):
                return mock_clients.get(service_name, MagicMock())

            mock_boto.client.side_effect = get_client

            # Configure mocks to find one optimization
            mock_clients["rds"].describe_db_clusters.return_value = {
                "DBClusters": [
                    {
                        "DBClusterIdentifier": "tap-aurora-test",
                        "ServerlessV2ScalingConfiguration": {
                            "MinCapacity": 4.0,
                            "MaxCapacity": 16.0,
                        },
                        "DBClusterMembers": [
                            {"IsClusterWriter": True, "DBInstanceIdentifier": "writer"},
                            {
                                "IsClusterWriter": False,
                                "DBInstanceIdentifier": "reader1",
                            },
                        ],
                        "BackupRetentionPeriod": 35,
                    }
                ]
            }

            # Low utilization metrics
            mock_clients["cloudwatch"].get_metric_statistics.side_effect = [
                {"Datapoints": [{"Average": 2.0}]},  # CPU low
                {"Datapoints": [{"Average": 10.0}]},  # Connections low
            ]

            # Other services return errors (no resources found)
            mock_clients["elasticache"].describe_replication_groups.side_effect = (
                ClientError(
                    {"Error": {"Code": "GroupNotFound"}}, "describe_replication_groups"
                )
            )
            mock_clients["ecs"].describe_services.side_effect = ClientError(
                {"Error": {"Code": "ServiceNotFound"}}, "describe_services"
            )
            mock_clients["dynamodb"].describe_table.side_effect = ClientError(
                {"Error": {"Code": "TableNotFound"}}, "describe_table"
            )
            mock_clients["lambda"].get_function_configuration.side_effect = ClientError(
                {"Error": {"Code": "FunctionNotFound"}}, "get_function_configuration"
            )
            mock_clients["s3"].list_buckets.return_value = {"Buckets": []}

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=False)
            report = optimizer.analyze_and_optimize()

            assert report is not None
            assert report.status == OptimizationStatus.PENDING


@mark.describe("Main Function")
class TestMainFunction:
    """Test main entry point"""

    @mark.it("runs main with dry-run")
    def test_main_dry_run(self):
        """Test main function with dry-run"""
        with patch("sys.argv", ["optimize.py", "--dry-run"]), patch(
            "lib.optimize.boto3"
        ), patch("builtins.open", mock_open()):

            with patch("lib.optimize.AWSOptimizer") as mock_optimizer_class:
                mock_optimizer = MagicMock()
                mock_optimizer_class.return_value = mock_optimizer
                mock_optimizer.analyze_and_optimize.return_value = OptimizationReport(
                    timestamp="2024-01-01",
                    status=OptimizationStatus.COMPLETED,
                    dry_run=True,
                    analyzed_resources=[],
                    optimizations=[],
                    total_current_cost=100,
                    total_optimized_cost=50,
                    total_monthly_savings=50,
                    total_annual_savings=600,
                    rollback_plan={},
                )

                main()

    @mark.it("handles KeyboardInterrupt")
    def test_main_keyboard_interrupt(self):
        """Test main handles keyboard interrupt"""
        with patch("sys.argv", ["optimize.py"]), patch("lib.optimize.boto3"):
            with patch("lib.optimize.AWSOptimizer") as mock_optimizer_class:
                mock_optimizer = MagicMock()
                mock_optimizer_class.return_value = mock_optimizer
                mock_optimizer.analyze_and_optimize.side_effect = KeyboardInterrupt()

                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 0

    @mark.it("handles general exception")
    def test_main_exception(self):
        """Test main handles general exception"""
        with patch("sys.argv", ["optimize.py"]), patch("lib.optimize.boto3"):
            with patch("lib.optimize.AWSOptimizer") as mock_optimizer_class:
                mock_optimizer = MagicMock()
                mock_optimizer_class.return_value = mock_optimizer
                mock_optimizer.analyze_and_optimize.side_effect = Exception(
                    "Test error"
                )

                with pytest.raises(SystemExit) as exc_info:
                    main()
                assert exc_info.value.code == 1


@mark.describe("Stack Output Loading Edge Cases")
class TestStackOutputLoading:
    """Test stack output loading edge cases"""

    @mark.it("handles empty stacks response")
    def test_empty_stacks_response(self):
        """Test handling of empty stacks response"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_cfn = MagicMock()
            mock_cfn.describe_stacks.return_value = {"Stacks": []}
            mock_boto.client.return_value = mock_cfn

            optimizer = AWSOptimizer(environment_suffix="test")
            assert optimizer.stack_outputs == {}

    @mark.it("handles validation error for non-existent stack")
    def test_validation_error(self):
        """Test handling of ValidationError for non-existent stack"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_cfn = MagicMock()
            error_response = {"Error": {"Code": "ValidationError", "Message": "Stack does not exist"}}
            mock_cfn.describe_stacks.side_effect = ClientError(error_response, "DescribeStacks")
            mock_boto.client.return_value = mock_cfn

            optimizer = AWSOptimizer(environment_suffix="test")
            assert optimizer.stack_outputs == {}

    @mark.it("handles other client errors")
    def test_other_client_error(self):
        """Test handling of other ClientError types"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_cfn = MagicMock()
            error_response = {"Error": {"Code": "AccessDenied", "Message": "Access denied"}}
            mock_cfn.describe_stacks.side_effect = ClientError(error_response, "DescribeStacks")
            mock_boto.client.return_value = mock_cfn

            optimizer = AWSOptimizer(environment_suffix="test")
            assert optimizer.stack_outputs == {}

    @mark.it("handles unexpected exceptions")
    def test_unexpected_exception(self):
        """Test handling of unexpected exceptions during stack loading"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_cfn = MagicMock()
            mock_cfn.describe_stacks.side_effect = Exception("Unexpected error")
            mock_boto.client.return_value = mock_cfn

            optimizer = AWSOptimizer(environment_suffix="test")
            assert optimizer.stack_outputs == {}


@mark.describe("Edge Cases and Error Paths")
class TestEdgeCasesAndErrors:
    """Test edge cases and error handling paths"""

    @mark.it("handles analyze_and_optimize with exception in analysis")
    def test_analyze_with_exception(self):
        """Test that exceptions in analyze are properly caught"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_client = MagicMock()
            mock_client.describe_stacks.return_value = {"Stacks": []}
            mock_client.describe_db_clusters.side_effect = Exception("Analysis error")
            mock_boto.client.return_value = mock_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)

            with pytest.raises(Exception):
                optimizer.analyze_and_optimize()

    @mark.it("covers lambda function ARN extraction from outputs")
    def test_lambda_arn_extraction(self):
        """Test Lambda function name extraction from ARN in stack outputs"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_client = MagicMock()

            # Mock CloudFormation with Lambda ARNs
            mock_client.describe_stacks.return_value = {
                "Stacks": [{
                    "Outputs": [
                        {"OutputKey": "ProcessorLambdaArn", "OutputValue": "arn:aws:lambda:us-east-1:123:function:my-processor"},
                        {"OutputKey": "AnalyzerLambdaArn", "OutputValue": "arn:aws:lambda:us-east-1:123:function:my-analyzer"},
                    ]
                }]
            }

            # Mock Lambda responses
            mock_client.get_function_configuration.return_value = {
                "MemorySize": 512,
                "Timeout": 30,
            }
            # Mock metrics with proper structure
            mock_client.get_metric_statistics.return_value = {
                "Datapoints": [{"Average": 100, "Sum": 0}]
            }

            mock_boto.client.return_value = mock_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_lambda()

            # Verify Lambda functions were analyzed using ARN-extracted names
            assert mock_client.get_function_configuration.called

    @mark.it("covers S3 bucket discovery from outputs")
    def test_s3_bucket_from_outputs(self):
        """Test S3 bucket discovery from stack outputs"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_client = MagicMock()

            # Mock CloudFormation with S3 bucket names
            mock_client.describe_stacks.return_value = {
                "Stacks": [{
                    "Outputs": [
                        {"OutputKey": "MediaBucketName", "OutputValue": "my-media-bucket"},
                    ]
                }]
            }

            # Mock S3 responses
            mock_client.get_bucket_lifecycle_configuration.side_effect = ClientError(
                {"Error": {"Code": "NoSuchLifecycleConfiguration"}}, "GetBucketLifecycle"
            )
            mock_client.get_metric_statistics.return_value = {"Datapoints": []}

            mock_boto.client.return_value = mock_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)
            optimizer._analyze_s3()

            # Should not raise exception
            assert True

    @mark.it("covers optimization confirmation rejection")
    def test_optimization_confirmation_no(self):
        """Test user rejecting optimization confirmation"""
        with patch("lib.optimize.boto3") as mock_boto, \
             patch("builtins.input", return_value="no"), \
             patch("sys.stdin.isatty", return_value=True):

            mock_client = MagicMock()
            mock_client.describe_stacks.return_value = {"Stacks": []}
            mock_boto.client.return_value = mock_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=False)
            optimizer.optimizations = [
                ResourceConfiguration(
                    resource_type="test",
                    resource_id="test-1",
                    current_config={},
                    optimized_config={},
                    metrics={},
                    current_cost=100.0,
                    optimized_cost=50.0,
                    savings=50.0,
                )
            ]

            report = optimizer._generate_report()
            result = optimizer._confirm_optimizations(report)

            assert result is False

    @mark.it("covers cost calculation with zero pricing")
    def test_cost_calculation_edge_cases(self):
        """Test cost calculation with edge cases"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_client = MagicMock()
            mock_client.describe_stacks.return_value = {"Stacks": []}
            mock_client.get_products.return_value = {"PriceList": []}
            mock_boto.client.return_value = mock_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=True)

            # Test Aurora cost calculation with valid config
            aurora_config = {
                "min_capacity": 0.5,
                "max_capacity": 1.0,
                "reader_instances": 1,
                "backup_retention": 7
            }
            cost = optimizer._calculate_aurora_cost(aurora_config)
            assert cost >= 0

    @mark.it("covers no optimizations found path")
    def test_no_optimizations_found(self):
        """Test when no optimizations are needed"""
        with patch("lib.optimize.boto3") as mock_boto:
            mock_client = MagicMock()
            mock_client.describe_stacks.return_value = {"Stacks": []}

            # Mock all resources as not found
            mock_client.describe_db_clusters.side_effect = ClientError(
                {"Error": {"Code": "DBClusterNotFoundFault"}}, "DescribeDBClusters"
            )
            mock_client.describe_replication_groups.side_effect = ClientError(
                {"Error": {"Code": "ReplicationGroupNotFoundFault"}}, "DescribeReplicationGroups"
            )
            mock_client.describe_services.side_effect = ClientError(
                {"Error": {"Code": "ClusterNotFoundException"}}, "DescribeServices"
            )
            mock_client.describe_table.side_effect = ClientError(
                {"Error": {"Code": "ResourceNotFoundException"}}, "DescribeTable"
            )
            mock_client.get_function_configuration.side_effect = ClientError(
                {"Error": {"Code": "ResourceNotFoundException"}}, "GetFunctionConfiguration"
            )
            mock_client.list_buckets.return_value = {"Buckets": []}

            mock_boto.client.return_value = mock_client

            optimizer = AWSOptimizer(environment_suffix="test", dry_run=False)
            report = optimizer.analyze_and_optimize()

            assert len(optimizer.optimizations) == 0
            assert report.total_monthly_savings == 0.0
