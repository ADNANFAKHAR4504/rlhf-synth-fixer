import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf'); // Adjust path as needed
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
        'aws_region',
        'environment',
        'project_name'
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
        'suffix',
        'common_tags',
        'vpc_name',
        'igw_name',
        'nat_name_prefix',
        'public_subnet_prefix',
        'private_subnet_prefix',
        'public_rt_name',
        'private_rt_prefix',
        'sg_web_name',
        'sg_rds_name',
        'sg_ec2_name',
        'rds_instance_name',
        'rds_replica_name',
        's3_bucket_name',
        'ec2_instance_prefix',
        'kms_key_alias',
        'iam_role_ec2_name',
        'iam_policy_s3_name',
        'waf_web_acl_name',
        'vpc_cidr',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'blocked_ip_ranges'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('common_tags contains all standard tag keys', () => {
      ['Project', 'Environment', 'ManagedBy', 'Region'].forEach(t =>
        expect(tfContent).toMatch(new RegExp(`${t}\\s*=`))
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
  // Network ACLs
  // -------------------------
  describe('Network ACLs', () => {
    test('Network ACL and associations exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_network_acl"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_network_acl_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_network_acl_association"\s+"private"/);
    });

    test('Network ACL blocks expected CIDR ranges', () => {
      expect(tfContent).toMatch(/action\s*=\s*"deny"/); // At least one deny rule
    });

    test('Network ACL allows HTTP, HTTPS, and ephemeral ports', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
      expect(tfContent).toMatch(/from_port\s*=\s*1024/);
      expect(tfContent).toMatch(/to_port\s*=\s*65535/);
    });
  });

  // -------------------------
  // Security Groups
  // -------------------------
  describe('Security Groups', () => {
    ['web', 'rds', 'ec2'].forEach(sg =>
      test(`${sg} security group defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`));
      })
    );

    test('Security groups define correct ingress for web and EC2', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*80/);  // HTTP
      expect(tfContent).toMatch(/from_port\s*=\s*443/); // HTTPS
    });

    test('RDS security group allows MySQL inbound from EC2', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=.*aws_security_group\.ec2\.id/);
    });
  });

  // -------------------------
  // RDS Database
  // -------------------------
  describe('RDS Database', () => {
    test('DB subnet group and RDS instance(s) defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"read_replica"/);
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
  // Secrets Manager & SSM Parameters
  // -------------------------
  describe('Secrets Manager & SSM Parameters', () => {
    test('Secrets Manager secrets and version are defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds"/);
    });

    test('SSM parameters for RDS username and password exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"rds_username"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"rds_password"/);
    });
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    ['main', 'config', 'cloudtrail'].forEach(bucket =>
      test(`S3 bucket "${bucket}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`));
      })
    );
    ['main', 'config', 'cloudtrail'].forEach(bucket =>
      test(`S3 public access block for "${bucket}"`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${bucket}"`));
      })
    );
    test('S3 bucket encryption and versioning for main bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
    });
  });

  // -------------------------
  // IAM Roles and Policies
  // -------------------------
  describe('IAM Roles and Policies', () => {
    test('EC2 IAM Role, S3 access policy, MFA policy defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_enforcement"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test('Config IAM Role and its policy defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
    });
  });

  // -------------------------
  // EC2 Instances
  // -------------------------
  describe('EC2 Instances', () => {
    test('Web EC2 instances exist with block device encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_instance"\s+"web"/);
      expect(tfContent).toMatch(/encrypted\s*=\s*true/);
    });
    test('EC2 instances use proper IAM profile', () => {
      expect(tfContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2\.name/);
    });
  });

  // -------------------------
  // WAF
  // -------------------------
  describe('WAF Web ACL', () => {
    test('WAF web ACL is created and rules defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(tfContent).toMatch(/rule\s*{/);
      expect(tfContent).toMatch(/RateLimitRule/);
      expect(tfContent).toMatch(/SQLInjectionProtection/);
      expect(tfContent).toMatch(/XSSProtection/);
    });
  });

  // -------------------------
  // CloudWatch Alarms
  // -------------------------
  describe('CloudWatch Alarms', () => {
    test('CloudWatch alarms created for security and RDS metrics', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_console_login"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
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

    test('Required tags and encrypted volumes config rules exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"required_tags"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"encrypted_volumes"/);
    });
  });

  // -------------------------
  // AWS Shield
  // -------------------------
  describe('AWS Shield', () => {
    test('Shield protection created for EC2 instances', () => {
      expect(tfContent).toMatch(/resource\s+"aws_shield_protection"\s+"ec2"/);
    });
  });

  // -------------------------
  // CloudTrail
  // -------------------------
  describe('CloudTrail Resources', () => {
    test('CloudTrail main resource and S3 bucket policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    });
    test('CloudTrail references S3 bucket', () => {
      expect(tfContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
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
      's3_bucket_arn', 'ec2_instance_ids', 'ec2_private_ips',
      'iam_role_ec2_arn', 'iam_role_ec2_name', 'kms_key_id', 'kms_key_arn',
      'security_group_web_id', 'security_group_rds_id', 'security_group_ec2_id',
      'waf_web_acl_id', 'waf_web_acl_arn', 'sns_topic_arn',
      'config_recorder_name', 'cloudtrail_name', 'secrets_manager_secret_id',
      'ssm_parameter_username_name', 'ssm_parameter_password_name',
      'config_s3_bucket_name', 'cloudtrail_s3_bucket_name', 'network_acl_id',
      'resource_suffix', 'region'
    ];
    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });

});
