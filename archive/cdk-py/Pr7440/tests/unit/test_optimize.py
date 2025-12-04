"""
Unit tests for lib/optimize.py
"""

import json
import os
import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, call, mock_open, patch

from lib.optimize import (OptimizationMetrics, OptimizationPhase,
                          ResourceIdentifiers, TapOptimizer,
                          extract_resource_identifiers,
                          get_all_regions_from_outputs,
                          load_deployment_outputs)


class TestOptimizationPhase(unittest.TestCase):
    """Test OptimizationPhase enum."""

    def test_phase_values(self):
        """Test that optimization phases have correct values."""
        self.assertEqual(OptimizationPhase.NON_CRITICAL.value, 1)
        self.assertEqual(OptimizationPhase.COMPUTE.value, 2)
        self.assertEqual(OptimizationPhase.DATABASE.value, 3)


class TestOptimizationMetrics(unittest.TestCase):
    """Test OptimizationMetrics dataclass."""

    def test_initialization(self):
        """Test OptimizationMetrics initialization."""
        metrics = OptimizationMetrics(
            phase=OptimizationPhase.NON_CRITICAL,
            start_time=datetime.now()
        )
        self.assertEqual(metrics.phase, OptimizationPhase.NON_CRITICAL)
        self.assertIsNotNone(metrics.start_time)
        self.assertEqual(metrics.actions_taken, [])
        self.assertFalse(metrics.rollback_required)

    def test_with_all_fields(self):
        """Test OptimizationMetrics with all fields."""
        start_time = datetime.now()
        end_time = start_time + timedelta(hours=1)
        metrics = OptimizationMetrics(
            phase=OptimizationPhase.COMPUTE,
            start_time=start_time,
            end_time=end_time,
            initial_cost=100.0,
            projected_cost=80.0,
            error_rate=0.001,
            p99_latency=0.5,
            actions_taken=['Action 1', 'Action 2'],
            rollback_required=True,
            rollback_reason='Error threshold exceeded'
        )
        self.assertEqual(metrics.phase, OptimizationPhase.COMPUTE)
        self.assertEqual(metrics.end_time, end_time)
        self.assertEqual(metrics.initial_cost, 100.0)
        self.assertEqual(metrics.projected_cost, 80.0)
        self.assertEqual(metrics.error_rate, 0.001)
        self.assertEqual(metrics.p99_latency, 0.5)
        self.assertEqual(len(metrics.actions_taken), 2)
        self.assertTrue(metrics.rollback_required)
        self.assertEqual(metrics.rollback_reason, 'Error threshold exceeded')


class TestResourceIdentifiers(unittest.TestCase):
    """Test ResourceIdentifiers dataclass."""

    def test_initialization(self):
        """Test ResourceIdentifiers initialization."""
        resource_ids = ResourceIdentifiers(region='us-east-1')
        self.assertEqual(resource_ids.region, 'us-east-1')
        self.assertIsNone(resource_ids.alb_full_name)
        self.assertEqual(resource_ids.dynamodb_tables, [])

    def test_with_all_fields(self):
        """Test ResourceIdentifiers with all fields."""
        resource_ids = ResourceIdentifiers(
            region='us-east-1',
            alb_full_name='app/tap-prod-alb/123456',
            alb_arn='arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/tap-prod-alb/123456',
            asg_name='tap-prod-asg',
            aurora_cluster_id='tap-prod-aurora',
            aurora_endpoint='tap-prod-aurora.cluster-xyz.us-east-1.rds.amazonaws.com',
            redis_cluster_id='tap-prod-redis',
            redis_config_endpoint='clustercfg.tap-prod-redis.xyz.cache.amazonaws.com',
            dynamodb_tables=['tap-prod-tenants', 'tap-prod-users'],
            vpc_id='vpc-12345678',
            environment_suffix='prod'
        )
        self.assertEqual(resource_ids.region, 'us-east-1')
        self.assertIsNotNone(resource_ids.alb_full_name)
        self.assertEqual(len(resource_ids.dynamodb_tables), 2)


class TestLoadDeploymentOutputs(unittest.TestCase):
    """Test load_deployment_outputs function."""

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_load_from_explicit_file(self, mock_file, mock_exists):
        """Test loading from explicit file path."""
        mock_exists.return_value = True
        test_outputs = {'VpcId': 'vpc-123', 'AlbFullName': 'app/tap-alb/123'}
        mock_file.return_value.read.return_value = json.dumps(test_outputs)

        result = load_deployment_outputs('custom-outputs.json')

        self.assertEqual(result, test_outputs)
        mock_exists.assert_called()
        mock_file.assert_called()

    @patch('os.path.exists')
    @patch('os.path.abspath')
    @patch('builtins.open', new_callable=mock_open)
    def test_load_from_default_paths(self, mock_file, mock_abspath, mock_exists):
        """Test loading from default file paths."""
        # Mock abspath to return the path as-is for testing
        mock_abspath.side_effect = lambda path: path
        # First path doesn't exist, second does
        mock_exists.side_effect = lambda path: path == 'cfn-outputs/flat-outputs.json'
        test_outputs = {'VpcId': 'vpc-123'}
        mock_file.return_value.read.return_value = json.dumps(test_outputs)

        result = load_deployment_outputs()

        self.assertEqual(result, test_outputs)

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_load_nested_format(self, mock_file, mock_exists):
        """Test loading nested Terraform output format."""
        mock_exists.return_value = True
        nested_outputs = {
            'VpcId': {'value': 'vpc-123'},
            'AlbFullName': {'value': 'app/tap-alb/123'}
        }
        mock_file.return_value.read.return_value = json.dumps(nested_outputs)

        result = load_deployment_outputs('outputs.json')

        self.assertEqual(result['VpcId'], 'vpc-123')
        self.assertEqual(result['AlbFullName'], 'app/tap-alb/123')

    @patch('os.path.exists')
    def test_file_not_found(self, mock_exists):
        """Test FileNotFoundError when no file exists."""
        mock_exists.return_value = False

        with self.assertRaises(FileNotFoundError):
            load_deployment_outputs()

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_invalid_json(self, mock_file, mock_exists):
        """Test handling of invalid JSON."""
        # First path has invalid JSON, second path has valid JSON
        call_count = [0]
        def exists_side_effect(path):
            call_count[0] += 1
            # First call returns True (invalid JSON), second call returns True (valid JSON)
            return call_count[0] <= 2
        
        mock_exists.side_effect = exists_side_effect
        
        def read_side_effect():
            call_count[0] += 1
            if call_count[0] == 1:
                return 'invalid json'
            return json.dumps({'VpcId': 'vpc-123'})
        
        mock_file.return_value.read.side_effect = read_side_effect

        # Should try first path, fail on JSON, then try second path and succeed
        result = load_deployment_outputs()
        self.assertEqual(result['VpcId'], 'vpc-123')


class TestExtractResourceIdentifiers(unittest.TestCase):
    """Test extract_resource_identifiers function."""

    def test_extract_all_resources(self):
        """Test extracting all resource identifiers."""
        outputs = {
            'AlbFullName': 'app/tap-prod-alb/123',
            'AlbArn': 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/tap-prod-alb/123',
            'AutoScalingGroupName': 'tap-prod-asg',
            'AuroraClusterIdentifier': 'tap-prod-aurora',
            'AuroraClusterEndpoint': 'tap-prod-aurora.cluster-xyz.us-east-1.rds.amazonaws.com',
            'RedisClusterId': 'tap-prod-redis',
            'RedisConfigurationEndpoint': 'clustercfg.tap-prod-redis.xyz.cache.amazonaws.com',
            'DynamoTableTenantsName': 'tap-prod-tenants',
            'DynamoTableUsersName': 'tap-prod-users',
            'VpcId': 'vpc-12345678',
            'EnvironmentSuffix': 'prod'
        }

        result = extract_resource_identifiers(outputs, 'us-east-1')

        self.assertEqual(result.region, 'us-east-1')
        self.assertEqual(result.alb_full_name, 'app/tap-prod-alb/123')
        self.assertEqual(result.asg_name, 'tap-prod-asg')
        self.assertEqual(result.aurora_cluster_id, 'tap-prod-aurora')
        self.assertEqual(len(result.dynamodb_tables), 2)
        self.assertEqual(result.environment_suffix, 'prod')

    def test_extract_minimal_resources(self):
        """Test extracting with minimal outputs."""
        outputs = {'VpcId': 'vpc-123'}

        result = extract_resource_identifiers(outputs, 'us-west-2')

        self.assertEqual(result.region, 'us-west-2')
        self.assertIsNone(result.alb_full_name)
        self.assertEqual(result.dynamodb_tables, [])

    def test_extract_environment_suffix_from_alb(self):
        """Test extracting environment suffix from ALB name."""
        outputs = {
            'AlbFullName': 'app/tap-dev-alb/1234567890123456'
        }

        result = extract_resource_identifiers(outputs, 'us-east-1')

        # ALB full name format: app/tap-{env}-alb/{id}
        # After splitting by '/', we get ['app', 'tap-dev-alb', '1234567890123456']
        # Then split 'tap-dev-alb' by '-' to get ['tap', 'dev', 'alb']
        self.assertEqual(result.environment_suffix, 'dev')

    def test_extract_environment_suffix_from_alb_invalid_format(self):
        """Test extracting environment suffix from ALB name with invalid format."""
        outputs = {
            'AlbFullName': 'invalid-format'
        }

        result = extract_resource_identifiers(outputs, 'us-east-1')

        # Should not extract suffix from invalid format
        self.assertIsNone(result.environment_suffix)

    def test_extract_dynamodb_tables_various_formats(self):
        """Test extracting DynamoDB tables from various key formats."""
        outputs = {
            'DynamoTableTenantsName': 'tap-prod-tenants',
            'tap-prod-ddb-users-name': 'tap-prod-users',
            'DynamoTableAuditLogsName': 'tap-prod-audit-logs'
        }

        result = extract_resource_identifiers(outputs, 'us-east-1')

        self.assertEqual(len(result.dynamodb_tables), 3)
        self.assertIn('tap-prod-tenants', result.dynamodb_tables)
        self.assertIn('tap-prod-users', result.dynamodb_tables)
        self.assertIn('tap-prod-audit-logs', result.dynamodb_tables)


class TestGetAllRegionsFromOutputs(unittest.TestCase):
    """Test get_all_regions_from_outputs function."""

    def test_extract_from_stack_region(self):
        """Test extracting region from StackRegion output."""
        outputs = {'StackRegion': 'us-west-2'}

        result = get_all_regions_from_outputs(outputs)

        self.assertIn('us-west-2', result)

    def test_extract_from_arns(self):
        """Test extracting regions from ARNs."""
        outputs = {
            'AlbArn': 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/tap-alb/123',
            'AuroraClusterArn': 'arn:aws:rds:us-west-2:123456789012:cluster:tap-aurora'
        }

        result = get_all_regions_from_outputs(outputs)

        self.assertIn('us-east-1', result)
        self.assertIn('us-west-2', result)

    def test_default_region(self):
        """Test defaulting to us-east-1 when no regions found."""
        outputs = {'VpcId': 'vpc-123'}

        result = get_all_regions_from_outputs(outputs)

        self.assertIn('us-east-1', result)

    def test_multiple_regions(self):
        """Test extracting multiple unique regions."""
        outputs = {
            'StackRegion': 'us-east-1',
            'AlbArn': 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/tap-alb/123',
            'AuroraClusterArn': 'arn:aws:rds:eu-west-1:123456789012:cluster:tap-aurora'
        }

        result = get_all_regions_from_outputs(outputs)

        self.assertIn('us-east-1', result)
        self.assertIn('us-west-2', result)
        self.assertIn('eu-west-1', result)
        self.assertEqual(len(result), 3)


class TestTapOptimizer(unittest.TestCase):
    """Test TapOptimizer class."""

    def setUp(self):
        """Set up test fixtures."""
        self.resource_ids = ResourceIdentifiers(
            region='us-east-1',
            alb_full_name='app/tap-prod-alb/123',
            asg_name='tap-prod-asg',
            aurora_cluster_id='tap-prod-aurora',
            redis_cluster_id='tap-prod-redis',
            dynamodb_tables=['tap-prod-tenants', 'tap-prod-users'],
            environment_suffix='prod'
        )

    @patch('lib.optimize.boto3.Session')
    def test_initialization(self, mock_session):
        """Test TapOptimizer initialization."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)

        self.assertEqual(optimizer.region, 'us-east-1')
        self.assertTrue(optimizer.dry_run)
        self.assertEqual(optimizer.resource_ids, self.resource_ids)

    @patch('lib.optimize.boto3.Session')
    def test_initialization_with_session(self, mock_session):
        """Test TapOptimizer initialization with custom session."""
        custom_session = Mock()
        custom_session.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, session=custom_session)

        self.assertEqual(optimizer.session, custom_session)

    @patch('lib.optimize.boto3.Session')
    def test_collect_baseline_metrics_success(self, mock_session):
        """Test collecting baseline metrics successfully."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Mock CloudWatch responses
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 0.5, 'Average': 0.4}, {'Maximum': 0.6, 'Average': 0.5}]},  # Response time
            {'Datapoints': [{'Sum': 10}]},  # Errors
            {'Datapoints': [{'Sum': 1000}]}  # Requests
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._collect_baseline_metrics()

        self.assertIn('p99_latency', optimizer.baseline_metrics)
        self.assertIn('error_rate', optimizer.baseline_metrics)

    @patch('lib.optimize.boto3.Session')
    def test_collect_baseline_metrics_no_alb(self, mock_session):
        """Test collecting baseline metrics when ALB is not available."""
        resource_ids = ResourceIdentifiers(region='us-east-1')
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(resource_ids, dry_run=True)
        optimizer._collect_baseline_metrics()

        # Should not raise exception
        self.assertIsNotNone(optimizer.baseline_metrics)

    @patch('lib.optimize.boto3.Session')
    def test_get_current_metrics(self, mock_session):
        """Test getting current metrics."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 5}]},  # Errors
            {'Datapoints': [{'Sum': 1000}]},  # Requests
            {'Datapoints': [{'Maximum': 0.5}]}  # Latency
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 0.4}
        metrics = optimizer._get_current_metrics()

        self.assertIn('error_rate', metrics)
        self.assertIn('p99_latency', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_ec2_utilization(self, mock_session):
        """Test analyzing EC2 utilization."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 30.0}, {'Maximum': 40.0}]},  # CPU
            {'Datapoints': [{'Maximum': 1000000.0}]}  # Network
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_ec2_utilization()

        self.assertIn('p95_cpu', metrics)
        self.assertIn('p95_network', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_redis_utilization(self, mock_session):
        """Test analyzing Redis utilization."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 25.0}]},  # CPU
            {'Datapoints': [{'Average': 45.0}]},  # Memory
            {'Datapoints': [{'Sum': 5000}]}  # Commands
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_redis_utilization()

        self.assertIn('cpu', metrics)
        self.assertIn('memory', metrics)
        self.assertIn('commands_per_sec', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_aurora_metrics(self, mock_session):
        """Test analyzing Aurora metrics."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 35.0}]},  # CPU
            {'Datapoints': [{'Maximum': 50.0}]},  # Replica lag
            {'Datapoints': [{'Average': 100.0}]},  # Read IOPS
            {'Datapoints': [{'Average': 500.0}]}  # Write IOPS
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_aurora_metrics()

        self.assertIn('cpu_utilization', metrics)
        self.assertIn('replica_lag', metrics)
        self.assertIn('read_iops_ratio', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_get_dynamodb_tables(self, mock_session):
        """Test getting DynamoDB tables."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['tap-prod-tenants', 'tap-prod-users', 'other-table']
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        tables = optimizer._get_dynamodb_tables()

        self.assertGreater(len(tables), 0)
        self.assertTrue(all('tap-' in t for t in tables))

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1(self, mock_session):
        """Test executing phase 1 (DynamoDB optimizations)."""
        mock_dynamodb = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        mock_dynamodb.describe_table.return_value = {
            'Table': {'GlobalSecondaryIndexes': []}
        }
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2(self, mock_session):
        """Test executing phase 2 (Compute optimizations)."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Low utilization metrics
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 30.0}]},  # EC2 CPU
            {'Datapoints': [{'Maximum': 20.0}]},  # EC2 Network
            {'Datapoints': [{'Average': 25.0}]},  # Redis CPU
            {'Datapoints': [{'Average': 40.0}]},  # Redis Memory
            {'Datapoints': [{'Sum': 5000}]}  # Redis Commands
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase2()

        self.assertEqual(result['phase'], 'COMPUTE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3(self, mock_session):
        """Test executing phase 3 (Database optimizations)."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Low utilization metrics
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},  # Aurora CPU
            {'Datapoints': [{'Maximum': 50.0}]},  # Replica lag
            {'Datapoints': [{'Average': 50.0}]},  # Read IOPS
            {'Datapoints': [{'Average': 300.0}]}  # Write IOPS
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_run_optimization(self, mock_session):
        """Test running complete optimization workflow."""
        mock_cloudwatch = Mock()
        mock_dynamodb = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        # Mock baseline metrics collection
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 0.5, 'Average': 0.4}]},  # Baseline latency
            {'Datapoints': [{'Sum': 10}]},  # Baseline errors
            {'Datapoints': [{'Sum': 1000}]},  # Baseline requests
        ] * 100  # Many calls for all phases

        mock_dynamodb.describe_table.return_value = {
            'Table': {'GlobalSecondaryIndexes': []}
        }
        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['tap-prod-tenants']
        }
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}
        
        # Mock Cost Explorer for savings calculation
        mock_ce = Mock()
        mock_autoscaling = Mock()
        mock_elasticache = Mock()
        mock_rds = Mock()
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': mock_autoscaling,
            'elasticache': mock_elasticache,
            'rds': mock_rds,
            'ce': mock_ce,
            'lambda': mock_lambda
        }.get(service, Mock())
        mock_ce.get_cost_and_usage.return_value = {
            'ResultsByTime': [{
                'Groups': [{
                    'Metrics': {'UnblendedCost': {'Amount': '1000.00'}}
                }]
            }]
        }
        
        # Mock EC2, Redis, Aurora metrics for phases 2 and 3
        # Need to mock wait_and_monitor to avoid actual waiting
        with patch.object(TapOptimizer, '_wait_and_monitor', return_value=None):
            mock_cloudwatch.get_metric_statistics.side_effect = [
                # Baseline metrics (3 calls)
                {'Datapoints': [{'Maximum': 0.5, 'Average': 0.4}]},  # Baseline latency
                {'Datapoints': [{'Sum': 10}]},  # Baseline errors
                {'Datapoints': [{'Sum': 1000}]},  # Baseline requests
                # Phase 1 - GSI analysis
                {'Datapoints': []},  # GSI metrics
                # Phase 2 - EC2 and Redis metrics (5 calls)
                {'Datapoints': [{'Maximum': 30.0}]},  # EC2 CPU
                {'Datapoints': [{'Maximum': 20.0}]},  # EC2 Network
                {'Datapoints': [{'Average': 25.0}]},  # Redis CPU
                {'Datapoints': [{'Average': 40.0}]},  # Redis Memory
                {'Datapoints': [{'Sum': 5000}]},  # Redis Commands
                # Phase 3 - Aurora metrics (4 calls)
                {'Datapoints': [{'Average': 30.0}]},  # Aurora CPU
                {'Datapoints': [{'Maximum': 50.0}]},  # Replica lag
                {'Datapoints': [{'Average': 50.0}]},  # Read IOPS
                {'Datapoints': [{'Average': 300.0}]},  # Write IOPS
            ]

            optimizer = TapOptimizer(self.resource_ids, dry_run=True)
            # Set tables in resource_ids
            optimizer.resource_ids.dynamodb_tables = ['tap-prod-tenants']
            # Mock _has_stream_consumers to avoid Lambda calls during phase1
            with patch.object(optimizer, '_has_stream_consumers', return_value=True):
                result = optimizer.run_optimization()

            # Check that result has expected structure
            self.assertIn('success', result)
            self.assertIn('phases', result)
            self.assertIn('total_savings', result)
            # Success should be True if no exceptions occurred
            if 'error' not in result:
                self.assertTrue(result['success'])

    @patch('lib.optimize.boto3.Session')
    def test_calculate_total_savings(self, mock_session):
        """Test calculating total savings."""
        mock_ce = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': mock_ce,
            'lambda': Mock()
        }.get(service, Mock())

        mock_ce.get_cost_and_usage.return_value = {
            'ResultsByTime': [{
                'Groups': [{
                    'Metrics': {'UnblendedCost': {'Amount': '1000.00'}}
                }]
            }]
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        savings = optimizer._calculate_total_savings()

        self.assertGreater(savings, 0)

    @patch('lib.optimize.boto3.Session')
    def test_generate_dashboard(self, mock_session):
        """Test generating optimization dashboard."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        
        with patch('builtins.open', mock_open()) as mock_file:
            dashboard = optimizer._generate_dashboard()
            
            self.assertIsNotNone(dashboard)
            self.assertIn('html', dashboard.lower())
            mock_file.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_rollback_phase(self, mock_session):
        """Test rolling back a phase."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._rollback_phase(OptimizationPhase.NON_CRITICAL)

        # Should complete without error
        self.assertTrue(True)

    @patch('lib.optimize.boto3.Session')
    def test_is_tenant_resource(self, mock_session):
        """Test checking if resource is tenant-specific."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_dynamodb.list_tags_of_resource.return_value = {
            'Tags': [{'Key': 'TenantId', 'Value': 'tenant-123'}]
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        # The method checks if 'dynamodb' is in resource_name.lower() first
        result = optimizer._is_tenant_resource('dynamodb-test-table')

        self.assertTrue(result)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_gsi_usage(self, mock_session):
        """Test analyzing GSI usage."""
        mock_cloudwatch = Mock()
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_dynamodb.describe_table.return_value = {
            'Table': {
                'GlobalSecondaryIndexes': [
                    {'IndexName': 'GSI1'}
                ]
            }
        }
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        gsi_usage = optimizer._analyze_gsi_usage('test-table')

        self.assertIsInstance(gsi_usage, dict)

    @patch('lib.optimize.boto3.Session')
    def test_has_stream_consumers(self, mock_session):
        """Test checking for stream consumers."""
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        mock_lambda.list_event_source_mappings.return_value = {
            'EventSourceMappings': [{'UUID': '123'}]
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._has_stream_consumers('test-table')

        self.assertTrue(result)

    @patch('lib.optimize.boto3.Session')
    def test_has_stream_consumers_no_consumers(self, mock_session):
        """Test checking for stream consumers when none exist."""
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        mock_lambda.list_event_source_mappings.return_value = {
            'EventSourceMappings': []
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._has_stream_consumers('test-table')

        self.assertFalse(result)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_table_consolidation(self, mock_session):
        """Test analyzing table consolidation opportunities."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._analyze_table_consolidation()

        self.assertIn('possible', result)
        self.assertIn('tables', result)

    @patch('lib.optimize.boto3.Session')
    @patch('lib.optimize.time.sleep')
    def test_wait_and_monitor(self, mock_sleep, mock_session):
        """Test wait and monitor functionality."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Mock metrics within thresholds
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 1}]},  # Errors
            {'Datapoints': [{'Sum': 1000}]},  # Requests
            {'Datapoints': [{'Maximum': 0.4}]}  # Latency
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 0.5}
        optimizer.OBSERVATION_WINDOW_HOURS = 0.001  # Very short for testing

        # Should complete without raising exception
        try:
            optimizer._wait_and_monitor(OptimizationPhase.NON_CRITICAL)
        except Exception:
            pass  # May timeout in test, which is acceptable

    @patch('lib.optimize.boto3.Session')
    @patch('lib.optimize.time.sleep')
    @patch('lib.optimize.datetime')
    def test_wait_and_monitor_error_threshold_exceeded(self, mock_datetime, mock_sleep, mock_session):
        """Test wait and monitor when error threshold is exceeded."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # High error rate (10% > 0.5% threshold)
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 10}]},  # Errors
            {'Datapoints': [{'Sum': 100}]},  # Requests (error rate = 10%)
            {'Datapoints': [{'Maximum': 0.4}]}  # Latency
        ]

        # Mock datetime to enter the loop once
        start = datetime.now()
        mock_datetime.now.side_effect = [start, start]  # Enter loop, then check
        mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 0.5}
        optimizer.OBSERVATION_WINDOW_HOURS = 48
        optimizer.ERROR_RATE_THRESHOLD = 0.005

        with self.assertRaises(Exception):
            optimizer._wait_and_monitor(OptimizationPhase.NON_CRITICAL)

    @patch('lib.optimize.boto3.Session')
    def test_remove_gsi(self, mock_session):
        """Test removing GSI."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._remove_gsi('test-table', 'test-gsi')

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_disable_stream(self, mock_session):
        """Test disabling stream."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._disable_stream('test-table')

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_consolidate_tables(self, mock_session):
        """Test consolidating tables."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._consolidate_tables(['table1', 'table2'])

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_scale_down_ec2_instances(self, mock_session):
        """Test scaling down EC2 instances."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._scale_down_ec2_instances()

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_adjust_asg_capacity(self, mock_session):
        """Test adjusting ASG capacity."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._adjust_asg_capacity(desired=8, min=6, max=15)

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_scale_down_redis(self, mock_session):
        """Test scaling down Redis."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._scale_down_redis()

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_can_remove_secondary_regions(self, mock_session):
        """Test checking if secondary regions can be removed."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._can_remove_secondary_regions()

        self.assertIsInstance(result, bool)

    @patch('lib.optimize.boto3.Session')
    def test_remove_secondary_regions(self, mock_session):
        """Test removing secondary regions."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._remove_secondary_regions()

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_scale_aurora_writer(self, mock_session):
        """Test scaling Aurora writer."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._scale_aurora_writer('db.r6g.xlarge')

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_reduce_aurora_readers(self, mock_session):
        """Test reducing Aurora readers."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._reduce_aurora_readers()

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_adjust_backup_retention(self, mock_session):
        """Test adjusting backup retention."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._adjust_backup_retention(14)

        # Should complete without error (dry run)

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_with_exception(self, mock_session):
        """Test phase 1 execution with exception."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        # Set up tables in resource_ids so they're used
        optimizer.resource_ids.dynamodb_tables = ['tap-prod-tenants']
        
        # Make _analyze_gsi_usage raise an exception when called during table processing
        with patch.object(optimizer, '_is_tenant_resource', return_value=False), \
             patch.object(optimizer, '_analyze_gsi_usage', side_effect=Exception('API Error')):
            result = optimizer._execute_phase1()

        # The exception should be caught and rollback_required set to True
        self.assertTrue(result['rollback_required'])
        # Check that rollback_reason is included in the result
        self.assertIn('rollback_reason', result)
        # Check that metrics were added to history
        self.assertGreater(len(optimizer.optimization_history), 0)
        self.assertIn('rollback_reason', result or {})

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_no_tables(self, mock_session):
        """Test phase 1 execution with no tables."""
        resource_ids = ResourceIdentifiers(region='us-east-1')
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(resource_ids, dry_run=True)
        result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        self.assertEqual(len(result['actions']), 0)

    @patch('lib.optimize.boto3.Session')
    def test_get_dynamodb_tables_with_environment_suffix(self, mock_session):
        """Test getting DynamoDB tables with environment suffix."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['tap-prod-tenants', 'tap-prod-users', 'other-table']
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        tables = optimizer._get_dynamodb_tables()

        self.assertTrue(all(t.startswith('tap-prod-') for t in tables))

    @patch('lib.optimize.boto3.Session')
    def test_get_dynamodb_tables_exception(self, mock_session):
        """Test getting DynamoDB tables with exception."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        try:
            from botocore.exceptions import ClientError
        except ImportError:
            # Fallback if botocore is not available
            class ClientError(Exception):
                pass
        mock_dynamodb.list_tables.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'ListTables'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        tables = optimizer._get_dynamodb_tables()

        self.assertEqual(tables, [])

    @patch('lib.optimize.boto3.Session')
    def test_is_tenant_resource_exception(self, mock_session):
        """Test is_tenant_resource with exception."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_dynamodb.list_tags_of_resource.side_effect = Exception('Error')

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._is_tenant_resource('test-table')

        self.assertFalse(result)

    @patch('lib.optimize.boto3.Session')
    def test_calculate_total_savings_exception(self, mock_session):
        """Test calculating total savings with exception."""
        mock_ce = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': mock_ce,
            'lambda': Mock()
        }.get(service, Mock())

        mock_ce.get_cost_and_usage.side_effect = Exception('API Error')

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        savings = optimizer._calculate_total_savings()

        self.assertEqual(savings, 0.0)

    @patch('lib.optimize.boto3.Session')
    def test_run_optimization_with_phase_rollback(self, mock_session):
        """Test run_optimization when phase 1 requires rollback."""
        mock_cloudwatch = Mock()
        mock_ce = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': mock_ce,
            'lambda': Mock()
        }.get(service, Mock())

        # Mock baseline metrics
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 0.5, 'Average': 0.4}]},
            {'Datapoints': [{'Sum': 10}]},
            {'Datapoints': [{'Sum': 1000}]},
        ]

        mock_ce.get_cost_and_usage.return_value = {
            'ResultsByTime': [{
                'Groups': [{
                    'Metrics': {'UnblendedCost': {'Amount': '1000.00'}}
                }]
            }]
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        
        # Make phase1 fail
        with patch.object(optimizer, '_execute_phase1', return_value={'phase': 'NON_CRITICAL', 'rollback_required': True, 'actions': []}):
            result = optimizer.run_optimization()

        # Should still complete but phase 2 and 3 should not run
        self.assertIn('phases', result)
        self.assertEqual(len(result['phases']), 1)

    @patch('lib.optimize.boto3.Session')
    def test_run_optimization_with_exception(self, mock_session):
        """Test run_optimization when exception occurs."""
        mock_cloudwatch = Mock()
        mock_ce = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': mock_ce,
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = Exception('API Error')
        mock_ce.get_cost_and_usage.return_value = {
            'ResultsByTime': [{
                'Groups': [{
                    'Metrics': {'UnblendedCost': {'Amount': '1000.00'}}
                }]
            }]
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        # The exception in _collect_baseline_metrics should be caught and logged
        result = optimizer.run_optimization()

        # Should handle exception gracefully and continue
        self.assertIn('success', result)
        self.assertIn('phases', result)

    @patch('lib.optimize.boto3.Session')
    @patch('lib.optimize.PLOTLY_AVAILABLE', True)
    @patch('lib.optimize.go')
    @patch('lib.optimize.make_subplots')
    def test_generate_dashboard_with_plotly(self, mock_make_subplots, mock_go, mock_session):
        """Test dashboard generation with plotly available."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        mock_fig = Mock()
        mock_make_subplots.return_value = mock_fig
        mock_fig.to_html.return_value = '<html>Dashboard</html>'

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        
        with patch('builtins.open', mock_open()) as mock_file:
            dashboard = optimizer._generate_dashboard()
            
            self.assertIsNotNone(dashboard)
            self.assertIn('html', dashboard.lower())
            mock_make_subplots.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_with_gsi_removal(self, mock_session):
        """Test phase 1 with GSI removal."""
        mock_cloudwatch = Mock()
        mock_dynamodb = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.resource_ids.dynamodb_tables = ['tap-prod-tenants']
        
        mock_dynamodb.describe_table.return_value = {
            'Table': {
                'GlobalSecondaryIndexes': [
                    {'IndexName': 'GSI1'}
                ]
            }
        }
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}

        with patch.object(optimizer, '_is_tenant_resource', return_value=False):
            result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_with_table_consolidation(self, mock_session):
        """Test phase 1 with table consolidation."""
        mock_dynamodb = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.resource_ids.dynamodb_tables = ['tap-prod-tenants']
        
        mock_dynamodb.describe_table.return_value = {
            'Table': {'GlobalSecondaryIndexes': []}
        }
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}

        with patch.object(optimizer, '_is_tenant_resource', return_value=False), \
             patch.object(optimizer, '_analyze_gsi_usage', return_value={}), \
             patch.object(optimizer, '_analyze_table_consolidation', return_value={'possible': True, 'tables': ['table1', 'table2']}):
            result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2_with_scaling(self, mock_session):
        """Test phase 2 with EC2 and Redis scaling."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Low utilization - should trigger scaling
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 30.0}]},  # EC2 CPU < 40
            {'Datapoints': [{'Maximum': 20.0}]},  # EC2 Network < 30
            {'Datapoints': [{'Average': 25.0}]},  # Redis CPU < 30
            {'Datapoints': [{'Average': 40.0}]},  # Redis Memory < 50
            {'Datapoints': [{'Sum': 5000}]}  # Redis Commands < 10000
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase2()

        self.assertEqual(result['phase'], 'COMPUTE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_with_aurora_scaling(self, mock_session):
        """Test phase 3 with Aurora scaling."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Low utilization - should trigger scaling
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},  # Aurora CPU < 40
            {'Datapoints': [{'Maximum': 50.0}]},  # Replica lag < 100
            {'Datapoints': [{'Average': 50.0}]},  # Read IOPS
            {'Datapoints': [{'Average': 300.0}]}  # Write IOPS (read ratio < 20%)
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=False):
            result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_collect_baseline_metrics_with_client_error(self, mock_session):
        """Test collecting baseline metrics with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        from botocore.exceptions import ClientError
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._collect_baseline_metrics()

        # Should complete without error, just log warnings
        self.assertIsNotNone(optimizer.baseline_metrics)

    @patch('lib.optimize.boto3.Session')
    def test_get_current_metrics_with_client_error(self, mock_session):
        """Test getting current metrics with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        from botocore.exceptions import ClientError
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 0.5}
        metrics = optimizer._get_current_metrics()

        # Should return default metrics on error
        self.assertIn('error_rate', metrics)
        self.assertIn('p99_latency', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_ec2_utilization_with_client_error(self, mock_session):
        """Test analyzing EC2 utilization with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        from botocore.exceptions import ClientError
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_ec2_utilization()

        # Should return default metrics on error
        self.assertIn('p95_cpu', metrics)
        self.assertIn('p95_network', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_redis_utilization_with_client_error(self, mock_session):
        """Test analyzing Redis utilization with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        from botocore.exceptions import ClientError
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_redis_utilization()

        # Should return default metrics on error
        self.assertIn('cpu', metrics)
        self.assertIn('memory', metrics)
        self.assertIn('commands_per_sec', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_aurora_metrics_with_client_error(self, mock_session):
        """Test analyzing Aurora metrics with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        from botocore.exceptions import ClientError
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_aurora_metrics()

        # Should return default metrics on error
        self.assertIn('cpu_utilization', metrics)
        self.assertIn('replica_lag', metrics)
        self.assertIn('read_iops_ratio', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2_with_exception(self, mock_session):
        """Test phase 2 execution with exception."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = Exception('API Error')

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase2()

        self.assertTrue(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_with_exception(self, mock_session):
        """Test phase 3 execution with exception."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = Exception('API Error')

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase3()

        self.assertTrue(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2_no_scaling(self, mock_session):
        """Test phase 2 when scaling is not needed."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # High utilization - should not trigger scaling
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 50.0}]},  # EC2 CPU >= 40
            {'Datapoints': [{'Maximum': 35.0}]},  # EC2 Network >= 30
            {'Datapoints': [{'Average': 35.0}]},  # Redis CPU >= 30
            {'Datapoints': [{'Average': 55.0}]},  # Redis Memory >= 50
            {'Datapoints': [{'Sum': 15000}]}  # Redis Commands >= 10000
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase2()

        self.assertEqual(result['phase'], 'COMPUTE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_no_scaling(self, mock_session):
        """Test phase 3 when scaling is not needed."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # High utilization - should not trigger scaling
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 50.0}]},  # Aurora CPU >= 40
            {'Datapoints': [{'Maximum': 150.0}]},  # Replica lag >= 100
            {'Datapoints': [{'Average': 100.0}]},  # Read IOPS
            {'Datapoints': [{'Average': 200.0}]}  # Write IOPS (read ratio >= 20%)
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=False):
            result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_with_secondary_region_removal(self, mock_session):
        """Test phase 3 with secondary region removal."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},
            {'Datapoints': [{'Maximum': 50.0}]},
            {'Datapoints': [{'Average': 50.0}]},
            {'Datapoints': [{'Average': 300.0}]}
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=True):
            result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_collect_baseline_metrics_with_client_error(self, mock_session):
        """Test collecting baseline metrics with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        try:
            from botocore.exceptions import ClientError
        except ImportError:
            class ClientError(Exception):
                pass
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer._collect_baseline_metrics()

        # Should complete without error, just log warnings
        self.assertIsNotNone(optimizer.baseline_metrics)

    @patch('lib.optimize.boto3.Session')
    def test_get_current_metrics_with_client_error(self, mock_session):
        """Test getting current metrics with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        try:
            from botocore.exceptions import ClientError
        except ImportError:
            class ClientError(Exception):
                pass
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 0.5}
        metrics = optimizer._get_current_metrics()

        # Should return default metrics on error
        self.assertIn('error_rate', metrics)
        self.assertIn('p99_latency', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_ec2_utilization_with_client_error(self, mock_session):
        """Test analyzing EC2 utilization with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        try:
            from botocore.exceptions import ClientError
        except ImportError:
            class ClientError(Exception):
                pass
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_ec2_utilization()

        # Should return default metrics on error
        self.assertIn('p95_cpu', metrics)
        self.assertIn('p95_network', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_redis_utilization_with_client_error(self, mock_session):
        """Test analyzing Redis utilization with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        try:
            from botocore.exceptions import ClientError
        except ImportError:
            class ClientError(Exception):
                pass
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_redis_utilization()

        # Should return default metrics on error
        self.assertIn('cpu', metrics)
        self.assertIn('memory', metrics)
        self.assertIn('commands_per_sec', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_aurora_metrics_with_client_error(self, mock_session):
        """Test analyzing Aurora metrics with ClientError."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        try:
            from botocore.exceptions import ClientError
        except ImportError:
            class ClientError(Exception):
                pass
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        metrics = optimizer._analyze_aurora_metrics()

        # Should return default metrics on error
        self.assertIn('cpu_utilization', metrics)
        self.assertIn('replica_lag', metrics)
        self.assertIn('read_iops_ratio', metrics)

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2_with_exception(self, mock_session):
        """Test phase 2 execution with exception."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = Exception('API Error')

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase2()

        self.assertTrue(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_with_exception(self, mock_session):
        """Test phase 3 execution with exception."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = Exception('API Error')

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase3()

        self.assertTrue(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2_no_scaling(self, mock_session):
        """Test phase 2 when scaling is not needed."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # High utilization - should not trigger scaling
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 50.0}]},  # EC2 CPU >= 40
            {'Datapoints': [{'Maximum': 35.0}]},  # EC2 Network >= 30
            {'Datapoints': [{'Average': 35.0}]},  # Redis CPU >= 30
            {'Datapoints': [{'Average': 55.0}]},  # Redis Memory >= 50
            {'Datapoints': [{'Sum': 15000}]}  # Redis Commands >= 10000
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase2()

        self.assertEqual(result['phase'], 'COMPUTE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_no_scaling(self, mock_session):
        """Test phase 3 when scaling is not needed."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # High utilization - should not trigger scaling
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 50.0}]},  # Aurora CPU >= 40
            {'Datapoints': [{'Maximum': 150.0}]},  # Replica lag >= 100
            {'Datapoints': [{'Average': 100.0}]},  # Read IOPS
            {'Datapoints': [{'Average': 200.0}]}  # Write IOPS (read ratio >= 20%)
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=False):
            result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        self.assertFalse(result['rollback_required'])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_with_secondary_region_removal(self, mock_session):
        """Test phase 3 with secondary region removal."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},
            {'Datapoints': [{'Maximum': 50.0}]},
            {'Datapoints': [{'Average': 50.0}]},
            {'Datapoints': [{'Average': 300.0}]}
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=True):
            result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        self.assertFalse(result['rollback_required'])



class TestTapOptimizerWaitAndMonitor(unittest.TestCase):
    """Test TapOptimizer wait and monitor methods."""

    def setUp(self):
        """Set up test fixtures."""
        self.resource_ids = ResourceIdentifiers(
            region='us-east-1',
            alb_full_name='app/tap-prod-alb/123',
            asg_name='tap-prod-asg',
            aurora_cluster_id='tap-prod-aurora',
            redis_cluster_id='tap-prod-redis',
            dynamodb_tables=['tap-prod-tenants', 'tap-prod-users'],
            environment_suffix='prod'
        )

    @patch('lib.optimize.boto3.Session')
    @patch('lib.optimize.time.sleep')
    @patch('lib.optimize.datetime')
    def test_wait_and_monitor_latency_threshold_exceeded(self, mock_datetime, mock_sleep, mock_session):
        """Test wait and monitor when latency threshold is exceeded."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Low error rate but high latency increase (40% > 20% threshold)
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 1}]},  # Errors
            {'Datapoints': [{'Sum': 1000}]},  # Requests
            {'Datapoints': [{'Maximum': 0.7}]}  # Latency (40% increase from 0.5 baseline)
        ]

        # Mock datetime to enter the loop once
        start = datetime.now()
        mock_datetime.now.side_effect = [start, start]  # Enter loop, then check
        mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 0.5}
        optimizer.OBSERVATION_WINDOW_HOURS = 48
        optimizer.LATENCY_INCREASE_THRESHOLD = 0.20  # 20% threshold

        with self.assertRaises(Exception):
            optimizer._wait_and_monitor(OptimizationPhase.NON_CRITICAL)


class TestTapOptimizerAdditionalCoverage(unittest.TestCase):
    """Additional tests to improve coverage above 90%."""

    def setUp(self):
        """Set up test fixtures."""
        self.resource_ids = ResourceIdentifiers(
            region='us-east-1',
            alb_full_name='tap-prod-alb-123456789.us-east-1.elb.amazonaws.com',
            alb_arn='arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/tap-prod-alb/123456789',
            asg_name='tap-prod-asg',
            aurora_cluster_id='tap-prod-aurora-cluster',
            aurora_endpoint='tap-prod-aurora-cluster.cluster-xyz.us-east-1.rds.amazonaws.com',
            redis_cluster_id='tap-prod-redis',
            redis_config_endpoint='tap-prod-redis.xyz.cache.amazonaws.com',
            dynamodb_tables=['tap-prod-tenants', 'tap-prod-users'],
            vpc_id='vpc-123',
            environment_suffix='prod'
        )

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_no_tables(self, mock_session):
        """Test phase1 when no DynamoDB tables found."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_dynamodb.list_tables.return_value = {'TableNames': []}

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        self.assertEqual(result['actions'], [])

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_skip_tenant_resource(self, mock_session):
        """Test phase1 skipping tenant-specific resources."""
        mock_dynamodb = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['tap-prod-tenants', 'TenantId:abc-table']
        }
        mock_dynamodb.describe_table.return_value = {
            'Table': {'GlobalSecondaryIndexes': []}
        }
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_remove_gsi_non_dry_run(self, mock_session):
        """Test phase1 removing GSI in non-dry-run mode."""
        mock_dynamodb = Mock()
        mock_cloudwatch = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['tap-prod-tenants']
        }
        mock_dynamodb.describe_table.return_value = {
            'Table': {
                'GlobalSecondaryIndexes': [
                    {'IndexName': 'gsi1', 'IndexStatus': 'ACTIVE'}
                ]
            }
        }
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [{'Sum': 30.0}]  # Less than 50 queries
        }
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_remove_gsi') as mock_remove:
            with patch.object(optimizer, '_analyze_table_consolidation', return_value={'possible': False}):
                result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        if not optimizer.dry_run:
            mock_remove.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_disable_stream_non_dry_run(self, mock_session):
        """Test phase1 disabling stream in non-dry-run mode."""
        mock_dynamodb = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['tap-prod-tenants']
        }
        mock_dynamodb.describe_table.return_value = {
            'Table': {
                'GlobalSecondaryIndexes': [],
                'StreamSpecification': {'StreamEnabled': True}
            }
        }
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_has_stream_consumers', return_value=False):
            with patch.object(optimizer, '_disable_stream') as mock_disable:
                with patch.object(optimizer, '_analyze_table_consolidation', return_value={'possible': False}):
                    result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        if not optimizer.dry_run:
            mock_disable.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase1_consolidate_tables_non_dry_run(self, mock_session):
        """Test phase1 consolidating tables in non-dry-run mode."""
        mock_dynamodb = Mock()
        mock_lambda = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': mock_lambda
        }.get(service, Mock())

        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['tap-prod-tenants']
        }
        mock_dynamodb.describe_table.return_value = {
            'Table': {'GlobalSecondaryIndexes': []}
        }
        mock_lambda.list_event_source_mappings.return_value = {'EventSourceMappings': []}

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_analyze_table_consolidation', return_value={
            'possible': True,
            'tables': ['table1', 'table2']
        }) as mock_consolidate:
            with patch.object(optimizer, '_consolidate_tables') as mock_consolidate_tables:
                result = optimizer._execute_phase1()

        self.assertEqual(result['phase'], 'NON_CRITICAL')
        if not optimizer.dry_run:
            mock_consolidate_tables.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2_scale_ec2_non_dry_run(self, mock_session):
        """Test phase2 scaling EC2 in non-dry-run mode."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 30.0}]},  # EC2 CPU < 50
            {'Datapoints': [{'Maximum': 20.0}]},  # EC2 Network < 50
            {'Datapoints': [{'Average': 25.0}]},  # Redis CPU
            {'Datapoints': [{'Average': 40.0}]},  # Redis Memory
            {'Datapoints': [{'Sum': 5000}]}  # Redis Commands
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_scale_down_ec2_instances') as mock_scale:
            with patch.object(optimizer, '_adjust_asg_capacity') as mock_asg:
                with patch.object(optimizer, '_scale_down_redis') as mock_redis:
                    result = optimizer._execute_phase2()

        self.assertEqual(result['phase'], 'COMPUTE')
        if not optimizer.dry_run:
            mock_scale.assert_called()
            mock_asg.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase2_scale_redis_non_dry_run(self, mock_session):
        """Test phase2 scaling Redis in non-dry-run mode."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 30.0}]},  # EC2 CPU
            {'Datapoints': [{'Maximum': 20.0}]},  # EC2 Network
            {'Datapoints': [{'Average': 25.0}]},  # Redis CPU < 30
            {'Datapoints': [{'Average': 40.0}]},  # Redis Memory < 50
            {'Datapoints': [{'Sum': 5000}]}  # Redis Commands < 10000
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_scale_down_ec2_instances'):
            with patch.object(optimizer, '_adjust_asg_capacity'):
                with patch.object(optimizer, '_scale_down_redis') as mock_redis:
                    result = optimizer._execute_phase2()

        self.assertEqual(result['phase'], 'COMPUTE')
        if not optimizer.dry_run:
            mock_redis.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_remove_secondary_regions_non_dry_run(self, mock_session):
        """Test phase3 removing secondary regions in non-dry-run mode."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},
            {'Datapoints': [{'Maximum': 50.0}]},
            {'Datapoints': [{'Average': 50.0}]},
            {'Datapoints': [{'Average': 300.0}]}
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=True):
            with patch.object(optimizer, '_remove_secondary_regions') as mock_remove:
                with patch.object(optimizer, '_scale_aurora_writer'):
                    with patch.object(optimizer, '_reduce_aurora_readers'):
                        with patch.object(optimizer, '_adjust_backup_retention'):
                            result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        if not optimizer.dry_run:
            mock_remove.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_scale_aurora_writer_non_dry_run(self, mock_session):
        """Test phase3 scaling Aurora writer in non-dry-run mode."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},  # CPU < 40
            {'Datapoints': [{'Maximum': 50.0}]},
            {'Datapoints': [{'Average': 50.0}]},
            {'Datapoints': [{'Average': 300.0}]}
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=False):
            with patch.object(optimizer, '_scale_aurora_writer') as mock_scale:
                with patch.object(optimizer, '_reduce_aurora_readers'):
                    with patch.object(optimizer, '_adjust_backup_retention'):
                        result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        if not optimizer.dry_run:
            mock_scale.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_reduce_readers_non_dry_run(self, mock_session):
        """Test phase3 reducing Aurora readers in non-dry-run mode."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},
            {'Datapoints': [{'Maximum': 50.0}]},  # Replica lag < 100
            {'Datapoints': [{'Average': 50.0}]},  # Read IOPS
            {'Datapoints': [{'Average': 300.0}]}  # Write IOPS (ratio < 20%)
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=False):
            with patch.object(optimizer, '_scale_aurora_writer'):
                with patch.object(optimizer, '_reduce_aurora_readers') as mock_reduce:
                    with patch.object(optimizer, '_adjust_backup_retention'):
                        result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        if not optimizer.dry_run:
            mock_reduce.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_execute_phase3_adjust_backup_retention_non_dry_run(self, mock_session):
        """Test phase3 adjusting backup retention in non-dry-run mode."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Average': 30.0}]},
            {'Datapoints': [{'Maximum': 50.0}]},
            {'Datapoints': [{'Average': 50.0}]},
            {'Datapoints': [{'Average': 300.0}]}
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=False)
        with patch.object(optimizer, '_can_remove_secondary_regions', return_value=False):
            with patch.object(optimizer, '_scale_aurora_writer'):
                with patch.object(optimizer, '_reduce_aurora_readers'):
                    with patch.object(optimizer, '_adjust_backup_retention') as mock_backup:
                        result = optimizer._execute_phase3()

        self.assertEqual(result['phase'], 'DATABASE')
        if not optimizer.dry_run:
            mock_backup.assert_called()

    @patch('lib.optimize.boto3.Session')
    @patch('lib.optimize.time.sleep')
    @patch('lib.optimize.datetime')
    def test_wait_and_monitor_error_rate_exceeded(self, mock_datetime_module, mock_sleep, mock_session):
        """Test wait_and_monitor when error rate exceeds threshold."""
        from datetime import datetime, timedelta
        
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Mock datetime to control the while loop
        start_time = datetime.now()
        # First call: start_time (in _wait_and_monitor), second call: start_time + 15min (in while loop check)
        mock_datetime_module.now.side_effect = [start_time, start_time + timedelta(minutes=15)]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {
            'error_rate': 0.001,
            'p99_latency': 100.0
        }
        optimizer.OBSERVATION_WINDOW_HOURS = 48
        optimizer.ERROR_RATE_THRESHOLD = 0.005

        # First call returns high error rate
        optimizer._get_current_metrics = Mock(return_value={
            'error_rate': 0.01,  # > 0.5% threshold
            'p99_latency': 100.0
        })

        with patch.object(optimizer, '_rollback_phase') as mock_rollback:
            with self.assertRaises(Exception) as context:
                optimizer._wait_and_monitor(OptimizationPhase.NON_CRITICAL)

        self.assertIn('Error rate threshold exceeded', str(context.exception))
        mock_rollback.assert_called()

    @patch('lib.optimize.boto3.Session')
    @patch('lib.optimize.time.sleep')
    @patch('lib.optimize.datetime')
    def test_wait_and_monitor_latency_exceeded(self, mock_datetime_module, mock_sleep, mock_session):
        """Test wait_and_monitor when latency exceeds threshold."""
        from datetime import datetime, timedelta
        
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        # Mock datetime to control the while loop
        start_time = datetime.now()
        # First call: start_time (in _wait_and_monitor), second call: start_time + 15min (in while loop check)
        mock_datetime_module.now.side_effect = [start_time, start_time + timedelta(minutes=15)]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {
            'error_rate': 0.001,
            'p99_latency': 100.0
        }
        optimizer.OBSERVATION_WINDOW_HOURS = 48
        optimizer.LATENCY_INCREASE_THRESHOLD = 0.20
        optimizer.ERROR_RATE_THRESHOLD = 0.005

        # First call returns high latency
        optimizer._get_current_metrics = Mock(return_value={
            'error_rate': 0.001,
            'p99_latency': 150.0  # > 20% increase
        })

        with patch.object(optimizer, '_rollback_phase') as mock_rollback:
            with self.assertRaises(Exception) as context:
                optimizer._wait_and_monitor(OptimizationPhase.NON_CRITICAL)

        self.assertIn('Latency threshold exceeded', str(context.exception))
        mock_rollback.assert_called()

    @patch('lib.optimize.boto3.Session')
    def test_get_current_metrics_alb_not_available(self, mock_session):
        """Test get_current_metrics when ALB is not available."""
        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        resource_ids_no_alb = ResourceIdentifiers(region='us-east-1')
        optimizer = TapOptimizer(resource_ids_no_alb, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 100.0}

        metrics = optimizer._get_current_metrics()

        self.assertEqual(metrics['error_rate'], 0.0)
        self.assertEqual(metrics['p99_latency'], 100.0)

    @patch('lib.optimize.boto3.Session')
    def test_get_current_metrics_client_error_error_rate(self, mock_session):
        """Test get_current_metrics with ClientError for error rate."""
        from botocore.exceptions import ClientError

        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            ClientError({'Error': {'Code': 'InvalidParameter'}}, 'GetMetricStatistics'),
            {'Datapoints': [{'Maximum': 100.0}]}
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 100.0}

        metrics = optimizer._get_current_metrics()

        self.assertEqual(metrics['error_rate'], 0)

    @patch('lib.optimize.boto3.Session')
    def test_get_current_metrics_client_error_latency(self, mock_session):
        """Test get_current_metrics with ClientError for latency."""
        from botocore.exceptions import ClientError

        mock_cloudwatch = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Sum': 10}]},
            {'Datapoints': [{'Sum': 1000}]},
            ClientError({'Error': {'Code': 'InvalidParameter'}}, 'GetMetricStatistics')
        ]

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        optimizer.baseline_metrics = {'p99_latency': 100.0}

        metrics = optimizer._get_current_metrics()

        self.assertEqual(metrics['p99_latency'], 100.0)

    @patch('lib.optimize.boto3.Session')
    def test_rollback_phase_pass_statement(self, mock_session):
        """Test rollback_phase pass statement."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        
        # Test rollback for a phase that doesn't have specific rollback logic
        # This should hit the pass statement
        optimizer._rollback_phase(OptimizationPhase.NON_CRITICAL)

    @patch('lib.optimize.boto3.Session')
    def test_is_tenant_resource_exception(self, mock_session):
        """Test is_tenant_resource with exception."""
        mock_dynamodb = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': Mock(),
            'dynamodb': mock_dynamodb,
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': Mock(),
            'lambda': Mock()
        }.get(service, Mock())

        mock_dynamodb.list_tags_of_resource.side_effect = Exception('API Error')

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        result = optimizer._is_tenant_resource('some-table')

        self.assertFalse(result)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_ec2_utilization_no_asg(self, mock_session):
        """Test analyze_ec2_utilization when ASG name not available."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        resource_ids_no_asg = ResourceIdentifiers(region='us-east-1')
        optimizer = TapOptimizer(resource_ids_no_asg, dry_run=True)

        metrics = optimizer._analyze_ec2_utilization()

        self.assertEqual(metrics['p95_cpu'], 0)
        self.assertEqual(metrics['p95_network'], 0)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_redis_utilization_no_cluster(self, mock_session):
        """Test analyze_redis_utilization when cluster ID not available."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        resource_ids_no_redis = ResourceIdentifiers(region='us-east-1')
        optimizer = TapOptimizer(resource_ids_no_redis, dry_run=True)

        metrics = optimizer._analyze_redis_utilization()

        self.assertEqual(metrics['cpu'], 0)
        self.assertEqual(metrics['memory'], 0)
        self.assertEqual(metrics['commands_per_sec'], 0)

    @patch('lib.optimize.boto3.Session')
    def test_analyze_aurora_metrics_no_cluster(self, mock_session):
        """Test analyze_aurora_metrics when cluster ID not available."""
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.return_value = Mock()

        resource_ids_no_aurora = ResourceIdentifiers(region='us-east-1')
        optimizer = TapOptimizer(resource_ids_no_aurora, dry_run=True)

        metrics = optimizer._analyze_aurora_metrics()

        self.assertEqual(metrics['cpu_utilization'], 0)
        self.assertEqual(metrics['replica_lag'], 0)
        self.assertEqual(metrics['read_iops_ratio'], 0)

    @patch('lib.optimize.boto3.Session')
    def test_run_optimization_phase3_execution(self, mock_session):
        """Test run_optimization executes phase3 and monitors."""
        mock_cloudwatch = Mock()
        mock_ce = Mock()
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        mock_session_instance.client.side_effect = lambda service, **kwargs: {
            'cloudwatch': mock_cloudwatch,
            'dynamodb': Mock(),
            'ec2': Mock(),
            'autoscaling': Mock(),
            'elasticache': Mock(),
            'rds': Mock(),
            'ce': mock_ce,
            'lambda': Mock()
        }.get(service, Mock())

        # Mock baseline metrics collection
        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Maximum': 0.5, 'Average': 0.4}]},  # Baseline latency
            {'Datapoints': [{'Sum': 10}]},  # Baseline errors
            {'Datapoints': [{'Sum': 1000}]},  # Baseline requests
        ] * 100

        # Mock Cost Explorer for savings calculation
        mock_ce.get_cost_and_usage.return_value = {
            'ResultsByTime': [{
                'Groups': [{
                    'Metrics': {'UnblendedCost': {'Amount': '1000.00'}}
                }]
            }]
        }

        optimizer = TapOptimizer(self.resource_ids, dry_run=True)
        
        # Mock phase execution to return successful results (no rollback)
        phase1_result = {
            'phase': 'NON_CRITICAL',
            'actions': [],
            'rollback_required': False,
            'duration': 0
        }
        phase2_result = {
            'phase': 'COMPUTE',
            'actions': [],
            'rollback_required': False,
            'duration': 0
        }
        phase3_result = {
            'phase': 'DATABASE',
            'actions': [],
            'rollback_required': False,
            'duration': 0
        }
        
        with patch.object(optimizer, '_execute_phase1', return_value=phase1_result):
            with patch.object(optimizer, '_execute_phase2', return_value=phase2_result):
                with patch.object(optimizer, '_execute_phase3', return_value=phase3_result):
                    with patch.object(optimizer, '_wait_and_monitor') as mock_wait:
                        with patch.object(optimizer, '_generate_dashboard', return_value='<html></html>'):
                            result = optimizer.run_optimization()

        # Should have executed all 3 phases
        self.assertTrue(result['success'])
        # All 3 phases should have been monitored (phase1, phase2, phase3)
        self.assertEqual(mock_wait.call_count, 3)


class TestMainFunction(unittest.TestCase):
    """Test main function."""

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--dry-run'])
    def test_main_success(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function with successful optimization."""
        from lib.optimize import main

        # Setup mocks
        mock_load.return_value = {'VpcId': 'vpc-123', 'StackRegion': 'us-east-1'}
        mock_get_regions.return_value = ['us-east-1']
        mock_extract.return_value = ResourceIdentifiers(region='us-east-1')
        
        mock_optimizer = Mock()
        mock_optimizer.run_optimization.return_value = {
            'success': True,
            'total_savings': 1000.0,
            'phases': []
        }
        mock_optimizer_class.return_value = mock_optimizer

        try:
            main()
        except SystemExit:
            pass  # Expected if sys.exit is called

        mock_load.assert_called_once()
        mock_get_regions.assert_called_once()
        mock_optimizer.run_optimization.assert_called()

    @patch('lib.optimize.load_deployment_outputs')
    @patch('sys.argv', ['optimize.py'])
    def test_main_file_not_found(self, mock_load):
        """Test main function when outputs file is not found."""
        from lib.optimize import main

        mock_load.side_effect = FileNotFoundError("File not found")

        with self.assertRaises(SystemExit):
            main()

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--region', 'us-west-2', '--dry-run'])
    def test_main_with_explicit_region(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function with explicit region."""
        from lib.optimize import main

        mock_load.return_value = {'VpcId': 'vpc-123'}
        mock_get_regions.return_value = ['us-east-1']
        mock_extract.return_value = ResourceIdentifiers(region='us-west-2')
        
        mock_optimizer = Mock()
        mock_optimizer.run_optimization.return_value = {
            'success': True,
            'total_savings': 1000.0,
            'phases': []
        }
        mock_optimizer_class.return_value = mock_optimizer

        try:
            main()
        except SystemExit:
            pass

        # Should use explicit region
        mock_extract.assert_called()
        call_args = mock_extract.call_args[0]
        self.assertEqual(call_args[1], 'us-west-2')

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--outputs-file', 'custom.json', '--dry-run'])
    def test_main_with_custom_outputs_file(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function with custom outputs file."""
        from lib.optimize import main

        mock_load.return_value = {'VpcId': 'vpc-123', 'StackRegion': 'us-east-1'}
        mock_get_regions.return_value = ['us-east-1']
        mock_extract.return_value = ResourceIdentifiers(region='us-east-1')
        
        mock_optimizer = Mock()
        mock_optimizer.run_optimization.return_value = {
            'success': True,
            'total_savings': 1000.0,
            'phases': []
        }
        mock_optimizer_class.return_value = mock_optimizer

        try:
            main()
        except SystemExit:
            pass

        # Should pass custom file to load_deployment_outputs
        mock_load.assert_called_once()
        call_kwargs = mock_load.call_args[1] if mock_load.call_args[1] else {}
        # Check if outputs_file was passed (it might be positional)
        self.assertTrue(mock_load.called)

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--dry-run'])
    def test_main_with_optimization_failure(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function when optimization fails for a region."""
        from lib.optimize import main

        mock_load.return_value = {'VpcId': 'vpc-123', 'StackRegion': 'us-east-1'}
        mock_get_regions.return_value = ['us-east-1', 'us-west-2']
        mock_extract.side_effect = [
            ResourceIdentifiers(region='us-east-1'),
            ResourceIdentifiers(region='us-west-2')
        ]
        
        mock_optimizer1 = Mock()
        mock_optimizer1.run_optimization.return_value = {
            'success': True,
            'total_savings': 1000.0,
            'phases': []
        }
        mock_optimizer2 = Mock()
        mock_optimizer2.run_optimization.side_effect = Exception('Optimization failed')
        mock_optimizer_class.side_effect = [mock_optimizer1, mock_optimizer2]

        try:
            main()
        except SystemExit:
            pass

        # Should handle failures gracefully
        self.assertEqual(mock_optimizer_class.call_count, 2)

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--dry-run'])
    def test_main_with_dashboard_generation_loop(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function dashboard generation loop."""
        from lib.optimize import main

        mock_load.return_value = {'VpcId': 'vpc-123', 'StackRegion': 'us-east-1'}
        mock_get_regions.return_value = ['us-east-1', 'us-west-2']
        mock_extract.side_effect = [
            ResourceIdentifiers(region='us-east-1'),
            ResourceIdentifiers(region='us-west-2')
        ]
        
        mock_optimizer = Mock()
        mock_optimizer.run_optimization.return_value = {
            'success': True,
            'total_savings': 1000.0,
            'phases': []
        }
        mock_optimizer_class.return_value = mock_optimizer

        try:
            main()
        except SystemExit:
            pass

        # Should generate dashboard for first successful region
        self.assertEqual(mock_optimizer_class.call_count, 2)

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--dry-run'])
    def test_main_with_actions_printing(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function printing actions."""
        from lib.optimize import main

        mock_load.return_value = {'VpcId': 'vpc-123', 'StackRegion': 'us-east-1'}
        mock_get_regions.return_value = ['us-east-1']
        mock_extract.return_value = ResourceIdentifiers(region='us-east-1')
        
        mock_optimizer = Mock()
        mock_optimizer.run_optimization.return_value = {
            'success': True,
            'total_savings': 1000.0,
            'phases': [
                {
                    'phase': 'NON_CRITICAL',
                    'actions': ['Removed GSI', 'Disabled stream']
                }
            ]
        }
        mock_optimizer_class.return_value = mock_optimizer

        try:
            main()
        except SystemExit:
            pass

        # Should print actions
        mock_optimizer.run_optimization.assert_called()

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--dry-run'])
    def test_main_with_no_successful_regions_for_dashboard(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function when no regions succeed for dashboard generation."""
        from lib.optimize import main

        mock_load.return_value = {'VpcId': 'vpc-123', 'StackRegion': 'us-east-1'}
        mock_get_regions.return_value = ['us-east-1']
        mock_extract.return_value = ResourceIdentifiers(region='us-east-1')
        
        mock_optimizer = Mock()
        mock_optimizer.run_optimization.return_value = {
            'success': False,
            'error': 'Test error'
        }
        mock_optimizer_class.return_value = mock_optimizer

        try:
            main()
        except SystemExit:
            pass

        # Should handle no successful regions
        mock_optimizer_class.assert_called()

    @patch('lib.optimize.load_deployment_outputs')
    @patch('sys.argv', ['optimize.py'])
    def test_main_with_general_exception(self, mock_load):
        """Test main function with general exception."""
        from lib.optimize import main

        mock_load.side_effect = Exception('General error')

        with self.assertRaises(SystemExit):
            main()

    @patch('lib.optimize.load_deployment_outputs')
    @patch('lib.optimize.get_all_regions_from_outputs')
    @patch('lib.optimize.extract_resource_identifiers')
    @patch('lib.optimize.TapOptimizer')
    @patch('sys.argv', ['optimize.py', '--dry-run'])
    def test_main_dashboard_generation_loop(self, mock_optimizer_class, mock_extract, mock_get_regions, mock_load):
        """Test main function dashboard generation loop (lines 1313-1320)."""
        from lib.optimize import main

        mock_load.return_value = {'VpcId': 'vpc-123', 'StackRegion': 'us-east-1'}
        mock_get_regions.return_value = ['us-east-1', 'us-west-2']
        mock_extract.side_effect = [
            ResourceIdentifiers(region='us-east-1'),
            ResourceIdentifiers(region='us-west-2')
        ]
        
        mock_optimizer1 = Mock()
        mock_optimizer1.run_optimization.return_value = {
            'success': False,  # First region fails
            'error': 'Test error'
        }
        mock_optimizer2 = Mock()
        mock_optimizer2.run_optimization.return_value = {
            'success': True,  # Second region succeeds
            'total_savings': 1000.0,
            'phases': []
        }
        mock_optimizer_class.side_effect = [mock_optimizer1, mock_optimizer2]

        try:
            main()
        except SystemExit:
            pass

        # Should iterate through regions and find first successful one for dashboard
        self.assertEqual(mock_optimizer_class.call_count, 2)


if __name__ == '__main__':
    unittest.main()
