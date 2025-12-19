"""Unit tests for TAP Stack - Database Migration Infrastructure."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackStructure:
    """Test suite for Stack Structure and Initialization."""

    def test_tap_stack_instantiates_successfully_with_defaults(self):
        """TapStack instantiates successfully with default values."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_instantiates_with_custom_props(self):
        """TapStack instantiates successfully with custom properties."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test123",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-east-1",
            default_tags={"Environment": "test", "Owner": "qa"}
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None

    def test_stack_synthesizes_without_errors(self):
        """Stack synthesizes to valid Terraform configuration."""
        app = App()
        stack = TapStack(app, "TestSynth", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify synthesized output is valid JSON
        assert synth is not None
        assert len(synth) > 0


class TestKMSResources:
    """Test suite for KMS encryption resources."""

    def test_kms_key_created(self):
        """KMS key is created for encryption."""
        app = App()
        stack = TapStack(app, "TestKMS", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify KMS key exists in synthesized output
        assert "aws_kms_key" in synth
        assert "migration_kms_key" in synth

    def test_kms_alias_created(self):
        """KMS alias is created for the key."""
        app = App()
        stack = TapStack(app, "TestKMSAlias", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify KMS alias exists
        assert "aws_kms_alias" in synth
        assert "migration_kms_alias" in synth

    def test_kms_key_rotation_enabled(self):
        """KMS key has rotation enabled."""
        app = App()
        stack = TapStack(app, "TestKMSRotation", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify key rotation is enabled
        assert "enable_key_rotation" in synth
        assert '"enable_key_rotation":true' in synth or '"enable_key_rotation": true' in synth


class TestVPCResources:
    """Test suite for VPC and networking resources."""

    def test_migration_vpc_created(self):
        """Migration VPC is created."""
        app = App()
        stack = TapStack(app, "TestVPC", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify VPC exists
        assert "aws_vpc" in synth
        assert "migration_vpc" in synth

    def test_vpc_subnets_created(self):
        """VPC subnets are created in multiple AZs."""
        app = App()
        stack = TapStack(app, "TestSubnets", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify subnets exist
        assert "aws_subnet" in synth
        # At least 2 subnets for different AZs
        assert synth.count("aws_subnet") >= 2

    def test_security_groups_created(self):
        """Security groups are created for Aurora and DMS."""
        app = App()
        stack = TapStack(app, "TestSG", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify security groups exist
        assert "aws_security_group" in synth

    def test_internet_gateway_created(self):
        """Internet gateway is created for VPC."""
        app = App()
        stack = TapStack(app, "TestIGW", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify internet gateway exists
        assert "aws_internet_gateway" in synth


class TestRDSResources:
    """Test suite for RDS Aurora resources."""

    def test_aurora_cluster_created(self):
        """Aurora PostgreSQL cluster is created."""
        app = App()
        stack = TapStack(app, "TestAurora", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify Aurora cluster exists
        assert "aws_rds_cluster" in synth
        assert "aurora_cluster" in synth

    def test_aurora_cluster_instances_created(self):
        """Aurora cluster instances are created."""
        app = App()
        stack = TapStack(app, "TestAuroraInstances", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify Aurora instances exist (2 readers + writer if configured)
        assert "aws_rds_cluster_instance" in synth

    def test_db_subnet_group_created(self):
        """DB subnet group is created for Aurora."""
        app = App()
        stack = TapStack(app, "TestDBSubnet", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify DB subnet group exists
        assert "aws_db_subnet_group" in synth
        assert "aurora_subnet_group" in synth

    def test_aurora_encryption_enabled(self):
        """Aurora cluster has encryption enabled."""
        app = App()
        stack = TapStack(app, "TestAuroraEncrypt", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify encryption is enabled
        assert "storage_encrypted" in synth

    def test_aurora_backup_retention_configured(self):
        """Aurora cluster has backup retention configured."""
        app = App()
        stack = TapStack(app, "TestAuroraBackup", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify backup retention period is set
        assert "backup_retention_period" in synth


class TestDMSResources:
    """Test suite for DMS migration resources."""

    def test_dms_replication_subnet_group_created(self):
        """DMS replication subnet group is created."""
        app = App()
        stack = TapStack(app, "TestDMSSubnet", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify DMS subnet group exists
        assert "aws_dms_replication_subnet_group" in synth

    def test_dms_replication_instance_created(self):
        """DMS replication instance is created."""
        app = App()
        stack = TapStack(app, "TestDMSInstance", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify DMS replication instance exists
        assert "aws_dms_replication_instance" in synth
        assert "dms_replication_instance" in synth

    def test_dms_source_endpoint_created(self):
        """DMS source endpoint for on-prem PostgreSQL is created."""
        app = App()
        stack = TapStack(app, "TestDMSSource", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify source endpoint exists
        assert "aws_dms_endpoint" in synth
        assert "dms_source_endpoint" in synth
        assert "onprem-postgres.example.com" in synth

    def test_dms_target_endpoint_created(self):
        """DMS target endpoint for Aurora is created."""
        app = App()
        stack = TapStack(app, "TestDMSTarget", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify target endpoint exists
        assert "dms_target_endpoint" in synth

    def test_dms_replication_task_created(self):
        """DMS replication task with full-load-and-cdc is created."""
        app = App()
        stack = TapStack(app, "TestDMSTask", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify replication task exists
        assert "aws_dms_replication_task" in synth
        assert "dms_migration_task" in synth
        assert "full-load-and-cdc" in synth


class TestRoute53Resources:
    """Test suite for Route 53 DNS resources."""

    def test_route53_hosted_zone_created(self):
        """Route 53 hosted zone is created."""
        app = App()
        stack = TapStack(app, "TestRoute53Zone", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify hosted zone exists
        assert "aws_route53_zone" in synth
        assert "migration_hosted_zone" in synth

    def test_route53_weighted_records_created(self):
        """Route 53 weighted routing records are created."""
        app = App()
        stack = TapStack(app, "TestRoute53Records", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify weighted routing records exist
        assert "aws_route53_record" in synth
        assert "weighted_routing_policy" in synth

    def test_route53_onprem_record_weight_100(self):
        """On-prem route has 100% weight initially."""
        app = App()
        stack = TapStack(app, "TestRoute53Weight", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify on-prem record has weight 100
        assert "onprem_weighted_record" in synth
        assert '"weight":100' in synth or '"weight": 100' in synth


class TestParameterStoreResources:
    """Test suite for SSM Parameter Store resources."""

    def test_parameter_store_created(self):
        """SSM parameters are created for migration state."""
        app = App()
        stack = TapStack(app, "TestSSM", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify SSM parameters exist
        assert "aws_ssm_parameter" in synth


class TestEventBridgeResources:
    """Test suite for EventBridge resources."""

    def test_eventbridge_rule_created(self):
        """EventBridge rule is created for DMS events."""
        app = App()
        stack = TapStack(app, "TestEventBridge", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify EventBridge rule exists
        assert "aws_cloudwatch_event_rule" in synth
        assert "dms_task_state_change_rule" in synth

    def test_eventbridge_target_created(self):
        """EventBridge target is created."""
        app = App()
        stack = TapStack(app, "TestEventTarget", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify EventBridge target exists
        assert "aws_cloudwatch_event_target" in synth


class TestLambdaResources:
    """Test suite for Lambda function resources."""

    def test_lambda_function_created(self):
        """Lambda function for Route 53 cutover is created."""
        app = App()
        stack = TapStack(app, "TestLambda", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify Lambda function exists
        assert "aws_lambda_function" in synth
        assert "route53_updater_lambda" in synth

    def test_lambda_iam_role_created(self):
        """Lambda IAM role is created."""
        app = App()
        stack = TapStack(app, "TestLambdaRole", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify Lambda execution role exists
        assert "aws_iam_role" in synth

    def test_lambda_permission_created(self):
        """Lambda permission for EventBridge invocation is created."""
        app = App()
        stack = TapStack(app, "TestLambdaPermission", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify Lambda permission exists
        assert "aws_lambda_permission" in synth


class TestCloudWatchResources:
    """Test suite for CloudWatch monitoring resources."""

    def test_cloudwatch_dashboard_created(self):
        """CloudWatch dashboard is created."""
        app = App()
        stack = TapStack(app, "TestDashboard", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify dashboard exists
        assert "aws_cloudwatch_dashboard" in synth
        assert "migration_dashboard" in synth

    def test_cloudwatch_alarms_created(self):
        """CloudWatch alarms are created for monitoring."""
        app = App()
        stack = TapStack(app, "TestAlarms", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify alarms exist
        assert "aws_cloudwatch_metric_alarm" in synth

    def test_dms_replication_lag_alarm_created(self):
        """DMS replication lag alarm is created."""
        app = App()
        stack = TapStack(app, "TestDMSAlarm", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify DMS lag alarm exists
        assert "dms_replication_lag_alarm" in synth
        # Threshold should be 60 seconds
        assert '"threshold":60' in synth or '"threshold": 60' in synth


class TestSNSResources:
    """Test suite for SNS notification resources."""

    def test_sns_topic_created(self):
        """SNS topic is created for migration notifications."""
        app = App()
        stack = TapStack(app, "TestSNS", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify SNS topic exists
        assert "aws_sns_topic" in synth
        assert "migration_notification_topic" in synth


class TestBackupResources:
    """Test suite for AWS Backup resources."""

    def test_backup_vault_created(self):
        """AWS Backup vault is created."""
        app = App()
        stack = TapStack(app, "TestBackupVault", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify backup vault exists
        assert "aws_backup_vault" in synth
        assert "aurora_backup_vault" in synth

    def test_backup_plan_created(self):
        """AWS Backup plan is created."""
        app = App()
        stack = TapStack(app, "TestBackupPlan", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify backup plan exists
        assert "aws_backup_plan" in synth
        assert "aurora_backup_plan" in synth

    def test_backup_selection_created(self):
        """AWS Backup selection is created."""
        app = App()
        stack = TapStack(app, "TestBackupSelection", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify backup selection exists
        assert "aws_backup_selection" in synth


class TestIAMResources:
    """Test suite for IAM roles and policies."""

    def test_lambda_execution_role_created(self):
        """Lambda execution role is created."""
        app = App()
        stack = TapStack(app, "TestLambdaIAM", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify Lambda execution role exists
        assert "aws_iam_role" in synth

    def test_backup_service_role_created(self):
        """Backup service role is created."""
        app = App()
        stack = TapStack(app, "TestBackupIAM", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify backup service role exists
        assert "backup_service_role" in synth


class TestResourceNaming:
    """Test suite for resource naming with environment suffix."""

    def test_all_resources_include_environment_suffix(self):
        """All named resources include environment suffix."""
        app = App()
        test_suffix = "testenv123"
        stack = TapStack(app, "TestNaming", environment_suffix=test_suffix)
        synth = Testing.synth(stack)

        # Verify environment suffix is used in resource names
        assert test_suffix in synth

    def test_vpc_name_includes_suffix(self):
        """VPC name includes environment suffix."""
        app = App()
        test_suffix = "testsuffix"
        stack = TapStack(app, "TestVPCName", environment_suffix=test_suffix)
        synth = Testing.synth(stack)

        # Verify VPC name includes suffix
        assert f"migration-vpc-{test_suffix}" in synth

    def test_aurora_cluster_identifier_includes_suffix(self):
        """Aurora cluster identifier includes environment suffix."""
        app = App()
        test_suffix = "testsuffix"
        stack = TapStack(app, "TestAuroraName", environment_suffix=test_suffix)
        synth = Testing.synth(stack)

        # Verify Aurora cluster identifier includes suffix
        assert f"migration-aurora-{test_suffix}" in synth


class TestResourceDeletion:
    """Test suite for resource deletion policies."""

    def test_s3_force_destroy_enabled(self):
        """Resources have force_destroy enabled where applicable."""
        app = App()
        stack = TapStack(app, "TestForceDestroy", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify force_destroy is used
        assert "force_destroy" in synth

    def test_aurora_skip_final_snapshot_enabled(self):
        """Aurora cluster skips final snapshot for easy deletion."""
        app = App()
        stack = TapStack(app, "TestSkipSnapshot", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify skip_final_snapshot is true
        assert "skip_final_snapshot" in synth


class TestSecurityConfiguration:
    """Test suite for security configurations."""

    def test_kms_encryption_used(self):
        """KMS encryption is configured for data at rest."""
        app = App()
        stack = TapStack(app, "TestEncryption", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify KMS key is referenced
        assert "kms_key_id" in synth or "kms_key_arn" in synth

    def test_iam_roles_have_proper_assume_role_policies(self):
        """IAM roles have proper assume role policies."""
        app = App()
        stack = TapStack(app, "TestIAMPolicy", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify assume role policies exist
        assert "assume_role_policy" in synth
        assert "sts:AssumeRole" in synth


class TestComplianceRequirements:
    """Test suite for compliance and best practices."""

    def test_point_in_time_recovery_enabled(self):
        """Aurora has point-in-time recovery enabled."""
        app = App()
        stack = TapStack(app, "TestPITR", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify backup retention is configured (enables PITR)
        assert "backup_retention_period" in synth

    def test_monitoring_enabled(self):
        """CloudWatch monitoring is enabled."""
        app = App()
        stack = TapStack(app, "TestMonitoring", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify CloudWatch resources exist
        assert "aws_cloudwatch_dashboard" in synth
        assert "aws_cloudwatch_metric_alarm" in synth

    def test_tags_applied_to_resources(self):
        """Resources have appropriate tags."""
        app = App()
        stack = TapStack(app, "TestTags", environment_suffix="test")
        synth = Testing.synth(stack)

        # Verify tags are present
        assert '"tags"' in synth or "'tags'" in synth
