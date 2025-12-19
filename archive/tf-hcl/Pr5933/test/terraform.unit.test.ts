import fs from 'fs';
import path from 'path';

describe('TapStack Terraform 100% Coverage Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // VARIABLES
  // -------------------------
  describe('Variables', () => {
    [
      "primary_region",
      "secondary_region",
      "environment",
      "email_alerts",
      "db_instance_class",
      "db_allocated_storage",
      "backup_retention_days",
      "log_retention_days",
      "replication_lag_threshold"
    ].forEach(variable => {
      test(`Variable "${variable}" should be defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variable}"`));
      });
    });
  });

  // -------------------------
  // LOCALS
  // -------------------------
  describe('Locals', () => {
    [
      "suffix",
      "common_tags",
      "primary_prefix",
      "secondary_prefix",
      "db_master_username",
      "db_master_password",
      "db_endpoint_name",
      "dns_zone_name"
    ].forEach(local => {
      test(`Local "${local}" should be defined`, () => {
        expect(tfContent).toMatch(new RegExp(`${local}\\s*=\\s*`));
      });
    });

    describe('common_tags keys', () => {
      ["Environment", "ManagedBy", "DisasterRecovery", "CostCenter", "Compliance"].forEach(tagKey => {
        test(`common_tags contains key "${tagKey}"`, () => {
          expect(tfContent).toMatch(new RegExp(`${tagKey}\\s*=\\s*`));
        });
      });
    });
  });

  // -------------------------
  // RESOURCES
  // -------------------------
  describe('Resources', () => {
    [
      "random_string.db_password",
      "aws_kms_key.primary",
      "aws_kms_alias.primary",
      "aws_kms_key.secondary",
      "aws_kms_alias.secondary",
      "aws_vpc.primary",
      "aws_subnet.primary_public",
      "aws_subnet.primary_private",
      "aws_internet_gateway.primary",
      "aws_eip.primary_nat",
      "aws_nat_gateway.primary",
      "aws_route_table.primary_public",
      "aws_route_table.primary_private",
      "aws_route_table_association.primary_public",
      "aws_route_table_association.primary_private",
      "aws_vpc.secondary",
      "aws_subnet.secondary_public",
      "aws_subnet.secondary_private",
      "aws_internet_gateway.secondary",
      "aws_eip.secondary_nat",
      "aws_nat_gateway.secondary",
      "aws_route_table.secondary_public",
      "aws_route_table.secondary_private",
      "aws_route_table_association.secondary_public",
      "aws_route_table_association.secondary_private",
      "aws_vpc_peering_connection.primary_to_secondary",
      "aws_vpc_peering_connection_accepter.secondary",
      "aws_vpc_peering_connection_options.primary",
      "aws_vpc_peering_connection_options.secondary",
      "aws_route.primary_to_secondary",
      "aws_route.secondary_to_primary",
      "aws_security_group.rds_primary",
      "aws_security_group.rds_secondary",
      "aws_security_group.lambda_primary",
      "aws_security_group.lambda_secondary",
      "aws_db_subnet_group.primary",
      "aws_db_subnet_group.secondary",
      "aws_db_instance.primary",
      "aws_db_instance.secondary",
      "aws_iam_role.rds_monitoring",
      "aws_iam_role_policy_attachment.rds_monitoring",
      "aws_iam_role.rds_monitoring_secondary",
      "aws_iam_role_policy_attachment.rds_monitoring_secondary",
      "aws_iam_role.lambda_execution",
      "aws_iam_role_policy.lambda_execution",
      "aws_iam_role_policy_attachment.lambda_vpc_execution",
      "aws_iam_role.s3_replication",
      "aws_iam_role_policy.s3_replication",
      "aws_s3_bucket.primary_backup",
      "aws_s3_bucket_versioning.primary_backup",
      "aws_s3_bucket_server_side_encryption_configuration.primary_backup",
      "aws_s3_bucket_lifecycle_configuration.primary_backup",
      "aws_s3_bucket.secondary_backup",
      "aws_s3_bucket_versioning.secondary_backup",
      "aws_s3_bucket_server_side_encryption_configuration.secondary_backup",
      "aws_s3_bucket_replication_configuration.primary_to_secondary",
      "aws_sns_topic.primary_alerts",
      "aws_sns_topic.secondary_alerts",
      "aws_sns_topic_subscription.primary_email",
      "aws_sns_topic_subscription.secondary_email",
      "aws_cloudwatch_log_group.lambda_health_check",
      "aws_cloudwatch_log_group.lambda_failover",
      "aws_cloudwatch_log_group.rds_primary",
      "aws_cloudwatch_log_group.rds_secondary",
      "aws_lambda_function.health_check",
      "aws_lambda_function.failover_orchestrator",
      "aws_cloudwatch_metric_alarm.replication_lag",
      "aws_cloudwatch_metric_alarm.primary_cpu",
      "aws_cloudwatch_metric_alarm.primary_connections",
      "aws_route53_zone.main",
      "aws_route53_record.database_primary",
      "aws_route53_health_check.primary",
      "aws_cloudwatch_event_rule.health_check_schedule",
      "aws_cloudwatch_event_target.health_check",
      "aws_lambda_permission.allow_eventbridge_health"
    ].forEach(resource => {
      const [type, name] = resource.split('.');
      test(`Resource "${type}" named "${name}" should be defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
      });
    });
  });

  // -------------------------
  // OUTPUTS
  // -------------------------
  describe('Outputs', () => {
    [
      "primary_rds_endpoint",
      "primary_rds_arn",
      "secondary_rds_endpoint",
      "secondary_rds_arn",
      "primary_vpc_id",
      "secondary_vpc_id",
      "vpc_peering_connection_id",
      "primary_kms_key_id",
      "secondary_kms_key_id",
      "primary_s3_bucket",
      "secondary_s3_bucket",
      "primary_sns_topic_arn",
      "secondary_sns_topic_arn",
      "route53_zone_id",
      "route53_zone_name",
      "database_dns_name",
      "health_check_lambda_arn",
      "failover_lambda_arn",
      "lambda_execution_role_arn",
      "db_master_username",
      "db_master_password",
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
      "primary_rds_security_group_id",
      "secondary_rds_security_group_id",
      "primary_lambda_security_group_id",
      "secondary_lambda_security_group_id",
      "replication_lag_alarm_name",
      "primary_cpu_alarm_name",
      "primary_connections_alarm_name",
      "deployment_primary_region",
      "deployment_secondary_region",
      "deployment_database_endpoint",
      "deployment_backup_retention",
      "deployment_log_retention",
      "deployment_replication_threshold",
      "deployment_instance_class",
      "deployment_environment",
      "aws_primary_region",
      "aws_secondary_region"
    ].forEach(output => {
      test(`Output "${output}" should be defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

