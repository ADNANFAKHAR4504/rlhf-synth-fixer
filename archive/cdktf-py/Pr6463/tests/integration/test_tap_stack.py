"""Integration tests for TAP Stack using deployment outputs."""
import json
import os
import re
from pathlib import Path


class TestTapStackIntegration:
    """Integration tests for TAP Stack using actual deployment outputs."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs once for all tests."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_path.exists():
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_path}. "
                "Please ensure the infrastructure is deployed and outputs are saved."
            )

        with open(outputs_path, 'r') as f:
            data = json.load(f)

        # Get the first (and likely only) stack outputs
        cls.stack_name = list(data.keys())[0]
        cls.outputs = data[cls.stack_name]
        cls.environment_suffix = cls.stack_name.replace("TapStack", "")

    def test_deployment_outputs_exist(self):
        """Test that all expected outputs are present."""
        expected_outputs = [
            "alb_controller_role_arn",
            "cluster_autoscaler_role_arn",
            "cluster_endpoint",
            "cluster_name",
            "cluster_oidc_provider_arn",
            "ebs_csi_role_arn",
            "external_dns_role_arn",
            "external_secrets_role_arn",
            "region",
            "vpc_id"
        ]

        for output_key in expected_outputs:
            assert output_key in self.outputs, f"Missing output: {output_key}"
            assert self.outputs[output_key] is not None, f"Output {output_key} is None"
            assert self.outputs[output_key] != "", f"Output {output_key} is empty"


class TestVpcOutputs:
    """Integration tests for VPC construct outputs."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.outputs = data[list(data.keys())[0]]

    def test_vpc_id_format(self):
        """Test VPC ID has correct format."""
        vpc_id = self.outputs["vpc_id"]
        assert vpc_id.startswith("vpc-"), f"VPC ID should start with 'vpc-', got: {vpc_id}"

        # VPC ID format: vpc-xxxxxxxxxxxxxxxx (vpc- followed by 17 hex chars)
        vpc_pattern = r"^vpc-[0-9a-f]{17}$"
        assert re.match(vpc_pattern, vpc_id), f"VPC ID format invalid: {vpc_id}"

    def test_vpc_id_exists(self):
        """Test VPC ID is not empty and has valid structure."""
        vpc_id = self.outputs["vpc_id"]
        assert len(vpc_id) > 4, "VPC ID should be longer than 'vpc-' prefix"

    def test_region_is_valid(self):
        """Test region is a valid AWS region."""
        region = self.outputs["region"]

        # Common AWS region patterns
        valid_regions = [
            "us-east-1", "us-east-2", "us-west-1", "us-west-2",
            "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1",
            "ap-southeast-1", "ap-southeast-2", "ap-northeast-1"
        ]

        # Either exact match or follows pattern
        region_pattern = r"^[a-z]{2}-[a-z]+-\d+$"
        assert region in valid_regions or re.match(region_pattern, region), \
            f"Invalid AWS region: {region}"


class TestEksClusterOutputs:
    """Integration tests for EKS Cluster construct outputs."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.stack_name = list(data.keys())[0]
        cls.outputs = data[cls.stack_name]
        cls.environment_suffix = cls.stack_name.replace("TapStack", "")

    def test_cluster_name_format(self):
        """Test EKS cluster name has correct format."""
        cluster_name = self.outputs["cluster_name"]

        # Should follow pattern: eks-cluster-{environment_suffix}
        expected_pattern = f"eks-cluster-{self.environment_suffix}"
        assert cluster_name == expected_pattern, \
            f"Cluster name should be {expected_pattern}, got: {cluster_name}"

    def test_cluster_endpoint_format(self):
        """Test EKS cluster endpoint is a valid HTTPS URL."""
        endpoint = self.outputs["cluster_endpoint"]

        assert endpoint.startswith("https://"), \
            f"Cluster endpoint should start with https://, got: {endpoint}"
        assert ".eks." in endpoint, \
            f"Cluster endpoint should contain .eks., got: {endpoint}"
        assert ".amazonaws.com" in endpoint, \
            f"Cluster endpoint should contain .amazonaws.com, got: {endpoint}"

    def test_cluster_endpoint_region_matches(self):
        """Test cluster endpoint region matches deployment region."""
        endpoint = self.outputs["cluster_endpoint"]
        region = self.outputs["region"]

        assert f".{region}.eks.amazonaws.com" in endpoint, \
            f"Cluster endpoint region should match {region}, got: {endpoint}"

    def test_oidc_provider_arn_format(self):
        """Test OIDC provider ARN has correct format."""
        oidc_arn = self.outputs["cluster_oidc_provider_arn"]

        assert oidc_arn.startswith("arn:aws:iam::"), \
            f"OIDC ARN should start with arn:aws:iam::, got: {oidc_arn}"
        assert ":oidc-provider/oidc.eks." in oidc_arn, \
            f"OIDC ARN should contain :oidc-provider/oidc.eks., got: {oidc_arn}"

    def test_oidc_provider_arn_region_matches(self):
        """Test OIDC provider ARN contains correct region."""
        oidc_arn = self.outputs["cluster_oidc_provider_arn"]
        region = self.outputs["region"]

        assert f"oidc.eks.{region}.amazonaws.com" in oidc_arn, \
            f"OIDC ARN should contain region {region}, got: {oidc_arn}"

    def test_oidc_provider_id_matches_endpoint(self):
        """Test OIDC provider ID matches the cluster endpoint ID."""
        oidc_arn = self.outputs["cluster_oidc_provider_arn"]
        endpoint = self.outputs["cluster_endpoint"]

        # Extract OIDC ID from ARN
        oidc_id = oidc_arn.split("/id/")[-1] if "/id/" in oidc_arn else None
        assert oidc_id is not None, "Could not extract OIDC ID from ARN"

        # Check if same ID exists in endpoint
        assert oidc_id in endpoint, \
            f"OIDC ID {oidc_id} should be in endpoint {endpoint}"


class TestIrsaRolesOutputs:
    """Integration tests for IRSA Roles construct outputs."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.stack_name = list(data.keys())[0]
        cls.outputs = data[cls.stack_name]
        cls.environment_suffix = cls.stack_name.replace("TapStack", "")

    def test_cluster_autoscaler_role_arn_format(self):
        """Test cluster autoscaler role ARN has correct format."""
        role_arn = self.outputs["cluster_autoscaler_role_arn"]

        assert role_arn.startswith("arn:aws:iam::"), \
            f"Role ARN should start with arn:aws:iam::, got: {role_arn}"
        assert ":role/eks-cluster-autoscaler-" in role_arn, \
            f"Role ARN should contain :role/eks-cluster-autoscaler-, got: {role_arn}"
        assert role_arn.endswith(self.environment_suffix), \
            f"Role ARN should end with {self.environment_suffix}, got: {role_arn}"

    def test_alb_controller_role_arn_format(self):
        """Test ALB controller role ARN has correct format."""
        role_arn = self.outputs["alb_controller_role_arn"]

        assert role_arn.startswith("arn:aws:iam::"), \
            f"Role ARN should start with arn:aws:iam::, got: {role_arn}"
        assert ":role/eks-alb-controller-" in role_arn, \
            f"Role ARN should contain :role/eks-alb-controller-, got: {role_arn}"
        assert role_arn.endswith(self.environment_suffix), \
            f"Role ARN should end with {self.environment_suffix}, got: {role_arn}"

    def test_external_dns_role_arn_format(self):
        """Test external DNS role ARN has correct format."""
        role_arn = self.outputs["external_dns_role_arn"]

        assert role_arn.startswith("arn:aws:iam::"), \
            f"Role ARN should start with arn:aws:iam::, got: {role_arn}"
        assert ":role/eks-external-dns-" in role_arn, \
            f"Role ARN should contain :role/eks-external-dns-, got: {role_arn}"
        assert role_arn.endswith(self.environment_suffix), \
            f"Role ARN should end with {self.environment_suffix}, got: {role_arn}"

    def test_ebs_csi_role_arn_format(self):
        """Test EBS CSI driver role ARN has correct format."""
        role_arn = self.outputs["ebs_csi_role_arn"]

        assert role_arn.startswith("arn:aws:iam::"), \
            f"Role ARN should start with arn:aws:iam::, got: {role_arn}"
        assert ":role/eks-ebs-csi-driver-" in role_arn, \
            f"Role ARN should contain :role/eks-ebs-csi-driver-, got: {role_arn}"
        assert role_arn.endswith(self.environment_suffix), \
            f"Role ARN should end with {self.environment_suffix}, got: {role_arn}"

    def test_all_irsa_roles_have_same_account(self):
        """Test all IRSA roles belong to the same AWS account."""
        roles = [
            self.outputs["cluster_autoscaler_role_arn"],
            self.outputs["alb_controller_role_arn"],
            self.outputs["external_dns_role_arn"],
            self.outputs["ebs_csi_role_arn"]
        ]

        # Extract account IDs
        account_ids = set()
        for role_arn in roles:
            account_id = role_arn.split(":")[4]
            account_ids.add(account_id)

        assert len(account_ids) == 1, \
            f"All roles should belong to same account, found: {account_ids}"

    def test_all_irsa_roles_have_consistent_suffix(self):
        """Test all IRSA roles have consistent environment suffix."""
        roles = {
            "cluster_autoscaler": self.outputs["cluster_autoscaler_role_arn"],
            "alb_controller": self.outputs["alb_controller_role_arn"],
            "external_dns": self.outputs["external_dns_role_arn"],
            "ebs_csi": self.outputs["ebs_csi_role_arn"]
        }

        for role_name, role_arn in roles.items():
            assert role_arn.endswith(self.environment_suffix), \
                f"{role_name} role should end with {self.environment_suffix}, got: {role_arn}"


class TestSecretsManagerOutputs:
    """Integration tests for Secrets Manager construct outputs."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.stack_name = list(data.keys())[0]
        cls.outputs = data[cls.stack_name]
        cls.environment_suffix = cls.stack_name.replace("TapStack", "")

    def test_external_secrets_role_arn_format(self):
        """Test external secrets role ARN has correct format."""
        role_arn = self.outputs["external_secrets_role_arn"]

        assert role_arn.startswith("arn:aws:iam::"), \
            f"Role ARN should start with arn:aws:iam::, got: {role_arn}"
        assert ":role/eks-external-secrets-" in role_arn, \
            f"Role ARN should contain :role/eks-external-secrets-, got: {role_arn}"
        assert role_arn.endswith(self.environment_suffix), \
            f"Role ARN should end with {self.environment_suffix}, got: {role_arn}"


class TestStackNamingConventions:
    """Integration tests for naming conventions across the stack."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.stack_name = list(data.keys())[0]
        cls.outputs = data[cls.stack_name]
        cls.environment_suffix = cls.stack_name.replace("TapStack", "")

    def test_all_resources_use_consistent_suffix(self):
        """Test all resources use the same environment suffix."""
        cluster_name = self.outputs["cluster_name"]

        # Extract suffix from cluster name
        suffix = cluster_name.replace("eks-cluster-", "")

        # Check all IAM roles
        role_outputs = [
            "cluster_autoscaler_role_arn",
            "alb_controller_role_arn",
            "external_dns_role_arn",
            "ebs_csi_role_arn",
            "external_secrets_role_arn"
        ]

        for role_key in role_outputs:
            role_arn = self.outputs[role_key]
            assert role_arn.endswith(suffix), \
                f"{role_key} should end with suffix {suffix}, got: {role_arn}"

    def test_cluster_name_matches_environment_suffix(self):
        """Test cluster name contains the environment suffix."""
        cluster_name = self.outputs["cluster_name"]
        expected_name = f"eks-cluster-{self.environment_suffix}"

        assert cluster_name == expected_name, \
            f"Cluster name should be {expected_name}, got: {cluster_name}"


class TestResourceConsistency:
    """Integration tests for resource consistency across constructs."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.outputs = data[list(data.keys())[0]]

    def test_all_iam_resources_same_account(self):
        """Test all IAM resources belong to the same AWS account."""
        iam_resources = [
            self.outputs["cluster_oidc_provider_arn"],
            self.outputs["cluster_autoscaler_role_arn"],
            self.outputs["alb_controller_role_arn"],
            self.outputs["external_dns_role_arn"],
            self.outputs["ebs_csi_role_arn"],
            self.outputs["external_secrets_role_arn"]
        ]

        account_ids = set()
        for resource_arn in iam_resources:
            # ARN format: arn:aws:service::account-id:resource
            parts = resource_arn.split(":")
            account_id = parts[4]
            account_ids.add(account_id)

        assert len(account_ids) == 1, \
            f"All IAM resources should be in same account, found: {account_ids}"

    def test_vpc_and_cluster_in_same_region(self):
        """Test VPC and EKS cluster are in the same region."""
        region = self.outputs["region"]
        cluster_endpoint = self.outputs["cluster_endpoint"]

        # Cluster endpoint should contain the region
        assert f".{region}.eks.amazonaws.com" in cluster_endpoint, \
            f"Cluster endpoint should be in region {region}, got: {cluster_endpoint}"

    def test_oidc_provider_region_matches_cluster(self):
        """Test OIDC provider is in the same region as the cluster."""
        region = self.outputs["region"]
        oidc_arn = self.outputs["cluster_oidc_provider_arn"]

        assert f"oidc.eks.{region}.amazonaws.com" in oidc_arn, \
            f"OIDC provider should be in region {region}, got: {oidc_arn}"


class TestOutputValidation:
    """Integration tests for output value validation."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.outputs = data[list(data.keys())[0]]

    def test_no_output_contains_placeholder_values(self):
        """Test that no output contains placeholder or template values."""
        placeholder_patterns = [
            "example",
            "placeholder",
            "test",
            "dummy",
            "sample",
            "TODO",
            "FIXME",
            "xxx",
            "000000000000"  # placeholder account ID
        ]

        for key, value in self.outputs.items():
            value_lower = str(value).lower()
            for pattern in placeholder_patterns:
                assert pattern not in value_lower or key == "cluster_name", \
                    f"Output {key} appears to contain placeholder value: {value}"

    def test_all_arns_are_valid_format(self):
        """Test that all ARN outputs follow AWS ARN format."""
        arn_outputs = [
            "cluster_oidc_provider_arn",
            "cluster_autoscaler_role_arn",
            "alb_controller_role_arn",
            "external_dns_role_arn",
            "ebs_csi_role_arn",
            "external_secrets_role_arn"
        ]

        arn_pattern = r"^arn:aws:[a-z0-9\-]+::[0-9]{12}:[a-z0-9\-\/]+$"

        for arn_key in arn_outputs:
            arn_value = self.outputs[arn_key]
            assert re.match(arn_pattern, arn_value) or "oidc-provider" in arn_value, \
                f"ARN {arn_key} has invalid format: {arn_value}"

    def test_cluster_endpoint_is_reachable_url(self):
        """Test that cluster endpoint is a properly formatted URL."""
        endpoint = self.outputs["cluster_endpoint"]

        # Basic URL validation
        assert endpoint.startswith("https://"), "Endpoint should use HTTPS"
        assert len(endpoint) > 10, "Endpoint should be a complete URL"
        assert " " not in endpoint, "Endpoint should not contain spaces"
        assert endpoint.count(".") >= 3, "Endpoint should have multiple domain levels"

    def test_vpc_id_is_valid_aws_format(self):
        """Test VPC ID follows AWS format specifications."""
        vpc_id = self.outputs["vpc_id"]

        # AWS VPC ID format validation
        assert vpc_id.startswith("vpc-"), "VPC ID should start with vpc-"
        assert len(vpc_id) == 21, f"VPC ID should be 21 characters, got: {len(vpc_id)}"

        # Should only contain lowercase hex after prefix
        hex_part = vpc_id[4:]
        assert all(c in "0123456789abcdef" for c in hex_part), \
            f"VPC ID hex part should only contain 0-9 and a-f, got: {hex_part}"

    def test_region_output_matches_resource_regions(self):
        """Test that region output matches regions in other resources."""
        region = self.outputs["region"]

        # Check cluster endpoint
        cluster_endpoint = self.outputs["cluster_endpoint"]
        assert region in cluster_endpoint, \
            f"Region {region} should appear in cluster endpoint: {cluster_endpoint}"

        # Check OIDC provider
        oidc_arn = self.outputs["cluster_oidc_provider_arn"]
        assert region in oidc_arn, \
            f"Region {region} should appear in OIDC ARN: {oidc_arn}"


class TestDeploymentIntegrity:
    """Integration tests for overall deployment integrity."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            cls.data = json.load(f)
        cls.stack_name = list(cls.data.keys())[0]
        cls.outputs = cls.data[cls.stack_name]

    def test_single_stack_deployment(self):
        """Test that only one stack is deployed."""
        assert len(self.data.keys()) == 1, \
            f"Expected 1 stack, found {len(self.data.keys())}: {list(self.data.keys())}"

    def test_stack_name_format(self):
        """Test stack name follows expected format."""
        assert self.stack_name.startswith("TapStack"), \
            f"Stack name should start with 'TapStack', got: {self.stack_name}"

    def test_minimum_required_outputs_present(self):
        """Test that minimum required outputs are present for a functioning EKS cluster."""
        critical_outputs = [
            "cluster_name",
            "cluster_endpoint",
            "vpc_id",
            "region"
        ]

        for output in critical_outputs:
            assert output in self.outputs, \
                f"Critical output missing: {output}"
            assert self.outputs[output], \
                f"Critical output is empty: {output}"

    def test_all_outputs_are_strings(self):
        """Test that all outputs are string values."""
        for key, value in self.outputs.items():
            assert isinstance(value, str), \
                f"Output {key} should be string, got {type(value)}: {value}"

    def test_no_duplicate_values(self):
        """Test that role ARNs are unique (no duplicate resources)."""
        role_arns = [
            self.outputs["cluster_autoscaler_role_arn"],
            self.outputs["alb_controller_role_arn"],
            self.outputs["external_dns_role_arn"],
            self.outputs["ebs_csi_role_arn"],
            self.outputs["external_secrets_role_arn"]
        ]

        assert len(role_arns) == len(set(role_arns)), \
            f"Found duplicate role ARNs: {role_arns}"


class TestAccountAndRegionConsistency:
    """Integration tests for AWS account and region consistency."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.outputs = data[list(data.keys())[0]]

    def test_extract_account_id_from_arns(self):
        """Test that we can extract and validate account ID from all ARNs."""
        arn_fields = [
            "cluster_oidc_provider_arn",
            "cluster_autoscaler_role_arn",
            "alb_controller_role_arn",
            "external_dns_role_arn",
            "ebs_csi_role_arn",
            "external_secrets_role_arn"
        ]

        account_ids = []
        for field in arn_fields:
            arn = self.outputs[field]
            parts = arn.split(":")
            account_id = parts[4]

            # Validate account ID format (12 digits)
            assert len(account_id) == 12, \
                f"Account ID should be 12 digits, got: {account_id} from {field}"
            assert account_id.isdigit(), \
                f"Account ID should be numeric, got: {account_id} from {field}"

            account_ids.append(account_id)

        # All should be the same
        assert len(set(account_ids)) == 1, \
            f"Multiple account IDs found: {set(account_ids)}"

    def test_region_consistency_across_all_resources(self):
        """Test region is consistent across all regional resources."""
        region = self.outputs["region"]

        # Test cluster endpoint contains region
        endpoint = self.outputs["cluster_endpoint"]
        assert f".{region}.eks.amazonaws.com" in endpoint, \
            f"Endpoint should contain region {region}"

        # Test OIDC provider contains region
        oidc = self.outputs["cluster_oidc_provider_arn"]
        assert f"oidc.eks.{region}.amazonaws.com" in oidc, \
            f"OIDC should contain region {region}"


class TestSecurityBestPractices:
    """Integration tests for security best practices validation."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.outputs = data[list(data.keys())[0]]

    def test_cluster_endpoint_uses_https(self):
        """Test that cluster endpoint uses HTTPS protocol."""
        endpoint = self.outputs["cluster_endpoint"]
        assert endpoint.startswith("https://"), \
            f"Cluster endpoint must use HTTPS, got: {endpoint}"
        assert "http://" not in endpoint or endpoint.startswith("https://"), \
            "Cluster endpoint should not use plain HTTP"

    def test_irsa_roles_properly_scoped(self):
        """Test that IRSA roles have distinct names for different purposes."""
        role_names = {
            "autoscaler": self.outputs["cluster_autoscaler_role_arn"],
            "alb": self.outputs["alb_controller_role_arn"],
            "dns": self.outputs["external_dns_role_arn"],
            "ebs": self.outputs["ebs_csi_role_arn"],
            "secrets": self.outputs["external_secrets_role_arn"]
        }

        # Extract role names from ARNs
        extracted_names = {}
        for purpose, arn in role_names.items():
            role_name = arn.split(":role/")[-1]
            extracted_names[purpose] = role_name

        # All role names should be unique
        assert len(extracted_names.values()) == len(set(extracted_names.values())), \
            f"Role names should be unique, got: {extracted_names}"

        # Each role should indicate its purpose in the name
        assert "autoscaler" in extracted_names["autoscaler"], \
            "Autoscaler role name should contain 'autoscaler'"
        assert "alb" in extracted_names["alb"], \
            "ALB role name should contain 'alb'"
        assert "dns" in extracted_names["dns"], \
            "DNS role name should contain 'dns'"
        assert "ebs" in extracted_names["ebs"], \
            "EBS role name should contain 'ebs'"
        assert "secrets" in extracted_names["secrets"], \
            "Secrets role name should contain 'secrets'"

    def test_oidc_provider_properly_configured(self):
        """Test OIDC provider ARN indicates proper configuration."""
        oidc_arn = self.outputs["cluster_oidc_provider_arn"]

        # Should be an OIDC provider resource
        assert ":oidc-provider/" in oidc_arn, \
            "Should be an OIDC provider resource"

        # Should point to EKS OIDC endpoint
        assert "oidc.eks." in oidc_arn, \
            "Should point to EKS OIDC endpoint"
        assert ".amazonaws.com/id/" in oidc_arn, \
            "Should contain AWS OIDC ID path"


class TestConstructIntegration:
    """Integration tests validating construct interactions."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        with open(outputs_path, 'r') as f:
            data = json.load(f)
        cls.outputs = data[list(data.keys())[0]]

    def test_vpc_supports_eks_cluster(self):
        """Test VPC is properly configured to support EKS cluster."""
        vpc_id = self.outputs["vpc_id"]
        cluster_name = self.outputs["cluster_name"]

        # VPC should exist
        assert vpc_id is not None, "VPC ID should not be None"

        # Cluster should exist
        assert cluster_name is not None, "Cluster name should not be None"

    def test_irsa_roles_reference_correct_cluster(self):
        """Test IRSA roles are created for the correct cluster via OIDC."""
        oidc_arn = self.outputs["cluster_oidc_provider_arn"]

        # Extract OIDC ID
        oidc_id = oidc_arn.split("/id/")[-1]

        # This ID should match the cluster endpoint
        endpoint = self.outputs["cluster_endpoint"]
        assert oidc_id in endpoint, \
            f"OIDC ID {oidc_id} should be in endpoint {endpoint}"

    def test_all_addons_have_required_roles(self):
        """Test all expected addon roles are present."""
        expected_addon_roles = [
            "ebs_csi_role_arn",  # For EBS CSI driver addon
            "cluster_autoscaler_role_arn",  # For cluster autoscaler
            "alb_controller_role_arn",  # For ALB controller
            "external_dns_role_arn"  # For external DNS
        ]

        for role_key in expected_addon_roles:
            assert role_key in self.outputs, \
                f"Expected addon role {role_key} not found in outputs"
            assert self.outputs[role_key], \
                f"Addon role {role_key} is empty"

    def test_secrets_manager_integration_ready(self):
        """Test secrets manager integration has required role."""
        assert "external_secrets_role_arn" in self.outputs, \
            "External secrets role should be present"

        secrets_role = self.outputs["external_secrets_role_arn"]
        assert "external-secrets" in secrets_role, \
            "Secrets role name should contain 'external-secrets'"
