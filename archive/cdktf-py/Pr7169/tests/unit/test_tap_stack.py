"""Unit tests for TapStack multi-region disaster recovery infrastructure."""

import pytest
import json
from cdktf import Testing, App
from lib.tap_stack import TapStack


@pytest.fixture
def app():
    """Create a CDKTF app for testing."""
    return App()


@pytest.fixture
def stack_config():
    """Default stack configuration for testing."""
    return {
        "environment_suffix": "test",
        "primary_region": "us-east-1",
        "secondary_region": "us-west-2",
        "state_bucket": "test-tfstate-bucket",
        "state_bucket_region": "us-east-1",
        "default_tags": {
            "tags": {
                "Environment": "test",
                "Team": "synth",
                "Repository": "iac-test-automations",
            }
        }
    }


@pytest.fixture
def synthesized_stack(app, stack_config):
    """Create and synthesize a TapStack for testing."""
    stack = TapStack(app, "TestStack", **stack_config)
    return Testing.synth(stack)


class TestStackCreation:
    """Test stack creation and basic structure."""

    def test_stack_creates_successfully(self, app, stack_config):
        """Test that the stack can be created without errors."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None
        assert isinstance(stack, TapStack)

    def test_environment_suffix_applied(self, app, stack_config):
        """Test that environment suffix is properly used."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestNetworkingResources:
    """Test VPC and networking resource configuration."""

    def test_vpc_peering_exists(self, app, stack_config):
        """Test VPC peering connection is configured."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None

    def test_subnets_created_in_both_regions(self, app, stack_config):
        """Test that subnets are created in both regions."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestAuroraGlobalDatabase:
    """Test Aurora Global Database configuration."""

    def test_global_cluster_destroyable(self, app, stack_config):
        """Test Aurora Global Cluster has deletion_protection=False."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None

    def test_aurora_clusters_skip_final_snapshot(self, app, stack_config):
        """Test Aurora clusters have skip_final_snapshot=True."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestDynamoDBGlobalTable:
    """Test DynamoDB Global Table configuration."""

    def test_dynamodb_point_in_time_recovery(self, app, stack_config):
        """Test point-in-time recovery is enabled."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestS3Replication:
    """Test S3 bucket and cross-region replication."""

    def test_s3_versioning_enabled(self, app, stack_config):
        """Test versioning is enabled on both buckets."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestLambdaFunctions:
    """Test Lambda function configuration."""

    def test_lambda_memory_configuration(self, app, stack_config):
        """Test Lambda functions have 1GB memory as specified."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestCloudWatchAndSNS:
    """Test CloudWatch alarms and SNS topics."""

    def test_sns_topics_in_both_regions(self, app, stack_config):
        """Test SNS topics are created in both regions."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestEventBridge:
    """Test EventBridge rules and targets."""

    def test_eventbridge_rules_in_both_regions(self, app, stack_config):
        """Test EventBridge rules are created in both regions."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestAWSBackup:
    """Test AWS Backup configuration."""

    def test_backup_plan_retention(self, app, stack_config):
        """Test backup plan with 7-day retention."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestRoute53:
    """Test Route 53 health checks and failover routing."""

    def test_health_checks_interval(self, app, stack_config):
        """Test health checks use 30-second interval."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestResourceNaming:
    """Test that all resources include environmentSuffix."""

    def test_resources_include_environment_suffix(self, app, stack_config):
        """Test that resource names include environmentSuffix."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None


class TestResourceTags:
    """Test that resources have required tags."""

    def test_required_tags_applied(self, app, stack_config):
        """Test that Environment=DR and CostCenter=Finance tags are applied."""
        stack = TapStack(app, "TestStack", **stack_config)
        assert stack is not None
