// test/tap_stack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@iarna/toml'; // Optional if you use HCL2 parsing lib
import { execSync } from 'child_process';

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
      'environment',
      'project_name',
      'domain_name',
      'alert_email',
      'ssh_allowed_cidr',
      'db_instance_class',
      'eb_instance_type',
    ];

    variables.forEach(variable => {
      expect(tfContent).toMatch(new RegExp(`variable "${variable}"`));
    });
  });

  test('Locals are defined correctly', () => {
    const locals = ['common_tags', 'name_prefix', 'vpc_cidr', 'azs', 'public_subnet_cidrs', 'private_subnet_cidrs', 'db_name'];
    locals.forEach(localVar => {
      expect(tfContent).toMatch(new RegExp(`locals \\{[\\s\\S]*${localVar}`));
    });
  });

  test('VPC and networking resources exist', () => {
    const networkResources = [
      'aws_vpc.main',
      'aws_internet_gateway.main',
      'aws_subnet.public',
      'aws_subnet.private',
      'aws_subnet.private_db',
      'aws_nat_gateway.main',
      'aws_route_table.public',
      'aws_route_table.private',
      'aws_route_table_association.public',
      'aws_route_table_association.private',
      'aws_route_table_association.private_db',
    ];
    networkResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('Security groups exist', () => {
    const sgs = ['aws_security_group.rds', 'aws_security_group.eb_ec2', 'aws_security_group.eb_alb'];
    sgs.forEach(sg => {
      expect(tfContent).toMatch(new RegExp(`resource "${sg.split('.')[0]}" "${sg.split('.')[1]}"`));
    });
  });

  test('RDS database resources exist', () => {
    const rdsResources = ['aws_db_instance.main', 'aws_db_subnet_group.main', 'aws_secretsmanager_secret.rds_credentials', 'aws_secretsmanager_secret_version.rds_credentials'];
    rdsResources.forEach(rds => {
      expect(tfContent).toMatch(new RegExp(`resource "${rds.split('.')[0]}" "${rds.split('.')[1]}"`));
    });
  });

  test('Elastic Beanstalk resources exist', () => {
    const ebResources = [
      'aws_iam_role.eb_service',
      'aws_iam_role.eb_ec2',
      'aws_iam_role_policy.eb_ec2_custom',
      'aws_iam_instance_profile.eb_ec2',
      'aws_elastic_beanstalk_application.main',
      'aws_elastic_beanstalk_environment.blue',
      'aws_elastic_beanstalk_environment.green'
    ];
    ebResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('S3 buckets and configurations exist', () => {
    const s3Resources = [
      'aws_s3_bucket.app_storage',
      'aws_s3_bucket_versioning.app_storage',
      'aws_s3_bucket_server_side_encryption_configuration.app_storage',
      'aws_s3_bucket_public_access_block.app_storage',
      'aws_s3_bucket.eb_versions',
      'aws_s3_bucket_policy.app_storage'
    ];
    s3Resources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('CloudFront and ACM resources exist', () => {
    const cfResources = [
      'aws_cloudfront_origin_access_identity.main',
      'aws_cloudfront_distribution.main',
      'aws_acm_certificate.main',
      'aws_acm_certificate.cloudfront',
      'aws_route53_record.acm_validation',
      'aws_acm_certificate_validation.main'
    ];
    cfResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('Route53 hosted zone exists', () => {
    expect(tfContent).toMatch(/resource "aws_route53_zone" "main"/);
  });

  test('WAF configuration exists', () => {
    expect(tfContent).toMatch(/resource "aws_wafv2_web_acl" "main"/);
  });

  test('CloudWatch monitoring resources exist', () => {
    const cwResources = [
      'aws_sns_topic.alerts',
      'aws_sns_topic_subscription.alerts_email',
      'aws_cloudwatch_dashboard.main',
      'aws_cloudwatch_metric_alarm.rds_cpu',
      'aws_cloudwatch_metric_alarm.rds_storage',
      'aws_cloudwatch_metric_alarm.ec2_cpu_high',
      'aws_cloudwatch_metric_alarm.ec2_cpu_low',
      'aws_cloudwatch_log_group.app_logs'
    ];
    cwResources.forEach(res => {
      expect(tfContent).toMatch(new RegExp(`resource "${res.split('.')[0]}" "${res.split('.')[1]}"`));
    });
  });

  test('Launch template exists', () => {
    expect(tfContent).toMatch(/resource "aws_launch_template" "main"/);
  });

  test('All outputs are declared', () => {
    const outputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'nat_gateway_ids', 'internet_gateway_id', 'rds_endpoint', 'rds_instance_id',
      'rds_secret_arn', 's3_app_bucket', 's3_app_bucket_arn', 's3_eb_versions_bucket',
      'eb_application_name', 'eb_environment_blue_url', 'eb_environment_green_url',
      'eb_environment_blue_id', 'eb_environment_green_id', 'iam_role_eb_service_arn',
      'iam_role_eb_ec2_arn', 'iam_instance_profile_name', 'route53_zone_id',
      'route53_name_servers', 'acm_certificate_arn', 'cloudfront_distribution_id',
      'cloudfront_domain_name', 'waf_web_acl_id', 'waf_web_acl_arn', 'sns_topic_arn',
      'cloudwatch_dashboard_name', 'cloudwatch_log_group_name', 'security_group_rds_id',
      'security_group_eb_ec2_id', 'security_group_eb_alb_id', 'launch_template_id',
      'launch_template_latest_version', 'ami_id'
    ];
    outputs.forEach(output => {
      expect(tfContent).toMatch(new RegExp(`output "${output}"`));
    });
  });
});
