"""Integration tests for TapStack using deployment outputs."""
import json
import os
import re
from pathlib import Path

import pytest


class TestDeploymentOutputs:
    """Integration tests that validate deployment outputs from cfn-outputs/flat-outputs.json."""

    @pytest.fixture
    def outputs_file_path(self):
        """Get path to the deployment outputs file."""
        base_path = Path(__file__).parent.parent.parent
        return base_path / "cfn-outputs" / "flat-outputs.json"

    @pytest.fixture
    def deployment_outputs(self, outputs_file_path):
        """Load deployment outputs from JSON file."""
        if not outputs_file_path.exists():
            pytest.skip(f"Deployment outputs file not found: {outputs_file_path}")

        with open(outputs_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Get the first stack's outputs (should only be one)
        if not data:
            pytest.skip("No deployment outputs found in file")

        stack_name = list(data.keys())[0]
        return data[stack_name], stack_name

    @pytest.fixture
    def environment_suffix(self, deployment_outputs):
        """Extract environment suffix from stack name."""
        _, stack_name = deployment_outputs
        # Extract suffix from stack name like "TapStackpr6845" -> "pr6845"
        match = re.search(r'TapStack(.+)$', stack_name)
        return match.group(1) if match else "unknown"


class TestPrimaryRegionOutputs(TestDeploymentOutputs):
    """Test primary region (us-east-1) deployment outputs."""

    def test_primary_vpc_id_exists(self, deployment_outputs):
        """Test that primary VPC ID output exists."""
        outputs, _ = deployment_outputs
        assert "primary_vpc_id_output" in outputs
        assert outputs["primary_vpc_id_output"].startswith("vpc-")

    def test_primary_vpc_id_format(self, deployment_outputs):
        """Test that primary VPC ID has correct format."""
        outputs, _ = deployment_outputs
        vpc_id = outputs["primary_vpc_id_output"]
        assert re.match(r'^vpc-[a-f0-9]{17}$', vpc_id), f"Invalid VPC ID format: {vpc_id}"

    def test_primary_aurora_endpoint_exists(self, deployment_outputs):
        """Test that primary Aurora endpoint output exists."""
        outputs, _ = deployment_outputs
        assert "primary_aurora_endpoint_output" in outputs
        endpoint = outputs["primary_aurora_endpoint_output"]
        assert endpoint.endswith(".us-east-1.rds.amazonaws.com")

    def test_primary_aurora_endpoint_naming(self, deployment_outputs, environment_suffix):
        """Test that primary Aurora endpoint follows naming convention."""
        outputs, _ = deployment_outputs
        endpoint = outputs["primary_aurora_endpoint_output"]
        assert endpoint.startswith(f"primary-aurora-v1-{environment_suffix}")

    def test_primary_lambda_arn_exists(self, deployment_outputs):
        """Test that primary Lambda ARN output exists."""
        outputs, _ = deployment_outputs
        assert "primary_lambda_arn_output" in outputs
        arn = outputs["primary_lambda_arn_output"]
        assert arn.startswith("arn:aws:lambda:us-east-1:")

    def test_primary_lambda_arn_format(self, deployment_outputs, environment_suffix):
        """Test that primary Lambda ARN has correct format and naming."""
        outputs, _ = deployment_outputs
        arn = outputs["primary_lambda_arn_output"]
        pattern = r'^arn:aws:lambda:us-east-1:\d{12}:function:primary-transaction-processor-v1-' + environment_suffix + '$'
        assert re.match(pattern, arn), f"Invalid Lambda ARN format: {arn}"

    def test_primary_s3_logs_bucket_exists(self, deployment_outputs):
        """Test that primary S3 logs bucket output exists."""
        outputs, _ = deployment_outputs
        assert "primary_s3_logs_bucket_output" in outputs

    def test_primary_s3_logs_bucket_naming(self, deployment_outputs, environment_suffix):
        """Test that primary S3 logs bucket follows naming convention."""
        outputs, _ = deployment_outputs
        bucket = outputs["primary_s3_logs_bucket_output"]
        assert bucket == f"transaction-logs-v1-{environment_suffix}"

    def test_primary_s3_docs_bucket_exists(self, deployment_outputs):
        """Test that primary S3 documents bucket output exists."""
        outputs, _ = deployment_outputs
        assert "primary_s3_docs_bucket_output" in outputs

    def test_primary_s3_docs_bucket_naming(self, deployment_outputs, environment_suffix):
        """Test that primary S3 documents bucket follows naming convention."""
        outputs, _ = deployment_outputs
        bucket = outputs["primary_s3_docs_bucket_output"]
        assert bucket == f"transaction-documents-v1-{environment_suffix}"

    def test_primary_sqs_queue_url_exists(self, deployment_outputs):
        """Test that primary SQS queue URL output exists."""
        outputs, _ = deployment_outputs
        assert "primary_sqs_queue_url_output" in outputs

    def test_primary_sqs_queue_url_format(self, deployment_outputs, environment_suffix):
        """Test that primary SQS queue URL has correct format."""
        outputs, _ = deployment_outputs
        url = outputs["primary_sqs_queue_url_output"]
        pattern = r'^https://sqs\.us-east-1\.amazonaws\.com/\d{12}/primary-transactions-v1-' + environment_suffix + '$'
        assert re.match(pattern, url), f"Invalid SQS URL format: {url}"

    def test_primary_alb_dns_exists(self, deployment_outputs):
        """Test that primary ALB DNS output exists."""
        outputs, _ = deployment_outputs
        assert "primary_alb_dns_output" in outputs

    def test_primary_alb_dns_format(self, deployment_outputs, environment_suffix):
        """Test that primary ALB DNS has correct format."""
        outputs, _ = deployment_outputs
        dns = outputs["primary_alb_dns_output"]
        assert dns.startswith(f"primary-alb-v1-{environment_suffix}")
        assert dns.endswith(".us-east-1.elb.amazonaws.com")


class TestDrRegionOutputs(TestDeploymentOutputs):
    """Test DR region (us-east-2) deployment outputs."""

    def test_dr_vpc_id_exists(self, deployment_outputs):
        """Test that DR VPC ID output exists."""
        outputs, _ = deployment_outputs
        assert "dr_vpc_id_output" in outputs
        assert outputs["dr_vpc_id_output"].startswith("vpc-")

    def test_dr_vpc_id_format(self, deployment_outputs):
        """Test that DR VPC ID has correct format."""
        outputs, _ = deployment_outputs
        vpc_id = outputs["dr_vpc_id_output"]
        assert re.match(r'^vpc-[a-f0-9]{17}$', vpc_id), f"Invalid VPC ID format: {vpc_id}"

    def test_dr_vpc_different_from_primary(self, deployment_outputs):
        """Test that DR VPC is different from primary VPC."""
        outputs, _ = deployment_outputs
        primary_vpc = outputs["primary_vpc_id_output"]
        dr_vpc = outputs["dr_vpc_id_output"]
        assert primary_vpc != dr_vpc, "DR VPC should be different from primary VPC"

    def test_dr_aurora_endpoint_exists(self, deployment_outputs):
        """Test that DR Aurora endpoint output exists."""
        outputs, _ = deployment_outputs
        assert "dr_aurora_endpoint_output" in outputs
        endpoint = outputs["dr_aurora_endpoint_output"]
        assert endpoint.endswith(".us-east-2.rds.amazonaws.com")

    def test_dr_aurora_endpoint_naming(self, deployment_outputs, environment_suffix):
        """Test that DR Aurora endpoint follows naming convention."""
        outputs, _ = deployment_outputs
        endpoint = outputs["dr_aurora_endpoint_output"]
        assert endpoint.startswith(f"dr-aurora-v1-{environment_suffix}")

    def test_dr_lambda_arn_exists(self, deployment_outputs):
        """Test that DR Lambda ARN output exists."""
        outputs, _ = deployment_outputs
        assert "dr_lambda_arn_output" in outputs
        arn = outputs["dr_lambda_arn_output"]
        assert arn.startswith("arn:aws:lambda:us-east-2:")

    def test_dr_lambda_arn_format(self, deployment_outputs, environment_suffix):
        """Test that DR Lambda ARN has correct format and naming."""
        outputs, _ = deployment_outputs
        arn = outputs["dr_lambda_arn_output"]
        pattern = r'^arn:aws:lambda:us-east-2:\d{12}:function:dr-transaction-processor-v1-' + environment_suffix + '$'
        assert re.match(pattern, arn), f"Invalid Lambda ARN format: {arn}"

    def test_dr_s3_logs_bucket_exists(self, deployment_outputs):
        """Test that DR S3 logs bucket output exists."""
        outputs, _ = deployment_outputs
        assert "dr_s3_logs_bucket_output" in outputs

    def test_dr_s3_logs_bucket_naming(self, deployment_outputs, environment_suffix):
        """Test that DR S3 logs bucket follows naming convention."""
        outputs, _ = deployment_outputs
        bucket = outputs["dr_s3_logs_bucket_output"]
        assert bucket == f"transaction-logs-dr-v1-{environment_suffix}"

    def test_dr_s3_docs_bucket_exists(self, deployment_outputs):
        """Test that DR S3 documents bucket output exists."""
        outputs, _ = deployment_outputs
        assert "dr_s3_docs_bucket_output" in outputs

    def test_dr_s3_docs_bucket_naming(self, deployment_outputs, environment_suffix):
        """Test that DR S3 documents bucket follows naming convention."""
        outputs, _ = deployment_outputs
        bucket = outputs["dr_s3_docs_bucket_output"]
        assert bucket == f"transaction-documents-dr-v1-{environment_suffix}"

    def test_dr_sqs_queue_url_exists(self, deployment_outputs):
        """Test that DR SQS queue URL output exists."""
        outputs, _ = deployment_outputs
        assert "dr_sqs_queue_url_output" in outputs

    def test_dr_sqs_queue_url_format(self, deployment_outputs, environment_suffix):
        """Test that DR SQS queue URL has correct format."""
        outputs, _ = deployment_outputs
        url = outputs["dr_sqs_queue_url_output"]
        pattern = r'^https://sqs\.us-east-2\.amazonaws\.com/\d{12}/dr-transactions-v1-' + environment_suffix + '$'
        assert re.match(pattern, url), f"Invalid SQS URL format: {url}"

    def test_dr_alb_dns_exists(self, deployment_outputs):
        """Test that DR ALB DNS output exists."""
        outputs, _ = deployment_outputs
        assert "dr_alb_dns_output" in outputs

    def test_dr_alb_dns_format(self, deployment_outputs, environment_suffix):
        """Test that DR ALB DNS has correct format."""
        outputs, _ = deployment_outputs
        dns = outputs["dr_alb_dns_output"]
        assert dns.startswith(f"dr-alb-v1-{environment_suffix}")
        assert dns.endswith(".us-east-2.elb.amazonaws.com")


class TestGlobalResourceOutputs(TestDeploymentOutputs):
    """Test global resource deployment outputs."""

    def test_global_cluster_id_exists(self, deployment_outputs):
        """Test that global Aurora cluster ID output exists."""
        outputs, _ = deployment_outputs
        assert "global_cluster_id_output" in outputs

    def test_global_cluster_id_naming(self, deployment_outputs, environment_suffix):
        """Test that global Aurora cluster ID follows naming convention."""
        outputs, _ = deployment_outputs
        cluster_id = outputs["global_cluster_id_output"]
        assert cluster_id == f"global-aurora-v1-{environment_suffix}"

    def test_dynamodb_table_name_exists(self, deployment_outputs):
        """Test that DynamoDB table name output exists."""
        outputs, _ = deployment_outputs
        assert "dynamodb_table_name_output" in outputs

    def test_dynamodb_table_name_naming(self, deployment_outputs, environment_suffix):
        """Test that DynamoDB table name follows naming convention."""
        outputs, _ = deployment_outputs
        table_name = outputs["dynamodb_table_name_output"]
        assert table_name == f"session-state-v1-{environment_suffix}"

    def test_route53_zone_id_exists(self, deployment_outputs):
        """Test that Route53 zone ID output exists."""
        outputs, _ = deployment_outputs
        assert "route53_zone_id_output" in outputs

    def test_route53_zone_id_format(self, deployment_outputs):
        """Test that Route53 zone ID has correct format."""
        outputs, _ = deployment_outputs
        zone_id = outputs["route53_zone_id_output"]
        assert re.match(r'^Z[A-Z0-9]+$', zone_id), f"Invalid Route53 zone ID format: {zone_id}"

    def test_route53_nameservers_exists(self, deployment_outputs):
        """Test that Route53 nameservers output exists."""
        outputs, _ = deployment_outputs
        assert "route53_nameservers_output" in outputs

    def test_route53_nameservers_format(self, deployment_outputs):
        """Test that Route53 nameservers have correct format."""
        outputs, _ = deployment_outputs
        nameservers = outputs["route53_nameservers_output"]
        # Should be comma-separated list of nameservers
        ns_list = nameservers.split(',')
        assert len(ns_list) == 4, "Should have 4 nameservers"
        for ns in ns_list:
            assert ns.endswith('.org') or ns.endswith('.com') or ns.endswith('.net') or ns.endswith('.co.uk')
            assert 'awsdns' in ns


class TestMultiRegionConsistency(TestDeploymentOutputs):
    """Test multi-region consistency and disaster recovery setup."""

    def test_same_environment_suffix_across_regions(self, deployment_outputs, environment_suffix):
        """Test that the same environment suffix is used across all resources."""
        outputs, _ = deployment_outputs

        # Check primary resources
        assert environment_suffix in outputs["primary_lambda_arn_output"]
        assert environment_suffix in outputs["primary_s3_logs_bucket_output"]
        assert environment_suffix in outputs["primary_aurora_endpoint_output"]

        # Check DR resources
        assert environment_suffix in outputs["dr_lambda_arn_output"]
        assert environment_suffix in outputs["dr_s3_logs_bucket_output"]
        assert environment_suffix in outputs["dr_aurora_endpoint_output"]

        # Check global resources
        assert environment_suffix in outputs["global_cluster_id_output"]
        assert environment_suffix in outputs["dynamodb_table_name_output"]

    def test_account_id_consistency(self, deployment_outputs):
        """Test that the same AWS account ID is used across all ARNs and URLs."""
        outputs, _ = deployment_outputs

        # Extract account IDs from various resources
        primary_lambda_match = re.search(r'arn:aws:lambda:us-east-1:(\d{12}):', outputs["primary_lambda_arn_output"])
        dr_lambda_match = re.search(r'arn:aws:lambda:us-east-2:(\d{12}):', outputs["dr_lambda_arn_output"])
        primary_sqs_match = re.search(r'amazonaws\.com/(\d{12})/', outputs["primary_sqs_queue_url_output"])
        dr_sqs_match = re.search(r'amazonaws\.com/(\d{12})/', outputs["dr_sqs_queue_url_output"])

        assert primary_lambda_match and dr_lambda_match and primary_sqs_match and dr_sqs_match

        account_id = primary_lambda_match.group(1)
        assert dr_lambda_match.group(1) == account_id, "DR Lambda should use same account ID"
        assert primary_sqs_match.group(1) == account_id, "Primary SQS should use same account ID"
        assert dr_sqs_match.group(1) == account_id, "DR SQS should use same account ID"

    def test_primary_and_dr_resources_paired(self, deployment_outputs):
        """Test that primary and DR resources are properly paired."""
        outputs, _ = deployment_outputs

        # Both regions should have matching resource types
        primary_resources = [k for k in outputs.keys() if k.startswith("primary_")]
        dr_resources = [k for k in outputs.keys() if k.startswith("dr_")]

        # Check that DR has corresponding resources for primary
        for primary_key in primary_resources:
            dr_key = primary_key.replace("primary_", "dr_")
            assert dr_key in outputs, f"Missing DR counterpart for {primary_key}"

    def test_s3_bucket_naming_consistency(self, deployment_outputs, environment_suffix):
        """Test that S3 bucket naming is consistent between primary and DR."""
        outputs, _ = deployment_outputs

        # Logs buckets should follow pattern
        assert outputs["primary_s3_logs_bucket_output"] == f"transaction-logs-v1-{environment_suffix}"
        assert outputs["dr_s3_logs_bucket_output"] == f"transaction-logs-dr-v1-{environment_suffix}"

        # Docs buckets should follow pattern
        assert outputs["primary_s3_docs_bucket_output"] == f"transaction-documents-v1-{environment_suffix}"
        assert outputs["dr_s3_docs_bucket_output"] == f"transaction-documents-dr-v1-{environment_suffix}"

    def test_lambda_function_naming_consistency(self, deployment_outputs, environment_suffix):
        """Test that Lambda function naming is consistent between primary and DR."""
        outputs, _ = deployment_outputs

        primary_lambda = outputs["primary_lambda_arn_output"]
        dr_lambda = outputs["dr_lambda_arn_output"]

        assert f"primary-transaction-processor-v1-{environment_suffix}" in primary_lambda
        assert f"dr-transaction-processor-v1-{environment_suffix}" in dr_lambda


class TestOutputCompleteness(TestDeploymentOutputs):
    """Test that all expected outputs are present."""

    def test_all_required_outputs_present(self, deployment_outputs):
        """Test that all required outputs are present in the deployment."""
        outputs, _ = deployment_outputs

        required_outputs = [
            # Primary region outputs
            "primary_vpc_id_output",
            "primary_aurora_endpoint_output",
            "primary_lambda_arn_output",
            "primary_s3_logs_bucket_output",
            "primary_s3_docs_bucket_output",
            "primary_sqs_queue_url_output",
            "primary_alb_dns_output",
            # DR region outputs
            "dr_vpc_id_output",
            "dr_aurora_endpoint_output",
            "dr_lambda_arn_output",
            "dr_s3_logs_bucket_output",
            "dr_s3_docs_bucket_output",
            "dr_sqs_queue_url_output",
            "dr_alb_dns_output",
            # Global outputs
            "global_cluster_id_output",
            "dynamodb_table_name_output",
            "route53_zone_id_output",
            "route53_nameservers_output",
        ]

        for output in required_outputs:
            assert output in outputs, f"Missing required output: {output}"

    def test_no_empty_outputs(self, deployment_outputs):
        """Test that no outputs are empty or null."""
        outputs, _ = deployment_outputs

        for key, value in outputs.items():
            assert value is not None, f"Output {key} is None"
            assert value != "", f"Output {key} is empty string"
            assert len(value) > 0, f"Output {key} has no content"


class TestResourceRegionPlacement(TestDeploymentOutputs):
    """Test that resources are deployed in the correct regions."""

    def test_primary_resources_in_us_east_1(self, deployment_outputs):
        """Test that all primary resources are in us-east-1."""
        outputs, _ = deployment_outputs

        # Check regional identifiers
        assert "us-east-1" in outputs["primary_aurora_endpoint_output"]
        assert "us-east-1" in outputs["primary_lambda_arn_output"]
        assert "us-east-1" in outputs["primary_sqs_queue_url_output"]
        assert "us-east-1" in outputs["primary_alb_dns_output"]

    def test_dr_resources_in_us_east_2(self, deployment_outputs):
        """Test that all DR resources are in us-east-2."""
        outputs, _ = deployment_outputs

        # Check regional identifiers
        assert "us-east-2" in outputs["dr_aurora_endpoint_output"]
        assert "us-east-2" in outputs["dr_lambda_arn_output"]
        assert "us-east-2" in outputs["dr_sqs_queue_url_output"]
        assert "us-east-2" in outputs["dr_alb_dns_output"]

    def test_no_region_mixing(self, deployment_outputs):
        """Test that primary resources don't reference us-east-2 and vice versa."""
        outputs, _ = deployment_outputs

        # Primary resources should not have us-east-2
        assert "us-east-2" not in outputs["primary_aurora_endpoint_output"]
        assert "us-east-2" not in outputs["primary_lambda_arn_output"]
        assert "us-east-2" not in outputs["primary_sqs_queue_url_output"]
        assert "us-east-2" not in outputs["primary_alb_dns_output"]

        # DR resources should not have us-east-1
        assert "us-east-1" not in outputs["dr_aurora_endpoint_output"]
        assert "us-east-1" not in outputs["dr_lambda_arn_output"]
        assert "us-east-1" not in outputs["dr_sqs_queue_url_output"]
        assert "us-east-1" not in outputs["dr_alb_dns_output"]
