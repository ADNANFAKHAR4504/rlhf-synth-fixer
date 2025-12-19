"""
Unit tests for PaymentPlatformOptimizer - Testing pure logic functions

Tests all calculation and recommendation logic without requiring AWS connections.
Focus on:
- Lambda recommendation generation
- DynamoDB recommendation generation
- EC2 recommendation generation
- SQS recommendation generation
- Savings calculations
- Excel report generation
- Jupyter notebook generation
"""
import json
import os
import tempfile
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest


class TestLambdaRecommendations:
    """Tests for Lambda recommendation logic"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_generate_lambda_recommendations_reduce_memory(self, optimizer):
        """Test recommendation to reduce memory when duration utilization is low"""
        metrics = {
            'Duration_Average': {'mean': 100},
            'Duration_Maximum': {'max': 200},
            'ConcurrentExecutions_Maximum': {'max': 5},
        }

        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=1024,
            current_timeout=60,
            architecture='x86_64',
            metrics=metrics,
            duration_util=15.0,  # Below 20% threshold
            error_rate=0.5
        )

        # Should recommend reducing memory
        memory_rec = next((r for r in recommendations if r['action'] == 'reduce_memory'), None)
        assert memory_rec is not None
        assert memory_rec['current'] == 1024
        assert memory_rec['recommended'] == 512
        assert memory_rec['risk'] == 'low'

    def test_generate_lambda_recommendations_switch_to_arm64(self, optimizer):
        """Test recommendation to switch to ARM64"""
        metrics = {
            'Duration_Average': {'mean': 100},
            'Duration_Maximum': {'max': 200},
            'ConcurrentExecutions_Maximum': {'max': 50},
        }

        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=512,
            current_timeout=30,
            architecture='x86_64',
            metrics=metrics,
            duration_util=50.0,
            error_rate=0.1
        )

        # Should recommend ARM64
        arm_rec = next((r for r in recommendations if r['action'] == 'switch_to_arm64'), None)
        assert arm_rec is not None
        assert arm_rec['current'] == 'x86_64'
        assert arm_rec['recommended'] == 'arm64'

    def test_generate_lambda_recommendations_no_arm_when_already_arm64(self, optimizer):
        """Test no ARM recommendation when already using ARM64"""
        metrics = {
            'Duration_Average': {'mean': 100},
            'Duration_Maximum': {'max': 200},
            'ConcurrentExecutions_Maximum': {'max': 50},
        }

        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=512,
            current_timeout=30,
            architecture='arm64',
            metrics=metrics,
            duration_util=50.0,
            error_rate=0.1
        )

        # Should NOT recommend ARM64
        arm_rec = next((r for r in recommendations if r['action'] == 'switch_to_arm64'), None)
        assert arm_rec is None

    def test_generate_lambda_recommendations_reduce_timeout(self, optimizer):
        """Test recommendation to reduce timeout"""
        metrics = {
            'Duration_Average': {'mean': 100},
            'Duration_Maximum': {'max': 5000},  # 5 seconds max
            'ConcurrentExecutions_Maximum': {'max': 50},
        }

        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=512,
            current_timeout=300,  # 5 minutes, way too long
            architecture='arm64',
            metrics=metrics,
            duration_util=1.7,
            error_rate=0.1
        )

        # Should recommend reducing timeout
        timeout_rec = next((r for r in recommendations if r['action'] == 'reduce_timeout'), None)
        assert timeout_rec is not None
        assert timeout_rec['current'] == 300
        assert timeout_rec['recommended'] <= 30  # Should be around 10s (5s * 2)

    def test_generate_lambda_recommendations_review_concurrency(self, optimizer):
        """Test recommendation to review reserved concurrency for low usage"""
        metrics = {
            'Duration_Average': {'mean': 100},
            'Duration_Maximum': {'max': 200},
            'ConcurrentExecutions_Maximum': {'max': 5},  # Below 10 threshold
        }

        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=512,
            current_timeout=30,
            architecture='arm64',
            metrics=metrics,
            duration_util=50.0,
            error_rate=0.1
        )

        # Should recommend reviewing concurrency
        conc_rec = next((r for r in recommendations if r['action'] == 'review_reserved_concurrency'), None)
        assert conc_rec is not None
        assert conc_rec['current_max_concurrent'] == 5

    def test_generate_lambda_recommendations_investigate_errors(self, optimizer):
        """Test recommendation to investigate high error rate"""
        metrics = {
            'Duration_Average': {'mean': 100},
            'Duration_Maximum': {'max': 200},
            'ConcurrentExecutions_Maximum': {'max': 50},
        }

        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=512,
            current_timeout=30,
            architecture='arm64',
            metrics=metrics,
            duration_util=50.0,
            error_rate=5.0  # Above 1% threshold
        )

        # Should recommend investigating errors
        error_rec = next((r for r in recommendations if r['action'] == 'investigate_errors'), None)
        assert error_rec is not None
        assert error_rec['current_error_rate'] == 5.0
        assert error_rec['risk'] == 'high'
        assert error_rec['priority'] == 'immediate'

    def test_estimate_lambda_memory_savings(self, optimizer):
        """Test Lambda memory savings calculation"""
        metrics = {
            'Invocations_Sum': {'mean': 1000},  # 1000 invocations per hour avg
            'Duration_Average': {'mean': 500},  # 500ms average
        }

        savings = optimizer._estimate_lambda_memory_savings(
            current_memory=1024,
            new_memory=512,
            metrics=metrics
        )

        # Should have positive savings when reducing memory
        assert savings > 0

    def test_estimate_lambda_memory_savings_no_change(self, optimizer):
        """Test Lambda memory savings with no change"""
        metrics = {
            'Invocations_Sum': {'mean': 1000},
            'Duration_Average': {'mean': 500},
        }

        savings = optimizer._estimate_lambda_memory_savings(
            current_memory=512,
            new_memory=512,
            metrics=metrics
        )

        # No change = no savings
        assert savings == 0

    def test_calculate_lambda_savings(self, optimizer):
        """Test total Lambda savings calculation"""
        recommendations = [
            {'action': 'reduce_memory', 'estimated_monthly_savings': 50.0},
            {'action': 'switch_to_arm64', 'estimated_monthly_savings': 20.0},
            {'action': 'review_concurrency'}  # No savings field
        ]

        total_savings = optimizer._calculate_lambda_savings(
            function_name='test-function',
            current_memory=1024,
            metrics={},
            recommendations=recommendations
        )

        assert total_savings == 70.0


class TestDynamoDBRecommendations:
    """Tests for DynamoDB recommendation logic"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_generate_dynamodb_recommendations_convert_to_on_demand(self, optimizer):
        """Test recommendation to convert to on-demand when utilization is low"""
        metrics = {
            'ConsumedReadCapacityUnits': {'mean': 10},
            'ConsumedWriteCapacityUnits': {'mean': 5},
            'ReadThrottleEvents': {'sum': 0},
            'WriteThrottleEvents': {'sum': 0},
        }

        # Mock describe_continuous_backups
        optimizer.dynamodb_client = MagicMock()
        optimizer.dynamodb_client.describe_continuous_backups.return_value = {
            'ContinuousBackupsDescription': {
                'PointInTimeRecoveryDescription': {
                    'PointInTimeRecoveryStatus': 'ENABLED'
                }
            }
        }

        recommendations = optimizer._generate_dynamodb_recommendations(
            table_name='test-table',
            billing_mode='PROVISIONED',
            provisioned_rcu=1000,
            provisioned_wcu=500,
            metrics=metrics,
            read_util=1.0,  # 1% utilization - very low
            write_util=1.0
        )

        # Should recommend converting to on-demand
        on_demand_rec = next((r for r in recommendations if r['action'] == 'convert_to_on_demand'), None)
        assert on_demand_rec is not None
        assert on_demand_rec['current_mode'] == 'PROVISIONED'
        assert on_demand_rec['estimated_monthly_savings'] > 0

    def test_generate_dynamodb_recommendations_throttling(self, optimizer):
        """Test recommendation when throttling is detected"""
        metrics = {
            'ConsumedReadCapacityUnits': {'mean': 800},
            'ConsumedWriteCapacityUnits': {'mean': 400},
            'ReadThrottleEvents': {'sum': 100},
            'WriteThrottleEvents': {'sum': 50},
        }

        optimizer.dynamodb_client = MagicMock()
        optimizer.dynamodb_client.describe_continuous_backups.return_value = {
            'ContinuousBackupsDescription': {
                'PointInTimeRecoveryDescription': {
                    'PointInTimeRecoveryStatus': 'ENABLED'
                }
            }
        }

        recommendations = optimizer._generate_dynamodb_recommendations(
            table_name='test-table',
            billing_mode='PROVISIONED',
            provisioned_rcu=1000,
            provisioned_wcu=500,
            metrics=metrics,
            read_util=80.0,
            write_util=80.0
        )

        # Should recommend investigating throttling
        throttle_rec = next((r for r in recommendations if r['action'] == 'investigate_throttling'), None)
        assert throttle_rec is not None
        assert throttle_rec['throttle_events'] == 150
        assert throttle_rec['risk'] == 'medium'

    def test_generate_dynamodb_recommendations_enable_pitr(self, optimizer):
        """Test recommendation to enable PITR when disabled"""
        metrics = {
            'ConsumedReadCapacityUnits': {'mean': 500},
            'ConsumedWriteCapacityUnits': {'mean': 250},
            'ReadThrottleEvents': {'sum': 0},
            'WriteThrottleEvents': {'sum': 0},
        }

        optimizer.dynamodb_client = MagicMock()
        optimizer.dynamodb_client.describe_continuous_backups.return_value = {
            'ContinuousBackupsDescription': {
                'PointInTimeRecoveryDescription': {
                    'PointInTimeRecoveryStatus': 'DISABLED'
                }
            }
        }

        recommendations = optimizer._generate_dynamodb_recommendations(
            table_name='test-table',
            billing_mode='PROVISIONED',
            provisioned_rcu=1000,
            provisioned_wcu=500,
            metrics=metrics,
            read_util=50.0,
            write_util=50.0
        )

        # Should recommend enabling PITR
        pitr_rec = next((r for r in recommendations if r['action'] == 'enable_pitr'), None)
        assert pitr_rec is not None
        assert pitr_rec['risk'] == 'none'

    def test_calculate_dynamodb_savings(self, optimizer):
        """Test DynamoDB savings calculation"""
        recommendations = [
            {'action': 'convert_to_on_demand', 'estimated_monthly_savings': 100.0},
            {'action': 'enable_pitr', 'estimated_monthly_savings': 0},
        ]

        total_savings = optimizer._calculate_dynamodb_savings(
            billing_mode='PROVISIONED',
            provisioned_rcu=1000,
            provisioned_wcu=500,
            metrics={},
            recommendations=recommendations
        )

        assert total_savings == 100.0


class TestEC2Recommendations:
    """Tests for EC2 ASG recommendation logic"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_generate_ec2_recommendations_downsize(self, optimizer):
        """Test recommendation to downsize instance when CPU is low"""
        asg_info = {
            'DesiredCapacity': 3,
            'MinSize': 1,
            'MaxSize': 10,
        }
        metrics = {
            'CPUUtilization_Average': {'mean': 15, 'p95': 25},  # Below 30% threshold
            'GroupInServiceInstances_Average': {'mean': 3},
        }

        recommendations = optimizer._generate_ec2_recommendations(
            asg_info=asg_info,
            instance_type='t3.large',
            metrics=metrics
        )

        # Should recommend downsizing
        downsize_rec = next((r for r in recommendations if r['action'] == 'downsize_instance_type'), None)
        assert downsize_rec is not None
        assert downsize_rec['current'] == 't3.large'
        assert downsize_rec['recommended'] == 't3.medium'

    def test_generate_ec2_recommendations_reduce_capacity(self, optimizer):
        """Test recommendation to reduce ASG capacity"""
        asg_info = {
            'DesiredCapacity': 10,
            'MinSize': 2,
            'MaxSize': 20,
        }
        metrics = {
            'CPUUtilization_Average': {'mean': 50, 'p95': 60},
            'GroupInServiceInstances_Average': {'mean': 5},  # Much less than desired
        }

        recommendations = optimizer._generate_ec2_recommendations(
            asg_info=asg_info,
            instance_type='t3.medium',
            metrics=metrics
        )

        # Should recommend reducing capacity
        capacity_rec = next((r for r in recommendations if r['action'] == 'reduce_asg_capacity'), None)
        assert capacity_rec is not None
        assert capacity_rec['current_desired'] == 10
        assert capacity_rec['recommended_desired'] < 10

    def test_generate_ec2_recommendations_graviton(self, optimizer):
        """Test recommendation to migrate to Graviton"""
        asg_info = {
            'DesiredCapacity': 3,
            'MinSize': 1,
            'MaxSize': 10,
        }
        metrics = {
            'CPUUtilization_Average': {'mean': 50, 'p95': 60},
            'GroupInServiceInstances_Average': {'mean': 3},
        }

        recommendations = optimizer._generate_ec2_recommendations(
            asg_info=asg_info,
            instance_type='t3.medium',
            metrics=metrics
        )

        # Should recommend Graviton
        graviton_rec = next((r for r in recommendations if r['action'] == 'migrate_to_graviton'), None)
        assert graviton_rec is not None
        assert graviton_rec['current'] == 't3.medium'
        assert graviton_rec['recommended'] == 't4g.medium'

    def test_generate_ec2_recommendations_c5_to_c6g(self, optimizer):
        """Test recommendation to migrate C5 to C6g (Graviton)"""
        asg_info = {
            'DesiredCapacity': 3,
            'MinSize': 1,
            'MaxSize': 10,
        }
        metrics = {
            'CPUUtilization_Average': {'mean': 50, 'p95': 60},
            'GroupInServiceInstances_Average': {'mean': 3},
        }

        recommendations = optimizer._generate_ec2_recommendations(
            asg_info=asg_info,
            instance_type='c5.large',
            metrics=metrics
        )

        # Should recommend Graviton
        graviton_rec = next((r for r in recommendations if r['action'] == 'migrate_to_graviton'), None)
        assert graviton_rec is not None
        assert graviton_rec['recommended'] == 'c6g.large'

    def test_calculate_ec2_savings(self, optimizer):
        """Test EC2 savings calculation"""
        asg_info = {'DesiredCapacity': 3}
        recommendations = [
            {'action': 'downsize_instance_type', 'estimated_monthly_savings': 150.0},
            {'action': 'migrate_to_graviton', 'estimated_monthly_savings': 50.0},
        ]

        total_savings = optimizer._calculate_ec2_savings(
            asg_info=asg_info,
            instance_type='t3.large',
            recommendations=recommendations
        )

        assert total_savings == 200.0


class TestSQSRecommendations:
    """Tests for SQS recommendation logic"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_generate_sqs_recommendations_message_age(self, optimizer):
        """Test recommendation when messages are aging"""
        attrs = {
            'VisibilityTimeout': '300',
            'RedrivePolicy': '{"deadLetterTargetArn": "arn:aws:sqs:..."}'
        }
        metrics = {
            'ApproximateAgeOfOldestMessage': {'max': 600},  # Above 300s threshold
        }

        recommendations = optimizer._generate_sqs_recommendations(
            queue_name='payment-queue',
            attrs=attrs,
            metrics=metrics
        )

        # Should recommend investigating message processing
        age_rec = next((r for r in recommendations if r['action'] == 'investigate_message_processing'), None)
        assert age_rec is not None
        assert age_rec['max_message_age'] == 600
        assert age_rec['risk'] == 'medium'

    def test_generate_sqs_recommendations_configure_dlq(self, optimizer):
        """Test recommendation to configure DLQ when missing"""
        attrs = {
            'VisibilityTimeout': '300',
            # No RedrivePolicy
        }
        metrics = {
            'ApproximateAgeOfOldestMessage': {'max': 100},
        }

        recommendations = optimizer._generate_sqs_recommendations(
            queue_name='payment-queue',
            attrs=attrs,
            metrics=metrics
        )

        # Should recommend configuring DLQ
        dlq_rec = next((r for r in recommendations if r['action'] == 'configure_dlq'), None)
        assert dlq_rec is not None
        assert dlq_rec['risk'] == 'none'

    def test_generate_sqs_recommendations_skip_dlq_for_dlq_queue(self, optimizer):
        """Test that DLQ recommendation is skipped for DLQ queues"""
        attrs = {
            'VisibilityTimeout': '300',
        }
        metrics = {
            'ApproximateAgeOfOldestMessage': {'max': 100},
        }

        recommendations = optimizer._generate_sqs_recommendations(
            queue_name='payment-dlq',  # DLQ queue
            attrs=attrs,
            metrics=metrics
        )

        # Should NOT recommend configuring DLQ for a DLQ
        dlq_rec = next((r for r in recommendations if r['action'] == 'configure_dlq'), None)
        assert dlq_rec is None

    def test_generate_sqs_recommendations_visibility_timeout(self, optimizer):
        """Test recommendation to increase visibility timeout"""
        attrs = {
            'VisibilityTimeout': '30',  # Below 60s
            'RedrivePolicy': '{}'
        }
        metrics = {
            'ApproximateAgeOfOldestMessage': {'max': 100},
        }

        recommendations = optimizer._generate_sqs_recommendations(
            queue_name='payment-queue',
            attrs=attrs,
            metrics=metrics
        )

        # Should recommend increasing visibility timeout
        timeout_rec = next((r for r in recommendations if r['action'] == 'increase_visibility_timeout'), None)
        assert timeout_rec is not None
        assert timeout_rec['current'] == 30
        assert timeout_rec['recommended'] == 300


class TestReportGeneration:
    """Tests for report generation"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_generate_excel_report(self, optimizer):
        """Test Excel report generation"""
        analysis_results = {
            'lambda': {
                'payment-processor': {
                    'current_config': {'memory_size': 512, 'architecture': 'arm64'},
                    'recommendations': [
                        {'action': 'switch_to_arm64', 'current': 'x86_64', 'recommended': 'arm64',
                         'risk': 'low', 'estimated_monthly_savings': 20.0}
                    ],
                    'estimated_savings': 20.0
                }
            },
            'dynamodb': {
                'table_name': 'payments',
                'current_config': {'billing_mode': 'PAY_PER_REQUEST'},
                'recommendations': [],
                'estimated_savings': 0
            },
            'ec2': {
                'asg_name': 'payment-asg',
                'current_config': {'instance_type': 't3.small'},
                'recommendations': [
                    {'action': 'migrate_to_graviton', 'current': 't3.small', 'recommended': 't4g.small',
                     'risk': 'medium', 'estimated_monthly_savings': 30.0}
                ],
                'estimated_savings': 30.0
            },
            'cloudwatch_logs': {
                '/aws/lambda/payment-processor': {
                    'log_group': '/aws/lambda/payment-processor',
                    'current_config': {'retention_days': None},
                    'recommendations': [
                        {'action': 'set_retention_policy', 'current': 'Never expires',
                         'recommended': 7, 'risk': 'low', 'estimated_monthly_savings': 5.0}
                    ]
                }
            }
        }

        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
            output_file = f.name

        try:
            result = optimizer.generate_excel_report(analysis_results, output_file)
            assert result == output_file
            assert os.path.exists(output_file)
            assert os.path.getsize(output_file) > 0
        finally:
            if os.path.exists(output_file):
                os.unlink(output_file)

    def test_generate_jupyter_notebook(self, optimizer):
        """Test Jupyter notebook generation"""
        analysis_results = {
            'lambda': {
                'payment-processor': {
                    'current_config': {'memory_size': 512, 'architecture': 'arm64'},
                    'recommendations': [],
                    'estimated_savings': 0
                }
            },
            'dynamodb': {
                'table_name': 'payments',
                'current_config': {'billing_mode': 'PAY_PER_REQUEST'},
                'recommendations': [],
                'estimated_savings': 0
            },
        }

        with tempfile.NamedTemporaryFile(suffix='.ipynb', delete=False) as f:
            output_file = f.name

        try:
            result = optimizer.generate_jupyter_notebook(analysis_results, output_file)
            assert result == output_file
            assert os.path.exists(output_file)

            # Verify it's valid JSON
            with open(output_file, 'r') as f:
                notebook = json.load(f)
                assert 'cells' in notebook
                assert 'metadata' in notebook
                assert notebook['nbformat'] == 4
        finally:
            if os.path.exists(output_file):
                os.unlink(output_file)


class TestOptimizerInitialization:
    """Tests for optimizer initialization"""

    def test_optimizer_init_with_region(self):
        """Test optimizer initialization with explicit region"""
        with patch('boto3.Session'):
            with patch('boto3.client') as mock_client:
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='eu-west-1')
                assert opt.region_name == 'eu-west-1'

    def test_optimizer_init_default_region(self):
        """Test optimizer initialization with default region"""
        with patch('boto3.Session') as mock_session:
            mock_session.return_value.region_name = None
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer()
                # Should default to us-east-1 when no region is configured
                assert opt.region_name == 'us-east-1'

    def test_optimizer_thresholds(self):
        """Test that optimizer has correct thresholds configured"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')

                # Lambda thresholds
                assert opt.thresholds['lambda']['memory_utilization_low'] == 30
                assert opt.thresholds['lambda']['memory_utilization_high'] == 80
                assert opt.thresholds['lambda']['error_rate_threshold'] == 1

                # DynamoDB thresholds
                assert opt.thresholds['dynamodb']['consumed_ratio_low'] == 0.2
                assert opt.thresholds['dynamodb']['throttle_threshold'] == 0.01

                # EC2 thresholds
                assert opt.thresholds['ec2']['cpu_p95_low'] == 30
                assert opt.thresholds['ec2']['cpu_p95_high'] == 75

                # SQS thresholds
                assert opt.thresholds['sqs']['message_age_threshold'] == 300

                # SLA thresholds
                assert opt.thresholds['sla']['error_rate_threshold'] == 0.01
                assert opt.thresholds['sla']['availability_threshold'] == 99.9

    def test_optimizer_instance_sizes(self):
        """Test that optimizer has correct instance size mappings"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')

                assert 't3' in opt.instance_sizes
                assert 't3a' in opt.instance_sizes
                assert 'c6i' in opt.instance_sizes
                assert 'micro' in opt.instance_sizes['t3']
                assert 'small' in opt.instance_sizes['t3']

    def test_optimizer_hourly_costs(self):
        """Test that optimizer has correct hourly cost data"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')

                assert opt.hourly_costs['t3.micro'] == 0.0104
                assert opt.hourly_costs['t3.small'] == 0.0208
                assert opt.hourly_costs['dynamodb_rcu'] == 0.00013
                assert opt.hourly_costs['sqs_request'] == 0.0000004


class TestLambdaAnalysis:
    """Tests for Lambda function analysis methods"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_analyze_lambda_functions_success(self, optimizer):
        """Test successful Lambda function analysis"""
        import pandas as pd

        # Mock Lambda client
        optimizer.lambda_client = MagicMock()
        optimizer.lambda_client.get_function_configuration.return_value = {
            'MemorySize': 512,
            'Timeout': 30,
            'Runtime': 'python3.11',
            'Architectures': ['arm64']
        }

        # Mock CloudWatch client
        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Sum': 100, 'Timestamp': '2024-01-01'},
                {'Sum': 150, 'Timestamp': '2024-01-02'},
            ]
        }

        results = optimizer.analyze_lambda_functions(['test-function'])

        assert 'test-function' in results
        assert 'current_config' in results['test-function']
        assert results['test-function']['current_config']['memory_size'] == 512

    def test_analyze_lambda_functions_not_found(self, optimizer):
        """Test Lambda function not found error"""
        from botocore.exceptions import ClientError

        optimizer.lambda_client = MagicMock()
        optimizer.lambda_client.get_function_configuration.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Not found'}},
            'GetFunctionConfiguration'
        )

        results = optimizer.analyze_lambda_functions(['nonexistent-function'])

        assert 'nonexistent-function' in results
        assert 'error' in results['nonexistent-function']

    def test_analyze_lambda_functions_other_error(self, optimizer):
        """Test Lambda function analysis with other errors"""
        from botocore.exceptions import ClientError

        optimizer.lambda_client = MagicMock()
        optimizer.lambda_client.get_function_configuration.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetFunctionConfiguration'
        )

        results = optimizer.analyze_lambda_functions(['test-function'])

        assert 'test-function' in results
        assert 'error' in results['test-function']

    def test_analyze_lambda_functions_with_metrics(self, optimizer):
        """Test Lambda analysis with various metrics"""
        optimizer.lambda_client = MagicMock()
        optimizer.lambda_client.get_function_configuration.return_value = {
            'MemorySize': 1024,
            'Timeout': 60,
            'Runtime': 'python3.11',
            'Architectures': ['x86_64']
        }

        # Mock CloudWatch with datapoints
        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Average': 500, 'Sum': 1000, 'Maximum': 800, 'Timestamp': '2024-01-01'},
                {'Average': 600, 'Sum': 1200, 'Maximum': 900, 'Timestamp': '2024-01-02'},
            ]
        }

        results = optimizer.analyze_lambda_functions(['payment-processor'])

        assert 'payment-processor' in results
        assert 'utilization' in results['payment-processor']
        assert 'recommendations' in results['payment-processor']


class TestDynamoDBAnalysis:
    """Tests for DynamoDB table analysis methods"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_analyze_dynamodb_table_success(self, optimizer):
        """Test successful DynamoDB table analysis"""
        optimizer.dynamodb_client = MagicMock()
        optimizer.dynamodb_client.describe_table.return_value = {
            'Table': {
                'TableName': 'test-table',
                'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 0, 'WriteCapacityUnits': 0},
                'TableStatus': 'ACTIVE',
                'ItemCount': 1000,
                'TableSizeBytes': 50000,
                'GlobalSecondaryIndexes': []
            }
        }
        optimizer.dynamodb_client.describe_continuous_backups.return_value = {
            'ContinuousBackupsDescription': {
                'PointInTimeRecoveryDescription': {
                    'PointInTimeRecoveryStatus': 'ENABLED'
                }
            }
        }

        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [{'Sum': 100, 'Timestamp': '2024-01-01'}]
        }

        result = optimizer.analyze_dynamodb_table('test-table')

        assert result['table_name'] == 'test-table'
        assert 'current_config' in result
        assert result['current_config']['billing_mode'] == 'PAY_PER_REQUEST'

    def test_analyze_dynamodb_table_provisioned(self, optimizer):
        """Test DynamoDB table analysis with provisioned mode"""
        optimizer.dynamodb_client = MagicMock()
        optimizer.dynamodb_client.describe_table.return_value = {
            'Table': {
                'TableName': 'provisioned-table',
                'BillingModeSummary': {'BillingMode': 'PROVISIONED'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 100, 'WriteCapacityUnits': 50},
                'TableStatus': 'ACTIVE',
                'ItemCount': 5000,
                'TableSizeBytes': 100000,
                'GlobalSecondaryIndexes': [{'IndexName': 'gsi-1'}]
            }
        }
        optimizer.dynamodb_client.describe_continuous_backups.return_value = {
            'ContinuousBackupsDescription': {
                'PointInTimeRecoveryDescription': {
                    'PointInTimeRecoveryStatus': 'DISABLED'
                }
            }
        }

        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [{'Sum': 10, 'Timestamp': '2024-01-01'}]
        }

        result = optimizer.analyze_dynamodb_table('provisioned-table')

        assert result['current_config']['billing_mode'] == 'PROVISIONED'
        assert result['current_config']['provisioned_rcu'] == 100
        assert result['current_config']['gsi_count'] == 1

    def test_analyze_dynamodb_table_error(self, optimizer):
        """Test DynamoDB table analysis with error"""
        from botocore.exceptions import ClientError

        optimizer.dynamodb_client = MagicMock()
        optimizer.dynamodb_client.describe_table.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Not found'}},
            'DescribeTable'
        )

        result = optimizer.analyze_dynamodb_table('nonexistent-table')

        assert 'error' in result


class TestEC2Analysis:
    """Tests for EC2 ASG analysis methods"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_analyze_ec2_autoscaling_success(self, optimizer):
        """Test successful EC2 ASG analysis"""
        optimizer.autoscaling_client = MagicMock()
        optimizer.autoscaling_client.describe_auto_scaling_groups.return_value = {
            'AutoScalingGroups': [{
                'AutoScalingGroupName': 'test-asg',
                'DesiredCapacity': 2,
                'MinSize': 1,
                'MaxSize': 5,
                'AvailabilityZones': ['us-east-1a', 'us-east-1b'],
                'LaunchTemplate': {
                    'LaunchTemplateId': 'lt-123',
                    'Version': '1'
                }
            }]
        }

        optimizer.ec2_client = MagicMock()
        optimizer.ec2_client.describe_launch_template_versions.return_value = {
            'LaunchTemplateVersions': [{
                'LaunchTemplateData': {'InstanceType': 't3.medium'}
            }]
        }

        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [{'Average': 45, 'Maximum': 60, 'Timestamp': '2024-01-01'}]
        }

        result = optimizer.analyze_ec2_autoscaling('test-asg')

        assert result['asg_name'] == 'test-asg'
        assert result['current_config']['instance_type'] == 't3.medium'
        assert result['current_config']['desired_capacity'] == 2

    def test_analyze_ec2_autoscaling_no_launch_template(self, optimizer):
        """Test EC2 ASG analysis without launch template"""
        optimizer.autoscaling_client = MagicMock()
        optimizer.autoscaling_client.describe_auto_scaling_groups.return_value = {
            'AutoScalingGroups': [{
                'AutoScalingGroupName': 'test-asg',
                'DesiredCapacity': 1,
                'MinSize': 1,
                'MaxSize': 3,
                'AvailabilityZones': ['us-east-1a']
            }]
        }

        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        result = optimizer.analyze_ec2_autoscaling('test-asg')

        assert result['current_config']['instance_type'] == 't3.small'

    def test_analyze_ec2_autoscaling_error(self, optimizer):
        """Test EC2 ASG analysis with error"""
        from botocore.exceptions import ClientError

        optimizer.autoscaling_client = MagicMock()
        optimizer.autoscaling_client.describe_auto_scaling_groups.side_effect = ClientError(
            {'Error': {'Code': 'ValidationError', 'Message': 'ASG not found'}},
            'DescribeAutoScalingGroups'
        )

        result = optimizer.analyze_ec2_autoscaling('nonexistent-asg')

        assert 'error' in result

    def test_analyze_ec2_launch_template_error(self, optimizer):
        """Test EC2 ASG analysis with launch template error"""
        from botocore.exceptions import ClientError

        optimizer.autoscaling_client = MagicMock()
        optimizer.autoscaling_client.describe_auto_scaling_groups.return_value = {
            'AutoScalingGroups': [{
                'AutoScalingGroupName': 'test-asg',
                'DesiredCapacity': 2,
                'MinSize': 1,
                'MaxSize': 5,
                'AvailabilityZones': ['us-east-1a'],
                'LaunchTemplate': {
                    'LaunchTemplateId': 'lt-123',
                    'Version': '1'
                }
            }]
        }

        optimizer.ec2_client = MagicMock()
        optimizer.ec2_client.describe_launch_template_versions.side_effect = ClientError(
            {'Error': {'Code': 'InvalidLaunchTemplateId', 'Message': 'Not found'}},
            'DescribeLaunchTemplateVersions'
        )

        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {'Datapoints': []}

        result = optimizer.analyze_ec2_autoscaling('test-asg')

        # Should fall back to default instance type
        assert result['current_config']['instance_type'] == 't3.small'


class TestSQSAnalysis:
    """Tests for SQS queue analysis methods"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_analyze_sqs_queues_success(self, optimizer):
        """Test successful SQS queue analysis"""
        optimizer.sqs_client = MagicMock()
        optimizer.sqs_client.get_queue_attributes.return_value = {
            'Attributes': {
                'VisibilityTimeout': '300',
                'MessageRetentionPeriod': '345600',
                'RedrivePolicy': '{"deadLetterTargetArn": "arn:aws:sqs:us-east-1:123:dlq"}'
            }
        }

        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [{'Sum': 100, 'Max': 50, 'Timestamp': '2024-01-01'}]
        }

        queue_url = 'https://sqs.us-east-1.amazonaws.com/123/payment-queue'
        results = optimizer.analyze_sqs_queues([queue_url])

        assert 'payment-queue' in results
        assert results['payment-queue']['current_config']['visibility_timeout'] == 300
        assert results['payment-queue']['current_config']['has_dlq'] is True

    def test_analyze_sqs_queues_error(self, optimizer):
        """Test SQS queue analysis with error"""
        from botocore.exceptions import ClientError

        optimizer.sqs_client = MagicMock()
        optimizer.sqs_client.get_queue_attributes.side_effect = ClientError(
            {'Error': {'Code': 'QueueDoesNotExist', 'Message': 'Queue not found'}},
            'GetQueueAttributes'
        )

        queue_url = 'https://sqs.us-east-1.amazonaws.com/123/nonexistent-queue'
        results = optimizer.analyze_sqs_queues([queue_url])

        # Error case stores result with full queue URL as key
        assert queue_url in results
        assert 'error' in results[queue_url]


class TestCloudWatchLogsAnalysis:
    """Tests for CloudWatch Logs analysis methods"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_analyze_cloudwatch_logs_success(self, optimizer):
        """Test successful CloudWatch Logs analysis"""
        optimizer.logs_client = MagicMock()
        optimizer.logs_client.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/lambda/test-function',
                'retentionInDays': None,
                'storedBytes': 1073741824  # 1GB
            }]
        }

        results = optimizer.analyze_cloudwatch_logs(['/aws/lambda/test-function'])

        assert '/aws/lambda/test-function' in results
        assert results['/aws/lambda/test-function']['current_config']['retention_days'] is None

    def test_analyze_cloudwatch_logs_with_retention(self, optimizer):
        """Test CloudWatch Logs analysis with retention set"""
        optimizer.logs_client = MagicMock()
        optimizer.logs_client.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/lambda/test-function',
                'retentionInDays': 7,
                'storedBytes': 500000000
            }]
        }

        results = optimizer.analyze_cloudwatch_logs(['/aws/lambda/test-function'])

        # Should not recommend setting retention if already 7 days or less
        recommendations = results['/aws/lambda/test-function']['recommendations']
        retention_rec = next((r for r in recommendations if r['action'] == 'set_retention_policy'), None)
        assert retention_rec is None

    def test_analyze_cloudwatch_logs_long_retention(self, optimizer):
        """Test CloudWatch Logs analysis with long retention"""
        optimizer.logs_client = MagicMock()
        optimizer.logs_client.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/lambda/test-function',
                'retentionInDays': 90,
                'storedBytes': 2000000000
            }]
        }

        results = optimizer.analyze_cloudwatch_logs(['/aws/lambda/test-function'])

        # Should recommend shorter retention
        recommendations = results['/aws/lambda/test-function']['recommendations']
        retention_rec = next((r for r in recommendations if r['action'] == 'set_retention_policy'), None)
        assert retention_rec is not None
        assert retention_rec['recommended'] == 7

    def test_analyze_cloudwatch_logs_error(self, optimizer):
        """Test CloudWatch Logs analysis with error"""
        from botocore.exceptions import ClientError

        optimizer.logs_client = MagicMock()
        optimizer.logs_client.describe_log_groups.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Not found'}},
            'DescribeLogGroups'
        )

        results = optimizer.analyze_cloudwatch_logs(['/aws/lambda/nonexistent'])

        # Should return empty dict for error case
        assert len(results) == 0

    def test_analyze_cloudwatch_logs_empty(self, optimizer):
        """Test CloudWatch Logs analysis with no matching log groups"""
        optimizer.logs_client = MagicMock()
        optimizer.logs_client.describe_log_groups.return_value = {
            'logGroups': []
        }

        results = optimizer.analyze_cloudwatch_logs(['/aws/lambda/nonexistent'])

        assert len(results) == 0


class TestSLACompliance:
    """Tests for SLA compliance checking"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_check_sla_compliance_pass(self, optimizer):
        """Test SLA compliance when all metrics pass"""
        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        result = optimizer.check_sla_compliance()

        assert result['compliant'] is True
        assert result['recommendation'] == 'CONTINUE_OPTIMIZATION'

    def test_check_sla_compliance_lambda_errors(self, optimizer):
        """Test SLA compliance with Lambda errors"""
        optimizer.cloudwatch_client = MagicMock()

        def mock_get_metrics(*args, **kwargs):
            if kwargs.get('MetricName') == 'Errors':
                return {'Datapoints': [{'Sum': 10}, {'Sum': 5}]}
            return {'Datapoints': []}

        optimizer.cloudwatch_client.get_metric_statistics.side_effect = mock_get_metrics

        result = optimizer.check_sla_compliance()

        assert result['compliant'] is False
        assert len(result['violations']) > 0
        assert result['recommendation'] == 'SCALE_UP'

    def test_check_sla_compliance_high_latency(self, optimizer):
        """Test SLA compliance with high API latency"""
        optimizer.cloudwatch_client = MagicMock()

        def mock_get_metrics(*args, **kwargs):
            if kwargs.get('MetricName') == 'Latency':
                return {'Datapoints': [{'Average': 600, 'Maximum': 800}]}
            return {'Datapoints': []}

        optimizer.cloudwatch_client.get_metric_statistics.side_effect = mock_get_metrics

        result = optimizer.check_sla_compliance()

        assert result['compliant'] is False
        assert any(v['metric'] == 'api_latency' for v in result['violations'])

    def test_check_sla_compliance_client_error(self, optimizer):
        """Test SLA compliance with client errors"""
        from botocore.exceptions import ClientError

        optimizer.cloudwatch_client = MagicMock()
        optimizer.cloudwatch_client.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        result = optimizer.check_sla_compliance()

        # Should still return a result even if metrics fail
        assert 'compliant' in result


class TestFullOptimization:
    """Tests for full optimization workflow"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_run_full_optimization_no_outputs_file(self, optimizer):
        """Test full optimization when outputs file doesn't exist"""
        import tempfile
        import os

        # Change to a temp directory without the outputs file
        original_dir = os.getcwd()
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            try:
                result = optimizer.run_full_optimization()
                assert result == {}
            finally:
                os.chdir(original_dir)

    def test_run_full_optimization_with_outputs(self, optimizer):
        """Test full optimization with outputs file"""
        import tempfile
        import os

        original_dir = os.getcwd()
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            try:
                # Create cfn-outputs directory and file
                os.makedirs('cfn-outputs')
                outputs = {
                    'PaymentProcessorFunctionName': 'payment-processor',
                    'EventHandlerFunctionName': 'event-handler',
                    'PaymentsTableName': 'payments-table',
                    'AsgName': 'payment-asg',
                    'PaymentQueueUrl': 'https://sqs.us-east-1.amazonaws.com/123/payment-queue',
                    'PaymentDlqUrl': 'https://sqs.us-east-1.amazonaws.com/123/payment-dlq'
                }
                with open('cfn-outputs/flat-outputs.json', 'w') as f:
                    json.dump(outputs, f)

                # Mock all AWS clients
                optimizer.cloudwatch_client = MagicMock()
                optimizer.cloudwatch_client.get_metric_statistics.return_value = {'Datapoints': []}

                optimizer.lambda_client = MagicMock()
                optimizer.lambda_client.get_function_configuration.return_value = {
                    'MemorySize': 512, 'Timeout': 30, 'Runtime': 'python3.11', 'Architectures': ['arm64']
                }

                optimizer.dynamodb_client = MagicMock()
                optimizer.dynamodb_client.describe_table.return_value = {
                    'Table': {
                        'TableName': 'payments-table',
                        'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'},
                        'ProvisionedThroughput': {'ReadCapacityUnits': 0, 'WriteCapacityUnits': 0},
                        'TableStatus': 'ACTIVE',
                        'ItemCount': 1000,
                        'TableSizeBytes': 50000,
                        'GlobalSecondaryIndexes': []
                    }
                }
                optimizer.dynamodb_client.describe_continuous_backups.return_value = {
                    'ContinuousBackupsDescription': {
                        'PointInTimeRecoveryDescription': {'PointInTimeRecoveryStatus': 'ENABLED'}
                    }
                }

                optimizer.autoscaling_client = MagicMock()
                optimizer.autoscaling_client.describe_auto_scaling_groups.return_value = {
                    'AutoScalingGroups': [{
                        'AutoScalingGroupName': 'payment-asg',
                        'DesiredCapacity': 1, 'MinSize': 1, 'MaxSize': 3,
                        'AvailabilityZones': ['us-east-1a']
                    }]
                }

                optimizer.sqs_client = MagicMock()
                optimizer.sqs_client.get_queue_attributes.return_value = {
                    'Attributes': {'VisibilityTimeout': '300', 'MessageRetentionPeriod': '345600'}
                }

                optimizer.logs_client = MagicMock()
                optimizer.logs_client.describe_log_groups.return_value = {'logGroups': []}

                result = optimizer.run_full_optimization()

                assert 'sla_status' in result
                assert 'lambda' in result
                assert 'dynamodb' in result
                assert 'ec2' in result
                assert 'sqs' in result

                # Clean up generated files
                if os.path.exists('payment_optimization_report.xlsx'):
                    os.unlink('payment_optimization_report.xlsx')
                if os.path.exists('payment_optimization_analysis.ipynb'):
                    os.unlink('payment_optimization_analysis.ipynb')
                if os.path.exists('payment_optimization.log'):
                    os.unlink('payment_optimization.log')
            finally:
                os.chdir(original_dir)

    def test_run_full_optimization_partial_outputs(self, optimizer):
        """Test full optimization with partial outputs file"""
        import tempfile
        import os

        original_dir = os.getcwd()
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            try:
                # Create cfn-outputs directory with minimal outputs
                os.makedirs('cfn-outputs')
                outputs = {}  # Empty outputs
                with open('cfn-outputs/flat-outputs.json', 'w') as f:
                    json.dump(outputs, f)

                # Mock clients
                optimizer.cloudwatch_client = MagicMock()
                optimizer.cloudwatch_client.get_metric_statistics.return_value = {'Datapoints': []}
                optimizer.logs_client = MagicMock()
                optimizer.logs_client.describe_log_groups.return_value = {'logGroups': []}

                result = optimizer.run_full_optimization()

                # Should handle missing resources gracefully
                assert 'sla_status' in result
                assert 'lambda' in result
                assert result['lambda'] == {}

                # Clean up
                if os.path.exists('payment_optimization_report.xlsx'):
                    os.unlink('payment_optimization_report.xlsx')
                if os.path.exists('payment_optimization_analysis.ipynb'):
                    os.unlink('payment_optimization_analysis.ipynb')
                if os.path.exists('payment_optimization.log'):
                    os.unlink('payment_optimization.log')
            finally:
                os.chdir(original_dir)


class TestEdgeCases:
    """Tests for edge cases and error handling"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with mocked AWS clients"""
        with patch('boto3.Session'):
            with patch('boto3.client'):
                from lib.optimize import PaymentPlatformOptimizer
                opt = PaymentPlatformOptimizer(region_name='us-east-1')
                return opt

    def test_lambda_recommendations_empty_metrics(self, optimizer):
        """Test Lambda recommendations with empty metrics"""
        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=512,
            current_timeout=30,
            architecture='arm64',
            metrics={},
            duration_util=0,
            error_rate=0
        )

        # Should still return some recommendations (e.g., concurrency review)
        assert isinstance(recommendations, list)

    def test_lambda_savings_empty_recommendations(self, optimizer):
        """Test Lambda savings with empty recommendations"""
        savings = optimizer._calculate_lambda_savings(
            function_name='test',
            current_memory=512,
            metrics={},
            recommendations=[]
        )
        assert savings == 0

    def test_dynamodb_savings_empty_recommendations(self, optimizer):
        """Test DynamoDB savings with empty recommendations"""
        savings = optimizer._calculate_dynamodb_savings(
            billing_mode='PAY_PER_REQUEST',
            provisioned_rcu=0,
            provisioned_wcu=0,
            metrics={},
            recommendations=[]
        )
        assert savings == 0

    def test_ec2_savings_empty_recommendations(self, optimizer):
        """Test EC2 savings with empty recommendations"""
        savings = optimizer._calculate_ec2_savings(
            asg_info={'DesiredCapacity': 1},
            instance_type='t3.small',
            recommendations=[]
        )
        assert savings == 0

    def test_lambda_no_memory_reduction_for_small_memory(self, optimizer):
        """Test that memory reduction is not recommended for already small memory"""
        metrics = {
            'Duration_Average': {'mean': 100},
            'Duration_Maximum': {'max': 200},
            'ConcurrentExecutions_Maximum': {'max': 50},
        }

        recommendations = optimizer._generate_lambda_recommendations(
            function_name='test-function',
            current_memory=256,  # Already small
            current_timeout=30,
            architecture='arm64',
            metrics=metrics,
            duration_util=10.0,  # Low utilization but memory already small
            error_rate=0.1
        )

        # Should NOT recommend reducing memory when already at 256MB or less
        memory_rec = next((r for r in recommendations if r['action'] == 'reduce_memory'), None)
        assert memory_rec is None

    def test_ec2_downsize_for_t3a_family(self, optimizer):
        """Test EC2 downsizing for t3a instance family"""
        asg_info = {
            'DesiredCapacity': 3,
            'MinSize': 1,
            'MaxSize': 10,
        }
        metrics = {
            'CPUUtilization_Average': {'mean': 15, 'p95': 20},
            'GroupInServiceInstances_Average': {'mean': 3},
        }

        recommendations = optimizer._generate_ec2_recommendations(
            asg_info=asg_info,
            instance_type='t3a.large',
            metrics=metrics
        )

        # Should recommend downsizing
        downsize_rec = next((r for r in recommendations if r['action'] == 'downsize_instance_type'), None)
        assert downsize_rec is not None
        assert downsize_rec['recommended'] == 't3a.medium'

    def test_ec2_no_downsize_for_smallest_size(self, optimizer):
        """Test that no downsize is recommended for smallest instance size"""
        asg_info = {
            'DesiredCapacity': 3,
            'MinSize': 1,
            'MaxSize': 10,
        }
        metrics = {
            'CPUUtilization_Average': {'mean': 15, 'p95': 20},
            'GroupInServiceInstances_Average': {'mean': 3},
        }

        recommendations = optimizer._generate_ec2_recommendations(
            asg_info=asg_info,
            instance_type='t3.micro',  # Already smallest
            metrics=metrics
        )

        # Should NOT recommend downsizing for micro instances
        downsize_rec = next((r for r in recommendations if r['action'] == 'downsize_instance_type'), None)
        assert downsize_rec is None

    def test_generate_excel_report_empty_results(self, optimizer):
        """Test Excel report with empty results"""
        analysis_results = {
            'lambda': {},
            'dynamodb': {},
            'ec2': {},
            'cloudwatch_logs': {}
        }

        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
            output_file = f.name

        try:
            result = optimizer.generate_excel_report(analysis_results, output_file)
            assert result == output_file
            assert os.path.exists(output_file)
        finally:
            if os.path.exists(output_file):
                os.unlink(output_file)

    def test_generate_jupyter_notebook_empty_results(self, optimizer):
        """Test Jupyter notebook with empty results"""
        analysis_results = {}

        with tempfile.NamedTemporaryFile(suffix='.ipynb', delete=False) as f:
            output_file = f.name

        try:
            result = optimizer.generate_jupyter_notebook(analysis_results, output_file)
            assert os.path.exists(output_file)
        finally:
            if os.path.exists(output_file):
                os.unlink(output_file)
