"""Unit tests for EKS Cluster construct."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, TerraformStack, Testing
from lib.eks_cluster import EksCluster


class TestEksCluster:
    """Test suite for EKS Cluster construct."""

    def test_eks_cluster_creates_cluster_resource(self):
        """EksCluster creates EKS cluster resource."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_eks_cluster" in resources

    def test_eks_cluster_creates_cloudwatch_log_group(self):
        """EksCluster creates CloudWatch log group."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_cloudwatch_log_group" in resources

    def test_eks_cluster_log_group_retention(self):
        """EksCluster log group has 7 day retention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        log_groups = output_json.get("resource", {}).get("aws_cloudwatch_log_group", {})
        for lg_config in log_groups.values():
            assert lg_config.get("retention_in_days") == 7

    def test_eks_cluster_naming_convention(self):
        """EksCluster follows naming convention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "prod123"
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix=environment_suffix,
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            cluster_name = cluster_config.get("name", "")
            assert f"eks-cluster-{environment_suffix}" == cluster_name

    def test_eks_cluster_version(self):
        """EksCluster uses correct Kubernetes version."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            assert cluster_config.get("version") == "1.29"

    def test_eks_cluster_vpc_config_private_access(self):
        """EksCluster enables private endpoint access."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            vpc_config = cluster_config.get("vpc_config", {})
            assert vpc_config.get("endpoint_private_access") is True

    def test_eks_cluster_vpc_config_public_access(self):
        """EksCluster disables public endpoint access."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            vpc_config = cluster_config.get("vpc_config", {})
            assert vpc_config.get("endpoint_public_access") is False

    def test_eks_cluster_encryption_config(self):
        """EksCluster configures secrets encryption."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        kms_arn = "arn:aws:kms:us-east-1:123456789012:key/test-key-id"
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn=kms_arn
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            encryption_config = cluster_config.get("encryption_config", {})
            assert encryption_config.get("resources") == ["secrets"]
            assert encryption_config.get("provider", {}).get("key_arn") == kms_arn

    def test_eks_cluster_enabled_log_types(self):
        """EksCluster enables required log types."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            log_types = cluster_config.get("enabled_cluster_log_types", [])
            assert "api" in log_types
            assert "authenticator" in log_types

    def test_eks_cluster_uses_provided_subnet_ids(self):
        """EksCluster uses provided subnet IDs."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        test_subnets = ["subnet-1", "subnet-2", "subnet-3"]
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=test_subnets,
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            vpc_config = cluster_config.get("vpc_config", {})
            assert vpc_config.get("subnet_ids") == test_subnets

    def test_eks_cluster_exposes_cluster_name(self):
        """EksCluster exposes cluster_name property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        assert hasattr(cluster, "cluster_name")
        assert cluster.cluster_name is not None

    def test_eks_cluster_exposes_cluster_endpoint(self):
        """EksCluster exposes cluster_endpoint property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        assert hasattr(cluster, "cluster_endpoint")
        assert cluster.cluster_endpoint is not None

    def test_eks_cluster_exposes_oidc_issuer_url(self):
        """EksCluster exposes cluster_oidc_issuer_url property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        assert hasattr(cluster, "cluster_oidc_issuer_url")
        assert cluster.cluster_oidc_issuer_url is not None

    def test_eks_cluster_exposes_cluster_id(self):
        """EksCluster exposes cluster_id property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix="test",
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        assert hasattr(cluster, "cluster_id")
        assert cluster.cluster_id is not None

    def test_eks_cluster_tags_include_environment(self):
        """EksCluster tags include environment suffix."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "staging"
        cluster = EksCluster(
            stack, "test_cluster",
            environment_suffix=environment_suffix,
            cluster_role_arn="arn:aws:iam::123456789012:role/test-role",
            security_group_ids=["sg-12345"],
            subnet_ids=["subnet-1", "subnet-2"],
            encryption_key_arn="arn:aws:kms:us-east-1:123456789012:key/test"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        clusters = output_json.get("resource", {}).get("aws_eks_cluster", {})
        for cluster_config in clusters.values():
            tags = cluster_config.get("tags", {})
            assert tags.get("Environment") == environment_suffix
            assert tags.get("ManagedBy") == "CDKTF"
