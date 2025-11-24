"""Unit tests for lib/optimize.py - Trading Platform Optimizer"""
import unittest
from datetime import datetime, timedelta
from unittest.mock import Mock, mock_open, patch

from pytest import mark

# Import the class to test
from lib.optimize import TradingPlatformOptimizer


@mark.describe("TradingPlatformOptimizer")
class TestTradingPlatformOptimizer(unittest.TestCase):
    """Test cases for TradingPlatformOptimizer class"""

    def setUp(self):
        """Set up test fixtures"""
        # Mock all boto3 clients to avoid AWS calls
        self.boto3_patcher = patch('lib.optimize.boto3')
        self.mock_boto3 = self.boto3_patcher.start()

        # Create mock clients
        self.mock_ec2 = Mock()
        self.mock_asg = Mock()
        self.mock_rds = Mock()
        self.mock_elasticache = Mock()
        self.mock_dynamodb = Mock()
        self.mock_cloudwatch = Mock()
        self.mock_ce = Mock()
        self.mock_sagemaker = Mock()

        # Configure boto3.client to return appropriate mocks
        def client_side_effect(service, region_name=None):
            clients = {
                'ec2': self.mock_ec2,
                'autoscaling': self.mock_asg,
                'rds': self.mock_rds,
                'elasticache': self.mock_elasticache,
                'dynamodb': self.mock_dynamodb,
                'cloudwatch': self.mock_cloudwatch,
                'ce': self.mock_ce,
                'sagemaker': self.mock_sagemaker
            }
            return clients.get(service, Mock())

        self.mock_boto3.client.side_effect = client_side_effect

        # Create optimizer instance
        self.optimizer = TradingPlatformOptimizer(
            region_trading='us-east-1',
            region_ml='us-west-2'
        )

    def tearDown(self):
        """Clean up test fixtures"""
        self.boto3_patcher.stop()

    @mark.it("initializes with correct regions and clients")
    def test_initialization(self):
        """Test optimizer initialization"""
        self.assertEqual(self.optimizer.region_trading, 'us-east-1')
        self.assertEqual(self.optimizer.region_ml, 'us-west-2')
        self.assertIsNotNone(self.optimizer.ec2_trading)
        self.assertIsNotNone(self.optimizer.asg_trading)
        self.assertIsNotNone(self.optimizer.rds_trading)
        self.assertIsNotNone(self.optimizer.sagemaker_ml)

    @mark.it("has correct optimization thresholds")
    def test_thresholds(self):
        """Test optimization thresholds are set correctly"""
        self.assertEqual(self.optimizer.thresholds['aurora']['cpu_low'], 20)
        self.assertEqual(self.optimizer.thresholds['aurora']['cpu_high'], 70)
        self.assertEqual(self.optimizer.thresholds['ec2']['cpu_p95_low'], 30)
        self.assertEqual(self.optimizer.thresholds['redis']['hit_rate_high'], 95)
        self.assertEqual(self.optimizer.thresholds['dynamodb']['consumed_ratio_low'], 0.2)
        self.assertEqual(self.optimizer.thresholds['sla']['error_rate_threshold'], 0.01)

    @mark.it("has instance sizing maps")
    def test_instance_sizes(self):
        """Test instance sizing maps are defined"""
        self.assertIn('r6g', self.optimizer.instance_sizes)
        self.assertIn('c6i', self.optimizer.instance_sizes)
        self.assertIn('cache.r6g', self.optimizer.instance_sizes)
        self.assertGreater(len(self.optimizer.instance_sizes['r6g']), 0)

    @mark.it("analyzes Aurora cluster with no instances")
    def test_analyze_aurora_cluster_no_instances(self):
        """Test Aurora analysis with no instances"""
        # Mock describe_db_clusters to return cluster with no members
        mock_cluster = {
            'DBClusterIdentifier': 'trading-cluster',
            'Engine': 'aurora-postgresql',
            'EngineVersion': '14.6',
            'DBClusterMembers': [],
            'MultiAZ': True,
            'BackupRetentionPeriod': 35
        }

        self.mock_rds.describe_db_clusters.return_value = {'DBClusters': [mock_cluster]}

        result = self.optimizer.analyze_aurora_cluster('trading-cluster')

        self.assertIsInstance(result, dict)
        self.assertEqual(result.get('cluster_id'), 'trading-cluster')

    @mark.it("analyzes Aurora cluster with mock data")
    def test_analyze_aurora_cluster_with_data(self):
        """Test Aurora analysis with mock cluster data"""
        # Mock Aurora cluster data
        mock_cluster = {
            'DBClusterIdentifier': 'trading-cluster',
            'Engine': 'aurora-postgresql',
            'EngineVersion': '14.6',
            'MultiAZ': True,
            'BackupRetentionPeriod': 35,
            'DBClusterMembers': [
                {'DBInstanceIdentifier': 'instance-1', 'IsClusterWriter': True},
                {'DBInstanceIdentifier': 'instance-2', 'IsClusterWriter': False}
            ]
        }

        mock_instance = {
            'DBInstanceIdentifier': 'instance-1',
            'DBInstanceClass': 'db.r6g.8xlarge',
            'Engine': 'aurora-postgresql'
        }

        self.mock_rds.describe_db_clusters.return_value = {'DBClusters': [mock_cluster]}
        self.mock_rds.describe_db_instances.return_value = {'DBInstances': [mock_instance]}

        # Mock CloudWatch metrics - return the requested statistic
        def mock_get_metric_statistics(*args, **kwargs):
            stat = kwargs.get('Statistics', ['Average'])[0]
            return {
                'Datapoints': [
                    {stat: 25.0, 'Timestamp': datetime.now()},
                    {stat: 30.0, 'Timestamp': datetime.now() - timedelta(hours=1)}
                ]
            }

        self.mock_cloudwatch.get_metric_statistics.side_effect = mock_get_metric_statistics

        result = self.optimizer.analyze_aurora_cluster('trading-cluster')

        self.assertIsInstance(result, dict)
        self.assertIn('cluster_id', result)
        self.assertEqual(result['cluster_id'], 'trading-cluster')

    @mark.it("analyzes EC2 Auto Scaling groups")
    def test_analyze_ec2_autoscaling(self):
        """Test EC2 Auto Scaling analysis"""
        # Mock ASG data
        mock_asg = {
            'AutoScalingGroupName': 'trading-asg',
            'LaunchTemplate': {
                'LaunchTemplateId': 'lt-123',
                'Version': '$Latest'
            },
            'DesiredCapacity': 20,
            'MinSize': 15,
            'MaxSize': 30,
            'AvailabilityZones': ['us-east-1a', 'us-east-1b']
        }

        mock_lt = {
            'LaunchTemplateData': {
                'InstanceType': 'c6i.8xlarge'
            }
        }

        self.mock_asg.describe_auto_scaling_groups.return_value = {
            'AutoScalingGroups': [mock_asg]
        }

        self.mock_ec2.describe_launch_template_versions.return_value = {
            'LaunchTemplateVersions': [mock_lt]
        }

        # Mock CloudWatch metrics - return the requested statistic
        def mock_get_metric_statistics(*args, **kwargs):
            stat = kwargs.get('Statistics', ['Average'])[0]
            return {
                'Datapoints': [
                    {stat: 45.0, 'Timestamp': datetime.now()}
                ]
            }

        self.mock_cloudwatch.get_metric_statistics.side_effect = mock_get_metric_statistics

        result = self.optimizer.analyze_ec2_autoscaling('trading-asg')

        self.assertIsInstance(result, dict)
        self.assertIn('asg_name', result)

    @mark.it("analyzes Redis cluster")
    def test_analyze_redis_cluster(self):
        """Test Redis cluster analysis"""
        # Mock Redis replication group
        mock_redis = {
            'ReplicationGroupId': 'trading-redis',
            'CacheNodeType': 'cache.r6g.8xlarge',
            'NodeGroups': [
                {
                    'NodeGroupMembers': [
                        {'CacheNodeId': 'node-1'},
                        {'CacheNodeId': 'node-2'}
                    ]
                }
            ]
        }

        self.mock_elasticache.describe_replication_groups.return_value = {
            'ReplicationGroups': [mock_redis]
        }

        # Mock CloudWatch metrics - return the requested statistic
        def mock_get_metric_statistics(*args, **kwargs):
            stat = kwargs.get('Statistics', ['Average'])[0]
            base_value = 10000.0 if stat == 'Sum' else (98.5 if stat == 'Average' else 50000.0)
            return {
                'Datapoints': [
                    {stat: base_value, 'Timestamp': datetime.now()}
                ]
            }

        self.mock_cloudwatch.get_metric_statistics.side_effect = mock_get_metric_statistics

        result = self.optimizer.analyze_redis_cluster('trading-redis')

        self.assertIsInstance(result, dict)
        self.assertIn('cluster_id', result)

    @mark.it("analyzes DynamoDB tables")
    def test_analyze_dynamodb_tables(self):
        """Test DynamoDB table analysis"""
        mock_table_desc = {
            'Table': {
                'TableName': 'tap-trades-test',
                'TableStatus': 'ACTIVE',
                'ItemCount': 1000,
                'TableSizeBytes': 500000,
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5000,
                    'WriteCapacityUnits': 5000
                },
                'GlobalSecondaryIndexes': []
            }
        }

        self.mock_dynamodb.describe_table.return_value = mock_table_desc

        # Mock CloudWatch metrics
        self.mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Sum': 1000.0, 'Average': 100.0, 'Timestamp': datetime.now()}
            ]
        }

        result = self.optimizer.analyze_dynamodb_tables(['tap-trades-test'])

        self.assertIsInstance(result, dict)

    @mark.it("analyzes ML platform")
    def test_analyze_ml_platform(self):
        """Test ML platform analysis"""
        # Mock SageMaker endpoints
        self.mock_sagemaker.list_endpoints.return_value = {
            'Endpoints': [
                {'EndpointName': 'ml-endpoint-1'}
            ]
        }

        mock_endpoint = {
            'EndpointName': 'ml-endpoint-1',
            'EndpointStatus': 'InService',
            'EndpointConfigName': 'ml-config-1'
        }

        mock_config = {
            'EndpointConfigName': 'ml-config-1',
            'ProductionVariants': [
                {
                    'VariantName': 'AllTraffic',
                    'InstanceType': 'ml.p3.8xlarge',
                    'InitialInstanceCount': 2
                }
            ]
        }

        self.mock_sagemaker.describe_endpoint.return_value = mock_endpoint
        self.mock_sagemaker.describe_endpoint_config.return_value = mock_config

        # Mock CloudWatch metrics
        self.mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Average': 15.0, 'Sum': 100.0, 'Maximum': 20.0, 'Timestamp': datetime.now()}
            ]
        }

        # Mock training jobs
        self.mock_sagemaker.list_training_jobs.return_value = {
            'TrainingJobSummaries': [
                {'TrainingJobName': 'job-1'}
            ]
        }

        self.mock_sagemaker.describe_training_job.return_value = {
            'TrainingJobName': 'job-1',
            'EnableManagedSpotTraining': False
        }

        result = self.optimizer.analyze_ml_platform()

        self.assertIsInstance(result, dict)

    @mark.it("checks SLA compliance")
    def test_check_sla_compliance(self):
        """Test SLA compliance check"""
        # Mock CloudWatch metrics for SLA
        def get_metric_side_effect(*args, **kwargs):
            metric_name = kwargs.get('MetricName', '')
            if metric_name == 'OrderErrorRate':
                return {
                    'Datapoints': [
                        {'Average': 0.005, 'Timestamp': datetime.now()}  # 0.5% error rate
                    ]
                }
            elif metric_name == 'OrderLatencyP95':
                return {
                    'Datapoints': [
                        {'Maximum': 8.0, 'Timestamp': datetime.now()}  # 8ms latency
                    ]
                }
            return {'Datapoints': []}

        self.mock_cloudwatch.get_metric_statistics.side_effect = get_metric_side_effect

        result = self.optimizer.check_sla_compliance()

        self.assertIsInstance(result, dict)
        self.assertIn('compliant', result)
        self.assertIn('violations', result)

    @mark.it("calculates instance savings")
    def test_calculate_instance_savings(self):
        """Test instance cost savings calculation"""
        current_type = 'r6g.8xlarge'
        new_type = 'r6g.4xlarge'

        savings = self.optimizer._calculate_instance_savings(current_type, new_type)

        self.assertIsInstance(savings, float)
        self.assertGreater(savings, 0)

    @mark.it("calculates instance savings when removing instance entirely")
    def test_calculate_instance_savings_removal(self):
        """Test instance cost savings calculation when removing instance (new_type=None)"""
        current_type = 'db.r6g.8xlarge'

        savings = self.optimizer._calculate_instance_savings(current_type, new_type=None)

        self.assertIsInstance(savings, float)
        self.assertGreater(savings, 0)  # Should be cost of running instance for a month

    @mark.it("calculates Aurora savings")
    def test_calculate_aurora_savings(self):
        """Test Aurora cost savings calculation"""
        instances = [
            {'DBInstanceClass': 'db.r6g.8xlarge'}
        ]
        recommendations = [
            {'estimated_monthly_savings': 1000.0}
        ]

        savings = self.optimizer._calculate_aurora_savings(instances, recommendations)

        self.assertIsInstance(savings, float)
        self.assertEqual(savings, 1000.0)

    @mark.it("calculates EC2 savings")
    def test_calculate_ec2_savings(self):
        """Test EC2 cost savings calculation"""
        asg_info = {
            'DesiredCapacity': 20
        }
        instance_type = 'c6i.8xlarge'
        recommendations = [
            {'estimated_monthly_savings': 500.0}
        ]

        savings = self.optimizer._calculate_ec2_savings(asg_info, instance_type, recommendations)

        self.assertIsInstance(savings, float)

    @mark.it("calculates Redis savings")
    def test_calculate_redis_savings(self):
        """Test Redis cost savings calculation"""
        cluster_info = {
            'CacheNodeType': 'cache.r6g.8xlarge'
        }
        recommendations = [
            {'estimated_monthly_savings': 1500.0}
        ]

        savings = self.optimizer._calculate_redis_savings(cluster_info, recommendations)

        self.assertIsInstance(savings, float)
        self.assertEqual(savings, 1500.0)

    @mark.it("generates Excel report")
    @patch('lib.optimize.Workbook')
    @patch('lib.optimize.Reference')
    @patch('lib.optimize.AreaChart')
    def test_generate_excel_report(self, mock_chart, mock_reference, mock_workbook):
        """Test Excel report generation"""
        mock_wb = Mock()
        mock_ws = Mock()

        # Make the worksheet support item assignment
        ws_data = {}
        mock_cell = Mock()
        mock_cell.font = Mock()
        mock_cell.fill = Mock()

        def ws_setitem(self, key, value):
            ws_data[key] = value
        def ws_getitem(self, key):
            return mock_cell

        mock_ws.__setitem__ = ws_setitem
        mock_ws.__getitem__ = ws_getitem
        mock_ws.cell = Mock(return_value=mock_cell)
        mock_ws.append = Mock()
        mock_ws.merge_cells = Mock()
        mock_ws.add_chart = Mock()
        mock_ws.columns = []  # Mock columns as empty list to avoid iteration issues

        mock_wb.active = mock_ws
        mock_wb.create_sheet = Mock(return_value=mock_ws)
        mock_wb.worksheets = [mock_ws]
        mock_wb.save = Mock()
        mock_workbook.return_value = mock_wb

        # Mock Reference and AreaChart
        mock_reference.return_value = Mock()
        mock_chart.return_value = Mock()

        # Mock analysis results
        analysis_results = {
            'aurora': {'estimated_savings': 1000, 'recommendations': []},
            'ec2': {'estimated_savings': 500, 'recommendations': []},
            'redis': {'estimated_savings': 750, 'recommendations': []},
            'dynamodb': {},
            'ml': {'recommendations': []}
        }

        result = self.optimizer.generate_excel_report(analysis_results, 'test_report.xlsx')

        self.assertEqual(result, 'test_report.xlsx')
        mock_wb.save.assert_called_once_with('test_report.xlsx')

    @mark.it("generates Jupyter notebook")
    def test_generate_jupyter_notebook(self):
        """Test Jupyter notebook generation"""
        # Mock analysis results
        ml_analysis = {
            'endpoints': [],
            'training_jobs': [],
            'recommendations': []
        }

        with patch('builtins.open', mock_open()):
            result = self.optimizer.generate_jupyter_notebook(ml_analysis, 'test_notebook.ipynb')

        self.assertEqual(result, 'test_notebook.ipynb')

    @mark.it("runs full optimization successfully")
    @patch('lib.optimize.TradingPlatformOptimizer.generate_excel_report')
    @patch('lib.optimize.TradingPlatformOptimizer.generate_jupyter_notebook')
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open, read_data='{"AuroraClusterEndpoint": "cluster.amazonaws.com", "ASGName": "test-asg", "RedisClusterEndpoint": "redis.amazonaws.com"}')
    def test_run_full_optimization(self, mock_file, mock_exists, mock_notebook, mock_excel):
        """Test full optimization run"""
        mock_exists.return_value = True
        mock_excel.return_value = 'report.xlsx'
        mock_notebook.return_value = 'notebook.ipynb'

        # Mock all analysis methods
        with patch.object(self.optimizer, 'analyze_aurora_cluster', return_value={'estimated_savings': 1000, 'recommendations': []}), \
             patch.object(self.optimizer, 'analyze_ec2_autoscaling', return_value={'estimated_savings': 500, 'recommendations': []}), \
             patch.object(self.optimizer, 'analyze_redis_cluster', return_value={'estimated_savings': 750, 'recommendations': []}), \
             patch.object(self.optimizer, 'analyze_dynamodb_tables', return_value={}), \
             patch.object(self.optimizer, 'analyze_ml_platform', return_value={'recommendations': []}), \
             patch.object(self.optimizer, 'check_sla_compliance', return_value={'compliant': True, 'violations': []}):

            result = self.optimizer.run_full_optimization()

        self.assertIsInstance(result, dict)
        self.assertIn('aurora', result)

    @mark.it("generates Aurora recommendations")
    def test_generate_aurora_recommendations(self):
        """Test Aurora recommendation generation"""
        cluster_info = {
            'DBClusterIdentifier': 'test-cluster',
            'Engine': 'aurora-postgresql'
        }

        instances = [
            {
                'DBInstanceIdentifier': 'test-instance-1',
                'DBInstanceClass': 'db.r6g.8xlarge',
                'IsClusterWriter': True
            },
            {
                'DBInstanceIdentifier': 'test-instance-2',
                'DBInstanceClass': 'db.r6g.4xlarge',
                'IsClusterWriter': False
            },
            {
                'DBInstanceIdentifier': 'test-instance-3',
                'DBInstanceClass': 'db.r6g.4xlarge',
                'IsClusterWriter': False
            },
            {
                'DBInstanceIdentifier': 'test-instance-4',
                'DBInstanceClass': 'db.r6g.4xlarge',
                'IsClusterWriter': False
            }
        ]

        metrics = {
            'test-instance-1': {
                'CPUUtilization': {'p95': 15, 'mean': 10},  # Low CPU - should recommend downsize
                'DatabaseConnections': {'p95': 50, 'mean': 30},  # Low connections
                'BufferCacheHitRatio': {'mean': 98}  # Good cache hit ratio
            },
            'test-instance-2': {
                'CPUUtilization': {'p95': 25, 'mean': 20},
                'DatabaseConnections': {'p95': 100, 'mean': 80},
                'BufferCacheHitRatio': {'mean': 90}  # Low cache hit ratio
            },
            'test-instance-3': {
                'CPUUtilization': {'p95': 25, 'mean': 20},
                'DatabaseConnections': {'p95': 100, 'mean': 80},
                'BufferCacheHitRatio': {'mean': 95}
            },
            'test-instance-4': {
                'CPUUtilization': {'p95': 25, 'mean': 20},
                'DatabaseConnections': {'p95': 100, 'mean': 80},
                'BufferCacheHitRatio': {'mean': 95}
            }
        }

        # Mock the _calculate_instance_savings method
        with patch.object(self.optimizer, '_calculate_instance_savings', return_value=500):
            recommendations = self.optimizer._generate_aurora_recommendations(
                cluster_info, instances, metrics
            )

        # Should have recommendations for:
        # 1. Downsize instance-1 (low CPU)
        # 2. Review connection pooling for instance-1 (low connections)
        # 3. Increase memory for instance-2 (low cache hit ratio)
        # 4. Reduce reader count (3 readers with low average CPU)
        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)

        # Check for downsize recommendation
        downsize_rec = next((r for r in recommendations if r.get('action') == 'downsize'), None)
        self.assertIsNotNone(downsize_rec)
        self.assertEqual(downsize_rec['instance'], 'test-instance-1')
        self.assertIn('db.r6g.4xlarge', downsize_rec['recommended'])

        # Check for connection pooling recommendation
        conn_rec = next((r for r in recommendations if r.get('action') == 'review_connection_pooling'), None)
        self.assertIsNotNone(conn_rec)
        self.assertEqual(conn_rec['instance'], 'test-instance-1')

        # Check for memory increase recommendation
        memory_rec = next((r for r in recommendations if r.get('action') == 'increase_instance_memory'), None)
        self.assertIsNotNone(memory_rec)
        self.assertEqual(memory_rec['instance'], 'test-instance-2')

        # Check for reader count reduction
        reader_rec = next((r for r in recommendations if r.get('action') == 'reduce_reader_count'), None)
        self.assertIsNotNone(reader_rec)
        self.assertEqual(reader_rec['current'], 3)  # 3 readers (instance-2, 3, 4)
        self.assertEqual(reader_rec['recommended'], 2)  # Should not go below 2

    @mark.it("handles errors gracefully in Aurora analysis")
    def test_analyze_aurora_cluster_error_handling(self):
        """Test Aurora analysis error handling"""
        # Mock exception in describe_db_clusters
        self.mock_rds.describe_db_clusters.side_effect = Exception("AWS Error")

        with self.assertRaises(Exception):
            self.optimizer.analyze_aurora_cluster('test-cluster')

    @mark.it("handles errors gracefully in EC2 analysis")
    def test_analyze_ec2_error_handling(self):
        """Test EC2 analysis error handling"""
        # Mock exception
        self.mock_asg.describe_auto_scaling_groups.side_effect = Exception("AWS Error")

        with self.assertRaises(Exception):
            self.optimizer.analyze_ec2_autoscaling('test-asg')

    @mark.it("handles errors gracefully in Redis analysis")
    def test_analyze_redis_error_handling(self):
        """Test Redis analysis error handling"""
        # Mock exception
        self.mock_elasticache.describe_replication_groups.side_effect = Exception("AWS Error")

        with self.assertRaises(Exception):
            self.optimizer.analyze_redis_cluster('test-redis')

    @mark.it("handles errors gracefully in DynamoDB analysis")
    def test_analyze_dynamodb_error_handling(self):
        """Test DynamoDB analysis error handling"""
        # Mock exception
        self.mock_dynamodb.describe_table.side_effect = Exception("AWS Error")

        with self.assertRaises(Exception):
            self.optimizer.analyze_dynamodb_tables(['test-table'])

    @mark.it("handles errors gracefully in ML analysis")
    def test_analyze_ml_error_handling(self):
        """Test ML analysis error handling"""
        # Mock exception
        self.mock_sagemaker.list_endpoints.side_effect = Exception("AWS Error")

        with self.assertRaises(Exception):
            self.optimizer.analyze_ml_platform()

    @mark.it("analyzes EC2 without LaunchTemplate")
    def test_analyze_ec2_autoscaling_no_launch_template(self):
        """Test EC2 ASG analysis without launch template"""
        # Mock ASG without LaunchTemplate
        mock_asg = {
            'AutoScalingGroupName': 'trading-asg',
            'DesiredCapacity': 20,
            'MinSize': 15,
            'MaxSize': 30,
            'AvailabilityZones': ['us-east-1a', 'us-east-1b']
        }

        self.mock_asg.describe_auto_scaling_groups.return_value = {
            'AutoScalingGroups': [mock_asg]
        }

        # Mock CloudWatch metrics with empty datapoints to test missing coverage
        self.mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        result = self.optimizer.analyze_ec2_autoscaling('trading-asg')

        self.assertIsInstance(result, dict)
        self.assertIn('asg_name', result)

    @mark.it("generates EC2 recommendation for ASG capacity reduction")
    def test_ec2_recommendation_reduce_capacity(self):
        """Test EC2 recommendation to reduce ASG capacity"""
        asg_info = {
            'AutoScalingGroupName': 'test-asg',
            'DesiredCapacity': 20,
            'MinSize': 10,
            'MaxSize': 30
        }
        instance_type = 'c6i.8xlarge'

        # Mock metrics showing low average instances
        metrics = {
            'CPUUtilization_Average': {'p95': 50, 'mean': 40},
            'GroupInServiceInstances_Average': {'mean': 12}  # 12 < 20 * 0.7 = 14
        }

        recommendations = self.optimizer._generate_ec2_recommendations(asg_info, instance_type, metrics)

        # Should recommend reducing ASG capacity
        capacity_rec = next((r for r in recommendations if r['action'] == 'reduce_asg_capacity'), None)
        self.assertIsNotNone(capacity_rec)
        self.assertIn('estimated_monthly_savings', capacity_rec)

    @mark.it("generates EC2 recommendation for network optimization")
    def test_ec2_recommendation_network_optimization(self):
        """Test EC2 recommendation for network optimization"""
        asg_info = {
            'AutoScalingGroupName': 'test-asg',
            'DesiredCapacity': 20,
            'MinSize': 10,
            'MaxSize': 30
        }
        instance_type = 'c6i.8xlarge'

        # Mock metrics showing low network utilization
        metrics = {
            'CPUUtilization_Average': {'p95': 50, 'mean': 40},
            'GroupInServiceInstances_Average': {'mean': 18},
            'NetworkIn_Sum': {'mean': 500000}  # Below threshold of 1000000
        }

        recommendations = self.optimizer._generate_ec2_recommendations(asg_info, instance_type, metrics)

        # Should recommend network optimization
        network_rec = next((r for r in recommendations if r['action'] == 'review_network_optimization'), None)
        self.assertIsNotNone(network_rec)

    @mark.it("generates Redis recommendations with high hit rate")
    def test_redis_recommendations_high_hit_rate(self):
        """Test Redis recommendations with high hit rate and low resource usage"""
        cluster_info = {
            'ReplicationGroupId': 'test-redis',
            'CacheNodeType': 'cache.r6g.8xlarge',
            'ClusterEnabled': True,
            'DataTiering': 'disabled'
        }

        metrics = {
            'HitRate': {'mean': 98.5},  # Above 98 to trigger replica reduction
            'EngineCPUUtilization': {'p95': 12},
            'DatabaseMemoryUsagePercentage': {'mean': 25},
            'SwapUsage': {'max': 50000000}
        }

        recommendations = self.optimizer._generate_redis_recommendations(
            cluster_info, metrics, num_shards=15, replicas_per_shard=2
        )

        # Should recommend downsizing
        downsize_rec = next((r for r in recommendations if r['action'] == 'downsize_node_type'), None)
        self.assertIsNotNone(downsize_rec)
        self.assertIn('estimated_monthly_savings', downsize_rec)

        # Should recommend reducing shards
        shard_rec = next((r for r in recommendations if r['action'] == 'reduce_shards'), None)
        self.assertIsNotNone(shard_rec)

        # Should recommend reducing replicas (hit rate > 98)
        replica_rec = next((r for r in recommendations if r['action'] == 'reduce_replicas'), None)
        self.assertIsNotNone(replica_rec)

    @mark.it("generates Redis recommendation for high swap usage")
    def test_redis_recommendation_high_swap(self):
        """Test Redis recommendation for high swap usage"""
        cluster_info = {
            'ReplicationGroupId': 'test-redis',
            'CacheNodeType': 'cache.r6g.4xlarge'
        }

        metrics = {
            'HitRate': {'mean': 90},
            'SwapUsage': {'max': 150000000}  # 150MB - above threshold
        }

        recommendations = self.optimizer._generate_redis_recommendations(
            cluster_info, metrics, num_shards=10, replicas_per_shard=1
        )

        # Should recommend increasing memory
        memory_rec = next((r for r in recommendations if r['action'] == 'increase_memory'), None)
        self.assertIsNotNone(memory_rec)
        self.assertEqual(memory_rec['priority'], 'immediate')

    @mark.it("skips DynamoDB tables already in on-demand mode")
    def test_dynamodb_skip_on_demand_tables(self):
        """Test that on-demand tables are skipped"""
        mock_table_desc = {
            'Table': {
                'TableName': 'tap-trades-test',
                'TableStatus': 'ACTIVE',
                'BillingModeSummary': {
                    'BillingMode': 'PAY_PER_REQUEST'
                }
            }
        }

        self.mock_dynamodb.describe_table.return_value = mock_table_desc

        result = self.optimizer.analyze_dynamodb_tables(['tap-trades-test'])

        # Should return empty results for on-demand tables
        self.assertIsInstance(result, dict)

    @mark.it("generates DynamoDB on-demand conversion recommendation")
    def test_dynamodb_on_demand_conversion(self):
        """Test DynamoDB on-demand conversion recommendation"""
        mock_table_desc = {
            'Table': {
                'TableName': 'tap-trades-test',
                'TableStatus': 'ACTIVE',
                'ItemCount': 1000,
                'TableSizeBytes': 500000,
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5000,
                    'WriteCapacityUnits': 5000
                },
                'GlobalSecondaryIndexes': []
            }
        }

        self.mock_dynamodb.describe_table.return_value = mock_table_desc

        # Mock CloudWatch metrics showing low utilization
        self.mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Sum': 100.0, 'Average': 100.0, 'Timestamp': datetime.now()}
            ]
        }

        result = self.optimizer.analyze_dynamodb_tables(['tap-trades-test'])

        # Should recommend on-demand conversion
        self.assertIn('tap-trades-test', result)
        table_result = result['tap-trades-test']
        self.assertGreater(len(table_result['recommendations']), 0)
        self.assertEqual(table_result['recommendations'][0]['action'], 'convert_to_on_demand')

    @mark.it("generates ML platform GPU downsize recommendation")
    def test_ml_platform_gpu_downsize(self):
        """Test ML platform GPU instance downsize recommendation"""
        # Mock SageMaker endpoints with P3 instances
        self.mock_sagemaker.list_endpoints.return_value = {
            'Endpoints': [
                {'EndpointName': 'ml-endpoint-1'}
            ]
        }

        mock_endpoint = {
            'EndpointName': 'ml-endpoint-1',
            'EndpointStatus': 'InService',
            'EndpointConfigName': 'ml-config-1'
        }

        mock_config = {
            'EndpointConfigName': 'ml-config-1',
            'ProductionVariants': [
                {
                    'VariantName': 'AllTraffic',
                    'InstanceType': 'ml.p3.8xlarge',
                    'InitialInstanceCount': 4
                }
            ]
        }

        self.mock_sagemaker.describe_endpoint.return_value = mock_endpoint
        self.mock_sagemaker.describe_endpoint_config.return_value = mock_config

        # Mock CloudWatch metrics
        self.mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Average': 15.0, 'Sum': 100.0, 'Maximum': 20.0, 'Timestamp': datetime.now()}
            ]
        }

        # Mock training jobs without spot
        self.mock_sagemaker.list_training_jobs.return_value = {
            'TrainingJobSummaries': [
                {'TrainingJobName': 'job-1'},
                {'TrainingJobName': 'job-2'}
            ]
        }

        self.mock_sagemaker.describe_training_job.return_value = {
            'TrainingJobName': 'job-1',
            'EnableManagedSpotTraining': False
        }

        result = self.optimizer.analyze_ml_platform()

        # Should have GPU downsize recommendation
        gpu_rec = next((r for r in result['recommendations'] if r['action'] == 'downsize_gpu_instance'), None)
        self.assertIsNotNone(gpu_rec)
        self.assertEqual(gpu_rec['current'], 'ml.p3.8xlarge')
        self.assertIn('estimated_monthly_savings', gpu_rec)

        # Should have spot training recommendation
        spot_rec = next((r for r in result['recommendations'] if r['action'] == 'enable_spot_training'), None)
        self.assertIsNotNone(spot_rec)
        self.assertEqual(spot_rec['eligible_jobs'], 2)

    @mark.it("calculates EC2 savings with downsize action")
    def test_calculate_ec2_savings_downsize(self):
        """Test EC2 savings calculation with downsize action"""
        asg_info = {
            'DesiredCapacity': 20
        }
        instance_type = 'c6i.8xlarge'
        recommendations = [
            {
                'action': 'downsize_instance_type',
                'current': 'c6i.8xlarge',
                'recommended': 'c6i.4xlarge'
            }
        ]

        savings = self.optimizer._calculate_ec2_savings(asg_info, instance_type, recommendations)

        self.assertIsInstance(savings, float)
        self.assertGreater(savings, 0)

    @mark.it("generates comprehensive Excel report with all components")
    def test_generate_excel_report_comprehensive(self):
        """Test Excel report generation with comprehensive data"""
        # Mock all dependencies
        with patch('lib.optimize.Workbook') as mock_workbook, \
             patch('lib.optimize.Reference') as mock_reference, \
             patch('lib.optimize.AreaChart') as mock_chart:

            mock_wb = Mock()
            mock_ws = Mock()

            # Mock worksheet operations
            ws_data = {}
            mock_cell = Mock()
            mock_cell.font = Mock()
            mock_cell.fill = Mock()
            mock_cell.column_letter = 'A'
            mock_cell.value = 'Test'

            def ws_setitem(self, key, value):
                ws_data[key] = value
            def ws_getitem(self, key):
                return mock_cell

            mock_ws.__setitem__ = ws_setitem
            mock_ws.__getitem__ = ws_getitem
            mock_ws.cell = Mock(return_value=mock_cell)
            mock_ws.append = Mock()
            mock_ws.merge_cells = Mock()
            mock_ws.add_chart = Mock()

            # Mock column iteration - use empty list to skip column width adjustment
            mock_ws.columns = []

            # Mock column_dimensions as a proper Mock dict
            mock_col_dim = Mock()
            mock_col_dim.width = 0
            mock_column_dimensions = Mock()
            mock_column_dimensions.__getitem__ = Mock(return_value=mock_col_dim)
            mock_ws.column_dimensions = mock_column_dimensions

            mock_wb.active = mock_ws
            mock_wb.create_sheet = Mock(return_value=mock_ws)
            mock_wb.worksheets = [mock_ws, mock_ws, mock_ws, mock_ws, mock_ws]
            mock_wb.save = Mock()
            mock_workbook.return_value = mock_wb

            # Mock Reference and AreaChart
            mock_reference.return_value = Mock()
            mock_chart_instance = Mock()
            mock_chart_instance.title = ''
            mock_chart_instance.style = 0
            mock_chart_instance.x_axis = Mock()
            mock_chart_instance.y_axis = Mock()
            mock_chart.return_value = mock_chart_instance

            # Comprehensive analysis results
            analysis_results = {
                'aurora': {
                    'estimated_savings': 2000,
                    'recommendations': [
                        {
                            'action': 'downsize',
                            'current': 'db.r6g.8xlarge',
                            'recommended': 'db.r6g.4xlarge',
                            'reason': 'Low CPU',
                            'risk': 'low',
                            'estimated_monthly_savings': 1000
                        }
                    ]
                },
                'ec2': {
                    'estimated_savings': 1500,
                    'recommendations': [
                        {
                            'action': 'downsize_instance_type',
                            'current': 'c6i.8xlarge',
                            'recommended': 'c6i.4xlarge',
                            'reason': 'Low CPU',
                            'risk': 'medium',
                            'estimated_monthly_savings': 1500
                        }
                    ]
                },
                'redis': {'estimated_savings': 750, 'recommendations': []},
                'dynamodb': {
                    'tap-trades-test': {
                        'recommendations': [
                            {
                                'action': 'convert_to_on_demand',
                                'estimated_monthly_savings': 500
                            }
                        ]
                    }
                },
                'ml': {
                    'recommendations': [
                        {
                            'action': 'downsize_gpu_instance',
                            'estimated_monthly_savings': 3000
                        }
                    ]
                }
            }

            result = self.optimizer.generate_excel_report(analysis_results, 'test_report.xlsx')

            self.assertEqual(result, 'test_report.xlsx')
            mock_wb.save.assert_called_once_with('test_report.xlsx')

    @mark.it("handles run_full_optimization with missing outputs file")
    def test_run_full_optimization_missing_outputs(self):
        """Test run_full_optimization with missing outputs file"""
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False

            result = self.optimizer.run_full_optimization()

            self.assertEqual(result, {})

    @mark.it("handles run_full_optimization with exception")
    def test_run_full_optimization_exception(self):
        """Test run_full_optimization exception handling"""
        with patch('os.path.exists') as mock_exists, \
             patch('builtins.open', side_effect=Exception("File error")):
            mock_exists.return_value = True

            with self.assertRaises(Exception):
                self.optimizer.run_full_optimization()

    @mark.it("generates EC2 downsize recommendation with valid size")
    def test_ec2_downsize_recommendation_with_valid_size(self):
        """Test EC2 downsize recommendation with instance in c6i family"""
        asg_info = {
            'AutoScalingGroupName': 'test-asg',
            'DesiredCapacity': 20,
            'MinSize': 10,
            'MaxSize': 30
        }
        instance_type = 'c6i.4xlarge'

        # Mock metrics showing low CPU
        metrics = {
            'CPUUtilization_Average': {'p95': 25, 'mean': 20},  # Below 30% threshold
            'GroupInServiceInstances_Average': {'mean': 18}
        }

        recommendations = self.optimizer._generate_ec2_recommendations(asg_info, instance_type, metrics)

        # Should recommend downsizing from 4xlarge to 2xlarge
        downsize_rec = next((r for r in recommendations if r['action'] == 'downsize_instance_type'), None)
        self.assertIsNotNone(downsize_rec)
        self.assertEqual(downsize_rec['current'], 'c6i.4xlarge')
        self.assertEqual(downsize_rec['recommended'], 'c6i.2xlarge')

    @mark.it("analyzes Redis with full datapoint processing")
    def test_analyze_redis_with_full_datapoints(self):
        """Test Redis analysis with complete datapoint processing"""
        # Mock Redis replication group
        mock_redis = {
            'ReplicationGroupId': 'trading-redis',
            'CacheNodeType': 'cache.r6g.8xlarge',
            'ClusterEnabled': True,
            'DataTiering': 'disabled',
            'NodeGroups': [
                {
                    'NodeGroupMembers': [
                        {'CacheNodeId': 'node-1'},
                        {'CacheNodeId': 'node-2'}
                    ]
                }
            ]
        }

        self.mock_elasticache.describe_replication_groups.return_value = {
            'ReplicationGroups': [mock_redis]
        }

        # Mock CloudWatch metrics with actual datapoints
        def mock_get_metric_statistics(*args, **kwargs):
            metric_name = kwargs.get('MetricName', '')
            stat = kwargs.get('Statistics', ['Average'])[0]

            # Return different values based on metric
            if metric_name == 'CacheHits':
                return {
                    'Datapoints': [
                        {'Sum': 10000.0, 'Timestamp': datetime.now()},
                        {'Sum': 9500.0, 'Timestamp': datetime.now() - timedelta(hours=2)}
                    ]
                }
            elif metric_name == 'CacheMisses':
                return {
                    'Datapoints': [
                        {'Sum': 200.0, 'Timestamp': datetime.now()},
                        {'Sum': 180.0, 'Timestamp': datetime.now() - timedelta(hours=2)}
                    ]
                }
            elif metric_name == 'EngineCPUUtilization':
                return {
                    'Datapoints': [
                        {'Average': 25.0, 'Timestamp': datetime.now()}
                    ]
                }
            elif metric_name == 'DatabaseMemoryUsagePercentage':
                return {
                    'Datapoints': [
                        {'Average': 45.0, 'Timestamp': datetime.now()}
                    ]
                }
            else:
                return {
                    'Datapoints': [
                        {'Average': 100.0, 'Maximum': 150.0, 'Sum': 1000.0, 'Timestamp': datetime.now()}
                    ]
                }

        self.mock_cloudwatch.get_metric_statistics.side_effect = mock_get_metric_statistics

        result = self.optimizer.analyze_redis_cluster('trading-redis')

        # Should have metrics and recommendations
        self.assertIsInstance(result, dict)
        self.assertIn('cluster_id', result)
        self.assertIn('metrics', result)

        # Hit rate should be calculated
        if 'HitRate' in result['metrics']:
            hit_rate = result['metrics']['HitRate']['mean']
            self.assertGreater(hit_rate, 90)

    @mark.it("analyzes EC2 ASG with metrics showing low CPU and capacity underutilization")
    def test_ec2_analysis_comprehensive(self):
        """Test EC2 ASG analysis with comprehensive metrics"""
        # Mock ASG with LaunchTemplate
        mock_asg = {
            'AutoScalingGroupName': 'trading-asg',
            'LaunchTemplate': {
                'LaunchTemplateId': 'lt-123',
                'Version': '$Latest'
            },
            'DesiredCapacity': 30,
            'MinSize': 20,
            'MaxSize': 50,
            'AvailabilityZones': ['us-east-1a', 'us-east-1b']
        }

        mock_lt = {
            'LaunchTemplateData': {
                'InstanceType': 'c6i.8xlarge'
            }
        }

        self.mock_asg.describe_auto_scaling_groups.return_value = {
            'AutoScalingGroups': [mock_asg]
        }

        self.mock_ec2.describe_launch_template_versions.return_value = {
            'LaunchTemplateVersions': [mock_lt]
        }

        # Mock CloudWatch metrics showing low CPU and underutilization
        def mock_get_metric_statistics(*args, **kwargs):
            metric_name = kwargs.get('MetricName', '')
            stat = kwargs.get('Statistics', ['Average'])[0]

            if metric_name == 'CPUUtilization' and stat == 'Average':
                return {
                    'Datapoints': [
                        {'Average': 25.0, 'Timestamp': datetime.now()},
                        {'Average': 22.0, 'Timestamp': datetime.now() - timedelta(hours=2)}
                    ]
                }
            elif metric_name == 'GroupInServiceInstances':
                return {
                    'Datapoints': [
                        {'Average': 18.0, 'Timestamp': datetime.now()}  # 18 < 30 * 0.7 = 21
                    ]
                }
            elif metric_name == 'NetworkIn':
                return {
                    'Datapoints': [
                        {'Sum': 500000.0, 'Timestamp': datetime.now()}  # Below threshold
                    ]
                }
            else:
                return {
                    'Datapoints': [
                        {'Average': 50.0, 'Maximum': 75.0, 'Sum': 1000.0, 'Timestamp': datetime.now()}
                    ]
                }

        self.mock_cloudwatch.get_metric_statistics.side_effect = mock_get_metric_statistics

        result = self.optimizer.analyze_ec2_autoscaling('trading-asg')

        # Should have recommendations for downsizing, capacity reduction, and network optimization
        self.assertIsInstance(result, dict)
        self.assertIn('recommendations', result)
        self.assertGreater(len(result['recommendations']), 0)

    @mark.it("runs full optimization with valid outputs")
    def test_run_full_optimization_with_valid_outputs(self):
        """Test run_full_optimization with valid CloudFormation outputs"""
        with patch('os.path.exists') as mock_exists, \
             patch('builtins.open', mock_open(read_data='{"AuroraClusterEndpoint": "test-cluster.cluster-xxxx.us-east-1.rds.amazonaws.com", "ASGName": "test-asg", "RedisClusterEndpoint": "clustercfg.test-redis.us-east-1.cache.amazonaws.com"}')), \
             patch.object(self.optimizer, 'check_sla_compliance', return_value={'compliant': True, 'violations': []}), \
             patch.object(self.optimizer, 'analyze_aurora_cluster', return_value={'estimated_savings': 1000, 'recommendations': []}), \
             patch.object(self.optimizer, 'analyze_ec2_autoscaling', return_value={'estimated_savings': 500, 'recommendations': []}), \
             patch.object(self.optimizer, 'analyze_redis_cluster', return_value={'estimated_savings': 750, 'recommendations': []}), \
             patch.object(self.optimizer, 'analyze_dynamodb_tables', return_value={}), \
             patch.object(self.optimizer, 'analyze_ml_platform', return_value={'recommendations': []}), \
             patch.object(self.optimizer, 'generate_excel_report', return_value='report.xlsx'), \
             patch.object(self.optimizer, 'generate_jupyter_notebook', return_value='notebook.ipynb'):

            mock_exists.return_value = True

            result = self.optimizer.run_full_optimization()

            self.assertIsInstance(result, dict)
            self.assertIn('aurora', result)
            self.assertIn('ec2', result)
            self.assertIn('redis', result)

    @mark.it("runs full optimization with missing Aurora and Redis endpoints")
    def test_run_full_optimization_with_missing_endpoints(self):
        """Test run_full_optimization when Aurora and Redis endpoints are missing"""
        with patch('os.path.exists') as mock_exists, \
             patch('builtins.open', mock_open(read_data='{"ASGName": "test-asg"}')), \
             patch.object(self.optimizer, 'check_sla_compliance', return_value={'compliant': True, 'violations': []}), \
             patch.object(self.optimizer, 'analyze_ec2_autoscaling', return_value={'estimated_savings': 500, 'recommendations': []}), \
             patch.object(self.optimizer, 'analyze_dynamodb_tables', return_value={}), \
             patch.object(self.optimizer, 'analyze_ml_platform', return_value={'recommendations': []}), \
             patch.object(self.optimizer, 'generate_excel_report', return_value='report.xlsx'), \
             patch.object(self.optimizer, 'generate_jupyter_notebook', return_value='notebook.ipynb'):

            mock_exists.return_value = True

            result = self.optimizer.run_full_optimization()

            # Should skip Aurora and Redis analysis but still return results
            self.assertIsInstance(result, dict)
            self.assertIn('aurora', result)
            self.assertEqual(result['aurora']['estimated_savings'], 0)
            self.assertIn('redis', result)
            self.assertEqual(result['redis']['estimated_savings'], 0)


if __name__ == '__main__':
    unittest.main()
