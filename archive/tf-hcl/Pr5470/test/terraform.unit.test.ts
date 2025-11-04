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
      'primary_region',
      'secondary_region',
      'environment',
      'project_name',
      'aurora_instance_class',
      'aurora_engine_version',
      'backup_retention_period',
      'enable_backtrack',
      'backtrack_window'
    ].forEach(variable => {
      test(`Variable "${variable}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variable}"`));
      });
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    [
      'common_tags',
      'vpc_name_primary',
      'vpc_name_secondary',
      'db_cluster_identifier',
      'db_name',
      'db_port',
      's3_bucket_primary',
      's3_bucket_secondary',
      'route53_zone_name',
      'lambda_function_name',
      'dms_replication_instance',
      'alarm_topic_name'
    ].forEach(local => {
      test(`Local "${local}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`${local}\\s*=`));
      });
    });

    describe('Tag keys in common_tags', () => {
      ['Environment', 'Project', 'ManagedBy', 'CreatedDate', 'Purpose', 'SLA', 'Compliance'].forEach(tagKey => {
        test(`Tag key "${tagKey}" exists`, () => {
          expect(tfContent).toMatch(new RegExp(`${tagKey}\\s*=\\s*`));
        });
      });
    });
  });

  // -------------------------
  // Data Sources
  // -------------------------
  // -------------------------
// Data Sources
// -------------------------
describe('Data Sources', () => {
  [
    'aws_availability_zones.primary',
    'aws_availability_zones.secondary',
    'aws_caller_identity.current',
    'aws_region.primary',
    'aws_region.secondary'
  ].forEach(dataSource => {
    const dsParts = dataSource.split('.');
    const dsType = dsParts[0];
    const dsName = dsParts[1];
    test(`Data source "${dsType}" named "${dsName}" is defined`, () => {
      expect(tfContent).toMatch(new RegExp(`data\\s+"${dsType}"\\s+"${dsName}"`));
    });
  });
});

  // -------------------------
  // Resources
  // -------------------------
  describe('Resources', () => {
    [
      ['random_password', 'aurora_master'],
      ['aws_kms_key', 'aurora_primary'],
      ['aws_kms_alias', 'aurora_primary'],
      ['aws_kms_key', 'aurora_secondary'],
      ['aws_kms_alias', 'aurora_secondary'],
      ['aws_vpc', 'primary'],
      ['aws_internet_gateway', 'primary'],
      ['aws_subnet', 'primary_public'],
      ['aws_subnet', 'primary_private'],
      ['aws_eip', 'primary_nat'],
      ['aws_nat_gateway', 'primary'],
      ['aws_route_table', 'primary_public'],
      ['aws_route_table', 'primary_private'],
      ['aws_route_table_association', 'primary_public'],
      ['aws_route_table_association', 'primary_private'],
      ['aws_vpc', 'secondary'],
      ['aws_internet_gateway', 'secondary'],
      ['aws_subnet', 'secondary_public'],
      ['aws_subnet', 'secondary_private'],
      ['aws_eip', 'secondary_nat'],
      ['aws_nat_gateway', 'secondary'],
      ['aws_route_table', 'secondary_public'],
      ['aws_route_table', 'secondary_private'],
      ['aws_route_table_association', 'secondary_public'],
      ['aws_route_table_association', 'secondary_private'],
      ['aws_vpc_peering_connection', 'primary_to_secondary'],
      ['aws_vpc_peering_connection_accepter', 'secondary'],
      ['aws_vpc_peering_connection_options', 'primary'],
      ['aws_vpc_peering_connection_options', 'secondary'],
      ['aws_route', 'primary_to_secondary_private'],
      ['aws_route', 'secondary_to_primary_private'],
      ['aws_security_group', 'aurora_primary'],
      ['aws_security_group', 'aurora_secondary'],
      ['aws_security_group', 'dms'],
      ['aws_db_subnet_group', 'primary'],
      ['aws_db_subnet_group', 'secondary'],
      ['aws_rds_global_cluster', 'aurora_global'],
      ['aws_rds_cluster', 'primary'],
      ['aws_rds_cluster_instance', 'primary_writer'],
      ['aws_rds_cluster_instance', 'primary_reader'],
      ['aws_rds_cluster', 'secondary'],
      ['aws_rds_cluster_instance', 'secondary'],
      ['aws_iam_role', 'aurora_monitoring'],
      ['aws_iam_role_policy_attachment', 'aurora_monitoring'],
      ['aws_iam_role', 'aurora_monitoring_secondary'],
      ['aws_iam_role_policy_attachment', 'aurora_monitoring_secondary'],
      ['aws_iam_role', 'lambda_failover'],
      ['aws_iam_role_policy', 'lambda_failover'],
      ['aws_iam_role_policy_attachment', 'lambda_basic'],
      ['aws_iam_role', 'dms'],
      ['aws_iam_role_policy', 'dms'],
      ['aws_s3_bucket', 'backup_primary'],
      ['aws_s3_bucket_versioning', 'backup_primary'],
      ['aws_s3_bucket_server_side_encryption_configuration', 'backup_primary'],
      ['aws_s3_bucket_lifecycle_configuration', 'backup_primary'],
      ['aws_s3_bucket', 'backup_secondary'],
      ['aws_s3_bucket_versioning', 'backup_secondary'],
      ['aws_s3_bucket_server_side_encryption_configuration', 'backup_secondary'],
      ['aws_iam_role', 's3_replication'],
      ['aws_iam_role_policy', 's3_replication'],
      ['aws_s3_bucket_replication_configuration', 'backup_replication'],
      ['aws_route53_zone', 'main'],
      ['aws_route53_health_check', 'primary'],
      ['aws_route53_health_check', 'secondary'],
      ['aws_route53_record', 'db_primary'],
      ['aws_route53_record', 'db_secondary'],
      ['aws_dms_replication_subnet_group', 'main'],
      ['aws_dms_replication_instance', 'main'],
      ['aws_dms_endpoint', 'source'],
      ['aws_dms_endpoint', 'target'],
      ['aws_dms_replication_task', 'main'],
      ['aws_sns_topic', 'alarms'],
      ['aws_sns_topic_subscription', 'alarm_email'],
      ['aws_cloudwatch_metric_alarm', 'primary_cpu'],
      ['aws_cloudwatch_metric_alarm', 'primary_connections'],
      ['aws_cloudwatch_metric_alarm', 'replication_lag'],
      ['aws_cloudwatch_metric_alarm', 'dms_task_failed'],
      ['aws_lambda_function', 'failover_orchestrator'],
      ['aws_cloudwatch_log_group', 'lambda_failover'],
      ['aws_cloudwatch_event_rule', 'failover_test'],
      ['aws_cloudwatch_event_target', 'lambda_failover'],
      ['aws_lambda_permission', 'allow_eventbridge'],
      ['aws_ssm_parameter', 'db_endpoint_primary'],
      ['aws_ssm_parameter', 'db_endpoint_secondary'],
      ['aws_ssm_parameter', 'db_password']
    ].forEach(([resourceType, resourceName]) => {
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
      'vpc_primary_id',
      'vpc_secondary_id',
      'vpc_peering_connection_id',
      'aurora_global_cluster_id',
      'aurora_primary_cluster_endpoint',
      'aurora_primary_reader_endpoint',
      'aurora_secondary_cluster_endpoint',
      'aurora_secondary_reader_endpoint',
      'route53_zone_id',
      'route53_zone_name_servers',
      'route53_db_endpoint',
      's3_bucket_primary_id',
      's3_bucket_secondary_id',
      'dms_replication_instance_id',
      'dms_replication_task_id',
      'lambda_function_arn',
      'lambda_function_name',
      'sns_topic_arn',
      'kms_key_primary_id',
      'kms_key_secondary_id',
      'nat_gateway_primary_id',
      'nat_gateway_secondary_id',
      'primary_private_subnet_ids',
      'secondary_private_subnet_ids',
      'db_subnet_group_primary_name',
      'db_subnet_group_secondary_name',
      'security_group_aurora_primary_id',
      'security_group_aurora_secondary_id',
      'security_group_dms_id',
      'cloudwatch_alarm_primary_cpu_name',
      'cloudwatch_alarm_replication_lag_name',
      'parameter_store_db_endpoint_primary',
      'parameter_store_db_endpoint_secondary',
      'aws_primary_region',
      'aws_secondary_region'
    ].forEach(outputName => {
      test(`Output "${outputName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });
  });
});
