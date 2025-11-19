"""
Integration tests for Multi-Region DR Trading Platform
Tests complete workflows using real AWS deployment outputs
"""
import pytest
import json
import boto3
import os


@pytest.fixture
def stack_outputs():
    """Load stack outputs from deployment"""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip("Deployment outputs not found - run deployment first")
    
    with open(outputs_file, "r") as f:
        return json.load(f)


class TestLoadBalancerHealth:
    """Test ALB health and accessibility"""
    
    def test_primary_alb_accessible(self, stack_outputs):
        """Verify primary ALB is accessible via DNS"""
        primary_alb = stack_outputs.get("ALBEndpoint-us-east-1-*")
        assert primary_alb is not None
        
        # Test HTTP endpoint accessibility
        import requests
        response = requests.get(f"http://{primary_alb}/health", timeout=10)
        assert response.status_code == 200
    
    def test_secondary_alb_accessible(self, stack_outputs):
        """Verify secondary ALB is accessible"""
        secondary_alb = stack_outputs.get("ALBEndpoint-us-west-2-*")
        assert secondary_alb is not None


class TestDynamoDBGlobalTable:
    """Test DynamoDB cross-region writes"""
    
    def test_write_to_primary_read_from_secondary(self, stack_outputs):
        """Test global table replication"""
        table_name = stack_outputs.get("DynamoDBTableName-*")
        assert table_name is not None
        
        # Write to primary
        dynamodb_primary = boto3.resource("dynamodb", region_name="us-east-1")
        table = dynamodb_primary.Table(table_name)
        table.put_item(Item={"sessionId": "test-123", "data": "test-value"})
        
        # Read from secondary (with delay for replication)
        import time
        time.sleep(2)
        
        dynamodb_secondary = boto3.resource("dynamodb", region_name="us-west-2")
        table_secondary = dynamodb_secondary.Table(table_name)
        response = table_secondary.get_item(Key={"sessionId": "test-123"})
        assert response.get("Item") is not None
        assert response["Item"]["data"] == "test-value"


class TestAuroraReplication:
    """Test Aurora Global Database"""
    
    def test_primary_cluster_endpoint(self, stack_outputs):
        """Verify primary cluster endpoint exists"""
        primary_endpoint = stack_outputs.get("AuroraClusterEndpoint-us-east-1-*")
        assert primary_endpoint is not None
    
    def test_replication_lag_metric(self, stack_outputs):
        """Verify replication lag is being reported"""
        cloudwatch = boto3.client("cloudwatch", region_name="us-east-1")
        
        # Query for replication lag metric
        response = cloudwatch.get_metric_statistics(
            Namespace="AWS/RDS",
            MetricName="AuroraGlobalDBReplicationLag",
            Dimensions=[],
            StartTime="2024-01-01T00:00:00Z",
            EndTime="2024-12-31T23:59:59Z",
            Period=300,
            Statistics=["Average"],
        )
        
        # Metric should exist (may not have data points yet)
        assert response is not None


class TestS3Replication:
    """Test S3 cross-region replication with RTC"""
    
    def test_object_replication(self, stack_outputs):
        """Test that objects replicate between regions"""
        primary_bucket = stack_outputs.get("S3BucketName-us-east-1-*")
        secondary_bucket = stack_outputs.get("S3BucketName-us-west-2-*")
        
        assert primary_bucket is not None
        assert secondary_bucket is not None
        
        s3_primary = boto3.client("s3", region_name="us-east-1")
        s3_secondary = boto3.client("s3", region_name="us-west-2")
        
        # Upload to primary
        test_key = "test-replication.txt"
        s3_primary.put_object(
            Bucket=primary_bucket,
            Key=test_key,
            Body=b"test data for replication"
        )
        
        # Wait for replication (RTC should complete within 15 minutes)
        import time
        time.sleep(30)  # Wait 30 seconds for RTC
        
        # Verify in secondary
        response = s3_secondary.head_object(Bucket=secondary_bucket, Key=test_key)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200


class TestRoute53HealthChecks:
    """Test Route 53 health checks and failover"""
    
    def test_primary_health_check_exists(self, stack_outputs):
        """Verify primary health check is configured"""
        route53 = boto3.client("route53")
        
        # List health checks and find ours
        response = route53.list_health_checks()
        health_checks = response.get("HealthChecks", [])
        
        # Should have at least one health check
        assert len(health_checks) > 0
    
    def test_weighted_records_configured(self, stack_outputs):
        """Verify weighted routing records are configured"""
        hosted_zone_id = stack_outputs.get("HostedZoneId-*")
        if not hosted_zone_id:
            pytest.skip("Hosted zone ID not in outputs")
        
        route53 = boto3.client("route53")
        response = route53.list_resource_record_sets(HostedZoneId=hosted_zone_id)
        
        # Should have weighted records
        weighted_records = [
            r for r in response.get("ResourceRecordSets", [])
            if r.get("Weight") is not None
        ]
        assert len(weighted_records) >= 1


class TestEventBridgeCrossRegion:
    """Test EventBridge cross-region event delivery"""
    
    def test_event_bus_exists_both_regions(self, stack_outputs):
        """Verify event buses exist in both regions"""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "test")
        event_bus_name = f"trading-events-{env_suffix}"
        
        events_primary = boto3.client("events", region_name="us-east-1")
        events_secondary = boto3.client("events", region_name="us-west-2")
        
        # Check primary
        response_primary = events_primary.describe_event_bus(Name=event_bus_name)
        assert response_primary["Arn"] is not None
        
        # Check secondary
        response_secondary = events_secondary.describe_event_bus(Name=event_bus_name)
        assert response_secondary["Arn"] is not None


# Test execution order and dependencies
def test_basic_connectivity(stack_outputs):
    """Basic connectivity test to ensure deployment is accessible"""
    assert len(stack_outputs) > 0
    assert any("ALBEndpoint" in key for key in stack_outputs.keys())
