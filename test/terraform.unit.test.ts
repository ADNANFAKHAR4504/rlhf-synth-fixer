import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests - Exact Coverage', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf'); // Adjust file path as needed
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    [
      "aws_region",
      "environment_suffix",
      "vpc_cidr",
      "availability_zones",
      "private_subnet_cidrs",
      "db_instance_class",
      "db_allocated_storage",
      "db_name",
      "db_username",
      "ec2_instance_type",
      "flow_logs_retention_days",
      "backup_retention_period",
      "tags"
    ].forEach(variableName => {
      test(`Variable "${variableName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variableName}"`));
      });
    });
  });

  // -------------------------
  // Resources
  // -------------------------
  describe('Resources', () => {
    [
      // compute.tf
      "aws_launch_template.payment_processing",
      "aws_instance.payment_processing",

      // database.tf
      "aws_db_subnet_group.main",
      "aws_db_parameter_group.postgres_ssl",
      "random_password.db_password",
      "aws_secretsmanager_secret.db_password",
      "aws_secretsmanager_secret_version.db_password",
      "aws_db_instance.payment_db",

      // monitoring.tf
      "aws_guardduty_detector_feature.s3_protection",
      "aws_sns_topic.security_alerts",
      "aws_cloudwatch_event_rule.guardduty_findings",
      "aws_cloudwatch_event_target.guardduty_sns",
      "aws_sns_topic_policy.security_alerts",
      "aws_config_configuration_recorder.main",
      "aws_config_delivery_channel.main",
      "aws_config_configuration_recorder_status.main",
      "aws_s3_bucket.config",
      "aws_s3_bucket_versioning.config",
      "aws_s3_bucket_server_side_encryption_configuration.config",
      "aws_s3_bucket_public_access_block.config",
      "aws_iam_role.config",
      "aws_iam_role_policy.config_s3",
      "aws_config_config_rule.encrypted_volumes",
      "aws_config_config_rule.ec2_imdsv2",
      "aws_config_config_rule.s3_bucket_public_read",
      "aws_config_config_rule.s3_bucket_public_write",
      "aws_cloudwatch_log_group.security_events",
      "aws_cloudwatch_log_metric_filter.root_login",
      "aws_cloudwatch_metric_alarm.root_login",
      "aws_cloudwatch_log_metric_filter.failed_auth",
      "aws_cloudwatch_metric_alarm.failed_auth",
      "aws_cloudwatch_log_metric_filter.unauthorized_api",
      "aws_cloudwatch_metric_alarm.unauthorized_api",

      // networking.tf
      "aws_vpc.main",
      "aws_subnet.private",
      "aws_s3_bucket.flow_logs",
      "aws_s3_bucket_versioning.flow_logs",
      "aws_s3_bucket_server_side_encryption_configuration.flow_logs",
      "aws_s3_bucket_public_access_block.flow_logs",
      "aws_s3_bucket_lifecycle_configuration.flow_logs",
      "aws_flow_log.main",
      "aws_iam_role.flow_logs",
      "aws_iam_role_policy.flow_logs",
      "aws_vpc_endpoint.s3",
      "aws_vpc_endpoint.ec2",
      "aws_vpc_endpoint.rds",
      "aws_route_table.private",
      "aws_route_table_association.private",
      "aws_network_acl.private",

      // security.tf
      "aws_kms_key.rds",
      "aws_kms_alias.rds",
      "aws_kms_key.s3",
      "aws_kms_alias.s3",
      "aws_kms_key.logs",
      "aws_kms_alias.logs",
      "aws_security_group.app_tier",
      "aws_security_group.database_tier",
      "aws_security_group_rule.app_to_db",
      "aws_security_group_rule.db_from_app",
      "aws_security_group.vpc_endpoints",
      "aws_s3_bucket.app_logs",
      "aws_s3_bucket_versioning.app_logs",
      "aws_s3_bucket_server_side_encryption_configuration.app_logs",
      "aws_s3_bucket_public_access_block.app_logs",
      "aws_s3_bucket_policy.app_logs",
      "aws_s3_bucket_lifecycle_configuration.app_logs",
      "aws_s3_bucket.audit_trails",
      "aws_s3_bucket_versioning.audit_trails",
      "aws_s3_bucket_server_side_encryption_configuration.audit_trails",
      "aws_s3_bucket_public_access_block.audit_trails",
      "aws_s3_bucket_policy.audit_trails",
      "aws_s3_bucket_lifecycle_configuration.audit_trails",
      "aws_iam_role.ec2_payment_processing",
      "aws_iam_role_policy.ec2_session_policy",
      "aws_iam_instance_profile.ec2_payment_processing"
    ].forEach(fullName => {
      const [resourceType, resourceName] = fullName.split('.');
      test(`Resource "${resourceType}" named "${resourceName}" is defined`, () => {
        const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`);
        expect(tfContent).toMatch(regex);
      });
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    [
      // Existing outputs
      "vpc_id",
      "private_subnet_ids",
      "rds_endpoint",
      "rds_database_name",
      "kms_key_rds_arn",
      "kms_key_s3_arn",
      "kms_key_logs_arn",
      "app_logs_bucket",
      "audit_trails_bucket",
      "flow_logs_bucket",
      "guardduty_detector_id",
      "security_alerts_topic_arn",
      "ec2_instance_ids",
      "security_group_app_tier_id",
      "security_group_database_tier_id",
      "vpc_endpoint_s3_id",
      "vpc_endpoint_ec2_id",
      "vpc_endpoint_rds_id",
      "db_password_secret_arn",
      "config_recorder_id",

      // Extended outputs you plan to add (examples from suggestions)
      "vpc_name",
      "private_subnet_names",
      "private_subnet_arns",
      "app_logs_bucket_arn",
      "audit_trails_bucket_arn",
      "flow_logs_bucket_arn",
      "config_bucket_arn",
      "ec2_instance_private_ips",
      "ec2_instance_arns",
      "ec2_launch_template_id",
      "ec2_launch_template_arn",
      "security_group_app_tier_arn",
      "security_group_database_tier_arn",
      "security_group_vpc_endpoints_id",
      "security_group_vpc_endpoints_arn",
      "sg_rule_app_to_db_id",
      "sg_rule_db_from_app_id",
      "network_acl_private_id",
      "kms_key_rds_id",
      "kms_key_s3_id",
      "kms_key_logs_id",
      "kms_alias_rds_name",
      "kms_alias_s3_name",
      "kms_alias_logs_name",
      "iam_role_ec2_payment_processing_id",
      "iam_role_ec2_payment_processing_arn",
      "iam_instance_profile_ec2_payment_processing_id",
      "iam_role_config_id",
      "iam_role_config_arn",
      "iam_role_flow_logs_id",
      "iam_role_flow_logs_arn",
      "db_subnet_group_name",
      "db_subnet_group_id",
      "db_parameter_group_name",
      "db_parameter_group_id",
      "db_instance_arn",
      "db_instance_id",
      "db_instance_status",
      "db_instance_address",
      "secret_db_password_name",
      "secret_db_password_id",
      "secret_db_password_version_id",
      "guardduty_detector_arn",
      "guardduty_feature_s3_status",
      "security_alerts_topic_id",
      "security_alerts_topic_policy",
      "cloudwatch_event_rule_guardduty_findings_id",
      "cloudwatch_event_target_guardduty_sns_id",
      "cloudwatch_log_group_security_events_name",
      "cloudwatch_log_group_security_events_arn",
      "cloudwatch_metric_alarm_root_login_id",
      "cloudwatch_metric_alarm_failed_auth_id",
      "cloudwatch_metric_alarm_unauthorized_api_id",
      "vpc_endpoint_s3_arn",
      "vpc_endpoint_ec2_arn",
      "vpc_endpoint_rds_arn",
      "route_table_private_id",
      "route_table_association_private_ids",
      "flow_log_main_id",
      "iam_role_policy_ec2_session_policy_id",
      "iam_role_policy_config_s3_id",
      "iam_role_policy_flow_logs_id"
    ].forEach(outputName => {
      test(`Output "${outputName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });
  });
});
