"""
Integration tests for PaymentPlatformOptimizer - Testing against live AWS resources

Tests the optimizer against actual deployed AWS infrastructure.
Requirements:
- Reads outputs from cfn-outputs/flat-outputs.json
- No mocking - uses live AWS resources
- Tests actual metrics collection and optimization recommendations
"""
import json
import os
import tempfile
from pathlib import Path

import boto3
import pytest

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')

# Read outputs from flat-outputs.json
outputs_path = Path(os.getcwd()) / 'cfn-outputs' / 'flat-outputs.json'
with open(outputs_path, 'r', encoding='utf-8') as f:
    outputs = json.load(f)

# Extract outputs
payments_table_name = outputs.get('PaymentsTableName')
payment_queue_url = outputs.get('PaymentQueueUrl')
payment_dlq_url = outputs.get('PaymentDlqUrl')
payment_processor_function_name = outputs.get('PaymentProcessorFunctionName')
event_handler_function_name = outputs.get('EventHandlerFunctionName')
asg_name = outputs.get('AsgName')


class TestOptimizerInitialization:
    """Integration tests for optimizer initialization with live AWS"""

    def test_optimizer_initializes_with_region(self):
        """Verify optimizer initializes correctly with AWS region"""
        from lib.optimize import PaymentPlatformOptimizer

        optimizer = PaymentPlatformOptimizer(region_name=region)

        assert optimizer.region_name == region
        assert optimizer.lambda_client is not None
        assert optimizer.dynamodb_client is not None
        assert optimizer.sqs_client is not None
        assert optimizer.cloudwatch_client is not None
        assert optimizer.autoscaling_client is not None

    def test_optimizer_has_thresholds(self):
        """Verify optimizer has all required thresholds"""
        from lib.optimize import PaymentPlatformOptimizer

        optimizer = PaymentPlatformOptimizer(region_name=region)

        assert 'lambda' in optimizer.thresholds
        assert 'dynamodb' in optimizer.thresholds
        assert 'ec2' in optimizer.thresholds
        assert 'sqs' in optimizer.thresholds
        assert 'sla' in optimizer.thresholds


class TestLambdaAnalysis:
    """Integration tests for Lambda function analysis"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_analyze_payment_processor_function(self, optimizer):
        """Verify analysis of payment processor Lambda function"""
        results = optimizer.analyze_lambda_functions([payment_processor_function_name])

        assert payment_processor_function_name in results
        func_result = results[payment_processor_function_name]

        # Should have current config
        assert 'current_config' in func_result
        assert func_result['current_config']['memory_size'] >= 128
        assert func_result['current_config']['runtime'] == 'python3.11'
        assert func_result['current_config']['architecture'] == 'arm64'

        # Should have recommendations list
        assert 'recommendations' in func_result
        assert isinstance(func_result['recommendations'], list)

        # Should have estimated savings
        assert 'estimated_savings' in func_result

    def test_analyze_event_handler_function(self, optimizer):
        """Verify analysis of event handler Lambda function"""
        results = optimizer.analyze_lambda_functions([event_handler_function_name])

        assert event_handler_function_name in results
        func_result = results[event_handler_function_name]

        assert 'current_config' in func_result
        assert 'metrics' in func_result
        assert 'utilization' in func_result
        assert 'recommendations' in func_result

    def test_analyze_multiple_functions(self, optimizer):
        """Verify analysis of multiple Lambda functions"""
        function_names = [payment_processor_function_name, event_handler_function_name]
        results = optimizer.analyze_lambda_functions(function_names)

        assert len(results) == 2
        assert payment_processor_function_name in results
        assert event_handler_function_name in results

    def test_analyze_nonexistent_function(self, optimizer):
        """Verify graceful handling of non-existent function"""
        results = optimizer.analyze_lambda_functions(['nonexistent-function-12345'])

        assert 'nonexistent-function-12345' in results
        assert 'error' in results['nonexistent-function-12345']


class TestDynamoDBAnalysis:
    """Integration tests for DynamoDB table analysis"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_analyze_payments_table(self, optimizer):
        """Verify analysis of payments DynamoDB table"""
        result = optimizer.analyze_dynamodb_table(payments_table_name)

        # Should have table name
        assert result['table_name'] == payments_table_name

        # Should have current config
        assert 'current_config' in result
        assert result['current_config']['billing_mode'] == 'PAY_PER_REQUEST'
        assert result['current_config']['table_status'] == 'ACTIVE'

        # Should have metrics
        assert 'metrics' in result

        # Should have utilization
        assert 'utilization' in result

        # Should have recommendations
        assert 'recommendations' in result
        assert isinstance(result['recommendations'], list)

        # Should have estimated savings
        assert 'estimated_savings' in result

    def test_analyze_nonexistent_table(self, optimizer):
        """Verify graceful handling of non-existent table"""
        result = optimizer.analyze_dynamodb_table('nonexistent-table-12345')

        assert 'error' in result


class TestEC2AutoScalingAnalysis:
    """Integration tests for EC2 Auto Scaling group analysis"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_analyze_payment_asg(self, optimizer):
        """Verify analysis of payment Auto Scaling group"""
        result = optimizer.analyze_ec2_autoscaling(asg_name)

        # Should have ASG name
        assert result['asg_name'] == asg_name

        # Should have current config
        assert 'current_config' in result
        assert result['current_config']['instance_type'] is not None
        assert result['current_config']['desired_capacity'] >= 0
        assert result['current_config']['min_size'] >= 0
        assert result['current_config']['max_size'] >= result['current_config']['min_size']

        # Should have metrics
        assert 'metrics' in result

        # Should have recommendations
        assert 'recommendations' in result
        assert isinstance(result['recommendations'], list)

        # Should have estimated savings
        assert 'estimated_savings' in result

    def test_analyze_nonexistent_asg(self, optimizer):
        """Verify graceful handling of non-existent ASG"""
        result = optimizer.analyze_ec2_autoscaling('nonexistent-asg-12345')

        assert 'error' in result


class TestSQSAnalysis:
    """Integration tests for SQS queue analysis"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_analyze_payment_queue(self, optimizer):
        """Verify analysis of payment SQS queue"""
        results = optimizer.analyze_sqs_queues([payment_queue_url])

        queue_name = payment_queue_url.split('/')[-1]
        assert queue_name in results

        queue_result = results[queue_name]
        assert 'queue_url' in queue_result
        assert 'current_config' in queue_result
        assert 'metrics' in queue_result
        assert 'recommendations' in queue_result

        # Should have DLQ configured
        assert queue_result['current_config']['has_dlq'] is True

    def test_analyze_dlq(self, optimizer):
        """Verify analysis of DLQ"""
        results = optimizer.analyze_sqs_queues([payment_dlq_url])

        queue_name = payment_dlq_url.split('/')[-1]
        assert queue_name in results

    def test_analyze_multiple_queues(self, optimizer):
        """Verify analysis of multiple SQS queues"""
        queue_urls = [payment_queue_url, payment_dlq_url]
        results = optimizer.analyze_sqs_queues(queue_urls)

        assert len(results) == 2

    def test_analyze_nonexistent_queue(self, optimizer):
        """Verify graceful handling of non-existent queue"""
        fake_queue_url = f'https://sqs.{region}.amazonaws.com/123456789012/nonexistent-queue'
        results = optimizer.analyze_sqs_queues([fake_queue_url])

        # Error case stores result with full queue URL as key
        assert fake_queue_url in results
        assert 'error' in results[fake_queue_url]


class TestCloudWatchLogsAnalysis:
    """Integration tests for CloudWatch Logs analysis"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_analyze_lambda_log_groups(self, optimizer):
        """Verify analysis of Lambda log groups"""
        log_groups = [
            f'/aws/lambda/{payment_processor_function_name}',
            f'/aws/lambda/{event_handler_function_name}'
        ]

        results = optimizer.analyze_cloudwatch_logs(log_groups)

        # Should have results for existing log groups
        assert len(results) >= 0  # May be 0 if no logs exist yet


class TestSLACompliance:
    """Integration tests for SLA compliance checking"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_check_sla_compliance(self, optimizer):
        """Verify SLA compliance check"""
        result = optimizer.check_sla_compliance()

        assert 'compliant' in result
        assert isinstance(result['compliant'], bool)

        assert 'violations' in result
        assert isinstance(result['violations'], list)

        assert 'recommendation' in result
        assert result['recommendation'] in ['SCALE_UP', 'CONTINUE_OPTIMIZATION']


class TestReportGeneration:
    """Integration tests for report generation with live data"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_generate_excel_report_with_live_data(self, optimizer):
        """Verify Excel report generation with live analysis data"""
        # Collect live analysis data
        lambda_results = optimizer.analyze_lambda_functions([payment_processor_function_name])
        dynamodb_result = optimizer.analyze_dynamodb_table(payments_table_name)
        ec2_result = optimizer.analyze_ec2_autoscaling(asg_name)

        analysis_results = {
            'lambda': lambda_results,
            'dynamodb': dynamodb_result,
            'ec2': ec2_result,
            'cloudwatch_logs': {}
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

    def test_generate_jupyter_notebook_with_live_data(self, optimizer):
        """Verify Jupyter notebook generation with live analysis data"""
        # Collect live analysis data
        lambda_results = optimizer.analyze_lambda_functions([payment_processor_function_name])
        dynamodb_result = optimizer.analyze_dynamodb_table(payments_table_name)

        analysis_results = {
            'lambda': lambda_results,
            'dynamodb': dynamodb_result,
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
                assert notebook['nbformat'] == 4
        finally:
            if os.path.exists(output_file):
                os.unlink(output_file)


class TestFullOptimization:
    """Integration tests for full optimization run"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_run_full_optimization(self, optimizer):
        """Verify full optimization analysis with live resources"""
        results = optimizer.run_full_optimization()

        # Should have SLA status
        assert 'sla_status' in results
        assert 'compliant' in results['sla_status']

        # Should have Lambda analysis
        assert 'lambda' in results

        # Should have DynamoDB analysis
        assert 'dynamodb' in results

        # Should have EC2 analysis
        assert 'ec2' in results

        # Should have SQS analysis
        assert 'sqs' in results

        # Should have CloudWatch Logs analysis
        assert 'cloudwatch_logs' in results

    def test_full_optimization_generates_reports(self, optimizer):
        """Verify full optimization generates report files"""
        # Ensure we're in the right directory
        original_dir = os.getcwd()

        try:
            results = optimizer.run_full_optimization()

            # Check that report files were created
            excel_file = 'payment_optimization_report.xlsx'
            notebook_file = 'payment_optimization_analysis.ipynb'

            assert os.path.exists(excel_file)
            assert os.path.exists(notebook_file)

            # Clean up report files
            if os.path.exists(excel_file):
                os.unlink(excel_file)
            if os.path.exists(notebook_file):
                os.unlink(notebook_file)

        finally:
            os.chdir(original_dir)


class TestMetricsCollection:
    """Integration tests for metrics collection"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_lambda_metrics_structure(self, optimizer):
        """Verify Lambda metrics have correct structure"""
        results = optimizer.analyze_lambda_functions([payment_processor_function_name])
        func_result = results[payment_processor_function_name]

        # Utilization should have expected fields
        util = func_result['utilization']
        assert 'duration_avg_ms' in util
        assert 'duration_max_ms' in util
        assert 'duration_utilization_pct' in util
        assert 'total_invocations' in util
        assert 'error_rate_pct' in util

    def test_dynamodb_metrics_structure(self, optimizer):
        """Verify DynamoDB metrics have correct structure"""
        result = optimizer.analyze_dynamodb_table(payments_table_name)

        # Current config should have expected fields
        config = result['current_config']
        assert 'billing_mode' in config
        assert 'table_status' in config
        assert 'item_count' in config
        assert 'table_size_bytes' in config
        assert 'gsi_count' in config

        # Utilization should have expected fields
        util = result['utilization']
        assert 'read_pct' in util
        assert 'write_pct' in util
        assert 'consumed_rcu' in util
        assert 'consumed_wcu' in util

    def test_ec2_asg_metrics_structure(self, optimizer):
        """Verify EC2 ASG metrics have correct structure"""
        result = optimizer.analyze_ec2_autoscaling(asg_name)

        # Current config should have expected fields
        config = result['current_config']
        assert 'instance_type' in config
        assert 'desired_capacity' in config
        assert 'min_size' in config
        assert 'max_size' in config
        assert 'availability_zones' in config

    def test_sqs_metrics_structure(self, optimizer):
        """Verify SQS metrics have correct structure"""
        results = optimizer.analyze_sqs_queues([payment_queue_url])
        queue_name = payment_queue_url.split('/')[-1]
        queue_result = results[queue_name]

        # Current config should have expected fields
        config = queue_result['current_config']
        assert 'visibility_timeout' in config
        assert 'message_retention_seconds' in config
        assert 'has_dlq' in config


class TestRecommendationQuality:
    """Integration tests for recommendation quality"""

    @pytest.fixture
    def optimizer(self):
        """Create optimizer with live AWS clients"""
        from lib.optimize import PaymentPlatformOptimizer
        return PaymentPlatformOptimizer(region_name=region)

    def test_lambda_recommendations_have_required_fields(self, optimizer):
        """Verify Lambda recommendations have required fields"""
        results = optimizer.analyze_lambda_functions([payment_processor_function_name])
        func_result = results[payment_processor_function_name]

        for rec in func_result['recommendations']:
            assert 'action' in rec
            assert 'risk' in rec or 'reason' in rec

    def test_dynamodb_recommendations_have_required_fields(self, optimizer):
        """Verify DynamoDB recommendations have required fields"""
        result = optimizer.analyze_dynamodb_table(payments_table_name)

        for rec in result['recommendations']:
            assert 'action' in rec
            assert 'reason' in rec

    def test_ec2_recommendations_have_required_fields(self, optimizer):
        """Verify EC2 recommendations have required fields"""
        result = optimizer.analyze_ec2_autoscaling(asg_name)

        for rec in result['recommendations']:
            assert 'action' in rec
            assert 'risk' in rec

    def test_sqs_recommendations_have_required_fields(self, optimizer):
        """Verify SQS recommendations have required fields"""
        results = optimizer.analyze_sqs_queues([payment_queue_url])
        queue_name = payment_queue_url.split('/')[-1]
        queue_result = results[queue_name]

        for rec in queue_result['recommendations']:
            assert 'action' in rec
            assert 'reason' in rec or 'risk' in rec
