"""Unit tests for SecondaryStack."""
import pytest
import json
from cdktf import Testing
from lib.stacks.secondary_stack import SecondaryStack


class TestSecondaryStack:
    """Test suite for SecondaryStack infrastructure."""

    @pytest.fixture
    def stack(self):
        """Create a SecondaryStack instance for testing."""
        app = Testing.app()
        return SecondaryStack(
            app,
            "test-secondary",
            region="us-west-2",
            environment_suffix="test",
            primary_bucket_arn="arn:aws:s3:::test-primary-bucket",
            primary_kms_key_arn="arn:aws:kms:us-east-1:123456789012:key/test-key-id"
        )

    @pytest.fixture
    def synthesized(self, stack):
        """Synthesize the stack and return JSON."""
        return Testing.synth(stack)

    def test_stack_creation(self, stack):
        """Test that stack is created successfully."""
        assert stack is not None
        assert stack.region == "us-west-2"
        assert stack.environment_suffix == "test"

    def test_kms_key_created(self, synthesized):
        """Test that KMS key is created with rotation enabled."""
        resources = json.loads(synthesized)
        kms_keys = [
            r for r in resources.get("resource", {}).get("aws_kms_key", {}).values()
        ]
        assert len(kms_keys) > 0
        kms_key = kms_keys[0]
        assert kms_key["enable_key_rotation"] is True

    def test_vpc_created(self, synthesized):
        """Test that VPC is created."""
        resources = json.loads(synthesized)
        vpcs = [
            r for r in resources.get("resource", {}).get("aws_vpc", {}).values()
        ]
        assert len(vpcs) > 0
        vpc = vpcs[0]
        assert vpc["cidr_block"] == "10.1.0.0/16"

    def test_subnets_created(self, synthesized):
        """Test that subnets are created across availability zones."""
        resources = json.loads(synthesized)
        subnets = [
            r for r in resources.get("resource", {}).get("aws_subnet", {}).values()
        ]
        assert len(subnets) == 3

        # Check CIDR blocks
        cidr_blocks = sorted([s["cidr_block"] for s in subnets])
        assert cidr_blocks == ["10.1.0.0/24", "10.1.1.0/24", "10.1.2.0/24"]

    def test_s3_bucket_created(self, synthesized):
        """Test that S3 bucket is created with replication."""
        resources = json.loads(synthesized)
        buckets = [
            r for r in resources.get("resource", {}).get("aws_s3_bucket", {}).values()
        ]
        assert len(buckets) > 0
        bucket = buckets[0]
        assert bucket["bucket"] == "healthcare-medical-docs-secondary-test"
        assert bucket["force_destroy"] is True

    def test_lambda_function_created(self, synthesized):
        """Test that Lambda function is created with correct configuration."""
        resources = json.loads(synthesized)
        functions = [
            r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()
        ]
        assert len(functions) > 0
        function = functions[0]
        assert function["function_name"] == "healthcare-dr-api-secondary-test"
        assert function["memory_size"] == 3072
        assert function["timeout"] == 30

    def test_lambda_no_vpc_config(self, synthesized):
        """Test that Lambda function does not have VPC configuration."""
        resources = json.loads(synthesized)
        functions = [
            r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()
        ]
        assert len(functions) > 0
        function = functions[0]
        assert "vpc_config" not in function or function.get("vpc_config") is None

    def test_lambda_environment_variables(self, synthesized):
        """Test that Lambda environment variables are set correctly."""
        resources = json.loads(synthesized)
        functions = [
            r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()
        ]
        assert len(functions) > 0
        function = functions[0]
        env_vars = function["environment"]["variables"]
        assert env_vars["ENVIRONMENT"] == "production"
        assert env_vars["STAGE"] == "secondary"
        assert "AWS_REGION" not in env_vars

    def test_sns_topic_created(self, synthesized):
        """Test that SNS topic is created."""
        resources = json.loads(synthesized)
        topics = [
            r for r in resources.get("resource", {}).get("aws_sns_topic", {}).values()
        ]
        assert len(topics) > 0
        topic = topics[0]
        assert topic["name"] == "healthcare-dr-failover-secondary-test"

    def test_cloudwatch_dashboard_created(self, synthesized):
        """Test that CloudWatch dashboard is created."""
        resources = json.loads(synthesized)
        dashboards = [
            r for r in resources.get("resource", {}).get("aws_cloudwatch_dashboard", {}).values()
        ]
        assert len(dashboards) > 0

    def test_common_tags_applied(self, synthesized):
        """Test that common tags are applied to resources."""
        resources = json.loads(synthesized)
        vpcs = [r for r in resources.get("resource", {}).get("aws_vpc", {}).values()]
        vpc = vpcs[0]
        assert vpc["tags"]["Environment"] == "Production"
        assert vpc["tags"]["DisasterRecovery"] == "Enabled"
        assert vpc["tags"]["Region"] == "Secondary"

    def test_aws_provider_configured(self, synthesized):
        """Test that AWS provider is configured for us-west-2."""
        resources = json.loads(synthesized)
        providers = resources.get("provider", {}).get("aws", [])
        assert len(providers) > 0
        provider = providers[0]
        assert provider["region"] == "us-west-2"
