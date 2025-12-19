// test/tap_stack.unit.test.ts

import * as fs from 'fs';
import * as path from 'path';

describe('tap_stack.tf static verification', () => {
  const terraformFile = path.join(__dirname, '../lib/tap_stack.tf');
  let tfContent: string;

  beforeAll(() => {
    tfContent = fs.readFileSync(terraformFile, 'utf-8');
  });

  test('Terraform file exists', () => {
    expect(fs.existsSync(terraformFile)).toBe(true);
  });

  test('All required variables are defined', () => {
    const variables = [
      'region',
      'project_name',
      'environment',
      'owner',
      'vpc_cidr',
      'key_pair_name'
    ];
    variables.forEach(variable => {
      expect(tfContent).toMatch(new RegExp(`variable "${variable}"`));
    });
  });

  test('Locals are defined correctly', () => {
    const locals = [
      'common_tags', 'name_prefix', 'azs', 'public_subnet_cidrs',
      'private_subnet_cidrs', 'db_subnet_cidrs'
    ];
    locals.forEach(localVar => {
      expect(tfContent).toMatch(new RegExp(`locals \\{[\\s\\S]*${localVar}`));
    });
  });

  test('Data sources exist', () => {
    const datasources = [
      'aws_availability_zones.available',
      'aws_ami.amazon_linux_2',
      'aws_caller_identity.current'
    ];
    datasources.forEach(ds => {
      expect(tfContent).toMatch(new RegExp(`data "${ds.split('.')[0]}" "${ds.split('.')[1]}"`));
    });
  });

  test('Random resources for RDS exist', () => {
    ['random_string.rds_username', 'random_password.rds_password'].forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('VPC and networking resources exist', () => {
    const networkResources = [
      'aws_vpc.main',
      'aws_internet_gateway.main',
      'aws_eip.nat',
      'aws_subnet.public',
      'aws_subnet.private',
      'aws_subnet.database',
      'aws_nat_gateway.main',
      'aws_route_table.public',
      'aws_route_table.private',
      'aws_route_table_association.public',
      'aws_route_table_association.private'
    ];
    networkResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('Security groups exist', () => {
    const sgs = [
      'aws_security_group.ec2',
      'aws_security_group.rds',
      'aws_security_group.lambda'
    ];
    sgs.forEach(sg => {
      expect(tfContent).toMatch(new RegExp(`resource "${sg.split('.')[0]}" "${sg.split('.')[1]}"`));
    });
  });

  test('S3 bucket and configuration resources exist', () => {
    const s3Resources = [
      'aws_s3_bucket.main',
      'aws_s3_bucket_versioning.main',
      'aws_s3_bucket_server_side_encryption_configuration.main',
      'aws_s3_bucket_public_access_block.main',
      'aws_s3_bucket_policy.main'
    ];
    s3Resources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('IAM roles and policies exist', () => {
    const iamResources = [
      'aws_iam_role.ec2',
      'aws_iam_role_policy.ec2',
      'aws_iam_instance_profile.ec2',
      'aws_iam_role.lambda',
      'aws_iam_role_policy.lambda',
      'aws_iam_role.config',
      'aws_iam_role_policy_attachment.config'
    ];
    iamResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('EC2 instance exists', () => {
    expect(tfContent).toMatch(/resource "aws_instance" "main"/);
  });

  test('RDS database resources exist', () => {
    const rdsResources = [
      'aws_db_subnet_group.main',
      'aws_db_instance.main',
      'aws_secretsmanager_secret.rds_credentials',
      'aws_secretsmanager_secret_version.rds_credentials'
    ];
    rdsResources.forEach(rds => {
      expect(tfContent).toMatch(new RegExp(`resource "${rds.split('.')[0]}" "${rds.split('.')[1]}"`));
    });
  });

  test('Lambda function and code data source exist', () => {
    expect(tfContent).toMatch(/resource "aws_lambda_function" "main"/);
    expect(tfContent).toMatch(/data "archive_file" "lambda_code"/);
  });

  test('Config resources exist', () => {
    const configResources = [
      'aws_s3_bucket.config',
      'aws_s3_bucket_policy.config',
      'aws_config_delivery_channel.main',
      'aws_config_configuration_recorder.main',
      'aws_config_configuration_recorder_status.main',
      'aws_config_config_rule.s3_public_read',
      'aws_config_config_rule.rds_encryption',
      'aws_config_config_rule.ec2_ssm_managed'
    ];
    configResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('CloudWatch alarms and log resources exist', () => {
    const alarmResources = [
      'aws_sns_topic.alarms',
      'aws_cloudwatch_log_group.lambda',
      'aws_cloudwatch_log_metric_filter.unauthorized_api',
      'aws_cloudwatch_metric_alarm.unauthorized_api',
      'aws_cloudwatch_metric_alarm.rds_cpu',
      'aws_cloudwatch_metric_alarm.ec2_cpu'
    ];
    alarmResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('WAF configuration exists', () => {
    expect(tfContent).toMatch(/resource "aws_wafv2_web_acl" "main"/);
  });

  test('Outputs are declared for all major resources', () => {
    const outputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids', 'database_subnet_ids',
      'nat_gateway_ids', 'internet_gateway_id', 's3_bucket_id', 's3_bucket_arn',
      'ec2_instance_id', 'ec2_instance_private_ip', 'ec2_security_group_id',
      'rds_instance_endpoint', 'rds_instance_address', 'rds_instance_port',
      'rds_security_group_id', 'rds_secret_arn', 'lambda_function_name', 'lambda_function_arn',
      'lambda_security_group_id', 'iam_role_ec2_arn', 'iam_role_lambda_arn', 'iam_role_config_arn',
      'waf_web_acl_id', 'waf_web_acl_arn', 'sns_topic_arn', 'cloudwatch_log_group_lambda',
      'config_recorder_name', 'config_bucket_id', 'ami_id', 'availability_zones'
    ];
    outputs.forEach(output => {
      expect(tfContent).toMatch(new RegExp(`output "${output}"`));
    });
  });
});
