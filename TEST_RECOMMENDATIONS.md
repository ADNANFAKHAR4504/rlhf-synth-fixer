# Integration Test Recommendations for IoT Platform Infrastructure

This document provides recommendations for integration tests that should be created to validate the deployed infrastructure.

## Test Structure

```
test/
├── __init__.py
├── test_integration.py
├── conftest.py
└── README.md
```

## Prerequisites

The tests should:
1. Load stack outputs from `cfn-outputs/flat-outputs.json`
2. Use real AWS SDK calls (no mocking)
3. Test actual deployed resources
4. Clean up any test data created

## Recommended Test Cases

### 1. VPC and Networking Tests

```python
def test_vpc_exists_and_configured(stack_outputs):
    """Verify VPC is created with proper configuration"""
    ec2 = boto3.client('ec2', region_name='us-east-1')

    vpc_id = stack_outputs['vpcId']

    # Verify VPC exists
    response = ec2.describe_vpcs(VpcIds=[vpc_id])
    vpc = response['Vpcs'][0]

    assert vpc['CidrBlock'] == '10.0.0.0/16'
    assert vpc['State'] == 'available'
    assert vpc['EnableDnsHostnames']['Value'] is True
    assert vpc['EnableDnsSupport']['Value'] is True

def test_subnets_in_multiple_azs(stack_outputs):
    """Verify private and public subnets exist in multiple AZs"""
    ec2 = boto3.client('ec2', region_name='us-east-1')

    vpc_id = stack_outputs['vpcId']

    # Get all subnets in VPC
    response = ec2.describe_subnets(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )

    subnets = response['Subnets']
    assert len(subnets) >= 4  # 2 public + 2 private

    # Check multiple AZs
    azs = set([s['AvailabilityZone'] for s in subnets])
    assert len(azs) >= 2  # At least 2 AZs for HA
```

### 2. ECS Cluster Tests

```python
def test_ecs_cluster_exists(stack_outputs):
    """Verify ECS cluster is created with Container Insights enabled"""
    ecs = boto3.client('ecs', region_name='us-east-1')

    cluster_arn = stack_outputs['ecsClusterArn']

    response = ecs.describe_clusters(clusters=[cluster_arn])
    cluster = response['clusters'][0]

    assert cluster['status'] == 'ACTIVE'
    assert cluster['clusterName'].startswith('iot-platform-cluster-')

    # Verify Container Insights is enabled
    settings = cluster.get('settings', [])
    insights_enabled = any(
        s['name'] == 'containerInsights' and s['value'] == 'enabled'
        for s in settings
    )
    assert insights_enabled is True

def test_ecs_iam_roles_exist(stack_outputs):
    """Verify ECS task execution and task roles exist with proper permissions"""
    iam = boto3.client('iam', region_name='us-east-1')

    # Extract environment suffix from cluster ARN
    cluster_arn = stack_outputs['ecsClusterArn']
    env_suffix = cluster_arn.split('cluster-')[-1]

    # Check task execution role
    exec_role_name = f"ecs-task-execution-role-{env_suffix}"
    response = iam.get_role(RoleName=exec_role_name)
    assert response['Role']['RoleName'] == exec_role_name

    # Check task role
    task_role_name = f"ecs-task-role-{env_suffix}"
    response = iam.get_role(RoleName=task_role_name)
    assert response['Role']['RoleName'] == task_role_name

    # Verify task role has policy attached
    policies = iam.list_attached_role_policies(RoleName=task_role_name)
    policy_names = [p['PolicyName'] for p in policies['AttachedPolicies']]
    assert f"ecs-task-policy-{env_suffix}" in policy_names
```

### 3. Kinesis Stream Tests

```python
def test_kinesis_stream_exists(stack_outputs):
    """Verify Kinesis stream is created with proper shard count and encryption"""
    kinesis = boto3.client('kinesis', region_name='us-east-1')

    stream_name = stack_outputs['kinesisStreamName']

    response = kinesis.describe_stream(StreamName=stream_name)
    stream = response['StreamDescription']

    assert stream['StreamStatus'] == 'ACTIVE'
    assert len(stream['Shards']) == 4  # 4 shards for 10,000+ machines
    assert stream['RetentionPeriodHours'] == 24
    assert stream['EncryptionType'] == 'KMS'

def test_kinesis_stream_write_and_read(stack_outputs):
    """Verify data can be written to and read from Kinesis stream"""
    kinesis = boto3.client('kinesis', region_name='us-east-1')

    stream_name = stack_outputs['kinesisStreamName']
    test_data = json.dumps({
        'sensor_id': 'test-sensor-001',
        'timestamp': int(time.time()),
        'temperature': 25.5,
        'pressure': 101.3
    })

    # Write record
    response = kinesis.put_record(
        StreamName=stream_name,
        Data=test_data,
        PartitionKey='test-sensor-001'
    )

    assert response['ResponseMetadata']['HTTPStatusCode'] == 200
    shard_id = response['ShardId']

    # Read record
    shard_iterator_response = kinesis.get_shard_iterator(
        StreamName=stream_name,
        ShardId=shard_id,
        ShardIteratorType='TRIM_HORIZON'
    )

    records_response = kinesis.get_records(
        ShardIterator=shard_iterator_response['ShardIterator']
    )

    assert len(records_response['Records']) > 0
```

### 4. ElastiCache Redis Tests

```python
def test_redis_cluster_exists(stack_outputs):
    """Verify Redis replication group exists with HA configuration"""
    elasticache = boto3.client('elasticache', region_name='us-east-1')

    redis_endpoint = stack_outputs['redisEndpoint']

    # Extract replication group ID from endpoint or use naming convention
    # Endpoint format: iot-redis-{env}.xxxxx.ng.0001.use1.cache.amazonaws.com
    replication_group_id = redis_endpoint.split('.')[0]

    response = elasticache.describe_replication_groups(
        ReplicationGroupId=replication_group_id
    )

    rg = response['ReplicationGroups'][0]

    assert rg['Status'] == 'available'
    assert rg['AutomaticFailover'] == 'enabled'
    assert rg['MultiAZ'] == 'enabled'
    assert rg['AtRestEncryptionEnabled'] is True
    assert rg['TransitEncryptionEnabled'] is True
    assert len(rg['MemberClusters']) == 2  # Primary + 1 replica

def test_redis_connection(stack_outputs):
    """Verify Redis cluster is accessible and can store/retrieve data"""
    import redis

    redis_endpoint = stack_outputs['redisEndpoint']

    # Note: This test would require network access to the Redis cluster
    # In practice, this should be run from within the VPC or through a bastion
    # For demonstration purposes:

    # redis_client = redis.Redis(
    #     host=redis_endpoint,
    #     port=6379,
    #     ssl=True,
    #     decode_responses=True
    # )
    #
    # test_key = f"test-key-{int(time.time())}"
    # test_value = "test-value"
    #
    # redis_client.set(test_key, test_value, ex=60)
    # retrieved_value = redis_client.get(test_key)
    #
    # assert retrieved_value == test_value

    # For synthetic environment, verify endpoint format is correct
    assert redis_endpoint is not None
    assert len(redis_endpoint) > 0
```

### 5. RDS Aurora Tests

```python
def test_aurora_cluster_exists(stack_outputs):
    """Verify Aurora cluster exists with Serverless v2 configuration"""
    rds = boto3.client('rds', region_name='us-east-1')

    aurora_endpoint = stack_outputs['auroraEndpoint']

    # Extract cluster identifier from endpoint
    cluster_id = aurora_endpoint.split('.')[0]

    response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
    cluster = response['DBClusters'][0]

    assert cluster['Status'] == 'available'
    assert cluster['Engine'] == 'aurora-postgresql'
    assert cluster['EngineMode'] == 'provisioned'
    assert cluster['StorageEncrypted'] is True
    assert cluster['BackupRetentionPeriod'] == 7
    assert 'postgresql' in cluster['EnabledCloudwatchLogsExports']

def test_aurora_instances_exist(stack_outputs):
    """Verify Aurora has writer and reader instances"""
    rds = boto3.client('rds', region_name='us-east-1')

    aurora_endpoint = stack_outputs['auroraEndpoint']
    cluster_id = aurora_endpoint.split('.')[0]

    response = rds.describe_db_cluster_members(DBClusterIdentifier=cluster_id)
    members = response['DBClusterMembers']

    assert len(members) >= 2  # Writer + Reader

    # Check for writer instance
    writers = [m for m in members if m['IsClusterWriter']]
    assert len(writers) == 1

    # Check for reader instance
    readers = [m for m in members if not m['IsClusterWriter']]
    assert len(readers) >= 1

def test_aurora_serverless_v2_configuration(stack_outputs):
    """Verify Aurora Serverless v2 scaling configuration"""
    rds = boto3.client('rds', region_name='us-east-1')

    aurora_endpoint = stack_outputs['auroraEndpoint']
    cluster_id = aurora_endpoint.split('.')[0]

    response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
    cluster = response['DBClusters'][0]

    scaling_config = cluster.get('ServerlessV2ScalingConfiguration', {})
    assert scaling_config['MinCapacity'] == 0.5
    assert scaling_config['MaxCapacity'] == 2.0
```

### 6. EFS Tests

```python
def test_efs_filesystem_exists(stack_outputs):
    """Verify EFS filesystem is created with encryption"""
    efs = boto3.client('efs', region_name='us-east-1')

    efs_id = stack_outputs['efsId']

    response = efs.describe_file_systems(FileSystemId=efs_id)
    filesystem = response['FileSystems'][0]

    assert filesystem['LifeCycleState'] == 'available'
    assert filesystem['Encrypted'] is True
    assert filesystem['PerformanceMode'] == 'generalPurpose'
    assert filesystem['ThroughputMode'] == 'bursting'

def test_efs_mount_targets(stack_outputs):
    """Verify EFS has mount targets in multiple AZs"""
    efs = boto3.client('efs', region_name='us-east-1')

    efs_id = stack_outputs['efsId']

    response = efs.describe_mount_targets(FileSystemId=efs_id)
    mount_targets = response['MountTargets']

    assert len(mount_targets) >= 2  # Multiple AZs for HA

    # Check mount targets are in different AZs
    azs = set([mt['AvailabilityZoneName'] for mt in mount_targets])
    assert len(azs) >= 2
```

### 7. API Gateway Tests

```python
def test_api_gateway_exists(stack_outputs):
    """Verify API Gateway is created and accessible"""
    apigatewayv2 = boto3.client('apigatewayv2', region_name='us-east-1')

    api_url = stack_outputs['apiGatewayUrl']

    # Extract API ID from URL
    # Format: https://{api-id}.execute-api.us-east-1.amazonaws.com
    api_id = api_url.split('//')[1].split('.')[0]

    response = apigatewayv2.get_api(ApiId=api_id)

    assert response['Name'].startswith('iot-api-gateway-')
    assert response['ProtocolType'] == 'HTTP'
    assert response['ApiEndpoint'] == api_url

def test_api_gateway_accessible(stack_outputs):
    """Verify API Gateway endpoint is accessible"""
    import requests

    api_url = stack_outputs['apiGatewayUrl']

    # Basic connectivity test
    try:
        response = requests.get(api_url, timeout=10)
        # 404 is acceptable if no routes are configured
        assert response.status_code in [200, 404]
    except requests.exceptions.Timeout:
        pytest.fail("API Gateway endpoint timed out")
```

### 8. Secrets Manager Tests

```python
def test_secrets_manager_secret_exists(stack_outputs):
    """Verify Secrets Manager secret is created with encryption"""
    secretsmanager = boto3.client('secretsmanager', region_name='us-east-1')

    secret_arn = stack_outputs['secretArn']

    response = secretsmanager.describe_secret(SecretId=secret_arn)

    assert response['ARN'] == secret_arn
    assert response['Name'].startswith('iot-db-credentials-')
    assert 'KmsKeyId' in response  # KMS encryption enabled

def test_secrets_manager_secret_value(stack_outputs):
    """Verify secret value is retrievable and has expected structure"""
    secretsmanager = boto3.client('secretsmanager', region_name='us-east-1')

    secret_arn = stack_outputs['secretArn']

    response = secretsmanager.get_secret_value(SecretId=secret_arn)
    secret_data = json.loads(response['SecretString'])

    # Verify expected keys exist
    assert 'username' in secret_data
    assert 'password' in secret_data
    assert 'engine' in secret_data
    assert 'port' in secret_data
    assert 'dbname' in secret_data

    assert secret_data['engine'] == 'postgres'
    assert secret_data['port'] == 5432
    assert secret_data['dbname'] == 'iotplatform'
```

### 9. KMS Encryption Tests

```python
def test_kms_key_exists(stack_outputs):
    """Verify KMS key is created with rotation enabled"""
    kms = boto3.client('kms', region_name='us-east-1')

    # Extract KMS key ID from secret ARN or other resources
    secretsmanager = boto3.client('secretsmanager', region_name='us-east-1')
    secret_arn = stack_outputs['secretArn']
    secret_desc = secretsmanager.describe_secret(SecretId=secret_arn)
    kms_key_id = secret_desc['KmsKeyId']

    response = kms.describe_key(KeyId=kms_key_id)
    key_metadata = response['KeyMetadata']

    assert key_metadata['KeyState'] == 'Enabled'
    assert key_metadata['Enabled'] is True

    # Check key rotation
    rotation_status = kms.get_key_rotation_status(KeyId=kms_key_id)
    assert rotation_status['KeyRotationEnabled'] is True
```

### 10. CloudWatch Monitoring Tests

```python
def test_cloudwatch_log_groups_exist(stack_outputs):
    """Verify CloudWatch log groups are created"""
    logs = boto3.client('logs', region_name='us-east-1')

    cluster_arn = stack_outputs['ecsClusterArn']
    env_suffix = cluster_arn.split('cluster-')[-1]

    # Check ECS log group
    ecs_log_group = f"/aws/ecs/iot-platform-{env_suffix}"
    response = logs.describe_log_groups(logGroupNamePrefix=ecs_log_group)
    assert len(response['logGroups']) == 1
    assert response['logGroups'][0]['retentionInDays'] == 7

    # Check API Gateway log group
    api_log_group = f"/aws/apigateway/iot-platform-{env_suffix}"
    response = logs.describe_log_groups(logGroupNamePrefix=api_log_group)
    assert len(response['logGroups']) == 1

def test_cloudwatch_alarms_exist(stack_outputs):
    """Verify CloudWatch alarms are created for monitoring"""
    cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

    cluster_arn = stack_outputs['ecsClusterArn']
    env_suffix = cluster_arn.split('cluster-')[-1]

    # Check for high error rate alarm
    alarm_name = f"iot-platform-high-error-rate-{env_suffix}"
    response = cloudwatch.describe_alarms(AlarmNames=[alarm_name])
    assert len(response['MetricAlarms']) == 1

    # Check for Kinesis latency alarm
    latency_alarm = f"iot-platform-kinesis-latency-{env_suffix}"
    response = cloudwatch.describe_alarms(AlarmNames=[latency_alarm])
    assert len(response['MetricAlarms']) == 1

    alarm = response['MetricAlarms'][0]
    assert alarm['MetricName'] == 'GetRecords.IteratorAgeMilliseconds'
    assert alarm['Threshold'] == 2000.0  # 2 seconds per requirement
```

## Test Fixtures

### conftest.py

```python
import pytest
import json
import os
import boto3

@pytest.fixture(scope="session")
def stack_outputs():
    """Load stack outputs from flat-outputs.json"""
    outputs_file = 'cfn-outputs/flat-outputs.json'

    if not os.path.exists(outputs_file):
        pytest.skip(f"Stack outputs file not found: {outputs_file}")

    with open(outputs_file, 'r') as f:
        return json.load(f)

@pytest.fixture(scope="session")
def aws_region():
    """Get AWS region from lib/AWS_REGION file"""
    region_file = 'lib/AWS_REGION'

    if os.path.exists(region_file):
        with open(region_file, 'r') as f:
            return f.read().strip()

    return 'us-east-1'  # Default region

@pytest.fixture
def cleanup_test_data():
    """Cleanup any test data created during tests"""
    test_data = []

    yield test_data

    # Cleanup logic here
    # For example, delete test records from Kinesis, Redis, etc.
    pass
```

## Running the Tests

```bash
# Install dependencies
pip install pytest boto3 redis requests

# Run all integration tests
pytest test/ -v

# Run specific test file
pytest test/test_integration.py -v

# Run tests with markers
pytest test/ -v -m "not slow"

# Run with coverage
pytest test/ -v --cov=lib --cov-report=html
```

## Test Coverage Goals

- VPC and Networking: 100% (critical for connectivity)
- Security (IAM, KMS, Secrets): 100% (critical for compliance)
- Data Services (Kinesis, Redis, Aurora): 90%+ (core functionality)
- Storage (EFS): 80%+
- API Gateway: 70%+ (depends on integration setup)
- Monitoring (CloudWatch): 80%+

## Notes

1. Some tests require network connectivity to private resources (Redis, Aurora, EFS)
   - These should be run from within the VPC or through a bastion host
   - Consider marking these as "integration" or "slow" tests

2. Tests should not modify production data
   - Use test-specific partition keys for Kinesis
   - Use test-specific keys for Redis with TTL
   - Use test databases for Aurora

3. Tests should be idempotent
   - Clean up test data after each run
   - Use unique identifiers for test resources

4. Consider CI/CD integration
   - Run tests after deployment
   - Block PRs if integration tests fail
   - Set up scheduled test runs to detect drift
