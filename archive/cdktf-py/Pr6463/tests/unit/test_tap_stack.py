"""Unit tests for TAP Stack with 100% code coverage using mocks."""
import os
import sys
import json
from unittest.mock import Mock, MagicMock, patch, PropertyMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
import pytest


class TestTapStack:
    """Test suite for TAP Stack with full mock coverage."""

    def test_tap_stack_with_all_parameters(self):
        """Test TapStack instantiation with all parameters."""
        with patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.VpcConstruct') as mock_vpc, \
             patch('lib.tap_stack.KmsEncryptionConstruct') as mock_kms, \
             patch('lib.tap_stack.EksClusterConstruct') as mock_eks, \
             patch('lib.tap_stack.IrsaRolesConstruct') as mock_irsa, \
             patch('lib.tap_stack.NodeGroupsConstruct'), \
             patch('lib.tap_stack.EksAddonsConstruct'), \
             patch('lib.tap_stack.MonitoringConstruct'), \
             patch('lib.tap_stack.PodSecurityConstruct'), \
             patch('lib.tap_stack.SecretsManagerConstruct') as mock_secrets, \
             patch('lib.tap_stack.TerraformOutput'):

            # Configure mocks
            mock_vpc_instance = Mock()
            mock_vpc_instance.vpc_id = "vpc-12345"
            mock_vpc_instance.private_subnet_ids = ["subnet-1", "subnet-2"]
            mock_vpc.return_value = mock_vpc_instance

            mock_kms_instance = Mock()
            mock_kms_instance.cluster_key_arn = "arn:aws:kms:us-east-1:123456789012:key/cluster"
            mock_kms_instance.logs_key_arn = "arn:aws:kms:us-east-1:123456789012:key/logs"
            mock_kms.return_value = mock_kms_instance

            mock_eks_instance = Mock()
            mock_eks_instance.cluster_name = "eks-cluster-test"
            mock_eks_instance.endpoint = "https://eks.endpoint"
            mock_eks_instance.oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc"
            mock_eks_instance.oidc_provider_url = "https://oidc.eks.us-east-1.amazonaws.com/id/test"
            mock_eks_instance.node_role_arn = "arn:aws:iam::123456789012:role/node-role"
            mock_eks.return_value = mock_eks_instance

            mock_irsa_instance = Mock()
            mock_irsa_instance.ebs_csi_role_arn = "arn:aws:iam::123456789012:role/ebs-csi"
            mock_irsa_instance.autoscaler_role_arn = "arn:aws:iam::123456789012:role/autoscaler"
            mock_irsa_instance.alb_controller_role_arn = "arn:aws:iam::123456789012:role/alb"
            mock_irsa_instance.external_dns_role_arn = "arn:aws:iam::123456789012:role/dns"
            mock_irsa.return_value = mock_irsa_instance

            mock_secrets_instance = Mock()
            mock_secrets_instance.external_secrets_role_arn = "arn:aws:iam::123456789012:role/secrets"
            mock_secrets.return_value = mock_secrets_instance

            from lib.tap_stack import TapStack
            app = App()
            stack = TapStack(
                app,
                "TestStack",
                environment_suffix="prod",
                aws_region="us-west-2",
                state_bucket="my-state-bucket",
                state_bucket_region="us-west-1",
                default_tags={"tags": {"Environment": "production"}}
            )

            assert stack is not None

    def test_tap_stack_with_us_east_1_region(self):
        """Test TapStack with us-east-1 region to cover AZ logic."""
        with patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.VpcConstruct') as mock_vpc, \
             patch('lib.tap_stack.KmsEncryptionConstruct') as mock_kms, \
             patch('lib.tap_stack.EksClusterConstruct') as mock_eks, \
             patch('lib.tap_stack.IrsaRolesConstruct') as mock_irsa, \
             patch('lib.tap_stack.NodeGroupsConstruct'), \
             patch('lib.tap_stack.EksAddonsConstruct'), \
             patch('lib.tap_stack.MonitoringConstruct'), \
             patch('lib.tap_stack.PodSecurityConstruct'), \
             patch('lib.tap_stack.SecretsManagerConstruct') as mock_secrets, \
             patch('lib.tap_stack.TerraformOutput'):

            self._setup_mocks(mock_vpc, mock_kms, mock_eks, mock_irsa, mock_secrets)

            from lib.tap_stack import TapStack
            app = App()
            stack = TapStack(app, "TestStack", environment_suffix="test", aws_region="us-east-1")

            # Verify us-east-1 AZs were used
            mock_vpc.assert_called_once()
            call_kwargs = mock_vpc.call_args[1]
            assert call_kwargs['availability_zones'] == ["us-east-1a", "us-east-1b", "us-east-1c"]

    def test_tap_stack_with_us_east_2_region(self):
        """Test TapStack with us-east-2 region."""
        with patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.VpcConstruct') as mock_vpc, \
             patch('lib.tap_stack.KmsEncryptionConstruct') as mock_kms, \
             patch('lib.tap_stack.EksClusterConstruct') as mock_eks, \
             patch('lib.tap_stack.IrsaRolesConstruct') as mock_irsa, \
             patch('lib.tap_stack.NodeGroupsConstruct'), \
             patch('lib.tap_stack.EksAddonsConstruct'), \
             patch('lib.tap_stack.MonitoringConstruct'), \
             patch('lib.tap_stack.PodSecurityConstruct'), \
             patch('lib.tap_stack.SecretsManagerConstruct') as mock_secrets, \
             patch('lib.tap_stack.TerraformOutput'):

            self._setup_mocks(mock_vpc, mock_kms, mock_eks, mock_irsa, mock_secrets)

            from lib.tap_stack import TapStack
            app = App()
            stack = TapStack(app, "TestStack", environment_suffix="test", aws_region="us-east-2")

            call_kwargs = mock_vpc.call_args[1]
            assert call_kwargs['availability_zones'] == ["us-east-2a", "us-east-2b", "us-east-2c"]

    def test_tap_stack_with_us_west_1_region(self):
        """Test TapStack with us-west-1 region."""
        with patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.VpcConstruct') as mock_vpc, \
             patch('lib.tap_stack.KmsEncryptionConstruct') as mock_kms, \
             patch('lib.tap_stack.EksClusterConstruct') as mock_eks, \
             patch('lib.tap_stack.IrsaRolesConstruct') as mock_irsa, \
             patch('lib.tap_stack.NodeGroupsConstruct'), \
             patch('lib.tap_stack.EksAddonsConstruct'), \
             patch('lib.tap_stack.MonitoringConstruct'), \
             patch('lib.tap_stack.PodSecurityConstruct'), \
             patch('lib.tap_stack.SecretsManagerConstruct') as mock_secrets, \
             patch('lib.tap_stack.TerraformOutput'):

            self._setup_mocks(mock_vpc, mock_kms, mock_eks, mock_irsa, mock_secrets)

            from lib.tap_stack import TapStack
            app = App()
            stack = TapStack(app, "TestStack", environment_suffix="test", aws_region="us-west-1")

            call_kwargs = mock_vpc.call_args[1]
            assert call_kwargs['availability_zones'] == ["us-west-1a", "us-west-1b", "us-west-1c"]

    def test_tap_stack_with_us_west_2_region(self):
        """Test TapStack with us-west-2 region."""
        with patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.VpcConstruct') as mock_vpc, \
             patch('lib.tap_stack.KmsEncryptionConstruct') as mock_kms, \
             patch('lib.tap_stack.EksClusterConstruct') as mock_eks, \
             patch('lib.tap_stack.IrsaRolesConstruct') as mock_irsa, \
             patch('lib.tap_stack.NodeGroupsConstruct'), \
             patch('lib.tap_stack.EksAddonsConstruct'), \
             patch('lib.tap_stack.MonitoringConstruct'), \
             patch('lib.tap_stack.PodSecurityConstruct'), \
             patch('lib.tap_stack.SecretsManagerConstruct') as mock_secrets, \
             patch('lib.tap_stack.TerraformOutput'):

            self._setup_mocks(mock_vpc, mock_kms, mock_eks, mock_irsa, mock_secrets)

            from lib.tap_stack import TapStack
            app = App()
            stack = TapStack(app, "TestStack", environment_suffix="test", aws_region="us-west-2")

            call_kwargs = mock_vpc.call_args[1]
            assert call_kwargs['availability_zones'] == ["us-west-2a", "us-west-2b", "us-west-2c"]

    def test_tap_stack_with_other_region(self):
        """Test TapStack with non-US region to cover default AZ logic."""
        with patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.VpcConstruct') as mock_vpc, \
             patch('lib.tap_stack.KmsEncryptionConstruct') as mock_kms, \
             patch('lib.tap_stack.EksClusterConstruct') as mock_eks, \
             patch('lib.tap_stack.IrsaRolesConstruct') as mock_irsa, \
             patch('lib.tap_stack.NodeGroupsConstruct'), \
             patch('lib.tap_stack.EksAddonsConstruct'), \
             patch('lib.tap_stack.MonitoringConstruct'), \
             patch('lib.tap_stack.PodSecurityConstruct'), \
             patch('lib.tap_stack.SecretsManagerConstruct') as mock_secrets, \
             patch('lib.tap_stack.TerraformOutput'):

            self._setup_mocks(mock_vpc, mock_kms, mock_eks, mock_irsa, mock_secrets)

            from lib.tap_stack import TapStack
            app = App()
            stack = TapStack(app, "TestStack", environment_suffix="test", aws_region="eu-west-1")

            call_kwargs = mock_vpc.call_args[1]
            assert call_kwargs['availability_zones'] == ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

    def test_tap_stack_default_parameters(self):
        """Test TapStack with default parameters."""
        with patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.VpcConstruct') as mock_vpc, \
             patch('lib.tap_stack.KmsEncryptionConstruct') as mock_kms, \
             patch('lib.tap_stack.EksClusterConstruct') as mock_eks, \
             patch('lib.tap_stack.IrsaRolesConstruct') as mock_irsa, \
             patch('lib.tap_stack.NodeGroupsConstruct'), \
             patch('lib.tap_stack.EksAddonsConstruct'), \
             patch('lib.tap_stack.MonitoringConstruct'), \
             patch('lib.tap_stack.PodSecurityConstruct'), \
             patch('lib.tap_stack.SecretsManagerConstruct') as mock_secrets, \
             patch('lib.tap_stack.TerraformOutput'):

            self._setup_mocks(mock_vpc, mock_kms, mock_eks, mock_irsa, mock_secrets)

            from lib.tap_stack import TapStack
            app = App()
            stack = TapStack(app, "TestStack")

            assert stack is not None

    @staticmethod
    def _setup_mocks(mock_vpc, mock_kms, mock_eks, mock_irsa, mock_secrets):
        """Helper to setup common mocks."""
        mock_vpc_instance = Mock()
        mock_vpc_instance.vpc_id = "vpc-12345"
        mock_vpc_instance.private_subnet_ids = ["subnet-1", "subnet-2"]
        mock_vpc.return_value = mock_vpc_instance

        mock_kms_instance = Mock()
        mock_kms_instance.cluster_key_arn = "arn:aws:kms:us-east-1:123456789012:key/cluster"
        mock_kms_instance.logs_key_arn = "arn:aws:kms:us-east-1:123456789012:key/logs"
        mock_kms.return_value = mock_kms_instance

        mock_eks_instance = Mock()
        mock_eks_instance.cluster_name = "eks-cluster-test"
        mock_eks_instance.endpoint = "https://eks.endpoint"
        mock_eks_instance.oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc"
        mock_eks_instance.oidc_provider_url = "https://oidc.eks.us-east-1.amazonaws.com/id/test"
        mock_eks_instance.node_role_arn = "arn:aws:iam::123456789012:role/node-role"
        mock_eks.return_value = mock_eks_instance

        mock_irsa_instance = Mock()
        mock_irsa_instance.ebs_csi_role_arn = "arn:aws:iam::123456789012:role/ebs-csi"
        mock_irsa_instance.autoscaler_role_arn = "arn:aws:iam::123456789012:role/autoscaler"
        mock_irsa_instance.alb_controller_role_arn = "arn:aws:iam::123456789012:role/alb"
        mock_irsa_instance.external_dns_role_arn = "arn:aws:iam::123456789012:role/dns"
        mock_irsa.return_value = mock_irsa_instance

        mock_secrets_instance = Mock()
        mock_secrets_instance.external_secrets_role_arn = "arn:aws:iam::123456789012:role/secrets"
        mock_secrets.return_value = mock_secrets_instance


class TestVpcConstruct:
    """Test suite for VPC Construct."""

    def test_vpc_construct_initialization(self):
        """Test VPC construct initialization with all resources."""
        with patch('lib.vpc_stack.Vpc') as mock_vpc, \
             patch('lib.vpc_stack.InternetGateway'), \
             patch('lib.vpc_stack.Subnet') as mock_subnet, \
             patch('lib.vpc_stack.Eip'), \
             patch('lib.vpc_stack.NatGateway'), \
             patch('lib.vpc_stack.RouteTable'), \
             patch('lib.vpc_stack.RouteTableAssociation'), \
             patch('lib.vpc_stack.SecurityGroup') as mock_sg, \
             patch('lib.vpc_stack.SecurityGroupRule'), \
             patch('lib.vpc_stack.VpcEndpoint'):

            mock_vpc_instance = Mock()
            mock_vpc_instance.id = "vpc-123"
            mock_vpc.return_value = mock_vpc_instance

            mock_subnet_instance = Mock()
            mock_subnet_instance.id = "subnet-123"
            mock_subnet.return_value = mock_subnet_instance

            mock_sg_instance = Mock()
            mock_sg_instance.id = "sg-123"
            mock_sg.return_value = mock_sg_instance

            from lib.vpc_stack import VpcConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            vpc = VpcConstruct(
                stack,
                "test-vpc",
                environment_suffix="test",
                cidr_block="10.0.0.0/16",
                availability_zones=["us-east-1a", "us-east-1b"],
                region="us-east-1"
            )

            assert vpc.vpc_id == "vpc-123"
            assert len(vpc.private_subnet_ids) == 2

    def test_vpc_construct_default_region(self):
        """Test VPC construct with default region."""
        with patch('lib.vpc_stack.Vpc') as mock_vpc, \
             patch('lib.vpc_stack.InternetGateway'), \
             patch('lib.vpc_stack.Subnet') as mock_subnet, \
             patch('lib.vpc_stack.Eip'), \
             patch('lib.vpc_stack.NatGateway'), \
             patch('lib.vpc_stack.RouteTable'), \
             patch('lib.vpc_stack.RouteTableAssociation'), \
             patch('lib.vpc_stack.SecurityGroup') as mock_sg, \
             patch('lib.vpc_stack.SecurityGroupRule'), \
             patch('lib.vpc_stack.VpcEndpoint') as mock_vpce:

            mock_vpc_instance = Mock()
            mock_vpc_instance.id = "vpc-123"
            mock_vpc.return_value = mock_vpc_instance

            mock_subnet_instance = Mock()
            mock_subnet_instance.id = "subnet-123"
            mock_subnet.return_value = mock_subnet_instance

            mock_sg_instance = Mock()
            mock_sg_instance.id = "sg-123"
            mock_sg.return_value = mock_sg_instance

            from lib.vpc_stack import VpcConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            vpc = VpcConstruct(
                stack,
                "test-vpc",
                environment_suffix="test",
                cidr_block="10.0.0.0/16",
                availability_zones=["us-east-1a", "us-east-1b"]
            )

            assert vpc.region == "us-east-1"
            # Verify VPC endpoints created with correct region
            assert mock_vpce.call_count == 4  # s3, ecr-api, ecr-dkr, ec2


class TestKmsEncryptionConstruct:
    """Test suite for KMS Encryption Construct."""

    def test_kms_construct_initialization(self):
        """Test KMS construct creates all keys."""
        with patch('lib.kms_encryption.DataAwsCallerIdentity') as mock_caller, \
             patch('lib.kms_encryption.KmsKey') as mock_key, \
             patch('lib.kms_encryption.KmsAlias'):

            mock_caller_instance = Mock()
            mock_caller_instance.account_id = "123456789012"
            mock_caller.return_value = mock_caller_instance

            mock_key_instance = Mock()
            mock_key_instance.id = "key-123"
            mock_key_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/123"
            mock_key.return_value = mock_key_instance

            from lib.kms_encryption import KmsEncryptionConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            kms = KmsEncryptionConstruct(
                stack,
                "test-kms",
                environment_suffix="test",
                region="us-east-1"
            )

            assert kms.cluster_key_arn == "arn:aws:kms:us-east-1:123456789012:key/123"
            assert kms.logs_key_arn == "arn:aws:kms:us-east-1:123456789012:key/123"
            # 1 cluster key + 3 tenant keys + 1 logs key = 5 keys
            assert mock_key.call_count == 5

    def test_kms_construct_default_region(self):
        """Test KMS construct with default region."""
        with patch('lib.kms_encryption.DataAwsCallerIdentity') as mock_caller, \
             patch('lib.kms_encryption.KmsKey') as mock_key, \
             patch('lib.kms_encryption.KmsAlias'):

            mock_caller_instance = Mock()
            mock_caller_instance.account_id = "123456789012"
            mock_caller.return_value = mock_caller_instance

            mock_key_instance = Mock()
            mock_key_instance.id = "key-123"
            mock_key_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/123"
            mock_key.return_value = mock_key_instance

            from lib.kms_encryption import KmsEncryptionConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            kms = KmsEncryptionConstruct(
                stack,
                "test-kms",
                environment_suffix="test"
            )

            assert kms.region == "us-east-1"

    def test_kms_tenant_keys_created(self):
        """Test KMS construct creates tenant keys."""
        with patch('lib.kms_encryption.DataAwsCallerIdentity') as mock_caller, \
             patch('lib.kms_encryption.KmsKey') as mock_key, \
             patch('lib.kms_encryption.KmsAlias'):

            mock_caller_instance = Mock()
            mock_caller_instance.account_id = "123456789012"
            mock_caller.return_value = mock_caller_instance

            mock_key_instance = Mock()
            mock_key_instance.id = "key-123"
            mock_key_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/123"
            mock_key.return_value = mock_key_instance

            from lib.kms_encryption import KmsEncryptionConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            kms = KmsEncryptionConstruct(
                stack,
                "test-kms",
                environment_suffix="test",
                region="us-west-2"
            )

            assert "tenant-a" in kms.tenant_keys
            assert "tenant-b" in kms.tenant_keys
            assert "tenant-c" in kms.tenant_keys


class TestEksClusterConstruct:
    """Test suite for EKS Cluster Construct."""

    def test_eks_cluster_with_separate_logs_key(self):
        """Test EKS cluster with separate logs KMS key."""
        with patch('lib.eks_cluster.CloudwatchLogGroup'), \
             patch('lib.eks_cluster.SecurityGroup') as mock_sg, \
             patch('lib.eks_cluster.SecurityGroupRule'), \
             patch('lib.eks_cluster.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.eks_cluster.IamRole') as mock_role, \
             patch('lib.eks_cluster.IamRolePolicyAttachment'), \
             patch('lib.eks_cluster.EksCluster') as mock_cluster, \
             patch('lib.eks_cluster.IamOpenidConnectProvider') as mock_oidc:

            self._setup_eks_mocks(mock_sg, mock_policy_doc, mock_role, mock_cluster, mock_oidc)

            from lib.eks_cluster import EksClusterConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            eks = EksClusterConstruct(
                stack,
                "test-eks",
                environment_suffix="test",
                vpc_id="vpc-123",
                private_subnet_ids=["subnet-1", "subnet-2"],
                cluster_version="1.29",
                kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/cluster",
                logs_kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/logs"
            )

            assert eks.logs_kms_key_arn == "arn:aws:kms:us-east-1:123456789012:key/logs"

    def test_eks_cluster_without_separate_logs_key(self):
        """Test EKS cluster without separate logs KMS key."""
        with patch('lib.eks_cluster.CloudwatchLogGroup'), \
             patch('lib.eks_cluster.SecurityGroup') as mock_sg, \
             patch('lib.eks_cluster.SecurityGroupRule'), \
             patch('lib.eks_cluster.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.eks_cluster.IamRole') as mock_role, \
             patch('lib.eks_cluster.IamRolePolicyAttachment'), \
             patch('lib.eks_cluster.EksCluster') as mock_cluster, \
             patch('lib.eks_cluster.IamOpenidConnectProvider') as mock_oidc:

            self._setup_eks_mocks(mock_sg, mock_policy_doc, mock_role, mock_cluster, mock_oidc)

            from lib.eks_cluster import EksClusterConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            eks = EksClusterConstruct(
                stack,
                "test-eks",
                environment_suffix="test",
                vpc_id="vpc-123",
                private_subnet_ids=["subnet-1", "subnet-2"],
                cluster_version="1.29",
                kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/cluster"
            )

            # Should use cluster key for logs
            assert eks.logs_kms_key_arn == "arn:aws:kms:us-east-1:123456789012:key/cluster"

    def test_eks_cluster_properties(self):
        """Test all EKS cluster properties."""
        with patch('lib.eks_cluster.CloudwatchLogGroup'), \
             patch('lib.eks_cluster.SecurityGroup') as mock_sg, \
             patch('lib.eks_cluster.SecurityGroupRule'), \
             patch('lib.eks_cluster.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.eks_cluster.IamRole') as mock_role, \
             patch('lib.eks_cluster.IamRolePolicyAttachment'), \
             patch('lib.eks_cluster.EksCluster') as mock_cluster, \
             patch('lib.eks_cluster.IamOpenidConnectProvider') as mock_oidc:

            self._setup_eks_mocks(mock_sg, mock_policy_doc, mock_role, mock_cluster, mock_oidc)

            from lib.eks_cluster import EksClusterConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            eks = EksClusterConstruct(
                stack,
                "test-eks",
                environment_suffix="test",
                vpc_id="vpc-123",
                private_subnet_ids=["subnet-1", "subnet-2"],
                cluster_version="1.29",
                kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/cluster"
            )

            assert eks.cluster_name == "eks-cluster-test"
            assert eks.endpoint == "https://eks.endpoint.amazonaws.com"
            assert eks.ca_cert == "base64cert"
            assert eks.oidc_provider_arn == "arn:aws:iam::123456789012:oidc-provider/oidc"
            assert eks.oidc_provider_url == "https://oidc.eks.us-east-1.amazonaws.com/id/test"
            assert eks.node_role_arn == "arn:aws:iam::123456789012:role/node"
            assert eks.token is None

    @staticmethod
    def _setup_eks_mocks(mock_sg, mock_policy_doc, mock_role, mock_cluster, mock_oidc):
        """Helper to setup EKS cluster mocks."""
        mock_sg_instance = Mock()
        mock_sg_instance.id = "sg-123"
        mock_sg.return_value = mock_sg_instance

        mock_policy_doc_instance = Mock()
        mock_policy_doc_instance.json = '{"Statement":[]}'
        mock_policy_doc.return_value = mock_policy_doc_instance

        mock_cluster_role = Mock()
        mock_cluster_role.name = "cluster-role"
        mock_cluster_role.arn = "arn:aws:iam::123456789012:role/cluster"

        mock_node_role = Mock()
        mock_node_role.name = "node-role"
        mock_node_role.arn = "arn:aws:iam::123456789012:role/node"

        mock_role.side_effect = [mock_cluster_role, mock_node_role]

        # Mock cluster identity and OIDC
        mock_oidc_config = Mock()
        mock_oidc_config.issuer = "https://oidc.eks.us-east-1.amazonaws.com/id/test"

        mock_identity = Mock()
        mock_identity.get.return_value.oidc.get.return_value = mock_oidc_config

        mock_cert_authority = Mock()
        mock_cert_authority.data = "base64cert"

        mock_cluster_instance = Mock()
        mock_cluster_instance.name = "eks-cluster-test"
        mock_cluster_instance.endpoint = "https://eks.endpoint.amazonaws.com"
        mock_cluster_instance.identity = mock_identity
        mock_cluster_instance.certificate_authority = Mock()
        mock_cluster_instance.certificate_authority.get.return_value = mock_cert_authority
        mock_cluster.return_value = mock_cluster_instance

        mock_oidc_instance = Mock()
        mock_oidc_instance.arn = "arn:aws:iam::123456789012:oidc-provider/oidc"
        mock_oidc.return_value = mock_oidc_instance


class TestEksAddonsConstruct:
    """Test suite for EKS Addons Construct."""

    def test_eks_addons_with_ebs_csi_role(self):
        """Test EKS addons with EBS CSI role."""
        with patch('lib.eks_addons.EksAddon') as mock_addon:
            from lib.eks_addons import EksAddonsConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            addons = EksAddonsConstruct(
                stack,
                "test-addons",
                environment_suffix="test",
                cluster_name="test-cluster",
                ebs_csi_role_arn="arn:aws:iam::123456789012:role/ebs-csi"
            )

            assert addons is not None
            # Should create 4 addons: coredns, kube-proxy, vpc-cni, ebs-csi
            assert mock_addon.call_count == 4

    def test_eks_addons_without_ebs_csi_role(self):
        """Test EKS addons without EBS CSI role."""
        with patch('lib.eks_addons.EksAddon') as mock_addon:
            from lib.eks_addons import EksAddonsConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            addons = EksAddonsConstruct(
                stack,
                "test-addons",
                environment_suffix="test",
                cluster_name="test-cluster",
                ebs_csi_role_arn=None
            )

            assert addons is not None
            # Verify EBS CSI addon created without service_account_role_arn
            ebs_call = mock_addon.call_args_list[-1]
            assert 'service_account_role_arn' not in ebs_call[1]


class TestEksNodeGroupsConstruct:
    """Test suite for EKS Node Groups Construct."""

    def test_node_groups_initialization(self):
        """Test node groups construct creates all node groups."""
        with patch('lib.eks_node_groups.DataAwsSsmParameter') as mock_ssm, \
             patch('lib.eks_node_groups.EksNodeGroup') as mock_ng:

            mock_ssm_instance = Mock()
            mock_ssm_instance.value = "ami-12345"
            mock_ssm.return_value = mock_ssm_instance

            from lib.eks_node_groups import NodeGroupsConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            ng = NodeGroupsConstruct(
                stack,
                "test-ng",
                environment_suffix="test",
                cluster_name="test-cluster",
                subnet_ids=["subnet-1", "subnet-2"],
                node_role_arn="arn:aws:iam::123456789012:role/node"
            )

            assert ng is not None
            # Should create 3 node groups: critical, general, batch
            assert mock_ng.call_count == 3


class TestIrsaRolesConstruct:
    """Test suite for IRSA Roles Construct."""

    def test_irsa_roles_creation(self):
        """Test IRSA roles construct creates all roles."""
        with patch('lib.irsa_roles.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.irsa_roles.IamRole') as mock_role, \
             patch('lib.irsa_roles.IamPolicy') as mock_policy, \
             patch('lib.irsa_roles.IamRolePolicyAttachment'):

            mock_policy_doc_instance = Mock()
            mock_policy_doc_instance.json = '{"Statement":[]}'
            mock_policy_doc.return_value = mock_policy_doc_instance

            mock_role_instance = Mock()
            mock_role_instance.name = "test-role"
            mock_role_instance.arn = "arn:aws:iam::123456789012:role/test"
            mock_role.return_value = mock_role_instance

            mock_policy_instance = Mock()
            mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/test"
            mock_policy.return_value = mock_policy_instance

            from lib.irsa_roles import IrsaRolesConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            irsa = IrsaRolesConstruct(
                stack,
                "test-irsa",
                environment_suffix="test",
                oidc_provider_arn="arn:aws:iam::123456789012:oidc-provider/oidc",
                oidc_provider_url="https://oidc.eks.us-east-1.amazonaws.com/id/test"
            )

            assert irsa.ebs_csi_role_arn == "arn:aws:iam::123456789012:role/test"
            assert irsa.autoscaler_role_arn == "arn:aws:iam::123456789012:role/test"
            assert irsa.alb_controller_role_arn == "arn:aws:iam::123456789012:role/test"
            assert irsa.external_dns_role_arn == "arn:aws:iam::123456789012:role/test"
            # 4 roles: autoscaler, alb, external-dns, ebs-csi
            assert mock_role.call_count == 4

    def test_irsa_oidc_provider_url_parsing(self):
        """Test IRSA roles parse OIDC provider URL correctly."""
        with patch('lib.irsa_roles.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.irsa_roles.IamRole') as mock_role, \
             patch('lib.irsa_roles.IamPolicy') as mock_policy, \
             patch('lib.irsa_roles.IamRolePolicyAttachment'):

            mock_policy_doc_instance = Mock()
            mock_policy_doc_instance.json = '{"Statement":[]}'
            mock_policy_doc.return_value = mock_policy_doc_instance

            mock_role_instance = Mock()
            mock_role_instance.name = "test-role"
            mock_role_instance.arn = "arn:aws:iam::123456789012:role/test"
            mock_role.return_value = mock_role_instance

            mock_policy_instance = Mock()
            mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/test"
            mock_policy.return_value = mock_policy_instance

            from lib.irsa_roles import IrsaRolesConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            irsa = IrsaRolesConstruct(
                stack,
                "test-irsa",
                environment_suffix="test",
                oidc_provider_arn="arn:aws:iam::123456789012:oidc-provider/oidc",
                oidc_provider_url="https://oidc.eks.us-west-2.amazonaws.com/id/ABC123"
            )

            # Verify OIDC provider ID was extracted correctly
            first_policy_doc_call = mock_policy_doc.call_args_list[0]
            condition = first_policy_doc_call[1]['statement'][0]['condition'][0]
            assert 'oidc.eks.us-west-2.amazonaws.com/id/ABC123:sub' in condition['variable']


class TestMonitoringConstruct:
    """Test suite for Monitoring Construct."""

    def test_monitoring_alarms_creation(self):
        """Test monitoring construct creates alarms."""
        with patch('lib.monitoring.CloudwatchMetricAlarm') as mock_alarm:
            from lib.monitoring import MonitoringConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            monitoring = MonitoringConstruct(
                stack,
                "test-monitoring",
                environment_suffix="test",
                cluster_name="test-cluster"
            )

            assert monitoring is not None
            # Should create 2 alarms: CPU and memory
            assert mock_alarm.call_count == 2

    def test_monitoring_cpu_alarm_configuration(self):
        """Test CPU alarm is configured correctly."""
        with patch('lib.monitoring.CloudwatchMetricAlarm') as mock_alarm:
            from lib.monitoring import MonitoringConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            monitoring = MonitoringConstruct(
                stack,
                "test-monitoring",
                environment_suffix="prod",
                cluster_name="prod-cluster"
            )

            # Check first call (CPU alarm)
            cpu_alarm_call = mock_alarm.call_args_list[0]
            assert cpu_alarm_call[1]['metric_name'] == 'node_cpu_utilization'
            assert cpu_alarm_call[1]['threshold'] == 80

    def test_monitoring_memory_alarm_configuration(self):
        """Test memory alarm is configured correctly."""
        with patch('lib.monitoring.CloudwatchMetricAlarm') as mock_alarm:
            from lib.monitoring import MonitoringConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            monitoring = MonitoringConstruct(
                stack,
                "test-monitoring",
                environment_suffix="prod",
                cluster_name="prod-cluster"
            )

            # Check second call (memory alarm)
            memory_alarm_call = mock_alarm.call_args_list[1]
            assert memory_alarm_call[1]['metric_name'] == 'node_memory_utilization'
            assert memory_alarm_call[1]['threshold'] == 80


class TestPodSecurityConstruct:
    """Test suite for Pod Security Construct."""

    def test_pod_security_initialization(self):
        """Test pod security construct initialization."""
        from lib.pod_security import PodSecurityConstruct
        from cdktf import TerraformStack
        app = App()
        stack = TerraformStack(app, "TestStack")

        pod_security = PodSecurityConstruct(
            stack,
            "test-pod-security",
            environment_suffix="test"
        )

        assert pod_security is not None
        assert pod_security.tenant_config['policy'] == 'restricted'
        assert pod_security.system_config['policy'] == 'baseline'

    def test_pod_security_tenant_configuration(self):
        """Test pod security tenant configuration."""
        from lib.pod_security import PodSecurityConstruct
        from cdktf import TerraformStack
        app = App()
        stack = TerraformStack(app, "TestStack")

        pod_security = PodSecurityConstruct(
            stack,
            "test-pod-security",
            environment_suffix="prod"
        )

        assert "tenant-a" in pod_security.tenant_config['tenants']
        assert "tenant-b" in pod_security.tenant_config['tenants']
        assert "tenant-c" in pod_security.tenant_config['tenants']
        assert pod_security.tenant_config['environment_suffix'] == 'prod'

    def test_pod_security_system_configuration(self):
        """Test pod security system configuration."""
        from lib.pod_security import PodSecurityConstruct
        from cdktf import TerraformStack
        app = App()
        stack = TerraformStack(app, "TestStack")

        pod_security = PodSecurityConstruct(
            stack,
            "test-pod-security",
            environment_suffix="dev"
        )

        assert "monitoring" in pod_security.system_config['namespaces']
        assert "logging" in pod_security.system_config['namespaces']
        assert pod_security.system_config['environment_suffix'] == 'dev'


class TestSecretsManagerConstruct:
    """Test suite for Secrets Manager Construct."""

    def test_secrets_manager_creates_tenant_secrets(self):
        """Test secrets manager creates secrets for all tenants."""
        with patch('lib.secrets_manager.SecretsmanagerSecret') as mock_secret, \
             patch('lib.secrets_manager.SecretsmanagerSecretVersion'), \
             patch('lib.secrets_manager.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.secrets_manager.IamRole') as mock_role, \
             patch('lib.secrets_manager.IamPolicy') as mock_policy, \
             patch('lib.secrets_manager.IamRolePolicyAttachment'):

            mock_secret_instance = Mock()
            mock_secret_instance.id = "secret-123"
            mock_secret_instance.arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:test"
            mock_secret.return_value = mock_secret_instance

            mock_policy_doc_instance = Mock()
            mock_policy_doc_instance.json = '{"Statement":[]}'
            mock_policy_doc.return_value = mock_policy_doc_instance

            mock_role_instance = Mock()
            mock_role_instance.name = "test-role"
            mock_role_instance.arn = "arn:aws:iam::123456789012:role/test"
            mock_role.return_value = mock_role_instance

            mock_policy_instance = Mock()
            mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/test"
            mock_policy.return_value = mock_policy_instance

            from lib.secrets_manager import SecretsManagerConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            secrets = SecretsManagerConstruct(
                stack,
                "test-secrets",
                environment_suffix="test",
                oidc_provider_arn="arn:aws:iam::123456789012:oidc-provider/oidc",
                oidc_provider_url="https://oidc.eks.us-east-1.amazonaws.com/id/test",
                kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
            )

            assert secrets.external_secrets_role_arn == "arn:aws:iam::123456789012:role/test"
            # Should create 3 secrets: tenant-a, tenant-b, tenant-c
            assert mock_secret.call_count == 3

    def test_secrets_manager_oidc_provider_parsing(self):
        """Test secrets manager parses OIDC provider URL."""
        with patch('lib.secrets_manager.SecretsmanagerSecret') as mock_secret, \
             patch('lib.secrets_manager.SecretsmanagerSecretVersion'), \
             patch('lib.secrets_manager.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.secrets_manager.IamRole') as mock_role, \
             patch('lib.secrets_manager.IamPolicy') as mock_policy, \
             patch('lib.secrets_manager.IamRolePolicyAttachment'):

            mock_secret_instance = Mock()
            mock_secret_instance.id = "secret-123"
            mock_secret_instance.arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:test"
            mock_secret.return_value = mock_secret_instance

            mock_policy_doc_instance = Mock()
            mock_policy_doc_instance.json = '{"Statement":[]}'
            mock_policy_doc.return_value = mock_policy_doc_instance

            mock_role_instance = Mock()
            mock_role_instance.name = "test-role"
            mock_role_instance.arn = "arn:aws:iam::123456789012:role/test"
            mock_role.return_value = mock_role_instance

            mock_policy_instance = Mock()
            mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/test"
            mock_policy.return_value = mock_policy_instance

            from lib.secrets_manager import SecretsManagerConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            secrets = SecretsManagerConstruct(
                stack,
                "test-secrets",
                environment_suffix="test",
                oidc_provider_arn="arn:aws:iam::123456789012:oidc-provider/oidc",
                oidc_provider_url="https://oidc.eks.eu-west-1.amazonaws.com/id/XYZ789",
                kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
            )

            # Verify OIDC provider ID was extracted correctly
            policy_doc_call = mock_policy_doc.call_args_list[0]
            condition = policy_doc_call[1]['statement'][0]['condition'][0]
            assert 'oidc.eks.eu-west-1.amazonaws.com/id/XYZ789:sub' in condition['variable']

    def test_secrets_manager_tenant_secrets_content(self):
        """Test secrets manager creates correct secret structure for tenants."""
        with patch('lib.secrets_manager.SecretsmanagerSecret') as mock_secret, \
             patch('lib.secrets_manager.SecretsmanagerSecretVersion') as mock_version, \
             patch('lib.secrets_manager.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.secrets_manager.IamRole') as mock_role, \
             patch('lib.secrets_manager.IamPolicy') as mock_policy, \
             patch('lib.secrets_manager.IamRolePolicyAttachment'):

            mock_secret_instance = Mock()
            mock_secret_instance.id = "secret-123"
            mock_secret_instance.arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:test"
            mock_secret.return_value = mock_secret_instance

            mock_policy_doc_instance = Mock()
            mock_policy_doc_instance.json = '{"Statement":[]}'
            mock_policy_doc.return_value = mock_policy_doc_instance

            mock_role_instance = Mock()
            mock_role_instance.name = "test-role"
            mock_role_instance.arn = "arn:aws:iam::123456789012:role/test"
            mock_role.return_value = mock_role_instance

            mock_policy_instance = Mock()
            mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/test"
            mock_policy.return_value = mock_policy_instance

            from lib.secrets_manager import SecretsManagerConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            secrets = SecretsManagerConstruct(
                stack,
                "test-secrets",
                environment_suffix="test",
                oidc_provider_arn="arn:aws:iam::123456789012:oidc-provider/oidc",
                oidc_provider_url="https://oidc.eks.us-east-1.amazonaws.com/id/test",
                kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
            )

            # Verify secret versions created for all tenants
            assert mock_version.call_count == 3
            # Verify secret content structure
            for call in mock_version.call_args_list:
                secret_string = call[1]['secret_string']
                secret_data = json.loads(secret_string)
                assert 'database_url' in secret_data
                assert 'api_key' in secret_data
                assert 'tenant' in secret_data


# Additional integration-style tests
class TestConstructInteractions:
    """Test suite for construct interactions."""

    def test_vpc_provides_required_outputs_for_eks(self):
        """Test VPC provides outputs needed by EKS."""
        with patch('lib.vpc_stack.Vpc') as mock_vpc, \
             patch('lib.vpc_stack.InternetGateway'), \
             patch('lib.vpc_stack.Subnet') as mock_subnet, \
             patch('lib.vpc_stack.Eip'), \
             patch('lib.vpc_stack.NatGateway'), \
             patch('lib.vpc_stack.RouteTable'), \
             patch('lib.vpc_stack.RouteTableAssociation'), \
             patch('lib.vpc_stack.SecurityGroup') as mock_sg, \
             patch('lib.vpc_stack.SecurityGroupRule'), \
             patch('lib.vpc_stack.VpcEndpoint'):

            mock_vpc_instance = Mock()
            mock_vpc_instance.id = "vpc-test123"
            mock_vpc.return_value = mock_vpc_instance

            mock_subnet_instance = Mock()
            mock_subnet_instance.id = Mock()
            mock_subnet_instance.id = "subnet-test123"
            mock_subnet.return_value = mock_subnet_instance

            mock_sg_instance = Mock()
            mock_sg_instance.id = "sg-test123"
            mock_sg.return_value = mock_sg_instance

            from lib.vpc_stack import VpcConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            vpc = VpcConstruct(
                stack,
                "test-vpc",
                environment_suffix="test",
                cidr_block="10.0.0.0/16",
                availability_zones=["us-east-1a", "us-east-1b", "us-east-1c"],
                region="us-east-1"
            )

            # Verify VPC provides vpc_id
            assert vpc.vpc_id is not None
            assert isinstance(vpc.vpc_id, str)

            # Verify VPC provides private_subnet_ids
            assert vpc.private_subnet_ids is not None
            assert isinstance(vpc.private_subnet_ids, list)
            assert len(vpc.private_subnet_ids) == 3

    def test_kms_provides_required_outputs_for_eks(self):
        """Test KMS provides outputs needed by EKS."""
        with patch('lib.kms_encryption.DataAwsCallerIdentity') as mock_caller, \
             patch('lib.kms_encryption.KmsKey') as mock_key, \
             patch('lib.kms_encryption.KmsAlias'):

            mock_caller_instance = Mock()
            mock_caller_instance.account_id = "123456789012"
            mock_caller.return_value = mock_caller_instance

            mock_key_instance = Mock()
            mock_key_instance.id = "key-test123"
            mock_key_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/test123"
            mock_key.return_value = mock_key_instance

            from lib.kms_encryption import KmsEncryptionConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            kms = KmsEncryptionConstruct(
                stack,
                "test-kms",
                environment_suffix="test",
                region="us-east-1"
            )

            # Verify KMS provides cluster_key_arn
            assert kms.cluster_key_arn is not None
            assert isinstance(kms.cluster_key_arn, str)
            assert kms.cluster_key_arn.startswith("arn:aws:kms:")

            # Verify KMS provides logs_key_arn
            assert kms.logs_key_arn is not None
            assert isinstance(kms.logs_key_arn, str)
            assert kms.logs_key_arn.startswith("arn:aws:kms:")

    def test_eks_provides_required_outputs_for_node_groups(self):
        """Test EKS provides outputs needed by node groups."""
        with patch('lib.eks_cluster.CloudwatchLogGroup'), \
             patch('lib.eks_cluster.SecurityGroup') as mock_sg, \
             patch('lib.eks_cluster.SecurityGroupRule'), \
             patch('lib.eks_cluster.DataAwsIamPolicyDocument') as mock_policy_doc, \
             patch('lib.eks_cluster.IamRole') as mock_role, \
             patch('lib.eks_cluster.IamRolePolicyAttachment'), \
             patch('lib.eks_cluster.EksCluster') as mock_cluster, \
             patch('lib.eks_cluster.IamOpenidConnectProvider') as mock_oidc:

            mock_sg_instance = Mock()
            mock_sg_instance.id = "sg-123"
            mock_sg.return_value = mock_sg_instance

            mock_policy_doc_instance = Mock()
            mock_policy_doc_instance.json = '{"Statement":[]}'
            mock_policy_doc.return_value = mock_policy_doc_instance

            mock_cluster_role = Mock()
            mock_cluster_role.name = "cluster-role"
            mock_cluster_role.arn = "arn:aws:iam::123456789012:role/cluster"

            mock_node_role = Mock()
            mock_node_role.name = "node-role-test"
            mock_node_role.arn = "arn:aws:iam::123456789012:role/node-test"

            mock_role.side_effect = [mock_cluster_role, mock_node_role]

            mock_oidc_config = Mock()
            mock_oidc_config.issuer = "https://oidc.eks.us-east-1.amazonaws.com/id/test"

            mock_identity = Mock()
            mock_identity.get.return_value.oidc.get.return_value = mock_oidc_config

            mock_cert_authority = Mock()
            mock_cert_authority.data = "base64cert"

            mock_cluster_instance = Mock()
            mock_cluster_instance.name = "eks-cluster-test"
            mock_cluster_instance.endpoint = "https://eks.endpoint.amazonaws.com"
            mock_cluster_instance.identity = mock_identity
            mock_cluster_instance.certificate_authority = Mock()
            mock_cluster_instance.certificate_authority.get.return_value = mock_cert_authority
            mock_cluster.return_value = mock_cluster_instance

            mock_oidc_instance = Mock()
            mock_oidc_instance.arn = "arn:aws:iam::123456789012:oidc-provider/oidc"
            mock_oidc.return_value = mock_oidc_instance

            from lib.eks_cluster import EksClusterConstruct
            from cdktf import TerraformStack
            app = App()
            stack = TerraformStack(app, "TestStack")

            eks = EksClusterConstruct(
                stack,
                "test-eks",
                environment_suffix="test",
                vpc_id="vpc-123",
                private_subnet_ids=["subnet-1", "subnet-2"],
                cluster_version="1.29",
                kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/cluster"
            )

            # Verify EKS provides cluster_name
            assert eks.cluster_name is not None
            assert isinstance(eks.cluster_name, str)

            # Verify EKS provides node_role_arn
            assert eks.node_role_arn is not None
            assert isinstance(eks.node_role_arn, str)
            assert eks.node_role_arn.startswith("arn:aws:iam:")
