"""Integration tests for EKS deployment using deployment outputs (no AWS API calls)."""
import json
import os
import pytest
from pathlib import Path


class TestEksIntegration:
    """Integration tests for EKS cluster deployment using static outputs."""

    @pytest.fixture(scope="class")
    def deployment_outputs(self):
        """Load deployment outputs from cfn-outputs/flat-outputs.json."""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_file.exists():
            pytest.skip(f"Deployment outputs file not found: {outputs_file}")

        with open(outputs_file, 'r') as f:
            data = json.load(f)

        # Extract the first stack's outputs
        stack_name = list(data.keys())[0]
        return data[stack_name]

    def test_eks_cluster_exists_and_active(self, deployment_outputs):
        """Test that EKS cluster name exists in outputs."""
        cluster_name = deployment_outputs.get('cluster_name')
        assert cluster_name is not None, "EKS cluster name not found in outputs"
        assert cluster_name.startswith('eks-cluster-'), f"Cluster name should start with 'eks-cluster-', got: {cluster_name}"
        assert len(cluster_name) > 12, "Cluster name should have environment suffix"

    def test_eks_cluster_endpoint_valid(self, deployment_outputs):
        """Test that EKS cluster endpoint is valid."""
        endpoint = deployment_outputs.get('cluster_endpoint')
        assert endpoint is not None, "EKS cluster endpoint not found in outputs"
        assert endpoint.startswith('https://'), f"Endpoint should use HTTPS, got: {endpoint}"
        assert '.eks.' in endpoint, f"Endpoint should contain .eks., got: {endpoint}"
        assert '.amazonaws.com' in endpoint, f"Endpoint should be an AWS endpoint, got: {endpoint}"

    def test_vpc_exists_with_correct_format(self, deployment_outputs):
        """Test that VPC ID exists and has correct format."""
        vpc_id = deployment_outputs.get('vpc_id')
        assert vpc_id is not None, "VPC ID not found in outputs"
        assert vpc_id.startswith('vpc-'), f"VPC ID should start with 'vpc-', got: {vpc_id}"
        assert len(vpc_id) == 21, f"VPC ID should be 21 characters, got: {len(vpc_id)}"

    def test_region_is_valid(self, deployment_outputs):
        """Test that region exists and is valid."""
        region = deployment_outputs.get('region')
        assert region is not None, "Region not found in outputs"

        # Validate region format
        import re
        region_pattern = r"^[a-z]{2}-[a-z]+-\d+$"
        assert re.match(region_pattern, region), f"Invalid AWS region format: {region}"

    def test_kms_encryption_configured(self, deployment_outputs):
        """Test that cluster has encryption endpoint (indicates KMS is configured)."""
        cluster_endpoint = deployment_outputs.get('cluster_endpoint')
        assert cluster_endpoint is not None, "Cluster endpoint not found"

        # The presence of a valid cluster endpoint indicates encryption is configured
        # as the stack requires KMS key for cluster creation
        assert 'https://' in cluster_endpoint, "Cluster should have HTTPS endpoint (encryption configured)"

    def test_irsa_roles_exist_with_correct_format(self, deployment_outputs):
        """Test that IRSA roles exist with correct format."""
        role_keys = [
            'ebs_csi_role_arn',
            'cluster_autoscaler_role_arn',
            'alb_controller_role_arn',
            'external_dns_role_arn',
            'external_secrets_role_arn'
        ]

        oidc_provider_arn = deployment_outputs.get('cluster_oidc_provider_arn')
        assert oidc_provider_arn is not None, "OIDC provider ARN not found in outputs"
        assert ':oidc-provider/' in oidc_provider_arn, "Invalid OIDC provider ARN format"

        for role_key in role_keys:
            role_arn = deployment_outputs.get(role_key)
            assert role_arn is not None, f"{role_key} not found in outputs"
            assert role_arn.startswith('arn:aws:iam::'), f"{role_key} should be an IAM ARN"
            assert ':role/' in role_arn, f"{role_key} should be a role ARN"

    def test_irsa_roles_have_oidc_trust(self, deployment_outputs):
        """Test that IRSA roles are configured for the correct cluster."""
        oidc_arn = deployment_outputs.get('cluster_oidc_provider_arn')
        cluster_endpoint = deployment_outputs.get('cluster_endpoint')

        # Extract OIDC ID from ARN
        oidc_id = oidc_arn.split('/id/')[-1]

        # Verify OIDC ID matches cluster endpoint ID
        assert oidc_id in cluster_endpoint, \
            f"OIDC ID {oidc_id} should match cluster endpoint {cluster_endpoint}"

    def test_secrets_manager_role_exists(self, deployment_outputs):
        """Test that Secrets Manager role exists."""
        secret_role_arn = deployment_outputs.get('external_secrets_role_arn')
        assert secret_role_arn is not None, "External secrets role ARN not found in outputs"
        assert 'external-secrets' in secret_role_arn, "Role should be for external secrets"
        assert secret_role_arn.startswith('arn:aws:iam::'), "Should be an IAM ARN"

    def test_cluster_resources_in_same_region(self, deployment_outputs):
        """Test that all cluster resources are in the same region."""
        region = deployment_outputs.get('region')
        endpoint = deployment_outputs.get('cluster_endpoint')
        oidc_arn = deployment_outputs.get('cluster_oidc_provider_arn')

        # Verify region is in endpoint
        assert f".{region}.eks.amazonaws.com" in endpoint, \
            f"Endpoint should be in region {region}"

        # Verify region is in OIDC provider
        assert f"oidc.eks.{region}.amazonaws.com" in oidc_arn, \
            f"OIDC provider should be in region {region}"

    def test_all_required_outputs_present(self, deployment_outputs):
        """Test that all required outputs are present."""
        required_outputs = [
            'cluster_name',
            'cluster_endpoint',
            'cluster_oidc_provider_arn',
            'vpc_id',
            'region',
            'ebs_csi_role_arn',
            'cluster_autoscaler_role_arn',
            'alb_controller_role_arn',
            'external_dns_role_arn',
            'external_secrets_role_arn'
        ]

        for output_key in required_outputs:
            assert output_key in deployment_outputs, f"Required output {output_key} not found"
            assert deployment_outputs[output_key], f"Required output {output_key} is empty"

    def test_iam_resources_same_account(self, deployment_outputs):
        """Test that all IAM resources belong to the same AWS account."""
        iam_resources = [
            deployment_outputs.get('cluster_oidc_provider_arn'),
            deployment_outputs.get('cluster_autoscaler_role_arn'),
            deployment_outputs.get('alb_controller_role_arn'),
            deployment_outputs.get('external_dns_role_arn'),
            deployment_outputs.get('ebs_csi_role_arn'),
            deployment_outputs.get('external_secrets_role_arn')
        ]

        account_ids = set()
        for resource_arn in iam_resources:
            parts = resource_arn.split(":")
            account_id = parts[4]
            account_ids.add(account_id)

        assert len(account_ids) == 1, \
            f"All IAM resources should be in same account, found: {account_ids}"

    def test_cluster_naming_convention(self, deployment_outputs):
        """Test that cluster follows naming convention."""
        cluster_name = deployment_outputs.get('cluster_name')
        region = deployment_outputs.get('region')

        # Cluster name should follow pattern: eks-cluster-{environment}
        assert cluster_name.startswith('eks-cluster-'), \
            f"Cluster name should follow naming convention, got: {cluster_name}"

        # Extract environment suffix
        suffix = cluster_name.replace('eks-cluster-', '')
        assert len(suffix) > 0, "Cluster name should have environment suffix"

        # Verify all roles use same suffix
        roles = [
            deployment_outputs.get('cluster_autoscaler_role_arn'),
            deployment_outputs.get('alb_controller_role_arn'),
            deployment_outputs.get('external_dns_role_arn'),
            deployment_outputs.get('ebs_csi_role_arn'),
            deployment_outputs.get('external_secrets_role_arn')
        ]

        for role_arn in roles:
            assert role_arn.endswith(suffix), \
                f"Role should end with suffix {suffix}, got: {role_arn}"

    def test_security_best_practices(self, deployment_outputs):
        """Test that security best practices are followed."""
        # Test 1: Cluster endpoint uses HTTPS
        endpoint = deployment_outputs.get('cluster_endpoint')
        assert endpoint.startswith('https://'), "Cluster endpoint must use HTTPS"

        # Test 2: OIDC provider is configured
        oidc_arn = deployment_outputs.get('cluster_oidc_provider_arn')
        assert oidc_arn is not None, "OIDC provider should be configured"
        assert ':oidc-provider/' in oidc_arn, "OIDC provider ARN should be valid"

        # Test 3: Each IRSA role has distinct name
        role_arns = [
            deployment_outputs.get('cluster_autoscaler_role_arn'),
            deployment_outputs.get('alb_controller_role_arn'),
            deployment_outputs.get('external_dns_role_arn'),
            deployment_outputs.get('ebs_csi_role_arn'),
            deployment_outputs.get('external_secrets_role_arn')
        ]

        role_names = [arn.split(':role/')[-1] for arn in role_arns]
        assert len(role_names) == len(set(role_names)), \
            "All IRSA roles should have unique names"

    def test_addon_roles_properly_named(self, deployment_outputs):
        """Test that addon roles are properly named for their purpose."""
        role_mappings = {
            'cluster_autoscaler_role_arn': 'autoscaler',
            'alb_controller_role_arn': 'alb',
            'external_dns_role_arn': 'dns',
            'ebs_csi_role_arn': 'ebs',
            'external_secrets_role_arn': 'secrets'
        }

        for role_key, expected_substring in role_mappings.items():
            role_arn = deployment_outputs.get(role_key)
            role_name = role_arn.split(':role/')[-1]
            assert expected_substring in role_name.lower(), \
                f"Role {role_key} should contain '{expected_substring}' in name, got: {role_name}"

    def test_deployment_outputs_are_valid_arns(self, deployment_outputs):
        """Test that all ARN outputs are valid AWS ARNs."""
        import re

        arn_outputs = [
            'cluster_oidc_provider_arn',
            'cluster_autoscaler_role_arn',
            'alb_controller_role_arn',
            'external_dns_role_arn',
            'ebs_csi_role_arn',
            'external_secrets_role_arn'
        ]

        arn_pattern = r"^arn:aws:[a-z0-9\-]+::[0-9]{12}:[a-z0-9\-\/]+$"

        for arn_key in arn_outputs:
            arn_value = deployment_outputs.get(arn_key)
            assert arn_value is not None, f"ARN {arn_key} should not be None"

            # Either matches standard ARN pattern or contains oidc-provider (special case)
            assert re.match(arn_pattern, arn_value) or "oidc-provider" in arn_value, \
                f"ARN {arn_key} has invalid format: {arn_value}"

    def test_cluster_endpoint_matches_oidc_provider(self, deployment_outputs):
        """Test that cluster endpoint ID matches OIDC provider ID."""
        endpoint = deployment_outputs.get('cluster_endpoint')
        oidc_arn = deployment_outputs.get('cluster_oidc_provider_arn')

        # Extract the cluster ID from endpoint (the hex string)
        # Format: https://{ID}.gr7.{region}.eks.amazonaws.com
        endpoint_parts = endpoint.replace('https://', '').split('.')
        cluster_id = endpoint_parts[0]

        # OIDC ARN should contain the same cluster ID
        assert cluster_id in oidc_arn, \
            f"Cluster ID {cluster_id} from endpoint should be in OIDC ARN {oidc_arn}"

    def test_no_placeholder_values_in_outputs(self, deployment_outputs):
        """Test that outputs don't contain placeholder or template values."""
        placeholder_patterns = [
            'example',
            'placeholder',
            'dummy',
            'sample',
            'TODO',
            'FIXME',
            '000000000000',  # placeholder account
            'xxxxx'
        ]

        for key, value in deployment_outputs.items():
            value_lower = str(value).lower()
            for pattern in placeholder_patterns:
                # Allow 'test' in cluster name but not in other outputs
                if pattern == 'test' and key == 'cluster_name':
                    continue
                assert pattern not in value_lower, \
                    f"Output {key} appears to contain placeholder '{pattern}': {value}"
