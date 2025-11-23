"""Unit tests for TAP Stack - EKS Cluster Infrastructure."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


class TestStackStructure:  # pylint: disable=too-many-public-methods
    """Test suite for Stack Structure."""

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully with environment_suffix."""
        app = App()
        stack = TapStack(app, "TestTapStack", environment_suffix="test")

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_stack_uses_local_backend(self):
        """Test that stack uses LocalBackend for state management."""
        app = App()
        stack = TapStack(app, "TestBackend", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Verify LocalBackend is configured
        assert "terraform" in synthesized
        config = json.loads(synthesized)
        assert "terraform" in config
        assert "backend" in config["terraform"]
        assert "local" in config["terraform"]["backend"]

    def test_stack_has_aws_provider(self):
        """Test that stack has AWS provider configured."""
        app = App()
        stack = TapStack(app, "TestProvider", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "provider" in config
        assert "aws" in config["provider"]
        assert config["provider"]["aws"][0]["region"] == "us-east-1"

    def test_eks_cluster_created(self):
        """Test that EKS cluster resource is created."""
        app = App()
        stack = TapStack(app, "TestEKSCluster", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "resource" in config
        assert "aws_eks_cluster" in config["resource"]

    def test_eks_cluster_name_includes_environment_suffix(self):
        """Test that EKS cluster name includes environment suffix."""
        app = App()
        env_suffix = "unittest123"
        stack = TapStack(app, "TestClusterName", environment_suffix=env_suffix)
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        cluster = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        assert f"eks-cluster-{env_suffix}" == cluster["name"]

    def test_eks_cluster_version(self):
        """Test that EKS cluster uses correct Kubernetes version."""
        app = App()
        stack = TapStack(app, "TestClusterVersion", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        cluster = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        assert cluster["version"] == "1.28"

    def test_eks_cluster_logging_enabled(self):
        """Test that all control plane logging types are enabled."""
        app = App()
        stack = TapStack(app, "TestLogging", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        cluster = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        expected_logs = ["api", "audit", "authenticator",
                         "controllerManager", "scheduler"]
        assert set(cluster["enabled_cluster_log_types"]) == set(expected_logs)

    def test_cloudwatch_log_group_created(self):
        """Test that CloudWatch log group is created."""
        app = App()
        stack = TapStack(app, "TestLogGroup", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "aws_cloudwatch_log_group" in config["resource"]

    def test_cloudwatch_log_group_retention(self):
        """Test that CloudWatch log group has 30-day retention."""
        app = App()
        stack = TapStack(app, "TestRetention", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        log_group = config["resource"]["aws_cloudwatch_log_group"]["eks_log_group"]
        assert log_group["retention_in_days"] == 30

    def test_cloudwatch_log_group_name_includes_suffix(self):
        """Test that CloudWatch log group name includes environment suffix."""
        app = App()
        env_suffix = "unittest456"
        stack = TapStack(app, "TestLogGroupName", environment_suffix=env_suffix)
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        log_group = config["resource"]["aws_cloudwatch_log_group"]["eks_log_group"]
        assert f"/aws/eks/eks-cluster-{env_suffix}" == log_group["name"]

    def test_iam_roles_created(self):
        """Test that IAM roles are created for cluster and nodes."""
        app = App()
        stack = TapStack(app, "TestIAMRoles", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "aws_iam_role" in config["resource"]
        roles = config["resource"]["aws_iam_role"]
        assert "eks_cluster_role" in roles
        assert "eks_node_role" in roles

    def test_cluster_role_name_includes_suffix(self):
        """Test that cluster role name includes environment suffix."""
        app = App()
        env_suffix = "unittest789"
        stack = TapStack(app, "TestClusterRoleName", environment_suffix=env_suffix)
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        cluster_role = config["resource"]["aws_iam_role"]["eks_cluster_role"]
        assert f"eks-cluster-role-{env_suffix}" == cluster_role["name"]

    def test_node_role_name_includes_suffix(self):
        """Test that node role name includes environment suffix."""
        app = App()
        env_suffix = "unittest999"
        stack = TapStack(app, "TestNodeRoleName", environment_suffix=env_suffix)
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        node_role = config["resource"]["aws_iam_role"]["eks_node_role"]
        assert f"eks-node-role-{env_suffix}" == node_role["name"]

    def test_cluster_iam_policies_attached(self):
        """Test that required IAM policies are attached to cluster role."""
        app = App()
        stack = TapStack(app, "TestClusterPolicies", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        policy_attachments = config["resource"]["aws_iam_role_policy_attachment"]

        # Check for required policies
        assert "eks_cluster_policy" in policy_attachments
        assert "eks_vpc_resource_controller" in policy_attachments

        cluster_policy = policy_attachments["eks_cluster_policy"]
        assert (cluster_policy["policy_arn"] ==
                "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy")

        vpc_controller = policy_attachments["eks_vpc_resource_controller"]
        assert (vpc_controller["policy_arn"] ==
                "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController")

    def test_node_iam_policies_attached(self):
        """Test that required IAM policies are attached to node role."""
        app = App()
        stack = TapStack(app, "TestNodePolicies", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        policy_attachments = config["resource"]["aws_iam_role_policy_attachment"]

        # Check for required node policies
        assert "eks_worker_node_policy" in policy_attachments
        assert "eks_cni_policy" in policy_attachments
        assert "eks_container_registry_policy" in policy_attachments

        worker_policy = policy_attachments["eks_worker_node_policy"]
        assert (worker_policy["policy_arn"] ==
                "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy")

        cni_policy = policy_attachments["eks_cni_policy"]
        assert (cni_policy["policy_arn"] ==
                "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy")

        registry_policy = policy_attachments["eks_container_registry_policy"]
        assert (registry_policy["policy_arn"] ==
                "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly")

    def test_on_demand_node_group_created(self):
        """Test that On-Demand node group is created."""
        app = App()
        stack = TapStack(app, "TestODNodeGroup", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "aws_eks_node_group" in config["resource"]
        assert "on_demand_node_group" in config["resource"]["aws_eks_node_group"]

    def test_on_demand_node_group_configuration(self):
        """Test On-Demand node group scaling configuration."""
        app = App()
        stack = TapStack(app, "TestODConfig", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        od_group = config["resource"]["aws_eks_node_group"]["on_demand_node_group"]

        assert od_group["capacity_type"] == "ON_DEMAND"
        assert od_group["instance_types"] == ["t3.medium"]
        assert od_group["scaling_config"]["min_size"] == 2
        assert od_group["scaling_config"]["max_size"] == 5
        assert od_group["scaling_config"]["desired_size"] == 2

    def test_on_demand_node_group_name_includes_suffix(self):
        """Test that On-Demand node group name includes environment suffix."""
        app = App()
        env_suffix = "odtest123"
        stack = TapStack(app, "TestODName", environment_suffix=env_suffix)
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        od_group = config["resource"]["aws_eks_node_group"]["on_demand_node_group"]
        assert f"node-group-od-{env_suffix}" == od_group["node_group_name"]

    def test_spot_node_group_created(self):
        """Test that Spot node group is created."""
        app = App()
        stack = TapStack(app, "TestSpotNodeGroup", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "spot_node_group" in config["resource"]["aws_eks_node_group"]

    def test_spot_node_group_configuration(self):
        """Test Spot node group scaling configuration."""
        app = App()
        stack = TapStack(app, "TestSpotConfig", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        spot_group = config["resource"]["aws_eks_node_group"]["spot_node_group"]

        assert spot_group["capacity_type"] == "SPOT"
        assert spot_group["instance_types"] == ["t3.medium"]
        assert spot_group["scaling_config"]["min_size"] == 3
        assert spot_group["scaling_config"]["max_size"] == 10
        assert spot_group["scaling_config"]["desired_size"] == 3

    def test_spot_node_group_name_includes_suffix(self):
        """Test that Spot node group name includes environment suffix."""
        app = App()
        env_suffix = "spottest456"
        stack = TapStack(app, "TestSpotName", environment_suffix=env_suffix)
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        spot_group = config["resource"]["aws_eks_node_group"]["spot_node_group"]
        assert f"node-group-spot-{env_suffix}" == spot_group["node_group_name"]

    def test_vpc_cni_addon_created(self):
        """Test that VPC CNI addon is created."""
        app = App()
        stack = TapStack(app, "TestVPCCNI", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "aws_eks_addon" in config["resource"]
        assert "vpc_cni_addon" in config["resource"]["aws_eks_addon"]

    def test_vpc_cni_addon_configuration(self):
        """Test VPC CNI addon prefix delegation configuration."""
        app = App()
        stack = TapStack(app, "TestCNIConfig", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        cni_addon = config["resource"]["aws_eks_addon"]["vpc_cni_addon"]

        assert cni_addon["addon_name"] == "vpc-cni"
        assert cni_addon["addon_version"] == "v1.15.1-eksbuild.1"

        # Parse configuration values
        cni_config = json.loads(cni_addon["configuration_values"])
        assert cni_config["env"]["ENABLE_PREFIX_DELEGATION"] == "true"
        assert cni_config["env"]["WARM_PREFIX_TARGET"] == "1"

    def test_oidc_provider_created(self):
        """Test that OIDC provider is created."""
        app = App()
        stack = TapStack(app, "TestOIDC", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "aws_iam_openid_connect_provider" in config["resource"]
        assert "eks_oidc_provider" in config["resource"][
            "aws_iam_openid_connect_provider"]

    def test_oidc_provider_configuration(self):
        """Test OIDC provider client ID and thumbprint."""
        app = App()
        stack = TapStack(app, "TestOIDCConfig", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        oidc = config["resource"]["aws_iam_openid_connect_provider"][
            "eks_oidc_provider"]

        assert oidc["client_id_list"] == ["sts.amazonaws.com"]
        # AWS EKS standard thumbprint
        assert oidc["thumbprint_list"] == [
            "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]

    def test_common_tags_applied(self):
        """Test that common tags are applied to all resources."""
        app = App()
        stack = TapStack(app, "TestTags", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)

        # Check cluster tags
        cluster = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        assert cluster["tags"]["Environment"] == "Production"
        assert cluster["tags"]["ManagedBy"] == "CDKTF"

        # Check log group tags
        log_group = config["resource"]["aws_cloudwatch_log_group"]["eks_log_group"]
        assert log_group["tags"]["Environment"] == "Production"
        assert log_group["tags"]["ManagedBy"] == "CDKTF"

    def test_outputs_defined(self):
        """Test that all required outputs are defined."""
        app = App()
        stack = TapStack(app, "TestOutputs", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        assert "output" in config

        expected_outputs = [
            "cluster_endpoint",
            "cluster_name",
            "oidc_provider_arn",
            "oidc_issuer_url",
            "kubectl_config_command",
            "on_demand_node_group_name",
            "spot_node_group_name"
        ]

        for output_name in expected_outputs:
            assert output_name in config["output"]

    def test_vpc_config_private_and_public_access(self):
        """Test that EKS cluster has both private and public endpoint access."""
        app = App()
        stack = TapStack(app, "TestVPCConfig", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)
        cluster = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        vpc_config = cluster["vpc_config"]

        assert vpc_config["endpoint_private_access"] is True
        assert vpc_config["endpoint_public_access"] is True

    def test_depends_on_relationships(self):
        """Test that proper dependency relationships are established."""
        app = App()
        stack = TapStack(app, "TestDependencies", environment_suffix="test")
        synthesized = Testing.synth(stack)

        config = json.loads(synthesized)

        # EKS cluster depends on log group
        cluster = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        assert "depends_on" in cluster

        # Node groups depend on cluster
        od_group = config["resource"]["aws_eks_node_group"]["on_demand_node_group"]
        assert "depends_on" in od_group

        spot_group = config["resource"]["aws_eks_node_group"]["spot_node_group"]
        assert "depends_on" in spot_group

        # VPC CNI addon depends on node groups
        cni_addon = config["resource"]["aws_eks_addon"]["vpc_cni_addon"]
        assert "depends_on" in cni_addon
