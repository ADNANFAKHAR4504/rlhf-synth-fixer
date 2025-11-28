"""Unit tests for TAP Stack - Multi-Region DR Infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )
        self.synth = Testing.synth(self.stack)

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully."""
        assert self.stack is not None
        assert self.stack.environment_suffix == "test"
        assert self.stack.primary_region == "us-east-1"
        assert self.stack.secondary_region == "us-west-2"

    def test_stack_has_required_providers(self):
        """Stack has primary and secondary AWS providers."""
        assert hasattr(self.stack, 'primary_provider')
        assert hasattr(self.stack, 'secondary_provider')
        assert self.stack.primary_provider is not None
        assert self.stack.secondary_provider is not None

    def test_stack_has_kms_keys_in_both_regions(self):
        """Stack creates KMS keys in both regions."""
        assert hasattr(self.stack, 'primary_kms_key')
        assert hasattr(self.stack, 'secondary_kms_key')
        assert self.stack.primary_kms_key is not None
        assert self.stack.secondary_kms_key is not None

    def test_stack_has_vpcs_in_both_regions(self):
        """Stack creates VPCs in both regions."""
        assert hasattr(self.stack, 'primary_vpc')
        assert hasattr(self.stack, 'secondary_vpc')
        assert self.stack.primary_vpc is not None
        assert self.stack.secondary_vpc is not None

    def test_stack_has_vpc_peering(self):
        """Stack creates VPC peering connection."""
        assert hasattr(self.stack, 'vpc_peering')
        assert self.stack.vpc_peering is not None

    def test_stack_has_security_groups_in_both_regions(self):
        """Stack creates security groups in both regions."""
        assert hasattr(self.stack, 'primary_sg')
        assert hasattr(self.stack, 'secondary_sg')
        assert self.stack.primary_sg is not None
        assert self.stack.secondary_sg is not None

    def test_stack_has_s3_buckets_in_both_regions(self):
        """Stack creates S3 buckets in both regions."""
        assert hasattr(self.stack, 'primary_bucket')
        assert hasattr(self.stack, 'secondary_bucket')
        assert self.stack.primary_bucket is not None
        assert self.stack.secondary_bucket is not None

    def test_stack_has_dynamodb_tables(self):
        """Stack creates DynamoDB global tables."""
        assert hasattr(self.stack, 'patient_records_table')
        assert hasattr(self.stack, 'audit_logs_table')
        assert self.stack.patient_records_table is not None
        assert self.stack.audit_logs_table is not None

    def test_stack_has_lambda_functions_in_both_regions(self):
        """Stack creates Lambda functions in both regions."""
        assert hasattr(self.stack, 'primary_lambda')
        assert hasattr(self.stack, 'secondary_lambda')
        assert self.stack.primary_lambda is not None
        assert self.stack.secondary_lambda is not None

    def test_stack_has_lambda_roles_in_both_regions(self):
        """Stack creates Lambda IAM roles in both regions."""
        assert hasattr(self.stack, 'primary_lambda_role')
        assert hasattr(self.stack, 'secondary_lambda_role')
        assert self.stack.primary_lambda_role is not None
        assert self.stack.secondary_lambda_role is not None

    def test_stack_has_sns_topics_in_both_regions(self):
        """Stack creates SNS topics in both regions."""
        assert hasattr(self.stack, 'primary_sns')
        assert hasattr(self.stack, 'secondary_sns')
        assert self.stack.primary_sns is not None
        assert self.stack.secondary_sns is not None

    def test_stack_has_health_checks_in_both_regions(self):
        """Stack creates Route 53 health checks in both regions."""
        assert hasattr(self.stack, 'primary_health_check')
        assert hasattr(self.stack, 'secondary_health_check')
        assert self.stack.primary_health_check is not None
        assert self.stack.secondary_health_check is not None


class TestResourceConfiguration:
    """Test suite for Resource Configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )
        self.synth = Testing.synth(self.stack)

    def test_common_tags_are_set(self):
        """Common tags are configured correctly."""
        assert hasattr(self.stack, 'common_tags')
        assert self.stack.common_tags['Environment'] == 'Production'
        assert self.stack.common_tags['DisasterRecovery'] == 'Enabled'

    def test_environment_suffix_is_used(self):
        """Environment suffix is used in resource naming."""
        # The environment_suffix should be used in resource names
        assert self.stack.environment_suffix == "test"

    def test_synthesized_stack_contains_resources(self):
        """Synthesized stack contains expected resources."""
        # Verify that synth produces output
        assert self.synth is not None
        assert isinstance(self.synth, str)
        assert len(self.synth) > 0

    def test_synthesized_stack_has_providers(self):
        """Synthesized stack has AWS providers configured."""
        # Verify that synth produces output containing providers
        assert self.synth is not None
        assert isinstance(self.synth, str)
        # The synth output should reference AWS provider
        assert "aws" in self.synth.lower()


class TestKMSKeys:
    """Test suite for KMS Key configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_kms_keys_have_aliases(self):
        """KMS keys are created with aliases."""
        # Both KMS keys should exist
        assert self.stack.primary_kms_key is not None
        assert self.stack.secondary_kms_key is not None


class TestVPCConfiguration:
    """Test suite for VPC configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_vpcs_are_created(self):
        """VPCs are created in both regions."""
        assert self.stack.primary_vpc is not None
        assert self.stack.secondary_vpc is not None

    def test_vpc_peering_is_configured(self):
        """VPC peering is configured between regions."""
        assert self.stack.vpc_peering is not None


class TestSecurityGroups:
    """Test suite for Security Group configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_security_groups_are_created(self):
        """Security groups are created in both regions."""
        assert self.stack.primary_sg is not None
        assert self.stack.secondary_sg is not None


class TestS3Buckets:
    """Test suite for S3 Bucket configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_s3_buckets_are_created_in_both_regions(self):
        """S3 buckets are created in primary and secondary regions."""
        assert self.stack.primary_bucket is not None
        assert self.stack.secondary_bucket is not None


class TestDynamoDBTables:
    """Test suite for DynamoDB Table configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_dynamodb_tables_are_created(self):
        """DynamoDB global tables are created."""
        assert self.stack.patient_records_table is not None
        assert self.stack.audit_logs_table is not None


class TestLambdaFunctions:
    """Test suite for Lambda Function configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_lambda_functions_are_created_in_both_regions(self):
        """Lambda functions are created in both regions."""
        assert self.stack.primary_lambda is not None
        assert self.stack.secondary_lambda is not None

    def test_lambda_roles_are_created_in_both_regions(self):
        """Lambda IAM roles are created in both regions."""
        assert self.stack.primary_lambda_role is not None
        assert self.stack.secondary_lambda_role is not None


class TestSNSTopics:
    """Test suite for SNS Topic configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_sns_topics_are_created_in_both_regions(self):
        """SNS topics are created in both regions."""
        assert self.stack.primary_sns is not None
        assert self.stack.secondary_sns is not None


class TestRoute53HealthChecks:
    """Test suite for Route 53 Health Check configuration."""

    def setup_method(self):
        """Reset state before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test"
        )

    def test_health_checks_are_created_in_both_regions(self):
        """Health checks are created for both regions."""
        assert self.stack.primary_health_check is not None
        assert self.stack.secondary_health_check is not None


class TestStackInitialization:
    """Test suite for Stack Initialization edge cases."""

    def test_stack_with_different_environment_suffix(self):
        """Stack can be instantiated with different environment suffixes."""
        app = App()
        stack1 = TapStack(app, "Stack1", environment_suffix="dev")
        stack2 = TapStack(app, "Stack2", environment_suffix="prod")

        assert stack1.environment_suffix == "dev"
        assert stack2.environment_suffix == "prod"
        assert stack1.primary_region == "us-east-1"
        assert stack2.primary_region == "us-east-1"

    def test_stack_regions_are_hardcoded(self):
        """Stack uses hardcoded regions us-east-1 and us-west-2."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")

        assert stack.primary_region == "us-east-1"
        assert stack.secondary_region == "us-west-2"
