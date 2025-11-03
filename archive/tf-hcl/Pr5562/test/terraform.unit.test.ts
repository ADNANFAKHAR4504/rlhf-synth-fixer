
import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (from tap_stack.tf)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Variables
  describe('Variables', () => {
    const expectedVariables = [
      'primary_region',
      'secondary_region',
      'environment',
      'migration_phase',
      'domain_name',
      'app_name',
      'instance_type',
      'min_size',
      'max_size',
      'desired_capacity',
      'db_instance_class',
      'db_allocated_storage',
      'notification_email'
    ];

    expectedVariables.forEach(variable => {
      test(`should define variable "${variable}"`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variable}"`));
      });
    });
  });

  // Locals
  // Locals
describe('Locals', () => {
  test('should define local "suffix"', () => {
    expect(tfContent).toMatch(/suffix\s*=/);
  });

  test('should define local "common_tags"', () => {
    expect(tfContent).toMatch(/common_tags\s*=\s*{[\s\S]*Environment[\s\S]*ManagedBy[\s\S]*Application[\s\S]*MigrationPhase[\s\S]*}/);
  });

  test('should define local "us_tags"', () => {
    expect(tfContent).toMatch(/us_tags\s*=\s*merge\(local\.common_tags,\s*{[\s\S]*Region[\s\S]*}\)/);
  });

  test('should define local "eu_tags"', () => {
    expect(tfContent).toMatch(/eu_tags\s*=\s*merge\(local\.common_tags,\s*{[\s\S]*Region[\s\S]*}\)/);
  });

  test('should define local "us_vpc_cidr"', () => {
    expect(tfContent).toMatch(/us_vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test('should define local "eu_vpc_cidr"', () => {
    expect(tfContent).toMatch(/eu_vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/);
  });

  test('should define local "us_public_subnet_cidrs"', () => {
    expect(tfContent).toMatch(/us_public_subnet_cidrs\s*=\s*\["10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24"\]/);
  });

  test('should define local "us_private_subnet_cidrs"', () => {
    expect(tfContent).toMatch(/us_private_subnet_cidrs\s*=\s*\["10\.0\.10\.0\/24",\s*"10\.0\.11\.0\/24"\]/);
  });

  test('should define local "eu_public_subnet_cidrs"', () => {
    expect(tfContent).toMatch(/eu_public_subnet_cidrs\s*=\s*\["10\.1\.1\.0\/24",\s*"10\.1\.2\.0\/24"\]/);
  });

  test('should define local "eu_private_subnet_cidrs"', () => {
    expect(tfContent).toMatch(/eu_private_subnet_cidrs\s*=\s*\["10\.1\.10\.0\/24",\s*"10\.1\.11\.0\/24"\]/);
  });
});

  // Data sources
  describe('Data sources', () => {
    ['aws_availability_zones.us_east_1', 'aws_availability_zones.eu_central_1', 'aws_ami.amazon_linux_us', 'aws_ami.amazon_linux_eu'].forEach(dataSource => {
      test(`should define data source "${dataSource}"`, () => {
        const [type, name] = dataSource.split('.');
        expect(tfContent).toMatch(new RegExp(`data\\s+"${type}"\\s+"${name}"`));
      });
    });
  });

  // Resources
  describe('Resources', () => {
    // Random password resource
    test('should define random_password "rds_password"', () => {
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
    });

    // US region resources
    describe('US (us_east_1) resources', () => {
      const usResources = [
        ['aws_vpc', 'us_vpc'],
        ['aws_internet_gateway', 'us_igw'],
        ['aws_subnet', 'us_public'],
        ['aws_subnet', 'us_private'],
        ['aws_eip', 'us_nat'],
        ['aws_nat_gateway', 'us_nat'],
        ['aws_route_table', 'us_public'],
        ['aws_route_table', 'us_private'],
        ['aws_route_table_association', 'us_public'],
        ['aws_route_table_association', 'us_private'],
        ['aws_security_group', 'us_alb'],
        ['aws_security_group', 'us_ec2'],
        ['aws_security_group', 'us_rds'],
        ['aws_lb', 'us_alb'],
        ['aws_lb_target_group', 'us_tg'],
        ['aws_lb_listener', 'us_http'],
        ['aws_iam_role', 'ec2_role'],
        ['aws_iam_role_policy_attachment', 'ec2_ssm'],
        ['aws_iam_role_policy_attachment', 'ec2_cloudwatch'],
        ['aws_iam_instance_profile', 'ec2_profile'],
        ['aws_launch_template', 'us_lt'],
        ['aws_autoscaling_group', 'us_asg'],
        ['aws_db_subnet_group', 'us_db_subnet'],
        ['aws_db_instance', 'us_primary'],
        ['aws_s3_bucket', 'us_bucket'],
        ['aws_s3_bucket_versioning', 'us_versioning'],
        ['aws_iam_role', 's3_replication_role'],
        ['aws_iam_role_policy', 's3_replication_policy'],
        ['aws_s3_bucket_replication_configuration', 'us_to_eu'],
        ['aws_route53_zone', 'main'],
        ['aws_route53_health_check', 'us_alb_health'],
        ['aws_route53_record', 'us_weighted'],
        ['aws_sns_topic', 'us_alerts'],
        ['aws_sns_topic_subscription', 'us_email'],
        ['aws_cloudwatch_metric_alarm', 'us_ec2_cpu_high'],
        ['aws_cloudwatch_metric_alarm', 'us_rds_cpu'],
        ['aws_cloudwatch_metric_alarm', 'us_alb_unhealthy_hosts']
      ];

      usResources.forEach(([type, name]) => {
        test(`should define resource "${type}" "${name}"`, () => {
          expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
        });
      });
    });

    // EU region resources
    describe('EU (eu_central_1) resources', () => {
      const euResources = [
        ['aws_vpc', 'eu_vpc'],
        ['aws_internet_gateway', 'eu_igw'],
        ['aws_subnet', 'eu_public'],
        ['aws_subnet', 'eu_private'],
        ['aws_eip', 'eu_nat'],
        ['aws_nat_gateway', 'eu_nat'],
        ['aws_route_table', 'eu_public'],
        ['aws_route_table', 'eu_private'],
        ['aws_route_table_association', 'eu_public'],
        ['aws_route_table_association', 'eu_private'],
        ['aws_security_group', 'eu_alb'],
        ['aws_security_group', 'eu_ec2'],
        ['aws_security_group', 'eu_rds'],
        ['aws_lb', 'eu_alb'],
        ['aws_lb_target_group', 'eu_tg'],
        ['aws_lb_listener', 'eu_http'],
        ['aws_launch_template', 'eu_lt'],
        ['aws_autoscaling_group', 'eu_asg'],
        ['aws_db_subnet_group', 'eu_db_subnet'],
        ['aws_db_instance', 'eu_replica'],
        ['aws_s3_bucket', 'eu_bucket'],
        ['aws_s3_bucket_versioning', 'eu_versioning'],
        ['aws_route53_health_check', 'eu_alb_health'],
        ['aws_route53_record', 'eu_weighted'],
        ['aws_sns_topic', 'eu_alerts'],
        ['aws_sns_topic_subscription', 'eu_email'],
        ['aws_cloudwatch_metric_alarm', 'eu_ec2_cpu_high'],
        ['aws_cloudwatch_metric_alarm', 'eu_rds_lag'],
        ['aws_cloudwatch_metric_alarm', 'eu_alb_unhealthy_hosts']
      ];

      euResources.forEach(([type, name]) => {
        test(`should define resource "${type}" "${name}"`, () => {
          expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
        });
      });
    });

    // VPC peering resources
    describe('VPC Peering', () => {
      ['aws_vpc_peering_connection.us_to_eu', 'aws_vpc_peering_connection_accepter.eu_accept', 'aws_route.us_to_eu_public', 'aws_route.us_to_eu_private', 'aws_route.eu_to_us_public', 'aws_route.eu_to_us_private'].forEach(resource => {
        test(`should define VPC peering resource "${resource}"`, () => {
          const [type, name] = resource.split('.');
          expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
        });
      });
    });

    // CloudFront distribution
    describe('CloudFront', () => {
      ['aws_cloudfront_origin_access_identity.oai', 'aws_cloudfront_distribution.cdn'].forEach(resource => {
        test(`should define CloudFront resource "${resource}"`, () => {
          const [type, name] = resource.split('.');
          expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
        });
      });
    });
  });

  // Outputs
  describe('Outputs', () => {
    const expectedOutputs = [
      'us_vpc_id',
      'eu_vpc_id',
      'us_vpc_cidr',
      'eu_vpc_cidr',
      'us_public_subnet_ids',
      'us_private_subnet_ids',
      'eu_public_subnet_ids',
      'eu_private_subnet_ids',
      'us_nat_gateway_ids',
      'eu_nat_gateway_ids',
      'vpc_peering_connection_id',
      'us_alb_dns',
      'us_alb_arn',
      'eu_alb_dns',
      'eu_alb_arn',
      'us_target_group_arn',
      'eu_target_group_arn',
      'us_asg_name',
      'eu_asg_name',
      'us_rds_endpoint',
      'us_rds_arn',
      'us_s3_bucket_name',
      'us_s3_bucket_arn',
      'eu_s3_bucket_name',
      'eu_s3_bucket_arn',
      'cloudfront_distribution_id',
      'cloudfront_domain_name',
      'route53_zone_id',
      'route53_name_servers',
      'us_sns_topic_arn',
      'eu_sns_topic_arn',
      'us_alb_sg_id',
      'us_ec2_sg_id',
      'us_rds_sg_id',
      'eu_alb_sg_id',
      'eu_ec2_sg_id',
      'eu_rds_sg_id',
      'us_health_check_id',
      'eu_health_check_id',
      'us_launch_template_id',
      'eu_launch_template_id',
      'ec2_role_arn',
      's3_replication_role_arn',
      'aws_primary_region',
      'aws_secondary_region'
    ];

    expectedOutputs.forEach(output => {
      test(`should define output "${output}"`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

