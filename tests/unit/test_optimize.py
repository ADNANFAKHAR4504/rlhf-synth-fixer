"""
Unit tests for lib/optimize.py
"""

import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, mock_open, patch

from lib.optimize import (CloudWatchMetricsAnalyzer, ConfidenceLevel,
                          EC2Optimizer, ElastiCacheOptimizer,
                          InfrastructureOptimizer, LambdaOptimizer,
                          OptimizationRecommendation, OptimizationReporter,
                          RDSOptimizer)


class TestConfidenceLevel(unittest.TestCase):
    """Test ConfidenceLevel enum."""

    def test_confidence_levels(self):
        """Test that confidence levels have correct values."""
        self.assertEqual(ConfidenceLevel.HIGH.value, 0.95)
        self.assertEqual(ConfidenceLevel.MEDIUM.value, 0.85)
        self.assertEqual(ConfidenceLevel.LOW.value, 0.75)


class TestOptimizationRecommendation(unittest.TestCase):
    """Test OptimizationRecommendation dataclass."""

    def setUp(self):
        """Set up test fixtures."""
        self.recommendation = OptimizationRecommendation(
            resource_id='test-resource',
            resource_type='RDS',
            current_config='db.r6g.2xlarge',
            proposed_config='db.r6g.xlarge',
            p50_utilization=20.0,
            p95_utilization=25.0,
            p99_utilization=30.0,
            current_hourly_cost=0.504,
            proposed_hourly_cost=0.252,
            annual_savings=2190.0,
            confidence_score=0.95,
            recommendation_reason='Low CPU utilization',
            rollback_strategy='Blue-Green deployment',
            implementation_notes='Schedule during maintenance window'
        )

    def test_hourly_savings_calculation(self):
        """Test hourly_savings property calculation."""
        expected = 0.504 - 0.252
        self.assertAlmostEqual(self.recommendation.hourly_savings, expected, places=4)

    def test_savings_percentage_calculation(self):
        """Test savings_percentage property calculation."""
        expected = ((0.504 - 0.252) / 0.504) * 100
        self.assertAlmostEqual(self.recommendation.savings_percentage, expected, places=2)

    def test_savings_percentage_zero_cost(self):
        """Test savings_percentage when current cost is zero."""
        rec = OptimizationRecommendation(
            resource_id='test',
            resource_type='Test',
            current_config='config',
            proposed_config='new_config',
            p50_utilization=0,
            p95_utilization=0,
            p99_utilization=0,
            current_hourly_cost=0,
            proposed_hourly_cost=0,
            annual_savings=0,
            confidence_score=0.95,
            recommendation_reason='test',
            rollback_strategy='test',
            implementation_notes='test'
        )
        self.assertEqual(rec.savings_percentage, 0)


class TestCloudWatchMetricsAnalyzer(unittest.TestCase):
    """Test CloudWatchMetricsAnalyzer base class."""

    def setUp(self):
        """Set up test fixtures."""
        with patch('lib.optimize.boto3.client'):
            self.analyzer = CloudWatchMetricsAnalyzer(region='us-east-1')

    def test_initialization(self):
        """Test CloudWatchMetricsAnalyzer initialization."""
        self.assertEqual(self.analyzer.region, 'us-east-1')
        self.assertEqual(self.analyzer.ri_discount, 0.42)

    @patch('lib.optimize.boto3.client')
    def test_get_metrics_success(self, mock_boto_client):
        """Test successful metrics retrieval."""
        mock_cloudwatch = Mock()
        mock_boto_client.return_value = mock_cloudwatch

        # Mock response with datapoints
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Timestamp': datetime(2025, 1, 1, 0, 0), 'Average': 25.0},
                {'Timestamp': datetime(2025, 1, 1, 1, 0), 'Average': 30.0},
                {'Timestamp': datetime(2025, 1, 1, 2, 0), 'Average': 20.0},
            ]
        }

        analyzer = CloudWatchMetricsAnalyzer(region='us-east-1')
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=1)

        metrics = analyzer.get_metrics(
            namespace='AWS/RDS',
            metric_name='CPUUtilization',
            dimensions=[{'Name': 'DBInstanceIdentifier', 'Value': 'test-db'}],
            start_time=start_time,
            end_time=end_time
        )

        self.assertEqual(len(metrics), 3)
        self.assertEqual(metrics[0], 25.0)

    @patch('lib.optimize.boto3.client')
    def test_get_metrics_empty_response(self, mock_boto_client):
        """Test metrics retrieval with empty response."""
        mock_cloudwatch = Mock()
        mock_boto_client.return_value = mock_cloudwatch
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        analyzer = CloudWatchMetricsAnalyzer(region='us-east-1')
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=1)

        metrics = analyzer.get_metrics(
            namespace='AWS/RDS',
            metric_name='CPUUtilization',
            dimensions=[{'Name': 'DBInstanceIdentifier', 'Value': 'test-db'}],
            start_time=start_time,
            end_time=end_time
        )

        self.assertEqual(metrics, [])

    @patch('lib.optimize.boto3.client')
    def test_get_metrics_exception(self, mock_boto_client):
        """Test metrics retrieval with exception."""
        mock_cloudwatch = Mock()
        mock_boto_client.return_value = mock_cloudwatch
        mock_cloudwatch.get_metric_statistics.side_effect = Exception('API Error')

        analyzer = CloudWatchMetricsAnalyzer(region='us-east-1')
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=1)

        metrics = analyzer.get_metrics(
            namespace='AWS/RDS',
            metric_name='CPUUtilization',
            dimensions=[{'Name': 'DBInstanceIdentifier', 'Value': 'test-db'}],
            start_time=start_time,
            end_time=end_time
        )

        self.assertEqual(metrics, [])

    def test_calculate_percentiles_normal(self):
        """Test percentile calculation with normal dataset."""
        data = [i for i in range(1, 201)]  # 1 to 200
        p50, p95, p99 = self.analyzer.calculate_percentiles(data)

        self.assertEqual(p50, 100.5)  # Median
        self.assertEqual(p95, data[int(200 * 0.95)])  # 95th percentile
        self.assertEqual(p99, data[int(200 * 0.99)])  # 99th percentile

    def test_calculate_percentiles_small_dataset(self):
        """Test percentile calculation with small dataset."""
        data = [10, 20, 30]
        p50, p95, p99 = self.analyzer.calculate_percentiles(data)

        self.assertEqual(p50, 20)  # Median
        self.assertEqual(p95, 30)  # Max for small dataset
        self.assertEqual(p99, 30)  # Max for small dataset

    def test_calculate_percentiles_empty(self):
        """Test percentile calculation with empty dataset."""
        p50, p95, p99 = self.analyzer.calculate_percentiles([])
        self.assertEqual(p50, 0)
        self.assertEqual(p95, 0)
        self.assertEqual(p99, 0)

    def test_calculate_confidence_insufficient_data(self):
        """Test confidence calculation with insufficient data."""
        data = [10, 20, 30]
        confidence = self.analyzer.calculate_confidence(data, 50)
        self.assertEqual(confidence, 0.0)

    def test_calculate_confidence_zero_mean(self):
        """Test confidence calculation with zero mean."""
        data = [0] * 200
        confidence = self.analyzer.calculate_confidence(data, 10)
        self.assertEqual(confidence, 0.0)

    def test_calculate_confidence_high_confidence(self):
        """Test confidence calculation with high confidence."""
        # All values below threshold
        data = [10] * 200
        confidence = self.analyzer.calculate_confidence(data, 50)
        self.assertGreater(confidence, 0.9)

    def test_calculate_confidence_low_confidence(self):
        """Test confidence calculation with low confidence."""
        # High variability
        data = list(range(1, 201))
        confidence = self.analyzer.calculate_confidence(data, 50)
        self.assertLess(confidence, 1.0)

    def test_check_resource_tags(self):
        """Test resource tag checking."""
        result = self.analyzer.check_resource_tags('arn:aws:rds:us-east-1:123456789012:db:test-db')
        self.assertTrue(result)


class TestRDSOptimizer(unittest.TestCase):
    """Test RDSOptimizer class."""

    @patch('lib.optimize.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.optimizer = RDSOptimizer(region='us-east-1')

    def test_get_rds_price(self):
        """Test RDS pricing lookup."""
        self.assertEqual(self.optimizer._get_rds_price('db.r6g.2xlarge'), 0.504)
        self.assertEqual(self.optimizer._get_rds_price('db.r6g.xlarge'), 0.252)
        self.assertEqual(self.optimizer._get_rds_price('db.r6g.large'), 0.126)
        self.assertEqual(self.optimizer._get_rds_price('unknown'), 0)

    @patch('lib.optimize.boto3.client')
    def test_analyze_rds_instances_downsize(self, mock_boto_client):
        """Test RDS instance analysis with downsize recommendation."""
        mock_rds = Mock()
        mock_cloudwatch = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'rds': mock_rds,
            'cloudwatch': mock_cloudwatch,
            'ec2': Mock(),
            'elasticache': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        # Mock RDS describe_db_instances
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db',
                'DBInstanceClass': 'db.r6g.2xlarge',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:test-db',
                'ReadReplicaDBInstanceIdentifiers': []
            }]
        }

        # Mock CloudWatch metrics - low CPU usage
        cpu_metrics = [25.0] * 200  # Low and consistent CPU
        conn_metrics = [50.0] * 200  # Low connections

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in cpu_metrics]},
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in conn_metrics]},
            {'Datapoints': []},  # Storage metrics
        ]

        optimizer = RDSOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_rds_instances(days=45)

        self.assertGreater(len(recommendations), 0)
        rec = recommendations[0]
        self.assertEqual(rec.resource_id, 'test-db')
        self.assertEqual(rec.resource_type, 'RDS')
        self.assertEqual(rec.current_config, 'db.r6g.2xlarge')
        self.assertEqual(rec.proposed_config, 'db.r6g.xlarge')
        self.assertGreater(rec.confidence_score, 0.9)

    @patch('lib.optimize.boto3.client')
    def test_analyze_rds_instances_no_recommendation(self, mock_boto_client):
        """Test RDS instance analysis with no recommendations."""
        mock_rds = Mock()
        mock_cloudwatch = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'rds': mock_rds,
            'cloudwatch': mock_cloudwatch,
            'ec2': Mock(),
            'elasticache': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db',
                'DBInstanceClass': 'db.r6g.2xlarge',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:test-db',
                'ReadReplicaDBInstanceIdentifiers': []
            }]
        }

        # High CPU usage - no downsize recommendation
        cpu_metrics = [80.0] * 200
        conn_metrics = [200.0] * 200

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in cpu_metrics]},
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in conn_metrics]},
            {'Datapoints': []},
        ]

        optimizer = RDSOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_rds_instances(days=45)

        self.assertEqual(len(recommendations), 0)

    @patch('lib.optimize.boto3.client')
    def test_analyze_rds_instances_read_replica_removal(self, mock_boto_client):
        """Test RDS instance analysis with read replica removal recommendation."""
        mock_rds = Mock()
        mock_cloudwatch = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'rds': mock_rds,
            'cloudwatch': mock_cloudwatch,
            'ec2': Mock(),
            'elasticache': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        # Mock RDS with read replica
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db',
                'DBInstanceClass': 'db.r6g.2xlarge',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:test-db',
                'ReadReplicaDBInstanceIdentifiers': ['test-db-replica']
            }]
        }

        # Mock CloudWatch metrics - low usage on both primary and replica
        cpu_metrics = [25.0] * 200
        conn_metrics = [30.0] * 200  # Low connections for replica removal
        storage_metrics = []
        replica_lag = [50.0] * 200  # Low replica lag

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in cpu_metrics]},
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in conn_metrics]},
            {'Datapoints': []},  # Storage metrics
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in replica_lag]},
        ]

        optimizer = RDSOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_rds_instances(days=45)

        # Should have both downsize and replica removal recommendations
        self.assertGreaterEqual(len(recommendations), 1)
        # Check for read replica recommendation
        replica_recs = [r for r in recommendations if r.resource_type == 'RDS-ReadReplica']
        if replica_recs:
            rec = replica_recs[0]
            self.assertEqual(rec.resource_id, 'test-db-replica')
            self.assertEqual(rec.proposed_config, 'Remove')

    @patch('lib.optimize.boto3.client')
    def test_analyze_rds_instances_exception(self, mock_boto_client):
        """Test RDS instance analysis with exception."""
        mock_rds = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'rds': mock_rds,
            'cloudwatch': Mock(),
            'ec2': Mock(),
            'elasticache': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        mock_rds.describe_db_instances.side_effect = Exception('API Error')

        optimizer = RDSOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_rds_instances(days=45)

        self.assertEqual(recommendations, [])


class TestEC2Optimizer(unittest.TestCase):
    """Test EC2Optimizer class."""

    @patch('lib.optimize.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.optimizer = EC2Optimizer(region='us-east-1')

    def test_get_ec2_price(self):
        """Test EC2 pricing lookup."""
        self.assertEqual(self.optimizer._get_ec2_price('c5.4xlarge'), 0.68)
        self.assertEqual(self.optimizer._get_ec2_price('c5.2xlarge'), 0.34)
        self.assertEqual(self.optimizer._get_ec2_price('c5.xlarge'), 0.17)
        self.assertEqual(self.optimizer._get_ec2_price('unknown'), 0)

    @patch('lib.optimize.boto3.client')
    def test_analyze_auto_scaling_groups_downsize(self, mock_boto_client):
        """Test ASG analysis with downsize recommendation."""
        mock_autoscaling = Mock()
        mock_cloudwatch = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'autoscaling': mock_autoscaling,
            'cloudwatch': mock_cloudwatch,
            'rds': Mock(),
            'ec2': Mock(),
            'elasticache': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        # Mock ASG describe
        mock_autoscaling.describe_auto_scaling_groups.return_value = {
            'AutoScalingGroups': [{
                'AutoScalingGroupName': 'test-asg',
                'DesiredCapacity': 10,
                'Instances': [{'InstanceId': f'i-{i}'} for i in range(10)]
            }]
        }

        # Low CPU utilization
        cpu_metrics = [30.0] * 200
        network_metrics = [1000000.0] * 200

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in cpu_metrics]},
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in network_metrics]},
        ]

        optimizer = EC2Optimizer(region='us-east-1')
        recommendations = optimizer.analyze_auto_scaling_groups(days=45)

        self.assertGreater(len(recommendations), 0)
        rec = recommendations[0]
        self.assertEqual(rec.resource_id, 'test-asg')
        self.assertEqual(rec.resource_type, 'EC2-ASG')

    @patch('lib.optimize.boto3.client')
    def test_analyze_auto_scaling_groups_exception(self, mock_boto_client):
        """Test ASG analysis with exception."""
        mock_autoscaling = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'autoscaling': mock_autoscaling,
            'rds': Mock(),
            'ec2': Mock(),
            'cloudwatch': Mock(),
            'elasticache': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        mock_autoscaling.describe_auto_scaling_groups.side_effect = Exception('API Error')

        optimizer = EC2Optimizer(region='us-east-1')
        recommendations = optimizer.analyze_auto_scaling_groups(days=45)

        self.assertEqual(recommendations, [])


class TestElastiCacheOptimizer(unittest.TestCase):
    """Test ElastiCacheOptimizer class."""

    @patch('lib.optimize.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.optimizer = ElastiCacheOptimizer(region='us-east-1')

    def test_get_elasticache_price(self):
        """Test ElastiCache pricing lookup."""
        self.assertEqual(self.optimizer._get_elasticache_price('cache.r6g.2xlarge'), 0.519)
        self.assertEqual(self.optimizer._get_elasticache_price('cache.r6g.xlarge'), 0.260)
        self.assertEqual(self.optimizer._get_elasticache_price('cache.r6g.large'), 0.130)
        self.assertEqual(self.optimizer._get_elasticache_price('unknown'), 0)

    @patch('lib.optimize.boto3.client')
    def test_analyze_redis_clusters_reduce_shards(self, mock_boto_client):
        """Test Redis cluster analysis with shard reduction recommendation."""
        mock_elasticache = Mock()
        mock_cloudwatch = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'elasticache': mock_elasticache,
            'cloudwatch': mock_cloudwatch,
            'rds': Mock(),
            'ec2': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        # Mock ElastiCache describe
        mock_elasticache.describe_replication_groups.return_value = {
            'ReplicationGroups': [{
                'ReplicationGroupId': 'test-redis',
                'NodeGroups': [
                    {'NodeGroupId': f'0{i}', 'NodeGroupMembers': [{}, {}, {}]}
                    for i in range(6)
                ]
            }]
        }

        # Low memory usage
        memory_metrics = [30.0] * 200
        hit_rate_metrics = [95.0] * 200

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in memory_metrics]},
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in hit_rate_metrics]},
        ]

        optimizer = ElastiCacheOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_redis_clusters(days=45)

        self.assertGreater(len(recommendations), 0)
        rec = recommendations[0]
        self.assertEqual(rec.resource_id, 'test-redis')
        self.assertEqual(rec.resource_type, 'ElastiCache-Redis')

    @patch('lib.optimize.boto3.client')
    def test_analyze_redis_clusters_exception(self, mock_boto_client):
        """Test Redis cluster analysis with exception."""
        mock_elasticache = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'elasticache': mock_elasticache,
            'rds': Mock(),
            'ec2': Mock(),
            'cloudwatch': Mock(),
            'lambda': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        mock_elasticache.describe_replication_groups.side_effect = Exception('API Error')

        optimizer = ElastiCacheOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_redis_clusters(days=45)

        self.assertEqual(recommendations, [])


class TestLambdaOptimizer(unittest.TestCase):
    """Test LambdaOptimizer class."""

    @patch('lib.optimize.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.optimizer = LambdaOptimizer(region='us-east-1')

    def test_calculate_lambda_cost(self):
        """Test Lambda cost calculation."""
        cost = self.optimizer._calculate_lambda_cost(3008, 2000)
        self.assertGreater(cost, 0)

    @patch('lib.optimize.boto3.client')
    def test_analyze_lambda_functions_reduce_memory(self, mock_boto_client):
        """Test Lambda function analysis with memory reduction recommendation."""
        mock_lambda = Mock()
        mock_cloudwatch = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'lambda': mock_lambda,
            'cloudwatch': mock_cloudwatch,
            'rds': Mock(),
            'ec2': Mock(),
            'elasticache': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        # Mock Lambda list_functions
        mock_lambda.list_functions.return_value = {
            'Functions': [{
                'FunctionName': 'test-function',
                'MemorySize': 3008,
                'Timeout': 900
            }]
        }

        # Low duration metrics
        duration_metrics = [2000.0] * 200  # 2 seconds
        cold_start_metrics = [500.0] * 50

        mock_cloudwatch.get_metric_statistics.side_effect = [
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in duration_metrics]},
            {'Datapoints': [{'Timestamp': datetime.now(timezone.utc), 'Average': v} for v in cold_start_metrics]},
        ]

        optimizer = LambdaOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_lambda_functions(days=45)

        self.assertGreater(len(recommendations), 0)
        rec = recommendations[0]
        self.assertEqual(rec.resource_id, 'test-function')
        self.assertEqual(rec.resource_type, 'Lambda')

    @patch('lib.optimize.boto3.client')
    def test_analyze_lambda_functions_skip_small_memory(self, mock_boto_client):
        """Test Lambda function analysis skips small memory functions."""
        mock_lambda = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'lambda': mock_lambda,
            'cloudwatch': Mock(),
            'rds': Mock(),
            'ec2': Mock(),
            'elasticache': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        # Mock Lambda with small memory
        mock_lambda.list_functions.return_value = {
            'Functions': [{
                'FunctionName': 'test-function',
                'MemorySize': 512,  # Not 3008
                'Timeout': 300
            }]
        }

        optimizer = LambdaOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_lambda_functions(days=45)

        self.assertEqual(len(recommendations), 0)

    @patch('lib.optimize.boto3.client')
    def test_analyze_lambda_functions_exception(self, mock_boto_client):
        """Test Lambda function analysis with exception."""
        mock_lambda = Mock()
        mock_boto_client.side_effect = lambda service, **kwargs: {
            'lambda': mock_lambda,
            'rds': Mock(),
            'ec2': Mock(),
            'cloudwatch': Mock(),
            'elasticache': Mock(),
            'pricing': Mock()
        }.get(service, Mock())

        mock_lambda.list_functions.side_effect = Exception('API Error')

        optimizer = LambdaOptimizer(region='us-east-1')
        recommendations = optimizer.analyze_lambda_functions(days=45)

        self.assertEqual(recommendations, [])


class TestOptimizationReporter(unittest.TestCase):
    """Test OptimizationReporter class."""

    def setUp(self):
        """Set up test fixtures."""
        self.reporter = OptimizationReporter()
        self.recommendations = [
            OptimizationRecommendation(
                resource_id='test-resource-1',
                resource_type='RDS',
                current_config='db.r6g.2xlarge',
                proposed_config='db.r6g.xlarge',
                p50_utilization=20.0,
                p95_utilization=25.0,
                p99_utilization=30.0,
                current_hourly_cost=0.504,
                proposed_hourly_cost=0.252,
                annual_savings=2190.0,
                confidence_score=0.95,
                recommendation_reason='Low CPU utilization',
                rollback_strategy='Blue-Green deployment',
                implementation_notes='Schedule during maintenance window'
            ),
            OptimizationRecommendation(
                resource_id='test-resource-2',
                resource_type='Lambda',
                current_config='3008 MB',
                proposed_config='1024 MB',
                p50_utilization=2.0,
                p95_utilization=2.5,
                p99_utilization=3.0,
                current_hourly_cost=0.10,
                proposed_hourly_cost=0.05,
                annual_savings=438.0,
                confidence_score=0.90,
                recommendation_reason='Low duration',
                rollback_strategy='Increase memory if latency increases',
                implementation_notes='Monitor cold starts'
            )
        ]

    @patch('builtins.open', new_callable=mock_open)
    def test_generate_csv_report(self, mock_file):
        """Test CSV report generation."""
        self.reporter.generate_csv_report(self.recommendations, 'test.csv')
        mock_file.assert_called_once_with('test.csv', 'w', newline='')

    def test_generate_csv_report_empty(self):
        """Test CSV report generation with empty recommendations."""
        # Should not raise exception
        self.reporter.generate_csv_report([], 'test.csv')

    @patch('builtins.open', new_callable=mock_open)
    def test_generate_json_report(self, mock_file):
        """Test JSON report generation."""
        self.reporter.generate_json_report(self.recommendations, 'test.json')
        mock_file.assert_called_once_with('test.json', 'w')

        # Verify write was called
        handle = mock_file()
        self.assertTrue(handle.write.called)

    def test_generate_json_report_empty(self):
        """Test JSON report generation with empty recommendations."""
        # Should not raise exception
        self.reporter.generate_json_report([], 'test.json')


class TestInfrastructureOptimizer(unittest.TestCase):
    """Test InfrastructureOptimizer class."""

    @patch('lib.optimize.boto3.client')
    def setUp(self, mock_boto_client):
        """Set up test fixtures."""
        self.optimizer = InfrastructureOptimizer(region='us-east-1')

    def test_initialization(self):
        """Test InfrastructureOptimizer initialization."""
        self.assertEqual(self.optimizer.region, 'us-east-1')
        self.assertIsInstance(self.optimizer.rds_optimizer, RDSOptimizer)
        self.assertIsInstance(self.optimizer.ec2_optimizer, EC2Optimizer)
        self.assertIsInstance(self.optimizer.elasticache_optimizer, ElastiCacheOptimizer)
        self.assertIsInstance(self.optimizer.lambda_optimizer, LambdaOptimizer)
        self.assertIsInstance(self.optimizer.reporter, OptimizationReporter)

    @patch.object(RDSOptimizer, 'analyze_rds_instances')
    @patch.object(EC2Optimizer, 'analyze_auto_scaling_groups')
    @patch.object(ElastiCacheOptimizer, 'analyze_redis_clusters')
    @patch.object(LambdaOptimizer, 'analyze_lambda_functions')
    @patch('lib.optimize.boto3.client')
    def test_run_optimization_analysis(
        self,
        mock_boto_client,
        mock_lambda_analyze,
        mock_cache_analyze,
        mock_ec2_analyze,
        mock_rds_analyze
    ):
        """Test running complete optimization analysis."""
        # Mock recommendations from each service
        rds_rec = OptimizationRecommendation(
            resource_id='rds-1',
            resource_type='RDS',
            current_config='db.r6g.2xlarge',
            proposed_config='db.r6g.xlarge',
            p50_utilization=20.0,
            p95_utilization=25.0,
            p99_utilization=30.0,
            current_hourly_cost=0.504,
            proposed_hourly_cost=0.252,
            annual_savings=2190.0,
            confidence_score=0.96,
            recommendation_reason='Low CPU',
            rollback_strategy='Blue-Green',
            implementation_notes='Maintenance window'
        )

        ec2_rec = OptimizationRecommendation(
            resource_id='asg-1',
            resource_type='EC2-ASG',
            current_config='c5.4xlarge',
            proposed_config='c5.2xlarge',
            p50_utilization=30.0,
            p95_utilization=35.0,
            p99_utilization=40.0,
            current_hourly_cost=6.8,
            proposed_hourly_cost=3.4,
            annual_savings=29500.0,
            confidence_score=0.97,
            recommendation_reason='Low CPU',
            rollback_strategy='Gradual rollout',
            implementation_notes='Rolling deployment'
        )

        low_confidence_rec = OptimizationRecommendation(
            resource_id='cache-1',
            resource_type='ElastiCache-Redis',
            current_config='r6g.2xlarge x 6',
            proposed_config='r6g.2xlarge x 3',
            p50_utilization=30.0,
            p95_utilization=35.0,
            p99_utilization=40.0,
            current_hourly_cost=9.34,
            proposed_hourly_cost=3.11,
            annual_savings=54000.0,
            confidence_score=0.80,  # Below threshold
            recommendation_reason='Low memory',
            rollback_strategy='Restore backup',
            implementation_notes='Low traffic window'
        )

        mock_rds_analyze.return_value = [rds_rec]
        mock_ec2_analyze.return_value = [ec2_rec]
        mock_cache_analyze.return_value = [low_confidence_rec]
        mock_lambda_analyze.return_value = []

        optimizer = InfrastructureOptimizer(region='us-east-1')
        recommendations = optimizer.run_optimization_analysis(days=45, confidence_threshold=0.95)

        # Should only get high confidence recommendations
        self.assertEqual(len(recommendations), 2)
        self.assertIn(rds_rec, recommendations)
        self.assertIn(ec2_rec, recommendations)
        self.assertNotIn(low_confidence_rec, recommendations)

    @patch.object(OptimizationReporter, 'generate_csv_report')
    @patch.object(OptimizationReporter, 'generate_json_report')
    @patch('builtins.print')
    @patch('lib.optimize.boto3.client')
    def test_generate_reports(
        self,
        mock_boto_client,
        mock_print,
        mock_json_report,
        mock_csv_report
    ):
        """Test report generation."""
        recommendations = [
            OptimizationRecommendation(
                resource_id='test-1',
                resource_type='RDS',
                current_config='config',
                proposed_config='new_config',
                p50_utilization=20.0,
                p95_utilization=25.0,
                p99_utilization=30.0,
                current_hourly_cost=0.504,
                proposed_hourly_cost=0.252,
                annual_savings=2190.0,
                confidence_score=0.95,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            )
        ]

        optimizer = InfrastructureOptimizer(region='us-east-1')
        optimizer.generate_reports(recommendations)

        # Verify reports were generated
        self.assertTrue(mock_csv_report.called)
        self.assertTrue(mock_json_report.called)
        self.assertTrue(mock_print.called)

    @patch('builtins.print')
    @patch('lib.optimize.boto3.client')
    def test_print_summary_empty(self, mock_boto_client, mock_print):
        """Test printing summary with no recommendations."""
        optimizer = InfrastructureOptimizer(region='us-east-1')
        optimizer._print_summary([])

        # Verify "NO RECOMMENDATIONS" message was printed
        print_calls = [str(call) for call in mock_print.call_args_list]
        self.assertTrue(any('NO OPTIMIZATION RECOMMENDATIONS' in str(call) for call in print_calls))

    @patch('builtins.print')
    @patch('lib.optimize.boto3.client')
    def test_print_summary_with_recommendations(self, mock_boto_client, mock_print):
        """Test printing summary with recommendations."""
        recommendations = [
            OptimizationRecommendation(
                resource_id='test-1',
                resource_type='RDS',
                current_config='db.r6g.2xlarge',
                proposed_config='db.r6g.xlarge',
                p50_utilization=20.0,
                p95_utilization=25.0,
                p99_utilization=30.0,
                current_hourly_cost=0.504,
                proposed_hourly_cost=0.252,
                annual_savings=2190.0,
                confidence_score=0.95,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            ),
            OptimizationRecommendation(
                resource_id='test-2',
                resource_type='Lambda',
                current_config='3008 MB',
                proposed_config='1024 MB',
                p50_utilization=2.0,
                p95_utilization=2.5,
                p99_utilization=3.0,
                current_hourly_cost=0.10,
                proposed_hourly_cost=0.05,
                annual_savings=438.0,
                confidence_score=0.90,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            )
        ]

        optimizer = InfrastructureOptimizer(region='us-east-1')
        optimizer._print_summary(recommendations)

        # Verify summary was printed
        self.assertTrue(mock_print.called)

    @patch('lib.optimize.boto3.client')
    def test_apply_recommendations_dry_run(self, mock_boto_client):
        """Test applying recommendations in dry run mode."""
        recommendations = [
            OptimizationRecommendation(
                resource_id='test-1',
                resource_type='RDS',
                current_config='config',
                proposed_config='new_config',
                p50_utilization=20.0,
                p95_utilization=25.0,
                p99_utilization=30.0,
                current_hourly_cost=0.504,
                proposed_hourly_cost=0.252,
                annual_savings=2190.0,
                confidence_score=0.95,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            )
        ]

        optimizer = InfrastructureOptimizer(region='us-east-1')
        optimizer.apply_recommendations(recommendations, dry_run=True)

        # Should complete without error

    @patch('lib.optimize.boto3.client')
    def test_apply_recommendations_actual(self, mock_boto_client):
        """Test applying recommendations in actual mode."""
        recommendations = [
            OptimizationRecommendation(
                resource_id='rds-1',
                resource_type='RDS',
                current_config='config',
                proposed_config='new_config',
                p50_utilization=20.0,
                p95_utilization=25.0,
                p99_utilization=30.0,
                current_hourly_cost=0.504,
                proposed_hourly_cost=0.252,
                annual_savings=2190.0,
                confidence_score=0.95,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            ),
            OptimizationRecommendation(
                resource_id='asg-1',
                resource_type='EC2-ASG',
                current_config='config',
                proposed_config='new_config',
                p50_utilization=30.0,
                p95_utilization=35.0,
                p99_utilization=40.0,
                current_hourly_cost=6.8,
                proposed_hourly_cost=3.4,
                annual_savings=29500.0,
                confidence_score=0.97,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            ),
            OptimizationRecommendation(
                resource_id='cache-1',
                resource_type='ElastiCache-Redis',
                current_config='config',
                proposed_config='new_config',
                p50_utilization=30.0,
                p95_utilization=35.0,
                p99_utilization=40.0,
                current_hourly_cost=9.34,
                proposed_hourly_cost=3.11,
                annual_savings=54000.0,
                confidence_score=0.98,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            ),
            OptimizationRecommendation(
                resource_id='func-1',
                resource_type='Lambda',
                current_config='config',
                proposed_config='new_config',
                p50_utilization=2.0,
                p95_utilization=2.5,
                p99_utilization=3.0,
                current_hourly_cost=0.10,
                proposed_hourly_cost=0.05,
                annual_savings=438.0,
                confidence_score=0.92,
                recommendation_reason='test',
                rollback_strategy='test',
                implementation_notes='test'
            )
        ]

        optimizer = InfrastructureOptimizer(region='us-east-1')
        optimizer.apply_recommendations(recommendations, dry_run=False)

        # Should complete without error


class TestMainFunction(unittest.TestCase):
    """Test main function and CLI."""

    @patch('lib.optimize.InfrastructureOptimizer')
    @patch('sys.argv', ['optimize.py', '--region', 'us-west-2', '--days', '30', '--confidence', '0.90'])
    def test_main_function_basic(self, mock_optimizer_class):
        """Test main function with basic arguments."""
        from lib.optimize import main

        mock_optimizer = Mock()
        mock_optimizer_class.return_value = mock_optimizer
        # Return non-empty list so reports are generated
        mock_optimizer.run_optimization_analysis.return_value = [
            {'resource_id': 'test', 'recommendation': 'test'}
        ]

        main()

        # With explicit region, should create one optimizer for that region
        mock_optimizer_class.assert_called_with(region='us-west-2')
        mock_optimizer.run_optimization_analysis.assert_called_with(
            days=30,
            confidence_threshold=0.90
        )
        # Reports should be generated when recommendations exist
        self.assertTrue(mock_optimizer.generate_reports.called)

    @patch('lib.optimize.InfrastructureOptimizer')
    @patch('builtins.input', return_value='yes')
    @patch('sys.argv', ['optimize.py', '--apply', '--region', 'us-east-1'])
    def test_main_function_apply_yes(self, mock_input, mock_optimizer_class):
        """Test main function with apply flag and user confirmation."""
        from lib.optimize import main

        mock_optimizer = Mock()
        mock_optimizer_class.return_value = mock_optimizer
        # Return non-empty list so apply is attempted
        test_recommendations = [{'resource_id': 'test', 'recommendation': 'test'}]
        mock_optimizer.run_optimization_analysis.return_value = test_recommendations

        main()

        # Should call apply_recommendations with the recommendations list
        mock_optimizer.apply_recommendations.assert_called_with(test_recommendations, dry_run=False)

    @patch('lib.optimize.InfrastructureOptimizer')
    @patch('builtins.input', return_value='no')
    @patch('sys.argv', ['optimize.py', '--apply'])
    def test_main_function_apply_no(self, mock_input, mock_optimizer_class):
        """Test main function with apply flag and user rejection."""
        from lib.optimize import main

        mock_optimizer = Mock()
        mock_optimizer_class.return_value = mock_optimizer
        mock_optimizer.run_optimization_analysis.return_value = []

        main()

        # Should not call apply_recommendations with dry_run=False
        calls = mock_optimizer.apply_recommendations.call_args_list
        for call in calls:
            if len(call[0]) > 0 or 'dry_run' in call[1]:
                if 'dry_run' in call[1]:
                    self.assertNotEqual(call[1]['dry_run'], False)


if __name__ == '__main__':
    unittest.main()
