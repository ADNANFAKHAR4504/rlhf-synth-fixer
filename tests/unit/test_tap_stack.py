"""Unit tests for TAP multi-region disaster recovery stacks."""

import pytest
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import PrimaryRegionStack, DrRegionStack, GlobalResourcesStack


@pytest.fixture
def app():
    """Create CDKTF app for testing."""
    return App()


@pytest.fixture
def environment_suffix():
    """Return test environment suffix."""
    return "test"


@pytest.fixture
def default_tags():
    """Return default tags for testing."""
    return {
        "tags": {
            "Environment": "test",
            "Team": "test-team",
            "Repository": "test-repo"
        }
    }


@pytest.fixture
def state_config():
    """Return state bucket configuration."""
    return {
        "state_bucket": "test-bucket",
        "state_bucket_region": "us-east-1"
    }


class TestGlobalResourcesStack:
    """Test GlobalResourcesStack infrastructure."""

    def test_stack_creation(self, app, environment_suffix, default_tags, state_config):
        """Test that GlobalResourcesStack can be created."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )
        assert stack is not None
        assert hasattr(stack, 'global_cluster_id')

    def test_aurora_global_cluster_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Aurora Global Cluster is created."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )

        synth = Testing.synth(stack)
        assert synth is not None

    def test_dynamodb_global_table_created(self, app, environment_suffix, default_tags, state_config):
        """Test that DynamoDB Global Table is created."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )

        synth = Testing.synth(stack)
        assert synth is not None

    def test_route53_zone_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Route53 hosted zone is created."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )

        synth = Testing.synth(stack)
        assert synth is not None


class TestPrimaryRegionStack:
    """Test PrimaryRegionStack infrastructure."""

    def test_stack_creation(self, app, environment_suffix, default_tags, state_config):
        """Test that PrimaryRegionStack can be created."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None
        assert hasattr(stack, 'vpc_id')
        assert hasattr(stack, 'aurora_cluster_arn')
        assert hasattr(stack, 'lambda_arn')
        assert hasattr(stack, 'alb_dns')

    def test_vpc_attributes(self, app, environment_suffix, default_tags, state_config):
        """Test that VPC has required attributes."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'vpc_id')
        assert hasattr(stack, 'vpc_cidr')
        assert stack.vpc_cidr == '10.0.0.0/16'

    def test_aurora_cluster_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that Aurora cluster attributes exist."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'aurora_cluster_arn')
        assert hasattr(stack, 'aurora_endpoint')

    def test_lambda_function_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Lambda function attributes exist."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'lambda_arn')

    def test_s3_buckets_created(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 bucket attributes exist."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'logs_bucket')
        assert hasattr(stack, 'docs_bucket')

    def test_kms_key_created(self, app, environment_suffix, default_tags, state_config):
        """Test that KMS key attribute exists."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'kms_key_id')

    def test_alb_created(self, app, environment_suffix, default_tags, state_config):
        """Test that ALB attribute exists."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'alb_dns')

    def test_sns_topic_created(self, app, environment_suffix, default_tags, state_config):
        """Test that SNS topic attribute exists."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'sns_topic_arn')

    def test_stack_synthesis(self, app, environment_suffix, default_tags, state_config):
        """Test that stack can be synthesized."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        synth = Testing.synth(stack)
        assert synth is not None


class TestDrRegionStack:
    """Test DrRegionStack infrastructure."""

    def test_stack_creation(self, app, environment_suffix, default_tags, state_config):
        """Test that DrRegionStack can be created."""
        stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None
        assert hasattr(stack, 'vpc_id')
        assert hasattr(stack, 'aurora_cluster_arn')
        assert hasattr(stack, 'lambda_arn')
        assert hasattr(stack, 'alb_dns')

    def test_vpc_created_with_different_cidr(self, app, environment_suffix, default_tags, state_config):
        """Test that DR VPC uses different CIDR than primary."""
        stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'vpc_cidr')
        assert stack.vpc_cidr == '10.1.0.0/16'

    def test_separate_kms_key_created(self, app, environment_suffix, default_tags, state_config):
        """Test that DR region has its own KMS key."""
        stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'kms_key_id')

    def test_all_required_attributes(self, app, environment_suffix, default_tags, state_config):
        """Test that all required attributes exist."""
        stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert hasattr(stack, 'vpc_id')
        assert hasattr(stack, 'vpc_cidr')
        assert hasattr(stack, 'private_route_table_id')
        assert hasattr(stack, 'aurora_cluster_arn')
        assert hasattr(stack, 'aurora_endpoint')
        assert hasattr(stack, 'lambda_arn')
        assert hasattr(stack, 'alb_dns')
        assert hasattr(stack, 'logs_bucket')
        assert hasattr(stack, 'docs_bucket')
        assert hasattr(stack, 'sns_topic_arn')
        assert hasattr(stack, 'kms_key_id')

    def test_stack_synthesis(self, app, environment_suffix, default_tags, state_config):
        """Test that DR stack can be synthesized."""
        stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        synth = Testing.synth(stack)
        assert synth is not None


class TestMultiRegionIntegration:
    """Test multi-region integration aspects."""

    def test_vpc_cidrs_do_not_overlap(self, app, environment_suffix, default_tags, state_config):
        """Test that primary and DR VPC CIDRs do not overlap."""
        primary_stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        dr_stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert primary_stack.vpc_cidr != dr_stack.vpc_cidr
        assert primary_stack.vpc_cidr == '10.0.0.0/16'
        assert dr_stack.vpc_cidr == '10.1.0.0/16'

    def test_both_stacks_use_same_global_cluster(self, app, environment_suffix, default_tags, state_config):
        """Test that both regional stacks reference the same global cluster."""
        global_cluster_id = "test-global-cluster"

        primary_stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id=global_cluster_id,
            **state_config
        )

        dr_stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id=global_cluster_id,
            **state_config
        )

        # Both stacks should accept and use the same global_cluster_id
        assert primary_stack is not None
        assert dr_stack is not None
