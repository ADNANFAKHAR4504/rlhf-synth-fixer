"""Integration tests for EKS deployment."""
import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


class TestEksIntegration:
    """Integration tests for EKS cluster deployment."""

    @pytest.fixture(scope="class")
    def deployment_outputs(self):
        """Load deployment outputs from cfn-outputs/flat-outputs.json."""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Deployment outputs file not found: {outputs_file}")

        with open(outputs_file, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def eks_client(self):
        """Create EKS boto3 client."""
        return boto3.client('eks', region_name=os.getenv('AWS_REGION', 'us-east-2'))

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 boto3 client."""
        return boto3.client('ec2', region_name=os.getenv('AWS_REGION', 'us-east-2'))

    @pytest.fixture(scope="class")
    def iam_client(self):
        """Create IAM boto3 client."""
        return boto3.client('iam')

    @pytest.fixture(scope="class")
    def kms_client(self):
        """Create KMS boto3 client."""
        return boto3.client('kms', region_name=os.getenv('AWS_REGION', 'us-east-2'))

    @pytest.fixture(scope="class")
    def secrets_client(self):
        """Create Secrets Manager boto3 client."""
        return boto3.client('secretsmanager', region_name=os.getenv('AWS_REGION', 'us-east-2'))

    def test_eks_cluster_exists_and_active(self, eks_client, deployment_outputs):
        """Test that EKS cluster exists and is in ACTIVE state."""
        cluster_name = deployment_outputs.get('eks_cluster_name')
        assert cluster_name is not None, "EKS cluster name not found in outputs"

        try:
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            # Validate cluster properties
            assert cluster['name'] == cluster_name
            assert cluster['status'] == 'ACTIVE'
            assert cluster['version'] == deployment_outputs.get('eks_cluster_version', '1.31')
            assert 'endpoint' in cluster
            assert 'certificateAuthority' in cluster

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip(f"EKS cluster {cluster_name} not found - deployment may not have run")
            raise

    def test_eks_cluster_encryption_enabled(self, eks_client, deployment_outputs):
        """Test that EKS cluster has encryption enabled."""
        cluster_name = deployment_outputs.get('eks_cluster_name')

        try:
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            # Validate encryption config
            assert 'encryptionConfig' in cluster
            encryption_config = cluster['encryptionConfig']
            assert len(encryption_config) > 0
            assert 'provider' in encryption_config[0]
            assert 'keyArn' in encryption_config[0]['provider']

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip(f"EKS cluster {cluster_name} not found - deployment may not have run")
            raise

    def test_vpc_exists_with_correct_cidr(self, ec2_client, deployment_outputs):
        """Test that VPC exists with correct CIDR block."""
        vpc_id = deployment_outputs.get('vpc_id')
        assert vpc_id is not None, "VPC ID not found in outputs"

        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpcs = response['Vpcs']
            assert len(vpcs) == 1

            vpc = vpcs[0]
            assert vpc['VpcId'] == vpc_id
            assert vpc['State'] == 'available'
            assert vpc['CidrBlock'] == deployment_outputs.get('vpc_cidr_block', '10.0.0.0/16')

        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcID.NotFound':
                pytest.skip(f"VPC {vpc_id} not found - deployment may not have run")
            raise

    def test_private_subnets_exist_in_different_azs(self, ec2_client, deployment_outputs):
        """Test that private subnets exist in different availability zones."""
        private_subnet_ids = json.loads(deployment_outputs.get('private_subnet_ids', '[]'))
        assert len(private_subnet_ids) >= 2, "Expected at least 2 private subnets"

        try:
            response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
            subnets = response['Subnets']
            assert len(subnets) == len(private_subnet_ids)

            # Verify subnets are in different AZs
            azs = {subnet['AvailabilityZone'] for subnet in subnets}
            assert len(azs) >= 2, "Subnets should be in at least 2 different AZs"

            # Verify all subnets are in the correct VPC
            vpc_id = deployment_outputs.get('vpc_id')
            for subnet in subnets:
                assert subnet['VpcId'] == vpc_id
                assert subnet['State'] == 'available'

        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidSubnetID.NotFound':
                pytest.skip(f"Subnets not found - deployment may not have run")
            raise

    def test_kms_keys_exist_and_enabled(self, kms_client, deployment_outputs):
        """Test that KMS keys exist and are enabled."""
        cluster_key_arn = deployment_outputs.get('kms_cluster_key_arn')
        logs_key_arn = deployment_outputs.get('kms_logs_key_arn')

        assert cluster_key_arn is not None, "Cluster KMS key ARN not found in outputs"
        assert logs_key_arn is not None, "Logs KMS key ARN not found in outputs"

        for key_arn in [cluster_key_arn, logs_key_arn]:
            try:
                # Extract key ID from ARN
                key_id = key_arn.split('/')[-1]
                response = kms_client.describe_key(KeyId=key_id)
                key_metadata = response['KeyMetadata']

                assert key_metadata['KeyState'] == 'Enabled'
                assert key_metadata['Enabled'] is True
                assert key_metadata['Origin'] == 'AWS_KMS'

            except ClientError as e:
                if e.response['Error']['Code'] == 'NotFoundException':
                    pytest.skip(f"KMS key {key_id} not found - deployment may not have run")
                raise

    def test_irsa_roles_exist_with_correct_trust_policy(self, iam_client, deployment_outputs):
        """Test that IRSA roles exist with OIDC trust policies."""
        role_arns = [
            deployment_outputs.get('ebs_csi_role_arn'),
            deployment_outputs.get('cluster_autoscaler_role_arn'),
            deployment_outputs.get('alb_controller_role_arn'),
            deployment_outputs.get('external_dns_role_arn'),
            deployment_outputs.get('external_secrets_role_arn')
        ]

        oidc_provider_arn = deployment_outputs.get('eks_oidc_provider_arn')
        assert oidc_provider_arn is not None, "OIDC provider ARN not found in outputs"

        for role_arn in role_arns:
            if role_arn is None:
                continue

            try:
                role_name = role_arn.split('/')[-1]
                response = iam_client.get_role(RoleName=role_name)
                role = response['Role']

                assert role['Arn'] == role_arn

                # Verify trust policy contains OIDC provider
                assume_role_policy = json.loads(role['AssumeRolePolicyDocument'])
                assert 'Statement' in assume_role_policy

                # Check if any statement references the OIDC provider
                has_oidc_trust = any(
                    oidc_provider_arn.split('/')[-1] in json.dumps(stmt)
                    for stmt in assume_role_policy['Statement']
                )
                assert has_oidc_trust, f"Role {role_name} should have OIDC trust policy"

            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    pytest.skip(f"IAM role {role_name} not found - deployment may not have run")
                raise

    def test_secrets_manager_secret_exists(self, secrets_client, deployment_outputs):
        """Test that Secrets Manager secret exists."""
        secret_arn = deployment_outputs.get('secrets_manager_secret_arn')
        assert secret_arn is not None, "Secrets Manager secret ARN not found in outputs"

        try:
            response = secrets_client.describe_secret(SecretId=secret_arn)

            assert response['ARN'] == secret_arn
            assert 'KmsKeyId' in response  # Should be encrypted with KMS
            assert 'Name' in response

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip(f"Secret {secret_arn} not found - deployment may not have run")
            raise

    def test_eks_node_group_exists(self, eks_client, deployment_outputs):
        """Test that EKS node group exists and is active."""
        cluster_name = deployment_outputs.get('eks_cluster_name')
        assert cluster_name is not None, "EKS cluster name not found in outputs"

        try:
            # List node groups for the cluster
            response = eks_client.list_nodegroups(clusterName=cluster_name)
            nodegroups = response.get('nodegroups', [])

            assert len(nodegroups) >= 1, "Expected at least 1 node group"

            # Describe first node group
            ng_response = eks_client.describe_nodegroup(
                clusterName=cluster_name,
                nodegroupName=nodegroups[0]
            )
            nodegroup = ng_response['nodegroup']

            assert nodegroup['status'] == 'ACTIVE'
            assert 'scalingConfig' in nodegroup
            assert 'subnets' in nodegroup

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip(f"Node groups for cluster {cluster_name} not found - deployment may not have run")
            raise

    def test_eks_addons_installed(self, eks_client, deployment_outputs):
        """Test that required EKS addons are installed."""
        cluster_name = deployment_outputs.get('eks_cluster_name')
        assert cluster_name is not None, "EKS cluster name not found in outputs"

        required_addons = ['coredns', 'kube-proxy', 'vpc-cni', 'aws-ebs-csi-driver']

        try:
            response = eks_client.list_addons(clusterName=cluster_name)
            installed_addons = response.get('addons', [])

            for required_addon in required_addons:
                assert required_addon in installed_addons, f"Required addon {required_addon} not installed"

                # Check addon status
                addon_response = eks_client.describe_addon(
                    clusterName=cluster_name,
                    addonName=required_addon
                )
                addon = addon_response['addon']
                assert addon['status'] == 'ACTIVE'

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip(f"Addons for cluster {cluster_name} not found - deployment may not have run")
            raise
