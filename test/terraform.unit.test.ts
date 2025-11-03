import fs from 'fs';
import path from 'path';

describe('Exact Terraform Resources Test', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf'); // Adjust the path as needed
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Variables specific in your tf
  test('Variables are defined exactly as in tf', () => {
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
      expect(tfContent).toMatch(new RegExp(`variable\\s+"${variable}"`));
    });
  });

  // Locals
  test('Locals are declared precisely', () => {
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
      expect(tfContent).toMatch(new RegExp(`local\\s+${local}\\s+=`));
    });
  });

  // Resources
  test('Resources are declared exactly as in tf', () => {
    const resourceNames = [
      'aws_vpc.primary',
      'aws_vpc.secondary',
      'aws_security_group.auroraprimary',
      'aws_security_group.aurorasecondary',
      'aws_security_group.dms',
      'aws_db_subnet_group.primary',
      'aws_db_subnet_group.secondary',
      'aws_rds_global_cluster.auroraglobal',
      'aws_rds_cluster.primary',
      'aws_rds_cluster.secondary',
      'aws_rds_cluster_instance.primarywriter',
      'aws_rds_cluster_instance.primaryreader',
      'aws_rds_cluster_instance.secondary',
      'aws_ssm_parameter.dbendpointprimary',
      'aws_ssm_parameter.dbendpointsecondary',
      'aws_ssm_parameter.dbpassword',
      'aws_iam_role.lambdafailover',
      'aws_iam_role.auroramonitoring',
      'aws_iam_role.auroramonitoringsecondary',
      'aws_iam_role.dms',
      'aws_iam_role.s3replcation',
      'aws_iam_role_policy.auroramonitoring',
      'aws_iam_role_policy.auroramonitoringsecondary',
      'aws_iam_role_policy.lambdafailover',
      'aws_iam_role_policy.dms',
      'aws_lambda_function.failoverorchestrator',
      'aws_cloudwatch_log_group.lambdafailover',
      'aws_cloudwatch_log_group.rdsprimary',
      'aws_cloudwatch_log_group.rdssecondary',
      'aws_route53_health_check.primary',
      'aws_route53_health_check.secondary'
    ];

    resourceNames.forEach(resource => {
      const [type, name] = resource.split('.');
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });
  });

  // Outputs
  test('Outputs are declared exactly as in tf', () => {
    const outputNames = [
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
      // include all other output variable names here exactly
    ];
    outputNames.forEach(output => {
      expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
    });
  });
});

