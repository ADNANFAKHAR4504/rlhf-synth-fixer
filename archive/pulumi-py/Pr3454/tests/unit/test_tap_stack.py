"""
Comprehensive unit tests for the Pulumi IoT TAP stack components.
"""

import pytest
import unittest.mock
import json
from typing import Dict, Any

# Import stack components
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from tap_stack import TapStack, TapStackArgs
from storage_stack import StorageStack
from compute_stack import ComputeStack
from iot_stack import IoTStack
from monitoring_stack import MonitoringStack


class TestTapStackArgs:
    """Test TapStackArgs configuration."""
    
    def test_default_initialization(self):
        """Test default TapStackArgs initialization."""
        args = TapStackArgs()
        assert args.environment_suffix == 'dev'
        assert args.tags is None
    
    def test_custom_initialization(self):
        """Test custom TapStackArgs initialization."""
        custom_tags = {'Project': 'TestProject', 'Owner': 'TestOwner'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        assert args.environment_suffix == 'prod'
        assert args.tags == custom_tags


class TestTapStack:
    """Test main TapStack component."""
    
    @pytest.fixture
    def mock_pulumi_resources(self):
        """Mock Pulumi resources and components."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('pulumi.ResourceOptions'), \
             unittest.mock.patch('tap_stack.StorageStack') as mock_storage, \
             unittest.mock.patch('tap_stack.ComputeStack') as mock_compute, \
             unittest.mock.patch('tap_stack.IoTStack') as mock_iot, \
             unittest.mock.patch('tap_stack.MonitoringStack') as mock_monitoring:
            
            # Configure mock returns
            mock_storage.return_value.kinesis_stream.arn = "mock-kinesis-arn"
            mock_storage.return_value.dynamodb_table.name = "mock-table-name"
            mock_storage.return_value.s3_bucket.bucket = "mock-bucket-name"
            mock_compute.return_value.anomaly_lambda.arn = "mock-lambda-arn"
            mock_compute.return_value.anomaly_lambda.name = "mock-lambda-name"
            mock_monitoring.return_value.sns_topic.arn = "mock-sns-arn"
            
            yield {
                'storage': mock_storage,
                'compute': mock_compute,
                'iot': mock_iot,
                'monitoring': mock_monitoring
            }
    
    def test_tap_stack_initialization(self, mock_pulumi_resources):
        """Test TapStack initialization with default args."""
        with unittest.mock.patch.object(TapStack, 'register_outputs'):
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            assert stack.environment_suffix == 'dev'
            assert 'Project' in stack.tags
            assert stack.tags['Project'] == 'IoT-TAP'
            assert stack.tags['Environment'] == 'dev'
            assert stack.tags['ManagedBy'] == 'Pulumi'
    
    def test_tap_stack_custom_environment(self, mock_pulumi_resources):
        """Test TapStack initialization with custom environment."""
        with unittest.mock.patch.object(TapStack, 'register_outputs'):
            custom_tags = {'CustomTag': 'CustomValue'}
            args = TapStackArgs(environment_suffix='staging', tags=custom_tags)
            stack = TapStack('test-stack', args)
            
            assert stack.environment_suffix == 'staging'
            assert stack.tags['Environment'] == 'staging'
            assert stack.tags['CustomTag'] == 'CustomValue'
    
    def test_component_creation_order(self, mock_pulumi_resources):
        """Test that stack components are created in correct order."""
        with unittest.mock.patch.object(TapStack, 'register_outputs'):
            args = TapStackArgs()
            TapStack('test-stack', args)
            
            # Verify storage is created first
            mock_pulumi_resources['storage'].assert_called_once()
            
            # Verify compute depends on storage outputs
            compute_call = mock_pulumi_resources['compute'].call_args
            assert 'kinesis_stream_arn' in compute_call[1]
            assert 'dynamodb_table_name' in compute_call[1]
            assert 's3_bucket_name' in compute_call[1]
            
            # Verify IoT depends on compute and storage
            iot_call = mock_pulumi_resources['iot'].call_args
            assert 'lambda_function_arn' in iot_call[1]
            assert 'kinesis_stream_arn' in iot_call[1]
            
            # Verify monitoring depends on compute and storage
            monitoring_call = mock_pulumi_resources['monitoring'].call_args
            assert 'lambda_function_name' in monitoring_call[1]
            assert 'kinesis_stream_name' in monitoring_call[1]


class TestStorageStack:
    """Test StorageStack component."""
    
    @pytest.fixture
    def mock_aws_resources(self):
        """Mock AWS Pulumi resources."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('storage_stack.aws.dynamodb.Table') as mock_table, \
             unittest.mock.patch('storage_stack.aws.kinesis.Stream') as mock_stream, \
             unittest.mock.patch('storage_stack.aws.s3.BucketV2') as mock_bucket, \
             unittest.mock.patch('storage_stack.aws.s3.BucketVersioningV2'), \
             unittest.mock.patch('storage_stack.aws.s3.BucketServerSideEncryptionConfigurationV2'), \
             unittest.mock.patch('storage_stack.aws.s3.BucketLifecycleConfigurationV2'), \
             unittest.mock.patch('storage_stack.aws.s3.BucketPublicAccessBlock'), \
             unittest.mock.patch('storage_stack.aws.get_caller_identity') as mock_identity:
            
            mock_identity.return_value.account_id = "123456789012"
            mock_table.return_value.name = "test-table"
            mock_stream.return_value.name = "test-stream"
            mock_bucket.return_value.bucket = "test-bucket"
            
            yield {
                'table': mock_table,
                'stream': mock_stream,
                'bucket': mock_bucket,
                'identity': mock_identity
            }
    
    def test_storage_stack_initialization(self, mock_aws_resources):
        """Test StorageStack initialization."""
        with unittest.mock.patch.object(StorageStack, 'register_outputs'):
            storage = StorageStack(
                'test-storage',
                environment_suffix='test',
                tags={'Environment': 'test'}
            )
            
            # Verify DynamoDB table creation
            mock_aws_resources['table'].assert_called_once()
            table_args = mock_aws_resources['table'].call_args
            assert 'sensor-data-test' in table_args[0]
            assert table_args[1]['billing_mode'] == 'PAY_PER_REQUEST'
            assert table_args[1]['hash_key'] == 'device_id'
            assert table_args[1]['range_key'] == 'timestamp'
    
    def test_dynamodb_table_configuration(self, mock_aws_resources):
        """Test DynamoDB table proper configuration."""
        with unittest.mock.patch.object(StorageStack, 'register_outputs'):
            StorageStack(
                'test-storage',
                environment_suffix='test',
                tags={'Environment': 'test'}
            )
            
            table_call = mock_aws_resources['table'].call_args
            
            # Check attributes
            attributes = table_call[1]['attributes']
            attribute_names = [attr.name for attr in attributes]
            assert 'device_id' in attribute_names
            assert 'timestamp' in attribute_names
            assert 'date' in attribute_names
            
            # Check GSI
            gsi = table_call[1]['global_secondary_indexes'][0]
            assert gsi.name == 'DateIndex'
            assert gsi.hash_key == 'date'
            assert gsi.range_key == 'timestamp'
    
    def test_kinesis_stream_configuration(self, mock_aws_resources):
        """Test Kinesis stream configuration."""
        with unittest.mock.patch.object(StorageStack, 'register_outputs'):
            StorageStack(
                'test-storage',
                environment_suffix='test',
                tags={'Environment': 'test'}
            )
            
            stream_call = mock_aws_resources['stream'].call_args
            assert stream_call[1]['shard_count'] == 2
            assert stream_call[1]['retention_period'] == 24
            assert stream_call[1]['encryption_type'] == 'KMS'
            assert 'IncomingBytes' in stream_call[1]['shard_level_metrics']
    
    def test_s3_bucket_security_configuration(self, mock_aws_resources):
        """Test S3 bucket security configuration."""
        with unittest.mock.patch.object(StorageStack, 'register_outputs'), \
             unittest.mock.patch('storage_stack.aws.s3.BucketPublicAccessBlock') as mock_public_block:
            
            StorageStack(
                'test-storage',
                environment_suffix='test',
                tags={'Environment': 'test'}
            )
            
            # Verify public access block is configured
            mock_public_block.assert_called_once()
            public_block_call = mock_public_block.call_args
            assert public_block_call[1]['block_public_acls'] == True
            assert public_block_call[1]['block_public_policy'] == True
            assert public_block_call[1]['ignore_public_acls'] == True
            assert public_block_call[1]['restrict_public_buckets'] == True


class TestComputeStack:
    """Test ComputeStack component."""
    
    @pytest.fixture
    def mock_compute_resources(self):
        """Mock compute-related AWS resources."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('compute_stack.aws.iam.Role') as mock_role, \
             unittest.mock.patch('compute_stack.aws.iam.RolePolicy') as mock_policy, \
             unittest.mock.patch('compute_stack.aws.lambda_.Function') as mock_lambda, \
             unittest.mock.patch('compute_stack.aws.lambda_.Permission') as mock_permission, \
             unittest.mock.patch('compute_stack.aws.lambda_.EventSourceMapping') as mock_mapping, \
             unittest.mock.patch('compute_stack.aws.get_caller_identity') as mock_identity, \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_identity.return_value.account_id = "123456789012"
            mock_role.return_value.id = "test-role-id"
            mock_role.return_value.arn = "test-role-arn"
            mock_lambda.return_value.name = "test-lambda-name"
            mock_lambda.return_value.arn = "test-lambda-arn"
            
            # Mock Output methods
            mock_output.concat.return_value = "mocked-arn"
            mock_output.json_dumps.return_value = "mocked-policy"
            
            yield {
                'role': mock_role,
                'policy': mock_policy,
                'lambda': mock_lambda,
                'permission': mock_permission,
                'mapping': mock_mapping
            }
    
    def test_compute_stack_initialization(self, mock_compute_resources):
        """Test ComputeStack initialization."""
        with unittest.mock.patch.object(ComputeStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            compute = ComputeStack(
                'test-compute',
                environment_suffix='test',
                kinesis_stream_arn=mock_output,
                dynamodb_table_name=mock_output,
                s3_bucket_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            # Verify IAM role creation
            mock_compute_resources['role'].assert_called()
            role_call = mock_compute_resources['role'].call_args
            assert 'lambda-execution-role-test' in role_call[0]
    
    def test_lambda_function_configuration(self, mock_compute_resources):
        """Test Lambda function configuration."""
        with unittest.mock.patch.object(ComputeStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output, \
             unittest.mock.patch('compute_stack.AssetArchive'), \
             unittest.mock.patch('compute_stack.FileAsset'):
            
            mock_output.return_value = "mock-value"
            
            ComputeStack(
                'test-compute',
                environment_suffix='test',
                kinesis_stream_arn=mock_output,
                dynamodb_table_name=mock_output,
                s3_bucket_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            lambda_call = mock_compute_resources['lambda'].call_args
            assert lambda_call[1]['runtime'] == 'python3.11'
            assert lambda_call[1]['handler'] == 'handler.lambda_handler'
            assert lambda_call[1]['timeout'] == 60
            assert lambda_call[1]['memory_size'] == 512
            assert lambda_call[1]['reserved_concurrent_executions'] == 10
    
    def test_lambda_environment_variables(self, mock_compute_resources):
        """Test Lambda environment variables configuration."""
        with unittest.mock.patch.object(ComputeStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output, \
             unittest.mock.patch('compute_stack.AssetArchive'), \
             unittest.mock.patch('compute_stack.FileAsset'):
            
            mock_output.return_value = "mock-value"
            
            ComputeStack(
                'test-compute',
                environment_suffix='test',
                kinesis_stream_arn=mock_output,
                dynamodb_table_name=mock_output,
                s3_bucket_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            lambda_call = mock_compute_resources['lambda'].call_args
            env_vars = lambda_call[1]['environment'].variables
            assert 'DYNAMODB_TABLE' in env_vars
            assert 'S3_BUCKET' in env_vars
            assert 'ENVIRONMENT' in env_vars
            assert env_vars['ENVIRONMENT'] == 'test'  # environment_suffix is passed as string
    
    def test_kinesis_event_source_mapping(self, mock_compute_resources):
        """Test Kinesis event source mapping configuration."""
        with unittest.mock.patch.object(ComputeStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output, \
             unittest.mock.patch('compute_stack.AssetArchive'), \
             unittest.mock.patch('compute_stack.FileAsset'):
            
            mock_output.return_value = "mock-value"
            
            ComputeStack(
                'test-compute',
                environment_suffix='test',
                kinesis_stream_arn=mock_output,
                dynamodb_table_name=mock_output,
                s3_bucket_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            mapping_call = mock_compute_resources['mapping'].call_args
            assert mapping_call[1]['starting_position'] == 'LATEST'
            assert mapping_call[1]['maximum_batching_window_in_seconds'] == 5
            assert mapping_call[1]['parallelization_factor'] == 2


class TestIoTStack:
    """Test IoTStack component."""
    
    @pytest.fixture
    def mock_iot_resources(self):
        """Mock IoT-related AWS resources."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('iot_stack.aws.iot.get_endpoint') as mock_endpoint, \
             unittest.mock.patch('iot_stack.aws.iot.ThingType') as mock_thing_type, \
             unittest.mock.patch('iot_stack.aws.iot.Policy') as mock_policy, \
             unittest.mock.patch('iot_stack.aws.iot.TopicRule') as mock_rule, \
             unittest.mock.patch('iot_stack.aws.iam.Role') as mock_role, \
             unittest.mock.patch('iot_stack.aws.iam.RolePolicy') as mock_role_policy, \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_endpoint.return_value.endpoint_address = "test.iot.us-west-1.amazonaws.com"
            mock_thing_type.return_value.name = "test-thing-type"
            mock_policy.return_value.name = "test-policy"
            mock_role.return_value.id = "test-role-id"
            
            yield {
                'endpoint': mock_endpoint,
                'thing_type': mock_thing_type,
                'policy': mock_policy,
                'rule': mock_rule,
                'role': mock_role,
                'role_policy': mock_role_policy
            }
    
    def test_iot_stack_initialization(self, mock_iot_resources):
        """Test IoTStack initialization."""
        with unittest.mock.patch.object(IoTStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            iot = IoTStack(
                'test-iot',
                environment_suffix='test',
                lambda_function_arn=mock_output,
                kinesis_stream_arn=mock_output,
                tags={'Environment': 'test'}
            )
            
            # Verify IoT endpoint is retrieved
            mock_iot_resources['endpoint'].assert_called_once()
    
    def test_thing_type_creation(self, mock_iot_resources):
        """Test IoT Thing Type creation."""
        with unittest.mock.patch.object(IoTStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            IoTStack(
                'test-iot',
                environment_suffix='test',
                lambda_function_arn=mock_output,
                kinesis_stream_arn=mock_output,
                tags={'Environment': 'test'}
            )
            
            thing_type_call = mock_iot_resources['thing_type'].call_args
            assert 'industrial-sensor-test' in thing_type_call[0]
            assert thing_type_call[1]['deprecated'] == False
    
    def test_device_policy_configuration(self, mock_iot_resources):
        """Test IoT device policy configuration."""
        with unittest.mock.patch.object(IoTStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            IoTStack(
                'test-iot',
                environment_suffix='test',
                lambda_function_arn=mock_output,
                kinesis_stream_arn=mock_output,
                tags={'Environment': 'test'}
            )
            
            policy_call = mock_iot_resources['policy'].call_args
            policy_doc = json.loads(policy_call[1]['policy'])
            
            assert policy_doc['Version'] == '2012-10-17'
            statement = policy_doc['Statement'][0]
            assert 'iot:Connect' in statement['Action']
            assert 'iot:Publish' in statement['Action']
            assert 'iot:Subscribe' in statement['Action']
    
    def test_iot_rules_creation(self, mock_iot_resources):
        """Test IoT rules creation."""
        with unittest.mock.patch.object(IoTStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            mock_output.apply.return_value = "test-stream"
            
            IoTStack(
                'test-iot',
                environment_suffix='test',
                lambda_function_arn=mock_output,
                kinesis_stream_arn=mock_output,
                tags={'Environment': 'test'}
            )
            
            # Should create two rules: anomaly detection and kinesis ingestion
            assert mock_iot_resources['rule'].call_count == 2
            
            # Check rule configurations
            rule_calls = mock_iot_resources['rule'].call_args_list
            anomaly_rule = rule_calls[0]
            kinesis_rule = rule_calls[1]
            
            assert 'anomaly-detection-rule-test' in anomaly_rule[0]
            assert anomaly_rule[1]['enabled'] == True
            assert 'temperature > 100' in anomaly_rule[1]['sql']
            
            assert 'kinesis-ingestion-rule-test' in kinesis_rule[0]
            assert kinesis_rule[1]['enabled'] == True
            assert 'timestamp()' in kinesis_rule[1]['sql']


class TestMonitoringStack:
    """Test MonitoringStack component."""
    
    @pytest.fixture
    def mock_monitoring_resources(self):
        """Mock monitoring-related AWS resources."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('monitoring_stack.aws.sns.Topic') as mock_topic, \
             unittest.mock.patch('monitoring_stack.aws.sns.TopicSubscription') as mock_subscription, \
             unittest.mock.patch('monitoring_stack.aws.cloudwatch.MetricAlarm') as mock_alarm, \
             unittest.mock.patch('monitoring_stack.aws.cloudwatch.Dashboard') as mock_dashboard, \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_topic.return_value.arn = "test-topic-arn"
            mock_dashboard.return_value.dashboard_name = "test-dashboard"
            
            yield {
                'topic': mock_topic,
                'subscription': mock_subscription,
                'alarm': mock_alarm,
                'dashboard': mock_dashboard
            }
    
    def test_monitoring_stack_initialization(self, mock_monitoring_resources):
        """Test MonitoringStack initialization."""
        with unittest.mock.patch.object(MonitoringStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            monitoring = MonitoringStack(
                'test-monitoring',
                environment_suffix='test',
                lambda_function_name=mock_output,
                kinesis_stream_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            # Verify SNS topics creation
            assert mock_monitoring_resources['topic'].call_count == 2  # anomaly + security
    
    def test_sns_topic_configuration(self, mock_monitoring_resources):
        """Test SNS topic configuration."""
        with unittest.mock.patch.object(MonitoringStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            MonitoringStack(
                'test-monitoring',
                environment_suffix='test',
                lambda_function_name=mock_output,
                kinesis_stream_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            topic_calls = mock_monitoring_resources['topic'].call_args_list
            anomaly_topic = topic_calls[0]
            security_topic = topic_calls[1]
            
            assert 'anomaly-alerts-test' in anomaly_topic[0]
            assert anomaly_topic[1]['display_name'] == 'IoT Anomaly Detection Alerts'
            
            assert 'security-alerts-test' in security_topic[0]
            assert security_topic[1]['display_name'] == 'IoT Security Alerts'
    
    def test_cloudwatch_alarms_creation(self, mock_monitoring_resources):
        """Test CloudWatch alarms creation."""
        with unittest.mock.patch.object(MonitoringStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            MonitoringStack(
                'test-monitoring',
                environment_suffix='test',
                lambda_function_name=mock_output,
                kinesis_stream_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            # Should create 3 alarms: lambda error, lambda duration, kinesis iterator
            assert mock_monitoring_resources['alarm'].call_count == 3
    
    def test_lambda_error_alarm_configuration(self, mock_monitoring_resources):
        """Test Lambda error alarm configuration."""
        with unittest.mock.patch.object(MonitoringStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            
            MonitoringStack(
                'test-monitoring',
                environment_suffix='test',
                lambda_function_name=mock_output,
                kinesis_stream_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            alarm_calls = mock_monitoring_resources['alarm'].call_args_list
            error_alarm = alarm_calls[0]  # First alarm is error rate
            
            assert 'lambda-error-alarm-test' in error_alarm[0]
            assert error_alarm[1]['metric_name'] == 'Errors'
            assert error_alarm[1]['namespace'] == 'AWS/Lambda'
            assert error_alarm[1]['threshold'] == 0.01
            assert error_alarm[1]['comparison_operator'] == 'GreaterThanThreshold'
    
    def test_dashboard_creation(self, mock_monitoring_resources):
        """Test CloudWatch dashboard creation."""
        with unittest.mock.patch.object(MonitoringStack, 'register_outputs'), \
             unittest.mock.patch('pulumi.Output') as mock_output:
            
            mock_output.return_value = "mock-value"
            mock_output.json_dumps.return_value = '{"widgets": []}'
            
            MonitoringStack(
                'test-monitoring',
                environment_suffix='test',
                lambda_function_name=mock_output,
                kinesis_stream_name=mock_output,
                tags={'Environment': 'test'}
            )
            
            dashboard_call = mock_monitoring_resources['dashboard'].call_args
            assert 'iot-dashboard-test' in dashboard_call[0]
            assert dashboard_call[1]['dashboard_name'] == 'IoT-Pipeline-test'


class TestStackIntegration:
    """Integration tests for stack components working together."""
    
    def test_stack_outputs_registration(self):
        """Test that all stacks register their outputs correctly."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('tap_stack.StorageStack') as mock_storage, \
             unittest.mock.patch('tap_stack.ComputeStack') as mock_compute, \
             unittest.mock.patch('tap_stack.IoTStack') as mock_iot, \
             unittest.mock.patch('tap_stack.MonitoringStack') as mock_monitoring, \
             unittest.mock.patch.object(TapStack, 'register_outputs') as mock_register:
            
            # Configure mock returns
            mock_storage.return_value.kinesis_stream.arn = "kinesis-arn"
            mock_storage.return_value.kinesis_stream.name = "kinesis-name"
            mock_storage.return_value.dynamodb_table.name = "table-name"
            mock_storage.return_value.s3_bucket.bucket = "bucket-name"
            mock_compute.return_value.anomaly_lambda.arn = "lambda-arn"
            mock_compute.return_value.anomaly_lambda.name = "lambda-name"
            mock_iot.return_value.iot_endpoint = "iot-endpoint"
            mock_monitoring.return_value.sns_topic.arn = "sns-arn"
            
            args = TapStackArgs()
            TapStack('test-stack', args)
            
            # Verify register_outputs was called with correct structure
            mock_register.assert_called_once()
            outputs = mock_register.call_args[0][0]
            
            expected_outputs = [
                'iot_endpoint', 'kinesis_stream_name', 'dynamodb_table_name',
                's3_bucket_name', 'sns_topic_arn', 'lambda_function_name'
            ]
            for output in expected_outputs:
                assert output in outputs
    
    def test_resource_dependencies(self):
        """Test that resources are created with proper dependencies."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('tap_stack.StorageStack') as mock_storage, \
             unittest.mock.patch('tap_stack.ComputeStack') as mock_compute, \
             unittest.mock.patch('tap_stack.IoTStack') as mock_iot, \
             unittest.mock.patch('tap_stack.MonitoringStack') as mock_monitoring, \
             unittest.mock.patch.object(TapStack, 'register_outputs'):
            
            # Configure mock returns for dependency chain
            mock_storage.return_value.kinesis_stream.arn = "kinesis-arn"
            mock_storage.return_value.dynamodb_table.name = "table-name"
            mock_storage.return_value.s3_bucket.bucket = "bucket-name"
            mock_compute.return_value.anomaly_lambda.arn = "lambda-arn"
            mock_compute.return_value.anomaly_lambda.name = "lambda-name"
            
            args = TapStackArgs(environment_suffix='test')
            TapStack('test-stack', args)
            
            # Verify compute stack receives storage outputs
            compute_args = mock_compute.call_args[1]
            assert 'kinesis_stream_arn' in compute_args
            assert 'dynamodb_table_name' in compute_args
            assert 's3_bucket_name' in compute_args
            
            # Verify IoT stack receives compute outputs
            iot_args = mock_iot.call_args[1]
            assert 'lambda_function_arn' in iot_args
            assert 'kinesis_stream_arn' in iot_args
            
            # Verify monitoring stack receives compute outputs
            monitoring_args = mock_monitoring.call_args[1]
            assert 'lambda_function_name' in monitoring_args
            assert 'kinesis_stream_name' in monitoring_args
    
    def test_environment_consistency(self):
        """Test that environment suffix is consistently applied across all stacks."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('tap_stack.StorageStack') as mock_storage, \
             unittest.mock.patch('tap_stack.ComputeStack') as mock_compute, \
             unittest.mock.patch('tap_stack.IoTStack') as mock_iot, \
             unittest.mock.patch('tap_stack.MonitoringStack') as mock_monitoring, \
             unittest.mock.patch.object(TapStack, 'register_outputs'):
            
            mock_storage.return_value.kinesis_stream.arn = "kinesis-arn"
            mock_storage.return_value.dynamodb_table.name = "table-name"
            mock_storage.return_value.s3_bucket.bucket = "bucket-name"
            mock_compute.return_value.anomaly_lambda.arn = "lambda-arn"
            mock_compute.return_value.anomaly_lambda.name = "lambda-name"
            
            env_suffix = 'production'
            args = TapStackArgs(environment_suffix=env_suffix)
            TapStack('test-stack', args)
            
            # Check that all stacks receive the same environment suffix
            for mock_stack in [mock_storage, mock_compute, mock_iot, mock_monitoring]:
                stack_args = mock_stack.call_args[1]
                assert stack_args['environment_suffix'] == env_suffix
    
    def test_tags_propagation(self):
        """Test that tags are properly propagated to all stack components."""
        with unittest.mock.patch('pulumi.ComponentResource.__init__'), \
             unittest.mock.patch('tap_stack.StorageStack') as mock_storage, \
             unittest.mock.patch('tap_stack.ComputeStack') as mock_compute, \
             unittest.mock.patch('tap_stack.IoTStack') as mock_iot, \
             unittest.mock.patch('tap_stack.MonitoringStack') as mock_monitoring, \
             unittest.mock.patch.object(TapStack, 'register_outputs'):
            
            mock_storage.return_value.kinesis_stream.arn = "kinesis-arn"
            mock_storage.return_value.dynamodb_table.name = "table-name"
            mock_storage.return_value.s3_bucket.bucket = "bucket-name"
            mock_compute.return_value.anomaly_lambda.arn = "lambda-arn"
            mock_compute.return_value.anomaly_lambda.name = "lambda-name"
            
            custom_tags = {'Owner': 'DataTeam', 'CostCenter': '12345'}
            args = TapStackArgs(environment_suffix='test', tags=custom_tags)
            TapStack('test-stack', args)
            
            # Check that all stacks receive the merged tags
            expected_tags = {
                'Project': 'IoT-TAP',
                'Environment': 'test',
                'ManagedBy': 'Pulumi',
                'Owner': 'DataTeam',
                'CostCenter': '12345'
            }
            
            for mock_stack in [mock_storage, mock_compute, mock_iot, mock_monitoring]:
                stack_args = mock_stack.call_args[1]
                received_tags = stack_args['tags']
                for key, value in expected_tags.items():
                    assert received_tags[key] == value


if __name__ == '__main__':
    pytest.main([__file__])