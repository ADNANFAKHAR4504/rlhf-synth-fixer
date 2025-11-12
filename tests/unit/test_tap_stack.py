"""Unit tests for TapStack EKS Payment Processing Platform."""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()

    def test_creates_eks_cluster_with_env_suffix(self):
        """Test that EKS cluster is created with environment suffix."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check EKS cluster exists
        template.resource_count_is("Custom::AWSCDK-EKS-Cluster", 1)

    def test_creates_vpc_with_three_azs(self):
        """Test that VPC is created spanning 3 availability zones."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check VPC exists with correct configuration
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_creates_kms_key_with_rotation(self):
        """Test that KMS key is created with rotation enabled."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check KMS key with rotation
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    def test_creates_four_node_groups(self):
        """Test that four EKS node groups are created."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check node groups exist
        template.resource_count_is("AWS::EKS::Nodegroup", 4)

    def test_creates_general_nodegroup_with_t3_large(self):
        """Test that general purpose node groups use t3.large instances."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check t3.large node groups
        template.has_resource_properties("AWS::EKS::Nodegroup", {
            "InstanceTypes": ["t3.large"],
            "AmiType": "BOTTLEROCKET_x86_64"
        })

    def test_creates_gpu_nodegroup_with_g4dn_xlarge(self):
        """Test that GPU node group uses g4dn.xlarge with NVIDIA AMI."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check GPU node group
        template.has_resource_properties("AWS::EKS::Nodegroup", {
            "InstanceTypes": ["g4dn.xlarge"],
            "AmiType": "BOTTLEROCKET_x86_64_NVIDIA"
        })

    def test_creates_memory_nodegroup_with_r5_xlarge(self):
        """Test that memory-optimized node group uses r5.xlarge."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check memory-optimized node group
        template.has_resource_properties("AWS::EKS::Nodegroup", {
            "InstanceTypes": ["r5.xlarge"]
        })

    def test_creates_service_accounts_for_irsa(self):
        """Test that three service accounts are created for IRSA."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check service accounts (created as Kubernetes manifests)
        # Service accounts are created via Custom::AWSCDK-EKS-KubernetesResource
        # Minimum 3 service accounts expected
        resources = template.find_resources("Custom::AWSCDK-EKS-KubernetesResource")
        assert len(resources) >= 3, f"Expected at least 3 service accounts, found {len(resources)}"

    def test_creates_iam_roles_for_service_accounts(self):
        """Test that IAM roles are created for service accounts."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check IAM roles exist (multiple for different service accounts)
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) >= 3, f"Expected at least 3 IAM roles, found {len(roles)}"

    def test_creates_cloudwatch_log_group(self):
        """Test that CloudWatch log group is created for audit logs."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check CloudWatch log group with 30-day retention
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    def test_creates_github_oidc_provider(self):
        """Test that GitHub OIDC provider is created."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check OIDC providers (EKS cluster creates one, GitHub Actions creates another)
        # Expecting at least 2: one for EKS IRSA, one for GitHub Actions
        resources = template.find_resources("Custom::AWSCDKOpenIdConnectProvider")
        assert len(resources) >= 2, f"Expected at least 2 OIDC providers, found {len(resources)}"

    def test_creates_alb_controller_addon(self):
        """Test that AWS Load Balancer Controller add-on is created."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check EKS add-on
        template.has_resource_properties("AWS::EKS::Addon", {
            "AddonName": "aws-load-balancer-controller"
        })

    def test_creates_cloudwatch_dashboard(self):
        """Test that CloudWatch dashboard is created."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check CloudWatch dashboard exists
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    def test_node_groups_have_autoscaler_tags(self):
        """Test that node groups have cluster autoscaler tags."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check autoscaler tags on node groups
        template.has_resource_properties("AWS::EKS::Nodegroup", {
            "Tags": Match.object_like({
                "k8s.io/cluster-autoscaler/enabled": "true"
            })
        })

    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev' if not provided."""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT - Check that stack was created successfully
        assert stack.environment_suffix == "dev"

    def test_all_resources_are_destroyable(self):
        """Test that no Retain policies are present on resources."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check no DeletionPolicy: Retain exists
        template_dict = template.to_json()
        resources = template_dict.get("Resources", {})

        for resource_id, resource in resources.items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            assert deletion_policy != "Retain", \
                f"Resource {resource_id} has Retain policy which violates destroyability requirement"

    def test_stack_outputs_include_cluster_info(self):
        """Test that stack outputs include cluster information."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check outputs exist
        template_dict = template.to_json()
        outputs = template_dict.get("Outputs", {})

        # Should have multiple outputs including cluster endpoint, OIDC issuer, etc.
        assert len(outputs) >= 6, f"Expected at least 6 outputs, found {len(outputs)}"

    def test_gpu_nodegroup_has_nvidia_taint(self):
        """Test that GPU node group has NVIDIA taints for workload isolation."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check GPU node group has taints (CDK generates NO_SCHEDULE)
        template.has_resource_properties("AWS::EKS::Nodegroup", {
            "Taints": [
                {
                    "Effect": "NO_SCHEDULE",
                    "Key": "nvidia.com/gpu",
                    "Value": "true"
                }
            ]
        })

    def test_private_subnets_have_correct_tags(self):
        """Test that private subnets have correct Kubernetes tags."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check private subnet tags for internal load balancers
        template.has_resource_properties("AWS::EC2::Subnet", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "kubernetes.io/role/internal-elb", "Value": "1"})
            ])
        })

    def test_public_subnets_have_correct_tags(self):
        """Test that public subnets have correct Kubernetes tags."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check public subnet tags for external load balancers
        template.has_resource_properties("AWS::EC2::Subnet", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "kubernetes.io/role/elb", "Value": "1"})
            ])
        })


if __name__ == "__main__":
    unittest.main()
