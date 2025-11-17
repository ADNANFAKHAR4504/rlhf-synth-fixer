"""Integration tests for TapStack deployment outputs.

These tests validate the deployed infrastructure by reading outputs from
cfn-outputs/flat-outputs.json without requiring AWS authentication.
"""

import json
import os
import re
import unittest

from pytest import mark

# Load deployment outputs from cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Deployment Outputs")
class TestTapStackOutputs(unittest.TestCase):
    """Test cases for validating TapStack deployment outputs."""

    def setUp(self):
        """Verify outputs file exists before each test."""
        if not flat_outputs:
            self.skipTest("cfn-outputs/flat-outputs.json not found. Deploy stack first.")

    @mark.it("Has cluster name output")
    def test_cluster_name_output_exists(self):
        """Test that cluster name is present in outputs."""
        # ARRANGE & ACT
        cluster_name = self._get_output_value("ClusterName")

        # ASSERT
        self.assertIsNotNone(cluster_name, "ClusterName output not found")
        self.assertTrue(
            cluster_name.startswith("payment-eks-"),
            f"Cluster name '{cluster_name}' doesn't follow naming convention"
        )

    @mark.it("Has valid cluster endpoint output")
    def test_cluster_endpoint_output_valid(self):
        """Test that cluster endpoint is a valid HTTPS URL."""
        # ARRANGE & ACT
        endpoint = self._get_output_value("ClusterEndpoint")

        # ASSERT
        self.assertIsNotNone(endpoint, "ClusterEndpoint output not found")
        self.assertTrue(
            endpoint.startswith("https://"),
            f"Cluster endpoint '{endpoint}' is not HTTPS"
        )
        self.assertIn(
            ".eks.",
            endpoint,
            f"Cluster endpoint '{endpoint}' doesn't appear to be an EKS endpoint"
        )

    @mark.it("Has OIDC issuer URL output")
    def test_oidc_issuer_url_output_valid(self):
        """Test that OIDC issuer URL is present and valid."""
        # ARRANGE & ACT
        oidc_issuer = self._get_output_value("OIDCIssuerURL")

        # ASSERT
        self.assertIsNotNone(oidc_issuer, "OIDCIssuerURL output not found")
        self.assertTrue(
            oidc_issuer.startswith("https://oidc.eks."),
            f"OIDC issuer '{oidc_issuer}' doesn't match EKS OIDC format"
        )

    @mark.it("Has kubectl config command output")
    def test_kubectl_config_command_output(self):
        """Test that kubectl configuration command is present and valid."""
        # ARRANGE & ACT
        kubectl_cmd = self._get_output_value("KubectlConfigCommand")

        # ASSERT
        self.assertIsNotNone(kubectl_cmd, "KubectlConfigCommand output not found")
        self.assertIn("aws eks update-kubeconfig", kubectl_cmd)
        self.assertIn("--region", kubectl_cmd)
        self.assertIn("--name", kubectl_cmd)

    @mark.it("Has cluster security group ID output")
    def test_cluster_security_group_id_output(self):
        """Test that cluster security group ID is present and valid."""
        # ARRANGE & ACT
        sg_id = self._get_output_value("ClusterSecurityGroupId")

        # ASSERT
        self.assertIsNotNone(sg_id, "ClusterSecurityGroupId output not found")
        self.assertTrue(
            sg_id.startswith("sg-"),
            f"Security group ID '{sg_id}' doesn't follow AWS format"
        )
        # Security group IDs can be 20 or 21 characters (sg- prefix + 17 or 18 hex chars)
        self.assertIn(len(sg_id), [20, 21], f"Security group ID '{sg_id}' has invalid length")

    @mark.it("Has GitHub OIDC provider ARN output")
    def test_github_oidc_provider_arn_output(self):
        """Test that GitHub OIDC provider ARN is present and valid."""
        # ARRANGE & ACT
        github_oidc_arn = self._get_output_value("GitHubOIDCProviderArn")

        # ASSERT
        self.assertIsNotNone(github_oidc_arn, "GitHubOIDCProviderArn output not found")
        self.assertTrue(
            github_oidc_arn.startswith("arn:aws:iam::"),
            f"GitHub OIDC ARN '{github_oidc_arn}' doesn't follow AWS ARN format"
        )
        self.assertIn(
            "oidc-provider/token.actions.githubusercontent.com",
            github_oidc_arn,
            f"GitHub OIDC ARN '{github_oidc_arn}' doesn't reference GitHub"
        )

    @mark.it("Has VPC ID output")
    def test_vpc_id_output_valid(self):
        """Test that VPC ID is present and valid."""
        # ARRANGE & ACT
        vpc_id = self._get_output_value("VPCId")

        # ASSERT
        self.assertIsNotNone(vpc_id, "VPCId output not found")
        self.assertTrue(
            vpc_id.startswith("vpc-"),
            f"VPC ID '{vpc_id}' doesn't follow AWS format"
        )
        self.assertEqual(len(vpc_id), 21, f"VPC ID '{vpc_id}' has invalid length")

    @mark.it("Has KMS key ARN output")
    def test_kms_key_arn_output_valid(self):
        """Test that KMS key ARN is present and valid."""
        # ARRANGE & ACT
        kms_arn = self._get_output_value("KMSKeyArn")

        # ASSERT
        self.assertIsNotNone(kms_arn, "KMSKeyArn output not found")
        self.assertTrue(
            kms_arn.startswith("arn:aws:kms:"),
            f"KMS ARN '{kms_arn}' doesn't follow AWS ARN format"
        )
        self.assertIn(
            ":key/",
            kms_arn,
            f"KMS ARN '{kms_arn}' doesn't contain key ID"
        )

    @mark.it("Has ALB controller role ARN output")
    def test_alb_controller_role_arn_output(self):
        """Test that ALB controller role ARN is present and valid."""
        # ARRANGE & ACT
        alb_role_arn = self._get_output_value("ALBControllerRoleArn")

        # ASSERT
        self.assertIsNotNone(alb_role_arn, "ALBControllerRoleArn output not found")
        self.assertTrue(
            alb_role_arn.startswith("arn:aws:iam::"),
            f"ALB controller role ARN '{alb_role_arn}' doesn't follow AWS ARN format"
        )
        self.assertIn(
            ":role/",
            alb_role_arn,
            f"ALB controller role ARN '{alb_role_arn}' doesn't contain role"
        )

    @mark.it("Environment suffix is consistent across outputs")
    def test_environment_suffix_consistency(self):
        """Test that environment suffix is consistent across all outputs."""
        # ARRANGE & ACT
        cluster_name = self._get_output_value("ClusterName")

        # ASSERT
        self.assertIsNotNone(cluster_name, "ClusterName not found")

        # Extract environment suffix from cluster name
        env_suffix = cluster_name.split("-")[-1]

        # Check that suffix appears in output keys
        suffix_count = sum(1 for key in flat_outputs.keys() if env_suffix in key)
        self.assertGreater(
            suffix_count,
            5,
            f"Environment suffix '{env_suffix}' should appear in multiple output keys"
        )

    @mark.it("All resource ARNs use same AWS region")
    def test_all_resources_in_same_region(self):
        """Test that all AWS resources are deployed in the same region."""
        # ARRANGE
        regions = set()

        # ACT - Extract regions from ARNs
        for key, value in flat_outputs.items():
            if "arn:aws:" in str(value):
                # ARN format: arn:aws:service:region:account:resource
                parts = value.split(":")
                if len(parts) >= 4:
                    region = parts[3]
                    if region:  # Some ARNs don't have region (like IAM)
                        regions.add(region)

        # ASSERT
        self.assertLessEqual(
            len(regions),
            1,
            f"Resources deployed across multiple regions: {regions}"
        )

    @mark.it("All resource ARNs use same AWS account")
    def test_all_resources_in_same_account(self):
        """Test that all AWS resources belong to the same account."""
        # ARRANGE
        accounts = set()

        # ACT - Extract account IDs from ARNs
        for key, value in flat_outputs.items():
            if "arn:aws:" in str(value):
                # ARN format: arn:aws:service:region:account:resource
                parts = value.split(":")
                if len(parts) >= 5:
                    account = parts[4]
                    if account and account.isdigit():
                        accounts.add(account)

        # ASSERT
        self.assertEqual(
            len(accounts),
            1,
            f"Resources deployed across multiple accounts: {accounts}"
        )

    @mark.it("Lambda function ARNs are valid")
    def test_lambda_function_arns_valid(self):
        """Test that Lambda function ARNs follow correct format."""
        # ARRANGE & ACT
        # Lambda ARNs may not have "lambda" in key name (e.g., Kubectl, ClusterResource)
        lambda_arns = [
            value for key, value in flat_outputs.items()
            if "arn:aws:lambda:" in str(value)
        ]

        # ASSERT
        self.assertGreater(
            len(lambda_arns),
            0,
            "No Lambda function ARNs found in outputs"
        )

        for arn in lambda_arns:
            self.assertTrue(
                arn.startswith("arn:aws:lambda:"),
                f"Lambda ARN '{arn}' doesn't follow AWS format"
            )
            self.assertIn(
                ":function:",
                arn,
                f"Lambda ARN '{arn}' doesn't contain function reference"
            )

    @mark.it("IAM role ARNs are valid")
    def test_iam_role_arns_valid(self):
        """Test that IAM role ARNs follow correct format."""
        # ARRANGE & ACT
        iam_arns = [
            value for key, value in flat_outputs.items()
            if "role" in key.lower() and "arn:aws:iam:" in str(value)
        ]

        # ASSERT
        self.assertGreater(
            len(iam_arns),
            0,
            "No IAM role ARNs found in outputs"
        )

        for arn in iam_arns:
            self.assertTrue(
                arn.startswith("arn:aws:iam::"),
                f"IAM role ARN '{arn}' doesn't follow AWS format"
            )
            self.assertIn(
                ":role/",
                arn,
                f"IAM role ARN '{arn}' doesn't contain role reference"
            )

    @mark.it("Output keys follow naming convention")
    def test_output_keys_follow_convention(self):
        """Test that output keys follow PascalCase naming convention."""
        # ARRANGE
        invalid_keys = []

        # ACT
        for key in flat_outputs.keys():
            # Check if key follows PascalCase or contains valid separators
            if not self._is_valid_cfn_output_key(key):
                invalid_keys.append(key)

        # ASSERT
        self.assertEqual(
            len(invalid_keys),
            0,
            f"Invalid output key names found: {invalid_keys}"
        )

    @mark.it("No sensitive data in output values")
    def test_no_sensitive_data_in_outputs(self):
        """Test that outputs don't contain sensitive data patterns."""
        # ARRANGE
        sensitive_patterns = [
            r'password',
            r'secret',
            r'key\s*=\s*["\']?\w+',
            r'token\s*=\s*["\']?\w+',
            r'AKIA[0-9A-Z]{16}',  # AWS Access Key pattern
        ]

        violations = []

        # ACT
        for key, value in flat_outputs.items():
            value_str = str(value).lower()
            for pattern in sensitive_patterns:
                if re.search(pattern, value_str, re.IGNORECASE):
                    violations.append(f"{key}: matches pattern '{pattern}'")

        # ASSERT
        self.assertEqual(
            len(violations),
            0,
            f"Potential sensitive data found in outputs: {violations}"
        )

    @mark.it("Has required minimum outputs")
    def test_has_minimum_required_outputs(self):
        """Test that stack has minimum required outputs."""
        # ARRANGE
        required_output_patterns = [
            "ClusterName",
            "ClusterEndpoint",
            "OIDCIssuer",
            "VPCId",
            "KMSKey",
            "GitHubOIDC",
        ]

        missing_outputs = []

        # ACT
        for pattern in required_output_patterns:
            found = any(pattern in key for key in flat_outputs.keys())
            if not found:
                missing_outputs.append(pattern)

        # ASSERT
        self.assertEqual(
            len(missing_outputs),
            0,
            f"Missing required outputs: {missing_outputs}"
        )

    @mark.it("Output values are not empty")
    def test_output_values_not_empty(self):
        """Test that all output values are non-empty."""
        # ARRANGE
        empty_outputs = []

        # ACT
        for key, value in flat_outputs.items():
            if not value or (isinstance(value, str) and not value.strip()):
                empty_outputs.append(key)

        # ASSERT
        self.assertEqual(
            len(empty_outputs),
            0,
            f"Empty output values found: {empty_outputs}"
        )

    @mark.it("Output count is reasonable")
    def test_output_count_is_reasonable(self):
        """Test that stack has a reasonable number of outputs."""
        # ARRANGE & ACT
        output_count = len(flat_outputs)

        # ASSERT
        self.assertGreaterEqual(
            output_count,
            10,
            f"Expected at least 10 outputs, found {output_count}"
        )
        self.assertLessEqual(
            output_count,
            50,
            f"Too many outputs ({output_count}), might indicate an issue"
        )

    @mark.it("Cluster name matches kubectl command")
    def test_cluster_name_matches_kubectl_command(self):
        """Test that cluster name in outputs matches kubectl config command."""
        # ARRANGE
        cluster_name = self._get_output_value("ClusterName")
        kubectl_cmd = self._get_output_value("KubectlConfigCommand")

        # ASSERT
        self.assertIsNotNone(cluster_name, "ClusterName not found")
        self.assertIsNotNone(kubectl_cmd, "KubectlConfigCommand not found")
        self.assertIn(
            cluster_name,
            kubectl_cmd,
            f"Cluster name '{cluster_name}' not found in kubectl command '{kubectl_cmd}'"
        )

    @mark.it("KMS key ID can be extracted from ARN")
    def test_kms_key_id_extractable(self):
        """Test that KMS key ID can be extracted from KMS ARN."""
        # ARRANGE
        kms_arn = self._get_output_value("KMSKeyArn")

        # ASSERT
        self.assertIsNotNone(kms_arn, "KMSKeyArn not found")

        # ACT - Extract key ID
        key_id = kms_arn.split("/")[-1] if "/" in kms_arn else None

        # ASSERT
        self.assertIsNotNone(key_id, f"Could not extract key ID from ARN '{kms_arn}'")
        self.assertTrue(
            len(key_id) == 36 and "-" in key_id,  # UUID format
            f"Extracted key ID '{key_id}' doesn't look like a UUID"
        )

    @mark.it("Region can be extracted from endpoint URL")
    def test_region_extractable_from_endpoint(self):
        """Test that AWS region can be extracted from cluster endpoint."""
        # ARRANGE
        endpoint = self._get_output_value("ClusterEndpoint")

        # ASSERT
        self.assertIsNotNone(endpoint, "ClusterEndpoint not found")

        # ACT - Extract region from endpoint
        # Format: https://<id>.gr7.us-east-1.eks.amazonaws.com
        region_match = re.search(r'\.([a-z]{2}-[a-z]+-\d+)\.eks\.', endpoint)

        # ASSERT
        self.assertIsNotNone(
            region_match,
            f"Could not extract region from endpoint '{endpoint}'"
        )
        if region_match:
            region = region_match.group(1)
            self.assertTrue(
                region.startswith(('us-', 'eu-', 'ap-', 'ca-', 'sa-', 'af-', 'me-')),
                f"Extracted region '{region}' doesn't look like an AWS region"
            )

    # Helper methods
    def _get_output_value(self, key_pattern):
        """Get output value by key pattern (case-insensitive partial match)."""
        for key, value in flat_outputs.items():
            if key_pattern.lower() in key.lower():
                return value
        return None

    def _is_valid_cfn_output_key(self, key):
        """Check if output key follows valid CloudFormation output naming."""
        # Allow alphanumeric, hyphens, and must start with letter
        return bool(re.match(r'^[A-Za-z][A-Za-z0-9-]*$', key))


if __name__ == "__main__":
    unittest.main()
