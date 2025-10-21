"""Integration tests for TapStack."""
import json
import os
import boto3
import pytest


# Load deployment outputs
outputs_file = os.path.join(os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
if os.path.exists(outputs_file):
    with open(outputs_file, 'r') as f:
        OUTPUTS = json.load(f)
else:
    OUTPUTS = {}


@pytest.mark.skipif(not OUTPUTS, reason="No deployment outputs found - infrastructure not deployed")
class TestStreamFlixVideoProcessingIntegration:
    """StreamFlix Video Processing Pipeline Integration Tests."""

    def setup_method(self):
        """Setup AWS clients for testing."""
        self.region = "eu-central-1"
        self.ec2_client = boto3.client('ec2', region_name=self.region)
        self.kinesis_client = boto3.client('kinesis', region_name=self.region)
        self.rds_client = boto3.client('rds', region_name=self.region)
        self.ecs_client = boto3.client('ecs', region_name=self.region)
        self.secretsmanager_client = boto3.client('secretsmanager', region_name=self.region)
        self.sns_client = boto3.client('sns', region_name=self.region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=self.region)
        self.logs_client = boto3.client('logs', region_name=self.region)

    def test_vpc_exists_and_accessible(self):
        """Test that VPC exists and is accessible."""
        vpc_id = OUTPUTS.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        # Verify VPC exists
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_kinesis_stream_active(self):
        """Test that Kinesis stream is active and properly configured."""
        stream_name = OUTPUTS.get('kinesis_stream_name')
        assert stream_name, "Kinesis stream name not found in outputs"

        # Verify stream exists and is active
        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream = response['StreamDescription']
        assert stream['StreamStatus'] == 'ACTIVE'
        assert stream['StreamARN'] == OUTPUTS.get('kinesis_stream_arn')
        assert stream['RetentionPeriodHours'] == 24

    def test_rds_cluster_available(self):
        """Test that RDS Aurora cluster is available."""
        db_endpoint = OUTPUTS.get('database_endpoint')
        assert db_endpoint, "Database endpoint not found in outputs"

        # Extract cluster ID from endpoint
        cluster_id = db_endpoint.split('.')[0]

        # Verify cluster exists and is available
        response = self.rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['Endpoint'] == db_endpoint

    def test_ecs_cluster_and_service_running(self):
        """Test that ECS cluster and service are running."""
        cluster_name = OUTPUTS.get('ecs_cluster_name')
        service_name = OUTPUTS.get('ecs_service_name')
        assert cluster_name, "ECS cluster name not found in outputs"
        assert service_name, "ECS service name not found in outputs"

        # Verify cluster exists
        clusters_response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(clusters_response['clusters']) == 1
        cluster = clusters_response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'

        # Verify service exists
        services_response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        assert len(services_response['services']) == 1
        service = services_response['services'][0]
        assert service['status'] == 'ACTIVE'
        assert service['desiredCount'] >= 1

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists and is accessible."""
        secret_arn = OUTPUTS.get('database_secret_arn')
        assert secret_arn, "Database secret ARN not found in outputs"

        # Verify secret exists
        response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn

        # Verify secret value can be retrieved
        value_response = self.secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret_value = json.loads(value_response['SecretString'])
        assert 'username' in secret_value
        assert 'password' in secret_value
        assert 'engine' in secret_value
        assert secret_value['engine'] == 'postgres'

    def test_sns_topic_exists(self):
        """Test that SNS topic exists for alerts."""
        sns_topic_arn = OUTPUTS.get('sns_topic_arn')
        assert sns_topic_arn, "SNS topic ARN not found in outputs"

        # Verify topic exists
        response = self.sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
        assert response['Attributes']['TopicArn'] == sns_topic_arn

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists for ECS logs."""
        # Construct expected log group name from environment suffix
        log_group_name = "/ecs/streamflix-synth9340809978"

        # Verify log group exists
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        assert len(response['logGroups']) >= 1
        log_group = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
        assert len(log_group) == 1
        assert log_group[0]['retentionInDays'] == 90

    def test_ecs_can_access_kinesis(self):
        """Test that ECS tasks have permissions to access Kinesis."""
        cluster_name = OUTPUTS.get('ecs_cluster_name')
        service_name = OUTPUTS.get('ecs_service_name')

        # Get task definition from service
        services_response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        task_def_arn = services_response['services'][0]['taskDefinition']

        # Get task definition details
        task_def_response = self.ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )
        task_def = task_def_response['taskDefinition']

        # Verify task has role assigned
        assert 'taskRoleArn' in task_def
        assert task_def['taskRoleArn']

        # Verify environment variables include Kinesis stream name
        container_def = task_def['containerDefinitions'][0]
        env_vars = {env['name']: env['value'] for env in container_def.get('environment', [])}
        assert 'KINESIS_STREAM_NAME' in env_vars
        assert env_vars['KINESIS_STREAM_NAME'] == OUTPUTS.get('kinesis_stream_name')
