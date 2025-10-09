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
        'projectname'
      ];
      expectedVars.forEach(v => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`));
      });
    });
  });

  // ================= Locals =================
  describe('Locals', () => {
    test('defines expected locals for CIDR, tags, AZs, random suffix', () => {
      [
        'random_suffix',
        'common_tags',
        'vpc_cidr',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'availability_zones',
        'rds_special_chars'
      ].forEach(localName => {
        expect(tfContent).toMatch(new RegExp(`${localName}\\s*=`));
      });
    });
  });

  // ================= Data Sources =================
  describe('Data Sources', () => {
    test('has availability zones, AMI, and caller identity data sources', () => {
      [
        /data\s+"aws_availability_zones"\s+"available"/,
        /data\s+"aws_ami"\s+"amazon_linux_2"/,
        /data\s+"aws_caller_identity"\s+"current"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
  });

  // ================= Networking Resources =================
  describe('Networking', () => {
    test('defines VPC, subnets, internet gateway, NAT gateway, route tables and associations', () => {
      [
        /resource\s+"aws_vpc"\s+"main"/,
        /resource\s+"aws_internet_gateway"\s+"main"/,
        /resource\s+"aws_eip"\s+"nat"/,
        /resource\s+"aws_nat_gateway"\s+"main"/,
        /resource\s+"aws_subnet"\s+"public"/,
        /resource\s+"aws_subnet"\s+"private"/,
        /resource\s+"aws_route_table"\s+"public"/,
        /resource\s+"aws_route_table"\s+"private"/,
        /resource\s+"aws_route_table_association"\s+"public"/,
        /resource\s+"aws_route_table_association"\s+"private"/,
        /resource\s+"aws_vpc_peering_connection"\s+"peer"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
    test('defines network ACL with rules', () => {
      expect(tfContent).toMatch(/resource\s+"aws_network_acl"\s+"main"/);
    });
  });

  // ================= Security Groups =================
  describe('Security Groups', () => {
    test('has security groups for EC2, RDS, and ALB', () => {
      [
        /resource\s+"aws_security_group"\s+"ec2"/,
        /resource\s+"aws_security_group"\s+"rds"/,
        /resource\s+"aws_security_group"\s+"alb"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
  });

  // ================= IAM Resources =================
  describe('IAM Roles, Policies, Profiles', () => {
    test('defines roles, policies, instance profiles for EC2, FlowLogs, CloudTrail, Config', () => {
      [
        /resource\s+"aws_iam_role"\s+"ec2"/,
        /resource\s+"aws_iam_role_policy"\s+"ec2_least_privilege"/,
        /resource\s+"aws_iam_instance_profile"\s+"ec2"/,
        /resource\s+"aws_iam_role"\s+"flowlogs"/,
        /resource\s+"aws_iam_role_policy"\s+"flowlogs"/,
        /resource\s+"aws_iam_role"\s+"cloudtrail"/,
        /resource\s+"aws_iam_role"\s+"config"/,
        /resource\s+"aws_iam_role_policy_attachment"\s+"config"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
  });

  // ================= S3 Buckets and Related =================
  describe('S3 Buckets', () => {
    test('main, CloudTrail, Config buckets and policies exist', () => {
      [
        /resource\s+"aws_s3_bucket"\s+"main"/,
        /resource\s+"aws_s3_bucket"\s+"cloudtrail"/,
        /resource\s+"aws_s3_bucket"\s+"config"/,
        /resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/,
        /resource\s+"aws_s3_bucket_policy"\s+"config"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
    test('bucket versioning, encryption, public access block', () => {
      [
        /resource\s+"aws_s3_bucket_versioning"/,
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/,
        /resource\s+"aws_s3_bucket_public_access_block"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
  });

  // ================= Secrets Manager =================
  describe('Secrets Manager', () => {
    test('defines secret and secret version for RDS credentials', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds"/);
      expect(tfContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });
  });

  // ================= RDS Resources =================
  describe('RDS Resources', () => {
    test('DB Instance and subnet group exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });
    test('RDS config: engine, multi-AZ, backup, encryption', () => {
      [
        /engine\s*=\s*"mysql"/,
        /multi_az\s*=\s*true/,
        /backup_retention_period\s*=\s*\d+/,
        /storage_encrypted\s*=\s*true/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
  });

  // ================= EC2 Resources =================
  describe('EC2 Instance', () => {
    test('EC2 instance configuration', () => {
      [
        /resource\s+"aws_instance"\s+"web"/,
        /ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/,
        /instance_type\s*=\s*".+"/,
        /subnet_id\s*=\s*aws_subnet\.private\[0\]\.id/,
        /vpc_security_group_ids\s*=\s*\[aws_security_group\.web\.id\]/,
        /iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2\.name/,
        /volume_type\s*=\s*"gp3"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
  });

  // ================= Load Balancer =================
  describe('Load Balancer', () => {
    test('defines ALB, listener, target group, logs', () => {
      [
        /resource\s+"aws_lb"\s+"main"/,
        /resource\s+"aws_lb_listener"\s+"main"/,
        /resource\s+"aws_lb_target_group"\s+"main"/,
        /access_logs\s*{/,
        /enabled_drop_invalid_header_fields\s*=\s*true/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
    test('WAF association for ALB exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
    });
  });

  // ================= CloudTrail & Config =================
  describe('CloudTrail', () => {
    test('has CloudTrail resource and logging S3 bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/enable_logging\s*=/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.cloudtrail\]/);
    });
  });

  describe('AWS Config', () => {
    test('Config recorder, delivery channel, status, rule', () => {
      [
        /resource\s+"aws_config_configuration_recorder"\s+"main"/,
        /resource\s+"aws_config_delivery_channel"\s+"main"/,
        /resource\s+"aws_config_configuration_recorder_status"\s+"main"/,
        /resource\s+"aws_config_config_rule"\s+"required_tags"/
      ].forEach(regexp => {
        expect(tfContent).toMatch(regexp);
      });
    });
  });

  // ================= Outputs =================
  describe('Terraform Outputs', () => {
    const outputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'internet_gateway_id', 'nat_gateway_ids', 'elastic_ip_addresses',
      's3_bucket_id', 's3_bucket_arn', 'cloudtrail_s3_bucket_id', 'config_s3_bucket_id',
      'web_security_group_id', 'rds_security_group_id', 'ec2_iam_role_arn', 'ec2_instance_profile_name',
      'config_iam_role_arn', 'rds_instance_id', 'rds_instance_endpoint', 'rds_instance_address',
      'rds_instance_port', 'db_subnet_group_name', 'rds_credentials_secret_arn', 'rds_credentials_secret_name',
      'ec2_instance_id', 'ec2_instance_private_ip', 'ec2_instance_availability_zone', 'ami_id', 'ami_name',
      'cloudtrail_name', 'cloudtrail_arn', 'vpc_peering_connection_id', 'config_recorder_name',
      'config_delivery_channel_name', 'config_rule_name', 'public_route_table_id', 'private_route_table_ids',
      'account_id', 'region', 'random_suffix'
    ];
    outputs.forEach(output => {
      test(`output "${output}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
