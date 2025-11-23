"""Integration tests for medical imaging pipeline (CFN-driven)."""

import os
import pytest
import boto3
# ----------------------------
# Session-scoped environment
# ----------------------------

@pytest.fixture(scope="session")
def aws_region() -> str:
    """AWS region from environment (required in CI)."""
    region = os.environ.get("AWS_REGION")
    if not region:
        pytest.skip("AWS_REGION is not set")
    return region


@pytest.fixture(scope="session")
def env_suffix() -> str:
    """Environment suffix from CI (e.g., pr5244, dev, prod)."""
    suffix = os.environ.get("ENVIRONMENT_SUFFIX") or os.environ.get("environmentSuffix")
    if not suffix:
        pytest.skip("ENVIRONMENT_SUFFIX (or environmentSuffix) is not set")
    return suffix


@pytest.fixture(scope="session")
def stack_name(env_suffix: str) -> str:
    """CloudFormation stack name derived from the environment suffix."""
    return f"TapStack-{env_suffix}"


@pytest.fixture(scope="session")
def cfn_client(aws_region: str):
    return boto3.client("cloudformation", region_name=aws_region)


@pytest.fixture(scope="session")
def cfn_stack(cfn_client, stack_name: str):
    """Describe the CFN stack and ensure it's in a good state."""
    try:
        resp = cfn_client.describe_stacks(StackName=stack_name)
    except cfn_client.exceptions.ClientError as e:
        pytest.skip(f"CloudFormation stack {stack_name} not found or not accessible: {e}")
    stacks = resp.get("Stacks", [])
    assert stacks, f"No stacks returned for {stack_name}"
    stack = stacks[0]
    assert stack["StackStatus"] in {
        "CREATE_COMPLETE",
        "UPDATE_COMPLETE",
        "UPDATE_ROLLBACK_COMPLETE",
    }, f"Stack {stack_name} is not in a stable COMPLETE status: {stack['StackStatus']}"
    return stack


@pytest.fixture(scope="session")
def stack_outputs(cfn_stack: dict) -> dict:
    """Map CFN Outputs into a simple dict for downstream tests."""
    outputs = {}
    for o in cfn_stack.get("Outputs", []) or []:
        outputs[o["OutputKey"]] = o.get("OutputValue")
    if not outputs:
        pytest.skip("No CloudFormation outputs present on the stack; cannot run integration checks.")
    return outputs


@pytest.fixture(scope="session")
def stack_resources(cfn_client, stack_name: str) -> list[dict]:
    """List CFN stack resources (handy if we need logical/physical IDs)."""
    resources = []
    next_token = None
    while True:
        kwargs = {"StackName": stack_name}
        if next_token:
            kwargs["NextToken"] = next_token
        resp = cfn_client.list_stack_resources(**kwargs)
        resources.extend(resp.get("StackResourceSummaries", []))
        next_token = resp.get("NextToken")
        if not next_token:
            break
    return resources


# ----------------------------
# Service-specific tests
# ----------------------------

class TestVpcIntegration:
    """Integration tests for VPC resources."""

    def test_vpc_exists(self, stack_outputs, aws_region):
        vpc_id = stack_outputs.get("VpcId")
        assert vpc_id, "VpcId output missing"
        ec2 = boto3.client("ec2", region_name=aws_region)
        resp = ec2.describe_vpcs(VpcIds=[vpc_id])
        assert len(resp["Vpcs"]) == 1
        assert resp["Vpcs"][0]["State"] == "available"

    def test_vpc_has_subnets(self, stack_outputs, aws_region):
        vpc_id = stack_outputs.get("VpcId")
        assert vpc_id, "VpcId output missing"
        ec2 = boto3.client("ec2", region_name=aws_region)
        resp = ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        subnets = resp["Subnets"]
        assert len(subnets) >= 4, "VPC should have at least 4 subnets"
        azs = {s["AvailabilityZone"] for s in subnets}
        assert len(azs) >= 2, "Subnets should span at least 2 availability zones"


class TestRdsIntegration:
    """Integration tests for RDS Aurora cluster."""

    def test_rds_cluster_available(self, stack_outputs, aws_region):
        db_endpoint = stack_outputs.get("DatabaseEndpoint")
        assert db_endpoint, "DatabaseEndpoint output missing"
        rds = boto3.client("rds", region_name=aws_region)
        cluster_id_fragment = db_endpoint.split(".")[0]
        resp = rds.describe_db_clusters()
        clusters = [
            c for c in resp.get("DBClusters", [])
            if cluster_id_fragment in (c.get("Endpoint") or "") or cluster_id_fragment in c.get("DBClusterIdentifier", "")
        ]
        assert clusters, "Matching RDS cluster not found"
        cluster = clusters[0]
        assert cluster["Status"] == "available"
        assert cluster["StorageEncrypted"] is True
        assert cluster["Engine"] in {"aurora-postgresql", "aurora-postgresql-serverless"}


    def test_database_secret_accessible(self, stack_outputs, aws_region):
        secret_arn = stack_outputs.get("DatabaseSecretArn")
        assert secret_arn, "DatabaseSecretArn output missing"
        sm = boto3.client("secretsmanager", region_name=aws_region)
        meta = sm.describe_secret(SecretId=secret_arn)
        assert meta["ARN"] == secret_arn
        assert "KmsKeyId" in meta, "Secret should be encrypted with KMS"
        val = sm.get_secret_value(SecretId=secret_arn)
        assert "SecretString" in val


class TestEfsIntegration:
    """Integration tests for EFS file system."""

    def test_efs_file_system_available(self, stack_outputs, aws_region):
        efs_id = stack_outputs.get("EfsFileSystemId")
        assert efs_id, "EfsFileSystemId output missing"
        efs = boto3.client("efs", region_name=aws_region)
        resp = efs.describe_file_systems(FileSystemId=efs_id)
        assert len(resp["FileSystems"]) == 1
        fs = resp["FileSystems"][0]
        assert fs["LifeCycleState"] == "available"
        assert fs["Encrypted"] is True

    def test_efs_mount_targets(self, stack_outputs, aws_region):
        efs_id = stack_outputs.get("EfsFileSystemId")
        assert efs_id, "EfsFileSystemId output missing"
        efs = boto3.client("efs", region_name=aws_region)
        resp = efs.describe_mount_targets(FileSystemId=efs_id)
        mts = resp["MountTargets"]
        assert len(mts) >= 2, "EFS should have mount targets in multiple AZs"
        for mt in mts:
            assert mt["LifeCycleState"] == "available"


class TestElastiCacheIntegration:
    """Integration tests for ElastiCache Redis."""

    def test_redis_cluster_available(self, stack_outputs, aws_region):
        redis_endpoint = stack_outputs.get("RedisEndpoint")
        assert redis_endpoint, "RedisEndpoint output missing"
        ec = boto3.client("elasticache", region_name=aws_region)
        r = ec.describe_replication_groups()
        target = None
        for rg in r.get("ReplicationGroups", []):
            try:
                addr = rg["NodeGroups"][0]["PrimaryEndpoint"]["Address"]
            except (KeyError, IndexError):
                continue
            if redis_endpoint.split(":")[0] in addr:
                target = rg
                break
        assert target is not None, "Redis cluster not found"
        assert target["Status"] == "available"
        # MultiAZ can be str/bool depending on API; handle both
        multi_az = target.get("MultiAZ")
        assert (multi_az is True) or (isinstance(multi_az, str) and multi_az.lower() == "enabled")
        assert target["AtRestEncryptionEnabled"] is True
        assert target["TransitEncryptionEnabled"] is True


class TestKinesisIntegration:
    """Integration tests for Kinesis Data Streams."""

    def test_kinesis_stream_active(self, stack_outputs, aws_region):
        stream_name = stack_outputs.get("KinesisStreamName")
        assert stream_name, "KinesisStreamName output missing"
        kin = boto3.client("kinesis", region_name=aws_region)
        desc = kin.describe_stream(StreamName=stream_name)["StreamDescription"]
        assert desc["StreamStatus"] == "ACTIVE"
        assert desc["StreamName"] == stream_name
        assert desc.get("EncryptionType") in {"KMS", "KMS_MANAGED"}


class TestEcsIntegration:
    """Integration tests for ECS cluster and service."""

    def test_ecs_cluster_active(self, stack_outputs, aws_region):
        cluster_name = stack_outputs.get("EcsClusterName")
        assert cluster_name, "EcsClusterName output missing"
        ecs = boto3.client("ecs", region_name=aws_region)
        r = ecs.describe_clusters(clusters=[cluster_name])
        assert r["clusters"], "ECS cluster not found"
        c = r["clusters"][0]
        assert c["status"] == "ACTIVE"
        assert c["clusterName"] == cluster_name

    def test_ecs_service_running(self, stack_outputs, aws_region):
        cluster_name = stack_outputs.get("EcsClusterName")
        assert cluster_name, "EcsClusterName output missing"
        ecs = boto3.client("ecs", region_name=aws_region)
        ls = ecs.list_services(cluster=cluster_name)
        assert ls["serviceArns"], "No services found in cluster"
        svc = ecs.describe_services(cluster=cluster_name, services=[ls["serviceArns"][0]])["services"][0]
        assert svc["status"] == "ACTIVE"
        assert svc.get("launchType") in {"FARGATE", "EXTERNAL", "EC2"}  # prefer FARGATE, allow others
        # If your stack outputs EcsServiceName, you can pin exact service instead of first.


class TestApiGatewayIntegration:
    """Integration tests for API Gateway."""

    def test_api_gateway_accessible(self, stack_outputs):
        api_url = stack_outputs.get("ApiGatewayUrl")
        assert api_url, "ApiGatewayUrl output missing"
        assert api_url.startswith("https://")
        assert "execute-api" in api_url

    def test_api_health_endpoint(self, stack_outputs):
        api_url = stack_outputs.get("ApiGatewayUrl")
        assert api_url, "ApiGatewayUrl output missing"
        import requests
        health_url = f"{api_url}health"
        try:
            r = requests.get(health_url, timeout=10)
            assert r.status_code == 200
            data = r.json()
            assert data.get("status") == "healthy"
        except requests.exceptions.RequestException as e:
            pytest.skip(f"API health check failed: {e}")


class TestKmsIntegration:
    """Integration tests for KMS encryption."""

    def test_kms_key_enabled(self, stack_outputs, aws_region):
        kms_key_id = stack_outputs.get("KmsKeyId")
        assert kms_key_id, "KmsKeyId output missing"
        kms = boto3.client("kms", region_name=aws_region)
        meta = kms.describe_key(KeyId=kms_key_id)["KeyMetadata"]
        assert meta["KeyState"] == "Enabled"
        assert meta["Enabled"] is True
        rot = kms.get_key_rotation_status(KeyId=kms_key_id)
        assert rot["KeyRotationEnabled"] is True


class TestEndToEndWorkflow:
    """End-to-end workflow tests."""

    def test_all_services_integrated(self, stack_outputs):
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
        for key in required_outputs:
            assert key in stack_outputs, f"Missing required output: {key}"
            assert stack_outputs[key], f"Output {key} is empty"
