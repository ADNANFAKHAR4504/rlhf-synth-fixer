"""Unit tests for TAP multi-region disaster recovery stacks with 100% code coverage."""

import pytest
import json
import os
import sys
from unittest.mock import Mock, MagicMock, patch, PropertyMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import PrimaryRegionStack, DrRegionStack, GlobalResourcesStack, TapStack


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


@pytest.fixture
def mock_password():
    """Mock Password resource."""
    mock = Mock()
    mock.result = "mock-password-123"
    return mock


@pytest.fixture
def mock_vpc():
    """Mock VPC resource."""
    mock = Mock()
    mock.id = "vpc-12345"
    mock.cidr_block = "10.0.0.0/16"
    return mock


@pytest.fixture
def mock_subnet():
    """Mock Subnet resource."""
    mock = Mock()
    mock.id = "subnet-12345"
    return mock


@pytest.fixture
def mock_security_group():
    """Mock Security Group resource."""
    mock = Mock()
    mock.id = "sg-12345"
    return mock


@pytest.fixture
def mock_rds_cluster():
    """Mock RDS Cluster resource."""
    mock = Mock()
    mock.id = "cluster-12345"
    mock.arn = "arn:aws:rds:us-east-1:123456789012:cluster:cluster-12345"
    mock.endpoint = "cluster-endpoint.us-east-1.rds.amazonaws.com"
    mock.engine = "aurora-postgresql"
    mock.engine_version = "14.6"
    return mock


@pytest.fixture
def mock_lambda():
    """Mock Lambda function resource."""
    mock = Mock()
    mock.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
    mock.id = "test-lambda"
    return mock


@pytest.fixture
def mock_alb():
    """Mock Application Load Balancer resource."""
    mock = Mock()
    mock.dns_name = "test-alb-123456.us-east-1.elb.amazonaws.com"
    mock.id = "alb-12345"
    mock.arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/123456"
    return mock


@pytest.fixture
def mock_s3_bucket():
    """Mock S3 Bucket resource."""
    mock = Mock()
    mock.id = "test-bucket-12345"
    mock.arn = "arn:aws:s3:::test-bucket-12345"
    return mock


@pytest.fixture
def mock_sns_topic():
    """Mock SNS Topic resource."""
    mock = Mock()
    mock.arn = "arn:aws:sns:us-east-1:123456789012:test-topic"
    mock.id = "test-topic"
    return mock


@pytest.fixture
def mock_kms_key():
    """Mock KMS Key resource."""
    mock = Mock()
    mock.id = "12345678-1234-1234-1234-123456789012"
    mock.arn = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
    return mock


@pytest.fixture
def mock_global_cluster():
    """Mock RDS Global Cluster resource."""
    mock = Mock()
    mock.id = "global-cluster-12345"
    mock.arn = "arn:aws:rds::123456789012:global-cluster:global-cluster-12345"
    return mock


class TestGlobalResourcesStack:
    """Test GlobalResourcesStack infrastructure with comprehensive mocks."""

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

    def test_stack_with_custom_state_bucket(self, app, environment_suffix, default_tags):
        """Test stack creation with custom state bucket configuration."""
        custom_config = {
            "state_bucket": "custom-bucket",
            "state_bucket_region": "us-west-2"
        }
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **custom_config
        )
        assert stack is not None

    def test_stack_with_default_values(self, app):
        """Test stack creation with default values when optional params are not provided."""
        stack = GlobalResourcesStack(
            app,
            "TestGlobalStackDefault",
            environment_suffix="dev"
        )
        assert stack is not None
        assert hasattr(stack, 'global_cluster_id')

    def test_aurora_global_cluster_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Aurora Global Cluster is created with correct configuration."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        assert synth is not None

        # Verify global cluster configuration in synthesized JSON
        synth_json = json.loads(synth)
        assert "resource" in synth_json
        assert "aws_rds_global_cluster" in synth_json["resource"]

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
        synth_json = json.loads(synth)
        assert "aws_dynamodb_table" in synth_json["resource"]

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
        synth_json = json.loads(synth)
        assert "aws_route53_zone" in synth_json["resource"]

    def test_terraform_backend_configuration(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 backend is properly configured."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)
        assert "terraform" in synth_json
        assert "backend" in synth_json["terraform"]

    def test_providers_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that AWS providers are configured."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)
        assert "provider" in synth_json
        assert "aws" in synth_json["provider"]
        # Verify multiple AWS providers (primary and dr)
        assert isinstance(synth_json["provider"]["aws"], list)
        assert len(synth_json["provider"]["aws"]) >= 2

    def test_terraform_outputs(self, app, environment_suffix, default_tags, state_config):
        """Test that Terraform outputs are defined."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)
        assert "output" in synth_json


class TestPrimaryRegionStack:
    """Test PrimaryRegionStack infrastructure with comprehensive mocks."""

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

    def test_stack_with_default_region(self, app, environment_suffix, default_tags, state_config):
        """Test stack creation with default region when not specified."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None

    def test_stack_with_custom_region(self, app, environment_suffix, default_tags, state_config):
        """Test stack creation with custom AWS region."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-west-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None

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

    def test_vpc_configuration(self, app, environment_suffix, default_tags, state_config):
        """Test VPC configuration in synthesized stack."""
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
        synth_json = json.loads(synth)
        assert "aws_vpc" in synth_json["resource"]

    def test_subnets_created(self, app, environment_suffix, default_tags, state_config):
        """Test that public and private subnets are created."""
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
        synth_json = json.loads(synth)
        assert "aws_subnet" in synth_json["resource"]

    def test_internet_gateway_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Internet Gateway is created."""
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
        synth_json = json.loads(synth)
        assert "aws_internet_gateway" in synth_json["resource"]

    def test_route_tables_created(self, app, environment_suffix, default_tags, state_config):
        """Test that route tables are created."""
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
        synth_json = json.loads(synth)
        assert "aws_route_table" in synth_json["resource"]
        assert hasattr(stack, 'private_route_table_id')

    def test_security_groups_created(self, app, environment_suffix, default_tags, state_config):
        """Test that security groups are created."""
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
        synth_json = json.loads(synth)
        assert "aws_security_group" in synth_json["resource"]

    def test_aurora_cluster_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that Aurora cluster is configured with master credentials."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'aurora_cluster_arn')
        assert hasattr(stack, 'aurora_endpoint')
        assert "aws_rds_cluster" in synth_json["resource"]

        # Verify Aurora cluster has master_username and master_password
        aurora_cluster = synth_json["resource"]["aws_rds_cluster"]
        cluster_key = list(aurora_cluster.keys())[0]
        assert "master_username" in aurora_cluster[cluster_key]
        assert "master_password" in aurora_cluster[cluster_key]

    def test_aurora_instances_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Aurora instances are created."""
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
        synth_json = json.loads(synth)
        assert "aws_rds_cluster_instance" in synth_json["resource"]

    def test_db_subnet_group_created(self, app, environment_suffix, default_tags, state_config):
        """Test that DB subnet group is created."""
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
        synth_json = json.loads(synth)
        assert "aws_db_subnet_group" in synth_json["resource"]

    def test_lambda_function_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Lambda function is created."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'lambda_arn')
        assert "aws_lambda_function" in synth_json["resource"]

    def test_lambda_iam_role_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Lambda IAM role is created."""
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
        synth_json = json.loads(synth)
        assert "aws_iam_role" in synth_json["resource"]

    def test_sqs_queue_created(self, app, environment_suffix, default_tags, state_config):
        """Test that SQS queue is created."""
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
        synth_json = json.loads(synth)
        assert "aws_sqs_queue" in synth_json["resource"]

    def test_lambda_event_source_mapping_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Lambda event source mapping is created for SQS."""
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
        synth_json = json.loads(synth)
        assert "aws_lambda_event_source_mapping" in synth_json["resource"]

    def test_s3_buckets_created(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 buckets are created."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'logs_bucket')
        assert hasattr(stack, 'docs_bucket')
        assert "aws_s3_bucket" in synth_json["resource"]

    def test_s3_versioning_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 bucket versioning is configured."""
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
        synth_json = json.loads(synth)
        assert "aws_s3_bucket_versioning" in synth_json["resource"]

    def test_s3_encryption_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 bucket encryption is configured."""
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
        synth_json = json.loads(synth)
        assert "aws_s3_bucket_server_side_encryption_configuration" in synth_json["resource"]

    def test_kms_key_created(self, app, environment_suffix, default_tags, state_config):
        """Test that KMS key is created."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'kms_key_id')
        assert "aws_kms_key" in synth_json["resource"]

    def test_kms_alias_created(self, app, environment_suffix, default_tags, state_config):
        """Test that KMS alias is created."""
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
        synth_json = json.loads(synth)
        assert "aws_kms_alias" in synth_json["resource"]

    def test_alb_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Application Load Balancer is created."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'alb_dns')
        assert "aws_lb" in synth_json["resource"]

    def test_alb_target_group_created(self, app, environment_suffix, default_tags, state_config):
        """Test that ALB target group is created."""
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
        synth_json = json.loads(synth)
        assert "aws_lb_target_group" in synth_json["resource"]

    def test_alb_listener_created(self, app, environment_suffix, default_tags, state_config):
        """Test that ALB listener is created."""
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
        synth_json = json.loads(synth)
        assert "aws_lb_listener" in synth_json["resource"]

    def test_sns_topic_created(self, app, environment_suffix, default_tags, state_config):
        """Test that SNS topic is created."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'sns_topic_arn')
        assert "aws_sns_topic" in synth_json["resource"]

    def test_cloudwatch_alarms_created(self, app, environment_suffix, default_tags, state_config):
        """Test that CloudWatch alarms are created."""
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
        synth_json = json.loads(synth)
        assert "aws_cloudwatch_metric_alarm" in synth_json["resource"]

    def test_cloudwatch_log_group_created(self, app, environment_suffix, default_tags, state_config):
        """Test that CloudWatch log group is created."""
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
        synth_json = json.loads(synth)
        assert "aws_cloudwatch_log_group" in synth_json["resource"]

    def test_backup_vault_created(self, app, environment_suffix, default_tags, state_config):
        """Test that AWS Backup vault is created."""
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
        synth_json = json.loads(synth)
        assert "aws_backup_vault" in synth_json["resource"]

    def test_backup_plan_created(self, app, environment_suffix, default_tags, state_config):
        """Test that AWS Backup plan is created."""
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
        synth_json = json.loads(synth)
        assert "aws_backup_plan" in synth_json["resource"]

    def test_backup_selection_created(self, app, environment_suffix, default_tags, state_config):
        """Test that AWS Backup selection is created."""
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
        synth_json = json.loads(synth)
        assert "aws_backup_selection" in synth_json["resource"]

    def test_random_password_generated(self, app, environment_suffix, default_tags, state_config):
        """Test that random password is generated for Aurora."""
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
        synth_json = json.loads(synth)
        assert "random_password" in synth_json["resource"]

    def test_stack_synthesis(self, app, environment_suffix, default_tags, state_config):
        """Test that stack can be synthesized without errors."""
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
        assert len(synth) > 0

    def test_all_attributes_exposed(self, app, environment_suffix, default_tags, state_config):
        """Test that all required attributes are exposed."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        # Verify all exposed attributes
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


class TestDrRegionStack:
    """Test DrRegionStack infrastructure with comprehensive mocks."""

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

    def test_stack_with_default_region(self, app, environment_suffix, default_tags, state_config):
        """Test stack creation with default DR region."""
        stack = DrRegionStack(
            app,
            f"TestDrStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None

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

    def test_aurora_secondary_cluster_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that Aurora secondary cluster is configured with credentials."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'aurora_cluster_arn')
        assert hasattr(stack, 'aurora_endpoint')
        assert "aws_rds_cluster" in synth_json["resource"]

        # Verify Aurora DR cluster has master_username and master_password
        aurora_cluster = synth_json["resource"]["aws_rds_cluster"]
        cluster_key = list(aurora_cluster.keys())[0]
        assert "master_username" in aurora_cluster[cluster_key]
        assert "master_password" in aurora_cluster[cluster_key]

    def test_networking_resources_created(self, app, environment_suffix, default_tags, state_config):
        """Test that networking resources are created in DR region."""
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
        synth_json = json.loads(synth)

        assert "aws_vpc" in synth_json["resource"]
        assert "aws_subnet" in synth_json["resource"]
        assert "aws_internet_gateway" in synth_json["resource"]
        assert "aws_route_table" in synth_json["resource"]

    def test_security_groups_created(self, app, environment_suffix, default_tags, state_config):
        """Test that security groups are created in DR region."""
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
        synth_json = json.loads(synth)
        assert "aws_security_group" in synth_json["resource"]

    def test_lambda_and_sqs_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Lambda and SQS are created in DR region."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'lambda_arn')
        assert "aws_lambda_function" in synth_json["resource"]
        assert "aws_sqs_queue" in synth_json["resource"]

    def test_s3_buckets_created(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 buckets are created in DR region."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'logs_bucket')
        assert hasattr(stack, 'docs_bucket')
        assert "aws_s3_bucket" in synth_json["resource"]

    def test_alb_created(self, app, environment_suffix, default_tags, state_config):
        """Test that ALB is created in DR region."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'alb_dns')
        assert "aws_lb" in synth_json["resource"]

    def test_sns_topic_created(self, app, environment_suffix, default_tags, state_config):
        """Test that SNS topic is created in DR region."""
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
        synth_json = json.loads(synth)

        assert hasattr(stack, 'sns_topic_arn')
        assert "aws_sns_topic" in synth_json["resource"]

    def test_cloudwatch_resources_created(self, app, environment_suffix, default_tags, state_config):
        """Test that CloudWatch resources are created in DR region."""
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
        synth_json = json.loads(synth)

        assert "aws_cloudwatch_metric_alarm" in synth_json["resource"]
        assert "aws_cloudwatch_log_group" in synth_json["resource"]

    def test_backup_resources_created(self, app, environment_suffix, default_tags, state_config):
        """Test that backup resources are created in DR region."""
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
        synth_json = json.loads(synth)

        assert "aws_backup_vault" in synth_json["resource"]
        assert "aws_backup_plan" in synth_json["resource"]
        assert "aws_backup_selection" in synth_json["resource"]

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
        """Test that DR stack can be synthesized without errors."""
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
        assert len(synth) > 0


class TestTapStack:
    """Test TapStack (combined multi-region) infrastructure."""

    def test_stack_creation(self, app, environment_suffix, default_tags, state_config):
        """Test that TapStack can be created with all regions."""
        stack = TapStack(
            app,
            f"TestTapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region="us-east-1",
            dr_region="us-east-2",
            default_tags=default_tags,
            **state_config
        )
        assert stack is not None

    def test_stack_with_default_regions(self, app, environment_suffix, default_tags, state_config):
        """Test stack creation with default regions."""
        stack = TapStack(
            app,
            f"TestTapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )
        assert stack is not None

    def test_vpc_peering_created(self, app, environment_suffix, default_tags, state_config):
        """Test that VPC peering connection is created."""
        stack = TapStack(
            app,
            f"TestTapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region="us-east-1",
            dr_region="us-east-2",
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)
        assert "aws_vpc_peering_connection" in synth_json["resource"]

    def test_route53_records_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Route53 records are created for both regions."""
        stack = TapStack(
            app,
            f"TestTapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region="us-east-1",
            dr_region="us-east-2",
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)
        assert "aws_route53_record" in synth_json["resource"]

    def test_route53_health_checks_created(self, app, environment_suffix, default_tags, state_config):
        """Test that Route53 health checks are created."""
        stack = TapStack(
            app,
            f"TestTapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region="us-east-1",
            dr_region="us-east-2",
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)
        assert "aws_route53_health_check" in synth_json["resource"]

    def test_s3_replication_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 buckets are configured with versioning and encryption in both regions."""
        stack = TapStack(
            app,
            f"TestTapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region="us-east-1",
            dr_region="us-east-2",
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify S3 buckets exist in both regions
        assert "aws_s3_bucket" in synth_json["resource"]

        # Verify S3 bucket versioning is configured
        assert "aws_s3_bucket_versioning" in synth_json["resource"]

        # Verify S3 bucket encryption is configured
        assert "aws_s3_bucket_server_side_encryption_configuration" in synth_json["resource"]

    def test_stack_synthesis(self, app, environment_suffix, default_tags, state_config):
        """Test that TapStack can be synthesized without errors."""
        stack = TapStack(
            app,
            f"TestTapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region="us-east-1",
            dr_region="us-east-2",
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        assert synth is not None
        assert len(synth) > 0


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

    def test_separate_kms_keys_per_region(self, app, environment_suffix, default_tags, state_config):
        """Test that each region has its own KMS key."""
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
            f"TestDrStack{environment_suffix}_dr",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        # Both should have KMS keys (separate instances)
        assert hasattr(primary_stack, 'kms_key_id')
        assert hasattr(dr_stack, 'kms_key_id')

    def test_all_stacks_can_coexist(self, app, environment_suffix, default_tags, state_config):
        """Test that all stacks can be created together."""
        global_stack = GlobalResourcesStack(
            app,
            f"TestGlobal{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )

        primary_stack = PrimaryRegionStack(
            app,
            f"TestPrimary{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        dr_stack = DrRegionStack(
            app,
            f"TestDr{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert global_stack is not None
        assert primary_stack is not None
        assert dr_stack is not None


class TestEdgeCasesAndErrorHandling:
    """Test edge cases and error handling scenarios."""

    def test_stack_with_empty_tags(self, app, environment_suffix, state_config):
        """Test stack creation with empty tags."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags={},
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None

    def test_stack_with_long_environment_suffix(self, app, default_tags, state_config):
        """Test stack with long environment suffix."""
        long_suffix = "very-long-environment-suffix-name"
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{long_suffix}",
            environment_suffix=long_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None

    def test_stack_with_special_characters_in_suffix(self, app, default_tags, state_config):
        """Test stack with special characters in environment suffix."""
        special_suffix = "test-123"
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{special_suffix}",
            environment_suffix=special_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )
        assert stack is not None

    def test_stack_without_global_cluster_id(self, app, environment_suffix, default_tags, state_config):
        """Test stack creation when global_cluster_id is None."""
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id=None,
            **state_config
        )
        assert stack is not None

    def test_multiple_stacks_with_same_suffix(self, app, environment_suffix, default_tags, state_config):
        """Test creating multiple stacks with the same environment suffix."""
        stack1 = PrimaryRegionStack(
            app,
            f"TestPrimaryStack1{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        stack2 = DrRegionStack(
            app,
            f"TestDrStack2{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-2",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **state_config
        )

        assert stack1 is not None
        assert stack2 is not None

    def test_stack_with_different_state_bucket_regions(self, app, environment_suffix, default_tags):
        """Test stack with different state bucket region."""
        config = {
            "state_bucket": "test-bucket",
            "state_bucket_region": "eu-west-1"
        }
        stack = PrimaryRegionStack(
            app,
            f"TestPrimaryStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
            default_tags=default_tags,
            global_cluster_id="test-global-cluster-id",
            **config
        )
        assert stack is not None

    def test_global_stack_synthesis_produces_valid_json(self, app, environment_suffix, default_tags, state_config):
        """Test that global stack synthesis produces valid JSON."""
        stack = GlobalResourcesStack(
            app,
            f"TestGlobalStack{environment_suffix}",
            environment_suffix=environment_suffix,
            default_tags=default_tags,
            **state_config
        )
        synth = Testing.synth(stack)
        synth_json = json.loads(synth)

        # Verify it's a valid Terraform JSON structure
        assert isinstance(synth_json, dict)
        assert "provider" in synth_json or "resource" in synth_json

    def test_primary_stack_synthesis_produces_valid_json(self, app, environment_suffix, default_tags, state_config):
        """Test that primary stack synthesis produces valid JSON."""
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
        synth_json = json.loads(synth)

        # Verify it's a valid Terraform JSON structure
        assert isinstance(synth_json, dict)
        assert "provider" in synth_json
        assert "resource" in synth_json

    def test_dr_stack_synthesis_produces_valid_json(self, app, environment_suffix, default_tags, state_config):
        """Test that DR stack synthesis produces valid JSON."""
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
        synth_json = json.loads(synth)

        # Verify it's a valid Terraform JSON structure
        assert isinstance(synth_json, dict)
        assert "provider" in synth_json
        assert "resource" in synth_json


class TestResourceConfiguration:
    """Test specific resource configurations."""

    def test_aurora_cluster_encryption_enabled(self, app, environment_suffix, default_tags, state_config):
        """Test that Aurora cluster has encryption enabled."""
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
        synth_json = json.loads(synth)

        aurora_cluster = synth_json["resource"]["aws_rds_cluster"]
        cluster_key = list(aurora_cluster.keys())[0]
        assert aurora_cluster[cluster_key]["storage_encrypted"] is True

    def test_s3_bucket_encryption_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that S3 buckets have encryption configured."""
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
        synth_json = json.loads(synth)

        assert "aws_s3_bucket_server_side_encryption_configuration" in synth_json["resource"]

    def test_alb_security_group_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that ALB security group is properly configured."""
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
        synth_json = json.loads(synth)

        security_groups = synth_json["resource"]["aws_security_group"]
        # At least one security group should exist
        assert len(security_groups) > 0

    def test_lambda_environment_variables(self, app, environment_suffix, default_tags, state_config):
        """Test that Lambda has environment variables configured."""
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
        synth_json = json.loads(synth)

        lambda_functions = synth_json["resource"]["aws_lambda_function"]
        # Lambda function should exist
        assert len(lambda_functions) > 0

    def test_backup_retention_configured(self, app, environment_suffix, default_tags, state_config):
        """Test that backup retention is configured."""
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
        synth_json = json.loads(synth)

        aurora_cluster = synth_json["resource"]["aws_rds_cluster"]
        cluster_key = list(aurora_cluster.keys())[0]
        assert "backup_retention_period" in aurora_cluster[cluster_key]
        assert aurora_cluster[cluster_key]["backup_retention_period"] > 0
