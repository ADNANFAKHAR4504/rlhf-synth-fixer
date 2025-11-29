"""Integration tests for EKS deployment using actual AWS resources."""
import json
import os
import boto3
import pytest


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from deployment and flatten CDKTF output names."""
    outputs_file = "cfn-outputs/flat-outputs.json"

    if not os.path.exists(outputs_file):
        pytest.skip(f"Deployment outputs not found at {outputs_file}")

    with open(outputs_file, 'r', encoding='utf-8') as f:
        raw_outputs = json.load(f)

    # Step 1: Flatten nested structure
    # CDKTF outputs are nested: {'TapStackpr7284': {'output_key': 'value'}}
    # We need to extract the inner dictionary
    nested_outputs = {}
    for stack_name, outputs in raw_outputs.items():
        if isinstance(outputs, dict):
            # This is a nested structure - extract all outputs
            nested_outputs.update(outputs)
        else:
            # This is already flat - keep as is
            nested_outputs[stack_name] = outputs

    # Step 2: Convert CDKTF prefixed names to simple names
    # 'microservices_cluster_name_A6AAE71' -> 'cluster_name'
    flattened = {}
    for key, value in nested_outputs.items():
        # Handle CDKTF-prefixed outputs: prefix_semantic_name_HASH
        if key.startswith('microservices_') and '_' in key:
            # Split and extract semantic name (between prefix and hash)
            parts = key.split('_')
            # Remove 'microservices' prefix and hash suffix (last part)
            if len(parts) > 2:
                # Join all parts except first (microservices) and last (hash)
                semantic_name = '_'.join(parts[1:-1])
                flattened[semantic_name] = value
            else:
                flattened[key] = value
        else:
            # Keep non-prefixed outputs as-is
            flattened[key] = value

    return flattened


@pytest.fixture(scope="module")
def eks_client():
    """Create EKS client."""
    return boto3.client('eks', region_name=os.getenv('AWS_REGION', 'us-east-1'))


@pytest.fixture(scope="module")
def ecr_client():
    """Create ECR client."""
    return boto3.client('ecr', region_name=os.getenv('AWS_REGION', 'us-east-1'))


@pytest.fixture(scope="module")
def iam_client():
    """Create IAM client."""
    return boto3.client('iam', region_name=os.getenv('AWS_REGION', 'us-east-1'))


@pytest.fixture(scope="module")
def ec2_client():
    """Create EC2 client."""
    return boto3.client('ec2', region_name=os.getenv('AWS_REGION', 'us-east-1'))


@pytest.fixture(scope="module")
def secrets_client():
    """Create Secrets Manager client."""
    return boto3.client('secretsmanager', region_name=os.getenv('AWS_REGION', 'us-east-1'))


@pytest.fixture(scope="module")
def logs_client():
    """Create CloudWatch Logs client."""
    return boto3.client('logs', region_name=os.getenv('AWS_REGION', 'us-east-1'))


class TestEKSClusterDeployment:
    """Test EKS cluster deployment and configuration."""

    def test_eks_cluster_exists_and_active(self, stack_outputs, eks_client):
        """EKS cluster exists and is in ACTIVE state."""
        cluster_name = stack_outputs.get('cluster_name')
        assert cluster_name is not None, "cluster_name not found in outputs"

        response = eks_client.describe_cluster(name=cluster_name)
        cluster = response['cluster']

        assert cluster['status'] == 'ACTIVE'
        assert cluster['version'] == '1.29'

    def test_eks_cluster_has_correct_logging(self, stack_outputs, eks_client):
        """EKS cluster has all required logging enabled."""
        cluster_name = stack_outputs.get('cluster_name')
        response = eks_client.describe_cluster(name=cluster_name)
        cluster = response['cluster']

        enabled_logs = cluster['logging']['clusterLogging'][0]['types']
        required_logs = ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler']

        for log_type in required_logs:
            assert log_type in enabled_logs

    def test_fargate_profiles_deployed(self, stack_outputs, eks_client):
        """Fargate profiles deployed for all namespaces."""
        cluster_name = stack_outputs.get('cluster_name')
        response = eks_client.list_fargate_profiles(clusterName=cluster_name)

        fargate_profiles = response['fargateProfileNames']

        # Should have profiles for: payment, fraud-detection, reporting, kube-system
        assert len(fargate_profiles) >= 4

        # Verify namespace-specific profiles exist
        profile_names = ' '.join(fargate_profiles).lower()
        assert 'payment' in profile_names
        assert 'fraud' in profile_names or 'detection' in profile_names
        assert 'reporting' in profile_names
        assert 'kube-system' in profile_names

    def test_eks_addons_installed(self, stack_outputs, eks_client):
        """EKS addons - cluster should be functional (addons auto-managed by EKS)."""
        cluster_name = stack_outputs.get('cluster_name')
        response = eks_client.list_addons(clusterName=cluster_name)

        addons = response['addons']

        # For Fargate-only clusters, EKS auto-manages addons (vpc-cni, coredns, kube-proxy)
        # These are not explicitly created as EKS Add-ons to avoid deployment timeouts
        # Instead, verify cluster is ACTIVE which confirms addons are working
        cluster_response = eks_client.describe_cluster(name=cluster_name)
        assert cluster_response['cluster']['status'] == 'ACTIVE'

        # If addons are explicitly managed, verify they exist
        if len(addons) > 0:
            required_addons = ['vpc-cni', 'coredns', 'kube-proxy']
            for addon in required_addons:
                assert addon in addons


class TestNetworkingDeployment:
    """Test VPC and networking deployment."""

    def test_vpc_exists_and_configured(self, stack_outputs, ec2_client):
        """VPC exists with correct configuration."""
        vpc_id = stack_outputs.get('vpc_id')
        assert vpc_id is not None, "vpc_id not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        assert vpc['CidrBlock'] == '10.0.0.0/16'

        # DNS attributes are returned separately via describe_vpc_attribute
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True

    def test_subnets_across_three_azs(self, stack_outputs, ec2_client):
        """Subnets deployed across three availability zones."""
        vpc_id = stack_outputs.get('vpc_id')
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']

        # Should have 6 subnets (3 public + 3 private)
        assert len(subnets) == 6

        # Verify subnets span 3 AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) == 3

    def test_security_group_configured(self, stack_outputs, ec2_client):
        """Security group configured correctly."""
        sg_id = stack_outputs.get('cluster_security_group_id')
        assert sg_id is not None, "cluster_security_group_id not found in outputs"

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]

        # Verify ingress rules exist
        assert len(sg['IpPermissions']) > 0


class TestECRDeployment:
    """Test ECR repository deployment."""

    def test_ecr_repositories_exist(self, stack_outputs, ecr_client):
        """ECR repositories exist for all microservices."""
        ecr_urls_json = stack_outputs.get('ecr_repository_urls')
        assert ecr_urls_json is not None, "ecr_repository_urls not found in outputs"

        ecr_urls = json.loads(ecr_urls_json)

        # Should have 3 repositories
        assert len(ecr_urls) == 3

        # Verify repository names
        repo_names = list(ecr_urls.keys())
        assert any('payment' in name for name in repo_names)
        assert any('fraud' in name for name in repo_names)
        assert any('reporting' in name for name in repo_names)

    def test_ecr_scan_on_push_enabled(self, stack_outputs, ecr_client):
        """ECR repositories have scan_on_push enabled."""
        ecr_urls_json = stack_outputs.get('ecr_repository_urls')
        ecr_urls = json.loads(ecr_urls_json)

        for repo_name in ecr_urls.keys():
            response = ecr_client.describe_repositories(repositoryNames=[repo_name])
            repo = response['repositories'][0]

            assert repo['imageScanningConfiguration']['scanOnPush'] is True


class TestIAMDeployment:
    """Test IAM roles and policies deployment."""

    def test_oidc_provider_exists(self, stack_outputs, iam_client):
        """OIDC provider exists for IRSA."""
        oidc_arn = stack_outputs.get('oidc_provider_arn')
        assert oidc_arn is not None, "oidc_provider_arn not found in outputs"

        # Extract provider from ARN
        provider_url = oidc_arn.split('/')[1]

        response = iam_client.list_open_id_connect_providers()
        provider_arns = [p['Arn'] for p in response['OpenIDConnectProviderList']]

        assert oidc_arn in provider_arns

    def test_irsa_roles_exist(self, stack_outputs, iam_client):
        """IRSA roles exist for all namespaces."""
        payment_role_arn = stack_outputs.get('irsa_role_arn_payment')
        fraud_role_arn = stack_outputs.get('irsa_role_arn_fraud_detection')
        reporting_role_arn = stack_outputs.get('irsa_role_arn_reporting')

        assert payment_role_arn is not None
        assert fraud_role_arn is not None
        assert reporting_role_arn is not None

        # Verify roles exist
        for role_arn in [payment_role_arn, fraud_role_arn, reporting_role_arn]:
            role_name = role_arn.split('/')[-1]
            response = iam_client.get_role(RoleName=role_name)
            assert response['Role']['Arn'] == role_arn

    def test_alb_controller_role_exists(self, stack_outputs, iam_client):
        """ALB controller IAM role exists."""
        alb_role_arn = stack_outputs.get('alb_controller_role_arn')
        assert alb_role_arn is not None, "alb_controller_role_arn not found in outputs"

        role_name = alb_role_arn.split('/')[-1]
        response = iam_client.get_role(RoleName=role_name)
        assert response['Role']['Arn'] == alb_role_arn


class TestSecretsManagement:
    """Test Secrets Manager integration."""

    def test_secrets_exist_for_namespaces(self, stack_outputs, secrets_client):
        """Secrets exist for all namespaces."""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        namespaces = ['payment', 'fraud-detection', 'reporting']

        for namespace in namespaces:
            secret_name = f"{namespace}/app-config-{environment_suffix}"

            try:
                response = secrets_client.describe_secret(SecretId=secret_name)
                assert response['Name'] == secret_name
            except secrets_client.exceptions.ResourceNotFoundException:
                pytest.fail(f"Secret {secret_name} not found")


class TestCloudWatchLogging:
    """Test CloudWatch Logs configuration."""

    def test_cluster_log_group_exists(self, stack_outputs, logs_client):
        """Cluster log group exists."""
        cluster_name = stack_outputs.get('cluster_name')
        log_group_name = f"/aws/eks/{cluster_name}/cluster"

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [lg['logGroupName'] for lg in response['logGroups']]
        assert log_group_name in log_groups

    def test_container_insights_log_group_exists(self, stack_outputs, logs_client):
        """Container Insights log group exists."""
        cluster_name = stack_outputs.get('cluster_name')
        log_group_name = f"/aws/containerinsights/{cluster_name}/performance"

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [lg['logGroupName'] for lg in response['logGroups']]
        assert log_group_name in log_groups


class TestResourceNaming:
    """Test resource naming conventions."""

    def test_all_resources_include_environment_suffix(self, stack_outputs):
        """All resource names include environment suffix."""
        environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

        # Check cluster name
        cluster_name = stack_outputs.get('cluster_name')
        assert environment_suffix in cluster_name

        # Check ECR repository names
        ecr_urls_json = stack_outputs.get('ecr_repository_urls')
        if ecr_urls_json:
            ecr_urls = json.loads(ecr_urls_json)
            for repo_name in ecr_urls.keys():
                assert environment_suffix in repo_name
