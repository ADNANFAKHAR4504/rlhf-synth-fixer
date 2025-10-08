import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // ================= Variables =================
  describe('Variables', () => {
    test('defines expected variables', () => {
      const expectedVars = [
        'region',
        'environment',
        'project'
      ];
      expectedVars.forEach(v => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`));
      });
    });
  });

  // ================= Locals =================
  describe('Locals', () => {
    test('defines expected locals including random_suffix and CIDR blocks', () => {
      ['random_suffix', 'common_tags', 'vpc_cidr', 'public_subnet_cidrs', 'private_subnet_cidrs', 'availability_zones', 'rds_special_chars'].forEach(localVar => {
        expect(tfContent).toMatch(new RegExp(`${localVar}\\s*=`));
      });
    });
  });

  // ================= Data Sources =================
  describe('Data Sources', () => {
    test('defines aws_availability_zones, aws_ami, and aws_caller_identity', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // ================= Random Resources =================
  describe('Random Resources for naming and RDS credentials', () => {
    test('random_string suffix exists with correct settings', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
      expect(tfContent).toMatch(/length\s*=\s*4/);
      expect(tfContent).toMatch(/special\s*=\s*false/);
      expect(tfContent).toMatch(/upper\s*=\s*false/);
    });

    test('random_string for rds_username exists with correct settings', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username"/);
      expect(tfContent).toMatch(/length\s*=\s*7/);
      expect(tfContent).toMatch(/special\s*=\s*false/);
      expect(tfContent).toMatch(/lower\s*=\s*true/);
      expect(tfContent).toMatch(/numeric\s*=\s*true/);
    });

    test('random_password for rds_password exists with correct override_special', () => {
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
      expect(tfContent).toMatch(/length\s*=\s*16/);
      expect(tfContent).toMatch(/special\s*=\s*true/);
      expect(tfContent).toMatch(new RegExp(/override_special\s*=\s*local\.rds_special_chars/));
    });
  });

  // ================= VPC and Networking =================
  describe('VPC and Networking Resources', () => {
    test('VPC is defined with DNS hostnames and support enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Internet Gateway exists and linked to VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('Elastic IPs and NAT Gateways configured with dependencies', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway.main\]/);
    });

    test('Public and Private subnets created with counts and correct CIDRs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
      expect(tfContent).toMatch(/cidr_block\s*=\s*local\.public_subnet_cidrs\[count\.index\]/);
      expect(tfContent).toMatch(/cidr_block\s*=\s*local\.private_subnet_cidrs\[count\.index\]/);
    });

    test('Route tables and route table associations for public and private exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test('VPC Peering connection exists for future use', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"peer"/);
    });
  });

  // ================= Security Groups =================
  describe('Security Groups', () => {
    test('Web security group allows HTTP and HTTPS ingress from VPC and all egress', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*\[local\.vpc_cidr\]/);
      expect(tfContent).toMatch(/egress\s*{[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });

    test('RDS security group allows MySQL ingress from web security group and all egress', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group.web.id\]/);
      expect(tfContent).toMatch(/egress\s*{[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });
  });

  // ================= S3 Buckets =================
  describe('S3 Buckets and related resources', () => {
    test('Main S3 bucket with versioning, encryption and public access block exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
    });

    test('CloudTrail S3 bucket and corresponding bucket policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    });

    test('Config S3 bucket and corresponding bucket policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"/);
    });
  });

  // ================= IAM Roles and Policies =================
  describe('IAM Roles, policies and instance profiles', () => {
    test('EC2 IAM role and least privilege policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_least_privilege"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test('Config IAM role, policies and attachments exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config_s3"/);
    });
  });

  // ================= Secrets Manager =================
  describe('Secrets Manager storing RDS credentials', () => {
    test('Secrets Manager secret and version exist with JSON encoded secret string', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });
  });

  // ================= RDS =================
  describe('RDS Resources', () => {
    test('DB subnet group and multi-AZ RDS instance with correct settings exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error", "general", "slowquery"\]/);
    });
  });

  // ================= EC2 =================
  describe('EC2 Instance', () => {
    test('EC2 instance uses correct AMI, instance type, subnet, security group and instance profile', () => {
      expect(tfContent).toMatch(/resource\s+"aws_instance"\s+"web"/);
      expect(tfContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
      expect(tfContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(tfContent).toMatch(/subnet_id\s*=\s*aws_subnet.private\[0\].id/);
      expect(tfContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group.web.id\]/);
      expect(tfContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile.ec2.name/);
      expect(tfContent).toMatch(/root_block_device\s*{[\s\S]*volume_type\s*=\s*"gp3"[\s\S]*volume_size\s*=\s*8/);
    });
  });

  // ================= CloudTrail =================
  describe('CloudTrail', () => {
    test('CloudTrail resource with multi-region and logging enabled exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(tfContent).toMatch(/enable_logging\s*=\s*true/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy.cloudtrail\]/);
    });
  });

  // ================= AWS Config =================
  describe('AWS Config resources', () => {
    test('Config recorder, delivery channel, status, rule, IAM role, and policy exist and linked', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"required_tags"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config_s3"/);
    });
  });

  // ================= Outputs =================
  describe('Outputs', () => {
    const expectedOutputs = [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'internet_gateway_id',
      'nat_gateway_ids',
      'elastic_ip_addresses',
      's3_bucket_id',
      's3_bucket_arn',
      'cloudtrail_s3_bucket_id',
      'config_s3_bucket_id',
      'web_security_group_id',
      'rds_security_group_id',
      'ec2_iam_role_arn',
      'ec2_instance_profile_name',
      'config_iam_role_arn',
      'rds_instance_id',
      'rds_instance_endpoint',
      'rds_instance_address',
      'rds_instance_port',
      'db_subnet_group_name',
      'rds_credentials_secret_arn',
      'rds_credentials_secret_name',
      'ec2_instance_id',
      'ec2_instance_private_ip',
      'ec2_instance_availability_zone',
      'ami_id',
      'ami_name',
      'cloudtrail_name',
      'cloudtrail_arn',
      'vpc_peering_connection_id',
      'config_recorder_name',
      'config_delivery_channel_name',
      'config_rule_name',
      'public_route_table_id',
      'private_route_table_ids',
      'account_id',
      'region',
      'random_suffix'
    ];

    expectedOutputs.forEach(output => {
      test(`output "${output}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

