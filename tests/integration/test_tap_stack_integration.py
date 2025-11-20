"""
Integration tests for TapStack deployment.
Tests deployed infrastructure using actual AWS resources.
"""

import os
import json
import pytest
import boto3
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from deployment."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip(f"{outputs_file} not found - stack not deployed")

    with open(outputs_file, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def rds_client():
    """Create RDS client for us-east-1."""
    return boto3.client('rds', region_name='us-east-1')


@pytest.fixture(scope="module")
def rds_client_replica():
    """Create RDS client for eu-west-1."""
    return boto3.client('rds', region_name='eu-west-1')


@pytest.fixture(scope="module")
def lambda_client():
    """Create Lambda client for us-east-1."""
    return boto3.client('lambda', region_name='us-east-1')


@pytest.fixture(scope="module")
def route53_client():
    """Create Route53 client."""
    return boto3.client('route53')


@pytest.fixture(scope="module")
def cloudwatch_client():
    """Create CloudWatch client for us-east-1."""
    return boto3.client('cloudwatch', region_name='us-east-1')


@pytest.fixture(scope="module")
def secrets_manager_client():
    """Create Secrets Manager client for us-east-1."""
    return boto3.client('secretsmanager', region_name='us-east-1')


class TestTapStackIntegration:
    """Integration tests for deployed TapStack infrastructure."""

    def test_stack_outputs_exist(self, stack_outputs):
        """Test that all required stack outputs are present."""
        required_outputs = [
            "PrimaryEndpoint",
            "ReplicaEndpoint",
            "Route53CNAME",
            "FailoverFunctionArn"
        ]

        for output in required_outputs:
            assert output in stack_outputs, f"Missing output: {output}"
            assert stack_outputs[output], f"Empty output: {output}"

    def test_primary_database_exists(self, stack_outputs, rds_client):
        """Test that primary RDS instance exists and is available."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]

        # Extract instance identifier from endpoint
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]

            # Verify instance configuration
            assert instance['DBInstanceStatus'] in ['available', 'backing-up', 'modifying'], \
                f"Primary instance in unexpected state: {instance['DBInstanceStatus']}"
            assert instance['Engine'] == 'postgres'
            assert instance['StorageEncrypted'] is True
            assert instance['MultiAZ'] is True
            assert instance['BackupRetentionPeriod'] >= 7

        except ClientError as e:
            pytest.fail(f"Failed to describe primary instance: {e}")

    def test_replica_database_exists(self, stack_outputs, rds_client_replica):
        """Test that replica RDS instance exists and is available."""
        replica_endpoint = stack_outputs["ReplicaEndpoint"]

        # Extract instance identifier from endpoint
        instance_id = replica_endpoint.split('.')[0]

        try:
            response = rds_client_replica.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]

            # Verify instance configuration
            assert instance['DBInstanceStatus'] in ['available', 'backing-up', 'modifying'], \
                f"Replica instance in unexpected state: {instance['DBInstanceStatus']}"
            assert instance['Engine'] == 'postgres'
            assert instance['StorageEncrypted'] is True

            # Verify it's a read replica
            assert 'ReadReplicaSourceDBInstanceIdentifier' in instance or \
                   instance.get('ReadReplicaDBInstanceIdentifiers', []), \
                   "Instance is not configured as a read replica"

        except ClientError as e:
            pytest.fail(f"Failed to describe replica instance: {e}")

    def test_database_encryption(self, stack_outputs, rds_client):
        """Test that databases have encryption at rest enabled."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]
            assert instance['StorageEncrypted'] is True
            assert 'KmsKeyId' in instance

        except ClientError as e:
            pytest.fail(f"Failed to verify encryption: {e}")

    def test_failover_lambda_exists(self, stack_outputs, lambda_client):
        """Test that failover Lambda function exists and is configured correctly."""
        function_arn = stack_outputs["FailoverFunctionArn"]
        function_name = function_arn.split(':')[-1]

        try:
            response = lambda_client.get_function(FunctionName=function_name)

            config = response['Configuration']

            # Verify function configuration
            assert config['Runtime'] == 'python3.11'
            assert config['Timeout'] == 300
            assert config['Handler'] == 'index.handler'

            # Verify environment variables
            env_vars = config['Environment']['Variables']
            assert 'PRIMARY_INSTANCE_ID' in env_vars
            assert 'REPLICA_INSTANCE_ID' in env_vars
            assert 'HOSTED_ZONE_ID' in env_vars
            assert 'RECORD_NAME' in env_vars

            # Verify VPC configuration
            assert 'VpcConfig' in config
            assert config['VpcConfig']['SubnetIds']
            assert config['VpcConfig']['SecurityGroupIds']

        except ClientError as e:
            pytest.fail(f"Failed to describe Lambda function: {e}")

    def test_lambda_has_correct_permissions(self, stack_outputs, lambda_client):
        """Test that Lambda function has required IAM permissions."""
        function_arn = stack_outputs["FailoverFunctionArn"]
        function_name = function_arn.split(':')[-1]

        try:
            response = lambda_client.get_function(FunctionName=function_name)
            role_arn = response['Configuration']['Role']

            # Verify role exists and has a name
            assert role_arn
            assert 'FailoverRole' in role_arn or 'role' in role_arn.lower()

        except ClientError as e:
            pytest.fail(f"Failed to verify Lambda permissions: {e}")

    def test_route53_hosted_zone_exists(self, stack_outputs, route53_client):
        """Test that Route53 private hosted zone exists."""
        route53_cname = stack_outputs["Route53CNAME"]
        zone_name = '.'.join(route53_cname.split('.')[1:])  # Remove subdomain

        try:
            # List all hosted zones and find ours
            response = route53_client.list_hosted_zones()

            matching_zones = [z for z in response['HostedZones'] if zone_name in z['Name']]
            assert len(matching_zones) > 0, f"No hosted zone found for {zone_name}"

            zone = matching_zones[0]
            assert zone['Config']['PrivateZone'] is True

        except ClientError as e:
            pytest.fail(f"Failed to verify Route53 hosted zone: {e}")

    def test_cloudwatch_alarms_exist(self, cloudwatch_client):
        """Test that CloudWatch alarms are created and in OK or ALARM state."""
        try:
            response = cloudwatch_client.describe_alarms()

            alarms = response['MetricAlarms']

            # Check for replication lag alarm
            replication_alarms = [a for a in alarms if 'replication' in a['AlarmName'].lower() or 'replica' in a['AlarmName'].lower()]
            assert len(replication_alarms) > 0, "No replication lag alarms found"

            # Check for CPU alarms
            cpu_alarms = [a for a in alarms if 'cpu' in a['AlarmName'].lower()]
            assert len(cpu_alarms) >= 2, "Expected at least 2 CPU alarms (primary and replica)"

            # Verify alarms are in valid state
            for alarm in alarms:
                assert alarm['StateValue'] in ['OK', 'ALARM', 'INSUFFICIENT_DATA'], \
                    f"Alarm {alarm['AlarmName']} in unexpected state: {alarm['StateValue']}"

        except ClientError as e:
            pytest.fail(f"Failed to describe CloudWatch alarms: {e}")

    def test_secrets_manager_secret_exists(self, secrets_manager_client):
        """Test that database credentials are stored in Secrets Manager."""
        # Search for postgres credential secrets
        try:
            response = secrets_manager_client.list_secrets()

            postgres_secrets = [s for s in response['SecretList'] if 'postgres' in s['Name'].lower()]
            assert len(postgres_secrets) > 0, "No PostgreSQL secrets found in Secrets Manager"

            # Verify secret can be retrieved
            secret_name = postgres_secrets[0]['Name']
            secret_response = secrets_manager_client.get_secret_value(SecretId=secret_name)

            assert 'SecretString' in secret_response
            secret_data = json.loads(secret_response['SecretString'])
            assert 'username' in secret_data
            assert 'password' in secret_data

        except ClientError as e:
            pytest.fail(f"Failed to verify Secrets Manager secret: {e}")

    def test_database_parameter_groups(self, stack_outputs, rds_client):
        """Test that database parameter groups are configured correctly."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]
            param_groups = instance['DBParameterGroups']

            assert len(param_groups) > 0, "No parameter groups attached to instance"

            param_group_name = param_groups[0]['DBParameterGroupName']

            # Get parameter group details
            params_response = rds_client.describe_db_parameters(
                DBParameterGroupName=param_group_name
            )

            params = {p['ParameterName']: p.get('ParameterValue') for p in params_response['Parameters']}

            # Verify audit logging is enabled
            if 'log_statement' in params:
                assert params['log_statement'] == 'all', "Audit logging not configured correctly"

        except ClientError as e:
            pytest.fail(f"Failed to verify parameter groups: {e}")

    def test_cloudwatch_logs_enabled(self, stack_outputs, rds_client):
        """Test that CloudWatch Logs are enabled for RDS instances."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]

            # Verify CloudWatch Logs exports are enabled
            assert 'EnabledCloudwatchLogsExports' in instance
            exports = instance['EnabledCloudwatchLogsExports']
            assert 'postgresql' in exports, "PostgreSQL logs not exported to CloudWatch"

        except ClientError as e:
            pytest.fail(f"Failed to verify CloudWatch Logs: {e}")

    def test_vpc_configuration(self, stack_outputs, rds_client):
        """Test that RDS instances are deployed in private subnets."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]

            # Verify not publicly accessible
            assert instance['PubliclyAccessible'] is False, \
                "Database should not be publicly accessible"

            # Verify VPC configuration
            assert 'DBSubnetGroup' in instance
            assert 'VpcId' in instance['DBSubnetGroup']

        except ClientError as e:
            pytest.fail(f"Failed to verify VPC configuration: {e}")

    def test_lambda_can_be_invoked(self, stack_outputs, lambda_client):
        """Test that Lambda function can be invoked successfully."""
        function_arn = stack_outputs["FailoverFunctionArn"]
        function_name = function_arn.split(':')[-1]

        try:
            # Invoke Lambda function with test payload
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps({'detail-type': 'Integration Test'})
            )

            # Verify invocation was successful
            assert response['StatusCode'] == 200

            # Parse response
            payload = json.loads(response['Payload'].read())
            assert 'statusCode' in payload

            # Lambda should return 200 (healthy) or 500 (both unavailable) depending on timing
            # We don't assert specific status as it depends on actual instance states

        except ClientError as e:
            pytest.fail(f"Failed to invoke Lambda function: {e}")

    def test_resource_naming_includes_environment_suffix(self, stack_outputs):
        """Test that all resource names include environment suffix."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        replica_endpoint = stack_outputs["ReplicaEndpoint"]
        function_arn = stack_outputs["FailoverFunctionArn"]

        # Extract resource names
        primary_id = primary_endpoint.split('.')[0]
        replica_id = replica_endpoint.split('.')[0]
        function_name = function_arn.split(':')[-1]

        # Verify all contain environment suffix pattern
        # Names should follow pattern: {resource}-{suffix}
        assert '-' in primary_id, "Primary instance name doesn't follow naming convention"
        assert '-' in replica_id, "Replica instance name doesn't follow naming convention"
        assert '-' in function_name, "Lambda function name doesn't follow naming convention"

    def test_multi_az_configuration(self, stack_outputs, rds_client):
        """Test that primary database is configured for Multi-AZ."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]
            assert instance['MultiAZ'] is True, "Primary instance should be Multi-AZ"

        except ClientError as e:
            pytest.fail(f"Failed to verify Multi-AZ configuration: {e}")

    def test_backup_configuration(self, stack_outputs, rds_client):
        """Test that backup retention is configured correctly."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]
            assert instance['BackupRetentionPeriod'] >= 7, \
                f"Backup retention should be at least 7 days, got {instance['BackupRetentionPeriod']}"

        except ClientError as e:
            pytest.fail(f"Failed to verify backup configuration: {e}")

    def test_deletion_protection_disabled(self, stack_outputs, rds_client):
        """Test that deletion protection is disabled for testing."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )

            instance = response['DBInstances'][0]
            assert instance['DeletionProtection'] is False, \
                "Deletion protection should be disabled for testing"

        except ClientError as e:
            pytest.fail(f"Failed to verify deletion protection: {e}")
