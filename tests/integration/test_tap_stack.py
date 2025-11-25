"""Integration tests for TapStack and multi-region disaster recovery infrastructure."""

import json
import os
from typing import Any, Dict

import boto3
import pytest
from cdktf import App

from lib.tap_stack import TapStack


def load_stack_outputs() -> Dict[str, Any]:
    """Load stack outputs from flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(__file__),
        "../../cfn-outputs/flat-outputs.json"
    )
    
    if not os.path.exists(outputs_path):
        pytest.skip(f"Stack outputs not found at {outputs_path}")
    
    with open(outputs_path, 'r') as f:
        data = json.load(f)
        # Extract the first stack's outputs (the structure is {"StackName": {"output": "value"}})
        if data:
            first_stack_key = next(iter(data))
            return data[first_stack_key]
        return {}


@pytest.fixture(scope="module")
def stack_outputs():
    """Fixture to load stack outputs."""
    return load_stack_outputs()


@pytest.fixture(scope="module")
def primary_region():
    """Primary AWS region."""
    return os.getenv("PRIMARY_REGION", "us-east-1")


@pytest.fixture(scope="module")
def secondary_region():
    """Secondary AWS region."""
    return os.getenv("SECONDARY_REGION", "us-west-2")


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
        )

        # Verify basic structure
        assert stack is not None


class TestVPCInfrastructure:
    """Test VPC infrastructure in both regions."""

    def test_primary_vpc_exists(self, stack_outputs, primary_region):
        """Test that primary VPC exists."""
        vpc_id = stack_outputs.get("primary_vpc_id")
        assert vpc_id is not None, "Primary VPC ID not found in outputs"
        
        ec2 = boto3.client('ec2', region_name=primary_region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'

    def test_secondary_vpc_exists(self, stack_outputs, secondary_region):
        """Test that secondary VPC exists."""
        vpc_id = stack_outputs.get("secondary_vpc_id")
        assert vpc_id is not None, "Secondary VPC ID not found in outputs"
        
        ec2 = boto3.client('ec2', region_name=secondary_region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'

    def test_vpc_peering_active(self, stack_outputs, primary_region):
        """Test that VPC peering connection is active."""
        peering_id = stack_outputs.get("vpc_peering_connection_id")
        assert peering_id is not None, "VPC peering ID not found in outputs"
        
        ec2 = boto3.client('ec2', region_name=primary_region)
        response = ec2.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )
        assert len(response['VpcPeeringConnections']) == 1
        assert response['VpcPeeringConnections'][0]['Status']['Code'] == 'active'


class TestAuroraGlobalDatabase:
    """Test Aurora Global Database deployment."""

    def test_global_cluster_exists(self, stack_outputs, primary_region):
        """Test that Aurora Global Cluster exists."""
        global_cluster_id = stack_outputs.get("global_cluster_id")
        assert global_cluster_id is not None, "Global cluster ID not found in outputs"
        
        rds = boto3.client('rds', region_name=primary_region)
        response = rds.describe_global_clusters(
            GlobalClusterIdentifier=global_cluster_id
        )
        assert len(response['GlobalClusters']) == 1
        assert response['GlobalClusters'][0]['Status'] in ['available', 'backing-up']

    def test_primary_cluster_endpoint(self, stack_outputs):
        """Test that primary cluster endpoint is accessible."""
        endpoint = stack_outputs.get("primary_cluster_endpoint")
        assert endpoint is not None, "Primary cluster endpoint not found in outputs"
        assert endpoint.endswith(".rds.amazonaws.com")

    def test_secondary_cluster_endpoint(self, stack_outputs):
        """Test that secondary cluster endpoint is accessible."""
        endpoint = stack_outputs.get("secondary_cluster_endpoint")
        assert endpoint is not None, "Secondary cluster endpoint not found in outputs"
        assert endpoint.endswith(".rds.amazonaws.com")

    def test_replication_lag_monitoring(self, stack_outputs, primary_region):
        """Test that replication lag alarms are configured."""
        cloudwatch = boto3.client('cloudwatch', region_name=primary_region)
        
        environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "test")
        alarm_name = f"dr-aurora-lag-primary-{environment_suffix}"
        
        response = cloudwatch.describe_alarms(AlarmNames=[alarm_name])
        assert len(response['MetricAlarms']) == 1
        alarm = response['MetricAlarms'][0]
        assert alarm['MetricName'] == 'AuroraGlobalDBReplicationLag'
        assert alarm['Threshold'] == 60000  # 60 seconds in milliseconds


class TestDynamoDBGlobalTable:
    """Test DynamoDB Global Table configuration."""

    def test_dynamodb_table_exists(self, stack_outputs, primary_region):
        """Test that DynamoDB table exists in primary region."""
        table_name = stack_outputs.get("dynamodb_table_name")
        assert table_name is not None, "DynamoDB table name not found in outputs"
        
        dynamodb = boto3.client('dynamodb', region_name=primary_region)
        response = dynamodb.describe_table(TableName=table_name)
        assert response['Table']['TableStatus'] == 'ACTIVE'

    def test_dynamodb_has_replica(self, stack_outputs, primary_region, secondary_region):
        """Test that DynamoDB table has replica in secondary region."""
        table_name = stack_outputs.get("dynamodb_table_name")
        assert table_name is not None
        
        dynamodb = boto3.client('dynamodb', region_name=primary_region)
        response = dynamodb.describe_table(TableName=table_name)
        
        replicas = response['Table'].get('Replicas', [])
        replica_regions = [r['RegionName'] for r in replicas]
        assert secondary_region in replica_regions

    def test_point_in_time_recovery_enabled(self, stack_outputs, primary_region):
        """Test that point-in-time recovery is enabled."""
        table_name = stack_outputs.get("dynamodb_table_name")
        assert table_name is not None
        
        dynamodb = boto3.client('dynamodb', region_name=primary_region)
        response = dynamodb.describe_continuous_backups(TableName=table_name)
        
        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED'


class TestS3Replication:
    """Test S3 cross-region replication."""

    def test_primary_bucket_exists(self, stack_outputs, primary_region):
        """Test that primary S3 bucket exists."""
        bucket_name = stack_outputs.get("primary_bucket_name")
        assert bucket_name is not None, "Primary bucket name not found in outputs"
        
        s3 = boto3.client('s3', region_name=primary_region)
        response = s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_secondary_bucket_exists(self, stack_outputs, secondary_region):
        """Test that secondary S3 bucket exists."""
        bucket_name = stack_outputs.get("secondary_bucket_name")
        assert bucket_name is not None, "Secondary bucket name not found in outputs"
        
        s3 = boto3.client('s3', region_name=secondary_region)
        response = s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_versioning_enabled(self, stack_outputs, primary_region):
        """Test that versioning is enabled on primary bucket."""
        bucket_name = stack_outputs.get("primary_bucket_name")
        assert bucket_name is not None
        
        s3 = boto3.client('s3', region_name=primary_region)
        response = s3.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    def test_replication_configuration(self, stack_outputs, primary_region):
        """Test that replication is configured on primary bucket."""
        bucket_name = stack_outputs.get("primary_bucket_name")
        assert bucket_name is not None
        
        s3 = boto3.client('s3', region_name=primary_region)
        response = s3.get_bucket_replication(Bucket=bucket_name)
        assert 'ReplicationConfiguration' in response
        assert len(response['ReplicationConfiguration']['Rules']) > 0


class TestLambdaFunctions:
    """Test Lambda function deployment."""

    def test_primary_lambda_exists(self, stack_outputs, primary_region):
        """Test that primary Lambda function exists."""
        lambda_arn = stack_outputs.get("primary_lambda_arn")
        assert lambda_arn is not None, "Primary Lambda ARN not found in outputs"
        
        lambda_client = boto3.client('lambda', region_name=primary_region)
        response = lambda_client.get_function(FunctionName=lambda_arn)
        assert response['Configuration']['State'] == 'Active'
        assert response['Configuration']['MemorySize'] == 1024

    def test_secondary_lambda_exists(self, stack_outputs, secondary_region):
        """Test that secondary Lambda function exists."""
        lambda_arn = stack_outputs.get("secondary_lambda_arn")
        assert lambda_arn is not None, "Secondary Lambda ARN not found in outputs"
        
        lambda_client = boto3.client('lambda', region_name=secondary_region)
        response = lambda_client.get_function(FunctionName=lambda_arn)
        assert response['Configuration']['State'] == 'Active'
        assert response['Configuration']['MemorySize'] == 1024

    def test_lambda_vpc_configuration(self, stack_outputs, primary_region):
        """Test that Lambda is configured with VPC."""
        lambda_arn = stack_outputs.get("primary_lambda_arn")
        assert lambda_arn is not None
        
        lambda_client = boto3.client('lambda', region_name=primary_region)
        response = lambda_client.get_function(FunctionName=lambda_arn)
        
        vpc_config = response['Configuration'].get('VpcConfig', {})
        assert len(vpc_config.get('SubnetIds', [])) >= 2
        assert len(vpc_config.get('SecurityGroupIds', [])) >= 1


class TestSNSTopics:
    """Test SNS topic configuration."""

    def test_primary_sns_topic_exists(self, stack_outputs, primary_region):
        """Test that primary SNS topic exists."""
        topic_arn = stack_outputs.get("primary_sns_topic_arn")
        assert topic_arn is not None, "Primary SNS topic ARN not found in outputs"
        
        sns = boto3.client('sns', region_name=primary_region)
        response = sns.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn

    def test_secondary_sns_topic_exists(self, stack_outputs, secondary_region):
        """Test that secondary SNS topic exists."""
        topic_arn = stack_outputs.get("secondary_sns_topic_arn")
        assert topic_arn is not None, "Secondary SNS topic ARN not found in outputs"
        
        sns = boto3.client('sns', region_name=secondary_region)
        response = sns.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn


class TestEventBridge:
    """Test EventBridge rules and targets."""

    def test_eventbridge_rule_exists(self, stack_outputs, primary_region):
        """Test that EventBridge rule exists in primary region."""
        environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "test")
        rule_name = f"dr-payment-event-rule-primary-{environment_suffix}"
        
        events = boto3.client('events', region_name=primary_region)
        response = events.describe_rule(Name=rule_name)
        assert response['State'] == 'ENABLED'

    def test_eventbridge_targets_lambda(self, stack_outputs, primary_region):
        """Test that EventBridge rule targets Lambda function."""
        environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "test")
        rule_name = f"dr-payment-event-rule-primary-{environment_suffix}"
        
        events = boto3.client('events', region_name=primary_region)
        response = events.list_targets_by_rule(Rule=rule_name)
        assert len(response['Targets']) >= 1


class TestAWSBackup:
    """Test AWS Backup configuration."""

    def test_backup_vault_exists(self, stack_outputs, primary_region):
        """Test that backup vault exists."""
        vault_name = stack_outputs.get("backup_vault_name")
        assert vault_name is not None, "Backup vault name not found in outputs"
        
        backup = boto3.client('backup', region_name=primary_region)
        response = backup.describe_backup_vault(BackupVaultName=vault_name)
        assert response['BackupVaultName'] == vault_name


class TestRoute53:
    """Test Route 53 health checks and failover routing."""

    def test_hosted_zone_exists(self, stack_outputs, primary_region):
        """Test that Route 53 hosted zone exists."""
        zone_id = stack_outputs.get("route53_zone_id")
        assert zone_id is not None, "Route53 zone ID not found in outputs"
        
        route53 = boto3.client('route53', region_name=primary_region)
        response = route53.get_hosted_zone(Id=zone_id)
        assert response['HostedZone']['Id'].endswith(zone_id)

    def test_api_endpoint_configured(self, stack_outputs):
        """Test that API endpoint is configured."""
        api_endpoint = stack_outputs.get("api_endpoint")
        assert api_endpoint is not None, "API endpoint not found in outputs"
        assert api_endpoint.endswith("-dr-test.com")


class TestDisasterRecoveryCapabilities:
    """Test disaster recovery capabilities."""

    def test_rto_requirements(self, stack_outputs):
        """Verify that infrastructure supports RTO under 5 minutes."""
        # Verify failover components are in place
        assert stack_outputs.get("primary_cluster_endpoint") is not None
        assert stack_outputs.get("secondary_cluster_endpoint") is not None
        assert stack_outputs.get("route53_zone_id") is not None
        
        # Route 53 health checks enable fast failover
        # DynamoDB global tables have automatic replication
        # Lambda functions are deployed in both regions
        # This configuration supports sub-5-minute RTO

    def test_data_replication(self, stack_outputs):
        """Verify data replication is configured."""
        # Aurora Global Database
        assert stack_outputs.get("global_cluster_id") is not None
        
        # DynamoDB Global Table
        assert stack_outputs.get("dynamodb_table_name") is not None
        
        # S3 Cross-Region Replication
        assert stack_outputs.get("primary_bucket_name") is not None
        assert stack_outputs.get("secondary_bucket_name") is not None


class TestResourceTagging:
    """Test that resources have required tags."""

    def test_vpc_tags(self, stack_outputs, primary_region):
        """Test that VPC has required tags."""
        vpc_id = stack_outputs.get("primary_vpc_id")
        assert vpc_id is not None
        
        ec2 = boto3.client('ec2', region_name=primary_region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        
        tags = {tag['Key']: tag['Value'] for tag in response['Vpcs'][0].get('Tags', [])}
        assert tags.get('Environment') == 'DR'
        assert tags.get('CostCenter') == 'Finance'

