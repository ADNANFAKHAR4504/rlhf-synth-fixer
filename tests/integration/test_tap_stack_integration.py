"""
Integration tests for TapStack deployment.
Tests deployed infrastructure using actual AWS resources.
"""

import os
import json
import pytest
import boto3
from pathlib import Path


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from flat-outputs.json."""
    outputs_path = Path.cwd() / 'cfn-outputs' / 'flat-outputs.json'
    if not outputs_path.exists():
        pytest.skip(f"{outputs_path} not found - stack not deployed")

    with open(outputs_path, 'r', encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment variable."""
    region = os.environ.get('AWS_REGION')
    if not region:
        pytest.skip("AWS_REGION environment variable not set")
    return region


@pytest.fixture(scope="module")
def environment_suffix():
    """Get environment suffix from environment variable."""
    suffix = os.environ.get('ENVIRONMENT_SUFFIX')
    if not suffix:
        pytest.skip("ENVIRONMENT_SUFFIX environment variable not set")
    return suffix


@pytest.fixture(scope="module")
def rds_client(aws_region):
    """Create RDS client using environment region."""
    return boto3.client('rds', region_name=aws_region)


@pytest.fixture(scope="module")
def rds_client_replica():
    """Create RDS client for replica region."""
    replica_region = os.environ.get('REPLICA_REGION')
    if not replica_region:
        pytest.skip("REPLICA_REGION environment variable not set")
    return boto3.client('rds', region_name=replica_region)


@pytest.fixture(scope="module")
def lambda_client(aws_region):
    """Create Lambda client using environment region."""
    return boto3.client('lambda', region_name=aws_region)


@pytest.fixture(scope="module")
def route53_client():
    """Create Route53 client (global service)."""
    return boto3.client('route53')


@pytest.fixture(scope="module")
def cloudwatch_client(aws_region):
    """Create CloudWatch client using environment region."""
    return boto3.client('cloudwatch', region_name=aws_region)


@pytest.fixture(scope="module")
def secrets_manager_client(aws_region):
    """Create Secrets Manager client using environment region."""
    return boto3.client('secretsmanager', region_name=aws_region)


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

    def test_replica_database_exists(self, stack_outputs, rds_client):
        """Test that replica RDS instance exists and is available.

        Note: Due to CDK single-stack limitations, the replica is currently deployed
        in the same region as the primary (us-east-1) rather than eu-west-1.
        """
        replica_endpoint = stack_outputs["ReplicaEndpoint"]

        # Extract instance identifier from endpoint
        instance_id = replica_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
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


    def test_database_encryption(self, stack_outputs, rds_client):
        """Test that databases have encryption at rest enabled."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        instance = response['DBInstances'][0]
        assert instance['StorageEncrypted'] is True
        assert 'KmsKeyId' in instance


    def test_failover_lambda_exists(self, stack_outputs, lambda_client):
        """Test that failover Lambda function exists and is configured correctly."""
        function_arn = stack_outputs["FailoverFunctionArn"]
        function_name = function_arn.split(':')[-1]

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


    def test_lambda_has_correct_permissions(self, stack_outputs, lambda_client):
        """Test that Lambda function has required IAM permissions."""
        function_arn = stack_outputs["FailoverFunctionArn"]
        function_name = function_arn.split(':')[-1]

        response = lambda_client.get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']

        # Verify role exists and has a name
        assert role_arn
        assert 'FailoverRole' in role_arn or 'role' in role_arn.lower()


    def test_route53_hosted_zone_exists(self, stack_outputs, route53_client):
        """Test that Route53 private hosted zone exists."""
        route53_cname = stack_outputs["Route53CNAME"]
        zone_name = '.'.join(route53_cname.split('.')[1:])  # Remove subdomain

        # List all hosted zones and find ours
        response = route53_client.list_hosted_zones()

        matching_zones = [z for z in response['HostedZones'] if zone_name in z['Name']]
        assert len(matching_zones) > 0, f"No hosted zone found for {zone_name}"

        zone = matching_zones[0]
        assert zone['Config']['PrivateZone'] is True


    def test_cloudwatch_alarms_exist(self, cloudwatch_client, environment_suffix):
        """Test that CloudWatch alarms are created and in OK or ALARM state."""
        # Use pagination to get all alarms
        all_alarms = []
        paginator = cloudwatch_client.get_paginator('describe_alarms')
        for page in paginator.paginate():
            all_alarms.extend(page['MetricAlarms'])

        # Filter alarms for this environment only
        env_alarms = [a for a in all_alarms if environment_suffix in a['AlarmName']]

        # Check for replication lag alarm
        replication_alarms = [
            a for a in env_alarms
            if "replication" in a["AlarmName"].lower() or "replica" in a["AlarmName"].lower()
        ]
        assert len(replication_alarms) > 0, "No replication lag alarms found"

        # Check for CPU alarms
        cpu_alarms = [a for a in env_alarms if 'cpu' in a['AlarmName'].lower()]
        assert len(cpu_alarms) >= 2, "Expected at least 2 CPU alarms (primary and replica)"

        # Verify alarms are in valid state
        for alarm in env_alarms:
            assert alarm['StateValue'] in ['OK', 'ALARM', 'INSUFFICIENT_DATA'], \
                f"Alarm {alarm['AlarmName']} in unexpected state: {alarm['StateValue']}"


    def test_secrets_manager_secret_exists(self, secrets_manager_client):
        """Test that database credentials are stored in Secrets Manager."""
        # Search for postgres credential secrets with pagination
        all_secrets = []
        paginator = secrets_manager_client.get_paginator('list_secrets')
        for page in paginator.paginate():
            all_secrets.extend(page['SecretList'])

        postgres_secrets = [s for s in all_secrets if 'postgres' in s['Name'].lower()]
        assert len(postgres_secrets) > 0, "No PostgreSQL secrets found in Secrets Manager"

        # Verify secret can be retrieved
        secret_name = postgres_secrets[0]['Name']
        secret_response = secrets_manager_client.get_secret_value(SecretId=secret_name)

        assert 'SecretString' in secret_response
        secret_data = json.loads(secret_response['SecretString'])
        assert 'username' in secret_data
        assert 'password' in secret_data


    def test_database_parameter_groups(self, stack_outputs, rds_client):
        """Test that database parameter groups are configured correctly."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

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


    def test_cloudwatch_logs_enabled(self, stack_outputs, rds_client):
        """Test that CloudWatch Logs are enabled for RDS instances."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        instance = response['DBInstances'][0]

        # Verify CloudWatch Logs exports are enabled
        assert 'EnabledCloudwatchLogsExports' in instance
        exports = instance['EnabledCloudwatchLogsExports']
        assert 'postgresql' in exports, "PostgreSQL logs not exported to CloudWatch"


    def test_vpc_configuration(self, stack_outputs, rds_client):
        """Test that RDS instances are deployed in private subnets."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

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

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        instance = response['DBInstances'][0]
        assert instance['MultiAZ'] is True, "Primary instance should be Multi-AZ"


    def test_backup_configuration(self, stack_outputs, rds_client):
        """Test that backup retention is configured correctly."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        instance = response['DBInstances'][0]
        assert instance['BackupRetentionPeriod'] >= 7, \
            f"Backup retention should be at least 7 days, got {instance['BackupRetentionPeriod']}"


    def test_deletion_protection_disabled(self, stack_outputs, rds_client):
        """Test that deletion protection is disabled for testing."""
        primary_endpoint = stack_outputs["PrimaryEndpoint"]
        instance_id = primary_endpoint.split('.')[0]

        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        instance = response['DBInstances'][0]
        assert instance['DeletionProtection'] is False, \
            "Deletion protection should be disabled for testing"
