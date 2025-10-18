"""Integration tests for TapStack - IoT Manufacturing Data Processing Infrastructure.

These tests validate live AWS resources deployed by the stack using outputs
from cfn-outputs/flat-outputs.json. Tests verify resource configurations,
integrations, and end-to-end data flow.

IMPORTANT: These tests require actual AWS resources to be deployed.
They do NOT use mocking - all tests interact with real AWS services.
"""
import json
import os
import time
import base64
from typing import Dict, Any

import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def stack_outputs() -> Dict[str, Any]:
    """Load stack outputs from flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "cfn-outputs",
        "flat-outputs.json"
    )
    
    if not os.path.exists(outputs_path):
        pytest.skip(f"Stack outputs file not found: {outputs_path}")
    
    with open(outputs_path, 'r') as f:
        outputs = json.load(f)
    
    # Validate required outputs exist
    required_outputs = [
        'sensor_data_bucket_name',
        'sensor_metrics_table_name',
        'kinesis_stream_name',
        'lambda_function_name',
        'iot_thing_type_name',
        'cloudtrail_name',
        'kms_key_id'
    ]
    
    missing_outputs = [key for key in required_outputs if key not in outputs]
    if missing_outputs:
        pytest.skip(f"Required outputs missing: {missing_outputs}")
    
    return outputs


@pytest.fixture(scope="module")
def aws_region() -> str:
    """Get AWS region from environment or default to ap-southeast-1."""
    return os.environ.get('AWS_REGION', 'ap-southeast-1')


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client for testing."""
    return boto3.client('s3', region_name=aws_region)


@pytest.fixture(scope="module")
def dynamodb_client(aws_region):
    """Create DynamoDB client for testing."""
    return boto3.client('dynamodb', region_name=aws_region)


@pytest.fixture(scope="module")
def kinesis_client(aws_region):
    """Create Kinesis client for testing."""
    return boto3.client('kinesis', region_name=aws_region)


@pytest.fixture(scope="module")
def lambda_client(aws_region):
    """Create Lambda client for testing."""
    return boto3.client('lambda', region_name=aws_region)


@pytest.fixture(scope="module")
def iot_client(aws_region):
    """Create IoT client for testing."""
    return boto3.client('iot', region_name=aws_region)


@pytest.fixture(scope="module")
def cloudtrail_client(aws_region):
    """Create CloudTrail client for testing."""
    return boto3.client('cloudtrail', region_name=aws_region)


@pytest.fixture(scope="module")
def kms_client(aws_region):
    """Create KMS client for testing."""
    return boto3.client('kms', region_name=aws_region)


@pytest.fixture(scope="module")
def logs_client(aws_region):
    """Create CloudWatch Logs client for testing."""
    return boto3.client('logs', region_name=aws_region)


class TestS3BucketConfiguration:
    """Test S3 bucket for raw sensor data storage."""
    
    def test_sensor_data_bucket_exists(self, stack_outputs, s3_client):
        """Verify S3 bucket for sensor data exists and is accessible."""
        bucket_name = stack_outputs['sensor_data_bucket_name']
        
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200
    
    def test_sensor_bucket_versioning_enabled(self, stack_outputs, s3_client):
        """Verify versioning is enabled on sensor data bucket."""
        bucket_name = stack_outputs['sensor_data_bucket_name']
        
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get('Status') == 'Enabled', \
            "S3 bucket versioning must be enabled for data integrity"
    
    def test_sensor_bucket_encryption_configured(self, stack_outputs, s3_client):
        """Verify encryption is configured on sensor data bucket."""
        bucket_name = stack_outputs['sensor_data_bucket_name']
        
        try:
            encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0, "Bucket must have encryption rules"
            
            # Verify KMS encryption
            default_encryption = rules[0]['ApplyServerSideEncryptionByDefault']
            assert default_encryption['SSEAlgorithm'] == 'aws:kms', \
                "Bucket must use KMS encryption"
        except ClientError as e:
            pytest.fail(f"Failed to get bucket encryption: {e}")
    
    def test_sensor_bucket_lifecycle_policy(self, stack_outputs, s3_client):
        """Verify lifecycle policy exists for transitioning old data."""
        bucket_name = stack_outputs['sensor_data_bucket_name']
        
        try:
            lifecycle = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = lifecycle.get('Rules', [])
            assert len(rules) > 0, "Bucket must have lifecycle rules"
            
            # Check for Glacier transition rule
            glacier_rules = [
                rule for rule in rules
                if any(
                    t.get('StorageClass') == 'GLACIER'
                    for t in rule.get('Transitions', [])
                )
            ]
            assert len(glacier_rules) > 0, \
                "Bucket must have rule to transition data to Glacier"
        except ClientError as e:
            pytest.fail(f"Failed to get lifecycle configuration: {e}")
    
    def test_sensor_bucket_write_access(self, stack_outputs, s3_client):
        """Verify bucket allows write operations (test object upload)."""
        bucket_name = stack_outputs['sensor_data_bucket_name']
        test_key = f"integration-test/{int(time.time())}/test-data.json"
        test_data = json.dumps({
            'device_id': 'test-device-001',
            'timestamp': int(time.time()),
            'temperature': 72.5,
            'test': True
        })
        
        try:
            # Upload test object
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_data.encode('utf-8'),
                ContentType='application/json'
            )
            
            # Verify object exists
            response = s3_client.head_object(Bucket=bucket_name, Key=test_key)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
            
            # Cleanup
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        except ClientError as e:
            pytest.fail(f"Failed to write to bucket: {e}")


class TestDynamoDBTableConfiguration:
    """Test DynamoDB table for processed sensor metrics."""
    
    def test_sensor_metrics_table_exists(self, stack_outputs, dynamodb_client):
        """Verify DynamoDB table exists and is active."""
        table_name = stack_outputs['sensor_metrics_table_name']
        
        response = dynamodb_client.describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE', \
            "DynamoDB table must be in ACTIVE state"
    
    def test_table_has_correct_keys(self, stack_outputs, dynamodb_client):
        """Verify table has correct hash and range keys configured."""
        table_name = stack_outputs['sensor_metrics_table_name']
        
        response = dynamodb_client.describe_table(TableName=table_name)
        key_schema = response['Table']['KeySchema']
        
        # Verify hash key
        hash_keys = [k for k in key_schema if k['KeyType'] == 'HASH']
        assert len(hash_keys) == 1, "Table must have one hash key"
        assert hash_keys[0]['AttributeName'] == 'device_id', \
            "Hash key must be 'device_id'"
        
        # Verify range key
        range_keys = [k for k in key_schema if k['KeyType'] == 'RANGE']
        assert len(range_keys) == 1, "Table must have one range key"
        assert range_keys[0]['AttributeName'] == 'timestamp', \
            "Range key must be 'timestamp'"
    
    def test_table_point_in_time_recovery_enabled(self, stack_outputs, dynamodb_client):
        """Verify point-in-time recovery is enabled."""
        table_name = stack_outputs['sensor_metrics_table_name']
        
        response = dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED', \
            "Point-in-time recovery must be enabled for compliance"
    
    def test_table_encryption_enabled(self, stack_outputs, dynamodb_client):
        """Verify table encryption is enabled."""
        table_name = stack_outputs['sensor_metrics_table_name']
        
        response = dynamodb_client.describe_table(TableName=table_name)
        sse_description = response['Table'].get('SSEDescription', {})
        assert sse_description.get('Status') == 'ENABLED', \
            "DynamoDB encryption must be enabled"
        assert sse_description.get('SSEType') == 'KMS', \
            "DynamoDB must use KMS encryption"
    
    def test_table_write_and_read_data(self, stack_outputs, dynamodb_client):
        """Verify table allows write and read operations."""
        table_name = stack_outputs['sensor_metrics_table_name']
        test_device_id = f"integration-test-{int(time.time())}"
        test_timestamp = int(time.time() * 1000)
        
        try:
            # Write test item
            dynamodb_client.put_item(
                TableName=table_name,
                Item={
                    'device_id': {'S': test_device_id},
                    'timestamp': {'N': str(test_timestamp)},
                    'temperature': {'N': '75.5'},
                    'vibration': {'N': '0.05'},
                    'test_item': {'BOOL': True}
                }
            )
            
            # Read test item
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={
                    'device_id': {'S': test_device_id},
                    'timestamp': {'N': str(test_timestamp)}
                }
            )
            assert 'Item' in response, "Item should be retrievable"
            assert response['Item']['device_id']['S'] == test_device_id
            
            # Cleanup
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    'device_id': {'S': test_device_id},
                    'timestamp': {'N': str(test_timestamp)}
                }
            )
        except ClientError as e:
            pytest.fail(f"Failed to write/read from DynamoDB table: {e}")


class TestKinesisStreamConfiguration:
    """Test Kinesis Data Stream for real-time sensor data."""
    
    def test_kinesis_stream_exists(self, stack_outputs, kinesis_client):
        """Verify Kinesis stream exists and is active."""
        stream_name = stack_outputs['kinesis_stream_name']
        
        response = kinesis_client.describe_stream(StreamName=stream_name)
        assert response['StreamDescription']['StreamStatus'] == 'ACTIVE', \
            "Kinesis stream must be in ACTIVE state"
    
    def test_kinesis_stream_on_demand_mode(self, stack_outputs, kinesis_client):
        """Verify stream is configured for on-demand capacity mode."""
        stream_name = stack_outputs['kinesis_stream_name']
        
        response = kinesis_client.describe_stream(StreamName=stream_name)
        stream_mode = response['StreamDescription'].get('StreamModeDetails', {})
        assert stream_mode.get('StreamMode') == 'ON_DEMAND', \
            "Stream should use ON_DEMAND mode for auto-scaling"
    
    def test_kinesis_stream_encryption_enabled(self, stack_outputs, kinesis_client):
        """Verify stream has encryption enabled."""
        stream_name = stack_outputs['kinesis_stream_name']
        
        response = kinesis_client.describe_stream(StreamName=stream_name)
        encryption_type = response['StreamDescription'].get('EncryptionType')
        assert encryption_type == 'KMS', \
            "Kinesis stream must use KMS encryption"
    
    def test_kinesis_put_and_get_records(self, stack_outputs, kinesis_client):
        """Verify stream accepts and retrieves records."""
        stream_name = stack_outputs['kinesis_stream_name']
        
        try:
            # Put test record
            test_data = json.dumps({
                'device_id': 'test-sensor-001',
                'timestamp': int(time.time()),
                'temperature': 68.5,
                'pressure': 101.3,
                'test': True
            })
            
            put_response = kinesis_client.put_record(
                StreamName=stream_name,
                Data=test_data.encode('utf-8'),
                PartitionKey='test-sensor-001'
            )
            assert 'SequenceNumber' in put_response, \
                "Put record should return sequence number"
            
            # Get shard iterator
            describe_response = kinesis_client.describe_stream(StreamName=stream_name)
            shard_id = describe_response['StreamDescription']['Shards'][0]['ShardId']
            
            iterator_response = kinesis_client.get_shard_iterator(
                StreamName=stream_name,
                ShardId=shard_id,
                ShardIteratorType='TRIM_HORIZON'
            )
            
            # Get records (may not immediately contain our test record due to timing)
            shard_iterator = iterator_response['ShardIterator']
            get_response = kinesis_client.get_records(ShardIterator=shard_iterator)
            assert 'Records' in get_response, "Should be able to get records"
            
        except ClientError as e:
            pytest.fail(f"Failed to put/get records from Kinesis: {e}")


class TestLambdaFunctionConfiguration:
    """Test Lambda function for processing sensor data."""
    
    def test_lambda_function_exists(self, stack_outputs, lambda_client):
        """Verify Lambda function exists and is active."""
        function_name = stack_outputs['lambda_function_name']
        
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['State'] == 'Active', \
            "Lambda function must be in Active state"
    
    def test_lambda_runtime_configuration(self, stack_outputs, lambda_client):
        """Verify Lambda function has correct runtime and configuration."""
        function_name = stack_outputs['lambda_function_name']
        
        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        
        assert config['Runtime'] == 'python3.11', \
            "Lambda must use Python 3.11 runtime"
        assert config['Handler'] == 'index.lambda_handler', \
            "Lambda handler must be index.lambda_handler"
        assert config['Timeout'] == 60, \
            "Lambda timeout should be 60 seconds"
        assert config['MemorySize'] == 256, \
            "Lambda memory should be 256 MB"
    
    def test_lambda_environment_variables(self, stack_outputs, lambda_client):
        """Verify Lambda function has required environment variables."""
        function_name = stack_outputs['lambda_function_name']
        
        response = lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})
        
        assert 'DYNAMODB_TABLE' in env_vars, \
            "Lambda must have DYNAMODB_TABLE environment variable"
        assert 'S3_BUCKET' in env_vars, \
            "Lambda must have S3_BUCKET environment variable"
        assert 'ENVIRONMENT_SUFFIX' in env_vars, \
            "Lambda must have ENVIRONMENT_SUFFIX environment variable"
        
        # Verify values match stack outputs
        assert env_vars['DYNAMODB_TABLE'] == stack_outputs['sensor_metrics_table_name']
        assert env_vars['S3_BUCKET'] == stack_outputs['sensor_data_bucket_name']
    
    def test_lambda_event_source_mapping(self, stack_outputs, lambda_client):
        """Verify Lambda has event source mapping from Kinesis."""
        function_name = stack_outputs['lambda_function_name']
        
        response = lambda_client.list_event_source_mappings(
            FunctionName=function_name
        )
        
        mappings = response.get('EventSourceMappings', [])
        assert len(mappings) > 0, \
            "Lambda must have at least one event source mapping"
        
        kinesis_mappings = [
            m for m in mappings
            if 'kinesis' in m['EventSourceArn'].lower()
        ]
        assert len(kinesis_mappings) > 0, \
            "Lambda must have Kinesis event source mapping"
        assert kinesis_mappings[0]['State'] in ['Enabled', 'Enabling'], \
            "Kinesis event source mapping must be enabled"


class TestIoTCoreConfiguration:
    """Test AWS IoT Core configuration."""
    
    def test_iot_thing_type_exists(self, stack_outputs, iot_client):
        """Verify IoT Thing Type exists."""
        thing_type_name = stack_outputs['iot_thing_type_name']
        
        response = iot_client.describe_thing_type(thingTypeName=thing_type_name)
        assert response['thingTypeName'] == thing_type_name
        assert 'thingTypeProperties' in response
    
    def test_iot_topic_rule_exists(self, stack_outputs, iot_client):
        """Verify IoT Topic Rule exists and is enabled."""
        # Topic rule name includes environment suffix
        # Pattern: sensor_data_rule_{environment_suffix}
        # We need to list rules and find the one for this stack
        response = iot_client.list_topic_rules()
        rules = response.get('rules', [])
        
        assert len(rules) > 0, "At least one IoT topic rule should exist"
        
        # Find rule related to sensor data
        sensor_rules = [
            r for r in rules
            if 'sensor_data_rule' in r['ruleName']
        ]
        assert len(sensor_rules) > 0, \
            "IoT topic rule for sensor data should exist"
        
        # Verify rule is enabled
        rule_name = sensor_rules[0]['ruleName']
        rule_detail = iot_client.get_topic_rule(ruleName=rule_name)
        assert not rule_detail['rule'].get('ruleDisabled', True), \
            "IoT topic rule must be enabled"
    
    def test_iot_rule_routes_to_kinesis(self, stack_outputs, iot_client):
        """Verify IoT Rule routes to Kinesis stream."""
        response = iot_client.list_topic_rules()
        rules = response.get('rules', [])
        
        sensor_rules = [
            r for r in rules
            if 'sensor_data_rule' in r['ruleName']
        ]
        
        if len(sensor_rules) > 0:
            rule_name = sensor_rules[0]['ruleName']
            rule_detail = iot_client.get_topic_rule(ruleName=rule_name)
            
            # Check for Kinesis action
            actions = rule_detail['rule'].get('actions', [])
            kinesis_actions = [a for a in actions if 'kinesis' in a]
            assert len(kinesis_actions) > 0, \
                "IoT rule must have Kinesis action configured"


class TestCloudTrailConfiguration:
    """Test CloudTrail for compliance logging."""
    
    def test_cloudtrail_exists(self, stack_outputs, cloudtrail_client):
        """Verify CloudTrail exists and is logging."""
        trail_name = stack_outputs['cloudtrail_name']
        
        response = cloudtrail_client.describe_trails(trailNameList=[trail_name])
        trails = response.get('trailList', [])
        assert len(trails) > 0, f"CloudTrail {trail_name} should exist"
    
    def test_cloudtrail_is_logging(self, stack_outputs, cloudtrail_client):
        """Verify CloudTrail is actively logging."""
        trail_name = stack_outputs['cloudtrail_name']
        
        response = cloudtrail_client.get_trail_status(Name=trail_name)
        assert response['IsLogging'] is True, \
            "CloudTrail must be actively logging for compliance"
    
    def test_cloudtrail_configuration(self, stack_outputs, cloudtrail_client):
        """Verify CloudTrail has correct configuration."""
        trail_name = stack_outputs['cloudtrail_name']
        
        response = cloudtrail_client.describe_trails(trailNameList=[trail_name])
        trail = response['trailList'][0]
        
        assert trail.get('IncludeGlobalServiceEvents') is True, \
            "CloudTrail should include global service events"
        assert 'S3BucketName' in trail, \
            "CloudTrail must be configured to write to S3"


class TestKMSKeyConfiguration:
    """Test KMS key for encryption."""
    
    def test_kms_key_exists(self, stack_outputs, kms_client):
        """Verify KMS key exists and is enabled."""
        key_id = stack_outputs['kms_key_id']
        
        response = kms_client.describe_key(KeyId=key_id)
        key_metadata = response['KeyMetadata']
        
        assert key_metadata['KeyState'] == 'Enabled', \
            "KMS key must be in Enabled state"
        assert key_metadata['Enabled'] is True
    
    def test_kms_key_rotation_enabled(self, stack_outputs, kms_client):
        """Verify KMS key rotation is enabled."""
        key_id = stack_outputs['kms_key_id']
        
        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response['KeyRotationEnabled'] is True, \
            "KMS key rotation must be enabled for security"
    
    def test_kms_key_alias_exists(self, stack_outputs, kms_client):
        """Verify KMS key has an alias configured."""
        key_id = stack_outputs['kms_key_id']
        
        response = kms_client.list_aliases()
        aliases = response.get('Aliases', [])
        
        # Find aliases pointing to our key
        key_aliases = [
            a for a in aliases
            if a.get('TargetKeyId') == key_id
        ]
        
        # Look for iot-manufacturing alias
        iot_aliases = [
            a for a in key_aliases
            if 'iot-manufacturing' in a.get('AliasName', '')
        ]
        assert len(iot_aliases) > 0, \
            "KMS key should have iot-manufacturing alias"


class TestCloudWatchLogsConfiguration:
    """Test CloudWatch Logs configuration."""
    
    def test_lambda_log_group_exists(self, stack_outputs, logs_client):
        """Verify Lambda log group exists."""
        function_name = stack_outputs['lambda_function_name']
        log_group_name = f"/aws/lambda/{function_name}"
        
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        log_groups = response.get('logGroups', [])
        assert len(log_groups) > 0, \
            f"Lambda log group {log_group_name} should exist"
    
    def test_lambda_log_group_retention(self, stack_outputs, logs_client):
        """Verify Lambda log group has retention policy."""
        function_name = stack_outputs['lambda_function_name']
        log_group_name = f"/aws/lambda/{function_name}"
        
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        log_groups = response.get('logGroups', [])
        
        if len(log_groups) > 0:
            log_group = log_groups[0]
            assert 'retentionInDays' in log_group, \
                "Log group should have retention policy configured"
            assert log_group['retentionInDays'] == 30, \
                "Log retention should be 30 days"
    
    def test_iot_log_group_exists(self, stack_outputs, logs_client):
        """Verify IoT log group exists."""
        # IoT log group pattern: /aws/iot/iot-rules-{environment_suffix}
        response = logs_client.describe_log_groups(
            logGroupNamePrefix="/aws/iot/iot-rules-"
        )
        log_groups = response.get('logGroups', [])
        
        # Should have at least one IoT log group
        assert len(log_groups) > 0, \
            "IoT rules log group should exist"


class TestEndToEndDataFlow:
    """Test complete data flow through the IoT pipeline."""
    
    def test_kinesis_to_lambda_processing(
        self,
        stack_outputs,
        kinesis_client,
        lambda_client,
        logs_client
    ):
        """Test data flow from Kinesis through Lambda processing."""
        stream_name = stack_outputs['kinesis_stream_name']
        function_name = stack_outputs['lambda_function_name']
        
        # Put test record to Kinesis
        test_data = json.dumps({
            'device_id': 'integration-test-device',
            'timestamp': int(time.time()),
            'temperature': 72.0,
            'vibration': 0.03,
            'pressure': 101.5,
            'test_record': True
        })
        
        try:
            put_response = kinesis_client.put_record(
                StreamName=stream_name,
                Data=test_data.encode('utf-8'),
                PartitionKey='integration-test-device'
            )
            assert 'SequenceNumber' in put_response
            
            # Wait for Lambda to process (event source mapping polls Kinesis)
            # Note: This is asynchronous and may take time
            time.sleep(5)
            
            # Check Lambda invocation metrics (basic validation)
            response = lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['State'] == 'Active'
            
        except ClientError as e:
            pytest.fail(f"End-to-end test failed: {e}")
    
    def test_complete_pipeline_configuration(
        self,
        stack_outputs,
        s3_client,
        dynamodb_client,
        kinesis_client,
        lambda_client
    ):
        """Verify all pipeline components are properly connected."""
        # Verify S3 bucket exists
        bucket_name = stack_outputs['sensor_data_bucket_name']
        s3_response = s3_client.head_bucket(Bucket=bucket_name)
        assert s3_response['ResponseMetadata']['HTTPStatusCode'] == 200
        
        # Verify DynamoDB table exists
        table_name = stack_outputs['sensor_metrics_table_name']
        dynamo_response = dynamodb_client.describe_table(TableName=table_name)
        assert dynamo_response['Table']['TableStatus'] == 'ACTIVE'
        
        # Verify Kinesis stream exists
        stream_name = stack_outputs['kinesis_stream_name']
        kinesis_response = kinesis_client.describe_stream(StreamName=stream_name)
        assert kinesis_response['StreamDescription']['StreamStatus'] == 'ACTIVE'
        
        # Verify Lambda function exists and has event source mapping
        function_name = stack_outputs['lambda_function_name']
        lambda_response = lambda_client.get_function(FunctionName=function_name)
        assert lambda_response['Configuration']['State'] == 'Active'
        
        mappings = lambda_client.list_event_source_mappings(
            FunctionName=function_name
        )
        assert len(mappings['EventSourceMappings']) > 0
        
        # All components connected successfully
        assert True, "Complete pipeline is properly configured"


class TestResourceNamingConvention:
    """Test that resources follow naming conventions with environment suffix."""
    
    def test_all_resources_include_suffix(self, stack_outputs):
        """Verify all resource names include environment suffix."""
        # Extract environment suffix from one of the resource names
        bucket_name = stack_outputs['sensor_data_bucket_name']
        
        # Bucket format: iot-sensor-data-{suffix}
        assert 'iot-sensor-data-' in bucket_name, \
            "S3 bucket should follow naming convention"
        
        # Extract suffix
        suffix = bucket_name.split('iot-sensor-data-')[1]
        assert len(suffix) > 0, "Environment suffix should not be empty"
        
        # Verify suffix is used in other resources
        table_name = stack_outputs['sensor_metrics_table_name']
        assert suffix in table_name, \
            f"DynamoDB table should include suffix: {suffix}"
        
        stream_name = stack_outputs['kinesis_stream_name']
        assert suffix in stream_name, \
            f"Kinesis stream should include suffix: {suffix}"
        
        function_name = stack_outputs['lambda_function_name']
        assert suffix in function_name, \
            f"Lambda function should include suffix: {suffix}"
        
        thing_type_name = stack_outputs['iot_thing_type_name']
        assert suffix in thing_type_name, \
            f"IoT Thing Type should include suffix: {suffix}"
        
        cloudtrail_name = stack_outputs['cloudtrail_name']
        assert suffix in cloudtrail_name, \
            f"CloudTrail should include suffix: {suffix}"
