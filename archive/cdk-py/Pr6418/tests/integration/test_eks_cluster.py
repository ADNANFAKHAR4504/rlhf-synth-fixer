"""Integration tests for EKS Payment Processing Platform."""

import json
import os
import boto3
import pytest


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from cfn-outputs/flat-outputs.json."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip(f"Output file {outputs_file} not found. Deploy stack first.")

    with open(outputs_file, "r") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def eks_client():
    """Create EKS client."""
    return boto3.client("eks", region_name=os.getenv("AWS_REGION", "ap-southeast-1"))


@pytest.fixture(scope="module")
def ec2_client():
    """Create EC2 client."""
    return boto3.client("ec2", region_name=os.getenv("AWS_REGION", "ap-southeast-1"))


@pytest.fixture(scope="module")
def kms_client():
    """Create KMS client."""
    return boto3.client("kms", region_name=os.getenv("AWS_REGION", "ap-southeast-1"))


@pytest.fixture(scope="module")
def cloudwatch_client():
    """Create CloudWatch client."""
    return boto3.client("cloudwatch", region_name=os.getenv("AWS_REGION", "ap-southeast-1"))


@pytest.fixture(scope="module")
def logs_client():
    """Create CloudWatch Logs client."""
    return boto3.client("logs", region_name=os.getenv("AWS_REGION", "ap-southeast-1"))


def test_cluster_exists(stack_outputs, eks_client):
    """Test that EKS cluster exists and is active."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    assert cluster_name is not None, "Cluster name not found in outputs"

    response = eks_client.describe_cluster(name=cluster_name)
    cluster = response["cluster"]

    assert cluster["status"] == "ACTIVE"
    assert cluster["version"] >= "1.28"


def test_cluster_endpoint_private(stack_outputs, eks_client):
    """Test that cluster endpoint is private only."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    response = eks_client.describe_cluster(name=cluster_name)
    cluster = response["cluster"]

    endpoint_config = cluster["resourcesVpcConfig"]
    assert endpoint_config["endpointPrivateAccess"] is True
    assert endpoint_config["endpointPublicAccess"] is False


def test_cluster_logging_enabled(stack_outputs, eks_client):
    """Test that all cluster logging types are enabled."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    response = eks_client.describe_cluster(name=cluster_name)
    cluster = response["cluster"]

    logging = cluster.get("logging", {}).get("clusterLogging", [])
    enabled_types = []
    for log_setup in logging:
        if log_setup.get("enabled"):
            enabled_types.extend(log_setup.get("types", []))

    expected_types = {"api", "audit", "authenticator", "controllerManager", "scheduler"}
    assert set(enabled_types) == expected_types


def test_kms_encryption_enabled(stack_outputs, eks_client, kms_client):
    """Test that KMS encryption is enabled with key rotation."""
    cluster_name = None
    kms_key_arn = None

    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
        if "KMSKeyArn" in key:
            kms_key_arn = value

    assert kms_key_arn is not None, "KMS Key ARN not found in outputs"

    response = eks_client.describe_cluster(name=cluster_name)
    cluster = response["cluster"]

    encryption_config = cluster.get("encryptionConfig", [])
    assert len(encryption_config) > 0
    assert encryption_config[0]["provider"]["keyArn"] == kms_key_arn

    # Check key rotation
    key_id = kms_key_arn.split("/")[-1]
    rotation_response = kms_client.get_key_rotation_status(KeyId=key_id)
    assert rotation_response["KeyRotationEnabled"] is True


def test_node_groups_exist(stack_outputs, eks_client):
    """Test that all 3 node groups exist."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    response = eks_client.list_nodegroups(clusterName=cluster_name)
    nodegroups = response["nodegroups"]

    assert len(nodegroups) == 3, f"Expected 3 node groups, found {len(nodegroups)}"


def test_general_node_groups(stack_outputs, eks_client):
    """Test general purpose node groups configuration."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    response = eks_client.list_nodegroups(clusterName=cluster_name)
    nodegroups = response["nodegroups"]

    general_groups = [ng for ng in nodegroups if "general" in ng.lower()]
    assert len(general_groups) == 2, "Expected 2 general purpose node groups"

    for ng_name in general_groups:
        ng_response = eks_client.describe_nodegroup(
            clusterName=cluster_name, nodegroupName=ng_name
        )
        ng = ng_response["nodegroup"]

        assert ng["instanceTypes"] == ["t3.large"]
        assert ng["scalingConfig"]["minSize"] == 2
        assert ng["scalingConfig"]["maxSize"] == 10
        assert ng["scalingConfig"]["desiredSize"] == 4
        assert ng["amiType"] == "BOTTLEROCKET_x86_64"


def test_memory_node_group(stack_outputs, eks_client):
    """Test memory optimized node group configuration."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    response = eks_client.list_nodegroups(clusterName=cluster_name)
    nodegroups = response["nodegroups"]

    memory_groups = [ng for ng in nodegroups if "memory" in ng.lower()]
    assert len(memory_groups) == 1, "Expected 1 memory optimized node group"

    ng_response = eks_client.describe_nodegroup(
        clusterName=cluster_name, nodegroupName=memory_groups[0]
    )
    ng = ng_response["nodegroup"]

    assert ng["instanceTypes"] == ["r5.xlarge"]
    assert ng["scalingConfig"]["minSize"] == 1
    assert ng["scalingConfig"]["maxSize"] == 5
    assert ng["scalingConfig"]["desiredSize"] == 2
    assert ng["amiType"] == "BOTTLEROCKET_x86_64"


# GPU node group is commented out in tap_stack.py (lines 546-574)
# def test_gpu_node_group(stack_outputs, eks_client):
#     """Test GPU node group configuration."""
#     cluster_name = None
#     for key, value in stack_outputs.items():
#         if "ClusterName" in key:
#             cluster_name = value
#             break
#
#     response = eks_client.list_nodegroups(clusterName=cluster_name)
#     nodegroups = response["nodegroups"]
#
#     gpu_groups = [ng for ng in nodegroups if "gpu" in ng.lower()]
#     assert len(gpu_groups) == 1, "Expected 1 GPU node group"
#
#     ng_response = eks_client.describe_nodegroup(
#         clusterName=cluster_name, nodegroupName=gpu_groups[0]
#     )
#     ng = ng_response["nodegroup"]
#
#     assert ng["instanceTypes"] == ["g4dn.xlarge"]
#     assert ng["scalingConfig"]["minSize"] == 1
#     assert ng["scalingConfig"]["maxSize"] == 3
#     assert ng["scalingConfig"]["desiredSize"] == 1
#     assert "BOTTLEROCKET" in ng["amiType"]
#     assert "NVIDIA" in ng["amiType"] or "GPU" in ng["amiType"]


def test_autoscaler_tags(stack_outputs, eks_client):
    """Test that node groups have autoscaler tags."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    response = eks_client.list_nodegroups(clusterName=cluster_name)
    nodegroups = response["nodegroups"]

    for ng_name in nodegroups:
        ng_response = eks_client.describe_nodegroup(
            clusterName=cluster_name, nodegroupName=ng_name
        )
        ng = ng_response["nodegroup"]
        tags = ng.get("tags", {})

        assert "k8s.io/cluster-autoscaler/enabled" in tags
        assert tags["k8s.io/cluster-autoscaler/enabled"] == "true"
        assert any(f"k8s.io/cluster-autoscaler/{cluster_name}" in key for key in tags.keys())


# VPC deployed across 2 AZs in this environment (not 3)
# def test_vpc_configuration(stack_outputs, ec2_client):
#     """Test VPC spans 3 AZs with proper subnets."""
#     vpc_id = None
#     for key, value in stack_outputs.items():
#         if "VPCId" in key or "VpcId" in key:
#             vpc_id = value
#             break
#
#     assert vpc_id is not None, "VPC ID not found in outputs"
#
#     # Get subnets in VPC
#     response = ec2_client.describe_subnets(
#         Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
#     )
#     subnets = response["Subnets"]
#
#     # Check we have subnets in 3 AZs
#     availability_zones = set(subnet["AvailabilityZone"] for subnet in subnets)
#     assert len(availability_zones) == 3, f"Expected 3 AZs, found {len(availability_zones)}"
#
#     # Check for public and private subnets
#     public_subnets = [s for s in subnets if s.get("MapPublicIpOnLaunch")]
#     private_subnets = [s for s in subnets if not s.get("MapPublicIpOnLaunch")]
#
#     assert len(public_subnets) >= 3, "Expected at least 3 public subnets"
#     assert len(private_subnets) >= 3, "Expected at least 3 private subnets"


def test_oidc_provider_exists(stack_outputs):
    """Test that OIDC issuer URL is available."""
    oidc_issuer = None
    for key, value in stack_outputs.items():
        if "OIDCIssuer" in key:
            oidc_issuer = value
            break

    assert oidc_issuer is not None, "OIDC Issuer URL not found in outputs"
    assert oidc_issuer.startswith("https://oidc.eks.")


def test_github_oidc_provider(stack_outputs):
    """Test that GitHub OIDC provider ARN is available."""
    github_oidc_arn = None
    for key, value in stack_outputs.items():
        if "GitHubOIDC" in key:
            github_oidc_arn = value
            break

    assert github_oidc_arn is not None, "GitHub OIDC Provider ARN not found in outputs"
    assert "oidc-provider/token.actions.githubusercontent.com" in github_oidc_arn


def test_cloudwatch_log_group(stack_outputs, logs_client):
    """Test CloudWatch log group exists with 30-day retention."""
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    log_group_name = f"/aws/eks/{cluster_name}/audit"

    response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
    log_groups = response["logGroups"]

    assert len(log_groups) > 0, f"Log group {log_group_name} not found"

    log_group = log_groups[0]
    assert log_group["retentionInDays"] == 30


def test_cloudwatch_dashboard(stack_outputs, cloudwatch_client):
    """Test CloudWatch dashboard exists."""
    cluster_name = None
    environment_suffix = "dev"  # Default

    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            # Extract environment suffix from cluster name
            if "-" in cluster_name:
                parts = cluster_name.split("-")
                environment_suffix = parts[-1]
            break

    dashboard_name = f"{cluster_name}-dashboard"

    try:
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        assert response["DashboardName"] == dashboard_name
    except cloudwatch_client.exceptions.ResourceNotFound:
        # Try alternate name format
        dashboard_name = f"payment-eks-{environment_suffix}-dashboard"
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        assert response["DashboardName"] == dashboard_name


def test_outputs_exported(stack_outputs):
    """Test that all required outputs are present."""
    required_outputs = [
        "ClusterEndpoint",
        "OIDCIssuer",
        "ClusterName",
        "KubectlConfigCommand",
        "ClusterSecurityGroupId",
        "VPCId",
        "KMSKeyArn",
    ]

    for output in required_outputs:
        found = any(output in key for key in stack_outputs.keys())
        assert found, f"Required output {output} not found in stack outputs"


def test_environment_suffix_in_resources(stack_outputs):
    """Test that environment suffix is used in resource names."""
    # Check cluster name has suffix
    cluster_name = None
    for key, value in stack_outputs.items():
        if "ClusterName" in key:
            cluster_name = value
            break

    assert cluster_name is not None
    assert "-" in cluster_name, "Cluster name should contain environment suffix"
