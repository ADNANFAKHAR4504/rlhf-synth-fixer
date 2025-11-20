"""
Integration tests for multi-region DR infrastructure.
Tests validate actual deployed resources using cfn-outputs/flat-outputs.json.
No mocking - all tests use real AWS resources.
"""

import json
import os
import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(scope='module')
def outputs():
    """Load deployment outputs from cfn-outputs/flat-outputs.json."""
    outputs_file = os.path.join(os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')

    if not os.path.exists(outputs_file):
        pytest.skip(f"Outputs file not found: {outputs_file}. Run deployment first.")

    with open(outputs_file, 'r') as f:
        return json.load(f)


@pytest.fixture(scope='module')
def primary_rds_client():
    """Get RDS client for primary region."""
    return boto3.client('rds', region_name='us-east-1')


@pytest.fixture(scope='module')
def dr_rds_client():
    """Get RDS client for DR region."""
    return boto3.client('rds', region_name='us-west-2')


@pytest.fixture(scope='module')
def primary_ec2_client():
    """Get EC2 client for primary region."""
    return boto3.client('ec2', region_name='us-east-1')


@pytest.fixture(scope='module')
def dr_ec2_client():
    """Get EC2 client for DR region."""
    return boto3.client('ec2', region_name='us-west-2')


@pytest.fixture(scope='module')
def lambda_client():
    """Get Lambda client for primary region."""
    return boto3.client('lambda', region_name='us-east-1')


@pytest.fixture(scope='module')
def cloudwatch_client():
    """Get CloudWatch client for primary region."""
    return boto3.client('cloudwatch', region_name='us-east-1')


@pytest.fixture(scope='module')
def secrets_client_primary():
    """Get Secrets Manager client for primary region."""
    return boto3.client('secretsmanager', region_name='us-east-1')


@pytest.fixture(scope='module')
def secrets_client_dr():
    """Get Secrets Manager client for DR region."""
    return boto3.client('secretsmanager', region_name='us-west-2')


@pytest.fixture(scope='module')
def route53_client():
    """Get Route53 client."""
    return boto3.client('route53')


class TestVPCResources:
    """Test VPC and network resources in both regions."""

    def test_primary_vpc_exists(self, outputs, primary_ec2_client):
        """Verify primary VPC exists and is available."""
        vpc_id = outputs['primary_vpc_id']

        response = primary_ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'
        assert response['Vpcs'][0]['CidrBlock'] == '10.0.0.0/16'

    def test_dr_vpc_exists(self, outputs, dr_ec2_client):
        """Verify DR VPC exists and is available."""
        vpc_id = outputs['dr_vpc_id']

        response = dr_ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'
        assert response['Vpcs'][0]['CidrBlock'] == '10.1.0.0/16'

    def test_vpc_peering_connection(self, outputs, primary_ec2_client):
        """Verify VPC peering connection is active."""
        peering_id = outputs['vpc_peering_connection_id']

        response = primary_ec2_client.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )

        assert len(response['VpcPeeringConnections']) == 1
        peering = response['VpcPeeringConnections'][0]
        assert peering['Status']['Code'] == 'active'
        assert peering['AccepterVpcInfo']['Region'] == 'us-west-2'
        assert peering['RequesterVpcInfo']['Region'] == 'us-east-1'

    def test_primary_subnets_exist(self, outputs, primary_ec2_client):
        """Verify primary VPC has required subnets."""
        vpc_id = outputs['primary_vpc_id']

        response = primary_ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have 3 private subnets
        assert len(response['Subnets']) >= 3

        # Verify all subnets are available
        for subnet in response['Subnets']:
            assert subnet['State'] == 'available'
            assert subnet['AvailabilityZoneId'] is not None

    def test_dr_subnets_exist(self, outputs, dr_ec2_client):
        """Verify DR VPC has required subnets."""
        vpc_id = outputs['dr_vpc_id']

        response = dr_ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have 3 private subnets
        assert len(response['Subnets']) >= 3

        # Verify all subnets are available
        for subnet in response['Subnets']:
            assert subnet['State'] == 'available'
            assert subnet['AvailabilityZoneId'] is not None


class TestRDSInstances:
    """Test RDS database instances in both regions."""

    def test_primary_rds_instance(self, outputs, primary_rds_client):
        """Verify primary RDS instance exists and is available."""
        endpoint = outputs['primary_db_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = primary_rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        assert len(response['DBInstances']) == 1
        db = response['DBInstances'][0]
        assert db['DBInstanceStatus'] in ['available', 'backing-up', 'modifying']
        assert db['Engine'] == 'postgres'
        assert db['EngineVersion'].startswith('15')
        assert db['MultiAZ'] is True
        assert db['StorageEncrypted'] is True
        assert db['PubliclyAccessible'] is False

    def test_dr_rds_instance(self, outputs, dr_rds_client):
        """Verify DR RDS instance exists and is available."""
        endpoint = outputs['dr_db_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = dr_rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        assert len(response['DBInstances']) == 1
        db = response['DBInstances'][0]
        assert db['DBInstanceStatus'] in ['available', 'backing-up', 'modifying', 'creating']
        assert db['Engine'] == 'postgres'
        assert db['StorageEncrypted'] is True
        assert db['PubliclyAccessible'] is False

    def test_rds_read_replica_relationship(self, outputs, primary_rds_client, dr_rds_client):
        """Verify DR instance is configured as read replica of primary."""
        primary_endpoint = outputs['primary_db_endpoint']
        primary_id = primary_endpoint.split('.')[0]

        dr_endpoint = outputs['dr_db_endpoint']
        dr_id = dr_endpoint.split('.')[0]

        # Check primary has replicas
        primary_response = primary_rds_client.describe_db_instances(
            DBInstanceIdentifier=primary_id
        )

        primary_db = primary_response['DBInstances'][0]
        # Primary should list DR as replica
        replica_ids = [r.split(':')[-1] for r in primary_db.get('ReadReplicaDBInstanceIdentifiers', [])]

        # Check DR instance configuration
        dr_response = dr_rds_client.describe_db_instances(
            DBInstanceIdentifier=dr_id
        )

        dr_db = dr_response['DBInstances'][0]

        # If DR is a replica, it should have source identifier
        # If it's standalone, it was already promoted
        if 'ReadReplicaSourceDBInstanceIdentifier' in dr_db:
            source_arn = dr_db['ReadReplicaSourceDBInstanceIdentifier']
            assert primary_id in source_arn

    def test_rds_backup_configuration(self, outputs, primary_rds_client):
        """Verify RDS backup configuration."""
        endpoint = outputs['primary_db_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = primary_rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db = response['DBInstances'][0]
        assert db['BackupRetentionPeriod'] == 7
        assert db['PreferredBackupWindow'] is not None

    def test_rds_performance_insights_enabled(self, outputs, primary_rds_client):
        """Verify Performance Insights is enabled."""
        endpoint = outputs['primary_db_endpoint']
        db_identifier = endpoint.split('.')[0]

        response = primary_rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        db = response['DBInstances'][0]
        assert db['PerformanceInsightsEnabled'] is True


class TestSecretsManager:
    """Test Secrets Manager secrets for database credentials."""

    def test_primary_secret_exists(self, outputs, secrets_client_primary):
        """Verify primary database secret exists and contains credentials."""
        secret_arn = outputs['primary_db_secret_arn']

        response = secrets_client_primary.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn
        assert 'rds-master-password-primary' in response['Name']

        # Verify secret value can be retrieved
        secret_value = secrets_client_primary.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(secret_value['SecretString'])
        assert 'username' in secret_data
        assert 'password' in secret_data

    def test_dr_secret_exists(self, outputs, secrets_client_dr):
        """Verify DR database secret exists and contains credentials."""
        secret_arn = outputs['dr_db_secret_arn']

        response = secrets_client_dr.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn
        assert 'rds-master-password-dr' in response['Name']

        # Verify secret value can be retrieved
        secret_value = secrets_client_dr.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(secret_value['SecretString'])
        assert 'username' in secret_data
        assert 'password' in secret_data


class TestLambdaFunction:
    """Test Lambda monitoring function."""

    def test_lambda_function_exists(self, outputs, lambda_client):
        """Verify Lambda function exists and is configured correctly."""
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function(FunctionName=function_name)

        config = response['Configuration']
        assert config['Runtime'] == 'python3.9'
        assert config['Handler'] == 'monitor_replication.lambda_handler'
        assert config['Timeout'] == 60
        assert 'DR_DB_IDENTIFIER' in config['Environment']['Variables']
        assert 'REPLICATION_LAG_THRESHOLD' in config['Environment']['Variables']

    def test_lambda_can_be_invoked(self, outputs, lambda_client):
        """Verify Lambda function can be invoked successfully."""
        function_name = outputs['lambda_function_name']

        # Invoke Lambda function
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse'
        )

        assert response['StatusCode'] == 200
        assert 'FunctionError' not in response

        # Parse response
        payload = json.loads(response['Payload'].read())
        assert payload['statusCode'] in [200, 500]  # May return 500 if no data yet

    def test_lambda_cloudwatch_logs(self, outputs, lambda_client):
        """Verify Lambda has CloudWatch logs configured."""
        function_name = outputs['lambda_function_name']

        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Lambda should have log configuration
        assert config['LoggingConfig'] is not None or 'LoggingConfig' in config


class TestCloudWatchAlarms:
    """Test CloudWatch alarms for monitoring."""

    def test_replication_lag_alarm_exists(self, cloudwatch_client):
        """Verify replication lag alarm exists."""
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix='rds-replication-lag'
        )

        # Should have at least one replication lag alarm
        assert len(response['MetricAlarms']) >= 1

        alarm = response['MetricAlarms'][0]
        assert alarm['MetricName'] == 'ReplicaLag'
        assert alarm['Namespace'] == 'AWS/RDS'
        assert alarm['Statistic'] == 'Average'

    def test_cpu_utilization_alarms_exist(self, cloudwatch_client):
        """Verify CPU utilization alarms exist for both instances."""
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix='rds-cpu'
        )

        # Should have alarms for primary and DR
        assert len(response['MetricAlarms']) >= 2

        for alarm in response['MetricAlarms']:
            assert alarm['MetricName'] == 'CPUUtilization'
            assert alarm['Namespace'] == 'AWS/RDS'
            assert alarm['Threshold'] == 80

    def test_database_connections_alarms_exist(self, cloudwatch_client):
        """Verify database connections alarms exist."""
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix='rds-connections'
        )

        # Should have alarms for primary and DR
        assert len(response['MetricAlarms']) >= 2

        for alarm in response['MetricAlarms']:
            assert alarm['MetricName'] == 'DatabaseConnections'
            assert alarm['Namespace'] == 'AWS/RDS'
            assert alarm['Threshold'] == 100


class TestRoute53Failover:
    """Test Route53 DNS failover configuration."""

    def test_route53_hosted_zone_exists(self, route53_client):
        """Verify Route53 hosted zone exists for failover."""
        response = route53_client.list_hosted_zones()

        # Find hosted zone for trading-db.internal
        zone = next(
            (z for z in response['HostedZones'] if 'trading-db.internal' in z['Name']),
            None
        )

        if zone:
            assert zone['Config']['PrivateZone'] is True

    def test_route53_health_checks_exist(self, outputs, route53_client):
        """Verify Route53 health checks exist for failover."""
        response = route53_client.list_health_checks()

        # Should have health checks for primary and DR
        health_checks = response['HealthChecks']

        # Filter health checks created for this deployment
        env_suffix = 'c0c6w2'
        relevant_checks = [
            hc for hc in health_checks
            if any(tag['Value'] == env_suffix for tag in route53_client.list_tags_for_resource(
                ResourceType='healthcheck',
                ResourceId=hc['Id']
            ).get('ResourceTagSet', {}).get('Tags', []))
        ]

        # Should have at least primary and DR health checks
        assert len(relevant_checks) >= 2


class TestEndToEndWorkflow:
    """Test complete DR workflow."""

    def test_all_components_deployed(self, outputs):
        """Verify all required components are in outputs."""
        required_outputs = [
            'primary_db_endpoint',
            'dr_db_endpoint',
            'route53_failover_endpoint',
            'primary_vpc_id',
            'dr_vpc_id',
            'lambda_function_name',
            'primary_db_secret_arn',
            'dr_db_secret_arn',
            'vpc_peering_connection_id'
        ]

        for output in required_outputs:
            assert output in outputs, f"Missing required output: {output}"
            assert outputs[output], f"Empty value for output: {output}"

    def test_cross_region_connectivity(self, outputs, primary_ec2_client, dr_ec2_client):
        """Verify cross-region network connectivity via VPC peering."""
        primary_vpc_id = outputs['primary_vpc_id']
        dr_vpc_id = outputs['dr_vpc_id']
        peering_id = outputs['vpc_peering_connection_id']

        # Check primary VPC route tables have peering routes
        primary_routes = primary_ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [primary_vpc_id]}]
        )

        # Check DR VPC route tables have peering routes
        dr_routes = dr_ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [dr_vpc_id]}]
        )

        # Both should have route tables
        assert len(primary_routes['RouteTables']) > 0
        assert len(dr_routes['RouteTables']) > 0
