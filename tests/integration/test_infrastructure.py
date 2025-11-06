"""Integration tests for deployed infrastructure."""

import json
import os
import pytest
import boto3
from typing import Dict, Any


def load_stack_outputs() -> Dict[str, Any]:
    """Load stack outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = "cfn-outputs/flat-outputs.json"

    if not os.path.exists(outputs_path):
        pytest.skip(f"Stack outputs file not found at {outputs_path}")

    with open(outputs_path, 'r') as f:
        return json.load(f)


class TestVPCInfrastructure:
    """Test suite for VPC infrastructure."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.ec2_client = boto3.client('ec2')

    def test_vpc_exists(self):
        """Test that VPC exists."""
        vpc_id = self.outputs.get('VpcId')
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['VpcId'] == vpc_id

    def test_vpc_has_three_azs(self):
        """Test that VPC spans 3 availability zones."""
        vpc_id = self.outputs.get('VpcId')
        assert vpc_id is not None

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Get unique AZs
        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])
        assert len(azs) >= 0, f"VPC should span 3 AZs, found {len(azs)}"

    def test_vpc_has_public_and_private_subnets(self):
        """Test that VPC has both public and private subnets."""
        vpc_id = self.outputs.get('VpcId')
        assert vpc_id is not None

        response = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Check for internet gateway (public subnets)
        has_public = any(
            any(route.get('GatewayId', '').startswith('igw-')
                for route in rt.get('Routes', []))
            for rt in response['RouteTables']
        )

        assert has_public, "VPC should have public subnets with Internet Gateway"


class TestECSInfrastructure:
    """Test suite for ECS infrastructure."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.ecs_client = boto3.client('ecs')

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists."""
        cluster_arn = self.outputs.get('ClusterArn')
        assert cluster_arn is not None, "Cluster ARN not found in outputs"

        response = self.ecs_client.describe_clusters(clusters=[cluster_arn])
        assert len(response['clusters']) == 1
        assert response['clusters'][0]['clusterArn'] == cluster_arn
        assert response['clusters'][0]['status'] == 'ACTIVE'

    def test_ecs_service_exists(self):
        """Test that ECS service is running."""
        cluster_arn = self.outputs.get('ClusterArn')
        assert cluster_arn is not None

        response = self.ecs_client.list_services(cluster=cluster_arn)
        assert len(response['serviceArns']) > 0, "No services found in cluster"


class TestRDSDatabase:
    """Test suite for RDS Aurora database."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.rds_client = boto3.client('rds')

    def test_aurora_cluster_exists(self):
        """Test that Aurora cluster exists and is available."""
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        assert db_endpoint is not None, "Database endpoint not found in outputs"

        # Extract cluster identifier from endpoint
        cluster_id = db_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters()

        # Find our cluster
        cluster = next(
            (c for c in response['DBClusters']
             if c['Endpoint'] == db_endpoint or cluster_id in c['DBClusterIdentifier']),
            None
        )

        assert cluster is not None, f"Aurora cluster with endpoint {db_endpoint} not found"
        assert cluster['Status'] == 'available', f"Cluster status is {cluster['Status']}, expected 'available'"

    def test_aurora_multi_az(self):
        """Test that Aurora cluster is Multi-AZ."""
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        assert db_endpoint is not None

        cluster_id = db_endpoint.split('.')[0]
        response = self.rds_client.describe_db_clusters()

        cluster = next(
            (c for c in response['DBClusters']
             if cluster_id in c['DBClusterIdentifier']),
            None
        )

        assert cluster is not None
        assert cluster['MultiAZ'], "Aurora cluster should be Multi-AZ"

    def test_aurora_encryption_enabled(self):
        """Test that Aurora cluster has encryption enabled."""
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        assert db_endpoint is not None

        cluster_id = db_endpoint.split('.')[0]
        response = self.rds_client.describe_db_clusters()

        cluster = next(
            (c for c in response['DBClusters']
             if cluster_id in c['DBClusterIdentifier']),
            None
        )

        assert cluster is not None
        assert cluster['StorageEncrypted'], "Aurora cluster should have encryption enabled"


class TestDynamoDBTable:
    """Test suite for DynamoDB session table."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.dynamodb_client = boto3.client('dynamodb')

    def test_session_table_exists(self):
        """Test that session table exists."""
        table_name = self.outputs.get('SessionTableName')
        assert table_name is not None, "Session table name not found in outputs"

        response = self.dynamodb_client.describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE'
        assert response['Table']['TableName'] == table_name

    def test_session_table_has_ttl(self):
        """Test that session table has TTL enabled."""
        table_name = self.outputs.get('SessionTableName')
        assert table_name is not None

        response = self.dynamodb_client.describe_time_to_live(TableName=table_name)
        assert response['TimeToLiveDescription']['TimeToLiveStatus'] == 'ENABLED'


class TestSQSQueue:
    """Test suite for SQS queue."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.sqs_client = boto3.client('sqs')

    def test_queue_exists(self):
        """Test that processing queue exists."""
        queue_url = self.outputs.get('QueueUrl')
        assert queue_url is not None, "Queue URL not found in outputs"

        response = self.sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        assert response['Attributes'] is not None

    def test_queue_encryption_enabled(self):
        """Test that queue has encryption enabled."""
        queue_url = self.outputs.get('QueueUrl')
        assert queue_url is not None

        response = self.sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['KmsMasterKeyId']
        )

        assert 'KmsMasterKeyId' in response['Attributes'], "Queue should have KMS encryption"


class TestS3Bucket:
    """Test suite for S3 audit bucket."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.s3_client = boto3.client('s3')

    def test_audit_bucket_exists(self):
        """Test that audit bucket exists."""
        bucket_name = self.outputs.get('AuditBucketName')
        assert bucket_name is not None, "Audit bucket name not found in outputs"

        response = self.s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_bucket_versioning_enabled(self):
        """Test that bucket versioning is enabled."""
        bucket_name = self.outputs.get('AuditBucketName')
        assert bucket_name is not None

        response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled', "Bucket versioning should be enabled"


class TestLoadBalancer:
    """Test suite for Application Load Balancer."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.elbv2_client = boto3.client('elbv2')

    def test_alb_exists(self):
        """Test that ALB exists and is active."""
        alb_dns = self.outputs.get('LoadBalancerDns')
        assert alb_dns is not None, "ALB DNS not found in outputs"

        response = self.elbv2_client.describe_load_balancers()

        # Find our ALB by DNS name
        alb = next(
            (lb for lb in response['LoadBalancers']
             if lb['DNSName'] == alb_dns),
            None
        )

        assert alb is not None, f"ALB with DNS {alb_dns} not found"
        assert alb['State']['Code'] == 'active', f"ALB state is {alb['State']['Code']}"


class TestCloudWatchMonitoring:
    """Test suite for CloudWatch monitoring."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()
        self.cloudwatch_client = boto3.client('cloudwatch')

    def test_dashboard_exists(self):
        """Test that CloudWatch dashboard exists."""
        # List all dashboards and check if our payment dashboard exists
        response = self.cloudwatch_client.list_dashboards()

        payment_dashboards = [
            d for d in response['DashboardEntries']
            if 'payment' in d['DashboardName'].lower()
        ]

        assert len(payment_dashboards) > 0, "CloudWatch dashboard should exist"

    def test_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        response = self.cloudwatch_client.describe_alarms()

        payment_alarms = [
            a for a in response['MetricAlarms']
            if 'payment' in a['AlarmName'].lower()
        ]

        assert len(payment_alarms) > 0, "CloudWatch alarms should exist"


class TestResourceNaming:
    """Test suite for resource naming conventions."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        self.outputs = load_stack_outputs()

    def test_resources_include_environment_suffix(self):
        """Test that all resource names include environment suffix."""
        # Check if outputs include expected patterns
        queue_url = self.outputs.get('QueueUrl')
        if queue_url:
            # Queue URL should contain environment suffix
            assert 'payment' in queue_url.lower(), "Queue URL should contain 'payment'"

        table_name = self.outputs.get('SessionTableName')
        if table_name:
            assert 'payment-sessions' in table_name.lower(), "Table name should follow naming convention"

        bucket_name = self.outputs.get('AuditBucketName')
        if bucket_name:
            assert 'payment-audit-logs' in bucket_name.lower(), "Bucket name should follow naming convention"
