"""Unit tests for TAP Stack VPC infrastructure."""

import json
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Unit tests for the TapStack."""

    def setup_method(self):
        """Set up test fixtures."""
        self.stack_name = "TestStack"
        self.environment_suffix = "test"

    def test_stack_creation(self):
        """Test that the stack can be created successfully."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_vpc_configuration(self):
        """Test VPC is created with correct CIDR block."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check VPC exists with correct CIDR
        assert any(
            resource.get("cidr_block") == "10.0.0.0/16"
            for resource in synthesized.get("resource", {}).get("aws_vpc", {}).values()
        )

    def test_public_subnets_count(self):
        """Test that three public subnets are created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Count public subnets
        public_subnets = [
            resource for resource in synthesized.get("resource", {}).get("aws_subnet", {}).values()
            if "public" in resource.get("tags", {}).get("Type", "").lower()
        ]

        assert len(public_subnets) >= 3

    def test_private_subnets_count(self):
        """Test that three private subnets are created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Count private subnets
        private_subnets = [
            resource for resource in synthesized.get("resource", {}).get("aws_subnet", {}).values()
            if "private" in resource.get("tags", {}).get("Type", "").lower()
        ]

        assert len(private_subnets) >= 3

    def test_subnet_cidr_blocks(self):
        """Test that subnets have correct CIDR blocks."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Expected CIDR blocks
        expected_public_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        expected_private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

        subnet_cidrs = [
            resource.get("cidr_block")
            for resource in synthesized.get("resource", {}).get("aws_subnet", {}).values()
        ]

        # Check all expected CIDRs are present
        for cidr in expected_public_cidrs + expected_private_cidrs:
            assert cidr in subnet_cidrs

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check IGW exists
        assert "aws_internet_gateway" in synthesized.get("resource", {})

    def test_nat_gateway_created(self):
        """Test that NAT Gateway is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check NAT Gateway exists
        assert "aws_nat_gateway" in synthesized.get("resource", {})

        # Check EIP for NAT Gateway exists
        assert "aws_eip" in synthesized.get("resource", {})

    def test_route_tables_created(self):
        """Test that route tables are created for public and private subnets."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check route tables exist
        assert "aws_route_table" in synthesized.get("resource", {})

        # Should have at least 2 route tables (public and private)
        route_tables = synthesized.get("resource", {}).get("aws_route_table", {})
        assert len(route_tables) >= 2

    def test_vpc_flow_logs_configured(self):
        """Test that VPC Flow Logs are configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check Flow Log exists
        assert "aws_flow_log" in synthesized.get("resource", {})

        # Check CloudWatch Log Group exists
        assert "aws_cloudwatch_log_group" in synthesized.get("resource", {})

    def test_flow_logs_retention(self):
        """Test that Flow Logs retention is set to 7 days."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check log group retention
        log_groups = synthesized.get("resource", {}).get("aws_cloudwatch_log_group", {})

        assert any(
            lg.get("retention_in_days") == 7
            for lg in log_groups.values()
        )

    def test_s3_vpc_endpoint_created(self):
        """Test that S3 VPC Endpoint is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check S3 VPC Endpoint exists
        assert "aws_vpc_endpoint" in synthesized.get("resource", {})

    def test_resource_tagging(self):
        """Test that resources are tagged correctly."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check VPC tags
        vpcs = synthesized.get("resource", {}).get("aws_vpc", {})
        for vpc in vpcs.values():
            tags = vpc.get("tags", {})
            assert tags.get("Environment") == "Production"
            assert tags.get("Project") == "PaymentGateway"
            assert "EnvironmentSuffix" in tags

    def test_environment_suffix_in_names(self):
        """Test that environment_suffix is included in resource names."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check VPC name includes suffix
        vpcs = synthesized.get("resource", {}).get("aws_vpc", {})
        for vpc in vpcs.values():
            name = vpc.get("tags", {}).get("Name", "")
            assert self.environment_suffix in name

    def test_outputs_defined(self):
        """Test that all required outputs are defined."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check outputs exist
        outputs = synthesized.get("output", {})

        expected_outputs = [
            "vpc_id",
            "public_subnet_ids",
            "private_subnet_ids",
            "nat_gateway_id",
            "s3_endpoint_id"
        ]

        for output_name in expected_outputs:
            assert output_name in outputs

    def test_iam_role_for_flow_logs(self):
        """Test that IAM role is created for VPC Flow Logs."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized_json = Testing.synth(stack)
        synthesized = json.loads(synthesized_json)

        # Check IAM role exists
        assert "aws_iam_role" in synthesized.get("resource", {})

        # Check IAM policy exists
        assert "aws_iam_role_policy" in synthesized.get("resource", {})
