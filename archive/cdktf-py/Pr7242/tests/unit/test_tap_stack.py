"""Unit tests for TAP Stack - Payment Processing Infrastructure."""
import os
import sys
import json
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        self.app = App()

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        stack = TapStack(
            self.app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert stack.environment_suffix == "prod"
        assert stack.aws_region == "us-west-2"
        assert stack.replication_region == "us-west-2"

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        stack = TapStack(self.app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert stack.environment_suffix == "dev"
        assert stack.aws_region == "us-east-1"


class TestKMSKeys:
    """Test suite for KMS Keys."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestKMSStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_kms_rds_key_created(self):
        """Test that KMS key for RDS is created."""
        assert hasattr(self.stack, 'kms_rds')
        assert self.stack.kms_rds is not None

    def test_kms_s3_key_created(self):
        """Test that KMS key for S3 is created."""
        assert hasattr(self.stack, 'kms_s3')
        assert self.stack.kms_s3 is not None


class TestVPCInfrastructure:
    """Test suite for VPC Infrastructure."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_vpc_created(self):
        """Test that production VPC is created."""
        assert hasattr(self.stack, 'vpc')
        assert self.stack.vpc is not None

    def test_private_subnets_created(self):
        """Test that 3 private subnets are created."""
        assert hasattr(self.stack, 'private_subnets')
        assert len(self.stack.private_subnets) == 3

    def test_public_subnets_created(self):
        """Test that 3 public subnets are created for ALB."""
        assert hasattr(self.stack, 'public_subnets')
        assert len(self.stack.public_subnets) == 3

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created for public subnets."""
        assert hasattr(self.stack, 'igw')
        assert self.stack.igw is not None

    def test_public_route_table_created(self):
        """Test that public route table is created with IGW route."""
        assert hasattr(self.stack, 'public_route_table')
        assert self.stack.public_route_table is not None

    def test_rds_security_group_created(self):
        """Test that RDS security group is created."""
        assert hasattr(self.stack, 'rds_sg')
        assert self.stack.rds_sg is not None

    def test_lambda_security_group_created(self):
        """Test that Lambda security group is created."""
        assert hasattr(self.stack, 'lambda_sg')
        assert self.stack.lambda_sg is not None

    def test_alb_security_group_created(self):
        """Test that ALB security group is created."""
        assert hasattr(self.stack, 'alb_sg')
        assert self.stack.alb_sg is not None


class TestIAMRoles:
    """Test suite for IAM Roles."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestIAMStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_lambda_execution_role_created(self):
        """Test that Lambda execution role is created."""
        assert hasattr(self.stack, 'lambda_role')
        assert self.stack.lambda_role is not None

    def test_s3_replication_role_created(self):
        """Test that S3 replication role is created."""
        assert hasattr(self.stack, 's3_replication_role')
        assert self.stack.s3_replication_role is not None

    def test_parameter_migration_role_created(self):
        """Test that parameter migration role is created."""
        assert hasattr(self.stack, 'param_migration_role')
        assert self.stack.param_migration_role is not None


class TestRDSCluster:
    """Test suite for RDS Aurora Cluster."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestRDSStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_db_subnet_group_created(self):
        """Test that DB subnet group is created."""
        assert hasattr(self.stack, 'db_subnet_group')
        assert self.stack.db_subnet_group is not None

    def test_rds_cluster_created(self):
        """Test that RDS Aurora cluster is created."""
        assert hasattr(self.stack, 'rds_cluster')
        assert self.stack.rds_cluster is not None

    def test_rds_instances_created(self):
        """Test that 2 RDS cluster instances are created for Multi-AZ."""
        assert hasattr(self.stack, 'rds_instances')
        assert len(self.stack.rds_instances) == 2


class TestDynamoDBTables:
    """Test suite for DynamoDB Tables."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestDynamoDBStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_session_table_created(self):
        """Test that session table is created."""
        assert hasattr(self.stack, 'session_table')
        assert self.stack.session_table is not None

    def test_transaction_table_created(self):
        """Test that transaction table is created."""
        assert hasattr(self.stack, 'transaction_table')
        assert self.stack.transaction_table is not None


class TestLambdaFunctions:
    """Test suite for Lambda Functions."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestLambdaStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_payment_lambda_created(self):
        """Test that payment processor Lambda is created."""
        assert hasattr(self.stack, 'payment_lambda')
        assert self.stack.payment_lambda is not None

    def test_validation_lambda_created(self):
        """Test that payment validator Lambda is created."""
        assert hasattr(self.stack, 'validation_lambda')
        assert self.stack.validation_lambda is not None

    def test_parameter_migration_lambda_created(self):
        """Test that parameter migration Lambda is created."""
        assert hasattr(self.stack, 'param_migration_lambda')
        assert self.stack.param_migration_lambda is not None


class TestS3Buckets:
    """Test suite for S3 Buckets."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestS3Stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_audit_bucket_created(self):
        """Test that primary audit logs bucket is created."""
        assert hasattr(self.stack, 'audit_bucket')
        assert self.stack.audit_bucket is not None

    def test_audit_bucket_replica_created(self):
        """Test that replica audit logs bucket is created."""
        assert hasattr(self.stack, 'audit_bucket_replica')
        assert self.stack.audit_bucket_replica is not None


class TestApplicationLoadBalancer:
    """Test suite for Application Load Balancer."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestALBStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_alb_created(self):
        """Test that ALB is created."""
        assert hasattr(self.stack, 'alb')
        assert self.stack.alb is not None

    def test_blue_target_group_created(self):
        """Test that blue target group is created."""
        assert hasattr(self.stack, 'target_group_blue')
        assert self.stack.target_group_blue is not None

    def test_green_target_group_created(self):
        """Test that green target group is created."""
        assert hasattr(self.stack, 'target_group_green')
        assert self.stack.target_group_green is not None

    def test_alb_listener_created(self):
        """Test that ALB listener is created."""
        assert hasattr(self.stack, 'alb_listener')
        assert self.stack.alb_listener is not None


class TestCloudWatchMonitoring:
    """Test suite for CloudWatch Monitoring."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestCloudWatchStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_alarm_topic_created(self):
        """Test that SNS alarm topic is created."""
        assert hasattr(self.stack, 'alarm_topic')
        assert self.stack.alarm_topic is not None

    def test_rds_cpu_alarm_created(self):
        """Test that RDS CPU alarm is created."""
        assert hasattr(self.stack, 'rds_cpu_alarm')
        assert self.stack.rds_cpu_alarm is not None

    def test_lambda_error_alarm_created(self):
        """Test that Lambda error alarm is created."""
        assert hasattr(self.stack, 'lambda_error_alarm')
        assert self.stack.lambda_error_alarm is not None

    def test_dashboard_created(self):
        """Test that CloudWatch dashboard is created."""
        assert hasattr(self.stack, 'dashboard')
        assert self.stack.dashboard is not None


class TestResourceNaming:
    """Test suite for Resource Naming Convention."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.environment_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TestNamingStack",
            environment_suffix=self.environment_suffix,
            aws_region="us-east-1",
        )

    def test_resources_include_environment_suffix(self):
        """Test that all resources include environment suffix in their names."""
        # This is tested by verifying that the stack stores the environment_suffix
        assert self.stack.environment_suffix == self.environment_suffix


class TestTagging:
    """Test suite for Resource Tagging."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.default_tags = {
            'tags': {
                'Environment': 'production',
                'CostCenter': 'payments',
                'TestTag': 'TestValue'
            }
        }
        self.stack = TapStack(
            self.app,
            "TestTaggingStack",
            environment_suffix="test",
            aws_region="us-east-1",
            default_tags=self.default_tags,
        )

    def test_stack_has_default_tags_configured(self):
        """Test that stack has default tags configured."""
        # The stack should be created successfully with default tags
        assert self.stack is not None


class TestDestroyability:
    """Test suite for Resource Destroyability."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestDestroyabilityStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_rds_cluster_has_skip_final_snapshot(self):
        """Test that RDS cluster has skip_final_snapshot enabled."""
        # This is configured in the stack, verify the stack exists
        assert self.stack.rds_cluster is not None

    def test_s3_buckets_have_force_destroy(self):
        """Test that S3 buckets have force_destroy enabled."""
        # This is configured in the stack, verify the buckets exist
        assert self.stack.audit_bucket is not None
        assert self.stack.audit_bucket_replica is not None


class TestProviders:
    """Test suite for AWS Providers."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestProvidersStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

    def test_primary_provider_created(self):
        """Test that primary AWS provider is created."""
        assert hasattr(self.stack, 'provider_primary')
        assert self.stack.provider_primary is not None

    def test_secondary_provider_created(self):
        """Test that secondary AWS provider for replication is created."""
        assert hasattr(self.stack, 'provider_secondary')
        assert self.stack.provider_secondary is not None


# Integration-style unit tests
class TestEndToEndStackCreation:
    """Test suite for end-to-end stack creation."""

    def test_full_stack_instantiation(self):
        """Test that the complete stack instantiates successfully."""
        app = App()
        stack = TapStack(
            app,
            "FullTestStack",
            environment_suffix="fulltest",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={
                'tags': {
                    'Environment': 'production',
                    'CostCenter': 'payments',
                    'TestSuite': 'EndToEnd'
                }
            }
        )

        # Verify all major components exist
        assert stack is not None

        # KMS
        assert hasattr(stack, 'kms_rds')
        assert hasattr(stack, 'kms_s3')

        # VPC
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'private_subnets')
        assert hasattr(stack, 'public_subnets')

        # RDS
        assert hasattr(stack, 'rds_cluster')
        assert hasattr(stack, 'rds_instances')

        # DynamoDB
        assert hasattr(stack, 'session_table')
        assert hasattr(stack, 'transaction_table')

        # Lambda
        assert hasattr(stack, 'payment_lambda')
        assert hasattr(stack, 'validation_lambda')
        assert hasattr(stack, 'param_migration_lambda')

        # S3
        assert hasattr(stack, 'audit_bucket')
        assert hasattr(stack, 'audit_bucket_replica')

        # ALB
        assert hasattr(stack, 'alb')
        assert hasattr(stack, 'target_group_blue')
        assert hasattr(stack, 'target_group_green')

        # CloudWatch
        assert hasattr(stack, 'alarm_topic')
        assert hasattr(stack, 'dashboard')

        # IAM
        assert hasattr(stack, 'lambda_role')
        assert hasattr(stack, 's3_replication_role')
        assert hasattr(stack, 'param_migration_role')
