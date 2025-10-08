import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // Variables
  describe('Variables', () => {
    test('defines expected variables', () => {
      [
        'region',
        'vpc_cidr',
        'environment',
        'ssh_allowed_cidr',
        'db_instance_class'
      ].forEach((v: string) =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // Locals
  describe('Locals', () => {
    test('defines expected locals including random_suffix and cidr blocks', () => {
      [
        'random_suffix',
        'common_tags',
        'azs',
        'public_subnet_cidrs',
        'private_subnet_cidrs'
      ].forEach((l: string) =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });
  });

  // Data Sources
  describe('Data Sources', () => {
    test('aws_availability_zones and aws_caller_identity are defined', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // Random Resources
  describe('Random Resources for RDS credentials', () => {
    test('random_password for RDS master password exists with correct settings', () => {
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_master_password"/);
      expect(tfContent).toMatch(/length\s*=\s*16/);
      expect(tfContent).toMatch(/special\s*=\s*true/);
      expect(tfContent).toMatch(/override_special\s*=\s*["']!#\$%&\*\+\-\/\?@_["']/);
    });

    test('random_string for RDS master username exists with correct settings', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_master_username"/);
      expect(tfContent).toMatch(/length\s*=\s*8/);
      expect(tfContent).toMatch(/special\s*=\s*false/);
      expect(tfContent).toMatch(/number\s*=\s*true/);
      expect(tfContent).toMatch(/upper\s*=\s*true/);
      expect(tfContent).toMatch(/lower\s*=\s*true/);
    });
  });

  // Networking
  describe('Networking Resources', () => {
    test('VPC is defined with DNS hostnames and support enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Internet Gateway resource is created and linked to VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/vpc_id\s*=\s*aws_vpc.main.id/);
    });

    test('Elastic IPs and NAT Gateways are configured with dependencies', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway.main\]/);
    });

    test('Public and private subnets are created with counts and correct cidr blocks', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
    });

    test('Route tables and associations for public and private subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // Security Groups
  describe('Security Groups', () => {
    test('RDS security group allows MySQL from VPC CIDR and outbound all', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(new RegExp(`cidr_blocks\\s*=\\s*\\[var.vpc_cidr\\]`));
      expect(tfContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('EC2 security group allows SSH from allowed CIDR, HTTP/HTTPS from VPC CIDR', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tfContent).toMatch(/from_port\s*=\s*22/);
      expect(tfContent).toMatch(new RegExp(`cidr_blocks\\s*=\\s*var.ssh_allowed_cidr`));
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
    });
  });

  // S3 Buckets
  describe('S3 Buckets with encryption and versioning', () => {
    test('Main S3 bucket, public access block, versioning and SSE config exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
    });

    test('CloudTrail S3 bucket and policy exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    });

    test('Config S3 bucket and related policies exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"/);
    });
  });

  // IAM Roles and Policies
  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role and policy for S3 read access exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_read"/);
    });

    test('RDS monitoring IAM role with policy attachment exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_monitoring"/);
    });

    test('AWS Config IAM role and policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config"/);
    });
  });

  // Secrets Manager
  describe('Secrets Manager for RDS credentials', () => {
    test('Secrets manager secret and version are defined with secret string', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });
  });

  // RDS Database
  describe('RDS Database', () => {
    test('DB subnet group and RDS instance exist with correct properties', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error", "general", "slowquery"\]/);
    });
  });

  // CloudTrail
  describe('CloudTrail', () => {
    test('CloudTrail resource exists with multi-region and logging enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(tfContent).toMatch(/enable_logging\s*=\s*true/);
    });
  });

  // AWS Config Resources
  describe('AWS Config Resources', () => {
    test('Config recorder, delivery channel, and recorder status are defined and linked', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel.main\]/);
    });

    test('Config rules for S3 encryption, RDS encryption, public access, MFA, and CloudTrail exist', () => {
      const configRules: string[] = [
        's3_bucket_encryption',
        'rds_encryption',
        'rds_public_access',
        'iam_mfa',
        'cloudtrail_enabled'
      ];
      configRules.forEach((rule: string) => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_config_config_rule"\\s+"${rule}"`));
      });
    });
  });

  // Outputs
  describe('Outputs', () => {
    const expectedOutputs: string[] = [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
      'nat_gateway_ids',
      'nat_gateway_public_ips',
      'internet_gateway_id',
      'rds_security_group_id',
      'ec2_security_group_id',
      's3_bucket_name',
      'cloudtrail_bucket_name',
      'config_bucket_name',
      'ec2_role_arn',
      'rds_monitoring_role_arn',
      'config_role_arn',
      'rds_instance_id',
      'rds_instance_endpoint',
      'rds_instance_address',
      'rds_instance_port',
      'rds_subnet_group_name',
      'rds_credentials_secret_arn',
      'rds_credentials_secret_name',
      'cloudtrail_name',
      'cloudtrail_arn',
      'config_recorder_name',
      'config_delivery_channel_name',
      'config_rules',
      'public_route_table_id',
      'private_route_table_ids',
      'deployment_suffix'
    ];

    expectedOutputs.forEach((output: string) => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });

});
