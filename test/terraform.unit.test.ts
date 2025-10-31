import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests - Exact Match', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables (exact names from your shared tf)
  // -------------------------
  test('variables are defined with exact names', () => {
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

  // -------------------------
  // Locals
  // -------------------------
  test('locals are defined as exactly in the tf', () => {
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

  // -------------------------
  // Resources combined with exact names from shared tf
  // -------------------------
  test('resources are defined exactly as in the tf', () => {
    const resources = [
      'aws_vpc.primary',
      'aws_vpc.secondary',
      'aws_subnet.primary_public',
      'aws_subnet.primary_private',
      'aws_subnet.secondary_public',
      'aws_subnet.secondary_private',
      'aws_route_table.primary_public',
      'aws_route_table.primary_private',
      'aws_route_table.secondary_public',
      'aws_route_table.secondary_private',
      'aws_route_table_association.primary_public',
      'aws_route_table_association.primary_private',
      'aws_route_table_association.secondary_public',
      'aws_route_table_association.secondary_private',
      'aws_nat_gateway.primary',
      'aws_nat_gateway.secondary',
      'aws_eip.primarynat',
      'aws_eip.secondarynat',
      'aws_vpc_peering_connection.primarytosecondary',
      'aws_vpc_peering_connection.secondary',
      'aws_vpc_peering_connection.primarytosecondaryaccepter',
      'aws_security_group.auroraprimary',
      'aws_security_group.aurorasecondary',
      'aws_security_group.dms',
      'aws_rds_cluster.auroraglobal',
      'aws_rds_cluster.primary',
      'aws_rds_cluster.secondary',
      'aws_rds_cluster_instance.primarywriter',
      'aws_rds_cluster_instance.primaryreader',
      'aws_rds_cluster_instance.secondary',
      'aws_s3_bucket.backup_primary',
      'aws_s3_bucket.backup_secondary',
      'aws_s3_bucket_replication_configuration.backup_replication',
      'aws_cloudwatch_log_group.lambdafailover',
      'aws_cloudwatch_log_group.rdsprimary',
      'aws_cloudwatch_log_group.rdssecondary',
      'aws_route53_health_check.primary',
      'aws_route53_health_check.secondary'
    ];
    resources.forEach(resource => {
      expect(tfContent).toMatch(new RegExp(`resource\\s+"[\\w_]+"\\s+"${resource.split('.').join('_')}"`));
    });
  });

  // -------------------------
  // Outputs exactly as in your tf
  // -------------------------
  test('outputs match the exact output names', () => {
    const outputs = [
      'securitygroupdmsid',
      'cloudwatchalarmprimarycpuname',
      'cloudwatchalarmreplicationlagname',
      'parameterstoredbendpointprimary',
      'parameterstoredbendpointsecondary',
      'awsprimaryregion',
      'awssecondaryregion',
      'vpcprimaryid',
      'vpcsecondaryid',
      'vpcpeeringconnectionid',
      'auroraglobalclusterid',
      'auroraprimaryclusterendpoint',
      'auroraprimaryreaderendpoint',
      'aurorasecondaryclusterendpoint',
      'aurorasecondaryreaderendpoint',
      'route53zoneid',
      'route53zonenameservers',
      'route53dbendpoint',
      's3bucketprimaryid',
      's3bucketsecondaryid',
      'dmsreplicationinstanceid',
      'lambdafunctionarn',
      'lambdafunctionname',
      'snstopicarn',
      'kmskeyprimaryid',
      'kmskeysecondaryid',
      'natgatewayprimaryid',
      'natgatewaysecondaryid',
      'primaryprivatesubnetids',
      'secondaryprivatesubnetids',
      'dbsubnetgroupprimaryname',
      'dbsubnetgroupsecondaryname',
      'securitygroupauroraprimaryid',
      'securitygroupaurorasecondaryid'
    ];
    outputs.forEach(output => {
      expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
    });
  });
});

