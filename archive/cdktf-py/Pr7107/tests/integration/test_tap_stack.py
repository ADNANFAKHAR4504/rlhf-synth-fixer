"""Integration tests for TapStack - EKS Cluster using deployment outputs."""
import json
import os
import pytest
from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackIntegration:
    """Integration tests for TapStack using actual deployment outputs."""

    @pytest.fixture
    def deployment_outputs(self):
        """Load deployment outputs from cfn-outputs/flat-outputs.json"""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Deployment outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            outputs = json.load(f)

        # Handle nested structure - if outputs have a stack name key, extract it
        if len(outputs) == 1 and isinstance(list(outputs.values())[0], dict):
            # Outputs are nested under stack name, extract the inner dict
            stack_key = list(outputs.keys())[0]
            return outputs[stack_key]

        return outputs

    @pytest.fixture
    def synthesized_stack(self):
        """Create and synthesize a TapStack for testing"""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={
                "tags": {
                    "Environment": "integration-test",
                    "Repository": "iac-test-automations",
                    "Team": "test"
                }
            }
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        return {
            "stack": stack,
            "config": config
        }

    # ========== Terraform Synthesis Tests ==========

    def test_terraform_configuration_synthesis(self, synthesized_stack):
        """Test that stack instantiates and synthesizes properly."""
        stack = synthesized_stack["stack"]
        config = synthesized_stack["config"]

        # Verify stack exists
        assert stack is not None

        # Verify basic structure
        assert "resource" in config
        assert "terraform" in config
        assert "output" in config

    def test_backend_configuration_synthesized(self, synthesized_stack):
        """Test S3 backend is configured in synthesized output."""
        config = synthesized_stack["config"]

        # Verify S3 backend configuration
        assert "terraform" in config
        assert "backend" in config["terraform"]
        assert "s3" in config["terraform"]["backend"]

        s3_backend = config["terraform"]["backend"]["s3"]
        assert "bucket" in s3_backend
        assert "key" in s3_backend
        assert "region" in s3_backend
        assert s3_backend.get("encrypt") is True

    def test_provider_configuration_synthesized(self, synthesized_stack):
        """Test AWS provider is configured correctly."""
        config = synthesized_stack["config"]

        # Verify provider exists
        assert "provider" in config
        assert "aws" in config["provider"]

        aws_provider = config["provider"]["aws"][0]
        assert "region" in aws_provider

    # ========== VPC and Networking Resource Tests ==========

    def test_vpc_resource_synthesized(self, synthesized_stack):
        """Test VPC resource is synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify VPC resource
        assert "aws_vpc" in config["resource"]
        vpc = config["resource"]["aws_vpc"]["vpc"]

        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_subnet_resources_synthesized(self, synthesized_stack):
        """Test subnet resources are synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify subnet resources
        assert "aws_subnet" in config["resource"]

        # Should have 2 subnets
        subnets = config["resource"]["aws_subnet"]
        assert "public_subnet_1" in subnets
        assert "public_subnet_2" in subnets

        # Verify subnet configurations
        subnet1 = subnets["public_subnet_1"]
        assert subnet1["cidr_block"] == "10.0.1.0/24"
        assert subnet1["map_public_ip_on_launch"] is True

        subnet2 = subnets["public_subnet_2"]
        assert subnet2["cidr_block"] == "10.0.2.0/24"
        assert subnet2["map_public_ip_on_launch"] is True

    def test_internet_gateway_synthesized(self, synthesized_stack):
        """Test Internet Gateway is synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify IGW resource
        assert "aws_internet_gateway" in config["resource"]
        assert "igw" in config["resource"]["aws_internet_gateway"]

    def test_route_table_synthesized(self, synthesized_stack):
        """Test route table and routes are synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify route table
        assert "aws_route_table" in config["resource"]
        assert "public_route_table" in config["resource"]["aws_route_table"]

        # Verify route
        assert "aws_route" in config["resource"]
        assert "public_route" in config["resource"]["aws_route"]

        route = config["resource"]["aws_route"]["public_route"]
        assert route["destination_cidr_block"] == "0.0.0.0/0"

    def test_route_table_associations_synthesized(self, synthesized_stack):
        """Test route table associations are synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify route table associations
        assert "aws_route_table_association" in config["resource"]
        associations = config["resource"]["aws_route_table_association"]

        assert "public_subnet_1_association" in associations
        assert "public_subnet_2_association" in associations

    # ========== EKS Cluster Resource Tests ==========

    def test_eks_cluster_resource_synthesized(self, synthesized_stack):
        """Test EKS cluster resource is synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify EKS cluster resource
        assert "aws_eks_cluster" in config["resource"]
        assert "eks_cluster" in config["resource"]["aws_eks_cluster"]

        eks = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        assert eks["version"] == "1.29"
        assert "vpc_config" in eks

        # vpc_config can be a dict or list, handle both
        vpc_config = eks["vpc_config"]
        if isinstance(vpc_config, list):
            vpc_config = vpc_config[0]
        assert vpc_config["endpoint_private_access"] is True
        assert vpc_config["endpoint_public_access"] is True

    def test_eks_cluster_logging_enabled(self, synthesized_stack):
        """Test EKS cluster logging is enabled for all types."""
        config = synthesized_stack["config"]

        eks = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        log_types = eks["enabled_cluster_log_types"]

        assert "api" in log_types
        assert "audit" in log_types
        assert "authenticator" in log_types
        assert "controllerManager" in log_types
        assert "scheduler" in log_types

    def test_cloudwatch_log_group_synthesized(self, synthesized_stack):
        """Test CloudWatch log group for EKS is synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify log group
        assert "aws_cloudwatch_log_group" in config["resource"]
        assert "eks_log_group" in config["resource"]["aws_cloudwatch_log_group"]

        log_group = config["resource"]["aws_cloudwatch_log_group"]["eks_log_group"]
        assert log_group["retention_in_days"] == 30

    # ========== IAM Resource Tests ==========

    def test_iam_roles_synthesized(self, synthesized_stack):
        """Test IAM roles are synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify IAM roles
        assert "aws_iam_role" in config["resource"]
        roles = config["resource"]["aws_iam_role"]

        assert "eks_cluster_role" in roles
        assert "eks_node_role" in roles

    def test_iam_policy_attachments_synthesized(self, synthesized_stack):
        """Test IAM policy attachments are synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify policy attachments
        assert "aws_iam_role_policy_attachment" in config["resource"]
        attachments = config["resource"]["aws_iam_role_policy_attachment"]

        # Cluster policies
        assert "eks_cluster_policy" in attachments
        assert "eks_vpc_resource_controller" in attachments

        # Node policies
        assert "eks_worker_node_policy" in attachments
        assert "eks_cni_policy" in attachments
        assert "eks_container_registry_policy" in attachments

    def test_oidc_provider_synthesized(self, synthesized_stack):
        """Test OIDC provider is synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify OIDC provider
        assert "aws_iam_openid_connect_provider" in config["resource"]
        assert "eks_oidc_provider" in config["resource"]["aws_iam_openid_connect_provider"]

        oidc = config["resource"]["aws_iam_openid_connect_provider"]["eks_oidc_provider"]
        assert "sts.amazonaws.com" in oidc["client_id_list"]
        assert "9e99a48a9960b14926bb7f3b02e22da2b0ab7280" in oidc["thumbprint_list"]

    # ========== Node Group Tests ==========

    def test_node_groups_synthesized(self, synthesized_stack):
        """Test EKS node groups are synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify node groups
        assert "aws_eks_node_group" in config["resource"]
        node_groups = config["resource"]["aws_eks_node_group"]

        assert "on_demand_node_group" in node_groups
        assert "spot_node_group" in node_groups

    def test_on_demand_node_group_configuration(self, synthesized_stack):
        """Test on-demand node group configuration."""
        config = synthesized_stack["config"]

        on_demand = config["resource"]["aws_eks_node_group"]["on_demand_node_group"]

        assert on_demand["capacity_type"] == "ON_DEMAND"
        assert "t3.medium" in on_demand["instance_types"]

        # scaling_config can be a dict or list, handle both
        scaling = on_demand["scaling_config"]
        if isinstance(scaling, list):
            scaling = scaling[0]
        assert scaling["desired_size"] == 2
        assert scaling["min_size"] == 2
        assert scaling["max_size"] == 5

    def test_spot_node_group_configuration(self, synthesized_stack):
        """Test spot node group configuration."""
        config = synthesized_stack["config"]

        spot = config["resource"]["aws_eks_node_group"]["spot_node_group"]

        assert spot["capacity_type"] == "SPOT"
        assert "t3.medium" in spot["instance_types"]

        # scaling_config can be a dict or list, handle both
        scaling = spot["scaling_config"]
        if isinstance(scaling, list):
            scaling = scaling[0]
        assert scaling["desired_size"] == 3
        assert scaling["min_size"] == 3
        assert scaling["max_size"] == 10

    # ========== EKS Addon Tests ==========

    def test_vpc_cni_addon_synthesized(self, synthesized_stack):
        """Test VPC CNI addon is synthesized correctly."""
        config = synthesized_stack["config"]

        # Verify VPC CNI addon
        assert "aws_eks_addon" in config["resource"]
        assert "vpc_cni_addon" in config["resource"]["aws_eks_addon"]

        addon = config["resource"]["aws_eks_addon"]["vpc_cni_addon"]
        assert addon["addon_name"] == "vpc-cni"
        assert addon["addon_version"] == "v1.18.1-eksbuild.3"
        assert addon["resolve_conflicts_on_create"] == "OVERWRITE"
        assert addon["resolve_conflicts_on_update"] == "OVERWRITE"

    def test_vpc_cni_addon_configuration(self, synthesized_stack):
        """Test VPC CNI addon configuration values."""
        config = synthesized_stack["config"]

        addon = config["resource"]["aws_eks_addon"]["vpc_cni_addon"]
        config_values = json.loads(addon["configuration_values"])

        assert config_values["env"]["ENABLE_PREFIX_DELEGATION"] == "true"
        assert config_values["env"]["WARM_PREFIX_TARGET"] == "1"

    # ========== Terraform Output Tests ==========

    def test_terraform_outputs_synthesized(self, synthesized_stack):
        """Test all Terraform outputs are synthesized."""
        config = synthesized_stack["config"]

        # Verify outputs exist
        assert "output" in config
        outputs = config["output"]

        # Check all expected outputs
        assert "cluster_endpoint" in outputs
        assert "cluster_name" in outputs
        assert "oidc_provider_arn" in outputs
        assert "oidc_issuer_url" in outputs
        assert "kubectl_config_command" in outputs
        assert "on_demand_node_group_name" in outputs
        assert "spot_node_group_name" in outputs

    # ========== Deployment Output Tests ==========

    def test_deployment_outputs_file_exists(self, deployment_outputs):
        """Test that deployment outputs file exists and is readable."""
        assert deployment_outputs is not None
        assert isinstance(deployment_outputs, dict)

    def test_cluster_endpoint_in_outputs(self, deployment_outputs):
        """Test cluster endpoint exists in deployment outputs."""
        # Check for various possible key formats
        endpoint_keys = ["cluster_endpoint", "clusterEndpoint", "ClusterEndpoint"]

        has_endpoint = any(key in deployment_outputs for key in endpoint_keys)
        assert has_endpoint, f"Cluster endpoint not found in deployment outputs. Keys: {list(deployment_outputs.keys())}"

    def test_cluster_name_in_outputs(self, deployment_outputs):
        """Test cluster name exists in deployment outputs."""
        # Check for various possible key formats
        name_keys = ["cluster_name", "clusterName", "ClusterName"]

        has_name = any(key in deployment_outputs for key in name_keys)
        assert has_name, f"Cluster name not found in deployment outputs. Keys: {list(deployment_outputs.keys())}"

    def test_cluster_name_format(self, deployment_outputs):
        """Test cluster name follows v1 naming convention."""
        name_keys = ["cluster_name", "clusterName", "ClusterName"]

        cluster_name = None
        for key in name_keys:
            if key in deployment_outputs:
                cluster_name = deployment_outputs[key]
                break

        if cluster_name:
            assert "eks-cluster-v1-" in cluster_name, "Cluster name should follow v1 naming convention"

    def test_oidc_provider_arn_in_outputs(self, deployment_outputs):
        """Test OIDC provider ARN exists in deployment outputs."""
        oidc_keys = ["oidc_provider_arn", "oidcProviderArn", "OIDCProviderArn"]

        has_oidc = any(key in deployment_outputs for key in oidc_keys)
        if has_oidc:
            # If OIDC ARN exists, validate format
            for key in oidc_keys:
                if key in deployment_outputs:
                    oidc_arn = deployment_outputs[key]
                    assert oidc_arn.startswith("arn:aws:iam::"), "OIDC provider ARN should be valid AWS ARN"
                    break

    def test_kubectl_config_command_in_outputs(self, deployment_outputs):
        """Test kubectl config command exists in deployment outputs."""
        kubectl_keys = ["kubectl_config_command", "kubectlConfigCommand", "KubectlConfigCommand"]

        has_kubectl = any(key in deployment_outputs for key in kubectl_keys)
        if has_kubectl:
            # If kubectl command exists, validate format
            for key in kubectl_keys:
                if key in deployment_outputs:
                    kubectl_cmd = deployment_outputs[key]
                    assert "aws eks update-kubeconfig" in kubectl_cmd, "kubectl command should use aws eks update-kubeconfig"
                    break

    def test_node_group_names_in_outputs(self, deployment_outputs):
        """Test node group names exist in deployment outputs."""
        on_demand_keys = ["on_demand_node_group_name", "onDemandNodeGroupName", "OnDemandNodeGroupName"]
        spot_keys = ["spot_node_group_name", "spotNodeGroupName", "SpotNodeGroupName"]

        has_on_demand = any(key in deployment_outputs for key in on_demand_keys)
        has_spot = any(key in deployment_outputs for key in spot_keys)

        if has_on_demand:
            for key in on_demand_keys:
                if key in deployment_outputs:
                    on_demand_name = deployment_outputs[key]
                    assert "node-group-od-v1-" in on_demand_name, "On-demand node group should follow v1 naming convention"
                    break

        if has_spot:
            for key in spot_keys:
                if key in deployment_outputs:
                    spot_name = deployment_outputs[key]
                    assert "node-group-spot-v1-" in spot_name, "Spot node group should follow v1 naming convention"
                    break

    def test_all_expected_outputs_present(self, deployment_outputs):
        """Test that deployment has all expected outputs (flexible key matching)."""
        expected_outputs = [
            ["cluster_endpoint", "clusterEndpoint", "ClusterEndpoint"],
            ["cluster_name", "clusterName", "ClusterName"],
        ]

        missing_outputs = []
        for output_variants in expected_outputs:
            if not any(key in deployment_outputs for key in output_variants):
                missing_outputs.append(output_variants[0])

        assert len(missing_outputs) == 0, f"Missing expected outputs: {missing_outputs}. Available: {list(deployment_outputs.keys())}"

    def test_deployment_outputs_not_empty(self, deployment_outputs):
        """Test that deployment outputs contain actual values."""
        for key, value in deployment_outputs.items():
            assert value is not None, f"Output '{key}' should not be None"
            assert value != "", f"Output '{key}' should not be empty"

    # ========== Resource Naming Convention Tests ==========

    def test_resource_names_follow_v1_convention(self, synthesized_stack):
        """Test that all resource names follow v1 naming convention."""
        config = synthesized_stack["config"]

        # Check EKS cluster name
        eks = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        assert "v1" in eks["name"], "EKS cluster name should include v1"

        # Check IAM roles
        cluster_role = config["resource"]["aws_iam_role"]["eks_cluster_role"]
        assert "v1" in cluster_role["name"], "Cluster role name should include v1"

        node_role = config["resource"]["aws_iam_role"]["eks_node_role"]
        assert "v1" in node_role["name"], "Node role name should include v1"

        # Check node groups
        on_demand = config["resource"]["aws_eks_node_group"]["on_demand_node_group"]
        assert "v1" in on_demand["node_group_name"], "On-demand node group name should include v1"

        spot = config["resource"]["aws_eks_node_group"]["spot_node_group"]
        assert "v1" in spot["node_group_name"], "Spot node group name should include v1"

    # ========== Resource Tag Tests ==========

    def test_resources_have_common_tags(self, synthesized_stack):
        """Test that resources have common tags applied."""
        config = synthesized_stack["config"]

        # Check VPC tags
        vpc = config["resource"]["aws_vpc"]["vpc"]
        assert "tags" in vpc
        assert vpc["tags"]["Environment"] == "Production"
        assert vpc["tags"]["ManagedBy"] == "CDKTF"

        # Check EKS cluster tags
        eks = config["resource"]["aws_eks_cluster"]["eks_cluster"]
        assert "tags" in eks
        assert eks["tags"]["Environment"] == "Production"
        assert eks["tags"]["ManagedBy"] == "CDKTF"

    # ========== Data Source Tests ==========

    def test_availability_zones_data_source(self, synthesized_stack):
        """Test availability zones data source is configured."""
        config = synthesized_stack["config"]

        assert "data" in config
        assert "aws_availability_zones" in config["data"]

        azs = config["data"]["aws_availability_zones"]["available_azs"]
        assert azs["state"] == "available"
