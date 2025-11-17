"""Unit tests for TAP Stack."""

import pytest
import json
import os
import tempfile
from cdktf import Testing
from lib.tap_stack import TapStack


def load_synth_json(stack):
    """Load synthesized JSON from CDKTF Testing.synth output."""
    synth_output = Testing.synth(stack, run_validations=False)
    # synth_output is a JSON string, parse it directly
    return json.loads(synth_output)


class TestTapStack:
    """Test cases for TAP Stack infrastructure."""

    def test_stack_creation(self):
        """Test that the stack can be created without errors."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        assert stack is not None

    def test_stack_synthesis(self):
        """Test that the stack synthesizes correctly."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth_output = Testing.synth(stack, run_validations=False)
        assert synth_output is not None
        assert len(synth_output) > 0

    def test_stack_has_aws_provider(self):
        """Test that AWS provider is configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        # Check provider configuration
        assert "provider" in synth
        assert "aws" in synth["provider"]
        assert synth["provider"]["aws"][0]["region"] == "us-east-1"

    def test_stack_has_backend(self):
        """Test that S3 backend is configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        # Check backend configuration
        assert "terraform" in synth
        assert "backend" in synth["terraform"]
        assert "s3" in synth["terraform"]["backend"]
        backend_config = synth["terraform"]["backend"]["s3"]
        assert backend_config["encrypt"] is True

    def test_stack_outputs(self):
        """Test that required outputs are present."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        # Check outputs
        assert "output" in synth
        assert "api_gateway_endpoint" in synth["output"]
        assert "data_bucket_name" in synth["output"]
        assert "dynamodb_table_name" in synth["output"]
        assert "kms_key_arn" in synth["output"]
        assert "cloudwatch_dashboard_url" in synth["output"]

    def test_vpc_configuration(self):
        """Test VPC resources are created."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        # Check VPC exists
        resources = synth.get("resource", {})
        assert "aws_vpc" in resources

        # Check VPC configuration
        vpc = list(resources["aws_vpc"].values())[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_subnets_configuration(self):
        """Test subnet resources are created correctly."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_subnet" in resources

        # Should have 4 subnets (2 public, 2 private)
        subnets = resources["aws_subnet"]
        assert len(subnets) >= 4

    def test_nat_gateway_exists(self):
        """Test NAT Gateway is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_nat_gateway" in resources

        # Should have 1 NAT Gateway (cost optimization)
        nat_gateways = resources["aws_nat_gateway"]
        assert len(nat_gateways) == 1

    def test_internet_gateway_exists(self):
        """Test Internet Gateway is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_internet_gateway" in resources

    def test_vpc_endpoints(self):
        """Test VPC endpoints for S3 and DynamoDB."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_vpc_endpoint" in resources

        # Should have at least 2 endpoints (S3 and DynamoDB)
        endpoints = resources["aws_vpc_endpoint"]
        assert len(endpoints) >= 2

    def test_security_groups(self):
        """Test security groups are configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_security_group" in resources

        # Should have at least 2 SGs (Lambda and ALB)
        security_groups = resources["aws_security_group"]
        assert len(security_groups) >= 2

    def test_s3_bucket_configuration(self):
        """Test S3 buckets are created with proper configuration."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_s3_bucket" in resources

        # Check encryption is configured
        assert "aws_s3_bucket_server_side_encryption_configuration" in resources

        # Check versioning is enabled
        assert "aws_s3_bucket_versioning" in resources

        # Check public access is blocked
        assert "aws_s3_bucket_public_access_block" in resources

    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table is configured properly."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_dynamodb_table" in resources

        # Check table configuration
        table = list(resources["aws_dynamodb_table"].values())[0]
        assert table["billing_mode"] == "PAY_PER_REQUEST"
        assert table["hash_key"] == "patient_id"
        assert table["point_in_time_recovery"]["enabled"] is True

    def test_kms_key_configuration(self):
        """Test KMS key is created with rotation enabled."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_kms_key" in resources

        kms_key = list(resources["aws_kms_key"].values())[0]
        assert kms_key["enable_key_rotation"] is True

    def test_lambda_functions(self):
        """Test Lambda functions are created."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_lambda_function" in resources

        # Should have 3 Lambda functions
        functions = resources["aws_lambda_function"]
        assert len(functions) >= 3

    def test_lambda_iam_role(self):
        """Test Lambda execution role is configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_iam_role" in resources

        # Check role policy attachments
        assert "aws_iam_role_policy_attachment" in resources

    def test_api_gateway(self):
        """Test API Gateway is configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_api_gateway_rest_api" in resources

    def test_cloudwatch_log_groups(self):
        """Test CloudWatch log groups are created."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_cloudwatch_log_group" in resources

        # Check log groups have retention
        log_groups = resources["aws_cloudwatch_log_group"]
        for lg in log_groups.values():
            assert lg.get("retention_in_days") == 7

    def test_cloudtrail_configuration(self):
        """Test CloudTrail is configured for audit logging."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_cloudtrail" in resources

        trail = list(resources["aws_cloudtrail"].values())[0]
        assert trail["is_multi_region_trail"] is True
        assert trail["enable_logging"] is True

    def test_flow_logs(self):
        """Test VPC Flow Logs are enabled."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_flow_log" in resources

        flow_log = list(resources["aws_flow_log"].values())[0]
        assert flow_log["traffic_type"] == "ALL"

    def test_route_tables(self):
        """Test route tables are configured properly."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = load_synth_json(stack)

        resources = synth.get("resource", {})
        assert "aws_route_table" in resources

        # Should have public and private route tables
        route_tables = resources["aws_route_table"]
        assert len(route_tables) >= 2
