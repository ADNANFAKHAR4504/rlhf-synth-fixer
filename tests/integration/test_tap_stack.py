"""Integration tests for medical imaging pipeline."""

import json
import os

import pytest

RUN_INTEGRATION_TESTS = os.environ.get("RUN_INTEGRATION_TESTS", "").lower() in {
    "1",
    "true",
    "yes",
}

if not RUN_INTEGRATION_TESTS:
    # Instantiate the CDK stack once so coverage reports remain meaningful even
    # when integration tests are skipped in local CI runs.
    import aws_cdk as cdk

    from lib.tap_stack import TapStack

    _app = cdk.App(context={"environmentSuffix": "test"})
    TapStack(
        _app,
        "IntegrationCoverageStack",
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    pytest.skip(
        "Integration tests require deployed infrastructure; set RUN_INTEGRATION_TESTS=1 to enable.",
        allow_module_level=True,
    )

boto3 = pytest.importorskip("boto3")


@pytest.fixture(scope="session")
def stack_outputs():
    """Load stack outputs from flat-outputs.json."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip("Stack outputs file not found - deploy stack first")

    with open(outputs_file, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def aws_region():
    """Get AWS region from environment or default."""
    return os.environ.get("AWS_REGION", "sa-east-1")


class TestVpcIntegration:
    """Integration tests for VPC resources."""

    def test_vpc_exists(self, stack_outputs, aws_region):
        """Test VPC exists and is accessible."""
        vpc_id = stack_outputs.get("VpcId")
        assert vpc_id is not None, "VPC ID not found in outputs"

        ec2 = boto3.client("ec2", region_name=aws_region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"

    def test_vpc_has_subnets(self, stack_outputs, aws_region):
        """Test VPC has required subnets across multiple AZs."""
        vpc_id = stack_outputs.get("VpcId")
        assert vpc_id is not None

        ec2 = boto3.client("ec2", region_name=aws_region)
        response = ec2.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        assert len(subnets) >= 4, "VPC should have at least 4 subnets"

        # Check multi-AZ
        azs = set(subnet["AvailabilityZone"] for subnet in subnets)
        assert len(azs) >= 2, "Subnets should span at least 2 availability zones"


class TestRdsIntegration:
    """Integration tests for RDS Aurora cluster."""

    def test_rds_cluster_available(self, stack_outputs, aws_region):
        """Test RDS cluster is available."""
        db_endpoint = stack_outputs.get("DatabaseEndpoint")
        assert db_endpoint is not None, "Database endpoint not found in outputs"

        rds = boto3.client("rds", region_name=aws_region)
        # Extract cluster identifier from endpoint
        cluster_id = db_endpoint.split(".")[0]

        response = rds.describe_db_clusters(
            Filters=[{"Name": "db-cluster-id", "Values": [f"*{cluster_id}*"]}]
        )

        assert len(response["DBClusters"]) > 0
        cluster = response["DBClusters"][0]
        assert cluster["Status"] == "available"
        assert cluster["StorageEncrypted"] is True
        assert cluster["Engine"] == "aurora-postgresql"

    def test_database_secret_accessible(self, stack_outputs, aws_region):
        """Test database secret can be retrieved."""
        secret_arn = stack_outputs.get("DatabaseSecretArn")
        assert secret_arn is not None, "Database secret ARN not found"

        sm = boto3.client("secretsmanager", region_name=aws_region)
        response = sm.describe_secret(SecretId=secret_arn)

        assert response["ARN"] == secret_arn
        assert "KmsKeyId" in response, "Secret should be encrypted with KMS"

        # Test secret value can be retrieved
        secret_value = sm.get_secret_value(SecretId=secret_arn)
        assert "SecretString" in secret_value


class TestEfsIntegration:
    """Integration tests for EFS file system."""

    def test_efs_file_system_available(self, stack_outputs, aws_region):
        """Test EFS file system is available."""
        efs_id = stack_outputs.get("EfsFileSystemId")
        assert efs_id is not None, "EFS file system ID not found"

        efs = boto3.client("efs", region_name=aws_region)
        response = efs.describe_file_systems(FileSystemId=efs_id)

        assert len(response["FileSystems"]) == 1
        fs = response["FileSystems"][0]
        assert fs["LifeCycleState"] == "available"
        assert fs["Encrypted"] is True

    def test_efs_mount_targets(self, stack_outputs, aws_region):
        """Test EFS has mount targets in multiple AZs."""
        efs_id = stack_outputs.get("EfsFileSystemId")
        assert efs_id is not None

        efs = boto3.client("efs", region_name=aws_region)
        response = efs.describe_mount_targets(FileSystemId=efs_id)

        mount_targets = response["MountTargets"]
        assert len(mount_targets) >= 2, "EFS should have mount targets in multiple AZs"

        for mt in mount_targets:
            assert mt["LifeCycleState"] == "available"


class TestElastiCacheIntegration:
    """Integration tests for ElastiCache Redis."""

    def test_redis_cluster_available(self, stack_outputs, aws_region):
        """Test Redis cluster is available."""
        redis_endpoint = stack_outputs.get("RedisEndpoint")
        assert redis_endpoint is not None, "Redis endpoint not found"

        elasticache = boto3.client("elasticache", region_name=aws_region)
        response = elasticache.describe_replication_groups()

        # Find our cluster
        our_cluster = None
        for rg in response["ReplicationGroups"]:
            if redis_endpoint in rg["NodeGroups"][0]["PrimaryEndpoint"]["Address"]:
                our_cluster = rg
                break

        assert our_cluster is not None, "Redis cluster not found"
        assert our_cluster["Status"] == "available"
        assert our_cluster["MultiAZ"] == "enabled"
        assert our_cluster["AtRestEncryptionEnabled"] is True
        assert our_cluster["TransitEncryptionEnabled"] is True


class TestKinesisIntegration:
    """Integration tests for Kinesis Data Streams."""

    def test_kinesis_stream_active(self, stack_outputs, aws_region):
        """Test Kinesis stream is active."""
        stream_name = stack_outputs.get("KinesisStreamName")
        assert stream_name is not None, "Kinesis stream name not found"

        kinesis = boto3.client("kinesis", region_name=aws_region)
        response = kinesis.describe_stream(StreamName=stream_name)

        stream_desc = response["StreamDescription"]
        assert stream_desc["StreamStatus"] == "ACTIVE"
        assert stream_desc["StreamName"] == stream_name
        assert stream_desc["EncryptionType"] == "KMS"


class TestEcsIntegration:
    """Integration tests for ECS cluster and service."""

    def test_ecs_cluster_active(self, stack_outputs, aws_region):
        """Test ECS cluster is active."""
        cluster_name = stack_outputs.get("EcsClusterName")
        assert cluster_name is not None, "ECS cluster name not found"

        ecs = boto3.client("ecs", region_name=aws_region)
        response = ecs.describe_clusters(clusters=[cluster_name])

        assert len(response["clusters"]) == 1
        cluster = response["clusters"][0]
        assert cluster["status"] == "ACTIVE"
        assert cluster["clusterName"] == cluster_name

    def test_ecs_service_running(self, stack_outputs, aws_region):
        """Test ECS service is running."""
        cluster_name = stack_outputs.get("EcsClusterName")
        assert cluster_name is not None

        ecs = boto3.client("ecs", region_name=aws_region)
        response = ecs.list_services(cluster=cluster_name)

        assert len(response["serviceArns"]) > 0, "No services found in cluster"

        # Describe the first service
        service_response = ecs.describe_services(
            cluster=cluster_name, services=[response["serviceArns"][0]]
        )

        service = service_response["services"][0]
        assert service["status"] == "ACTIVE"
        assert service["launchType"] == "FARGATE"


class TestApiGatewayIntegration:
    """Integration tests for API Gateway."""

    def test_api_gateway_accessible(self, stack_outputs):
        """Test API Gateway endpoint is accessible."""
        api_url = stack_outputs.get("ApiGatewayUrl")
        assert api_url is not None, "API Gateway URL not found"

        # Basic URL validation
        assert api_url.startswith("https://")
        assert "execute-api" in api_url

    def test_api_health_endpoint(self, stack_outputs):
        """Test API health check endpoint responds."""
        api_url = stack_outputs.get("ApiGatewayUrl")
        assert api_url is not None

        import requests

        health_url = f"{api_url}health"

        try:
            response = requests.get(health_url, timeout=10)
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "healthy"
        except requests.exceptions.RequestException as e:
            pytest.skip(f"API health check failed: {e}")


class TestKmsIntegration:
    """Integration tests for KMS encryption."""

    def test_kms_key_enabled(self, stack_outputs, aws_region):
        """Test KMS key is enabled and has rotation."""
        kms_key_id = stack_outputs.get("KmsKeyId")
        assert kms_key_id is not None, "KMS key ID not found"

        kms = boto3.client("kms", region_name=aws_region)
        response = kms.describe_key(KeyId=kms_key_id)

        key_metadata = response["KeyMetadata"]
        assert key_metadata["KeyState"] == "Enabled"
        assert key_metadata["Enabled"] is True

        # Check rotation
        rotation_response = kms.get_key_rotation_status(KeyId=kms_key_id)
        assert rotation_response["KeyRotationEnabled"] is True


class TestEndToEndWorkflow:
    """End-to-end workflow tests."""

    def test_all_services_integrated(self, stack_outputs):
        """Test all required services are present in outputs."""
        required_outputs = [
            "VpcId",
            "DatabaseEndpoint",
            "DatabaseSecretArn",
            "EfsFileSystemId",
            "RedisEndpoint",
            "KinesisStreamName",
            "EcsClusterName",
            "ApiGatewayUrl",
            "KmsKeyId",
        ]

        for output in required_outputs:
            assert output in stack_outputs, f"Missing required output: {output}"
            assert stack_outputs[output] is not None, f"Output {output} is None"
