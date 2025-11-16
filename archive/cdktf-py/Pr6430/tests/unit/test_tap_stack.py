"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None
        assert stack.environment_suffix == "test"

    def test_tap_stack_has_required_outputs(self):
        """TapStack has all required outputs."""
        app = App()
        stack = TapStack(app, "TestTapStackOutputs", environment_suffix="test")

        # Synthesize the stack to generate Terraform JSON
        synth = Testing.synth(stack)

        # Parse the synthesized output
        output_json = json.loads(synth)

        # Verify required outputs exist
        outputs = output_json.get("output", {})
        assert "vpc_id" in outputs
        assert "vpc_cidr" in outputs
        assert "private_subnet_ids" in outputs
        assert "public_subnet_ids" in outputs
        assert "cluster_endpoint" in outputs
        assert "cluster_name" in outputs
        assert "oidc_provider_arn" in outputs
        assert "oidc_issuer_url" in outputs
        assert "critical_node_group_name" in outputs
        assert "non_critical_node_group_name" in outputs
        assert "kubeconfig_command" in outputs

    def test_tap_stack_outputs_have_descriptions(self):
        """TapStack outputs have proper descriptions."""
        app = App()
        stack = TapStack(app, "TestTapStackDesc", environment_suffix="test")

        # Synthesize the stack
        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        # Verify output descriptions
        outputs = output_json.get("output", {})
        assert outputs["cluster_endpoint"]["description"] == "EKS cluster endpoint URL"
        assert outputs["cluster_name"]["description"] == "EKS cluster name"
        assert outputs["oidc_provider_arn"]["description"] == "OIDC provider ARN for IRSA"
        assert outputs["oidc_issuer_url"]["description"] == "OIDC issuer URL"

    def test_tap_stack_aws_provider_configuration(self):
        """TapStack configures AWS provider correctly."""
        app = App()
        stack = TapStack(app, "TestTapStackProvider", environment_suffix="test")

        # Synthesize and check provider configuration
        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        # Verify AWS provider exists and is configured
        provider = output_json.get("provider", {}).get("aws", [{}])[0]
        assert provider.get("region") == "us-east-1"

    def test_tap_stack_environment_suffix_propagation(self):
        """TapStack propagates environment_suffix to all resources."""
        app = App()
        environment_suffix = "testsuffix123"
        stack = TapStack(app, "TestTapStackSuffix", environment_suffix=environment_suffix)

        # Synthesize the stack
        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        # Verify resources include environment_suffix in their names/tags
        resources = output_json.get("resource", {})

        # Check KMS key
        kms_key = resources.get("aws_kms_key", {})
        for key_config in kms_key.values():
            tags = key_config.get("tags", {})
            assert tags.get("Environment") == environment_suffix

        # Check IAM roles
        iam_role = resources.get("aws_iam_role", {})
        for role_config in iam_role.values():
            name = role_config.get("name", "")
            assert environment_suffix in name

    def test_tap_stack_creates_kms_resources(self):
        """TapStack creates KMS encryption resources."""
        app = App()
        stack = TapStack(app, "TestTapStackKMS", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify KMS key exists
        assert "aws_kms_key" in resources
        assert "aws_kms_alias" in resources

    def test_tap_stack_creates_iam_resources(self):
        """TapStack creates IAM role resources."""
        app = App()
        stack = TapStack(app, "TestTapStackIAM", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify IAM roles exist
        assert "aws_iam_role" in resources
        assert "aws_iam_role_policy_attachment" in resources

    def test_tap_stack_creates_security_group_resources(self):
        """TapStack creates security group resources."""
        app = App()
        stack = TapStack(app, "TestTapStackSG", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify security group resources exist
        assert "aws_security_group" in resources
        assert "aws_security_group_rule" in resources

    def test_tap_stack_creates_eks_cluster(self):
        """TapStack creates EKS cluster resource."""
        app = App()
        stack = TapStack(app, "TestTapStackEKS", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify EKS cluster exists
        assert "aws_eks_cluster" in resources
        assert "aws_cloudwatch_log_group" in resources

    def test_tap_stack_creates_oidc_provider(self):
        """TapStack creates OIDC provider for IRSA."""
        app = App()
        stack = TapStack(app, "TestTapStackOIDC", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify OIDC provider exists
        assert "aws_iam_openid_connect_provider" in resources

    def test_tap_stack_creates_node_groups(self):
        """TapStack creates both critical and non-critical node groups."""
        app = App()
        stack = TapStack(app, "TestTapStackNodes", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify node groups exist
        assert "aws_eks_node_group" in resources
        node_groups = resources.get("aws_eks_node_group", {})
        # Verify disk size is set for all node groups
        for ng_config in node_groups.values():
            assert ng_config.get("disk_size") == 20

    def test_tap_stack_creates_eks_addons(self):
        """TapStack creates EKS add-ons."""
        app = App()
        stack = TapStack(app, "TestTapStackAddons", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify EKS add-ons exist
        assert "aws_eks_addon" in resources

    def test_tap_stack_kubeconfig_command_format(self):
        """TapStack generates correct kubeconfig command."""
        app = App()
        stack = TapStack(app, "TestTapStackKube", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        outputs = output_json.get("output", {})
        kubeconfig = outputs.get("kubeconfig_command", {}).get("value", "")

        # Verify kubeconfig command format
        assert "aws eks update-kubeconfig" in kubeconfig
        assert "--region us-east-1" in kubeconfig
        assert "--name" in kubeconfig

    def test_tap_stack_creates_networking_resources(self):
        """TapStack creates VPC and networking resources."""
        app = App()
        stack = TapStack(app, "TestTapStackNetworking", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})

        # Verify VPC and networking resources are created
        assert "aws_vpc" in resources
        assert "aws_subnet" in resources
        assert "aws_internet_gateway" in resources
        assert "aws_nat_gateway" in resources
        assert "aws_eip" in resources
        assert "aws_route_table" in resources
        assert "aws_route" in resources

        # Verify EKS resources are created
        assert "aws_eks_cluster" in resources
        assert "aws_security_group" in resources


# add more test suites and cases as needed
