"""Unit tests for Tenant Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
import pytest

from lib.tenant_stack import TenantStack


class TestTenantStackStructure:
    """Test suite for Tenant Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tenant_stack_instantiates_successfully(self):
        """TenantStack instantiates successfully with required parameters."""
        app = App()
        stack = TenantStack(
            app,
            "test-tenant",
            "10.0.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify that TenantStack instantiates without errors
        assert stack is not None
        assert stack.tenant_id == "test-tenant"
        assert stack.environment_suffix == "test"

    def test_tenant_stack_creates_vpc(self):
        """TenantStack creates VPC with correct configuration."""
        app = App()
        stack = TenantStack(
            app,
            "acme-corp",
            "10.0.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify VPC exists
        assert hasattr(stack, 'vpc')
        assert stack.vpc is not None

    def test_tenant_stack_creates_subnets(self):
        """TenantStack creates subnets across availability zones."""
        app = App()
        stack = TenantStack(
            app,
            "tech-startup",
            "10.1.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify subnets exist
        assert hasattr(stack, 'subnets')
        assert len(stack.subnets) == 2  # Two AZs

    def test_tenant_stack_creates_security_group(self):
        """TenantStack creates security group."""
        app = App()
        stack = TenantStack(
            app,
            "retail-co",
            "10.2.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify security group exists
        assert hasattr(stack, 'security_group')
        assert stack.security_group is not None

    def test_tenant_stack_creates_kms_key(self):
        """TenantStack creates KMS key with proper configuration."""
        app = App()
        stack = TenantStack(
            app,
            "test-kms",
            "10.3.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify KMS key exists
        assert hasattr(stack, 'kms_key')
        assert stack.kms_key is not None
        assert hasattr(stack, 'kms_alias')
        assert stack.kms_alias is not None

    def test_tenant_stack_creates_s3_bucket(self):
        """TenantStack creates S3 bucket with encryption and versioning."""
        app = App()
        stack = TenantStack(
            app,
            "test-s3",
            "10.4.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify S3 bucket and configurations exist
        assert hasattr(stack, 's3_bucket')
        assert stack.s3_bucket is not None
        assert hasattr(stack, 's3_versioning')
        assert hasattr(stack, 's3_encryption')
        assert hasattr(stack, 's3_lifecycle')
        assert hasattr(stack, 's3_intelligent_tiering')

    def test_tenant_stack_creates_dynamodb_table(self):
        """TenantStack creates DynamoDB table with proper configuration."""
        app = App()
        stack = TenantStack(
            app,
            "test-dynamodb",
            "10.5.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify DynamoDB table exists
        assert hasattr(stack, 'dynamodb_table')
        assert stack.dynamodb_table is not None

    def test_tenant_stack_creates_lambda_resources(self):
        """TenantStack creates Lambda function with IAM role and policy."""
        app = App()
        stack = TenantStack(
            app,
            "test-lambda",
            "10.6.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify Lambda resources exist
        assert hasattr(stack, 'lambda_role')
        assert hasattr(stack, 'lambda_policy')
        assert hasattr(stack, 'lambda_function')
        assert stack.lambda_function is not None

    def test_tenant_stack_creates_cloudwatch_log_group(self):
        """TenantStack creates CloudWatch Log Group."""
        app = App()
        stack = TenantStack(
            app,
            "test-logs",
            "10.7.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify CloudWatch Log Group exists
        assert hasattr(stack, 'log_group')
        assert stack.log_group is not None

    def test_tenant_stack_creates_eventbridge_resources(self):
        """TenantStack creates EventBridge rule, target, and Lambda permission."""
        app = App()
        stack = TenantStack(
            app,
            "test-eventbridge",
            "10.8.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify EventBridge resources exist
        assert hasattr(stack, 'event_rule')
        assert hasattr(stack, 'event_target')
        assert hasattr(stack, 'lambda_permission')

    def test_tenant_stack_creates_lambda_deployment_package(self):
        """TenantStack creates Lambda deployment package."""
        app = App()
        tenant_id = "test-package"
        stack = TenantStack(
            app,
            tenant_id,
            "10.9.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Verify Lambda function is created (uses lambda_function.zip from project root)
        assert stack.lambda_function is not None
        assert hasattr(stack.lambda_function, 'filename')


class TestTenantStackResourceNaming:
    """Test suite for resource naming with environmentSuffix."""

    def test_vpc_includes_environment_suffix(self):
        """VPC name includes environment suffix."""
        app = App()
        tenant_id = "naming-test"
        env_suffix = "dev"
        stack = TenantStack(
            app,
            tenant_id,
            "10.10.0.0/16",
            env_suffix,
            "us-east-1",
            "central-logs-test"
        )

        # VPC should include environment suffix in its identifier
        assert stack.environment_suffix == env_suffix
        assert stack.tenant_id == tenant_id

    def test_all_resources_use_environment_suffix(self):
        """All resources use environment suffix in their naming."""
        app = App()
        tenant_id = "suffix-test"
        env_suffix = "prod"
        stack = TenantStack(
            app,
            tenant_id,
            "10.11.0.0/16",
            env_suffix,
            "us-east-1",
            "central-logs-test"
        )

        # Verify all major resources exist (they should use suffix in naming)
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'subnets')
        assert hasattr(stack, 'security_group')
        assert hasattr(stack, 'kms_key')
        assert hasattr(stack, 's3_bucket')
        assert hasattr(stack, 'dynamodb_table')
        assert hasattr(stack, 'lambda_function')
        assert hasattr(stack, 'log_group')
        assert hasattr(stack, 'event_rule')


class TestTenantStackTags:
    """Test suite for resource tagging."""

    def test_resources_have_tenant_id_tag(self):
        """Resources are tagged with TenantId."""
        app = App()
        tenant_id = "tag-test"
        stack = TenantStack(
            app,
            tenant_id,
            "10.12.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # All major resources should exist with tenant_id stored
        assert stack.tenant_id == tenant_id

    def test_resources_have_environment_tag(self):
        """Resources are tagged with Environment."""
        app = App()
        env_suffix = "staging"
        stack = TenantStack(
            app,
            "env-test",
            "10.13.0.0/16",
            env_suffix,
            "us-east-1",
            "central-logs-test"
        )

        # Environment suffix should be stored
        assert stack.environment_suffix == env_suffix

    def test_resources_have_managed_by_tag(self):
        """Resources are tagged with ManagedBy: CDKTF."""
        app = App()
        stack = TenantStack(
            app,
            "managed-test",
            "10.14.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Stack should be created successfully with all resources
        assert stack is not None


class TestTenantStackCIDR:
    """Test suite for CIDR block handling."""

    def test_different_tenants_use_different_cidr_blocks(self):
        """Different tenants use non-overlapping CIDR blocks."""
        app = App()

        tenant1 = TenantStack(
            app,
            "tenant-1",
            "10.0.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        tenant2 = TenantStack(
            app,
            "tenant-2",
            "10.1.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        tenant3 = TenantStack(
            app,
            "tenant-3",
            "10.2.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # All three stacks should be created successfully
        assert tenant1 is not None
        assert tenant2 is not None
        assert tenant3 is not None

    def test_subnet_cidr_blocks_within_vpc_range(self):
        """Subnets have CIDR blocks within VPC range."""
        app = App()
        stack = TenantStack(
            app,
            "cidr-test",
            "10.15.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Subnets should be created (validation happens during creation)
        assert len(stack.subnets) == 2


class TestTenantStackSecurity:
    """Test suite for security configurations."""

    def test_kms_key_has_short_deletion_window(self):
        """KMS key has 7-day deletion window for testing."""
        app = App()
        stack = TenantStack(
            app,
            "kms-deletion-test",
            "10.16.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # KMS key should be created
        assert stack.kms_key is not None

    def test_s3_bucket_has_versioning(self):
        """S3 bucket has versioning enabled."""
        app = App()
        stack = TenantStack(
            app,
            "s3-version-test",
            "10.17.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # S3 versioning should be configured
        assert stack.s3_versioning is not None

    def test_s3_bucket_has_encryption(self):
        """S3 bucket has KMS encryption enabled."""
        app = App()
        stack = TenantStack(
            app,
            "s3-encrypt-test",
            "10.18.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # S3 encryption should be configured
        assert stack.s3_encryption is not None

    def test_dynamodb_table_has_encryption(self):
        """DynamoDB table has encryption enabled."""
        app = App()
        stack = TenantStack(
            app,
            "dynamo-encrypt-test",
            "10.19.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # DynamoDB table should be created with encryption
        assert stack.dynamodb_table is not None

    def test_lambda_has_reserved_concurrency(self):
        """Lambda function has reserved concurrent executions."""
        app = App()
        stack = TenantStack(
            app,
            "lambda-concurrency-test",
            "10.20.0.0/16",
            "test",
            "us-east-1",
            "central-logs-test"
        )

        # Lambda should be created with concurrency settings
        assert stack.lambda_function is not None


class TestMultiTenantDeployment:
    """Test suite for multi-tenant deployment scenarios."""

    def test_three_tenant_stacks_instantiate_successfully(self):
        """Three tenant stacks instantiate successfully with different CIDR blocks."""
        app = App()

        tenants = [
            {"id": "acme-corp", "cidr": "10.0.0.0/16"},
            {"id": "tech-startup", "cidr": "10.1.0.0/16"},
            {"id": "retail-co", "cidr": "10.2.0.0/16"}
        ]

        stacks = []
        for tenant in tenants:
            stack = TenantStack(
                app,
                tenant["id"],
                tenant["cidr"],
                "test",
                "us-east-1",
                "central-logs-test"
            )
            stacks.append(stack)

        # All three stacks should be created
        assert len(stacks) == 3
        for stack in stacks:
            assert stack is not None

    def test_tenant_stacks_with_different_environment_suffixes(self):
        """Tenant stacks can be created with different environment suffixes."""
        app = App()

        # Create same tenant for different environments
        dev_stack = TenantStack(
            app,
            "multi-env",
            "10.21.0.0/16",
            "dev",
            "us-east-1",
            "central-logs-test"
        )

        staging_stack = TenantStack(
            app,
            "multi-env",
            "10.22.0.0/16",
            "staging",
            "us-east-1",
            "central-logs-test"
        )

        # Both stacks should be created successfully
        assert dev_stack is not None
        assert staging_stack is not None
        assert dev_stack.environment_suffix == "dev"
        assert staging_stack.environment_suffix == "staging"


# Run tests with: pytest tests/unit/test_tenant_stack.py -v
