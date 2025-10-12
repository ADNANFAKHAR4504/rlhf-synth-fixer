import { readFileSync } from 'fs';
import { join } from 'path';

describe('tap_stack.tf static verification', () => {
  const planPath = join(__dirname, '../terraform.tfplan.json');
  const plan = JSON.parse(readFileSync(planPath, 'utf-8'));

  const resources = plan?.planned_values?.root_module?.resources || [];

  function getResource(type: string, name?: string) {
    return resources.filter((r: any) => r.type === type && (!name || r.name === name));
  }

  it('should declare all variables', () => {
    const variableNames = plan?.variables ? Object.keys(plan.variables) : [];
    expect(variableNames).toEqual(
      expect.arrayContaining([
        'region',
        'environment',
        'project_name',
        'domain_name',
        'alert_email',
        'ssh_allowed_cidr',
        'db_instance_class',
        'eb_instance_type',
      ])
    );
  });

  it('should create a VPC with correct CIDR', () => {
    const vpcs = getResource('aws_vpc', 'main');
    expect(vpcs.length).toBe(1);
    expect(vpcs[0].values.cidr_block).toBe('10.0.0.0/16');
    expect(vpcs[0].values.enable_dns_hostnames).toBe(true);
  });

  it('should create subnets', () => {
    const publicSubnets = getResource('aws_subnet', 'public');
    expect(publicSubnets.length).toBe(2);
    const privateSubnets = getResource('aws_subnet', 'private');
    expect(privateSubnets.length).toBe(2);
    const privateDbSubnet = getResource('aws_subnet', 'private_db');
    expect(privateDbSubnet.length).toBe(1);
  });

  it('should create Internet Gateway and NAT Gateways', () => {
    expect(getResource('aws_internet_gateway', 'main').length).toBe(1);
    expect(getResource('aws_nat_gateway', 'main').length).toBe(2);
  });

  it('should create route tables and associations', () => {
    expect(getResource('aws_route_table', 'public').length).toBe(1);
    expect(getResource('aws_route_table', 'private').length).toBe(2);
    expect(getResource('aws_route_table_association', 'public').length).toBe(2);
    expect(getResource('aws_route_table_association', 'private').length).toBe(2);
    expect(getResource('aws_route_table_association', 'private_db').length).toBe(1);
  });

  it('should create security groups for RDS, EB EC2, and EB ALB', () => {
    expect(getResource('aws_security_group', 'rds').length).toBe(1);
    expect(getResource('aws_security_group', 'eb_ec2').length).toBe(1);
    expect(getResource('aws_security_group', 'eb_alb').length).toBe(1);
  });

  it('should create RDS resources with subnet group and credentials', () => {
    expect(getResource('aws_db_subnet_group', 'main').length).toBe(1);
    expect(getResource('aws_db_instance', 'main').length).toBe(1);
    expect(getResource('aws_secretsmanager_secret', 'rds_credentials').length).toBe(1);
    expect(getResource('aws_secretsmanager_secret_version', 'rds_credentials').length).toBe(1);
  });

  it('should create IAM roles, instance profiles, and policies for EB', () => {
    expect(getResource('aws_iam_role', 'eb_service').length).toBe(1);
    expect(getResource('aws_iam_role', 'eb_ec2').length).toBe(1);
    expect(getResource('aws_iam_instance_profile', 'eb_ec2').length).toBe(1);
    expect(getResource('aws_iam_role_policy', 'eb_ec2_custom').length).toBe(1);
    expect(getResource('aws_iam_role_policy_attachment', 'eb_service_enhanced_health').length).toBe(1);
    expect(getResource('aws_iam_role_policy_attachment', 'eb_ec2_web_tier').length).toBe(1);
  });

  it('should create S3 buckets with versioning and encryption', () => {
    expect(getResource('aws_s3_bucket', 'app_storage').length).toBe(1);
    expect(getResource('aws_s3_bucket', 'eb_versions').length).toBe(1);
    expect(getResource('aws_s3_bucket_versioning', 'app_storage').length).toBe(1);
    expect(getResource('aws_s3_bucket_server_side_encryption_configuration', 'app_storage').length).toBe(1);
    expect(getResource('aws_s3_bucket_public_access_block', 'app_storage').length).toBe(1);
    expect(getResource('aws_s3_bucket_policy', 'app_storage').length).toBe(1);
  });

  it('should create Elastic Beanstalk application and environments', () => {
    expect(getResource('aws_elastic_beanstalk_application', 'main').length).toBe(1);
    expect(getResource('aws_elastic_beanstalk_environment', 'blue').length).toBe(1);
    expect(getResource('aws_elastic_beanstalk_environment', 'green').length).toBe(1);
  });

  it('should create Route53 zone, ACM certificates, and records', () => {
    expect(getResource('aws_route53_zone', 'main').length).toBe(1);
    expect(getResource('aws_acm_certificate', 'main').length).toBe(1);
    expect(getResource('aws_acm_certificate', 'cloudfront').length).toBe(1);
    expect(getResource('aws_route53_record', 'acm_validation').length).toBeGreaterThan(0);
    expect(getResource('aws_acm_certificate_validation', 'main').length).toBe(1);
  });

  it('should create CloudFront distribution and OAI', () => {
    expect(getResource('aws_cloudfront_origin_access_identity', 'main').length).toBe(1);
    expect(getResource('aws_cloudfront_distribution', 'main').length).toBe(1);
  });

  it('should create WAF ACL', () => {
    expect(getResource('aws_wafv2_web_acl', 'main').length).toBe(1);
  });

  it('should create CloudWatch monitoring resources', () => {
    expect(getResource('aws_sns_topic', 'alerts').length).toBe(1);
    expect(getResource('aws_sns_topic_subscription', 'alerts_email').length).toBe(1);
    expect(getResource('aws_cloudwatch_dashboard', 'main').length).toBe(1);
    expect(getResource('aws_cloudwatch_metric_alarm', 'rds_cpu').length).toBe(1);
    expect(getResource('aws_cloudwatch_metric_alarm', 'rds_storage').length).toBe(1);
    expect(getResource('aws_cloudwatch_metric_alarm', 'ec2_cpu_high').length).toBe(1);
    expect(getResource('aws_cloudwatch_metric_alarm', 'ec2_cpu_low').length).toBe(1);
    expect(getResource('aws_cloudwatch_log_group', 'app_logs').length).toBe(1);
  });

  it('should create launch template for additional EC2 instances', () => {
    expect(getResource('aws_launch_template', 'main').length).toBe(1);
  });
});
