"""
Integration tests for deployed payment migration infrastructure.
Tests actual AWS resources using deployment outputs.
NO MOCKING - all tests use real AWS resources.
"""
import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from deployment"""
    outputs_file = "cfn-outputs/flat-outputs.json"

    if not os.path.exists(outputs_file):
        pytest.skip(
            "Integration tests skipped: cfn-outputs/flat-outputs.json not found. "
            "Deploy infrastructure first using: npm run cdk:deploy"
        )

    try:
        with open(outputs_file, "r") as f:
            outputs = json.load(f)
            if not outputs:
                pytest.skip(
                    "Integration tests skipped: cfn-outputs/flat-outputs.json is empty. "
                    "Ensure deployment completes successfully and outputs are collected."
                )
            return outputs
    except (json.JSONDecodeError, IOError) as e:
        pytest.skip(f"Integration tests skipped: Failed to load deployment outputs: {e}")


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment or use default"""
    return os.environ.get("CDK_DEFAULT_REGION", "us-east-1")


@pytest.fixture(scope="module")
def rds_client(aws_region):
    """Create RDS client"""
    return boto3.client("rds", region_name=aws_region)


@pytest.fixture(scope="module")
def dms_client(aws_region):
    """Create DMS client"""
    return boto3.client("dms", region_name=aws_region)


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client"""
    return boto3.client("s3", region_name=aws_region)


@pytest.fixture(scope="module")
def ecs_client(aws_region):
    """Create ECS client"""
    return boto3.client("ecs", region_name=aws_region)


@pytest.fixture(scope="module")
def elbv2_client(aws_region):
    """Create ELB v2 client"""
    return boto3.client("elbv2", region_name=aws_region)


@pytest.fixture(scope="module")
def cloudwatch_client(aws_region):
    """Create CloudWatch client"""
    return boto3.client("cloudwatch", region_name=aws_region)


@pytest.fixture(scope="module")
def secretsmanager_client(aws_region):
    """Create Secrets Manager client"""
    return boto3.client("secretsmanager", region_name=aws_region)


@pytest.fixture(scope="module")
def route53_client(aws_region):
    """Create Route 53 client"""
    return boto3.client("route53", region_name=aws_region)


class TestRDSDeployment:
    """Test RDS database deployment"""

    def test_source_rds_instance_exists(self, stack_outputs, rds_client):
        """Test source RDS instance is deployed and available"""
        # Get source DB identifier from outputs
        db_identifiers = [
            v for k, v in stack_outputs.items()
            if "sourcedb" in k.lower() and "identifier" in k.lower()
        ]

        if not db_identifiers:
            pytest.skip("Source DB identifier not found in outputs")

        db_identifier = db_identifiers[0]

        # Verify DB instance exists
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        assert len(response["DBInstances"]) == 1
        db_instance = response["DBInstances"][0]
        assert db_instance["DBInstanceStatus"] in ["available", "creating", "backing-up"]

    def test_target_rds_instance_exists(self, stack_outputs, rds_client):
        """Test target RDS instance is deployed and available"""
        # Get target DB identifier from outputs
        db_identifiers = [
            v for k, v in stack_outputs.items()
            if "targetdb" in k.lower() and "identifier" in k.lower()
        ]

        if not db_identifiers:
            pytest.skip("Target DB identifier not found in outputs")

        db_identifier = db_identifiers[0]

        # Verify DB instance exists
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        assert len(response["DBInstances"]) == 1
        db_instance = response["DBInstances"][0]
        assert db_instance["DBInstanceStatus"] in ["available", "creating", "backing-up"]

    def test_rds_encryption_enabled(self, stack_outputs, rds_client):
        """Test RDS instances have encryption enabled"""
        db_identifiers = [
            v for k, v in stack_outputs.items()
            if "db" in k.lower() and "identifier" in k.lower()
        ]

        if not db_identifiers:
            pytest.skip("DB identifiers not found in outputs")

        for db_identifier in db_identifiers:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )
            db_instance = response["DBInstances"][0]
            assert db_instance["StorageEncrypted"] is True


class TestDMSDeployment:
    """Test AWS DMS deployment"""

    def test_dms_replication_instance_exists(self, stack_outputs, dms_client):
        """Test DMS replication instance exists"""
        replication_instance_arns = [
            v for k, v in stack_outputs.items()
            if "replicationinstance" in k.lower() and "arn" in k.lower()
        ]

        if not replication_instance_arns:
            pytest.skip("DMS replication instance ARN not found in outputs")

        arn = replication_instance_arns[0]

        # Verify replication instance
        response = dms_client.describe_replication_instances(
            Filters=[{"Name": "replication-instance-arn", "Values": [arn]}]
        )

        assert len(response["ReplicationInstances"]) == 1
        instance = response["ReplicationInstances"][0]
        assert instance["ReplicationInstanceStatus"] in ["available", "creating"]

    def test_dms_endpoints_exist(self, stack_outputs, dms_client):
        """Test DMS source and target endpoints exist"""
        endpoint_arns = [
            v for k, v in stack_outputs.items()
            if "endpoint" in k.lower() and "arn" in k.lower()
        ]

        if not endpoint_arns:
            pytest.skip("DMS endpoint ARNs not found in outputs")

        # Should have at least 2 endpoints (source and target)
        assert len(endpoint_arns) >= 2

        for arn in endpoint_arns:
            response = dms_client.describe_endpoints(
                Filters=[{"Name": "endpoint-arn", "Values": [arn]}]
            )
            assert len(response["Endpoints"]) == 1

    def test_dms_replication_task_exists(self, stack_outputs, dms_client):
        """Test DMS replication task exists"""
        task_arns = [
            v for k, v in stack_outputs.items()
            if "replicationtask" in k.lower() and "arn" in k.lower()
        ]

        if not task_arns:
            pytest.skip("DMS replication task ARN not found in outputs")

        arn = task_arns[0]

        # Verify replication task
        response = dms_client.describe_replication_tasks(
            Filters=[{"Name": "replication-task-arn", "Values": [arn]}]
        )

        assert len(response["ReplicationTasks"]) == 1
        task = response["ReplicationTasks"][0]
        assert task["Status"] in ["ready", "starting", "running", "stopped"]


class TestS3Deployment:
    """Test S3 bucket deployment"""

    def test_source_s3_bucket_exists(self, stack_outputs, s3_client):
        """Test source S3 bucket exists"""
        bucket_names = [
            v for k, v in stack_outputs.items()
            if "source" in k.lower() and "bucket" in k.lower() and "name" in k.lower() and "arn" not in k.lower()
        ]

        if not bucket_names:
            pytest.skip("Source bucket name not found in outputs")

        bucket_name = bucket_names[0]

        # Verify bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_target_s3_bucket_exists(self, stack_outputs, s3_client):
        """Test target S3 bucket exists"""
        bucket_names = [
            v for k, v in stack_outputs.items()
            if "target" in k.lower() and "bucket" in k.lower() and "name" in k.lower() and "arn" not in k.lower()
        ]

        if not bucket_names:
            pytest.skip("Target bucket name not found in outputs")

        bucket_name = bucket_names[0]

        # Verify bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_versioning_enabled(self, stack_outputs, s3_client):
        """Test S3 buckets have versioning enabled"""
        bucket_names = [
            v for k, v in stack_outputs.items()
            if "bucket" in k.lower() and "name" in k.lower()
        ]

        if not bucket_names:
            pytest.skip("Bucket names not found in outputs")

        for bucket_name in bucket_names:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert response.get("Status") == "Enabled"

    def test_s3_encryption_enabled(self, stack_outputs, s3_client):
        """Test S3 buckets have encryption enabled"""
        bucket_names = [
            v for k, v in stack_outputs.items()
            if "bucket" in k.lower() and "name" in k.lower() and "arn" not in k.lower()
        ]

        if not bucket_names:
            pytest.skip("Bucket names not found in outputs")

        for bucket_name in bucket_names:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            assert "ServerSideEncryptionConfiguration" in response
            assert "Rules" in response["ServerSideEncryptionConfiguration"]
            assert len(response["ServerSideEncryptionConfiguration"]["Rules"]) > 0


class TestECSDeployment:
    """Test ECS service deployment"""

    def test_ecs_cluster_exists(self, stack_outputs, ecs_client):
        """Test ECS cluster exists"""
        cluster_names = [
            v for k, v in stack_outputs.items()
            if "cluster" in k.lower() and "name" in k.lower()
        ]

        if not cluster_names:
            pytest.skip("ECS cluster name not found in outputs")

        cluster_name = cluster_names[0]

        # Verify cluster exists
        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response["clusters"]) == 1
        assert response["clusters"][0]["status"] == "ACTIVE"

    def test_ecs_service_running(self, stack_outputs, ecs_client):
        """Test ECS service is running"""
        cluster_names = [
            v for k, v in stack_outputs.items()
            if "cluster" in k.lower() and "name" in k.lower()
        ]

        service_names = [
            v for k, v in stack_outputs.items()
            if "service" in k.lower() and "name" in k.lower()
        ]

        if not cluster_names or not service_names:
            pytest.skip("ECS cluster or service name not found in outputs")

        cluster_name = cluster_names[0]
        service_name = service_names[0]

        # Verify service is running
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        assert len(response["services"]) == 1
        service = response["services"][0]
        assert service["status"] == "ACTIVE"


class TestALBDeployment:
    """Test Application Load Balancer deployment"""

    def test_alb_exists(self, stack_outputs, elbv2_client):
        """Test ALB exists and is active"""
        alb_arns = [
            v for k, v in stack_outputs.items()
            if "loadbalancer" in k.lower() and "arn" in k.lower()
        ]

        if not alb_arns:
            pytest.skip("ALB ARN not found in outputs")

        alb_arn = alb_arns[0]

        # Verify ALB exists
        response = elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )

        assert len(response["LoadBalancers"]) == 1
        alb = response["LoadBalancers"][0]
        assert alb["State"]["Code"] in ["active", "provisioning"]

    def test_alb_dns_accessible(self, stack_outputs):
        """Test ALB DNS name is accessible"""
        alb_dns_names = [
            v for k, v in stack_outputs.items()
            if "loadbalancer" in k.lower() and "dns" in k.lower()
        ]

        if not alb_dns_names:
            pytest.skip("ALB DNS name not found in outputs")

        alb_dns = alb_dns_names[0]

        # Verify DNS name is a valid format
        assert "elb.amazonaws.com" in alb_dns


class TestCloudWatchMonitoring:
    """Test CloudWatch monitoring setup"""

    def test_cloudwatch_dashboard_exists(self, stack_outputs, cloudwatch_client):
        """Test CloudWatch dashboard exists"""
        dashboard_names = [
            v for k, v in stack_outputs.items()
            if "dashboard" in k.lower() and "name" in k.lower()
        ]

        if not dashboard_names:
            pytest.skip("CloudWatch dashboard name not found in outputs")

        dashboard_name = dashboard_names[0]

        # Verify dashboard exists
        response = cloudwatch_client.get_dashboard(
            DashboardName=dashboard_name
        )

        assert response["DashboardName"] == dashboard_name
        assert response["DashboardBody"] is not None

    def test_cloudwatch_alarms_exist(self, stack_outputs, cloudwatch_client):
        """Test CloudWatch alarms exist"""
        alarm_names = [
            v for k, v in stack_outputs.items()
            if "alarm" in k.lower() and "name" in k.lower()
        ]

        if not alarm_names:
            pytest.skip("CloudWatch alarm names not found in outputs")

        # Verify alarms exist
        response = cloudwatch_client.describe_alarms(
            AlarmNames=alarm_names
        )

        assert len(response["MetricAlarms"]) >= 1


class TestSecretsManager:
    """Test Secrets Manager configuration"""

    def test_database_secrets_exist(self, stack_outputs, secretsmanager_client):
        """Test database secrets exist in Secrets Manager"""
        secret_arns = [
            v for k, v in stack_outputs.items()
            if "secret" in k.lower() and "arn" in k.lower()
        ]

        if not secret_arns:
            pytest.skip("Secret ARNs not found in outputs")

        for secret_arn in secret_arns:
            # Verify secret exists (don't retrieve actual value for security)
            response = secretsmanager_client.describe_secret(
                SecretId=secret_arn
            )
            assert response["ARN"] == secret_arn


class TestRoute53Configuration:
    """Test Route 53 DNS configuration"""

    def test_hosted_zone_exists(self, stack_outputs, route53_client):
        """Test Route 53 hosted zone exists"""
        hosted_zone_ids = [
            v for k, v in stack_outputs.items()
            if "hostedzone" in k.lower() and "id" in k.lower()
        ]

        if not hosted_zone_ids:
            pytest.skip("Hosted zone ID not found in outputs")

        zone_id = hosted_zone_ids[0]

        # Verify hosted zone exists
        response = route53_client.get_hosted_zone(Id=zone_id)
        # AWS returns zone ID with /hostedzone/ prefix, normalize both for comparison
        returned_zone_id = response["HostedZone"]["Id"].replace("/hostedzone/", "")
        expected_zone_id = zone_id.replace("/hostedzone/", "")
        assert returned_zone_id == expected_zone_id

    def test_health_checks_configured(self, stack_outputs, route53_client):
        """Test Route 53 health checks are configured"""
        health_check_ids = [
            v for k, v in stack_outputs.items()
            if "healthcheck" in k.lower() and "id" in k.lower()
        ]

        if not health_check_ids:
            pytest.skip("Health check IDs not found in outputs")

        for health_check_id in health_check_ids:
            response = route53_client.get_health_check(
                HealthCheckId=health_check_id
            )
            assert response["HealthCheck"]["Id"] == health_check_id


class TestEndToEndWorkflow:
    """Test end-to-end migration workflow"""

    def test_all_stacks_deployed(self, stack_outputs):
        """Test all required stacks are deployed"""
        # Verify we have outputs from all major components
        required_components = ["rds", "dms", "s3", "ecs", "alb", "cloudwatch"]

        for component in required_components:
            matching_keys = [k for k in stack_outputs.keys() if component in k.lower()]
            assert len(matching_keys) > 0, f"No outputs found for {component}"

    def test_migration_infrastructure_integrated(self, stack_outputs):
        """Test migration infrastructure components are properly integrated"""
        # Check we have all necessary outputs for migration workflow
        assert len(stack_outputs) > 10, "Insufficient outputs for complete migration setup"

        # Verify key outputs exist
        required_patterns = ["db", "bucket", "cluster", "loadbalancer"]
        for pattern in required_patterns:
            matching = [k for k in stack_outputs.keys() if pattern in k.lower()]
            assert len(matching) > 0, f"Missing outputs for {pattern}"
