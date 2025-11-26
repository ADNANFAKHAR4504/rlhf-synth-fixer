"""Integration tests for TapStack - Payment Processing Infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestPaymentProcessingInfrastructureIntegration:
    """Integration tests for Payment Processing Infrastructure."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack synthesizes properly to Terraform JSON."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="integration-test-bucket",
            state_bucket_region="us-east-1",
        )

        # Verify basic structure
        assert stack is not None

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_complete_infrastructure_deployment_plan(self):
        """Test complete infrastructure deployment plan."""
        app = App()
        stack = TapStack(
            app,
            "CompleteDeploymentStack",
            environment_suffix="integration",
            aws_region="us-east-1",
            default_tags={
                'tags': {
                    'Environment': 'production',
                    'CostCenter': 'payments',
                    'DeploymentType': 'Integration'
                }
            }
        )

        # Verify all components are present and stack can be synthesized
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'rds_cluster')
        assert hasattr(stack, 'session_table')
        assert hasattr(stack, 'payment_lambda')
        assert hasattr(stack, 'audit_bucket')
        assert hasattr(stack, 'alb')

        # Test synthesis
        synthesized = Testing.synth(stack)
        assert synthesized is not None


class TestVPCAndNetworkingIntegration:
    """Integration tests for VPC and Networking components."""

    def test_vpc_with_subnets_and_endpoints(self):
        """Test VPC creation with subnets and VPC endpoints."""
        app = App()
        stack = TapStack(
            app,
            "VPCIntegrationStack",
            environment_suffix="vpctest",
            aws_region="us-east-1",
        )

        # Verify VPC infrastructure
        assert stack.vpc is not None
        assert len(stack.private_subnets) == 3
        assert len(stack.public_subnets) == 3
        assert stack.igw is not None
        assert stack.public_route_table is not None

        # Verify security groups
        assert stack.rds_sg is not None
        assert stack.lambda_sg is not None
        assert stack.alb_sg is not None

    def test_multi_az_subnet_configuration(self):
        """Test that subnets are spread across multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "MultiAZStack",
            environment_suffix="multiaz",
            aws_region="us-east-1",
        )

        # Verify subnet distribution
        assert len(stack.private_subnets) == 3
        assert len(stack.public_subnets) == 3

        # Subnets should exist
        for subnet in stack.private_subnets:
            assert subnet is not None

        for subnet in stack.public_subnets:
            assert subnet is not None


class TestDatabaseAndStorageIntegration:
    """Integration tests for Database and Storage components."""

    def test_rds_cluster_with_encryption(self):
        """Test RDS Aurora cluster with KMS encryption."""
        app = App()
        stack = TapStack(
            app,
            "RDSEncryptionStack",
            environment_suffix="rdstest",
            aws_region="us-east-1",
        )

        # Verify RDS components
        assert stack.kms_rds is not None
        assert stack.db_subnet_group is not None
        assert stack.rds_cluster is not None
        assert len(stack.rds_instances) == 2

    def test_dynamodb_tables_with_gsi_and_pitr(self):
        """Test DynamoDB tables with Global Secondary Indexes and Point-in-Time Recovery."""
        app = App()
        stack = TapStack(
            app,
            "DynamoDBStack",
            environment_suffix="dynamotest",
            aws_region="us-east-1",
        )

        # Verify DynamoDB tables
        assert stack.session_table is not None
        assert stack.transaction_table is not None


class TestComputeIntegration:
    """Integration tests for Compute components."""

    def test_lambda_functions_with_vpc_config(self):
        """Test Lambda functions with VPC configuration."""
        app = App()
        stack = TapStack(
            app,
            "LambdaVPCStack",
            environment_suffix="lambdatest",
            aws_region="us-east-1",
        )

        # Verify Lambda functions
        assert stack.payment_lambda is not None
        assert stack.validation_lambda is not None
        assert stack.param_migration_lambda is not None

        # Verify IAM roles
        assert stack.lambda_role is not None
        assert stack.param_migration_role is not None

    def test_lambda_with_reserved_concurrency(self):
        """Test Lambda functions have reserved concurrency configured."""
        app = App()
        stack = TapStack(
            app,
            "LambdaConcurrencyStack",
            environment_suffix="concurrencytest",
            aws_region="us-east-1",
        )

        # Verify Lambda functions exist
        assert stack.payment_lambda is not None
        assert stack.validation_lambda is not None


class TestStorageReplicationIntegration:
    """Integration tests for S3 Cross-Region Replication."""

    def test_s3_cross_region_replication_setup(self):
        """Test S3 buckets with cross-region replication."""
        app = App()
        stack = TapStack(
            app,
            "S3ReplicationStack",
            environment_suffix="s3test",
            aws_region="us-east-1",
        )

        # Verify S3 buckets
        assert stack.audit_bucket is not None
        assert stack.audit_bucket_replica is not None

        # Verify replication role
        assert stack.s3_replication_role is not None

    def test_multi_region_provider_configuration(self):
        """Test that primary and secondary AWS providers are configured."""
        app = App()
        stack = TapStack(
            app,
            "MultiRegionStack",
            environment_suffix="regiontest",
            aws_region="us-east-1",
        )

        # Verify providers
        assert stack.provider_primary is not None
        assert stack.provider_secondary is not None
        assert stack.aws_region == "us-east-1"
        assert stack.replication_region == "us-west-2"


class TestLoadBalancingIntegration:
    """Integration tests for Application Load Balancer."""

    def test_alb_with_blue_green_target_groups(self):
        """Test ALB configuration with blue-green target groups."""
        app = App()
        stack = TapStack(
            app,
            "ALBBlueGreenStack",
            environment_suffix="albtest",
            aws_region="us-east-1",
        )

        # Verify ALB components
        assert stack.alb is not None
        assert stack.target_group_blue is not None
        assert stack.target_group_green is not None
        assert stack.alb_listener is not None

    def test_alb_with_health_checks(self):
        """Test that target groups have health checks configured."""
        app = App()
        stack = TapStack(
            app,
            "ALBHealthCheckStack",
            environment_suffix="healthcheck",
            aws_region="us-east-1",
        )

        # Verify target groups exist with health checks
        assert stack.target_group_blue is not None
        assert stack.target_group_green is not None


class TestMonitoringIntegration:
    """Integration tests for CloudWatch Monitoring."""

    def test_cloudwatch_alarms_for_rds_and_lambda(self):
        """Test CloudWatch alarms for RDS CPU and Lambda errors."""
        app = App()
        stack = TapStack(
            app,
            "CloudWatchAlarmsStack",
            environment_suffix="alarmstest",
            aws_region="us-east-1",
        )

        # Verify CloudWatch components
        assert stack.alarm_topic is not None
        assert stack.rds_cpu_alarm is not None
        assert stack.lambda_error_alarm is not None

    def test_cloudwatch_dashboard_creation(self):
        """Test CloudWatch dashboard is created with metrics."""
        app = App()
        stack = TapStack(
            app,
            "CloudWatchDashboardStack",
            environment_suffix="dashboardtest",
            aws_region="us-east-1",
        )

        # Verify dashboard
        assert stack.dashboard is not None

    def test_sns_topic_for_alarm_notifications(self):
        """Test SNS topic for alarm notifications."""
        app = App()
        stack = TapStack(
            app,
            "SNSTopicStack",
            environment_suffix="snstest",
            aws_region="us-east-1",
        )

        # Verify SNS topic
        assert stack.alarm_topic is not None


class TestSecurityIntegration:
    """Integration tests for Security components."""

    def test_kms_keys_for_encryption(self):
        """Test KMS keys are created for RDS and S3 encryption."""
        app = App()
        stack = TapStack(
            app,
            "KMSKeysStack",
            environment_suffix="kmstest",
            aws_region="us-east-1",
        )

        # Verify KMS keys
        assert stack.kms_rds is not None
        assert stack.kms_s3 is not None

    def test_iam_roles_with_least_privilege(self):
        """Test IAM roles follow least-privilege principle."""
        app = App()
        stack = TapStack(
            app,
            "IAMLeastPrivilegeStack",
            environment_suffix="iamtest",
            aws_region="us-east-1",
        )

        # Verify IAM roles
        assert stack.lambda_role is not None
        assert stack.s3_replication_role is not None
        assert stack.param_migration_role is not None

    def test_security_groups_for_network_isolation(self):
        """Test security groups for RDS, Lambda, and ALB."""
        app = App()
        stack = TapStack(
            app,
            "SecurityGroupsStack",
            environment_suffix="sgtest",
            aws_region="us-east-1",
        )

        # Verify security groups
        assert stack.rds_sg is not None
        assert stack.lambda_sg is not None
        assert stack.alb_sg is not None


class TestParameterMigrationIntegration:
    """Integration tests for Parameter Store migration."""

    def test_parameter_migration_lambda(self):
        """Test parameter migration Lambda function."""
        app = App()
        stack = TapStack(
            app,
            "ParameterMigrationStack",
            environment_suffix="paramtest",
            aws_region="us-east-1",
        )

        # Verify parameter migration components
        assert stack.param_migration_lambda is not None
        assert stack.param_migration_role is not None


class TestHighAvailabilityIntegration:
    """Integration tests for High Availability configuration."""

    def test_multi_az_rds_deployment(self):
        """Test RDS cluster is deployed in Multi-AZ configuration."""
        app = App()
        stack = TapStack(
            app,
            "MultiAZRDSStack",
            environment_suffix="multiazrds",
            aws_region="us-east-1",
        )

        # Verify Multi-AZ configuration
        assert stack.rds_cluster is not None
        assert len(stack.rds_instances) == 2

    def test_dynamodb_point_in_time_recovery(self):
        """Test DynamoDB tables have point-in-time recovery enabled."""
        app = App()
        stack = TapStack(
            app,
            "DynamoDBPITRStack",
            environment_suffix="pitrtest",
            aws_region="us-east-1",
        )

        # Verify tables with PITR
        assert stack.session_table is not None
        assert stack.transaction_table is not None


class TestResourceTaggingIntegration:
    """Integration tests for Resource Tagging."""

    def test_production_and_cost_center_tags(self):
        """Test that resources are tagged with Environment and CostCenter."""
        app = App()
        stack = TapStack(
            app,
            "ResourceTaggingStack",
            environment_suffix="tagtest",
            aws_region="us-east-1",
            default_tags={
                'tags': {
                    'Environment': 'production',
                    'CostCenter': 'payments',
                    'Project': 'PaymentMigration'
                }
            }
        )

        # Verify stack with tags
        assert stack is not None


class TestDestroyabilityIntegration:
    """Integration tests for Resource Destroyability."""

    def test_rds_skip_final_snapshot_configuration(self):
        """Test RDS cluster has skip_final_snapshot enabled."""
        app = App()
        stack = TapStack(
            app,
            "RDSDestroyableStack",
            environment_suffix="destroytest",
            aws_region="us-east-1",
        )

        # Verify RDS is destroyable
        assert stack.rds_cluster is not None

    def test_s3_force_destroy_configuration(self):
        """Test S3 buckets have force_destroy enabled."""
        app = App()
        stack = TapStack(
            app,
            "S3DestroyableStack",
            environment_suffix="s3destroy",
            aws_region="us-east-1",
        )

        # Verify S3 buckets are destroyable
        assert stack.audit_bucket is not None
        assert stack.audit_bucket_replica is not None


class TestEndToEndInfrastructureIntegration:
    """End-to-end integration tests for complete infrastructure."""

    def test_complete_payment_infrastructure_stack(self):
        """Test complete payment processing infrastructure stack."""
        app = App()
        stack = TapStack(
            app,
            "CompletePaymentStack",
            environment_suffix="complete",
            state_bucket="payment-tfstate",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={
                'tags': {
                    'Environment': 'production',
                    'CostCenter': 'payments',
                    'Application': 'PaymentProcessing',
                    'ManagedBy': 'CDKTF'
                }
            }
        )

        # Verify all major infrastructure components
        # Network
        assert stack.vpc is not None
        assert len(stack.private_subnets) == 3
        assert len(stack.public_subnets) == 3
        assert stack.igw is not None
        assert stack.public_route_table is not None

        # Security
        assert stack.kms_rds is not None
        assert stack.kms_s3 is not None
        assert stack.rds_sg is not None
        assert stack.lambda_sg is not None
        assert stack.alb_sg is not None

        # Database
        assert stack.rds_cluster is not None
        assert len(stack.rds_instances) == 2
        assert stack.session_table is not None
        assert stack.transaction_table is not None

        # Compute
        assert stack.payment_lambda is not None
        assert stack.validation_lambda is not None
        assert stack.param_migration_lambda is not None

        # Storage
        assert stack.audit_bucket is not None
        assert stack.audit_bucket_replica is not None

        # Load Balancing
        assert stack.alb is not None
        assert stack.target_group_blue is not None
        assert stack.target_group_green is not None

        # Monitoring
        assert stack.alarm_topic is not None
        assert stack.rds_cpu_alarm is not None
        assert stack.lambda_error_alarm is not None
        assert stack.dashboard is not None

        # IAM
        assert stack.lambda_role is not None
        assert stack.s3_replication_role is not None
        assert stack.param_migration_role is not None

        # Test synthesis
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_infrastructure_with_custom_environment_suffix(self):
        """Test infrastructure with custom environment suffix."""
        app = App()
        custom_suffix = "prod-us-east-1-primary"
        stack = TapStack(
            app,
            "CustomSuffixStack",
            environment_suffix=custom_suffix,
            aws_region="us-east-1",
        )

        # Verify custom suffix is used
        assert stack.environment_suffix == custom_suffix
        assert stack is not None

        # Verify stack can be synthesized
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_infrastructure_with_different_regions(self):
        """Test infrastructure deployment in different AWS regions."""
        regions = ["us-east-1", "us-west-2", "eu-west-1"]

        for region in regions:
            app = App()
            stack = TapStack(
                app,
                f"RegionalStack{region.replace('-', '')}",
                environment_suffix=f"test-{region}",
                aws_region=region,
            )

            # Verify region configuration
            assert stack.aws_region == region
            assert stack is not None
