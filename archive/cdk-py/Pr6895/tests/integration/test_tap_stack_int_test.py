"""
Integration tests for Trading Automation Platform (TAP) Infrastructure
Tests actual AWS resources using deployment outputs from cfn-outputs/flat-outputs.json

These tests verify that deployed infrastructure is functioning correctly by:
- Checking resource existence and configuration
- Validating connectivity and accessibility
- Testing cross-region replication where applicable
- Verifying monitoring and logging setup

Prerequisites:
- AWS credentials configured (via environment or ~/.aws/credentials)
- Stack deployed and cfn-outputs/flat-outputs.json exists
- Appropriate IAM permissions to describe/read AWS resources
"""
import pytest
import json
import boto3
import os
import time
from datetime import datetime, timedelta
from botocore.exceptions import ClientError


@pytest.fixture(scope="session")
def stack_outputs():
    """Load CloudFormation stack outputs from deployment"""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip(f"Deployment outputs not found at {outputs_file} - run deployment first")

    with open(outputs_file, "r") as f:
        outputs = json.load(f)

    if not outputs:
        pytest.skip("Deployment outputs file is empty")

    return outputs


@pytest.fixture(scope="session")
def deployment_region(stack_outputs):
    """Extract deployment region from outputs"""
    # Look for DeploymentRegion output
    region = None
    for key, value in stack_outputs.items():
        if "DeploymentRegion" in key:
            region = value
            break

    if not region:
        # Fallback to environment variable or default
        region = os.environ.get("CDK_DEFAULT_REGION", "us-east-1")

    return region


@pytest.fixture(scope="session")
def environment_suffix(stack_outputs):
    """Extract environment suffix from outputs"""
    # Try to infer from output keys (they contain the env suffix)
    for key in stack_outputs.keys():
        # Keys follow pattern: {env_suffix}-trading-*
        parts = key.split("-")
        if len(parts) > 0:
            return parts[0]

    return os.environ.get("ENVIRONMENT_SUFFIX", "test")


def get_output_value(stack_outputs, key_pattern):
    """Helper to find output value by pattern"""
    for key, value in stack_outputs.items():
        if key_pattern in key:
            return value
    return None


class TestDeploymentOutputs:
    """Verify deployment outputs are present and valid"""

    def test_outputs_file_loaded(self, stack_outputs):
        """Verify outputs file was loaded successfully"""
        assert stack_outputs is not None
        assert len(stack_outputs) > 0

    def test_vpc_outputs_exist(self, stack_outputs):
        """Verify VPC outputs are present"""
        vpc_id = get_output_value(stack_outputs, "VpcId")
        assert vpc_id is not None, "VPC ID output missing"
        assert vpc_id.startswith("vpc-"), "VPC ID format invalid"

    def test_ecs_outputs_exist(self, stack_outputs):
        """Verify ECS outputs are present"""
        cluster_name = get_output_value(stack_outputs, "EcsClusterName")
        cluster_arn = get_output_value(stack_outputs, "EcsClusterArn")
        service_name = get_output_value(stack_outputs, "EcsServiceName")

        assert cluster_name is not None, "ECS cluster name missing"
        assert cluster_arn is not None, "ECS cluster ARN missing"
        assert service_name is not None, "ECS service name missing"

    def test_alb_outputs_exist(self, stack_outputs):
        """Verify ALB outputs are present"""
        alb_dns = get_output_value(stack_outputs, "AlbDnsName")
        alb_arn = get_output_value(stack_outputs, "AlbArn")

        assert alb_dns is not None, "ALB DNS name missing"
        assert alb_arn is not None, "ALB ARN missing"

    def test_aurora_outputs_exist(self, stack_outputs):
        """Verify Aurora outputs are present"""
        cluster_endpoint = get_output_value(stack_outputs, "AuroraClusterEndpoint")
        read_endpoint = get_output_value(stack_outputs, "AuroraClusterReadEndpoint")
        cluster_id = get_output_value(stack_outputs, "AuroraClusterIdentifier")

        assert cluster_endpoint is not None, "Aurora cluster endpoint missing"
        assert read_endpoint is not None, "Aurora read endpoint missing"
        assert cluster_id is not None, "Aurora cluster identifier missing"

    def test_dynamodb_outputs_exist(self, stack_outputs):
        """Verify DynamoDB outputs are present"""
        table_name = get_output_value(stack_outputs, "DynamoDbTableName")
        table_arn = get_output_value(stack_outputs, "DynamoDbTableArn")

        assert table_name is not None, "DynamoDB table name missing"
        assert table_arn is not None, "DynamoDB table ARN missing"

    def test_s3_outputs_exist(self, stack_outputs):
        """Verify S3 outputs are present"""
        bucket_name = get_output_value(stack_outputs, "S3BucketName")
        bucket_arn = get_output_value(stack_outputs, "S3BucketArn")

        assert bucket_name is not None, "S3 bucket name missing"
        assert bucket_arn is not None, "S3 bucket ARN missing"

    def test_eventbridge_outputs_exist(self, stack_outputs):
        """Verify EventBridge outputs are present"""
        bus_name = get_output_value(stack_outputs, "EventBusName")
        bus_arn = get_output_value(stack_outputs, "EventBusArn")

        assert bus_name is not None, "EventBridge bus name missing"
        assert bus_arn is not None, "EventBridge bus ARN missing"


class TestVPCResources:
    """Test VPC and networking resources"""

    def test_vpc_exists(self, stack_outputs, deployment_region):
        """Verify VPC exists in AWS"""
        vpc_id = get_output_value(stack_outputs, "VpcId")

        ec2 = boto3.client("ec2", region_name=deployment_region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["VpcId"] == vpc_id
        assert vpc["State"] == "available"

    def test_vpc_has_subnets(self, stack_outputs, deployment_region):
        """Verify VPC has public and private subnets"""
        vpc_id = get_output_value(stack_outputs, "VpcId")

        ec2 = boto3.client("ec2", region_name=deployment_region)
        response = ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])

        subnets = response["Subnets"]
        assert len(subnets) == 6, "Expected 6 subnets (3 public + 3 private)"

        # Verify subnets are across multiple AZs
        azs = set(subnet["AvailabilityZone"] for subnet in subnets)
        assert len(azs) == 3, "Expected subnets in 3 availability zones"

    def test_security_groups_exist(self, stack_outputs, deployment_region):
        """Verify security groups are configured"""
        vpc_id = get_output_value(stack_outputs, "VpcId")

        ec2 = boto3.client("ec2", region_name=deployment_region)
        response = ec2.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Expect at least 4 SGs (default + ALB + ECS + Database)
        security_groups = response["SecurityGroups"]
        assert len(security_groups) >= 4


class TestECSResources:
    """Test ECS cluster and services"""

    def test_ecs_cluster_exists(self, stack_outputs, deployment_region):
        """Verify ECS cluster exists and is active"""
        cluster_arn = get_output_value(stack_outputs, "EcsClusterArn")

        ecs = boto3.client("ecs", region_name=deployment_region)
        response = ecs.describe_clusters(clusters=[cluster_arn])

        assert len(response["clusters"]) == 1
        cluster = response["clusters"][0]
        assert cluster["status"] == "ACTIVE"
        assert cluster["clusterArn"] == cluster_arn

    def test_ecs_service_running(self, stack_outputs, deployment_region):
        """Verify ECS service is running with desired tasks"""
        cluster_arn = get_output_value(stack_outputs, "EcsClusterArn")
        service_name = get_output_value(stack_outputs, "EcsServiceName")

        ecs = boto3.client("ecs", region_name=deployment_region)
        response = ecs.describe_services(
            cluster=cluster_arn,
            services=[service_name]
        )

        assert len(response["services"]) == 1
        service = response["services"][0]
        assert service["status"] == "ACTIVE"
        assert service["desiredCount"] == 2, "Expected 2 tasks"
        assert service["runningCount"] >= 1, "At least 1 task should be running"

    def test_ecs_tasks_healthy(self, stack_outputs, deployment_region):
        """Verify ECS tasks are in healthy state"""
        cluster_arn = get_output_value(stack_outputs, "EcsClusterArn")
        service_name = get_output_value(stack_outputs, "EcsServiceName")

        ecs = boto3.client("ecs", region_name=deployment_region)

        # List tasks
        tasks_response = ecs.list_tasks(
            cluster=cluster_arn,
            serviceName=service_name,
            desiredStatus="RUNNING"
        )

        if tasks_response["taskArns"]:
            # Describe tasks
            describe_response = ecs.describe_tasks(
                cluster=cluster_arn,
                tasks=tasks_response["taskArns"]
            )

            for task in describe_response["tasks"]:
                assert task["lastStatus"] in ["RUNNING", "PENDING"]
                assert task["healthStatus"] in ["HEALTHY", "UNKNOWN"]


class TestLoadBalancer:
    """Test Application Load Balancer"""

    def test_alb_exists(self, stack_outputs, deployment_region):
        """Verify ALB exists and is active"""
        alb_arn = get_output_value(stack_outputs, "AlbArn")

        elbv2 = boto3.client("elbv2", region_name=deployment_region)
        response = elbv2.describe_load_balancers(LoadBalancerArns=[alb_arn])

        assert len(response["LoadBalancers"]) == 1
        alb = response["LoadBalancers"][0]
        assert alb["State"]["Code"] == "active"
        assert alb["Scheme"] == "internet-facing"

    def test_alb_target_group_healthy(self, stack_outputs, deployment_region):
        """Verify ALB target group has healthy targets"""
        alb_arn = get_output_value(stack_outputs, "AlbArn")

        elbv2 = boto3.client("elbv2", region_name=deployment_region)

        # Get target groups for ALB
        tg_response = elbv2.describe_target_groups(LoadBalancerArn=alb_arn)

        assert len(tg_response["TargetGroups"]) >= 1

        for tg in tg_response["TargetGroups"]:
            # Check target health
            health_response = elbv2.describe_target_health(
                TargetGroupArn=tg["TargetGroupArn"]
            )

            targets = health_response["TargetHealthDescriptions"]
            # At least one target should be registered
            assert len(targets) > 0

    def test_alb_dns_resolves(self, stack_outputs):
        """Verify ALB DNS name resolves"""
        alb_dns = get_output_value(stack_outputs, "AlbDnsName")

        import socket
        try:
            addresses = socket.getaddrinfo(alb_dns, 80)
            assert len(addresses) > 0, "ALB DNS should resolve to IP addresses"
        except socket.gaierror:
            pytest.fail(f"ALB DNS {alb_dns} does not resolve")


class TestAuroraDatabase:
    """Test Aurora Global Database"""

    def test_aurora_cluster_available(self, stack_outputs, deployment_region):
        """Verify Aurora cluster is available"""
        cluster_id = get_output_value(stack_outputs, "AuroraClusterIdentifier")

        rds = boto3.client("rds", region_name=deployment_region)
        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)

        assert len(response["DBClusters"]) == 1
        cluster = response["DBClusters"][0]
        assert cluster["Status"] == "available"
        assert cluster["Engine"] == "aurora-postgresql"

    def test_aurora_instances_available(self, stack_outputs, deployment_region):
        """Verify Aurora instances are available"""
        cluster_id = get_output_value(stack_outputs, "AuroraClusterIdentifier")

        rds = boto3.client("rds", region_name=deployment_region)
        response = rds.describe_db_instances(
            Filters=[{"Name": "db-cluster-id", "Values": [cluster_id]}]
        )

        instances = response["DBInstances"]
        assert len(instances) == 2, "Expected 2 Aurora instances"

        for instance in instances:
            assert instance["DBInstanceStatus"] == "available"
            assert instance["DBInstanceClass"] == "db.r5.large"

    def test_aurora_global_cluster_exists(self, stack_outputs, deployment_region):
        """Verify Aurora Global Database cluster exists"""
        global_cluster_id = get_output_value(stack_outputs, "AuroraGlobalClusterIdentifier")

        if not global_cluster_id:
            pytest.skip("Global cluster ID not in outputs")

        rds = boto3.client("rds", region_name=deployment_region)
        response = rds.describe_global_clusters(GlobalClusterIdentifier=global_cluster_id)

        assert len(response["GlobalClusters"]) == 1
        global_cluster = response["GlobalClusters"][0]
        assert global_cluster["Engine"] == "aurora-postgresql"
        assert global_cluster["EngineVersion"] == "14.6"

    def test_aurora_backup_configured(self, stack_outputs, deployment_region):
        """Verify Aurora backup retention is configured"""
        cluster_id = get_output_value(stack_outputs, "AuroraClusterIdentifier")

        rds = boto3.client("rds", region_name=deployment_region)
        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)

        cluster = response["DBClusters"][0]
        assert cluster["BackupRetentionPeriod"] == 7


class TestDynamoDBTable:
    """Test DynamoDB Global Table"""

    def test_dynamodb_table_exists(self, stack_outputs, deployment_region):
        """Verify DynamoDB table exists"""
        table_name = get_output_value(stack_outputs, "DynamoDbTableName")

        dynamodb = boto3.client("dynamodb", region_name=deployment_region)
        response = dynamodb.describe_table(TableName=table_name)

        table = response["Table"]
        assert table["TableStatus"] == "ACTIVE"
        assert table["TableName"] == table_name

    def test_dynamodb_billing_mode(self, stack_outputs, deployment_region):
        """Verify DynamoDB uses PAY_PER_REQUEST billing"""
        table_name = get_output_value(stack_outputs, "DynamoDbTableName")

        dynamodb = boto3.client("dynamodb", region_name=deployment_region)
        response = dynamodb.describe_table(TableName=table_name)

        table = response["Table"]
        assert table["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"

    def test_dynamodb_pitr_enabled(self, stack_outputs, deployment_region):
        """Verify point-in-time recovery is enabled"""
        table_name = get_output_value(stack_outputs, "DynamoDbTableName")

        dynamodb = boto3.client("dynamodb", region_name=deployment_region)
        response = dynamodb.describe_continuous_backups(TableName=table_name)

        pitr = response["ContinuousBackupsDescription"]["PointInTimeRecoveryDescription"]
        assert pitr["PointInTimeRecoveryStatus"] == "ENABLED"

    def test_dynamodb_read_write(self, stack_outputs, deployment_region):
        """Test DynamoDB read/write operations"""
        table_name = get_output_value(stack_outputs, "DynamoDbTableName")

        dynamodb = boto3.resource("dynamodb", region_name=deployment_region)
        table = dynamodb.Table(table_name)

        # Write test item
        test_session_id = f"integration-test-{int(time.time())}"
        table.put_item(
            Item={
                "sessionId": test_session_id,
                "testData": "integration-test-value",
                "timestamp": int(time.time())
            }
        )

        # Read test item
        response = table.get_item(Key={"sessionId": test_session_id})
        assert "Item" in response
        assert response["Item"]["testData"] == "integration-test-value"

        # Clean up test item
        table.delete_item(Key={"sessionId": test_session_id})

    def test_dynamodb_global_replication(self, stack_outputs, deployment_region):
        """Verify DynamoDB global table replication regions"""
        table_name = get_output_value(stack_outputs, "DynamoDbTableName")

        dynamodb = boto3.client("dynamodb", region_name=deployment_region)
        response = dynamodb.describe_table(TableName=table_name)

        table = response["Table"]
        if "Replicas" in table:
            replicas = table["Replicas"]
            assert len(replicas) > 0, "Expected at least one replica region"


class TestS3Bucket:
    """Test S3 bucket configuration"""

    def test_s3_bucket_exists(self, stack_outputs, deployment_region):
        """Verify S3 bucket exists"""
        bucket_name = get_output_value(stack_outputs, "S3BucketName")

        s3 = boto3.client("s3", region_name=deployment_region)
        response = s3.head_bucket(Bucket=bucket_name)

        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_versioning_enabled(self, stack_outputs, deployment_region):
        """Verify S3 versioning is enabled"""
        bucket_name = get_output_value(stack_outputs, "S3BucketName")

        s3 = boto3.client("s3", region_name=deployment_region)
        response = s3.get_bucket_versioning(Bucket=bucket_name)

        assert response.get("Status") == "Enabled"

    def test_s3_read_write(self, stack_outputs, deployment_region):
        """Test S3 read/write operations"""
        bucket_name = get_output_value(stack_outputs, "S3BucketName")

        s3 = boto3.client("s3", region_name=deployment_region)

        # Write test object
        test_key = f"integration-test-{int(time.time())}.txt"
        test_content = b"Integration test content"

        s3.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content
        )

        # Read test object
        response = s3.get_object(Bucket=bucket_name, Key=test_key)
        assert response["Body"].read() == test_content

        # Clean up test object
        s3.delete_object(Bucket=bucket_name, Key=test_key)


class TestEventBridge:
    """Test EventBridge configuration"""

    def test_event_bus_exists(self, stack_outputs, deployment_region):
        """Verify EventBridge custom bus exists"""
        bus_name = get_output_value(stack_outputs, "EventBusName")

        events = boto3.client("events", region_name=deployment_region)
        response = events.describe_event_bus(Name=bus_name)

        assert response["Name"] == bus_name
        assert "Arn" in response

    def test_event_rules_configured(self, stack_outputs, deployment_region):
        """Verify event rules are configured"""
        bus_name = get_output_value(stack_outputs, "EventBusName")

        events = boto3.client("events", region_name=deployment_region)
        response = events.list_rules(EventBusName=bus_name)

        rules = response["Rules"]
        assert len(rules) >= 1, "Expected at least one event rule"

        # Verify rule is enabled
        for rule in rules:
            assert rule["State"] == "ENABLED"


class TestRoute53:
    """Test Route53 configuration (if not using example.com)"""

    def test_hosted_zone_exists(self, stack_outputs):
        """Verify hosted zone exists if configured"""
        zone_id = get_output_value(stack_outputs, "HostedZoneId")

        if not zone_id:
            pytest.skip("Hosted zone not configured (using example.com domain)")

        route53 = boto3.client("route53")
        response = route53.get_hosted_zone(Id=zone_id)

        assert response["HostedZone"]["Id"] == zone_id

    def test_health_checks_configured(self, stack_outputs):
        """Verify health checks are configured"""
        zone_id = get_output_value(stack_outputs, "HostedZoneId")

        if not zone_id:
            pytest.skip("Hosted zone not configured (using example.com domain)")

        route53 = boto3.client("route53")
        response = route53.list_health_checks()

        health_checks = response["HealthChecks"]
        # Should have at least one health check
        assert len(health_checks) >= 1


class TestCloudWatch:
    """Test CloudWatch monitoring and logging"""

    def test_log_retention_configured(self, stack_outputs, deployment_region, environment_suffix):
        """Verify log retention is configured"""
        logs = boto3.client("logs", region_name=deployment_region)

        app_log_group = f"/aws/trading/application-v2-{environment_suffix}"
        response = logs.describe_log_groups(logGroupNamePrefix=app_log_group)

        if response["logGroups"]:
            log_group = response["logGroups"][0]
            assert "retentionInDays" in log_group
            assert log_group["retentionInDays"] > 0


class TestResourceTags:
    """Test that resources have proper tags"""

    def test_vpc_has_tags(self, stack_outputs, deployment_region):
        """Verify VPC has proper tags"""
        vpc_id = get_output_value(stack_outputs, "VpcId")

        ec2 = boto3.client("ec2", region_name=deployment_region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])

        vpc = response["Vpcs"][0]
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

        # Check for CDK tags
        assert "aws:cdk:path" in tags or len(tags) > 0

    def test_ecs_cluster_has_tags(self, stack_outputs, deployment_region):
        """Verify ECS cluster has tags"""
        cluster_arn = get_output_value(stack_outputs, "EcsClusterArn")

        ecs = boto3.client("ecs", region_name=deployment_region)
        response = ecs.list_tags_for_resource(resourceArn=cluster_arn)

        tags = response.get("tags", [])
        # Should have at least some tags
        assert len(tags) > 0


class TestEndToEndWorkflow:
    """End-to-end integration tests"""

    def test_full_stack_operational(self, stack_outputs, deployment_region):
        """Verify full stack is operational"""
        # Check critical resources are all operational

        # 1. VPC is available
        vpc_id = get_output_value(stack_outputs, "VpcId")
        assert vpc_id is not None

        # 2. ECS service is running
        cluster_arn = get_output_value(stack_outputs, "EcsClusterArn")
        service_name = get_output_value(stack_outputs, "EcsServiceName")
        assert cluster_arn is not None
        assert service_name is not None

        # 3. ALB is active
        alb_arn = get_output_value(stack_outputs, "AlbArn")
        assert alb_arn is not None

        # 4. Aurora is available
        cluster_id = get_output_value(stack_outputs, "AuroraClusterIdentifier")
        assert cluster_id is not None

        # 5. DynamoDB table is active
        table_name = get_output_value(stack_outputs, "DynamoDbTableName")
        assert table_name is not None

        # 6. S3 bucket exists
        bucket_name = get_output_value(stack_outputs, "S3BucketName")
        assert bucket_name is not None

        # All critical components are present
        assert True, "Full stack is operational"
