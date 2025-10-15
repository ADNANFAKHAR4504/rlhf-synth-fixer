import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Helper
  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'region',
        'project_name',
        'environment',
        'vpc_cidr',
        'db_instance_class',
        'ec2_instance_type',
        'min_size',
        'max_size',
        'desired_capacity'
      ];
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    test('defines all expected locals', () => {
      const expectedLocals = [
        'common_tags',
        'resource_prefix',
        'unique_suffix',
        'vpc_name',
        'igw_name',
        'nat_name_prefix',
        'public_subnet_prefix',
        'private_subnet_prefix',
        'public_rt_name',
        'private_rt_prefix',
        'rds_name',
        's3_bucket_name',
        'lambda_function_name',
        'cloudtrail_name',
        'cloudfront_name',
        'waf_name',
        'config_name',
        'kms_alias',
        'sns_topic_name',
        'asg_name',
        'launch_template_name',
        'db_master_username',
        'db_master_password'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('common_tags contains all standard tag keys', () => {
      ['Project', 'Environment', 'ManagedBy'].forEach(t =>
        expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
      );
    });

  });


  // -------------------------
  // KMS Resources
  // -------------------------
  describe('KMS Resources', () => {
    test('KMS key and alias are present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test('KMS key has rotation enabled', () => {
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  // -------------------------
  // Networking Resources
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC, Internet Gateway, subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('NAT Gateway(s), EIP(s) configured and depend on IGW', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Route tables and associations exist for subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // -------------------------
  // Security Groups
  // -------------------------
  describe('Security Groups', () => {
    ['rds', 'ec2', 'alb', 'lambda'].forEach(sg =>
      test(`${sg} security group defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`));
      })
    );
    test('RDS security group allows MySQL/Aurora inbound from EC2/Lambda', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=.*(aws_security_group\.ec2\.id|aws_security_group\.lambda\.id)/);
    });
  });

  // -------------------------
  // RDS Database
  // -------------------------
  describe('RDS Database', () => {
    test('DB subnet group and RDS instance(s) defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test('RDS is MySQL, multi-AZ, with backup and encryption', () => {
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    [
      'main',
      'logs',
      'cloudtrail',
      'config'
    ].forEach(bucket =>
      test(`S3 bucket "${bucket}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`));
      })
    );
    [
      'main',
      'logs',
      'cloudtrail',
      'config'
    ].forEach(bucket =>
      test(`S3 public access block for "${bucket}"`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${bucket}"`));
      })
    );
    [
      'main',
      'logs',
      'cloudtrail',
      'config'
    ].forEach(bucket =>
      test(`S3 bucket encryption for "${bucket}"`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${bucket}"`));
      })
    );
    test('S3 bucket versioning for main bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
    });
  });

  // -------------------------
  // CloudFront, WAF, and ALB
  // -------------------------
  describe('CloudFront, WAF, and ALB', () => {
    test('CloudFront distribution references OAI and S3 bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudfront_distribution"/);
      expect(tfContent).toMatch(/origin_access_identity/);
    });

    test('WAF web ACL is created and attached', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(tfContent).toMatch(/web_acl_id\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });

    test('Application Load Balancer and listener exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    });
    test('ALB Target Group exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });
  });

  // -------------------------
  // Auto Scaling
  // -------------------------
  describe('Auto Scaling Group and Policies', () => {
    test('Auto Scaling group and launch template exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    });
  });

  // -------------------------
  // AWS Config
  // -------------------------
  describe('AWS Config Resources', () => {
    test('Config delivery channel, recorder, recorder status present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });

    test('Recorder depends on delivery channel', () => {
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel\.main\]/);
    });
  });

  // -------------------------
  // CloudTrail
  // -------------------------
  describe('CloudTrail Resources', () => {
    test('CloudTrail main resource and bucket policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    });
    test('CloudTrail references S3 bucket and KMS key', () => {
      expect(tfContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });


  // -------------------------
  // SNS Topics
  // -------------------------
  describe('SNS Topics', () => {
    test('SNS Topic for alerts and subscription defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
    });
  });


  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs: string[] = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'nat_gateway_ids', 'internet_gateway_id', 'rds_endpoint',
      'rds_read_replica_endpoint', 'rds_instance_id', 's3_bucket_name',
      's3_bucket_arn', 'lambda_function_name', 'lambda_function_arn',
      'cloudfront_distribution_id', 'cloudfront_domain_name', 'alb_dns_name',
      'alb_arn', 'autoscaling_group_name', 'autoscaling_group_arn', 'sns_topic_arn',
      'kms_key_id', 'kms_key_arn', 'cloudtrail_name', 'cloudtrail_arn',
      'config_recorder_name', 'waf_web_acl_id', 'waf_web_acl_arn', 'ec2_iam_role_arn',
      'lambda_iam_role_arn', 'ami_id', 'launch_template_id', 'secrets_manager_secret_arn',
      'parameter_store_db_username', 'parameter_store_db_password',
      'security_group_rds_id', 'security_group_ec2_id', 'security_group_alb_id', 'security_group_lambda_id'
    ];
    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

