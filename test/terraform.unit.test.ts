// test/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'region',
        'environment',
        'project_name',
        'alert_email'
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
    test('defines expected locals', () => {
      const expectedLocals = [
        'random_suffix',
        'common_tags',
        'azs',
        'vpc_cidr',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'rds_special_chars'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('common_tags local contains all required keys', () => {
      expect(tfContent).toMatch(/Environment\s*=\s*var.environment/);
      expect(tfContent).toMatch(/Project\s*=\s*var.project_name/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(tfContent).toMatch(/Region\s*=\s*var.region/);
    });

    test('azs local slices first 3 availability zones', () => {
      expect(tfContent).toMatch(/slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*3\)/);
    });

    test('vpc_cidr and subnet CIDRs are defined correctly', () => {
      expect(tfContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
      expect(tfContent).toMatch(/\["10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24",\s*"10\.0\.3\.0\/24"\]/);
      expect(tfContent).toMatch(/\["10\.0\.11\.0\/24",\s*"10\.0\.12\.0\/24",\s*"10\.0\.13\.0\/24"\]/);
    });

    test('rds_special_chars local is defined', () => {
      expect(tfContent).toMatch(/rds_special_chars\s*=\s*["']!#\$%\^&\*\(\)-_=+\[\]\{\}:?["']/);
    });
  });

  // -------------------------
  // Data Sources
  // -------------------------
  describe('Data Sources', () => {
    test('aws_availability_zones and aws_caller_identity are defined', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // -------------------------
  // Random Resources
  // -------------------------
  describe('Random Resources', () => {
    test('random_string suffix exists for resource naming', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
      expect(tfContent).toMatch(/length\s*=\s*6/);
      expect(tfContent).toMatch(/upper\s*=\s*false/);
      expect(tfContent).toMatch(/lower\s*=\s*true/);
      expect(tfContent).toMatch(/number\s*=\s*true/);
    });
  });

  // -------------------------
  // Networking
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC is defined with DNS hostnames and support enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Internet Gateway exists and linked to VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/vpc_id\s*=\s*aws_vpc.main.id/);
    });

    test('Elastic IPs and NAT Gateways are configured', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway.main\]/);
    });

    test('Public and private subnets exist with correct counts', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/count\s*=\s*3/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tfContent).toMatch(/count\s*=\s*3/);
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
    test('EC2 security group allows SSH, HTTP, HTTPS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tfContent).toMatch(/from_port\s*=\s*22/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*var.ssh_allowed_cidr/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
    });

    test('RDS security group allows MySQL from VPC CIDR', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*\[var.vpc_cidr\]/);
      expect(tfContent).toMatch(/protocol\s*=\s*"tcp"/);
    });
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    test('Main S3 bucket with public access block, versioning, encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test('CloudTrail and Config buckets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"/);
    });
  });

  // -------------------------
  // IAM Roles and Policies
  // -------------------------
  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role and policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_read"/);
    });

    test('RDS monitoring IAM role exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_monitoring"/);
    });

    test('Config IAM role and policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config"/);
    });
  });

  // -------------------------
  // Secrets Manager
  // -------------------------
  describe('Secrets Manager for RDS credentials', () => {
    test('Secrets manager secret and version exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });
  });

  // -------------------------
  // RDS Database
  // -------------------------
  describe('RDS Database', () => {
    test('DB subnet group and RDS instance exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error", "general", "slowquery"\]/);
    });
  });

  // -------------------------
  // CloudTrail
  // -------------------------
  describe('CloudTrail', () => {
    test('CloudTrail exists with multi-region logging', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(tfContent).toMatch(/enable_logging\s*=\s*true/);
    });
  });

  // -------------------------
  // AWS Config
  // -------------------------
  describe('AWS Config Resources', () => {
    test('Config recorder, delivery channel, and status exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel.main\]/);
    });

    test('Config rules exist for S3, RDS, MFA, CloudTrail', () => {
      const configRules: string[] = [
        's3_bucket_encryption',
        'rds_encryption',
        'rds_public_access',
        'iam_mfa',
        'cloudtrail_enabled'
      ];
      configRules.forEach(rule => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_config_config_rule"\\s+"${rule}"`));
      });
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
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
    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
