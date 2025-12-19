import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests - Exact Coverage', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    [
      "primary_region",
      "secondary_region",
      "environment",
      "db_instance_class",
      "db_allocated_storage",
      "db_max_allocated_storage",
      "db_name",
      "db_username",
      "backup_retention_period",
      "backup_window",
      "maintenance_window"
    ].forEach(variableName => {
      test(`Variable "${variableName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variableName}"`));
      });
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    [
      "suffix",
      "common_tags",
      "primary_vpc_cidr",
      "secondary_vpc_cidr",
      "primary_azs",
      "secondary_azs",
      "primary_prefix",
      "secondary_prefix"
    ].forEach(localName => {
      test(`Local "${localName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`${localName}\\s*=\\s*`));
      });
    });

    describe('Tag keys in common_tags', () => {
      ["Environment", "ManagedBy", "Project", "Suffix"].forEach(tagKey => {
        test(`Tag key "${tagKey}" exists in common_tags`, () => {
          expect(tfContent).toMatch(new RegExp(`${tagKey}\\s*=\\s*`));
        });
      });
    });
  });

  // -------------------------
  // Resources
  // -------------------------
  describe('Resources', () => {
    [
      "random_password.db_master_password",
      "aws_vpc.primary_vpc",
      "aws_subnet.primary_public",
      "aws_subnet.primary_private",
      "aws_internet_gateway.primary_igw",
      "aws_eip.primary_nat_eip",
      "aws_nat_gateway.primary_nat",
      "aws_route_table.primary_public",
      "aws_route_table.primary_private",
      "aws_route_table_association.primary_public",
      "aws_route_table_association.primary_private",

      "aws_vpc.secondary_vpc",
      "aws_subnet.secondary_public",
      "aws_subnet.secondary_private",
      "aws_internet_gateway.secondary_igw",
      "aws_eip.secondary_nat_eip",
      "aws_nat_gateway.secondary_nat",
      "aws_route_table.secondary_public",
      "aws_route_table.secondary_private",
      "aws_route_table_association.secondary_public",
      "aws_route_table_association.secondary_private",

      "aws_vpc_peering_connection.primary_to_secondary",
      "aws_vpc_peering_connection_accepter.secondary_accepter",
      "aws_route.primary_to_secondary_private",
      "aws_route.secondary_to_primary_private",

      "aws_security_group.primary_rds_sg",
      "aws_security_group.secondary_rds_sg",

      "aws_kms_key.primary_rds_key",
      "aws_kms_alias.primary_rds_key_alias",
      "aws_kms_key.secondary_rds_key",
      "aws_kms_alias.secondary_rds_key_alias",

      "aws_db_subnet_group.primary_db_subnet_group",
      "aws_db_subnet_group.secondary_db_subnet_group",

      "aws_db_instance.primary_rds",
      "aws_db_instance.primary_read_replica_1",
      "aws_db_instance.primary_read_replica_2",
      "aws_db_instance.cross_region_replica",

      "aws_iam_role.rds_enhanced_monitoring",
      "aws_iam_role_policy_attachment.rds_enhanced_monitoring",
      "aws_iam_role.rds_enhanced_monitoring_secondary",
      "aws_iam_role_policy_attachment.rds_enhanced_monitoring_secondary",

      "aws_cloudwatch_log_group.primary_rds_logs",
      "aws_cloudwatch_log_group.secondary_rds_logs",

      "aws_cloudwatch_metric_alarm.primary_cpu_utilization",
      "aws_cloudwatch_metric_alarm.primary_db_connections",
      "aws_cloudwatch_metric_alarm.primary_replica_lag_1",
      "aws_cloudwatch_metric_alarm.primary_replica_lag_2",
      "aws_cloudwatch_metric_alarm.primary_storage_space",
      "aws_cloudwatch_metric_alarm.cross_region_replica_lag",
      "aws_cloudwatch_metric_alarm.secondary_cpu_utilization",

      "aws_secretsmanager_secret.db_master_password",
      "aws_secretsmanager_secret_version.db_master_password",
      "aws_secretsmanager_secret.db_master_password_secondary",
      "aws_secretsmanager_secret_version.db_master_password_secondary",
    ].forEach(resourceFullName => {
      const [resourceType, resourceName] = resourceFullName.split('.');
      test(`Resource "${resourceType}" named "${resourceName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`));
      });
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    [
      "primary_vpc_id",
      "primary_vpc_cidr",
      "secondary_vpc_id",
      "secondary_vpc_cidr",
      "vpc_peering_connection_id",
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
      "primary_rds_instance_id",
      "primary_rds_endpoint",
      "primary_rds_reader_endpoint",
      "primary_read_replica_1_endpoint",
      "primary_read_replica_2_endpoint",
      "cross_region_replica_endpoint",
      "primary_rds_security_group_id",
      "secondary_rds_security_group_id",
      "primary_kms_key_id",
      "secondary_kms_key_id",
      "primary_db_subnet_group_name",
      "secondary_db_subnet_group_name",
      "primary_nat_gateway_id",
      "secondary_nat_gateway_id",
      "primary_internet_gateway_id",
      "secondary_internet_gateway_id",
      "primary_cloudwatch_log_group",
      "secondary_cloudwatch_log_group",
      "primary_secret_arn",
      "secondary_secret_arn",
      "rds_database_name",
      "rds_master_username",
      "primary_monitoring_role_arn",
      "secondary_monitoring_role_arn",
      "deployment_timestamp",
      "terraform_workspace",
      "aws_primary_region",
      "aws_secondary_region"
    ].forEach(outputName => {
      test(`Output "${outputName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });
  });
});

