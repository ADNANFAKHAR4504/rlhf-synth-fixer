"""Integration tests for ECR resources."""
import json
import os
import boto3
import pytest
from datetime import datetime

# Load outputs from deployment
outputs_file = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "cfn-outputs",
    "flat-outputs.json"
)

if os.path.exists(outputs_file):
    with open(outputs_file, "r", encoding="utf-8") as f:
        outputs = json.load(f)
else:
    outputs = {}


class TestECRIntegration:
    """Integration tests for ECR resources."""

    def test_ecr_repository_exists(self):
        """Test that ECR repository was created."""
        ecr = boto3.client("ecr", region_name="us-east-1")

        repository_name = outputs.get("ECRRepositoryName")
        if not repository_name:
            pytest.skip("ECR repository name not found in outputs")

        # Describe the repository
        response = ecr.describe_repositories(repositoryNames=[repository_name])

        assert len(response["repositories"]) == 1
        repository = response["repositories"][0]
        assert repository["repositoryName"] == repository_name
        assert repository["imageScanningConfiguration"]["scanOnPush"] is True

    def test_ecr_lifecycle_policy_exists(self):
        """Test that lifecycle policy is configured."""
        ecr = boto3.client("ecr", region_name="us-east-1")

        repository_name = outputs.get("ECRRepositoryName")
        if not repository_name:
            pytest.skip("ECR repository name not found in outputs")

        # Get lifecycle policy
        response = ecr.get_lifecycle_policy(repositoryName=repository_name)

        assert "lifecyclePolicyText" in response
        policy = json.loads(response["lifecyclePolicyText"])
        assert len(policy["rules"]) == 1
        assert policy["rules"][0]["selection"]["countNumber"] == 30

    def test_ecr_scanning_configuration(self):
        """Test that scanning is configured."""
        ecr = boto3.client("ecr", region_name="us-east-1")

        # Get registry scanning configuration
        response = ecr.get_registry_scanning_configuration()

        # Accept both BASIC and ENHANCED scanning
        scan_type = response["scanningConfiguration"]["scanType"]
        assert scan_type in ["BASIC", "ENHANCED"], f"Expected BASIC or ENHANCED, got {scan_type}"

        # If ENHANCED, check for rules
        if scan_type == "ENHANCED":
            rules = response["scanningConfiguration"].get("rules", [])
            assert len(rules) > 0, "ENHANCED scanning should have rules configured"

            # Check for continuous scanning
            has_continuous_scan = any(
                rule.get("scanFrequency") == "CONTINUOUS_SCAN"
                for rule in rules
            )
            assert has_continuous_scan, "No continuous scanning rule found"
